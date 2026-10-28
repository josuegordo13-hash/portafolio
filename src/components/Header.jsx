import { useState } from 'react';

export function Header({ activeView = 'portfolio', onNavigatePortfolio, onNavigateGames }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMobileMenu = () => {
        setMenuOpen(false);
        const mobileToggle = document.getElementById('mobileToggle');
        const navMenu = document.getElementById('navMenu');
        const headerRight = document.getElementById('headerRight');
        if (mobileToggle && navMenu && headerRight) {
            mobileToggle.classList.remove('active', 'open');
            navMenu.classList.remove('active', 'open');
            headerRight.classList.remove('active', 'open');
        }
    };

    const handleSectionClick = (e, hash) => {
        closeMobileMenu();
        if (activeView !== 'portfolio' && onNavigatePortfolio) {
            e.preventDefault();
            onNavigatePortfolio(hash);
        }
    };

    const handleGamesClick = (e) => {
        e.preventDefault();
        closeMobileMenu();
        if (onNavigateGames) onNavigateGames();
    };

    const handleToggleMobileMenu = () => {
        setMenuOpen((prev) => !prev);
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

                <nav className={`header-nav ${menuOpen ? 'open active' : ''}`} id="navMenu">
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

                <div className={`header-right ${menuOpen ? 'open active' : ''}`} id="headerRight">
                    <a href="#contact" className="cta-button" onClick={(e) => handleSectionClick(e, '#contact')}>
                        Solicitar Cotización
                    </a>
                </div>

                <button
                    type="button"
                    className={`mobile-toggle ${menuOpen ? 'open active' : ''}`}
                    id="mobileToggle"
                    aria-label="Menu"
                    aria-expanded={menuOpen}
                    onClick={handleToggleMobileMenu}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>
    );
}
