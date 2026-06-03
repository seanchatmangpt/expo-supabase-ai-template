-- Autonomic Avatar Simulation Trigger Update
-- Ensures that EVERY user automatically gets a stunning preset avatar upon creation, 
-- regardless of which client or auth method they used to sign up.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  preset_avatars text[] := ARRAY[
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face'
  ];
  random_index integer;
  chosen_avatar text;
  provided_avatar text;
BEGIN
  -- Generate a random index between 1 and the length of the array
  random_index := floor(random() * array_length(preset_avatars, 1) + 1)::int;
  chosen_avatar := preset_avatars[random_index];

  -- If the SSO provider gave us an avatar, use it. Otherwise, use the random one.
  provided_avatar := new.raw_user_meta_data->>'avatar_url';
  IF provided_avatar IS NULL OR provided_avatar = '' THEN
    provided_avatar := chosen_avatar;
  END IF;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id, 
    -- Extract username from email or default to ID
    COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    provided_avatar
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
