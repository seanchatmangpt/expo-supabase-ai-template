import React, { ReactNode } from 'react';
import { MfaProvider } from './MfaProvider';
import { MfaStrategy, MfaChallenge } from './types';

export interface SupabaseMfaProviderProps {
  children: ReactNode;
}

export function SupabaseMfaProvider({ children }: SupabaseMfaProviderProps) {
  const onInitiateChallenge = async (strategy: MfaStrategy): Promise<MfaChallenge> => {
    // In a real app, this would call supabase.auth.mfa.challenge()
    console.log('Initiating MFA challenge for strategy:', strategy);
    return {
      id: 'mock-challenge-id',
      strategy,
      expiresAt: Date.now() + 300000, // 5 minutes
    };
  };

  const onVerifyCode = async (challengeId: string, code: string) => {
    // In a real app, this would call supabase.auth.mfa.verify()
    console.log('Verify code:', code, 'for challenge:', challengeId);
    if (code === '123456') { // Mock success code
      return { success: true, token: 'mock-mfa-token' };
    }
    return { success: false };
  };

  return (
    <MfaProvider
      onInitiateChallenge={onInitiateChallenge}
      onVerifyCode={onVerifyCode}
      verificationGracePeriod={3600000} // 1 hour
    >
      {children}
    </MfaProvider>
  );
}
