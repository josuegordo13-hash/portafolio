// Port 1:1 exacto de slash_vfx.py, arena_map.py, stack_renderer.py y audio_engine.py
export const ART_SCALE = 3;
export const STACK_SQUASH = 0.72;
export const STACK_SPACING = 1.0;
export const ANGLE_STEPS = 64;
export const ARENA_RADIUS = 295.0;
export const PYLON_RING_RADIUS = 165.0;
export const TEXEL_ART_PX = 2;
export const TEX_HALF = 172;
export const TEX_SIZE = TEX_HALF * 2;
export const OCT_APOTHEM = ARENA_RADIUS + 12.0;
export const OCT_VERTEX_R = OCT_APOTHEM / Math.cos(Math.PI / 8.0);

// Generador pseudoaleatorio determinista para reproducir las texturas procedurales de Python
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function rgbaBufferToScaledCanvas(rgba, w, h, scale, squashY = 1.0) {
    const base = document.createElement('canvas');
    base.width = w;
    base.height = h;
    const bctx = base.getContext('2d');
    const imgData = bctx.createImageData(w, h);
    imgData.data.set(rgba);
    bctx.putImageData(imgData, 0, 0);

    if (scale === 1 && Math.abs(squashY - 1.0) < 1e-4) return base;

    const outW = Math.max(2, Math.round(w * scale));
    const outH = Math.max(2, Math.round(h * scale * squashY));
    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(base, 0, 0, outW, outH);
    return out;
}

// ============================================================================
// 1. SLASH VFX BANK (Port 1:1 de src/slash_vfx.py)
// ============================================================================
export class SlashVFXBankWeb {
    constructor(scale = ART_SCALE) {
        this.scale = scale;
        this.frames = {
            normal_cw: this._buildSlashSequence(148.0, true, false),
            normal_ccw: this._buildSlashSequence(148.0, false, false),
            finisher: this._buildSlashSequence(200.0, true, true)
        };
        this.seismicFrames = this._buildSeismicExplosionSequence();
        this.craterDecal = this._buildCraterDecal();
        this.muzzleCyan = this._buildMuzzleStar(16, [68, 228, 255], [225, 252, 255]);
        this.muzzlePierce = this._buildMuzzleStar(26, [68, 228, 255], [255, 255, 255]);
        this.muzzleGrav = this._buildMuzzleStar(20, [255, 76, 158], [255, 220, 240]);
    }

