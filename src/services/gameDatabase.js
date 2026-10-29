// Servicio de Base de Datos Online para Phantom Byte Arcade (v3)
// - Sistema de Piloto + Contraseña (permite jugar con el mismo piloto en múltiples dispositivos).
// - Cuenta oficial del creador: Nombre "PHANTOM" / Contraseña predeterminada "Phantom/123".
// - Sincronización 100% Online mediante /api/arcade + respaldo directo en Cloud KV + caché en localStorage.

const STORAGE_KEY_LEADERBOARD = 'phantombyte_gameover_leaderboard_v3';
const STORAGE_KEY_PROFILES = 'phantombyte_gameover_profiles_v3';
const STORAGE_KEY_SESSION = 'phantombyte_pilot_session_v3';

// Claves de la versión anterior (v2) para migrar récords locales previos automáticamente
const LEGACY_KEY_PROFILES_V2 = 'phantombyte_gameover_profiles_v2';
const LEGACY_KEY_LEADERBOARD_V2 = 'phantombyte_gameover_leaderboard_v2';
const LEGACY_KEY_LOCKED_NAME_V2 = 'phantombyte_locked_pilot_name_v2';

const CLOUD_KV_BASE = 'https://keyvalue.immanuel.co/api/KeyVal';
const CLOUD_APP_KEY = 'uv66728x';
const LB_CHUNK_COUNT = 7;
const LB_ITEMS_PER_CHUNK = 3;
const DIR_CHUNK_COUNT = 4;

export function normalizeName(name) {
    const trimmed = String(name || '').trim().toUpperCase();
    if (trimmed === 'PHANTOM#13' || trimmed === 'PHANTOM13' || trimmed === 'PHANTOM_ADMIN') {
        return 'PHANTOM';
    }
    return trimmed.slice(0, 16);
}

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

const PHANTOM_DEFAULT_PASS_HASH = hashPin('PHANTOM', 'Phantom/123');

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

export function getSavedPilotSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_SESSION);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name && parsed.passToken) {
            return {
                name: normalizeName(parsed.name),
                passToken: String(parsed.passToken)
            };
        }
        return null;
    } catch {
        return null;
    }
}

function setSavedPilotSession(name, passToken) {
    try {
        if (!name || !passToken) {
            localStorage.removeItem(STORAGE_KEY_SESSION);
            return;
        }
        localStorage.setItem(
            STORAGE_KEY_SESSION,
            JSON.stringify({
                name: normalizeName(name),
                passToken: String(passToken)
            })
        );
    } catch {
        // Ignorar errores de almacenamiento local
    }
}

export function getLockedPilotName() {
    const session = getSavedPilotSession();
    return session ? session.name : '';
}

export function getLegacyPilotNameHint() {
    const locked = getLockedPilotName();
    if (locked) return locked;
    try {
        const legacyName = localStorage.getItem(LEGACY_KEY_LOCKED_NAME_V2);
        return legacyName ? normalizeName(legacyName) : '';
    } catch {
        return '';
    }
}

