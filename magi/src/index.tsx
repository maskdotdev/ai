import { TextAttributes, SyntaxStyle } from "@opentui/core";
import { render, useKeyboard, useRenderer } from "@opentui/solid";
import { GoogleGenAI, type Chat, type Content } from "@google/genai";
import { GoogleAuth } from "google-auth-library";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  AuthType as GeminiAuthType,
  getAuthTypeFromEnv as getGeminiAuthTypeFromEnv,
  type ContentGenerator as GeminiContentGenerator,
} from "@google/gemini-cli-core/dist/src/core/contentGenerator.js";
import { createCodeAssistContentGenerator } from "@google/gemini-cli-core/dist/src/code_assist/codeAssist.js";
import { LlmRole } from "@google/gemini-cli-core/dist/src/telemetry/llmRole.js";
import type { Config as GeminiCoreConfig } from "@google/gemini-cli-core/dist/src/config/config.js";
import {
  CoreEvent,
  coreEvents,
  type ConsentRequestPayload,
  type UserFeedbackPayload,
} from "@google/gemini-cli-core/dist/src/utils/events.js";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";

// ─── Theme ──────────────────────────────────────────────────────────────────

const theme = {
  // Backgrounds
  bg: "#1a1b26",
  bgDark: "#16161e",
  bgLight: "#24283b",
  bgHighlight: "#292e42",

  // Borders
  border: "#414868",
  borderFocused: "#7aa2f7",
  borderAccent: "#bb9af7",

  // Text
  text: "#c0caf5",
  textDim: "#565f89",
  textMuted: "#3b4261",

  // Accents
  blue: "#7aa2f7",
  purple: "#bb9af7",
  cyan: "#7dcfff",
  green: "#9ece6a",
  yellow: "#e0af68",
  red: "#f7768e",
  orange: "#ff9e64",
  teal: "#73daca",

  // Role colors
  roleUser: "#9ece6a",
  roleAssistant: "#7aa2f7",
  roleSystem: "#e0af68",

  // Specific elements
  inputBg: "#1f2335",
  inputFocusBg: "#24283b",
  modalBg: "#1f2335",
  modalBorder: "#bb9af7",
};

// ─── Types ──────────────────────────────────────────────────────────────────

type MessageRole = "system" | "user" | "assistant";

interface TranscriptMessage {
  id: number;
  role: MessageRole;
  text: string;
  streaming?: boolean;
}

interface RuntimeClient {
  ai?: GoogleGenAI;
  modeLabel: string;
  authType: GeminiAuthType;
}

interface OauthProgressModal {
  message: string;
  url: string | null;
}

type PersistedAuthMode = "google" | "vertex" | "gemini" | "compute" | "auto";

interface PersistedState {
  model: string;
  authMode: PersistedAuthMode;
  systemInstruction: string;
  autoReconnect: boolean;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = process.env.GENAI_MODEL ?? "gemini-2.5-flash";
const syntaxStyle = SyntaxStyle.create();
const PERSISTED_STATE_PATH =
  process.env.MAGI_STATE_PATH ??
  join(
    process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"),
    "magi",
    "session.json",
  );

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatError(error: unknown): string {
  const decodeBytes = (value: Uint8Array): string =>
    new TextDecoder().decode(value).trim();

  const decodeByteString = (value: string): string | null => {
    let candidate = value.trim();
    if (candidate.startsWith("[") && candidate.endsWith("]")) {
      candidate = candidate.slice(1, -1).trim();
    }

    if (!/^\d+(,\d+)+$/.test(candidate)) return null;

    const bytes = candidate
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part));

    if (
      bytes.length < 4 ||
      bytes.some((part) => part < 0 || part > 255 || !Number.isInteger(part))
    ) {
      return null;
    }

