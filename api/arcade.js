import fs from 'fs';
import os from 'os';
import path from 'path';

const DB_FILE = path.join(os.tmpdir(), 'phantombyte_arcade_db_v3.json');

// Claves de almacenamiento en la nube (Primaria + Réplica de respaldo) para persistencia global en Vercel
const CLOUD_KV_BASE = 'https://keyvalue.immanuel.co/api/KeyVal';
const CLOUD_APP_KEYS = ['uv66728x', 'fyjfah9y'];
const LB_CHUNK_COUNT = 7; // 7 bloques x 3 pilotos = Top 21 global
const LB_ITEMS_PER_CHUNK = 3;
const DIR_CHUNK_COUNT = 4; // 4 bloques x 6 nombres = 24 nombres en caché rápida
const DIR_ITEMS_PER_CHUNK = 6;

// Hash determinista idéntico en servidor y navegador
export function hashPin(name, password) {
    const cleanName = normalizeName(name);
    const cleanPass = String(password || '').trim().toLowerCase();
    const str = `PB_V3:${cleanName}:${cleanPass}`;
    let h1 = 0xdeadbeef ^ str.length;
    let h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

// Contraseña predeterminada del dueño: Nombre "Phantom" -> Contraseña "Phantom/123"
const PHANTOM_DEFAULT_PASS_HASH = hashPin('PHANTOM', 'Phantom/123');

function normalizeName(raw) {
    const trimmed = String(raw || '').trim().toUpperCase();
    if (trimmed === 'PHANTOM#13' || trimmed === 'PHANTOM13' || trimmed === 'PHANTOM_ADMIN') {
        return 'PHANTOM';
    }
    return trimmed.slice(0, 16);
}

function toBase64Url(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url) {
    if (!b64url || typeof b64url !== 'string') return '';
    try {
        let b64 = b64url.trim().replace(/^"|"$/g, '').replace(/-/g, '+').replace(/_/g, '/');
        if (!b64) return '';
        while (b64.length % 4) b64 += '=';
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch {
        return '';
    }
}

function toHex(str) {
    return Array.from(new TextEncoder().encode(String(str || '')))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function getDefaultPhantomProfile() {
    return {
        name: 'PHANTOM',
        passHash: PHANTOM_DEFAULT_PASS_HASH,
        isCreator: true,
        level1Completed: false,
        highScore: 0,
        lastScore: 0,
        lastLevel: 1,
        updatedAt: new Date().toISOString().slice(0, 10)
    };
}

function getInitialDb() {
    return {
        profiles: {
            PHANTOM: getDefaultPhantomProfile()
        },
        leaderboard: []
    };
}

function sanitizePublicProfile(prof) {
    if (!prof) return null;
    return {
        name: prof.name,
        isCreator: Boolean(prof.isCreator || prof.name === 'PHANTOM'),
        level1Completed: Boolean(prof.level1Completed),
        highScore: Number(prof.highScore) || 0,
        lastScore: Number(prof.lastScore) || 0,
        lastLevel: Number(prof.lastLevel) || (prof.level1Completed ? 2 : 1),
        updatedAt: prof.updatedAt || new Date().toISOString().slice(0, 10)
    };
}

function encodeProfileCompact(prof) {
    const arr = [
        normalizeName(prof.name),
        prof.name === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : (prof.passHash || ''),
        prof.isCreator || prof.name === 'PHANTOM' ? 1 : 0,
        prof.level1Completed ? 1 : 0,
        Math.max(0, Math.floor(Number(prof.highScore) || 0)),
        Math.max(0, Math.floor(Number(prof.lastScore) || 0)),
        Number(prof.lastLevel) || (prof.level1Completed ? 2 : 1),
        prof.updatedAt || new Date().toISOString().slice(0, 10)
    ];
    return toBase64Url(JSON.stringify(arr));
}

function decodeProfileCompact(encoded) {
    const decoded = fromBase64Url(encoded);
    if (!decoded) return null;
    try {
        const arr = JSON.parse(decoded);
        if (!Array.isArray(arr) || !arr[0]) return null;
        const name = normalizeName(arr[0]);
        return {
            name,
            passHash: name === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : String(arr[1] || ''),
            isCreator: Boolean(arr[2] || name === 'PHANTOM'),
            level1Completed: Boolean(arr[3]),
            highScore: Number(arr[4]) || 0,
            lastScore: Number(arr[5]) || 0,
            lastLevel: Number(arr[6]) || (arr[3] ? 2 : 1),
            updatedAt: arr[7] || new Date().toISOString().slice(0, 10)
        };
    } catch {
        return null;
    }
}

async function cloudGetRaw(appKey, key) {
    try {
        const res = await fetch(`${CLOUD_KV_BASE}/GetValue/${appKey}/${key}`, {
            method: 'GET',
            signal: AbortSignal.timeout(3200)
        });
        if (!res.ok) return '';
        const val = await res.json();
        return typeof val === 'string' ? val : '';
    } catch {
        return '';
    }
}

async function cloudGet(key) {
    for (const appKey of CLOUD_APP_KEYS) {
        const val = await cloudGetRaw(appKey, key);
        if (val) return val;
    }
    return '';
}

async function cloudSet(key, value) {
    if (!value) return;
    await Promise.allSettled(
        CLOUD_APP_KEYS.map((appKey) =>
            fetch(`${CLOUD_KV_BASE}/UpdateValue/${appKey}/${key}/${value}`, {
                method: 'POST',
                signal: AbortSignal.timeout(3500)
            })
        )
    );
}

async function fetchCloudProfile(rawName) {
    const name = normalizeName(rawName);
    if (!name) return null;
    const key = `P_${toHex(name)}`;
    const encoded = await cloudGet(key);
    const decoded = decodeProfileCompact(encoded);
    if (decoded) return decoded;
    if (name === 'PHANTOM') return getDefaultPhantomProfile();
    return null;
}

async function saveCloudProfile(prof) {
    if (!prof || !prof.name) return;
    const key = `P_${toHex(normalizeName(prof.name))}`;
    const encoded = encodeProfileCompact(prof);
    await cloudSet(key, encoded);
}

async function fetchCloudLeaderboardAndDir() {
    const lbKeys = Array.from({ length: LB_CHUNK_COUNT }, (_, i) => `LB_${i}`);
    const dirKeys = Array.from({ length: DIR_CHUNK_COUNT }, (_, i) => `DIR_${i}`);
    const allKeys = [...lbKeys, ...dirKeys];

    const results = await Promise.all(allKeys.map((k) => cloudGetRaw(CLOUD_APP_KEYS[0], k)));

    const leaderboard = [];
    for (let i = 0; i < LB_CHUNK_COUNT; i++) {
        const raw = fromBase64Url(results[i]);
        if (!raw) continue;
        const lines = raw.split('\n');
        for (const line of lines) {
            if (!line) continue;
            const [name, score, levelReached, date] = line.split('|');
            if (name && Number(score) > 0) {
                leaderboard.push({
                    name: normalizeName(name),
                    score: Number(score) || 0,
                    levelReached: Number(levelReached) || 1,
                    date: date || new Date().toISOString().slice(0, 10)
                });
            }
        }
    }

    const takenSet = new Set(['PHANTOM']);
    for (let i = 0; i < DIR_CHUNK_COUNT; i++) {
        const raw = fromBase64Url(results[LB_CHUNK_COUNT + i]);
        if (!raw) continue;
        try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                arr.forEach((n) => {
                    if (n) takenSet.add(normalizeName(n));
                });
            }
        } catch {
            // Ignorar bloque corrupto
        }
    }
    leaderboard.forEach((entry) => takenSet.add(entry.name));

    return {
        leaderboard,
        takenNames: Array.from(takenSet)
    };
}

async function saveCloudLeaderboard(leaderboard) {
    const clean = (Array.isArray(leaderboard) ? leaderboard : [])
        .filter((e) => e && e.name && Number(e.score) > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, LB_CHUNK_COUNT * LB_ITEMS_PER_CHUNK);

    const tasks = [];
    for (let i = 0; i < LB_CHUNK_COUNT; i++) {
        const slice = clean.slice(i * LB_ITEMS_PER_CHUNK, (i + 1) * LB_ITEMS_PER_CHUNK);
        if (slice.length === 0 && i > 0) break;
        const text = slice
            .map((e) => `${normalizeName(e.name)}|${Math.floor(Number(e.score) || 0)}|${e.levelReached || 1}|${e.date || new Date().toISOString().slice(0, 10)}`)
            .join('\n');
        const encoded = text ? toBase64Url(text) : '';
        if (encoded) {
            tasks.push(cloudSet(`LB_${i}`, encoded));
        }
    }
    await Promise.allSettled(tasks);
}

async function saveCloudDirectory(namesList) {
    const unique = Array.from(new Set(['PHANTOM', ...(namesList || []).map(normalizeName).filter(Boolean)]));
    const tasks = [];
    for (let i = 0; i < DIR_CHUNK_COUNT; i++) {
        const slice = unique.slice(i * DIR_ITEMS_PER_CHUNK, (i + 1) * DIR_ITEMS_PER_CHUNK);
        if (slice.length === 0) break;
        const encoded = toBase64Url(JSON.stringify(slice));
        tasks.push(cloudSet(`DIR_${i}`, encoded));
    }
    await Promise.allSettled(tasks);
}

function syncLeaderboardFromProfiles(db) {
    const map = new Map();
    if (Array.isArray(db.leaderboard)) {
        for (const entry of db.leaderboard) {
            if (entry && entry.name && (entry.score || 0) > 0) {
                const key = normalizeName(entry.name);
                const prev = map.get(key);
                const s = Number(entry.score) || 0;
                if (!prev || s > prev.score) {
                    map.set(key, {
                        name: key,
                        score: s,
                        levelReached: entry.levelReached || 1,
                        date: entry.date || new Date().toISOString().slice(0, 10)
                    });
                }
            }
        }
    }
    if (db.profiles && typeof db.profiles === 'object') {
        for (const prof of Object.values(db.profiles)) {
            if (!prof || !prof.name) continue;
            const key = normalizeName(prof.name);
            const best = Math.max(Number(prof.highScore) || 0, Number(prof.lastScore) || 0);
            if (best > 0) {
                const prev = map.get(key);
                if (!prev || best >= prev.score) {
                    map.set(key, {
                        name: key,
                        score: best,
                        levelReached: prof.lastLevel || (prof.level1Completed ? 2 : 1),
                        date: prof.updatedAt || new Date().toISOString().slice(0, 10)
                    });
                }
            }
        }
    }
    db.leaderboard = Array.from(map.values()).sort((a, b) => (b.score || 0) - (a.score || 0));
}

function readLocalTmpDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.profiles) {
                if (!parsed.profiles.PHANTOM) {
                    parsed.profiles.PHANTOM = getDefaultPhantomProfile();
                } else {
                    parsed.profiles.PHANTOM.passHash = PHANTOM_DEFAULT_PASS_HASH;
                    parsed.profiles.PHANTOM.isCreator = true;
                }
                syncLeaderboardFromProfiles(parsed);
                return parsed;
            }
        }
    } catch {
        // Fallback a estado inicial
    }
    const init = getInitialDb();
    writeLocalTmpDb(init);
    return init;
}