export function logoutPilot() {
    try {
        localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {
        // Ignorar
    }
}

function getLocalProfiles() {
    const defaultProfiles = {
        PHANTOM: {
            name: 'PHANTOM',
            passHash: PHANTOM_DEFAULT_PASS_HASH,
            isCreator: true,
            level1Completed: false,
            highScore: 0,
            lastScore: 0,
            lastLevel: 1,
            updatedAt: new Date().toISOString().slice(0, 10)
        }
    };
    try {
        const rawV3 = localStorage.getItem(STORAGE_KEY_PROFILES);
        const rawV2 = localStorage.getItem(LEGACY_KEY_PROFILES_V2);
        const parsedV3 = rawV3 ? JSON.parse(rawV3) : {};
        const parsedV2 = rawV2 ? JSON.parse(rawV2) : {};

        const merged = { ...defaultProfiles };

        // Migrar datos previos de v2 para no perder puntuaciones ni niveles desbloqueados
        for (const [k, prof] of Object.entries(parsedV2 || {})) {
            if (!prof || !prof.name) continue;
            const norm = normalizeName(prof.name || k);
            merged[norm] = {
                name: norm,
                passHash: norm === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : (prof.passHash || ''),
                isCreator: norm === 'PHANTOM',
                level1Completed: Boolean(prof.level1Completed),
                highScore: Math.max(0, Number(prof.highScore) || 0, Number(prof.lastScore) || 0),
                lastScore: Math.max(0, Number(prof.lastScore) || 0),
                lastLevel: prof.level1Completed ? 2 : (Number(prof.lastLevel) || 1),
                updatedAt: prof.updatedAt || new Date().toISOString().slice(0, 10)
            };
        }

        for (const [k, prof] of Object.entries(parsedV3 || {})) {
            if (!prof || !prof.name) continue;
            const norm = normalizeName(prof.name || k);
            const prev = merged[norm] || {};
            const lvl1 = Boolean(prev.level1Completed || prof.level1Completed);
            merged[norm] = {
                name: norm,
                passHash: norm === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : (prof.passHash || prev.passHash || ''),
                isCreator: norm === 'PHANTOM',
                level1Completed: lvl1,
                highScore: Math.max(0, Number(prev.highScore) || 0, Number(prof.highScore) || 0),
                lastScore: Math.max(0, Number(prev.lastScore) || 0, Number(prof.lastScore) || 0),
                lastLevel: lvl1 ? 2 : Math.max(Number(prev.lastLevel) || 1, Number(prof.lastLevel) || 1),
                updatedAt: prof.updatedAt || prev.updatedAt || new Date().toISOString().slice(0, 10)
            };
        }

        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(merged));
        return merged;
    } catch {
        return defaultProfiles;
    }
}

function setLocalProfiles(profiles) {
    try {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch {
        // Ignorar
    }
}

function getLocalLeaderboard() {
    try {
        const rawV3 = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
        const rawV2 = localStorage.getItem(LEGACY_KEY_LEADERBOARD_V2);
        const listV3 = rawV3 ? JSON.parse(rawV3) : [];
        const listV2 = rawV2 ? JSON.parse(rawV2) : [];
        return [
            ...(Array.isArray(listV3) ? listV3 : []),
            ...(Array.isArray(listV2) ? listV2 : [])
        ];
    } catch {
        return [];
    }
}

function setLocalLeaderboard(list) {
    try {
        localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(list));
    } catch {
        // Ignorar
    }
}