    return decodeBytes(Uint8Array.from(bytes));
  };

  const messageFromPayload = (payload: unknown): string | null => {
    if (!payload || typeof payload !== "object") return null;

    if (Array.isArray(payload)) {
      for (const item of payload) {
        const nested = messageFromPayload(item);
        if (nested) return nested;
      }
      return null;
    }

    const value = payload as Record<string, unknown>;
    const directMessage = value.message;
    if (typeof directMessage === "string" && directMessage.trim()) {
      return directMessage.trim();
    }

    const nestedError = value.error;
    if (typeof nestedError === "string" && nestedError.trim()) {
      return nestedError.trim();
    }

    if (nestedError && typeof nestedError === "object") {
      const nested = nestedError as Record<string, unknown>;
      const nestedMessage = nested.message;
      const nestedStatus = nested.status;

      if (
        typeof nestedMessage === "string" &&
        nestedMessage.trim() &&
        typeof nestedStatus === "string" &&
        nestedStatus.trim()
      ) {
        return `${nestedMessage.trim()} (${nestedStatus.trim()})`;
      }

      if (typeof nestedMessage === "string" && nestedMessage.trim()) {
        return nestedMessage.trim();
      }
    }

    return null;
  };

  const parseStructuredText = (text: string): string | null => {
    const decoded = decodeByteString(text) ?? text.trim();

    try {
      const parsed = JSON.parse(decoded) as unknown;
      return messageFromPayload(parsed) ?? decoded;
    } catch {
      return decoded || null;
    }
  };

  const dataToText = (value: unknown): string | null => {
    if (value instanceof Uint8Array) return parseStructuredText(decodeBytes(value));
    if (value instanceof ArrayBuffer) {
      return parseStructuredText(decodeBytes(new Uint8Array(value)));
    }
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "number" && Number.isFinite(item))
    ) {
      return parseStructuredText(
        decodeBytes(Uint8Array.from(value as number[])),
      );
    }
    if (typeof value === "string") return parseStructuredText(value);
    return null;
  };

  if (error && typeof error === "object") {
    const maybeRecord = error as Record<string, unknown>;

    const responseData = (maybeRecord.response as Record<string, unknown> | undefined)
      ?.data;
    const decodedResponseData = dataToText(responseData);
    if (decodedResponseData) return decodedResponseData;

    const decodedData = dataToText(maybeRecord.data);
    if (decodedData) return decodedData;

    if (error instanceof Error) {
      const parsedMessage = parseStructuredText(error.message);
      if (parsedMessage) return parsedMessage;
      return error.message;
    }
  }

  if (typeof error === "string") {
    return parseStructuredText(error) ?? error;
  }

  return String(error);
}

function authTypeLabel(authType: GeminiAuthType): string {
  switch (authType) {
    case GeminiAuthType.LOGIN_WITH_GOOGLE:
      return "Login with Google";
    case GeminiAuthType.USE_GEMINI:
      return "Gemini API key";
    case GeminiAuthType.USE_VERTEX_AI:
      return "Vertex AI";
    case GeminiAuthType.COMPUTE_ADC:
      return "Compute ADC";
    case GeminiAuthType.LEGACY_CLOUD_SHELL:
      return "Cloud Shell";
  }
}

function getSelectedAuthType(): GeminiAuthType {
  return getGeminiAuthTypeFromEnv() ?? GeminiAuthType.LOGIN_WITH_GOOGLE;
}

function authTypeToPersistedMode(authType: GeminiAuthType | null): PersistedAuthMode {
  if (authType === null) return "auto";

  switch (authType) {
    case GeminiAuthType.LOGIN_WITH_GOOGLE:
      return "google";
    case GeminiAuthType.USE_GEMINI:
      return "gemini";
    case GeminiAuthType.USE_VERTEX_AI:
      return "vertex";
    case GeminiAuthType.COMPUTE_ADC:
      return "compute";
    case GeminiAuthType.LEGACY_CLOUD_SHELL:
      return "compute";
  }
}

function persistedModeToAuthType(mode: unknown): GeminiAuthType | null {
  switch (mode) {
    case "auto":
      return null;
    case "google":
      return GeminiAuthType.LOGIN_WITH_GOOGLE;
    case "vertex":
      return GeminiAuthType.USE_VERTEX_AI;
    case "gemini":
      return GeminiAuthType.USE_GEMINI;
    case "compute":
      return GeminiAuthType.COMPUTE_ADC;
    default:
      return GeminiAuthType.LOGIN_WITH_GOOGLE;
  }
}

