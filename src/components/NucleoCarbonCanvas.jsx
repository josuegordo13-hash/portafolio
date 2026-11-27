import { useEffect, useRef, useState } from 'react';

const VIRTUAL_W = 1280;
const VIRTUAL_H = 720;
const ART_SCALE = 3;
const STACK_SQUASH = 0.72;
const STACK_SPACING = 1.0;
const ANGLE_STEPS = 64;
const ARENA_RADIUS = 295;
const PYLON_RING_RADIUS = 165;
const OCT_APOTHEM = ARENA_RADIUS + 12;
const OCT_VERTEX_R = OCT_APOTHEM / Math.cos(Math.PI / 8);

const ASSET_CAPAS = '/games/nucleo-carbon/assets/capas/';

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

const WEAPONS = [
    { id: 0, key: '1', name: 'Cizalla Térmica', role: 'C. a Cuerpo', mark: 'fire', color: '#ff9824', bright: '#ffe888' },
    { id: 1, key: '2', name: 'Aguja de Riel', role: 'Distancia', mark: 'cyan', color: '#44e4ff', bright: '#d4fcff' },
    { id: 2, key: '3', name: 'Cráter Sísmico', role: 'En Área', mark: 'grav', color: '#ff4c9e', bright: '#ffccea' }
];

const MARK_COLORS = { fire: '#ff9824', cyan: '#44e4ff', grav: '#ff4c9e' };
const MARK_NUM = { fire: '1', cyan: '2', grav: '3' };

function makeOffscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

// Pre-hornea un modelo Sprite Stacking en 64 ángulos con contorno único de 1 art-px
function bakeStackModel(img, count) {
    if (!img || !img.width || img.width % count !== 0) return null;
    const w = img.width / count;
    const h = img.height;

    const srcCanvas = makeOffscreen(img.width, img.height);
    const sctx = srcCanvas.getContext('2d');
    sctx.drawImage(img, 0, 0);
    const srcData = sctx.getImageData(0, 0, img.width, img.height).data;

    let diag = Math.ceil(Math.hypot(w, h)) + 2;
    if (diag % 2 !== w % 2) diag += 1;
    const padW = diag;
    let sqH = Math.max(4, Math.ceil(padW * STACK_SQUASH) + 2);
    if (sqH % 2 !== padW % 2) sqH += 1;

    const liftMax = Math.round((count - 1) * STACK_SPACING);
    const outW = padW + 2;
    const outH = sqH + liftMax + 2;

    const cxSrc = (w - 1) * 0.5;
    const cySrc = (h - 1) * 0.5;
    const cxDst = (padW - 1) * 0.5;
    const cyDst = (sqH - 1) * 0.5;

    const frames = new Array(ANGLE_STEPS);
    const flashFrames = new Array(ANGLE_STEPS);
    const topColors = [];

    for (let z = 0; z < count; z++) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * img.width + (z * w + x)) * 4;
                if (srcData[idx + 3] > 0) {
                    r += srcData[idx];
                    g += srcData[idx + 1];
                    b += srcData[idx + 2];
                    n++;
                }
            }
        }
        topColors.push(n > 0 ? `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})` : '#b4b4c8');
    }

    const buf = new Uint8ClampedArray(outW * outH * 4);
    const fbuf = new Uint8ClampedArray(outW * outH * 4);
    const alphaGrid = new Uint8Array(outW * outH);

    for (let a = 0; a < ANGLE_STEPS; a++) {
        buf.fill(0);
        alphaGrid.fill(0);
        const ang = (a * 2 * Math.PI) / ANGLE_STEPS;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        for (let z = 0; z < count; z++) {
            const lift = Math.round(z * STACK_SPACING);
            const yTop = 1 + (liftMax - lift);
            const zOffX = z * w;

            for (let dy = 0; dy < sqH; dy++) {
                const uy = (dy - cyDst) / STACK_SQUASH;
                const oy = yTop + dy;
                for (let dx = 0; dx < padW; dx++) {
                    const ux = dx - cxDst;
                    const sx = Math.round(ux * cosA + uy * sinA + cxSrc);
                    const sy = Math.round(-ux * sinA + uy * cosA + cySrc);
                    if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
                    const sIdx = (sy * img.width + zOffX + sx) * 4;
                    if (srcData[sIdx + 3] === 0) continue;
                    const dIdx = (oy * outW + (dx + 1)) * 4;
                    buf[dIdx] = srcData[sIdx];
                    buf[dIdx + 1] = srcData[sIdx + 1];
                    buf[dIdx + 2] = srcData[sIdx + 2];
                    buf[dIdx + 3] = 255;
                    alphaGrid[oy * outW + (dx + 1)] = 1;
                }
            }
        }

        fbuf.set(buf);
        for (let y = 0; y < outH; y++) {
            for (let x = 0; x < outW; x++) {
                const p = y * outW + x;
                const dIdx = p * 4;
                if (alphaGrid[p]) {
                    fbuf[dIdx] = 255;
                    fbuf[dIdx + 1] = 244;
                    fbuf[dIdx + 2] = 218;
                    fbuf[dIdx + 3] = 255;
                } else {
                    const hasNeighbor =
                        (x > 0 && alphaGrid[p - 1]) ||
                        (x < outW - 1 && alphaGrid[p + 1]) ||
                        (y > 0 && alphaGrid[p - outW]) ||
                        (y < outH - 1 && alphaGrid[p + outW]);
                    if (hasNeighbor) {
                        buf[dIdx] = 10; buf[dIdx + 1] = 11; buf[dIdx + 2] = 18; buf[dIdx + 3] = 255;
                        fbuf[dIdx] = 10; fbuf[dIdx + 1] = 11; fbuf[dIdx + 2] = 18; fbuf[dIdx + 3] = 255;
                    }
                }
            }
        }

        const cNorm = makeOffscreen(outW, outH);
        cNorm.getContext('2d').putImageData(new ImageData(buf, outW, outH), 0, 0);
        frames[a] = cNorm;

        const cFlash = makeOffscreen(outW, outH);
        cFlash.getContext('2d').putImageData(new ImageData(fbuf, outW, outH), 0, 0);
        flashFrames[a] = cFlash;
    }

    return {
        slices: count,
        outW,
        outH,
        groundAnchorX: (1 + cxDst + 0.5) * ART_SCALE,
        groundAnchorY: (1 + liftMax + cyDst + 0.5) * ART_SCALE,
        frames,
        flashFrames,
        topColors
    };
}

// Pre-genera el mapa pixel-art de la Ciudadela Forja + Caldera de Magma
function buildArenaArt() {
    const TEX_HALF = 172;
    const n = TEX_HALF * 2; // 344x344 texels (cada texel = 2 art-px)
    const c = (n - 1) * 0.5;
    const mapCanvas = makeOffscreen(n, n);
    const mctx = mapCanvas.getContext('2d');
    const img = mctx.createImageData(n, n);
    const d = img.data;

    const setPx = (x, y, r, g, b, a = 255) => {
        if (x < 0 || x >= n || y < 0 || y >= n) return;
        const idx = (y * n + x) * 4;
        d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = a;
    };

    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            const wx = (x - c) * 2;
            const wy = (y - c) * 2;
            const ax = Math.abs(wx);
            const ay = Math.abs(wy);
            const octD = Math.max(ax, ay, (ax + ay) * 0.70710678);
            if (octD > OCT_APOTHEM) continue;

            const rad = Math.hypot(wx, wy);
            const tx = Math.floor(x / 12);
            const ty = Math.floor(y / 12);
            const lx = x % 12;
            const ly = y % 12;
            const h = ((tx * 73856093) ^ (ty * 19349663)) & 255;

            let r = 34, g = 39, b = 60;
            if (h < 64) { r = 28; g = 33; b = 52; }
            else if (h > 235) { r = 46; g = 54; b = 80; }
            else if (h > 185) { r = 40; g = 46; b = 70; }

            if (lx === 0 || ly === 0) { r = 17; g = 20; b = 34; }
            else if (lx === 1 || ly === 1) { r = 54; g = 64; b = 94; }
            else if (lx === 11 || ly === 11) { r = 24; g = 28; b = 44; }

            if (rad >= 88 && rad <= 95) {
                r = 48; g = 56; b = 82;
                if (rad >= 90 && rad <= 93) { r = 86; g = 102; b = 140; }
            }
            if (rad >= PYLON_RING_RADIUS - 5 && rad <= PYLON_RING_RADIUS + 5) {
                r = 46; g = 54; b = 78;
                if (rad >= PYLON_RING_RADIUS - 2 && rad <= PYLON_RING_RADIUS + 2) { r = 72; g = 86; b = 122; }
            }

            if ((ay <= 8 && ax >= 36 && ax <= PYLON_RING_RADIUS + 8) || (ax <= 8 && ay >= 36 && ay <= PYLON_RING_RADIUS + 8)) {
                r = 68; g = 78; b = 108;
                if ((ay <= 3 && ax >= 38 && ax <= PYLON_RING_RADIUS) || (ax <= 3 && ay >= 38 && ay <= PYLON_RING_RADIUS)) {
                    r = 146; g = 64; b = 34;
                } else if ((ay <= 8 && (Math.floor(ax) % 26) < 4) || (ax <= 8 && (Math.floor(ay) % 26) < 4)) {
                    r = 128; g = 146; b = 184;
                }
            }

            if (octD <= 46 && rad <= 48) { r = 92; g = 106; b = 144; }
            if (octD <= 40) { r = 34; g = 38; b = 58; }
            if (rad >= 31 && rad <= 35) { r = 194; g = 134; b = 32; }
            if (rad <= 20) {
                const slit = ((x + y) % 3) === 0;
                if (slit) { r = 255; g = 136; b = 32; }
                else { r = 24; g = 26; b = 40; }
            }
            if (rad <= 8) { r = 255; g = 224; b = 118; }

            if (octD >= OCT_APOTHEM - 16) {
                const stripe = (Math.floor((x + y) / 5) % 2) === 0;
                if (octD >= OCT_APOTHEM - 2) { r = 12; g = 13; b = 22; }
                else if (octD >= OCT_APOTHEM - 5) { r = 76; g = 88; b = 124; }
                else if (stripe) { r = 168; g = 92; b = 26; }
                else { r = 24; g = 27; b = 42; }
            } else if (octD >= OCT_APOTHEM - 18) {
                r = 108; g = 124; b = 166;
            }

            setPx(x, y, r, g, b, 255);
        }
    }

    // 8 rejillas de forja incandescentes
    for (let k = 0; k < 8; k++) {
        const a = ((22.5 + k * 45) * Math.PI) / 180;
        const gx = Math.round(c + (Math.cos(a) * 124) / 2);
        const gy = Math.round(c + (Math.sin(a) * 124) / 2);
        for (let dy = -9; dy <= 9; dy++) {
            for (let dx = -9; dx <= 9; dx++) {
                if (Math.abs(dx) >= 8 || Math.abs(dy) >= 8) {
                    setPx(gx + dx, gy + dy, 56, 65, 92);
                } else if ((gy + dy) % 2 === 0) {
                    setPx(gx + dx, gy + dy, 24, 26, 40);
                } else if (Math.abs(dx) <= 3 && Math.abs(dy) <= 3) {
                    setPx(gx + dx, gy + dy, 248, 134, 34);
                } else {
                    setPx(gx + dx, gy + dy, 172, 58, 22);
                }
            }
        }
    }

    mctx.putImageData(img, 0, 0);

    // Tile de caldera de magma (96x96 texels -> 576x576 px)
    const ln = 96;
    const lavaCanvas = makeOffscreen(ln, ln);
    const lctx = lavaCanvas.getContext('2d');
    const limg = lctx.createImageData(ln, ln);
    const ld = limg.data;
    for (let y = 0; y < ln; y++) {
        const v = (y * 2 * Math.PI) / ln;
        for (let x = 0; x < ln; x++) {
            const u = (x * 2 * Math.PI) / ln;
            const val =
                Math.sin(u * 2 + Math.cos(v * 2)) * 0.42 +
                Math.cos(v * 3 - Math.sin(u * 2)) * 0.34 +
                Math.sin((u + v) * 4) * 0.24;
            const crack = 1.0 - Math.abs(val);
            let r = 16, g = 13, b = 24;
            if (crack > 0.96) { r = 255; g = 214; b = 96; }
            else if (crack > 0.90) { r = 242; g = 128; b = 30; }
            else if (crack > 0.81) { r = 182; g = 58; b = 22; }
            else if (crack > 0.68) { r = 92; g = 26; b = 22; }
            else if (crack > 0.44) { r = 34; g = 20; b = 32; }
            const idx = (y * ln + x) * 4;
            ld[idx] = r; ld[idx + 1] = g; ld[idx + 2] = b; ld[idx + 3] = 255;
        }
    }
    lctx.putImageData(limg, 0, 0);

    return { mapCanvas, lavaCanvas };
}

