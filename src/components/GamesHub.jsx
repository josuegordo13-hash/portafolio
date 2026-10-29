import { useCallback, useEffect, useState } from 'react';
import { GameOverCanvas } from './GameOverCanvas';
import {
    authenticatePilot,
    checkPilotStatus,
    fetchArcadeState,
    getLegacyPilotNameHint,
    getLockedPilotName,
    logoutPilot,
    normalizeName,
    savePlayerProgress,
    submitArcadeScore
} from '../services/gameDatabase';

const GAMES_CATALOG = [
    {
        id: 'game-over',
        title: 'Game Over',
        subtitle: 'Space Shooter 2D & Dragon Solar',
        genre: "Arcade / Shoot 'em up",
        platforms: ['PC (Teclado + Mouse)', 'Móvil (Touch + Joystick)'],
        status: 'DISPONIBLE',
        cover: 'images/proyectos/PROYECTO3.png',
        screenshots: [
            'images/proyectos/PROYECTO3.png',
            'images/proyectos/PROYECTO3.1.png',
            'images/proyectos/PROYECTO3.2.png',
            'images/proyectos/PROYECTO3.3.png',
            'images/proyectos/PROYECTO3.4.png',
            'images/proyectos/PROYECTO3.5.png'
        ],
        synopsis:
            'Shooter espacial 2D creado originalmente en MonoGame y adaptado para navegador en PC y teléfonos móviles. Pilota una nave de combate capaz de transformarse en un Dragón Cósmico para canalizar un devastador Rayo Solar. Sobrevive a lluvias de meteoritos, escuadrones de insectos espaciales y enfréntate a Jefes colosales con múltiples fases de furia.',
        features: [
            'Campaña de 2 Niveles con guardado automático de progreso en tu cuenta de piloto.',
            'Sistema de Piloto + Contraseña para jugar con tu mismo nombre desde varios dispositivos.',
            'Transformación en Dragón y Rayo Solar direccional inteligente.',
            'Ranking Online en tiempo real donde todos los jugadores pueden ver las mejores puntuaciones.',
            'Adaptado al 100% para jugar tanto en computadora como en cualquier teléfono móvil.'
        ]
    }
];

