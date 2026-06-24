import { useScrollAnimation } from '../hooks/useScrollAnimation';

export function Header() {
    return (
        <header className="header" id="header">
            <div className="header-container">
                <div className="header-left">
                    <div className="logo-icon">
                        <img src="img/logo.png" alt="Phantom Byte" className="logo-img" />
                    </div>
                    <div className="logo-text">
                        <span className="brand">PHANTOM BYTE</span>
                        <span className="tagline">Software & Automatización</span>
                    </div>
                </div>

                <nav className="header-nav" id="navMenu">
                    <a href="#hero">Inicio</a>
                    <a href="#services">Servicios</a>
                    <a href="#proyectos">Proyectos</a>
                    <a href="#about">Sobre mí</a>
                    <a href="#contact">Contacto</a>
                </nav>

                <div className="header-right" id="headerRight">
                    <a href="#contact" className="cta-button">Solicitar Cotización</a>
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
