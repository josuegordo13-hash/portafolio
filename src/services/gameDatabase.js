// Servicio de Base de Datos Ligera para Juegos
// - Sincroniza automáticamente el récord de cualquier partida con el Tablero de Récords.
// - Persiste en localStorage y en /api/arcade para que al refrescar la página nunca se pierda la tabla.
// - Un nombre único por persona + "PHANTOM" reservado para el creador.

const STORAGE_KEY_LEADERBOARD = 'phantombyte_gameover_leaderboard_v2';
const STORAGE_KEY_PROFILES = 'phantombyte_gameover_profiles_v2';
const STORAGE_KEY_OWNER_ID = 'phantombyte_owner_id_v2';
const STORAGE_KEY_LOCKED_NAME = 'phantombyte_locked_pilot_name_v2';

export function getOwnerId() {
    try {
        let id = localStorage.getItem(STORAGE_KEY_OWNER_ID);
        if (!id) {
            id = 'USR_' + Math.random().toString(36).slice(2, 11).toUpperCase() + '_' + Date.now().toString(36).toUpperCase();
            localStorage.setItem(STORAGE_KEY_OWNER_ID, id);
        }
        return id;
    } catch {
        return 'USR_LOCAL';
    }
}

export function getLockedPilotName() {
    try {
        return localStorage.getItem(STORAGE_KEY_LOCKED_NAME) || '';
    } catch {
        return '';
    }
}

function setLockedPilotName(name) {
    try {
        if (name) {
            localStorage.setItem(STORAGE_KEY_LOCKED_NAME, name);
        }
    } catch {
        // Ignorar
    }
}

function normalizeName(name) {
    return String(name || '').trim().toUpperCase().slice(0, 16);
}

function getLocalProfiles() {
    const defaultProfiles = {
        PHANTOM: {
            name: 'PHANTOM',
            ownerId: 'CREATOR_RESERVED_PHANTOM',
            isCreator: true,
            level1Completed: false,
            highScore: 0,
            lastScore: 0,
            lastLevel: 1,
            updatedAt: new Date().toISOString().slice(0, 10)
        }
    };
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(defaultProfiles));
            return defaultProfiles;
        }
        const parsed = JSON.parse(raw) || {};
        if (!parsed.PHANTOM) {
            parsed.PHANTOM = defaultProfiles.PHANTOM;
        }
        return parsed;
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
        const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
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

// Reconstruye y fusiona el tablero incluyendo cualquier perfil local o remoto que tenga highScore > 0
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

