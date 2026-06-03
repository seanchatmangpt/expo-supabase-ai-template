import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/['"]/g, '');
    }
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

import WebSocket from 'ws';
global.WebSocket = WebSocket;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face'
];

async function simulateAvatars() {
  console.log('🤖 Simulating First-Time User Avatars...');
  
  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, avatar_url, username');
    
  if (error) {
    console.error('Error fetching profiles:', error);
    process.exit(1);
  }

  let updatedCount = 0;

  for (const profile of profiles) {
    if (!profile.avatar_url) {
      const randomAvatar = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
      console.log(`Assigning avatar to ${profile.username || profile.id}...`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: randomAvatar })
        .eq('id', profile.id);
        
      if (updateError) {
        console.error(`Failed to update profile ${profile.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`✅ Successfully assigned avatars to ${updatedCount} first-time users!`);
}

simulateAvatars();