export function GamesHub({ onBackToPortfolio }) {
    const [selectedGame, setSelectedGame] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeScreenshot, setActiveScreenshot] = useState(0);

    const [lockedName, setLockedName] = useState(() => getLockedPilotName());
    const [nameInput, setNameInput] = useState(() => getLegacyPilotNameHint() || '');
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [nameError, setNameError] = useState('');
    const [claiming, setClaiming] = useState(false);

    const [takenNames, setTakenNames] = useState(['PHANTOM']);
    const [remoteNameCheck, setRemoteNameCheck] = useState({
        name: '',
        exists: false,
        checking: false
    });

    const [playerProfile, setPlayerProfile] = useState({
        name: '',
        level1Completed: false,
        highScore: 0,
        lastScore: 0,
        lastLevel: 1
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingBoard, setLoadingBoard] = useState(true);
    const [refreshingBoard, setRefreshingBoard] = useState(false);
    const [saveNotice, setSaveNotice] = useState('');

    const refreshOnlineState = useCallback(async (silent = false) => {
        if (!silent) setRefreshingBoard(true);
        const state = await fetchArcadeState();
        setLeaderboard(state.leaderboard || []);
        if (Array.isArray(state.takenNames)) {
            setTakenNames(state.takenNames);
        }
        if (state.lockedName) {
            setLockedName(state.lockedName);
            setNameInput(state.lockedName);
        }
        if (state.myProfile) {
            setPlayerProfile(state.myProfile);
        }
        setLoadingBoard(false);
        setRefreshingBoard(false);
    }, []);

    // Cargar estado online al abrir o al volver del juego, y refrescar periódicamente
    useEffect(() => {
        let mounted = true;
        fetchArcadeState().then((state) => {
            if (!mounted) return;
            setLeaderboard(state.leaderboard || []);
            if (Array.isArray(state.takenNames)) {
                setTakenNames(state.takenNames);
            }
            if (state.lockedName) {
                setLockedName(state.lockedName);
                setNameInput(state.lockedName);
            }
            if (state.myProfile) {
                setPlayerProfile(state.myProfile);
            }
            setLoadingBoard(false);
        });

        let intervalId = null;
        if (!isPlaying) {
            intervalId = setInterval(() => {
                if (mounted) {
                    refreshOnlineState(true);
                }
            }, 15000);
        }

        return () => {
            mounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, refreshOnlineState]);

    // Verificar en tiempo real si el nombre escrito ya existe en la base de datos online
    const cleanCandidate = normalizeName(nameInput);
    useEffect(() => {
        if (lockedName || cleanCandidate.length < 2) {
            return;
        }
        if (cleanCandidate === 'PHANTOM' || takenNames.includes(cleanCandidate)) {
            return;
        }

        let cancelled = false;
        const timer = setTimeout(() => {
            checkPilotStatus(cleanCandidate).then((res) => {
                if (cancelled) return;
                setRemoteNameCheck({
                    name: cleanCandidate,
                    exists: Boolean(res.exists),
                    checking: false
                });
                if (res.exists) {
                    setTakenNames((prev) => Array.from(new Set([...prev, cleanCandidate])));
                }
            });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [cleanCandidate, lockedName, takenNames]);

    const isCandidateRegistered =
        cleanCandidate === 'PHANTOM' ||
        takenNames.includes(cleanCandidate) ||
        (remoteNameCheck.name === cleanCandidate && remoteNameCheck.exists);

    const handleOpenGameDetail = (game) => {
        setSelectedGame(game);
        setIsPlaying(false);
        setActiveScreenshot(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAuthenticatePilot = async (launchAfterAuth = true) => {
        setNameError('');

        if (lockedName) {
            if (launchAfterAuth) {
                setIsPlaying(true);
            }
            return;
        }

        const candidate = nameInput.trim();
        if (!candidate || normalizeName(candidate).length < 2) {
            setNameError('⚠️ Escribe tu nombre de piloto (mínimo 2 caracteres).');
            return;
        }

        const pass = passwordInput.trim();
        if (!pass || pass.length < 3) {
            setNameError(
                isCandidateRegistered
                    ? `⚠️ Ingresa la contraseña del piloto "${normalizeName(candidate)}" para desbloquearlo.`
                    : '⚠️ Coloca una contraseña (mínimo 3 caracteres) para asegurar tu nombre de piloto.'
            );
            return;
        }

        setClaiming(true);
        const result = await authenticatePilot(candidate, pass);
        setClaiming(false);

        if (!result.ok) {
            setNameError(`⚠️ ${result.error}`);
            return;
        }

        setLockedName(result.profile.name);
        setNameInput(result.profile.name);
        setPasswordInput('');
        setPlayerProfile(result.profile);
        if (Array.isArray(result.leaderboard)) {
            setLeaderboard(result.leaderboard);
        }
        if (Array.isArray(result.takenNames) && result.takenNames.length > 0) {
            setTakenNames((prev) => Array.from(new Set([...prev, ...result.takenNames])));
        }

        if (launchAfterAuth) {
            setIsPlaying(true);
        } else {
            setSaveNotice(
                result.isNew
                    ? `✅ ¡Piloto "${result.profile.name}" registrado y asegurado con tu contraseña!`
                    : `🔓 ¡Bienvenido de vuelta, ${result.profile.name}! Tu perfil y récords están activos.`
            );
            setTimeout(() => setSaveNotice(''), 4500);
        }
    };

    const handleSwitchPilot = () => {
        logoutPilot();
        setLockedName('');
        setPasswordInput('');
        setNameError('');
        setPlayerProfile({
            name: '',
            level1Completed: false,
            highScore: 0,
            lastScore: 0,
            lastLevel: 1
        });
    };

    const handleSaveProgress = async (progressData) => {
        const activePilot = lockedName || normalizeName(nameInput) || 'PILOTO';
        const result = await savePlayerProgress(activePilot, progressData);
        if (result?.profile) {
            setPlayerProfile(result.profile);
        }
        if (Array.isArray(result?.leaderboard)) {
            setLeaderboard(result.leaderboard);
        }
        if (progressData.level1Completed) {
            setSaveNotice('¡Progreso guardado! Nivel 2 desbloqueado para tu piloto.');
            setTimeout(() => setSaveNotice(''), 4500);
        }
    };

    const handleSubmitArcadeScore = async (score, levelReached) => {
        const activePilot = lockedName || normalizeName(nameInput) || 'PILOTO';
        const updatedList = await submitArcadeScore(activePilot, score, levelReached);
        setLeaderboard(updatedList);
        const freshState = await fetchArcadeState();
        if (freshState.leaderboard) {
            setLeaderboard(freshState.leaderboard);
        }
        if (freshState.myProfile) {
            setPlayerProfile(freshState.myProfile);
        }
    };

    return (
        <section id="juegos" className="games-hub-section">
            <div className="container">
                {/* Encabezado Superior de la Sala de Juegos */}
                <div className="games-hub-topbar">
                    <div>
                        <span className="section-tag">PHANTOM BYTE ARCADE</span>
                        <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>
                            {!selectedGame
                                ? 'Sala de Videojuegos'
                                : isPlaying
                                ? `Jugando: ${selectedGame.title}`
                                : selectedGame.title}
                        </h2>
                    </div>

                    <div className="games-hub-nav-btns">
                        {selectedGame && (
                            <button
                                type="button"
                                className="btn-outline"
                                onClick={() => {
                                    if (isPlaying) {
                                        setIsPlaying(false);
                                    } else {
                                        setSelectedGame(null);
                                    }
                                }}
                            >
                                ← {isPlaying ? 'Volver a la Ficha y Récords' : 'Volver al Catálogo de Juegos'}
                            </button>
                        )}
                        {onBackToPortfolio && !isPlaying && (
                            <button
                                type="button"
                                className="btn-outline"
                                onClick={onBackToPortfolio}
                            >
                                Volver al Portafolio Principal
                            </button>
                        )}
                    </div>
                </div>

                {/* VISTA 1: CATÁLOGO DE JUEGOS */}
                {!selectedGame && (
                    <div className="games-catalog-grid">
                        {GAMES_CATALOG.map((game) => (
                            <div
                                key={game.id}
                                className="game-catalog-card"
                                onClick={() => handleOpenGameDetail(game)}
                            >
                                <div className="game-catalog-cover">
                                    <img src={game.cover} alt={game.title} />
                                    <span className="game-status-pill">{game.status}</span>
                                    <div className="game-cover-overlay">
                                        <span>VER FICHA, RANKING ONLINE Y JUGAR</span>
                                    </div>
                                </div>
                                <div className="game-catalog-body">
                                    <div className="game-meta-tags">
                                        <span className="game-tag">{game.genre}</span>
                                        {game.platforms.map((p, i) => (
                                            <span key={i} className="game-tag secondary">{p}</span>
                                        ))}
                                    </div>
                                    <h3>{game.title}</h3>
                                    <p>{game.synopsis}</p>
                                    <button type="button" className="cta-button game-card-btn">
                                        Abrir Ficha del Juego →
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Tarjeta para futuros juegos */}
                        <div className="game-catalog-card upcoming">
                            <div className="upcoming-inner">
                                <div className="upcoming-icon">🎮</div>
                                <h3>Próximos Juegos</h3>
                                <p>
                                    Espacio reservado para los próximos videojuegos interactivos de Phantom Byte.
                                    Cada lanzamiento contará con su propia ficha, guardado en la nube y tablero de récords.
                                </p>
                                <span className="upcoming-badge">EN DESARROLLO</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA 2: FICHA DEL JUEGO + TABLERO DE CLASIFICACIÓN + BOTÓN JUGAR */}
                {selectedGame && !isPlaying && (
                    <div className="game-detail-layout">
                        {/* Columna Izquierda: Información, Capturas, Perfil de Guardado y Botón Jugar */}
                        <div className="game-detail-main">
                            {/* Visor principal de capturas */}
                            <div className="game-gallery-viewer">
                                <div className="game-gallery-main">
                                    <img
                                        src={selectedGame.screenshots[activeScreenshot]}
                                        alt={`${selectedGame.title} captura ${activeScreenshot + 1}`}
                                    />
                                </div>
                                <div className="game-gallery-thumbs">
                                    {selectedGame.screenshots.map((src, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`gallery-thumb ${activeScreenshot === idx ? 'active' : ''}`}
                                            onClick={() => setActiveScreenshot(idx)}
                                        >
                                            <img src={src} alt={`Miniatura ${idx + 1}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tarjeta de Lanzamiento + Registro/Acceso de Piloto con Contraseña */}
                            <div className="game-launch-box">
                                <div className="pilot-profile-row">
                                    {lockedName ? (
                                        <div className="pilot-active-card">
                                            <div className="pilot-active-header">
                                                <span className="pilot-active-label">
                                                    🔒 PILOTO ACTIVO EN ESTE DISPOSITIVO:
                                                </span>
                                                <button
                                                    type="button"
                                                    className="pilot-switch-btn"
                                                    onClick={handleSwitchPilot}
                                                >
                                                    🔄 Cambiar de Piloto
                                                </button>
                                            </div>
                                            <div className="pilot-active-name-box">
                                                <span className="pilot-active-callsign">{lockedName}</span>
                                                {lockedName === 'PHANTOM' && (
                                                    <span className="creator-crown-pill">👑 CREADOR</span>
                                                )}
                                            </div>
                                            <p className="pilot-device-sync-hint">
                                                Puedes usar el nombre <strong>{lockedName}</strong> en cualquier otro teléfono o PC ingresando tu contraseña.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="pilot-auth-form">
                                            <div className="pilot-auth-grid">
                                                <div className="pilot-input-group">
                                                    <label htmlFor="pilotNameInput">
                                                        1. NOMBRE DE PILOTO:
                                                    </label>
                                                    <input
                                                        id="pilotNameInput"
                                                        type="text"
                                                        maxLength={16}
                                                        value={nameInput}
                                                        onChange={(e) => {
                                                            setNameInput(e.target.value);
                                                            if (nameError) setNameError('');
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAuthenticatePilot(false);
                                                            }
                                                        }}
                                                        placeholder="Ej: tu alias único..."
                                                    />
                                                </div>

                                                <div className="pilot-input-group">
                                                    <label htmlFor="pilotPasswordInput">
                                                        2. CONTRASEÑA DEL PILOTO:
                                                    </label>
                                                    <div className="pilot-password-wrapper">
                                                        <input
                                                            id="pilotPasswordInput"
                                                            type={showPassword ? 'text' : 'password'}
                                                            maxLength={32}
                                                            value={passwordInput}
                                                            onChange={(e) => {
                                                                setPasswordInput(e.target.value);
                                                                if (nameError) setNameError('');
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleAuthenticatePilot(false);
                                                                }
                                                            }}
                                                            placeholder={
                                                                isCandidateRegistered
                                                                    ? 'Ingresa tu contraseña...'
                                                                    : 'Crea una contraseña...'
                                                            }
                                                        />
                                                        <button
                                                            type="button"
                                                            className="pilot-pass-toggle"
                                                            onClick={() => setShowPassword((v) => !v)}
                                                            title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                                        >
                                                            {showPassword ? '🙈' : '👁️'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Indicador inteligente en vivo (Nuevo vs Ya registrado vs Creador) */}
                                            <div
                                                className={`pilot-status-hint ${
                                                    cleanCandidate.length < 2
                                                        ? 'neutral'
                                                        : cleanCandidate === 'PHANTOM'
                                                        ? 'creator'
                                                        : isCandidateRegistered
                                                        ? 'existing'
                                                        : 'available'
                                                }`}
                                            >
                                                {cleanCandidate.length < 2 ? (
                                                    <span>
                                                        💡 <strong>¿Eres nuevo?</strong> Coloca tu nombre de piloto y una contraseña para asegurarlo. <strong>¿Ya tienes piloto?</strong> Pon tu nombre y tu contraseña para entrar desde este dispositivo.
                                                    </span>
                                                ) : cleanCandidate === 'PHANTOM' ? (
                                                    <span>
                                                        👑 <strong>Cuenta Oficial PHANTOM:</strong> Ingresa tu contraseña de creador para activar tu perfil y puntuaciones.
                                                    </span>
                                                ) : isCandidateRegistered ? (
                                                    <span>
                                                        🔐 El piloto <strong>&quot;{cleanCandidate}&quot;</strong> ya está registrado. Ingresa tu contraseña para usar este nombre y cargar tu progreso.
                                                    </span>
                                                ) : (
                                                    <span>
                                                        ✨ Piloto nuevo <strong>&quot;{cleanCandidate}&quot;</strong> disponible: coloca una contraseña para asegurar tu nombre.
                                                    </span>
                                                )}
                                            </div>

                                            {nameError && <div className="pilot-name-error">{nameError}</div>}

                                            <div className="pilot-QuickActions">
                                                <button
                                                    type="button"
                                                    className="pilot-verify-btn"
                                                    onClick={() => handleAuthenticatePilot(false)}
                                                    disabled={claiming}
                                                >
                                                    {isCandidateRegistered
                                                        ? '🔓 Desbloquear mi Piloto'
                                                        : '🛡️ Asegurar Nombre de Piloto'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pilot-saved-status">
                                        <div className="saved-stat">
                                            <span className="stat-label">Campaña Guardada</span>
                                            <span className={`stat-value ${playerProfile.level1Completed ? 'unlocked' : ''}`}>
                                                {playerProfile.level1Completed
                                                    ? '✓ Nivel 1 Superado (Nivel 2 Desbloqueado)'
                                                    : 'Nivel 1 en curso'}
                                            </span>
                                        </div>
                                        <div className="saved-stat">
                                            <span className="stat-label">Tu Récord Personal</span>
                                            <span className="stat-value gold">{playerProfile.highScore || 0} PTS</span>
                                        </div>
                                    </div>
                                </div>

                                {saveNotice && <div className="save-notice-banner">{saveNotice}</div>}

                                <button
                                    type="button"
                                    className="play-now-hero-btn"
                                    onClick={() => handleAuthenticatePilot(true)}
                                    disabled={claiming}
                                >
                                    <span className="play-icon">▶</span>
                                    <span>
                                        {claiming
                                            ? 'VERIFICANDO PILOTO Y CONTRASEÑA...'
                                            : lockedName
                                            ? `JUGAR AHORA COMO ${lockedName}`
                                            : isCandidateRegistered && cleanCandidate.length >= 2
                                            ? `VERIFICAR CONTRASEÑA Y JUGAR COMO ${cleanCandidate}`
                                            : cleanCandidate.length >= 2
                                            ? `REGISTRAR "${cleanCandidate}" Y JUGAR AHORA`
                                            : 'REGISTRAR O INICIAR PILOTO Y JUGAR'}
                                    </span>
                                </button>
                            </div>

                            {/* Descripción y Controles */}
                            <div className="game-info-card">
                                <h3>¿De qué trata {selectedGame.title}?</h3>
                                <p>{selectedGame.synopsis}</p>
                                <ul className="game-features-list">
                                    {selectedGame.features.map((feat, i) => (
                                        <li key={i}>{feat}</li>
                                    ))}
                                </ul>

                                <div className="controls-grid">
                                    <div className="controls-box">
                                        <h4>💻 Controles en PC</h4>
                                        <ul>
                                            <li><strong>W, A, S, D / Flechas:</strong> Mover nave o dragón</li>
                                            <li><strong>ESPACIO:</strong> Disparar cañón de plasma</li>
                                            <li><strong>Tecla E:</strong> Transformarse en Dragón / Nave</li>
                                            <li><strong>Click Izquierdo + Mouse:</strong> Apuntar y disparar Rayo Solar</li>
                                            <li><strong>TAB:</strong> Pausar partida</li>
                                        </ul>
                                    </div>
                                    <div className="controls-box">
                                        <h4>📱 Controles en Teléfono Móvil</h4>
                                        <ul>
                                            <li><strong>Joystick Izquierdo:</strong> Mover nave o dragón en 360°</li>
                                            <li><strong>Botón Derecho (Fire):</strong> Disparar proyectiles en modo Nave</li>
                                            <li><strong>Botón Dragón:</strong> Transformarse en Dragón / Nave</li>
                                            <li><strong>Joystick Derecho (Modo Dragón):</strong> Disparar y mover el Rayo Solar independientemente</li>
                                            <li><strong>Botón ||:</strong> Pausar o guardar partida</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Tablero de Clasificación Online (Leaderboard) */}
                        <aside className="game-leaderboard-panel">
                            <div className="leaderboard-header">
                                <span className="trophy-icon">🏆</span>
                                <div style={{ flex: 1 }}>
                                    <div className="leaderboard-title-row">
                                        <h3>RANKING ONLINE</h3>
                                        <span className="online-live-badge">
                                            <span className="live-dot"></span> EN VIVO
                                        </span>
                                    </div>
                                    <p>Tabla global de pilotos y puntuaciones</p>
                                </div>
                                <button
                                    type="button"
                                    className={`lb-refresh-btn ${refreshingBoard ? 'spinning' : ''}`}
                                    onClick={() => refreshOnlineState(false)}
                                    title="Actualizar tabla de posiciones"
                                >
                                    ↻
                                </button>
                            </div>

                            {loadingBoard ? (
                                <div className="leaderboard-loading">Cargando ranking online...</div>
                            ) : leaderboard.length === 0 ? (
                                <div className="leaderboard-empty">
                                    <p>Aún no hay récords registrados en la tabla online.</p>
                                    <span>¡Asegura tu nombre de piloto y juega una partida para estrenar el marcador!</span>
                                </div>
                            ) : (
                                <div className="leaderboard-list">
                                    {leaderboard.map((entry, idx) => {
                                        const isCurrentPlayer =
                                            entry.name.toUpperCase() === (lockedName || nameInput || '').trim().toUpperCase();
                                        const isCreatorRow = entry.name.toUpperCase() === 'PHANTOM';
                                        return (
                                            <div
                                                key={`${entry.name}-${idx}`}
                                                className={`leaderboard-row ${idx < 3 ? `top-${idx + 1}` : ''} ${
                                                    isCurrentPlayer ? 'is-me' : ''
                                                }`}
                                            >
                                                <div className="lb-rank">#{idx + 1}</div>
                                                <div className="lb-player">
                                                    <span className="lb-name">
                                                        {entry.name}
                                                        {isCreatorRow && (
                                                            <span className="lb-creator-tag" title="Creador del juego">
                                                                👑
                                                            </span>
                                                        )}
                                                        {isCurrentPlayer && (
                                                            <span className="lb-you-tag">TÚ</span>
                                                        )}
                                                    </span>
                                                    <span className="lb-meta">
                                                        Nivel {entry.levelReached || 1} • {entry.date || 'Reciente'}
                                                    </span>
                                                </div>
                                                <div className="lb-score">{entry.score} PTS</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="leaderboard-footer-note">
                                💡 Tus puntuaciones en <strong>Campaña</strong> y <strong>Modo Arcade</strong> se suben automáticamente a este ranking online bajo tu nombre de piloto.
                            </div>
                        </aside>
                    </div>
                )}

                {/* VISTA 3: JUEGO EN EJECUCIÓN */}
                {selectedGame && isPlaying && (
                    <div className="game-active-stage">
                        <GameOverCanvas
                            playerName={lockedName || normalizeName(nameInput) || 'PILOTO'}
                            initialProfile={playerProfile}
                            onSaveProgress={handleSaveProgress}
                            onSubmitArcadeScore={handleSubmitArcadeScore}
                            onExitToCatalog={() => setIsPlaying(false)}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
