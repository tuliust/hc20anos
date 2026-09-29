import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((_req: Request) =>
  new Response(
    JSON.stringify({
      error: "legacy_function_retired",
      message: "This legacy endpoint has been retired.",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  ),
);