    _buildSlashSequence(spanDeg, cw, finisher) {
        const size = finisher ? 132 : 116;
        const c = (size - 1) * 0.5;
        const span = (spanDeg * Math.PI) / 180.0;
        const outerR = finisher ? 60.0 : 51.0;
        const maxThick = finisher ? 18.0 : 14.5;
        const nFrames = 7;
        const rng = mulberry32(finisher ? 77 : (cw ? 11 : 23));

        const serration = new Float32Array(73);
        for (let i = 0; i < 73; i++) serration[i] = rng();

        const seq = [];
        for (let fi = 0; fi < nFrames; fi++) {
            const t = fi / (nFrames - 1);
            const headP = Math.min(1.0, Math.pow(t * 1.45, 0.72));
            const tailP = Math.pow(Math.max(0.0, (t - 0.16) / 0.84), 1.18);

            let aStart, aHead, aTail, arcSpan;
            if (cw) {
                aStart = -span * 0.5;
                aHead = aStart + span * headP;
                aTail = aStart + span * tailP;
                arcSpan = Math.max(0.08, aHead - aTail);
            } else {
                aStart = span * 0.5;
                aHead = aStart - span * headP;
                aTail = aStart - span * tailP;
                arcSpan = Math.max(0.08, aTail - aHead);
            }

            const fadeLife = Math.max(0.15, 1.0 - Math.max(0.0, t - 0.55) / 0.45);
            const body = new Uint8Array(size * size);
            const heatArr = new Float32Array(size * size);

            for (let y = 0; y < size; y++) {
                const dy = y - c;
                for (let x = 0; x < size; x++) {
                    const dx = x - c;
                    const dist = Math.hypot(dx, dy);
                    const ang = Math.atan2(dy, dx);
                    const u = cw ? (ang - aTail) / arcSpan : (aTail - ang) / arcSpan;
                    if (u < 0.0 || u > 1.0) continue;

                    const uClip = Math.max(0.0, Math.min(1.0, u));
                    const taper = Math.pow(Math.max(0.0, Math.sin(uClip * Math.PI)), 0.65);
                    const localThick = maxThick * taper * fadeLife;
                    if (localThick <= 1.2) continue;

                    const bin = Math.max(0, Math.min(72, Math.floor(((ang + Math.PI) / (2.0 * Math.PI)) * 72.0)));
                    const rOut = outerR - (1.0 - uClip) * 3.5;
                    const serrateCut = serration[bin] * (1.0 - uClip) * (finisher ? 4.5 : 3.2);
                    const rIn = rOut - Math.max(1.5, localThick - serrateCut);

                    let hit = dist <= rOut && dist >= rIn;
                    if (!hit && finisher && u > 0.25) {
                        const rOut2 = outerR * 0.74;
                        const rIn2 = rOut2 - Math.max(1.0, localThick * 0.55);
                        if (dist <= rOut2 && dist >= rIn2) hit = true;
                    }
                    if (hit) {
                        const idx = y * size + x;
                        body[idx] = 1;
                        const radialFrac = Math.max(0.0, Math.min(1.0, (dist - rIn) / Math.max(1.0, rOut - rIn)));
                        heatArr[idx] = radialFrac * 0.58 + uClip * 0.48;
                    }
                }
            }

            const sparkMask = new Uint8Array(size * size);
            if (fi < nFrames - 1) {
                const nSparks = finisher ? 14 : 9;
                for (let s = 0; s < nSparks; s++) {
                    const su = 0.15 + rng() * 0.80;
                    const sa = aTail + su * (aHead - aTail);
                    const sr = outerR - 10.0 + rng() * 16.0;
                    const sx = Math.round(c + Math.cos(sa) * sr);
                    const sy = Math.round(c + Math.sin(sa) * sr);
                    if (sx >= 1 && sx < size - 2 && sy >= 1 && sy < size - 2) {
                        sparkMask[sy * size + sx] = 1;
                        sparkMask[sy * size + (sx + 1)] = 1;
                        sparkMask[(sy + 1) * size + sx] = 1;
                        sparkMask[(sy + 1) * size + (sx + 1)] = 1;
                    }
                }
            }

            const rgba = new Uint8ClampedArray(size * size * 4);
            const cTail = finisher ? [168, 36, 48, 235] : [146, 32, 34, 220];
            const cMid = finisher ? [255, 134, 28, 250] : [246, 104, 24, 245];
            const cHot = finisher ? [255, 228, 108, 255] : [255, 194, 62, 255];
            const cEdge = finisher ? [255, 252, 235, 255] : [255, 248, 212, 255];

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = y * size + x;
                    const p = idx * 4;
                    if (body[idx]) {
                        const h = heatArr[idx];
                        const col = h < 0.42 ? cTail : (h < 0.68 ? cMid : (h < 0.88 ? cHot : cEdge));
                        rgba[p] = col[0]; rgba[p + 1] = col[1]; rgba[p + 2] = col[2]; rgba[p + 3] = col[3];
                    } else if (sparkMask[idx]) {
                        rgba[p] = 255; rgba[p + 1] = 236; rgba[p + 2] = 146; rgba[p + 3] = 255;
                    } else {
                        const dil =
                            (y > 0 && body[(y - 1) * size + x]) ||
                            (y + 1 < size && body[(y + 1) * size + x]) ||
                            (x > 0 && body[y * size + (x - 1)]) ||
                            (x + 1 < size && body[y * size + (x + 1)]);
                        if (dil) {
                            rgba[p] = 24; rgba[p + 1] = 12; rgba[p + 2] = 22; rgba[p + 3] = 210;
                        }
                    }
                }
            }
            seq.push(rgbaBufferToScaledCanvas(rgba, size, size, this.scale, 1.0));
        }
        return seq;
    }

    _buildSeismicExplosionSequence() {
        // 6 fotogramas pixel-art de onda expansiva gravitatoria dentada para el Cráter Sísmico
        const size = 136;
        const c = (size - 1) * 0.5;
        const nFrames = 6;
        const seq = [];

        for (let fi = 0; fi < nFrames; fi++) {
            const t = fi / (nFrames - 1);
            const thick = Math.max(3.5, 22.0 * (1.0 - t * 0.72));
            const coreR = fi <= 2 ? Math.max(2.0, 22.0 * (1.0 - t * 1.35)) : -1.0;
            const alphaFade = Math.round(255 * Math.max(0.30, 1.0 - Math.max(0.0, t - 0.55) * 1.4));

            const body = new Uint8Array(size * size);
            const isCore = new Uint8Array(size * size);
            const fracArr = new Float32Array(size * size);

            for (let y = 0; y < size; y++) {
                const dy = y - c;
                for (let x = 0; x < size; x++) {
                    const dx = x - c;
                    const dist = Math.hypot(dx, dy);
                    const ang = Math.atan2(dy, dx);
                    const spikes = Math.abs(Math.sin(ang * 6.0)) * 5.5 + Math.abs(Math.cos(ang * 11.0)) * 2.5;
                    const rOut = 16.0 + t * 50.0 + spikes * (0.5 + 0.5 * (1.0 - t));
                    const rIn = Math.max(0.0, rOut - thick);

                    const inRing = dist <= rOut && dist >= rIn;
                    const inCore = coreR > 0 && dist <= coreR;
                    if (inRing || inCore) {
                        const idx = y * size + x;
                        body[idx] = 1;
                        if (inCore) isCore[idx] = 1;
                        fracArr[idx] = Math.max(0.0, Math.min(1.0, (dist - rIn) / Math.max(1.0, rOut - rIn)));
                    }
                }
            }

            const rgba = new Uint8ClampedArray(size * size * 4);
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = y * size + x;
                    const p = idx * 4;
                    if (body[idx]) {
                        if (isCore[idx]) {
                            rgba[p] = 255; rgba[p + 1] = 236; rgba[p + 2] = 248; rgba[p + 3] = alphaFade;
                        } else {
                            const f = fracArr[idx];
                            if (f < 0.35) {
                                rgba[p] = 128; rgba[p + 1] = 22; rgba[p + 2] = 82; rgba[p + 3] = alphaFade;
                            } else if (f < 0.72) {
                                rgba[p] = 232; rgba[p + 1] = 52; rgba[p + 2] = 136; rgba[p + 3] = alphaFade;
                            } else {
                                rgba[p] = 255; rgba[p + 1] = 198; rgba[p + 2] = 232; rgba[p + 3] = alphaFade;
                            }
                        }
                    } else {
                        const dil =
                            (y > 0 && body[(y - 1) * size + x]) ||
                            (y + 1 < size && body[(y + 1) * size + x]) ||
                            (x > 0 && body[y * size + (x - 1)]) ||
                            (x + 1 < size && body[y * size + (x + 1)]);
                        if (dil) {
                            rgba[p] = 28; rgba[p + 1] = 10; rgba[p + 2] = 26; rgba[p + 3] = 200;
                        }
                    }
                }
            }
            seq.push(rgbaBufferToScaledCanvas(rgba, size, size, this.scale, STACK_SQUASH));
        }
        return seq;
    }

    _buildCraterDecal() {
        // Grietas radiales pixel-art oscuras e incandescentes dejadas por el Cráter Sísmico (1:1 con slash_vfx.py)
        const size = 112;
        const c = (size - 1) * 0.5;
        const rgba = new Uint8ClampedArray(size * size * 4);
        const rng = mulberry32(505);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dist = Math.hypot(x - c, y - c);
                const p = (y * size + x) * 4;
                if (dist <= 9.0 && dist >= 5.0) {
                    rgba[p] = 168; rgba[p + 1] = 32; rgba[p + 2] = 98; rgba[p + 3] = 195;
                } else if (dist <= 13.0) {
                    rgba[p] = 14; rgba[p + 1] = 10; rgba[p + 2] = 20; rgba[p + 3] = 180;
                }
            }
        }

        for (let k = 0; k < 8; k++) {
            let a = k * (Math.PI / 4.0) + (rng() * 0.36 - 0.18);
            let px = c, py = c;
            for (let step = 0; step < 44; step++) {
                a += rng() * 0.32 - 0.16;
                px += Math.cos(a) * 1.15;
                py += Math.sin(a) * 1.15;
                const ix = Math.round(px), iy = Math.round(py);
                if (ix >= 2 && ix < size - 2 && iy >= 2 && iy < size - 2) {
                    for (let oy = -1; oy <= 1; oy++) {
                        for (let ox = -1; ox <= 1; ox++) {
                            const p = ((iy + oy) * size + (ix + ox)) * 4;
                            rgba[p] = 18; rgba[p + 1] = 12; rgba[p + 2] = 24; rgba[p + 3] = 185;
                        }
                    }
                    const pc = (iy * size + ix) * 4;
                    if (step < 26) {
                        rgba[pc] = 255; rgba[pc + 1] = 76; rgba[pc + 2] = 158; rgba[pc + 3] = 225;
                    } else if (step < 36) {
                        rgba[pc] = 146; rgba[pc + 1] = 28; rgba[pc + 2] = 86; rgba[pc + 3] = 190;
                    }
                }
            }
        }
        return rgbaBufferToScaledCanvas(rgba, size, size, this.scale, STACK_SQUASH);
    }

    _buildMuzzleStar(size, outerRgb, coreRgb) {
        const c = (size - 1) * 0.5;
        const rgba = new Uint8ClampedArray(size * size * 4);
        for (let y = 0; y < size; y++) {
            const dy = Math.abs(y - c);
            for (let x = 0; x < size; x++) {
                const dx = Math.abs(x - c);
                const cross = (dx <= 1.4 && dy <= c * 0.92) || (dy <= 1.4 && dx <= c * 0.92);
                const diag = Math.abs(dx - dy) <= 1.2 && dx <= c * 0.52;
                const center = (dx * dx + dy * dy) <= Math.pow(c * 0.34, 2);
                const body = cross || diag || center;
                if (!body) continue;
                const isCore = center || (dx <= 0.9 && dy <= c * 0.52) || (dy <= 0.9 && dx <= c * 0.52);
                const p = (y * size + x) * 4;
                if (isCore) {
                    rgba[p] = coreRgb[0]; rgba[p + 1] = coreRgb[1]; rgba[p + 2] = coreRgb[2]; rgba[p + 3] = 255;
                } else {
                    rgba[p] = outerRgb[0]; rgba[p + 1] = outerRgb[1]; rgba[p + 2] = outerRgb[2]; rgba[p + 3] = 245;
                }
            }
        }
        return rgbaBufferToScaledCanvas(rgba, size, size, this.scale, 1.0);
    }

    drawSlash(ctx, variant, progress, sx, syLow, syHigh, screenAngleRad) {
        const seq = this.frames[variant] || this.frames.normal_cw;
        const fi = Math.max(0, Math.min(seq.length - 1, Math.floor(progress * seq.length)));
        const baseSurf = seq[fi];
        const drawAt = (sy) => {
            ctx.save();
            ctx.translate(Math.round(sx), Math.round(sy));
            ctx.scale(1.0, STACK_SQUASH);
            ctx.rotate(screenAngleRad);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(baseSurf, -baseSurf.width * 0.5, -baseSurf.height * 0.5);
            ctx.restore();
        };
        drawAt(syLow);
        if (fi <= 4) drawAt(syHigh);
    }

    drawSeismicBlast(ctx, progress, sx, syLow, syHigh) {
        const fi = Math.max(0, Math.min(this.seismicFrames.length - 1, Math.floor(progress * this.seismicFrames.length)));
        const surf = this.seismicFrames[fi];
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(surf, Math.round(sx - surf.width * 0.5), Math.round(syLow - surf.height * 0.5));
        if (fi <= 3) {
            ctx.drawImage(surf, Math.round(sx - surf.width * 0.5), Math.round(syHigh - surf.height * 0.5));
        }
    }

    drawCraterDecal(ctx, sx, sy, alphaRatio) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.0, Math.min(1.0, alphaRatio));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.craterDecal, Math.round(sx - this.craterDecal.width * 0.5), Math.round(sy - this.craterDecal.height * 0.5));
        ctx.restore();
    }

    drawMuzzle(ctx, kind, sx, sy) {
        const surf = kind === 'pierce' ? this.muzzlePierce : (kind === 'grav' ? this.muzzleGrav : this.muzzleCyan);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(surf, Math.round(sx - surf.width * 0.5), Math.round(sy - surf.height * 0.5));
    }
}

