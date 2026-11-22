// ============================================================================
// PRINCESAS: LA HISTORIA NUNCA CONTADA — NIVEL 1: RAPUNZEL
// Motor Web 2D Animado en Canvas (Sprites Multi-Estado, Minijuegos de Precisión y Vestidor Anatómico)
// ============================================================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const BASE_PATH = 'Assets Nivel 1 - Rapunzel';

const ASSET_MANIFEST = {
  // Fondos 16:9
  bgTower: `${BASE_PATH}/Fondos/Torre Exterior.png`,
  bgRoom: `${BASE_PATH}/Fondos/Habitacion de Rapunzel.png`,
  bgBath: `${BASE_PATH}/Fondos/Bano y Tocador.png`,
  bgWardrobe: `${BASE_PATH}/Fondos/Vestidor Real.png`,

  // Cinemática Torre
  towerHairScene: `${BASE_PATH}/Cinematica Torre/Torre con Cabello Lanzado.png`,
  towerCleanRapScene: `${BASE_PATH}/Cinematica Torre/Torre con Rapunzel Arreglada.png`,
  towerWindowFrame: `${BASE_PATH}/Cinematica Torre/Torre Marco Ventana.png`,
  towerWindowZoom: `${BASE_PATH}/Cinematica Torre/Primer Plano Ventana con Rapunzel.png`,
  braidSprite: `${BASE_PATH}/Cinematica Torre/Trenza Larga Animable.png`,

  // Personajes Transparentes y Sprites de Habla (Boca Cerrada, Media, Abierta)
  rapMessy: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Desarreglada Transparente.png`,
  rapMessyNoPimples: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Desarreglada Sin Granos.png`,
  rapMessyMouthClosed: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Desarreglada Boca Cerrada.png`,
  rapMessyMouthMid: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Desarreglada Boca Media.png`,
  rapMessyMouthOpen: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Desarreglada Boca Abierta.png`,

  rapClean: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Arreglada Base Transparente.png`,
  rapCleanMouthClosed: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Arreglada Boca Cerrada.png`,
  rapCleanMouthMid: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Arreglada Boca Media.png`,
  rapCleanMouthOpen: `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Arreglada Boca Abierta.png`,

  // Sistema Paper Doll Cuerpo Completo 768x1376 (Modelo Base + Capas Anatómicas + Oclusión Real)
  pdBase: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Base Transparente.png`,
  pdBaseShoes: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Base Con Zapatos.png`,
  pdBaseMouthClosed: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Base Boca Cerrada.png`,
  pdBaseMouthMid: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Base Boca Media.png`,
  pdBaseMouthOpen: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Base Boca Abierta.png`,
  pdBaseShoesMouthClosed: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Base Zapatos Boca Cerrada.png`,
  pdBaseShoesMouthMid: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Base Zapatos Boca Media.png`,
  pdBaseShoesMouthOpen: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Base Zapatos Boca Abierta.png`,
  pdHandsFront: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Manos Base.png`,
  pdForearmsFront: `${BASE_PATH}/Personajes/Paper Doll/Rapunzel Antebrazos Base.png`,

  prince: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Transparente.png`,
  princeMouthClosed: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Boca Cerrada.png`,
  princeMouthMid: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Boca Media.png`,
  princeMouthOpen: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Boca Abierta.png`,
  princeTower: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Torre Transparente.png`,
  princeTowerMouthClosed: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Torre Boca Cerrada.png`,
  princeTowerMouthMid: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Torre Boca Media.png`,
  princeTowerMouthOpen: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Torre Boca Abierta.png`,
  princeClimb1: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Escalando 1.png`,
  princeClimb2: `${BASE_PATH}/Personajes/Sprites Transparentes/Principe Escalando 2.png`,

  // Herramientas Fase 1 y Fase 2
  toolCleanser: `${BASE_PATH}/Objetos y Vestuario/Herramientas Individuales/Jabon Espumoso Facial.png`,
  toolSponge: `${BASE_PATH}/Objetos y Vestuario/Herramientas Individuales/Esponja Suave Facial.png`,
  toolExtractor: `${BASE_PATH}/Objetos y Vestuario/Herramientas Individuales/Extractor de Espinillas.png`,
  toolMask: `${BASE_PATH}/Objetos y Vestuario/Herramientas Individuales/Mascarilla Facial Magica.png`,
  toolShampoo: `${BASE_PATH}/Objetos y Vestuario/Herramientas Individuales/Shampoo Floral Real.png`,
  toolShower: `${BASE_PATH}/Objetos y Vestuario/Herramientas Individuales/Ducha Dorada.png`,
  toolDryer: `${BASE_PATH}/Objetos y Vestuario/Herramientas Individuales/Secador de Cristal.png`,
  toolBrush: `${BASE_PATH}/Objetos y Vestuario/Herramientas Individuales/Cepillo Real de Joyas.png`,
};

// Catálogo de Vestuario Paper Doll Modular (768x1376 dibujado directamente sobre el modelo cuerpo completo)
const WARDROBE_CATALOG = {
  dresses: [
    { id: 'dress-lavender', name: 'Vestido Lavanda Princesa', file: 'Vestido Lavanda Princesa.png', quote: '«¡Lavanda real con constelaciones doradas! Digno de un cuento de hadas.»' },
    { id: 'dress-rosegold', name: 'Vestido Rosa Oro Imperial', file: 'Vestido Rosa Oro Imperial.png', quote: '«¡Brilla en rosa y oro como el amanecer en mi torre!»' },
    { id: 'dress-starry', name: 'Vestido Noche Estrellada', file: 'Vestido Noche Estrellada.png', quote: '«¡Tiene constelaciones y lunas plateadas! Mi favorito mágico.»' },
    { id: 'dress-emerald', name: 'Vestido Esmeralda Encantado', file: 'Vestido Esmeralda Encantado.png', quote: '«¡Este verde esmeralda hace que mis ojos resalten muchísimo!»' },
    { id: 'dress-sun', name: 'Vestido Dorado del Sol', file: 'Vestido Dorado del Sol.png', quote: '«¡Luminoso como el sol dorado! Combina increíble con mi melena.»' },
  ],
  tops: [
    { id: 'top-white-navy', name: 'Blusa Blanca Lazo Azul', file: 'Blusa Blanca Lazo Azul.png', layer: 'under-waist', sleeve: 'long', quote: '«¡Elegancia clásica de palacio con puños de vuelo y lazo azul!»' },
    { id: 'top-cream-ruby', name: 'Blusa Crema Lazo Rubi', file: 'Blusa Crema Lazo Rubi.png', layer: 'under-waist', sleeve: 'long', quote: '«¡Seda color crema con lazo rubí y mangas de princesa!»' },
    { id: 'top-pink-pearl', name: 'Blusa Rosa Perlas y Corazon', file: 'Blusa Rosa Perlas y Corazon.png', layer: 'under-waist', sleeve: 'short', quote: '«¡El collar de perlas y el broche de corazón son súper tiernos!»' },
    { id: 'top-sky-pearl', name: 'Blusa Celeste Perlas Reales', file: 'Blusa Celeste Perlas Reales.png', layer: 'under-waist', sleeve: 'short', quote: '«¡Suave seda celeste con perlas brillantes y mangas abullonadas!»' },
    { id: 'top-lav-pearl', name: 'Blusa Lavanda Suave', file: 'Blusa Lavanda Suave.png', layer: 'under-waist', sleeve: 'short', quote: '«¡Mi tono lavanda favorito con cuello de vuelos y perlas!»' },
    { id: 'top-corset-starry', name: 'Corset Estrellado Azul Noche', file: 'Corset Estrellado Azul Noche.png', layer: 'over-waist', sleeve: 'short', quote: '«¡Un corset estrellado de terciopelo con mangas caídas de tul!»' },
    { id: 'top-corset-lav', name: 'Corset Lavanda Real', file: 'Corset Lavanda Real.png', layer: 'over-waist', sleeve: 'short', quote: '«¡Corset lavanda con detalles de luna y oro hecho a mi medida!»' },
    { id: 'top-corset-rose', name: 'Corset Rosa Imperial', file: 'Corset Rosa Imperial.png', layer: 'over-waist', sleeve: 'short', quote: '«¡Romántico corset rosa imperial que combina con falda o pantalón!»' },
  ],
  bottoms: [
    { id: 'bot-skirt-violet', name: 'Falda Violeta Bordada', file: 'Falda Violeta Bordada.png', type: 'skirt', quote: '«¡Falda violeta plisada con filigrana dorada de princesa!»' },
    { id: 'bot-skirt-pink', name: 'Falda Rosa Princesa', file: 'Falda Rosa Princesa.png', type: 'skirt', quote: '«¡Rosa imperial con bordados dorados en todo el borde!»' },
    { id: 'bot-skirt-blue', name: 'Falda Azul Cielo Real', file: 'Falda Azul Cielo Real.png', type: 'skirt', quote: '«¡Un azul cielo de cuento con vuelo y bordado real!»' },
    { id: 'bot-skirt-green', name: 'Falda Verde Esmeralda', file: 'Falda Verde Esmeralda.png', type: 'skirt', quote: '«¡Verde bosque encantado con filigrana de oro!»' },
    { id: 'bot-pants-violet', name: 'Pantalon Aventura Violeta', file: 'Pantalon Aventura Violeta.png', type: 'pants', quote: '«¡Quién dijo que una princesa no luce increíble en pantalón!»' },
    { id: 'bot-pants-cream', name: 'Pantalon Corte Real Crema', file: 'Pantalon Corte Real Crema.png', type: 'pants', quote: '«¡Entallado a la cintura en tono crema y listo para la aventura!»' },
    { id: 'bot-pants-navy', name: 'Pantalon Real Azul Marino', file: 'Pantalon Real Azul Marino.png', type: 'pants', quote: '«¡Corte sastre real en azul marino con ribetes de oro!»' },
    { id: 'bot-pants-green', name: 'Pantalon Bosque Esmeralda', file: 'Pantalon Bosque Esmeralda.png', type: 'pants', quote: '«¡Perfecto para salir de la torre a explorar el reino!»' },
  ],
  head: [
    { id: 'head-tiara-flowers', name: 'Tiara Real de Flores', file: 'Tiara Real de Flores.png', quote: '«¡Cristales y flores dignas de la corona real!»' },
    { id: 'head-tiara-emerald', name: 'Tiara Esmeralda y Plata', file: 'Tiara Esmeralda y Plata.png', quote: '«¡Las esmeraldas hacen juego con mis ojos!»' },
    { id: 'head-ribbons-pink', name: 'Lazos Rosa y Celeste', file: 'Lazos Rosa y Celeste.png', quote: '«¡Dos lazos adorables estilo anime a los lados de mi peinado!»' },
    { id: 'head-ribbons-gold', name: 'Lazos Dorado y Lavanda', file: 'Lazos Dorado y Lavanda.png', quote: '«¡Lazos en oro y lavanda colocados a cada lado!»' },
  ],
  shoes: [
    { id: 'shoe-lav-heels', name: 'Tacones Lavanda con Correa', file: 'Tacones Lavanda con Correa.png', quote: '«¡Tacones lavanda con correa fina ajustada al tobillo!»' },
    { id: 'shoe-pink-heels', name: 'Tacones Rosa Sakura', file: 'Tacones Rosa Sakura.png', quote: '«¡Tacones rosa sakura dignos de un baile real!»' },
    { id: 'shoe-blue-crystal', name: 'Tacones Cristal Azul Cielo', file: 'Tacones Cristal Azul Cielo.png', quote: '«¡Brillan como el cristal con un delicado lazo celeste!»' },
    { id: 'shoe-gold-flats', name: 'Zapatillas Doradas con Lazo', file: 'Zapatillas Doradas con Lazo.png', quote: '«¡Oro brillante y súper cómodas para bailar toda la noche!»' },
  ],
};

// Cargar imágenes
const IMAGES = {};
const ASSET_CACHE_VER = 'v10';
function loadImage(key, src) {
  const img = new Image();
  img.src = `${encodeURI(src)}?${ASSET_CACHE_VER}`;
  IMAGES[key] = img;
}

Object.entries(ASSET_MANIFEST).forEach(([k, v]) => loadImage(k, v));

// Cargar los 8 pasos progresivos de Rapunzel sin granitos
for (let i = 1; i <= 8; i++) {
  loadImage(`rapHealedStep${i}`, `${BASE_PATH}/Personajes/Sprites Transparentes/Rapunzel Sin Granos Paso ${i}.png`);
}

