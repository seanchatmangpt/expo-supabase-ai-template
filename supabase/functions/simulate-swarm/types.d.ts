declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export * from "@supabase/supabase-js";
}
