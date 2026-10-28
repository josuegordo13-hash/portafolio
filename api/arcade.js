import fs from 'fs';
import os from 'os';
import path from 'path';

const DB_FILE = path.join(os.tmpdir(), 'phantombyte_arcade_db_v2.json');

function getInitialDb() {
    return {
        profiles: {
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
        },
        leaderboard: []
    };
}

function syncLeaderboardFromProfiles(db) {
    const map = new Map();
    if (Array.isArray(db.leaderboard)) {
        for (const entry of db.leaderboard) {
            if (entry && entry.name && (entry.score || 0) > 0) {
                map.set(entry.name, {
                    name: entry.name,
                    score: Number(entry.score) || 0,
                    levelReached: entry.levelReached || 1,
                    date: entry.date || new Date().toISOString().slice(0, 10)
                });
            }
        }
    }
    if (db.profiles && typeof db.profiles === 'object') {
        for (const prof of Object.values(db.profiles)) {
            if (!prof || !prof.name) continue;
            const best = Math.max(Number(prof.highScore) || 0, Number(prof.lastScore) || 0);
            if (best > 0) {
                const prev = map.get(prof.name);
                if (!prev || best >= prev.score) {
                    map.set(prof.name, {
                        name: prof.name,
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

function readDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.profiles) {
                if (!parsed.profiles.PHANTOM) {
                    parsed.profiles.PHANTOM = getInitialDb().profiles.PHANTOM;
                }
                syncLeaderboardFromProfiles(parsed);
                return parsed;
            }
        }
    } catch {
        // Fallback a estado inicial
    }
    const init = getInitialDb();
    writeDb(init);
    return init;
}

function writeDb(data) {
    try {
        syncLeaderboardFromProfiles(data);
        fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf8');
    } catch {
        // Ignorar errores de escritura
    }
}

function normalizeName(raw) {
    return String(raw || '').trim().toUpperCase().slice(0, 16);
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const db = readDb();

    if (req.method === 'GET') {
        const ownerId = req.query?.ownerId || '';
        let myProfile = null;
        if (ownerId) {
            myProfile = Object.values(db.profiles).find((p) => p.ownerId === ownerId) || null;
        }
        syncLeaderboardFromProfiles(db);
        return res.status(200).json({
            ok: true,
            myProfile,
            takenNames: Object.keys(db.profiles),
            leaderboard: db.leaderboard.slice(0, 20)
        });
    }

    if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const { action, ownerId, rawName, progress, score, levelReached } = body;

        if (!ownerId) {
            return res.status(400).json({ ok: false, error: 'Identificador de jugador inválido.' });
        }

        const trimmedInput = String(rawName || '').trim().toUpperCase();
        const isCreatorUnlock =
            trimmedInput === 'PHANTOM#13' ||
            trimmedInput === 'PHANTOM13' ||
            trimmedInput === 'PHANTOM_ADMIN';
        const targetName = isCreatorUnlock ? 'PHANTOM' : normalizeName(trimmedInput);

        if (action === 'claim_name') {
            if (!targetName || targetName.length < 2) {
                return res.status(400).json({ ok: false, error: 'Escribe un nombre válido (mínimo 2 letras).' });
            }

            const existingForOwner = Object.values(db.profiles).find((p) => p.ownerId === ownerId);
            if (existingForOwner && !isCreatorUnlock && existingForOwner.name !== targetName) {
                return res.status(409).json({
                    ok: false,
                    error: `Ya tienes registrado el nombre "${existingForOwner.name}". Solo se permite un nombre por persona.`,
                    lockedProfile: existingForOwner
                });
            }

            if (targetName === 'PHANTOM') {
                const phantomProfile = db.profiles.PHANTOM;
                if (!isCreatorUnlock && phantomProfile.ownerId !== ownerId) {
                    return res.status(409).json({
                        ok: false,
                        error: 'El nombre "PHANTOM" ya está en uso.'
                    });
                }
                phantomProfile.ownerId = ownerId;
                db.profiles.PHANTOM = phantomProfile;
                writeDb(db);
                return res.status(200).json({
                    ok: true,
                    profile: phantomProfile,
                    takenNames: Object.keys(db.profiles),
                    leaderboard: db.leaderboard.slice(0, 20)
                });
            }

            const existingByName = db.profiles[targetName];
            if (existingByName && existingByName.ownerId !== ownerId) {
                return res.status(409).json({
                    ok: false,
                    error: `El nombre "${targetName}" ya está en uso por otro jugador. Elige otro.`
                });
            }

            if (!existingByName) {
                db.profiles[targetName] = {
                    name: targetName,
                    ownerId,
                    level1Completed: false,
                    highScore: 0,
                    lastScore: 0,
                    lastLevel: 1,
                    updatedAt: new Date().toISOString().slice(0, 10)
                };
                writeDb(db);
            }

            return res.status(200).json({
                ok: true,
                profile: db.profiles[targetName],
                takenNames: Object.keys(db.profiles),
                leaderboard: db.leaderboard.slice(0, 20)
            });
        }

        if (action === 'save_progress' || action === 'submit_score') {
            let profile =
                Object.values(db.profiles).find((p) => p.ownerId === ownerId) ||
                (targetName && db.profiles[targetName] ? db.profiles[targetName] : null);

            if (!profile && targetName) {
                profile = {
                    name: targetName,
                    ownerId,
                    level1Completed: false,
                    highScore: 0,
                    lastScore: 0,
                    lastLevel: 1,
                    updatedAt: new Date().toISOString().slice(0, 10)
                };
            }

            if (!profile) {
                return res.status(403).json({ ok: false, error: 'Primero registra tu nombre de piloto.' });
            }

            const incomingScore = Math.max(
                0,
                Math.floor(Number(score ?? progress?.score ?? progress?.highScore ?? 0) || 0)
            );
            const today = new Date().toISOString().slice(0, 10);

            profile.level1Completed = Boolean(profile.level1Completed || progress?.level1Completed);
            profile.highScore = Math.max(profile.highScore || 0, progress?.highScore || 0, incomingScore);
            if (incomingScore > 0 || progress?.score !== undefined) {
                profile.lastScore = incomingScore;
            }
            profile.lastLevel = profile.level1Completed
                ? 2
                : Math.max(profile.lastLevel || 1, progress?.lastLevel || levelReached || 1);
            profile.updatedAt = today;

            db.profiles[profile.name] = profile;
            writeDb(db);

            return res.status(200).json({
                ok: true,
                profile,
                leaderboard: db.leaderboard.slice(0, 20)
            });
        }

        return res.status(400).json({ ok: false, error: 'Acción desconocida.' });
    }

    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
}