// Sintetizador Web Audio API (SFX + Música adaptativa 128 BPM)
class WebForgeAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.masterVol = 0.8;
        this.musicVol = 0.65;
        this.sfxVol = 0.85;
        this.muted = false;
        this._step = 0;
        this._nextNoteAt = 0;
        this._combat = false;
        this._hype = false;
    }

    unlock() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            this.ctx = new AC();
            this.masterGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);
            this._nextNoteAt = this.ctx.currentTime + 0.05;
            this.syncGains();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    syncGains() {
        if (!this.ctx) return;
        const m = this.muted ? 0 : this.masterVol * this.masterVol;
        this.masterGain.gain.setTargetAtTime(m, this.ctx.currentTime, 0.02);
        this.musicGain.gain.setTargetAtTime(this.musicVol * this.musicVol * 0.45, this.ctx.currentTime, 0.04);
        this.sfxGain.gain.setTargetAtTime(this.sfxVol * this.sfxVol * 0.65, this.ctx.currentTime, 0.02);
    }

    setIntensity(combat, hype) {
        this._combat = combat;
        this._hype = hype;
    }

    tickMusic() {
        if (!this.ctx || this.ctx.state !== 'running') return;
        const stepDur = 60 / 128 / 4; // Semicorchea a 128 BPM
        const roots = [38, 38, 34, 31, 33, 38, 41, 36];
        const lead = [62, -1, 65, 64, 62, -1, 57, -1, 60, -1, 62, -1, 65, -1, 69, -1];
        const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

        while (this._nextNoteAt < this.ctx.currentTime + 0.14) {
            const t = this._nextNoteAt;
            const s = this._step % 128;
            const bar = Math.floor(s / 16);
            const inBar = s % 16;

            // Bombo base
            if (inBar % 4 === 0) {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sine';
                o.frequency.setValueAtTime(135, t);
                o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
                g.gain.setValueAtTime(0.32, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
                o.connect(g); g.connect(this.musicGain);
                o.start(t); o.stop(t + 0.15);
            }

            // Bajo pulsante
            if (inBar % 2 === 0) {
                const note = roots[bar] + (inBar === 2 || inBar === 10 ? 12 : 0);
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(midiHz(note), t);
                g.gain.setValueAtTime(0.11, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.4);
                o.connect(g); g.connect(this.musicGain);
                o.start(t); o.stop(t + stepDur * 1.5);
            }

            // Capa de combate: caja + arpegio
            if (this._combat && (inBar === 4 || inBar === 12)) {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'triangle';
                o.frequency.setValueAtTime(210, t);
                o.frequency.exponentialRampToValueAtTime(85, t + 0.08);
                g.gain.setValueAtTime(0.18, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
                o.connect(g); g.connect(this.musicGain);
                o.start(t); o.stop(t + 0.1);
            }

            // Capa clímax: melodía
            if (this._hype) {
                const mel = lead[s % lead.length];
                if (mel > 0) {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.type = 'square';
                    o.frequency.setValueAtTime(midiHz(mel), t);
                    g.gain.setValueAtTime(0.07, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.9);
                    o.connect(g); g.connect(this.musicGain);
                    o.start(t); o.stop(t + stepDur * 2.0);
                }
            }

            this._step++;
            this._nextNoteAt += stepDur;
        }
    }

    play(name) {
        if (!this.ctx || this.ctx.state !== 'running') return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const randSemi = Math.pow(2, (Math.random() - 0.5) * 0.14);

        if (name === 'melee') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(480 * randSemi, t);
            osc.frequency.exponentialRampToValueAtTime(95, t + 0.14);
            g.gain.setValueAtTime(0.28, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(g); g.connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.16);
        } else if (name === 'ranged' || name === 'ranged_pierce') {
            osc.type = name === 'ranged_pierce' ? 'square' : 'triangle';
            osc.frequency.setValueAtTime((name === 'ranged_pierce' ? 1750 : 1250) * randSemi, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + (name === 'ranged_pierce' ? 0.22 : 0.11));
            g.gain.setValueAtTime(name === 'ranged_pierce' ? 0.30 : 0.22, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + (name === 'ranged_pierce' ? 0.23 : 0.12));
            osc.connect(g); g.connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.24);
        } else if (name === 'aoe_boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150 * randSemi, t);
            osc.frequency.exponentialRampToValueAtTime(36, t + 0.36);
            g.gain.setValueAtTime(0.42, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
            osc.connect(g); g.connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.39);
        } else if (name === 'cataclysm' || name === 'pylon_sync') {
            [523.25, 659.25, 783.99].forEach((f, idx) => {
                const o2 = this.ctx.createOscillator();
                const g2 = this.ctx.createGain();
                o2.type = 'triangle';
                o2.frequency.setValueAtTime(f * (name === 'cataclysm' ? 1.0 : 1.12), t + idx * 0.045);
                g2.gain.setValueAtTime(0.20, t + idx * 0.045);
                g2.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.045 + 0.28);
                o2.connect(g2); g2.connect(this.sfxGain);
                o2.start(t + idx * 0.045); o2.stop(t + idx * 0.045 + 0.30);
            });
        } else if (name === 'hurt') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(185, t);
            osc.frequency.exponentialRampToValueAtTime(52, t + 0.22);
            g.gain.setValueAtTime(0.35, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.23);
            osc.connect(g); g.connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.24);
        } else {
            osc.type = 'sine';
            const f = name === 'pickup' ? 920 : name === 'dash' ? 380 : 660;
            osc.frequency.setValueAtTime(f * randSemi, t);
            osc.frequency.exponentialRampToValueAtTime(name === 'pickup' ? 1320 : 280, t + 0.09);
            g.gain.setValueAtTime(0.18, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
            osc.connect(g); g.connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.11);
        }
    }

    destroy() {
        if (this.ctx) {
            this.ctx.close().catch(() => {});
            this.ctx = null;
        }
    }
}

