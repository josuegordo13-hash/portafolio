import { useEffect, useRef, useState } from 'react';

const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080;

const SRC_TITULO = { x: 344, y: 238, w: 850, h: 510 };
const SRC_LIFE = { x: 196, y: 98, w: 620, h: 770 };
const SRC_BTN_NEWGAME = [
    { x: 34, y: 122, w: 704, h: 292 },
    { x: 768 + 24, y: 122, w: 706, h: 294 }
];
const SRC_BTN_CONTINUE = [
    { x: 34, y: 154, w: 706, h: 292 },
    { x: 768 + 22, y: 154, w: 712, h: 295 }
];
const SRC_BTN_OPTIONS = [
    { x: 212, y: 336, w: 1156, h: 368 },
    { x: 1500 + 61, y: 323, w: 1166, h: 384 }
];
const SRC_BTN_QUIT = [
    { x: 222, y: 303, w: 1190, h: 368 },
    { x: 1500 + 102, y: 301, w: 1208, h: 369 }
];

const ASSET_BASE = '/games/gameover/assets/';

const IMAGE_MANIFEST = {
    bgLevel1: 'fondo_A.png',
    bgLevel2: 'nivel2.png',
    bullet: 'disparo.png',
    meteor: 'meteorito.png',
    life: 'robotvida.png',
    explosion: 'explosiont.png',
    titulo: 'titulo.png',
    options: 'options.png',
    quit: 'quit.png',
    newGame: 'new game.png',
    continueTex: 'continue.png',
    shipIdle: 'nave_idle.png',
    shipRight: 'nave_derecha.png',
    shipLeft: 'nave_izquierda.png',
    boss1: 'boss1.png',
    boss2: 'boss2.png',
    bossDeath: 'muerteboss.png',
    bossBar: 'barravida.png',
    beam: 'rayo.png',
    bossAttack: 'ataqueboss.png',
    dragon: 'dragon.png',
    transform: 'trasformacion.png',
    enemyMove: 'anemigomovimiento.png',
    enemyAttack: 'enemigoataque.png',
    enemyDeath: 'enemigomuerte.png',
    fireBtn: 'botondisparo.png',
    transformBtn: 'botontrans.png'
};

const AUDIO_MANIFEST = {
    shoot: 'sfx_disparo.wav',
    explosion: 'sfx_explosion.wav',
    selection: 'seleccion.wav',
    damage: 'danio.wav',
    transformToDragon: 'sonido_transformacion.wav',
    transformToShip: 'transformacionnave.wav',
    bossFire: 'sonidoboss.wav',
    bossCrash: 'terremoto.wav',
    menuMusic: 'menu.ogg',
    gameMusic: 'Space Shooter.ogg',
    bossMusic: 'musicaboss.ogg'
};

