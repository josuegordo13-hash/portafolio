import { useScrollAnimation } from '../hooks/useScrollAnimation';

export function Footer() {
    const footerRef = useScrollAnimation({ threshold: 0.1, triggerOnce: true });

    return (
        <footer className="footer">
            <div ref={footerRef} className="footer-container fade-in">
                <div className="footer-col">
                    <div className="footer-brand">
                        <div className="mini-logo">
                            <img src="img/logo.png" alt="Phantom Byte" className="mini-logo-img" />
                        </div>
                        <span>PHANTOM BYTE</span>
                    </div>
                    <p>
                        Desarrollo de Software y Automatización Inteligente.
                        Transformamos ideas en soluciones digitales.
                    </p>
                </div>

                <div className="footer-col">
                    <h4>Navegación</h4>
                    <nav className="footer-nav">
                        <a href="#hero">Inicio</a>
                        <a href="#about">Sobre mí</a>
                        <a href="#services">Servicios</a>
                        <a href="#contact">Contacto</a>
                    </nav>
                </div>

                <div className="footer-col">
                    <h4>Redes Sociales</h4>
                    <div className="social-icons">
                        <a href="https://www.instagram.com/official.phantombyte?utm_source=qr&igsh=NDluanVubHJ1MmIz" target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; 2024 Phantom Byte. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}
