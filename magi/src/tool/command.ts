import { spawn } from "node:child_process";
import { isAbsolute, resolve } from "node:path";
import { Tool } from "./tool";

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_TIMEOUT_MS = 600_000;
const MAX_OUTPUT_CHARS = 24_000;

interface CommandArgs {
  command: string;
  workdir?: string;
  timeout_ms: number;
  description?: string;
}

function truncateOutput(value: string): string {
  if (value.length <= MAX_OUTPUT_CHARS) return value;
  return `${value.slice(0, MAX_OUTPUT_CHARS)}\n\n[truncated after ${MAX_OUTPUT_CHARS} chars]`;
}

function resolveWorkingDirectory(base: string, workdir?: string): string {
  if (!workdir) return base;
  if (isAbsolute(workdir)) return workdir;
  return resolve(base, workdir);
}

function parseCommandArgs(input: Record<string, unknown>): CommandArgs {
  const command = typeof input.command === "string" ? input.command.trim() : "";
  if (!command) {
    throw new Error("Invalid args: `command` must be a non-empty string.");
  }

  const workdir =
    typeof input.workdir === "string" && input.workdir.trim()
      ? input.workdir.trim()
      : undefined;

  const description =
    typeof input.description === "string" && input.description.trim()
      ? input.description.trim()
      : undefined;

  let timeoutMs = DEFAULT_TIMEOUT_MS;
  if (typeof input.timeout_ms === "number" && Number.isFinite(input.timeout_ms)) {
    timeoutMs = Math.floor(input.timeout_ms);
  }
  if (timeoutMs < 1_000) timeoutMs = 1_000;
  if (timeoutMs > MAX_TIMEOUT_MS) timeoutMs = MAX_TIMEOUT_MS;

  return {
    command,
    workdir,
    timeout_ms: timeoutMs,
    description,
  };
}

export const CommandTool = Tool.define<CommandArgs>({
  id: "command_exec",
  description:
    "Execute shell commands in the project workspace. Use this for tests, build, git, and diagnostics.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Shell command to execute.",
      },
      workdir: {
        type: "string",
        description:
          "Optional working directory. Relative paths resolve from the current session directory.",
      },
      timeout_ms: {
        type: "number",
        description: `Optional timeout in milliseconds (1000-${MAX_TIMEOUT_MS}).`,
      },
      description: {
        type: "string",
        description: "Short 5-10 word description of intent.",
      },
    },
    required: ["command"],
  },
  parse: parseCommandArgs,
  async execute(args, context) {
    const cwd = resolveWorkingDirectory(context.directory, args.workdir);
    const startedAt = Date.now();

    const proc = spawn(args.command, {
      shell: true,
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let aborted = false;

    proc.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const stop = () => {
      if (proc.exitCode !== null) return;
      proc.kill();
    };

    const abortHandler = () => {
      aborted = true;
      stop();
    };

    if (context.abort.aborted) abortHandler();
    context.abort.addEventListener("abort", abortHandler, { once: true });

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      stop();
    }, args.timeout_ms);

    const exitCode = await new Promise<number | null>((resolvePromise) => {
      proc.once("exit", (code) => resolvePromise(code));
      proc.once("error", () => resolvePromise(null));
    });

    clearTimeout(timeoutHandle);
    context.abort.removeEventListener("abort", abortHandler);

    const durationMs = Date.now() - startedAt;
    const result = {
      command: args.command,
      cwd,
      exit_code: exitCode,
      duration_ms: durationMs,
      timed_out: timedOut,
      aborted,
      stdout: truncateOutput(stdout),
      stderr: truncateOutput(stderr),
    };

    return {
      title: args.description ?? "Execute shell command",
      output: JSON.stringify(result, null, 2),
      metadata: result,
    };
  },
});
