import type { CallableTool, FunctionCall, FunctionDeclaration, Part, Tool as GeminiTool } from "@google/genai";
import { CommandTool } from "./command";
import { Tool } from "./tool";

// ─── Structured tool event types ─────────────────────────────────────────────

export interface ToolCallEvent {
  type: "call";
  callId: string;
  name: string;
  description?: string;
  args: Record<string, unknown>;
}

export interface ToolResultEvent {
  type: "result";
  callId: string;
  name: string;
  status: "ok" | "error";
  durationMs: number;
  error?: string;
}

export type ToolEvent = ToolCallEvent | ToolResultEvent;

interface ToolRegistryConfig {
  directory: string;
  getAbortSignal?: () => AbortSignal;
  onEvent?: (message: string) => void;
  onToolEvent?: (event: ToolEvent) => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  return "Unknown tool error";
}

/** Extract a short human-readable description from tool args. */
function toolSummary(name: string, args: Record<string, unknown>): string | undefined {
  if (name === "command_exec") {
    const desc = typeof args.description === "string" ? args.description.trim() : "";
    if (desc) return desc;
    const cmd = typeof args.command === "string" ? args.command.trim() : "";
    if (cmd.length <= 60) return cmd;
    return `${cmd.slice(0, 57)}...`;
  }
  return undefined;
}

export class ToolRegistry {
  private readonly tools = new Map<string, Tool.Info<unknown>>();
  private readonly directory: string;
  private readonly getAbortSignal: () => AbortSignal;
  private readonly onEvent?: (message: string) => void;
  private readonly onToolEvent?: (event: ToolEvent) => void;

  constructor(config: ToolRegistryConfig) {
    this.directory = config.directory;
    this.getAbortSignal =
      config.getAbortSignal ??
      (() => new AbortController().signal);
    this.onEvent = config.onEvent;
    this.onToolEvent = config.onToolEvent;

    this.register(CommandTool);
  }

  register(tool: Tool.Info<unknown>): void {
    this.tools.set(tool.id, tool);
  }

  ids(): string[] {
    return [...this.tools.keys()];
  }

  private declarations(): FunctionDeclaration[] {
    return [...this.tools.values()].map((tool) => ({
      name: tool.id,
      description: tool.description,
      parametersJsonSchema: tool.parametersJsonSchema,
    }));
  }

  callableTool(): CallableTool {
    return {
      tool: async (): Promise<GeminiTool> => ({
        functionDeclarations: this.declarations(),
      }),
      callTool: async (functionCalls: FunctionCall[]): Promise<Part[]> => {
        const parts: Part[] = [];
        const abort = this.getAbortSignal();

        for (const call of functionCalls) {
          const name = call.name;
          if (!name) continue;

          const tool = this.tools.get(name);
          if (!tool) {
            const callID = call.id ?? "no-id";
            this.onToolEvent?.({
              type: "call",
              callId: callID,
              name,
              args: {},
            });
            this.onToolEvent?.({
              type: "result",
              callId: callID,
              name,
              status: "error",
              durationMs: 0,
              error: `Unknown tool: ${name}`,
            });
            parts.push({
              functionResponse: {
                name,
                response: { error: `Unknown tool: ${name}` },
              },
            });
            continue;
          }

          const args =
            call.args && typeof call.args === "object" && !Array.isArray(call.args)
              ? call.args as Record<string, unknown>
              : {};

          const startedAt = Date.now();
          const callID = call.id ?? "no-id";
          this.onToolEvent?.({
            type: "call",
            callId: callID,
            name,
            description: toolSummary(name, args),
            args,
          });

          try {
            const parsed = tool.parse(args);
            const result = await tool.execute(parsed, {
              directory: this.directory,
              abort,
              onEvent: this.onEvent,
            });
            const durationMs = Date.now() - startedAt;
            this.onToolEvent?.({
              type: "result",
              callId: callID,
              name,
              status: "ok",
              durationMs,
            });
            parts.push({
              functionResponse: {
                name,
                response: {
                  title: result.title,
                  output: result.output,
                  metadata: result.metadata,
                },
              },
            });
          } catch (error) {
            const durationMs = Date.now() - startedAt;
            this.onToolEvent?.({
              type: "result",
              callId: callID,
              name,
              status: "error",
              durationMs,
              error: errorMessage(error),
            });
            parts.push({
              functionResponse: {
                name,
                response: {
                  error: errorMessage(error),
                },
              },
            });
          }
        }

        return parts;
      },
    };
  }
}
