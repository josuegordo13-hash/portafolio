import { useScrollAnimation } from '../hooks/useScrollAnimation';

export function Services() {
    const headerRef = useScrollAnimation();
    const card1Ref = useScrollAnimation({ threshold: 0.2, triggerOnce: true });
    const card2Ref = useScrollAnimation({ threshold: 0.2, triggerOnce: true });

    return (
        <section className="services" id="services">
            <div ref={headerRef} className="section-header fade-in">
                <span className="section-tag">SERVICIOS</span>
                <h2 className="section-title">Lo que hago</h2>
            </div>

            <div className="services-grid">
                <div ref={card1Ref} className="service-card fade-in">
                    <div className="card-icon code-icon"></div>
                    <h3>Desarrollo de programas</h3>
                    <p>
                        Creación de aplicaciones de escritorio y sistemas personalizados
                        para optimizar procesos empresariales. Soluciones robustas, escalables
                        y adaptadas a tus necesidades específicas.
                    </p>
                </div>

                <div ref={card2Ref} className="service-card fade-in">
                    <div className="card-icon monitor-icon">&#x1F5A5;</div>
                    <h3>Páginas web</h3>
                    <p>
                        Desarrollo de sitios web modernos y aplicaciones web interactivas
                        con tecnologías de última generación. Desde landing
                        pages hasta plataformas complejas.
                    </p>
                </div>
            </div>
        </section>
    );
}
