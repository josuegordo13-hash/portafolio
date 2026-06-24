import { useState } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const ProjectList = [
    { 
        title: "Omnitrix",
        description: "Herramienta de acceso directo para los programas que más usas. Giras un dial circular, eliges un alien, presionas ESPACIO/ENTER y se abre el programa o archivo que le hayas asignado desde el menú de configuración. Todo se guarda automáticamente. Es una forma rápida y visual de lanzar tus apps favoritas.",
        Images: ["PROYECTO1.png", "PROYECTO1.1.png"] 
    },
    { 
        title: "ImageHunter Pro",
        description: "ImageHunter Pro es un programa que automatiza la búsqueda y descarga de imágenes de internet. Le das una lista de nombres (manualmente o mediante un archivo Excel) y el programa busca automáticamente las fotos, te permite verlas en una galería para descartar las que no te sirvan, y finalmente guarda las aprobadas en una carpeta de tu computadora. Es ideal para conseguir rápidamente imágenes para catálogos.",
        Images: ["PROYECTO2.png", "PROYECTO2.1.png"] 
    },
    { 
        title: "Game Over",
        description: "Es un shooter espacial 2D para Android y pc hecho con MonoGame. Controlas una nave que puede transformarse en dragón para disparar un rayo. Tiene meteoritos, enemigos y jefes con fases. Hay 2 niveles secuenciales más un modo Arcade infinito con puntuación.",
        Images: ["PROYECTO3.png", "PROYECTO3.1.png", "PROYECTO3.2.png", "PROYECTO3.3.png", "PROYECTO3.4.png", "PROYECTO3.5.png"] 
    },
    { 
        title: "Asistente Virtual Phantom",
        description: "Este proyecto es un asistente de voz virtual para Windows (desarrollado en C#) impulsado por Inteligencia Artificial. Escucha comandos a través del micrófono para realizar tareas como abrir aplicaciones, controlar las luces inteligentes de la casa, dar el clima, reproducir música en YouTube y monitorear el estado de tu PC. Todo esto con una interfaz futurista animada en pantalla.",
        Images: ["PROYECTO5.png"] 
    }
];

export function Projects() {
    const headerRef = useScrollAnimation();
    const actionRef = useScrollAnimation();
    const [lightboxState, setLightboxState] = useState({ projectIndex: null, imageIndex: 0 });

    const openLightbox = (projectIndex) => {
        setLightboxState({ projectIndex, imageIndex: 0 });
    };

    const closeLightbox = () => {
        setLightboxState({ projectIndex: null, imageIndex: 0 });
    };

    const nextImage = (e) => {
        e.stopPropagation();
        const currentProject = ProjectList[lightboxState.projectIndex];
        setLightboxState(prev => ({
            ...prev,
            imageIndex: (prev.imageIndex + 1) % currentProject.Images.length
        }));
    };

    const prevImage = (e) => {
        e.stopPropagation();
        const currentProject = ProjectList[lightboxState.projectIndex];
        setLightboxState(prev => ({
            ...prev,
            imageIndex: (prev.imageIndex - 1 + currentProject.Images.length) % currentProject.Images.length
        }));
    };

    return (
        <section id="proyectos" className="projects">
            <div className="container">
                <div ref={headerRef} className="section-header fade-in">
                    <span className="section-tag">MI TRABAJO</span>
                    <h2 className="section-title">Proyectos Destacados</h2>
                </div>

                <div className="projects-grid">
                    {ProjectList.map((project, index) => {
                        const cardRef = useScrollAnimation();
                        return (
                            <div key={index} ref={cardRef} className="project-card fade-in" onClick={() => openLightbox(index)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                                <div className="project-image" style={{ marginBottom: project.title ? '1rem' : 0 }}>
                                    {/* Mostramos siempre la primera imagen como miniatura (la portada) */}
                                    <img 
                                        src={`images/proyectos/${project.Images[0]}`} 
                                        alt={project.title || "Proyecto"} 
                                        onError={(e) => { e.target.src = 'images/placeholder-project.png'; }} 
                                    />
                                    <div className="project-hover-overlay">
                                        <span>{project.Images.length > 1 ? "Ver Galería" : "Ver Proyecto"}</span>
                                    </div>
                                </div>
                                {project.title && (
                                    <div className="project-info" style={{ padding: '0 1.5rem 1.5rem', textAlign: 'left' }}>
                                        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--electric-blue)', marginBottom: '0.75rem', fontSize: '1.25rem' }}>{project.title}</h3>
                                        <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', lineHeight: '1.6' }}>{project.description}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div ref={actionRef} className="projects-action fade-in">
                    <a href="#proyectos" className="btn-outline">
                        Ver todos los proyectos
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                </div>
            </div>

            {/* LIGHTBOX MODAL */}
            {lightboxState.projectIndex !== null && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>&times;</button>
                    
                    {ProjectList[lightboxState.projectIndex].Images.length > 1 && (
                        <button className="lightbox-nav prev" onClick={prevImage}>
                            &#10094;
                        </button>
                    )}

                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <img 
                            key={lightboxState.imageIndex}
                            src={`images/proyectos/${ProjectList[lightboxState.projectIndex].Images[lightboxState.imageIndex]}`} 
                            alt="Proyecto Full" 
                            className="lightbox-image fade-in visible"
                            onClick={(e) => e.stopPropagation()}
                            style={{ minHeight: 0, flex: '1 1 auto', objectFit: 'contain' }}
                        />
                        
                        {ProjectList[lightboxState.projectIndex].Images.length > 1 && (
                            <div style={{ color: 'var(--electric-blue)', marginTop: '15px', fontFamily: 'var(--font-main)', fontWeight: 'bold', flexShrink: 0 }}>
                                Captura {lightboxState.imageIndex + 1} de {ProjectList[lightboxState.projectIndex].Images.length}
                            </div>
                        )}
                    </div>

                    {ProjectList[lightboxState.projectIndex].Images.length > 1 && (
                        <button className="lightbox-nav next" onClick={nextImage}>
                            &#10095;
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
