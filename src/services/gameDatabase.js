// Servicio de Base de Datos Online para Phantom Byte Arcade (v3)
// - Sistema de Piloto + Contraseña (permite jugar con el mismo piloto en múltiples dispositivos).
// - La validación de la cuenta oficial del creador se realiza únicamente en el servidor (/api/arcade).
// - Sincronización 100% Online mediante /api/arcade + caché local en localStorage.

const STORAGE_KEY_LEADERBOARD = 'phantombyte_gameover_leaderboard_v3';
const STORAGE_KEY_PROFILES = 'phantombyte_gameover_profiles_v3';
const STORAGE_KEY_SESSION = 'phantombyte_pilot_session_v3';

// Claves de la versión anterior (v2) para migrar récords locales previos automáticamente
const LEGACY_KEY_PROFILES_V2 = 'phantombyte_gameover_profiles_v2';
const LEGACY_KEY_LEADERBOARD_V2 = 'phantombyte_gameover_leaderboard_v2';
const LEGACY_KEY_LOCKED_NAME_V2 = 'phantombyte_locked_pilot_name_v2';

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

// La credencial oficial de PHANTOM se valida exclusivamente en el servidor.

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
            passHash: '',
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
                passHash: prof.passHash || '',
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
                passHash: prof.passHash || prev.passHash || '',
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
        // Fallback a caché local si /api/arcade no responde
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
        // Sin conexión con /api/arcade: usar caché local
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
        // Respaldo local si /api/arcade no responde
    }

    const incomingHash = hashPin(targetName, cleanPassword);
    const existing = localExisting.passHash ? localExisting : null;

    if (targetName === 'PHANTOM') {
        return {
            ok: false,
            code: 'SERVER_REQUIRED',
            error: 'La cuenta oficial "PHANTOM" solo puede autenticarse cuando el servidor /api/arcade está disponible.'
        };
    }

    if (existing) {
        const expectedHash = existing.passHash;

        if (incomingHash !== expectedHash) {
            return {
                ok: false,
                code: 'WRONG_PASSWORD',
                error: `Contraseña incorrecta para el piloto "${targetName}". Si ya registraste este nombre, escribe tu contraseña; si eres nuevo, elige otro nombre.`
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
        // Sin conexión con /api/arcade: guardado solo en caché local
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

// ============================================================================
// PERSISTENCIA INDEPENDIENTE PARA "PRINCESAS: LA HISTORIA NUNCA CONTADA"
// (Separada al 100% de los puntajes de la nave "Game Over", pero usando el
//  mismo nombre seleccionado por el jugador para guardar sus niveles superados)
// ============================================================================
const STORAGE_KEY_PRINCESAS_PROFILES = 'phantombyte_princesas_profiles_v1';
const STORAGE_KEY_PRINCESAS_BOARD = 'phantombyte_princesas_board_v1';

function getLocalPrincesasProfiles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PRINCESAS_PROFILES);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function setLocalPrincesasProfiles(obj) {
    try {
        localStorage.setItem(STORAGE_KEY_PRINCESAS_PROFILES, JSON.stringify(obj));
    } catch {
        // Ignorar
    }
}

function getLocalPrincesasBoard() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PRINCESAS_BOARD);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function setLocalPrincesasBoard(list) {
    try {
        localStorage.setItem(STORAGE_KEY_PRINCESAS_BOARD, JSON.stringify(list));
    } catch {
        // Ignorar
    }
}

export async function fetchPrincesasState(rawPlayerName = '') {
    const activeName = normalizeName(rawPlayerName || getLockedPilotName() || getLegacyPilotNameHint() || 'INVITADO');
    const profiles = getLocalPrincesasProfiles();
    const myProgress = profiles[activeName] || {
        name: activeName,
        level1Completed: false,
        completedLevels: [],
        highestLevelUnlocked: 1,
        updatedAt: null
    };

    const board = getLocalPrincesasBoard();

    return {
        playerName: activeName,
        myProgress,
        board
    };
}

export async function savePrincesasProgress(rawPlayerName, update = {}) {
    const activeName = normalizeName(rawPlayerName || getLockedPilotName() || getLegacyPilotNameHint() || 'INVITADO');
    const profiles = getLocalPrincesasProfiles();
    const prev = profiles[activeName] || {
        name: activeName,
        level1Completed: false,
        completedLevels: [],
        highestLevelUnlocked: 1
    };

    const levelNum = Number(update.levelCompleted) || 1;
    const mergedLevels = Array.from(new Set([...(prev.completedLevels || []), levelNum])).sort((a, b) => a - b);
    const lvl1 = Boolean(prev.level1Completed || update.level1Completed || mergedLevels.includes(1));
    const today = new Date().toISOString().slice(0, 10);

    const updated = {
        ...prev,
        name: activeName,
        level1Completed: lvl1,
        completedLevels: mergedLevels,
        highestLevelUnlocked: Math.max(prev.highestLevelUnlocked || 1, levelNum + 1),
        lastOutfit: update.outfit || prev.lastOutfit || null,
        updatedAt: today
    };

    profiles[activeName] = updated;
    setLocalPrincesasProfiles(profiles);

    // Actualizar lista de completados de Princesas
    const board = getLocalPrincesasBoard();
    const map = new Map();
    board.forEach((item) => {
        if (item && item.name) map.set(normalizeName(item.name), item);
    });
    map.set(activeName, {
        name: activeName,
        levelsCount: mergedLevels.length,
        lastLevelCompleted: Math.max(...mergedLevels),
        date: today
    });
    const newBoard = Array.from(map.values()).slice(0, 20);
    setLocalPrincesasBoard(newBoard);

    return {
        myProgress: updated,
        board: newBoard
    };
}

// ============================================================================
// PERSISTENCIA ONLINE PARA "NÚCLEO CARBÓN: FORJA DE CENIZA"
// (Usa el mismo Piloto + Contraseña que Game Over, con ranking propio en la nube)
// ============================================================================
const STORAGE_KEY_CARBON_BOARD = 'phantombyte_carbon_leaderboard_v1';
const STORAGE_KEY_CARBON_PROFILES = 'phantombyte_carbon_profiles_v1';

function getLocalCarbonProfiles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_CARBON_PROFILES);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function setLocalCarbonProfiles(obj) {
    try {
        localStorage.setItem(STORAGE_KEY_CARBON_PROFILES, JSON.stringify(obj));
    } catch {
        // Ignorar
    }
}

