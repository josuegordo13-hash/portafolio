import { useEffect, useRef, useState } from 'react';

export function PrincesasCanvas({
    playerName = 'PILOTO',
    onSaveProgress,
    onSubmitArcadeScore,
    onExitToCatalog
}) {
    const containerRef = useRef(null);
    const iframeRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFsHint, setShowFsHint] = useState(false);
    const fsHintTimerRef = useRef(null);
    const [touchMode, setTouchMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 920;
    });

    const callbacksRef = useRef({ onSaveProgress, onSubmitArcadeScore });
    useEffect(() => {
        callbacksRef.current = { onSaveProgress, onSubmitArcadeScore };
    }, [onSaveProgress, onSubmitArcadeScore]);

    useEffect(() => {
        const handleResize = () => {
            setTouchMode(('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 920);
        };
        const handleFsChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
            }
        };
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'PRINCESAS_LEVEL1_COMPLETED') {
                const score = Number(event.data.score) || 1500;
                if (callbacksRef.current.onSaveProgress) {
                    callbacksRef.current.onSaveProgress({
                        level1Completed: true,
                        score,
                        highScore: score,
                        lastLevel: 1
                    });
                }
                if (callbacksRef.current.onSubmitArcadeScore) {
                    callbacksRef.current.onSubmitArcadeScore(score, 1);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('fullscreenchange', handleFsChange);
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('fullscreenchange', handleFsChange);
            window.removeEventListener('message', handleMessage);
            if (fsHintTimerRef.current) clearTimeout(fsHintTimerRef.current);
        };
    }, []);

    const enterFullscreen = async () => {
        setIsFullscreen(true);
        setShowFsHint(true);
        if (fsHintTimerRef.current) clearTimeout(fsHintTimerRef.current);
        fsHintTimerRef.current = setTimeout(() => {
            setShowFsHint(false);
        }, 1200);

        const el = containerRef.current;
        if (!el) return;
        try {
            if (!document.fullscreenElement && el.requestFullscreen) {
                await el.requestFullscreen({ navigationUI: 'hide' });
            }
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        } catch {
            // En iOS Safari o navegadores sin Fullscreen API nativa, se mantiene el modo pantalla completa CSS
        }
    };

    const exitFullscreen = async () => {
        setIsFullscreen(false);
        setShowFsHint(false);
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                await document.exitFullscreen();
            }
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        } catch {
            // Ignorar
        }
    };

    const toggleFullscreen = () => {
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    };

    return (
        <div ref={containerRef} className={`gameover-player-shell ${isFullscreen ? 'is-fullscreen' : ''}`}>
            {!isFullscreen && (
                <div className="gameover-player-toolbar">
                    <div className="gameover-player-status">
                        <span className="status-dot"></span>
                        <span>JUGADOR: <strong>{playerName || 'INVITADO'}</strong></span>
                        {touchMode && <span className="mobile-badge">MODO MÓVIL ACTIVO (GIRA EL TELÉFONO O USA ⛶)</span>}
                    </div>
                    <div className="gameover-player-actions">
                        <button
                            type="button"
                            className="game-tool-btn"
                            onClick={toggleFullscreen}
                        >
                            ⛶ Pantalla Completa
                        </button>
                        {onExitToCatalog && (
                            <button
                                type="button"
                                className="game-tool-btn exit"
                                onClick={onExitToCatalog}
                            >
                                ✕ Volver a la Ficha
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="gameover-canvas-stage" style={{ background: '#140824' }}>
                {isFullscreen && (
                    <>
                        <button
                            type="button"
                            className="fullscreen-exit-x"
                            onClick={exitFullscreen}
                            aria-label="Salir"
                        >
                            ✕
                        </button>
                        {showFsHint && (
                            <div className="fullscreen-quick-hint">
                                ← Salir de pantalla completa
                            </div>
                        )}
                    </>
                )}
                <iframe
                    ref={iframeRef}
                    src="/games/princesas/index.html?v=10"
                    title="Princesas: La historia nunca contada"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block',
                        background: '#140824'
                    }}
                    allow="fullscreen; autoplay"
                />
            </div>
        </div>
    );
}