function buildSyncedLeaderboard(profilesObj, leaderboardList = []) {
    const map = new Map();

    if (Array.isArray(leaderboardList)) {
        leaderboardList.forEach((entry) => {
            if (!entry || !entry.name || (entry.score || 0) <= 0) return;
            const key = normalizeName(entry.name);
            const prev = map.get(key);
            if (!prev || Number(entry.score) > prev.score) {
                map.set(key, {
                    name: key,
                    score: Number(entry.score) || 0,
                    levelReached: entry.levelReached || 1,
                    date: entry.date || new Date().toISOString().slice(0, 10)
                });
            }
        });
    }

    if (profilesObj && typeof profilesObj === 'object') {
        Object.values(profilesObj).forEach((prof) => {
            if (!prof || !prof.name) return;
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
        });
    }

    return Array.from(map.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
}

// Respaldo Cloud KV directo desde navegador en caso de que el endpoint serverless falle
async function directCloudGet(key) {
    try {
        const res = await fetch(`${CLOUD_KV_BASE}/GetValue/${CLOUD_APP_KEY}/${key}`);
        if (!res.ok) return '';
        const val = await res.json();
        return typeof val === 'string' ? val : '';
    } catch {
        return '';
    }
}

async function directCloudSet(key, value) {
    if (!value) return;
    try {
        await fetch(`${CLOUD_KV_BASE}/UpdateValue/${CLOUD_APP_KEY}/${key}/${value}`, {
            method: 'POST'
        });
    } catch {
        // Ignorar
    }
}

async function directFetchCloudBoard() {
    try {
        const lbKeys = Array.from({ length: LB_CHUNK_COUNT }, (_, i) => `LB_${i}`);
        const dirKeys = Array.from({ length: DIR_CHUNK_COUNT }, (_, i) => `DIR_${i}`);
        const results = await Promise.all([...lbKeys, ...dirKeys].map((k) => directCloudGet(k)));

        const leaderboard = [];
        for (let i = 0; i < LB_CHUNK_COUNT; i++) {
            const raw = fromBase64Url(results[i]);
            if (!raw) continue;
            for (const line of raw.split('\n')) {
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

        const taken = new Set(['PHANTOM']);
        for (let i = 0; i < DIR_CHUNK_COUNT; i++) {
            const raw = fromBase64Url(results[LB_CHUNK_COUNT + i]);
            if (!raw) continue;
            try {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) arr.forEach((n) => n && taken.add(normalizeName(n)));
            } catch {
                // Ignorar
            }
        }
        leaderboard.forEach((e) => taken.add(e.name));
        return { leaderboard, takenNames: Array.from(taken) };
    } catch {
        return { leaderboard: [], takenNames: ['PHANTOM'] };
    }
}

async function directSyncScoreToCloud(profile, fullLeaderboard) {
    if (!profile || !profile.name) return;
    try {
        const arr = [
            normalizeName(profile.name),
            profile.name === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : (profile.passHash || ''),
            profile.name === 'PHANTOM' ? 1 : 0,
            profile.level1Completed ? 1 : 0,
            Math.max(0, Math.floor(Number(profile.highScore) || 0)),
            Math.max(0, Math.floor(Number(profile.lastScore) || 0)),
            Number(profile.lastLevel) || (profile.level1Completed ? 2 : 1),
            profile.updatedAt || new Date().toISOString().slice(0, 10)
        ];
        await directCloudSet(`P_${toHex(normalizeName(profile.name))}`, toBase64Url(JSON.stringify(arr)));

        const clean = (Array.isArray(fullLeaderboard) ? fullLeaderboard : [])
            .filter((e) => e && e.name && Number(e.score) > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, LB_CHUNK_COUNT * LB_ITEMS_PER_CHUNK);

        for (let i = 0; i < LB_CHUNK_COUNT; i++) {
            const slice = clean.slice(i * LB_ITEMS_PER_CHUNK, (i + 1) * LB_ITEMS_PER_CHUNK);
            if (slice.length === 0) break;
            const text = slice
                .map((e) => `${normalizeName(e.name)}|${Math.floor(Number(e.score) || 0)}|${e.levelReached || 1}|${e.date || new Date().toISOString().slice(0, 10)}`)
                .join('\n');
            await directCloudSet(`LB_${i}`, toBase64Url(text));
        }
    } catch {
        // Ignorar
    }
}

export async function checkPilotStatus(rawName) {
    const targetName = normalizeName(rawName);
    if (!targetName || targetName.length < 2) {
        return { name: targetName, exists: false, isCreator: false };
    }
    if (targetName === 'PHANTOM') {
        return { name: 'PHANTOM', exists: true, isCreator: true };
    }
    try {
        const res = await fetch(`/api/arcade?checkName=${encodeURIComponent(targetName)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) {
                return {
                    name: targetName,
                    exists: Boolean(data.exists),
                    isCreator: Boolean(data.isCreator)
                };
            }
        }
    } catch {
        // Fallback a consulta directa en nube
    }

    const encoded = await directCloudGet(`P_${toHex(targetName)}`);
    if (encoded) {
        return { name: targetName, exists: true, isCreator: false };
    }
    const localProfiles = getLocalProfiles();
    const localProf = localProfiles[targetName];
    return {
        name: targetName,
        exists: Boolean(localProf && localProf.passHash),
        isCreator: false
    };
}

export async function fetchArcadeState() {
    const session = getSavedPilotSession();
    const lockedName = session ? session.name : '';
    const localProfiles = getLocalProfiles();
    let myProfile = lockedName ? localProfiles[lockedName] || null : null;
    let syncedBoard = buildSyncedLeaderboard(localProfiles, getLocalLeaderboard());
    setLocalLeaderboard(syncedBoard);
    let takenNames = Array.from(new Set(['PHANTOM', ...Object.keys(localProfiles).filter((k) => localProfiles[k]?.passHash)]));

    let apiSucceeded = false;
    try {
        const url = lockedName
            ? `/api/arcade?pilotName=${encodeURIComponent(lockedName)}`
            : '/api/arcade';
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) {
                apiSucceeded = true;
                if (Array.isArray(data.takenNames)) {
                    takenNames = Array.from(new Set([...takenNames, ...data.takenNames.map(normalizeName)]));
                }
                if (data.myProfile && data.myProfile.name) {
                    const pName = normalizeName(data.myProfile.name);
                    const localP = localProfiles[pName] || {};
                    myProfile = {
                        ...localP,
                        ...data.myProfile,
                        name: pName,
                        passHash: session?.passToken || localP.passHash || '',
                        level1Completed: Boolean(localP.level1Completed || data.myProfile.level1Completed),
                        highScore: Math.max(localP.highScore || 0, data.myProfile.highScore || 0),
                        lastScore: Math.max(localP.lastScore || 0, data.myProfile.lastScore || 0),
                        lastLevel: Math.max(localP.lastLevel || 1, data.myProfile.lastLevel || 1)
                    };
                    localProfiles[pName] = myProfile;
                    setLocalProfiles(localProfiles);
                }
                if (Array.isArray(data.leaderboard)) {
                    syncedBoard = buildSyncedLeaderboard(localProfiles, [...syncedBoard, ...data.leaderboard]);
                    setLocalLeaderboard(syncedBoard);
                }
            }
        }
    } catch {
        // Fallback a Cloud KV directo
    }

    if (!apiSucceeded) {
        const directData = await directFetchCloudBoard();
        if (directData.leaderboard.length > 0) {
            syncedBoard = buildSyncedLeaderboard(localProfiles, [...syncedBoard, ...directData.leaderboard]);
            setLocalLeaderboard(syncedBoard);
        }
        if (directData.takenNames.length > 0) {
            takenNames = Array.from(new Set([...takenNames, ...directData.takenNames]));
        }
    }

    // Si el piloto activo tiene un récord local que aún no estaba en la tabla remota, sincronizarlo
    if (lockedName && myProfile && myProfile.highScore > 0) {
        const remoteEntry = syncedBoard.find((e) => e.name === lockedName);
        if (!remoteEntry || myProfile.highScore > remoteEntry.score) {
            savePlayerProgress(lockedName, {
                highScore: myProfile.highScore,
                score: myProfile.highScore,
                level1Completed: myProfile.level1Completed,
                lastLevel: myProfile.lastLevel || (myProfile.level1Completed ? 2 : 1)
            }).catch(() => {});
        }
    }

    return {
        lockedName,
        myProfile,
        takenNames,
        leaderboard: syncedBoard
    };
}

export async function authenticatePilot(rawInput, rawPassword) {
    const targetName = normalizeName(rawInput);
    const cleanPassword = String(rawPassword || '').trim();

    if (!targetName || targetName.length < 2) {
        return { ok: false, error: 'Escribe un nombre de piloto válido (mínimo 2 caracteres).' };
    }

    if (!cleanPassword || cleanPassword.length < 3) {
        return {
            ok: false,
            error: 'Escribe una contraseña (mínimo 3 caracteres) para asegurar o acceder a tu piloto.'
        };
    }

    const localProfiles = getLocalProfiles();
    const localExisting = localProfiles[targetName] || {};
    const localHighScore = Math.max(Number(localExisting.highScore) || 0, Number(localExisting.lastScore) || 0);
    const localLevel1Completed = Boolean(localExisting.level1Completed);

    try {
        const res = await fetch('/api/arcade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'auth_pilot',
                rawName: targetName,
                password: cleanPassword,
                localHighScore,
                localLevel1Completed
            })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
            return {
                ok: false,
                code: data?.code || 'AUTH_ERROR',
                error: data?.error || `No se pudo verificar el piloto "${targetName}".`
            };
        }

        if (data.profile) {
            const passToken = data.passToken || hashPin(targetName, cleanPassword);
            const mergedProfile = {
                ...localExisting,
                ...data.profile,
                name: targetName,
                passHash: passToken,
                level1Completed: Boolean(localLevel1Completed || data.profile.level1Completed),
                highScore: Math.max(localHighScore, Number(data.profile.highScore) || 0),
                lastScore: Math.max(Number(localExisting.lastScore) || 0, Number(data.profile.lastScore) || 0)
            };
            localProfiles[targetName] = mergedProfile;
            setLocalProfiles(localProfiles);
            setSavedPilotSession(targetName, passToken);

            if (Array.isArray(data.leaderboard)) {
                const synced = buildSyncedLeaderboard(localProfiles, [
                    ...getLocalLeaderboard(),
                    ...data.leaderboard
                ]);
                setLocalLeaderboard(synced);
            }

            return {
                ok: true,
                isNew: Boolean(data.isNew),
                profile: mergedProfile,
                leaderboard: getLocalLeaderboard(),
                takenNames: data.takenNames || []
            };
        }
    } catch {
        // Respaldo directo en Cloud KV + local si /api/arcade no responde
    }

    const incomingHash = hashPin(targetName, cleanPassword);
    const cloudRaw = await directCloudGet(`P_${toHex(targetName)}`);
    let cloudProf = null;
    if (cloudRaw) {
        try {
            const arr = JSON.parse(fromBase64Url(cloudRaw));
            if (Array.isArray(arr) && arr[0]) {
                cloudProf = {
                    name: normalizeName(arr[0]),
                    passHash: normalizeName(arr[0]) === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : String(arr[1] || ''),
                    isCreator: Boolean(arr[2] || normalizeName(arr[0]) === 'PHANTOM'),
                    level1Completed: Boolean(arr[3]),
                    highScore: Number(arr[4]) || 0,
                    lastScore: Number(arr[5]) || 0,
                    lastLevel: Number(arr[6]) || 1,
                    updatedAt: arr[7] || new Date().toISOString().slice(0, 10)
                };
            }
        } catch {
            // Ignorar
        }
    }

    const existing = cloudProf || (localExisting.passHash ? localExisting : null);

    if (targetName === 'PHANTOM' || existing) {
        const expectedHash =
            targetName === 'PHANTOM' ? PHANTOM_DEFAULT_PASS_HASH : existing.passHash;
        const isLegacyCreatorPass =
            targetName === 'PHANTOM' &&
            (cleanPassword.toUpperCase() === 'PHANTOM#13' || cleanPassword.toUpperCase() === 'PHANTOM/123');

        if (incomingHash !== expectedHash && !isLegacyCreatorPass) {
            return {
                ok: false,
                code: 'WRONG_PASSWORD',
                error:
                    targetName === 'PHANTOM'
                        ? 'Contraseña incorrecta para la cuenta oficial "PHANTOM".'
                        : `Contraseña incorrecta para el piloto "${targetName}". Si ya registraste este nombre, escribe tu contraseña; si eres nuevo, elige otro nombre.`
            };
        }

        const merged = {
            ...(existing || {}),
            name: targetName,
            passHash: expectedHash,
            isCreator: targetName === 'PHANTOM',
            level1Completed: Boolean(localLevel1Completed || existing?.level1Completed),
            highScore: Math.max(localHighScore, Number(existing?.highScore) || 0),
            lastScore: Math.max(Number(localExisting.lastScore) || 0, Number(existing?.lastScore) || 0),
            lastLevel: localLevel1Completed || existing?.level1Completed ? 2 : 1,
            updatedAt: new Date().toISOString().slice(0, 10)
        };

        localProfiles[targetName] = merged;
        setLocalProfiles(localProfiles);
        setSavedPilotSession(targetName, expectedHash);
        const synced = buildSyncedLeaderboard(localProfiles, getLocalLeaderboard());
        setLocalLeaderboard(synced);
        await directSyncScoreToCloud(merged, synced);

        return { ok: true, isNew: false, profile: merged, leaderboard: synced };
    }

    const newProfile = {
        name: targetName,
        passHash: incomingHash,
        isCreator: false,
        level1Completed: localLevel1Completed,
        highScore: localHighScore,
        lastScore: localHighScore,
        lastLevel: localLevel1Completed ? 2 : 1,
        updatedAt: new Date().toISOString().slice(0, 10)
    };

    localProfiles[targetName] = newProfile;
    setLocalProfiles(localProfiles);
    setSavedPilotSession(targetName, incomingHash);
    const synced = buildSyncedLeaderboard(localProfiles, getLocalLeaderboard());
    setLocalLeaderboard(synced);
    await directSyncScoreToCloud(newProfile, synced);

    return { ok: true, isNew: true, profile: newProfile, leaderboard: synced };
}

// Alias compatible
export const claimPlayerName = authenticatePilot;

export async function savePlayerProgress(playerName, progressUpdate = {}) {
    const session = getSavedPilotSession();
    const key = normalizeName(playerName || session?.name || 'PILOTO');
    const profiles = getLocalProfiles();
    const existing = profiles[key] || {
        name: key,
        passHash: session?.passToken || '',
        level1Completed: false,
        highScore: 0,
        lastScore: 0,
        lastLevel: 1
    };

    const bestScore = Math.max(
        existing.highScore || 0,
        Number(progressUpdate.highScore) || 0,
        Number(progressUpdate.score) || 0
    );

    const updated = {
        ...existing,
        name: key,
        passHash: existing.passHash || session?.passToken || '',
        level1Completed: Boolean(existing.level1Completed || progressUpdate.level1Completed),
        highScore: bestScore,
        lastScore: progressUpdate.score !== undefined ? Number(progressUpdate.score) : existing.lastScore,
        lastLevel:
            progressUpdate.level1Completed || existing.level1Completed
                ? 2
                : Math.max(existing.lastLevel || 1, progressUpdate.lastLevel || 1),
        updatedAt: new Date().toISOString().slice(0, 10)
    };

    profiles[key] = updated;
    setLocalProfiles(profiles);

    const syncedBoard = buildSyncedLeaderboard(profiles, getLocalLeaderboard());
    setLocalLeaderboard(syncedBoard);

    let apiOk = false;
    try {
        const res = await fetch('/api/arcade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_progress',
                rawName: key,
                passToken: updated.passHash || session?.passToken || '',
                progress: updated,
                score: bestScore,
                levelReached: updated.lastLevel
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.ok) {
                apiOk = true;
                if (Array.isArray(data.leaderboard)) {
                    const merged = buildSyncedLeaderboard(profiles, [...syncedBoard, ...data.leaderboard]);
                    setLocalLeaderboard(merged);
                }
            }
        }
    } catch {
        // Respaldo Cloud KV directo
    }

    if (!apiOk) {
        await directSyncScoreToCloud(updated, getLocalLeaderboard());
    }

    return {
        profile: updated,
        leaderboard: getLocalLeaderboard()
    };
}

export async function submitArcadeScore(playerName, score, levelReached = 1) {
    const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
    const result = await savePlayerProgress(playerName, {
        score: cleanScore,
        highScore: cleanScore,
        lastLevel: levelReached
    });
    return result.leaderboard;
}
