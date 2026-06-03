import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count = 1000, durationMs = 5000, mode = "realtime" } = await req.json().catch(() => ({}));

    // 1. Generate Synthetic Population
    const patterns = ["aggressive", "passive", "sporadic", "consistent"];
    const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Heidi", "Zoe", "Nexus"];
    const actions = ["login", "click", "scroll", "type", "logout", "purchase", "authenticate", "verify"];
    
    console.log(`Simulating swarm of ${count} users over ${durationMs}ms via ${mode}`);

    const events = [];
    const currentTime = Date.now();

    for (let i = 0; i < count; i++) {
      const profile = {
        id: `usr_${i}_${crypto.randomUUID()}`,
        name: names[i % names.length] + `-${i}`,
        behavioralPattern: patterns[i % patterns.length],
        activityLevel: (i % 100) / 100,
      };

      const actionIndex = Math.floor(i + profile.activityLevel * 100) % actions.length;
      
      events.push({
        user_id: profile.id,
        action: actions[actionIndex],
        timestamp: new Date(currentTime + Math.random() * durationMs).toISOString(),
        payload: {
          x: Math.floor(Math.random() * 1000),
          y: Math.floor(Math.random() * 1000),
          pattern: profile.behavioralPattern,
          activity_level: profile.activityLevel
        }
      });
    }

    if (mode === "realtime") {
      // Emit via Supabase Realtime
      const channel = supabase.channel('swarm_activity');
      
      // Batch events to avoid payload size limits (e.g., max 1MB per message, usually much less for Realtime)
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
      // Emit via direct database insertion (actor_events)
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
        // Supabase-js syntax for insert
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

    return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: corsHeaders });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