function getLocalCarbonBoard() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_CARBON_BOARD);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function setLocalCarbonBoard(list) {
    try {
        localStorage.setItem(STORAGE_KEY_CARBON_BOARD, JSON.stringify(list));
    } catch {
        // Ignorar
    }
}

function buildCarbonBoard(profilesObj, boardList = []) {
    const map = new Map();
    (Array.isArray(boardList) ? boardList : []).forEach((e) => {
        if (!e || !e.name || (Number(e.score) || 0) <= 0) return;
        const key = normalizeName(e.name);
        const prev = map.get(key);
        const s = Math.floor(Number(e.score) || 0);
        if (!prev || s > prev.score) {
            map.set(key, {
                name: key,
                score: s,
                waveReached: Number(e.waveReached) || 1,
                date: e.date || new Date().toISOString().slice(0, 10)
            });
        }
    });
    if (profilesObj && typeof profilesObj === 'object') {
        Object.values(profilesObj).forEach((prof) => {
            if (!prof || !prof.name) return;
            const key = normalizeName(prof.name);
            const best = Math.max(Number(prof.carbonHighScore) || 0, Number(prof.highScore) || 0);
            if (best > 0) {
                const prev = map.get(key);
                if (!prev || best >= prev.score) {
                    map.set(key, {
                        name: key,
                        score: best,
                        waveReached: Number(prof.carbonBestWave || prof.bestWave) || 1,
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

export async function fetchCarbonState() {
    const session = getSavedPilotSession();
    const lockedName = session ? session.name : '';
    const localCarbonProfs = getLocalCarbonProfiles();
    let myCarbonProfile = lockedName ? localCarbonProfs[lockedName] || null : null;
    let board = buildCarbonBoard(localCarbonProfs, getLocalCarbonBoard());
    setLocalCarbonBoard(board);

    try {
        const url = lockedName
            ? `/api/arcade?pilotName=${encodeURIComponent(lockedName)}`
            : '/api/arcade';
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) {
                if (data.myProfile && data.myProfile.name) {
                    const pName = normalizeName(data.myProfile.name);
                    const localP = localCarbonProfs[pName] || {};
                    myCarbonProfile = {
                        name: pName,
                        carbonHighScore: Math.max(localP.carbonHighScore || 0, data.myProfile.carbonHighScore || 0),
                        carbonLastScore: Math.max(localP.carbonLastScore || 0, data.myProfile.carbonLastScore || 0),
                        carbonBestWave: Math.max(localP.carbonBestWave || 1, data.myProfile.carbonBestWave || 1),
                        updatedAt: data.myProfile.updatedAt || localP.updatedAt || new Date().toISOString().slice(0, 10)
                    };
                    localCarbonProfs[pName] = myCarbonProfile;
                    setLocalCarbonProfiles(localCarbonProfs);
                }
                if (Array.isArray(data.carbonLeaderboard)) {
                    board = buildCarbonBoard(localCarbonProfs, [...board, ...data.carbonLeaderboard]);
                    setLocalCarbonBoard(board);
                }
            }
        }
    } catch {
        // Sin conexión con /api/arcade: usar caché local
    }

    return {
        lockedName,
        myCarbonProfile,
        carbonLeaderboard: board
    };
}

export async function submitCarbonScore(playerName, score, waveReached = 1) {
    const session = getSavedPilotSession();
    const key = normalizeName(playerName || session?.name || 'PILOTO');
    const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
    const cleanWave = Math.max(1, Math.floor(Number(waveReached) || 1));
    const today = new Date().toISOString().slice(0, 10);

    const localCarbonProfs = getLocalCarbonProfiles();
    const prev = localCarbonProfs[key] || { name: key, carbonHighScore: 0, carbonLastScore: 0, carbonBestWave: 1 };
    const updated = {
        name: key,
        carbonHighScore: Math.max(prev.carbonHighScore || 0, cleanScore),
        carbonLastScore: cleanScore,
        carbonBestWave: Math.max(prev.carbonBestWave || 1, cleanWave),
        updatedAt: today
    };
    localCarbonProfs[key] = updated;
    setLocalCarbonProfiles(localCarbonProfs);

    let board = buildCarbonBoard(localCarbonProfs, getLocalCarbonBoard());
    setLocalCarbonBoard(board);

    try {
        const res = await fetch('/api/arcade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'submit_carbon_score',
                rawName: key,
                passToken: session?.passToken || '',
                score: cleanScore,
                levelReached: cleanWave
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.ok) {
                if (Array.isArray(data.carbonLeaderboard)) {
                    board = buildCarbonBoard(localCarbonProfs, [...board, ...data.carbonLeaderboard]);
                    setLocalCarbonBoard(board);
                }
            }
        }
    } catch {
        // Sin conexión con /api/arcade: guardado solo en caché local
    }

    return {
        profile: updated,
        carbonLeaderboard: board
    };
}
