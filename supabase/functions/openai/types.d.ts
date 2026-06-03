// Global type definitions for Deno runtime in Edge Functions
// This helps with TypeScript intellisense in VS Code

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }

  export const env: Env;

  export function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;
}

declare module "npm:openai@^4.0.0" {
  export class OpenAI {
    constructor(config: { apiKey: string });
    chat: {
      completions: {
        create(params: {
          model: string;
          messages: Array<{
            role: "system" | "user" | "assistant";
            content: string;
          }>;
          max_tokens?: number;
          temperature?: number;
        }): Promise<{
          choices: Array<{
            message?: {
              content?: string | null;
            };
          }>;
        }>;
      };
    };
  }
}
