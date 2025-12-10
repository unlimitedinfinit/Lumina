# Luminar Flow 🌌

> **A Zen Physics Puzzle Game powered by React Three Fiber**

**Luminar Flow** is an immersive, interactive particle simulation game where you guide a swarm of light particles through space, navigating obstacles, anomalies, and gravitational wells to reach the target zone.

It blends chill, meditative visuals with chaotic physics challenges, designed to be played on Desktop or Mobile.

---

## 🎮 How It Works

### The Objective
Your goal is simple: **Guide the Flow.**
1.  **Emit**: Particles stream from your emitter.
2.  **Guide**: Click/Touch and drag to create gravitational pulls or repulsion fields.
3.  **Target**: Direct the particles into the glowing target ring to charge it up.
4.  **Complete**: Reach 100% resonance to warp to the next sector.

### The Challenges
Space is not empty. You will encounter:
-   **Singularities (Black Holes)**: Strong gravitational wells that crush particles.
-   **Pulsars**: Rythmic repulsors that scatter your swarm.
-   **Void Anomalies**: Random events that warp time, gravity, or space itself.
-   **Prism Gates**: Passing through these grants speed or elemental properties.

### Particle Evolution
Your swarm is alive. Under certain conditions, particles evolve:
-   **💎 Crystalline Lattice**: Particles slow down and snap into a rigid, protective grid.
-   **🌑 Solar Collapse**: Rogue particles implode into mini-black holes, then explode in a supernova.
-   **🕸️ Weavers**: Particles link together, forming a persistent mesh.

---

## 🛠️ Technical Overview

**Luminar Flow** is a high-performance web application built with:
-   **React 18**: UI and State Management.
-   **Three.js**: core 3D Rendering engine.
-   **React Three Fiber (R3F)**: Declarative component-based 3D scene management.
-   **TailwindCSS**: Styling and responsive UI overlay.
-   **Lucide React**: Vector iconography.

### The Physics Engine (`Swarm.tsx`)
The heart of the game is a custom **Instanced Mesh** physics engine.
-   **No Physics Libraries**: We don't use Cannon.js or Rapier. We use a custom, lightweight Verlet-like integration for 1000+ particles.
-   **Instancing**: All 1000+ particles are a *single* draw call (`<instancedMesh>`), updated every frame by directly manipulating the transformation matrix buffer. This ensures 60 FPS performance even on mobile.
-   **Behaviors**:
    -   *Cohesion/Alignment/Separation*: Boids-like flocking algorithms.
    -   *Flow Fields*: Vector noise fields that guide movement.
    -   *Interaction*: Mouse/Touch input maps to a 3D raycaster that applies forces to the velocity buffer.

### Key Architecture

#### 1. `App.tsx` (The Brain)
-   Manages the Game Loop state (Playing, Level Complete, Menu).
-   Handles the **UI Overlay** (HUD, Tutorial, Level Select).
-   Injects `constants` and configuration into the canvas.
-   **Mobile Adaptive**: Uses `100dvh` (Dynamic Viewport Height) to handle mobile browser address bars perfectly.

#### 2. `components/GameCanvas.tsx` (The Stage)
-   Sets up the R3F `<Canvas>`.
-   **Adaptive Camera**: Uses a custom responsive camera rig that zooms out based on screen aspect ratio to ensure the play area is always visible.
-   Post-processing effects (Bloom, Chromatic Aberration) are managed here.

#### 3. `components/Swarm.tsx` (The Engine)
-   The most complex file.
-   `useFrame` loop handles position updates for every single particle.
-   Logic for **Particle Evolution** (detecting conditions for Crystal/BlackHole states) happens here.
-   Handles collision detection (Circular distance checks against obstacles).

#### 4. `components/LevelElements.tsx` (The World)
-   Renders the "Hardware" of the level: Emitters, Targets, Rings, and Walls.
-   Renders Obstacles (Black Holes, Cubes) based on the Level Configuration.
-   Contains the **Hybrid Target** logic: A complex mesh group (Core + Rings + Vortex) that visually reacts to completion progress (swelling, spinning faster, glowing).

#### 5. `components/Anomalies.tsx` (The Randomness)
-   Spawns independent, distinct agents ("Anomalies") that float through the level.
-   Types include: `Warp` (Slow Motion), `Glitch` (Teleportation), `Comet` (Fast Mover).
-   Uses an Object Pool pattern to recycle anomaly meshes for performance.

---

## 🚀 Advanced Features

-   **Generative Audio (`AudioController.tsx`)**: The BGM is not a static MP3. It is a generative soundscape created using the Web Audio API (Oscillators, Gain Nodes) that reacts to game speed and intensity.
-   **Shader-like Visuals**: Even though we use Standard Materials, we manipulate color and emissivity per-instance to create "Neon" and "Plasma" effects without heavy custom shaders.
-   **Sandbox Mode**: Unlockable "Fun Settings" that allow you to enable God-mode options like `Infinite Ammo`, `Giant Mode`, or `Rainbow Trails`.

---

## 🔧 Installation & Setup

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/your-username/luminar-flow.git
    cd luminar-flow
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` to play.

---

*Built with ❤️ for the Open Source Community.*