// Cargar TODAS las prendas y zapatos Paper Doll (lienzo nativo 768x1376 bloqueado al cuerpo base)
['dresses', 'tops', 'bottoms', 'head', 'shoes'].forEach((cat) => {
  WARDROBE_CATALOG[cat].forEach((item) => {
    item.imgKey = `pd-${item.id}`;
    loadImage(item.imgKey, `${BASE_PATH}/Objetos y Vestuario/Prendas Paper Doll/${item.file}`);
  });
});

// ============================================================================
// SISTEMA DE AUDIO SINTETIZADO (Web Audio API)
// ============================================================================
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 0.14, type = 'sine', vol = 0.08, slideTo = null) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playVoiceBlip(speaker = 'Rapunzel') {
    const base = speaker.includes('Príncipe') ? 245 : 495;
    this.playTone(base + Math.random() * 85, 0.055, 'triangle', 0.04);
  }

  playHairDrop() {
    this.playTone(620, 0.55, 'sine', 0.1, 220);
  }

  playHairYank() {
    this.playTone(210, 0.28, 'sawtooth', 0.12, 880);
  }

  playShock() {
    this.playTone(580, 0.12, 'sawtooth', 0.11, 240);
    setTimeout(() => this.playTone(490, 0.18, 'sawtooth', 0.11, 180), 90);
  }

  playError() {
    this.playTone(220, 0.18, 'sawtooth', 0.1, 130);
  }

  playBubble() {
    this.playTone(440 + Math.random() * 340, 0.08, 'sine', 0.05, 790);
  }

  playPopSuccess() {
    this.playTone(520, 0.09, 'triangle', 0.11, 980);
    setTimeout(() => this.playTone(1046, 0.14, 'sine', 0.09), 70);
  }

  playSparkle() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.18, 'triangle', 0.07), i * 55);
    });
  }
}

const sfx = new SoundSystem();

// ============================================================================
// ESTADO GLOBAL DEL JUEGO
// ============================================================================
// Los 8 granitos reales pintados en el sprite 896x1200 de Rapunzel Desarreglada:
const REAL_SPRITE_PIMPLES = [
  { id: 0, name: 'Frente Izquierda', lx: 395, ly: 264, r: 13 },
  { id: 1, name: 'Frente Centro', lx: 434, ly: 259, r: 13 },
  { id: 2, name: 'Entrecejo', lx: 431, ly: 292, r: 13 },
  { id: 3, name: 'Puente de la Nariz', lx: 455, ly: 342, r: 12 },
  { id: 4, name: 'Mejilla Izquierda Alta', lx: 396, ly: 368, r: 14 },
  { id: 5, name: 'Mejilla Izquierda Baja', lx: 398, ly: 387, r: 13 },
  { id: 6, name: 'Mejilla Derecha Alta', lx: 491, ly: 374, r: 13 },
  { id: 7, name: 'Mejilla Derecha Baja', lx: 483, ly: 395, r: 14 },
];

// Las 5 zonas anatómicas del rostro (en coordenadas locales 896x1200 de Rapunzel)
const FACE_ZONES_LOCAL = [
  { id: 0, name: 'Frente', lx: 432, ly: 268, r: 34 },
  { id: 1, name: 'Mejilla Izq.', lx: 395, ly: 356, r: 28 },
  { id: 2, name: 'Mejilla Der.', lx: 492, ly: 352, r: 28 },
  { id: 3, name: 'Nariz', lx: 444, ly: 336, r: 22 },
  { id: 4, name: 'Barbilla', lx: 445, ly: 406, r: 24 },
];

// Los 6 mechones del cabello de Rapunzel (en coordenadas locales 896x1200)
const HAIR_ZONES_LOCAL = [
  { id: 0, name: 'Copa Alta', lx: 448, ly: 145, r: 62 },
  { id: 1, name: 'Melena Alta Izq.', lx: 310, ly: 215, r: 58 },
  { id: 2, name: 'Melena Alta Der.', lx: 585, ly: 215, r: 58 },
  { id: 3, name: 'Mechón Medio Izq.', lx: 245, ly: 430, r: 62 },
  { id: 4, name: 'Mechón Medio Der.', lx: 645, ly: 430, r: 62 },
  { id: 5, name: 'Puntas Inferiores', lx: 255, ly: 635, r: 64 },
];

// Las 5 rutas de cepillado direccional (de arriba hacia abajo ↓ en coordenadas locales 896x1200)
const BRUSH_LANES_LOCAL = [
  { id: 0, name: 'Mechón Izquierdo', startX: 315, startY: 165, endX: 255, endY: 520 },
  { id: 1, name: 'Coronilla Izquierda', startX: 395, startY: 125, endX: 335, endY: 425 },
  { id: 2, name: 'Coronilla Derecha', startX: 505, startY: 125, endX: 555, endY: 425 },
  { id: 3, name: 'Mechón Derecho', startX: 585, startY: 165, endX: 645, endY: 520 },
  { id: 4, name: 'Melena Larga Inferior', startX: 620, startY: 380, endX: 650, endY: 720 },
];

const STATE = {
  stage: 'menu',
  time: 0,
  lastTime: performance.now(),

  petals: [],
  sparkles: [],
  floatingTexts: [],

  cinematicType: 'intro',
  cinematicStep: 0,
  stepElapsed: 0,
  typewriterIndex: 0,
  typewriterTimer: 0,
  hairDropProgress: 0,

  blinkTimer: 0,
  isBlinking: false,

  makeoverPhase: 'face',
  activeToolIndex: 0,
  completedTools: [false, false, false, false],
  stepProgress: 0,
  isPointerDown: false,
  pointerX: 688,
  pointerY: 384,
  lastPointerX: 688,
  lastPointerY: 384,

  // Mecánicas interactivas de Fase 1 y Fase 2
  faceZonesProgress: [0, 0, 0, 0, 0], // 0..100 por cada zona de la cara
  maskZonesDone: [false, false, false, false, false],
  hairZonesProgress: [0, 0, 0, 0, 0, 0], // 0..100 por cada mechón

  // Minijuego de Precisión para Quitar Espinillas
  pimples: [],
  activePimpleChallenge: null, // { pimpleId, cursorPos: 0..1, dir: 1, speed: 1.45 }

  // Minijuego de Regulador de Temperatura de la Ducha Dorada (Paso 2 de Cabello)
  showerTempLocked: false,
  showerTempPos: 0.2,
  showerTempDir: 1,

  // Minijuego de Cepillado Direccional por Mechones (Paso 4 de Cabello)
  brushLanesDone: [false, false, false, false, false],
  activeBrushLane: null,
  brushDragProgress: 0,

  foamBubbles: [],
  waterDrops: [],
  faceCleanFactor: 0,
  hairCleanFactor: 0,

  // Transformación actual de Rapunzel en pantalla para mapear coordenadas locales 896x1200 <-> pantalla
  rapTransform: { centerX: 690, bottomY: 960, scale: 0.84 },

  activeWardrobeTab: 'dresses',
  outfit: {
    mode: 'dress',
    dressId: 'dress-lavender',
    topId: 'top-white-navy',
    bottomId: 'bot-skirt-violet',
    headId: 'head-tiara-flowers',
    shoeId: 'shoe-lav-heels',
  },
};

// Convertir coordenada local (lx, ly) del sprite 896x1200 de Rapunzel a coordenada de pantalla (sx, sy)
function rapLocalToScreen(lx, ly) {
  const { centerX, bottomY, scale } = STATE.rapTransform;
  const breathY = Math.sin(STATE.time * 2.6) * 4.5;
  return {
    x: centerX + (lx - 448) * scale,
    y: bottomY + breathY + (ly - 1200) * scale,
  };
}

for (let i = 0; i < 34; i++) {
  STATE.petals.push({
    x: Math.random() * 1376,
    y: Math.random() * 768,
    r: 4 + Math.random() * 6,
    vx: -0.4 - Math.random() * 0.7,
    vy: 0.5 + Math.random() * 0.9,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.04,
    color: Math.random() > 0.45 ? '#ffb8d9' : '#ffd464',
  });
}

function spawnSparkleBurst(x, y, count = 18, color = '#ffd464') {
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const spd = 1.5 + Math.random() * 4.5;
    STATE.sparkles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 0.8,
      size: 5 + Math.random() * 8,
      alpha: 1,
      color: i % 2 === 0 ? color : '#fff6d6',
    });
  }
}

function spawnFloatingText(x, y, text, color = '#ffd464') {
  STATE.floatingTexts.push({ x, y, text, color, alpha: 1.0, vy: -1.4 });
}

// ============================================================================
// GUIONES DE LAS CINEMÁTICAS
// ============================================================================
const INTRO_SCRIPT = [
  {
    location: 'Exterior de la Torre • Amanecer',
    speaker: 'Príncipe',
    tailPos: '38%',
    panic: false,
    sceneMode: 'tower-arrival',
    text: '«¡Rapunzel, mi dulce princesa! ¡He viajado hasta tu torre sin puertas! ¡Lanza tu hermosa cabellera dorada para que pueda subir!»',
  },
  {
    location: 'Habitación de la Torre • 7:00 AM',
    speaker: 'Rapunzel (Medio Dormida)',
    tailPos: '52%',
    panic: false,
    sceneMode: 'bedroom-wakeup',
    text: '«¿Mmm...? ¿Quién grita tan temprano...? ¡Ay, es la voz del príncipe! ¡Voy, voy, ahí va mi cabello!»',
  },
  {
    location: 'Ventana Alta de la Torre',
    speaker: 'Rapunzel',
    tailPos: '50%',
    panic: false,
    sceneMode: 'hair-dropping',
    text: '*(Rapunzel lanza su larguísima trenza dorada por la ventana alta de la torre por puro instinto mañanero...)*',
  },
  {
    location: '¡Emergencia en la Ventana!',
    speaker: 'Rapunzel',
    tailPos: '50%',
    panic: true,
    sceneMode: 'hair-yank-panic',
    text: '«¡¡ESPERA UN SEGUNDO!! ¡¡Si todavía no me he arreglado la cara!! ¡¡SUBE, CABELLO, SUBE DE VUELTA!!»',
  },
  {
    location: 'Base de la Torre',
    speaker: 'Príncipe (Confundido)',
    tailPos: '40%',
    panic: false,
    sceneMode: 'prince-confused',
    text: '«¿Eh...? ¿Tiró el cabello y lo volvió a recoger de golpe? ¿Habré dicho mal el verso real...? Qué extraño...»',
  },
  {
    location: 'Interior de la Torre • ¡Pánico Real!',
    speaker: 'Rapunzel',
    tailPos: '50%',
    panic: true,
    sceneMode: 'rapunzel-messy-reveal',
    text: '«¡¡QUÉ HORROR!! ¡Al no tener contacto con el mundo estoy toda desarreglada! ¡Tengo la cara llena de espinillas, ojeras, el pelo hecho un nido y estoy en camisón!»',
  },
  {
    location: 'Rumbo al Baño de la Torre',
    speaker: 'Rapunzel',
    tailPos: '58%',
    panic: false,
    sceneMode: 'rapunzel-rush-bath',
    text: '«¡No puedo dejar que el príncipe me vea así! ¡Rápido, al baño! Primero me arreglo la cara, segundo me lavo el cabello y por último me visto hermosa.»',
  },
];

const OUTRO_SCRIPT = [
  {
    location: 'Ventana Alta de la Torre • Lista y Radiante',
    speaker: 'Rapunzel',
    tailPos: '50%',
    panic: false,
    sceneMode: 'outro-hair-drop',
    text: '«¡Ahora sí estoy impecable y vestida para la ocasión! ¡Príncipe, ahí va mi cabello de verdad!»',
  },
  {
    location: 'Escalada Real por la Trenza',
    speaker: 'Príncipe',
    tailPos: '42%',
    panic: false,
    sceneMode: 'outro-climbing',
    text: '«¡Qué aroma a flores y qué suavidad tiene tu cabellera! ¡Allá subo trepando hasta tu ventana, princesa!»',
  },
  {
    location: 'Habitación de Rapunzel • El Encuentro',
    speaker: 'Príncipe (Deslumbrado)',
    tailPos: '32%',
    panic: false,
    sceneMode: 'outro-meeting',
    text: '«¡Oh, por todos los cielos, Rapunzel! ¡Estás absolutamente hermosa! Ese atuendo te queda espectacular.»',
  },
  {
    location: 'Habitación de Rapunzel • Final Feliz',
    speaker: 'Rapunzel',
    tailPos: '66%',
    panic: false,
    sceneMode: 'outro-finale',
    text: '«¡Jajaja, gracias! Digamos que toda princesa necesita cinco minutitos de preparación antes de lanzar el cabello. ¡Bienvenido a la torre!»',
  },
];

