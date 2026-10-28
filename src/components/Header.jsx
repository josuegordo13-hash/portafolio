import { useScrollAnimation } from '../hooks/useScrollAnimation';

export function Header({ activeView = 'portfolio', onNavigatePortfolio, onNavigateGames }) {
    const handleSectionClick = (e, hash) => {
        if (activeView !== 'portfolio' && onNavigatePortfolio) {
            e.preventDefault();
            onNavigatePortfolio(hash);
        }
        const mobileToggle = document.getElementById('mobileToggle');
        const navMenu = document.getElementById('navMenu');
        const headerRight = document.getElementById('headerRight');
        if (mobileToggle && navMenu && headerRight) {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
            headerRight.classList.remove('active');
        }
    };

    const handleGamesClick = (e) => {
        e.preventDefault();
        if (onNavigateGames) onNavigateGames();
        const mobileToggle = document.getElementById('mobileToggle');
        const navMenu = document.getElementById('navMenu');
        const headerRight = document.getElementById('headerRight');
        if (mobileToggle && navMenu && headerRight) {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
            headerRight.classList.remove('active');
        }
    };

    return (
        <header className="header" id="header">
            <div className="header-container">
                <div
                    className="header-left"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleSectionClick(e, '#hero')}
                >
                    <div className="logo-icon">
                        <img src="img/logo.png" alt="Phantom Byte" className="logo-img" />
                    </div>
                    <div className="logo-text">
                        <span className="brand">PHANTOM BYTE</span>
                        <span className="tagline">Software & Automatización</span>
                    </div>
                </div>

                <nav className="header-nav" id="navMenu">
                    <a href="#hero" onClick={(e) => handleSectionClick(e, '#hero')}>Inicio</a>
                    <a href="#services" onClick={(e) => handleSectionClick(e, '#services')}>Servicios</a>
                    <a href="#proyectos" onClick={(e) => handleSectionClick(e, '#proyectos')}>Proyectos</a>
                    <a
                        href="#juegos"
                        onClick={handleGamesClick}
                        className={activeView === 'games' ? 'nav-games-active' : 'nav-games-link'}
                    >
                        🎮 Juegos
                    </a>
                    <a href="#about" onClick={(e) => handleSectionClick(e, '#about')}>Sobre mí</a>
                    <a href="#contact" onClick={(e) => handleSectionClick(e, '#contact')}>Contacto</a>
                </nav>

                <div className="header-right" id="headerRight">
                    <a href="#contact" className="cta-button" onClick={(e) => handleSectionClick(e, '#contact')}>
                        Solicitar Cotización
                    </a>
                </div>

                <button className="mobile-toggle" id="mobileToggle" aria-label="Menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>
    );
}