function loadPersistedState(): PersistedState {
  try {
    const raw = readFileSync(PERSISTED_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const model =
      typeof parsed.model === "string" && parsed.model.trim()
        ? parsed.model.trim()
        : DEFAULT_MODEL;
    const authMode: PersistedAuthMode =
      parsed.authMode === "google" ||
      parsed.authMode === "vertex" ||
      parsed.authMode === "gemini" ||
      parsed.authMode === "compute" ||
      parsed.authMode === "auto"
        ? parsed.authMode
        : "google";
    const systemInstruction =
      typeof parsed.systemInstruction === "string" ? parsed.systemInstruction : "";
    const autoReconnect = parsed.autoReconnect === true;

    return {
      model,
      authMode,
      systemInstruction,
      autoReconnect,
    };
  } catch {
    return {
      model: DEFAULT_MODEL,
      authMode: "google",
      systemInstruction: "",
      autoReconnect: false,
    };
  }
}

function persistState(state: PersistedState): void {
  try {
    mkdirSync(dirname(PERSISTED_STATE_PATH), { recursive: true });
    writeFileSync(PERSISTED_STATE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore persistence errors so chat behavior remains unaffected.
  }
}

function shouldUseBrowserOAuth(): boolean {
  if (process.env.NO_BROWSER === "true") return false;
  return process.env.GOOGLE_LOGIN_USE_BROWSER !== "false";
}

function ensureWindowFetchBridge(): void {
  const maybeWindow = (globalThis as { window?: { fetch?: typeof fetch } }).window;
  if (maybeWindow && !maybeWindow.fetch && typeof globalThis.fetch === "function") {
    maybeWindow.fetch = globalThis.fetch.bind(globalThis);
  }
}

function buildClient(
  authType: GeminiAuthType,
  overrides?: { geminiApiKey?: string | null },
): RuntimeClient {

  if (authType === GeminiAuthType.LOGIN_WITH_GOOGLE) {
    return {
      authType,
      modeLabel: "Gemini Code Assist (Login with Google)",
    };
  }

  if (authType === GeminiAuthType.USE_GEMINI) {
    const apiKey = overrides?.geminiApiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY for Gemini API key mode.");
    }

    return {
      ai: new GoogleGenAI({ apiKey }),
      modeLabel: "Gemini API (GEMINI_API_KEY)",
      authType,
    };
  }

  const project =
    process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (
    authType === GeminiAuthType.USE_VERTEX_AI &&
    !apiKey &&
    (!project || !location)
  ) {
    throw new Error(
      "When using Vertex AI, set either (GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_LOCATION) or GOOGLE_API_KEY.",
    );
  }

  return {
    ai: new GoogleGenAI({
      vertexai: true,
      project,
      location,
      apiKey,
    }),
    modeLabel: apiKey
      ? "Vertex AI (GOOGLE_API_KEY)"
      : `Vertex AI (${project ?? "auto-project"}/${location ?? "auto-location"})`,
    authType,
  };
}

async function hasAdcCredentials(): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const accessToken = typeof token === "string" ? token : token?.token;

    if (!accessToken) {
      return {
        ok: false,
        error: "No access token returned by Application Default Credentials.",
      };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: formatError(error) };
  }
}

async function createGoogleLoginGenerator(
  sessionId: string,
): Promise<GeminiContentGenerator> {
  ensureWindowFetchBridge();
  const useBrowserOAuth = shouldUseBrowserOAuth();
  const configStub = {
    getProxy: () => process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY,
    isBrowserLaunchSuppressed: () => !useBrowserOAuth,
    getValidationHandler: () => undefined,
  } as unknown as GeminiCoreConfig;

  return createCodeAssistContentGenerator(
    {},
    GeminiAuthType.LOGIN_WITH_GOOGLE,
    configStub,
    sessionId,
  );
}

function userContent(text: string): Content {
  return {
    role: "user",
    parts: [{ text }],
  };
}

function modelContent(text: string): Content {
  return {
    role: "model",
    parts: [{ text }],
  };
}

function roleLabel(role: MessageRole): string {
  switch (role) {
    case "assistant":
      return "  assistant";
    case "user":
      return "       you";
    case "system":
      return "    system";
  }
}

function roleColor(role: MessageRole): string {
  switch (role) {
    case "assistant":
      return theme.roleAssistant;
    case "user":
      return theme.roleUser;
    case "system":
      return theme.roleSystem;
  }
}