export async function fetchArcadeState() {
    const ownerId = getOwnerId();
    const localProfiles = getLocalProfiles();
    let lockedName = getLockedPilotName();
    let myProfile = lockedName ? localProfiles[lockedName] : null;
    let syncedBoard = buildSyncedLeaderboard(localProfiles, getLocalLeaderboard());
    setLocalLeaderboard(syncedBoard);
    let takenNames = Object.keys(localProfiles);

    try {
        const res = await fetch(`/api/arcade?ownerId=${encodeURIComponent(ownerId)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) {
                if (Array.isArray(data.takenNames)) {
                    takenNames = Array.from(new Set([...takenNames, ...data.takenNames]));
                }
                if (data.myProfile && data.myProfile.name) {
                    const pName = data.myProfile.name;
                    const localP = localProfiles[pName] || {};
                    myProfile = {
                        ...data.myProfile,
                        level1Completed: Boolean(localP.level1Completed || data.myProfile.level1Completed),
                        highScore: Math.max(localP.highScore || 0, data.myProfile.highScore || 0),
                        lastScore: Math.max(localP.lastScore || 0, data.myProfile.lastScore || 0),
                        lastLevel: Math.max(localP.lastLevel || 1, data.myProfile.lastLevel || 1)
                    };
                    lockedName = pName;
                    setLockedPilotName(lockedName);
                    localProfiles[lockedName] = myProfile;
                    setLocalProfiles(localProfiles);
                }
                if (Array.isArray(data.leaderboard)) {
                    syncedBoard = buildSyncedLeaderboard(localProfiles, [...syncedBoard, ...data.leaderboard]);
                    setLocalLeaderboard(syncedBoard);
                }
            }
        }
    } catch {
        // Funciona con respaldo local
    }

    return {
        lockedName,
        myProfile,
        takenNames,
        leaderboard: syncedBoard
    };
}

export async function claimPlayerName(rawInput) {
    const ownerId = getOwnerId();
    const trimmed = String(rawInput || '').trim().toUpperCase();
    const isCreatorUnlock =
        trimmed === 'PHANTOM#13' ||
        trimmed === 'PHANTOM13' ||
        trimmed === 'PHANTOM_ADMIN';
    const targetName = isCreatorUnlock ? 'PHANTOM' : normalizeName(trimmed);

    if (!targetName || targetName.length < 2) {
        return { ok: false, error: 'Escribe un nombre válido (mínimo 2 caracteres).' };
    }

    const currentLocked = getLockedPilotName();
    if (currentLocked && !isCreatorUnlock && currentLocked !== targetName) {
        return {
            ok: false,
            error: `Tu nombre registrado es "${currentLocked}". Solo se permite un nombre por persona.`
        };
    }

    try {
        const res = await fetch('/api/arcade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'claim_name',
                ownerId,
                rawName: trimmed
            })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
            if (data?.lockedProfile?.name) {
                setLockedPilotName(data.lockedProfile.name);
            }
            return {
                ok: false,
                error: data?.error || `El nombre "${targetName}" ya está en uso.`
            };
        }
        if (data.profile) {
            const profiles = getLocalProfiles();
            const existingLocal = profiles[data.profile.name] || {};
            const mergedProfile = {
                ...data.profile,
                level1Completed: Boolean(existingLocal.level1Completed || data.profile.level1Completed),
                highScore: Math.max(existingLocal.highScore || 0, data.profile.highScore || 0),
                lastScore: Math.max(existingLocal.lastScore || 0, data.profile.lastScore || 0)
            };
            profiles[data.profile.name] = mergedProfile;
            setLocalProfiles(profiles);
            setLockedPilotName(data.profile.name);
            return { ok: true, profile: mergedProfile };
        }
    } catch {
        // Validar localmente si la API no responde
    }

    const profiles = getLocalProfiles();

    if (targetName === 'PHANTOM') {
        const phantomProfile = profiles.PHANTOM;
        if (!isCreatorUnlock && phantomProfile.ownerId !== ownerId) {
            return {
                ok: false,
                error: 'El nombre "PHANTOM" ya está en uso.'
            };
        }
        phantomProfile.ownerId = ownerId;
        profiles.PHANTOM = phantomProfile;
        setLocalProfiles(profiles);
        setLockedPilotName('PHANTOM');
        return { ok: true, profile: phantomProfile };
    }

    const existing = profiles[targetName];
    if (existing && existing.ownerId !== ownerId) {
        return {
            ok: false,
            error: `El nombre "${targetName}" ya está en uso por otro jugador. Elige otro.`
        };
    }

    if (!existing) {
        profiles[targetName] = {
            name: targetName,
            ownerId,
            level1Completed: false,
            highScore: 0,
            lastScore: 0,
            lastLevel: 1,
            updatedAt: new Date().toISOString().slice(0, 10)
        };
        setLocalProfiles(profiles);
    }

    setLockedPilotName(targetName);
    return { ok: true, profile: profiles[targetName] };
}

export async function savePlayerProgress(playerName, progressUpdate) {
    const ownerId = getOwnerId();
    const key = normalizeName(playerName || getLockedPilotName() || 'PILOTO');
    const profiles = getLocalProfiles();
    const existing = profiles[key] || {
        name: key,
        ownerId,
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
        ownerId,
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

    // Sincronizar también el Tablero de Récords inmediatamente si tiene puntuación > 0
    const syncedBoard = buildSyncedLeaderboard(profiles, getLocalLeaderboard());
    setLocalLeaderboard(syncedBoard);

    try {
        const res = await fetch('/api/arcade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_progress',
                ownerId,
                rawName: key,
                progress: updated,
                score: bestScore,
                levelReached: updated.lastLevel
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.ok && Array.isArray(data.leaderboard)) {
                const merged = buildSyncedLeaderboard(profiles, [...syncedBoard, ...data.leaderboard]);
                setLocalLeaderboard(merged);
            }
        }
    } catch {
        // Respaldo local activo
    }

    return {
        profile: updated,
        leaderboard: getLocalLeaderboard()
    };
}

export async function submitArcadeScore(playerName, score, levelReached = 1) {
    const result = await savePlayerProgress(playerName, {
        score: Math.max(0, Math.floor(Number(score) || 0)),
        highScore: Math.max(0, Math.floor(Number(score) || 0)),
        lastLevel: levelReached
    });
    return result.leaderboard;
}
