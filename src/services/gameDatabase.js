// Servicio de Base de Datos Ligera para Juegos
// - Tablero de récords 100% real (sin nombres ficticios, inicia vacío hasta que alguien juegue).
// - Un nombre único por persona (bloqueado una vez elegido).
// - El nombre "PHANTOM" está reservado exclusivamente para el creador.

const STORAGE_KEY_LEADERBOARD = 'phantombyte_gameover_leaderboard_v2';
const STORAGE_KEY_PROFILES = 'phantombyte_gameover_profiles_v2';
const STORAGE_KEY_OWNER_ID = 'phantombyte_owner_id_v2';
const STORAGE_KEY_LOCKED_NAME = 'phantombyte_locked_pilot_name_v2';

// Limpiar datos de prueba antiguos (v1) si existían en el navegador
try {
    localStorage.removeItem('phantombyte_gameover_leaderboard_v1');
    localStorage.removeItem('phantombyte_gameover_profiles_v1');
    localStorage.removeItem('phantombyte_current_player_v1');
} catch {
    // Ignorar
}

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
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
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

// Obtiene el estado inicial del servidor (/api/arcade) y del almacenamiento local
export async function fetchArcadeState() {
    const ownerId = getOwnerId();
    const localProfiles = getLocalProfiles();
    let localLeaderboard = getLocalLeaderboard();
    let lockedName = getLockedPilotName();
    let myProfile = lockedName ? localProfiles[lockedName] : null;
    let takenNames = Object.keys(localProfiles);

    try {
        const res = await fetch(`/api/arcade?ownerId=${encodeURIComponent(ownerId)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) {
                if (Array.isArray(data.takenNames)) {
                    takenNames = Array.from(new Set([...takenNames, ...data.takenNames]));
                }
                if (Array.isArray(data.leaderboard)) {
                    localLeaderboard = mergeLeaderboards(localLeaderboard, data.leaderboard);
                    setLocalLeaderboard(localLeaderboard);
                }
                if (data.myProfile && data.myProfile.name) {
                    myProfile = data.myProfile;
                    lockedName = data.myProfile.name;
                    setLockedPilotName(lockedName);
                    localProfiles[lockedName] = myProfile;
                    setLocalProfiles(localProfiles);
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
        leaderboard: localLeaderboard.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20)
    };
}

// Registra y bloquea un nombre único para esta persona (valida que no esté repetido y protege PHANTOM)
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

    // Intentar validar primero en la API en línea (/api/arcade)
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
            profiles[data.profile.name] = data.profile;
            setLocalProfiles(profiles);
            setLockedPilotName(data.profile.name);
            return { ok: true, profile: data.profile };
        }
    } catch {
        // Si no hay respuesta de red, validar contra perfiles locales
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
    const key = normalizeName(playerName);
    const profiles = getLocalProfiles();
    const existing = profiles[key] || {
        name: key,
        ownerId,
        level1Completed: false,
        highScore: 0,
        lastScore: 0,
        lastLevel: 1
    };

    const updated = {
        ...existing,
        name: key,
        ownerId,
        level1Completed: Boolean(existing.level1Completed || progressUpdate.level1Completed),
        highScore: Math.max(existing.highScore || 0, progressUpdate.highScore || 0, progressUpdate.score || 0),
        lastScore: progressUpdate.score !== undefined ? progressUpdate.score : existing.lastScore,
        lastLevel: progressUpdate.level1Completed ? 2 : Math.max(existing.lastLevel || 1, progressUpdate.lastLevel || 1),
        updatedAt: new Date().toISOString().slice(0, 10)
    };

    profiles[key] = updated;
    setLocalProfiles(profiles);

    try {
        await fetch('/api/arcade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_progress',
                ownerId,
                rawName: key,
                progress: updated
            })
        });
    } catch {
        // Respaldo local activo
    }

    return updated;
}

function mergeLeaderboards(listA, listB) {
    const map = new Map();
    [...listA, ...listB].forEach((entry) => {
        if (!entry || !entry.name || (entry.score || 0) <= 0) return;
        const key = normalizeName(entry.name);
        const existing = map.get(key);
        if (!existing || (entry.score || 0) > (existing.score || 0)) {
            map.set(key, {
                name: key,
                score: Number(entry.score) || 0,
                levelReached: entry.levelReached || 1,
                date: entry.date || new Date().toISOString().slice(0, 10)
            });
        }
    });
    return Array.from(map.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
}

export async function submitArcadeScore(playerName, score, levelReached = 1) {
    const ownerId = getOwnerId();
    const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
    const key = normalizeName(playerName);
    const today = new Date().toISOString().slice(0, 10);

    await savePlayerProgress(key, { score: cleanScore, highScore: cleanScore, lastLevel: levelReached });

    let currentList = getLocalLeaderboard();
    if (cleanScore > 0) {
        currentList = mergeLeaderboards(currentList, [
            { name: key, score: cleanScore, levelReached, date: today }
        ]);
        setLocalLeaderboard(currentList);
    }

    try {
        const res = await fetch('/api/arcade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'submit_score',
                ownerId,
                rawName: key,
                score: cleanScore,
                levelReached
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.ok && Array.isArray(data.leaderboard)) {
                currentList = mergeLeaderboards(currentList, data.leaderboard);
                setLocalLeaderboard(currentList);
            }
        }
    } catch {
        // Respaldo local activo
    }

    return currentList.slice(0, 20);
}