export function NucleoCarbonCanvas({
    playerName = 'PILOTO',
    initialCarbonProfile = null,
    onSubmitCarbonScore,
    onExitToCatalog
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [touchMode, setTouchMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 920;
    });

    const callbacksRef = useRef({ onSubmitCarbonScore, onExitToCatalog });
    const playerNameRef = useRef(playerName);
    const profileRef = useRef(initialCarbonProfile);
    useEffect(() => {
        callbacksRef.current = { onSubmitCarbonScore, onExitToCatalog };
        playerNameRef.current = playerName;
        profileRef.current = initialCarbonProfile;
    }, [onSubmitCarbonScore, onExitToCatalog, playerName, initialCarbonProfile]);

    const toggleFullscreen = async () => {
        const el = containerRef.current;
        if (!isFullscreen) {
            setIsFullscreen(true);
            try {
                if (el && !document.fullscreenElement && el.requestFullscreen) {
                    await el.requestFullscreen({ navigationUI: 'hide' });
                }
            } catch {
                // Fullscreen API no disponible
            }
        } else {
            setIsFullscreen(false);
            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            } catch {
                // Ignorar al salir de fullscreen
            }
        }
    };

    useEffect(() => {
        const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const models = {};
        const entries = Object.entries(MODEL_MANIFEST);
        let done = 0;

        entries.forEach(([key, spec]) => {
            const img = new Image();
            img.onload = () => {
                if (!cancelled) {
                    models[key] = bakeStackModel(img, spec.slices);
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

        const canvas = canvasRef.current;
        if (canvas) {
            canvas._carbonModels = models;
            canvas._arenaArt = buildArenaArt();
        }
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const models = canvas._carbonModels || {};
        const arenaArt = canvas._arenaArt;
        const audio = new WebForgeAudio();

        let screenMode = 'title'; // 'title' | 'playing' | 'paused' | 'options' | 'howto' | 'gameover'
        let prevModeBeforeOverlay = 'title';
        let scoreSubmittedThisRun = false;
        let lastBestScore = Number(profileRef.current?.carbonHighScore || 0);
        let isNewRecord = false;
        let timeT = 0;

        const octVertices = Array.from({ length: 8 }, (_, k) => ({
            wx: Math.cos(Math.PI / 8 + k * (Math.PI / 4)) * OCT_VERTEX_R,
            wy: Math.sin(Math.PI / 8 + k * (Math.PI / 4)) * OCT_VERTEX_R
        }));

        const cam = { x: 0, y: 0, focusX: 0, focusY: 0, yaw: 0, targetYaw: 0, trauma: 0, shakeT: 0, ox: 0, oy: 0 };
        const worldToScreen = (wx, wy, wz = 0) => {
            const dx = wx - cam.x;
            const dy = wy - cam.y;
            const c = Math.cos(cam.yaw);
            const s = Math.sin(cam.yaw);
            const rx = dx * c - dy * s;
            const ry = dx * s + dy * c;
            return {
                sx: VIRTUAL_W * 0.5 + rx * ART_SCALE + cam.ox,
                sy: VIRTUAL_H * 0.52 + ry * STACK_SQUASH * ART_SCALE - wz * STACK_SPACING * ART_SCALE + cam.oy,
                ry
            };
        };
        const screenToWorld = (sx, sy) => {
            const rx = (sx - cam.ox - VIRTUAL_W * 0.5) / ART_SCALE;
            const ry = (sy - cam.oy - VIRTUAL_H * 0.52) / (STACK_SQUASH * ART_SCALE);
            const c = Math.cos(-cam.yaw);
            const s = Math.sin(-cam.yaw);
            return { wx: cam.x + rx * c - ry * s, wy: cam.y + rx * s + ry * c };
        };

        const drawModel = (id, sx, sy, turnRad, wz = 0, flash = false, shadow = true) => {
            const m = models[id];
            if (!m) return;
            const norm = ((turnRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const idx = Math.round((norm / (2 * Math.PI)) * ANGLE_STEPS) % ANGLE_STEPS;
            if (shadow) {
                ctx.fillStyle = 'rgba(6, 7, 14, 0.45)';
                ctx.beginPath();
                ctx.ellipse(Math.round(sx + 4), Math.round(sy + 4), 10 * ART_SCALE * 0.7, 7 * ART_SCALE * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            const frame = flash ? m.flashFrames[idx] : m.frames[idx];
            const bx = Math.round(sx - m.groundAnchorX);
            const by = Math.round(sy - wz * STACK_SPACING * ART_SCALE - m.groundAnchorY);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(frame, bx, by, m.outW * ART_SCALE, m.outH * ART_SCALE);
        };

        // Estado de partida
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
            bolts: [],
            rings: [],
            decals: [],
            popups: [],
            score: 0,
            multiplier: 1.0,
            maxCombo: 1.0,
            comboFresh: 0,
            kills: 0,
            cataclysms: 0,
            wave: 1,
            elapsed: 0,
            spawnQueue: [],
            spawnTimer: 0,
            waveClearPause: 0,
            pylonCycle: 9.0,
            beamAcc: 0,
            hitStop: 0,
            bannerTitle: '',
            bannerSub: '',
            bannerTimer: 0,
            nextUid: 1
        };

        const initStatic = () => {
            world.pylons = [
                { idx: 0, wx: PYLON_RING_RADIUS, wy: 0, state: 'neutral', timer: 0, maxTimer: 16 },
                { idx: 1, wx: 0, wy: PYLON_RING_RADIUS, state: 'neutral', timer: 0, maxTimer: 16 },
                { idx: 2, wx: -PYLON_RING_RADIUS, wy: 0, state: 'neutral', timer: 0, maxTimer: 16 },
                { idx: 3, wx: 0, wy: -PYLON_RING_RADIUS, state: 'neutral', timer: 0, maxTimer: 16 }
            ];
            world.pillars = Array.from({ length: 6 }, (_, i) => {
                const a = i * (Math.PI / 3) + Math.PI / 6;
                const r = i % 2 === 0 ? 104 : 218;
                return { wx: Math.cos(a) * r, wy: Math.sin(a) * r, radius: 11.5 };
            });
            world.props = [
                ...Array.from({ length: 4 }, (_, i) => {
                    const a = Math.PI * 0.25 + i * (Math.PI * 0.5);
                    return { kind: 'brazier', wx: Math.cos(a) * 238, wy: Math.sin(a) * 238, radius: 9.5 };
                }),
                ...octVertices.map((v) => ({ kind: 'beacon', wx: v.wx * 0.945, wy: v.wy * 0.945, radius: 0 }))
            ];
        };

        const prepareWave = (waveNum) => {
            world.wave = waveNum;
            world.spawnQueue = [];
            const isBoss = waveNum % 5 === 0;
            let budget = 7 + waveNum * 4 + Math.floor(Math.pow(waveNum, 1.25) * 1.4);
            const eliteChance = waveNum < 3 ? 0 : Math.min(0.42, 0.06 * (waveNum - 2));

            if (isBoss) {
                world.spawnQueue.push({ kind: 'boss', elite: waveNum >= 10 });
                budget = Math.max(6, Math.floor(budget / 2));
            }
            while (budget > 0) {
                const opts = [{ k: 'skitter', c: 1, w: 3.2 }];
                if (waveNum >= 2) opts.push({ k: 'sentinel', c: 2, w: 2.2 });
                if (waveNum >= 3 && budget >= 3) opts.push({ k: 'golem', c: 3, w: 1.5 });
                if (waveNum >= 4 && budget >= 2) opts.push({ k: 'weaver', c: 2, w: 1.6 });
                const totalW = opts.reduce((s, o) => s + o.w, 0);
                let pick = Math.random() * totalW;
                let chosen = opts[0];
                for (const o of opts) {
                    pick -= o.w;
                    if (pick <= 0) { chosen = o; break; }
                }
                world.spawnQueue.push({ kind: chosen.k, elite: Math.random() < eliteChance });
                budget -= chosen.c;
            }
            world.spawnTimer = 0.45;
            world.bannerTimer = 2.6;
            world.bannerTitle = isBoss ? `¡OLEADA ${waveNum} — COLOSO DEL EJE!` : `OLEADA ${waveNum}`;
            world.bannerSub = isBoss
                ? 'Combina las 3 armas para quebrar su blindaje con Cataclismos'
                : 'Alterna [1] Cizalla, [2] Aguja y [3] Cráter para detonar Resonancia';
            audio.play('cataclysm');
        };

        const resetRun = () => {
            scoreSubmittedThisRun = false;
            isNewRecord = false;
            world.player = {
                wx: 0, wy: 0, wz: 0, vx: 0, vy: 0, heading: 0,
                hp: 100, maxHp: 100, shield: 40, maxShield: 40, shieldDelay: 0,
                dashes: 2, maxDashes: 2, dashRecharge: 0, dashTimer: 0, dashDx: 0, dashDy: 0,
                invuln: 0, flash: 0, weapon: 0, cd: [0, 0, 0],
                meleeCombo: 0, meleeReset: 0, rangedCount: 0, overdrive: 0,
                walkPhase: 0, swingTimer: 0, swingMax: 0.19, swingDir: 1, swingVariant: 'cw', attackAngle: 0,
                recoilTimer: 0, recoilMax: 0.14, hammerTimer: 0, alive: true
            };
            world.enemies = []; world.projectiles = []; world.bombs = []; world.crystals = [];
            world.hazards = []; world.debris = []; world.slashes = []; world.cutFlashes = [];
            world.bolts = []; world.rings = []; world.decals = []; world.popups = [];
            world.pylons.forEach((p) => { p.state = 'neutral'; p.timer = 0; });
            world.score = 0; world.multiplier = 1.0; world.maxCombo = 1.0; world.comboFresh = 0;
            world.kills = 0; world.cataclysms = 0; world.elapsed = 0; world.pylonCycle = 9.0; world.hitStop = 0;
            cam.x = 0; cam.y = 0; cam.focusX = 0; cam.focusY = 0; cam.yaw = 0; cam.targetYaw = 0; cam.trauma = 0;
            initStatic();
            prepareWave(1);
        };

        initStatic();
        resetRun();

        const addScore = (base) => {
            const pts = Math.round(base * world.multiplier);
            world.score += pts;
            world.comboFresh = 6.5;
            return pts;
        };
        const boostMult = (d) => {
            world.multiplier = Math.min(10, Math.round((world.multiplier + d) * 100) / 100);
            world.maxCombo = Math.max(world.maxCombo, world.multiplier);
            world.comboFresh = 7.0;
        };
        const spawnSparks = (wx, wy, wz, color, count) => {
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = 30 + Math.random() * 65;
                world.debris.push({
                    wx, wy, wz, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: 30 + Math.random() * 60,
                    color, size: 3, life: 0.35
                });
            }
        };

        const resolveObs = (wx, wy, r) => {
            for (const pil of world.pillars) {
                const dx = wx - pil.wx, dy = wy - pil.wy, d = Math.hypot(dx, dy);
                if (d > 0.001 && d < pil.radius + r) {
                    wx = pil.wx + (dx / d) * (pil.radius + r);
                    wy = pil.wy + (dy / d) * (pil.radius + r);
                }
            }
            for (const py of world.pylons) {
                const dx = wx - py.wx, dy = wy - py.wy, d = Math.hypot(dx, dy);
                if (d > 0.001 && d < 10.5 + r) {
                    wx = py.wx + (dx / d) * (10.5 + r);
                    wy = py.wy + (dy / d) * (10.5 + r);
                }
            }
            for (const pr of world.props) {
                if (pr.radius <= 0) continue;
                const dx = wx - pr.wx, dy = wy - pr.wy, d = Math.hypot(dx, dy);
                if (d > 0.001 && d < pr.radius + r) {
                    wx = pr.wx + (dx / d) * (pr.radius + r);
                    wy = pr.wy + (dy / d) * (pr.radius + r);
                }
            }
            const lim = ARENA_RADIUS - r;
            const d = Math.hypot(wx, wy);
            if (d > lim && d > 0.001) { wx = (wx / d) * lim; wy = (wy / d) * lim; }
            return { wx, wy };
        };

        const pointSegDist = (px, py, x1, y1, x2, y2) => {
            const vx = x2 - x1, vy = y2 - y1, l2 = vx * vx + vy * vy;
            if (l2 <= 1e-5) return Math.hypot(px - x1, py - y1);
            const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / l2));
            return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
        };

        const hitPylon = (py, mark) => {
            if (py.state !== mark) return;
            py.state = 'sync';
            py.timer = 11.5;
            py.maxTimer = 11.5;
            audio.play('pylon_sync');
            cam.trauma = Math.min(1, cam.trauma + 0.25);
            boostMult(0.30);
            const pts = addScore(450);
            world.rings.push({ wx: py.wx, wy: py.wy, wz: 8, maxR: 56, color: '#58f49c', life: 0.36, maxLife: 0.36 });
            world.popups.push({ wx: py.wx, wy: py.wy, wz: 28, text: `¡PILÓN SINCRONIZADO! +${pts}`, color: '#58f49c', life: 0.95, big: true });

            const synced = world.pylons.filter((p) => p.state === 'sync');
            const pending = world.pylons.filter((p) => p.state === 'fire' || p.state === 'cyan' || p.state === 'grav');
            if (synced.length >= 2 && pending.length === 0) {
                world.player.overdrive = Math.max(world.player.overdrive, 8.5);
                const b = addScore(900);
                world.popups.push({ wx: world.player.wx, wy: world.player.wy, wz: 32, text: `¡¡MODO DIAMANTE!! +${b}`, color: '#d6ffe8', life: 1.15, big: true });
            }
        };

        const damageEnemy = (en, dmg, mark, kx = 0, ky = 0) => {
            if (!world.enemies.includes(en)) return;
            en.hp -= dmg;
            en.flash = 0.09;
            const res = en.kind === 'golem' || en.kind === 'boss' ? 0.22 : 1.0;
            en.vx += kx * res;
            en.vy += ky * res;
            world.comboFresh = 6.5;

            if (mark && !en.marks.has(mark)) {
                en.marks.add(mark);
                if (en.marks.size === 2 && !en.fusedDual) {
                    en.fusedDual = true;
                    boostMult(0.15);
                    addScore(120);
                    if (en.marks.has('fire') && en.marks.has('cyan')) {
                        world.popups.push({ wx: en.wx, wy: en.wy, wz: 24, text: 'ARCO VOLTAICO', color: '#8cf5ff', life: 0.7 });
                        const peers = world.enemies.filter((o) => o !== en && Math.hypot(o.wx - en.wx, o.wy - en.wy) <= 135).slice(0, 3);
                        let px = en.wx, py = en.wy;
                        for (const pr of peers) {
                            world.bolts.push({ pts: [{ wx: px, wy: py, wz: 11 }, { wx: pr.wx, wy: pr.wy, wz: 11 }], color: '#78f4ff', life: 0.22 });
                            px = pr.wx; py = pr.wy;
                            damageEnemy(pr, 24, null);
                        }
                    } else if (en.marks.has('cyan') && en.marks.has('grav')) {
                        world.popups.push({ wx: en.wx, wy: en.wy, wz: 24, text: 'POZO MAGNÉTICO', color: '#e196ff', life: 0.7 });
                        world.rings.push({ wx: en.wx, wy: en.wy, wz: 3, maxR: 82, color: '#a880ff', life: 0.30, maxLife: 0.30 });
                        for (const o of world.enemies) {
                            if (o === en) continue;
                            const dx = en.wx - o.wx, dy = en.wy - o.wy, d = Math.hypot(dx, dy);
                            if (d > 4 && d <= 92) {
                                const pull = o.kind === 'boss' ? 40 : 175;
                                o.vx += (dx / d) * pull; o.vy += (dy / d) * pull;
                            }
                        }
                    } else {
                        world.popups.push({ wx: en.wx, wy: en.wy, wz: 24, text: 'FISURA DE MAGMA', color: '#ffb048', life: 0.7 });
                        world.hazards.push({ wx: en.wx, wy: en.wy, radius: 44, kind: 'magma', life: 3.6, acc: 0 });
                    }
                } else if (en.marks.size >= 3) {
                    en.marks.clear();
                    en.fusedDual = false;
                    world.cataclysms++;
                    audio.play('cataclysm');
                    cam.trauma = Math.min(1, cam.trauma + 0.6);
                    world.hitStop = 0.065;
                    const p = world.player;
                    p.shield = Math.min(p.maxShield, p.shield + 10);
                    p.hp = Math.min(p.maxHp, p.hp + 4);
                    if (p.dashes < p.maxDashes) p.dashes++;
                    boostMult(0.45);
                    const pts = addScore(350);
                    world.rings.push({ wx: en.wx, wy: en.wy, wz: 2, maxR: 84, color: '#ffe888', life: 0.42, maxLife: 0.42 });
                    world.bolts.push({ pts: [{ wx: en.wx, wy: en.wy, wz: 0 }, { wx: en.wx, wy: en.wy, wz: 64 }], color: '#fff8c4', life: 0.32 });
                    world.popups.push({ wx: en.wx, wy: en.wy, wz: 30, text: `¡CATACLISMO TRIÁDICO! +${pts}`, color: '#fff08c', life: 1.05, big: true });
                    spawnSparks(en.wx, en.wy, 12, '#ffe888', 14);
                    world.crystals.push({ wx: en.wx + 12, wy: en.wy, wz: 4, vz: 55, life: 12, phase: 0 });
                    en.hp -= 75;
                    for (const o of [...world.enemies]) {
                        if (o !== en && Math.hypot(o.wx - en.wx, o.wy - en.wy) <= 78) {
                            o.vz = Math.max(o.vz, o.kind === 'boss' ? 30 : 75);
                            damageEnemy(o, 44, null);
                        }
                    }
                }
            }

            if (world.enemies.includes(en) && en.hp <= 0) {
                world.enemies = world.enemies.filter((x) => x !== en);
                world.kills++;
                addScore(en.scoreValue);
                const m = models[`${en.kind}_0`];
                const cols = m ? m.topColors : ['#ff9824'];
                const pieces = en.kind === 'boss' ? 20 : en.kind === 'golem' ? 12 : 8;
                for (let i = 0; i < pieces; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const sp = 35 + Math.random() * 80;
                    world.debris.push({
                        wx: en.wx, wy: en.wy, wz: en.wz + 6,
                        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: 45 + Math.random() * 80,
                        color: cols[i % cols.length], size: en.kind === 'boss' ? 4 : 3, life: 0.7
                    });
                }
                if (en.kind === 'weaver') {
                    world.hazards.push({ wx: en.wx, wy: en.wy, radius: 34, kind: 'corrupt', life: 1.8, acc: 0 });
                }
                if (en.elite || en.kind === 'boss' || Math.random() < 0.25) {
                    world.crystals.push({ wx: en.wx, wy: en.wy, wz: 3, vz: 50, life: 12, phase: 0 });
                }
                if (en.kind === 'boss') {
                    cam.trauma = 0.85;
                    world.hitStop = 0.09;
                    world.popups.push({ wx: en.wx, wy: en.wy, wz: 34, text: '¡COLOSO DESTRUIDO!', color: '#ffe888', life: 1.25, big: true });
                }
            }
        };

        const hurtPlayer = (dmg, sx, sy) => {
            const p = world.player;
            if (!p.alive || p.invuln > 0) return;
            p.invuln = 0.55;
            p.flash = 0.22;
            p.shieldDelay = 3.8;
            let hullHit = false;
            if (p.shield >= dmg) p.shield -= dmg;
            else { p.hp = Math.max(0, p.hp - (dmg - p.shield)); p.shield = 0; hullHit = true; }
            const dx = p.wx - sx, dy = p.wy - sy, d = Math.max(1, Math.hypot(dx, dy));
            p.vx += (dx / d) * 95; p.vy += (dy / d) * 95;
            audio.play('hurt');
            cam.trauma = Math.min(1, cam.trauma + 0.45);
            if (hullHit && world.multiplier > 1) world.multiplier = Math.max(1, Math.round((1 + (world.multiplier - 1) * 0.55) * 100) / 100);

            if (p.hp <= 0) {
                p.alive = false;
                spawnSparks(p.wx, p.wy, 10, '#ff9824', 24);
                screenMode = 'gameover';
                if (world.score > lastBestScore && world.score > 0) {
                    lastBestScore = world.score;
                    isNewRecord = true;
                }
                if (!scoreSubmittedThisRun) {
                    scoreSubmittedThisRun = true;
                    callbacksRef.current.onSubmitCarbonScore?.(world.score, world.wave);
                }
            }
        };

        const tryAttack = (aimWx, aimWy) => {
            const p = world.player;
            if (!p.alive) return;
            const w = p.weapon;
            if (p.cd[w] > 0) return;
            const cdMult = p.overdrive > 0 ? 0.65 : 1.0;
            const dx = aimWx - p.wx, dy = aimWy - p.wy;
            const dist = Math.hypot(dx, dy);
            const ang = dist > 1e-3 ? Math.atan2(dy, dx) : p.heading + Math.PI * 0.5;
            p.heading = ang - Math.PI * 0.5;

            if (w === 0) {
                const cIdx = p.meleeCombo;
                const fin = cIdx === 2;
                p.cd[0] = (fin ? 0.31 : 0.24) * cdMult;
                p.meleeCombo = (cIdx + 1) % 3;
                p.meleeReset = 1.15;
                const dur = fin ? 0.21 : 0.18;
                p.swingTimer = dur; p.swingMax = dur;
                p.swingDir = cIdx % 2 === 0 ? 1 : -1;
                p.swingVariant = fin ? 'finisher' : cIdx === 0 ? 'cw' : 'ccw';
                p.attackAngle = ang;
                p.vx += Math.cos(ang) * (fin ? 95 : 60);
                p.vy += Math.sin(ang) * (fin ? 95 : 60);
                audio.play('melee');

                const reach = fin ? 64 : 54;
                const span = ((fin ? 195 : 148) * Math.PI) / 180;
                const dmg = (fin ? 46 : 32) * (p.overdrive > 0 ? 1.25 : 1);
                world.slashes.push({ wx: p.wx, wy: p.wy, angle: ang, span, reach, variant: p.swingVariant, life: dur, maxLife: dur });

                world.projectiles = world.projectiles.filter((pr) => {
                    if (!pr.friendly) {
                        const pd = Math.hypot(pr.wx - p.wx, pr.wy - p.wy);
                        const pa = Math.atan2(pr.wy - p.wy, pr.wx - p.wx);
                        const diff = Math.abs(((pa - ang + Math.PI) % (Math.PI * 2)) - Math.PI);
                        if (pd <= reach + 6 && diff <= span * 0.54) {
                            addScore(50);
                            spawnSparks(pr.wx, pr.wy, 8, '#ffe080', 5);
                            return false;
                        }
                    }
                    return true;
                });

                let hits = 0;
                for (const en of [...world.enemies]) {
                    const ed = Math.hypot(en.wx - p.wx, en.wy - p.wy);
                    if (ed <= reach + en.radius) {
                        const ea = Math.atan2(en.wy - p.wy, en.wx - p.wx);
                        const diff = Math.abs(((ea - ang + Math.PI) % (Math.PI * 2)) - Math.PI);
                        if (diff <= span * 0.54 || ed < en.radius + 11) {
                            const kb = fin ? 140 : 98;
                            world.cutFlashes.push({ wx: en.wx, wy: en.wy, wz: en.wz + 9, angle: ang + (cIdx % 2 === 0 ? 0.55 : -0.55), length: fin ? 24 : 18, life: 0.16, maxLife: 0.16 });
                            damageEnemy(en, dmg, 'fire', Math.cos(ang) * kb, Math.sin(ang) * kb);
                            hits++;
                        }
                    }
                }
                for (const py of world.pylons) {
                    if (Math.hypot(py.wx - p.wx, py.wy - p.wy) <= reach + 15) hitPylon(py, 'fire');
                }
                if (hits > 0) {
                    cam.trauma = Math.min(1, cam.trauma + (fin ? 0.25 : 0.14));
                    if (fin) world.hitStop = 0.04;
                }
            } else if (w === 1) {
                const pierce = p.rangedCount === 3;
                p.rangedCount = (p.rangedCount + 1) % 4;
                p.cd[1] = (pierce ? 0.22 : 0.15) * cdMult;
                p.recoilTimer = pierce ? 0.15 : 0.11;
                p.recoilMax = p.recoilTimer;
                const ux = Math.cos(ang), uy = Math.sin(ang);
                const rx = Math.sin(ang), ry = -Math.cos(ang);
                const mx = p.wx + rx * 7.5 + ux * 21;
                const my = p.wy + ry * 7.5 + uy * 21;
                if (pierce) {
                    audio.play('ranged_pierce');
                    const ex = mx + ux * 310, ey = my + uy * 310;
                    world.bolts.push({ pts: [{ wx: mx, wy: my, wz: 10.5 }, { wx: ex, wy: ey, wz: 10.5 }], color: '#44e4ff', life: 0.24 });
                    for (const sd of [30, 95, 160, 225, 290]) {
                        world.rings.push({ wx: mx + ux * sd, wy: my + uy * sd, wz: 10, maxR: 18, color: '#8cf5ff', life: 0.20, maxLife: 0.20 });
                    }
                    const dmg = 42 * (p.overdrive > 0 ? 1.25 : 1);
                    for (const en of [...world.enemies]) {
                        if (pointSegDist(en.wx, en.wy, mx, my, ex, ey) <= en.radius + 6.5) {
                            damageEnemy(en, dmg, 'cyan', ux * 55, uy * 55);
                        }
                    }
                    for (const py of world.pylons) {
                        if (pointSegDist(py.wx, py.wy, mx, my, ex, ey) <= 16) hitPylon(py, 'cyan');
                    }
                } else {
                    audio.play('ranged');
                    world.projectiles.push({
                        wx: mx, wy: my, wz: 10.5, vx: ux * 370, vy: uy * 370,
                        friendly: true, dmg: 22 * (p.overdrive > 0 ? 1.25 : 1), mark: 'cyan',
                        color: '#44e4ff', radius: 4.5, life: 0.95
                    });
                }
            } else {
                p.cd[2] = 0.66 * cdMult;
                p.hammerTimer = 0.26;
                const clampD = Math.min(175, dist);
                const ux = Math.cos(ang), uy = Math.sin(ang);
                const rx = Math.sin(ang), ry = -Math.cos(ang);
                const hx = p.wx + rx * 7.5 + ux * 16;
                const hy = p.wy + ry * 7.5 + uy * 16;
                let tx = p.wx + ux * clampD, ty = p.wy + uy * clampD;
                const td = Math.hypot(tx, ty);
                if (td > ARENA_RADIUS - 14) { tx = (tx / td) * (ARENA_RADIUS - 14); ty = (ty / td) * (ARENA_RADIUS - 14); }
                audio.play('dash');
                world.bombs.push({ sx: hx, sy: hy, tx, ty, elapsed: 0, dur: 0.34 });
            }
        };

        const detonateBomb = (bx, by) => {
            const blastR = 64;
            const dmg = 40 * (world.player.overdrive > 0 ? 1.25 : 1);
            audio.play('aoe_boom');
            cam.trauma = Math.min(1, cam.trauma + 0.4);
            world.hitStop = 0.036;
            world.decals.push({ wx: bx, wy: by, life: 3.0, maxLife: 3.0 });
            world.bolts.push({ pts: [{ wx: bx, wy: by, wz: 0 }, { wx: bx, wy: by, wz: 42 }], color: '#ff60b0', life: 0.20 });
            world.rings.push({ wx: bx, wy: by, wz: 2, maxR: blastR, color: '#ff4c9e', life: 0.34, maxLife: 0.34 });
            world.rings.push({ wx: bx, wy: by, wz: 8, maxR: blastR * 0.72, color: '#ffccea', life: 0.24, maxLife: 0.24 });
            spawnSparks(bx, by, 7, '#ff4c9e', 14);
            for (const en of [...world.enemies]) {
                const dx = en.wx - bx, dy = en.wy - by, d = Math.hypot(dx, dy);
                if (d <= blastR + en.radius) {
                    en.vz = Math.max(en.vz, en.kind === 'boss' ? 40 : 90);
                    en.slow = Math.max(en.slow, 2.3);
                    damageEnemy(en, dmg, 'grav', (dx / Math.max(1, d)) * 85, (dy / Math.max(1, d)) * 85);
                }
            }
            for (const py of world.pylons) {
                if (Math.hypot(py.wx - bx, py.wy - by) <= blastR + 14) hitPylon(py, 'grav');
            }
        };

        const tryDash = (mx, my, aimWx, aimWy) => {
            const p = world.player;
            if (!p.alive || p.dashes <= 0 || p.dashTimer > 0) return;
            let dx, dy;
            if (Math.abs(mx) > 0.05 || Math.abs(my) > 0.05) {
                const c = Math.cos(-cam.yaw), s = Math.sin(-cam.yaw);
                dx = mx * c - my * s; dy = mx * s + my * c;
            } else {
                dx = aimWx - p.wx; dy = aimWy - p.wy;
            }
            const l = Math.hypot(dx, dy) || 1;
            p.dashes--; p.dashTimer = 0.17; p.invuln = Math.max(p.invuln, 0.24);
            p.dashDx = dx / l; p.dashDy = dy / l;
            audio.play('dash');
            world.rings.push({ wx: p.wx, wy: p.wy, wz: 1, maxR: 22, color: '#58f49c', life: 0.22, maxLife: 0.22 });
        };

        // Entrada PC y Móvil
        const keys = {};
        const mouse = { x: VIRTUAL_W * 0.65, y: VIRTUAL_H * 0.5, down: false };
        const touchJoy = { active: false, id: null, sx: 0, sy: 0, dx: 0, dy: 0 };
        const touchAim = { active: false, id: null, sx: 0, sy: 0, dx: 0, dy: 0 };
        let uiClickRegions = [];

        const toVirtualPos = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: ((clientX - rect.left) / Math.max(1, rect.width)) * VIRTUAL_W,
                y: ((clientY - rect.top) / Math.max(1, rect.height)) * VIRTUAL_H
            };
        };

        const onKeyDown = (e) => {
            audio.unlock();
            const k = e.key.toLowerCase();
            keys[k] = true;
            if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) {
                e.preventDefault();
            }
            if (k === 'm') { audio.muted = !audio.muted; audio.syncGains(); }
            if (screenMode === 'playing') {
                if (k === 'escape' || k === 'p' || k === 'tab') { screenMode = 'paused'; return; }
                if (k === '1') world.player.weapon = 0;
                if (k === '2') world.player.weapon = 1;
                if (k === '3') world.player.weapon = 2;
                if (k === 'r') cam.targetYaw = Math.round(cam.targetYaw / (Math.PI * 2)) * Math.PI * 2;
                if (k === ' ' || k === 'shift') {
                    const mx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
                    const my = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
                    const aw = screenToWorld(mouse.x, mouse.y);
                    tryDash(mx, my, aw.wx, aw.wy);
                }
            } else if (screenMode === 'paused' && (k === 'escape' || k === 'p')) {
                screenMode = 'playing';
            } else if ((screenMode === 'options' || screenMode === 'howto') && k === 'escape') {
                screenMode = prevModeBeforeOverlay;
            } else if (screenMode === 'title' && k === 'enter') {
                resetRun();
                screenMode = 'playing';
            }
        };
        const onKeyUp = (e) => { keys[e.key.toLowerCase()] = false; };
        const onMouseMove = (e) => {
            const p = toVirtualPos(e.clientX, e.clientY);
            mouse.x = p.x; mouse.y = p.y;
        };
        const onMouseDown = (e) => {
            audio.unlock();
            const p = toVirtualPos(e.clientX, e.clientY);
            mouse.x = p.x; mouse.y = p.y;
            if (screenMode === 'playing') {
                if (e.button === 0) {
                    mouse.down = true;
                    const aw = screenToWorld(p.x, p.y);
                    tryAttack(aw.wx, aw.wy);
                } else if (e.button === 2) {
                    world.player.weapon = (world.player.weapon + 1) % 3;
                }
            } else if (e.button === 0) {
                for (const reg of uiClickRegions) {
                    if (p.x >= reg.x && p.x <= reg.x + reg.w && p.y >= reg.y && p.y <= reg.y + reg.h) {
                        audio.play('ui');
                        reg.onClick(p.x, p.y);
                        break;
                    }
                }
            }
        };
        const onMouseUp = (e) => { if (e.button === 0) mouse.down = false; };
        const onWheel = (e) => {
            if (screenMode === 'playing') {
                world.player.weapon = (world.player.weapon + (e.deltaY > 0 ? 1 : 2)) % 3;
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
                            audio.play('ui');
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
                if (p.x < VIRTUAL_W * 0.45 && !touchJoy.active) {
                    touchJoy.active = true; touchJoy.id = t.identifier; touchJoy.sx = p.x; touchJoy.sy = p.y; touchJoy.dx = 0; touchJoy.dy = 0;
                } else if (!touchAim.active) {
                    touchAim.active = true; touchAim.id = t.identifier; touchAim.sx = p.x; touchAim.sy = p.y; touchAim.dx = 0; touchAim.dy = 0;
                }
            }
        };
        const onTouchMove = (e) => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                const p = toVirtualPos(t.clientX, t.clientY);
                if (touchJoy.active && t.identifier === touchJoy.id) {
                    const vx = p.x - touchJoy.sx, vy = p.y - touchJoy.sy;
                    const l = Math.min(60, Math.hypot(vx, vy)), a = Math.atan2(vy, vx);
                    touchJoy.dx = (Math.cos(a) * l) / 60; touchJoy.dy = (Math.sin(a) * l) / 60;
                }
                if (touchAim.active && t.identifier === touchAim.id) {
                    const vx = p.x - touchAim.sx, vy = p.y - touchAim.sy;
                    const l = Math.hypot(vx, vy);
                    if (l > 8) { touchAim.dx = vx / l; touchAim.dy = vy / l; }
                }
            }
        };
        const onTouchEnd = (e) => {
            for (const t of e.changedTouches) {
                if (touchJoy.active && t.identifier === touchJoy.id) { touchJoy.active = false; touchJoy.dx = 0; touchJoy.dy = 0; }
                if (touchAim.active && t.identifier === touchAim.id) { touchAim.active = false; }
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

        // Bucle principal a 60 FPS
        let lastTs = performance.now();
        let rafId = 0;

        const drawBevelBox = (x, y, w, h, bg = 'rgba(18, 22, 36, 0.92)', border = '#4a5880') => {
            ctx.fillStyle = bg;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#080a12';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, w, h);
            ctx.strokeStyle = border;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
        };

        const drawText = (txt, x, y, size = 18, color = '#ecf2ff', align = 'left', bold = true) => {
            ctx.font = `${bold ? 'bold ' : ''}${size}px Consolas, monospace`;
            ctx.textAlign = align;
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#070910';
            ctx.fillText(txt, x + 2, y + 2);
            ctx.fillStyle = color;
            ctx.fillText(txt, x, y);
        };

        const drawBackdropAndArena = () => {
            const tile = arenaArt.lavaCanvas;
            const tw = tile.width * 6;
            const th = tile.height * 6;
            const ox = Math.floor((-cam.x * 0.45 * ART_SCALE + timeT * 16) % tw);
            const oy = Math.floor((-cam.y * 0.45 * ART_SCALE * STACK_SQUASH + timeT * 10) % th);
            ctx.imageSmoothingEnabled = false;
            for (let tx = ox - tw; tx < VIRTUAL_W + tw; tx += tw) {
                for (let ty = oy - th; ty < VIRTUAL_H + th; ty += th) {
                    ctx.drawImage(tile, tx, ty, tw, th);
                }
            }

            // Sombra flotante sobre magma
            const shP = worldToScreen(0, 0, -24);
            ctx.fillStyle = 'rgba(6, 5, 12, 0.65)';
            ctx.beginPath();
            ctx.ellipse(shP.sx, shP.sy, (OCT_APOTHEM + 24) * ART_SCALE, (OCT_APOTHEM + 24) * ART_SCALE * STACK_SQUASH, 0, 0, Math.PI * 2);
            ctx.fill();

            // Acantilado 3D bajo caras frontales
            const topPts = octVertices.map((v) => worldToScreen(v.wx, v.wy, 0));
            const botPts = octVertices.map((v) => worldToScreen(v.wx, v.wy, -20));
            for (let i = 0; i < 8; i++) {
                const j = (i + 1) % 8;
                if (topPts[j].sx < topPts[i].sx) {
                    ctx.fillStyle = '#242942';
                    ctx.beginPath();
                    ctx.moveTo(topPts[i].sx, topPts[i].sy);
                    ctx.lineTo(topPts[j].sx, topPts[j].sy);
                    ctx.lineTo(botPts[j].sx, botPts[j].sy);
                    ctx.lineTo(botPts[i].sx, botPts[i].sy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#d8541c';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo((topPts[i].sx + topPts[j].sx) * 0.5, (topPts[i].sy + topPts[j].sy) * 0.5 + 3);
                    ctx.lineTo((botPts[i].sx + botPts[j].sx) * 0.5, (botPts[i].sy + botPts[j].sy) * 0.5 - 2);
                    ctx.stroke();
                }
            }

            // Plataforma rotada pixel-art
            const center = worldToScreen(0, 0, 0);
            ctx.save();
            ctx.translate(Math.round(center.sx), Math.round(center.sy));
            ctx.scale(1, STACK_SQUASH);
            ctx.rotate(cam.yaw);
            ctx.imageSmoothingEnabled = false;
            const mapW = arenaArt.mapCanvas.width * 2 * ART_SCALE;
            ctx.drawImage(arenaArt.mapCanvas, -mapW * 0.5, -mapW * 0.5, mapW, mapW);
            ctx.restore();
        };

        const step = (now) => {
            const realDt = Math.min(0.05, (now - lastTs) / 1000);
            lastTs = now;
            timeT += realDt;

            audio.setIntensity(
                screenMode === 'playing',
                screenMode === 'playing' && (world.enemies.some((e) => e.kind === 'boss') || world.player.overdrive > 0 || world.multiplier >= 3)
            );
            audio.tickMusic();

            if (screenMode === 'title') {
                cam.yaw = timeT * 0.22;
                const cOffX = -82, cOffY = 58;
                cam.x = cOffX * Math.cos(-cam.yaw) - cOffY * Math.sin(-cam.yaw);
                cam.y = cOffX * Math.sin(-cam.yaw) + cOffY * Math.cos(-cam.yaw);
            } else if (screenMode === 'playing') {
                const rot = (keys['e'] ? 1 : 0) - (keys['q'] ? 1 : 0);
                if (rot !== 0) cam.targetYaw += rot * 1.95 * realDt;

                const dt = world.hitStop > 0 ? realDt * 0.06 : realDt;
                if (world.hitStop > 0) world.hitStop = Math.max(0, world.hitStop - realDt);
                const p = world.player;
                if (p.alive) world.elapsed += dt;
                if (world.bannerTimer > 0) world.bannerTimer = Math.max(0, world.bannerTimer - realDt);

                let aw = screenToWorld(mouse.x, mouse.y);
                if (touchMode && touchAim.active) {
                    aw = { wx: p.wx + touchAim.dx * 120, wy: p.wy + touchAim.dy * 120 };
                    tryAttack(aw.wx, aw.wy);
                }

                if (p.alive) {
                    for (let i = 0; i < 3; i++) if (p.cd[i] > 0) p.cd[i] = Math.max(0, p.cd[i] - dt);
                    if (p.meleeReset > 0) { p.meleeReset -= dt; if (p.meleeReset <= 0) p.meleeCombo = 0; }
                    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
                    if (p.flash > 0) p.flash = Math.max(0, p.flash - dt);
                    if (p.swingTimer > 0) p.swingTimer = Math.max(0, p.swingTimer - dt);
                    if (p.recoilTimer > 0) p.recoilTimer = Math.max(0, p.recoilTimer - dt);
                    if (p.hammerTimer > 0) p.hammerTimer = Math.max(0, p.hammerTimer - dt);
                    if (p.overdrive > 0) p.overdrive = Math.max(0, p.overdrive - dt);

                    if (p.shield < p.maxShield) {
                        if (p.shieldDelay > 0) p.shieldDelay -= dt;
                        else p.shield = Math.min(p.maxShield, p.shield + 9 * dt);
                    }
                    if (p.dashes < p.maxDashes) {
                        p.dashRecharge += dt;
                        if (p.dashRecharge >= 2.35) { p.dashRecharge -= 2.35; p.dashes++; }
                    }
                    if (world.multiplier > 1) {
                        if (world.comboFresh > 0) world.comboFresh -= dt;
                        else world.multiplier = Math.max(1, Math.round((world.multiplier - 0.35 * dt) * 100) / 100);
                    }

                    const mx = touchJoy.active ? touchJoy.dx : (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
                    const my = touchJoy.active ? touchJoy.dy : (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
                    if (p.dashTimer > 0) {
                        p.dashTimer -= dt;
                        p.wx += p.dashDx * 340 * dt; p.wy += p.dashDy * 340 * dt;
                    } else {
                        const ln = Math.hypot(mx, my);
                        let tvx = 0, tvy = 0;
                        if (ln > 0.05) {
                            const nx = mx / Math.max(1, ln), ny = my / Math.max(1, ln);
                            const c = Math.cos(-cam.yaw), s = Math.sin(-cam.yaw);
                            const spd = 120 * (p.overdrive > 0 ? 1.24 : 1);
                            tvx = (nx * c - ny * s) * spd;
                            tvy = (nx * s + ny * c) * spd;
                            p.walkPhase += dt * 11.5;
                        }
                        const at = 1 - Math.exp(-15 * dt);
                        p.vx += (tvx - p.vx) * at; p.vy += (tvy - p.vy) * at;
                        p.wx += p.vx * dt; p.wy += p.vy * dt;
                    }
                    const resP = resolveObs(p.wx, p.wy, 9.5);
                    p.wx = resP.wx; p.wy = resP.wy;
                    if (!touchMode || touchAim.active) {
                        p.heading = Math.atan2(aw.wy - p.wy, aw.wx - p.wx) - Math.PI * 0.5;
                    }
                    if (mouse.down && !touchMode) tryAttack(aw.wx, aw.wy);

                    // Director de oleadas
                    const maxAlive = Math.min(24, 8 + world.wave * 2);
                    if (world.spawnQueue.length > 0 && world.enemies.length < maxAlive) {
                        world.spawnTimer -= dt;
                        if (world.spawnTimer <= 0) {
                            const nxt = world.spawnQueue.shift();
                            const ang = Math.random() * Math.PI * 2;
                            const dist = ARENA_RADIUS - 22;
                            const scale = 1 + 0.12 * (world.wave - 1) + 0.22 * (world.elapsed / 60);
                            const specs = {
                                skitter: [34, 74, 8.5, 90],
                                sentinel: [48, 56, 9.5, 145],
                                golem: [118, 44, 13, 240],
                                weaver: [58, 60, 9.5, 175],
                                boss: [560, 40, 17.5, 1600]
                            }[nxt.kind];
                            const hp = specs[0] * scale * (nxt.elite ? 1.65 : 1);
                            world.enemies.push({
                                uid: world.nextUid++, kind: nxt.kind, elite: nxt.elite,
                                wx: Math.cos(ang) * dist, wy: Math.sin(ang) * dist, wz: 0, vz: 0, vx: 0, vy: 0,
                                heading: 0, hp, maxHp: hp, speed: specs[1] * Math.min(1.55, 1 + (scale - 1) * 0.28) * (nxt.elite ? 1.15 : 1),
                                radius: specs[2], scoreValue: specs[3] * (nxt.elite ? 2 : 1),
                                marks: new Set(), fusedDual: false, slow: 0, haste: 0, flash: 0,
                                aiState: 'chase', aiTimer: 0.9, cdx: 0, cdy: 0, anim: 0
                            });
                            world.spawnTimer = Math.max(0.32, 1.15 - world.wave * 0.065);
                        }
                    } else if (world.spawnQueue.length === 0 && world.enemies.length === 0) {
                        world.waveClearPause += dt;
                        if (world.waveClearPause >= 1.7) {
                            world.waveClearPause = 0;
                            const bonus = addScore(300 * world.wave);
                            p.shield = Math.min(p.maxShield, p.shield + 14);
                            world.popups.push({ wx: p.wx, wy: p.wy, wz: 28, text: `¡OLEADA SUPERADA! +${bonus}`, color: '#ffe888', life: 1.0, big: true });
                            prepareWave(world.wave + 1);
                        }
                    }

                    // Pilones
                    for (const py of world.pylons) {
                        if (py.state === 'fire' || py.state === 'cyan' || py.state === 'grav') {
                            py.timer -= dt;
                            if (py.timer <= 0) {
                                py.state = 'neutral';
                                world.hazards.push({ wx: py.wx, wy: py.wy, radius: 52, kind: 'corrupt', life: 3.0, acc: 0 });
                                world.popups.push({ wx: py.wx, wy: py.wy, wz: 28, text: '¡PILÓN SOBRECARGADO!', color: '#ff5668', life: 0.9 });
                            }
                        } else if (py.state === 'sync') {
                            py.timer -= dt;
                            if (py.timer <= 0) py.state = 'neutral';
                        }
                    }
                    const synced = world.pylons.filter((q) => q.state === 'sync');
                    if (synced.length >= 2) {
                        world.beamAcc += dt;
                        if (world.beamAcc >= 0.16) {
                            world.beamAcc = 0;
                            for (let i = 0; i < synced.length; i++) {
                                for (let j = i + 1; j < synced.length; j++) {
                                    for (const en of [...world.enemies]) {
                                        if (pointSegDist(en.wx, en.wy, synced[i].wx, synced[i].wy, synced[j].wx, synced[j].wy) <= en.radius + 7.5) {
                                            damageEnemy(en, 11, null);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (world.pylons.every((q) => q.state === 'neutral')) {
                        world.pylonCycle -= dt;
                        if (world.pylonCycle <= 0) {
                            world.pylonCycle = Math.max(11, 18 - world.wave * 0.5);
                            const pool = ['fire', 'cyan', 'grav'];
                            const chosen = [...world.pylons].sort(() => Math.random() - 0.5).slice(0, world.wave < 3 ? 2 : 3);
                            chosen.forEach((py, idx) => {
                                py.state = pool[idx % 3];
                                py.maxTimer = Math.max(12.5, 17.5 - world.wave * 0.25);
                                py.timer = py.maxTimer;
                            });
                        }
                    }
                }

                // Bombas y proyectiles
                world.bombs = world.bombs.filter((b) => {
                    b.elapsed += dt;
                    if (b.elapsed >= b.dur) { detonateBomb(b.tx, b.ty); return false; }
                    return true;
                });
                world.projectiles = world.projectiles.filter((pr) => {
                    pr.life -= dt;
                    if (pr.life <= 0) return false;
                    pr.wx += pr.vx * dt; pr.wy += pr.vy * dt;
                    if (Math.hypot(pr.wx, pr.wy) >= ARENA_RADIUS) return false;
                    for (const pil of world.pillars) {
                        if (Math.hypot(pr.wx - pil.wx, pr.wy - pil.wy) <= pil.radius + 2) return false;
                    }
                    if (pr.friendly) {
                        for (const py of world.pylons) {
                            if ((py.state === 'fire' || py.state === 'cyan' || py.state === 'grav') && Math.hypot(pr.wx - py.wx, pr.wy - py.wy) <= 13.5) {
                                hitPylon(py, pr.mark);
                                return false;
                            }
                        }
                        for (const en of [...world.enemies]) {
                            if (Math.hypot(pr.wx - en.wx, pr.wy - en.wy) <= en.radius + pr.radius) {
                                damageEnemy(en, pr.dmg, pr.mark, pr.vx * 0.14, pr.vy * 0.14);
                                spawnSparks(pr.wx, pr.wy, pr.wz, pr.color, 4);
                                return false;
                            }
                        }
                    } else if (p.alive && Math.hypot(pr.wx - p.wx, pr.wy - p.wy) <= 8.5 + pr.radius) {
                        hurtPlayer(pr.dmg, pr.wx, pr.wy);
                        return false;
                    }
                    return true;
                });

                // Enemigos
                for (const en of [...world.enemies]) {
                    if (en.flash > 0) en.flash = Math.max(0, en.flash - dt);
                    if (en.slow > 0) en.slow = Math.max(0, en.slow - dt);
                    if (en.wz > 0 || en.vz !== 0) {
                        en.vz -= 255 * dt; en.wz += en.vz * dt;
                        if (en.wz <= 0) { en.wz = 0; en.vz = en.vz < -45 ? -en.vz * 0.3 : 0; }
                    }
                    const dx = p.wx - en.wx, dy = p.wy - en.wy, d = Math.max(0.001, Math.hypot(dx, dy));
                    const ux = dx / d, uy = dy / d;
                    const effSpd = en.speed * (en.slow > 0 ? 0.55 : 1);
                    let dvx = ux * effSpd, dvy = uy * effSpd;
                    en.aiTimer -= dt;

                    if (en.kind === 'sentinel') {
                        const rad = d > 155 ? 1 : d < 105 ? -0.85 : 0;
                        const st = en.uid % 2 === 0 ? 0.75 : -0.75;
                        dvx = (ux * rad - uy * st) * effSpd; dvy = (uy * rad + ux * st) * effSpd;
                        if (en.aiTimer <= 0) {
                            en.aiTimer = Math.max(1.2, 2.05 - world.wave * 0.06);
                            const ba = Math.atan2(dy, dx);
                            for (const off of (en.elite ? [-0.18, 0, 0.18] : [0])) {
                                const sa = ba + off;
                                world.projectiles.push({
                                    wx: en.wx + Math.cos(sa) * 9, wy: en.wy + Math.sin(sa) * 9, wz: 10,
                                    vx: Math.cos(sa) * 165, vy: Math.sin(sa) * 165, friendly: false,
                                    dmg: 12 + world.wave * 0.6, mark: null, color: '#ff7044', radius: 4, life: 2.4
                                });
                            }
                        }
                    } else if (en.kind === 'golem') {
                        if (en.aiState === 'chase' && en.aiTimer <= 0 && d < 145) {
                            en.aiState = 'windup'; en.aiTimer = 0.55; en.cdx = ux; en.cdy = uy;
                        } else if (en.aiState === 'windup') {
                            dvx = 0; dvy = 0;
                            if (en.aiTimer <= 0) { en.aiState = 'charge'; en.aiTimer = 0.45; }
                        } else if (en.aiState === 'charge') {
                            dvx = en.cdx * effSpd * 3.0; dvy = en.cdy * effSpd * 3.0;
                            if (en.aiTimer <= 0) { en.aiState = 'chase'; en.aiTimer = 2.3; }
                        }
                    } else if (en.kind === 'boss' && en.aiTimer <= 0) {
                        en.aiTimer = 1.55;
                        const ba = Math.atan2(dy, dx);
                        if (en.aiState === 'chase') {
                            en.aiState = 'nova';
                            for (const off of [-0.36, -0.18, 0, 0.18, 0.36]) {
                                const sa = ba + off;
                                world.projectiles.push({
                                    wx: en.wx + Math.cos(sa) * 14, wy: en.wy + Math.sin(sa) * 14, wz: 13,
                                    vx: Math.cos(sa) * 175, vy: Math.sin(sa) * 175, friendly: false,
                                    dmg: 16 + world.wave * 0.5, mark: null, color: '#ffc638', radius: 4.8, life: 2.8
                                });
                            }
                        } else {
                            en.aiState = 'chase';
                            for (let k = 0; k < 10; k++) {
                                const sa = world.elapsed * 1.3 + (k * Math.PI * 2) / 10;
                                world.projectiles.push({
                                    wx: en.wx + Math.cos(sa) * 14, wy: en.wy + Math.sin(sa) * 14, wz: 13,
                                    vx: Math.cos(sa) * 140, vy: Math.sin(sa) * 140, friendly: false,
                                    dmg: 15 + world.wave * 0.5, mark: null, color: '#ff4c9e', radius: 4.5, life: 3.0
                                });
                            }
                        }
                    }

                    const st = 1 - Math.exp(-9 * dt);
                    en.vx += (dvx - en.vx) * st; en.vy += (dvy - en.vy) * st;
                    en.wx += en.vx * dt; en.wy += en.vy * dt;
                    const er = resolveObs(en.wx, en.wy, en.radius);
                    en.wx = er.wx; en.wy = er.wy;
                    en.anim += dt * (en.kind === 'skitter' ? 8.5 : 5.5);
                    en.heading = (en.aiState === 'windup' ? Math.atan2(en.cdy, en.cdx) : Math.atan2(dy, dx)) - Math.PI * 0.5;
                    if (p.alive && en.wz < 14 && Math.hypot(en.wx - p.wx, en.wy - p.wy) <= en.radius + 8.5) {
                        hurtPlayer(en.kind === 'golem' || en.kind === 'boss' ? 22 : 13, en.wx, en.wy);
                    }
                }

                // Cristales, peligros y FX
                world.crystals = world.crystals.filter((c) => {
                    c.life -= dt; c.phase += dt * 4.5;
                    if (c.life <= 0) return false;
                    if (c.wz > 0 || c.vz !== 0) { c.vz -= 180 * dt; c.wz = Math.max(0, c.wz + c.vz * dt); if (c.wz === 0) c.vz = 0; }
                    const d = Math.hypot(p.wx - c.wx, p.wy - c.wy);
                    if (p.alive && d <= 68) { c.wx += ((p.wx - c.wx) / Math.max(1, d)) * 185 * dt; c.wy += ((p.wy - c.wy) / Math.max(1, d)) * 185 * dt; }
                    if (p.alive && d <= 14) {
                        audio.play('pickup');
                        const pts = addScore(150);
                        p.shield = Math.min(p.maxShield, p.shield + 3);
                        world.popups.push({ wx: c.wx, wy: c.wy, wz: 16, text: `+${pts}`, color: '#58f49c', life: 0.55 });
                        return false;
                    }
                    return true;
                });
                world.hazards = world.hazards.filter((h) => {
                    h.life -= dt; if (h.life <= 0) return false;
                    h.acc += dt;
                    if (h.acc >= 0.25) {
                        h.acc = 0;
                        if (h.kind === 'magma') {
                            for (const en of [...world.enemies]) if (Math.hypot(en.wx - h.wx, en.wy - h.wy) <= h.radius + en.radius) damageEnemy(en, 8.5, null);
                        } else if (p.alive && Math.hypot(p.wx - h.wx, p.wy - h.wy) <= h.radius + 7) {
                            hurtPlayer(9, h.wx, h.wy);
                        }
                    }
                    return true;
                });

                world.debris = world.debris.filter((d) => {
                    d.life -= realDt; if (d.life <= 0) return false;
                    d.vz -= 280 * realDt; d.wx += d.vx * realDt; d.wy += d.vy * realDt; d.wz += d.vz * realDt;
                    if (d.wz <= 0) { d.wz = 0; d.vz = -d.vz * 0.4; d.vx *= 0.7; d.vy *= 0.7; }
                    return true;
                });
                world.slashes = world.slashes.filter((s) => (s.life -= realDt) > 0);
                world.cutFlashes = world.cutFlashes.filter((cf) => (cf.life -= realDt) > 0);
                world.bolts = world.bolts.filter((b) => (b.life -= realDt) > 0);
                world.rings = world.rings.filter((r) => (r.life -= realDt) > 0);
                world.decals = world.decals.filter((dc) => (dc.life -= realDt) > 0);
                world.popups = world.popups.filter((pp) => { pp.wz += 18 * realDt; return (pp.life -= realDt) > 0; });

                // Cámara suave + shake
                cam.yaw += (cam.targetYaw - cam.yaw) * (1 - Math.exp(-10 * realDt));
                cam.focusX += (p.wx - cam.focusX) * (1 - Math.exp(-9 * realDt));
                cam.focusY += (p.wy - cam.focusY) * (1 - Math.exp(-9 * realDt));
                cam.x = Math.max(-200, Math.min(200, cam.focusX));
                cam.y = Math.max(-200, Math.min(200, cam.focusY));
                if (cam.trauma > 0) {
                    cam.trauma = Math.max(0, cam.trauma - 1.6 * realDt);
                    const sh = cam.trauma * cam.trauma;
                    cam.shakeT += realDt * 34;
                    cam.ox = 12 * sh * Math.sin(cam.shakeT * 1.7);
                    cam.oy = 9 * sh * Math.sin(cam.shakeT * 2.3);
                } else { cam.ox = 0; cam.oy = 0; }
            }

            // ===================== RENDER =====================
            drawBackdropAndArena();
            uiClickRegions = [];

            if (screenMode === 'title') {
                // Diorama vivo en el altar
                const queue = [];
                world.pylons.forEach((py, idx) => {
                    const st = ['fire', 'sync', 'cyan', 'grav'][idx];
                    const sc = worldToScreen(py.wx, py.wy, 0);
                    queue.push({ ry: sc.ry, fn: () => drawModel(`pylon_${st}`, sc.sx, sc.sy, cam.yaw) });
                });
                const demoW = Math.floor(timeT / 2.4) % 3;
                const heroIds = ['guardian_melee_0', 'guardian_ranged_0', 'guardian_aoe_0'];
                const wIds = ['weapon_sword', 'weapon_railgun', 'weapon_hammer'];
                const hAng = -timeT * 0.9;
                const hs = worldToScreen(0, 0, 0);
                const aimA = hAng + Math.PI * 0.5;
                const ws = worldToScreen(Math.sin(aimA) * 7.8 + Math.cos(aimA) * 4.5, -Math.cos(aimA) * 7.8 + Math.sin(aimA) * 4.5, 0);
                queue.push({ ry: hs.ry, fn: () => drawModel(heroIds[demoW], hs.sx, hs.sy, hAng + cam.yaw) });
                queue.push({ ry: ws.ry, fn: () => drawModel(wIds[demoW], ws.sx, ws.sy, hAng + cam.yaw, 7.5, false, false) });
                queue.sort((a, b) => a.ry - b.ry);
                queue.forEach((it) => it.fn());

                // Cortina oscura lateral
                const grad = ctx.createLinearGradient(0, 0, 720, 0);
                grad.addColorStop(0, 'rgba(10, 12, 22, 0.92)');
                grad.addColorStop(0.75, 'rgba(10, 12, 22, 0.72)');
                grad.addColorStop(1, 'rgba(10, 12, 22, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 720, VIRTUAL_H);

                drawBevelBox(56, 48, 520, 118, 'rgba(18, 20, 34, 0.95)', '#ff9824');
                drawText('NÚCLEO CARBÓN', 80, 90, 42, '#ffc638', 'left');
                drawText('FORJA DE CENIZA • ARCADE 2.5D', 82, 136, 17, '#44e4ff', 'left');

                drawBevelBox(56, 184, 520, 68, 'rgba(24, 24, 42, 0.94)', '#fac638');
                drawText(`PILOTO: ${playerNameRef.current}`, 78, 206, 17, '#ecf2ff');
                drawText(`RÉCORD PERSONAL: ${lastBestScore.toLocaleString()} PTS`, 78, 232, 17, '#ffe888');

                const btns = [
                    { label: '▶ JUGAR MODO ARCADE', border: '#ff9824', fn: () => { resetRun(); screenMode = 'playing'; } },
                    { label: 'OPCIONES DE SONIDO', border: '#44e4ff', fn: () => { prevModeBeforeOverlay = 'title'; screenMode = 'options'; } },
                    { label: 'ARSENAL Y MECÁNICA', border: '#58f49c', fn: () => { prevModeBeforeOverlay = 'title'; screenMode = 'howto'; } },
                    { label: 'SALIR AL CATÁLOGO', border: '#64748b', fn: () => { callbacksRef.current.onExitToCatalog?.(); } }
                ];
                btns.forEach((b, i) => {
                    const bx = 56, by = 278 + i * 64, bw = 460, bh = 52;
                    drawBevelBox(bx, by, bw, bh, i === 0 ? 'rgba(42, 34, 28, 0.95)' : 'rgba(20, 24, 38, 0.92)', b.border);
                    drawText(b.label, bx + 24, by + 26, 20, i === 0 ? '#ffe888' : '#ecf2ff');
                    uiClickRegions.push({ x: bx, y: by, w: bw, h: bh, onClick: b.fn });
                });
            } else {
                // Grietas y peligros en suelo
                for (const dc of world.decals) {
                    const sc = worldToScreen(dc.wx, dc.wy, 0);
                    ctx.save();
                    ctx.globalAlpha = Math.min(1, dc.life / (dc.maxLife * 0.45));
                    ctx.strokeStyle = '#ff4c9e';
                    ctx.lineWidth = 3;
                    for (let k = 0; k < 8; k++) {
                        const a = k * (Math.PI / 4) + cam.yaw;
                        ctx.beginPath();
                        ctx.moveTo(sc.sx, sc.sy);
                        ctx.lineTo(sc.sx + Math.cos(a) * 58, sc.sy + Math.sin(a) * 58 * STACK_SQUASH);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                for (const h of world.hazards) {
                    const sc = worldToScreen(h.wx, h.wy, 0);
                    ctx.fillStyle = h.kind === 'magma' ? 'rgba(238,96,34,0.35)' : 'rgba(218,44,98,0.35)';
                    ctx.strokeStyle = h.kind === 'magma' ? '#ee6022' : '#da2c62';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(sc.sx, sc.sy, h.radius * ART_SCALE, h.radius * ART_SCALE * STACK_SQUASH, 0, 0, Math.PI * 2);
                    ctx.fill(); ctx.stroke();
                }
                for (const b of world.bombs) {
                    const sc = worldToScreen(b.tx, b.ty, 0);
                    const prog = Math.min(1, b.elapsed / b.dur);
                    ctx.strokeStyle = '#ff4c9e'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.ellipse(sc.sx, sc.sy, 64 * ART_SCALE, 64 * ART_SCALE * STACK_SQUASH, 0, 0, Math.PI * 2); ctx.stroke();
                    ctx.strokeStyle = '#ffccea'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.ellipse(sc.sx, sc.sy, Math.max(6, 64 * ART_SCALE * (1 - prog)), Math.max(4, 64 * ART_SCALE * (1 - prog) * STACK_SQUASH), 0, 0, Math.PI * 2); ctx.stroke();
                }
                for (const r of world.rings) {
                    const sc = worldToScreen(r.wx, r.wy, r.wz);
                    const prog = 1 - r.life / r.maxLife;
                    const cr = Math.max(4, r.maxR * prog) * ART_SCALE;
                    ctx.strokeStyle = r.color; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.ellipse(sc.sx, sc.sy, cr, cr * STACK_SQUASH, 0, 0, Math.PI * 2); ctx.stroke();
                }

                // Cola Y-sorted de entidades 3D Sprite Stacking
                const queue = [];
                for (const pil of world.pillars) {
                    const sc = worldToScreen(pil.wx, pil.wy, 0);
                    queue.push({ ry: sc.ry, fn: () => drawModel('pillar', sc.sx, sc.sy, cam.yaw) });
                }
                for (const prp of world.props) {
                    const sc = worldToScreen(prp.wx, prp.wy, 0);
                    queue.push({ ry: sc.ry, fn: () => drawModel(prp.kind, sc.sx, sc.sy, cam.yaw) });
                }
                for (const py of world.pylons) {
                    const sc = worldToScreen(py.wx, py.wy, 0);
                    queue.push({
                        ry: sc.ry,
                        fn: () => {
                            if (py.state !== 'neutral') {
                                ctx.strokeStyle = py.state === 'sync' ? '#58f49c' : MARK_COLORS[py.state];
                                ctx.lineWidth = 2;
                                ctx.beginPath();
                                ctx.ellipse(sc.sx, sc.sy, 17 * ART_SCALE, 17 * ART_SCALE * STACK_SQUASH, 0, 0, Math.PI * 2);
                                ctx.stroke();
                            }
                            drawModel(`pylon_${py.state}`, sc.sx, sc.sy, cam.yaw);
                            if (MARK_NUM[py.state]) {
                                drawText(`ARMA [${MARK_NUM[py.state]}]`, sc.sx, sc.sy - 102, 13, '#ffffff', 'center');
                            }
                        }
                    });
                }
                for (const c of world.crystals) {
                    const sc = worldToScreen(c.wx, c.wy, 0);
                    queue.push({ ry: sc.ry, fn: () => drawModel('crystal', sc.sx, sc.sy, c.phase + cam.yaw, c.wz + 2 + Math.sin(c.phase) * 1.4) });
                }
                for (const en of world.enemies) {
                    const sc = worldToScreen(en.wx, en.wy, 0);
                    queue.push({
                        ry: sc.ry,
                        fn: () => {
                            const mid = en.kind === 'skitter' || en.kind === 'golem'
                                ? `${en.kind}_${[0, 1, 0, 2][Math.floor(en.anim) % 4]}`
                                : `${en.kind}_${Math.floor(en.anim * 0.5) % 2}`;
                            drawModel(mid, sc.sx, sc.sy, en.heading + cam.yaw, en.wz, en.flash > 0);
                            if (en.marks.size > 0) {
                                const arr = ['fire', 'cyan', 'grav'].filter((m) => en.marks.has(m));
                                arr.forEach((mk, idx) => {
                                    ctx.fillStyle = MARK_COLORS[mk];
                                    ctx.fillRect(sc.sx - (arr.length - 1) * 7 + idx * 14 - 4, sc.sy - 72, 8, 8);
                                });
                            }
                            if (en.kind !== 'boss' && en.hp < en.maxHp) {
                                ctx.fillStyle = '#0e101a'; ctx.fillRect(sc.sx - 18, sc.sy - 56, 36, 5);
                                ctx.fillStyle = '#ee4858'; ctx.fillRect(sc.sx - 17, sc.sy - 55, 34 * (en.hp / en.maxHp), 3);
                            }
                        }
                    });
                }
                for (const b of world.bombs) {
                    const prog = Math.min(1, b.elapsed / b.dur);
                    const sc = worldToScreen(b.sx + (b.tx - b.sx) * prog, b.sy + (b.ty - b.sy) * prog, 0);
                    queue.push({ ry: sc.ry, fn: () => drawModel('bomb', sc.sx, sc.sy, prog * 9 + cam.yaw, Math.sin(prog * Math.PI) * 28) });
                }

                // Jugador + Arma 3D acoplada
                const p = world.player;
                if (p.alive) {
                    const ps = worldToScreen(p.wx, p.wy, 0);
                    const wModel = p.weapon === 0 ? 'weapon_sword' : p.weapon === 1 ? 'weapon_railgun' : 'weapon_hammer';
                    const aimA = p.heading + Math.PI * 0.5;
                    const fx = Math.cos(aimA), fy = Math.sin(aimA);
                    const rx = Math.sin(aimA), ry = -Math.cos(aimA);
                    let wWx = p.wx + rx * 7.8 + fx * 4.5, wWy = p.wy + ry * 7.8 + fy * 4.5, wWz = p.wz + 7.5, wH = p.heading, swOff = 0;

                    if (p.weapon === 0 && p.swingTimer > 0) {
                        const prog = 1 - p.swingTimer / p.swingMax;
                        const hp = Math.min(1, Math.pow(prog * 1.45, 0.72));
                        const sp = p.swingVariant === 'finisher' ? (200 * Math.PI) / 180 : (148 * Math.PI) / 180;
                        const sAng = p.swingVariant === 'ccw' ? p.attackAngle + sp * 0.5 - sp * hp : p.attackAngle - sp * 0.5 + sp * hp;
                        swOff = p.swingDir * (1 - (1 - prog) * 2) * 0.62;
                        wWx = p.wx + Math.cos(sAng) * 13.5; wWy = p.wy + Math.sin(sAng) * 13.5; wWz = p.wz + 8.5; wH = sAng - Math.PI * 0.5;
                    } else if (p.weapon === 1 && p.recoilTimer > 0) {
                        const pull = 5.5 * (p.recoilTimer / p.recoilMax);
                        wWx -= fx * pull; wWy -= fy * pull; wWz += pull * 0.25;
                    } else if (p.weapon === 2 && p.hammerTimer > 0) {
                        const th = 1 - p.hammerTimer / 0.26;
                        wWx += fx * Math.sin(th * Math.PI) * 6.5; wWy += fy * Math.sin(th * Math.PI) * 6.5; wWz += Math.sin(th * Math.PI) * 9;
                    }
                    const ws = worldToScreen(wWx, wWy, 0);
                    const pMid = `${['guardian_melee', 'guardian_ranged', 'guardian_aoe'][p.weapon]}_${Math.hypot(p.vx, p.vy) > 18 ? [0, 1, 0, 2][Math.floor(p.walkPhase) % 4] : 0}`;
                    queue.push({ ry: ps.ry, fn: () => drawModel(pMid, ps.sx, ps.sy, p.heading + swOff + cam.yaw, p.wz, p.flash > 0) });
                    queue.push({ ry: ws.ry, fn: () => drawModel(wModel, ws.sx, ws.sy, wH + cam.yaw, wWz, false, false) });
                }

                for (const pr of world.projectiles) {
                    const sc = worldToScreen(pr.wx, pr.wy, pr.wz);
                    queue.push({
                        ry: sc.ry,
                        fn: () => {
                            if (pr.friendly) {
                                const sp = Math.max(1, Math.hypot(pr.vx, pr.vy));
                                const ux = pr.vx / sp, uy = pr.vy / sp;
                                const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
                                const sdx = ux * c - uy * s, sdy = (ux * s + uy * c) * STACK_SQUASH;
                                ctx.strokeStyle = pr.color; ctx.lineWidth = 5;
                                ctx.beginPath(); ctx.moveTo(sc.sx - sdx * 24, sc.sy - sdy * 24); ctx.lineTo(sc.sx + sdx * 8, sc.sy + sdy * 8); ctx.stroke();
                                ctx.strokeStyle = '#e8fcff'; ctx.lineWidth = 2;
                                ctx.beginPath(); ctx.moveTo(sc.sx - sdx * 6, sc.sy - sdy * 6); ctx.lineTo(sc.sx + sdx * 8, sc.sy + sdy * 8); ctx.stroke();
                            } else {
                                ctx.fillStyle = pr.color; ctx.beginPath(); ctx.arc(sc.sx, sc.sy, 6, 0, Math.PI * 2); ctx.fill();
                                ctx.fillStyle = '#fff0d7'; ctx.beginPath(); ctx.arc(sc.sx, sc.sy, 3, 0, Math.PI * 2); ctx.fill();
                            }
                        }
                    });
                }
                for (const deb of world.debris) {
                    const sc = worldToScreen(deb.wx, deb.wy, deb.wz);
                    queue.push({ ry: sc.ry, fn: () => { ctx.fillStyle = deb.color; ctx.fillRect(sc.sx - deb.size, sc.sy - deb.size, deb.size * 2, deb.size * 2); } });
                }

                queue.sort((a, b) => a.ry - b.ry);
                queue.forEach((it) => it.fn());

                // Haces de plasma entre pilones sincronizados
                const synced = world.pylons.filter((q) => q.state === 'sync');
                for (let i = 0; i < synced.length; i++) {
                    for (let j = i + 1; j < synced.length; j++) {
                        const a = worldToScreen(synced[i].wx, synced[i].wy, 15);
                        const b = worldToScreen(synced[j].wx, synced[j].wy, 15);
                        ctx.strokeStyle = '#20b870'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
                        ctx.strokeStyle = '#d6ffe8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
                    }
                }

                // Tajo creciente de espada
                for (const sl of world.slashes) {
                    const prog = 1 - sl.life / sl.maxLife;
                    const hp = Math.min(1, Math.pow(prog * 1.45, 0.72));
                    const tp = Math.pow(Math.max(0, (prog - 0.16) / 0.84), 1.18);
                    const sc = worldToScreen(sl.wx, sl.wy, 9);
                    const a0 = sl.variant === 'ccw' ? sl.angle + sl.span * 0.5 - sl.span * tp : sl.angle - sl.span * 0.5 + sl.span * tp;
                    const a1 = sl.variant === 'ccw' ? sl.angle + sl.span * 0.5 - sl.span * hp : sl.angle - sl.span * 0.5 + sl.span * hp;
                    ctx.save();
                    ctx.translate(sc.sx, sc.sy);
                    ctx.scale(1, STACK_SQUASH);
                    ctx.rotate(cam.yaw);
                    ctx.strokeStyle = sl.variant === 'finisher' ? '#ffe888' : '#ff9824';
                    ctx.lineWidth = 14;
                    ctx.beginPath(); ctx.arc(0, 0, sl.reach * ART_SCALE * 0.82, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
                    ctx.strokeStyle = '#fff8dc';
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(0, 0, sl.reach * ART_SCALE * 0.92, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
                    ctx.restore();
                }

                for (const cf of world.cutFlashes) {
                    const sc = worldToScreen(cf.wx, cf.wy, cf.wz);
                    const half = cf.length * ART_SCALE * (0.4 + 0.6 * (cf.life / cf.maxLife));
                    const sa = cf.angle + cam.yaw;
                    ctx.strokeStyle = '#ffec94'; ctx.lineWidth = 5;
                    ctx.beginPath(); ctx.moveTo(sc.sx - Math.cos(sa) * half, sc.sy - Math.sin(sa) * half * STACK_SQUASH);
                    ctx.lineTo(sc.sx + Math.cos(sa) * half, sc.sy + Math.sin(sa) * half * STACK_SQUASH); ctx.stroke();
                }
                for (const b of world.bolts) {
                    const pts = b.pts.map((pt) => worldToScreen(pt.wx, pt.wy, pt.wz));
                    if (pts.length >= 2) {
                        ctx.strokeStyle = b.color; ctx.lineWidth = 7;
                        ctx.beginPath(); ctx.moveTo(pts[0].sx, pts[0].sy); pts.slice(1).forEach((q) => ctx.lineTo(q.sx, q.sy)); ctx.stroke();
                        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
                    }
                }
                for (const pp of world.popups) {
                    const sc = worldToScreen(pp.wx, pp.wy, pp.wz);
                    drawText(pp.text, sc.sx, sc.sy, pp.big ? 20 : 14, pp.color, 'center');
                }

                // HUD Arcade
                drawBevelBox(18, 18, 300, 96, 'rgba(18, 22, 36, 0.90)', '#5e6e98');
                drawText(`NÚCLEO ${Math.ceil(p.hp)}/${p.maxHp}`, 32, 36, 15, '#ecf2ff');
                ctx.fillStyle = '#0a0c14'; ctx.fillRect(32, 50, 272, 12);
                ctx.fillStyle = '#e83e52'; ctx.fillRect(32, 50, 272 * (p.hp / p.maxHp), 12);
                ctx.fillStyle = '#0a0c14'; ctx.fillRect(32, 66, 272, 9);
                ctx.fillStyle = '#2ab8e8'; ctx.fillRect(32, 66, 272 * (p.shield / p.maxShield), 9);
                drawText(`IMPULSO [ESP]: ${'■ '.repeat(p.dashes)}${'□ '.repeat(p.maxDashes - p.dashes)}`, 32, 92, 14, '#58f49c');

                const mins = String(Math.floor(world.elapsed / 60)).padStart(2, '0');
                const secs = String(Math.floor(world.elapsed % 60)).padStart(2, '0');
                drawBevelBox(VIRTUAL_W * 0.5 - 175, 18, 350, 62, 'rgba(18, 22, 36, 0.90)', '#4a5880');
                drawText(`OLEADA ${world.wave} • ${mins}:${secs}`, VIRTUAL_W * 0.5, 38, 19, '#ecf2ff', 'center');
                drawText(
                    p.overdrive > 0 ? `MODO DIAMANTE (${p.overdrive.toFixed(1)}s)` : `Hostiles: ${world.enemies.length + world.spawnQueue.length} | Cataclismos: ${world.cataclysms}`,
                    VIRTUAL_W * 0.5, 62, 13, p.overdrive > 0 ? '#58f49c' : '#96a4c4', 'center'
                );

                const boss = world.enemies.find((e) => e.kind === 'boss');
                if (boss) {
                    drawBevelBox(VIRTUAL_W * 0.5 - 220, 88, 440, 26, 'rgba(36, 18, 28, 0.92)', '#fac638');
                    ctx.fillStyle = '#da344c'; ctx.fillRect(VIRTUAL_W * 0.5 - 214, 93, 428 * Math.max(0, boss.hp / boss.maxHp), 16);
                    drawText(`COLOSO DEL EJE (${Math.ceil(boss.hp)}/${boss.maxHp})`, VIRTUAL_W * 0.5, 101, 13, '#fff4be', 'center');
                }

                drawBevelBox(VIRTUAL_W - 318, 18, 300, 96, 'rgba(18, 22, 36, 0.90)', '#d6a230');
                drawText(`PILOTO: ${playerNameRef.current}`, VIRTUAL_W - 32, 34, 13, '#fac638', 'right');
                drawText(`${world.score.toLocaleString()} PTS`, VIRTUAL_W - 32, 64, 24, '#ffffff', 'right');
                drawText(`COMBO x${world.multiplier.toFixed(2)}`, VIRTUAL_W - 32, 94, 15, world.multiplier >= 3 ? '#58f49c' : '#ffc448', 'right');

                if (world.bannerTimer > 0) {
                    drawText(world.bannerTitle, VIRTUAL_W * 0.5, VIRTUAL_H * 0.25, 30, '#ffe062', 'center');
                    drawText(world.bannerSub, VIRTUAL_W * 0.5, VIRTUAL_H * 0.25 + 36, 15, '#ecf2ff', 'center');
                }

                // Tarjetas inferiores de las 3 armas (también clicables / táctiles)
                const cw = 250, gap = 14, sx0 = VIRTUAL_W * 0.5 - (cw * 3 + gap * 2) * 0.5, by = VIRTUAL_H - 82;
                WEAPONS.forEach((wp, idx) => {
                    const x = sx0 + idx * (cw + gap);
                    const sel = p.weapon === idx;
                    drawBevelBox(x, by, cw, 62, sel ? 'rgba(34, 41, 66, 0.94)' : 'rgba(18, 22, 36, 0.88)', sel ? wp.color : '#4a5880');
                    drawText(`[${wp.key}] ${wp.name}`, x + 14, by + 22, 16, sel ? wp.bright : '#ecf2ff');
                    drawText(wp.role, x + 14, by + 44, 13, sel ? wp.color : '#96a4c4');
                    uiClickRegions.push({ x, y: by, w: cw, h: 62, onClick: () => { world.player.weapon = idx; } });
                });

                // Controles táctiles en pantalla si touchMode está activo
                if (touchMode) {
                    const pBtn = { x: VIRTUAL_W - 110, y: 126, w: 92, h: 36 };
                    drawBevelBox(pBtn.x, pBtn.y, pBtn.w, pBtn.h, 'rgba(18,22,36,0.88)', '#44e4ff');
                    drawText('PAUSA', pBtn.x + 46, pBtn.y + 18, 14, '#ecf2ff', 'center');
                    uiClickRegions.push({ ...pBtn, onClick: () => { screenMode = 'paused'; } });

                    const dBtn = { x: VIRTUAL_W - 130, y: VIRTUAL_H - 170, w: 105, h: 48 };
                    drawBevelBox(dBtn.x, dBtn.y, dBtn.w, dBtn.h, 'rgba(22,42,36,0.9)', '#58f49c');
                    drawText('IMPULSO', dBtn.x + 52, dBtn.y + 24, 15, '#58f49c', 'center');
                    uiClickRegions.push({
                        ...dBtn,
                        onClick: () => tryDash(touchJoy.dx, touchJoy.dy, p.wx + (touchAim.dx || 1) * 80, p.wy + (touchAim.dy || 0) * 80)
                    });
                }

                // Retícula del ratón en PC
                if (screenMode === 'playing' && !touchMode && p.alive) {
                    const wp = WEAPONS[p.weapon];
                    ctx.strokeStyle = wp.color; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 11, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = wp.bright; ctx.fillRect(mouse.x - 2, mouse.y - 2, 4, 4);
                }
            }

            // Overlays: Pausa, Opciones de Sonido, Cómo Jugar, Game Over
            if (screenMode === 'paused' || screenMode === 'gameover') {
                ctx.fillStyle = 'rgba(6, 8, 16, 0.78)';
                ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
                const isGO = screenMode === 'gameover';
                drawBevelBox(VIRTUAL_W * 0.5 - 280, 140, 560, 420, 'rgba(20, 24, 40, 0.96)', isGO ? (isNewRecord ? '#fac638' : '#ff5668') : '#44e4ff');
                drawText(
                    isGO ? (isNewRecord ? '¡¡NUEVO RÉCORD PERSONAL!!' : 'NÚCLEO CAÍDO — FIN DE PARTIDA') : 'JUEGO EN PAUSA',
                    VIRTUAL_W * 0.5, 184, 26, isGO ? (isNewRecord ? '#fac638' : '#ff5668') : '#44e4ff', 'center'
                );
                drawText(`Piloto: ${playerNameRef.current}`, VIRTUAL_W * 0.5, 224, 17, '#ecf2ff', 'center');
                drawText(`Puntuación: ${world.score.toLocaleString()} PTS`, VIRTUAL_W * 0.5, 254, 22, '#ffe888', 'center');
                drawText(`Oleada: ${world.wave}  |  Cataclismos: ${world.cataclysms}  |  Combo: x${world.maxCombo.toFixed(2)}`, VIRTUAL_W * 0.5, 286, 15, '#96a4c4', 'center');

                const mBtns = isGO
                    ? [
                        { label: 'JUGAR DE NUEVO', fn: () => { resetRun(); screenMode = 'playing'; } },
                        { label: 'OPCIONES DE SONIDO', fn: () => { prevModeBeforeOverlay = 'gameover'; screenMode = 'options'; } },
                        { label: 'MENÚ DEL JUEGO', fn: () => { screenMode = 'title'; } }
                    ]
                    : [
                        { label: 'CONTINUAR', fn: () => { screenMode = 'playing'; } },
                        { label: 'OPCIONES DE SONIDO', fn: () => { prevModeBeforeOverlay = 'paused'; screenMode = 'options'; } },
                        { label: 'REINICIAR ARCADE', fn: () => { resetRun(); screenMode = 'playing'; } },
                        { label: 'MENÚ DEL JUEGO', fn: () => { screenMode = 'title'; } }
                    ];
                mBtns.forEach((b, i) => {
                    const bx = VIRTUAL_W * 0.5 - 190, by = 326 + i * 54, bw = 380, bh = 44;
                    drawBevelBox(bx, by, bw, bh, 'rgba(30, 36, 58, 0.95)', '#fac638');
                    drawText(b.label, bx + bw * 0.5, by + 22, 18, '#ecf2ff', 'center');
                    uiClickRegions.push({ x: bx, y: by, w: bw, h: bh, onClick: b.fn });
                });
            } else if (screenMode === 'options') {
                ctx.fillStyle = 'rgba(6, 8, 16, 0.80)';
                ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
                drawBevelBox(VIRTUAL_W * 0.5 - 340, 120, 680, 470, 'rgba(20, 24, 40, 0.97)', '#58f49c');
                drawText('OPCIONES DE SONIDO', VIRTUAL_W * 0.5, 162, 28, '#58f49c', 'center');

                const sliders = [
                    { label: 'Volumen General', val: audio.masterVol, set: (v) => { audio.masterVol = v; audio.syncGains(); } },
                    { label: 'Volumen Música', val: audio.musicVol, set: (v) => { audio.musicVol = v; audio.syncGains(); } },
                    { label: 'Volumen Efectos (SFX)', val: audio.sfxVol, set: (v) => { audio.sfxVol = v; audio.syncGains(); audio.play('ui'); } }
                ];
                sliders.forEach((sl, i) => {
                    const ry = 220 + i * 72;
                    drawText(sl.label, VIRTUAL_W * 0.5 - 290, ry, 18, '#ecf2ff');
                    const mBtn = { x: VIRTUAL_W * 0.5 - 10, y: ry - 16, w: 36, h: 32 };
                    const bar = { x: VIRTUAL_W * 0.5 + 36, y: ry - 10, w: 180, h: 20 };
                    const pBtn = { x: VIRTUAL_W * 0.5 + 226, y: ry - 16, w: 36, h: 32 };
                    drawBevelBox(mBtn.x, mBtn.y, mBtn.w, mBtn.h, '#14182a', '#4a5880');
                    drawText('-', mBtn.x + 18, mBtn.y + 16, 20, '#ecf2ff', 'center');
                    ctx.fillStyle = '#0a0c16'; ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
                    ctx.fillStyle = i === 1 ? '#ff9824' : '#44e4ff'; ctx.fillRect(bar.x + 2, bar.y + 2, (bar.w - 4) * sl.val, bar.h - 4);
                    drawBevelBox(pBtn.x, pBtn.y, pBtn.w, pBtn.h, '#14182a', '#4a5880');
                    drawText('+', pBtn.x + 18, pBtn.y + 16, 20, '#ecf2ff', 'center');
                    drawText(`${Math.round(sl.val * 100)}%`, VIRTUAL_W * 0.5 + 305, ry, 16, '#ffe888', 'right');

                    uiClickRegions.push({ ...mBtn, onClick: () => sl.set(Math.max(0, Math.round((sl.val - 0.1) * 10) / 10)) });
                    uiClickRegions.push({ ...pBtn, onClick: () => sl.set(Math.min(1, Math.round((sl.val + 0.1) * 10) / 10)) });
                    uiClickRegions.push({ ...bar, onClick: (cx) => sl.set(Math.max(0, Math.min(1, (cx - bar.x) / bar.w))) });
                });

                const muteBtn = { x: VIRTUAL_W * 0.5 - 200, y: 440, w: 400, h: 46 };
                drawBevelBox(muteBtn.x, muteBtn.y, muteBtn.w, muteBtn.h, '#181c2e', audio.muted ? '#ff5668' : '#58f49c');
                drawText(audio.muted ? 'SONIDO SILENCIADO (Clic para activar)' : 'SONIDO ACTIVO (Clic para silenciar)', VIRTUAL_W * 0.5, muteBtn.y + 23, 16, audio.muted ? '#ff5668' : '#58f49c', 'center');
                uiClickRegions.push({ ...muteBtn, onClick: () => { audio.muted = !audio.muted; audio.syncGains(); } });

                const backBtn = { x: VIRTUAL_W * 0.5 - 150, y: 512, w: 300, h: 48 };
                drawBevelBox(backBtn.x, backBtn.y, backBtn.w, backBtn.h, '#242a44', '#fac638');
                drawText('GUARDAR Y VOLVER', VIRTUAL_W * 0.5, backBtn.y + 24, 18, '#ffe888', 'center');
                uiClickRegions.push({ ...backBtn, onClick: () => { screenMode = prevModeBeforeOverlay; } });
            } else if (screenMode === 'howto') {
                ctx.fillStyle = 'rgba(6, 8, 16, 0.84)';
                ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
                drawBevelBox(VIRTUAL_W * 0.5 - 440, 95, 880, 530, 'rgba(20, 24, 40, 0.97)', '#fac638');
                drawText('ARSENAL Y RESONANCIA TRIÁDICA', VIRTUAL_W * 0.5, 140, 26, '#ffe062', 'center');
                const lines = [
                    '[1] CIZALLA TÉRMICA (C. a Cuerpo): tajo amplio, desvía proyectiles y aplica Marca Ígnea.',
                    '[2] AGUJA DE RIEL (Distancia): disparo veloz; cada 4.º tiro perfora y aplica Marca Voltaica.',
                    '[3] CRÁTER SÍSMICO (Área): bomba gravitatoria que eleva enemigos y aplica Marca Sísmica.',
                    '',
                    '★ CATACLISMO TRIÁDICO: junta las 3 marcas en un enemigo para explosión + Escudo + Combo.',
                    '★ PILONES DE PRESIÓN: golpea los pilones iluminados con su arma [1/2/3] -> MODO DIAMANTE.',
                    '',
                    'CONTROLES PC: WASD mover | Ratón apuntar/atacar | 1/2/3 o Rueda arma | ESPACIO impulso | Q/E rotar cámara'
                ];
                lines.forEach((ln, i) => drawText(ln, VIRTUAL_W * 0.5 - 405, 198 + i * 38, 15, i === 4 || i === 5 ? '#58f49c' : '#ecf2ff'));
                const okBtn = { x: VIRTUAL_W * 0.5 - 140, y: 548, w: 280, h: 46 };
                drawBevelBox(okBtn.x, okBtn.y, okBtn.w, okBtn.h, '#242a44', '#fac638');
                drawText('ENTENDIDO', VIRTUAL_W * 0.5, okBtn.y + 23, 18, '#ffe888', 'center');
                uiClickRegions.push({ ...okBtn, onClick: () => { screenMode = prevModeBeforeOverlay; } });
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
        <div ref={containerRef} className={`game-canvas-shell ${isFullscreen ? 'is-fullscreen' : ''}`}>
            {!isLoaded && (
                <div className="game-loading-overlay">
                    <div className="game-loading-spinner" />
                    <p>Horneando Sprite Stacking 2.5D... {loadingProgress}%</p>
                </div>
            )}
            <div className="game-stage-toolbar">
                <span className="game-pilot-badge">🔥 Piloto: {playerName}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn-outline" onClick={toggleFullscreen}>
                        {isFullscreen ? 'Salir ⛶' : 'Pantalla Completa ⛶'}
                    </button>
                    <button type="button" className="btn-outline" onClick={onExitToCatalog}>
                        ← Volver a la Ficha
                    </button>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={VIRTUAL_W}
                height={VIRTUAL_H}
                className="gameover-canvas"
                style={{ cursor: 'crosshair', imageRendering: 'pixelated' }}
            />
        </div>
    );
}
