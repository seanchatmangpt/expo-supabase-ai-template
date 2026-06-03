/// <reference path="./types.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Auth verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    let count = Number(body.count) || 1000;
    count = Math.max(1, Math.min(count, 10000)); // clamp between 1 and 10000

    let durationMs = Number(body.durationMs) || 5000;
    durationMs = Math.max(100, Math.min(durationMs, 60000)); // clamp between 100ms and 60s

    const mode = String(body.mode || "realtime");

    // 1. Generate Synthetic Population
    const patterns = ["aggressive", "passive", "sporadic", "consistent"];
    const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Heidi", "Zoe", "Nexus"];
    const actions = ["login", "click", "scroll", "type", "logout", "purchase", "authenticate", "verify"];
    
    console.log(`Simulating swarm of ${count} users over ${durationMs}ms via ${mode}`);

    const events = [];
    const currentTime = Date.now();

    for (let i = 0; i < count; i++) {
      const profileId = `usr_${i}_${crypto.randomUUID()}`;
      const activityLevel = (i % 100) / 100;
      const behavioralPattern = patterns[i % patterns.length];

      const actionIndex = Math.floor(i + activityLevel * 100) % actions.length;
      
      events.push({
        user_id: profileId,
        action: actions[actionIndex],
        timestamp: new Date(currentTime + Math.random() * durationMs).toISOString(),
        payload: {
          x: Math.floor(Math.random() * 1000),
          y: Math.floor(Math.random() * 1000),
          pattern: behavioralPattern,
          activity_level: activityLevel
        }
      });
    }

    if (mode === "realtime") {
      const channel = supabase.channel('swarm_activity');
      
      const batchSize = 100;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await channel.send({
          type: 'broadcast',
          event: 'swarm_events',
          payload: { batch }
        });
      }
      
      supabase.removeChannel(channel);

      return new Response(
        JSON.stringify({ success: true, message: `Broadcasted ${events.length} simulated events to 'swarm_activity' channel.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (mode === "database") {
      const dbPayloads = events.map(e => ({
        id: crypto.randomUUID(),
        command_id: crypto.randomUUID(),
        actor_ref: e.user_id,
        type: e.action,
        payload: JSON.stringify(e.payload),
        created_at: Date.now()
      }));

      const batchSize = 500;
      let insertedCount = 0;
      for (let i = 0; i < dbPayloads.length; i += batchSize) {
        const batch = dbPayloads.slice(i, i + batchSize);
        const { error } = await supabase.from('actor_events').insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          throw error;
        }
        insertedCount += batch.length;
      }

      return new Response(
        JSON.stringify({ success: true, message: `Inserted ${insertedCount} events into 'actor_events' table.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
