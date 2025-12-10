
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, ShaderMaterial, Vector3, Color } from 'three';
import { LevelConfig, SandboxSettings, ThemeConfig } from '../types';
import { getObstaclePos } from '../constants';

interface BackgroundProps {
    levelConfig?: LevelConfig;
    sandboxSettings?: SandboxSettings;
    theme: ThemeConfig;
    mousePos?: React.MutableRefObject<Vector3>;
    blackHoleStateRef?: React.MutableRefObject<number[]>;
}

const Background: React.FC<BackgroundProps> = ({ levelConfig, sandboxSettings, theme, blackHoleStateRef }) => {
    const groupRef = useRef<Group>(null);
    const { viewport } = useThree();

    // --- CYBER GRID SHADER ---
    const shaderRef = useRef<ShaderMaterial>(null);
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor1: { value: new Color(theme.colors.background1) },
        uColor2: { value: new Color(theme.colors.background2) },
        uGridColor: { value: new Color(theme.colors.primary) },
        uResolution: { value: new Vector3(viewport.width, viewport.height, 1) }
    }), []);

    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.uColor1.value.set(theme.colors.background1);
            shaderRef.current.uniforms.uColor2.value.set(theme.colors.background2);
            // Dim grid color slightly
            shaderRef.current.uniforms.uGridColor.value.set(theme.colors.primary).multiplyScalar(0.3);
        }
    });

    const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

    const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uGridColor;
    varying vec2 vUv;

    float grid(vec2 st, float res) {
        vec2 grid = fract(st * res);
        return (step(res, grid.x) * step(res, grid.y));
    }

    void main() {
        // Dynamic Horizon Grid
        vec2 uv = vUv * 2.0 - 1.0; // -1 to 1
        
        // Background Gradient
        vec3 color = mix(uColor1, uColor2, vUv.y * 1.5);

        // CORNER GLOWS (Intensified)
        float distTL = distance(vUv, vec2(0.0, 1.0)); // Top Left
        float distBR = distance(vUv, vec2(1.0, 0.0)); // Bottom Right
        float distCenter = distance(vUv, vec2(0.5, 0.5)); // Center
        
        // Add Cyan Glow Top-Left (Stronger)
        color += uGridColor * (1.0 - smoothstep(0.0, 1.2, distTL)) * 0.6; 
        
        // Add Purple Glow Bottom-Right (Stronger)
        color += vec3(0.8, 0.0, 1.0) * (1.0 - smoothstep(0.0, 1.2, distBR)) * 0.5;

        // Center Glow (Subtle White/Blue)
        color += vec3(0.1, 0.2, 0.3) * (1.0 - smoothstep(0.0, 0.5, distCenter)) * 0.3;

        // Moving Grid
        float speed = uTime * 0.2;
        vec2 gridUV = vUv;
        
        // Layer 1: Large Hex/Grid
        float g1 = abs(sin(gridUV.x * 20.0 + sin(uTime * 0.1)) * sin(gridUV.y * 20.0 + uTime * 0.1));
        float g1_mask = smoothstep(0.95, 0.98, g1);
        
        // Layer 2: Digital Rain / flowing lines
        float rain = sin(gridUV.x * 50.0) * sin(gridUV.y * 10.0 + uTime * 2.0);
        float rain_mask = smoothstep(0.98, 1.0, rain) * 0.3;

        // Combine
        color += uGridColor * g1_mask * 0.2;
        color += uGridColor * rain_mask * 0.5;

        // Vignette (Shader based) - Reduced intensity
        float d = length(uv);
        color *= (1.0 - d * 0.3); // Was 0.5

        gl_FragColor = vec4(color, 1.0);
    }
  `;

    // GEOMETRIC DEBRIS
    const debrisCount = 60;
    const debris = useRef([...Array(debrisCount)].map(() => ({
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 40,
        z: -5 - Math.random() * 20,
        scale: 0.5 + Math.random() * 1.5,
        rotationSpeedX: (Math.random() - 0.5) * 0.2,
        rotationSpeedY: (Math.random() - 0.5) * 0.2,
        driftX: (Math.random() - 0.5) * 0.02,
        driftY: (Math.random() - 0.5) * 0.02,
        type: Math.floor(Math.random() * 3), // 0: Icosa, 1: Octa, 2: Torus/Ring
    })));

    useFrame((state, delta) => {
        const timeScale = sandboxSettings?.timeScale || 1;
        const dt = delta * timeScale;
        const t = state.clock.elapsedTime;

        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = t * timeScale;
        }

        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                const d = debris.current[i];

                d.x += d.driftX * timeScale;
                d.y += d.driftY * timeScale;

                // Wrap around
                if (d.x > 30) d.x = -30;
                if (d.x < -30) d.x = 30;
                if (d.y > 20) d.y = -20;
                if (d.y < -20) d.y = 20;

                child.position.set(d.x, d.y, d.z);
                child.rotation.x += d.rotationSpeedX * dt;
                child.rotation.y += d.rotationSpeedY * dt;

                // Pulse scale
                const pulse = 1 + Math.sin(t * 0.5 + i) * 0.1;
                child.scale.set(d.scale * pulse, d.scale * pulse, d.scale * pulse);
            });
        }
    });

    return (
        <>
            {/* BACKGROUND PLANE */}
            <mesh position={[0, 0, -25]}>
                <planeGeometry args={[120, 100]} />
                <shaderMaterial
                    ref={shaderRef}
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                />
            </mesh>

            {/* FLOATING GEOMETRY */}
            <group ref={groupRef}>
                {debris.current.map((d, i) => (
                    <mesh key={i} position={[d.x, d.y, d.z]}>
                        {d.type === 0 && <icosahedronGeometry args={[1, 0]} />}
                        {d.type === 1 && <octahedronGeometry args={[1, 0]} />}
                        {d.type === 2 && <torusGeometry args={[0.8, 0.1, 8, 24]} />}

                        <meshStandardMaterial
                            color={theme.colors.secondary}
                            emissive={theme.colors.secondary}
                            emissiveIntensity={0.2}
                            roughness={0.2}
                            metalness={0.8}
                            wireframe={true}
                            transparent
                            opacity={0.15}
                        />
                    </mesh>
                ))}
            </group>
        </>
    );
};

export default Background;