export function GameOverCanvas({
    playerName = 'PILOTO',
    initialProfile = null,
    onSaveProgress,
    onSubmitArcadeScore,
    onExitToCatalog
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFsHint, setShowFsHint] = useState(false);
    const fsHintTimerRef = useRef(null);
    const [touchMode, setTouchMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 920;
    });

    const callbacksRef = useRef({ onSaveProgress, onSubmitArcadeScore, onExitToCatalog });
    const initialProfileRef = useRef(initialProfile);
    const playerNameRef = useRef(playerName);
    const isFullscreenRef = useRef(isFullscreen);
    useEffect(() => {
        callbacksRef.current = { onSaveProgress, onSubmitArcadeScore, onExitToCatalog };
        initialProfileRef.current = initialProfile;
        playerNameRef.current = playerName;
        isFullscreenRef.current = isFullscreen;
    }, [onSaveProgress, onSubmitArcadeScore, onExitToCatalog, initialProfile, playerName, isFullscreen]);

    const enterFullscreen = async () => {
        setIsFullscreen(true);
        setShowFsHint(true);
        if (fsHintTimerRef.current) clearTimeout(fsHintTimerRef.current);
        fsHintTimerRef.current = setTimeout(() => {
            setShowFsHint(false);
        }, 1100);

        const el = containerRef.current;
        if (!el) return;
        try {
            if (!document.fullscreenElement && el.requestFullscreen) {
                await el.requestFullscreen({ navigationUI: 'hide' });
            }
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        } catch {
            // En iOS Safari o navegadores sin Fullscreen API nativa, se mantiene el modo pantalla completa CSS (isFullscreen = true)
        }
    };

    const exitFullscreen = async () => {
        setIsFullscreen(false);
        setShowFsHint(false);
        if (fsHintTimerRef.current) clearTimeout(fsHintTimerRef.current);
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                await document.exitFullscreen();
            }
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        } catch {}
    };

    const toggleFullscreen = () => {
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    };

    useEffect(() => {
        const onFsChange = () => {
            if (!document.fullscreenElement) {
                // Solo desactivar automáticamente si salió con tecla ESC del navegador nativo
                setIsFullscreen(false);
            } else {
                setIsFullscreen(true);
            }
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const images = {};
        const audios = {};

        // Cargar fuente pixel-art ThaleahFat
        const fontFace = new FontFace('ThaleahFatGame', `url("${ASSET_BASE}ThaleahFat.ttf")`);
        fontFace.load().then((loaded) => {
            document.fonts.add(loaded);
        }).catch(() => {});

        const imgKeys = Object.keys(IMAGE_MANIFEST);
        const totalAssets = imgKeys.length;
        let loadedCount = 0;

        const checkDone = () => {
            loadedCount++;
            if (!cancelled) {
                setLoadingProgress(Math.min(100, Math.round((loadedCount / totalAssets) * 100)));
                if (loadedCount >= totalAssets) {
                    setIsLoaded(true);
                }
            }
        };

        imgKeys.forEach((key) => {
            const img = new Image();
            img.onload = checkDone;
            img.onerror = checkDone;
            img.src = ASSET_BASE + encodeURI(IMAGE_MANIFEST[key]);
            images[key] = img;
        });

        Object.keys(AUDIO_MANIFEST).forEach((key) => {
            const audio = new Audio(ASSET_BASE + encodeURI(AUDIO_MANIFEST[key]));
            audio.preload = 'auto';
            audios[key] = audio;
        });

        // Guardar referencias para el loop del juego
        const canvas = canvasRef.current;
        if (canvas) {
            canvas._gameAssets = { images, audios };
        }

        return () => {
            cancelled = true;
            Object.values(audios).forEach((a) => {
                try {
                    a.pause();
                    a.src = '';
                } catch {}
            });
        };
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const canvas = canvasRef.current;
        if (!canvas || !canvas._gameAssets) return;
        const ctx = canvas.getContext('2d');
        const { images, audios } = canvas._gameAssets;

        // Estado completo del juego (port 1:1 de Game1.cs + controles táctiles móviles)
        const G = {
            state: 'MENU', // MENU, CONFIG, PLAY
            paused: false,
            pauseIndex: 0,
            pauseOptions: ['CONTINUAR', 'GUARDAR Y SALIR AL MENU'],
            gameOver: false,
            win: false,
            globalTime: 0,

            bgScroll: 0,
            bgScrollSpeed: 95,
            musicVolume: 0.85,
            sfxVolume: 0.9,
            currentMusicKey: null,
            audioUnlocked: false,

            shipW: 140,
            shipH: 200,
            dragonW: 215,
            dragonH: 225,
            shipPosition: { x: VIRTUAL_WIDTH / 2 - 70, y: VIRTUAL_HEIGHT - 245 },
            shipSpeed: 12,
            defaultShipSpeed: 12,
            shipFrame: 0,
            shipFrameTimer: 0,
            shipTilt: 0,
            currentShipKey: 'shipIdle',

            isDragon: false,
            level2: false,
            arcadeMode: false,
            bossFrameCount: 60,
            level1Completed: Boolean(initialProfileRef.current?.level1Completed),
            highScore: Number(initialProfileRef.current?.highScore || 0),
            showLevelSelect: false,
            levelSelectIndex: 0,

            beamFiring: false,
            beamAngle: -Math.PI / 2,
            beamLength: 0,
            beamTimer: 0,
            beamChargeTimer: 0,
            beamDamageTimer: 0,

            damageFlashTimer: 0,
            isTransforming: false,
            transformFrame: 0,
            transformTimer: 0,
            transformCooldown: 0,

            enemyDrawW: 145,
            enemyDrawH: 135,
            enemies: [],
            enemyDashTrails: [],
            enemySpawnTimer: 0,

            bullets: [],
            canShoot: true,
            shootCooldownTimer: 0,
            bulletDrawW: 48,
            bulletDrawH: 72,

            fireballs: [],
            fireballAge: 0,
            fireballDrawW: 92,
            fireballDrawH: 134,

            meteors: [],
            meteorFrame: 0,
            meteorFrameTimer: 0,
            meteorMinSpeed: 6.5,
            meteorMaxSpeed: 10.5,
            defaultMetMin: 6.5,
            defaultMetMax: 10.5,
            spawnTimer: 0,
            meteorW: 130,
            meteorH: 176,

            vidas: 3,
            puntos: 0,
            bossPuntos: 100,

            bossActive: false,
            bossHealth: 10,
            bossPhase2: false,
            bossAppearTimer: 0,
            bossPosition: { x: 800, y: 45 },
            bossFrame: 0,
            bossFrameTimer: 0,
            bossState: 'MOVING', // MOVING, DASHING, ATTACKING, CRASHING
            bossDir: 1,
            bossSpeed: 8.5,
            bossActionTimer: 0,
            bossSpeedBurst: 1,
            bossDashTimer: 0,
            bossDashTarget: { x: 0, y: 0 },
            bossDashDir: { x: 0, y: 1 },
            bossDashOrigin: { x: 0, y: 0 },
            bossAttackCooldown: 0,
            bossCrashCooldown: 0,
            bossTrailTimer: 0,
            dashTrails: [],
            hMeteors: [],

            bossDeathActive: false,
            bossDeathFrame: 0,
            bossDeathTimer: 0,

            explosions: [],
            particles: [],
            stars: [],

            shakeTimer: 0,
            shakeIntensity: 0,
            shakeOffset: { x: 0, y: 0 },

            menuItems: ['NEW GAME', 'CONTINUE', 'OPTIONS', 'QUIT'],
            menuIndex: 0,
            configItems: [
                'Velocidad nave',
                'Velocidad meteoritos (min)',
                'Velocidad meteoritos (max)',
                'Volumen musica',
                'Volumen efectos',
                'Controles tactiles (Movil)',
                'RESTABLECER VALORES',
                'VOLVER AL MENU'
            ],
            configIndex: 0,
            showTouchControls: ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 920,

            // Input states
            keys: {},
            prevKeys: {},
            mouse: { x: VIRTUAL_WIDTH / 2, y: 200, down: false, prevDown: false, moved: false },

            // Touch state (Mobile)
            joystick: {
                active: false,
                touchId: null,
                baseX: 230,
                baseY: VIRTUAL_HEIGHT - 230,
                curX: 230,
                curY: VIRTUAL_HEIGHT - 230,
                dx: 0,
                dy: 0,
                radius: 135
            },
            // Joystick exclusivo para apuntar y disparar el Rayo Solar cuando estás en modo Dragón
            beamJoystick: {
                active: false,
                hasMoved: false,
                touchId: null,
                baseX: VIRTUAL_WIDTH - 245,
                baseY: VIRTUAL_HEIGHT - 230,
                curX: VIRTUAL_WIDTH - 245,
                curY: VIRTUAL_HEIGHT - 230,
                dx: 0,
                dy: 0,
                radius: 135
            },
            touchButtons: {
                fire: { x: VIRTUAL_WIDTH - 235, y: VIRTUAL_HEIGHT - 220, r: 115, pressed: false, tapQueued: false },
                transform: { x: VIRTUAL_WIDTH - 485, y: VIRTUAL_HEIGHT - 165, r: 82, pressed: false },
                pause: { x: VIRTUAL_WIDTH - 95, y: 125, r: 54, pressed: false }
            },
            scoreSubmittedForRun: false
        };

        // Inicializar estrellas parallax
        const starPalette = ['#b4dcff', '#fff0c8', '#8cb4ff', '#dca0ff'];
        for (let i = 0; i < 90; i++) {
            const layer = i % 3;
            G.stars.push({
                x: Math.random() * VIRTUAL_WIDTH,
                y: Math.random() * VIRTUAL_HEIGHT,
                speed: 35 + layer * 55 + Math.random() * 25,
                size: layer === 2 ? 4 : layer === 1 ? 3 : 2,
                color: starPalette[i % starPalette.length],
                alpha: 0.35 + layer * 0.22,
                phase: Math.random() * Math.PI * 2
            });
        }

        const unlockAudio = () => {
            if (G.audioUnlocked) return;
            G.audioUnlocked = true;
            if (G.currentMusicKey && audios[G.currentMusicKey]) {
                const m = audios[G.currentMusicKey];
                m.loop = true;
                m.volume = G.musicVolume * 0.65;
                m.play().catch(() => {});
            }
        };

        const playSfx = (key, volScale = 1) => {
            const base = audios[key];
            if (!base || G.sfxVolume <= 0.01) return;
            try {
                const clone = base.cloneNode();
                clone.volume = Math.min(1, G.sfxVolume * volScale);
                clone.play().catch(() => {});
            } catch {}
        };

        const playMusic = (key) => {
            if (G.currentMusicKey === key) return;
            if (G.currentMusicKey && audios[G.currentMusicKey]) {
                try {
                    audios[G.currentMusicKey].pause();
                    audios[G.currentMusicKey].currentTime = 0;
                } catch {}
            }
            G.currentMusicKey = key;
            const m = audios[key];
            if (m && G.audioUnlocked) {
                m.loop = true;
                m.volume = G.musicVolume * 0.65;
                m.play().catch(() => {});
            }
        };

        const updateMusicVolume = () => {
            if (G.currentMusicKey && audios[G.currentMusicKey]) {
                audios[G.currentMusicKey].volume = G.musicVolume * 0.65;
            }
        };

        playMusic('menuMusic');

        const clientToVirtual = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const vx = ((clientX - rect.left) / Math.max(1, rect.width)) * VIRTUAL_WIDTH;
            const vy = ((clientY - rect.top) / Math.max(1, rect.height)) * VIRTUAL_HEIGHT;
            return {
                x: Math.max(0, Math.min(VIRTUAL_WIDTH, vx)),
                y: Math.max(0, Math.min(VIRTUAL_HEIGHT, vy))
            };
        };

        const onKeyDown = (e) => {
            unlockAudio();
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
                e.preventDefault();
            }
            G.keys[e.code] = true;
        };

        const onKeyUp = (e) => {
            G.keys[e.code] = false;
        };

        const onMouseMove = (e) => {
            if (G.showTouchControls && G.state === 'PLAY' && !G.paused && !G.gameOver) return;
            const pt = clientToVirtual(e.clientX, e.clientY);
            G.mouse.x = pt.x;
            G.mouse.y = pt.y;
            G.mouse.moved = true;
        };

        const onMouseDown = (e) => {
            unlockAudio();
            if (G.showTouchControls && G.state === 'PLAY' && !G.paused && !G.gameOver) return;
            if (e.button === 0) {
                const pt = clientToVirtual(e.clientX, e.clientY);
                G.mouse.x = pt.x;
                G.mouse.y = pt.y;
                G.mouse.down = true;
            }
        };

        const onMouseUp = (e) => {
            if (e.button === 0) {
                G.mouse.down = false;
            }
        };

        // Manejo multitáctil completo para teléfonos móviles
        const handleTouches = (e) => {
            unlockAudio();
            if (e.cancelable) e.preventDefault();
            G.showTouchControls = true;
            setTouchMode(true);

            const touches = Array.from(e.touches).map((t) => ({
                id: t.identifier,
                ...clientToVirtual(t.clientX, t.clientY)
            }));

            const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

            // En menús, pausa o fin de juego: mapear primer toque a clic virtual
            if (G.state !== 'PLAY' || G.paused || G.gameOver) {
                if (touches.length > 0) {
                    G.mouse.x = touches[0].x;
                    G.mouse.y = touches[0].y;
                    G.mouse.moved = true;
                    G.mouse.down = true;
                } else {
                    G.mouse.down = false;
                }
                return;
            }

            // En modo PLAY móvil, asegurar que el clic virtual del menú nunca quede pegado en true
            G.mouse.down = false;
            G.mouse.prevDown = false;

            // Si es un touchstart sobre el botón de disparo en modo Nave, encolar disparo instantáneo
            if (e.type === 'touchstart' && !G.isDragon && e.changedTouches) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const ct = clientToVirtual(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                    const onTransform = dist(ct.x, ct.y, G.touchButtons.transform.x, G.touchButtons.transform.y) <= G.touchButtons.transform.r * 1.25;
                    const onPause = dist(ct.x, ct.y, G.touchButtons.pause.x, G.touchButtons.pause.y) <= G.touchButtons.pause.r * 1.3;
                    if (
                        !onTransform &&
                        !onPause &&
                        (dist(ct.x, ct.y, G.touchButtons.fire.x, G.touchButtons.fire.y) <= G.touchButtons.fire.r * 1.45 ||
                            (ct.x > VIRTUAL_WIDTH * 0.68 && ct.y > VIRTUAL_HEIGHT * 0.52))
                    ) {
                        G.touchButtons.fire.tapQueued = true;
                    }
                }
            }

            let joyFound = false;
            let beamJoyFound = false;
            let firePressed = false;
            let transformPressed = false;
            let pausePressed = false;

            for (const t of touches) {
                // 1. Si este dedo ya está controlando el Joystick izquierdo de movimiento, mantenerlo
                if (G.joystick.active && t.id === G.joystick.touchId) {
                    joyFound = true;
                    const dx = t.x - G.joystick.baseX;
                    const dy = t.y - G.joystick.baseY;
                    const d = Math.hypot(dx, dy);
                    const maxR = G.joystick.radius;
                    if (d > maxR) {
                        G.joystick.curX = G.joystick.baseX + (dx / d) * maxR;
                        G.joystick.curY = G.joystick.baseY + (dy / d) * maxR;
                        G.joystick.dx = dx / d;
                        G.joystick.dy = dy / d;
                    } else {
                        G.joystick.curX = t.x;
                        G.joystick.curY = t.y;
                        G.joystick.dx = d > 10 ? dx / maxR : 0;
                        G.joystick.dy = d > 10 ? dy / maxR : 0;
                    }
                    continue;
                }

                // 2. Si este dedo ya está controlando el Joystick derecho del Rayo Solar (en modo Dragón), mantenerlo
                if (G.isDragon && G.beamJoystick.active && t.id === G.beamJoystick.touchId) {
                    beamJoyFound = true;
                    const dx = t.x - G.beamJoystick.baseX;
                    const dy = t.y - G.beamJoystick.baseY;
                    const d = Math.hypot(dx, dy);
                    const maxR = G.beamJoystick.radius;
                    if (d > 12) {
                        G.beamJoystick.hasMoved = true;
                    }
                    if (d > maxR) {
                        G.beamJoystick.curX = G.beamJoystick.baseX + (dx / d) * maxR;
                        G.beamJoystick.curY = G.beamJoystick.baseY + (dy / d) * maxR;
                        G.beamJoystick.dx = dx / d;
                        G.beamJoystick.dy = dy / d;
                    } else {
                        G.beamJoystick.curX = t.x;
                        G.beamJoystick.curY = t.y;
                        G.beamJoystick.dx = d > 8 ? dx / maxR : 0;
                        G.beamJoystick.dy = d > 8 ? dy / maxR : 0;
                    }
                    continue;
                }

                // 3. Botón Pausa
                if (dist(t.x, t.y, G.touchButtons.pause.x, G.touchButtons.pause.y) <= G.touchButtons.pause.r * 1.3) {
                    pausePressed = true;
                    continue;
                }

                // 4. Botón Transformar (E)
                if (dist(t.x, t.y, G.touchButtons.transform.x, G.touchButtons.transform.y) <= G.touchButtons.transform.r * 1.25) {
                    transformPressed = true;
                    continue;
                }

                // 5. En modo Dragón: Joystick derecho exclusivo para disparar y mover el Rayo Solar
                if (
                    G.isDragon &&
                    !G.beamJoystick.active &&
                    (dist(t.x, t.y, G.beamJoystick.baseX, G.beamJoystick.baseY) <= G.beamJoystick.radius * 1.45 ||
                        (t.x > VIRTUAL_WIDTH * 0.55 && t.y > VIRTUAL_HEIGHT * 0.35))
                ) {
                    G.beamJoystick.active = true;
                    G.beamJoystick.touchId = t.id;
                    beamJoyFound = true;
                    const dx = t.x - G.beamJoystick.baseX;
                    const dy = t.y - G.beamJoystick.baseY;
                    const d = Math.hypot(dx, dy);
                    const maxR = G.beamJoystick.radius;
                    G.beamJoystick.hasMoved = d > 12;
                    if (d > maxR) {
                        G.beamJoystick.curX = G.beamJoystick.baseX + (dx / d) * maxR;
                        G.beamJoystick.curY = G.beamJoystick.baseY + (dy / d) * maxR;
                        G.beamJoystick.dx = dx / d;
                        G.beamJoystick.dy = dy / d;
                    } else {
                        G.beamJoystick.curX = t.x;
                        G.beamJoystick.curY = t.y;
                        G.beamJoystick.dx = d > 8 ? dx / maxR : 0;
                        G.beamJoystick.dy = d > 8 ? dy / maxR : 0;
                    }
                    continue;
                }

                // 6. En modo Nave: Botón Disparo normal (derecha abajo)
                if (
                    !G.isDragon &&
                    (dist(t.x, t.y, G.touchButtons.fire.x, G.touchButtons.fire.y) <= G.touchButtons.fire.r * 1.45 ||
                        (t.x > VIRTUAL_WIDTH * 0.68 && t.y > VIRTUAL_HEIGHT * 0.52))
                ) {
                    firePressed = true;
                    continue;
                }

                // 7. Mitad izquierda -> Joystick virtual de movimiento (Nave o Dragón)
                if (!G.joystick.active && t.x < VIRTUAL_WIDTH * 0.48 && t.y > VIRTUAL_HEIGHT * 0.3) {
                    G.joystick.active = true;
                    G.joystick.touchId = t.id;
                    G.joystick.baseX = Math.max(160, Math.min(420, t.x));
                    G.joystick.baseY = Math.max(VIRTUAL_HEIGHT - 380, Math.min(VIRTUAL_HEIGHT - 160, t.y));
                    joyFound = true;
                    const dx = t.x - G.joystick.baseX;
                    const dy = t.y - G.joystick.baseY;
                    const d = Math.hypot(dx, dy);
                    const maxR = G.joystick.radius;
                    if (d > maxR) {
                        G.joystick.curX = G.joystick.baseX + (dx / d) * maxR;
                        G.joystick.curY = G.joystick.baseY + (dy / d) * maxR;
                        G.joystick.dx = dx / d;
                        G.joystick.dy = dy / d;
                    } else {
                        G.joystick.curX = t.x;
                        G.joystick.curY = t.y;
                        G.joystick.dx = d > 10 ? dx / maxR : 0;
                        G.joystick.dy = d > 10 ? dy / maxR : 0;
                    }
                    continue;
                }
            }

            if (!joyFound) {
                G.joystick.active = false;
                G.joystick.touchId = null;
                G.joystick.baseX = 230;
                G.joystick.baseY = VIRTUAL_HEIGHT - 230;
                G.joystick.curX = 230;
                G.joystick.curY = VIRTUAL_HEIGHT - 230;
                G.joystick.dx = 0;
                G.joystick.dy = 0;
            }

            if (!beamJoyFound || !G.isDragon) {
                G.beamJoystick.active = false;
                G.beamJoystick.hasMoved = false;
                G.beamJoystick.touchId = null;
                G.beamJoystick.curX = G.beamJoystick.baseX;
                G.beamJoystick.curY = G.beamJoystick.baseY;
                G.beamJoystick.dx = 0;
                G.beamJoystick.dy = 0;
            }

            // Flanco de subida para botones de toque único (Transformar y Pausa)
            if (pausePressed && !G.touchButtons.pause.pressed) {
                G.paused = !G.paused;
                G.pauseIndex = 0;
            }
            if (transformPressed && !G.touchButtons.transform.pressed && G.transformCooldown <= 0 && !G.isTransforming) {
                G.isTransforming = true;
                G.transformFrame = 0;
                G.transformTimer = 0;
                G.beamFiring = false;
            }

            G.touchButtons.pause.pressed = pausePressed;
            G.touchButtons.transform.pressed = transformPressed;
            G.touchButtons.fire.pressed = firePressed;
        };

        window.addEventListener('keydown', onKeyDown, { passive: false });
        window.addEventListener('keyup', onKeyUp);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('touchstart', handleTouches, { passive: false });
        canvas.addEventListener('touchmove', handleTouches, { passive: false });
        canvas.addEventListener('touchend', handleTouches, { passive: false });
        canvas.addEventListener('touchcancel', handleTouches, { passive: false });

        const wasPressed = (code) => Boolean(G.keys[code] && !G.prevKeys[code]);
        const getShipCenter = () => ({
            x: G.shipPosition.x + G.shipW / 2,
            y: G.shipPosition.y + G.shipH / 2
        });
        const getActiveCraftRect = () => {
            const c = getShipCenter();
            const w = G.isDragon ? G.dragonW : G.shipW;
            const h = G.isDragon ? G.dragonH : G.shipH;
            return { x: c.x - w / 2, y: c.y - h / 2, w, h };
        };
        const getDragonMouthPos = () => {
            const r = getActiveCraftRect();
            return { x: r.x + r.w / 2, y: r.y + r.h * 0.14 };
        };
        const getBossSize = () => ({
            w: G.level2 ? 360 : 320,
            h: G.level2 ? 348 : 294
        });

        const getMaxBeamDistanceInScreen = (origin, angle) => {
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            let maxT = 640;
            const margin = 28;
            if (cosA > 0.001) maxT = Math.min(maxT, (VIRTUAL_WIDTH - margin - origin.x) / cosA);
            else if (cosA < -0.001) maxT = Math.min(maxT, (margin - origin.x) / cosA);

            if (sinA > 0.001) maxT = Math.min(maxT, (VIRTUAL_HEIGHT - margin - origin.y) / sinA);
            else if (sinA < -0.001) maxT = Math.min(maxT, (margin - origin.y) / sinA);
            return Math.max(85, maxT);
        };

        const triggerShake = (duration, intensity) => {
            if (intensity >= G.shakeIntensity || G.shakeTimer <= 0) {
                G.shakeTimer = Math.max(G.shakeTimer, duration);
                G.shakeIntensity = intensity;
            }
        };

        const spawnParticles = (x, y, c1, c2, count, minSpd = 60, maxSpd = 320, minSz = 4, maxSz = 9, life = 0.45) => {
            for (let i = 0; i < count; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = minSpd + Math.random() * (maxSpd - minSpd);
                const l = life * (0.65 + Math.random() * 0.5);
                G.particles.push({
                    x,
                    y,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    color: Math.random() < 0.5 ? c1 : c2,
                    life: l,
                    maxLife: l,
                    size: Math.floor(minSz + Math.random() * (maxSz - minSz + 1))
                });
            }
        };

        const spawnExplosion = (x, y, scale = 0.55) => {
            G.explosions.push({ x, y, frame: 0, timer: 0, scale, finished: false });
            spawnParticles(x, y, '#ffbe3c', '#ff501e', 16, 80, 360, 4, 8, 0.42);
        };

        const resetShipPosition = () => {
            G.shipPosition.x = VIRTUAL_WIDTH / 2 - G.shipW / 2;
            G.shipPosition.y = VIRTUAL_HEIGHT - G.shipH - 45;
        };

        const resetGameState = () => {
            G.puntos = 0;
            G.vidas = 3;
            G.bossPuntos = 100;
            G.bullets = [];
            G.meteors = [];
            G.explosions = [];
            G.particles = [];
            G.spawnTimer = 0;
            G.gameOver = false;
            G.win = false;
            G.paused = false;
            G.bossActive = false;
            G.bossPhase2 = false;
            G.bossHealth = 10;
            G.bossDeathActive = false;
            G.bossDeathFrame = 0;
            G.bossDeathTimer = 0;
            G.bossFrame = 0;
            G.bossFrameTimer = 0;
            G.bossState = 'MOVING';
            G.fireballs = [];
            G.hMeteors = [];
            G.enemies = [];
            G.enemyDashTrails = [];
            G.dashTrails = [];
            G.enemySpawnTimer = 0;
            G.isDragon = false;
            G.beamFiring = false;
            G.beamJoystick.active = false;
            G.beamJoystick.hasMoved = false;
            G.mouse.down = false;
            G.mouse.prevDown = false;
            G.isTransforming = false;
            G.transformCooldown = 0;
            G.shakeTimer = 0;
            G.currentShipKey = 'shipIdle';
            G.scoreSubmittedForRun = false;
            resetShipPosition();
            playMusic('gameMusic');
        };

        const startGame = () => {
            resetGameState();
            G.bgScroll = 0;
            G.state = 'PLAY';
        };

        const notifyProgressSave = (extra = {}) => {
            if (G.puntos > G.highScore) {
                G.highScore = G.puntos;
            }
            if (callbacksRef.current.onSaveProgress) {
                callbacksRef.current.onSaveProgress({
                    level1Completed: G.level1Completed,
                    highScore: G.highScore,
                    score: Math.max(G.puntos, extra.score || 0),
                    lastLevel: G.level2 ? 2 : 1,
                    ...extra
                });
            }
        };

        const notifyEndOfRun = () => {
            if (G.scoreSubmittedForRun) return;
            G.scoreSubmittedForRun = true;
            if (G.puntos > G.highScore) {
                G.highScore = G.puntos;
            }
            notifyProgressSave({ score: G.puntos, highScore: G.highScore });
        };

        const applyPlayerDamage = () => {
            if (G.damageFlashTimer > 0) return;
            G.vidas--;
            G.damageFlashTimer = 0.25;
            playSfx('damage', 1);
            triggerShake(0.28, 11);
            const c = getShipCenter();
            spawnParticles(c.x, c.y, '#ff4646', '#ffc850', 20, 90, 340, 5, 9, 0.45);
            if (G.vidas <= 0) {
                G.gameOver = true;
                notifyEndOfRun();
            }
        };

        const checkBossDefeated = () => {
            if (G.bossHealth <= 0) {
                if (G.bossPhase2) {
                    G.bossDeathActive = true;
                    G.bossDeathFrame = 0;
                    G.bossDeathTimer = 0;
                    G.bossActive = false;
                    triggerShake(0.6, 14);
                } else {
                    G.bossPhase2 = true;
                    G.bossHealth = 10;
                    triggerShake(0.35, 10);
                    const bs = getBossSize();
                    spawnParticles(G.bossPosition.x + bs.w / 2, G.bossPosition.y + bs.h / 2, '#ff5a1e', '#ffd23c', 28, 100, 380, 5, 10, 0.55);
                }
            }
        };

        const rectsIntersect = (a, b) =>
            a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

        const executeLevelSelect = (idx) => {
            if (idx === 0) {
                G.level2 = false;
                G.arcadeMode = false;
                startGame();
            } else if (idx === 1) {
                if (G.level1Completed) {
                    G.level2 = true;
                    G.arcadeMode = false;
                    startGame();
                }
            } else if (idx === 2) {
                G.arcadeMode = true;
                G.level2 = false;
                startGame();
            } else if (idx === 3) {
                G.showLevelSelect = false;
            }
        };

        const executeMainMenu = (idx) => {
            const item = G.menuItems[idx];
            if (item === 'NEW GAME') {
                G.level2 = false;
                G.arcadeMode = false;
                startGame();
            } else if (item === 'CONTINUE') {
                G.showLevelSelect = true;
                G.levelSelectIndex = 0;
            } else if (item === 'OPTIONS') {
                G.state = 'CONFIG';
                G.configIndex = 0;
            } else if (item === 'QUIT') {
                if (G.puntos > 0 || G.highScore > 0) {
                    notifyProgressSave({ score: Math.max(G.puntos, G.highScore) });
                }
                if (callbacksRef.current.onExitToCatalog) {
                    callbacksRef.current.onExitToCatalog();
                }
            }
        };

        const updateMenu = () => {
            const mouseClicked = G.mouse.down && !G.mouse.prevDown;

            if (G.showLevelSelect) {
                if (wasPressed('KeyW') || wasPressed('ArrowUp')) {
                    G.levelSelectIndex = (G.levelSelectIndex + 3) % 4;
                    playSfx('selection', 0.8);
                } else if (wasPressed('KeyS') || wasPressed('ArrowDown')) {
                    G.levelSelectIndex = (G.levelSelectIndex + 1) % 4;
                    playSfx('selection', 0.8);
                } else if (wasPressed('Enter') || wasPressed('Space')) {
                    executeLevelSelect(G.levelSelectIndex);
                    return;
                } else if (wasPressed('Escape')) {
                    G.showLevelSelect = false;
                    return;
                }

                for (let i = 0; i < 4; i++) {
                    const r = { x: VIRTUAL_WIDTH / 2 - 280, y: VIRTUAL_HEIGHT / 2 - 95 + i * 105, w: 560, h: 85 };
                    if (G.mouse.x >= r.x && G.mouse.x <= r.x + r.w && G.mouse.y >= r.y && G.mouse.y <= r.y + r.h) {
                        if (G.mouse.moved && G.levelSelectIndex !== i) {
                            G.levelSelectIndex = i;
                            playSfx('selection', 0.8);
                        }
                        if (mouseClicked) {
                            executeLevelSelect(i);
                            return;
                        }
                    }
                }
                return;
            }

            if (wasPressed('KeyW') || wasPressed('ArrowUp')) {
                G.menuIndex = (G.menuIndex + G.menuItems.length - 1) % G.menuItems.length;
                playSfx('selection', 0.8);
            } else if (wasPressed('KeyS') || wasPressed('ArrowDown')) {
                G.menuIndex = (G.menuIndex + 1) % G.menuItems.length;
                playSfx('selection', 0.8);
            } else if (wasPressed('Enter') || wasPressed('Space')) {
                executeMainMenu(G.menuIndex);
                return;
            }

            const btnW = 430;
            const btnH = 126;
            const spacing = 22;
            const startY = 430;
            const btnX = (VIRTUAL_WIDTH - btnW) / 2;

            for (let i = 0; i < G.menuItems.length; i++) {
                const btnY = startY + i * (btnH + spacing);
                if (G.mouse.x >= btnX && G.mouse.x <= btnX + btnW && G.mouse.y >= btnY && G.mouse.y <= btnY + btnH) {
                    if (G.mouse.moved && G.menuIndex !== i) {
                        G.menuIndex = i;
                        playSfx('selection', 0.8);
                    }
                    if (mouseClicked) {
                        executeMainMenu(i);
                        return;
                    }
                }
            }
        };

        const applyConfigDelta = (idx, delta) => {
            if (idx === 0) G.shipSpeed = Math.max(4, Math.min(22, G.shipSpeed + delta));
            else if (idx === 1) G.meteorMinSpeed = Math.max(2, Math.min(G.meteorMaxSpeed, G.meteorMinSpeed + delta * 0.5));
            else if (idx === 2) G.meteorMaxSpeed = Math.max(G.meteorMinSpeed, Math.min(18, G.meteorMaxSpeed + delta * 0.5));
            else if (idx === 3) {
                G.musicVolume = Math.max(0, Math.min(1, G.musicVolume + delta * 0.05));
                updateMusicVolume();
            } else if (idx === 4) {
                G.sfxVolume = Math.max(0, Math.min(1, G.sfxVolume + delta * 0.05));
            } else if (idx === 5) {
                G.showTouchControls = !G.showTouchControls;
                setTouchMode(G.showTouchControls);
            } else if (idx === 6) {
                G.shipSpeed = G.defaultShipSpeed;
                G.meteorMinSpeed = G.defaultMetMin;
                G.meteorMaxSpeed = G.defaultMetMax;
                G.musicVolume = 0.85;
                G.sfxVolume = 0.9;
                updateMusicVolume();
            } else if (idx === 7) {
                G.state = 'MENU';
            }
        };

        const updateConfig = () => {
            const mouseClicked = G.mouse.down && !G.mouse.prevDown;
            if (wasPressed('Escape')) {
                G.state = 'MENU';
                return;
            }
            if (wasPressed('KeyW') || wasPressed('ArrowUp')) {
                G.configIndex = (G.configIndex + G.configItems.length - 1) % G.configItems.length;
                playSfx('selection', 0.8);
            } else if (wasPressed('KeyS') || wasPressed('ArrowDown')) {
                G.configIndex = (G.configIndex + 1) % G.configItems.length;
                playSfx('selection', 0.8);
            } else if (wasPressed('ArrowLeft') || wasPressed('KeyA')) {
                applyConfigDelta(G.configIndex, -1);
            } else if (wasPressed('ArrowRight') || wasPressed('KeyD')) {
                applyConfigDelta(G.configIndex, 1);
            } else if (wasPressed('Enter') || wasPressed('Space')) {
                if (G.configIndex >= 5) applyConfigDelta(G.configIndex, 1);
            }

            if (mouseClicked) {
                for (let i = 0; i < G.configItems.length; i++) {
                    const rowY = 205 + i * 92;
                    if (G.mouse.y >= rowY - 35 && G.mouse.y <= rowY + 35 && G.mouse.x >= VIRTUAL_WIDTH / 2 - 420 && G.mouse.x <= VIRTUAL_WIDTH / 2 + 420) {
                        G.configIndex = i;
                        if (i < 5) {
                            const delta = G.mouse.x < VIRTUAL_WIDTH / 2 ? -1 : 1;
                            applyConfigDelta(i, delta);
                        } else {
                            applyConfigDelta(i, 1);
                        }
                        break;
                    }
                }
            }
        };

        const updatePlay = (dt) => {
            const mouseClicked = G.mouse.down && !G.mouse.prevDown;

            if (G.gameOver) {
                if (wasPressed('Enter') || wasPressed('Space')) {
                    if (G.win && !G.level2) {
                        G.level2 = true;
                        startGame();
                    } else if (G.arcadeMode) {
                        G.arcadeMode = true;
                        G.level2 = false;
                        startGame();
                    } else {
                        resetGameState();
                    }
                    return;
                } else if (wasPressed('KeyM') || wasPressed('Escape')) {
                    G.state = 'MENU';
                    playMusic('menuMusic');
                    return;
                }

                if (mouseClicked) {
                    if (G.mouse.y >= VIRTUAL_HEIGHT / 2 + 10 && G.mouse.y <= VIRTUAL_HEIGHT / 2 + 95) {
                        if (G.win && !G.level2) {
                            G.level2 = true;
                            startGame();
                        } else if (G.arcadeMode) {
                            G.arcadeMode = true;
                            G.level2 = false;
                            startGame();
                        } else {
                            resetGameState();
                        }
                    } else if (G.mouse.y > VIRTUAL_HEIGHT / 2 + 95 && G.mouse.y <= VIRTUAL_HEIGHT / 2 + 190) {
                        G.state = 'MENU';
                        playMusic('menuMusic');
                    }
                }
                return;
            }

            if (wasPressed('KeyP')) {
                G.puntos = 99;
            }

            if (wasPressed('KeyN') && !G.arcadeMode) {
                G.level2 = !G.level2;
                G.bgScroll = 0;
            }

            if (wasPressed('Tab')) {
                G.paused = !G.paused;
                G.pauseIndex = 0;
            }

            if (G.paused) {
                if (wasPressed('KeyW') || wasPressed('ArrowUp') || wasPressed('KeyS') || wasPressed('ArrowDown')) {
                    G.pauseIndex = (G.pauseIndex + 1) % 2;
                    playSfx('selection', 0.8);
                } else if (wasPressed('Enter') || wasPressed('Space')) {
                    if (G.pauseIndex === 0) {
                        G.paused = false;
                    } else {
                        notifyProgressSave();
                        G.paused = false;
                        G.state = 'MENU';
                        playMusic('menuMusic');
                    }
                }
                if (mouseClicked) {
                    for (let pi = 0; pi < 2; pi++) {
                        const py = VIRTUAL_HEIGHT / 2 - 40 + pi * 85;
                        if (G.mouse.y >= py - 35 && G.mouse.y <= py + 45 && Math.abs(G.mouse.x - VIRTUAL_WIDTH / 2) <= 280) {
                            if (pi === 0) {
                                G.paused = false;
                            } else {
                                notifyProgressSave();
                                G.paused = false;
                                G.state = 'MENU';
                                playMusic('menuMusic');
                            }
                        }
                    }
                }
                return;
            }

            // Movimiento (Teclado + Joystick Móvil)
            let moveX = 0;
            let moveY = 0;
            if (G.keys['KeyA'] || G.keys['ArrowLeft']) moveX -= 1;
            if (G.keys['KeyD'] || G.keys['ArrowRight']) moveX += 1;
            if (G.keys['KeyW'] || G.keys['ArrowUp']) moveY -= 1;
            if (G.keys['KeyS'] || G.keys['ArrowDown']) moveY += 1;

            if (G.joystick.active) {
                moveX += G.joystick.dx;
                moveY += G.joystick.dy;
            }

            moveX = Math.max(-1, Math.min(1, moveX));
            moveY = Math.max(-1, Math.min(1, moveY));

            G.shipPosition.x += moveX * G.shipSpeed * 60 * dt;
            G.shipPosition.y += moveY * G.shipSpeed * 60 * dt;

            let targetTilt = 0;
            if (moveX < -0.15) {
                if (!G.isDragon) G.currentShipKey = 'shipLeft';
                targetTilt = -0.10;
            } else if (moveX > 0.15) {
                if (!G.isDragon) G.currentShipKey = 'shipRight';
                targetTilt = 0.10;
            } else {
                if (!G.isDragon) G.currentShipKey = 'shipIdle';
            }

            G.shipTilt += (targetTilt - G.shipTilt) * Math.min(1, dt * 12);
            G.shipPosition.x = Math.max(20, Math.min(VIRTUAL_WIDTH - G.shipW - 20, G.shipPosition.x));
            G.shipPosition.y = Math.max(60, Math.min(VIRTUAL_HEIGHT - G.shipH - 15, G.shipPosition.y));

            // Partículas de propulsor
            if (Math.random() < 0.65) {
                const c = getShipCenter();
                const exhaustY = c.y + (G.isDragon ? G.dragonH * 0.42 : G.shipH * 0.44);
                G.particles.push({
                    x: c.x + (Math.random() * 20 - 10),
                    y: exhaustY,
                    vx: Math.random() * 50 - 25,
                    vy: 140 + Math.random() * 90,
                    color: G.isDragon ? '#50b4ff' : '#5adcff',
                    life: 0.22,
                    maxLife: 0.22,
                    size: Math.floor(4 + Math.random() * 3)
                });
            }

            G.shipFrameTimer += dt;
            if (G.shipFrameTimer >= 0.10) {
                G.shipFrameTimer = 0;
                G.shipFrame = (G.shipFrame + 1) % (G.isDragon ? 5 : 4);
            }

            if (G.transformCooldown > 0) G.transformCooldown -= dt;
            if (G.damageFlashTimer > 0) G.damageFlashTimer -= dt;
            if (G.shootCooldownTimer > 0) G.shootCooldownTimer -= dt;

            // Transformación Nave <-> Dragón
            if (G.isTransforming) {
                const totalFrames = 12;
                G.transformTimer += dt;
                if (G.transformTimer >= 0.065) {
                    G.transformTimer = 0;
                    G.transformFrame++;
                    if (G.transformFrame === 8) {
                        G.isDragon = !G.isDragon;
                        const c = getShipCenter();
                        if (G.isDragon) {
                            G.currentShipKey = 'dragon';
                            playSfx('transformToDragon', 1);
                            spawnParticles(c.x, c.y, '#64dcff', '#ffd25a', 22, 90, 340, 5, 9, 0.45);
                        } else {
                            G.currentShipKey = 'shipIdle';
                            playSfx('transformToShip', 1);
                            G.beamFiring = false;
                            spawnParticles(c.x, c.y, '#78c8ff', '#ffffff', 16, 70, 260, 4, 8, 0.35);
                        }
                        G.shipFrame = 0;
                        G.shipFrameTimer = 0;
                    } else if (G.transformFrame >= totalFrames) {
                        G.isTransforming = false;
                        G.transformCooldown = 2.0;
                    }
                }
            } else if (wasPressed('KeyE') && G.transformCooldown <= 0) {
                G.isTransforming = true;
                G.transformFrame = 0;
                G.transformTimer = 0;
                G.beamFiring = false;
            }

            // Rayo Solar del Dragón (Mouse en PC + Joystick Exclusivo en Móvil, solo dispara al mover el joystick)
            if (G.isDragon && !G.isTransforming) {
                const wasFiring = G.beamFiring;
                const wantsBeam = G.showTouchControls
                    ? G.beamJoystick.active && G.beamJoystick.hasMoved
                    : G.mouse.down || (G.beamJoystick.active && G.beamJoystick.hasMoved);

                G.beamFiring = wantsBeam;
                if (G.beamFiring) {
                    if (!wasFiring) G.beamChargeTimer = 0;
                    G.beamChargeTimer += dt;

                    const mouthPos = getDragonMouthPos();
                    const maxCone = (62 * Math.PI) / 180;

                    if (G.beamJoystick.active) {
                        // Control exclusivo con el Joystick del Rayo Solar (Derecha):
                        // - Izquierda / Derecha (dx) mueve el ángulo del rayo
                        // - Arriba / Abajo (dy) alarga el rayo al máximo hacia arriba y lo achica hacia abajo
                        const jdx = G.beamJoystick.dx;
                        const jdy = G.beamJoystick.dy;
                        G.beamAngle = -Math.PI / 2 + Math.max(-1, Math.min(1, jdx)) * maxCone;

                        const maxAllowed = getMaxBeamDistanceInScreen(mouthPos, G.beamAngle);
                        const minBeamLen = 85;
                        const maxBeamLen = Math.min(640, maxAllowed);
                        // jdy = -1 (estirado arriba) -> ratio 1.0 (máximo largo)
                        // jdy = +1 (llevado abajo) -> ratio 0.0 (mínimo corto)
                        const stretchRatio = Math.max(0, Math.min(1, (-jdy + 0.85) / 1.7));
                        const desiredLen = minBeamLen + stretchRatio * Math.max(0, maxBeamLen - minBeamLen);
                        G.beamLength = Math.min(desiredLen, maxAllowed);
                    } else {
                        // Control con Mouse en PC
                        const dx = G.mouse.x - mouthPos.x;
                        let dy = G.mouse.y - mouthPos.y;
                        if (dy > -40) dy = -40;

                        const rawAngle = Math.atan2(dy, dx);
                        G.beamAngle = Math.max(-Math.PI / 2 - maxCone, Math.min(-Math.PI / 2 + maxCone, rawAngle));

                        const rawDist = Math.hypot(dx, dy);
                        const maxAllowed = getMaxBeamDistanceInScreen(mouthPos, G.beamAngle);
                        const desiredLen = Math.max(95, Math.min(620, rawDist));
                        G.beamLength = Math.min(desiredLen, maxAllowed);
                    }
                    G.beamTimer += dt;
                } else {
                    G.beamTimer = 0;
                    G.beamChargeTimer = 0;
                }
            } else {
                G.beamFiring = false;
            }

            if (G.beamFiring) {
                G.beamDamageTimer += dt;
                const mouthPos = getDragonMouthPos();
                const bx = mouthPos.x;
                const by = mouthPos.y;
                const cosA = Math.cos(G.beamAngle);
                const sinA = Math.sin(G.beamAngle);
                const beamHalfH = 72;

                if (Math.random() < 0.5) {
                    spawnParticles(bx + cosA * G.beamLength, by + sinA * G.beamLength, '#ffdc5a', '#ff6e1e', 2, 40, 160, 4, 7, 0.22);
                }

                for (let i = G.meteors.length - 1; i >= 0; i--) {
                    const m = G.meteors[i];
                    const mw = G.meteorW * m.scale;
                    const mh = G.meteorH * m.scale;
                    const mx = m.x + mw / 2;
                    const my = m.y + mh / 2;
                    const dx = mx - bx;
                    const dy = my - by;
                    const localX = dx * cosA + dy * sinA;
                    const localY = -dx * sinA + dy * cosA;
                    if (localX >= -20 && localX <= G.beamLength + 30 && Math.abs(localY) <= beamHalfH + mw * 0.3) {
                        spawnExplosion(mx, my, 0.55 * m.scale);
                        playSfx('explosion', 0.7);
                        G.meteors.splice(i, 1);
                        G.puntos++;
                    }
                }

                for (let i = G.hMeteors.length - 1; i >= 0; i--) {
                    const hm = G.hMeteors[i];
                    const mx = hm.x + G.meteorW / 2;
                    const my = hm.y + G.meteorH / 2;
                    const dx = mx - bx;
                    const dy = my - by;
                    const localX = dx * cosA + dy * sinA;
                    const localY = -dx * sinA + dy * cosA;
                    if (localX >= -20 && localX <= G.beamLength + 30 && Math.abs(localY) <= beamHalfH + G.meteorW * 0.3) {
                        spawnExplosion(mx, my, 0.55);
                        G.hMeteors.splice(i, 1);
                        G.puntos++;
                    }
                }

                for (let ei = G.enemies.length - 1; ei >= 0; ei--) {
                    const en = G.enemies[ei];
                    if (en.state === 'DYING') continue;
                    const eCX = en.x + G.enemyDrawW / 2;
                    const eCY = en.y + G.enemyDrawH / 2;
                    const edx = eCX - bx;
                    const edy = eCY - by;
                    const eLocalX = edx * cosA + edy * sinA;
                    const eLocalY = -edx * sinA + edy * cosA;
                    if (eLocalX >= -20 && eLocalX <= G.beamLength + 30 && Math.abs(eLocalY) <= beamHalfH + G.enemyDrawW * 0.3) {
                        en.state = 'DYING';
                        en.frame = 0;
                        en.timer = 0;
                        spawnParticles(eCX, eCY, '#ff82dc', '#ffdc50', 14, 70, 280, 4, 8, 0.38);
                        playSfx('explosion', 0.8);
                        G.puntos += 5;
                    }
                }

                if (G.bossActive && G.beamDamageTimer >= 0.15) {
                    const bs = getBossSize();
                    const bossCX = G.bossPosition.x + bs.w / 2;
                    const bossCY = G.bossPosition.y + bs.h / 2;
                    const dx = bossCX - bx;
                    const dy = bossCY - by;
                    const localX = dx * cosA + dy * sinA;
                    const localY = -dx * sinA + dy * cosA;
                    if (localX >= -40 && localX <= G.beamLength + 50 && Math.abs(localY) <= beamHalfH + bs.w * 0.32) {
                        G.bossHealth--;
                        G.beamDamageTimer = 0;
                        playSfx('explosion', 1);
                        spawnParticles(bossCX, bossCY + 40, '#ffc846', '#ff461e', 14, 90, 320, 5, 9, 0.35);
                        triggerShake(0.12, 5);
                        checkBossDefeated();
                    }
                }
            }

            // Disparos de la Nave (Espacio en PC o Botón Fire en Móvil por toque o mantener presionado)
            const wantsShoot = G.keys['Space'] || G.touchButtons.fire.pressed || G.touchButtons.fire.tapQueued;
            if (wantsShoot) {
                if ((G.canShoot || G.shootCooldownTimer <= 0 || G.touchButtons.fire.tapQueued) && !G.isDragon && !G.isTransforming) {
                    const c = getShipCenter();
                    G.bullets.push({
                        x: c.x - G.bulletDrawW / 2,
                        y: G.shipPosition.y - 18,
                        age: 0
                    });
                    spawnParticles(c.x, G.shipPosition.y, '#6ee6ff', '#ffffff', 5, 40, 140, 3, 6, 0.18);
                    G.canShoot = false;
                    G.touchButtons.fire.tapQueued = false;
                    G.shootCooldownTimer = 0.16;
                    playSfx('shoot', 0.9);
                }
            } else {
                G.canShoot = true;
            }

            for (let i = G.bullets.length - 1; i >= 0; i--) {
                G.bullets[i].y -= 22 * 60 * dt;
                G.bullets[i].age += dt;
                if (G.bullets[i].y < -100) G.bullets.splice(i, 1);
            }

            if (!G.bossActive && !G.bossDeathActive && G.puntos >= G.bossPuntos) {
                G.bossActive = true;
                G.bossFrameCount = G.level2 ? 16 : 60;
                playMusic('bossMusic');
                G.bossAppearTimer = 0;
                G.fireballAge = 0;
                const bs = getBossSize();
                G.bossPosition = { x: (VIRTUAL_WIDTH - bs.w) / 2, y: 45 };
                G.bossFrame = 0;
                G.bossFrameTimer = 0;
                G.bossAttackCooldown = 0;
                G.bossActionTimer = 0;
                triggerShake(0.35, 8);
                notifyProgressSave({ score: G.puntos });
            }

            if (!G.bossActive && !G.bossDeathActive && !G.level2) {
                G.spawnTimer += dt;
                if (G.spawnTimer > 0.68) {
                    G.spawnTimer = 0;
                    const scale = 0.88 + Math.random() * 0.34;
                    const mw = G.meteorW * scale;
                    const x = 30 + Math.random() * Math.max(40, VIRTUAL_WIDTH - mw - 60);
                    const speed = G.meteorMinSpeed + Math.random() * (G.meteorMaxSpeed - G.meteorMinSpeed);
                    G.meteors.push({
                        x,
                        y: -mw - 40,
                        speed,
                        scale,
                        frameOffset: Math.floor(Math.random() * 8)
                    });
                }
            }

            if (G.level2 && !G.bossActive && !G.bossDeathActive) {
                G.enemySpawnTimer += dt;
                if (G.enemySpawnTimer > 1.05) {
                    G.enemySpawnTimer = 0;
                    const fromLeft = Math.random() < 0.5;
                    G.enemies.push({
                        x: fromLeft ? -G.enemyDrawW : VIRTUAL_WIDTH,
                        y: 110 + Math.random() * (VIRTUAL_HEIGHT / 2 - 110),
                        state: 'MOVING',
                        frame: 0,
                        timer: 0,
                        trailTimer: 0,
                        dirX: fromLeft ? 1 : -1,
                        dashDir: { x: 0, y: 1 },
                        attackTarget: { x: 0, y: 0 },
                        moveSpeed: 7.5 + Math.random() * 2.2,
                        finished: false
                    });
                }
            }

            for (let i = 0; i < G.meteors.length; i++) {
                G.meteors[i].y += G.meteors[i].speed * 60 * dt;
            }

            G.meteorFrameTimer += dt;
            if (G.meteorFrameTimer >= 0.075) {
                G.meteorFrameTimer = 0;
                G.meteorFrame = (G.meteorFrame + 1) % 8;
            }

            for (let i = G.meteors.length - 1; i >= 0; i--) {
                if (G.meteors[i].y > VIRTUAL_HEIGHT + 200) G.meteors.splice(i, 1);
            }

            // Colisión balas vs meteoritos
            for (let i = G.meteors.length - 1; i >= 0; i--) {
                const m = G.meteors[i];
                const mw = G.meteorW * m.scale;
                const mh = G.meteorH * m.scale;
                const mRect = { x: m.x + mw * 0.14, y: m.y + mh * 0.18, w: mw * 0.72, h: mh * 0.72 };
                for (let j = G.bullets.length - 1; j >= 0; j--) {
                    const b = G.bullets[j];
                    const bRect = { x: b.x + 8, y: b.y + 8, w: G.bulletDrawW - 16, h: G.bulletDrawH - 16 };
                    if (rectsIntersect(mRect, bRect)) {
                        G.puntos++;
                        spawnExplosion(mRect.x + mRect.w / 2, mRect.y + mRect.h / 2, 0.55 * m.scale);
                        playSfx('explosion', 1);
                        G.meteors.splice(i, 1);
                        G.bullets.splice(j, 1);
                        break;
                    }
                }
            }

            // Colisión balas vs enemigos Nivel 2
            for (let bi = G.bullets.length - 1; bi >= 0; bi--) {
                const b = G.bullets[bi];
                const bRect = { x: b.x + 8, y: b.y + 8, w: G.bulletDrawW - 16, h: G.bulletDrawH - 16 };
                for (let ei = G.enemies.length - 1; ei >= 0; ei--) {
                    const en = G.enemies[ei];
                    if (en.state === 'DYING') continue;
                    const eRect = {
                        x: en.x + G.enemyDrawW * 0.15,
                        y: en.y + G.enemyDrawH * 0.15,
                        w: G.enemyDrawW * 0.7,
                        h: G.enemyDrawH * 0.7
                    };
                    if (rectsIntersect(eRect, bRect)) {
                        en.state = 'DYING';
                        en.frame = 0;
                        en.timer = 0;
                        G.puntos += 5;
                        spawnParticles(eRect.x + eRect.w / 2, eRect.y + eRect.h / 2, '#ff8cdc', '#ffdc50', 14, 70, 260, 4, 8, 0.35);
                        playSfx('explosion', 0.9);
                        G.bullets.splice(bi, 1);
                        break;
                    }
                }
            }

            const craftRect = getActiveCraftRect();
            const shipRect = {
                x: craftRect.x + craftRect.w * 0.22,
                y: craftRect.y + craftRect.h * 0.2,
                w: craftRect.w * 0.56,
                h: craftRect.h * 0.6
            };

            for (let i = G.meteors.length - 1; i >= 0; i--) {
                const m = G.meteors[i];
                const mw = G.meteorW * m.scale;
                const mh = G.meteorH * m.scale;
                const mRect = { x: m.x + mw * 0.16, y: m.y + mh * 0.2, w: mw * 0.68, h: mh * 0.68 };
                if (rectsIntersect(shipRect, mRect)) {
                    spawnExplosion(mRect.x + mRect.w / 2, mRect.y + mRect.h / 2, 0.55);
                    G.meteors.splice(i, 1);
                    applyPlayerDamage();
                }
            }

            // Lógica de Jefes 1 y 2
            if (G.bossActive) {
                G.bossAppearTimer += dt;
                G.fireballAge += dt;
                const bs = getBossSize();

                G.bossFrameTimer += dt;
                if (G.bossFrameTimer >= 0.04) {
                    G.bossFrameTimer = 0;
                    G.bossFrame = (G.bossFrame + 1) % G.bossFrameCount;
                }

                G.bossAttackCooldown += dt;
                G.bossActionTimer += dt;
                if (G.bossCrashCooldown > 0) G.bossCrashCooldown -= dt;

                const p2Speed = G.bossPhase2 ? 1.65 : 1;
                const p2Attack = G.bossPhase2 ? 0.55 : 1;

                if (G.bossState === 'MOVING') {
                    G.bossPosition.x += G.bossDir * G.bossSpeed * p2Speed * G.bossSpeedBurst * 60 * dt;
                    if (G.bossPosition.x <= 20) {
                        G.bossPosition.x = 20;
                        G.bossDir = 1;
                    } else if (G.bossPosition.x >= VIRTUAL_WIDTH - bs.w - 20) {
                        G.bossPosition.x = VIRTUAL_WIDTH - bs.w - 20;
                        G.bossDir = -1;
                    }

                    if (G.bossSpeedBurst > 1) {
                        G.bossSpeedBurst = Math.max(1, G.bossSpeedBurst - dt * 2);
                    }

                    const actionDelay = G.bossPhase2 ? 0.45 : 0.85;
                    if (G.bossActionTimer > actionDelay + Math.random() * 1.2) {
                        G.bossActionTimer = 0;
                        const burstChance = G.bossPhase2 ? 2 : 3;
                        if (Math.floor(Math.random() * burstChance) === 0) {
                            G.bossDir = -G.bossDir;
                            G.bossSpeedBurst = (G.bossPhase2 ? 2.1 : 1.45) + Math.random() * 0.6;
                        }
                    }

                    if (G.bossAttackCooldown >= 3.2 * p2Attack && !G.level2) {
                        G.bossAttackCooldown = 0;
                        if (G.bossCrashCooldown <= 0 && Math.floor(Math.random() * 3) === 0) {
                            G.bossCrashCooldown = 5.0 * p2Attack;
                            const edgeX = Math.random() < 0.5 ? 20 : VIRTUAL_WIDTH - bs.w - 20;
                            G.bossDashTarget = { x: edgeX, y: G.bossPosition.y };
                        } else {
                            const c = getShipCenter();
                            const targetX = Math.max(20, Math.min(VIRTUAL_WIDTH - bs.w - 20, c.x - bs.w / 2));
                            G.bossDashTarget = { x: targetX, y: G.bossPosition.y + bs.h * 0.7 };
                        }
                        G.bossState = 'DASHING';
                        G.bossDashTimer = 0;
                        G.bossTrailTimer = 0;
                    }

                    if (G.level2 && G.bossAttackCooldown >= 2.1 * p2Attack) {
                        G.bossAttackCooldown = 0;
                        G.bossDashOrigin = { ...G.bossPosition };
                        const bossCenter = { x: G.bossPosition.x + bs.w / 2, y: G.bossPosition.y + bs.h / 2 };
                        G.bossDashTarget = getShipCenter();
                        const dx = G.bossDashTarget.x - bossCenter.x;
                        const dy = G.bossDashTarget.y - bossCenter.y;
                        const len = Math.hypot(dx, dy) || 1;
                        G.bossDashDir = { x: dx / len, y: dy / len };
                        G.bossState = 'DASHING';
                        G.bossDashTimer = 0;
                        G.bossTrailTimer = 0;
                        G.dashTrails = [];
                    }
                } else if (G.bossState === 'DASHING') {
                    G.bossDashTimer += dt;
                    G.bossTrailTimer += dt;
                    const dashSpeed = 32 * p2Speed * 60 * dt;
                    if (G.level2) {
                        G.bossPosition.x += G.bossDashDir.x * dashSpeed;
                        G.bossPosition.y += G.bossDashDir.y * dashSpeed;
                        if (G.bossTrailTimer >= 0.025) {
                            G.bossTrailTimer = 0;
                            G.dashTrails.push({ x: G.bossPosition.x, y: G.bossPosition.y, frame: G.bossFrame, alpha: 1 });
                        }
                        const bossCenter = { x: G.bossPosition.x + bs.w / 2, y: G.bossPosition.y + bs.h / 2 };
                        const distSq = (bossCenter.x - G.bossDashTarget.x) ** 2 + (bossCenter.y - G.bossDashTarget.y) ** 2;
                        if (distSq < 3000 || G.bossDashTimer > 1.2) {
                            G.bossState = 'MOVING';
                            G.bossActionTimer = 0;
                            G.bossAttackCooldown = 0;
                            G.bossPosition = { ...G.bossDashOrigin };
                        }
                    } else if (Math.abs(G.bossPosition.x - G.bossDashTarget.x) <= dashSpeed) {
                        G.bossPosition.x = G.bossDashTarget.x;
                        G.dashTrails = [];
                        if (G.bossDashTarget.x <= 25 || G.bossDashTarget.x >= VIRTUAL_WIDTH - bs.w - 25) {
                            G.bossState = 'CRASHING';
                        } else {
                            G.bossState = 'ATTACKING';
                        }
                    } else {
                        G.bossPosition.x += Math.sign(G.bossDashTarget.x - G.bossPosition.x) * dashSpeed;
                        if (G.bossTrailTimer >= 0.025) {
                            G.bossTrailTimer = 0;
                            G.dashTrails.push({ x: G.bossPosition.x, y: G.bossPosition.y, frame: G.bossFrame, alpha: 1 });
                        }
                    }
                } else if (G.bossState === 'ATTACKING') {
                    G.fireballs.push({
                        x: G.bossPosition.x + bs.w / 2 - G.fireballDrawW / 2,
                        y: G.bossPosition.y + bs.h * 0.65
                    });
                    playSfx('bossFire', 1);
                    G.bossState = 'MOVING';
                } else if (G.bossState === 'CRASHING') {
                    const baseX = G.bossDashTarget.x <= 30 ? 40 : VIRTUAL_WIDTH * 0.52;
                    const crashCount = G.bossPhase2 ? 7 : 5;
                    for (let ci = 0; ci < crashCount; ci++) {
                        const x = Math.max(30, Math.min(VIRTUAL_WIDTH - G.meteorW - 30, baseX + ci * (VIRTUAL_WIDTH * 0.065)));
                        G.hMeteors.push({ x, y: -140 - ci * 35, speed: 16 + Math.random() * 5 });
                    }
                    playSfx('bossCrash', 1);
                    triggerShake(0.45, 12);
                    G.bossDir = G.bossPosition.x <= VIRTUAL_WIDTH / 2 ? 1 : -1;
                    G.bossPosition.x = Math.max(20, Math.min(VIRTUAL_WIDTH - bs.w - 20, G.bossPosition.x));
                    G.bossState = 'MOVING';
                }

                const bossHitbox = {
                    x: G.bossPosition.x + bs.w * 0.16,
                    y: G.bossPosition.y + bs.h * 0.16,
                    w: bs.w * 0.68,
                    h: bs.h * 0.68
                };
                if (rectsIntersect(shipRect, bossHitbox)) {
                    applyPlayerDamage();
                }

                for (let bi = G.bullets.length - 1; bi >= 0; bi--) {
                    const b = G.bullets[bi];
                    const bRect = { x: b.x + 8, y: b.y + 8, w: G.bulletDrawW - 16, h: G.bulletDrawH - 16 };
                    if (rectsIntersect(bossHitbox, bRect)) {
                        const hitX = b.x + G.bulletDrawW / 2;
                        const hitY = b.y;
                        G.bullets.splice(bi, 1);
                        G.bossHealth--;
                        playSfx('explosion', 1);
                        spawnParticles(hitX, hitY, '#ffc846', '#ff501e', 12, 80, 280, 4, 8, 0.32);
                        triggerShake(0.1, 4.5);
                        checkBossDefeated();
                        break;
                    }
                }
            }

            if (G.bossDeathActive) {
                G.bossDeathTimer += dt;
                if (G.bossDeathTimer >= 0.075) {
                    G.bossDeathTimer = 0;
                    G.bossDeathFrame++;
                    const bs = getBossSize();
                    if (G.bossDeathFrame % 3 === 0) {
                        spawnParticles(
                            G.bossPosition.x + bs.w / 2 + (Math.random() * 180 - 90),
                            G.bossPosition.y + bs.h / 2 + (Math.random() * 140 - 70),
                            '#ffd246',
                            '#ff4614',
                            14,
                            90,
                            340,
                            5,
                            10,
                            0.45
                        );
                        triggerShake(0.15, 7);
                    }
                    if (G.bossDeathFrame >= 20) {
                        G.bossDeathActive = false;
                        if (G.arcadeMode) {
                            G.level1Completed = true;
                            G.level2 = !G.level2;
                            G.bgScroll = 0;
                            playMusic('gameMusic');
                            G.bossPhase2 = false;
                            G.bossHealth = 10;
                            G.bossActive = false;
                            G.bossPuntos = (Math.floor(G.puntos / 100) + 1) * 100;
                            G.meteors = [];
                            G.enemies = [];
                            G.enemyDashTrails = [];
                            G.hMeteors = [];
                            G.dashTrails = [];
                            G.fireballs = [];
                            notifyProgressSave({
                                level1Completed: true,
                                score: G.puntos,
                                lastLevel: G.level2 ? 2 : 1
                            });
                        } else {
                            G.win = true;
                            if (!G.level2) {
                                G.level1Completed = true;
                            }
                            G.gameOver = true;
                            notifyProgressSave({
                                level1Completed: G.level1Completed,
                                score: G.puntos,
                                lastLevel: G.level2 ? 2 : 2
                            });
                            notifyEndOfRun();
                        }
                    }
                }
            }

            for (let i = G.dashTrails.length - 1; i >= 0; i--) {
                G.dashTrails[i].alpha -= dt * 3.2;
                if (G.dashTrails[i].alpha <= 0) G.dashTrails.splice(i, 1);
            }

            for (let i = G.fireballs.length - 1; i >= 0; i--) {
                G.fireballs[i].y += 980 * (G.bossPhase2 ? 1.45 : 1) * dt;
                const fb = G.fireballs[i];
                const fbRect = { x: fb.x + 16, y: fb.y + 18, w: G.fireballDrawW - 32, h: G.fireballDrawH - 32 };
                if (rectsIntersect(shipRect, fbRect)) {
                    spawnExplosion(fbRect.x + fbRect.w / 2, fbRect.y + fbRect.h / 2, 0.5);
                    G.fireballs.splice(i, 1);
                    applyPlayerDamage();
                } else if (fb.y > VIRTUAL_HEIGHT + 80) {
                    G.fireballs.splice(i, 1);
                }
            }

            for (let i = G.hMeteors.length - 1; i >= 0; i--) {
                G.hMeteors[i].y += G.hMeteors[i].speed * 60 * dt;
                const hm = G.hMeteors[i];
                const mRect = { x: hm.x + G.meteorW * 0.16, y: hm.y + G.meteorH * 0.2, w: G.meteorW * 0.68, h: G.meteorH * 0.68 };
                if (rectsIntersect(shipRect, mRect)) {
                    spawnExplosion(mRect.x + mRect.w / 2, mRect.y + mRect.h / 2, 0.55);
                    G.hMeteors.splice(i, 1);
                    applyPlayerDamage();
                } else if (hm.y > VIRTUAL_HEIGHT + 200) {
                    G.hMeteors.splice(i, 1);
                }
            }

            // Enemigos Nivel 2
            const targetPos = getShipCenter();
            for (let i = G.enemies.length - 1; i >= 0; i--) {
                const en = G.enemies[i];
                if (en.state === 'MOVING') {
                    en.x += en.dirX * en.moveSpeed * 60 * dt;
                    en.timer += dt;
                    en.frame = Math.floor(en.timer / 0.07) % 14;
                    if (en.timer > 1.4 + Math.random() * 1.4) {
                        en.timer = 0;
                        en.frame = 0;
                        en.attackTarget = { ...targetPos };
                        en.state = 'ATTACKING';
                    }
                    if (en.x < -G.enemyDrawW * 2 || en.x > VIRTUAL_WIDTH + G.enemyDrawW * 2) en.finished = true;
                } else if (en.state === 'ATTACKING') {
                    en.timer += dt;
                    en.frame = Math.floor(en.timer / 0.09);
                    if (en.frame >= 4) {
                        const eCX = en.x + G.enemyDrawW / 2;
                        const eCY = en.y + G.enemyDrawH / 2;
                        const dx = en.attackTarget.x - eCX;
                        const dy = en.attackTarget.y - eCY;
                        const len = Math.hypot(dx, dy) || 1;
                        en.dashDir = { x: dx / len, y: dy / len };
                        en.state = 'DASHING';
                        en.frame = 0;
                        en.timer = 0;
                        en.trailTimer = 0;
                    }
                } else if (en.state === 'DASHING') {
                    en.x += en.dashDir.x * 26 * 60 * dt;
                    en.y += en.dashDir.y * 26 * 60 * dt;
                    en.frame = 3;
                    en.trailTimer += dt;
                    if (en.trailTimer >= 0.025) {
                        en.trailTimer = 0;
                        G.enemyDashTrails.push({ x: en.x, y: en.y, alpha: 1, dirX: en.dirX });
                    }
                    if (
                        en.x < -G.enemyDrawW * 2 ||
                        en.x > VIRTUAL_WIDTH + G.enemyDrawW * 2 ||
                        en.y < -G.enemyDrawH * 2 ||
                        en.y > VIRTUAL_HEIGHT + G.enemyDrawH * 2
                    ) {
                        en.finished = true;
                    }
                } else if (en.state === 'DYING') {
                    en.timer += dt;
                    en.frame = Math.floor(en.timer / 0.07);
                    if (en.frame >= 10) en.finished = true;
                }

                if (!en.finished && en.state !== 'DYING') {
                    const eRect = {
                        x: en.x + G.enemyDrawW * 0.18,
                        y: en.y + G.enemyDrawH * 0.18,
                        w: G.enemyDrawW * 0.64,
                        h: G.enemyDrawH * 0.64
                    };
                    if (rectsIntersect(shipRect, eRect)) {
                        en.state = 'DYING';
                        en.frame = 0;
                        en.timer = 0;
                        applyPlayerDamage();
                    }
                }
            }

            G.enemies = G.enemies.filter((e) => !e.finished);

            for (let i = G.enemyDashTrails.length - 1; i >= 0; i--) {
                G.enemyDashTrails[i].alpha -= dt * 3.5;
                if (G.enemyDashTrails[i].alpha <= 0) G.enemyDashTrails.splice(i, 1);
            }

            for (let i = G.explosions.length - 1; i >= 0; i--) {
                const exp = G.explosions[i];
                exp.timer += dt;
                if (exp.timer >= 0.065) {
                    exp.timer = 0;
                    exp.frame++;
                    if (exp.frame >= 5) exp.finished = true;
                }
            }
            G.explosions = G.explosions.filter((e) => !e.finished);

            for (let i = G.particles.length - 1; i >= 0; i--) {
                const p = G.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 1 - 2.5 * dt;
                p.vy *= 1 - 2.5 * dt;
                p.life -= dt;
                if (p.life <= 0) G.particles.splice(i, 1);
            }
        };

        // Helpers de dibujo Pixel Art
        const drawText = (text, x, y, color = '#ffffff', sizePx = 42, align = 'left') => {
            ctx.save();
            ctx.font = `${sizePx}px "ThaleahFatGame", "Orbitron", monospace`;
            ctx.textAlign = align;
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillText(text, x + 4, y + 4);
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
            ctx.restore();
        };

        const drawPanel = (x, y, w, h, bgColor, borderColor, border = 4) => {
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = border;
            ctx.strokeRect(x + border / 2, y + border / 2, w - border, h - border);
        };

        const drawCraftCentered = (centerX, centerY, scaleFactor) => {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(G.isDragon ? G.shipTilt * 0.6 : G.shipTilt);
            if (G.damageFlashTimer > 0) {
                ctx.filter = 'sepia(1) saturate(5) hue-rotate(-35deg)';
            }
            if (G.isDragon) {
                const tex = images.dragon;
                const dfw = tex.width / 5;
                const w = G.dragonW * scaleFactor;
                const h = G.dragonH * scaleFactor;
                ctx.drawImage(tex, G.shipFrame * dfw, 65, dfw, 410, -w / 2, -h / 2, w, h);
            } else {
                const tex = images[G.currentShipKey] || images.shipIdle;
                const sfw = tex.width / 4;
                const w = G.shipW * scaleFactor;
                const h = G.shipH * scaleFactor;
                ctx.drawImage(tex, G.shipFrame * sfw + 640, 480, 720, 1040, -w / 2, -h / 2, w, h);
            }
            ctx.restore();
        };

        const drawTouchOverlay = () => {
            if (!G.showTouchControls || G.state !== 'PLAY' || G.paused || G.gameOver) return;

            ctx.save();
            // Joystick virtual izquierdo
            const jx = G.joystick.baseX;
            const jy = G.joystick.baseY;
            const jr = G.joystick.radius;

            ctx.beginPath();
            ctx.arc(jx, jy, jr, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 212, 255, 0.12)';
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.45)';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(G.joystick.curX, G.joystick.curY, jr * 0.36, 0, Math.PI * 2);
            ctx.fillStyle = G.joystick.active ? 'rgba(0, 212, 255, 0.75)' : 'rgba(255, 255, 255, 0.45)';
            ctx.fill();

            if (G.isDragon) {
                // MODO DRAGÓN: Joystick derecho exclusivo para disparar y mover el Rayo Solar
                const bjx = G.beamJoystick.baseX;
                const bjy = G.beamJoystick.baseY;
                const bjr = G.beamJoystick.radius;

                ctx.beginPath();
                ctx.arc(bjx, bjy, bjr, 0, Math.PI * 2);
                ctx.fillStyle = G.beamJoystick.active ? 'rgba(255, 190, 60, 0.24)' : 'rgba(255, 160, 40, 0.14)';
                ctx.fill();
                ctx.lineWidth = 5;
                ctx.strokeStyle = G.beamJoystick.active ? '#ffdc50' : 'rgba(255, 190, 60, 0.7)';
                ctx.stroke();

                drawText('RAYO SOLAR', bjx, bjy - bjr - 38, '#ffd250', 28, 'center');

                ctx.beginPath();
                ctx.arc(G.beamJoystick.curX, G.beamJoystick.curY, bjr * 0.38, 0, Math.PI * 2);
                ctx.fillStyle = G.beamJoystick.active ? '#ffbe3c' : 'rgba(255, 210, 80, 0.65)';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#ff5a1e';
                ctx.stroke();
            } else {
                // MODO NAVE: Botón Disparo normal (Derecha abajo)
                const fb = G.touchButtons.fire;
                ctx.beginPath();
                ctx.arc(fb.x, fb.y, fb.r, 0, Math.PI * 2);
                ctx.fillStyle = fb.pressed ? 'rgba(0, 212, 255, 0.45)' : 'rgba(15, 23, 42, 0.72)';
                ctx.fill();
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#00d4ff';
                ctx.stroke();

                if (images.fireBtn && images.fireBtn.width > 0) {
                    const ffw = images.fireBtn.width / 4;
                    const fIdx = fb.pressed ? 3 : 0;
                    ctx.drawImage(images.fireBtn, fIdx * ffw, 0, ffw, images.fireBtn.height, fb.x - 68, fb.y - 68, 136, 136);
                } else {
                    drawText('FIRE', fb.x, fb.y - 20, '#ffffff', 38, 'center');
                }
            }

            // Botón Transformación (E)
            const tb = G.touchButtons.transform;
            ctx.beginPath();
            ctx.arc(tb.x, tb.y, tb.r, 0, Math.PI * 2);
            ctx.fillStyle = tb.pressed ? 'rgba(139, 92, 246, 0.5)' : 'rgba(15, 23, 42, 0.65)';
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = G.transformCooldown > 0 ? '#64748b' : '#a855f7';
            ctx.stroke();

            if (images.transformBtn && images.transformBtn.width > 0) {
                const tfw = images.transformBtn.width / 4;
                const tIdx = tb.pressed ? 3 : 0;
                ctx.drawImage(images.transformBtn, tIdx * tfw, 0, tfw, images.transformBtn.height, tb.x - 46, tb.y - 46, 92, 92);
            }
            if (G.transformCooldown > 0) {
                drawText(`${G.transformCooldown.toFixed(1)}s`, tb.x, tb.y - 16, '#cbd5e1', 28, 'center');
            }

            // Botón Pausa (||)
            const pb = G.touchButtons.pause;
            ctx.beginPath();
            ctx.arc(pb.x, pb.y, pb.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();
            drawText('||', pb.x, pb.y - 20, '#ffffff', 36, 'center');

            ctx.restore();
        };

        const render = () => {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = '#05050a';
            ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

            ctx.translate(G.shakeOffset.x, G.shakeOffset.y);

            // Fondo con scroll continuo
            const bgTex = G.level2 ? images.bgLevel2 : images.bgLevel1;
            if (bgTex && bgTex.width > 0) {
                const bgScale = VIRTUAL_WIDTH / bgTex.width;
                const tileH = Math.max(1, Math.ceil(bgTex.height * bgScale));
                const startY = (G.bgScroll % tileH) - tileH;
                for (let y = startY; y < VIRTUAL_HEIGHT; y += tileH - 1) {
                    ctx.drawImage(bgTex, 0, Math.floor(y), VIRTUAL_WIDTH, tileH);
                }
            }

            // Estrellas parallax
            for (const s of G.stars) {
                const twinkle = 0.65 + 0.35 * Math.sin(G.globalTime * 4 + s.phase);
                ctx.globalAlpha = s.alpha * twinkle;
                ctx.fillStyle = s.color;
                ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
            }
            ctx.globalAlpha = 1;

            if (G.state === 'MENU') {
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(0, VIRTUAL_HEIGHT - 55, VIRTUAL_WIDTH, 55);
                drawText(
                    `PILOTO: ${(playerNameRef.current || 'PILOTO').toUpperCase()}   |   RECORD: ${G.highScore} PTS   |   W/S, CLICK O TOQUE PARA ELEGIR`,
                    VIRTUAL_WIDTH / 2,
                    VIRTUAL_HEIGHT - 44,
                    '#bed7ff',
                    30,
                    'center'
                );

                const bob = Math.sin(G.globalTime * 2.6) * 7;
                const tituloW = 550;
                const tituloH = Math.floor(tituloW * (SRC_TITULO.h / SRC_TITULO.w));
                const tituloX = Math.floor((VIRTUAL_WIDTH - tituloW) / 2);
                const tituloY = Math.floor(48 + bob);
                if (images.titulo) {
                    ctx.drawImage(
                        images.titulo,
                        SRC_TITULO.x,
                        SRC_TITULO.y,
                        SRC_TITULO.w,
                        SRC_TITULO.h,
                        tituloX,
                        tituloY,
                        tituloW,
                        tituloH
                    );
                }

                if (G.showLevelSelect) {
                    drawPanel(VIRTUAL_WIDTH / 2 - 380, VIRTUAL_HEIGHT / 2 - 130, 760, 510, 'rgba(10,14,28,0.92)', '#5aaaff', 4);
                    const levels = [
                        'NIVEL 1',
                        G.level1Completed ? 'NIVEL 2 [DESBLOQUEADO]' : 'NIVEL 2 [BLOQUEADO]',
                        'MODO ARCADE',
                        'VOLVER'
                    ];
                    for (let i = 0; i < levels.length; i++) {
                        const sel = i === G.levelSelectIndex;
                        let col = sel ? '#ffe64b' : '#ffffff';
                        if (i === 1 && !G.level1Completed) col = sel ? '#94a3b8' : '#64748b';
                        const label = sel ? `> ${levels[i]} <` : levels[i];
                        drawText(label, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 75 + i * 105, col, sel ? 50 : 44, 'center');
                    }
                    drawText(`RECORD PERSONAL ARCADE: ${G.highScore}`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 330, '#ffd700', 38, 'center');
                } else {
                    const baseBtnW = 430;
                    const baseBtnH = 126;
                    const spacing = 22;
                    const startY = 430;

                    for (let i = 0; i < G.menuItems.length; i++) {
                        const sel = i === G.menuIndex;
                        const frame = sel ? 1 : 0;
                        let btnTex = images.newGame;
                        let src = SRC_BTN_NEWGAME[frame];
                        if (G.menuItems[i] === 'CONTINUE') {
                            btnTex = images.continueTex;
                            src = SRC_BTN_CONTINUE[frame];
                        } else if (G.menuItems[i] === 'OPTIONS') {
                            btnTex = images.options;
                            src = SRC_BTN_OPTIONS[frame];
                        } else if (G.menuItems[i] === 'QUIT') {
                            btnTex = images.quit;
                            src = SRC_BTN_QUIT[frame];
                        }

                        const pulse = sel ? 1.04 + 0.025 * Math.sin(G.globalTime * 7) : 1.0;
                        const drawW = Math.floor(baseBtnW * pulse);
                        const drawH = Math.floor(baseBtnH * pulse);
                        const drawX = Math.floor((VIRTUAL_WIDTH - drawW) / 2);
                        const drawY = Math.floor(startY + i * (baseBtnH + spacing) + (baseBtnH - drawH) / 2);

                        if (btnTex) {
                            ctx.save();
                            ctx.globalAlpha = 0.55;
                            ctx.filter = 'brightness(0)';
                            ctx.drawImage(btnTex, src.x, src.y, src.w, src.h, drawX + 6, drawY + 6, drawW, drawH);
                            ctx.restore();
                            ctx.drawImage(btnTex, src.x, src.y, src.w, src.h, drawX, drawY, drawW, drawH);
                        }
                    }
                }
            } else if (G.state === 'CONFIG') {
                drawPanel(VIRTUAL_WIDTH / 2 - 540, 70, 1080, VIRTUAL_HEIGHT - 140, 'rgba(10,14,28,0.92)', '#5aaaff', 4);
                drawText('CONFIGURACION', VIRTUAL_WIDTH / 2, 105, '#6ed7ff', 58, 'center');

                for (let i = 0; i < G.configItems.length; i++) {
                    const sel = i === G.configIndex;
                    const col = sel ? '#ffe64b' : '#ffffff';
                    let line = G.configItems[i];
                    if (i === 0) line += `: < ${Math.round(G.shipSpeed)} >`;
                    else if (i === 1) line += `: < ${G.meteorMinSpeed.toFixed(1)} >`;
                    else if (i === 2) line += `: < ${G.meteorMaxSpeed.toFixed(1)} >`;
                    else if (i === 3) line += `: < ${Math.round(G.musicVolume * 100)}% >`;
                    else if (i === 4) line += `: < ${Math.round(G.sfxVolume * 100)}% >`;
                    else if (i === 5) line += `: < ${G.showTouchControls ? 'ACTIVOS' : 'OCULTOS'} >`;

                    drawText(line, VIRTUAL_WIDTH / 2, 210 + i * 90, col, sel ? 44 : 40, 'center');
                }
            } else if (G.state === 'PLAY') {
                // Partículas
                for (const p of G.particles) {
                    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
                    const sz = Math.max(2, Math.floor(p.size * (0.5 + 0.5 * alpha)));
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(Math.floor(p.x - sz / 2), Math.floor(p.y - sz / 2), sz, sz);
                }
                ctx.globalAlpha = 1;

                // Rayo Solar en 2 partes (cuerpo + punta de fuego 1:1 sin deformar)
                if (G.beamFiring && G.isDragon && images.beam) {
                    const beamFrame = Math.floor(G.beamTimer / 0.045) % 20;
                    const beamFW = images.beam.width / 20;
                    const beamFH = images.beam.height;
                    const mouthPos = getDragonMouthPos();
                    const chargeRatio = Math.min(G.beamChargeTimer / 0.16, 1);
                    const thicknessScale = (0.85 + 0.12 * Math.sin(G.globalTime * 28)) * chargeRatio;

                    const streamStartX = 58;
                    const streamWidth = 316;
                    const tipStartX = 374;
                    const tipWidth = 124;

                    const tipWorldW = tipWidth * thicknessScale;
                    const bodyWorldLen = Math.max(16, G.beamLength - tipWorldW * 0.65);
                    const bodyWorldH = beamFH * thicknessScale;

                    ctx.save();
                    ctx.translate(mouthPos.x, mouthPos.y);
                    ctx.rotate(G.beamAngle);

                    // Resplandor exterior
                    ctx.globalAlpha = 0.45;
                    ctx.drawImage(
                        images.beam,
                        beamFrame * beamFW + streamStartX,
                        0,
                        streamWidth,
                        beamFH,
                        0,
                        -(bodyWorldH * 1.35) / 2,
                        bodyWorldLen,
                        bodyWorldH * 1.35
                    );

                    // Haz principal
                    ctx.globalAlpha = 1;
                    ctx.drawImage(
                        images.beam,
                        beamFrame * beamFW + streamStartX,
                        0,
                        streamWidth,
                        beamFH,
                        0,
                        -bodyWorldH / 2,
                        bodyWorldLen,
                        bodyWorldH
                    );

                    // Punta redonda 1:1
                    const tipWorldH = beamFH * thicknessScale;
                    ctx.drawImage(
                        images.beam,
                        beamFrame * beamFW + tipStartX,
                        0,
                        tipWidth,
                        beamFH,
                        bodyWorldLen - 18 * thicknessScale,
                        -tipWorldH / 2,
                        tipWorldW,
                        tipWorldH
                    );
                    ctx.restore();
                }

                // Nave / Dragón / Transformación
                const center = getShipCenter();
                if (G.isTransforming) {
                    if (G.transformFrame < 8) {
                        const progress = G.transformFrame / 8;
                        drawCraftCentered(center.x, center.y, 1 - progress);
                        if (images.transform) {
                            const tfFrameW = images.transform.width / 8;
                            const tfScale = 0.7 + 0.5 * progress;
                            const drawSz = G.dragonW * tfScale;
                            ctx.drawImage(
                                images.transform,
                                G.transformFrame * tfFrameW + 80,
                                40,
                                tfFrameW - 160,
                                images.transform.height - 80,
                                center.x - drawSz / 2,
                                center.y - drawSz / 2,
                                drawSz,
                                drawSz
                            );
                        }
                    } else {
                        const reveal = (G.transformFrame - 8 + 1) / 4;
                        drawCraftCentered(center.x, center.y, reveal);
                    }
                } else {
                    drawCraftCentered(center.x, center.y, 1);
                }

                // Balas recortadas
                if (images.bullet) {
                    const bfw = images.bullet.width / 11;
                    for (const b of G.bullets) {
                        const bFrame = Math.floor(b.age / 0.04) % 11;
                        ctx.drawImage(images.bullet, bFrame * bfw + 90, 88, 315, 448, b.x, b.y, G.bulletDrawW, G.bulletDrawH);
                    }
                }

                // Meteoritos recortados
                if (images.meteor) {
                    const mfw = images.meteor.width / 8;
                    for (const m of G.meteors) {
                        const f = (G.meteorFrame + m.frameOffset) % 8;
                        ctx.drawImage(
                            images.meteor,
                            f * mfw + 248,
                            212,
                            272,
                            368,
                            m.x,
                            m.y,
                            G.meteorW * m.scale,
                            G.meteorH * m.scale
                        );
                    }
                    for (const hm of G.hMeteors) {
                        ctx.drawImage(images.meteor, G.meteorFrame * mfw + 248, 212, 272, 368, hm.x, hm.y, G.meteorW, G.meteorH);
                    }
                }

                // Enemigos Nivel 2
                if (images.enemyAttack) {
                    const efw = images.enemyAttack.width / 4;
                    for (const trail of G.enemyDashTrails) {
                        ctx.save();
                        ctx.globalAlpha = trail.alpha * 0.45;
                        ctx.translate(trail.x + G.enemyDrawW / 2, trail.y + G.enemyDrawH / 2);
                        if (trail.dirX >= 0) ctx.scale(-1, 1);
                        ctx.drawImage(images.enemyAttack, 3 * efw + 256, 70, 280, 260, -G.enemyDrawW / 2, -G.enemyDrawH / 2, G.enemyDrawW, G.enemyDrawH);
                        ctx.restore();
                    }
                }

                for (const en of G.enemies) {
                    let tex = images.enemyMove;
                    let totalF = 14;
                    let f = en.frame % 14;
                    let flip = en.dirX >= 0;
                    if (en.state === 'DYING') {
                        tex = images.enemyDeath;
                        totalF = 10;
                        f = Math.min(en.frame, 9);
                        flip = false;
                    } else if (en.state === 'ATTACKING' || en.state === 'DASHING') {
                        tex = images.enemyAttack;
                        totalF = 4;
                        f = Math.min(en.frame, 3);
                    }
                    if (tex) {
                        const efw = tex.width / totalF;
                        ctx.save();
                        ctx.translate(en.x + G.enemyDrawW / 2, en.y + G.enemyDrawH / 2);
                        if (flip) ctx.scale(-1, 1);
                        ctx.drawImage(tex, f * efw + 256, 70, 280, 260, -G.enemyDrawW / 2, -G.enemyDrawH / 2, G.enemyDrawW, G.enemyDrawH);
                        ctx.restore();
                    }
                }

                // Jefes y Estelas
                const bs = getBossSize();
                const bossTex = G.level2 ? images.boss2 : images.boss1;
                if (bossTex) {
                    const tCount = G.level2 ? 16 : 60;
                    const tfw = bossTex.width / tCount;
                    for (const trail of G.dashTrails) {
                        ctx.save();
                        ctx.globalAlpha = trail.alpha * 0.45;
                        if (G.level2) {
                            ctx.drawImage(bossTex, trail.frame * tfw, 0, tfw, bossTex.height, trail.x, trail.y, bs.w, bs.h);
                        } else {
                            ctx.drawImage(bossTex, trail.frame * tfw + 32, 48, 144, 132, trail.x, trail.y, bs.w, bs.h);
                        }
                        ctx.restore();
                    }
                }

                if (G.bossActive && bossTex) {
                    const bfw = bossTex.width / G.bossFrameCount;
                    const appearScale = Math.min(G.bossAppearTimer / 0.8, 1);
                    const appearAlpha = Math.min(G.bossAppearTimer / 0.5, 1);
                    const dw = bs.w * appearScale;
                    const dh = bs.h * appearScale;
                    const dx = G.bossPosition.x + (bs.w - dw) / 2;
                    const dy = G.bossPosition.y + (bs.h - dh) / 2;

                    ctx.save();
                    ctx.globalAlpha = appearAlpha;
                    if (G.bossPhase2) ctx.filter = 'sepia(0.8) saturate(4) hue-rotate(-25deg)';
                    if (G.level2) {
                        ctx.drawImage(bossTex, G.bossFrame * bfw, 0, bfw, bossTex.height, dx, dy, dw, dh);
                    } else {
                        ctx.drawImage(bossTex, G.bossFrame * bfw + 32, 48, 144, 132, dx, dy, dw, dh);
                    }
                    ctx.restore();

                    if (images.bossBar) {
                        const barFW = images.bossBar.width / 11;
                        const barFrame = Math.max(0, Math.min(10, 10 - G.bossHealth));
                        const barW = 780;
                        const barH = 136;
                        const barX = (VIRTUAL_WIDTH - barW) / 2;
                        const barTargetY = VIRTUAL_HEIGHT - barH - 18;
                        const slideRatio = Math.min(G.bossAppearTimer / 0.6, 1);
                        const barY = VIRTUAL_HEIGHT + (barTargetY - VIRTUAL_HEIGHT) * slideRatio;
                        ctx.drawImage(images.bossBar, barFrame * barFW + 14, 96, 701, 122, barX, barY, barW, barH);
                        if (G.bossPhase2) {
                            drawText('FASE 2 - FURIA', VIRTUAL_WIDTH / 2, barY - 28, '#ff6e46', 34, 'center');
                        }
                    }
                }

                if (G.bossDeathActive && images.bossDeath) {
                    const dfw = images.bossDeath.width / 20;
                    ctx.drawImage(
                        images.bossDeath,
                        G.bossDeathFrame * dfw + 80,
                        26,
                        335,
                        463,
                        G.bossPosition.x - 20,
                        G.bossPosition.y - 30,
                        bs.w + 40,
                        bs.h + 60
                    );
                }

                // Bolas de fuego del jefe
                if (images.bossAttack) {
                    const afw = images.bossAttack.width / 5;
                    const fbFrame = Math.floor(G.fireballAge / 0.07) % 5;
                    for (const fb of G.fireballs) {
                        ctx.drawImage(images.bossAttack, fbFrame * afw + 136, 90, 234, 340, fb.x, fb.y, G.fireballDrawW, G.fireballDrawH);
                    }
                }

                // Explosiones
                if (images.explosion) {
                    const exFW = images.explosion.width / 5;
                    for (const exp of G.explosions) {
                        const w = 372 * exp.scale;
                        const h = 346 * exp.scale;
                        ctx.drawImage(images.explosion, exp.frame * exFW + 18, 88, 372, 346, exp.x - w / 2, exp.y - h / 2, w, h);
                    }
                }

                // Retícula de apuntado en modo Dragón (solo cuando se usa mouse en PC)
                if (G.isDragon && !G.gameOver && !G.paused && !G.showTouchControls) {
                    const rx = G.mouse.x;
                    const ry = G.mouse.y;
                    ctx.fillStyle = G.beamFiring ? '#ffdc50' : '#6ee1ff';
                    ctx.fillRect(rx - 14, ry - 2, 10, 4);
                    ctx.fillRect(rx + 4, ry - 2, 10, 4);
                    ctx.fillRect(rx - 2, ry - 14, 4, 10);
                    ctx.fillRect(rx - 2, ry + 4, 4, 10);
                }

                // HUD: Vidas (se desplaza a la derecha si está el botón X de pantalla completa arriba a la izquierda)
                const hudLeftX = isFullscreenRef.current ? 130 : 28;
                if (images.life) {
                    const lifeW = 62;
                    const lifeH = 76;
                    for (let i = 0; i < G.vidas; i++) {
                        const pulse = G.vidas === 1 ? 1 + 0.1 * Math.sin(G.globalTime * 10) : 1;
                        ctx.drawImage(
                            images.life,
                            SRC_LIFE.x,
                            SRC_LIFE.y,
                            SRC_LIFE.w,
                            SRC_LIFE.h,
                            hudLeftX + i * 74,
                            22,
                            lifeW * pulse,
                            lifeH * pulse
                        );
                    }
                }

                const dragonHud = G.isDragon
                    ? '[E] NAVE  |  JOYSTICK DERECHO / CLICK: RAYO SOLAR'
                    : G.transformCooldown > 0
                    ? `[E] DRAGON (${G.transformCooldown.toFixed(1)}s)`
                    : '[E] TRANSFORMAR EN DRAGON';
                const dragonCol = G.isDragon ? '#ffd250' : G.transformCooldown > 0 ? '#94a3b8' : '#6ee1ff';
                drawText(dragonHud, hudLeftX, 110, dragonCol, 32, 'left');

                if (G.arcadeMode) {
                    drawText(`MODO ARCADE  |  RECORD: ${Math.max(G.highScore, G.puntos)}`, hudLeftX, 148, '#ffd700', 36, 'left');
                } else {
                    drawText(G.level2 ? 'CAMPAÑA: NIVEL 2' : 'CAMPAÑA: NIVEL 1', hudLeftX, 148, '#a78bfa', 32, 'left');
                }

                drawText(`PUNTOS: ${G.puntos}`, VIRTUAL_WIDTH - 40, 26, '#ffffff', 52, 'right');

                drawTouchOverlay();

                if (G.paused) {
                    ctx.fillStyle = 'rgba(0,0,0,0.68)';
                    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
                    drawPanel(VIRTUAL_WIDTH / 2 - 350, VIRTUAL_HEIGHT / 2 - 190, 700, 360, 'rgba(12,18,36,0.95)', '#ffdc50', 4);
                    drawText('JUEGO EN PAUSA', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 145, '#ffe150', 54, 'center');
                    for (let pi = 0; pi < G.pauseOptions.length; pi++) {
                        const sel = pi === G.pauseIndex;
                        const label = sel ? `> ${G.pauseOptions[pi]} <` : G.pauseOptions[pi];
                        drawText(label, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 30 + pi * 85, sel ? '#6ee1ff' : '#ffffff', sel ? 44 : 40, 'center');
                    }
                }

                if (G.gameOver) {
                    ctx.fillStyle = 'rgba(0,0,0,0.74)';
                    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
                    const borderCol = G.win ? '#ffd700' : '#ff5050';
                    drawPanel(VIRTUAL_WIDTH / 2 - 460, VIRTUAL_HEIGHT / 2 - 240, 920, 470, 'rgba(12,16,32,0.96)', borderCol, 4);

                    drawText(G.win ? '¡VICTORIA!' : 'GAME OVER', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 190, borderCol, 72, 'center');
                    drawText(`PUNTAJE FINAL: ${G.puntos}`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 75, '#ffffff', 50, 'center');

                    if (G.win && !G.level2) {
                        drawText('PROGRESO GUARDADO: NIVEL 2 DESBLOQUEADO', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 15, '#4ade80', 32, 'center');
                    } else if (G.arcadeMode) {
                        drawText('PUNTUACION ENVIADA AL TABLERO ARCADE', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 15, '#ffd700', 32, 'center');
                    }

                    const enterText =
                        G.win && !G.level2
                            ? 'ENTER o TOQUE AQUI para ir al NIVEL 2'
                            : G.arcadeMode
                            ? 'ENTER o TOQUE AQUI para reiniciar ARCADE'
                            : 'ENTER o TOQUE AQUI para reintentar';
                    drawText(enterText, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 45, '#78e1ff', 40, 'center');
                    drawText('Presiona M o TOQUE AQUI para volver al MENU', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 120, '#d2d2e1', 36, 'center');
                }
            }

            ctx.restore();
        };

        // Bucle principal bloqueado a 60 FPS deterministas
        let animId;
        let lastTime = performance.now();
        let accumulator = 0;
        const FIXED_DT = 1 / 60;

        const loop = (now) => {
            animId = requestAnimationFrame(loop);
            let frameTime = (now - lastTime) / 1000;
            lastTime = now;
            if (frameTime > 0.1) frameTime = 0.1;
            accumulator += frameTime;

            while (accumulator >= FIXED_DT) {
                G.globalTime += FIXED_DT;

                const bgTex = G.level2 ? images.bgLevel2 : images.bgLevel1;
                if (bgTex && bgTex.width > 0) {
                    const bgScaledH = bgTex.height * (VIRTUAL_WIDTH / bgTex.width);
                    G.bgScroll += G.bgScrollSpeed * FIXED_DT;
                    if (G.bgScroll >= bgScaledH) G.bgScroll -= bgScaledH;
                }

                for (const s of G.stars) {
                    s.y += s.speed * FIXED_DT;
                    if (s.y > VIRTUAL_HEIGHT + 10) {
                        s.y = -10;
                        s.x = Math.random() * VIRTUAL_WIDTH;
                    }
                }

                if (G.shakeTimer > 0) {
                    G.shakeTimer -= FIXED_DT;
                    if (G.shakeTimer <= 0) {
                        G.shakeIntensity = 0;
                        G.shakeOffset = { x: 0, y: 0 };
                    } else {
                        G.shakeOffset = {
                            x: (Math.random() * 2 - 1) * G.shakeIntensity,
                            y: (Math.random() * 2 - 1) * G.shakeIntensity
                        };
                    }
                }

                if (G.state === 'MENU') updateMenu();
                else if (G.state === 'CONFIG') updateConfig();
                else if (G.state === 'PLAY') updatePlay(FIXED_DT);

                G.prevKeys = { ...G.keys };
                G.mouse.prevDown = G.mouse.down;
                G.mouse.moved = false;

                accumulator -= FIXED_DT;
            }

            render();
        };

        animId = requestAnimationFrame(loop);

        return () => {
            if (G.puntos > 0 || G.highScore > 0) {
                notifyProgressSave({ score: Math.max(G.puntos, G.highScore) });
            }
            cancelAnimationFrame(animId);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('touchstart', handleTouches);
            canvas.removeEventListener('touchmove', handleTouches);
            canvas.removeEventListener('touchend', handleTouches);
            canvas.removeEventListener('touchcancel', handleTouches);
            Object.values(audios).forEach((a) => {
                try {
                    a.pause();
                } catch {}
            });
        };
    }, [isLoaded]);

    return (
        <div ref={containerRef} className={`gameover-player-shell ${isFullscreen ? 'is-fullscreen' : ''}`}>
            {!isFullscreen && (
                <div className="gameover-player-toolbar">
                    <div className="gameover-player-status">
                        <span className="status-dot"></span>
                        <span>PILOTO: <strong>{playerName || 'PILOTO'}</strong></span>
                        {touchMode && <span className="mobile-badge">MODO MÓVIL ACTIVO</span>}
                    </div>
                    <div className="gameover-player-actions">
                        <button
                            type="button"
                            className="game-tool-btn"
                            onClick={toggleFullscreen}
                        >
                            ⛶ Pantalla Completa
                        </button>
                        {onExitToCatalog && (
                            <button
                                type="button"
                                className="game-tool-btn exit"
                                onClick={onExitToCatalog}
                            >
                                ✕ Volver a la Ficha
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="gameover-canvas-stage">
                {isFullscreen && (
                    <>
                        <button
                            type="button"
                            className="fullscreen-exit-x"
                            onClick={exitFullscreen}
                            aria-label="Salir"
                        >
                            ✕
                        </button>
                        {showFsHint && (
                            <div className="fullscreen-quick-hint">
                                ← Salir de pantalla completa
                            </div>
                        )}
                    </>
                )}
                {!isLoaded && (
                    <div className="gameover-loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>CARGANDO RECURSOS PIXEL ART... {loadingProgress}%</p>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    width={VIRTUAL_WIDTH}
                    height={VIRTUAL_HEIGHT}
                    className="gameover-canvas"
                />
            </div>
        </div>
    );
}