function roleIcon(role: MessageRole): string {
  switch (role) {
    case "assistant":
      return "◆";
    case "user":
      return "▸";
    case "system":
      return "●";
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Header(props: { modeLabel: string; model: string }) {
  return (
    <box flexDirection="column">
      <box flexDirection="row" justifyContent="center">
        <ascii_font text="MAGI" font="tiny" color={theme.purple} />
      </box>
      <box flexDirection="row" justifyContent="center">
        <text>
          <span style={{ fg: theme.textDim }}>── </span>
          <span style={{ fg: theme.cyan }}>Vertex Agent TUI</span>
          <span style={{ fg: theme.textDim }}> ──</span>
        </text>
      </box>
      <box
        flexDirection="row"
        justifyContent="center"
        gap={2}
        marginTop={1}
        marginBottom={1}
      >
        <text>
          <span style={{ fg: theme.textDim }}>mode </span>
          <span style={{ fg: theme.teal }}>{props.modeLabel}</span>
        </text>
        <text>
          <span style={{ fg: theme.textDim }}>│</span>
        </text>
        <text>
          <span style={{ fg: theme.textDim }}>model </span>
          <span style={{ fg: theme.orange }}>{props.model}</span>
        </text>
      </box>
    </box>
  );
}

function MessageBubble(props: { message: TranscriptMessage }) {
  const isStreaming = () => props.message.streaming;
  const role = () => props.message.role;
  const text = () => props.message.text;

  return (
    <box flexDirection="column" marginBottom={0}>
      <box flexDirection="row">
        <text>
          <span style={{ fg: roleColor(role()) }}>
            {roleIcon(role())}
          </span>
          <span style={{ fg: roleColor(role()) }}>
            <strong>{roleLabel(role())}</strong>
          </span>
          <Show when={isStreaming()}>
            <span style={{ fg: theme.textDim }}> ...</span>
          </Show>
        </text>
      </box>
      <Show when={role() === "assistant" && text()}>
        <box marginLeft={12}>
          <markdown
            content={text()}
            streaming={isStreaming()}
            syntaxStyle={syntaxStyle}
          />
        </box>
      </Show>
      <Show when={role() !== "assistant" && (text() || isStreaming())}>
        <box marginLeft={12}>
          <text>
            <span
              style={{
                fg:
                  role() === "system"
                    ? theme.textDim
                    : theme.text,
              }}
            >
              {text() || (isStreaming() ? "..." : "")}
            </span>
          </text>
        </box>
      </Show>
    </box>
  );
}

function StatusIndicator(props: { status: string; canSend: boolean; replying: boolean }) {
  const stateColor = () => {
    if (props.replying) return theme.yellow;
    if (props.canSend) return theme.green;
    return theme.textDim;
  };

  const stateLabel = () => {
    if (props.replying) return "streaming";
    if (props.canSend) return "ready";
    return "idle";
  };

  return (
    <box flexDirection="row" justifyContent="space-between" marginTop={0} paddingX={1}>
      <text>
        <span style={{ fg: theme.textDim }}>
          <em>Enter</em> send
        </span>
        <span style={{ fg: theme.textMuted }}> │ </span>
        <span style={{ fg: theme.textDim }}>
          <em>/help</em> commands
        </span>
        <span style={{ fg: theme.textMuted }}> │ </span>
        <span style={{ fg: theme.textDim }}>
          <em>/connect</em> auth
        </span>
        <span style={{ fg: theme.textMuted }}> │ </span>
        <span style={{ fg: theme.textDim }}>
          <em>Ctrl+C</em> exit
        </span>
      </text>
      <text>
        <span style={{ fg: stateColor() }}>● </span>
        <span style={{ fg: stateColor() }}>{stateLabel()}</span>
        <span style={{ fg: theme.textMuted }}> │ </span>
        <span style={{ fg: theme.textDim }}>{props.status}</span>
      </text>
    </box>
  );
}

function ModalOverlay(props: { children: any; zIndex?: number }) {
  return (
    <box
      position="absolute"
      left={0}
      top={0}
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
      zIndex={props.zIndex ?? 100}
    >
      {props.children}
    </box>
  );
}

function ModalCard(props: { title: string; children: any }) {
  return (
    <box
      width="70%"
      border
      borderStyle="rounded"
      borderColor={theme.modalBorder}
      backgroundColor={theme.modalBg}
      padding={2}
      flexDirection="column"
      gap={1}
    >
      <text>
        <span style={{ fg: theme.purple }}>
          <strong>{props.title}</strong>
        </span>
      </text>
      <text>
        <span style={{ fg: theme.border }}>
          {"─".repeat(60)}
        </span>
      </text>
      {props.children}
    </box>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────

function App() {
  let nextId = 1;
  const renderer = useRenderer();
  const initialState = loadPersistedState();

  const [draft, setDraft] = createSignal("");
  const [model, setModel] = createSignal(initialState.model);
  const [status, setStatus] = createSignal("Ready");
  const [replying, setReplying] = createSignal(false);
  const [systemInstruction, setSystemInstruction] = createSignal(
    initialState.systemInstruction,
  );
  const [messages, setMessages] = createSignal<TranscriptMessage[]>([]);

  const [authOverride, setAuthOverride] = createSignal<GeminiAuthType | null>(
    persistedModeToAuthType(initialState.authMode),
  );
  const [geminiApiKeyOverride, setGeminiApiKeyOverride] = createSignal<
    string | null
  >(null);
  const [autoReconnect, setAutoReconnect] = createSignal(initialState.autoReconnect);
  const [client, setClient] = createSignal<RuntimeClient | null>(null);
  const [chatSession, setChatSession] = createSignal<Chat | null>(null);
  const [oauthGenerator, setOauthGenerator] =
    createSignal<GeminiContentGenerator | null>(null);
  const [oauthHistory, setOauthHistory] = createSignal<Content[]>([]);
  const [oauthConsentRequest, setOauthConsentRequest] =
    createSignal<ConsentRequestPayload | null>(null);
  const [oauthProgressModal, setOauthProgressModal] =
    createSignal<OauthProgressModal | null>(null);
  const [bootError, setBootError] = createSignal<string | null>(null);

  const canSend = createMemo(
    () =>
      draft().trim().length > 0 &&
      !replying() &&
      (!!chatSession() || !!oauthGenerator()),
  );

  const modeLabel = createMemo(() => client()?.modeLabel ?? "not configured");
  const authModalVisible = createMemo(
    () => !!oauthConsentRequest() || !!oauthProgressModal(),
  );

  const selectedAuthType = createMemo(
    () => authOverride() ?? getSelectedAuthType(),
  );

  const appendMessage = (
    role: MessageRole,
    text: string,
    streaming = false,
  ): number => {
    const id = nextId++;
    setMessages((current) => [...current, { id, role, text, streaming }]);
    return id;
  };

  const updateMessage = (
    id: number,
    patch: Partial<Omit<TranscriptMessage, "id">>,
  ): void => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    );
  };

  const setConnectedBanner = (
    activeClient: RuntimeClient,
    replaceTranscript: boolean,
  ): void => {
    if (replaceTranscript) {
      setMessages([
        {
          id: nextId++,
          role: "system",
          text: `Connected: ${activeClient.modeLabel}`,
        },
        {
          id: nextId++,
          role: "system",
          text: "Commands: /help, /auth <method>, /connect, /model <name>, /system <instruction>, /clear, /exit",
        },
      ]);
      return;
    }

    appendMessage("system", `Connected: ${activeClient.modeLabel}`);
  };

  const setWelcomeBanner = (): void => {
    setMessages([
      {
        id: nextId++,
        role: "system",
        text: `Welcome! Auth mode: ${authTypeLabel(selectedAuthType())}. Use /auth to change.`,
      },
      {
        id: nextId++,
        role: "system",
        text: "Run /connect to authenticate and start a session.",
      },
      {
        id: nextId++,
        role: "system",
        text: "Commands: /help  /auth <method>  /connect  /model <name>  /system <instruction>  /clear  /exit",
      },
    ]);
    setStatus("Ready");
  };

  const reconnectSession = async (replaceTranscript = false): Promise<boolean> => {
    try {
      const activeClient = buildClient(selectedAuthType(), {
        geminiApiKey: geminiApiKeyOverride(),
      });
      setClient(activeClient);

      const instruction = systemInstruction().trim();
      const config = instruction ? { systemInstruction: instruction } : undefined;

      if (activeClient.authType === GeminiAuthType.LOGIN_WITH_GOOGLE) {
        setStatus("Authenticating...");
        const generator = await createGoogleLoginGenerator(
          `magi-${Date.now()}`,
        );
        setOauthGenerator(generator);
        setOauthHistory([]);
        setChatSession(null);
      } else {
        if (!activeClient.ai) {
          throw new Error("No GoogleGenAI client available for selected auth.");
        }

        setChatSession(
          activeClient.ai.chats.create({
            model: model(),
            config,
          }),
        );
        setOauthGenerator(null);
        setOauthHistory([]);
      }

      setConnectedBanner(activeClient, replaceTranscript);
      setBootError(null);
      setAutoReconnect(true);
      setStatus("Ready");
      return true;
    } catch (error) {
      const message = formatError(error);
      setClient(null);
      setChatSession(null);
      setOauthGenerator(null);
      setOauthHistory([]);
      setBootError(message);
      if (replaceTranscript) {
        setMessages([
          {
            id: nextId++,
            role: "system",
            text: `Startup error: ${message}`,
          },
          {
            id: nextId++,
            role: "system",
            text: "Set auth env vars, then run /connect. For ADC setup use: gcloud auth application-default login",
          },
        ]);
        setStatus("Startup failed");
      } else {
        appendMessage("system", `Connect error: ${message}`);
        appendMessage(
          "system",
          "Check auth/env config, then retry /connect. For ADC: gcloud auth application-default login",
        );
        setStatus("Connect failed");
      }
      return false;
    }
  };

  const connectWithDetectedAuth = async (): Promise<void> => {
    setStatus("Connecting...");

    const authType = selectedAuthType();

    appendMessage("system", `Connecting via ${authTypeLabel(authType)}...`);

    if (
      authType === GeminiAuthType.USE_GEMINI &&
      !process.env.GEMINI_API_KEY &&
      !geminiApiKeyOverride()
    ) {
      appendMessage(
        "system",
        "Missing Gemini API key. Set GEMINI_API_KEY or run: /auth gemini <api_key>",
      );
      setStatus("Auth required");
      return;
    }

    if (
      authType === GeminiAuthType.USE_VERTEX_AI ||
      authType === GeminiAuthType.COMPUTE_ADC
    ) {
      const hasGoogleApiKey = !!process.env.GOOGLE_API_KEY;
      const hasProjectLocation =
        !!(process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT_ID) &&
        !!process.env.GOOGLE_CLOUD_LOCATION;

      if (
        authType === GeminiAuthType.USE_VERTEX_AI &&
        !hasGoogleApiKey &&
        !hasProjectLocation
      ) {
        appendMessage(
          "system",
          "When using Vertex AI, set either (GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_LOCATION) or GOOGLE_API_KEY.",
        );
        setStatus("Auth required");
        return;
      }

      if (!hasGoogleApiKey) {
        const adc = await hasAdcCredentials();
        if (!adc.ok) {
          appendMessage(
            "system",
            `ADC unavailable: ${adc.error ?? "unknown error"}. Run: gcloud auth application-default login`,
          );
          setStatus("Auth required");
          return;
        }
      }
    }

    if (authType === GeminiAuthType.LOGIN_WITH_GOOGLE) {
      appendMessage(
        "system",
        shouldUseBrowserOAuth()
          ? "Starting Google login flow. Approve the in-app prompt to open browser sign-in."
          : "Starting Google login flow. Enter the auth code when prompted.",
      );
    }

    if (await reconnectSession(false)) {
      appendMessage(
        "system",
        `Authenticated and connected via ${authTypeLabel(authType)}.`,
      );
    }
  };

  const reconnectWithNote = async (note: string): Promise<void> => {
    if (await reconnectSession(true)) {
      appendMessage("system", note);
    }
  };

  const showHelp = (): void => {
    appendMessage(
      "system",
      "Commands: /help  /auth [google|vertex|gemini|compute|auto]  /connect  /model <name>  /system <instruction>  /clear  /exit",
    );
  };

  const handleCommand = (rawInput: string): boolean => {
    if (!rawInput.startsWith("/")) return false;

    const [command, ...args] = rawInput.slice(1).trim().split(/\s+/);
    const value = args.join(" ").trim();

    if (command !== "help" && command !== "exit" && replying()) {
      appendMessage("system", "Wait for the current response to finish.");
      return true;
    }

    switch (command) {
      case "help": {
        showHelp();
        return true;
      }
      case "auth": {
        if (!value) {
          appendMessage(
            "system",
            `Current auth: ${authTypeLabel(selectedAuthType())}. Set with /auth [google|vertex|gemini|compute|auto]`,
          );
          return true;
        }

        const [method, maybeKey] = value.split(/\s+/, 2);

        if (method === "google") {
          setAuthOverride(GeminiAuthType.LOGIN_WITH_GOOGLE);
          appendMessage(
            "system",
            "Auth method set to Login with Google. Run /connect.",
          );
          return true;
        }

        if (method === "vertex") {
          setAuthOverride(GeminiAuthType.USE_VERTEX_AI);
          appendMessage("system", "Auth method set to Vertex AI. Run /connect.");
          return true;
        }

        if (method === "compute") {
          setAuthOverride(GeminiAuthType.COMPUTE_ADC);
          appendMessage(
            "system",
            "Auth method set to Compute ADC. Run /connect.",
          );
          return true;
        }

        if (method === "gemini") {
          setAuthOverride(GeminiAuthType.USE_GEMINI);
          if (maybeKey) {
            setGeminiApiKeyOverride(maybeKey);
          }
          appendMessage(
            "system",
            "Auth method set to Gemini API key. Run /connect.",
          );
          return true;
        }

        if (method === "auto") {
          setAuthOverride(null);
          setGeminiApiKeyOverride(null);
          appendMessage(
            "system",
            "Auth method reset to env auto-detection. Run /connect.",
          );
          return true;
        }

        appendMessage(
          "system",
          "Unknown auth method. Use: /auth [google|vertex|gemini|compute|auto]",
        );
        return true;
      }
      case "model": {
        if (!value) {
          appendMessage("system", `Current model: ${model()}`);
          return true;
        }

        setModel(value);
        if (chatSession() || oauthGenerator()) {
          void reconnectWithNote(`Model switched to ${value}. Conversation reset.`);
        } else {
          appendMessage("system", `Model set to ${value}. Run /connect.`);
        }
        return true;
      }
      case "connect": {
        if (value) {
          appendMessage(
            "system",
            "/connect is for auth/session only. Use /auth or /model to change settings.",
          );
          return true;
        }

        void connectWithDetectedAuth();
        return true;
      }
      case "system": {
        if (!value) {
          appendMessage(
            "system",
            systemInstruction().trim()
              ? `Current system instruction: ${systemInstruction()}`
              : "No system instruction set.",
          );
          return true;
        }

        setSystemInstruction(value);
        if (chatSession() || oauthGenerator()) {
          void reconnectWithNote("System instruction updated. Conversation reset.");
        } else {
          appendMessage("system", "System instruction updated. Run /connect.");
        }
        return true;
      }
      case "clear": {
        if (chatSession() || oauthGenerator()) {
          void reconnectWithNote("Conversation cleared.");
        } else {
          setWelcomeBanner();
        }
        return true;
      }
      case "exit": {
        renderer.destroy();
        return true;
      }
      default: {
        appendMessage("system", `Unknown command: /${command}. Try /help`);
        return true;
      }
    }
  };

  const sendPrompt = async (prompt: string): Promise<void> => {
    const session = chatSession();
    const generator = oauthGenerator();

    if (!session && !generator) {
      appendMessage(
        "system",
        "No active session. Check auth env vars and run /connect.",
      );
      return;
    }

    appendMessage("user", prompt);
    const assistantMessageId = appendMessage("assistant", "", true);

    setReplying(true);
    setStatus(`Generating with ${model()}...`);

    let collected = "";

    try {
      if (generator) {
        const instruction = systemInstruction().trim();
        const stream = await generator.generateContentStream(
          {
            model: model(),
            contents: [...oauthHistory(), userContent(prompt)],
            config: instruction ? { systemInstruction: instruction } : undefined,
          },
          `${Date.now()}`,
          LlmRole.MAIN,
        );

        for await (const chunk of stream) {
          const piece = chunk.text ?? "";
          if (!piece) continue;
          collected += piece;
          updateMessage(assistantMessageId, {
            text: collected,
            streaming: true,
          });
        }

        const finalText = collected.trim() ? collected : "(No text response)";
        updateMessage(assistantMessageId, {
          text: finalText,
          streaming: false,
        });

        setOauthHistory((current) => [
          ...current,
          userContent(prompt),
          modelContent(finalText),
        ]);
      } else if (session) {
        const stream = await session.sendMessageStream({ message: prompt });
        for await (const chunk of stream) {
          const piece = chunk.text ?? "";
          if (!piece) continue;
          collected += piece;
          updateMessage(assistantMessageId, {
            text: collected,
            streaming: true,
          });
        }

        updateMessage(assistantMessageId, {
          text: collected.trim() ? collected : "(No text response)",
          streaming: false,
        });
      }

      setStatus(`Ready (${model()})`);
    } catch (error) {
      const message = formatError(error);
      updateMessage(assistantMessageId, {
        text: `Error: ${message}`,
        streaming: false,
      });
      setStatus("Last request failed");
    } finally {
      setReplying(false);
    }
  };

  const submit = (value: string): void => {
    const prompt = value.trim();
    setDraft("");

    if (!prompt) return;

    if (handleCommand(prompt)) return;

    if (replying()) {
      appendMessage("system", "Wait for the current response to finish.");
      return;
    }

    void sendPrompt(prompt);
  };

  const settleConsent = (confirmed: boolean): void => {
    const request = oauthConsentRequest();
    if (!request) return;

    setOauthConsentRequest(null);
    request.onConfirm(confirmed);
    setStatus(confirmed ? "Connecting..." : "Connect cancelled");
  };

  useKeyboard((event) => {
    if (oauthConsentRequest()) {
      if (event.name === "y" || event.name === "enter") {
        settleConsent(true);
        return;
      }

      if (event.name === "n" || event.name === "escape") {
        settleConsent(false);
        return;
      }
    }

    if (oauthProgressModal() && event.name === "escape") {
      setOauthProgressModal(null);
      return;
    }

    if (event.ctrl && event.name === "c") {
      renderer.destroy();
    }
  });

  onMount(() => {
    const onConsentRequest = (payload: ConsentRequestPayload): void => {
      setOauthConsentRequest(payload);
      setStatus("Awaiting Google sign-in confirmation...");
    };

    const onUserFeedback = (payload: UserFeedbackPayload): void => {
      const message = payload.message.trim();
      if (!message) return;

      const urlMatch = message.match(/https?:\/\/\S+/);
      if (urlMatch) {
        setOauthProgressModal({
          message:
            "Continue Google sign-in in your browser. If it did not open, use this URL:",
          url: urlMatch[0],
        });
      }

      if (message.includes("Waiting for authentication")) {
        setStatus("Waiting for Google authentication...");
      } else if (message.includes("Authentication succeeded")) {
        setOauthProgressModal(null);
      }

      for (const line of message.split(/\r?\n/).map((v) => v.trim())) {
        if (line) appendMessage("system", line);
      }
    };

    coreEvents.on(CoreEvent.ConsentRequest, onConsentRequest);
    coreEvents.on(CoreEvent.UserFeedback, onUserFeedback);
    coreEvents.drainBacklogs();

    onCleanup(() => {
      coreEvents.off(CoreEvent.ConsentRequest, onConsentRequest);
      coreEvents.off(CoreEvent.UserFeedback, onUserFeedback);
    });

    setWelcomeBanner();
    if (autoReconnect()) {
      appendMessage("system", "Restoring previous session...");
      void connectWithDetectedAuth();
    }
  });

  createEffect(() => {
    persistState({
      model: model(),
      authMode: authTypeToPersistedMode(authOverride()),
      systemInstruction: systemInstruction(),
      autoReconnect: autoReconnect(),
    });
  });

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      backgroundColor={theme.bg}
      paddingX={2}
      paddingY={1}
    >
      {/* Header */}
      <Header modeLabel={modeLabel()} model={model()} />

      {/* Chat area */}
      <scrollbox
        border
        borderStyle="rounded"
        borderColor={theme.border}
        flexGrow={1}
        stickyScroll
        stickyStart="bottom"
        paddingX={1}
        paddingY={1}
        marginBottom={1}
      >
        <For each={messages()}>
          {(message) => <MessageBubble message={message} />}
        </For>
      </scrollbox>

      {/* Input area */}
      <box
        border
        borderStyle="rounded"
        borderColor={canSend() ? theme.borderFocused : theme.border}
        backgroundColor={theme.inputBg}
        padding={1}
      >
        <input
          focused={!authModalVisible()}
          placeholder={bootError() ? "❯ Fix auth first..." : "❯ Ask anything..."}
          value={draft()}
          onInput={(value) => setDraft(value)}
          onSubmit={(valueOrEvent) =>
            submit(typeof valueOrEvent === "string" ? valueOrEvent : draft())
          }
          backgroundColor={theme.inputBg}
          focusedBackgroundColor={theme.inputFocusBg}
          textColor={theme.text}
          placeholderColor={theme.textDim}
          cursorColor={theme.blue}
        />
      </box>

      {/* Status bar */}
      <StatusIndicator
        status={status()}
        canSend={canSend()}
        replying={replying()}
      />

      {/* OAuth progress modal */}
      <Show when={oauthProgressModal()}>
        <ModalOverlay zIndex={100}>
          <ModalCard title="Google Login">
            <text>
              <span style={{ fg: theme.text }}>
                {oauthProgressModal()?.message ?? ""}
              </span>
            </text>
            <Show when={oauthProgressModal()?.url}>
              <box
                backgroundColor={theme.bgHighlight}
                padding={1}
                border
                borderStyle="rounded"
                borderColor={theme.border}
              >
                <text selectable>
                  <span style={{ fg: theme.blue }}>
                    {oauthProgressModal()?.url ?? ""}
                  </span>
                </text>
              </box>
            </Show>
            <text>
              <span style={{ fg: theme.textDim }}>
                <em>Press Esc to dismiss</em>
              </span>
            </text>
          </ModalCard>
        </ModalOverlay>
      </Show>

      {/* OAuth consent modal */}
      <Show when={oauthConsentRequest()}>
        <ModalOverlay zIndex={101}>
          <ModalCard title="Google Sign-In">
            <text>
              <span style={{ fg: theme.text }}>
                {oauthConsentRequest()?.prompt ?? ""}
              </span>
            </text>
            <box flexDirection="row" gap={2} marginTop={1}>
              <text>
                <span style={{ fg: theme.green }}>
                  <strong>[Y/Enter]</strong> Continue
                </span>
              </text>
              <text>
                <span style={{ fg: theme.red }}>
                  <strong>[N/Esc]</strong> Cancel
                </span>
              </text>
            </box>
          </ModalCard>
        </ModalOverlay>
      </Show>
    </box>
  );
}

render(() => <App />);
