
import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { GameCanvasProps } from '../types';
import SceneManager from './SceneManager';
import { ARENA_BOUNDS } from '../constants';

// Automatically adjusts camera Z position to fit the arena bounds
const ResponsiveCamera = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    const isMobile = size.width < 768;

    // Zero padding for maximum immersion (ZOOM IN)
    const padX = 1.0;
    const padY = 1.0;

    const targetWidth = ARENA_BOUNDS.x * 2 * padX;
    const targetHeight = ARENA_BOUNDS.y * 2 * padY;

    const fov = 45;
    const fovRad = (fov * Math.PI) / 180;

    const distForHeight = targetHeight / (2 * Math.tan(fovRad / 2));
    const distForWidth = targetWidth / (2 * aspect * Math.tan(fovRad / 2));

    // ZOOM LEVEL: Adjusted for better visibility (User requested zoom out)
    // Increased from 0.70 to 0.90 to show more of the arena.
    const finalDist = Math.max(8, (Math.max(distForHeight, distForWidth)) * 0.90);

    // Clamp min distance to avoid clipping near plane
    // finalDist = Math.max(finalDist, 8); // This line is now redundant as it's handled above

    camera.position.z = finalDist;

    // Center camera always
    camera.position.x = 0;

    camera.updateProjectionMatrix();

  }, [camera, size]);

  return null;
};

const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 45 }}
      dpr={[1, 2]} // Handle high DPI screens
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
    >
      <ResponsiveCamera />
      <color attach="background" args={[props.theme.colors.background1]} />

      <Suspense fallback={null}>
        <SceneManager {...props} />

        {/* Global Illumination Upgrade */}
        <ambientLight intensity={0.4} /> {/* Boosted base visibility */}

        {/* Corner Lights (Cyan/Purple Mix) */}
        <pointLight position={[-12, 8, 2]} intensity={2} color={props.theme.colors.primary} distance={15} decay={2} />
        <pointLight position={[12, -8, 2]} intensity={2} color={props.theme.colors.secondary} distance={15} decay={2} />
        <pointLight position={[-12, -8, 2]} intensity={1.5} color="#ffffff" distance={15} decay={2} />
        <pointLight position={[12, 8, 2]} intensity={1.5} color={props.theme.colors.primary} distance={15} decay={2} />

        <EffectComposer>
          {/* High intensity bloom for the "bioluminescent" look */}
          <Bloom
            luminanceThreshold={0.2}
            mipmapBlur
            intensity={1.5}
            radius={0.6}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.6} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default GameCanvas;
