# 🌌 Phantom Byte - Documentación Integral y Contexto del Proyecto

> **Documento de Contexto Técnico, Arquitectura y Guía de Desarrollo**  
> **Proyecto:** Portafolio Web Oficial de Phantom Byte  
> **Autor:** Josué González ([@josuegordo13-hash](https://github.com/josuegordo13-hash))  
> **Repositorio:** [github.com/josuegordo13-hash/portafolio](https://github.com/josuegordo13-hash/portafolio)  
> **Despliegue:** Vercel (Producción continua desde rama `main`)

---

## 📋 1. Visión General del Proyecto

**Phantom Byte** es una marca y portafolio personal enfocado en **Software & Automatización Inteligente**. La página web presenta los servicios ofrecidos, los proyectos destacados con galerías interactivas, el perfil profesional y un formulario de contacto funcional con integración directa a correo electrónico.

### Objetivos Clave de la Web
1. **Identidad Visual Premium:** Estética cyberpunk / sci-fi moderna con paleta oscura, acentos neón (`#00d4ff` azul eléctrico y `#8b5cf6` púrpura), efectos de brillo (*glow*), animaciones de partículas y tipografía futurista (`Orbitron` + `Inter`).
2. **Exhibición Interactiva de Proyectos:** Galería con miniaturas y visualizador modal (*Lightbox*) con navegación entre múltiples capturas por proyecto.
3. **Generación de Contactos:** Formulario de cotización/contacto con validación y envío en tiempo real vía **EmailJS** sin requerir un servidor backend intermedio.
4. **Rendimiento Ultrarrápido:** Construido con Vite y React 19, compilado a assets estáticos ultra optimizados.

---

## 🛠️ 2. Stack Tecnológico

| Componente | Tecnología | Versión / Detalle |
| :--- | :--- | :--- |
| **Entorno de Ejecución** | Node.js | v22.x LTS (compatible con Node 18+) |
| **Gestor de Paquetes** | npm | v10.x |
| **Bundler & Dev Server** | Vite | ^8.0.x |
| **Biblioteca UI** | React | ^19.2.x |
| **Estilos** | CSS3 Puro (Vanilla CSS) | Variables CSS, Flexbox, Grid, Keyframes, Backdrop-filter |
| **Tipografías** | Google Fonts | `Orbitron` (títulos y marcas) y `Inter` (cuerpo de texto) |
| **Envío de Correos** | @emailjs/browser | ^4.4.x (Integración frontend con EmailJS API) |
| **Métricas & Analítica** | Google Analytics 4 | ID: `G-2888GFD4YE` |
| **Control de Versiones** | Git & GitHub | `origin/main` |
| **Hosting & CI/CD** | Vercel | Detección automática de Vite + React |

---

## 📂 3. Estructura Completa de Archivos y Carpetas

```text
web/
├── .env                      # Variables de entorno locales (NO subir a Git)
├── .env.example              # Plantilla pública de variables de entorno
├── .gitignore                # Exclusiones de Git (node_modules, dist, .env, etc.)
├── index.html                # Documento HTML principal, fuentes y Google Analytics
├── package.json              # Manifiesto del proyecto, dependencias y scripts npm
├── package-lock.json         # Versiones exactas del árbol de dependencias
├── vite.config.js            # Configuración de Vite con @vitejs/plugin-react
├── eslint.config.js          # Reglas de linting y calidad de código
├── README.md                 # Resumen ejecutivo del repositorio
├── CONTEXTO_PROYECTO.md      # Este archivo: Documentación y contexto total
│
├── public/                   # Recursos estáticos servidos directamente en la raíz
│   ├── favicon.png / .svg    # Icono del navegador
│   ├── icons.svg             # Sprites e íconos vectoriales
│   ├── img/                  # Identidad de marca y logotipos
│   │   ├── logo.png          # Logo de Phantom Byte
│   │   ├── logo y nombre.png # Logo con tipografía integrada
│   │   ├── nombre.png        # Tipografía de la marca
│   │   ├── mascota.png       # Avatar / Mascota de Phantom Byte (sección Sobre Mí)
│   │   └── ghost.png         # Variante gráfica
│   └── images/
│       └── proyectos/        # Capturas de pantalla de los proyectos exhibidos
│           ├── PROYECTO1.png / 1.1.png   # Omnitrix
│           ├── PROYECTO2.png / 2.1.png   # ImageHunter Pro
│           ├── PROYECTO3.png a 3.5.png   # Game Over (Shooter espacial)
│           └── PROYECTO5.png             # Asistente Virtual Phantom
│
├── src/                      # Código fuente de la aplicación React
│   ├── main.jsx              # Punto de entrada React (ReactDOM.createRoot)
│   ├── App.jsx               # Contenedor raíz, navegación móvil y scroll de header
│   ├── index.css             # Estilos maestros (variables, animaciones, componentes)
│   ├── App.css               # Estilos complementarios
│   ├── assets/               # Assets importables en módulos JS
│   ├── hooks/
│   │   └── useScrollAnimation.js # Hook personalizado (IntersectionObserver para fade-in)
│   └── components/
│       ├── Header.jsx        # Barra superior con logo, enlaces y botón de cotización
│       ├── Hero.jsx          # Portada con título glitch, partículas y llamado a la acción
│       ├── Services.jsx      # Catálogo de servicios ofrecidos
│       ├── Projects.jsx      # Galería de proyectos con modal Lightbox interactivo
│       ├── About.jsx         # Biografía, valores de trabajo y tecnologías dominadas
│       ├── Contact.jsx       # Formulario con validación y envío vía EmailJS
│       └── Footer.jsx        # Pie de página con créditos y enlace a Instagram
│
└── respaldo_blazor/          # Respaldo del proyecto previo en Blazor C# (.NET 10)
```

---

## 🧩 4. Análisis Detallado de Componentes

### 4.1. `App.jsx`
- Orquesta el orden de renderizado: `<Header />`, `<Hero />`, `<Services />`, `<Projects />`, `<About />`, `<Contact />` y `<Footer />`.
- Maneja dos efectos globales (`useEffect`):
  1. **Menú móvil:** Alterna la clase `.active` entre el botón de hamburguesa (`#mobileToggle`), el menú (`#navMenu`) y el contenedor derecho (`#headerRight`).
  2. **Efecto de scroll en Header:** Agrega la clase `.scrolled` al header cuando el usuario baja más de 50px para intensificar el fondo oscuro y la sombra.

### 4.2. `src/hooks/useScrollAnimation.js`
- Hook reutilizable basado en la API nativa de JavaScript `IntersectionObserver`.
- Detecta cuando un elemento entra en el viewport del usuario y le inyecta la clase CSS `.visible` para activar transiciones suaves de entrada (`fade-in`).

### 4.3. `src/components/Header.jsx`
- Logo institucional con enlace ancla.
- Menú de navegación responsive anclado a las secciones de la misma página (`#hero`, `#services`, `#proyectos`, `#about`, `#contact`).
- Botón CTA directo para solicitar cotización.

### 4.4. `src/components/Hero.jsx`
- Título con efecto glitch cyberpunk (`cyber-glitch`) con atributo `data-text="PHANTOM BYTE"`.
- Generador de partículas y fragmentos de píxeles animados mediante CSS puro y variables `--duration` y `--delay`.
- Logo 3D central con efecto de flotación.

### 4.5. `src/components/Services.jsx`
- Muestra los dos pilares principales de servicio:
  1. **Desarrollo de programas:** Software de escritorio y automatización personalizada (C# / .NET).
  2. **Páginas web:** Sitios modernos y aplicaciones web interactivas (React / Vite).

### 4.6. `src/components/Projects.jsx`
- Administra un arreglo de datos `ProjectList` con los proyectos:
  - **Omnitrix:** Acceso directo visual con dial circular.
  - **ImageHunter Pro:** Búsqueda y descarga masiva automatizada de imágenes.
  - **Game Over:** Shooter espacial 2D desarrollado con MonoGame (Android y PC).
  - **Asistente Virtual Phantom:** Asistente por voz inteligente con interfaz futurista en C#.
- **Lightbox Integrado:** Permite hacer clic en cualquier tarjeta para abrir la imagen en pantalla completa con flechas de navegación previa/siguiente y contador de capturas.

### 4.7. `src/components/About.jsx`
- Perfil profesional y avatar (`mascota.png`).
- Valores de trabajo (Enfoque en resultados, soluciones eficientes, código limpio y seguro, compromiso).
- Badges interactivos de tecnologías: **C#**, **HTML**, **CSS**, **JavaScript** y **React**.

### 4.8. `src/components/Contact.jsx`
- Formulario con campos: Nombre, Correo electrónico, WhatsApp, Asunto y Descripción del proyecto.
- Conexión directa a través de `@emailjs/browser` utilizando variables de entorno de Vite (`import.meta.env.VITE_EMAILJS_*`).
- Manejo de estados de interfaz: `sending` (botón deshabilitado), `success` (mensaje de confirmación temporal) y `error` (mensaje de advertencia).

### 4.9. `src/components/Footer.jsx`
- Resumen de marca, enlaces de navegación rápida y enlace al perfil oficial de Instagram (`@official.phantombyte`).

---

## ⚙️ 5. Configuración de Variables de Entorno (.env)

El proyecto utiliza variables de entorno con el prefijo `VITE_` requeridas por Vite para exponerlas al bundle de frontend:

```env
VITE_EMAILJS_SERVICE_ID=service_ycrbdtr
VITE_EMAILJS_TEMPLATE_ID=template_k0qckee
VITE_EMAILJS_PUBLIC_KEY=LPqL987O5AqVQu2U0
```

> ⚠️ **Importante:** Estas mismas 3 variables deben estar registradas en la configuración del proyecto en **Vercel** (`Settings` > `Environment Variables`) para que el formulario funcione correctamente en el sitio en vivo.

---

## 🚀 6. Guía de Comandos y Flujo de Trabajo

### Iniciar el servidor local de desarrollo
```bash
npm run dev
```
Abre automáticamente la dirección local (usualmente `http://localhost:5173`) con recarga en caliente instantánea al guardar cambios.

### Construir para producción
```bash
npm run build
```
Compila y minimiza todo el código en la carpeta `dist/`.

### Probar la compilación de producción localmente
```bash
npm run preview
```

### Ejecutar el linter
```bash
npm run lint
```

---

## 🌐 7. Flujo de Despliegue (Git + GitHub + Vercel)

### Configuración de Git en esta computadora
La configuración de usuario de este repositorio está establecida localmente con tu perfil:
- **Nombre:** `Josue`
- **Email:** `josue.gonzalez0979@gmail.com`

### Pasos para publicar cambios:
1. Realiza los cambios necesarios en el código.
2. Comprueba el estado de los archivos:
   ```bash
   git status
   ```
3. Agrega los cambios y crea un commit descriptivo:
   ```bash
   git add .
   git commit -m "Descripción de los cambios realizados"
   ```
4. Sube los cambios a la rama principal de GitHub:
   ```bash
   git push origin main
   ```
5. **Vercel detecta automáticamente el push** en la rama `main`, compila la aplicación (`npm run build`) y actualiza el sitio en vivo en cuestión de segundos.

### Uso de herramientas CLI instaladas
En esta máquina se encuentran instaladas y listas:
- **Vercel CLI (`vercel`):** Puedes ejecutar `vercel` para despliegues previos o `vercel --prod` para desplegar directamente desde la terminal.
- **GitHub CLI (`gh`):** Puedes ejecutar `gh auth login` para conectar tu cuenta de GitHub mediante el navegador si necesitas clonar, crear repositorios o gestionar PRs desde la consola.

---

## 💡 8. ¿Cómo agregar un nuevo proyecto a la web?

Cuando desarrolles un nuevo proyecto y quieras publicarlo en la página:

1. **Guardar las imágenes:** Coloca las capturas en la carpeta `public/images/proyectos/` (ej. `miproyecto_1.png`, `miproyecto_2.png`).
2. **Registrarlo en `src/components/Projects.jsx`:** Añade un nuevo objeto al arreglo `ProjectList`:
   ```javascript
   { 
       title: "Nombre del Proyecto",
       description: "Breve explicación de qué hace el proyecto, tecnologías y objetivo.",
       Images: ["miproyecto_1.png", "miproyecto_2.png"] 
   },
   ```
3. La primera imagen del array funcionará automáticamente como portada en la cuadrícula, y el resto aparecerá en el visualizador modal interactivo.
4. Guarda los cambios, realiza `git commit` y `git push origin main`.

---

## 🗄️ 9. Nota sobre `respaldo_blazor/`

La carpeta `respaldo_blazor` contiene el código fuente de la primera versión del portafolio desarrollada con **ASP.NET Core Blazor WebAssembly (.NET 10)**. Se conserva intacta dentro del repositorio únicamente con fines históricos y de consulta de componentes Razor o assets previos. La versión activa y desplegada en producción es 100% **React + Vite**.
