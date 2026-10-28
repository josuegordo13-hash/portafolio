// Servicio de Base de Datos Ligera para Juegos (Progreso de Jugadores + Leaderboard Global Arcade)
// Soporta sincronización en la nube (Firebase Realtime DB / REST KV / Vercel API) + persistencia local instantánea.

const STORAGE_KEY_LEADERBOARD = 'phantombyte_gameover_leaderboard_v1';
const STORAGE_KEY_PROFILES = 'phantombyte_gameover_profiles_v1';
const STORAGE_KEY_CURRENT_PLAYER = 'phantombyte_current_player_v1';

// Endpoint opcional en la nube (configurable en .env con VITE_GAME_DB_URL si se desea conectar un backend propio)
const CLOUD_DB_URL = import.meta.env.VITE_GAME_DB_URL || '';

// Puntuaciones iniciales de referencia para el tablero Arcade cuando aún no hay registros previos
const SEED_LEADERBOARD = [
    { name: 'PHANTOM', score: 340, levelReached: 2, date: '2026-10-25' },
    { name: 'NOVA_X', score: 265, levelReached: 2, date: '2026-10-26' },
    { name: 'DRAKO', score: 195, levelReached: 2, date: '2026-10-26' },
    { name: 'VORTEX', score: 140, levelReached: 1, date: '2026-10-27' },
    { name: 'CYBER_01', score: 105, levelReached: 1, date: '2026-10-27' }
];

function normalizeName(name) {
    return (name || 'PILOTO').trim().toUpperCase().slice(0, 16) || 'PILOTO';
}

function getLocalProfiles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
        if (!raw) return {};
        return JSON.parse(raw) || {};
    } catch {
        return {};
    }
}

function setLocalProfiles(profiles) {
    try {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch {
        // Ignorar errores de cuota
    }
}

function getLocalLeaderboard() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(SEED_LEADERBOARD));
            return [...SEED_LEADERBOARD];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_LEADERBOARD];
    } catch {
        return [...SEED_LEADERBOARD];
    }
}

function setLocalLeaderboard(list) {
    try {
        localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(list));
    } catch {
        // Ignorar errores
    }
}

export function getSavedPlayerName() {
    try {
        return localStorage.getItem(STORAGE_KEY_CURRENT_PLAYER) || '';
    } catch {
        return '';
    }
}

export function setSavedPlayerName(name) {
    try {
        localStorage.setItem(STORAGE_KEY_CURRENT_PLAYER, (name || '').trim().slice(0, 16));
    } catch {
        // Ignorar
    }
}

// Carga el progreso guardado de un jugador (Nivel 1 completado, Nivel 2 desbloqueado, HighScore, último puntaje)
export async function loadPlayerProgress(playerName) {
    const key = normalizeName(playerName);
    const profiles = getLocalProfiles();
    let localProfile = profiles[key] || {
        name: key,
        level1Completed: false,
        highScore: 0,
        lastScore: 0,
        lastLevel: 1,
        updatedAt: null
    };

    if (CLOUD_DB_URL) {
        try {
            const res = await fetch(`${CLOUD_DB_URL.replace(/\/$/, '')}/profiles/${encodeURIComponent(key)}.json`);
            if (res.ok) {
                const cloudData = await res.json();
                if (cloudData) {
                    localProfile = {
                        name: key,
                        level1Completed: Boolean(localProfile.level1Completed || cloudData.level1Completed),
                        highScore: Math.max(localProfile.highScore || 0, cloudData.highScore || 0),
                        lastScore: cloudData.lastScore ?? localProfile.lastScore ?? 0,
                        lastLevel: Math.max(localProfile.lastLevel || 1, cloudData.lastLevel || 1),
                        updatedAt: cloudData.updatedAt || localProfile.updatedAt
                    };
                    profiles[key] = localProfile;
                    setLocalProfiles(profiles);
                }
            }
        } catch {
            // Usar respaldo local silenciosamente
        }
    }

    return localProfile;
}

// Guarda el progreso del jugador (cuando completa el Nivel 1 o actualiza su récord/progreso)
export async function savePlayerProgress(playerName, progressUpdate) {
    const key = normalizeName(playerName);
    const profiles = getLocalProfiles();
    const existing = profiles[key] || {
        name: key,
        level1Completed: false,
        highScore: 0,
        lastScore: 0,
        lastLevel: 1
    };

    const updated = {
        name: key,
        level1Completed: Boolean(existing.level1Completed || progressUpdate.level1Completed),
        highScore: Math.max(existing.highScore || 0, progressUpdate.highScore || 0, progressUpdate.score || 0),
        lastScore: progressUpdate.score !== undefined ? progressUpdate.score : existing.lastScore,
        lastLevel: progressUpdate.level1Completed ? 2 : Math.max(existing.lastLevel || 1, progressUpdate.lastLevel || 1),
        updatedAt: new Date().toISOString().slice(0, 10)
    };

    profiles[key] = updated;
    setLocalProfiles(profiles);

    if (CLOUD_DB_URL) {
        try {
            await fetch(`${CLOUD_DB_URL.replace(/\/$/, '')}/profiles/${encodeURIComponent(key)}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
        } catch {
            // Guardado en local exitoso
        }
    }

    return updated;
}

// Obtiene el Tablero de Clasificación (Top Puntuaciones del Modo Arcade)
export async function fetchArcadeLeaderboard() {
    let localList = getLocalLeaderboard();

    if (CLOUD_DB_URL) {
        try {
            const res = await fetch(`${CLOUD_DB_URL.replace(/\/$/, '')}/leaderboard.json`);
            if (res.ok) {
                const cloudData = await res.json();
                if (Array.isArray(cloudData)) {
                    localList = mergeLeaderboards(localList, cloudData);
                    setLocalLeaderboard(localList);
                } else if (cloudData && typeof cloudData === 'object') {
                    localList = mergeLeaderboards(localList, Object.values(cloudData));
                    setLocalLeaderboard(localList);
                }
            }
        } catch {
            // Mantener lista local
        }
    }

    return localList
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 15);
}

function mergeLeaderboards(listA, listB) {
    const map = new Map();
    [...listA, ...listB].forEach(entry => {
        if (!entry || !entry.name) return;
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

// Registra una nueva puntuación en el Tablero Arcade
export async function submitArcadeScore(playerName, score, levelReached = 1) {
    const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
    const key = normalizeName(playerName);
    const today = new Date().toISOString().slice(0, 10);

    // También actualiza el perfil del jugador
    await savePlayerProgress(key, { score: cleanScore, highScore: cleanScore, lastLevel: levelReached });

    if (cleanScore <= 0) {
        return await fetchArcadeLeaderboard();
    }

    const currentList = getLocalLeaderboard();
    const updatedList = mergeLeaderboards(currentList, [
        { name: key, score: cleanScore, levelReached, date: today }
    ]);
    setLocalLeaderboard(updatedList);

    if (CLOUD_DB_URL) {
        try {
            await fetch(`${CLOUD_DB_URL.replace(/\/$/, '')}/leaderboard.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedList)
            });
        } catch {
            // Respaldo local activo
        }
    }

    return updatedList.slice(0, 15);
}
