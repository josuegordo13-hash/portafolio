import { useScrollAnimation } from '../hooks/useScrollAnimation';

export function Hero() {
    const heroLeftRef = useScrollAnimation();
    const heroRightRef = useScrollAnimation();

    return (
        <section className="hero" id="hero">
            <div className="hero-container">
                <div ref={heroLeftRef} className="hero-left fade-in">
                    <h1 className="hero-title cyber-glitch" data-text="PHANTOM BYTE">
                        PHANTOM<br/>BYTE
                    </h1>
                    <p className="hero-subtitle">Software & Automatización Inteligente para potenciar tus ideas.</p>
                    <p className="hero-description">
                        Creamos software, aplicaciones y sistemas de automatización que transforman
                        la forma en que trabajas. Tecnología de punta para resultados reales.
                    </p>
                    <div className="hero-buttons">
                        <a href="#services" className="btn-primary">Ver Servicios</a>
                        <a href="#contact" className="btn-secondary">Contáctame</a>
                    </div>
                </div>

                <div ref={heroRightRef} className="hero-right fade-in">
                    <div className="hero-visual">
                        <div className="particles-container">
                            <div className="particle" style={{ top: '10%', left: '15%', '--duration': '4s', '--delay': '0s' }}></div>
                            <div className="particle purple" style={{ top: '25%', left: '75%', '--duration': '5s', '--delay': '1s' }}></div>
                            <div className="particle" style={{ top: '50%', left: '10%', '--duration': '3.5s', '--delay': '0.5s' }}></div>
                            <div className="particle purple" style={{ top: '70%', left: '85%', '--duration': '4.5s', '--delay': '2s' }}></div>
                            <div className="particle" style={{ top: '40%', left: '60%', '--duration': '6s', '--delay': '0.3s' }}></div>
                            <div className="particle purple" style={{ top: '85%', left: '30%', '--duration': '3.8s', '--delay': '1.5s' }}></div>
                            <div className="particle" style={{ top: '15%', left: '50%', '--duration': '5.5s', '--delay': '2.5s' }}></div>
                            <div className="particle" style={{ top: '60%', left: '40%', '--duration': '4.2s', '--delay': '0.8s' }}></div>

                            <div className="pixel-fragment" style={{ top: '20%', left: '10%', '--duration': '6s', '--delay': '0s' }}></div>
                            <div className="pixel-fragment" style={{ top: '60%', left: '80%', '--duration': '7s', '--delay': '1s' }}></div>
                            <div className="pixel-fragment" style={{ top: '35%', left: '85%', '--duration': '5s', '--delay': '2s' }}></div>
                            <div className="pixel-fragment" style={{ top: '75%', left: '15%', '--duration': '8s', '--delay': '0.5s' }}></div>
                        </div>



                        <div className="logo-3d">
                            <img src="img/logo.png" alt="Phantom Byte Logo" className="hero-logo-img" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