// ============================================================================
// 2. ARENA MAP RENDERER (Port 1:1 de src/arena_map.py)
// ============================================================================
export class ArenaMapRendererWeb {
    constructor(scale = ART_SCALE) {
        this.scale = scale;
        this.animTime = 0.0;
        this.octVertices = Array.from({ length: 8 }, (_, k) => [
            Math.cos(Math.PI / 8.0 + k * (Math.PI / 4.0)) * OCT_VERTEX_R,
            Math.sin(Math.PI / 8.0 + k * (Math.PI / 4.0)) * OCT_VERTEX_R
        ]);
        this.lavaTiles = this._bakeLavaTiles();
        this.mapTex = this._bakeCitadelFloor();
    }

    _bakeLavaTiles() {
        const n = 96;
        const tiles = [];
        for (let frame = 0; frame < 2; frame++) {
            const ph = frame * 1.15;
            const rng = mulberry32(303 + frame);
            const rgba = new Uint8ClampedArray(n * n * 4);
            for (let y = 0; y < n; y++) {
                const v = y * (2.0 * Math.PI / n);
                for (let x = 0; x < n; x++) {
                    const u = x * (2.0 * Math.PI / n);
                    const val =
                        Math.sin(u * 2.0 + Math.cos(v * 2.0 + ph)) * 0.42 +
                        Math.cos(v * 3.0 - Math.sin(u * 2.0 - ph * 0.7)) * 0.34 +
                        Math.sin((u + v) * 4.0 + ph) * 0.24;
                    const crack = 1.0 - Math.abs(val);
                    const speck = rng();
                    let r = 16, g = 13, b = 24;
                    if (crack > 0.96) { r = 255; g = 214; b = 96; }
                    else if (crack > 0.90) { r = 242; g = 128; b = 30; }
                    else if (crack > 0.81) { r = 182; g = 58; b = 22; }
                    else if (crack > 0.68) { r = 92; g = 26; b = 22; }
                    else if (crack > 0.44) { r = 34; g = 20; b = 32; }
                    else if (speck > 0.955) { r = 26; g = 22; b = 36; }
                    else if (speck < 0.012) { r = 128; g = 40; b = 24; }
                    const p = (y * n + x) * 4;
                    rgba[p] = r; rgba[p + 1] = g; rgba[p + 2] = b; rgba[p + 3] = 255;
                }
            }
            tiles.push(rgbaBufferToScaledCanvas(rgba, n, n, TEXEL_ART_PX * this.scale, 1.0));
        }
        return tiles;
    }

    _bakeCitadelFloor() {
        const n = TEX_SIZE;
        const c = (n - 1) * 0.5;
        const tileSz = 12;
        const rng = mulberry32(1337);
        const grateAngles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => {
            const rad = (deg * Math.PI) / 180.0;
            return [Math.cos(rad) * 124.0, Math.sin(rad) * 124.0];
        });

        const rgba = new Uint8ClampedArray(n * n * 4);
        for (let yy = 0; yy < n; yy++) {
            const wy = (yy - c) * TEXEL_ART_PX;
            const ay = Math.abs(wy);
            const ty = Math.floor(yy / tileSz);
            const ly = yy % tileSz;

            for (let xx = 0; xx < n; xx++) {
                const wx = (xx - c) * TEXEL_ART_PX;
                const ax = Math.abs(wx);
                const octD = Math.max(Math.max(ax, ay), (ax + ay) * 0.70710678);
                const noise = rng();
                if (octD > OCT_APOTHEM) continue;

                const rad = Math.hypot(wx, wy);
                const tx = Math.floor(xx / tileSz);
                const lx = xx % tileSz;
                const tileHash = ((Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0) & 255;

                let r = 34, g = 39, b = 60;
                if (tileHash < 64) { r = 28; g = 33; b = 52; }
                else if (tileHash > 235) { r = 46; g = 54; b = 80; }
                else if (tileHash > 185) { r = 40; g = 46; b = 70; }

                const mortar = lx === 0 || ly === 0;
                const bevelHi = lx === 1 || ly === 1;
                const bevelLo = lx === tileSz - 1 || ly === tileSz - 1;
                if (bevelHi) { r = 54; g = 64; b = 94; }
                if (bevelLo) { r = 24; g = 28; b = 44; }
                if (mortar) { r = 17; g = 20; b = 34; }
                else if (noise > 0.96) { r = 58; g = 68; b = 98; }
                else if (noise < 0.03) { r = 22; g = 25; b = 40; }

                // 2. Ocho rejillas de forja incandescentes
                for (let gi = 0; gi < grateAngles.length; gi++) {
                    const [gx, gy] = grateAngles[gi];
                    const dx = Math.abs(wx - gx), dy = Math.abs(wy - gy);
                    if (dx <= 18.0 && dy <= 18.0) {
                        r = 56; g = 65; b = 92;
                        if (dx <= 14.0 && dy <= 14.0) {
                            const bars = (yy % 2) === 0;
                            if (bars) { r = 24; g = 26; b = 40; }
                            else if (dx <= 7.0 && dy <= 7.0) { r = 248; g = 134; b = 34; }
                            else { r = 172; g = 58; b = 22; }
                        }
                        break;
                    }
                }

                // 3. Anillos concéntricos
                if (rad >= 88.0 && rad <= 95.0) {
                    if (rad >= 90.0 && rad <= 93.0) { r = 86; g = 102; b = 140; }
                    else { r = 48; g = 56; b = 82; }
                }
                if (rad >= PYLON_RING_RADIUS - 5.0 && rad <= PYLON_RING_RADIUS + 5.0) {
                    if (rad >= PYLON_RING_RADIUS - 2.0 && rad <= PYLON_RING_RADIUS + 2.0) { r = 72; g = 86; b = 122; }
                    else { r = 46; g = 54; b = 78; }
                }

                // 4. Cuatro trincheras de conductos
                const condX = ay <= 8.0 && ax >= 36.0 && ax <= PYLON_RING_RADIUS + 8.0;
                const condXCore = ay <= 3.0 && ax >= 38.0 && ax <= PYLON_RING_RADIUS;
                const condY = ax <= 8.0 && ay >= 36.0 && ay <= PYLON_RING_RADIUS + 8.0;
                const condYCore = ax <= 3.0 && ay >= 38.0 && ay <= PYLON_RING_RADIUS;
                if (condX || condY) { r = 68; g = 78; b = 108; }
                if (condXCore || condYCore) { r = 146; g = 64; b = 34; }
                const ribsX = condX && (Math.floor(ax) % 26) < 4;
                const ribsY = condY && (Math.floor(ay) % 26) < 4;
                if (ribsX || ribsY) { r = 128; g = 146; b = 184; }

                // 5. Altar Central
                if (octD <= 46.0 && rad <= 48.0) { r = 92; g = 106; b = 144; }
                if (octD <= 40.0) { r = 34; g = 38; b = 58; }
                if (rad >= 31.0 && rad <= 35.0) { r = 194; g = 134; b = 32; }
                if (rad <= 20.0) {
                    if (((xx + yy) % 3) === 0) { r = 255; g = 136; b = 32; }
                    else { r = 24; g = 26; b = 40; }
                }
                if (rad <= 8.0) { r = 255; g = 224; b = 118; }

                // 6. Parapeto exterior fortificado
                if (octD >= OCT_APOTHEM - 16.0) {
                    const stripe = (Math.floor((xx + yy) / 5.0) % 2) === 0;
                    if (octD >= OCT_APOTHEM - 2.0) { r = 12; g = 13; b = 22; }
                    else if (octD >= OCT_APOTHEM - 5.0) { r = 76; g = 88; b = 124; }
                    else if (stripe) { r = 168; g = 92; b = 26; }
                    else { r = 24; g = 27; b = 42; }
                } else if (octD >= OCT_APOTHEM - 18.0 && octD < OCT_APOTHEM - 15.0) {
                    r = 108; g = 124; b = 166;
                }

                const p = (yy * n + xx) * 4;
                rgba[p] = r; rgba[p + 1] = g; rgba[p + 2] = b; rgba[p + 3] = 255;
            }
        }
        return rgbaBufferToScaledCanvas(rgba, n, n, TEXEL_ART_PX * this.scale, 1.0);
    }

