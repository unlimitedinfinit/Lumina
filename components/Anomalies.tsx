
import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Mesh, Color } from 'three';
import { AnomalyData, SandboxSettings, AudioControls, LevelConfig } from '../types';

interface AnomaliesProps {
  anomalyRef: React.MutableRefObject<AnomalyData[]>;
  isPlaying: boolean;
  sandboxSettings?: SandboxSettings;
  audioControls: AudioControls | null;
  levelConfig?: LevelConfig;
}

// Increased capacity for chaos
const MAX_CAPACITY = 8;

const Anomalies: React.FC<AnomaliesProps> = ({ anomalyRef, isPlaying, sandboxSettings, audioControls, levelConfig }) => {
  const { viewport } = useThree();

  // Pool logic
  const pool = useMemo(() => {
    return Array.from({ length: MAX_CAPACITY }).map((_, i) => ({
      id: i,
      mesh: React.createRef<Mesh>(),
      active: false,
      position: new Vector3(100, 100, 0),
      velocity: new Vector3(0, 0, 0),
      scale: 1,
      shape: 0,
      type: 'repulsor' as AnomalyData['type'],
      rotSpeed: new Vector3(0, 0, 0),
      life: 0,
      timer: 0, // For glitch/pulse timing
    }));
  }, []);

  const spawnTimer = useRef(0);
  const nextSpawnTime = useRef(2);
  const spiritTimer = useRef(0);
  const hasSpiritSpawned = useRef(false);

  useFrame((state, delta) => {
    if (!isPlaying) return;

    const timeScale = sandboxSettings?.timeScale || 1;
    const dt = delta * timeScale;
    const t = state.clock.elapsedTime;

    spawnTimer.current += dt;

    // --- EASTER EGG: HELPING SPIRIT (Level 1) ---
    if (levelConfig?.id === 1 && !hasSpiritSpawned.current) {
      spiritTimer.current += dt;
      if (spiritTimer.current > 10) {
        const slot = pool.find(p => !p.active);
        if (slot) {
          slot.active = true;
          slot.type = 'spirit';
          slot.scale = 0.5;
          slot.position.set(levelConfig.emitterPos[0], levelConfig.emitterPos[1], 0);
          slot.life = 0;
          hasSpiritSpawned.current = true;
        }
      }
    } else if (levelConfig?.id !== 1) {
      hasSpiritSpawned.current = false;
      spiritTimer.current = 0;
    }

    // --- SPAWNING LOGIC ---
    // Only spawn if enough budget and time elapsed
    const activeCount = pool.filter(p => p.active && p.type !== 'pulse' && p.type !== 'spirit').length;
    const maxActive = levelConfig?.id && levelConfig.id > 5 ? 4 : 2;

    if (spawnTimer.current > nextSpawnTime.current && activeCount < maxActive) {
      const slot = pool.find(p => !p.active);

      if (slot) {
        slot.active = true;
        slot.life = 0;
        slot.timer = 0;
        slot.scale = 1.0;

        // Random Type Selection
        const rand = Math.random();

        // Default Weights
        let type: AnomalyData['type'] = 'repulsor';
        if (rand > 0.85) type = 'comet'; // Rare Hazard
        else if (rand > 0.70) type = 'warp'; // Time Slow
        else if (rand > 0.55) type = 'prism'; // Speed Boost
        else if (rand > 0.45) type = 'glitch'; // Teleport
        else if (rand > 0.30) type = 'void'; // Black hole
        // else repulsor

        slot.type = type;

        // --- INIT POSITION & VELOCITY ---
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(viewport.width, viewport.height) / 2 + 2;

        // Comet: Spawn far out, aim across screen
        if (type === 'comet') {
          slot.position.set(Math.cos(angle) * (radius + 5), Math.sin(angle) * (radius + 5), 0);
          const targetX = (Math.random() - 0.5) * (viewport.width * 0.8);
          const targetY = (Math.random() - 0.5) * (viewport.height * 0.8);
          const dir = new Vector3(targetX - slot.position.x, targetY - slot.position.y, 0).normalize();
          slot.velocity.copy(dir.multiplyScalar(4.0)); // Fast!
          slot.scale = 0.8;
          if (audioControls) audioControls.playAsteroid();
        }
        else {
          // Others: Float in slowly
          slot.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
          const targetX = (Math.random() - 0.5) * (viewport.width * 0.6);
          const targetY = (Math.random() - 0.5) * (viewport.height * 0.6);
          const dir = new Vector3(targetX - slot.position.x, targetY - slot.position.y, 0).normalize();
          slot.velocity.copy(dir.multiplyScalar(0.5 + Math.random() * 0.5));
          slot.rotSpeed.set(Math.random(), Math.random(), Math.random());
        }

        // Type Specific Init
        if (type === 'warp') slot.scale = 2.5;
        if (type === 'glitch') slot.scale = 1.2;
        if (type === 'prism') slot.scale = 1.5;
        if (type === 'void') slot.scale = 1.0; // Reduced from 1.8
      }

      spawnTimer.current = 0;
      nextSpawnTime.current = Math.random() * 8 + 4; // Spawn every 4-12s
    }

    // --- UPDATE LOOP ---
    anomalyRef.current = [];

    pool.forEach(p => {
      if (p.active) {

        if (p.type === 'spirit') {
          // Spirit logic (unchanged)
          if (levelConfig) {
            p.life += dt * 0.5;
            const progress = Math.min(1, p.life);
            const ex = levelConfig.emitterPos[0];
            const ey = levelConfig.emitterPos[1];
            const tx = levelConfig.targetPos[0];
            const ty = levelConfig.targetPos[1];
            p.position.x = ex + (tx - ex) * progress;
            p.position.y = ey + (ty - ey) * progress + Math.sin(progress * Math.PI) * 2;
            if (progress >= 1) {
              p.active = false;
              spiritTimer.current = 0;
              hasSpiritSpawned.current = false;
            }
          }
        }
        else if (p.type === 'pulse') {
          // Pulse logic (unchanged)
          p.life += dt * 3.0;
          p.scale = 1 + p.life * 5;
          if (p.life > 1.0) p.active = false;
        }
        else if (p.type === 'glitch') {
          // Glitch: Jitter movement
          p.position.addScaledVector(p.velocity, dt);
          p.timer += dt;
          if (p.timer > 0.1) {
            p.mesh.current?.position.set(
              p.position.x + (Math.random() - 0.5) * 0.3,
              p.position.y + (Math.random() - 0.5) * 0.3,
              0
            );
            p.timer = 0;
          } else if (p.mesh.current) {
            // lerp back
            p.mesh.current.position.lerp(p.position, dt * 10);
          }
        }
        else {
          // Standard movement
          p.position.addScaledVector(p.velocity, dt);
          if (p.mesh.current) p.mesh.current.position.copy(p.position);
        }

        // Visual Updates
        if (p.mesh.current) {
          p.mesh.current.rotation.x += p.rotSpeed.x * dt;
          p.mesh.current.rotation.y += p.rotSpeed.y * dt;

          // General rotations (from snippet)
          p.mesh.current.rotation.z += dt * 0.5;
          p.mesh.current.rotation.x += dt * 0.2;

          // Quasar Animation
          if (p.type === 'quasar') {
            p.mesh.current.rotation.z += dt * 2.0; // Fast spin
            const scale = 1 + Math.sin(t * 10) * 0.1;
            p.mesh.current.scale.set(scale, 1, scale); // Pulse width
          }

          // Gamma Animation
          if (p.type === 'gamma') {
            p.mesh.current.rotation.z -= dt * 5.0; // Violent spin
          }

          let renderScale = p.scale;
          if (p.type === 'warp') renderScale = p.scale + Math.sin(t * 2) * 0.2;
          if (p.type === 'prism') p.mesh.current.rotation.y += dt * 2; // Fast spin

          p.mesh.current.scale.set(renderScale, renderScale, renderScale);
        }

        // Ref Push
        anomalyRef.current.push({
          position: p.position,
          radius: p.type === 'warp' ? p.scale * 1.0 : (p.type === 'comet' ? 0.8 : p.scale * 0.8),
          isActive: true,
          type: p.type
        });

        // Bounds Check
        const bound = Math.max(viewport.width, viewport.height) / 2 + 8;
        if (p.position.length() > bound && p.position.dot(p.velocity) > 0) {
          p.active = false;
          if (p.mesh.current) p.mesh.current.position.set(100, 100, 0);
        }

      } else {
        if (p.mesh.current) p.mesh.current.position.set(100, 100, 0);
      }
    });
  });

  return (
    <>
      {pool.map((p) => (
        <group key={p.id}>
          <mesh ref={p.mesh} position={[100, 100, 0]}>

            {/* GEOMETRY SELECTOR */}
            {p.type === 'spirit' && <icosahedronGeometry args={[0.5, 0]} />} {/* Less detail 1 -> 0 */}
            {p.type === 'pulse' && <ringGeometry args={[0.5, 0.6, 16]} />} {/* 32 -> 16 */}
            {p.type === 'repulsor' && <octahedronGeometry args={[1, 0]} />}

            {p.type === 'void' && <sphereGeometry args={[1, 12, 12]} />} {/* 16 -> 12 */}

            {p.type === 'prism' && <coneGeometry args={[0.8, 1.5, 4]} />}
            {p.type === 'warp' && <sphereGeometry args={[1, 16, 16]} />} {/* 32 -> 16 */}
            {p.type === 'glitch' && <boxGeometry args={[1, 1, 1]} />}
            {p.type === 'comet' && <sphereGeometry args={[0.6, 6, 6]} />} {/* 8 -> 6 */}

            <meshBasicMaterial
              color={
                p.type === 'void' ? "#000000" :
                  p.type === 'spirit' ? "#ffffff" :
                    p.type === 'pulse' ? "#ffffff" :
                      p.type === 'repulsor' ? "#ff0066" :
                        p.type === 'prism' ? "#00ffff" :
                          p.type === 'warp' ? "#4400ff" :
                            p.type === 'glitch' ? "#00ff00" :
                              p.type === 'comet' ? "#ff3300" :
                                "#ffffff"
              }
              wireframe={p.type !== 'spirit' && p.type !== 'comet' && p.type !== 'warp'}
              transparent
              opacity={
                p.type === 'pulse' ? (1 - p.life) :
                  p.type === 'warp' ? 0.2 :
                    p.type === 'void' ? 0.8 :
                      p.type === 'comet' ? 1.0 :
                        0.6
              }
            />
          </mesh>

          {/* Inner Core for specific types */}
          {(p.type === 'repulsor' || p.type === 'prism' || p.type === 'glitch') && p.active && (
            <mesh position={p.position} scale={[p.scale * 0.4, p.scale * 0.4, p.scale * 0.4]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial color="#ffffff" wireframe />
            </mesh>
          )}

          {/* Comet Trail Effect (Simple) */}
          {p.type === 'comet' && p.active && (
            <mesh position={[p.position.x - p.velocity.x * 0.1, p.position.y - p.velocity.y * 0.1, 0]} scale={[0.5, 0.5, 0.5]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial color="#ffaa00" transparent opacity={0.5} />
            </mesh>
          )}

        </group>
      ))}
    </>
  );
};

export default Anomalies;
