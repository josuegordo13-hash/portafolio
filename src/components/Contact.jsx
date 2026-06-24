import { useRef, useState } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import emailjs from '@emailjs/browser';

export function Contact() {
    const headerRef = useScrollAnimation();
    const infoRef = useScrollAnimation();
    const formAnimRef = useScrollAnimation();

    const form = useRef();
    const [status, setStatus] = useState(''); // 'sending', 'success', 'error', ''

    const sendEmail = (e) => {
        e.preventDefault();
        setStatus('sending');

        // IMPORTANTE: REEMPLAZA ESTOS VALORES CON TUS CREDENCIALES DE EMAILJS
        const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form.current, {
            publicKey: PUBLIC_KEY,
        })
            .then((result) => {
                setStatus('success');
                form.current.reset();
                setTimeout(() => setStatus(''), 5000);
            }, (error) => {
                setStatus('error');
                console.log(error.text);
                setTimeout(() => setStatus(''), 5000);
            });
    };

    return (
        <section className="contact" id="contact">
            <div ref={headerRef} className="section-header fade-in">
                <span className="section-tag">CONTACTO</span>
                <h2 className="section-title">Hablemos de tu proyecto</h2>
            </div>

            <div className="contact-grid">
                <div ref={formAnimRef} className="contact-form-wrapper fade-in">
                    <form ref={form} className="contact-form" onSubmit={sendEmail}>
                        <div className="form-group">
                            <label htmlFor="name">Nombre</label>
                            <input id="name" name="name" type="text" placeholder="Tu nombre" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Correo electrónico</label>
                            <input id="email" name="email" type="email" placeholder="tu@correo.com" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Número de WhatsApp</label>
                            <input id="phone" name="phone" type="tel" placeholder="+1 234 567 8900" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Asunto</label>
                            <input id="subject" name="cliente" type="text" placeholder="Asunto del mensaje" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Descripción del proyecto</label>
                            <textarea id="message" name="message" placeholder="Cuéntame sobre tu proyecto..." required></textarea>
                        </div>

                        <button type="submit" className="submit-btn" disabled={status === 'sending'}>
                            {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
                        </button>

                        {status === 'success' && (
                            <div style={{ color: '#00d4ff', marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                                ¡Mensaje enviado con éxito! Te responderé pronto.
                            </div>
                        )}
                        {status === 'error' && (
                            <div style={{ color: '#ff4444', marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                                Hubo un error al enviar el mensaje. Intenta de nuevo.
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </section>
    );
}
