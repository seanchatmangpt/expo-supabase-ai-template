require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("No EXPO_PUBLIC_SUPABASE_ANON_KEY found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Attempting sign up...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'admin@truex.com',
    password: 'password123',
  });
  
  if (signUpError) {
    console.error("Sign Up Error:", signUpError.message);
  } else {
    console.log("Sign Up Success:", !!signUpData.user);
  }
  
  console.log("\nAttempting sign in...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@truex.com',
    password: 'password123',
  });
  
  if (signInError) {
    console.error("Sign In Error:", signInError.message);
  } else {
    console.log("Sign In Success:", !!signInData.session);
  }
}

test();
