import React, { useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Canvas as SkiaCanvas, Rect, Shader, useSharedValue, useTime } from '@shopify/react-native-skia';
import { useAnimationComplexity } from '../../2030/optimization/useOptimizationProfile';
import { useHolographicSensors } from '../../2030/ui-holographic/useHolographicSensors';

export interface AmbientBiometricHologramProps {
  heartRate: number;
  proofVerified: boolean;
}

// ── 3D Volumetric Particle Sphere Component ──
function ParticleSphere({ heartRate, roll, pitch }: { heartRate: number; roll: number; pitch: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const count = 400; // Number of particles
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.2 + Math.random() * 0.3; // Volumetric shell

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pos];
  }, []);

  useFrame((state: any) => {
    const elapsed = state.clock.getElapsedTime();
    if (pointsRef.current) {
      // Rotate reactive to physical device tilt
      pointsRef.current.rotation.y = elapsed * 0.1 + roll * 0.5;
      pointsRef.current.rotation.x = pitch * 0.5;

      // Pulse scaling tied to real-time BPM
      const bps = heartRate / 60; // Beats per second
      const pulse = 1.0 + Math.sin(elapsed * bps * Math.PI * 2) * 0.08;
      pointsRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#06B6D4" size={0.05} transparent opacity={0.8} />
    </points>
  );
}

// ── GLSL Liquid Shader Code for Skia ──
export const liquidShaderCode = `
  uniform float u_time;
  uniform float u_pulse;
  uniform vec2 u_resolution;

  vec4 main(vec2 pos) {
    vec2 uv = pos / u_resolution;
    float dist = distance(uv, vec2(0.5, 0.5));
    float pulseEffect = u_pulse * 0.15;
    float glow = smoothstep(0.45 + pulseEffect, 0.0, dist) * 0.6;
    
    // Wave overlay representing bio-activity
    float wave = sin(uv.x * 8.0 + u_time * 2.5) * 0.015;
    float ring = smoothstep(0.28 + wave, 0.26 + wave, dist) * (1.0 - smoothstep(0.26 + wave, 0.24 + wave, dist));
    
    vec3 baseColor = vec3(0.01, 0.05, 0.12);
    vec3 activeColor = vec3(0.02, 0.71, 0.83); // Cyan
    
    vec3 color = mix(baseColor, activeColor, glow + ring);
    return vec4(color, 1.0);
  }
`;

// ── 2D Shopify Skia Fluid Hologram Component ──
export function SkiaFluidHologram({ heartRate }: { heartRate: number }) {
  const time = useTime();
  const pulse = useSharedValue(0);

  useEffect(() => {
    let active = true;
    const intervalMs = (60 / heartRate) * 1000;

    const triggerPulse = () => {
      if (!active) return;
      pulse.value = 1.0;
      setTimeout(() => {
        if (active) pulse.value = 0.0;
      }, 200);
      setTimeout(triggerPulse, intervalMs);
    };

    triggerPulse();
    return () => {
      active = false;
    };
  }, [heartRate]);

  return (
    <SkiaCanvas style={styles.skiaCanvas} testID="skia-canvas">
      <Rect x={0} y={0} width={280} height={280}>
        <Shader
          source={liquidShaderCode}
          uniforms={{
            u_time: () => time.value / 1000,
            u_pulse: () => pulse.value,
            u_resolution: [280, 280],
          }}
        />
      </Rect>
    </SkiaCanvas>
  );
}

// ── Static SVG Fallback Component ──
function StaticSvgFallback({ heartRate }: { heartRate: number }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.svgContainer} testID="svg-web-fallback">
        <svg width="200" height="200" viewBox="0 0 100 100" style={{ display: 'block' }}>
          <circle cx="50" cy="50" r="40" stroke="#06B6D4" strokeWidth="2" fill="none" />
          <path d="M 50 35 C 40 25, 25 35, 50 65 C 75 35, 60 25, 50 35 Z" fill="#06B6D4" />
          <text x="50" y="85" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="sans-serif">
            {heartRate} BPM
          </text>
        </svg>
      </View>
    );
  } else {
    return (
      <View style={styles.staticContainer} testID="svg-native-fallback">
        <View style={styles.staticCircle}>
          <Text style={styles.staticHeart}>♥</Text>
        </View>
        <Text style={styles.staticTitle}>BIOMETRIC TELEMETRY (STATIC)</Text>
        <Text style={styles.staticBpm}>{heartRate} BPM</Text>
      </View>
    );
  }
}

// ── Main AmbientBiometricHologram Component ──
export const AmbientBiometricHologram: React.FC<AmbientBiometricHologramProps> = ({
  heartRate,
  proofVerified,
}) => {
  const complexity = useAnimationComplexity();
  const gyroSensor = useHolographicSensors();

  const roll = gyroSensor?.sensor?.value?.roll ?? 0;
  const pitch = gyroSensor?.sensor?.value?.pitch ?? 0;

  // 1. High/Balanced Complexity -> Volumetric 3D Particle Cloud
  if (complexity === 'full' || complexity === 'reduced') {
    return (
      <View style={styles.container} testID="hologram-3d-canvas">
        <Canvas style={styles.webglCanvas}>
          <ambientLight intensity={0.5} />
          <ParticleSphere heartRate={heartRate} roll={roll} pitch={pitch} />
        </Canvas>
        <View style={styles.overlay}>
          <Text style={[styles.title, { color: proofVerified ? '#10B981' : '#06B6D4' }]}>
            {proofVerified ? '✓ ZKP VOLUMETRIC ACTIVE' : '⚡ VOLUMETRIC HOLOGRAM'}
          </Text>
          <Text style={styles.value}>{heartRate} BPM</Text>
        </View>
      </View>
    );
  }

  // 2. Minimal Complexity -> Shopify Skia fluid shaders
  if (complexity === 'minimal') {
    return (
      <View style={styles.container} testID="hologram-skia-canvas">
        <View style={styles.skiaWrapper}>
          <SkiaFluidHologram heartRate={heartRate} />
        </View>
        <View style={styles.overlay}>
          <Text style={styles.title}>⚡ DEGRADED LIQUID SHADER</Text>
          <Text style={styles.value}>{heartRate} BPM</Text>
        </View>
      </View>
    );
  }

  // 3. Static fallback (complexity === 'none')
  return (
    <View style={styles.container} testID="hologram-static-fallback">
      <StaticSvgFallback heartRate={heartRate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    borderRadius: 24,
    backgroundColor: '#070A13',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  webglCanvas: {
    width: '100%',
    height: '100%',
  },
  skiaWrapper: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skiaCanvas: {
    width: 280,
    height: 280,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  staticContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  staticCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  staticHeart: {
    fontSize: 36,
    color: '#EF4444',
  },
  staticTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  staticBpm: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
});
