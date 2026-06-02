import React, { ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from './AuthProvider';
import { Session } from '@supabase/supabase-js';
import { ParticipantBasis } from './types';

export interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const getInitialSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }, []);

  const onAuthStateChange = useCallback((callback: (event: string, session: Session | null) => void) => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const resolveParticipant = useCallback((session: Session): ParticipantBasis => {
    return {
      identityBoundary: 'supabase',
      disclosures: [],
      roles: [],
      permissions: [],
      user: session.user,
    };
  }, []);

  return (
    <AuthProvider
      getInitialSession={getInitialSession}
      onAuthStateChange={onAuthStateChange}
      resolveParticipant={resolveParticipant}
    >
      {children}
    </AuthProvider>
  );
}
