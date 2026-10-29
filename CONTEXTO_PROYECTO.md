# 🌌 Phantom Byte - Documentación Integral y Contexto del Proyecto

> **Documento Maestro de Contexto Técnico, Arquitectura y Guía de Desarrollo**  
> **Proyecto:** Portafolio Web Oficial & Sala de Videojuegos Interactiva (**Phantom Byte**)  
> **Autor & Creador:** Josué González ([@josuegordo13-hash](https://github.com/josuegordo13-hash))  
> **Repositorio Oficial:** [github.com/josuegordo13-hash/portafolio](https://github.com/josuegordo13-hash/portafolio)  
> **Plataforma de Despliegue:** Vercel (Producción continua desde rama `main`)  
> **Última Actualización:** Octubre 2026  

---

## 📋 1. Visión General del Proyecto

**Phantom Byte** es una plataforma web integral que combina dos experiencias principales:
1. **Portafolio Profesional de Alto Impacto:** Presenta los servicios de software y automatización personalizada (C# / .NET / Web), exhibe proyectos destacados con galerías interactivas (*Lightbox*) y permite a clientes potenciales solicitar cotizaciones en tiempo real mediante un formulario con integración a **EmailJS**.
2. **Sala de Videojuegos ("Phantom Byte Arcade"):** Un módulo interactivo dedicado dentro de la misma web que permite a los visitantes jugar videojuegos directamente en el navegador, tanto en computadoras de escritorio como en cualquier teléfono móvil. Cuenta con catálogo extensible, fichas técnicas, guardado automático de progreso (campañas), registro de pilotos únicos y un **Tablero de Clasificación (Leaderboard)** sincronizado en tiempo real.

### Principios de Diseño e Identidad
* **Estética Cyberpunk / Sci-Fi:** Paleta oscura profunda (`#0a0a0f`), acentos en neón cian/azul eléctrico (`#00d4ff`) y púrpura (`#8b5cf6`), partículas animadas, resplandores (*glow*) y tipografías futuristas (`Orbitron` para títulos y `Inter` para lectura).
* **Experiencia 100% Responsive & Mobile-First:** Tanto la web como los videojuegos están completamente optimizados para pantallas táctiles de cualquier tamaño y teléfonos móviles en orientación horizontal o vertical.
* **Cero Latencia y Alto Rendimiento:** Aplicación de una sola página (SPA) impulsada por React 19 y Vite 8, con renderizado en Canvas 2D determinista a 60 FPS y assets de audio/imagen comprimidos y optimizados.

---

## 🛠️ 2. Stack Tecnológico

| Área | Tecnología | Versión / Detalle |
| :--- | :--- | :--- |
| **Entorno de Ejecución** | Node.js | v22.x LTS (compatible con v18+) |
| **Gestor de Paquetes** | npm | v10.x |
| **Bundler & Servidor Local** | Vite | ^8.0.x (con middleware local para `/api/arcade`) |
| **Biblioteca UI** | React | ^19.2.x |
| **Arquitectura de Datos** | Vercel Serverless + LocalStorage | Endpoint `/api/arcade` con fallback y sincronización local |
| **Motor de Videojuego** | HTML5 Canvas 2D + Web Audio API | Loop determinista de 60 FPS (`requestAnimationFrame` + paso fijo) |
| **Estilos** | CSS3 Puro (Vanilla CSS) | Variables CSS, Grid, Flexbox, Keyframes, Backdrop-filter |
| **Tipografías** | Google Fonts + TTF Local | `Orbitron`, `Inter` y la fuente pixel art `ThaleahFat.ttf` |
| **Envío de Correos** | @emailjs/browser | ^4.4.x (Integración directa frontend con EmailJS API) |
| **Métricas & Analítica** | Google Analytics 4 | ID: `G-2888GFD4YE` |
| **Control de Versiones** | Git & GitHub | Rama de despliegue: `origin/main` |
| **Hosting & CI/CD** | Vercel | Despliegue automático de SPA + Serverless Functions |

---

## 📂 3. Estructura Completa del Proyecto

```text
web/
├── .env                              # Variables de entorno locales (VITE_EMAILJS_*)
├── .env.example                      # Plantilla pública de variables de entorno
├── .gitignore                        # Reglas de exclusión de Git
├── index.html                        # HTML principal, enlaces a fuentes y analítica
├── package.json                      # Dependencias y scripts npm
├── package-lock.json                 # Árbol de versiones bloqueadas
├── vite.config.js                    # Configuración de Vite + Middleware local de la API
├── eslint.config.js                  # Configuración de ESLint
├── README.md                         # Resumen del proyecto
├── CONTEXTO_PROYECTO.md              # Este archivo: Documento maestro de arquitectura
│
├── api/                              # Vercel Serverless Functions
│   └── arcade.js                     # API de perfiles únicos, guardado y Leaderboard
│
├── public/                           # Recursos estáticos servidos en la raíz
│   ├── favicon.png / .svg            # Favicon del navegador
│   ├── img/                          # Identidad de marca (logos, mascota, etc.)
│   │   ├── logo.png
│   │   ├── logo y nombre.png
│   │   ├── nombre.png
│   │   ├── mascota.png
│   │   └── ghost.png
│   ├── images/
│   │   └── proyectos/                # Capturas de proyectos del portafolio
│   │       ├── PROYECTO1.png / 1.1.png   (Omnitrix)
│   │       ├── PROYECTO2.png / 2.1.png   (ImageHunter Pro)
│   │       ├── PROYECTO3.png a 3.5.png   (Game Over)
│   │       └── PROYECTO5.png             (Asistente Virtual Phantom)
│   └── games/
│       └── gameover/
│           └── assets/               # Assets optimizados del videojuego "Game Over"
│               ├── *.png             # Spritesheets recortados a píxeles visibles
│               ├── *.ogg             # Música comprimida (menu, Space Shooter, boss)
│               ├── *.wav             # Efectos de sonido (disparos, daño, etc.)
│               └── ThaleahFat.ttf    # Fuente tipográfica pixel art del juego
│
├── src/                              # Código fuente React
│   ├── main.jsx                      # Inicializador de React (createRoot)
│   ├── App.jsx                       # Orquestador de vistas (Portafolio vs Juegos)
│   ├── index.css                     # Estilos maestros, responsive y pantalla completa
│   ├── App.css                       # Estilos auxiliares
│   ├── assets/                       # Gráficos auxiliares
│   ├── hooks/
│   │   └── useScrollAnimation.js     # IntersectionObserver para transiciones suaves
│   ├── services/
│   │   └── gameDatabase.js           # Capa de datos y sincronización de perfiles/récords
│   └── components/
│       ├── Header.jsx                # Barra de navegación superior con menú móvil
│       ├── Hero.jsx                  # Portada futurista con glitch y partículas
│       ├── Services.jsx              # Servicios de software y desarrollo web
│       ├── Projects.jsx              # Cuadrícula de proyectos con modal Lightbox
│       ├── About.jsx                 # Sobre mí, valores y habilidades técnicas
│       ├── Contact.jsx               # Formulario de contacto conectado a EmailJS
│       ├── Footer.jsx                # Pie de página y enlaces sociales
│       ├── GamesHub.jsx              # Sala de videojuegos, catálogo, fichas y récords
│       └── GameOverCanvas.jsx        # Motor Canvas 2D del juego "Game Over"
│
└── respaldo_blazor/                  # Histórico de la primera versión en Blazor (.NET 10)
```

---

## 🎮 4. Arquitectura de la Sala de Videojuegos ("Phantom Byte Arcade")

La sala de videojuegos permite jugar sin salir de la web, manteniendo intacto el portafolio principal.

### 4.1. Navegación y Control de Vistas (`App.jsx` & `Header.jsx`)
* El estado `activeView` conmuta dinámicamente entre `'portfolio'` y `'games'`.
* El cambio se sincroniza con el hash de la URL (`#juegos`), permitiendo compartir enlaces directos al arcade o usar el botón Atrás del navegador.
* La barra de navegación de `Header.jsx` incluye el botón destacado **🎮 Juegos**.
* En dispositivos móviles, el botón de tres rayitas (`#mobileToggle`) está programado con estado nativo de React (`menuOpen`), transformándose en una **✕** animada y cerrándose automáticamente al seleccionar cualquier opción.

### 4.2. Catálogo y Ficha Técnica (`GamesHub.jsx`)
* **VISTA 1: Catálogo:** Muestra tarjetas interactivas de los juegos disponibles con etiquetas de plataforma (PC / Móvil), género y estado. Incluye una tarjeta de reserva para futuros lanzamientos.
* **VISTA 2: Ficha Técnica:** Al seleccionar un juego, se despliega la ficha con:
  * Visor principal de capturas con miniatura interactiva.
  * Sinopsis y lista de características.
  * Guía detallada de controles para PC y para teléfonos móviles.
  * **Tarjeta de Piloto + Contraseña:** Permite registrar un nombre de piloto único asegurado con una contraseña elegida por el jugador. Si eres un piloto nuevo, eliges tu nombre y tu contraseña para protegerlo; si ya tienes piloto, puedes ingresar tu mismo nombre y contraseña desde cualquier teléfono o computadora sin necesidad de iniciar sesión con Google. La cuenta oficial **PHANTOM** está reservada para el creador con la contraseña predeterminada `Phantom/123`.
  * Indicador de progreso guardado: si completas el Nivel 1, tu piloto tiene automáticamente desbloqueado el Nivel 2 en sesiones futuras y en cualquiera de tus dispositivos.
  * **Tablero de Récords Online (Leaderboard):** Ranking global en tiempo real con las mejores puntuaciones alcanzadas tanto en Campaña como en Modo Arcade, visible para todos los visitantes y sincronizado en la nube.
* **VISTA 3: Escenario Activo:** Monta el componente `GameOverCanvas.jsx` en primer plano.

### 4.3. Motor Web del Juego (`GameOverCanvas.jsx`)
Port directo y optimizado del videojuego original creado en **MonoGame (C#)**:
* **Renderizado Determinista a 60 FPS:** Bucle desacoplado mediante acumulador de tiempo fijo (`FIXED_DT = 1/60`), garantizando la misma velocidad de físicas y proyectiles en cualquier monitor (60Hz, 120Hz, 144Hz, móviles o PCs de alta gama).
* **Estética Pixel Art Fiel:** Uso de `ctx.imageSmoothingEnabled = false` y spritesheets recortados al píxel exacto, evitando artefactos o deformaciones.
* **Efectos Visuales Integrados:** Estrellas parallax multicapa con centelleo senoidal, sistema de partículas para propulsores, humo y fragmentos, explosiones animadas y vibración de pantalla (*Screen Shake*) configurable ante impactos.
* **Independencia del Ciclo de Vida:** El loop del juego no se reinicia al guardar puntuaciones o cambiar estados de React, gracias al desacoplamiento de dependencias mediante `useRef`.

---

## 🕹️ 5. Mecánicas y Controles del Juego "Game Over"

### 5.1. Mecánicas de Juego
1. **Nave de Combate:** Dispara ráfagas continuas de cañón de plasma hacia el frente.
2. **Transformación en Dragón Cósmico (Tecla E / Botón Dragón):** La nave se desmaterializa y se transforma en un Dragón interestelar capaz de canalizar el devastador **Rayo Solar**.
3. **Rayo Solar Direccional:**
   * Haz de energía en dos partes (cuerpo expandible + punta esférica de fuego 1:1) que nunca se deforma.
   * Se mantiene delimitado dentro de los bordes de la pantalla.
   * Daña y destruye meteoritos, enemigos insectoides y desgasta la barra de vida de los jefes.
4. **Modos de Juego:**
   * **Campaña (Niveles 1 y 2):**
     * *Nivel 1:* Lluvia de meteoritos espaciales y enfrentamiento contra el **Jefe 1** (con Fase 1 normal y Fase 2 de furia a doble velocidad con ataques de meteoritos sísmicos). Al vencerlo, se guarda la victoria y se desbloquea el Nivel 2.
     * *Nivel 2:* Escuadrones de insectos espaciales con patrones de acecho y embestida (*dash*), culminando en el combate contra el **Jefe 2** aéreo.
   * **Modo Arcade Infinito:** Ciclos continuos alternando mundos con dificultad creciente y sumatoria acumulativa de puntos. Cada récord superior a 0 se sube de forma instantánea al Tablero de Clasificación.

### 5.2. Controles en PC
* **W, A, S, D / Flechas:** Desplazar la nave o el dragón en 8 direcciones.
* **Barra Espaciadora:** Disparar cañón de plasma.
* **Tecla E:** Transformarse entre Nave y Dragón (cooldown de 2 segundos).
* **Click Izquierdo + Mouse:** Apuntar el Rayo Solar en modo Dragón hacia la posición del cursor.
* **TAB:** Pausar la partida y abrir el menú de opciones/guardado.
* **Teclas de Desarrollo:** Tecla `P` suma 99 puntos de prueba para invocar al Jefe inmediatamente; Tecla `N` conmuta entre Nivel 1 y Nivel 2.

### 5.3. Controles en Teléfonos Móviles
* **Joystick Virtual Izquierdo:** Control de vuelo libre en 360° para la nave o el dragón.
* **Botón Derecho (FIRE):** En modo Nave, permite disparar tanto con toques rápidos individuales (*tap*) como dejando el dedo presionado para disparo automático continuo.
* **Botón Dragón (E):** Transforma la nave en dragón y viceversa con indicador visual de cooldown.
* **Joystick Derecho Exclusivo del Rayo Solar:**
  * Se activa automáticamente en la esquina inferior derecha al estar en modo Dragón.
  * **Solo dispara cuando se toca y se mueve**, permaneciendo apagado cuando no se usa.
  * **Movimiento Horizontal (dx):** Dirige la trayectoria angular del láser a izquierda y derecha.
  * **Movimiento Vertical (dy):** Al estirarlo hacia arriba, alarga el rayo a su alcance máximo; al llevarlo hacia abajo, lo achica y recoge cerca de la boca del dragón, replicando la precisión del mouse.
* **Botón Pausa (`||`):** Pausa el juego y permite reanudar o guardar y salir.
* **Modo Pantalla Completa Total:**
  * Al presionar `⛶ Pantalla Completa`, el juego cubre el 100% de la pantalla (`100vw × 100dvh`) con `object-fit: fill`, eliminando franjas negras laterales.
  * Incluye un botón flotante **`✕`** en la esquina superior izquierda para salir en cualquier momento, con una breve indicación no invasiva de 1.1 segundos que no bloquea la interacción táctil.

---

## 🗄️ 6. Sistema de Base de Datos y Persistencia (`gameDatabase.js` & `api/arcade.js`)

Para garantizar que los récords y el progreso de los jugadores se mantengan guardados sin requerir configuraciones complejas de base de datos externa, se implementó una arquitectura híbrida:

1. **Endpoint Serverless + Cloud KV (`/api/arcade`):**
   * Endpoint de Node.js ejecutado en Vercel Serverless Functions con persistencia global en la nube (Cloud KV + réplica de respaldo) y caché local.
   * En desarrollo local, `vite.config.js` implementa un middleware equivalente para que `/api/arcade` funcione directamente.
   * Gestiona el sistema de **Piloto + Contraseña** (mediante hash determinista `hashPin`), permitiendo que un jugador use su mismo nombre en múltiples dispositivos e impidiendo que otros jugadores tomen nombres ya registrados.
   * Almacena y sincroniza el ranking global `leaderboard` (Top 20 mejores récords online) y los perfiles individuales de cada piloto.
2. **Respaldo Local y Sesión (`LocalStorage`):**
   * Cada dispositivo recuerda la sesión autenticada del piloto (`phantombyte_pilot_session_v3`), su perfil personal (`phantombyte_gameover_profiles_v3`) y la tabla de récords (`phantombyte_gameover_leaderboard_v3`), migrando automáticamente cualquier progreso previo de `v2`.
3. **Sincronización Bidireccional (`buildSyncedLeaderboard`):**
   * Si un jugador alcanza una puntuación alta en su partida o supera el Nivel 1, la función de sincronización actualiza inmediatamente tanto su ficha personal como el Tablero de Récords general.

---

## ⚙️ 7. Configuración de Variables de Entorno (.env)

El proyecto requiere las siguientes variables de entorno para la integración del formulario de contacto:

```env
VITE_EMAILJS_SERVICE_ID=service_ycrbdtr
VITE_EMAILJS_TEMPLATE_ID=template_k0qckee
VITE_EMAILJS_PUBLIC_KEY=LPqL987O5AqVQu2U0
```

> ⚠️ **Nota:** Estas 3 variables deben estar configuradas tanto en el archivo local `.env` como en el panel de **Vercel** (`Settings` > `Environment Variables`).

---

## 🚀 8. Guía de Comandos y Flujo de Trabajo

### Iniciar el servidor local de desarrollo
```bash
npm run dev
```
Levanta la aplicación en `http://localhost:5173` con recarga en caliente instantánea (HMR) y emulación local de la API de videojuegos.

### Compilar para producción
```bash
npm run build
```
Genera la compilación lista para producción en la carpeta `dist/`.

### Probar la compilación en local
```bash
npm run preview
```

### Flujo de publicación (Git + GitHub + Vercel)
```bash
git add -A
git commit -m "Descripción clara de las mejoras implementadas"
git push origin main
```
Vercel detecta automáticamente el commit en la rama `main`, compila el proyecto y actualiza el sitio en vivo en pocos segundos.

---

## 💡 9. Guías de Expansión del Proyecto

### 9.1. ¿Cómo agregar un nuevo proyecto al portafolio?
1. Añade las capturas de pantalla en `public/images/proyectos/` (ej. `mi_proyecto_1.png`).
2. Edita `src/components/Projects.jsx` e introduce un nuevo objeto en `ProjectList`:
   ```javascript
   {
       title: "Nombre del Proyecto",
       description: "Descripción breve del proyecto, retos y tecnologías utilizadas.",
       Images: ["mi_proyecto_1.png", "mi_proyecto_2.png"]
   }
   ```
3. La primera imagen se usará como portada y las demás se explorarán mediante el *Lightbox*.

### 9.2. ¿Cómo agregar un nuevo videojuego a la sala Arcade?
1. Registra el juego en el catálogo `GAMES_CATALOG` dentro de `src/components/GamesHub.jsx` con su `id`, `title`, `genre`, plataformas, portada, capturas y sinopsis.
2. Si el juego tiene su propio canvas o componente de ejecución (ej. `MiNuevoJuegoCanvas.jsx`), vincúlalo en la sección de ejecución de `GamesHub.jsx`:
   ```jsx
   {selectedGame.id === 'mi-nuevo-juego' && isPlaying && (
       <MiNuevoJuegoCanvas onExitToCatalog={() => setIsPlaying(false)} />
   )}
   ```
3. Conéctalo a `savePlayerProgress` y `submitArcadeScore` de `gameDatabase.js` para aprovechar el sistema de perfiles y el tablero de clasificación global.

---

## 🗄️ 10. Respaldo Histórico (`respaldo_blazor/`)

La carpeta `respaldo_blazor` contiene el código fuente de la primera versión del portafolio desarrollada con **ASP.NET Core Blazor WebAssembly (.NET 10)**. Se conserva en el repositorio exclusivamente como archivo histórico de componentes y assets previos. El proyecto actual en producción es 100% **React 19 + Vite 8**.