    drawBackdropAndArena(ctx, cam, dt, viewW, viewH) {
        this.animTime += Math.max(0.0, dt || 0.0);

        // 1. Caldera de Magma Animada (2 capas que alternan a 1.4 Hz)
        const tileIdx = ((Math.floor(this.animTime * 1.4) % this.lavaTiles.length) + this.lavaTiles.length) % this.lavaTiles.length;
        const tile0 = this.lavaTiles[tileIdx] || this.lavaTiles[0];
        const tw = tile0.width, th = tile0.height;
        const ox = ((Math.floor(-cam.camX * 0.45 * this.scale + this.animTime * 14.0) % tw) + tw) % tw;
        const oy = ((Math.floor(-cam.camY * 0.45 * this.scale * STACK_SQUASH + this.animTime * 9.0) % th) + th) % th;

        ctx.imageSmoothingEnabled = false;
        for (let tx = ox - tw; tx < viewW + tw; tx += tw) {
            for (let ty = oy - th; ty < viewH + th; ty += th) {
                ctx.drawImage(tile0, tx, ty);
            }
        }

        // Sombra atmosférica debajo de la plataforma flotante
        const shCenter = cam.worldToScreen(0.0, 0.0, -24.0);
        const shadowR = Math.round((OCT_APOTHEM + 26.0) * this.scale);
        const shadowH = Math.round(shadowR * STACK_SQUASH);
        ctx.fillStyle = 'rgba(6, 5, 12, 0.65)';
        ctx.beginPath();
        ctx.ellipse(shCenter.sx, shCenter.sy, shadowR, shadowH, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Acantilado 3D Extruido bajo los bordes frontales del octágono
        const topPts = this.octVertices.map(([vx, vy]) => cam.worldToScreen(vx, vy, 0.0));
        const midPts = this.octVertices.map(([vx, vy]) => cam.worldToScreen(vx, vy, -9.0));
        const botPts = this.octVertices.map(([vx, vy]) => cam.worldToScreen(vx, vy, -21.0));

        for (let i = 0; i < 8; i++) {
            const j = (i + 1) % 8;
            const p0t = topPts[i], p1t = topPts[j];
            if (p1t.sx < p0t.sx) {
                const edgeDx = p0t.sx - p1t.sx;
                const edgeDy = p1t.sy - p0t.sy;
                const shade = edgeDy > 0 ? 1.0 : 0.72;
                const p0m = midPts[i], p1m = midPts[j];
                const p0b = botPts[i], p1b = botPts[j];

                ctx.fillStyle = `rgb(${Math.floor(44 * shade)}, ${Math.floor(50 * shade)}, ${Math.floor(76 * shade)})`;
                ctx.beginPath();
                ctx.moveTo(p0t.sx, p0t.sy); ctx.lineTo(p1t.sx, p1t.sy);
                ctx.lineTo(p1m.sx, p1m.sy); ctx.lineTo(p0m.sx, p0m.sy);
                ctx.closePath(); ctx.fill();

                ctx.fillStyle = `rgb(${Math.floor(26 * shade)}, ${Math.floor(28 * shade)}, ${Math.floor(46 * shade)})`;
                ctx.beginPath();
                ctx.moveTo(p0m.sx, p0m.sy); ctx.lineTo(p1m.sx, p1m.sy);
                ctx.lineTo(p1b.sx, p1b.sy); ctx.lineTo(p0b.sx, p0b.sy);
                ctx.closePath(); ctx.fill();

                // Veta brillante de magma bajando por el acantilado
                const mxTop = (p0t.sx + p1t.sx) * 0.5, myTop = (p0t.sy + p1t.sy) * 0.5;
                const mxBot = (p0b.sx + p1b.sx) * 0.5, myBot = (p0b.sy + p1b.sy) * 0.5;
                ctx.strokeStyle = 'rgb(218, 84, 28)';
                ctx.lineWidth = Math.max(2, Math.floor(edgeDx * 0.02));
                ctx.beginPath();
                ctx.moveTo(mxTop, myTop + 4);
                ctx.lineTo(mxBot, myBot - 2);
                ctx.stroke();

                // Costura vertical de refuerzo entre estratos
                ctx.strokeStyle = 'rgb(12, 13, 22)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(p0t.sx, p0t.sy);
                ctx.lineTo(p0b.sx, p0b.sy);
                ctx.stroke();
            }
        }

        // 3. Plataforma Principal Pixel-Art Rotable y Comprimida
        const cTop = cam.worldToScreen(0.0, 0.0, 0.0);
        ctx.save();
        ctx.translate(Math.round(cTop.sx), Math.round(cTop.sy));
        ctx.scale(1.0, STACK_SQUASH);
        ctx.rotate(cam.yaw);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.mapTex, -this.mapTex.width * 0.5, -this.mapTex.height * 0.5);
        ctx.restore();
    }
}

// ============================================================================
// 3. SPRITE STACKING LIBRARY + LIVE SLICES + BAYER SHADOW (Port 1:1 de stack_renderer.py)
// ============================================================================
const BAYER_4X4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
];

