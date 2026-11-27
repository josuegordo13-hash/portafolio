import { useEffect, useRef, useState } from 'react';
import { WebPixelFont } from '../pixelFontWeb';
import {
    ARENA_RADIUS,
    ART_SCALE,
    ArenaMapRendererWeb,
    AudioEngineWeb,
    PYLON_RING_RADIUS,
    STACK_SPACING,
    STACK_SQUASH,
    SlashVFXBankWeb,
    bakeStackModelWeb,
    drawBakedModelWeb,
    drawSlicedLiveModelWeb
} from '../nucleoCarbonEngine';

const VIRTUAL_W = 1440;
const VIRTUAL_H = 810;
const ASSET_CAPAS = '/games/nucleo-carbon/assets/capas/';

const WEAPON_MELEE = 0;
const WEAPON_RANGED = 1;
const WEAPON_AOE = 2;

const MARK_FIRE = 'fire';
const MARK_CYAN = 'cyan';
const MARK_GRAV = 'grav';

const MARK_COLORS = {
    [MARK_FIRE]: '#ff9824',
    [MARK_CYAN]: '#44e4ff',
    [MARK_GRAV]: '#ff4c9e'
};

const MARK_WEAPONS = {
    [MARK_FIRE]: '1',
    [MARK_CYAN]: '2',
    [MARK_GRAV]: '3'
};

const WEAPON_INFO = [
    {
        key: '1',
        name: 'Cizalla Térmica',
        role: 'Cuerpo a Cuerpo',
        mark: MARK_FIRE,
        color: '#ff9824',
        bright: '#ffe888',
        desc: 'Tajo amplio en arco de 145°. Empuja enemigos, destruye proyectiles y aplica Marca Ígnea.'
    },
    {
        key: '2',
        name: 'Aguja de Riel',
        role: 'A Distancia',
        mark: MARK_CYAN,
        color: '#44e4ff',
        bright: '#d4fcff',
        desc: 'Disparo electromagnético veloz. Cada 4.º tiro perfora en línea recta y aplica Marca Voltaica.'
    },
    {
        key: '3',
        name: 'Cráter Sísmico',
        role: 'Daño en Área',
        mark: MARK_GRAV,
        color: '#ff4c9e',
        bright: '#ffccea',
        desc: 'Lanza un núcleo gravitatorio que detona en área, eleva enemigos, ralentiza y aplica Marca Sísmica.'
    }
];

const MODEL_MANIFEST = {
    guardian_melee_0: { file: 'Guardian Cizalla Firme.png', slices: 22 },
    guardian_melee_1: { file: 'Guardian Cizalla Paso Izq.png', slices: 22 },
    guardian_melee_2: { file: 'Guardian Cizalla Paso Der.png', slices: 22 },
    guardian_ranged_0: { file: 'Guardian Aguja Firme.png', slices: 22 },
    guardian_ranged_1: { file: 'Guardian Aguja Paso Izq.png', slices: 22 },
    guardian_ranged_2: { file: 'Guardian Aguja Paso Der.png', slices: 22 },
    guardian_aoe_0: { file: 'Guardian Crater Firme.png', slices: 22 },
    guardian_aoe_1: { file: 'Guardian Crater Paso Izq.png', slices: 22 },
    guardian_aoe_2: { file: 'Guardian Crater Paso Der.png', slices: 22 },
    skitter_0: { file: 'Acaro de Escoria Firme.png', slices: 14 },
    skitter_1: { file: 'Acaro de Escoria Paso A.png', slices: 14 },
    skitter_2: { file: 'Acaro de Escoria Paso B.png', slices: 14 },
    sentinel_0: { file: 'Centinela Prisma A.png', slices: 20 },
    sentinel_1: { file: 'Centinela Prisma B.png', slices: 20 },
    golem_0: { file: 'Golem de Basalto Firme.png', slices: 25 },
    golem_1: { file: 'Golem de Basalto Paso Izq.png', slices: 25 },
    golem_2: { file: 'Golem de Basalto Paso Der.png', slices: 25 },
    weaver_0: { file: 'Tejedor Volatil A.png', slices: 18 },
    weaver_1: { file: 'Tejedor Volatil B.png', slices: 18 },
    boss_0: { file: 'Coloso del Eje A.png', slices: 28 },
    boss_1: { file: 'Coloso del Eje B.png', slices: 28 },
    pylon_neutral: { file: 'Pilon Inactivo.png', slices: 26 },
    pylon_fire: { file: 'Pilon Igneo.png', slices: 26 },
    pylon_cyan: { file: 'Pilon Voltaico.png', slices: 26 },
    pylon_grav: { file: 'Pilon Sismico.png', slices: 26 },
    pylon_sync: { file: 'Pilon Sincronizado.png', slices: 26 },
    pillar: { file: 'Columna de Basalto.png', slices: 18 },
    crystal: { file: 'Nucleo de Carbon.png', slices: 14 },
    bomb: { file: 'Bomba Sismica.png', slices: 12 },
    brazier: { file: 'Brasero de Forja.png', slices: 18 },
    beacon: { file: 'Baliza de Perimetro.png', slices: 16 },
    weapon_sword: { file: 'Arma Cizalla Termica.png', slices: 8 },
    weapon_railgun: { file: 'Arma Aguja de Riel.png', slices: 9 },
    weapon_hammer: { file: 'Arma Crater Sismico.png', slices: 12 }
};

const BAYER_4X4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
];

function scaleHex(colorStr, factor) {
    const s = String(colorStr || '#4a5880').trim();
    const rgbMatch = s.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        const r = Math.max(0, Math.min(255, Math.round(Number(rgbMatch[1]) * factor)));
        const g = Math.max(0, Math.min(255, Math.round(Number(rgbMatch[2]) * factor)));
        const b = Math.max(0, Math.min(255, Math.round(Number(rgbMatch[3]) * factor)));
        return `rgb(${r}, ${g}, ${b})`;
    }
    const clean = s.replace('#', '');
    const n = parseInt(clean, 16) || 0x4a5880;
    const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * factor)));
    const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * factor)));
    const b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)));
    return `rgb(${r}, ${g}, ${b})`;
}

function buildDitherCurtain(w, h) {
    const curW = Math.min(w, Math.floor(w * 0.64));
    const smallW = Math.max(4, Math.floor(curW / ART_SCALE));
    const smallH = Math.max(4, Math.floor(h / ART_SCALE));
    const small = document.createElement('canvas');
    small.width = smallW;
    small.height = smallH;
    const sctx = small.getContext('2d');
    const img = sctx.createImageData(smallW, smallH);
    const d = img.data;

    for (let y = 0; y < smallH; y++) {
        for (let x = 0; x < smallW; x++) {
            const xs = x / Math.max(1, smallW - 1);
            const density = Math.max(0.0, Math.min(0.90, (0.92 - xs) / 0.42));
            const threshold = (BAYER_4X4[y % 4][x % 4] / 16.0) * 0.88;
            if (density > threshold) {
                const p = (y * smallW + x) * 4;
                d[p] = 10; d[p + 1] = 12; d[p + 2] = 22; d[p + 3] = 210;
            }
        }
    }
    sctx.putImageData(img, 0, 0);

    const out = document.createElement('canvas');
    out.width = curW;
    out.height = h;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(small, 0, 0, curW, h);
    return out;
}