// ============================================================================
// CONFIGURACIÓN DE HERRAMIENTAS FASE 1 (CARA) Y FASE 2 (CABELLO)
// ============================================================================
const FACE_TOOLS = [
  {
    name: '1. Jabón Facial',
    imgKey: 'toolCleanser',
    task: 'Frota el Jabón Espumoso en círculos sobre cada una de las 5 zonas marcadas del rostro hasta llegar al 100%.',
    actionType: 'foam-zones',
  },
  {
    name: '2. Esponja Suave',
    imgKey: 'toolSponge',
    task: 'Pasa la Esponja Húmeda por cada una de las 5 zonas enjabonadas para retirar toda la espuma.',
    actionType: 'wipe-zones',
  },
  {
    name: '3. Quita Espinillas',
    imgKey: 'toolExtractor',
    task: 'Haz clic en cada espinilla real de su rostro y vuelve a hacer clic cuando el marcador dorado esté en la ZONA VERDE.',
    actionType: 'precision-pimples',
  },
  {
    name: '4. Mascarilla Mágica',
    imgKey: 'toolMask',
    task: 'Haz clic en los 5 puntos faciales para aplicar la Mascarilla Verde Menta y eliminar sus ojeras.',
    actionType: 'mask-points',
  },
];

const HAIR_TOOLS = [
  {
    name: '1. Shampoo Floral',
    imgKey: 'toolShampoo',
    task: 'Frota el Shampoo Floral sobre cada uno de los 6 mechones marcados hasta llenarlos de espuma.',
    actionType: 'shampoo-zones',
  },
  {
    name: '2. Ducha Dorada',
    imgKey: 'toolShower',
    task: 'Primero fija la temperatura del agua en la ZONA TIBIA VERDE y luego enjuaga los 6 mechones.',
    actionType: 'temp-and-rinse',
  },
  {
    name: '3. Secador Cristal',
    imgKey: 'toolDryer',
    task: 'Mantén la brisa del Secador de Cristal sobre cada grupo de gotas de agua hasta evaporarlas todas.',
    actionType: 'dry-clusters',
  },
  {
    name: '4. Cepillo de Joyas',
    imgKey: 'toolBrush',
    task: 'Arrastra el Cepillo Real de ARRIBA hacia ABAJO (↓) siguiendo las 5 flechas doradas del cabello.',
    actionType: 'directional-brush',
  },
];

// ============================================================================
// CAMBIO DE ETAPAS
// ============================================================================
function setStage(newStage) {
  STATE.stage = newStage;
  STATE.stepElapsed = 0;
  STATE.activePimpleChallenge = null;

  document.querySelectorAll('.nav-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.jump === newStage);
  });

  const stageNames = {
    menu: 'Menú Principal',
    intro: 'Paso 3: Cinemática Inicial',
    face: 'Paso 4A: Fase 1 - Cuidado Facial',
    hair: 'Paso 4B: Fase 2 - Lavar Cabello',
    dressup: 'Paso 5: Fase 3 - Vestidor Real',
    outro: 'Paso 6: Cinemática Final',
    victory: 'Nivel 1 Completado',
  };
  const stageLabelEl = document.getElementById('current-stage-label');
  if (stageLabelEl) {
    stageLabelEl.textContent = stageNames[newStage] || '';
  }

  document.querySelectorAll('.ui-layer').forEach((el) => el.classList.remove('active'));

  if (newStage === 'menu') {
    document.getElementById('ui-menu').classList.add('active');
  } else if (newStage === 'intro') {
    STATE.cinematicType = 'intro';
    STATE.cinematicStep = 0;
    document.getElementById('ui-cinematic').classList.add('active');
    loadCinematicStep(0);
  } else if (newStage === 'face') {
    initMakeoverPhase('face');
    document.getElementById('ui-makeover').classList.add('active');
  } else if (newStage === 'hair') {
    initMakeoverPhase('hair');
    document.getElementById('ui-makeover').classList.add('active');
  } else if (newStage === 'dressup') {
    STATE.faceCleanFactor = 1;
    STATE.hairCleanFactor = 1;
    initDressupUI();
    document.getElementById('ui-dressup').classList.add('active');
    sfx.playSparkle();
  } else if (newStage === 'outro') {
    STATE.faceCleanFactor = 1;
    STATE.hairCleanFactor = 1;
    STATE.cinematicType = 'outro';
    STATE.cinematicStep = 0;
    document.getElementById('ui-cinematic').classList.add('active');
    loadCinematicStep(0);
  } else if (newStage === 'victory') {
    document.getElementById('ui-victory').classList.add('active');
    sfx.playSparkle();
    saveLocalPrincesasProgress(1);
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'PRINCESAS_LEVEL1_COMPLETED',
            levelReached: 1,
            outfit: { ...STATE.outfit },
          },
          '*'
        );
      }
    } catch {
      // Ignorar si no está embebido
    }
  }
}

function getActiveScript() {
  return STATE.cinematicType === 'intro' ? INTRO_SCRIPT : OUTRO_SCRIPT;
}

function loadCinematicStep(index) {
  const script = getActiveScript();
  if (index >= script.length) {
    if (STATE.cinematicType === 'intro') {
      setStage('face');
    } else {
      setStage('victory');
    }
    return;
  }

  STATE.cinematicStep = index;
  STATE.stepElapsed = 0;
  STATE.typewriterIndex = 0;
  STATE.typewriterTimer = 0;

  const step = script[index];
  document.getElementById('cinematic-location').textContent = step.location;
  document.getElementById('dialogue-speaker').textContent = step.speaker;
  document.getElementById('dialogue-step-counter').textContent = `${index + 1} / ${script.length}`;
  document.getElementById('bubble-tail').style.left = step.tailPos;

  const bubble = document.getElementById('speech-bubble-container');
  bubble.classList.toggle('panic-bubble', Boolean(step.panic));
  document.getElementById('dialogue-text').textContent = '';

  if (step.sceneMode === 'hair-dropping' || step.sceneMode === 'outro-hair-drop') {
    STATE.hairDropProgress = 0;
    sfx.playHairDrop();
  } else if (step.sceneMode === 'hair-yank-panic') {
    STATE.hairDropProgress = 1;
    sfx.playHairYank();
    sfx.playShock();
  } else if (step.panic) {
    sfx.playShock();
  }
}

function advanceDialogue() {
  const script = getActiveScript();
  const step = script[STATE.cinematicStep];
  if (!step) return;

  if (STATE.typewriterIndex < step.text.length) {
    STATE.typewriterIndex = step.text.length;
    document.getElementById('dialogue-text').textContent = step.text;
    return;
  }

  loadCinematicStep(STATE.cinematicStep + 1);
}

// ============================================================================
// INICIALIZACIÓN Y MECÁNICAS DE FASE 1 (CARA) Y FASE 2 (CABELLO)
// ============================================================================
function initMakeoverPhase(phase) {
  STATE.makeoverPhase = phase;
  STATE.activeToolIndex = 0;
  STATE.completedTools = [false, false, false, false];
  STATE.stepProgress = 0;
  STATE.foamBubbles = [];
  STATE.waterDrops = [];
  STATE.activePimpleChallenge = null;
  STATE.rapTransform = { centerX: 690, bottomY: 960, scale: 0.84 };

  if (phase === 'face') {
    STATE.faceCleanFactor = 0;
    STATE.hairCleanFactor = 0;
    STATE.faceZonesProgress = [0, 0, 0, 0, 0];
    STATE.maskZonesDone = [false, false, false, false, false];
    STATE.pimples = REAL_SPRITE_PIMPLES.map((p) => ({
      ...p,
      healed: false,
      pulse: Math.random() * 6,
    }));
    document.getElementById('makeover-phase-badge').textContent = 'Fase 1 de 3 • Baño de la Torre';
    document.getElementById('makeover-phase-title').textContent = 'Arreglar la Cara de Rapunzel';
  } else {
    STATE.faceCleanFactor = 1;
    STATE.hairCleanFactor = 0;
    STATE.hairZonesProgress = [0, 0, 0, 0, 0, 0];
    STATE.showerTempLocked = false;
    STATE.showerTempPos = 0.15;
    STATE.brushLanesDone = [false, false, false, false, false];
    STATE.activeBrushLane = null;
    STATE.brushDragProgress = 0;
    document.getElementById('makeover-phase-badge').textContent = 'Fase 2 de 3 • Baño de la Torre';
    document.getElementById('makeover-phase-title').textContent = 'Lavar y Peinar el Cabello';
  }

  renderMakeoverHUD();
}

function getCurrentToolList() {
  return STATE.makeoverPhase === 'face' ? FACE_TOOLS : HAIR_TOOLS;
}

function renderMakeoverHUD() {
  const tools = getCurrentToolList();
  const currentTool = tools[STATE.activeToolIndex];

  document.getElementById('makeover-instruction').textContent = currentTool ? currentTool.task : '¡Fase completada!';
  document.getElementById('current-tool-task').textContent = currentTool ? currentTool.name : '¡Listo!';
  document.getElementById('makeover-progress-pct').textContent = `${Math.round(STATE.stepProgress)}%`;
  document.getElementById('makeover-progress-fill').style.width = `${Math.min(100, STATE.stepProgress)}%`;

  const dotsContainer = document.getElementById('makeover-steps-dots');
  dotsContainer.innerHTML = '';
  tools.forEach((t, idx) => {
    const dot = document.createElement('span');
    dot.className = 'step-dot' + (STATE.completedTools[idx] ? ' done' : idx === STATE.activeToolIndex ? ' current' : '');
    dot.textContent = STATE.completedTools[idx] ? `✓ Paso ${idx + 1}` : `Paso ${idx + 1}`;
    dotsContainer.appendChild(dot);
  });

  const dock = document.getElementById('makeover-tools-dock');
  dock.innerHTML = '';
  tools.forEach((tool, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    if (STATE.completedTools[idx]) btn.classList.add('completed');
    if (idx === STATE.activeToolIndex) btn.classList.add('selected', 'recommended');

    const img = document.createElement('img');
    img.src = encodeURI(ASSET_MANIFEST[tool.imgKey]);
    img.alt = tool.name;

    const label = document.createElement('span');
    label.textContent = tool.name;

    btn.appendChild(img);
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      if (idx <= STATE.activeToolIndex) {
        STATE.activeToolIndex = idx;
        renderMakeoverHUD();
      }
    });
    dock.appendChild(btn);
  });
}