export function bakeStackModelWeb(img, sliceCount, scale = ART_SCALE) {
    const totalW = img.width;
    const h = img.height;
    const w = Math.floor(totalW / sliceCount);

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = totalW;
    srcCanvas.height = h;
    const sctx = srcCanvas.getContext('2d');
    sctx.drawImage(img, 0, 0);
    const srcData = sctx.getImageData(0, 0, totalW, h).data;

    // Extraer top_colors promedio por capa para escombros VoxelDebris (igual que en stack_renderer.py)
    const topColors = [];
    for (let z = 0; z < sliceCount; z++) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const xOff = z * w;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * totalW + (xOff + x)) * 4;
                if (srcData[idx + 3] > 0) {
                    rSum += srcData[idx];
                    gSum += srcData[idx + 1];
                    bSum += srcData[idx + 2];
                    count++;
                }
            }
        }
        if (count > 0) {
            topColors.push(`rgb(${Math.floor(rSum / count)}, ${Math.floor(gSum / count)}, ${Math.floor(bSum / count)})`);
        } else {
            topColors.push('rgb(180, 180, 200)');
        }
    }

    let diag = Math.ceil(Math.hypot(w, h)) + 2;
    if (diag % 2 !== w % 2) diag += 1;
    const padW = diag;
    let squashedH = Math.max(4, Math.ceil(padW * STACK_SQUASH) + 2);
    if (squashedH % 2 !== padW % 2) squashedH += 1;

    const cxSrc = (w - 1) * 0.5;
    const cySrc = (h - 1) * 0.5;
    const cxDst = (padW - 1) * 0.5;
    const cyDst = (squashedH - 1) * 0.5;

    const liftMax = Math.round((sliceCount - 1) * STACK_SPACING);
    const outW = padW + 2;
    const outH = squashedH + liftMax + 2;

    const frames = new Array(ANGLE_STEPS);
    const flashFrames = new Array(ANGLE_STEPS);
    const rotSlicesRaw = new Array(ANGLE_STEPS);
    const footprintAngle0 = new Uint8Array(padW * squashedH);

    for (let a = 0; a < ANGLE_STEPS; a++) {
        const ang = a * (2.0 * Math.PI / ANGLE_STEPS);
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        const comp = new Uint8ClampedArray(outW * outH * 4);
        const angleSlices = new Array(sliceCount);

        // Precalcular mapa de coordenadas rotadas para este ángulo
        const mapSx = new Int32Array(padW * squashedH);
        const mapSy = new Int32Array(padW * squashedH);
        for (let py = 0; py < squashedH; py++) {
            const dy = (py - cyDst) / STACK_SQUASH;
            for (let px = 0; px < padW; px++) {
                const dx = px - cxDst;
                mapSx[py * padW + px] = Math.round(dx * cosA + dy * sinA + cxSrc);
                mapSy[py * padW + px] = Math.round(-dx * sinA + dy * cosA + cySrc);
            }
        }

        for (let z = 0; z < sliceCount; z++) {
            const lift = Math.round(z * STACK_SPACING);
            const yTop = 1 + (liftMax - lift);
            const xOff = z * w;
            const sliceBuf = new Uint8ClampedArray(padW * squashedH * 4);

            for (let py = 0; py < squashedH; py++) {
                const rowOff = py * padW;
                for (let px = 0; px < padW; px++) {
                    const mIdx = rowOff + px;
                    const sx = mapSx[mIdx];
                    const sy = mapSy[mIdx];
                    if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                        const sIdx = (sy * totalW + (xOff + sx)) * 4;
                        const alpha = srcData[sIdx + 3];
                        if (alpha > 0) {
                            const r = srcData[sIdx], g = srcData[sIdx + 1], b = srcData[sIdx + 2];
                            const slP = mIdx * 4;
                            sliceBuf[slP] = r; sliceBuf[slP + 1] = g; sliceBuf[slP + 2] = b; sliceBuf[slP + 3] = alpha;

                            const dIdx = ((yTop + py) * outW + (1 + px)) * 4;
                            comp[dIdx] = r; comp[dIdx + 1] = g; comp[dIdx + 2] = b; comp[dIdx + 3] = alpha;

                            if (a === 0 && z < Math.min(sliceCount, 6)) {
                                footprintAngle0[mIdx] = 1;
                            }
                        }
                    }
                }
            }
            angleSlices[z] = sliceBuf;
        }
        rotSlicesRaw[a] = angleSlices;

        // Dilatación 4-conexa de 1px para contorno exterior único (10, 11, 18, 255) + flashFrame
        const outlined = new Uint8ClampedArray(comp);
        const flash = new Uint8ClampedArray(outW * outH * 4);
        for (let y = 0; y < outH; y++) {
            for (let x = 0; x < outW; x++) {
                const idx = (y * outW + x) * 4;
                if (comp[idx + 3] > 0) {
                    flash[idx] = 255; flash[idx + 1] = 244; flash[idx + 2] = 218; flash[idx + 3] = 255;
                } else {
                    const hasN =
                        (y > 0 && comp[((y - 1) * outW + x) * 4 + 3] > 0) ||
                        (y + 1 < outH && comp[((y + 1) * outW + x) * 4 + 3] > 0) ||
                        (x > 0 && comp[(y * outW + (x - 1)) * 4 + 3] > 0) ||
                        (x + 1 < outW && comp[(y * outW + (x + 1)) * 4 + 3] > 0);
                    if (hasN) {
                        outlined[idx] = 10; outlined[idx + 1] = 11; outlined[idx + 2] = 18; outlined[idx + 3] = 255;
                        flash[idx] = 10; flash[idx + 1] = 11; flash[idx + 2] = 18; flash[idx + 3] = 255;
                    }
                }
            }
        }

        frames[a] = rgbaBufferToScaledCanvas(outlined, outW, outH, scale, 1.0);
        flashFrames[a] = rgbaBufferToScaledCanvas(flash, outW, outH, scale, 1.0);
    }

    // Sombra Dithered Bayer 4x4 idéntica a stack_renderer.py (líneas 167-185)
    const shRgba = new Uint8ClampedArray(padW * squashedH * 4);
    for (let y = 0; y < squashedH; y++) {
        for (let x = 0; x < padW; x++) {
            const idx = y * padW + x;
            if (!footprintAngle0[idx]) continue;
            const inner =
                y > 0 && footprintAngle0[(y - 1) * padW + x] &&
                y + 1 < squashedH && footprintAngle0[(y + 1) * padW + x] &&
                x > 0 && footprintAngle0[y * padW + (x - 1)] &&
                x + 1 < padW && footprintAngle0[y * padW + (x + 1)];
            const p = idx * 4;
            if (inner) {
                shRgba[p] = 6; shRgba[p + 1] = 7; shRgba[p + 2] = 14; shRgba[p + 3] = 135;
            } else if (BAYER_4X4[y % 4][x % 4] < 9) {
                shRgba[p] = 6; shRgba[p + 1] = 7; shRgba[p + 2] = 14; shRgba[p + 3] = 95;
            }
        }
    }
    const shadowSurf = rgbaBufferToScaledCanvas(shRgba, padW, squashedH, scale, 1.0);

    return {
        slices: sliceCount,
        padW,
        squashedH,
        stackH: outH,
        scale,
        groundAnchorX: Math.round((1.0 + cxDst + 0.5) * scale),
        groundAnchorY: Math.round((1.0 + liftMax + cyDst + 0.5) * scale),
        sliceAnchorX: Math.round((cxDst + 0.5) * scale),
        sliceAnchorY: Math.round((cyDst + 0.5) * scale),
        frames,
        flashFrames,
        rotSlicesRaw,
        sliceCache: {},
        topColors,
        shadowSurf
    };
}