export function NucleoCarbonCanvas({
    playerName = 'PILOTO',
    initialCarbonProfile = null,
    leaderboard = [],
    onSubmitCarbonScore,
    onExitToCatalog
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const assetsRef = useRef(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [touchMode, setTouchMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        return Boolean(isMobileUA || (isCoarse && window.innerWidth <= 1024));
    });

    const callbacksRef = useRef({ onSubmitCarbonScore, onExitToCatalog });
    const playerNameRef = useRef(playerName);
    const profileRef = useRef(initialCarbonProfile);
    const leaderboardRef = useRef(leaderboard);
    const isFullscreenRef = useRef(isFullscreen);

    useEffect(() => {
        callbacksRef.current = { onSubmitCarbonScore, onExitToCatalog };
        playerNameRef.current = playerName;
        profileRef.current = initialCarbonProfile;
        leaderboardRef.current = leaderboard;
        isFullscreenRef.current = isFullscreen;
    }, [onSubmitCarbonScore, onExitToCatalog, playerName, initialCarbonProfile, leaderboard, isFullscreen]);

    const enterFullscreen = async () => {
        setIsFullscreen(true);
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
            // Mantiene el modo pantalla completa CSS en navegadores móviles sin Fullscreen API
        }
    };

    const exitFullscreen = async () => {
        setIsFullscreen(false);
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                await document.exitFullscreen();
            }
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        } catch {
            // Ignorar
        }
    };

    const toggleFullscreen = () => (isFullscreen ? exitFullscreen() : enterFullscreen());

    useEffect(() => {
        const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, []);

    // Carga y pre-horneado 1:1 de modelos Sprite Stacking, VFX y Arena
    useEffect(() => {
        let cancelled = false;
        const models = {};
        const entries = Object.entries(MODEL_MANIFEST);
        let done = 0;

        entries.forEach(([key, spec]) => {
            const img = new Image();
            img.onload = () => {
                if (!cancelled) {
                    models[key] = bakeStackModelWeb(img, spec.slices, ART_SCALE);
                    done++;
                    setLoadingProgress(Math.round((done / entries.length) * 100));
                    if (done >= entries.length) setIsLoaded(true);
                }
            };
            img.onerror = () => {
                if (!cancelled) {
                    done++;
                    setLoadingProgress(Math.round((done / entries.length) * 100));
                    if (done >= entries.length) setIsLoaded(true);
                }
            };
            img.src = ASSET_CAPAS + encodeURI(spec.file);
        });

        const assetBundle = {
            models,
            arenaMap: new ArenaMapRendererWeb(ART_SCALE),
            slashVfx: new SlashVFXBankWeb(ART_SCALE),
            fonts: {
                xs: new WebPixelFont(2, false),
                sm: new WebPixelFont(2, true),
                md: new WebPixelFont(3, true),
                lg: new WebPixelFont(4, true),
                xl: new WebPixelFont(5, true)
            }
        };
        assetsRef.current = assetBundle;
        const canvas = canvasRef.current;
        if (canvas) {
            canvas._carbonModels = assetBundle.models;
            canvas._arenaMap = assetBundle.arenaMap;
            canvas._slashVfx = assetBundle.slashVfx;
            canvas._fonts = assetBundle.fonts;
        }
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const canvas = canvasRef.current;
        const bundle = assetsRef.current;
        if (!canvas || !bundle) return;
        const ctx = canvas.getContext('2d');
        const models = bundle.models || {};
        const arenaMap = bundle.arenaMap;
        const slashVfx = bundle.slashVfx;
        const fonts = bundle.fonts;
        const audio = new AudioEngineWeb();

        let viewW = VIRTUAL_W;
        let viewH = VIRTUAL_H;
        let curtainCache = { w: 0, h: 0, surf: null };

        const syncViewport = () => {
            const rect = canvas.getBoundingClientRect();
            if (rect.width < 20 || rect.height < 20) return;
            const aspect = rect.width / rect.height;
            const nextH = touchMode ? 720 : VIRTUAL_H;
            const nextW = touchMode ? Math.max(1040, Math.round(nextH * Math.max(1.45, aspect))) : VIRTUAL_W;
            if (Math.abs(nextW - viewW) > 1 || Math.abs(nextH - viewH) > 1 || canvas.width !== nextW || canvas.height !== nextH) {
                viewW = nextW;
                viewH = nextH;
                canvas.width = viewW;
                canvas.height = viewH;
            }
        };
        syncViewport();

        const getDitherCurtain = (w, h) => {
            if (curtainCache.surf && curtainCache.w === w && curtainCache.h === h) {
                return curtainCache.surf;
            }
            const surf = buildDitherCurtain(w, h);
            curtainCache = { w, h, surf };
            return surf;
        };

        // ====================================================================
        // CAMERA 2.5D (Port 1:1 de Camera25D en stack_renderer.py)
        // ====================================================================
        const cam = {
            focusX: 0.0,
            focusY: 0.0,
            camX: 0.0,
            camY: 0.0,
            yaw: 0.0,
            targetYaw: 0.0,
            trauma: 0.0,
            shakeIntensity: 0.80,
            shakeTime: 0.0,
            shakeOx: 0.0,
            shakeOy: 0.0,
            addTrauma(amount) {
                this.trauma = Math.min(1.0, this.trauma + amount * this.shakeIntensity);
            },
            rotateBy(deltaRad) {
                this.targetYaw += deltaRad;
            },
            resetYaw() {
                const turns = Math.round(this.targetYaw / (2.0 * Math.PI));
                this.targetYaw = turns * 2.0 * Math.PI;
            },
            update(dt, targetX, targetY, velX, velY, aimWorldX, aimWorldY, arenaLimit) {
                const yawT = 1.0 - Math.exp(-10.0 * dt);
                this.yaw += (this.targetYaw - this.yaw) * yawT;

                const dzX = 14.0, dzY = 10.0;
                const dx = targetX - this.focusX;
                const dy = targetY - this.focusY;
                if (Math.abs(dx) > dzX) this.focusX += (Math.abs(dx) - dzX) * (dx > 0 ? 1.0 : -1.0);
                if (Math.abs(dy) > dzY) this.focusY += (Math.abs(dy) - dzY) * (dy > 0 ? 1.0 : -1.0);

                let leadX = velX * 0.14 + (aimWorldX - targetX) * 0.16;
                let leadY = velY * 0.14 + (aimWorldY - targetY) * 0.16;
                const leadLen = Math.hypot(leadX, leadY);
                if (leadLen > 46.0) {
                    leadX = (leadX / leadLen) * 46.0;
                    leadY = (leadY / leadLen) * 46.0;
                }

                const goalX = Math.max(-arenaLimit * 0.68, Math.min(arenaLimit * 0.68, this.focusX + leadX));
                const goalY = Math.max(-arenaLimit * 0.68, Math.min(arenaLimit * 0.68, this.focusY + leadY));
                const followT = 1.0 - Math.exp(-7.5 * dt);
                this.camX += (goalX - this.camX) * followT;
                this.camY += (goalY - this.camY) * followT;

                if (this.trauma > 0.0) {
                    this.trauma = Math.max(0.0, this.trauma - 1.55 * dt);
                    const sh = this.trauma * this.trauma;
                    this.shakeTime += dt * 34.0;
                    this.shakeOx = 13.0 * sh * Math.sin(this.shakeTime * 1.7);
                    this.shakeOy = 9.5 * sh * Math.sin(this.shakeTime * 2.3);
                } else {
                    this.shakeOx = 0.0;
                    this.shakeOy = 0.0;
                }
            },
            worldToScreen(wx, wy, wz = 0.0) {
                const dx = wx - this.camX;
                const dy = wy - this.camY;
                const c = Math.cos(this.yaw);
                const s = Math.sin(this.yaw);
                const rx = dx * c - dy * s;
                const ry = dx * s + dy * c;
                return {
                    sx: viewW * 0.5 + rx * ART_SCALE + this.shakeOx,
                    sy: viewH * 0.52 + ry * STACK_SQUASH * ART_SCALE - wz * STACK_SPACING * ART_SCALE + this.shakeOy,
                    ry
                };
            },
            screenToWorld(sx, sy) {
                const rx = (sx - this.shakeOx - viewW * 0.5) / ART_SCALE;
                const ry = (sy - this.shakeOy - viewH * 0.52) / (STACK_SQUASH * ART_SCALE);
                const c = Math.cos(-this.yaw);
                const s = Math.sin(-this.yaw);
                return {
                    wx: this.camX + rx * c - ry * s,
                    wy: this.camY + rx * s + ry * c
                };
            }
        };

        // ====================================================================
        // HELPERS DE UI PIXEL-ART FORJADA (Port 1:1 de ui_screens.py)
        // ====================================================================
        const drawForgedPanel = (ctx, x, y, w, h, bg = 'rgba(22, 26, 42, 0.94)', border = '#4a5880', chamfer = 6, rivets = true) => {
            if (w < 8 || h < 8) return;
            const c = Math.max(2, Math.min(chamfer, Math.floor(Math.min(w, h) / 4)));
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            ctx.lineTo(x + w, y + c);
            ctx.lineTo(x + w, y + h - c);
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h - c);
            ctx.lineTo(x, y + c);
            ctx.closePath();

            ctx.fillStyle = bg;
            ctx.fill();

            // Franja interior superior y biseles 3D
            ctx.fillStyle = scaleHex(border, 1.30);
            ctx.fillRect(x + c, y + 1, w - c * 2, 2);
            ctx.fillRect(x + 1, y + c, 2, h - c * 2);

            ctx.fillStyle = scaleHex(border, 0.55);
            ctx.fillRect(x + c, y + h - 3, w - c * 2, 2);
            ctx.fillRect(x + w - 3, y + c, 2, h - c * 2);

            ctx.strokeStyle = '#080a12';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.strokeStyle = border;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (rivets && w >= 48 && h >= 28) {
                const rivCol = scaleHex(border, 1.35);
                const rPts = [
                    [x + c + 4, y + 6],
                    [x + w - c - 7, y + 6],
                    [x + c + 4, y + h - 9],
                    [x + w - c - 7, y + h - 9]
                ];
                for (const [rx, ry] of rPts) {
                    ctx.fillStyle = '#0a0c14';
                    ctx.fillRect(rx - 1, ry - 1, 5, 5);
                    ctx.fillStyle = rivCol;
                    ctx.fillRect(rx, ry, 3, 3);
                }
            }
            ctx.restore();
        };

        const drawWeaponPixelIcon = (wid, cx, cy) => {
            if (wid === WEAPON_MELEE) {
                for (let i = -4; i <= 4; i++) {
                    const px = cx + i * 2;
                    const py = cy - i * 2;
                    ctx.fillStyle = '#0a0c14';
                    ctx.fillRect(px - 3, py - 3, 6, 6);
                    ctx.fillStyle = i > 0 ? '#ffe888' : (i > -2 ? '#ff9824' : '#90a4ca');
                    ctx.fillRect(px - 2, py - 2, 4, 4);
                }
                ctx.fillStyle = '#d6e6fc';
                ctx.fillRect(cx - 6, cy + 2, 6, 3);
            } else if (wid === WEAPON_RANGED) {
                ctx.fillStyle = '#0a0c14';
                ctx.fillRect(cx - 10, cy - 5, 20, 10);
                ctx.fillStyle = '#586686';
                ctx.fillRect(cx - 9, cy - 4, 18, 3);
                ctx.fillRect(cx - 9, cy + 1, 18, 3);
                ctx.fillStyle = '#44e4ff';
                ctx.fillRect(cx - 6, cy - 1, 15, 2);
                ctx.fillStyle = '#d4fcff';
                ctx.fillRect(cx + 6, cy - 2, 4, 4);
            } else {
                ctx.fillStyle = '#0a0c14';
                ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ba2270';
                ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff4c9e';
                ctx.beginPath(); ctx.arc(cx - 1, cy - 1, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffccea';
                ctx.fillRect(cx - 3, cy - 3, 3, 3);
            }
        };

        // Las 3 retículas de arma distintas (Port 1:1 de draw_weapon_reticle en ui_screens.py)
        const drawWeaponReticle = (mx, my, weapon, rangedCounter) => {
            const info = WEAPON_INFO[weapon];
            const col = info.color;
            const bright = info.bright;
            const ix = Math.round(mx), iy = Math.round(my);
            if (weapon === WEAPON_MELEE) {
                ctx.fillStyle = '#0a0c14';
                ctx.fillRect(ix - 12, iy - 2, 24, 4);
                ctx.fillRect(ix - 2, iy - 12, 4, 24);
                ctx.fillStyle = col;
                ctx.fillRect(ix - 11, iy - 1, 7, 2);
                ctx.fillRect(ix + 4, iy - 1, 7, 2);
                ctx.fillRect(ix - 1, iy - 11, 2, 7);
                ctx.fillRect(ix - 1, iy + 4, 2, 7);
                ctx.fillStyle = bright;
                ctx.fillRect(ix - 2, iy - 2, 4, 4);
            } else if (weapon === WEAPON_RANGED) {
                const r = rangedCounter === 3 ? 14 : 10;
                const c = rangedCounter === 3 ? bright : col;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(ix, iy - r);
                ctx.lineTo(ix + r, iy);
                ctx.lineTo(ix, iy + r);
                ctx.lineTo(ix - r, iy);
                ctx.closePath();
                ctx.strokeStyle = '#0a0c14';
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.strokeStyle = c;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(ix - 2, iy - 2, 4, 4);
                ctx.restore();
            } else {
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(ix, iy, 16, 11, 0, 0, Math.PI * 2);
                ctx.strokeStyle = '#0a0c14';
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.strokeStyle = col;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = bright;
                ctx.fillRect(ix - 2, iy - 2, 4, 4);
                ctx.restore();
            }
        };

        // ====================================================================
        // COMBAT WORLD & STATE (Port 1:1 de src/combat_world.py)
        // ====================================================================
        let screenMode = 'title'; // 'title' | 'playing' | 'paused' | 'gameover' | 'options' | 'howto'
        let prevModeBeforeOverlay = 'title';
        let scoreSubmittedThisRun = false;
        let lastBestScore = Number(profileRef.current?.carbonHighScore || 0);
        let bestWave = Number(profileRef.current?.carbonBestWave || 1);
        let bestComboSaved = 1.0;
        let isNewRecord = false;
        let titleTime = 0.0;
        let titleSelectedBtn = 0;
        let modalSelectedBtn = 0;
        let optionsSelectedRow = 0;
        let savedMasterBeforeMute = 0.85;
        let scorePopTimer = 0.0;

        const titleEmbers = Array.from({ length: 42 }, () => [
            (Math.random() * 2 - 1) * 260.0,
            (Math.random() * 2 - 1) * 260.0,
            Math.random() * 46.0,
            12.0 + Math.random() * 14.0
        ]);

        const world = {
            player: null,
            enemies: [],
            pylons: [],
            pillars: [],
            props: [],
            projectiles: [],
            bombs: [],
            crystals: [],
            hazards: [],
            debris: [],
            slashes: [],
            cutFlashes: [],
            muzzleFlashes: [],
            seismicBlasts: [],
            craterDecals: [],
            rings: [],
            bolts: [],
            afterimages: [],
            popups: [],
            embers: [],
            score: 0,
            multiplier: 1.0,
            maxCombo: 1.0,
            comboFreshTimer: 0.0,
            kills: 0,
            cataclysms: 0,
            wave: 1,
            elapsedTime: 0.0,
            spawnQueue: [],
            spawnTimer: 0.0,
            waveClearPause: 0.0,
            pylonCycleTimer: 9.0,
            beamDamageAcc: 0.0,
            waveBannerTitle: '',
            waveBannerSub: '',
            waveBannerTimer: 0.0,
            hitStopTimer: 0.0,
            nextUid: 1
        };

        const initStaticArena = () => {
            world.pylons = [
                { idx: 0, wx: PYLON_RING_RADIUS, wy: 0.0, state: 'neutral', timer: 0.0, maxTimer: 16.0, chargeHits: 0, swayPhase: 0.0 },
                { idx: 1, wx: 0.0, wy: PYLON_RING_RADIUS, state: 'neutral', timer: 0.0, maxTimer: 16.0, chargeHits: 0, swayPhase: 1.6 },
                { idx: 2, wx: -PYLON_RING_RADIUS, wy: 0.0, state: 'neutral', timer: 0.0, maxTimer: 16.0, chargeHits: 0, swayPhase: 3.2 },
                { idx: 3, wx: 0.0, wy: -PYLON_RING_RADIUS, state: 'neutral', timer: 0.0, maxTimer: 16.0, chargeHits: 0, swayPhase: 4.8 }
            ];
            world.pillars = [];
            for (let i = 0; i < 6; i++) {
                const ang = i * (Math.PI / 3.0) + Math.PI / 6.0;
                const rad = i % 2 === 0 ? 104.0 : 218.0;
                world.pillars.push({ wx: Math.cos(ang) * rad, wy: Math.sin(ang) * rad, radius: 11.5 });
            }
            world.props = [];
            for (let i = 0; i < 4; i++) {
                const ang = Math.PI * 0.25 + i * (Math.PI * 0.5);
                world.props.push({ kind: 'brazier', wx: Math.cos(ang) * 238.0, wy: Math.sin(ang) * 238.0, radius: 9.5, phase: i * 1.3 });
            }
            for (const [vx, vy] of arenaMap.octVertices) {
                world.props.push({ kind: 'beacon', wx: vx * 0.945, wy: vy * 0.945, radius: 0.0, phase: 0.0 });
            }
            world.embers = Array.from({ length: 38 }, () => [
                (Math.random() * 2 - 1) * ARENA_RADIUS,
                (Math.random() * 2 - 1) * ARENA_RADIUS,
                Math.random() * 38.0,
                10.0 + Math.random() * 12.0
            ]);
        };

        const difficultyScale = () => {
            const minutes = world.elapsedTime / 60.0;
            return 1.0 + 0.12 * (world.wave - 1) + 0.22 * minutes;
        };

        const addScore = (basePts, refreshCombo = true) => {
            const gained = Math.round(basePts * world.multiplier);
            world.score += gained;
            scorePopTimer = 0.16;
            if (refreshCombo) world.comboFreshTimer = 6.5;
            return gained;
        };

        const boostMultiplier = (delta) => {
            world.multiplier = Math.min(10.0, Math.round((world.multiplier + delta) * 100) / 100);
            world.maxCombo = Math.max(world.maxCombo, world.multiplier);
            bestComboSaved = Math.max(bestComboSaved, world.maxCombo);
            world.comboFreshTimer = 7.0;
        };

        const triggerHitStop = (duration) => {
            world.hitStopTimer = Math.max(world.hitStopTimer, duration);
        };

        const spawnSparks = (wx, wy, wz, color, count) => {
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2.0;
                const spd = 30.0 + Math.random() * 65.0;
                world.debris.push({
                    wx,
                    wy,
                    wz,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    vz: 30.0 + Math.random() * 60.0,
                    color,
                    size: 3,
                    life: 0.35,
                    maxLife: 0.35
                });
            }
        };

        const prepareWave = (waveNum) => {
            world.wave = waveNum;
            world.spawnQueue = [];
            const isBossWave = (waveNum % 5 === 0);
            let budget = 7 + waveNum * 4 + Math.floor(Math.pow(waveNum, 1.25) * 1.4);
            const eliteChance = waveNum < 3 ? 0.0 : Math.min(0.42, 0.06 * (waveNum - 2));

            if (isBossWave) {
                world.spawnQueue.push({ kind: 'boss', elite: waveNum >= 10 });
                budget = Math.max(6, Math.floor(budget / 2));
            }

            while (budget > 0) {
                const choices = [['skitter', 1, 3.2]];
                if (waveNum >= 2) choices.push(['sentinel', 2, 2.2]);
                if (waveNum >= 3 && budget >= 3) choices.push(['golem', 3, 1.5]);
                if (waveNum >= 4 && budget >= 2) choices.push(['weaver', 2, 1.6]);

                const totalW = choices.reduce((s, c) => s + c[2], 0);
                let pickR = Math.random() * totalW;
                let chosenKind = 'skitter', cost = 1;
                for (const [k, cst, wt] of choices) {
                    pickR -= wt;
                    if (pickR <= 0) {
                        chosenKind = k;
                        cost = cst;
                        break;
                    }
                }
                world.spawnQueue.push({ kind: chosenKind, elite: Math.random() < eliteChance });
                budget -= cost;
            }

            // Mezclar cola y asegurar que el Jefe entre pronto
            for (let i = world.spawnQueue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [world.spawnQueue[i], world.spawnQueue[j]] = [world.spawnQueue[j], world.spawnQueue[i]];
            }
            const bossIdx = world.spawnQueue.findIndex((x) => x.kind === 'boss');
            if (bossIdx > 2) {
                const [bossItem] = world.spawnQueue.splice(bossIdx, 1);
                world.spawnQueue.splice(2, 0, bossItem);
            }

            world.spawnTimer = 0.45;
            world.waveBannerTimer = 2.8;
            if (isBossWave) {
                world.waveBannerTitle = `¡OLEADA ${waveNum} — COLOSO DEL EJE!`;
                world.waveBannerSub = 'Combina las 3 armas para quebrar su blindaje con Cataclismos';
            } else if (waveNum === 1) {
                world.waveBannerTitle = 'OLEADA 1 — DEFENSA DEL NÚCLEO';
                world.waveBannerSub = 'Alterna [1] Cizalla, [2] Aguja y [3] Cráter para detonar Resonancia';
            } else {
                world.waveBannerTitle = `OLEADA ${waveNum}`;
                world.waveBannerSub = `Presión hostil x${difficultyScale().toFixed(2)} • Atento a los Pilones`;
            }
            audio.playSfx('wave_horn', 0.85);
        };

        const spawnEnemy = (kind, elite = false) => {
            const ang = Math.random() * Math.PI * 2.0;
            const dist = ARENA_RADIUS - 22.0;
            const wx = Math.cos(ang) * dist;
            const wy = Math.sin(ang) * dist;
            const scale = difficultyScale();
            const elHp = elite ? 1.65 : 1.0;
            const elSpd = elite ? 1.16 : 1.0;
            const elPts = elite ? 2 : 1;

            const specs = {
                skitter: [34.0, 74.0, 8.5, 90],
                sentinel: [48.0, 56.0, 9.5, 145],
                golem: [118.0, 44.0, 13.0, 240],
                weaver: [58.0, 60.0, 9.5, 175],
                boss: [560.0, 40.0, 17.5, 1600]
            };
            const [baseHp, baseSpd, rad, pts] = specs[kind];
            const speedBoost = Math.min(1.55, 1.0 + (scale - 1.0) * 0.28) * elSpd;
            const hp = baseHp * scale * elHp;

            const en = {
                uid: world.nextUid++,
                kind,
                wx,
                wy,
                wz: 0.0,
                vz: 0.0,
                vx: 0.0,
                vy: 0.0,
                heading: Math.atan2(-wy, -wx) - Math.PI * 0.5,
                hp,
                maxHp: hp,
                speed: baseSpd * speedBoost,
                radius: rad,
                scoreValue: pts * elPts,
                elite,
                marks: new Set(),
                fusedDual: false,
                slowTimer: 0.0,
                hasteTimer: 0.0,
                flashTimer: 0.0,
                spawnBloom: 0.02,
                aiState: 'chase',
                aiTimer: 0.6 + Math.random() * 0.8,
                chargeDx: 0.0,
                chargeDy: 0.0,
                animPhase: 0.0
            };
            world.enemies.push(en);
            world.rings.push({ wx, wy, wz: 0.5, maxRadius: rad * 2.1, color: '#ff7a40', life: 0.35, maxLife: 0.35, width: 2 });
            return en;
        };

        const resetRun = () => {
            world.player = {
                wx: 0.0,
                wy: 0.0,
                wz: 0.0,
                vx: 0.0,
                vy: 0.0,
                heading: 0.0,
                hp: 100.0,
                maxHp: 100.0,
                shield: 40.0,
                maxShield: 40.0,
                shieldDelay: 0.0,
                dashes: 2,
                maxDashes: 2,
                dashRecharge: 0.0,
                dashTimer: 0.0,
                dashDx: 0.0,
                dashDy: 0.0,
                invulnTimer: 0.0,
                flashTimer: 0.0,
                weapon: WEAPON_MELEE,
                weaponCd: [0.0, 0.0, 0.0],
                meleeCombo: 0,
                meleeComboReset: 0.0,
                rangedCounter: 0,
                diamondOverdrive: 0.0,
                walkPhase: 0.0,
                zSquash: 1.0,
                swingTimer: 0.0,
                swingMax: 0.19,
                swingDir: 0.0,
                swingVariant: 'normal_cw',
                attackAngle: 0.0,
                recoilTimer: 0.0,
                recoilMax: 0.16,
                hammerSlamTimer: 0.0,
                alive: true
            };
            world.enemies = [];
            world.projectiles = [];
            world.bombs = [];
            world.crystals = [];
            world.hazards = [];
            world.debris = [];
            world.slashes = [];
            world.cutFlashes = [];
            world.muzzleFlashes = [];
            world.seismicBlasts = [];
            world.craterDecals = [];
            world.rings = [];
            world.bolts = [];
            world.afterimages = [];
            world.popups = [];

            for (const p of world.pylons) {
                p.state = 'neutral';
                p.timer = 0.0;
                p.chargeHits = 0;
            }

            world.score = 0;
            world.multiplier = 1.0;
            world.maxCombo = 1.0;
            world.comboFreshTimer = 0.0;
            world.kills = 0;
            world.cataclysms = 0;
            world.wave = 1;
            world.elapsedTime = 0.0;
            world.pylonCycleTimer = 9.0;
            world.hitStopTimer = 0.0;
            scoreSubmittedThisRun = false;
            isNewRecord = false;

            cam.camX = 0.0;
            cam.camY = 0.0;
            cam.focusX = 0.0;
            cam.focusY = 0.0;
            cam.yaw = 0.0;
            cam.targetYaw = 0.0;
            cam.trauma = 0.0;

            prepareWave(1);
        };

        initStaticArena();
        resetRun();

        const clampToArena = (wx, wy, margin = 10.0) => {
            const lim = ARENA_RADIUS - margin;
            const d = Math.hypot(wx, wy);
            if (d > lim && d > 1e-4) {
                return [(wx / d) * lim, (wy / d) * lim];
            }
            return [wx, wy];
        };

        const resolveObstaclesAndBounds = (wx, wy, radius) => {
            for (const pil of world.pillars) {
                const dx = wx - pil.wx, dy = wy - pil.wy;
                const d = Math.hypot(dx, dy);
                const minD = pil.radius + radius;
                if (d > 0.001 && d < minD) {
                    wx = pil.wx + (dx / d) * minD;
                    wy = pil.wy + (dy / d) * minD;
                }
            }
            for (const py of world.pylons) {
                const dx = wx - py.wx, dy = wy - py.wy;
                const d = Math.hypot(dx, dy);
                const minD = 10.5 + radius;
                if (d > 0.001 && d < minD) {
                    wx = py.wx + (dx / d) * minD;
                    wy = py.wy + (dy / d) * minD;
                }
            }
            for (const prp of world.props) {
                if (prp.radius <= 0.0) continue;
                const dx = wx - prp.wx, dy = wy - prp.wy;
                const d = Math.hypot(dx, dy);
                const minD = prp.radius + radius;
                if (d > 0.001 && d < minD) {
                    wx = prp.wx + (dx / d) * minD;
                    wy = prp.wy + (dy / d) * minD;
                }
            }
            return clampToArena(wx, wy, radius);
        };

        const pointSegDist = (px, py, x1, y1, x2, y2) => {
            const vx = x2 - x1, vy = y2 - y1;
            const l2 = vx * vx + vy * vy;
            if (l2 <= 1e-5) return Math.hypot(px - x1, py - y1);
            const t = Math.max(0.0, Math.min(1.0, ((px - x1) * vx + (py - y1) * vy) / l2));
            return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
        };

        const getPlayerModelId = () => {
            const p = world.player;
            const prefix = p.weapon === WEAPON_MELEE ? 'guardian_melee' : (p.weapon === WEAPON_RANGED ? 'guardian_ranged' : 'guardian_aoe');
            const moving = Math.hypot(p.vx, p.vy) > 18.0;
            if (!moving) return `${prefix}_0`;
            const step = Math.floor(p.walkPhase) % 4;
            const suffix = step === 1 ? 1 : (step === 3 ? 2 : 0);
            return `${prefix}_${suffix}`;
        };

        const getEnemyModelId = (en) => {
            if (en.kind === 'skitter' || en.kind === 'golem') {
                const step = Math.floor(en.animPhase) % 4;
                const s = step === 1 ? 1 : (step === 3 ? 2 : 0);
                return `${en.kind}_${s}`;
            }
            const s = Math.floor(en.animPhase * 0.5) % 2;
            return `${en.kind}_${s}`;
        };

        const switchWeapon = (wid) => {
            if ([WEAPON_MELEE, WEAPON_RANGED, WEAPON_AOE].includes(wid) && world.player.weapon !== wid) {
                world.player.weapon = wid;
                world.player.zSquash = 1.14;
                audio.playSfx('ui_move', 0.55);
            }
        };

        const cycleWeapon = (delta) => {
            switchWeapon((world.player.weapon + delta + 3) % 3);
        };

        const killEnemy = (en) => {
            const idx = world.enemies.indexOf(en);
            if (idx === -1) return;
            world.enemies.splice(idx, 1);
            world.kills += 1;
            addScore(en.scoreValue);

            // Explosión de escombros con los colores reales de las capas del modelo Sprite Stacking
            const baseModel = models[`${en.kind}_0`];
            const colors = baseModel?.topColors || ['rgb(212, 96, 88)'];
            const pieces = en.kind === 'boss' ? 22 : (en.kind === 'golem' ? 13 : 9);
            for (let i = 0; i < pieces; i++) {
                const col = colors[Math.min(colors.length - 1, Math.floor((i * colors.length) / pieces))];
                const ang = Math.random() * Math.PI * 2.0;
                const spd = 35.0 + Math.random() * 80.0;
                world.debris.push({
                    wx: en.wx + (Math.random() * 8.0 - 4.0),
                    wy: en.wy + (Math.random() * 8.0 - 4.0),
                    wz: en.wz + 2.0 + Math.random() * 14.0,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    vz: 45.0 + Math.random() * 80.0,
                    color: col,
                    size: (en.kind === 'golem' || en.kind === 'boss') ? 4 : 3,
                    life: 0.55 + Math.random() * 0.40,
                    maxLife: 0.95
                });
            }

            if (en.kind === 'weaver') {
                world.hazards.push({ wx: en.wx, wy: en.wy, radius: 34.0, kind: 'corrupt', life: 1.8, maxLife: 1.8, tickAcc: 0.0 });
            }

            if (en.elite || en.kind === 'boss' || Math.random() < 0.24) {
                const dropN = en.kind === 'boss' ? 5 : 1;
                for (let k = 0; k < dropN; k++) {
                    const a = Math.random() * Math.PI * 2.0;
                    world.crystals.push({
                        wx: en.wx + Math.cos(a) * 10.0,
                        wy: en.wy + Math.sin(a) * 10.0,
                        wz: 3.0,
                        vz: 52.0,
                        life: 12.0,
                        phase: Math.random() * Math.PI * 2.0
                    });
                }
            }

            if (en.kind === 'boss') {
                cam.addTrauma(0.85);
                triggerHitStop(0.095);
                world.popups.push({ wx: en.wx, wy: en.wy, wz: 34.0, text: '¡COLOSO DESTRUIDO!', color: '#ffe888', life: 1.3, maxLife: 1.3, big: true });
            }
        };

        function triggerDualFusion(source) {
            const m = source.marks;
            audio.playSfx('fusion', 0.85);
            boostMultiplier(0.15);
            addScore(120);

            if (m.has(MARK_FIRE) && m.has(MARK_CYAN)) {
                world.popups.push({ wx: source.wx, wy: source.wy, wz: 24.0, text: 'ARCO VOLTAICO', color: '#8cf5ff', life: 0.7, maxLife: 0.7, big: false });
                const peers = world.enemies
                    .filter((e) => e !== source)
                    .sort((a, b) => Math.hypot(a.wx - source.wx, a.wy - source.wy) - Math.hypot(b.wx - source.wx, b.wy - source.wy))
                    .slice(0, 3);
                let prevX = source.wx, prevY = source.wy;
                for (const peer of peers) {
                    if (Math.hypot(peer.wx - prevX, peer.wy - prevY) <= 135.0) {
                        const midX = (prevX + peer.wx) * 0.5 + (Math.random() * 16.0 - 8.0);
                        const midY = (prevY + peer.wy) * 0.5 + (Math.random() * 16.0 - 8.0);
                        world.bolts.push({
                            pts: [[prevX, prevY, 11.0], [midX, midY, 14.0], [peer.wx, peer.wy, 11.0]],
                            color: '#78f4ff',
                            life: 0.24,
                            maxLife: 0.24
                        });
                        prevX = peer.wx;
                        prevY = peer.wy;
                        damageEnemy(peer, 24.0, null, 0, 0);
                    }
                }
            } else if (m.has(MARK_CYAN) && m.has(MARK_GRAV)) {
                world.popups.push({ wx: source.wx, wy: source.wy, wz: 24.0, text: 'POZO MAGNÉTICO', color: '#e196ff', life: 0.7, maxLife: 0.7, big: false });
                world.rings.push({ wx: source.wx, wy: source.wy, wz: 3.0, maxRadius: 82.0, color: '#a880ff', life: 0.30, maxLife: 0.30, width: 3 });
                for (const other of world.enemies) {
                    if (other !== source) {
                        const dx = source.wx - other.wx, dy = source.wy - other.wy;
                        const d = Math.hypot(dx, dy);
                        if (d > 4.0 && d <= 92.0) {
                            const pull = other.kind !== 'boss' ? 175.0 : 40.0;
                            other.vx += (dx / d) * pull;
                            other.vy += (dy / d) * pull;
                        }
                    }
                }
            } else {
                world.popups.push({ wx: source.wx, wy: source.wy, wz: 24.0, text: 'FISURA DE MAGMA', color: '#ffb048', life: 0.7, maxLife: 0.7, big: false });
                world.hazards.push({ wx: source.wx, wy: source.wy, radius: 44.0, kind: 'magma', life: 3.6, maxLife: 3.6, tickAcc: 0.0 });
            }
        }

        function triggerTriadicCataclysm(epicenter) {
            const cx = epicenter.wx, cy = epicenter.wy;
            world.cataclysms += 1;
            audio.playSfx('cataclysm', 1.0, -5.5);
            cam.addTrauma(0.62);
            triggerHitStop(0.068);

            const p = world.player;
            p.shield = Math.min(p.maxShield, p.shield + 10.0);
            p.hp = Math.min(p.maxHp, p.hp + 4.0);
            if (p.dashes < p.maxDashes) p.dashes += 1;

            boostMultiplier(0.45);
            const pts = addScore(350);

            world.rings.push({ wx: cx, wy: cy, wz: 2.0, maxRadius: 84.0, color: '#ffe888', life: 0.44, maxLife: 0.44, width: 4 });
            world.rings.push({ wx: cx, wy: cy, wz: 10.0, maxRadius: 62.0, color: '#58f49c', life: 0.36, maxLife: 0.36, width: 3 });
            world.bolts.push({ pts: [[cx, cy, 0.0], [cx, cy, 68.0]], color: '#fff8c4', life: 0.34, maxLife: 0.34 });
            world.popups.push({ wx: cx, wy: cy, wz: 30.0, text: `¡CATACLISMO TRIÁDICO! +${pts}`, color: '#fff08c', life: 1.05, maxLife: 1.05, big: true });
            spawnSparks(cx, cy, 12.0, '#ffe888', 16);

            for (let k = 0; k < 2; k++) {
                const ang = Math.random() * Math.PI * 2.0;
                world.crystals.push({
                    wx: cx + Math.cos(ang) * 14.0,
                    wy: cy + Math.sin(ang) * 14.0,
                    wz: 4.0,
                    vz: 58.0,
                    life: 12.0,
                    phase: Math.random() * Math.PI * 2.0
                });
            }

            epicenter.hp -= 75.0;
            for (const other of [...world.enemies]) {
                if (other !== epicenter && Math.hypot(other.wx - cx, other.wy - cy) <= 78.0) {
                    other.vz = Math.max(other.vz, other.kind !== 'boss' ? 75.0 : 30.0);
                    damageEnemy(other, 44.0, null, 0, 0);
                }
            }
        }

        function damageEnemy(en, dmg, mark, kx = 0.0, ky = 0.0) {
            if (!world.enemies.includes(en)) return;
            en.hp -= dmg;
            en.flashTimer = 0.09;
            const kbResist = (en.kind === 'golem' || en.kind === 'boss') ? 0.22 : 1.0;
            en.vx += kx * kbResist;
            en.vy += ky * kbResist;
            world.comboFreshTimer = 6.5;
            audio.playSfx('hit', 0.65);

            if (mark && !en.marks.has(mark)) {
                en.marks.add(mark);
                if (en.marks.size === 2 && !en.fusedDual) {
                    en.fusedDual = true;
                    triggerDualFusion(en);
                } else if (en.marks.size >= 3) {
                    en.marks.clear();
                    en.fusedDual = false;
                    triggerTriadicCataclysm(en);
                }
            }

            if (world.enemies.includes(en) && en.hp <= 0.0) {
                killEnemy(en);
            }
        }

        const hitPylon = (pylon, weaponMark) => {
            if (![MARK_FIRE, MARK_CYAN, MARK_GRAV].includes(pylon.state)) return;
            if (pylon.state !== weaponMark) return;

            pylon.chargeHits += 1;
            spawnSparks(pylon.wx, pylon.wy, 14.0, '#58f49c', 6);
            pylon.state = 'sync';
            pylon.timer = 11.5;
            pylon.maxTimer = 11.5;
            pylon.chargeHits = 0;

            audio.playSfx('pylon_sync', 0.95);
            cam.addTrauma(0.26);
            boostMultiplier(0.30);
            const pts = addScore(450);
            world.rings.push({ wx: pylon.wx, wy: pylon.wy, wz: 8.0, maxRadius: 56.0, color: '#58f49c', life: 0.38, maxLife: 0.38, width: 3 });
            world.popups.push({ wx: pylon.wx, wy: pylon.wy, wz: 30.0, text: `¡PILÓN SINCRONIZADO! +${pts}`, color: '#58f49c', life: 0.95, maxLife: 0.95, big: true });

            const synced = world.pylons.filter((p) => p.state === 'sync');
            const pending = world.pylons.filter((p) => [MARK_FIRE, MARK_CYAN, MARK_GRAV].includes(p.state));
            if (synced.length >= 2 && pending.length === 0) {
                world.player.diamondOverdrive = Math.max(world.player.diamondOverdrive, 8.5);
                const bonus = addScore(900);
                world.popups.push({
                    wx: world.player.wx,
                    wy: world.player.wy,
                    wz: 32.0,
                    text: `¡¡MODO DIAMANTE!! +${bonus}`,
                    color: '#d6ffe8',
                    life: 1.2,
                    maxLife: 1.2,
                    big: true
                });
            }
        };

        const detonateSeismicBomb = (bx, by) => {
            const blastR = 64.0;
            const dmg = 40.0 * (world.player.diamondOverdrive > 0.0 ? 1.25 : 1.0);
            audio.playSfx('aoe_boom', 0.95, -3.5);
            cam.addTrauma(0.40);
            triggerHitStop(0.038);

            world.seismicBlasts.push({ wx: bx, wy: by, life: 0.32, maxLife: 0.32 });
            world.craterDecals.push({ wx: bx, wy: by, life: 3.2, maxLife: 3.2 });
            world.bolts.push({ pts: [[bx, by, 0.0], [bx, by, 44.0]], color: '#ff60b0', life: 0.20, maxLife: 0.20 });
            world.rings.push({ wx: bx, wy: by, wz: 1.5, maxRadius: blastR, color: '#ff4c9e', life: 0.34, maxLife: 0.34, width: 4 });
            world.rings.push({ wx: bx, wy: by, wz: 8.0, maxRadius: blastR * 0.72, color: '#ffccea', life: 0.24, maxLife: 0.24, width: 2 });
            spawnSparks(bx, by, 7.0, '#ff4c9e', 12);

            // 7 rocas de basalto saltando del impacto
            for (let i = 0; i < 7; i++) {
                const a = Math.random() * Math.PI * 2.0;
                const spd = 35.0 + Math.random() * 60.0;
                world.debris.push({
                    wx: bx,
                    wy: by,
                    wz: 4.0,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    vz: 75.0 + Math.random() * 70.0,
                    color: 'rgb(54, 63, 94)',
                    size: 4,
                    life: 0.65,
                    maxLife: 0.65
                });
            }

            for (const en of [...world.enemies]) {
                const dx = en.wx - bx, dy = en.wy - by;
                const d = Math.hypot(dx, dy);
                if (d <= blastR + en.radius) {
                    const ux = dx / Math.max(1.0, d), uy = dy / Math.max(1.0, d);
                    en.vz = Math.max(en.vz, en.kind !== 'boss' ? 92.0 : 42.0);
                    en.slowTimer = Math.max(en.slowTimer, 2.3);
                    damageEnemy(en, dmg, MARK_GRAV, ux * 85.0, uy * 85.0);
                }
            }

            for (const py of world.pylons) {
                if (Math.hypot(py.wx - bx, py.wy - by) <= blastR + 14.0) {
                    hitPylon(py, MARK_GRAV);
                }
            }
        };

        const hurtPlayer = (dmg, srcX, srcY) => {
            const p = world.player;
            if (!p.alive || p.invulnTimer > 0.0) return;
            p.invulnTimer = 0.55;
            p.flashTimer = 0.22;
            p.shieldDelay = 3.8;

            let hullHit = false;
            if (p.shield >= dmg) {
                p.shield -= dmg;
            } else {
                const rem = dmg - p.shield;
                p.shield = 0.0;
                p.hp = Math.max(0.0, p.hp - rem);
                hullHit = true;
            }

            const dx = p.wx - srcX, dy = p.wy - srcY;
            const d = Math.max(1.0, Math.hypot(dx, dy));
            p.vx += (dx / d) * 95.0;
            p.vy += (dy / d) * 95.0;

            audio.playSfx('hurt', 0.95, -4.5);
            cam.addTrauma(0.45);

            if (hullHit && world.multiplier > 1.0) {
                world.multiplier = Math.max(1.0, Math.round((1.0 + (world.multiplier - 1.0) * 0.55) * 100) / 100);
            }

            if (p.hp <= 0.0) {
                p.alive = false;
                spawnSparks(p.wx, p.wy, 10.0, '#ff9824', 24);
                isNewRecord = world.score > lastBestScore;
                if (isNewRecord) lastBestScore = world.score;
                if (world.wave > bestWave) bestWave = world.wave;
                modalSelectedBtn = 0;
                screenMode = 'gameover';

                if (!scoreSubmittedThisRun) {
                    scoreSubmittedThisRun = true;
                    callbacksRef.current.onSubmitCarbonScore?.(world.score, world.wave);
                }
            }
        };

        const tryDash = (moveX, moveY, aimWx, aimWy) => {
            const p = world.player;
            if (!p.alive || p.dashes <= 0 || p.dashTimer > 0.0) return;
            let wxD, wyD;
            if (Math.abs(moveX) > 0.05 || Math.abs(moveY) > 0.05) {
                const c = Math.cos(-cam.yaw), s = Math.sin(-cam.yaw);
                wxD = moveX * c - moveY * s;
                wyD = moveX * s + moveY * c;
            } else {
                wxD = aimWx - p.wx;
                wyD = aimWy - p.wy;
            }
            const ln = Math.hypot(wxD, wyD);
            if (ln < 1e-4) { wxD = 0.0; wyD = 1.0; }
            else { wxD /= ln; wyD /= ln; }

            p.dashes -= 1;
            p.dashTimer = 0.17;
            p.invulnTimer = Math.max(p.invulnTimer, 0.24);
            p.dashDx = wxD;
            p.dashDy = wyD;
            p.zSquash = 0.76;
            audio.playSfx('dash', 0.9);
            world.rings.push({ wx: p.wx, wy: p.wy, wz: 1.0, maxRadius: 22.0, color: '#58f49c', life: 0.22, maxLife: 0.22, width: 2 });
        };

        const tryAttack = (aimWx, aimWy) => {
            const p = world.player;
            if (!p.alive) return;
            const w = p.weapon;
            if (p.weaponCd[w] > 0.0) return;

            const cdMult = p.diamondOverdrive > 0.0 ? 0.65 : 1.0;
            const dx = aimWx - p.wx, dy = aimWy - p.wy;
            const dist = Math.hypot(dx, dy);
            const ang = dist > 1e-3 ? Math.atan2(dy, dx) : (p.heading + Math.PI * 0.5);
            p.heading = ang - Math.PI * 0.5;

            if (w === WEAPON_MELEE) {
                const comboIdx = p.meleeCombo;
                const isFinisher = comboIdx === 2;
                p.weaponCd[w] = (isFinisher ? 0.31 : 0.24) * cdMult;
                p.meleeCombo = (comboIdx + 1) % 3;
                p.meleeComboReset = 1.15;
                p.zSquash = 0.84;
                const durSw = isFinisher ? 0.21 : 0.18;
                p.swingTimer = durSw;
                p.swingMax = durSw;
                p.swingDir = comboIdx % 2 === 0 ? 1.0 : -1.0;
                p.attackAngle = ang;

                p.vx += Math.cos(ang) * (isFinisher ? 95.0 : 60.0);
                p.vy += Math.sin(ang) * (isFinisher ? 95.0 : 60.0);

                const reach = isFinisher ? 64.0 : 54.0;
                const span = ((isFinisher ? 195.0 : 148.0) * Math.PI) / 180.0;
                let dmg = isFinisher ? 46.0 : 32.0;
                if (p.diamondOverdrive > 0.0) dmg *= 1.25;

                const variant = isFinisher ? 'finisher' : (comboIdx === 0 ? 'normal_cw' : 'normal_ccw');
                p.swingVariant = variant;
                audio.playSfx('melee', 0.95);
                world.slashes.push({ wx: p.wx, wy: p.wy, angle: ang, variant, life: durSw, maxLife: durSw });

                const keptProj = [];
                let slicedAny = false;
                for (const pr of world.projectiles) {
                    if (!pr.friendly) {
                        const pdx = pr.wx - p.wx, pdy = pr.wy - p.wy;
                        const pdist = Math.hypot(pdx, pdy);
                        const pang = Math.atan2(pdy, pdx);
                        const diff = Math.abs(((pang - ang + Math.PI) % (2.0 * Math.PI) + 2.0 * Math.PI) % (2.0 * Math.PI) - Math.PI);
                        if (pdist <= reach + 6.0 && diff <= span * 0.54) {
                            slicedAny = true;
                            addScore(50, true);
                            spawnSparks(pr.wx, pr.wy, 8.0, '#ffe080', 5);
                            continue;
                        }
                    }
                    keptProj.push(pr);
                }
                world.projectiles = keptProj;
                if (slicedAny) {
                    world.popups.push({ wx: p.wx, wy: p.wy, wz: 22.0, text: '¡DESVÍO!', color: '#ffe888', life: 0.55, maxLife: 0.55, big: false });
                }

                let hitCount = 0;
                for (const en of [...world.enemies]) {
                    const edx = en.wx - p.wx, edy = en.wy - p.wy;
                    const edist = Math.hypot(edx, edy);
                    if (edist <= reach + en.radius) {
                        const eang = Math.atan2(edy, edx);
                        const diff = Math.abs(((eang - ang + Math.PI) % (2.0 * Math.PI) + 2.0 * Math.PI) % (2.0 * Math.PI) - Math.PI);
                        if (diff <= span * 0.54 || edist < en.radius + 11.0) {
                            const kb = isFinisher ? 140.0 : 98.0;
                            const cutAng = ang + (comboIdx % 2 === 0 ? 0.55 : -0.55);
                            world.cutFlashes.push({
                                wx: en.wx,
                                wy: en.wy,
                                wz: en.wz + 9.0,
                                angle: cutAng,
                                length: isFinisher ? 24.0 : 18.0,
                                color: '#ffec94',
                                life: 0.16,
                                maxLife: 0.16
                            });
                            spawnSparks(en.wx, en.wy, en.wz + 9.0, '#ffb240', 5);
                            damageEnemy(en, dmg, MARK_FIRE, Math.cos(ang) * kb, Math.sin(ang) * kb);
                            hitCount += 1;
                        }
                    }
                }

                for (const py of world.pylons) {
                    if (Math.hypot(py.wx - p.wx, py.wy - p.wy) <= reach + 15.0) {
                        hitPylon(py, MARK_FIRE);
                    }
                }

                if (hitCount > 0) {
                    cam.addTrauma(isFinisher ? 0.26 : 0.15);
                    if (isFinisher) triggerHitStop(0.042);
                }
            } else if (w === WEAPON_RANGED) {
                const isPierce = p.rangedCounter === 3;
                p.rangedCounter = (p.rangedCounter + 1) % 4;
                p.weaponCd[w] = (isPierce ? 0.22 : 0.15) * cdMult;
                p.zSquash = 1.10;
                p.recoilTimer = isPierce ? 0.15 : 0.11;
                p.recoilMax = p.recoilTimer;

                const ux = Math.cos(ang), uy = Math.sin(ang);
                const rx = Math.sin(ang), ry = -Math.cos(ang);
                const muzX = p.wx + rx * 7.5 + ux * 21.0;
                const muzY = p.wy + ry * 7.5 + uy * 21.0;
                world.muzzleFlashes.push({ wx: muzX, wy: muzY, wz: 10.5, kind: isPierce ? 'pierce' : 'cyan', life: isPierce ? 0.09 : 0.06 });

                if (isPierce) {
                    audio.playSfx('ranged_pierce', 0.95);
                    const beamLen = 310.0;
                    const endX = muzX + ux * beamLen;
                    const endY = muzY + uy * beamLen;
                    world.bolts.push({ pts: [[muzX, muzY, 10.5], [endX, endY, 10.5]], color: '#44e4ff', life: 0.24, maxLife: 0.24 });
                    for (const stepD of [28.0, 92.0, 156.0, 220.0, 284.0]) {
                        world.rings.push({ wx: muzX + ux * stepD, wy: muzY + uy * stepD, wz: 10.0, maxRadius: 18.0, color: '#8cf5ff', life: 0.20, maxLife: 0.20, width: 2 });
                    }
                    spawnSparks(muzX, muzY, 10.5, '#8cf5ff', 6);
                    cam.addTrauma(0.24);
                    const dmg = 42.0 * (p.diamondOverdrive > 0.0 ? 1.25 : 1.0);
                    for (const en of [...world.enemies]) {
                        if (pointSegDist(en.wx, en.wy, muzX, muzY, endX, endY) <= en.radius + 6.5) {
                            spawnSparks(en.wx, en.wy, en.wz + 10.0, '#bafaff', 6);
                            damageEnemy(en, dmg, MARK_CYAN, ux * 55.0, uy * 55.0);
                        }
                    }
                    for (const py of world.pylons) {
                        if (pointSegDist(py.wx, py.wy, muzX, muzY, endX, endY) <= 16.0) {
                            hitPylon(py, MARK_CYAN);
                        }
                    }
                } else {
                    audio.playSfx('ranged', 0.85);
                    const spd = 370.0;
                    const dmg = 22.0 * (p.diamondOverdrive > 0.0 ? 1.25 : 1.0);
                    world.projectiles.push({
                        wx: muzX,
                        wy: muzY,
                        wz: 10.5,
                        vx: ux * spd,
                        vy: uy * spd,
                        friendly: true,
                        dmg,
                        mark: MARK_CYAN,
                        color: '#44e4ff',
                        radius: 4.5,
                        life: 0.95
                    });
                }
            } else {
                p.weaponCd[w] = 0.66 * cdMult;
                p.zSquash = 1.24;
                p.hammerSlamTimer = 0.26;
                const clampD = Math.min(175.0, dist);
                const ux = Math.cos(ang), uy = Math.sin(ang);
                const rx = Math.sin(ang), ry = -Math.cos(ang);
                const hx = p.wx + rx * 7.5 + ux * 16.0;
                const hy = p.wy + ry * 7.5 + uy * 16.0;
                world.muzzleFlashes.push({ wx: hx, wy: hy, wz: 11.0, kind: 'grav', life: 0.10 });
                spawnSparks(hx, hy, 11.0, '#ff74ba', 5);

                const [tx, ty] = clampToArena(p.wx + ux * clampD, p.wy + uy * clampD, 14.0);
                audio.playSfx('aoe_throw', 0.85);
                world.bombs.push({ startX: hx, startY: hy, targetX: tx, targetY: ty, elapsed: 0.0, duration: 0.34 });
            }
        };

        // ====================================================================
        // ENTRADAS DE TECLADO, RATÓN Y CONTROLES TÁCTILES
        // ====================================================================
        const keys = {};
        const mouse = { x: viewW * 0.65, y: viewH * 0.5, down: false };
        const touchJoy = { active: false, id: null, sx: 0, sy: 0, cx: 0, cy: 0, dx: 0, dy: 0 };
        const touchAim = { active: false, id: null, sx: 0, sy: 0, cx: 0, cy: 0, dx: 1, dy: 0 };
        let uiClickRegions = [];

        const toVirtualPos = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: ((clientX - rect.left) / Math.max(1, rect.width)) * viewW,
                y: ((clientY - rect.top) / Math.max(1, rect.height)) * viewH
            };
        };

        const onKeyDown = (e) => {
            audio.unlock();
            const k = e.key.toLowerCase();
            keys[k] = true;
            if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) {
                e.preventDefault();
            }
            if (k === 'm') {
                if (audio.masterSlider > 0.001) {
                    savedMasterBeforeMute = audio.masterSlider;
                    audio.masterSlider = 0.0;
                } else {
                    audio.masterSlider = Math.max(0.25, savedMasterBeforeMute);
                }
                audio._refreshMusicVolumes();
                return;
            }
            if (k === 'f11') {
                e.preventDefault();
                if (isFullscreenRef.current) exitFullscreen();
                else enterFullscreen();
                return;
            }

            if (screenMode === 'playing') {
                if (k === 'escape' || k === 'p') {
                    modalSelectedBtn = 0;
                    screenMode = 'paused';
                    return;
                }
                if (k === '1') switchWeapon(WEAPON_MELEE);
                if (k === '2') switchWeapon(WEAPON_RANGED);
                if (k === '3') switchWeapon(WEAPON_AOE);
                if (k === 'tab') cycleWeapon(1);
                if (k === 'r') cam.resetYaw();
                if (k === ' ' || k === 'shift') {
                    const mx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
                    const my = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
                    const aw = cam.screenToWorld(mouse.x, mouse.y);
                    tryDash(mx, my, aw.wx, aw.wy);
                }
            } else if (screenMode === 'paused') {
                if (k === 'escape' || k === 'p') screenMode = 'playing';
            } else if (screenMode === 'options' || screenMode === 'howto') {
                if (k === 'escape' || (screenMode === 'howto' && (k === 'enter' || k === ' '))) {
                    audio.playSfx('ui_ok', 0.75);
                    screenMode = prevModeBeforeOverlay;
                }
            } else if (screenMode === 'title') {
                if (k === 'arrowup' || k === 'w') { titleSelectedBtn = (titleSelectedBtn + 3) % 4; audio.playSfx('ui_move', 0.65); }
                else if (k === 'arrowdown' || k === 's') { titleSelectedBtn = (titleSelectedBtn + 1) % 4; audio.playSfx('ui_move', 0.65); }
                else if (k === 'enter' || k === ' ') {
                    audio.playSfx('ui_ok', 0.85);
                    if (titleSelectedBtn === 0) { resetRun(); screenMode = 'playing'; }
                    else if (titleSelectedBtn === 1) { prevModeBeforeOverlay = 'title'; screenMode = 'options'; }
                    else if (titleSelectedBtn === 2) { prevModeBeforeOverlay = 'title'; screenMode = 'howto'; }
                    else { callbacksRef.current.onExitToCatalog?.(); }
                }
            }
        };

        const onKeyUp = (e) => { keys[e.key.toLowerCase()] = false; };
        const onMouseMove = (e) => {
            const p = toVirtualPos(e.clientX, e.clientY);
            mouse.x = p.x;
            mouse.y = p.y;
            for (const reg of uiClickRegions) {
                if (reg.onHover && p.x >= reg.x && p.x <= reg.x + reg.w && p.y >= reg.y && p.y <= reg.y + reg.h) {
                    reg.onHover();
                }
            }
        };
        const onMouseDown = (e) => {
            audio.unlock();
            const p = toVirtualPos(e.clientX, e.clientY);
            mouse.x = p.x;
            mouse.y = p.y;
            if (screenMode === 'playing') {
                if (e.button === 0) {
                    for (const reg of uiClickRegions) {
                        if (p.x >= reg.x && p.x <= reg.x + reg.w && p.y >= reg.y && p.y <= reg.y + reg.h) {
                            reg.onClick(p.x, p.y);
                            return;
                        }
                    }
                    mouse.down = true;
                    const aw = cam.screenToWorld(p.x, p.y);
                    tryAttack(aw.wx, aw.wy);
                } else if (e.button === 2) {
                    cycleWeapon(1);
                }
            } else if (e.button === 0) {
                for (const reg of uiClickRegions) {
                    if (p.x >= reg.x && p.x <= reg.x + reg.w && p.y >= reg.y && p.y <= reg.y + reg.h) {
                        audio.playSfx('ui_ok', 0.80);
                        reg.onClick(p.x, p.y);
                        break;
                    }
                }
            }
        };
        const onMouseUp = (e) => { if (e.button === 0) mouse.down = false; };
        const onWheel = (e) => {
            if (screenMode === 'playing' && e.deltaY !== 0) {
                cycleWeapon(e.deltaY > 0 ? 1 : -1);
            }
        };
        const onCtx = (e) => e.preventDefault();

        const onTouchStart = (e) => {
            audio.unlock();
            setTouchMode(true);
            for (const t of e.changedTouches) {
                const p = toVirtualPos(t.clientX, t.clientY);
                if (screenMode !== 'playing') {
                    for (const reg of uiClickRegions) {
                        if (p.x >= reg.x && p.x <= reg.x + reg.w && p.y >= reg.y && p.y <= reg.y + reg.h) {
                            audio.playSfx('ui_ok', 0.80);
                            reg.onClick(p.x, p.y);
                            return;
                        }
                    }
                    continue;
                }
                let hitBtn = false;
                for (const reg of uiClickRegions) {
                    if (p.x >= reg.x && p.x <= reg.x + reg.w && p.y >= reg.y && p.y <= reg.y + reg.h) {
                        reg.onClick(p.x, p.y);
                        hitBtn = true;
                        break;
                    }
                }
                if (hitBtn) continue;
                if (p.x < viewW * 0.48 && !touchJoy.active) {
                    touchJoy.active = true; touchJoy.id = t.identifier;
                    touchJoy.sx = p.x; touchJoy.sy = p.y; touchJoy.cx = p.x; touchJoy.cy = p.y;
                    touchJoy.dx = 0; touchJoy.dy = 0;
                } else if (!touchAim.active) {
                    touchAim.active = true; touchAim.id = t.identifier;
                    touchAim.sx = p.x; touchAim.sy = p.y; touchAim.cx = p.x; touchAim.cy = p.y;
                }
            }
        };
        const onTouchMove = (e) => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                const p = toVirtualPos(t.clientX, t.clientY);
                if (touchJoy.active && t.identifier === touchJoy.id) {
                    const vx = p.x - touchJoy.sx, vy = p.y - touchJoy.sy;
                    const l = Math.min(72, Math.hypot(vx, vy)), a = Math.atan2(vy, vx);
                    touchJoy.cx = touchJoy.sx + Math.cos(a) * l;
                    touchJoy.cy = touchJoy.sy + Math.sin(a) * l;
                    touchJoy.dx = (Math.cos(a) * l) / 72;
                    touchJoy.dy = (Math.sin(a) * l) / 72;
                }
                if (touchAim.active && t.identifier === touchAim.id) {
                    const vx = p.x - touchAim.sx, vy = p.y - touchAim.sy;
                    const d = Math.hypot(vx, vy), l = Math.min(72, d), a = Math.atan2(vy, vx);
                    touchAim.cx = touchAim.sx + Math.cos(a) * l;
                    touchAim.cy = touchAim.sy + Math.sin(a) * l;
                    if (d > 8) { touchAim.dx = vx / d; touchAim.dy = vy / d; }
                }
            }
        };
        const onTouchEnd = (e) => {
            for (const t of e.changedTouches) {
                if (touchJoy.active && t.identifier === touchJoy.id) {
                    touchJoy.active = false; touchJoy.dx = 0; touchJoy.dy = 0;
                }
                if (touchAim.active && t.identifier === touchAim.id) {
                    touchAim.active = false;
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('wheel', onWheel);
        canvas.addEventListener('contextmenu', onCtx);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);

        // ====================================================================
        // FUNCIONES DE RENDERIZADO 2.5D DEL MUNDO (Port 1:1 de combat_world.py)
        // ====================================================================
        const drawGroundHazardsAndTelegraphs = () => {
            // 1. Grietas persistentes pixel-art del Cráter Sísmico (CraterDecalFX)
            for (const cd of world.craterDecals) {
                const sc = cam.worldToScreen(cd.wx, cd.wy, 0.0);
                const alphaR = Math.min(1.0, cd.life / Math.max(0.1, cd.maxLife * 0.45));
                slashVfx.drawCraterDecal(ctx, sc.sx, sc.sy, alphaR);
            }

            // 2. Charcos de magma y corrupción
            for (const h of world.hazards) {
                const sc = cam.worldToScreen(h.wx, h.wy, 0.0);
                const rw = Math.round(h.radius * ART_SCALE);
                const rh = Math.round(rw * STACK_SQUASH);
                ctx.fillStyle = h.kind === 'magma' ? 'rgba(238, 96, 34, 0.33)' : 'rgba(218, 44, 98, 0.33)';
                ctx.strokeStyle = h.kind === 'magma' ? 'rgba(238, 96, 34, 0.84)' : 'rgba(218, 44, 98, 0.84)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(sc.sx, sc.sy, rw, rh, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            // 3. Retícula animada pulsante en el suelo para Bombas Sísmicas en vuelo + cruz de impacto
            for (const b of world.bombs) {
                const prog = Math.min(1.0, b.elapsed / Math.max(0.01, b.duration));
                const sc = cam.worldToScreen(b.targetX, b.targetY, 0.0);
                const rw = Math.round(64 * ART_SCALE);
                const rh = Math.round(rw * STACK_SQUASH);
                ctx.strokeStyle = '#ff4c9e';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(sc.sx, sc.sy, rw, rh, 0, 0, Math.PI * 2);
                ctx.stroke();

                const inR = Math.max(6, Math.round(rw * (1.0 - prog)));
                const inH = Math.max(4, Math.round(rh * (1.0 - prog)));
                ctx.strokeStyle = '#ffccea';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(sc.sx, sc.sy, inR, inH, 0, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = '#ff88c6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sc.sx - 18, sc.sy); ctx.lineTo(sc.sx + 18, sc.sy);
                ctx.moveTo(sc.sx, sc.sy - 12); ctx.lineTo(sc.sx, sc.sy + 12);
                ctx.stroke();
            }

            // 4. Línea roja de telegrafiado de embestida del Gólem
            for (const en of world.enemies) {
                if (en.kind === 'golem' && en.aiState === 'windup') {
                    const s1 = cam.worldToScreen(en.wx, en.wy, 1.0);
                    const s2 = cam.worldToScreen(en.wx + en.chargeDx * 115.0, en.wy + en.chargeDy * 115.0, 1.0);
                    ctx.strokeStyle = '#ff5c40';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(s1.sx, s1.sy);
                    ctx.lineTo(s2.sx, s2.sy);
                    ctx.stroke();
                }
            }

            // 5. Anillos de onda expansiva (RingFX)
            for (const r of world.rings) {
                const prog = 1.0 - (r.life / Math.max(0.01, r.maxLife));
                const curR = Math.max(4.0, r.maxRadius * prog);
                const sc = cam.worldToScreen(r.wx, r.wy, r.wz);
                const rw = Math.round(curR * ART_SCALE);
                const rh = Math.round(rw * STACK_SQUASH);
                ctx.strokeStyle = r.color;
                ctx.lineWidth = r.width || 3;
                ctx.beginPath();
                ctx.ellipse(sc.sx, sc.sy, rw, rh, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        };

        const drawPlayer = (sx, sy, yaw) => {
            const p = world.player;
            if (p.diamondOverdrive > 0.0) {
                const rw = Math.round(18 * ART_SCALE);
                const rh = Math.round(rw * STACK_SQUASH);
                ctx.strokeStyle = '#58f49c';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(sx, sy, rw, rh, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            let swingOff = 0.0;
            const wModel = p.weapon === WEAPON_MELEE ? 'weapon_sword' : (p.weapon === WEAPON_RANGED ? 'weapon_railgun' : 'weapon_hammer');
            const aimA = p.heading + Math.PI * 0.5;
            const fx = Math.cos(aimA), fy = Math.sin(aimA);
            const rx = Math.sin(aimA), ry = -Math.cos(aimA);

            let wWx = p.wx + rx * 7.8 + fx * 4.5;
            let wWy = p.wy + ry * 7.8 + fy * 4.5;
            let wWz = p.wz + 7.5;
            let wHeading = p.heading;

            if (p.weapon === WEAPON_MELEE && p.swingTimer > 0.0) {
                const prog = 1.0 - (p.swingTimer / Math.max(0.01, p.swingMax));
                const headP = Math.min(1.0, Math.pow(prog * 1.45, 0.72));
                let swordAng;
                if (p.swingVariant === 'finisher') {
                    const span = (200.0 * Math.PI) / 180.0;
                    swordAng = p.attackAngle - span * 0.5 + span * headP;
                } else if (p.swingVariant === 'normal_ccw') {
                    const span = (148.0 * Math.PI) / 180.0;
                    swordAng = p.attackAngle + span * 0.5 - span * headP;
                } else {
                    const span = (148.0 * Math.PI) / 180.0;
                    swordAng = p.attackAngle - span * 0.5 + span * headP;
                }
                swingOff = p.swingDir * (1.0 - (1.0 - prog) * 2.0) * 0.62;
                wWx = p.wx + Math.cos(swordAng) * 13.5;
                wWy = p.wy + Math.sin(swordAng) * 13.5;
                wWz = p.wz + 8.5;
                wHeading = swordAng - Math.PI * 0.5;
            } else if (p.weapon === WEAPON_RANGED && p.recoilTimer > 0.0) {
                const pull = 5.5 * (p.recoilTimer / Math.max(0.01, p.recoilMax));
                wWx -= fx * pull;
                wWy -= fy * pull;
                wWz += pull * 0.25;
            } else if (p.weapon === WEAPON_AOE && p.hammerSlamTimer > 0.0) {
                const tH = 1.0 - (p.hammerSlamTimer / 0.26);
                const arcZ = Math.sin(tH * Math.PI) * 9.0;
                const lunge = Math.sin(tH * Math.PI) * 6.5;
                wWx += fx * lunge;
                wWy += fy * lunge;
                wWz += arcZ;
            }

            const wSc = cam.worldToScreen(wWx, wWy, 0.0);
            const pSc = cam.worldToScreen(p.wx, p.wy, 0.0);

            const drawBody = () => {
                const mid = models[getPlayerModelId()];
                if (Math.abs(p.zSquash - 1.0) > 0.04) {
                    drawSlicedLiveModelWeb(ctx, mid, sx, sy, p.heading + swingOff + yaw, p.wz, p.zSquash, 1.0, 0.0, 0.0, true);
                } else {
                    drawBakedModelWeb(ctx, mid, sx, sy, p.heading + swingOff + yaw, p.wz, p.flashTimer > 0.0, true);
                }
            };
            const drawWeapon = () => {
                drawBakedModelWeb(ctx, models[wModel], wSc.sx, wSc.sy, wHeading + yaw, wWz, false, false);
            };

            if (wSc.ry < pSc.ry - 1.0) {
                drawWeapon();
                drawBody();
            } else {
                drawBody();
                drawWeapon();
            }
        };

        const drawEnemy = (en, sx, sy, yaw) => {
            if (en.elite) {
                const rw = Math.round((en.radius + 3) * ART_SCALE);
                const rh = Math.round(rw * STACK_SQUASH);
                ctx.strokeStyle = '#fac638';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(sx, sy, rw, rh, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            const midKey = getEnemyModelId(en);
            const mid = models[midKey];
            if (en.spawnBloom < 1.0) {
                drawSlicedLiveModelWeb(ctx, mid, sx, sy, en.heading + yaw, en.wz, 1.0, en.spawnBloom, 0.0, 0.0, true);
            } else {
                const hover = (en.kind === 'sentinel' || en.kind === 'weaver') ? Math.sin(en.animPhase) * 2.0 : 0.0;
                drawBakedModelWeb(ctx, mid, sx, sy, en.heading + yaw, en.wz + hover, en.flashTimer > 0.0, true);
            }

            const slicesCount = mid ? mid.slices : 16;
            const topY = Math.round(sy - (slicesCount + en.wz + 4) * STACK_SPACING * ART_SCALE);

            // Gemas flotantes de Marcas Elementales sobre la cabeza del enemigo
            if (en.marks.size > 0) {
                const ordered = [MARK_FIRE, MARK_CYAN, MARK_GRAV].filter((m) => en.marks.has(m));
                const spanX = (ordered.length - 1) * 14;
                ordered.forEach((mk, i) => {
                    const gx = Math.round(sx) - Math.floor(spanX / 2) + i * 14;
                    const gy = topY - 10;
                    ctx.fillStyle = MARK_COLORS[mk];
                    ctx.beginPath();
                    ctx.moveTo(gx, gy - 6);
                    ctx.lineTo(gx + 5, gy);
                    ctx.lineTo(gx, gy + 6);
                    ctx.lineTo(gx - 5, gy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });
            }

            // Barra de salud compacta con recuadro negro si está herido
            if (en.kind !== 'boss' && en.hp < en.maxHp) {
                const bw = en.kind === 'golem' ? 48 : 34;
                const bx = Math.round(sx) - Math.floor(bw / 2);
                const by = topY;
                ctx.fillStyle = 'rgb(14, 16, 26)';
                ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
                const fill = Math.max(1, Math.floor(bw * (en.hp / Math.max(1.0, en.maxHp))));
                ctx.fillStyle = 'rgb(238, 72, 88)';
                ctx.fillRect(bx, by, fill, 4);
            }
        };

        const drawPylon = (py, midKey, sx, sy, yaw, active) => {
            const mid = models[midKey];
            if (active) {
                const col = py.state === 'sync' ? '#58f49c' : MARK_COLORS[py.state];
                const rw = Math.round(17 * ART_SCALE);
                const rh = Math.round(rw * STACK_SQUASH);
                ctx.strokeStyle = col;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(sx, sy, rw, rh, 0, 0, Math.PI * 2);
                ctx.stroke();

                drawSlicedLiveModelWeb(ctx, mid, sx, sy, yaw, 0.0, 1.0, 1.0, 3.2, py.swayPhase, true);

                // Etiqueta flotante nítida con recuadro negro (14, 16, 28) y barra de tiempo
                const topY = Math.round(sy - 30 * ART_SCALE);
                if (MARK_WEAPONS[py.state]) {
                    const keyNum = MARK_WEAPONS[py.state];
                    const lblSurf = fonts.xs.render(`ARMA [${keyNum}]`, '#ffffff', true);
                    const bgW = lblSurf.width + 10;
                    const bgH = lblSurf.height + 4;
                    const bgX = Math.round(sx - bgW * 0.5);
                    const bgY = Math.round(topY - 16 - bgH * 0.5);
                    ctx.fillStyle = 'rgb(14, 16, 28)';
                    ctx.fillRect(bgX, bgY, bgW, bgH);
                    ctx.strokeStyle = col;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(bgX, bgY, bgW, bgH);
                    ctx.drawImage(lblSurf, Math.round(sx - lblSurf.width * 0.5), Math.round(topY - 16 - lblSurf.height * 0.5));
                }

                const ratio = Math.max(0.0, Math.min(1.0, py.timer / Math.max(0.1, py.maxTimer)));
                ctx.fillStyle = 'rgb(14, 16, 26)';
                ctx.fillRect(Math.round(sx) - 24, topY, 48, 6);
                ctx.fillStyle = col;
                ctx.fillRect(Math.round(sx) - 23, topY + 1, Math.floor(46 * ratio), 4);
            } else {
                drawBakedModelWeb(ctx, mid, sx, sy, yaw, 0.0, false, true);
            }
        };

        const drawProjectile = (pr, sx, sy, gsx, gsy) => {
            ctx.fillStyle = 'rgb(8, 10, 18)';
            ctx.beginPath();
            ctx.arc(gsx, gsy, 5, 0, Math.PI * 2);
            ctx.fill();

            if (pr.friendly) {
                const spd = Math.max(1.0, Math.hypot(pr.vx, pr.vy));
                const ux = pr.vx / spd, uy = pr.vy / spd;
                const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
                const sdx = ux * c - uy * s;
                const sdy = (ux * s + uy * c) * STACK_SQUASH;
                const tailX = sx - sdx * 28.0, tailY = sy - sdy * 28.0;
                const headX = sx + sdx * 8.0, headY = sy + sdy * 8.0;

                ctx.strokeStyle = 'rgb(14, 78, 126)';
                ctx.lineWidth = 9;
                ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(headX, headY); ctx.stroke();

                ctx.strokeStyle = pr.color;
                ctx.lineWidth = 5;
                ctx.beginPath(); ctx.moveTo(tailX + sdx * 4, tailY + sdy * 4); ctx.lineTo(headX, headY); ctx.stroke();

                ctx.strokeStyle = 'rgb(235, 254, 255)';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(sx - sdx * 6, sy - sdy * 6); ctx.lineTo(headX, headY); ctx.stroke();
            } else {
                const rPx = Math.max(4, Math.floor(pr.radius * 1.6));
                ctx.fillStyle = 'rgb(16, 10, 18)';
                ctx.beginPath(); ctx.arc(sx, sy, rPx + 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = pr.color;
                ctx.beginPath(); ctx.arc(sx, sy, rPx + 2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgb(255, 240, 215)';
                ctx.beginPath(); ctx.arc(sx, sy, Math.max(2, rPx - 1), 0, Math.PI * 2); ctx.fill();
            }
        };

        const drawOffscreenPylonIndicators = () => {
            const margin = 44;
            const hasBoss = world.enemies.some((e) => e.kind === 'boss');
            const topMin = hasBoss ? margin + 98 : margin + 70;
            for (const py of world.pylons) {
                if (![MARK_FIRE, MARK_CYAN, MARK_GRAV].includes(py.state)) continue;
                const sc = cam.worldToScreen(py.wx, py.wy, 14.0);
                if (sc.sx >= margin && sc.sx <= viewW - margin && sc.sy >= margin && sc.sy <= viewH - margin) {
                    continue;
                }
                const cx = Math.max(margin, Math.min(viewW - margin, Math.round(sc.sx)));
                const cy = Math.max(topMin, Math.min(viewH - margin - 72, Math.round(sc.sy)));
                const col = MARK_COLORS[py.state];
                ctx.fillStyle = 'rgb(16, 20, 34)';
                ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = col;
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2); ctx.stroke();
                const txtSurf = fonts.xs.render(`[${MARK_WEAPONS[py.state]}]`, '#ffffff', true);
                ctx.drawImage(txtSurf, Math.round(cx - txtSurf.width * 0.5), Math.round(cy - txtSurf.height * 0.5));
            }
        };

        // ====================================================================
        // BUCLE PRINCIPAL 60 FPS (Port 1:1 de main.py + combat_world.py + ui_screens.py)
        // ====================================================================
        let lastTs = performance.now();
        let rafId = 0;

        const step = (now) => {
            syncViewport();
            const realDt = Math.max(0.0, Math.min(0.05, (now - lastTs) / 1000.0));
            lastTs = now;
            if (scorePopTimer > 0.0) scorePopTimer = Math.max(0.0, scorePopTimer - realDt);

            audio.update(realDt);
            uiClickRegions = [];

            if (screenMode === 'title') {
                titleTime += realDt;
                audio.setMusicIntensity(false, false);
                for (const em of titleEmbers) {
                    em[2] += em[3] * realDt;
                    if (em[2] > 48.0) {
                        em[0] = (Math.random() * 2 - 1) * 260.0;
                        em[1] = (Math.random() * 2 - 1) * 260.0;
                        em[2] = 0.0;
                    }
                }

                // Órbita cinematográfica suave sobre la Ciudadela 2.5D (TitleDioramaMenu.draw)
                cam.yaw = titleTime * 0.18;
                const cOffX = viewW >= 1200 ? -86.0 : -68.0;
                const cOffY = 68.0;
                const cosY = Math.cos(-cam.yaw), sinY = Math.sin(-cam.yaw);
                cam.camX = cOffX * cosY - cOffY * sinY;
                cam.camY = cOffX * sinY + cOffY * cosY;
                cam.shakeOx = 0; cam.shakeOy = 0;

                arenaMap.drawBackdropAndArena(ctx, cam, realDt, viewW, viewH);

                const yaw = cam.yaw;
                const queue = [];
                const pylonPos = [
                    [PYLON_RING_RADIUS, 0.0, 'pylon_fire'],
                    [0.0, PYLON_RING_RADIUS, 'pylon_sync'],
                    [-PYLON_RING_RADIUS, 0.0, 'pylon_cyan'],
                    [0.0, -PYLON_RING_RADIUS, 'pylon_grav']
                ];
                for (const [wx, wy, mid] of pylonPos) {
                    const sc = cam.worldToScreen(wx, wy, 0.0);
                    queue.push({ ry: sc.ry, fn: () => drawBakedModelWeb(ctx, models[mid], sc.sx, sc.sy, yaw) });
                }
                for (let i = 0; i < 4; i++) {
                    const a = Math.PI * 0.25 + i * (Math.PI * 0.5);
                    const sc = cam.worldToScreen(Math.cos(a) * 238.0, Math.sin(a) * 238.0, 0.0);
                    queue.push({ ry: sc.ry, fn: () => drawBakedModelWeb(ctx, models.brazier, sc.sx, sc.sy, yaw) });
                }
                for (const [vx, vy] of arenaMap.octVertices) {
                    const sc = cam.worldToScreen(vx * 0.945, vy * 0.945, 0.0);
                    queue.push({ ry: sc.ry, fn: () => drawBakedModelWeb(ctx, models.beacon, sc.sx, sc.sy, yaw) });
                }

                // 4 Enemigos en guardia orbitando el Altar (igual que en TitleDioramaMenu de Python)
                const orbiters = [
                    ['skitter_1', 92.0, 0.4],
                    ['sentinel_0', 112.0, 2.2],
                    ['golem_1', 104.0, 4.1],
                    ['weaver_0', 116.0, 5.4]
                ];
                for (const [mid, rad, phase] of orbiters) {
                    const ang = titleTime * 0.42 + phase;
                    const wx = Math.cos(ang) * rad, wy = Math.sin(ang) * rad;
                    const sc = cam.worldToScreen(wx, wy, 0.0);
                    const turn = ang + Math.PI * 0.5 + yaw;
                    queue.push({ ry: sc.ry, fn: () => drawBakedModelWeb(ctx, models[mid], sc.sx, sc.sy, turn) });
                }

                const demoW = ((Math.floor(titleTime / 2.5) % 3) + 3) % 3;
                const heroMid = ['guardian_melee_0', 'guardian_ranged_0', 'guardian_aoe_0'][demoW];
                const wMid = ['weapon_sword', 'weapon_railgun', 'weapon_hammer'][demoW];
                const heroHeading = -titleTime * 0.9;
                const aimA = heroHeading + Math.PI * 0.5;
                const wWx = Math.sin(aimA) * 7.8 + Math.cos(aimA) * 4.5;
                const wWy = -Math.cos(aimA) * 7.8 + Math.sin(aimA) * 4.5;
                const hSc = cam.worldToScreen(0.0, 0.0, 0.0);
                const wSc = cam.worldToScreen(wWx, wWy, 0.0);
                queue.push({ ry: hSc.ry, fn: () => drawBakedModelWeb(ctx, models[heroMid], hSc.sx, hSc.sy, heroHeading + yaw) });
                queue.push({ ry: wSc.ry, fn: () => drawBakedModelWeb(ctx, models[wMid], wSc.sx, wSc.sy, heroHeading + yaw, 7.5, false, false) });

                queue.sort((a, b) => a.ry - b.ry);
                queue.forEach((it) => it.fn());

                // Haces cruzados en el fondo entre 2 pilones opuestos
                const b1 = cam.worldToScreen(PYLON_RING_RADIUS, 0.0, 15.0);
                const b2 = cam.worldToScreen(0.0, PYLON_RING_RADIUS, 15.0);
                const b3 = cam.worldToScreen(-PYLON_RING_RADIUS, 0.0, 15.0);
                ctx.strokeStyle = 'rgb(32, 184, 112)'; ctx.lineWidth = 6;
                ctx.beginPath(); ctx.moveTo(b1.sx, b1.sy); ctx.lineTo(b2.sx, b2.sy); ctx.lineTo(b3.sx, b3.sy); ctx.stroke();
                ctx.strokeStyle = 'rgb(214, 255, 232)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(b1.sx, b1.sy); ctx.lineTo(b2.sx, b2.sy); ctx.lineTo(b3.sx, b3.sy); ctx.stroke();

                ctx.fillStyle = 'rgb(255, 168, 54)';
                for (const em of titleEmbers) {
                    const esc = cam.worldToScreen(em[0], em[1], em[2]);
                    if (esc.sx >= 0 && esc.sx < viewW && esc.sy >= 0 && esc.sy < viewH) {
                        ctx.fillRect(Math.floor(esc.sx), Math.floor(esc.sy), 3, 3);
                    }
                }

                // Cortina Dithered Lateral Bayer 4x4
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(getDitherCurtain(viewW, viewH), 0, 0);

                // Placa Esculpida del Título Principal
                const compact = viewH < 720 || viewW < 920;
                const leftX = compact ? 24 : Math.max(36, Math.floor(viewW * 0.045));
                const panelW = Math.min(560, viewW - leftX * 2);
                const topY = compact ? 18 : 28;
                drawForgedPanel(ctx, leftX, topY, panelW, 108, 'rgba(18, 20, 34, 0.96)', '#ff9824', 10, true);
                ctx.fillStyle = 'rgb(208, 78, 24)';
                ctx.fillRect(leftX + 12, topY + 82, panelW - 24, 3);
                fonts.xl.draw(ctx, 'NÚCLEO CARBÓN', leftX + 20, topY + 14, '#ffc638', 'left', true, '#fff8cd');
                fonts.sm.draw(ctx, 'FORJA DE CENIZA  •  ARCADE 2.5D', leftX + 22, topY + 86, '#44e4ff', 'left', false);

                // Insignia de Récord Máximo Guardado
                const recY = topY + 120;
                drawForgedPanel(ctx, leftX, recY, panelW, 68, 'rgba(24, 24, 42, 0.95)', '#fac638', 7, true);
                const cxC = leftX + 26, cyC = recY + 34;
                ctx.fillStyle = '#fac638';
                ctx.beginPath();
                ctx.moveTo(cxC - 10, cyC + 7); ctx.lineTo(cxC - 10, cyC - 5); ctx.lineTo(cxC - 4, cyC + 1);
                ctx.lineTo(cxC, cyC - 8); ctx.lineTo(cxC + 4, cyC + 1); ctx.lineTo(cxC + 10, cyC - 5);
                ctx.lineTo(cxC + 10, cyC + 7); ctx.closePath(); ctx.fill();
                fonts.md.draw(ctx, `RÉCORD: ${lastBestScore.toLocaleString()} PTS`, leftX + 48, recY + 8, '#ffe888', 'left', false);
                fonts.xs.draw(ctx, `Mejor Oleada: ${bestWave}  |  Combo Máx: x${bestComboSaved.toFixed(2)}`, leftX + 48, recY + 40, '#96a4c4', 'left', false);

                // Botones Biselados Principales
                const btns = [
                    { label: 'JUGAR MODO ARCADE', fn: () => { if (touchMode && !isFullscreenRef.current) enterFullscreen(); resetRun(); screenMode = 'playing'; } },
                    { label: 'OPCIONES DE SONIDO', fn: () => { prevModeBeforeOverlay = 'title'; screenMode = 'options'; } },
                    { label: 'ARSENAL Y MECÁNICA', fn: () => { prevModeBeforeOverlay = 'title'; screenMode = 'howto'; } },
                    { label: 'SALIR AL ESCRITORIO', fn: () => { callbacksRef.current.onExitToCatalog?.(); } }
                ];
                const by0 = recY + 82;
                const bStep = compact ? 48 : 54;
                const bH = compact ? 42 : 46;
                const bW = Math.min(495, panelW);
                btns.forEach((b, i) => {
                    const by = by0 + i * bStep;
                    const focused = i === titleSelectedBtn;
                    drawForgedPanel(ctx, leftX, by, bW, bH, focused ? 'rgba(34, 41, 66, 0.96)' : 'rgba(16, 19, 32, 0.94)', focused ? '#ff9824' : '#4a5880', 6, focused);
                    if (focused) {
                        ctx.fillStyle = '#ffc638';
                        ctx.fillRect(leftX + 6, by + 8, 5, bH - 16);
                    }
                    fonts.md.draw(ctx, focused ? `▶ ${b.label}` : `  ${b.label}`, leftX + 18, by + 8, focused ? '#fff0af' : '#ecf2ff', 'left', focused);
                    uiClickRegions.push({
                        x: leftX, y: by, w: bW, h: bH,
                        onHover: () => { titleSelectedBtn = i; },
                        onClick: b.fn
                    });
                });

                // Tabla Compacta de Mejores Marcas Arcade
                const lbTop = by0 + btns.length * bStep + 14;
                const lbH = Math.min(194, Math.max(100, viewH - lbTop - 24));
                if (lbH >= 100) {
                    drawForgedPanel(ctx, leftX, lbTop, panelW, lbH, 'rgba(15, 18, 30, 0.94)', '#4a5880', 7, true);
                    fonts.sm.draw(ctx, 'MEJORES MARCAS ARCADE', leftX + 14, lbTop + 10, '#44e4ff', 'left', false);
                    const lbList = Array.isArray(leaderboardRef.current) ? leaderboardRef.current.slice(0, 5) : [];
                    if (lbList.length === 0) {
                        fonts.xs.draw(ctx, 'Sin partidas registradas todavía.', leftX + 14, lbTop + 44, '#96a4c4', 'left', false);
                        fonts.xs.draw(ctx, '¡Entra al Modo Arcade y fija el primer récord!', leftX + 14, lbTop + 70, '#ffe076', 'left', false);
                    } else {
                        lbList.forEach((entry, idx) => {
                            const ey = lbTop + 40 + idx * 27;
                            if (ey + 24 > lbTop + lbH) return;
                            const col = idx === 0 ? '#ffe888' : '#ecf2ff';
                            const nameTxt = String(entry.playerName || entry.name || 'PILOTO').slice(0, 12);
                            const ptsTxt = Number(entry.score || 0).toLocaleString();
                            const wvTxt = entry.waveReached ? `Ol.${entry.waveReached}` : '';
                            fonts.xs.draw(ctx, `#${idx + 1} ${nameTxt} — ${ptsTxt} pts  ${wvTxt}`, leftX + 14, ey, col, 'left', false);
                        });
                    }
                }

                // Escaparate Inferior Derecho: Las 3 Armas del Guardián
                if (viewW >= 1000) {
                    const arsX = viewW - 376, arsY = viewH - 122;
                    drawForgedPanel(ctx, arsX, arsY, 354, 96, 'rgba(16, 19, 32, 0.90)', '#56648c', 7, true);
                    fonts.xs.draw(ctx, 'ARMAS DEL GUARDIÁN', arsX + 14, arsY + 8, '#ffe076', 'left', false);
                    WEAPON_INFO.forEach((info, wid) => {
                        const ix = arsX + 16 + wid * 112;
                        const iy = arsY + 46;
                        drawWeaponPixelIcon(wid, ix + 14, iy);
                        fonts.xs.draw(ctx, `[${info.key}]`, ix + 32, iy - 12, info.bright, 'left', false);
                        fonts.xs.draw(ctx, info.name.split(' ')[0], ix + 2, iy + 18, info.color, 'left', false);
                    });
                }

                rafId = requestAnimationFrame(step);
                return;
            }

            // ================================================================
            // SIMULACIÓN DE COMBATE (cuando screenMode === 'playing')
            // ================================================================
            const p = world.player;
            if (screenMode === 'playing') {
                const camRot = (keys['e'] ? 1 : 0) - (keys['q'] ? 1 : 0);
                if (Math.abs(camRot) > 0.01) cam.rotateBy(camRot * 1.95 * realDt);

                let moveX = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
                let moveY = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
                if (touchJoy.active) { moveX = touchJoy.dx; moveY = touchJoy.dy; }

                let aimWx, aimWy;
                if (touchMode) {
                    const c = Math.cos(-cam.yaw), s = Math.sin(-cam.yaw);
                    const wxD = touchAim.dx * c - touchAim.dy * s;
                    const wyD = touchAim.dx * s + touchAim.dy * c;
                    aimWx = p.wx + wxD * 110.0;
                    aimWy = p.wy + wyD * 110.0;
                } else {
                    const aw = cam.screenToWorld(mouse.x, mouse.y);
                    aimWx = aw.wx;
                    aimWy = aw.wy;
                }
                const attackHeld = mouse.down || touchAim.active;

                let dt = realDt;
                if (world.hitStopTimer > 0.0) {
                    world.hitStopTimer = Math.max(0.0, world.hitStopTimer - realDt);
                    dt = realDt * 0.06;
                }

                if (p.alive) world.elapsedTime += dt;
                if (world.waveBannerTimer > 0.0) world.waveBannerTimer = Math.max(0.0, world.waveBannerTimer - realDt);

                const hasBoss = world.enemies.some((e) => e.kind === 'boss');
                const hype = hasBoss || p.diamondOverdrive > 0.0 || world.multiplier >= 3.0 || world.wave >= 4;
                audio.setMusicIntensity(p.alive, hype && p.alive);

                if (p.alive) {
                    // Actualizar jugador
                    for (let i = 0; i < 3; i++) {
                        if (p.weaponCd[i] > 0.0) p.weaponCd[i] = Math.max(0.0, p.weaponCd[i] - dt);
                    }
                    if (p.meleeComboReset > 0.0) {
                        p.meleeComboReset -= dt;
                        if (p.meleeComboReset <= 0.0) p.meleeCombo = 0;
                    }
                    if (p.invulnTimer > 0.0) p.invulnTimer = Math.max(0.0, p.invulnTimer - dt);
                    if (p.flashTimer > 0.0) p.flashTimer = Math.max(0.0, p.flashTimer - dt);
                    if (p.swingTimer > 0.0) p.swingTimer = Math.max(0.0, p.swingTimer - dt);
                    if (p.recoilTimer > 0.0) p.recoilTimer = Math.max(0.0, p.recoilTimer - dt);
                    if (p.hammerSlamTimer > 0.0) p.hammerSlamTimer = Math.max(0.0, p.hammerSlamTimer - dt);
                    if (p.diamondOverdrive > 0.0) p.diamondOverdrive = Math.max(0.0, p.diamondOverdrive - dt);

                    if (p.shield < p.maxShield) {
                        if (p.shieldDelay > 0.0) p.shieldDelay = Math.max(0.0, p.shieldDelay - dt);
                        else p.shield = Math.min(p.maxShield, p.shield + 9.0 * dt);
                    }

                    if (p.dashes < p.maxDashes) {
                        p.dashRecharge += dt;
                        if (p.dashRecharge >= 2.35) {
                            p.dashRecharge -= 2.35;
                            p.dashes += 1;
                        }
                    } else {
                        p.dashRecharge = 0.0;
                    }

                    if (world.multiplier > 1.0) {
                        if (world.comboFreshTimer > 0.0) world.comboFreshTimer -= dt;
                        else world.multiplier = Math.max(1.0, Math.round((world.multiplier - 0.35 * dt) * 100) / 100);
                    }

                    p.zSquash += (1.0 - p.zSquash) * (1.0 - Math.exp(-14.0 * dt));

                    if (p.dashTimer > 0.0) {
                        p.dashTimer -= dt;
                        p.wx += p.dashDx * 340.0 * dt;
                        p.wy += p.dashDy * 340.0 * dt;
                        if (Math.floor(p.dashTimer * 60) % 2 === 0) {
                            world.afterimages.push({ modelId: getPlayerModelId(), wx: p.wx, wy: p.wy, wz: p.wz, heading: p.heading, life: 0.16 });
                        }
                    } else {
                        const inLen = Math.hypot(moveX, moveY);
                        let targetVx = 0.0, targetVy = 0.0;
                        if (inLen > 1e-4) {
                            const nx = moveX / inLen, ny = moveY / inLen;
                            const c = Math.cos(-cam.yaw), s = Math.sin(-cam.yaw);
                            const wdx = nx * c - ny * s, wdy = nx * s + ny * c;
                            const spd = 120.0 * (p.diamondOverdrive > 0.0 ? 1.24 : 1.0);
                            targetVx = wdx * spd;
                            targetVy = wdy * spd;
                            p.walkPhase += dt * 11.5;
                        }
                        const accelT = 1.0 - Math.exp(-15.0 * dt);
                        p.vx += (targetVx - p.vx) * accelT;
                        p.vy += (targetVy - p.vy) * accelT;
                        p.wx += p.vx * dt;
                        p.wy += p.vy * dt;
                    }

                    [p.wx, p.wy] = resolveObstaclesAndBounds(p.wx, p.wy, 9.5);

                    const adx = aimWx - p.wx, ady = aimWy - p.wy;
                    if (adx * adx + ady * ady > 4.0) {
                        p.heading = Math.atan2(ady, adx) - Math.PI * 0.5;
                    }
                    if (attackHeld) tryAttack(aimWx, aimWy);

                    // Director de aparición de enemigos y pilones
                    const maxAlive = Math.min(26, 8 + world.wave * 2);
                    if (world.spawnQueue.length > 0 && world.enemies.length < maxAlive) {
                        world.spawnTimer -= dt;
                        if (world.spawnTimer <= 0.0) {
                            const next = world.spawnQueue.shift();
                            spawnEnemy(next.kind, next.elite);
                            world.spawnTimer = Math.max(0.32, 1.15 - world.wave * 0.065);
                        }
                    } else if (world.spawnQueue.length === 0 && world.enemies.length === 0) {
                        world.waveClearPause += dt;
                        if (world.waveClearPause >= 1.8) {
                            world.waveClearPause = 0.0;
                            const waveBonus = addScore(300 * world.wave);
                            p.shield = Math.min(p.maxShield, p.shield + 14.0);
                            world.popups.push({ wx: p.wx, wy: p.wy, wz: 28.0, text: `¡OLEADA SUPERADA! +${waveBonus}`, color: '#ffe888', life: 1.0, maxLife: 1.0, big: true });
                            prepareWave(world.wave + 1);
                        }
                    }

                    for (const py of world.pylons) {
                        py.swayPhase += dt * 3.2;
                        if ([MARK_FIRE, MARK_CYAN, MARK_GRAV].includes(py.state)) {
                            py.timer -= dt;
                            if (py.timer <= 0.0) {
                                py.state = 'neutral';
                                py.chargeHits = 0;
                                audio.playSfx('pylon_fail', 0.85);
                                world.hazards.push({ wx: py.wx, wy: py.wy, radius: 54.0, kind: 'corrupt', life: 3.2, maxLife: 3.2, tickAcc: 0.0 });
                                world.rings.push({ wx: py.wx, wy: py.wy, wz: 4.0, maxRadius: 72.0, color: '#ff405c', life: 0.4, maxLife: 0.4, width: 3 });
                                world.popups.push({ wx: py.wx, wy: py.wy, wz: 28.0, text: '¡PILÓN SOBRECARGADO!', color: '#ff5668', life: 0.9, maxLife: 0.9, big: false });
                                for (const en of world.enemies) {
                                    if (Math.hypot(en.wx - py.wx, en.wy - py.wy) <= 130.0) en.hasteTimer = 5.0;
                                }
                            }
                        } else if (py.state === 'sync') {
                            py.timer -= dt;
                            if (py.timer <= 0.0) py.state = 'neutral';
                        }
                    }

                    const synced = world.pylons.filter((q) => q.state === 'sync');
                    if (synced.length >= 2) {
                        world.beamDamageAcc += dt;
                        if (world.beamDamageAcc >= 0.16) {
                            world.beamDamageAcc = 0.0;
                            for (let i = 0; i < synced.length; i++) {
                                for (let j = i + 1; j < synced.length; j++) {
                                    const p1 = synced[i], p2 = synced[j];
                                    for (const en of [...world.enemies]) {
                                        if (pointSegDist(en.wx, en.wy, p1.wx, p1.wy, p2.wx, p2.wy) <= en.radius + 7.5) {
                                            damageEnemy(en, 11.0, null, 0, 0);
                                            spawnSparks(en.wx, en.wy, 12.0, '#58f49c', 2);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (world.pylons.every((q) => q.state === 'neutral')) {
                        world.pylonCycleTimer -= dt;
                        if (world.pylonCycleTimer <= 0.0) {
                            world.pylonCycleTimer = Math.max(11.0, 18.0 - world.wave * 0.5);
                            const count = world.wave < 3 ? 2 : 3;
                            const pool = [...world.pylons].sort(() => Math.random() - 0.5).slice(0, count);
                            const marksPool = [MARK_FIRE, MARK_CYAN, MARK_GRAV].sort(() => Math.random() - 0.5);
                            pool.forEach((py, idx) => {
                                py.state = marksPool[idx % 3];
                                py.maxTimer = Math.max(12.5, 17.5 - world.wave * 0.25);
                                py.timer = py.maxTimer;
                                py.chargeHits = 0;
                            });
                            world.popups.push({ wx: p.wx, wy: p.wy, wz: 32.0, text: '¡PILONES POLARIZADOS! Golpéalos con su arma', color: '#58f49c', life: 1.15, maxLife: 1.15, big: false });
                        }
                    }
                }

                // Actualizar bombas y proyectiles
                const keptBombs = [];
                for (const b of world.bombs) {
                    b.elapsed += dt;
                    if (b.elapsed >= b.duration) detonateSeismicBomb(b.targetX, b.targetY);
                    else keptBombs.push(b);
                }
                world.bombs = keptBombs;

                const keptProj = [];
                for (const pr of world.projectiles) {
                    pr.life -= dt;
                    if (pr.life <= 0.0) continue;
                    pr.wx += pr.vx * dt;
                    pr.wy += pr.vy * dt;
                    if (Math.hypot(pr.wx, pr.wy) >= ARENA_RADIUS) continue;

                    let hitWall = false;
                    for (const pil of world.pillars) {
                        if (Math.hypot(pr.wx - pil.wx, pr.wy - pil.wy) <= pil.radius + pr.radius * 0.6) {
                            spawnSparks(pr.wx, pr.wy, pr.wz, pr.color, 3);
                            hitWall = true;
                            break;
                        }
                    }
                    if (hitWall) continue;

                    if (pr.friendly) {
                        let hitDone = false;
                        for (const py of world.pylons) {
                            if ([MARK_FIRE, MARK_CYAN, MARK_GRAV].includes(py.state) && Math.hypot(pr.wx - py.wx, pr.wy - py.wy) <= 13.5) {
                                if (pr.mark) hitPylon(py, pr.mark);
                                hitDone = true;
                                break;
                            }
                        }
                        if (hitDone) continue;
                        for (const en of [...world.enemies]) {
                            if (Math.hypot(pr.wx - en.wx, pr.wy - en.wy) <= en.radius + pr.radius) {
                                damageEnemy(en, pr.dmg, pr.mark, pr.vx * 0.14, pr.vy * 0.14);
                                spawnSparks(pr.wx, pr.wy, pr.wz, pr.color, 4);
                                hitDone = true;
                                break;
                            }
                        }
                        if (hitDone) continue;
                    } else if (p.alive && Math.hypot(pr.wx - p.wx, pr.wy - p.wy) <= 8.5 + pr.radius) {
                        hurtPlayer(pr.dmg, pr.wx, pr.wy);
                        continue;
                    }
                    keptProj.push(pr);
                }
                world.projectiles = keptProj;

                // Actualizar enemigos
                const weavers = world.enemies.filter((e) => e.kind === 'weaver');
                for (const en of [...world.enemies]) {
                    if (!world.enemies.includes(en)) continue;
                    if (en.spawnBloom < 1.0) en.spawnBloom = Math.min(1.0, en.spawnBloom + dt * 2.6);
                    if (en.flashTimer > 0.0) en.flashTimer = Math.max(0.0, en.flashTimer - dt);
                    if (en.slowTimer > 0.0) en.slowTimer = Math.max(0.0, en.slowTimer - dt);
                    if (en.hasteTimer > 0.0) en.hasteTimer = Math.max(0.0, en.hasteTimer - dt);

                    if (en.wz > 0.0 || en.vz !== 0.0) {
                        en.vz -= 255.0 * dt;
                        en.wz += en.vz * dt;
                        if (en.wz <= 0.0) {
                            en.wz = 0.0;
                            en.vz = en.vz < -45.0 ? -en.vz * 0.32 : 0.0;
                        }
                    }

                    const weaverBuff = weavers.some((w) => w !== en && Math.hypot(w.wx - en.wx, w.wy - en.wy) <= 95.0);
                    const spdMult = (en.slowTimer > 0.0 ? 0.55 : 1.0) * ((en.hasteTimer > 0.0 || weaverBuff) ? 1.30 : 1.0);
                    const effSpd = en.speed * spdMult;

                    const dx = p.wx - en.wx, dy = p.wy - en.wy;
                    const dist = Math.max(0.001, Math.hypot(dx, dy));
                    const ux = dx / dist, uy = dy / dist;
                    let desVx = 0.0, desVy = 0.0;
                    en.aiTimer -= dt;

                    if (en.kind === 'skitter') {
                        desVx = ux * effSpd; desVy = uy * effSpd;
                        if (en.aiTimer <= 0.0 && dist < 68.0 && en.wz <= 0.1) {
                            en.vz = 58.0; en.vx += ux * 95.0; en.vy += uy * 95.0; en.aiTimer = 1.6;
                        }
                    } else if (en.kind === 'sentinel') {
                        const radial = dist > 155.0 ? 1.0 : (dist < 105.0 ? -0.85 : 0.0);
                        const strafe = en.uid % 2 === 0 ? 0.75 : -0.75;
                        desVx = (ux * radial - uy * strafe) * effSpd;
                        desVy = (uy * radial + ux * strafe) * effSpd;
                        if (en.aiTimer <= 0.0 && en.spawnBloom >= 0.95) {
                            en.aiTimer = Math.max(1.15, 2.05 - world.wave * 0.06);
                            const shots = en.elite ? [-0.18, 0.0, 0.18] : [0.0];
                            const baseA = Math.atan2(dy, dx);
                            for (const offA of shots) {
                                const sa = baseA + offA;
                                world.projectiles.push({
                                    wx: en.wx + Math.cos(sa) * 9.0,
                                    wy: en.wy + Math.sin(sa) * 9.0,
                                    wz: 10.0,
                                    vx: Math.cos(sa) * 165.0,
                                    vy: Math.sin(sa) * 165.0,
                                    friendly: false,
                                    dmg: 12.0 + world.wave * 0.6,
                                    mark: null,
                                    color: 'rgb(255, 112, 68)',
                                    radius: 4.0,
                                    life: 2.4
                                });
                            }
                        }
                    } else if (en.kind === 'golem') {
                        if (en.aiState === 'chase') {
                            desVx = ux * effSpd; desVy = uy * effSpd;
                            if (en.aiTimer <= 0.0 && dist < 145.0 && en.spawnBloom >= 1.0) {
                                en.aiState = 'windup'; en.aiTimer = 0.58; en.chargeDx = ux; en.chargeDy = uy;
                            }
                        } else if (en.aiState === 'windup') {
                            if (en.aiTimer <= 0.0) { en.aiState = 'charge'; en.aiTimer = 0.48; }
                        } else if (en.aiState === 'charge') {
                            desVx = en.chargeDx * effSpd * 3.1; desVy = en.chargeDy * effSpd * 3.1;
                            if (en.aiTimer <= 0.0) { en.aiState = 'chase'; en.aiTimer = 2.4; }
                        }
                    } else if (en.kind === 'weaver') {
                        const angOrbit = Math.atan2(dy, dx) + 1.05;
                        desVx = Math.cos(angOrbit) * effSpd; desVy = Math.sin(angOrbit) * effSpd;
                    } else {
                        desVx = ux * effSpd; desVy = uy * effSpd;
                        if (en.aiTimer <= 0.0 && en.spawnBloom >= 0.95) {
                            en.aiTimer = 1.55;
                            if (en.aiState === 'chase') {
                                en.aiState = 'nova';
                                const baseA = Math.atan2(dy, dx);
                                for (const offA of [-0.36, -0.18, 0.0, 0.18, 0.36]) {
                                    const sa = baseA + offA;
                                    world.projectiles.push({
                                        wx: en.wx + Math.cos(sa) * 14.0,
                                        wy: en.wy + Math.sin(sa) * 14.0,
                                        wz: 13.0,
                                        vx: Math.cos(sa) * 175.0,
                                        vy: Math.sin(sa) * 175.0,
                                        friendly: false,
                                        dmg: 16.0 + world.wave * 0.5,
                                        mark: null,
                                        color: 'rgb(255, 198, 56)',
                                        radius: 4.8,
                                        life: 2.8
                                    });
                                }
                            } else {
                                en.aiState = 'chase';
                                const spinOff = world.elapsedTime * 1.3;
                                for (let k = 0; k < 10; k++) {
                                    const sa = spinOff + k * (2.0 * Math.PI / 10.0);
                                    world.projectiles.push({
                                        wx: en.wx + Math.cos(sa) * 14.0,
                                        wy: en.wy + Math.sin(sa) * 14.0,
                                        wz: 13.0,
                                        vx: Math.cos(sa) * 140.0,
                                        vy: Math.sin(sa) * 140.0,
                                        friendly: false,
                                        dmg: 15.0 + world.wave * 0.5,
                                        mark: null,
                                        color: 'rgb(255, 76, 158)',
                                        radius: 4.5,
                                        life: 3.0
                                    });
                                }
                            }
                        }
                    }

                    let sepX = 0.0, sepY = 0.0;
                    for (const other of world.enemies) {
                        if (other !== en) {
                            const ox = en.wx - other.wx, oy = en.wy - other.wy;
                            const od2 = ox * ox + oy * oy;
                            const minSep = en.radius + other.radius + 3.0;
                            if (od2 > 0.01 && od2 < minSep * minSep) {
                                const od = Math.sqrt(od2);
                                const push = (minSep - od) * 6.5;
                                sepX += (ox / od) * push;
                                sepY += (oy / od) * push;
                            }
                        }
                    }

                    const steerT = 1.0 - Math.exp(-9.0 * dt);
                    en.vx += ((desVx + sepX) - en.vx) * steerT;
                    en.vy += ((desVy + sepY) - en.vy) * steerT;
                    en.wx += en.vx * dt;
                    en.wy += en.vy * dt;
                    [en.wx, en.wy] = resolveObstaclesAndBounds(en.wx, en.wy, en.radius);

                    en.animPhase += dt * (en.kind === 'skitter' ? 8.5 : 5.5);
                    en.heading = en.aiState === 'windup'
                        ? Math.atan2(en.chargeDy, en.chargeDx) - Math.PI * 0.5
                        : Math.atan2(dy, dx) - Math.PI * 0.5;

                    if (p.alive && en.spawnBloom >= 0.85 && en.wz < 14.0 && Math.hypot(en.wx - p.wx, en.wy - p.wy) <= en.radius + 8.5) {
                        hurtPlayer((en.kind === 'golem' || en.kind === 'boss') ? 22.0 : 13.0, en.wx, en.wy);
                    }
                }

                // Cristales y peligros del suelo
                const keptC = [];
                for (const c of world.crystals) {
                    c.life -= dt;
                    c.phase += dt * 4.5;
                    if (c.life <= 0.0) continue;
                    if (c.wz > 0.0 || c.vz !== 0.0) {
                        c.vz -= 180.0 * dt;
                        c.wz = Math.max(0.0, c.wz + c.vz * dt);
                        if (c.wz === 0.0) c.vz = 0.0;
                    }
                    const d = Math.hypot(p.wx - c.wx, p.wy - c.wy);
                    if (p.alive && d <= 68.0) {
                        c.wx += ((p.wx - c.wx) / Math.max(1.0, d)) * 185.0 * dt;
                        c.wy += ((p.wy - c.wy) / Math.max(1.0, d)) * 185.0 * dt;
                    }
                    if (p.alive && d <= 14.0) {
                        audio.playSfx('pickup', 0.8);
                        const pts = addScore(150);
                        p.shield = Math.min(p.maxShield, p.shield + 3.0);
                        world.popups.push({ wx: c.wx, wy: c.wy, wz: 16.0, text: `+${pts}`, color: '#58f49c', life: 0.55, maxLife: 0.55, big: false });
                        continue;
                    }
                    keptC.push(c);
                }
                world.crystals = keptC;

                const keptH = [];
                for (const h of world.hazards) {
                    h.life -= dt;
                    if (h.life <= 0.0) continue;
                    h.tickAcc += dt;
                    if (h.tickAcc >= 0.25) {
                        h.tickAcc = 0.0;
                        if (h.kind === 'magma') {
                            for (const en of [...world.enemies]) {
                                if (Math.hypot(en.wx - h.wx, en.wy - h.wy) <= h.radius + en.radius) damageEnemy(en, 8.5, null, 0, 0);
                            }
                        } else if (p.alive && Math.hypot(p.wx - h.wx, p.wy - h.wy) <= h.radius + 7.0) {
                            hurtPlayer(9.0, h.wx, h.wy);
                        }
                    }
                    keptH.push(h);
                }
                world.hazards = keptH;

                // Partículas y VFX (_update_fx)
                const keptDeb = [];
                for (const d of world.debris) {
                    d.life -= realDt;
                    if (d.life <= 0.0) continue;
                    d.vz -= 280.0 * realDt;
                    d.wx += d.vx * realDt;
                    d.wy += d.vy * realDt;
                    d.wz += d.vz * realDt;
                    if (d.wz <= 0.0) {
                        d.wz = 0.0;
                        d.vz = -d.vz * 0.42;
                        d.vx *= 0.72;
                        d.vy *= 0.72;
                    }
                    keptDeb.push(d);
                }
                world.debris = keptDeb;

                world.slashes = world.slashes.filter((s) => (s.life -= realDt) > 0.0);
                world.cutFlashes = world.cutFlashes.filter((cf) => (cf.life -= realDt) > 0.0);
                world.muzzleFlashes = world.muzzleFlashes.filter((mf) => (mf.life -= realDt) > 0.0);
                world.seismicBlasts = world.seismicBlasts.filter((sb) => (sb.life -= realDt) > 0.0);
                world.craterDecals = world.craterDecals.filter((cd) => (cd.life -= realDt) > 0.0);
                world.rings = world.rings.filter((r) => (r.life -= realDt) > 0.0);
                world.bolts = world.bolts.filter((b) => (b.life -= realDt) > 0.0);
                world.afterimages = world.afterimages.filter((a) => (a.life -= realDt) > 0.0);

                // Estela parabólica de partículas detrás de cada Bomba Sísmica en vuelo
                for (const b of world.bombs) {
                    const prog = Math.min(1.0, b.elapsed / Math.max(0.01, b.duration));
                    const bx = b.startX + (b.targetX - b.startX) * prog;
                    const by = b.startY + (b.targetY - b.startY) * prog;
                    const bz = Math.sin(prog * Math.PI) * 28.0;
                    world.debris.push({
                        wx: bx + (Math.random() * 4.0 - 2.0),
                        wy: by + (Math.random() * 4.0 - 2.0),
                        wz: bz,
                        vx: Math.random() * 24.0 - 12.0,
                        vy: Math.random() * 24.0 - 12.0,
                        vz: 4.0 + Math.random() * 14.0,
                        color: 'rgb(255, 116, 186)',
                        size: 2,
                        life: 0.22,
                        maxLife: 0.22
                    });
                }

                for (const prp of world.props) {
                    prp.phase += realDt * 5.0;
                    if (prp.kind === 'brazier' && Math.random() < realDt * 9.0) {
                        world.debris.push({
                            wx: prp.wx + (Math.random() * 8.0 - 4.0),
                            wy: prp.wy + (Math.random() * 8.0 - 4.0),
                            wz: 16.0,
                            vx: Math.random() * 20.0 - 10.0,
                            vy: Math.random() * 20.0 - 10.0,
                            vz: 22.0 + Math.random() * 24.0,
                            color: 'rgb(255, 194, 62)',
                            size: 2,
                            life: 0.45,
                            maxLife: 0.45
                        });
                    }
                }

                for (const pop of world.popups) {
                    pop.life -= realDt;
                    pop.wz += 18.0 * realDt;
                }
                world.popups = world.popups.filter((pop) => pop.life > 0.0);

                for (const em of world.embers) {
                    em[2] += em[3] * realDt;
                    if (em[2] > 42.0) {
                        em[0] = (Math.random() * 2 - 1) * ARENA_RADIUS;
                        em[1] = (Math.random() * 2 - 1) * ARENA_RADIUS;
                        em[2] = 0.0;
                    }
                }

                cam.update(realDt, p.wx, p.wy, p.vx, p.vy, aimWx, aimWy, ARENA_RADIUS);
            }

            // ================================================================
            // RENDERIZADO COMPLETO DEL MUNDO Y HUD (1:1 con combat_world.py + ui_screens.py)
            // ================================================================
            arenaMap.drawBackdropAndArena(ctx, cam, screenMode === 'playing' ? realDt : 0.0, viewW, viewH);
            drawGroundHazardsAndTelegraphs();

            const renderQueue = [];
            const yaw = cam.yaw;

            for (const a of world.afterimages) {
                const sc = cam.worldToScreen(a.wx, a.wy, 0.0);
                renderQueue.push({
                    ry: sc.ry - 0.5,
                    fn: () => drawBakedModelWeb(ctx, models[a.modelId], sc.sx, sc.sy, a.heading + yaw, a.wz, true, false)
                });
            }
            for (const prp of world.props) {
                const sc = cam.worldToScreen(prp.wx, prp.wy, 0.0);
                renderQueue.push({ ry: sc.ry, fn: () => drawBakedModelWeb(ctx, models[prp.kind], sc.sx, sc.sy, yaw) });
            }
            for (const pil of world.pillars) {
                const sc = cam.worldToScreen(pil.wx, pil.wy, 0.0);
                renderQueue.push({ ry: sc.ry, fn: () => drawBakedModelWeb(ctx, models.pillar, sc.sx, sc.sy, yaw) });
            }
            for (const py of world.pylons) {
                const sc = cam.worldToScreen(py.wx, py.wy, 0.0);
                const mid = `pylon_${py.state}`;
                const active = py.state !== 'neutral';
                renderQueue.push({ ry: sc.ry, fn: () => drawPylon(py, mid, sc.sx, sc.sy, yaw, active) });
            }
            for (const c of world.crystals) {
                const sc = cam.worldToScreen(c.wx, c.wy, 0.0);
                const bobZ = c.wz + 1.8 + Math.sin(c.phase) * 1.4;
                renderQueue.push({ ry: sc.ry, fn: () => drawBakedModelWeb(ctx, models.crystal, sc.sx, sc.sy, c.phase + yaw, bobZ) });
            }
            for (const en of world.enemies) {
                const sc = cam.worldToScreen(en.wx, en.wy, 0.0);
                renderQueue.push({ ry: sc.ry, fn: () => drawEnemy(en, sc.sx, sc.sy, yaw) });
            }
            for (const b of world.bombs) {
                const prog = Math.min(1.0, b.elapsed / Math.max(0.01, b.duration));
                const bx = b.startX + (b.targetX - b.startX) * prog;
                const by = b.startY + (b.targetY - b.startY) * prog;
                const bz = Math.sin(prog * Math.PI) * 28.0;
                const sc = cam.worldToScreen(bx, by, 0.0);
                renderQueue.push({ ry: sc.ry, fn: () => drawBakedModelWeb(ctx, models.bomb, sc.sx, sc.sy, prog * 9.0 + yaw, bz) });
            }
            if (p.alive) {
                const pSc = cam.worldToScreen(p.wx, p.wy, 0.0);
                renderQueue.push({ ry: pSc.ry, fn: () => drawPlayer(pSc.sx, pSc.sy, yaw) });
            }
            for (const pr of world.projectiles) {
                const sc = cam.worldToScreen(pr.wx, pr.wy, pr.wz);
                const gSc = cam.worldToScreen(pr.wx, pr.wy, 0.0);
                renderQueue.push({ ry: sc.ry, fn: () => drawProjectile(pr, sc.sx, sc.sy, gSc.sx, gSc.sy) });
            }
            for (const deb of world.debris) {
                const sc = cam.worldToScreen(deb.wx, deb.wy, deb.wz);
                renderQueue.push({
                    ry: sc.ry,
                    fn: () => {
                        ctx.fillStyle = deb.color;
                        ctx.fillRect(Math.round(sc.sx) - deb.size, Math.round(sc.sy) - deb.size, deb.size * 2, deb.size * 2);
                    }
                });
            }

            renderQueue.sort((a, b) => a.ry - b.ry);
            renderQueue.forEach((it) => it.fn());

            // Haces de Plasma Esmeralda entre Pilones Sincronizados
            const synced = world.pylons.filter((q) => q.state === 'sync');
            if (synced.length >= 2) {
                for (let i = 0; i < synced.length; i++) {
                    for (let j = i + 1; j < synced.length; j++) {
                        const p1 = cam.worldToScreen(synced[i].wx, synced[i].wy, 15.0);
                        const p2 = cam.worldToScreen(synced[j].wx, synced[j].wy, 15.0);
                        ctx.strokeStyle = 'rgb(32, 184, 112)'; ctx.lineWidth = 8;
                        ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
                        ctx.strokeStyle = 'rgb(214, 255, 232)'; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
                    }
                }
            }

            // Tajos de Espada en 2 alturas Z
            for (const sl of world.slashes) {
                const prog = 1.0 - (sl.life / Math.max(0.01, sl.maxLife));
                const scLow = cam.worldToScreen(sl.wx, sl.wy, 7.0);
                const scHigh = cam.worldToScreen(sl.wx, sl.wy, 10.5);
                slashVfx.drawSlash(ctx, sl.variant, prog, scLow.sx, scLow.sy, scHigh.sy, sl.angle + cam.yaw);
            }

            // Destellos de corte diagonal sobre enemigos golpeados
            for (const cf of world.cutFlashes) {
                const t = cf.life / Math.max(0.01, cf.maxLife);
                const sc = cam.worldToScreen(cf.wx, cf.wy, cf.wz);
                const half = cf.length * ART_SCALE * (0.4 + 0.6 * t);
                const sa = cf.angle + cam.yaw;
                const dx = Math.cos(sa) * half;
                const dy = Math.sin(sa) * half * STACK_SQUASH;
                const wLine = Math.max(2, Math.floor(6 * t));
                ctx.strokeStyle = 'rgb(255, 132, 32)'; ctx.lineWidth = wLine + 4;
                ctx.beginPath(); ctx.moveTo(sc.sx - dx, sc.sy - dy); ctx.lineTo(sc.sx + dx, sc.sy + dy); ctx.stroke();
                ctx.strokeStyle = cf.color; ctx.lineWidth = wLine;
                ctx.beginPath(); ctx.moveTo(sc.sx - dx, sc.sy - dy); ctx.lineTo(sc.sx + dx, sc.sy + dy); ctx.stroke();
            }

            // Explosiones pixel-art del Cráter Sísmico en 2 alturas Z
            for (const sb of world.seismicBlasts) {
                const prog = 1.0 - (sb.life / Math.max(0.01, sb.maxLife));
                const scLow = cam.worldToScreen(sb.wx, sb.wy, 2.0);
                const scHigh = cam.worldToScreen(sb.wx, sb.wy, 9.0);
                slashVfx.drawSeismicBlast(ctx, prog, scLow.sx, scLow.sy, scHigh.sy);
            }

            // Fogonazos estelares
            for (const mf of world.muzzleFlashes) {
                const sc = cam.worldToScreen(mf.wx, mf.wy, mf.wz);
                slashVfx.drawMuzzle(ctx, mf.kind, sc.sx, sc.sy);
            }

            // Rayos perforantes (triple capa) y arcos voltaicos
            for (const b of world.bolts) {
                const scrPts = b.pts.map(([wx, wy, wz]) => cam.worldToScreen(wx, wy, wz));
                if (scrPts.length >= 2) {
                    const trace = () => {
                        ctx.beginPath();
                        ctx.moveTo(scrPts[0].sx, scrPts[0].sy);
                        for (let i = 1; i < scrPts.length; i++) ctx.lineTo(scrPts[i].sx, scrPts[i].sy);
                        ctx.stroke();
                    };
                    ctx.strokeStyle = 'rgb(14, 48, 86)'; ctx.lineWidth = 12; trace();
                    ctx.strokeStyle = b.color; ctx.lineWidth = 7; trace();
                    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; trace();
                }
            }

            // Brasas flotantes de ambiente
            ctx.fillStyle = 'rgb(255, 146, 54)';
            for (const em of world.embers) {
                const esc = cam.worldToScreen(em[0], em[1], em[2]);
                if (esc.sx >= 0 && esc.sx < viewW && esc.sy >= 0 && esc.sy < viewH) {
                    ctx.fillRect(Math.floor(esc.sx), Math.floor(esc.sy), 3, 3);
                }
            }

            // Popups flotantes
            for (const pop of world.popups) {
                const sc = cam.worldToScreen(pop.wx, pop.wy, pop.wz);
                const fnt = pop.big ? fonts.md : fonts.xs;
                const surf = fnt.render(pop.text, pop.color, true);
                ctx.drawImage(surf, Math.round(sc.sx - surf.width * 0.5), Math.round(sc.sy - surf.height * 0.5));
            }

            // Indicadores en bordes de pantalla para pilones polarizados fuera de vista
            drawOffscreenPylonIndicators();

            // ================================================================
            // HUD PIXEL-ART (Port 1:1 de EventDrivenHUD.draw en ui_screens.py)
            // ================================================================
            const safe = viewW < 920 ? 10 : 18;
            const leftW = viewW < 920 ? Math.min(286, Math.floor(viewW * 0.34)) : 344;
            const rightW = viewW < 920 ? Math.min(240, Math.floor(viewW * 0.30)) : 332;
            const centerW = viewW < 920 ? Math.max(210, viewW - leftW - rightW - safe * 4) : 400;

            // Ancla Superior Izquierda: Casco, Escudo e Impulsos
            drawForgedPanel(ctx, safe, safe, leftW, 108, 'rgba(22, 26, 42, 0.94)', 'rgb(94, 110, 152)', 6, true);
            fonts.xs.draw(ctx, `NÚCLEO  ${Math.ceil(p.hp)}/${Math.floor(p.maxHp)}`, safe + 14, safe + 8, '#ecf2ff', 'left', false);
            const barW = leftW - 28;
            ctx.fillStyle = 'rgb(10, 12, 20)';
            ctx.fillRect(safe + 14, safe + 32, barW, 14);
            const hpRatio = Math.max(0.0, Math.min(1.0, p.hp / Math.max(1.0, p.maxHp)));
            if (hpRatio > 0.0) {
                const fw = Math.floor((barW - 4) * hpRatio);
                ctx.fillStyle = hpRatio > 0.3 ? 'rgb(232, 62, 82)' : 'rgb(255, 42, 58)';
                ctx.fillRect(safe + 16, safe + 34, fw, 10);
                ctx.fillStyle = 'rgb(255, 168, 176)';
                ctx.fillRect(safe + 16, safe + 34, fw, 3);
            }
            ctx.strokeStyle = 'rgb(72, 84, 118)';
            ctx.lineWidth = 2;
            ctx.strokeRect(safe + 14, safe + 32, barW, 14);

            ctx.fillStyle = 'rgb(10, 12, 20)';
            ctx.fillRect(safe + 14, safe + 52, barW, 12);
            const shRatio = Math.max(0.0, Math.min(1.0, p.shield / Math.max(1.0, p.maxShield)));
            if (shRatio > 0.0) {
                const sw = Math.floor((barW - 4) * shRatio);
                ctx.fillStyle = 'rgb(42, 184, 232)';
                ctx.fillRect(safe + 16, safe + 54, sw, 8);
                ctx.fillStyle = 'rgb(186, 248, 255)';
                ctx.fillRect(safe + 16, safe + 54, sw, 2);
            }
            ctx.strokeStyle = 'rgb(64, 82, 114)';
            ctx.strokeRect(safe + 14, safe + 52, barW, 12);

            fonts.xs.draw(ctx, leftW < 300 ? 'IMPULSO:' : 'IMPULSO [ESP]:', safe + 14, safe + 72, '#96a4c4', 'left', false);
            const dashStartX = leftW < 300 ? safe + 122 : safe + 206;
            const dashBoxW = leftW < 300 ? 44 : 54;
            for (let i = 0; i < p.maxDashes; i++) {
                const px = dashStartX + i * (dashBoxW + 8), py = safe + 73;
                ctx.fillStyle = 'rgb(10, 12, 20)';
                ctx.fillRect(px, py, dashBoxW, 18);
                if (i < p.dashes) {
                    ctx.fillStyle = 'rgb(68, 224, 136)';
                    ctx.fillRect(px + 2, py + 2, dashBoxW - 4, 14);
                    ctx.fillStyle = 'rgb(204, 255, 224)';
                    ctx.fillRect(px + 2, py + 2, dashBoxW - 4, 3);
                } else if (i === p.dashes) {
                    const prog = Math.min(1.0, p.dashRecharge / 2.35);
                    ctx.fillStyle = 'rgb(42, 122, 88)';
                    ctx.fillRect(px + 2, py + 2, Math.floor((dashBoxW - 4) * prog), 14);
                }
                ctx.strokeStyle = 'rgb(74, 88, 128)';
                ctx.lineWidth = 2;
                ctx.strokeRect(px, py, dashBoxW, 18);
            }

            // Ancla Superior Derecha: Puntuación Arcade, Multiplicador y Récord
            drawForgedPanel(ctx, viewW - safe - rightW, safe, rightW, 108, 'rgba(22, 26, 42, 0.94)', 'rgb(214, 162, 48)', 6, true);
            const bestLive = Math.max(lastBestScore, world.score);
            fonts.xs.draw(ctx, `RÉCORD: ${bestLive.toLocaleString()}`, viewW - safe - 14, safe + 8, '#fac638', 'right', false);
            const scoreCol = scorePopTimer > 0.0 ? '#fffcc4' : '#ecf2ff';
            fonts.lg.draw(ctx, `${world.score.toLocaleString()}`, viewW - safe - 14, safe + 30, scoreCol, 'right', true, scorePopTimer > 0.0 ? '#ffffff' : null);
            const multCol = world.multiplier >= 3.0 ? '#58f49c' : (world.multiplier >= 1.8 ? '#ffc448' : '#96a4c4');
            fonts.sm.draw(ctx, `COMBO x${world.multiplier.toFixed(2)}`, viewW - safe - 14, safe + 76, multCol, 'right', false);

            // Ancla Superior Central: Oleada, Reloj y Barra de Jefe
            const mins = String(Math.floor(world.elapsedTime / 60)).padStart(2, '0');
            const secs = String(Math.floor(world.elapsedTime % 60)).padStart(2, '0');
            const remaining = world.enemies.length + world.spawnQueue.length;
            drawForgedPanel(ctx, viewW * 0.5 - centerW * 0.5, safe, centerW, 64, 'rgba(22, 26, 42, 0.94)', 'rgb(74, 88, 128)', 6, true);
            fonts.md.draw(ctx, `OLEADA ${world.wave} • ${mins}:${secs}`, viewW * 0.5, safe + 6, '#ecf2ff', 'center', false);
            const subStatus = p.diamondOverdrive > 0.0
                ? `MODO DIAMANTE (${p.diamondOverdrive.toFixed(1)}s)`
                : `Hostiles: ${remaining} | Cataclismos: ${world.cataclysms}`;
            fonts.xs.draw(ctx, subStatus, viewW * 0.5, safe + 36, p.diamondOverdrive > 0.0 ? '#58f49c' : '#96a4c4', 'center', false);

            const boss = world.enemies.find((e) => e.kind === 'boss');
            if (boss) {
                const bw = Math.min(480, viewW - 40);
                const bx = viewW * 0.5 - bw * 0.5, by = safe + 72;
                drawForgedPanel(ctx, bx, by, bw, 32, 'rgba(36, 18, 28, 0.96)', '#fac638', 5, false);
                const ratioB = Math.max(0.0, Math.min(1.0, boss.hp / Math.max(1.0, boss.maxHp)));
                ctx.fillStyle = 'rgb(218, 52, 76)';
                ctx.fillRect(bx + 6, by + 6, Math.floor((bw - 12) * ratioB), 20);
                fonts.xs.draw(ctx, `COLOSO DEL EJE (${Math.ceil(boss.hp)}/${Math.floor(boss.maxHp)})`, viewW * 0.5, by + 4, '#fff4be', 'center', true);
            }

            if (world.waveBannerTimer > 0.0) {
                const by = Math.floor(viewH * 0.23);
                fonts.xl.draw(ctx, world.waveBannerTitle, viewW * 0.5, by - 24, '#ffe062', 'center', true, '#fff8d2');
                fonts.sm.draw(ctx, world.waveBannerSub, viewW * 0.5, by + 30, '#ecf2ff', 'center', true);
            }

            // Ancla Inferior Central: Las 3 Armas con Iconos Pixel-Art
            const gap = viewW < 920 ? 8 : 12;
            const cw = Math.min(294, Math.floor((viewW - (touchMode ? 280 : 40) - gap * 2) / 3));
            const startX = viewW * 0.5 - (cw * 3 + gap * 2) * 0.5;
            const byCards = viewH - safe - 82;

            WEAPON_INFO.forEach((info, wid) => {
                const selected = p.weapon === wid;
                const cx = startX + wid * (cw + gap);
                drawForgedPanel(ctx, cx, byCards, cw, 68, selected ? 'rgba(34, 41, 66, 0.96)' : 'rgba(22, 26, 42, 0.94)', selected ? info.color : 'rgb(74, 88, 128)', 6, selected);
                drawWeaponPixelIcon(wid, cx + 22, byCards + 24);
                const titleTxt = cw < 210 ? `[${info.key}] ${info.name.split(' ')[0]}` : `[${info.key}] ${info.name}`;
                fonts.sm.draw(ctx, titleTxt, cx + 42, byCards + 8, selected ? info.bright : '#ecf2ff', 'left', false);

                const cd = p.weaponCd[wid];
                let tag;
                if (wid === WEAPON_RANGED) {
                    tag = p.rangedCounter === 3 ? '¡PERFORANTE LISTO!' : `${cw < 210 ? 'Riel' : 'Distancia • Riel'} ${p.rangedCounter}/3`;
                } else if (wid === WEAPON_MELEE) {
                    tag = `${cw < 210 ? 'Tajo' : 'C. Cuerpo • Tajo'} ${p.meleeCombo + 1}/3`;
                } else {
                    tag = cd <= 0.01 ? (cw < 210 ? 'Listo' : 'En Área • Listo') : `En Área • ${cd.toFixed(1)}s`;
                }
                fonts.xs.draw(ctx, tag, cx + 42, byCards + 36, selected ? info.color : '#96a4c4', 'left', false);
                uiClickRegions.push({ x: cx, y: byCards, w: cw, h: 68, onClick: () => switchWeapon(wid) });
            });

            if (!touchMode) {
                fonts.xs.draw(ctx, '[Q/E] Rotar Cámara 3D  •  [R] Norte  •  [ESC] Pausa y Sonido', viewW * 0.5, viewH - 25, '#96a4c4', 'center', true);
            }

            // Controles táctiles para teléfono móvil con círculos traslúcidos y feedback
            if (touchMode && screenMode === 'playing') {
                const drawTouchCircle = (cx, cy, r, label, color, active, progress = 1) => {
                    ctx.save();
                    ctx.fillStyle = active ? 'rgba(16, 24, 42, 0.78)' : 'rgba(10, 14, 26, 0.58)';
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = active ? '#ffffff' : color;
                    ctx.globalAlpha = active ? 0.95 : 0.65;
                    ctx.lineWidth = active ? 3.5 : 2.5;
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
                    if (progress < 1) {
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = 0.9;
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(cx, cy, r - 4, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * Math.max(0.02, progress));
                        ctx.stroke();
                    }
                    ctx.restore();
                    fonts.xs.draw(ctx, label, cx, cy - 8, active ? '#ffffff' : color, 'center', true);
                };

                const joyBaseX = 96, joyBaseY = viewH - 118;
                const aimBaseX = viewW - 96, aimBaseY = viewH - 118;

                const jCx = touchJoy.active ? touchJoy.sx : joyBaseX;
                const jCy = touchJoy.active ? touchJoy.sy : joyBaseY;
                ctx.save();
                ctx.fillStyle = 'rgba(10, 14, 26, 0.46)';
                ctx.beginPath(); ctx.arc(jCx, jCy, 64, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = touchJoy.active ? 'rgba(68, 228, 255, 0.75)' : 'rgba(68, 228, 255, 0.42)';
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.arc(jCx, jCy, 64, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = touchJoy.active ? 'rgba(68, 228, 255, 0.45)' : 'rgba(68, 228, 255, 0.25)';
                ctx.beginPath(); ctx.arc(touchJoy.active ? touchJoy.cx : jCx, touchJoy.active ? touchJoy.cy : jCy, 26, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                if (!touchJoy.active) fonts.xs.draw(ctx, 'MOVER', jCx, jCy - 8, '#a8efff', 'center', true);

                const aCx = touchAim.active ? touchAim.sx : aimBaseX;
                const aCy = touchAim.active ? touchAim.sy : aimBaseY;
                ctx.save();
                ctx.fillStyle = 'rgba(10, 14, 26, 0.46)';
                ctx.beginPath(); ctx.arc(aCx, aCy, 64, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = touchAim.active ? 'rgba(255, 152, 36, 0.80)' : 'rgba(255, 152, 36, 0.45)';
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.arc(aCx, aCy, 64, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = touchAim.active ? 'rgba(255, 152, 36, 0.48)' : 'rgba(255, 152, 36, 0.26)';
                ctx.beginPath(); ctx.arc(touchAim.active ? touchAim.cx : aCx, touchAim.active ? touchAim.cy : aCy, 26, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                if (!touchAim.active) fonts.xs.draw(ctx, 'ATACAR', aCx, aCy - 8, '#ffd296', 'center', true);

                const dashReady = p.dashes > 0;
                const dashProg = dashReady ? 1 : Math.min(1, p.dashRecharge / 2.35);
                const dBtn = { cx: viewW - 86, cy: viewH - 236, r: 44 };
                drawTouchCircle(dBtn.cx, dBtn.cy, dBtn.r, 'IMPULSO', dashReady ? '#58f49c' : '#6c8878', dashReady && p.dashTimer > 0, dashProg);
                uiClickRegions.push({ x: dBtn.cx - dBtn.r, y: dBtn.cy - dBtn.r, w: dBtn.r * 2, h: dBtn.r * 2, onClick: () => tryDash(touchJoy.dx, touchJoy.dy, p.wx + touchAim.dx * 80, p.wy + touchAim.dy * 80) });

                const pBtn = { cx: viewW - 56, cy: safe + 146, r: 34 };
                drawTouchCircle(pBtn.cx, pBtn.cy, pBtn.r, 'PAUSA', '#44e4ff', false, 1);
                uiClickRegions.push({ x: pBtn.cx - pBtn.r, y: pBtn.cy - pBtn.r, w: pBtn.r * 2, h: pBtn.r * 2, onClick: () => { modalSelectedBtn = 0; screenMode = 'paused'; } });

                const rotL = { cx: safe + 34, cy: safe + 146, r: 28 };
                const rotR = { cx: safe + 100, cy: safe + 146, r: 28 };
                drawTouchCircle(rotL.cx, rotL.cy, rotL.r, '↺', '#b8c4e0', false, 1);
                drawTouchCircle(rotR.cx, rotR.cy, rotR.r, '↻', '#b8c4e0', false, 1);
                uiClickRegions.push({ x: rotL.cx - rotL.r, y: rotL.cy - rotL.r, w: rotL.r * 2, h: rotL.r * 2, onClick: () => cam.rotateBy(-Math.PI / 4) });
                uiClickRegions.push({ x: rotR.cx - rotR.r, y: rotR.cy - rotR.r, w: rotR.r * 2, h: rotR.r * 2, onClick: () => cam.rotateBy(Math.PI / 4) });
            }

            if (screenMode === 'playing' && !touchMode && p.alive) {
                drawWeaponReticle(mouse.x, mouse.y, p.weapon, p.rangedCounter);
            }

            // ================================================================
            // MODALES Y OVERLAYS (Port 1:1 de SimpleButtonModal, SoundOptionsOverlay, HowToPlayOverlay)
            // ================================================================
            if (screenMode === 'paused' || screenMode === 'gameover') {
                ctx.fillStyle = 'rgba(6, 8, 16, 0.78)';
                ctx.fillRect(0, 0, viewW, viewH);
                const isGO = screenMode === 'gameover';
                const tSec = Math.round(world.elapsedTime);
                const tStr = `${String(Math.floor(tSec / 60)).padStart(2, '0')}:${String(tSec % 60).padStart(2, '0')}`;
                const titleTxt = isGO ? (isNewRecord ? '¡¡NUEVO RÉCORD HISTÓRICO!!' : 'NÚCLEO CAÍDO — FIN DE PARTIDA') : 'JUEGO EN PAUSA';
                const titleCol = isGO ? (isNewRecord ? '#fac638' : '#ff5668') : '#44e4ff';

                const statsLines = isGO
                    ? [
                        [`Puntuación Final: ${world.score.toLocaleString()} PTS`, '#fff4b2'],
                        [`Récord Guardado: ${lastBestScore.toLocaleString()} PTS`, '#58f49c'],
                        [`Oleada: ${world.wave}  |  Tiempo: ${tStr}`, '#d6e4fc'],
                        [`Eliminados: ${world.kills}  |  Cataclismos: ${world.cataclysms}`, '#aabada'],
                        [`Mejor Combo: x${world.maxCombo.toFixed(2)}`, '#44e4ff']
                    ]
                    : [
                        [`Puntuación Actual: ${world.score.toLocaleString()} pts  (x${world.multiplier.toFixed(2)})`, '#ffe888'],
                        [`Oleada ${world.wave} • Récord: ${lastBestScore.toLocaleString()} pts`, '#b4c4e2']
                    ];

                const mBtns = isGO
                    ? [
                        { label: 'JUGAR DE NUEVO', fn: () => { resetRun(); screenMode = 'playing'; } },
                        { label: 'OPCIONES DE SONIDO', fn: () => { prevModeBeforeOverlay = 'gameover'; screenMode = 'options'; } },
                        { label: 'MENÚ PRINCIPAL', fn: () => { screenMode = 'title'; } }
                    ]
                    : [
                        { label: 'CONTINUAR PARTIDA', fn: () => { screenMode = 'playing'; } },
                        { label: 'OPCIONES DE SONIDO', fn: () => { prevModeBeforeOverlay = 'paused'; screenMode = 'options'; } },
                        { label: 'ARSENAL Y MECÁNICA', fn: () => { prevModeBeforeOverlay = 'paused'; screenMode = 'howto'; } },
                        { label: 'REINICIAR MODO ARCADE', fn: () => { resetRun(); screenMode = 'playing'; } },
                        { label: 'MENÚ PRINCIPAL', fn: () => { screenMode = 'title'; } }
                    ];

                const pw = Math.min(viewW - 60, 680);
                const ph = 156 + statsLines.length * 30 + mBtns.length * 54;
                const px = Math.floor(viewW * 0.5 - pw * 0.5);
                const py = Math.max(16, Math.floor(viewH * 0.5 - ph * 0.5));
                drawForgedPanel(ctx, px, py, pw, ph, 'rgba(22, 26, 42, 0.97)', titleCol, 10, true);
                fonts.lg.draw(ctx, titleTxt, viewW * 0.5, py + 22, titleCol, 'center', true);

                let sy = py + 72;
                for (const [txt, col] of statsLines) {
                    fonts.sm.draw(ctx, txt, viewW * 0.5, sy, col, 'center', false);
                    sy += 30;
                }

                const by0 = sy + 14;
                const bw = Math.min(450, pw - 40);
                mBtns.forEach((b, i) => {
                    const bx = Math.floor(viewW * 0.5 - bw * 0.5);
                    const by = by0 + i * 52;
                    const focused = i === modalSelectedBtn;
                    drawForgedPanel(ctx, bx, by, bw, 44, focused ? 'rgba(34, 41, 66, 0.96)' : 'rgba(16, 20, 34, 0.94)', focused ? titleCol : '#4a5880', 6, focused);
                    fonts.md.draw(ctx, focused ? `▶ ${b.label} ◀` : b.label, viewW * 0.5, by + 7, focused ? '#fff4b2' : '#ecf2ff', 'center', focused);
                    uiClickRegions.push({
                        x: bx, y: by, w: bw, h: 44,
                        onHover: () => { modalSelectedBtn = i; },
                        onClick: b.fn
                    });
                });
            } else if (screenMode === 'options') {
                // SoundOptionsOverlay 1:1
                ctx.fillStyle = 'rgba(6, 8, 16, 0.80)';
                ctx.fillRect(0, 0, viewW, viewH);
                const pw = Math.min(820, viewW - 36);
                const ph = Math.min(510, viewH - 28);
                const px = Math.floor(viewW * 0.5 - pw * 0.5);
                const py = Math.floor(viewH * 0.5 - ph * 0.5);
                drawForgedPanel(ctx, px, py, pw, ph, 'rgba(22, 26, 42, 0.97)', '#58f49c', 10, true);
                fonts.lg.draw(ctx, 'OPCIONES DE SONIDO Y PANTALLA', viewW * 0.5, py + 18, '#58f49c', 'center', true);
                fonts.xs.draw(ctx, 'Usa Ratón o Toca para ajustar volumen en tiempo real', viewW * 0.5, py + 58, '#96a4c4', 'center', false);

                const rows = [
                    { key: 'master', label: 'Volumen General (Master)', get: () => audio.masterSlider, set: (v) => { audio.masterSlider = v; audio._refreshMusicVolumes(); audio.playSfx('ui_ok', 0.75); } },
                    { key: 'music', label: 'Volumen de Música', get: () => audio.musicSlider, set: (v) => { audio.musicSlider = v; audio._refreshMusicVolumes(); } },
                    { key: 'sfx', label: 'Volumen de Efectos (SFX)', get: () => audio.sfxSlider, set: (v) => { audio.sfxSlider = v; audio.playSfx('ui_ok', 0.75); } },
                    { key: 'shake', label: 'Vibración de Cámara', get: () => cam.shakeIntensity, set: (v) => { cam.shakeIntensity = v; } },
                    { key: 'mute', label: 'Silenciar Todo Rápido [M]' },
                    { key: 'fullscreen', label: 'Pantalla Completa [F11]' },
                    { key: 'back', label: 'Guardar y Volver' }
                ];

                const y0 = py + 94;
                const rowH = Math.min(52, Math.floor((ph - 110) / rows.length));
                rows.forEach((row, idx) => {
                    const ry = y0 + idx * rowH;
                    const rRect = { x: px + 28, y: ry, w: pw - 56, h: 42 };
                    const focused = idx === optionsSelectedRow;
                    if (focused) {
                        drawForgedPanel(ctx, rRect.x, rRect.y, rRect.w, rRect.h, 'rgba(34, 41, 66, 0.96)', '#44e4ff', 4, false);
                    }
                    if (row.key === 'back') {
                        fonts.md.draw(ctx, focused ? `▶  ${row.label}  ◀` : row.label, viewW * 0.5, rRect.y + 6, focused ? '#ffe888' : '#ecf2ff', 'center', focused);
                        uiClickRegions.push({
                            ...rRect,
                            onHover: () => { optionsSelectedRow = idx; },
                            onClick: () => { screenMode = prevModeBeforeOverlay; }
                        });
                        return;
                    }

                    fonts.sm.draw(ctx, row.label, rRect.x + 14, rRect.y + 9, focused ? '#ecf2ff' : '#96a4c4', 'left', false);

                    if (row.get) {
                        const val = row.get();
                        const rightEdge = rRect.x + rRect.w;
                        const mBtn = { x: rightEdge - 310, y: rRect.y + 7, w: 30, h: 28 };
                        const bar = { x: rightEdge - 270, y: rRect.y + 13, w: 156, h: 16 };
                        const pBtn = { x: rightEdge - 104, y: rRect.y + 7, w: 30, h: 28 };

                        ctx.fillStyle = 'rgb(14, 18, 30)'; ctx.fillRect(mBtn.x, mBtn.y, mBtn.w, mBtn.h);
                        ctx.strokeStyle = 'rgb(74, 88, 128)'; ctx.lineWidth = 2; ctx.strokeRect(mBtn.x, mBtn.y, mBtn.w, mBtn.h);
                        fonts.sm.draw(ctx, '-', mBtn.x + 15, mBtn.y + 2, '#ecf2ff', 'center', false);

                        ctx.fillStyle = 'rgb(10, 12, 22)'; ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
                        const fillW = Math.floor((bar.w - 4) * val);
                        if (fillW > 0) {
                            ctx.fillStyle = row.key === 'music' ? '#ff9824' : '#44e4ff';
                            ctx.fillRect(bar.x + 2, bar.y + 2, fillW, bar.h - 4);
                        }
                        ctx.strokeStyle = 'rgb(74, 88, 128)'; ctx.strokeRect(bar.x, bar.y, bar.w, bar.h);
                        const knobX = bar.x + 2 + fillW;
                        ctx.fillStyle = 'rgb(245, 250, 255)'; ctx.fillRect(knobX - 4, bar.y - 2, 8, bar.h + 4);
                        ctx.strokeStyle = 'rgb(10, 12, 20)'; ctx.strokeRect(knobX - 4, bar.y - 2, 8, bar.h + 4);

                        ctx.fillStyle = 'rgb(14, 18, 30)'; ctx.fillRect(pBtn.x, pBtn.y, pBtn.w, pBtn.h);
                        ctx.strokeStyle = 'rgb(74, 88, 128)'; ctx.strokeRect(pBtn.x, pBtn.y, pBtn.w, pBtn.h);
                        fonts.sm.draw(ctx, '+', pBtn.x + 15, pBtn.y + 2, '#ecf2ff', 'center', false);

                        const pctTxt = (val <= 0.001 && row.key !== 'shake') ? 'MUDO' : `${Math.round(val * 100)}%`;
                        fonts.xs.draw(ctx, pctTxt, rightEdge - 12, rRect.y + 10, '#ecf2ff', 'right', false);

                        uiClickRegions.push({ ...mBtn, onHover: () => { optionsSelectedRow = idx; }, onClick: () => row.set(Math.max(0, Math.round((val - 0.05) * 100) / 100)) });
                        uiClickRegions.push({ ...pBtn, onHover: () => { optionsSelectedRow = idx; }, onClick: () => row.set(Math.min(1, Math.round((val + 0.05) * 100) / 100)) });
                        uiClickRegions.push({
                            x: bar.x, y: bar.y - 6, w: bar.w, h: bar.h + 12,
                            onHover: () => { optionsSelectedRow = idx; },
                            onClick: (cx) => row.set(Math.max(0, Math.min(1, Math.round(((cx - bar.x) / bar.w) * 100) / 100)))
                        });
                    } else if (row.key === 'mute') {
                        const muted = audio.masterSlider <= 0.001;
                        fonts.sm.draw(ctx, muted ? 'SILENCIADO' : 'SONIDO ACTIVO', rRect.x + rRect.w - 14, rRect.y + 9, muted ? '#ff5c6c' : '#58f49c', 'right', false);
                        uiClickRegions.push({
                            ...rRect,
                            onHover: () => { optionsSelectedRow = idx; },
                            onClick: () => {
                                if (audio.masterSlider > 0.001) { savedMasterBeforeMute = audio.masterSlider; audio.masterSlider = 0.0; }
                                else { audio.masterSlider = Math.max(0.25, savedMasterBeforeMute); }
                                audio._refreshMusicVolumes();
                            }
                        });
                    } else if (row.key === 'fullscreen') {
                        const fs = isFullscreenRef.current;
                        fonts.sm.draw(ctx, fs ? 'ACTIVADO' : 'VENTANA', rRect.x + rRect.w - 14, rRect.y + 9, fs ? '#58f49c' : '#ecf2ff', 'right', false);
                        uiClickRegions.push({
                            ...rRect,
                            onHover: () => { optionsSelectedRow = idx; },
                            onClick: () => (isFullscreenRef.current ? exitFullscreen() : enterFullscreen())
                        });
                    }
                });
            } else if (screenMode === 'howto') {
                // HowToPlayOverlay 1:1 con las 3 tarjetas verticales + panel de Mecánica Única
                ctx.fillStyle = 'rgba(6, 8, 16, 0.82)';
                ctx.fillRect(0, 0, viewW, viewH);
                const pw = Math.min(viewW - 36, 1080);
                const ph = Math.min(viewH - 24, 616);
                const px = Math.floor(viewW * 0.5 - pw * 0.5);
                const py = Math.floor(viewH * 0.5 - ph * 0.5);
                drawForgedPanel(ctx, px, py, pw, ph, 'rgba(22, 26, 42, 0.97)', '#ffc638', 10, true);
                fonts.md.draw(ctx, 'ARSENAL Y MECÁNICA ÚNICA: RESONANCIA TRIÁDICA', viewW * 0.5, py + 16, '#ffe070', 'center', true);

                const gap = 16;
                const cw = Math.floor((pw - 56 - gap * 2) / 3);
                const yCards = py + 58;
                WEAPON_INFO.forEach((info, i) => {
                    const cx = px + 28 + i * (cw + gap);
                    drawForgedPanel(ctx, cx, yCards, cw, 178, 'rgba(16, 20, 34, 0.96)', info.color, 6, false);
                    drawWeaponPixelIcon(i, cx + 24, yCards + 24);
                    fonts.sm.draw(ctx, `[${info.key}] ${info.name}`, cx + 44, yCards + 10, info.bright, 'left', false);
                    fonts.xs.draw(ctx, info.role.toUpperCase(), cx + 44, yCards + 34, info.color, 'left', false);

                    // Auto-ajuste de líneas de descripción igual que en ui_screens.py
                    const words = info.desc.split(' ');
                    const lines = [];
                    let cur = '';
                    for (const wd of words) {
                        const test = cur ? `${cur} ${wd}` : wd;
                        if (fonts.xs.render(test).width <= cw - 24) {
                            cur = test;
                        } else {
                            if (cur) lines.push(cur);
                            cur = wd;
                        }
                    }
                    if (cur) lines.push(cur);
                    lines.slice(0, 5).forEach((ln, li) => {
                        fonts.xs.draw(ctx, ln, cx + 12, yCards + 60 + li * 21, '#ecf2ff', 'left', false);
                    });
                });

                const mY = yCards + 190;
                drawForgedPanel(ctx, px + 28, mY, pw - 56, 204, 'rgba(16, 20, 34, 0.96)', '#58f49c', 6, true);
                fonts.sm.draw(ctx, '★ MECÁNICA ÚNICA: CATACLISMO TRIÁDICO Y PILONES DE PRESIÓN', px + 46, mY + 12, '#58f49c', 'left', false);
                const bullets = [
                    '1. Cada arma aplica su Marca: Ígnea [1], Voltaica [2] y Sísmica [3].',
                    '2. Combinar 2 marcas activa una FUSIÓN (Arco, Pozo Magnético o Fisura).',
                    '3. ¡Reunir las 3 MARCAS detona un CATACLISMO TRIÁDICO!: daño en área,',
                    '   recarga Escudo + Impulso y dispara tu Combo Arcade (hasta x10.0).',
                    '4. PILONES DE PRESIÓN: golpea los pilones iluminados con su arma [1/2/3]',
                    '   para enlazar Haces de Plasma y activar el MODO DIAMANTE.'
                ];
                bullets.forEach((bTxt, bi) => {
                    fonts.xs.draw(ctx, bTxt, px + 46, mY + 42 + bi * 25, '#ecf2ff', 'left', false);
                });

                const ctrlY = mY + 216;
                fonts.xs.draw(ctx, 'WASD: Mover  |  Ratón + Clic Izq: Apuntar y Atacar  |  1/2/3 o Rueda: Arma', viewW * 0.5, ctrlY, '#d4eeff', 'center', false);
                fonts.xs.draw(ctx, 'ESPACIO/SHIFT: Impulso  |  Q/E: Rotar Cámara 3D  |  ESC: Pausa y Sonido', viewW * 0.5, ctrlY + 24, '#d4eeff', 'center', false);

                const closeRect = { x: Math.floor(viewW * 0.5 - 180), y: py + ph - 48, w: 360, h: 38 };
                drawForgedPanel(ctx, closeRect.x, closeRect.y, closeRect.w, closeRect.h, 'rgba(34, 41, 66, 0.96)', '#ffc638', 5, true);
                fonts.sm.draw(ctx, 'ENTENDIDO [ENTER / CLIC]', viewW * 0.5, closeRect.y + 8, '#ffe888', 'center', false);
                uiClickRegions.push({ x: 0, y: 0, w: viewW, h: viewH, onClick: () => { screenMode = prevModeBeforeOverlay; } });
            }

            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);
        return () => {
            cancelAnimationFrame(rafId);
            audio.destroy();
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('contextmenu', onCtx);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
        };
    }, [isLoaded, touchMode]);

    return (
        <div ref={containerRef} className={`gameover-player-shell ${isFullscreen ? 'is-fullscreen' : ''}`}>
            {!isFullscreen && (
                <div className="gameover-player-bar">
                    <div className="gameover-player-status">
                        <span className="status-dot"></span>
                        <span>Piloto Activo: <strong>{playerName}</strong></span>
                        {touchMode && <span className="mobile-badge">MODO MÓVIL TÁCTIL</span>}
                    </div>
                    <div className="gameover-player-actions">
                        <button type="button" className="game-tool-btn" onClick={() => setTouchMode((v) => !v)}>
                            {touchMode ? '💻 Modo PC' : '📱 Modo Táctil'}
                        </button>
                        <button type="button" className="game-tool-btn" onClick={toggleFullscreen}>
                            ⛶ Pantalla Completa
                        </button>
                        <button type="button" className="game-tool-btn exit" onClick={onExitToCatalog}>
                            ✕ Salir del Juego
                        </button>
                    </div>
                </div>
            )}

            <div className="gameover-canvas-stage">
                {isFullscreen && (
                    <button
                        type="button"
                        className="fullscreen-exit-x"
                        onClick={exitFullscreen}
                        title="Salir de pantalla completa"
                        aria-label="Salir de pantalla completa"
                    >
                        ✕
                    </button>
                )}

                {!isLoaded && (
                    <div className="gameover-loading-overlay">
                        <div className="gameover-loader-spinner"></div>
                        <p>Esculpiendo capas Sprite Stacking y forjando arena... {loadingProgress}%</p>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    width={VIRTUAL_W}
                    height={VIRTUAL_H}
                    className="gameover-canvas"
                    style={{ cursor: 'none' }}
                />
            </div>
        </div>
    );
}
