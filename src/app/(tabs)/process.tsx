import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useOcelEvidence } from '@/src/hooks/useOcelEvidence';
import { ProcessEvidenceView } from '@/src/components/ProcessEvidenceView';

export default function ProcessScreen() {
  const { evidence, isLoading, loadEvidence } = useOcelEvidence();

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-slate-600">Admitting Process Evidence...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="p-6 bg-white border-b border-slate-200">
        <Text className="text-2xl font-black text-slate-900">PROCESS INTELLIGENCE</Text>
        <Text className="text-ss text-slate-500 uppercase tracking-widest">
          State: {evidence?._state || 'Unknown'} | Witness: {evidence?._witness || 'None'}
        </Text>
      </View>
      { evidence && <ProcessEvidenceView log={evidence.value} /> }
    </View>
  );
}