
import { LevelConfig, ThemeConfig, Wall, Portal, Charger } from './types';

export const PARTICLE_COUNT = 1300; // Increased for visibility
export const TARGET_FILL_RATE = 1;
export const GRAVITY_STRENGTH = 0.05;
export const PATH_FLOW_FORCE = 0.18; // Slight boost to flow
export const FRICTION = 0.96;
export const MAX_SPEED = 0.9; // Doubled from 0.45
export const EMITTER_RATE = 50; // Increased for higher particle count
export const RANDOM_FORCE = 0.015;
export const CRITICAL_MASS_THRESHOLD = 50;
export const GRID_SNAP_RADIUS = 0.8; // Distance between crystal grid points
export const CRYSTAL_VELOCITY_THRESHOLD = 0.15; // Speed below which grid snapping occurs

// Physics boundaries for containment
export const ARENA_BOUNDS = {
  x: 13,
  y: 6.5
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const getObstaclePos = (basePos: [number, number, number], behavior: string | undefined, t: number, seed: number): [number, number, number] => {
  if (!behavior || behavior === 'static') return basePos;

  const [x, y, z] = basePos;
  const speed = 1.2; // Increased from 0.8 for more visible movement

  if (behavior === 'orbit') {
    const rad = 2.5;
    const angle = t * speed + seed;
    return [x + Math.cos(angle) * rad, y + Math.sin(angle) * rad, z];
  }
  if (behavior === 'patrolX') {
    const range = 3.0;
    return [x + Math.sin(t * speed + seed) * range, y, z];
  }
  if (behavior === 'patrolY') {
    const range = 2.0;
    return [x, y + Math.sin(t * speed + seed) * range, z];
  }
  if (behavior === 'wander') {
    return [
      x + Math.sin(t * 0.3 + seed) * 2,
      y + Math.cos(t * 0.4 + seed) * 2,
      z
    ];
  }

  return basePos;
};

// ... LEVEL GENERATION ...

export const getLevel = (index: number): LevelConfig => {
  const levelNum = index + 1;

  // Default Config
  let config: LevelConfig = {
    id: levelNum,
    emitterPos: [-8, 0, 0],
    targetPos: [8, 0, 0],
    targetRadius: 2.0,
    requiredCount: 2000 + (index * 500), // Scaled generic difficulty
    particleBudget: levelNum >= 7 ? 6000 + (index * 500) : undefined,
  };

  // Tutorial Levels
  if (index === 0) { // Level 1: Basics
    return {
      ...config,
      requiredCount: 2200, // Tripled from 600
      particleBudget: 4000,
      walls: [
        { position: [0, 0, 0], size: [1, 4, 1], rotation: 0 } // Central Barrier
      ],
      obstaclePos: [[-4, 2, 0], [-4, -2, 0], [4, 2, 0], [4, -2, 0]],
      obstacleTypes: ['cube', 'cube', 'pyramid', 'pyramid'],
      obstacleBehaviors: ['patrolY', 'patrolY', 'orbit', 'orbit'],
      obstacleRadius: 2.0
    };
  }
  if (index === 1) { // Level 2: Obstacle
    return {
      ...config,
      requiredCount: 3000, // Tripled from 800
      particleBudget: 5000,
      walls: [
        { position: [-3, 2, 0], size: [1, 3, 1], rotation: Math.PI / 4 },
        { position: [-3, -2, 0], size: [1, 3, 1], rotation: -Math.PI / 4 },
        { position: [2, 0, 0], size: [1, 5, 1], rotation: 0 }
      ],
      obstaclePos: [[0, 0, 0], [-5, 3, 0], [-5, -3, 0], [5, 0, 0]],
      obstacleRadius: 2.0,
      obstacleTypes: ['static', 'cube', 'cube', 'pyramid'],
      obstacleBehaviors: ['static', 'patrolY', 'patrolY', 'wander']
    };
  }
  if (index === 2) { // Level 3: Blocking Cubes
    return {
      ...config,
      requiredCount: 4000, // Tripled from 1000
      particleBudget: 7000,
      walls: [
        { position: [-4, 0, 0], size: [2, 2, 2], rotation: 0 },
        { position: [0, 3, 0], size: [2, 2, 2], rotation: 0 },
        { position: [0, -3, 0], size: [2, 2, 2], rotation: 0 },
        { position: [4, 0, 0], size: [2, 2, 2], rotation: 0 }
      ],
      obstaclePos: [[-3, 4, 0], [-3, -4, 0], [3, 4, 0], [3, -4, 0]],
      obstacleTypes: ['cube', 'cube', 'pyramid', 'pyramid'],
      obstacleBehaviors: ['patrolX', 'patrolX', 'orbit', 'orbit'],
      obstacleRadius: 2.5
    };
  }

  // Procedural Generation for Level 3+
  const seed = index * 1337;
  const rng = (offset: number) => seededRandom(seed + offset);

  const types: ('static' | 'blackhole' | 'pulsar' | 'debris')[] = [];
  const positions: [number, number, number][] = [];
  const behaviors: ('static' | 'orbit' | 'patrolX' | 'patrolY' | 'wander')[] = [];

  // Add obstacles based on level index
  const count = Math.min(8, Math.floor(index / 2) + 1);

  for (let i = 0; i < count; i++) {
    positions.push([
      (rng(i * 3) - 0.5) * 16,
      (rng(i * 3 + 1) - 0.5) * 8,
      0
    ]);

    const typeRoll = rng(i * 3 + 2);
    if (typeRoll > 0.8 && index > 5) types.push('blackhole');
    else if (typeRoll > 0.6 && index > 3) types.push('pulsar');
    else types.push('static');

    const behaveRoll = rng(i * 7);
    if (behaveRoll > 0.7) behaviors.push('wander');
    else if (behaveRoll > 0.5) behaviors.push('patrolY');
    else behaviors.push('static');
  }

  config.obstaclePos = positions;
  config.obstacleTypes = types;
  config.obstacleBehaviors = behaviors;
  config.obstacleRadius = 0.5 + rng(99) * 0.5; // REDUCED Round 2 (Max 1.0)

  // Boss Levels every 5
  if (levelNum % 5 === 0) {
    config.isBossLevel = true;
    config.requiredCount = Math.floor(config.requiredCount * 0.8);
    config.targetRadius = 3.0;
    config.obstacleTypes = positions.map(() => 'blackhole'); // All blackholes
  }

  // Portals for advanced levels
  if (index > 8 && rng(100) > 0.6) {
    config.portals = [
      { id: 1, position: [-4, -3, 0], target: [4, 3, 0], color: '#00ffff' },
      { id: 2, position: [-4, 3, 0], target: [4, -3, 0], color: '#ff00ff' }
    ];
  }

  // Walls
  if (index > 4 && rng(200) > 0.6) {
    config.walls = [
      { position: [0, 2, 0], size: [1, 4, 1], rotation: 0 },
      { position: [0, -2, 0], size: [1, 4, 1], rotation: 0 }
    ];
  }

  return config;
};

export const THEMES: Record<string, ThemeConfig> = {
  amber: {
    id: 'amber',
    name: 'Amber',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      background1: '#000000',
      background2: '#1a1a1a',
      particleStart: '#ffffff',
      particleEnd: '#f59e0b'
    }
  },
  cyan: {
    id: 'cyan',
    name: 'Cyan',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      background1: '#000000',
      background2: '#0f172a',
      particleStart: '#ffffff',
      particleEnd: '#06b6d4'
    }
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      background1: '#000000',
      background2: '#064e3b',
      particleStart: '#d1fae5',
      particleEnd: '#10b981'
    }
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    colors: {
      primary: '#a855f7',
      secondary: '#9333ea',
      background1: '#000000',
      background2: '#3b0764',
      particleStart: '#f3e8ff',
      particleEnd: '#a855f7'
    }
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    colors: {
      primary: '#ef4444',
      secondary: '#b91c1c',
      background1: '#000000',
      background2: '#450a0a',
      particleStart: '#fee2e2',
      particleEnd: '#ef4444'
    }
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    colors: {
      primary: '#eaff00',
      secondary: '#00ffea',
      background1: '#050505',
      background2: '#111',
      particleStart: '#ffffff',
      particleEnd: '#ff00ff'
    }
  }
};

export const COMPLETION_MESSAGES = [
  "Flow Synchronized.",
  "Quantum Stable.",
  "Resonance Achieved.",
  "System Optimal.",
  "Entropy Reverse.",
  "Pattern Matched.",
  "Harmony Restored.",
  "Cycle Complete.",
  "Data Integrated.",
  "Core Aligned."
];

export const LORE_FRAGMENTS = [
  "The flow remembers.",
  "Echoes of the old code remain.",
  "Seek the center of the void.",
  "Gravity is just a suggestion.",
  "They built walls; we built bridges.",
  "Energy cannot be destroyed, only directed.",
  "The swarm sings in silence.",
  "Patterns emerge from chaos.",
  "Trust the path you create.",
  "The archive is corrupted, but we proceed."
];
