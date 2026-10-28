import { useEffect, useState } from 'react';
import { GameOverCanvas } from './GameOverCanvas';
import {
    claimPlayerName,
    fetchArcadeState,
    getLockedPilotName,
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
            'Campaña de 2 Niveles con guardado automático de progreso (si completas el Nivel 1, puedes continuar en el Nivel 2 cuando regreses).',
            'Transformación en Dragón y Rayo Solar direccional inteligente.',
            'Modo Arcade infinito conectado al Tablero de Clasificación con las mejores puntuaciones.',
            'Adaptado al 100% para jugar tanto en computadora como en cualquier teléfono móvil.'
        ]
    }
];

export function GamesHub({ onBackToPortfolio }) {
    const [selectedGame, setSelectedGame] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeScreenshot, setActiveScreenshot] = useState(0);

    const [lockedName, setLockedName] = useState(() => getLockedPilotName());
    const [nameInput, setNameInput] = useState(() => getLockedPilotName() || '');
    const [nameError, setNameError] = useState('');
    const [claiming, setClaiming] = useState(false);

    const [playerProfile, setPlayerProfile] = useState({
        name: '',
        level1Completed: false,
        highScore: 0,
        lastScore: 0,
        lastLevel: 1
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingBoard, setLoadingBoard] = useState(true);
    const [saveNotice, setSaveNotice] = useState('');

    // Cargar estado real (sin nombres ficticios) al abrir
    useEffect(() => {
        let mounted = true;
        fetchArcadeState().then((state) => {
            if (!mounted) return;
            setLeaderboard(state.leaderboard || []);
            if (state.lockedName) {
                setLockedName(state.lockedName);
                setNameInput(state.lockedName);
            }
            if (state.myProfile) {
                setPlayerProfile(state.myProfile);
            }
            setLoadingBoard(false);
        });
        return () => {
            mounted = false;
        };
    }, []);

    const handleOpenGameDetail = (game) => {
        setSelectedGame(game);
        setIsPlaying(false);
        setActiveScreenshot(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStartPlaying = async () => {
        setNameError('');

        // Si ya tiene su nombre único bloqueado en su dispositivo, entra directo
        if (lockedName) {
            setIsPlaying(true);
            return;
        }

        const candidate = nameInput.trim();
        if (!candidate) {
            setNameError('⚠️ Escribe tu nombre de piloto antes de jugar.');
            return;
        }

        setClaiming(true);
        const result = await claimPlayerName(candidate);
        setClaiming(false);

        if (!result.ok) {
            setNameError(`⚠️ ${result.error}`);
            return;
        }

        setLockedName(result.profile.name);
        setNameInput(result.profile.name);
        setPlayerProfile(result.profile);
        setIsPlaying(true);
    };

    const handleSaveProgress = async (progressData) => {
        const activePilot = lockedName || nameInput || 'PILOTO';
        const updated = await savePlayerProgress(activePilot, progressData);
        setPlayerProfile(updated);
        if (progressData.level1Completed) {
            setSaveNotice('¡Progreso guardado! Nivel 2 desbloqueado para tu piloto.');
            setTimeout(() => setSaveNotice(''), 4500);
        }
    };

    const handleSubmitArcadeScore = async (score, levelReached) => {
        const activePilot = lockedName || nameInput || 'PILOTO';
        const updatedList = await submitArcadeScore(activePilot, score, levelReached);
        setLeaderboard(updatedList);
        const freshState = await fetchArcadeState();
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
                                        <span>VER FICHA, RÉCORDS Y JUGAR</span>
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

                            {/* Tarjeta de Lanzamiento + Registro de Nombre Único y Guardado de Progreso */}
                            <div className="game-launch-box">
                                <div className="pilot-profile-row">
                                    <div className="pilot-input-group">
                                        <label htmlFor="pilotNameInput">
                                            {lockedName
                                                ? '🔒 PILOTO REGISTRADO (1 NOMBRE POR PERSONA):'
                                                : 'ELIGE TU NOMBRE DE PILOTO ÚNICO (SE QUEDARÁ PARA TI):'}
                                        </label>
                                        <input
                                            id="pilotNameInput"
                                            type="text"
                                            maxLength={16}
                                            value={nameInput}
                                            disabled={Boolean(lockedName)}
                                            onChange={(e) => {
                                                setNameInput(e.target.value);
                                                if (nameError) setNameError('');
                                            }}
                                            placeholder="Escribe tu alias único..."
                                        />
                                        {nameError && <div className="pilot-name-error">{nameError}</div>}
                                    </div>

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
                                    onClick={handleStartPlaying}
                                    disabled={claiming}
                                >
                                    <span className="play-icon">▶</span>
                                    <span>
                                        {claiming
                                            ? 'VERIFICANDO NOMBRE...'
                                            : lockedName
                                            ? `JUGAR COMO ${lockedName}`
                                            : 'REGISTRAR NOMBRE Y JUGAR AHORA'}
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
                                            <li><strong>Botón Derecho (Fire):</strong> Disparar proyectiles</li>
                                            <li><strong>Botón Dragón:</strong> Transformarse en Dragón / Nave</li>
                                            <li><strong>Toque en Pantalla (Modo Dragón):</strong> Dirigir el Rayo Solar hacia tu dedo</li>
                                            <li><strong>Botón ||:</strong> Pausar o guardar partida</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Tablero de Clasificación (Leaderboard Arcade) */}
                        <aside className="game-leaderboard-panel">
                            <div className="leaderboard-header">
                                <span className="trophy-icon">🏆</span>
                                <div>
                                    <h3>TABLERO DE RÉCORDS</h3>
                                    <p>Mejores puntuaciones en Modo Arcade</p>
                                </div>
                            </div>

                            {loadingBoard ? (
                                <div className="leaderboard-loading">Cargando puntuaciones...</div>
                            ) : leaderboard.length === 0 ? (
                                <div className="leaderboard-empty">
                                    <p>Aún no hay récords registrados en la tabla.</p>
                                    <span>¡Juega una partida en Modo Arcade para estrenar el marcador!</span>
                                </div>
                            ) : (
                                <div className="leaderboard-list">
                                    {leaderboard.map((entry, idx) => {
                                        const isCurrentPlayer =
                                            entry.name.toUpperCase() === (lockedName || nameInput || '').trim().toUpperCase();
                                        return (
                                            <div
                                                key={`${entry.name}-${idx}`}
                                                className={`leaderboard-row ${idx < 3 ? `top-${idx + 1}` : ''} ${
                                                    isCurrentPlayer ? 'is-me' : ''
                                                }`}
                                            >
                                                <div className="lb-rank">#{idx + 1}</div>
                                                <div className="lb-player">
                                                    <span className="lb-name">{entry.name}</span>
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
                                💡 Entra a <strong>CONTINUE → MODO ARCADE</strong> dentro del juego para registrar tu récord automáticamente en este tablero.
                            </div>
                        </aside>
                    </div>
                )}

                {/* VISTA 3: JUEGO EN EJECUCIÓN */}
                {selectedGame && isPlaying && (
                    <div className="game-active-stage">
                        <GameOverCanvas
                            playerName={lockedName || nameInput || 'PILOTO'}
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