export function drawBakedModelWeb(ctx, model, sx, sy, turnRad, wz = 0.0, flash = false, drawShadow = true) {
    if (!model) return;
    const norm = (((turnRad % (2.0 * Math.PI)) + 2.0 * Math.PI) % (2.0 * Math.PI)) / (2.0 * Math.PI);
    const idx = Math.round(norm * ANGLE_STEPS) % ANGLE_STEPS;
    ctx.imageSmoothingEnabled = false;

    if (drawShadow) {
        const shX = Math.round(sx + 2.0 * model.scale) - model.sliceAnchorX;
        const shY = Math.round(sy + 2.0 * model.scale) - model.sliceAnchorY;
        ctx.drawImage(model.shadowSurf, shX, shY);
    }

    const liftPx = wz * STACK_SPACING * model.scale;
    const frame = flash ? model.flashFrames[idx] : model.frames[idx];
    const bx = Math.round(sx) - model.groundAnchorX;
    const by = Math.round(sy - liftPx) - model.groundAnchorY;
    ctx.drawImage(frame, bx, by);
}

export function drawSlicedLiveModelWeb(
    ctx,
    model,
    sx,
    sy,
    turnRad,
    wz = 0.0,
    zScale = 1.0,
    revealProgress = 1.0,
    swayPx = 0.0,
    swayPhase = 0.0,
    drawShadow = true
) {
    if (!model) return;
    const norm = (((turnRad % (2.0 * Math.PI)) + 2.0 * Math.PI) % (2.0 * Math.PI)) / (2.0 * Math.PI);
    const idx = Math.round(norm * ANGLE_STEPS) % ANGLE_STEPS;

    let slices = model.sliceCache[idx];
    if (!slices) {
        slices = model.rotSlicesRaw[idx].map((buf) =>
            rgbaBufferToScaledCanvas(buf, model.padW, model.squashedH, model.scale, 1.0)
        );
        model.sliceCache[idx] = slices;
    }

    const count = model.slices;
    ctx.imageSmoothingEnabled = false;
    if (drawShadow && revealProgress > 0.15) {
        const shX = Math.round(sx + 2.0 * model.scale) - model.sliceAnchorX;
        const shY = Math.round(sy + 2.0 * model.scale) - model.sliceAnchorY;
        ctx.drawImage(model.shadowSurf, shX, shY);
    }

    const blendW = 4.0;
    const frontier = revealProgress * (count + blendW);
    const baseLift = wz * STACK_SPACING * model.scale;
    const stepPx = STACK_SPACING * model.scale * zScale;
    const denom = Math.max(1.0, count - 1);

    for (let z = 0; z < count; z++) {
        let zEff = z;
        if (revealProgress < 1.0) {
            const localT = Math.max(0.0, Math.min(1.0, (frontier - z) / blendW));
            if (localT <= 0.01) continue;
            const ease = 1.0 - Math.pow(1.0 - localT, 3);
            zEff = z * ease;
        }
        const ratio = z / denom;
        const ox = Math.sin(swayPhase - z * 0.22) * swayPx * (ratio * ratio);
        const lx = Math.round(sx + ox) - model.sliceAnchorX;
        const ly = Math.round(sy - baseLift - zEff * stepPx) - model.sliceAnchorY;
        ctx.drawImage(slices[z], lx, ly);
    }
}

// ============================================================================
// 4. AUDIO ENGINE PCM PROCEDURAL (Port 1:1 de src/audio_engine.py)
// ============================================================================
function midiToHz(note) {
    return 440.0 * Math.pow(2.0, (note - 69.0) / 12.0);
}

function envAdsr(n, sampleRate, attack, decay, sustainLvl, release) {
    const aN = Math.max(1, Math.floor(attack * sampleRate));
    const dN = Math.max(1, Math.floor(decay * sampleRate));
    const rN = Math.max(1, Math.floor(release * sampleRate));
    const sN = Math.max(0, n - aN - dN - rN);
    const out = new Float32Array(n);
    let idx = 0;
    for (let i = 0; i < aN && idx < n; i++, idx++) out[idx] = i / aN;
    for (let i = 0; i < dN && idx < n; i++, idx++) out[idx] = 1.0 + (sustainLvl - 1.0) * (i / dN);
    for (let i = 0; i < sN && idx < n; i++, idx++) out[idx] = sustainLvl;
    const rem = Math.max(1, n - idx);
    for (let i = 0; idx < n; i++, idx++) out[idx] = sustainLvl * (1.0 - i / rem);
    return out;
}

export class AudioEngineWeb {
    constructor() {
        this.ctx = null;
        this.masterSlider = 0.85;
        this.musicSlider = 0.70;
        this.sfxSlider = 0.85;
        this._duckDb = 0.0;
        this._targetCombatLayer = 0.0;
        this._targetHypeLayer = 0.0;
        this._combatLayer = 0.0;
        this._hypeLayer = 0.0;
        this.sfxPools = {};
        this._lastVariant = {};
        this.musicGains = [];
        this.musicSources = [];
        this._built = false;
    }

