export namespace Tool {
  export interface Context {
    directory: string;
    abort: AbortSignal;
    onEvent?: (message: string) => void;
  }

  export interface Result {
    title: string;
    output: string;
    metadata: Record<string, unknown>;
  }

  export interface Info<Args = Record<string, unknown>> {
    id: string;
    description: string;
    parametersJsonSchema: Record<string, unknown>;
    parse(args: Record<string, unknown>): Args;
    execute(args: Args, context: Context): Promise<Result>;
  }

  export function define<Args>(
    info: Info<Args>,
  ): Info<Args> {
    return info;
  }
}