function handleMakeoverInteraction(x, y, isClick = false) {
  if (STATE.stage !== 'face' && STATE.stage !== 'hair') return;
  const tools = getCurrentToolList();
  const tool = tools[STATE.activeToolIndex];
  if (!tool || STATE.completedTools[STATE.activeToolIndex]) return;

  const moveDist = Math.hypot(x - STATE.lastPointerX, y - STATE.lastPointerY);

  // -------------------------------------------------------------------------
  // FASE 1 (CARA)
  // -------------------------------------------------------------------------
  if (tool.actionType === 'foam-zones') {
    // El jugador debe frotar cada una de las 5 zonas anatómicas del rostro
    let changed = false;
    FACE_ZONES_LOCAL.forEach((z, idx) => {
      const sp = rapLocalToScreen(z.lx, z.ly);
      const rad = z.r * STATE.rapTransform.scale;
      if (Math.hypot(x - sp.x, y - sp.y) < rad + 16 && (moveDist > 2 || isClick)) {
        if (STATE.faceZonesProgress[idx] < 100) {
          STATE.faceZonesProgress[idx] = Math.min(100, STATE.faceZonesProgress[idx] + (isClick ? 18 : 6.5));
          changed = true;
          STATE.foamBubbles.push({
            zoneId: idx,
            lx: z.lx + (Math.random() - 0.5) * z.r * 1.1,
            ly: z.ly + (Math.random() - 0.5) * z.r * 1.1,
            r: 8 + Math.random() * 11,
            color: 'rgba(255, 252, 255, 0.92)',
          });
          if (Math.random() < 0.35) sfx.playBubble();
        }
      }
    });
    if (changed) {
      const sum = STATE.faceZonesProgress.reduce((a, b) => a + b, 0);
      STATE.stepProgress = sum / FACE_ZONES_LOCAL.length;
      updateProgressBarsOnly();
      if (STATE.faceZonesProgress.every((v) => v >= 100)) {
        completeCurrentToolStep();
      }
    }
  } else if (tool.actionType === 'wipe-zones') {
    // Limpiar la espuma de cada una de las 5 zonas con la esponja
    let changed = false;
    FACE_ZONES_LOCAL.forEach((z, idx) => {
      const sp = rapLocalToScreen(z.lx, z.ly);
      const rad = z.r * STATE.rapTransform.scale;
      if (Math.hypot(x - sp.x, y - sp.y) < rad + 20 && (moveDist > 2 || isClick)) {
        if (STATE.faceZonesProgress[idx] > 0) {
          STATE.faceZonesProgress[idx] = Math.max(0, STATE.faceZonesProgress[idx] - (isClick ? 25 : 8.5));
          changed = true;
          // Eliminar burbujas cercanas
          STATE.foamBubbles = STATE.foamBubbles.filter((b) => {
            const bsp = rapLocalToScreen(b.lx, b.ly);
            return Math.hypot(bsp.x - x, bsp.y - y) > 34;
          });
          if (Math.random() < 0.3) sfx.playBubble();
        }
      }
    });
    if (changed) {
      const remaining = STATE.faceZonesProgress.reduce((a, b) => a + b, 0);
      STATE.stepProgress = ((500 - remaining) / 500) * 100;
      updateProgressBarsOnly();
      if (STATE.faceZonesProgress.every((v) => v <= 0)) {
        STATE.foamBubbles = [];
        completeCurrentToolStep();
      }
    }
  } else if (tool.actionType === 'precision-pimples') {
    if (!isClick) return;

    // Si ya hay una barra de precisión abierta para un granito, verificar si acertó en la zona verde!
    if (STATE.activePimpleChallenge) {
      const ch = STATE.activePimpleChallenge;
      const p = STATE.pimples.find((item) => item.id === ch.pimpleId);
      const sp = p ? rapLocalToScreen(p.lx, p.ly) : { x, y };

      // Zona verde de precisión: entre 0.36 y 0.64
      if (ch.cursorPos >= 0.36 && ch.cursorPos <= 0.64) {
        if (p) p.healed = true;
        STATE.activePimpleChallenge = null;
        sfx.playPopSuccess();
        spawnSparkleBurst(sp.x, sp.y, 18, '#ffd464');
        spawnFloatingText(sp.x, sp.y - 18, '¡Perfecto! ✨', '#7bed9f');

        const healedCount = STATE.pimples.filter((item) => item.healed).length;
        STATE.stepProgress = (healedCount / STATE.pimples.length) * 100;
        updateProgressBarsOnly();

        if (healedCount === STATE.pimples.length) {
          completeCurrentToolStep();
        }
      } else {
        // Falló el timing: Rapunzel se queja y el jugador debe intentarlo con más cuidado
        sfx.playError();
        spawnFloatingText(sp.x, sp.y - 18, '¡Auch! Apunta al centro verde', '#ff6b81');
      }
      return;
    }

    // Si no hay desafío activo, comprobar si el jugador hizo clic o tocó alguno de los 8 granitos reales del sprite
    // (radio amplio de 36px para que en pantallas táctiles de teléfonos sea súper cómodo atinarle con el dedo)
    let bestPimple = null;
    let bestDist = 36;
    for (const p of STATE.pimples) {
      if (p.healed) continue;
      const sp = rapLocalToScreen(p.lx, p.ly);
      const d = Math.hypot(x - sp.x, y - sp.y);
      if (d <= bestDist) {
        bestDist = d;
        bestPimple = p;
      }
    }
    if (bestPimple) {
      STATE.activePimpleChallenge = {
        pimpleId: bestPimple.id,
        cursorPos: 0.1,
        dir: 1,
        speed: 1.32 + Math.random() * 0.3,
      };
      sfx.playBubble();
    }
  } else if (tool.actionType === 'mask-points') {
    // Aplicar la mascarilla en las 5 zonas del rostro haciendo clic o frotando cada zona
    FACE_ZONES_LOCAL.forEach((z, idx) => {
      if (STATE.maskZonesDone[idx]) return;
      const sp = rapLocalToScreen(z.lx, z.ly);
      if (Math.hypot(x - sp.x, y - sp.y) <= z.r * STATE.rapTransform.scale + 12) {
        STATE.maskZonesDone[idx] = true;
        sfx.playPopSuccess();
        spawnSparkleBurst(sp.x, sp.y, 12, '#7bed9f');
        spawnFloatingText(sp.x, sp.y - 15, `✓ ${z.name}`, '#7bed9f');

        const doneCount = STATE.maskZonesDone.filter(Boolean).length;
        STATE.stepProgress = (doneCount / FACE_ZONES_LOCAL.length) * 100;
        STATE.faceCleanFactor = STATE.stepProgress / 100;
        updateProgressBarsOnly();

        if (doneCount === FACE_ZONES_LOCAL.length) {
          STATE.faceCleanFactor = 1;
          spawnSparkleBurst(690, 290, 32, '#7bed9f');
          completeCurrentToolStep();
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // FASE 2 (CABELLO)
  // -------------------------------------------------------------------------
  else if (tool.actionType === 'shampoo-zones') {
    let changed = false;
    HAIR_ZONES_LOCAL.forEach((z, idx) => {
      const sp = rapLocalToScreen(z.lx, z.ly);
      const rad = z.r * STATE.rapTransform.scale;
      if (Math.hypot(x - sp.x, y - sp.y) < rad + 18 && (moveDist > 2 || isClick)) {
        if (STATE.hairZonesProgress[idx] < 100) {
          STATE.hairZonesProgress[idx] = Math.min(100, STATE.hairZonesProgress[idx] + (isClick ? 20 : 6.0));
          changed = true;
          STATE.foamBubbles.push({
            zoneId: idx,
            lx: z.lx + (Math.random() - 0.5) * z.r * 1.1,
            ly: z.ly + (Math.random() - 0.5) * z.r * 1.1,
            r: 13 + Math.random() * 15,
            color: Math.random() > 0.35 ? 'rgba(255, 240, 250, 0.9)' : 'rgba(255, 195, 230, 0.85)',
          });
          if (Math.random() < 0.35) sfx.playBubble();
        }
      }
    });
    if (changed) {
      const sum = STATE.hairZonesProgress.reduce((a, b) => a + b, 0);
      STATE.stepProgress = sum / HAIR_ZONES_LOCAL.length;
      updateProgressBarsOnly();
      if (STATE.hairZonesProgress.every((v) => v >= 100)) {
        completeCurrentToolStep();
      }
    }
  } else if (tool.actionType === 'temp-and-rinse') {
    // Subpaso A: Primero fijar el regulador de temperatura del agua en la zona tibia ideal!
    if (!STATE.showerTempLocked) {
      if (!isClick) return;
      if (STATE.showerTempPos >= 0.36 && STATE.showerTempPos <= 0.64) {
        STATE.showerTempLocked = true;
        sfx.playPopSuccess();
        spawnFloatingText(690, 175, '¡Agua Tibia Perfecta! Ahora enjuaga los 6 mechones 🚿', '#7bed9f');
      } else {
        sfx.playError();
        const msg = STATE.showerTempPos < 0.36 ? '¡Brrr, muy fría! Apunta al centro verde' : '¡Quema! Apunta al centro verde';
        spawnFloatingText(690, 175, msg, '#ff6b81');
      }
      return;
    }

    // Subpaso B: Con la temperatura tibia lista, enjuagar cada uno de los 6 mechones
    let changed = false;
    HAIR_ZONES_LOCAL.forEach((z, idx) => {
      const sp = rapLocalToScreen(z.lx, z.ly);
      const rad = z.r * STATE.rapTransform.scale;
      if (Math.hypot(x - sp.x, y - sp.y) < rad + 24 && (moveDist > 2 || isClick)) {
        if (STATE.hairZonesProgress[idx] > 0) {
          STATE.hairZonesProgress[idx] = Math.max(0, STATE.hairZonesProgress[idx] - (isClick ? 25 : 8.0));
          changed = true;
          STATE.foamBubbles = STATE.foamBubbles.filter((b) => {
            const bsp = rapLocalToScreen(b.lx, b.ly);
            return Math.hypot(bsp.x - x, bsp.y - y) > 45;
          });
          if (Math.random() < 0.35) sfx.playBubble();
        }
      }
    });
    if (changed) {
      const remaining = STATE.hairZonesProgress.reduce((a, b) => a + b, 0);
      STATE.stepProgress = ((600 - remaining) / 600) * 100;
      updateProgressBarsOnly();
      if (STATE.hairZonesProgress.every((v) => v <= 0)) {
        STATE.foamBubbles = [];
        // Crear 6 grupos de gotas de agua en los 6 mechones para el paso del secador
        STATE.waterDrops = HAIR_ZONES_LOCAL.map((z) => ({
          id: z.id,
          name: z.name,
          lx: z.lx,
          ly: z.ly,
          wetness: 100,
        }));
        completeCurrentToolStep();
      }
    }
  } else if (tool.actionType === 'dry-clusters') {
    let changed = false;
    STATE.waterDrops.forEach((d) => {
      if (d.wetness <= 0) return;
      const sp = rapLocalToScreen(d.lx, d.ly);
      if (Math.hypot(x - sp.x, y - sp.y) < 62) {
        d.wetness = Math.max(0, d.wetness - (isClick ? 22 : 5.5));
        changed = true;
        if (Math.random() < 0.3) sfx.playBubble();
        if (d.wetness <= 0) {
          spawnSparkleBurst(sp.x, sp.y, 10, '#74c7ff');
          spawnFloatingText(sp.x, sp.y - 12, '¡Seco! 💨', '#7bed9f');
        }
      }
    });
    if (changed) {
      const totalWet = STATE.waterDrops.reduce((a, b) => a + b.wetness, 0);
      STATE.stepProgress = ((600 - totalWet) / 600) * 100;
      updateProgressBarsOnly();
      if (STATE.waterDrops.every((d) => d.wetness <= 0)) {
        STATE.waterDrops = [];
        completeCurrentToolStep();
      }
    }
  } else if (tool.actionType === 'directional-brush') {
    // Cepillado direccional de ARRIBA hacia ABAJO siguiendo las 5 flechas doradas
    const laneIdx = STATE.brushLanesDone.findIndex((done) => !done);
    if (laneIdx === -1) return;
    const lane = BRUSH_LANES_LOCAL[laneIdx];
    const startSp = rapLocalToScreen(lane.startX, lane.startY);
    const endSp = rapLocalToScreen(lane.endX, lane.endY);

    if (isClick) {
      // Iniciar trazo cerca del círculo superior de inicio (radio generoso de 76px para pantallas táctiles)
      if (Math.hypot(x - startSp.x, y - startSp.y) < 76) {
        STATE.activeBrushLane = laneIdx;
        STATE.brushDragProgress = 0.08;
        sfx.playBubble();
      }
    } else if (STATE.activeBrushLane === laneIdx) {
      // Proyectar posición actual del cursor sobre el vector (startSp -> endSp)
      const vx = endSp.x - startSp.x;
      const vy = endSp.y - startSp.y;
      const lenSq = vx * vx + vy * vy;
      const t = Math.max(0, Math.min(1, ((x - startSp.x) * vx + (y - startSp.y) * vy) / lenSq));
      // Distancia perpendicular al carril del mechón
      const projX = startSp.x + t * vx;
      const projY = startSp.y + t * vy;
      const perpDist = Math.hypot(x - projX, y - projY);

      if (perpDist < 72 && t >= STATE.brushDragProgress - 0.1) {
        STATE.brushDragProgress = Math.max(STATE.brushDragProgress, t);
        if (STATE.brushDragProgress >= 0.88) {
          STATE.brushLanesDone[laneIdx] = true;
          STATE.activeBrushLane = null;
          STATE.brushDragProgress = 0;
          sfx.playPopSuccess();
          spawnSparkleBurst(endSp.x, endSp.y, 16, '#ffd464');
          spawnFloatingText(endSp.x, endSp.y - 16, `✓ ${lane.name} Peinado`, '#ffd464');

          const doneCount = STATE.brushLanesDone.filter(Boolean).length;
          STATE.stepProgress = (doneCount / BRUSH_LANES_LOCAL.length) * 100;
          STATE.hairCleanFactor = STATE.stepProgress / 100;
          updateProgressBarsOnly();

          if (doneCount === BRUSH_LANES_LOCAL.length) {
            STATE.hairCleanFactor = 1;
            spawnSparkleBurst(690, 320, 34, '#ffd464');
            completeCurrentToolStep();
          }
        }
      }
    }
  }
}

function updateProgressBarsOnly() {
  document.getElementById('makeover-progress-pct').textContent = `${Math.round(STATE.stepProgress)}%`;
  document.getElementById('makeover-progress-fill').style.width = `${Math.min(100, STATE.stepProgress)}%`;
}

function completeCurrentToolStep() {
  STATE.completedTools[STATE.activeToolIndex] = true;
  STATE.activePimpleChallenge = null;
  sfx.playSparkle();

  if (STATE.activeToolIndex < 3) {
    STATE.activeToolIndex++;
    STATE.stepProgress = 0;
    renderMakeoverHUD();
  } else {
    renderMakeoverHUD();
    setTimeout(() => {
      if (STATE.makeoverPhase === 'face') {
        setStage('hair');
      } else {
        setStage('dressup');
      }
    }, 1100);
  }
}

// ============================================================================
// FASE 3: VESTIDOR REAL
// ============================================================================
function initDressupUI() {
  renderWardrobeCategory(STATE.activeWardrobeTab);
  updateShoePreviewCard();
}

function updateShoePreviewCard() {
  const shoe = WARDROBE_CATALOG.shoes.find((s) => s.id === STATE.outfit.shoeId) || WARDROBE_CATALOG.shoes[0];
  document.getElementById('preview-shoe-img').src = `${encodeURI(
    `${BASE_PATH}/Objetos y Vestuario/Miniaturas Paper Doll/${shoe.file}`
  )}?${ASSET_CACHE_VER}`;
  document.getElementById('preview-shoe-name').textContent = shoe.name;
}

function renderWardrobeCategory(cat) {
  STATE.activeWardrobeTab = cat;
  document.querySelectorAll('.w-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });

  const grid = document.getElementById('wardrobe-grid');
  grid.innerHTML = '';

  const list = WARDROBE_CATALOG[cat] || [];
  list.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'wardrobe-item-card';

    const isSelected =
      (cat === 'dresses' && STATE.outfit.mode === 'dress' && STATE.outfit.dressId === item.id) ||
      (cat === 'tops' && STATE.outfit.mode === 'separates' && STATE.outfit.topId === item.id) ||
      (cat === 'bottoms' && STATE.outfit.mode === 'separates' && STATE.outfit.bottomId === item.id) ||
      (cat === 'head' && STATE.outfit.headId === item.id) ||
      (cat === 'shoes' && STATE.outfit.shoeId === item.id);

    if (isSelected) card.classList.add('active');

    const img = document.createElement('img');
    img.src = `${encodeURI(`${BASE_PATH}/Objetos y Vestuario/Miniaturas Paper Doll/${item.file}`)}?${ASSET_CACHE_VER}`;
    img.alt = item.name;

    const title = document.createElement('span');
    title.textContent = item.name;

    card.appendChild(img);
    card.appendChild(title);

    card.addEventListener('click', () => {
      if (cat === 'dresses') {
        STATE.outfit.mode = 'dress';
        STATE.outfit.dressId = item.id;
      } else if (cat === 'tops') {
        STATE.outfit.mode = 'separates';
        STATE.outfit.topId = item.id;
      } else if (cat === 'bottoms') {
        STATE.outfit.mode = 'separates';
        STATE.outfit.bottomId = item.id;
      } else if (cat === 'head') {
        STATE.outfit.headId = STATE.outfit.headId === item.id ? null : item.id;
      } else if (cat === 'shoes') {
        STATE.outfit.shoeId = item.id;
        updateShoePreviewCard();
      }

      document.getElementById('dressup-comment').textContent = item.quote;
      spawnSparkleBurst(500, 420, 22, '#ffd464');
      sfx.playSparkle();
      renderWardrobeCategory(cat);
    });

    grid.appendChild(card);
  });
}

function randomizeOutfit() {
  const useDress = Math.random() > 0.45;
  if (useDress) {
    STATE.outfit.mode = 'dress';
    const d = WARDROBE_CATALOG.dresses[Math.floor(Math.random() * WARDROBE_CATALOG.dresses.length)];
    STATE.outfit.dressId = d.id;
    document.getElementById('dressup-comment').textContent = d.quote;
  } else {
    STATE.outfit.mode = 'separates';
    const t = WARDROBE_CATALOG.tops[Math.floor(Math.random() * WARDROBE_CATALOG.tops.length)];
    const b = WARDROBE_CATALOG.bottoms[Math.floor(Math.random() * WARDROBE_CATALOG.bottoms.length)];
    STATE.outfit.topId = t.id;
    STATE.outfit.bottomId = b.id;
    document.getElementById('dressup-comment').textContent = b.quote;
  }
  const h = WARDROBE_CATALOG.head[Math.floor(Math.random() * WARDROBE_CATALOG.head.length)];
  const s = WARDROBE_CATALOG.shoes[Math.floor(Math.random() * WARDROBE_CATALOG.shoes.length)];
  STATE.outfit.headId = h.id;
  STATE.outfit.shoeId = s.id;

  updateShoePreviewCard();
  renderWardrobeCategory(STATE.activeWardrobeTab);
  spawnSparkleBurst(500, 420, 26, '#ff6fa5');
  sfx.playSparkle();
}

// ============================================================================
// RENDERIZADO DE PERSONAJES CON SPRITES REALES DE HABLA Y VESTUARIO ANATÓMICO
// ============================================================================
function drawCoverImage(img, panX = 0, panY = 0, zoom = 1) {
  if (!img || !img.complete || !img.naturalWidth) return;
  ctx.save();
  ctx.translate(688 + panX, 384 + panY);
  ctx.scale(zoom, zoom);
  ctx.drawImage(img, -688, -384, 1376, 768);
  ctx.restore();
}

/**
 * Selecciona el sprite de boca actual (Cerrada, Media o Abierta) durante los diálogos
 * sin ningún circulito artificial encima.
 */
function getRapunzelTalkingSprite(isClean, isTalking) {
  const t = STATE.time;
  if (!isTalking) {
    return isClean ? IMAGES.rapClean : IMAGES.rapMessy;
  }
  const phase = Math.floor(t * 11) % 4;
  if (isClean) {
    if (phase === 0) return IMAGES.rapCleanMouthClosed || IMAGES.rapClean;
    if (phase === 1 || phase === 3) return IMAGES.rapCleanMouthMid || IMAGES.rapClean;
    return IMAGES.rapCleanMouthOpen || IMAGES.rapClean;
  } else {
    if (phase === 0) return IMAGES.rapMessyMouthClosed || IMAGES.rapMessy;
    if (phase === 1 || phase === 3) return IMAGES.rapMessyMouthMid || IMAGES.rapMessy;
    return IMAGES.rapMessyMouthOpen || IMAGES.rapMessy;
  }
}

function getPrinceTalkingSprite(isTalking, lookAtTower = false) {
  const t = STATE.time;
  if (lookAtTower) {
    if (!isTalking) return IMAGES.princeTower || IMAGES.prince;
    const phase = Math.floor(t * 10) % 4;
    if (phase === 0) return IMAGES.princeTowerMouthClosed || IMAGES.princeTower;
    if (phase === 1 || phase === 3) return IMAGES.princeTowerMouthMid || IMAGES.princeTower;
    return IMAGES.princeTowerMouthOpen || IMAGES.princeTower;
  }
  if (!isTalking) return IMAGES.prince;
  const phase = Math.floor(t * 10) % 4;
  if (phase === 0) return IMAGES.princeMouthClosed || IMAGES.prince;
  if (phase === 1 || phase === 3) return IMAGES.princeMouthMid || IMAGES.prince;
  return IMAGES.princeMouthOpen || IMAGES.prince;
}

function getPaperDollTalkingBase(hasShoes, isTalking) {
  if (!isTalking) {
    return hasShoes ? IMAGES.pdBaseShoes || IMAGES.pdBase : IMAGES.pdBase;
  }
  const phase = Math.floor(STATE.time * 11) % 4;
  if (hasShoes) {
    if (phase === 0) return IMAGES.pdBaseShoesMouthClosed || IMAGES.pdBaseShoes;
    if (phase === 1 || phase === 3) return IMAGES.pdBaseShoesMouthMid || IMAGES.pdBaseShoes;
    return IMAGES.pdBaseShoesMouthOpen || IMAGES.pdBaseShoes;
  }
  if (phase === 0) return IMAGES.pdBaseMouthClosed || IMAGES.pdBase;
  if (phase === 1 || phase === 3) return IMAGES.pdBaseMouthMid || IMAGES.pdBase;
  return IMAGES.pdBaseMouthOpen || IMAGES.pdBase;
}

function drawAnimatedRapunzel({
  centerX = 688,
  bottomY = 790,
  scale = 0.65,
  faceClean = 1,
  hairClean = 1,
  wearEquippedOutfit = false,
  isTalking = false,
  isPanicShake = false,
  fullBody = false,
}) {
  const t = STATE.time;
  const breathY = Math.sin(t * 2.6) * 4.0;
  const breathScaleY = 1 + Math.sin(t * 2.6) * 0.006;
  const swayAngle = Math.sin(t * 1.5) * 0.006;
  const shakeX = isPanicShake ? Math.sin(t * 38) * 5 : 0;

  // =========================================================================
  // MODO PAPER DOLL CUERPO COMPLETO (768x1376) — Vestidor, Menú y Final
  // =========================================================================
  if (wearEquippedOutfit && faceClean >= 0.99 && hairClean >= 0.99) {
    const PD_W = 768;
    const PD_H = 1376;

    const shoeItem = WARDROBE_CATALOG.shoes.find((s) => s.id === STATE.outfit.shoeId);
    const dressItem = WARDROBE_CATALOG.dresses.find((d) => d.id === STATE.outfit.dressId);
    const topItem = WARDROBE_CATALOG.tops.find((tp) => tp.id === STATE.outfit.topId);
    const botItem = WARDROBE_CATALOG.bottoms.find((b) => b.id === STATE.outfit.bottomId);
    const headItem = STATE.outfit.headId
      ? WARDROBE_CATALOG.head.find((h) => h.id === STATE.outfit.headId)
      : null;

    const hasShoes = Boolean(shoeItem && IMAGES[shoeItem.imgKey]?.complete);

    ctx.save();
    ctx.translate(centerX + shakeX, bottomY + breathY);
    ctx.rotate(swayAngle);
    ctx.scale(scale, scale * breathScaleY);
    ctx.translate(-PD_W / 2, -PD_H);

    // Capa 0: Cuerpo Base Anatómico (con oclusión de dedos del pie si lleva calzado)
    const pdBaseImg = getPaperDollTalkingBase(hasShoes, isTalking);
    if (pdBaseImg && pdBaseImg.complete) {
      ctx.drawImage(pdBaseImg, 0, 0, PD_W, PD_H);
    }

    // Capa 1: Calzado ajustado directamente a la geometría del pie
    if (hasShoes) {
      ctx.drawImage(IMAGES[shoeItem.imgKey], 0, 0, PD_W, PD_H);
    }

    // Capas 2-4: Orden inteligente de prendas (vestido o blusa fajada -> falda/pantalón -> corset sobre cintura)
    if (STATE.outfit.mode === 'dress') {
      if (dressItem && IMAGES[dressItem.imgKey]?.complete) {
        ctx.drawImage(IMAGES[dressItem.imgKey], 0, 0, PD_W, PD_H);
      }
      // Manos limpias por delante de la falda del vestido
      if (IMAGES.pdHandsFront?.complete) {
        ctx.drawImage(IMAGES.pdHandsFront, 0, 0, PD_W, PD_H);
      }
    } else {
      const topIsUnderWaist = !topItem || topItem.layer !== 'over-waist';
      if (topIsUnderWaist && topItem && IMAGES[topItem.imgKey]?.complete) {
        ctx.drawImage(IMAGES[topItem.imgKey], 0, 0, PD_W, PD_H);
      }
      if (botItem && IMAGES[botItem.imgKey]?.complete) {
        ctx.drawImage(IMAGES[botItem.imgKey], 0, 0, PD_W, PD_H);
      }
      if (!topIsUnderWaist && topItem && IMAGES[topItem.imgKey]?.complete) {
        ctx.drawImage(IMAGES[topItem.imgKey], 0, 0, PD_W, PD_H);
      }
      // Brazos/manos en primer plano para que las faldas con vuelo siempre queden detrás de sus brazos y manos
      const isLongSleeve = topItem && topItem.sleeve === 'long';
      const frontLimbs = isLongSleeve ? IMAGES.pdHandsFront : IMAGES.pdForearmsFront;
      if (frontLimbs && frontLimbs.complete) {
        ctx.drawImage(frontLimbs, 0, 0, PD_W, PD_H);
      }
    }

    // Capa 5: Accesorio de Cabeza (Tiara o Lazos)
    if (headItem && IMAGES[headItem.imgKey]?.complete) {
      ctx.drawImage(IMAGES[headItem.imgKey], 0, 0, PD_W, PD_H);
    }

    // Capa 6: Parpadeo calibrado a los ojos reales del Paper Doll Base (348, 265) y (421, 264)
    if (STATE.isBlinking) {
      ctx.save();
      ctx.fillStyle = '#fde0cd';
      ctx.beginPath();
      ctx.ellipse(348, 265, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(421, 264, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3b1d14';
      ctx.lineWidth = 4.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(348, 262, 18, 0.16 * Math.PI, 0.84 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(421, 261, 18, 0.16 * Math.PI, 0.84 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // MODO MAQUILLAJE / DESARREGLADA (896x1200) — Cinemática Inicial y Baño
  // =========================================================================
  ctx.save();
  ctx.translate(centerX + shakeX, bottomY + breathY);
  ctx.rotate(swayAngle);
  ctx.scale(scale, scale * breathScaleY);
  ctx.translate(-448, -1200);

  const imgMessyTalk = getRapunzelTalkingSprite(false, isTalking);
  const imgCleanTalk = getRapunzelTalkingSprite(true, isTalking);

  if (faceClean >= 0.99 && hairClean >= 0.99) {
    if (imgCleanTalk && imgCleanTalk.complete) {
      ctx.drawImage(imgCleanTalk, 0, 0, 896, 1200);
    }
  } else {
    if (imgMessyTalk && imgMessyTalk.complete) {
      ctx.drawImage(imgMessyTalk, 0, 0, 896, 1200);
    }

    if (STATE.pimples && STATE.pimples.some((p) => p.healed) && IMAGES.rapMessyNoPimples?.complete) {
      STATE.pimples.forEach((p) => {
        if (!p.healed) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.lx, p.ly, p.r + 4, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(IMAGES.rapMessyNoPimples, 0, 0, 896, 1200);
        ctx.restore();
      });
    }

    if (hairClean > 0.01 && IMAGES.rapClean?.complete) {
      ctx.save();
      ctx.globalAlpha = hairClean;
      ctx.drawImage(IMAGES.rapClean, 0, 0, 896, 1200);
      ctx.restore();
    }

    if (faceClean > 0.01 && IMAGES.rapClean?.complete) {
      ctx.save();
      ctx.globalAlpha = faceClean;
      ctx.beginPath();
      ctx.ellipse(442, 315, 78, 95, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(IMAGES.rapClean, 0, 0, 896, 1200);
      ctx.restore();
    }
  }

  // Parpadeo sobre el sprite 896x1200 de baño/intro
  if (STATE.isBlinking) {
    ctx.save();
    ctx.fillStyle = '#fde2d2';
    ctx.beginPath();
    ctx.ellipse(399, 323, 23, 17, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(482, 315, 23, 17, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3b1d14';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(399, 320, 19, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(482, 312, 19, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawAnimatedPrince({
  centerX = 420,
  bottomY = 760,
  scale = 0.52,
  isTalking = false,
  mood = 'normal',
  lookAtTower = false,
}) {
  const t = STATE.time;
  const breathY = Math.sin(t * 2.3 + 1) * 4;
  const breathScaleY = 1 + Math.sin(t * 2.3 + 1) * 0.007;

  ctx.save();
  ctx.translate(centerX, bottomY + breathY);
  ctx.scale(scale, scale * breathScaleY);
  ctx.translate(-384, -1376);

  const spr = getPrinceTalkingSprite(isTalking, lookAtTower);
  if (spr && spr.complete) {
    ctx.drawImage(spr, 0, 0, 768, 1376);
  }

  if (mood === 'confused') {
    const dropOffset = (t * 45) % 28;
    ctx.save();
    ctx.translate(325, 145 + dropOffset);
    ctx.fillStyle = '#74c7ff';
    ctx.strokeStyle = '#1b5f9e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(17, 5, 15, 15);
    ctx.arc(0, 15, 15, 0, Math.PI);
    ctx.quadraticCurveTo(-17, 5, 0, -26);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = '900 56px Quicksand, sans-serif';
    ctx.fillStyle = '#ffd464';
    ctx.strokeStyle = '#240b38';
    ctx.lineWidth = 8;
    const qY1 = 135 + Math.sin(t * 5) * 10;
    const qY2 = 118 + Math.cos(t * 5) * 10;
    ctx.strokeText('?', 225, qY1);
    ctx.fillText('?', 225, qY1);
    ctx.strokeText('?', 515, qY2);
    ctx.fillText('?', 515, qY2);
    ctx.restore();
  }

  if (mood === 'dazzled') {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 105, 135, 0.34)';
    ctx.beginPath();
    ctx.ellipse(400, 222, 48, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Dibuja la Torre en la Cinemática Final con Rapunzel Arreglada y vestida con el look
 * EXACTO que el jugador eligió dentro de la ventana alta, más la trenza dorada cayendo!
 */
function drawTowerWithDressedRapunzel() {
  drawCoverImage(IMAGES.bgTower, 0, 0, 1.0);

  // Dibujar a Rapunzel arreglada y vestida con su look actual dentro del arco de la ventana alta
  ctx.save();
  ctx.beginPath();
  ctx.rect(655, 168, 72, 82);
  ctx.clip();
  drawAnimatedRapunzel({
    centerX: 691,
    bottomY: 342,
    scale: 0.135,
    faceClean: 1,
    hairClean: 1,
    wearEquippedOutfit: true,
    isTalking: false,
  });
  ctx.restore();

  // Superponer el marco de piedra y barandal del balcón (Torre Marco Ventana.png en (590, 130))
  if (IMAGES.towerWindowFrame?.complete) {
    ctx.drawImage(IMAGES.towerWindowFrame, 590, 130, 200, 160);
  }

  // Dibujar la trenza larga dorada saliendo desde el balcón hacia abajo
  if (IMAGES.braidSprite?.complete) {
    ctx.drawImage(IMAGES.braidSprite, 653, 228, 76, 445);
  }
}

// ============================================================================
// RENDERIZADO DE ESCENAS (60 FPS)
// ============================================================================
function renderMenuScene() {
  const t = STATE.time;
  const panX = Math.sin(t * 0.4) * 18;
  const zoom = 1.04 + Math.sin(t * 0.25) * 0.015;
  drawCoverImage(IMAGES.bgTower, panX, 0, zoom);

  ctx.save();
  const grad = ctx.createRadialGradient(688, 120, 30, 688, 220, 680);
  grad.addColorStop(0, 'rgba(255, 232, 145, 0.35)');
  grad.addColorStop(1, 'rgba(30, 10, 48, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1376, 768);
  ctx.restore();

  drawAnimatedPrince({
    centerX: 215,
    bottomY: 795,
    scale: 0.53,
    mood: 'normal',
    lookAtTower: false,
  });

  drawAnimatedRapunzel({
    centerX: 1165,
    bottomY: 795,
    scale: 0.52,
    faceClean: 1,
    hairClean: 1,
    wearEquippedOutfit: true,
  });
}

function renderCinematicScene() {
  const script = getActiveScript();
  const step = script[STATE.cinematicStep];
  if (!step) return;

  const t = STATE.time;
  const isTalking = STATE.typewriterIndex < step.text.length;
  const mode = step.sceneMode;

  if (mode === 'tower-arrival') {
    drawCoverImage(IMAGES.bgTower, 0, Math.sin(t * 0.6) * 8, 1.03);
    drawAnimatedPrince({
      centerX: 430,
      bottomY: 760,
      scale: 0.49,
      isTalking,
      mood: 'normal',
      lookAtTower: true,
    });
  } else if (mode === 'bedroom-wakeup') {
    drawCoverImage(IMAGES.bgRoom, 0, 0, 1.03);
    drawAnimatedRapunzel({
      centerX: 688,
      bottomY: 820,
      scale: 0.62,
      faceClean: 0,
      hairClean: 0,
      isTalking,
    });
  } else if (mode === 'hair-dropping') {
    // En la cinemática inicial Rapunzel aún está desarreglada en la ventana
    drawCoverImage(IMAGES.towerHairScene, 0, 0, 1.0);
    STATE.hairDropProgress = Math.min(1, STATE.stepElapsed / 2.2);
    if (STATE.hairDropProgress < 0.99 && IMAGES.bgTower?.complete) {
      const revealY = 228 + STATE.hairDropProgress * 450;
      ctx.save();
      ctx.beginPath();
      ctx.rect(580, revealY, 220, 768 - revealY);
      ctx.clip();
      ctx.drawImage(IMAGES.bgTower, 0, 0, 1376, 768);
      ctx.restore();
    }
    drawAnimatedPrince({
      centerX: 430,
      bottomY: 760,
      scale: 0.48,
      isTalking: false,
      mood: 'normal',
      lookAtTower: true,
    });
  } else if (mode === 'hair-yank-panic') {
    const zoom = 1.02 + Math.sin(t * 28) * 0.008;
    drawCoverImage(IMAGES.towerWindowZoom, 0, 0, zoom);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const lx = 615 + i * 22;
      const ly = 360 + ((t * 900 + i * 70) % 340);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx, ly + 55);
      ctx.stroke();
    }
    ctx.restore();
  } else if (mode === 'prince-confused') {
    drawCoverImage(IMAGES.bgTower, 0, 0, 1.02);
    drawAnimatedPrince({
      centerX: 520,
      bottomY: 765,
      scale: 0.53,
      isTalking,
      mood: 'confused',
      lookAtTower: true,
    });
  } else if (mode === 'rapunzel-messy-reveal') {
    drawCoverImage(IMAGES.bgRoom, 0, 0, 1.04);
    drawAnimatedRapunzel({
      centerX: 688,
      bottomY: 840,
      scale: 0.67,
      faceClean: 0,
      hairClean: 0,
      isTalking,
      isPanicShake: true,
    });
  } else if (mode === 'rapunzel-rush-bath') {
    drawCoverImage(IMAGES.bgRoom, 0, 0, 1.02);
    const dashOffset = Math.min(420, STATE.stepElapsed * 170);
    drawAnimatedRapunzel({
      centerX: 688 + dashOffset,
      bottomY: 840,
      scale: 0.65,
      faceClean: 0,
      hairClean: 0,
      isTalking,
    });
  } else if (mode === 'outro-hair-drop') {
    // Cinemática Final Paso 1: Rapunzel ARREGLADA Y VESTIDA en la ventana lanza su cabello
    drawTowerWithDressedRapunzel();
    STATE.hairDropProgress = Math.min(1, STATE.stepElapsed / 1.8);
    if (STATE.hairDropProgress < 0.99 && IMAGES.bgTower?.complete) {
      const revealY = 228 + STATE.hairDropProgress * 450;
      ctx.save();
      ctx.beginPath();
      ctx.rect(610, revealY, 170, 768 - revealY);
      ctx.clip();
      ctx.drawImage(IMAGES.bgTower, 0, 0, 1376, 768);
      ctx.restore();
    }
    drawAnimatedPrince({
      centerX: 455,
      bottomY: 760,
      scale: 0.48,
      isTalking: false,
      mood: 'dazzled',
      lookAtTower: true,
    });
  } else if (mode === 'outro-climbing') {
    // Cinemática Final Paso 2: El Príncipe TREPA de espaldas mano sobre mano por la trenza dorada!
    drawTowerWithDressedRapunzel();

    const climbProg = Math.min(1, STATE.stepElapsed / 3.2);
    // Alternar entre Principe Escalando 1 y Principe Escalando 2 cada 0.24s para movimiento real de brazos y piernas
    const climbFrameIndex = Math.floor(t / 0.24) % 2;
    const climbSprite = climbFrameIndex === 0 ? IMAGES.princeClimb1 : IMAGES.princeClimb2;

    if (climbSprite && climbSprite.complete) {
      const startY = 415;
      const endY = 215;
      const curY = startY - climbProg * (startY - endY);
      // Perspectiva: se reduce ligeramente a medida que sube hacia lo alto de la torre (proporción 3:4 exacta 768x1024)
      const curW = 162 * (1 - climbProg * 0.20);
      const curH = 216 * (1 - climbProg * 0.20);
      const swayX = Math.sin(t * 12) * 2.0;
      ctx.drawImage(climbSprite, 691 - curW / 2 + swayX, curY, curW, curH);
    }
  } else if (mode === 'outro-meeting' || mode === 'outro-finale') {
    drawCoverImage(IMAGES.bgRoom, 0, 0, 1.02);
    drawAnimatedPrince({
      centerX: 450,
      bottomY: 760,
      scale: 0.52,
      isTalking: step.speaker.includes('Príncipe') && isTalking,
      mood: 'dazzled',
      lookAtTower: false,
    });
    drawAnimatedRapunzel({
      centerX: 920,
      bottomY: 760,
      scale: 0.51,
      faceClean: 1,
      hairClean: 1,
      wearEquippedOutfit: true,
      isTalking: step.speaker.includes('Rapunzel') && isTalking,
    });
  }
}

function renderMakeoverScene() {
  drawCoverImage(IMAGES.bgBath, 0, 0, 1.02);

  ctx.save();
  const glow = ctx.createRadialGradient(690, 380, 60, 690, 380, 390);
  glow.addColorStop(0, 'rgba(255, 236, 175, 0.25)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1376, 768);
  ctx.restore();

  STATE.rapTransform = { centerX: 690, bottomY: 960, scale: 0.84 };

  drawAnimatedRapunzel({
    centerX: 690,
    bottomY: 960,
    scale: 0.84,
    faceClean: STATE.faceCleanFactor,
    hairClean: STATE.hairCleanFactor,
    wearEquippedOutfit: false,
  });

  const tools = getCurrentToolList();
  const activeTool = tools[STATE.activeToolIndex];

  // Dibujar burbujas de espuma ancladas a las coordenadas locales de Rapunzel
  if (STATE.foamBubbles.length > 0) {
    ctx.save();
    STATE.foamBubbles.forEach((b) => {
      const sp = rapLocalToScreen(b.lx, b.ly);
      ctx.fillStyle = b.color;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  // Indicadores interactivos según la herramienta activa
  if (activeTool) {
    // 1. Indicadores de las 5 zonas faciales (Jabón o Esponja)
    if (activeTool.actionType === 'foam-zones' || activeTool.actionType === 'wipe-zones') {
      FACE_ZONES_LOCAL.forEach((z, idx) => {
        const sp = rapLocalToScreen(z.lx, z.ly);
        const rad = z.r * STATE.rapTransform.scale;
        const pct = STATE.faceZonesProgress[idx];
        const isDone = activeTool.actionType === 'foam-zones' ? pct >= 100 : pct <= 0;
        if (isDone) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 212, 100, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, rad, 0, Math.PI * 2);
        ctx.stroke();

        // Arco de progreso de esa zona
        const progRatio = activeTool.actionType === 'foam-zones' ? pct / 100 : (100 - pct) / 100;
        ctx.setLineDash([]);
        ctx.strokeStyle = '#7bed9f';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, rad + 4, -Math.PI / 2, -Math.PI / 2 + progRatio * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }

    // 2. Minijuego de Precisión de Espinillas (anillos exactamente sobre las 8 espinillas pintadas del sprite!)
    else if (activeTool.actionType === 'precision-pimples') {
      STATE.pimples.forEach((p) => {
        if (p.healed) return;
        const sp = rapLocalToScreen(p.lx, p.ly);
        const isTarget = STATE.activePimpleChallenge && STATE.activePimpleChallenge.pimpleId === p.id;
        const ringR = (isTarget ? 15 : 11) + Math.sin(STATE.time * 6 + p.pulse) * 2.5;

        ctx.save();
        ctx.strokeStyle = isTarget ? '#7bed9f' : '#ffd464';
        ctx.lineWidth = isTarget ? 3.2 : 2.2;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Si hay un desafío de precisión activo para el granito seleccionado, dibujar la barra de timing
      if (STATE.activePimpleChallenge) {
        const ch = STATE.activePimpleChallenge;
        const p = STATE.pimples.find((item) => item.id === ch.pimpleId);
        if (p) {
          const sp = rapLocalToScreen(p.lx, p.ly);
          const bx = sp.x - 85;
          const by = sp.y - 54;
          const bw = 170;
          const bh = 22;

          ctx.save();
          // Fondo de la barra
          ctx.fillStyle = 'rgba(24, 9, 40, 0.92)';
          ctx.strokeStyle = '#ffd464';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(bx - 6, by - 24, bw + 12, bh + 32, 12);
          ctx.fill();
          ctx.stroke();

          ctx.font = '700 11px Quicksand, sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText('¡CLIC EN LA ZONA VERDE!', bx + bw / 2, by - 9);

          // Pista roja/verde
          ctx.fillStyle = '#ff4757';
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = '#2ed573';
          ctx.fillRect(bx + bw * 0.36, by, bw * 0.28, bh);

          // Marcador móvil
          const markerX = bx + ch.cursorPos * bw;
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(markerX - 4, by - 3, 8, bh + 6, 4);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 3. Puntos de Mascarilla Mágica
    else if (activeTool.actionType === 'mask-points') {
      FACE_ZONES_LOCAL.forEach((z, idx) => {
        const sp = rapLocalToScreen(z.lx, z.ly);
        const rad = z.r * STATE.rapTransform.scale;
        ctx.save();
        if (STATE.maskZonesDone[idx]) {
          // Parche de mascarilla verde menta aplicada en esa zona
          ctx.fillStyle = 'rgba(123, 237, 159, 0.58)';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, rad * 0.92, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = '#7bed9f';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, rad * 0.75, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    // 4. Fase 2: Shampoo o Enjuague por 6 Mechones
    else if (activeTool.actionType === 'shampoo-zones' || activeTool.actionType === 'temp-and-rinse') {
      // Si es la ducha y aún no ha fijado la temperatura del agua, dibujar el regulador de temperatura
      if (activeTool.actionType === 'temp-and-rinse' && !STATE.showerTempLocked) {
        const bx = 520;
        const by = 115;
        const bw = 340;
        const bh = 26;
        ctx.save();
        ctx.fillStyle = 'rgba(24, 9, 40, 0.94)';
        ctx.strokeStyle = '#ffd464';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(bx - 16, by - 34, bw + 32, bh + 48, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = '700 14px Quicksand, sans-serif';
        ctx.fillStyle = '#ffd464';
        ctx.textAlign = 'center';
        ctx.fillText('🚿 REGULA EL AGUA: ¡HAZ CLIC EN LA ZONA TIBIA (VERDE)!', bx + bw / 2, by - 12);

        // Fría (azul) | Tibia (verde) | Caliente (roja)
        ctx.fillStyle = '#3498db';
        ctx.fillRect(bx, by, bw * 0.36, bh);
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(bx + bw * 0.36, by, bw * 0.28, bh);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(bx + bw * 0.64, by, bw * 0.36, bh);

        const mx = bx + STATE.showerTempPos * bw;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(mx - 5, by - 4, 10, bh + 8, 5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        HAIR_ZONES_LOCAL.forEach((z, idx) => {
          const sp = rapLocalToScreen(z.lx, z.ly);
          const rad = z.r * STATE.rapTransform.scale;
          const pct = STATE.hairZonesProgress[idx];
          const isDone = activeTool.actionType === 'shampoo-zones' ? pct >= 100 : pct <= 0;
          if (isDone) return;

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 184, 217, 0.8)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, rad * 0.78, 0, Math.PI * 2);
          ctx.stroke();

          const progRatio = activeTool.actionType === 'shampoo-zones' ? pct / 100 : (100 - pct) / 100;
          ctx.setLineDash([]);
          ctx.strokeStyle = '#7bed9f';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, rad * 0.78 + 4, -Math.PI / 2, -Math.PI / 2 + progRatio * Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
      }
    }

    // 5. Fase 2 Paso 3: Secador sobre grupos de gotas de agua
    else if (activeTool.actionType === 'dry-clusters') {
      STATE.waterDrops.forEach((d) => {
        if (d.wetness <= 0) return;
        const sp = rapLocalToScreen(d.lx, d.ly);
        ctx.save();
        ctx.fillStyle = 'rgba(116, 199, 255, 0.88)';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        const count = Math.ceil((d.wetness / 100) * 5);
        for (let i = 0; i < count; i++) {
          const ang = (i * Math.PI * 2) / 5 + STATE.time * 2;
          const gx = sp.x + Math.cos(ang) * 18;
          const gy = sp.y + Math.sin(ang) * 18;
          ctx.beginPath();
          ctx.arc(gx, gy, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    // 6. Fase 2 Paso 4: Cepillado Direccional de Arriba hacia Abajo (↓)
    else if (activeTool.actionType === 'directional-brush') {
      const laneIdx = STATE.brushLanesDone.findIndex((done) => !done);
      if (laneIdx !== -1) {
        const lane = BRUSH_LANES_LOCAL[laneIdx];
        const startSp = rapLocalToScreen(lane.startX, lane.startY);
        const endSp = rapLocalToScreen(lane.endX, lane.endY);

        ctx.save();
        // Línea guía del mechón
        ctx.strokeStyle = 'rgba(255, 212, 100, 0.55)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startSp.x, startSp.y);
        ctx.lineTo(endSp.x, endSp.y);
        ctx.stroke();

        // Progreso arrastrado en el mechón actual
        if (STATE.brushDragProgress > 0) {
          const curX = startSp.x + (endSp.x - startSp.x) * STATE.brushDragProgress;
          const curY = startSp.y + (endSp.y - startSp.y) * STATE.brushDragProgress;
          ctx.strokeStyle = '#7bed9f';
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.moveTo(startSp.x, startSp.y);
          ctx.lineTo(curX, curY);
          ctx.stroke();
        }

        // Círculo superior "INICIO" y círculo inferior "FIN ↓"
        ctx.fillStyle = '#ffd464';
        ctx.strokeStyle = '#240b38';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(startSp.x, startSp.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#7bed9f';
        ctx.beginPath();
        ctx.arc(endSp.x, endSp.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#240b38';
        ctx.font = '900 14px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', startSp.x, startSp.y);
        ctx.fillText('↓', endSp.x, endSp.y);
        ctx.restore();
      }
    }
  }

  // Dibujar textos flotantes de retroalimentación
  for (let i = STATE.floatingTexts.length - 1; i >= 0; i--) {
    const ft = STATE.floatingTexts[i];
    ctx.save();
    ctx.font = '700 16px Quicksand, sans-serif';
    ctx.fillStyle = ft.color;
    ctx.strokeStyle = '#1b092c';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.max(0, ft.alpha);
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // Dibujar herramienta siguiendo el cursor
  if (activeTool && IMAGES[activeTool.imgKey]?.complete) {
    ctx.save();
    const tilt = STATE.isPointerDown ? Math.sin(STATE.time * 18) * 0.18 : 0;
    ctx.translate(STATE.pointerX, STATE.pointerY);
    ctx.rotate(tilt);
    ctx.drawImage(IMAGES[activeTool.imgKey], -42, -42, 84, 84);
    ctx.restore();
  }
}

function renderDressupScene() {
  drawCoverImage(IMAGES.bgWardrobe, 0, 0, 1.0);

  // Pedestal dorado real justo bajo los zapatos de Rapunzel de cuerpo completo
  ctx.save();
  const ped = ctx.createRadialGradient(545, 726, 18, 545, 726, 170);
  ped.addColorStop(0, 'rgba(255, 212, 100, 0.52)');
  ped.addColorStop(1, 'rgba(255, 212, 100, 0)');
  ctx.fillStyle = ped;
  ctx.beginPath();
  ctx.ellipse(545, 730, 165, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Dibujar a Rapunzel DE CUERPO COMPLETO (de tiara hasta zapatos!) con su ropa y calzado en tiempo real
  drawAnimatedRapunzel({
    centerX: 545,
    bottomY: 745,
    scale: 0.54,
    faceClean: 1,
    hairClean: 1,
    wearEquippedOutfit: true,
    fullBody: true,
  });
}

// ============================================================================
// PARTÍCULAS Y BUCLE PRINCIPAL (60 FPS)
// ============================================================================
function updateAndDrawParticles(dt) {
  STATE.petals.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.spin;
    if (p.y > 780) {
      p.y = -12;
      p.x = Math.random() * 1376;
    }
    if (p.x < -20) p.x = 1386;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  for (let i = STATE.sparkles.length - 1; i >= 0; i--) {
    const s = STATE.sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= dt * 1.4;
    if (s.alpha <= 0) {
      STATE.sparkles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.globalAlpha = Math.max(0, s.alpha);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    const r = s.size;
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.28, -r * 0.28);
    ctx.lineTo(r, 0);
    ctx.lineTo(r * 0.28, r * 0.28);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.28, r * 0.28);
    ctx.lineTo(-r, 0);
    ctx.lineTo(-r * 0.28, -r * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  for (let i = STATE.floatingTexts.length - 1; i >= 0; i--) {
    const ft = STATE.floatingTexts[i];
    ft.y += ft.vy;
    ft.alpha -= dt * 0.85;
    if (ft.alpha <= 0) STATE.floatingTexts.splice(i, 1);
  }
}

function gameLoop(now) {
  const dt = Math.min(0.05, (now - STATE.lastTime) / 1000);
  STATE.lastTime = now;
  STATE.time += dt;
  STATE.stepElapsed += dt;

  // Parpadeo automático
  STATE.blinkTimer += dt;
  if (STATE.blinkTimer >= 3.4) {
    STATE.isBlinking = true;
    if (STATE.blinkTimer >= 3.56) {
      STATE.isBlinking = false;
      STATE.blinkTimer = 0;
    }
  }

  // Oscilación de la barra de precisión del quita-espinillas
  if (STATE.activePimpleChallenge) {
    const ch = STATE.activePimpleChallenge;
    ch.cursorPos += ch.dir * ch.speed * dt;
    if (ch.cursorPos >= 1) {
      ch.cursorPos = 1;
      ch.dir = -1;
    } else if (ch.cursorPos <= 0) {
      ch.cursorPos = 0;
      ch.dir = 1;
    }
  }

  // Oscilación del regulador de temperatura de la ducha dorada
  if (STATE.stage === 'hair' && STATE.activeToolIndex === 1 && !STATE.showerTempLocked) {
    STATE.showerTempPos += STATE.showerTempDir * 1.15 * dt;
    if (STATE.showerTempPos >= 1) {
      STATE.showerTempPos = 1;
      STATE.showerTempDir = -1;
    } else if (STATE.showerTempPos <= 0) {
      STATE.showerTempPos = 0;
      STATE.showerTempDir = 1;
    }
  }

  // Máquina de escribir en cinemáticas
  if (STATE.stage === 'intro' || STATE.stage === 'outro') {
    const script = getActiveScript();
    const step = script[STATE.cinematicStep];
    if (step && STATE.typewriterIndex < step.text.length) {
      STATE.typewriterTimer += dt;
      if (STATE.typewriterTimer >= 0.024) {
        STATE.typewriterTimer = 0;
        STATE.typewriterIndex++;
        document.getElementById('dialogue-text').textContent = step.text.slice(0, STATE.typewriterIndex);
        if (STATE.typewriterIndex % 3 === 0) {
          sfx.playVoiceBlip(step.speaker);
        }
      }
    }
  }

  ctx.clearRect(0, 0, 1376, 768);

  if (STATE.stage === 'menu') {
    renderMenuScene();
  } else if (STATE.stage === 'intro' || STATE.stage === 'outro') {
    renderCinematicScene();
  } else if (STATE.stage === 'face' || STATE.stage === 'hair') {
    renderMakeoverScene();
  } else if (STATE.stage === 'dressup' || STATE.stage === 'victory') {
    renderDressupScene();
  }

  updateAndDrawParticles(dt);

  requestAnimationFrame(gameLoop);
}

// ============================================================================
// ESCALADO RESPONSIVO AUTOMÁTICO (PC, TABLET Y TELÉFONOS MÓVILES) Y EVENTOS
// ============================================================================
const stageContainerEl = document.getElementById('stage-container');
function updateStageResponsiveScale() {
  if (!stageContainerEl) return;
  const rect = stageContainerEl.getBoundingClientRect();
  if (rect.width > 0) {
    const scaleFactor = rect.width / 1376;
    stageContainerEl.style.setProperty('--stage-scale', scaleFactor.toFixed(5));
  }
}
updateStageResponsiveScale();

// ============================================================================
// PERSISTENCIA DE NIVELES POR JUGADOR (LocalStorage + Sincronización con Web)
// ============================================================================
const PRINCESAS_STORAGE_KEY = 'phantombyte_princesas_profiles_v1';

function getActivePrincesasPlayerName() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('player');
    if (fromUrl && fromUrl.trim()) return fromUrl.trim().toUpperCase().slice(0, 16);
    const rawSession = localStorage.getItem('phantombyte_pilot_session_v3');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (parsed && parsed.name) return String(parsed.name).trim().toUpperCase().slice(0, 16);
    }
  } catch {
    // Ignorar
  }
  return 'INVITADO';
}

function updateChaptersModalStatus(level1Done) {
  const ch1Card = document.getElementById('card-play-ch1');
  if (!ch1Card) return;
  const numEl = ch1Card.querySelector('.chapter-num');
  if (numEl) {
    numEl.textContent = level1Done ? 'Nivel 1 • ✓ Completado (Guardado)' : 'Nivel 1 • Disponible';
  }
}

function loadLocalPrincesasProgress() {
  try {
    const playerName = getActivePrincesasPlayerName();
    const raw = localStorage.getItem(PRINCESAS_STORAGE_KEY);
    if (!raw) return;
    const profiles = JSON.parse(raw);
    const myProf = profiles && profiles[playerName];
    if (myProf) {
      if (myProf.lastOutfit && typeof myProf.lastOutfit === 'object') {
        STATE.outfit = { ...STATE.outfit, ...myProf.lastOutfit };
      }
      if (myProf.level1Completed) {
        updateChaptersModalStatus(true);
      }
    }
  } catch {
    // Ignorar
  }
}

function saveLocalPrincesasProgress(levelCompleted = 1) {
  try {
    const playerName = getActivePrincesasPlayerName();
    const raw = localStorage.getItem(PRINCESAS_STORAGE_KEY);
    const profiles = raw ? JSON.parse(raw) : {};
    const prev = profiles[playerName] || {
      name: playerName,
      level1Completed: false,
      completedLevels: [],
      highestLevelUnlocked: 1,
    };
    const mergedLevels = Array.from(new Set([...(prev.completedLevels || []), levelCompleted])).sort((a, b) => a - b);
    profiles[playerName] = {
      ...prev,
      name: playerName,
      level1Completed: Boolean(prev.level1Completed || levelCompleted === 1),
      completedLevels: mergedLevels,
      highestLevelUnlocked: Math.max(prev.highestLevelUnlocked || 1, levelCompleted + 1),
      lastOutfit: { ...STATE.outfit },
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    localStorage.setItem(PRINCESAS_STORAGE_KEY, JSON.stringify(profiles));
    updateChaptersModalStatus(true);
  } catch {
    // Ignorar
  }
}

loadLocalPrincesasProgress();
window.addEventListener('resize', updateStageResponsiveScale);
window.addEventListener('orientationchange', () => setTimeout(updateStageResponsiveScale, 120));
if (typeof ResizeObserver !== 'undefined' && stageContainerEl) {
  new ResizeObserver(updateStageResponsiveScale).observe(stageContainerEl);
}

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
  const clientX = touch ? touch.clientX : e.clientX;
  const clientY = touch ? touch.clientY : e.clientY;
  return {
    x: ((clientX - rect.left) / Math.max(1, rect.width)) * 1376,
    y: ((clientY - rect.top) / Math.max(1, rect.height)) * 768,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  sfx.init();
  STATE.isPointerDown = true;
  if (canvas.setPointerCapture && e.pointerId !== undefined) {
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }
  }
  const pos = getCanvasCoords(e);
  STATE.lastPointerX = pos.x;
  STATE.lastPointerY = pos.y;
  STATE.pointerX = pos.x;
  STATE.pointerY = pos.y;
  handleMakeoverInteraction(pos.x, pos.y, true);
});

canvas.addEventListener('pointermove', (e) => {
  const pos = getCanvasCoords(e);
  STATE.lastPointerX = STATE.pointerX;
  STATE.lastPointerY = STATE.pointerY;
  STATE.pointerX = pos.x;
  STATE.pointerY = pos.y;
  if (STATE.isPointerDown) {
    handleMakeoverInteraction(pos.x, pos.y, false);
  }
});

// Evitar que arrastrar el dedo sobre el canvas en teléfonos móviles desplace la página
canvas.addEventListener(
  'touchstart',
  (e) => {
    if (STATE.stage === 'face' || STATE.stage === 'hair') {
      e.preventDefault();
    }
  },
  { passive: false }
);
canvas.addEventListener(
  'touchmove',
  (e) => {
    if (STATE.stage === 'face' || STATE.stage === 'hair') {
      e.preventDefault();
    }
  },
  { passive: false }
);

window.addEventListener('pointerup', () => {
  STATE.isPointerDown = false;
  STATE.activeBrushLane = null;
  STATE.brushDragProgress = 0;
});
window.addEventListener('pointercancel', () => {
  STATE.isPointerDown = false;
  STATE.activeBrushLane = null;
  STATE.brushDragProgress = 0;
});

document.getElementById('btn-play-rapunzel').addEventListener('click', () => {
  sfx.playSparkle();
  setStage('intro');
});

document.getElementById('btn-open-chapters').addEventListener('click', () => {
  document.getElementById('chapters-modal').classList.remove('hidden');
});

document.getElementById('btn-close-chapters').addEventListener('click', () => {
  document.getElementById('chapters-modal').classList.add('hidden');
});

document.getElementById('card-play-ch1').addEventListener('click', () => {
  document.getElementById('chapters-modal').classList.add('hidden');
  sfx.playSparkle();
  setStage('intro');
});

document.getElementById('btn-next-dialogue').addEventListener('click', (e) => {
  e.stopPropagation();
  loadCinematicStep(STATE.cinematicStep + 1);
});
document.getElementById('speech-bubble-container').addEventListener('click', advanceDialogue);

document.getElementById('btn-skip-cinematic').addEventListener('click', () => {
  if (STATE.cinematicType === 'intro') {
    setStage('face');
  } else {
    setStage('victory');
  }
});

document.querySelectorAll('.w-tab').forEach((btn) => {
  btn.addEventListener('click', () => renderWardrobeCategory(btn.dataset.cat));
});

document.getElementById('btn-random-outfit').addEventListener('click', randomizeOutfit);
document.getElementById('btn-finish-dressup').addEventListener('click', () => {
  sfx.playSparkle();
  setStage('outro');
});

document.getElementById('btn-back-to-dressup').addEventListener('click', () => setStage('dressup'));
document.getElementById('btn-replay-level').addEventListener('click', () => setStage('intro'));
document.getElementById('btn-back-to-menu').addEventListener('click', () => setStage('menu'));

document.querySelectorAll('.nav-pill').forEach((btn) => {
  btn.addEventListener('click', () => setStage(btn.dataset.jump));
});

const audioToggleBtn = document.getElementById('btn-audio-toggle');
if (audioToggleBtn) {
  audioToggleBtn.addEventListener('click', (e) => {
    sfx.enabled = !sfx.enabled;
    e.currentTarget.textContent = sfx.enabled ? '🔊 Audio' : '🔇 Silencio';
  });
}

const fsToggleBtn = document.getElementById('btn-fullscreen-toggle');
if (fsToggleBtn) {
  fsToggleBtn.addEventListener('click', async () => {
    const wrap = document.getElementById('game-wrapper') || document.documentElement;
    try {
      if (!document.fullscreenElement && wrap.requestFullscreen) {
        await wrap.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignorar si el navegador no soporta Fullscreen API
    }
  });
}

requestAnimationFrame(gameLoop);