    unlock() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        if (!this._built && this.ctx) {
            this._built = true;
            this._buildSfxPools();
            this._buildAndStartMusicStems();
        }
    }

    _makeBuffer(monoFloat) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, monoFloat.length, sr);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < monoFloat.length; i++) {
            ch[i] = Math.max(-0.95, Math.min(0.95, monoFloat[i]));
        }
        return buf;
    }

    _buildSfxPools() {
        const sr = this.ctx.sampleRate;
        const rng = mulberry32(4204);

        // 1. Cizalla Térmica (melee)
        this.sfxPools.melee = [-1.2, 0.0, 1.3].map((semi) => {
            const dur = 0.17, n = Math.floor(dur * sr), out = new Float32Array(n);
            const mult = Math.pow(2.0, semi / 12.0);
            let phase = 0, runNoise = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                const f = (520.0 * mult) * Math.exp(-t * 9.5) + 95.0;
                phase += (2.0 * Math.PI * f) / sr;
                runNoise = runNoise * 0.75 + (rng() * 2 - 1) * 0.25;
                out[i] = (0.52 * Math.tanh(Math.sin(phase) * 2.2) + 0.48 * runNoise) * Math.exp(-t * 14.0) * 0.58;
            }
            return this._makeBuffer(out);
        });

        // 2. Aguja de Riel (ranged)
        this.sfxPools.ranged = [-0.9, 0.0, 1.1].map((semi) => {
            const dur = 0.13, n = Math.floor(dur * sr), out = new Float32Array(n);
            const mult = Math.pow(2.0, semi / 12.0);
            let ph = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                const f = (1450.0 * mult) * Math.exp(-t * 24.0) + 140.0;
                ph += (2.0 * Math.PI * f) / sr;
                const fm = Math.sin(ph + 1.8 * Math.sin(ph * 2.0));
                const click = (rng() * 2 - 1) * Math.exp(-t * 70.0);
                out[i] = (0.68 * fm + 0.32 * click) * Math.exp(-t * 19.0) * 0.46;
            }
            return this._makeBuffer(out);
        });

        // 2b. Tiro perforante (ranged_pierce)
        {
            const dur = 0.24, n = Math.floor(dur * sr), out = new Float32Array(n);
            let ph = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                const f = 2100.0 * Math.exp(-t * 14.0) + 180.0;
                ph += (2.0 * Math.PI * f) / sr;
                const s = Math.sin(ph * 0.5) >= 0 ? 1.0 : -1.0;
                out[i] = (0.6 * Math.sin(ph) + 0.4 * s) * Math.exp(-t * 10.5) * 0.55;
            }
            this.sfxPools.ranged_pierce = [this._makeBuffer(out)];
        }

        // 3. Lanzamiento y Explosión Sísmica (aoe_throw, aoe_boom)
        {
            const dur = 0.16, n = Math.floor(dur * sr), out = new Float32Array(n);
            let ph = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                ph += (2.0 * Math.PI * (240.0 + 380.0 * t)) / sr;
                out[i] = Math.sin(ph) * Math.exp(-t * 11.0) * 0.42;
            }
            this.sfxPools.aoe_throw = [this._makeBuffer(out)];
        }
        this.sfxPools.aoe_boom = [-1.0, 0.0, 1.0].map((semi) => {
            const dur = 0.42, n = Math.floor(dur * sr), out = new Float32Array(n);
            const mult = Math.pow(2.0, semi / 12.0);
            let ph = 0, rumble = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                const subF = (155.0 * mult) * Math.exp(-t * 7.2) + 38.0;
                ph += (2.0 * Math.PI * subF) / sr;
                rumble = rumble * 0.88 + (rng() * 2 - 1) * 0.12;
                const shatter = Math.sin(2.0 * Math.PI * 880.0 * mult * t) * Math.exp(-t * 28.0);
                out[i] = (0.62 * Math.tanh(Math.sin(ph) * 2.5) + 0.32 * rumble + 0.22 * shatter) * Math.exp(-t * 5.8) * 0.68;
            }
            return this._makeBuffer(out);
        });

        // 4. Impacto (hit)
        this.sfxPools.hit = [-1.5, 0.0, 1.6].map((semi) => {
            const dur = 0.085, n = Math.floor(dur * sr), out = new Float32Array(n);
            const mult = Math.pow(2.0, semi / 12.0);
            let ph = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                ph += (2.0 * Math.PI * ((410.0 * mult) * Math.exp(-t * 32.0) + 90.0)) / sr;
                out[i] = Math.tanh(Math.sin(ph) * 2.0) * Math.exp(-t * 28.0) * 0.42;
            }
            return this._makeBuffer(out);
        });

        // 5. Fusión dual (fusion)
        {
            const dur = 0.28, n = Math.floor(dur * sr), out = new Float32Array(n);
            const f1 = midiToHz(64), f2 = midiToHz(71), f3 = midiToHz(76);
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                const chord = (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t) + 0.6 * Math.sin(2 * Math.PI * f3 * t)) / 2.6;
                out[i] = chord * Math.exp(-t * 8.5) * 0.56;
            }
            this.sfxPools.fusion = [this._makeBuffer(out)];
        }

        // 6. Cataclismo Triádico (cataclysm)
        {
            const dur = 0.58, n = Math.floor(dur * sr), out = new Float32Array(n);
            let phArp = 0, phSub = 0;
            const f86 = midiToHz(86);
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                const arpF = t < 0.09 ? midiToHz(62) : (t < 0.18 ? midiToHz(69) : midiToHz(74));
                phArp += (2 * Math.PI * arpF) / sr;
                phSub += (2 * Math.PI * (130.0 * Math.exp(-t * 5.0) + 42.0)) / sr;
                const shimmer = Math.sin(2 * Math.PI * f86 * t) * Math.exp(-t * 6.0);
                out[i] = (0.48 * Math.tanh(Math.sin(phArp) * 1.8) + 0.42 * Math.sin(phSub) + 0.25 * shimmer) * Math.exp(-t * 3.8) * 0.72;
            }
            this.sfxPools.cataclysm = [this._makeBuffer(out)];
        }

        // 7. pylon_sync, pylon_fail, dash, hurt, pickup, ui_move, ui_ok, wave_horn
        {
            const dur = 0.36, n = Math.floor(dur * sr), out = new Float32Array(n);
            let ph = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                const f = t < 0.08 ? midiToHz(67) : (t < 0.16 ? midiToHz(71) : midiToHz(79));
                ph += (2 * Math.PI * f) / sr;
                out[i] = Math.sin(ph) * Math.exp(-t * 5.5) * 0.55;
            }
            this.sfxPools.pylon_sync = [this._makeBuffer(out)];
        }
        {
            const dur = 0.34, n = Math.floor(dur * sr), out = new Float32Array(n);
            let ph = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                ph += (2 * Math.PI * (340.0 - 140.0 * t)) / sr;
                out[i] = Math.tanh(Math.sin(ph) * 2.5) * Math.exp(-t * 4.5) * 0.50;
            }
            this.sfxPools.pylon_fail = [this._makeBuffer(out)];
        }
        {
            const dur = 0.15, n = Math.floor(dur * sr), out = new Float32Array(n);
            let ph = 0, w = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                w = w * 0.8 + (rng() * 2 - 1) * 0.2;
                ph += (2 * Math.PI * (320.0 + 420.0 * t)) / sr;
                out[i] = (0.55 * w + 0.45 * Math.sin(ph)) * Math.exp(-t * 13.0) * 0.46;
            }
            this.sfxPools.dash = [this._makeBuffer(out)];
        }
        {
            const dur = 0.26, n = Math.floor(dur * sr), out = new Float32Array(n);
            let ph = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                ph += (2 * Math.PI * (190.0 * Math.exp(-t * 8.0) + 52.0)) / sr;
                out[i] = Math.tanh(Math.sin(ph) * 3.0) * Math.exp(-t * 7.0) * 0.62;
            }
            this.sfxPools.hurt = [this._makeBuffer(out)];
        }
        {
            const dur = 0.11, n = Math.floor(dur * sr), out = new Float32Array(n);
            let ph = 0;
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                ph += (2 * Math.PI * (t < 0.05 ? 780.0 : 1170.0)) / sr;
                out[i] = Math.sin(ph) * Math.exp(-t * 15.0) * 0.36;
            }
            this.sfxPools.pickup = [this._makeBuffer(out)];
        }
        {
            const dur = 0.055, n = Math.floor(dur * sr), outM = new Float32Array(n), outO = new Float32Array(n);
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                outM[i] = Math.sin(2 * Math.PI * 620.0 * t) * Math.exp(-t * 36.0) * 0.28;
                outO[i] = Math.sin(2 * Math.PI * 920.0 * t) * Math.exp(-t * 28.0) * 0.36;
            }
            this.sfxPools.ui_move = [this._makeBuffer(outM)];
            this.sfxPools.ui_ok = [this._makeBuffer(outO)];
        }
        {
            const dur = 0.65, n = Math.floor(dur * sr), out = new Float32Array(n);
            const env = envAdsr(n, sr, 0.06, 0.15, 0.65, 0.25);
            const f38 = midiToHz(38), f50 = midiToHz(50);
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                const brass = 0.6 * Math.tanh(Math.sin(2 * Math.PI * f38 * t) * 2.6) + 0.4 * Math.tanh(Math.sin(2 * Math.PI * f50 * t) * 2.2);
                out[i] = brass * env[i] * 0.55;
            }
            this.sfxPools.wave_horn = [this._makeBuffer(out)];
        }
    }

    _buildAndStartMusicStems() {
        // 3 capas verticales de 8 compases exactos a 128 BPM (15.0 s, Re menor dórico)
        const sr = this.ctx.sampleRate;
        const bpm = 128.0;
        const stepSec = (60.0 / bpm) / 4.0;
        const totalSteps = 128;
        const stepSamples = Math.round(stepSec * sr);
        const totalSamples = stepSamples * totalSteps;

        const stemBase = new Float32Array(totalSamples);
        const stemDrive = new Float32Array(totalSamples);
        const stemHype = new Float32Array(totalSamples);
        const rng = mulberry32(9001);

        const bassRoots = [38, 38, 34, 31, 33, 38, 41, 36];
        const arpChords = [
            [50, 53, 57, 62],
            [50, 55, 57, 62],
            [46, 50, 53, 58],
            [43, 46, 50, 55],
            [45, 49, 52, 57],
            [50, 53, 57, 62],
            [53, 57, 60, 65],
            [48, 52, 55, 61]
        ];
        const leadMelody = [
            62, -1, 65, 64, 62, -1, 57, -1, 60, -1, 62, -1, 65, -1, 69, -1,
            70, -1, 69, 65, 67, -1, 62, -1, 64, -1, 61, -1, 57, -1, -1, -1
        ];

        const kickWave = new Float32Array(stepSamples);
        let kPh = 0;
        for (let i = 0; i < stepSamples; i++) {
            const t = i / sr;
            kPh += (2 * Math.PI * (145.0 * Math.exp(-t * 28.0) + 44.0)) / sr;
            kickWave[i] = Math.sin(kPh) * Math.exp(-t * 22.0);
        }

        const snareN = Math.min(totalSamples, Math.floor(stepSamples * 1.5));
        const snareWave = new Float32Array(snareN);
        for (let i = 0; i < snareN; i++) {
            const t = i / sr;
            snareWave[i] = 0.7 * (rng() * 2 - 1) * Math.exp(-t * 24.0) + 0.3 * Math.sin(2 * Math.PI * 195.0 * t) * Math.exp(-t * 30.0);
        }

        for (let step = 0; step < totalSteps; step++) {
            const s0 = step * stepSamples;
            const bar = Math.floor(step / 16);
            const inBar = step % 16;

            if (inBar === 0 || inBar === 4 || inBar === 8 || inBar === 12) {
                for (let i = 0; i < stepSamples; i++) stemBase[s0 + i] += kickWave[i] * 0.48;
            }

            const root = bassRoots[bar];
            const noteB = root + ((inBar === 2 || inBar === 6 || inBar === 10 || inBar === 14) ? 12 : 0);
            const freqB = midiToHz(noteB);
            const arpNote = arpChords[bar][step % 4];
            const fArp = midiToHz(arpNote);

            for (let i = 0; i < stepSamples; i++) {
                const t = i / sr;
                const saw = 2.0 * ((freqB * t) % 1.0) - 1.0;
                const sub = Math.sin(2 * Math.PI * (freqB * 0.5) * t);
                stemBase[s0 + i] += (0.20 * Math.tanh(saw * 1.6) + 0.24 * sub) * Math.exp(-t * 11.0);

                if (inBar % 2 === 1) {
                    stemDrive[s0 + i] += (rng() * 2 - 1) * Math.exp(-t * 58.0) * 0.12;
                }
                const arpSig = Math.sin(2 * Math.PI * fArp * t + 1.1 * Math.sin(2 * Math.PI * fArp * 2.0 * t));
                stemDrive[s0 + i] += arpSig * Math.exp(-t * 14.0) * 0.17;

                stemHype[s0 + i] += (rng() * 2 - 1) * Math.exp(-t * 72.0) * 0.08;
            }

            if (inBar === 4 || inBar === 12) {
                const endSn = Math.min(totalSamples, s0 + snareN);
                for (let i = s0; i < endSn; i++) stemDrive[i] += snareWave[i - s0] * 0.34;
            }

            const mel = leadMelody[step % leadMelody.length];
            if (mel > 0) {
                const leadLen = Math.min(totalSamples - s0, stepSamples * 2);
                const env = envAdsr(leadLen, sr, 0.01, 0.06, 0.55, 0.06);
                const fl = midiToHz(mel);
                let phL = 0;
                for (let i = 0; i < leadLen; i++) {
                    const tl = i / sr;
                    const vibrato = 1.0 + 0.004 * Math.sin(2 * Math.PI * 6.0 * tl);
                    phL += (2 * Math.PI * (fl * vibrato)) / sr;
                    const leadW = (0.65 * Math.tanh(Math.sin(phL) * 2.0) + 0.35 * Math.sin(phL * 0.5)) * env[i];
                    stemHype[s0 + i] += leadW * 0.22;
                }
            }
        }

        for (let i = 0; i < totalSamples; i++) {
            stemBase[i] *= 0.72;
            stemDrive[i] *= 0.70;
            stemHype[i] *= 0.68;
        }

        const bufs = [this._makeBuffer(stemBase), this._makeBuffer(stemDrive), this._makeBuffer(stemHype)];
        const startAt = this.ctx.currentTime + 0.02;
        bufs.forEach((b) => {
            const src = this.ctx.createBufferSource();
            src.buffer = b;
            src.loop = true;
            const g = this.ctx.createGain();
            g.gain.value = 0.0;
            src.connect(g);
            g.connect(this.ctx.destination);
            src.start(startAt);
            this.musicSources.push(src);
            this.musicGains.push(g);
        });
        this._refreshMusicVolumes();
    }

    _perceptualGain(slider01) {
        const s = Math.max(0.0, Math.min(1.0, slider01));
        return s <= 0.001 ? 0.0 : s * s;
    }

    setMusicIntensity(combatActive, hypeActive) {
        this._targetCombatLayer = combatActive ? 1.0 : 0.12;
        this._targetHypeLayer = hypeActive ? 1.0 : 0.0;
    }

    triggerDuck(dbDip = -6.0) {
        this._duckDb = Math.min(this._duckDb, dbDip);
    }

    update(dt) {
        if (!this.ctx || !this._built) return;
        if (this._duckDb < 0.0) {
            this._duckDb = Math.min(0.0, this._duckDb + 18.0 * dt);
        }
        const rate = 1.0 - Math.exp(-2.2 * dt);
        this._combatLayer += (this._targetCombatLayer - this._combatLayer) * rate;
        this._hypeLayer += (this._targetHypeLayer - this._hypeLayer) * rate;
        this._refreshMusicVolumes();
    }

    _refreshMusicVolumes() {
        if (this.musicGains.length < 3 || !this.ctx) return;
        const baseBus = this._perceptualGain(this.masterSlider) * this._perceptualGain(this.musicSlider);
        const duckLin = Math.pow(10.0, this._duckDb / 20.0);
        const eff = baseBus * duckLin;
        this.musicGains[0].gain.value = eff;
        this.musicGains[1].gain.value = eff * this._combatLayer;
        this.musicGains[2].gain.value = eff * this._hypeLayer;
    }

    playSfx(name, volumeScale = 1.0, duck = 0.0) {
        if (!this.ctx) this.unlock();
        if (!this.ctx || !this._built) return;
        const pool = this.sfxPools[name];
        if (!pool || pool.length === 0) return;

        const busGain = this._perceptualGain(this.masterSlider) * this._perceptualGain(this.sfxSlider);
        if (busGain <= 0.0) return;

        let idx = 0;
        if (pool.length > 1) {
            const last = this._lastVariant[name] ?? -1;
            const choices = [];
            for (let i = 0; i < pool.length; i++) if (i !== last) choices.push(i);
            idx = choices[Math.floor(Math.random() * choices.length)];
            this._lastVariant[name] = idx;
        }

        const src = this.ctx.createBufferSource();
        src.buffer = pool[idx];
        const g = this.ctx.createGain();
        g.gain.value = Math.max(0.0, Math.min(1.0, busGain * volumeScale));
        src.connect(g);
        g.connect(this.ctx.destination);
        src.start();

        if (duck < 0.0) {
            this.triggerDuck(duck);
        }
    }

    destroy() {
        try {
            this.musicSources.forEach((s) => {
                try {
                    s.stop();
                } catch {
                    // Ignorar fuente ya detenida
                }
            });
            if (this.ctx) this.ctx.close().catch(() => {});
        } catch {
            // Ignorar cierre de contexto
        }
        this.ctx = null;
    }
}