function writeLocalTmpDb(data) {
    try {
        syncLeaderboardFromProfiles(data);
        fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf8');
    } catch {
        // Ignorar errores de escritura en /tmp
    }
}

function mergeProfiles(localProf, cloudProf) {
    if (!localProf && !cloudProf) return null;
    const base = cloudProf || localProf;
    const other = localProf || cloudProf;
    const name = normalizeName(base.name || other.name);
    const level1Completed = Boolean(base.level1Completed || other.level1Completed);
    const highScore = Math.max(Number(base.highScore) || 0, Number(other.highScore) || 0);
    const lastScore = Math.max(Number(base.lastScore) || 0, Number(other.lastScore) || 0);
    const lastLevel = level1Completed ? 2 : Math.max(Number(base.lastLevel) || 1, Number(other.lastLevel) || 1);
    return {
        name,
        passHash: name === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : (cloudProf?.passHash || localProf?.passHash || ''),
        isCreator: Boolean(name === 'PHANTOM' || base.isCreator || other.isCreator),
        level1Completed,
        highScore,
        lastScore,
        lastLevel,
        updatedAt: base.updatedAt || other.updatedAt || new Date().toISOString().slice(0, 10)
    };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const db = readLocalTmpDb();

    if (req.method === 'GET') {
        const checkName = req.query?.checkName ? normalizeName(req.query.checkName) : '';
        if (checkName) {
            if (checkName === 'PHANTOM') {
                return res.status(200).json({
                    ok: true,
                    name: 'PHANTOM',
                    exists: true,
                    isCreator: true
                });
            }
            const cloudProf = await fetchCloudProfile(checkName);
            const localProf = db.profiles[checkName];
            const exists = Boolean((cloudProf && cloudProf.passHash) || (localProf && localProf.passHash));
            return res.status(200).json({
                ok: true,
                name: checkName,
                exists,
                isCreator: false
            });
        }

        const pilotName = req.query?.pilotName ? normalizeName(req.query.pilotName) : '';
        const [cloudData, cloudPilot] = await Promise.all([
            fetchCloudLeaderboardAndDir(),
            pilotName ? fetchCloudProfile(pilotName) : Promise.resolve(null)
        ]);

        if (Array.isArray(cloudData.leaderboard)) {
            db.leaderboard = [...(db.leaderboard || []), ...cloudData.leaderboard];
        }

        let myProfile = null;
        if (pilotName) {
            const merged = mergeProfiles(db.profiles[pilotName], cloudPilot);
            if (merged) {
                db.profiles[pilotName] = merged;
                myProfile = sanitizePublicProfile(merged);
            }
        }

        syncLeaderboardFromProfiles(db);
        writeLocalTmpDb(db);

        const takenNames = Array.from(
            new Set([
                'PHANTOM',
                ...Object.keys(db.profiles),
                ...(cloudData.takenNames || []),
                ...db.leaderboard.map((e) => e.name)
            ])
        );

        return res.status(200).json({
            ok: true,
            myProfile,
            takenNames,
            leaderboard: db.leaderboard.slice(0, 20)
        });
    }

    if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const {
            action,
            rawName,
            password,
            passToken,
            progress,
            score,
            levelReached,
            localHighScore,
            localLevel1Completed
        } = body;

        const targetName = normalizeName(rawName);

        if (action === 'auth_pilot' || action === 'claim_name') {
            if (!targetName || targetName.length < 2) {
                return res.status(400).json({
                    ok: false,
                    error: 'Escribe un nombre de piloto válido (mínimo 2 caracteres).'
                });
            }

            const cleanPassword = String(password || '').trim();
            if (!cleanPassword || cleanPassword.length < 3) {
                return res.status(400).json({
                    ok: false,
                    code: 'MISSING_PASSWORD',
                    error: 'Ingresa una contraseña (mínimo 3 caracteres) para asegurar o desbloquear tu piloto.'
                });
            }

            const incomingHash = hashPin(targetName, cleanPassword);
            const [cloudProf, cloudData] = await Promise.all([
                fetchCloudProfile(targetName),
                fetchCloudLeaderboardAndDir()
            ]);

            if (Array.isArray(cloudData.leaderboard)) {
                db.leaderboard = [...(db.leaderboard || []), ...cloudData.leaderboard];
            }

            const existingProf = mergeProfiles(db.profiles[targetName], cloudProf);
            const isAlreadyRegistered = Boolean(
                targetName === 'PHANTOM' || (existingProf && existingProf.passHash)
            );

            if (isAlreadyRegistered) {
                const expectedHash =
                    targetName === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : existingProf.passHash;

                // Permitir también si el creador escribió la clave antigua PHANTOM#13 en contraseña
                const isLegacyCreatorPass =
                    targetName === 'PHANTOM' &&
                    (cleanPassword.toUpperCase() === 'PHANTOM#13' || cleanPassword.toUpperCase() === 'PHANTOM/123');

                if (incomingHash !== expectedHash && !isLegacyCreatorPass) {
                    return res.status(401).json({
                        ok: false,
                        code: 'WRONG_PASSWORD',
                        error:
                            targetName === 'PHANTOM'
                                ? 'Contraseña incorrecta para la cuenta oficial "PHANTOM".'
                                : `Contraseña incorrecta para el piloto "${targetName}". Si ya registraste este nombre, escribe tu contraseña; si eres nuevo, elige otro nombre.`
                    });
                }

                const updatedProf = {
                    ...existingProf,
                    name: targetName,
                    passHash: expectedHash,
                    isCreator: targetName === 'PHANTOM',
                    level1Completed: Boolean(existingProf.level1Completed || localLevel1Completed),
                    highScore: Math.max(Number(existingProf.highScore) || 0, Number(localHighScore) || 0),
                    lastLevel:
                        existingProf.level1Completed || localLevel1Completed
                            ? 2
                            : Math.max(Number(existingProf.lastLevel) || 1, 1),
                    updatedAt: new Date().toISOString().slice(0, 10)
                };

                db.profiles[targetName] = updatedProf;
                syncLeaderboardFromProfiles(db);
                writeLocalTmpDb(db);

                const allTaken = Array.from(
                    new Set(['PHANTOM', ...Object.keys(db.profiles), ...(cloudData.takenNames || []), targetName])
                );

                await Promise.allSettled([
                    saveCloudProfile(updatedProf),
                    saveCloudDirectory(allTaken),
                    updatedProf.highScore > 0 ? saveCloudLeaderboard(db.leaderboard) : Promise.resolve()
                ]);

                return res.status(200).json({
                    ok: true,
                    isNew: false,
                    profile: sanitizePublicProfile(updatedProf),
                    passToken: expectedHash,
                    takenNames: allTaken,
                    leaderboard: db.leaderboard.slice(0, 20)
                });
            }

            // Piloto nuevo: registrar con su contraseña
            const newProfile = {
                name: targetName,
                passHash: incomingHash,
                isCreator: false,
                level1Completed: Boolean(localLevel1Completed || existingProf?.level1Completed),
                highScore: Math.max(Number(localHighScore) || 0, Number(existingProf?.highScore) || 0),
                lastScore: Math.max(Number(localHighScore) || 0, Number(existingProf?.lastScore) || 0),
                lastLevel: localLevel1Completed ? 2 : 1,
                updatedAt: new Date().toISOString().slice(0, 10)
            };

            db.profiles[targetName] = newProfile;
            syncLeaderboardFromProfiles(db);
            writeLocalTmpDb(db);

            const allTaken = Array.from(
                new Set(['PHANTOM', ...Object.keys(db.profiles), ...(cloudData.takenNames || []), targetName])
            );

            await Promise.allSettled([
                saveCloudProfile(newProfile),
                saveCloudDirectory(allTaken),
                newProfile.highScore > 0 ? saveCloudLeaderboard(db.leaderboard) : Promise.resolve()
            ]);

            return res.status(200).json({
                ok: true,
                isNew: true,
                profile: sanitizePublicProfile(newProfile),
                passToken: incomingHash,
                takenNames: allTaken,
                leaderboard: db.leaderboard.slice(0, 20)
            });
        }

        if (action === 'save_progress' || action === 'submit_score') {
            if (!targetName) {
                return res.status(400).json({ ok: false, error: 'Primero activa tu nombre de piloto.' });
            }

            const [cloudProf, cloudData] = await Promise.all([
                fetchCloudProfile(targetName),
                fetchCloudLeaderboardAndDir()
            ]);

            if (Array.isArray(cloudData.leaderboard)) {
                db.leaderboard = [...(db.leaderboard || []), ...cloudData.leaderboard];
            }

            let profile = mergeProfiles(db.profiles[targetName], cloudProf);

            if (profile && profile.passHash) {
                const providedToken = passToken || (password ? hashPin(targetName, password) : '');
                if (providedToken && providedToken !== profile.passHash) {
                    return res.status(401).json({
                        ok: false,
                        error: 'Sesión de piloto no válida. Verifica tu contraseña.'
                    });
                }
            } else {
                profile = {
                    name: targetName,
                    passHash:
                        targetName === 'PHANTOM'
                            ? PHANTOM_DEFAULT_PASS_HASH
                            : passToken || (password ? hashPin(targetName, password) : ''),
                    isCreator: targetName === 'PHANTOM',
                    level1Completed: false,
                    highScore: 0,
                    lastScore: 0,
                    lastLevel: 1,
                    updatedAt: new Date().toISOString().slice(0, 10)
                };
            }

            const incomingScore = Math.max(
                0,
                Math.floor(Number(score ?? progress?.score ?? progress?.highScore ?? 0) || 0)
            );
            const incomingHigh = Math.max(
                incomingScore,
                Math.floor(Number(progress?.highScore ?? 0) || 0)
            );
            const today = new Date().toISOString().slice(0, 10);

            profile.level1Completed = Boolean(profile.level1Completed || progress?.level1Completed);
            profile.highScore = Math.max(profile.highScore || 0, incomingHigh);
            if (incomingScore > 0 || progress?.score !== undefined) {
                profile.lastScore = incomingScore;
            }
            profile.lastLevel = profile.level1Completed
                ? 2
                : Math.max(profile.lastLevel || 1, progress?.lastLevel || levelReached || 1);
            profile.updatedAt = today;

            db.profiles[profile.name] = profile;
            syncLeaderboardFromProfiles(db);
            writeLocalTmpDb(db);

            const allTaken = Array.from(
                new Set(['PHANTOM', ...Object.keys(db.profiles), ...(cloudData.takenNames || []), profile.name])
            );

            await Promise.allSettled([
                saveCloudProfile(profile),
                saveCloudLeaderboard(db.leaderboard),
                saveCloudDirectory(allTaken)
            ]);

            return res.status(200).json({
                ok: true,
                profile: sanitizePublicProfile(profile),
                leaderboard: db.leaderboard.slice(0, 20)
            });
        }

        return res.status(400).json({ ok: false, error: 'Acción desconocida.' });
    }

    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
}
