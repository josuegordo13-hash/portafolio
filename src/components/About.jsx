import { useScrollAnimation } from '../hooks/useScrollAnimation';

export function About() {
    const leftRef = useScrollAnimation();
    const centerRef = useScrollAnimation();
    const rightRef = useScrollAnimation();

    return (
        <section className="about" id="about">
            <div className="about-grid">
                <div ref={leftRef} className="about-left fade-in">
                    <div className="profile-image">
                        <img src="img/mascota.png" alt="Phantom Byte" className="profile-img" />
                    </div>
                </div>

                <div ref={centerRef} className="about-center fade-in">
                    <span className="section-tag">SOBRE MÍ</span>
                    <h2>¿Quién soy?</h2>
                    <p>
                        Soy un desarrollador de software apasionado por la creación de aplicaciones, videojuegos y sistemas de automatización.
                        Me especializo en crear aplicaciones y software que resuelven problemas reales,
                        combinando código limpio con un enfoque centrado en resultados.
                        Transformo ideas en soluciones digitales funcionales y elegantes.
                    </p>
                    <div className="values-grid">
                        <div className="value-item">
                            <div className="value-icon">&#x1F3AF;</div>
                            <span>Enfoque en resultados</span>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">&#x26A1;</div>
                            <span>Soluciones eficientes</span>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">&#x1F512;</div>
                            <span>Código limpio y seguro</span>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">&#x1F91D;</div>
                            <span>Compromiso y dedicación</span>
                        </div>
                    </div>
                </div>

                <div ref={rightRef} className="about-right fade-in">
                    <h3>Tecnologías que uso</h3>
                    <div className="tech-list">
                        <div className="tech-item">
                            <div className="tech-icon hex-csharp">C#</div>
                            <span>C#</span>
                        </div>
                        <div className="tech-item">
                            <div className="tech-icon html">HTML</div>
                            <span>HTML</span>
                        </div>
                        <div className="tech-item">
                            <div className="tech-icon css">CSS</div>
                            <span>CSS</span>
                        </div>
                        <div className="tech-item">
                            <div className="tech-icon" style={{ backgroundColor: '#F7DF1E', color: 'black' }}>JS</div>
                            <span>JavaScript</span>
                        </div>
                        <div className="tech-item">
                            <div className="tech-icon" style={{ backgroundColor: '#61DAFB', color: 'black' }}>Re</div>
                            <span>React</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
