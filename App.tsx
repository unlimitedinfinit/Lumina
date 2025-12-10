
import React, { useState, useMemo, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import AudioController from './components/AudioController';
import { GameState, SandboxSettings, VibeSettings, AudioControls } from './types';
import { getLevel, THEMES, COMPLETION_MESSAGES, PARTICLE_COUNT, LORE_FRAGMENTS } from './constants';
import { Play, RotateCcw, ArrowRight, Zap, Move, Palette, Maximize, Infinity as InfinityIcon, Clock, Eye, Headphones, ChevronLeft, ChevronRight, FastForward, Rewind, ChevronDown, ChevronUp, Split, Magnet, Shield, Activity, Terminal, Smartphone, Menu, ArrowDownRight } from 'lucide-react';

const App: React.FC = () => {
    const [levelIndex, setLevelIndex] = useState(0);
    const [gameState, setGameState] = useState<GameState>({
        currentLevel: 1,
        collectedCount: 0,
        isLevelComplete: false,
        isPlaying: false,
        showStartScreen: true,
    });

    const [activeParticleCount, setActiveParticleCount] = useState(0);

    const [sandbox, setSandbox] = useState<SandboxSettings>({
        gravityMult: 1,
        speedMult: 1,
        timeScale: 2.0, // Default speed set to 2x as requested
        rainbowMode: true,
        giantMode: false,
        infiniteAmmo: true,
        symmetry: false,
        mouseAttractor: false,
        invincibility: false,
        hyperTrails: false,
        trailStyle: 'default',
    });

    const [vibe, setVibe] = useState<VibeSettings>({
        themeId: 'neon',
        musicId: 'pulse', // Default to Pulse Lofi
        tempo: 1.0
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const audioRef = useRef<AudioControls | null>(null);
    const [fuel, setFuel] = useState(100);
    const [completionMsg, setCompletionMsg] = useState("");
    const [loreMsg, setLoreMsg] = useState("");
    const [isPortraitMobile, setIsPortraitMobile] = useState(false);

    const currentLevelConfig = useMemo(() => getLevel(levelIndex), [levelIndex]);
    const currentTheme = THEMES[vibe.themeId];

    useEffect(() => {
        const checkOrientation = () => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
            const isPortrait = window.innerHeight > window.innerWidth;
            setIsPortraitMobile(isMobile && isPortrait);

            // Auto-close menu on small screens initially
            if (window.innerWidth < 768) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', checkOrientation);
        checkOrientation();

        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    useEffect(() => {
        const msg = LORE_FRAGMENTS[Math.floor(Math.random() * LORE_FRAGMENTS.length)];
        setLoreMsg(msg);
    }, [levelIndex, resetKey]);

    useEffect(() => {
        if (currentLevelConfig.particleBudget) {
            setFuel(currentLevelConfig.particleBudget);
        } else {
            setFuel(100);
        }
    }, [currentLevelConfig]);

    // AUTO-START LEVEL 1 (5 seconds)
    useEffect(() => {
        if (levelIndex === 0 && gameState.showStartScreen) {
            const timer = setTimeout(() => {
                startGame();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [levelIndex, gameState.showStartScreen]);

    const handleLevelComplete = () => {
        setGameState(prev => ({ ...prev, isLevelComplete: true }));
        const msg = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
        setCompletionMsg(msg);
        if (audioRef.current) audioRef.current.playLevelComplete();
    };

    const handleProgress = (count: number) => {
        setGameState(prev => ({ ...prev, collectedCount: count }));
    };

    const handleActiveCount = (count: number) => {
        setActiveParticleCount(count);
    };

    const nextLevel = () => {
        const nextIdx = levelIndex + 1;
        setLevelIndex(nextIdx);
        setGameState({
            currentLevel: nextIdx + 1,
            collectedCount: 0,
            isLevelComplete: false,
            isPlaying: false,
            showStartScreen: true,
        });
        setActiveParticleCount(0);
    };

    const prevLevel = () => {
        if (levelIndex > 0) {
            const prevIdx = levelIndex - 1;
            setLevelIndex(prevIdx);
            setGameState({
                currentLevel: prevIdx + 1,
                collectedCount: 0,
                isLevelComplete: false,
                isPlaying: false,
                showStartScreen: true,
            });
            setActiveParticleCount(0);
        }
    };

    const jumpToLevel = (idx: number) => {
        setLevelIndex(idx);
        setGameState({
            currentLevel: idx + 1,
            collectedCount: 0,
            isLevelComplete: false,
            isPlaying: false,
            showStartScreen: true,
        });
        setActiveParticleCount(0);
    }

    const restartLevel = () => {
        setGameState(prev => ({
            ...prev,
            collectedCount: 0,
            isLevelComplete: false,
            isPlaying: false,
            showStartScreen: true,
        }));
        if (currentLevelConfig.particleBudget) {
            setFuel(currentLevelConfig.particleBudget);
        }
        setResetKey(prev => prev + 1);
        setActiveParticleCount(0);
    };

    const startGame = () => {
        setGameState(prev => ({ ...prev, isPlaying: true, showStartScreen: false }));
    }

    const toggleSandbox = (key: keyof SandboxSettings) => {
        setSandbox(prev => {
            if (key === 'gravityMult') return { ...prev, gravityMult: prev.gravityMult === 1 ? 2.5 : 1 };
            if (key === 'speedMult') return { ...prev, speedMult: prev.speedMult === 1 ? 2 : 1 };
            if (key === 'timeScale') return prev;
            return { ...prev, [key]: !prev[key] };
        });
    };

    const setTimeScale = (val: number) => {
        setSandbox(prev => ({ ...prev, timeScale: val }));
    }

    const setTempo = (val: number) => {
        setVibe(prev => ({ ...prev, tempo: val }));
    }

    const maxFuel = currentLevelConfig.particleBudget || 100;
    const fuelPercent = currentLevelConfig.particleBudget
        ? Math.max(0, (fuel / maxFuel) * 100)
        : 100;

    const getDifficultyLabel = (lvl: number) => {
        if (currentLevelConfig.isBossLevel) return 'EXTREME';
        if (lvl <= 4) return 'EASY';
        if (lvl <= 9) return 'NORMAL';
        if (lvl <= 14) return 'DIFFICULT';
        if (lvl <= 19) return 'HARD';
        if (lvl <= 29) return 'COMPLEX';
        return 'CHAOS';
    };

    const difficultyLabel = getDifficultyLabel(currentLevelConfig.id);

    const completionRatio = currentLevelConfig.requiredCount > 0
        ? Math.min(1, gameState.collectedCount / currentLevelConfig.requiredCount)
        : 0;

    // MECHANIC TIPS
    const getMechanicTip = () => {
        if (currentLevelConfig.conversionRequired) return "TIP: Prism Charge Required";
        if (currentLevelConfig.portals && currentLevelConfig.portals.length > 0) return "TIP: Portals Bypass Walls";
        if (currentLevelConfig.isBossLevel) return "WARNING: Hazard Sector";
        return null;
    };
    const mechanicTip = getMechanicTip();

    if (isPortraitMobile) {
        return (
            <div className="flex w-full h-[100dvh] bg-black text-white items-center justify-center p-8 text-center flex-col z-50">
                <Smartphone size={48} className="mb-4 text-cyan-400 animate-spin-slow" />
                <h1 className="text-2xl font-bold mb-2 tracking-widest text-cyan-200">ORIENTATION ERROR</h1>
                <p className="text-gray-400 font-mono text-sm max-w-xs">
                    Lumina Flow requires landscape mode for quantum alignment.
                </p>
                <div className="mt-8 animate-pulse text-xs text-gray-600 font-mono">
                    PLEASE ROTATE DEVICE
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative flex flex-col w-full h-[100dvh] bg-black text-white font-sans overflow-hidden select-none items-center justify-center touch-none"
            onContextMenu={(e) => e.preventDefault()}
        >

            <AudioController
                vibe={vibe}
                isPlaying={gameState.isPlaying}
                musicEnabled={true}
                onAudioReady={(ctrl) => audioRef.current = ctrl}
            />

            {/* SIDEBAR OVERLAY - Only visible when menu open */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <div
                className={`fixed inset-y-0 left-0 bg-black/95 backdrop-blur-xl border-r border-gray-800 z-50 transition-transform duration-300 ease-in-out w-80 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-cyan-400 tracking-wider">SYSTEM</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-white">
                            <ChevronLeft />
                        </button>
                    </div>

                    {/* Existing Menu Content Kept Intact */}
                    <div className="border-b border-gray-800 pb-4 mb-4">
                        <button
                            onClick={() => setIsLevelSelectOpen(!isLevelSelectOpen)}
                            className="w-full flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-500 mb-2 hover:text-gray-300 transition-colors group"
                        >
                            <span className="group-hover:text-cyan-400 transition-colors">Level Select</span>
                            {isLevelSelectOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        <div className={`grid grid-cols-5 gap-1 transition-all duration-300 overflow-hidden ${isLevelSelectOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                            {Array.from({ length: 50 }, (_, i) => i).map(i => (
                                <button
                                    key={i}
                                    onClick={() => jumpToLevel(i)}
                                    className={`aspect-square flex items-center justify-center rounded text-[9px] transition-colors border ${levelIndex === i
                                        ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200'
                                        : 'bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-400'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Status</h3>
                        <div className="text-[10px] text-gray-400 space-y-1 font-mono bg-gray-900/50 p-3 rounded border border-gray-800">
                            <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={gameState.isPlaying ? "text-green-400" : "text-yellow-400"}>
                                    {gameState.isPlaying ? 'ACTIVE' : 'IDLE'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Particles:</span>
                                <span>{activeParticleCount.toLocaleString()} <span className="text-gray-600">/ {PARTICLE_COUNT.toLocaleString()}</span></span>
                            </div>
                            <div className="flex justify-between">
                                <span>Reservoir:</span>
                                <span className={currentLevelConfig.particleBudget ? (fuel > 0 ? "text-cyan-400" : "text-red-500") : "text-green-400"}>
                                    {currentLevelConfig.particleBudget ? `${Math.floor(fuel)} / ${currentLevelConfig.particleBudget}` : '∞'}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-800 pt-1 mt-1">
                                <span>Difficulty:</span>
                                <span className={`font-bold ${difficultyLabel === 'EXTREME' || difficultyLabel === 'HARD' ? 'text-red-400' : 'text-blue-300'}`}>
                                    {difficultyLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[10px] uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-2">
                            <Eye size={10} /> Visual Themes
                        </h3>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                            {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setVibe(prev => ({ ...prev, themeId: key }))}
                                    className={`px-2 py-1.5 rounded text-[10px] capitalize transition-all border text-center ${vibe.themeId === key ? 'bg-purple-900/40 border-purple-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
                                >
                                    {THEMES[key].name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[10px] uppercase tracking-widest text-cyan-400 mb-2 flex items-center gap-2">
                            <Headphones size={10} /> Soundscapes
                        </h3>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                            {[
                                { id: 'pulse', label: 'Pulse', desc: 'Lofi' },
                                { id: 'chill', label: 'Chill', desc: 'Jazz' },
                                { id: 'night', label: 'Night', desc: 'Sleep' },
                                { id: 'bit', label: 'Bit', desc: 'Retro' },
                                { id: 'life', label: 'Life', desc: 'Nature' },
                                { id: 'ether', label: 'Ether', desc: 'Choral' },
                                { id: 'void', label: 'Void', desc: 'Drone' },
                                { id: 'focus', label: 'Focus', desc: 'Minimal' },
                                { id: 'warp', label: 'Warp', desc: 'Sci-Fi' },
                                { id: 'piano', label: 'Piano', desc: 'Gen' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setVibe(prev => ({ ...prev, musicId: m.id }))}
                                    className={`px-2 py-1.5 rounded text-left transition-all border ${vibe.musicId === m.id ? 'bg-cyan-900/40 border-cyan-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="text-[9px] font-bold uppercase">{m.label}</div>
                                        <div className="text-[8px] text-gray-500">{m.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] uppercase tracking-widest text-pink-500 mb-2 flex items-center gap-2">
                            <Zap size={10} /> Sandbox Tools
                        </h3>
                        <div className="space-y-1.5">
                            <button
                                onClick={() => toggleSandbox('infiniteAmmo')}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-[10px] border transition-all ${sandbox.infiniteAmmo ? 'bg-yellow-900/30 border-yellow-500 text-yellow-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                            >
                                <span className="flex items-center gap-2"><InfinityIcon size={10} /> Infinite Source</span>
                                <div className={`w-1.5 h-1.5 rounded-full ${sandbox.infiniteAmmo ? 'bg-yellow-500' : 'bg-gray-700'}`} />
                            </button>

                            <div className="bg-gray-900 border border-gray-800 rounded p-1.5">
                                <div className="text-[9px] text-gray-500 mb-1 flex items-center gap-1"><Clock size={9} /> TIME DILATION</div>
                                <div className="flex justify-between gap-0.5">
                                    {[0.1, 0.25, 0.5, 1, 2, 4].map(scale => (
                                        <button
                                            key={scale}
                                            onClick={() => setTimeScale(scale)}
                                            className={`flex-1 py-0.5 text-[9px] rounded border transition-colors ${sandbox.timeScale === scale
                                                ? 'bg-blue-600 border-blue-400 text-white'
                                                : 'bg-black border-gray-700 text-gray-500 hover:bg-gray-800'
                                                }`}
                                        >
                                            {scale === 0.1 ? '.1' : scale === 0.25 ? '.25' : scale}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    onClick={() => toggleSandbox('symmetry')}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] border transition-all ${sandbox.symmetry ? 'bg-indigo-900/30 border-indigo-500 text-indigo-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                                >
                                    <span className="flex items-center gap-1"><Split size={10} /> Symmetry</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sandbox.symmetry ? 'bg-indigo-500' : 'bg-gray-700'}`} />
                                </button>

                                <button
                                    onClick={() => toggleSandbox('mouseAttractor')}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] border transition-all ${sandbox.mouseAttractor ? 'bg-red-900/30 border-red-500 text-red-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                                >
                                    <span className="flex items-center gap-1"><Magnet size={10} /> Mouse Grav</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sandbox.mouseAttractor ? 'bg-red-500' : 'bg-gray-700'}`} />
                                </button>

                                <button
                                    onClick={() => toggleSandbox('invincibility')}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] border transition-all ${sandbox.invincibility ? 'bg-teal-900/30 border-teal-500 text-teal-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                                >
                                    <span className="flex items-center gap-1"><Shield size={10} /> Invincible</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sandbox.invincibility ? 'bg-teal-500' : 'bg-gray-700'}`} />
                                </button>

                                <button
                                    onClick={() => toggleSandbox('hyperTrails')}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] border transition-all ${sandbox.hyperTrails ? 'bg-orange-900/30 border-orange-500 text-orange-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                                >
                                    <span className="flex items-center gap-1"><Activity size={10} /> Hyper Trails</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sandbox.hyperTrails ? 'bg-orange-500' : 'bg-gray-700'}`} />
                                </button>

                                <button
                                    onClick={() => toggleSandbox('gravityMult')}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] border transition-all ${sandbox.gravityMult > 1 ? 'bg-pink-900/30 border-pink-500 text-pink-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                                >
                                    <span className="flex items-center gap-1"><Move size={10} /> Grav+</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sandbox.gravityMult > 1 ? 'bg-pink-500' : 'bg-gray-700'}`} />
                                </button>

                                <button
                                    onClick={() => toggleSandbox('speedMult')}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] border transition-all ${sandbox.speedMult > 1 ? 'bg-cyan-900/30 border-cyan-500 text-cyan-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                                >
                                    <span className="flex items-center gap-1"><Zap size={10} /> Speed+</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sandbox.speedMult > 1 ? 'bg-cyan-500' : 'bg-gray-700'}`} />
                                </button>

                                <button
                                    onClick={() => toggleSandbox('rainbowMode')}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] border transition-all ${sandbox.rainbowMode ? 'bg-purple-900/30 border-purple-500 text-purple-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                                >
                                    <span className="flex items-center gap-1"><Palette size={10} /> Color</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sandbox.rainbowMode ? 'bg-purple-500' : 'bg-gray-700'}`} />
                                </button>

                                <button
                                    onClick={() => toggleSandbox('giantMode')}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] border transition-all ${sandbox.giantMode ? 'bg-green-900/30 border-green-500 text-green-200' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                                >
                                    <span className="flex items-center gap-1"><Maximize size={10} /> Giant</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sandbox.giantMode ? 'bg-green-500' : 'bg-gray-700'}`} />
                                </button>
                            </div>

                            <div className="bg-gray-900 border border-gray-800 rounded p-1.5 mt-2">
                                <div className="text-[9px] text-gray-500 mb-1 flex items-center gap-1">TRAIL STYLE</div>
                                <div className="grid grid-cols-4 gap-0.5">
                                    {['default', 'neon', 'rainbow', 'dark'].map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => setSandbox(prev => ({ ...prev, trailStyle: style as any }))}
                                            className={`py-0.5 text-[8px] uppercase rounded border transition-colors ${sandbox.trailStyle === style
                                                ? 'bg-cyan-600 border-cyan-400 text-white'
                                                : 'bg-black border-gray-700 text-gray-500 hover:bg-gray-800'
                                                }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-800">
                        <p className="text-[10px] text-gray-500 mb-3 leading-relaxed text-center font-mono">
                            We built Lumina to help you take a breath. No ads, just vibes.
                        </p>
                        <p className="text-[10px] text-gray-600 mb-3 text-center">
                            Check out our nonprofit mission at
                        </p>
                        <a
                            href="https://truejust.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-2 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-[10px] font-bold text-center rounded tracking-widest uppercase hover:bg-cyan-900/60 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] group"
                        >
                            <span className="group-hover:text-cyan-100">TrueJust.org</span>
                        </a>
                        <div className="mt-4 text-[9px] text-gray-700 text-center font-mono">
                            v3.5 // NON-PROFIT INITIATIVE
                        </div>
                    </div>
                </div>
            </div>

            {/* GAME WRAPPER - Full Screen */}
            <div className={`relative w-full h-full`}>
                {/* CANVAS LAYER */}
                <div className="absolute inset-0 z-0">
                    <GameCanvas
                        levelConfig={currentLevelConfig}
                        onLevelComplete={handleLevelComplete}
                        onProgress={handleProgress}
                        onActiveCount={handleActiveCount}
                        isPaused={!gameState.isPlaying}
                        sandboxSettings={sandbox}
                        setFuel={setFuel}
                        theme={currentTheme}
                        audioControls={audioRef.current}
                        resetKey={resetKey}
                        completionRatio={completionRatio}
                    />
                </div>

                {/* OVERLAY UI LAYER (Inside Game Border) */}
                <div className="absolute inset-0 z-10 pointer-events-none p-2 md:p-6 flex flex-col justify-between">

                    {/* HUD HEADER */}
                    <div className="flex justify-between items-start">

                        {/* Top Left: Title & Level */}
                        <div className="flex flex-col gap-1 items-start">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] leading-none"
                                style={{ backgroundImage: `linear-gradient(to right, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}
                            >
                                LUMINA
                            </h1>
                            <div className="flex items-center gap-3">
                                <span className="text-xl md:text-2xl font-thin text-white tracking-[0.2em] opacity-80">
                                    LEVEL {currentLevelConfig.id}
                                </span>
                                {mechanicTip && (
                                    <div className="hidden md:block px-2 py-0.5 bg-blue-900/40 border border-blue-500 text-blue-200 text-[9px] font-mono tracking-wide rounded animate-pulse">
                                        {mechanicTip}
                                    </div>
                                )}
                            </div>
                        </div>

                        {currentLevelConfig.id === 1 && (
                            <div className="flex flex-col items-center mt-2 md:mt-4 animate-in fade-in slide-in-from-top-4 duration-700 delay-500 pointer-events-none">
                                <div className="px-4 py-2 md:px-10 md:py-4 bg-cyan-950/80 md:bg-cyan-950/90 border-x-2 border-cyan-500/50 backdrop-blur-xl rounded-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] md:shadow-[0_0_25px_rgba(34,211,238,0.3)] min-w-[200px] md:min-w-[300px]">
                                    <div className="text-cyan-400 font-black text-sm md:text-2xl tracking-[0.15em] md:tracking-[0.2em] uppercase mb-1 md:mb-2 text-center drop-shadow-lg">
                                        MISSION BRIEF
                                    </div>
                                    <div className="text-white/95 text-xs md:text-lg font-mono text-center font-bold tracking-wide">
                                        GUIDE PARTICLES TO THE TARGET ZONE
                                    </div>
                                </div>
                                <div className="h-4 md:h-8 w-1 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>
                            </div>
                        )}

                        {/* Top Right: Progress */}
                        <div className="text-right flex flex-col items-end gap-2">
                            <div className="text-2xl md:text-4xl font-thin font-mono text-cyan-100 leading-none">
                                {Math.floor(completionRatio * 100)}%
                            </div>
                            <div className="w-24 md:w-48 h-1.5 bg-gray-800/50 rounded-full mt-2 overflow-hidden backdrop-blur-sm border border-gray-700/50">
                                <div
                                    className={`h-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(34,211,238,0.6)]`}
                                    style={{
                                        width: `${completionRatio * 100}%`,
                                        backgroundColor: currentTheme.colors.primary
                                    }}
                                />
                            </div>
                            {currentLevelConfig.particleBudget && !sandbox.infiniteAmmo && (
                                <div className="mt-1 flex justify-end items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${fuelPercent < 20 ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`}></div>
                                    <span className={`text-[10px] font-mono ${fuelPercent < 20 ? 'text-red-400' : 'text-yellow-100/70'}`}>
                                        {Math.ceil(fuelPercent)}% FUEL
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM CONTROLS - INSIDE OVERLAY */}
                    <div className="flex justify-between items-end pointer-events-auto">
                        {/* BOTTOM LEFT: MENU */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="flex items-center gap-2 pt-4 group transition-transform hover:scale-105 active:scale-95 origin-bottom-left"
                        >
                            <div className="px-4 py-2 rounded-full font-bold text-xs tracking-wider text-black bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-gradient bg-[length:200%_auto] shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] border border-white/20">
                                FUN SETTINGS
                            </div>
                        </button>

                        {/* BOTTOM RIGHT: ACTIONS */}
                        <div className="flex items-center gap-2 pt-4 opacity-60 hover:opacity-100 transition-opacity">
                            <button
                                onClick={prevLevel}
                                disabled={levelIndex === 0}
                                className="p-2 border border-gray-800 bg-black/40 backdrop-blur rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                            >
                                <Rewind size={20} />
                            </button>
                            <button
                                onClick={restartLevel}
                                className="p-2 border border-gray-800 bg-black/40 backdrop-blur rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            >
                                <RotateCcw size={20} />
                            </button>
                            <button
                                onClick={nextLevel}
                                className="p-2 border border-gray-800 bg-black/40 backdrop-blur rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            >
                                <FastForward size={20} />
                            </button>
                        </div>
                    </div>

                    {/* TARGET POINTER (Level 1 Only) - Absolute Position */}
                    {currentLevelConfig.id === 1 && (
                        <div className="absolute top-[40%] right-[20%] pointer-events-none flex flex-col items-center gap-1 animate-pulse z-20">
                            <div className="text-yellow-400 font-bold uppercase tracking-widest text-sm drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-yellow-500/30">
                                Target Zone
                            </div>
                            <ArrowDownRight size={48} className="text-yellow-400 drop-shadow-xl" />
                        </div>
                    )}

                    {/* CENTER SCREENS (Start / Success) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                        {!gameState.isPlaying && !gameState.isLevelComplete && gameState.showStartScreen && (
                            <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 p-8 rounded text-center pointer-events-auto shadow-2xl shadow-cyan-900/20 max-w-md select-none">
                                <div className="text-cyan-400 mb-4 animate-pulse"><Terminal size={32} className="mx-auto" /></div>
                                <h2 className="text-sm font-mono text-cyan-200 tracking-widest border-b border-cyan-900 pb-2 mb-4">SYSTEM INTERCEPT</h2>
                                <p className="text-gray-300 mb-6 text-sm font-mono leading-relaxed opacity-80 min-h-[40px] flex items-center justify-center">
                                    "{loreMsg}"
                                </p>
                                <button
                                    onClick={startGame}
                                    className="group relative flex items-center justify-center gap-2 mx-auto px-8 py-2.5 bg-cyan-900/40 hover:bg-cyan-500/20 rounded-sm transition-all border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 font-mono tracking-widest text-xs overflow-hidden"
                                >
                                    <span className="relative z-10">INITIATE PROTOCOL</span>
                                    <div className="absolute inset-0 bg-cyan-500/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                </button>
                            </div>
                        )}

                        {gameState.isLevelComplete && (
                            <div className="bg-black/90 backdrop-blur-xl border border-green-500/50 p-8 rounded text-center pointer-events-auto animate-in fade-in zoom-in duration-300 max-w-md select-none shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                                <h2 className="text-xl font-mono text-green-500 uppercase tracking-widest mb-2">Session Complete</h2>
                                <div className="font-mono text-green-300 mb-6 text-sm typing-effect">
                                    &gt; {completionMsg}
                                </div>
                                <button
                                    onClick={nextLevel}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-900/20 text-green-400 hover:bg-green-500 hover:text-black border border-green-500 transition-all font-mono uppercase tracking-widest text-sm"
                                >
                                    Next Level <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </div >
    );
};

export default App;