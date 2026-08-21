'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Power-up "Velocidad" ──
const BOOST_MULT          = 2;     // multiplicador de THRUST
const BOOST_DURATION      = 5;     // duración del efecto en segundos
const POWERUP_DROP_CHANCE = 0.10;  // probabilidad por asteroide destruido
const POWERUP_TTL         = 10;    // vida del ítem sin recoger
const POWERUP_RADIUS      = 14;

// ── Estrella fugaz ──
const SHOOTING_STAR_SPEED   = 180;  // px/s fija
const SHOOTING_STAR_TTL     = 6;    // segundos antes de desaparecer sola
const SHOOTING_STAR_POINTS  = 200;  // puntos fijos al destruir
const SHOOTING_STAR_MIN_INT = 7;    // intervalo mínimo de spawn (s)
const SHOOTING_STAR_MAX_INT = 14;   // intervalo máximo de spawn (s)

// ── Agujero de gusano ──
const WORMHOLE_TTL       = 4;     // segundos de vida
const WORMHOLE_RADIUS    = 120;   // radio de succión
const WORMHOLE_PULL      = 420;   // fuerza de atracción (px/s²)
const WORMHOLE_SUCTION   = 22;    // distancia a la que se destruye (px)
const WORMHOLE_MIN_INT   = 8;     // intervalo mínimo de spawn (s)
const WORMHOLE_MAX_INT   = 14;    // intervalo máximo de spawn (s)

// ── Power-up "Escudo" ──
const SHIELD_DURATION    = 5;     // duración del efecto en segundos
const SHIELD_DROP_CHANCE = 0.10;  // probabilidad por asteroide destruido
const SHIELD_PICKUP_TTL  = 10;    // vida del ítem sin recoger
const SHIELD_RADIUS      = 14;    // radio del ítem

// ── Power-up "Triple disparo" ──
const TRIPLE_DURATION    = 5;     // duración del efecto en segundos
const TRIPLE_DROP_CHANCE = 0.10;  // probabilidad por asteroide destruido
const TRIPLE_PICKUP_TTL  = 10;    // vida del ítem sin recoger
const TRIPLE_RADIUS      = 14;    // radio del ítem
const TRIPLE_SPACING     = 8;     // separación entre balas a lo largo de la nariz

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── PowerUp (Velocidad) ────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.radius = POWERUP_RADIUS;
    this.dead   = false;
    this.ttl    = POWERUP_TTL;
    this.rot    = 0;
    this.rotSpeed = rand(-1.5, 1.5);
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 60);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en el último segundo de vida
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Aura exterior
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur  = 12;

    // Círculo contorno
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth   = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Rayo en el interior
    ctx.rotate(this.rot);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo( 2, -8);
    ctx.lineTo(-3,  1);
    ctx.lineTo( 0,  1);
    ctx.lineTo(-2,  8);
    ctx.lineTo( 3, -1);
    ctx.lineTo( 0, -1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// ── ShieldPickup (Escudo) ──────────────────────────────────────────────────────
class ShieldPickup {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.radius = SHIELD_RADIUS;
    this.dead   = false;
    this.ttl    = SHIELD_PICKUP_TTL;
    this.rot    = 0;
    this.rotSpeed = rand(-1.2, 1.2);
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 60);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en el último segundo de vida
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Glow verde
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur  = 12;

    // Hexágono contorno
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth   = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + this.rot;
      const px = Math.cos(a) * this.radius;
      const py = Math.sin(a) * this.radius;
      if (i === 0) ctx.moveTo(px, py);
      else         ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Icono de escudo (arco) en el interior
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth   = 1.6;
    ctx.beginPath();
    ctx.arc(0, 1, 7, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, 1);
    ctx.lineTo(-7, 5);
    ctx.lineTo(7, 5);
    ctx.lineTo(7, 1);
    ctx.stroke();

    ctx.restore();
  }
}

// ── TriplePickup (Triple disparo) ──────────────────────────────────────────────
class TriplePickup {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.radius = TRIPLE_RADIUS;
    this.dead   = false;
    this.ttl    = TRIPLE_PICKUP_TTL;
    this.rot    = 0;
    this.rotSpeed = rand(-1.2, 1.2);
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 60);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en el último segundo de vida
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Glow naranja
    ctx.shadowColor = '#f80';
    ctx.shadowBlur  = 12;

    // Círculo contorno
    ctx.strokeStyle = '#f80';
    ctx.lineWidth   = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Tres barritas verticales en el interior
    ctx.fillStyle = '#f80';
    for (const dx of [-5, 0, 5]) {
      ctx.fillRect(dx - 1, -6, 2, 12);
    }

    ctx.restore();
  }
}

// ── Estrella fugaz (asteroide especial) ────────────────────────────────────────
class ShootingStar {
  constructor(x, y) {
    this.size   = randInt(1, 3);        // tamaño aleatorio
    this.radius = RADII[this.size];      // usa lookup existente
    this.x      = x;
    this.y      = y;
    this.dead   = false;
    this.ttl    = SHOOTING_STAR_TTL;
    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * SHOOTING_STAR_SPEED;
    this.vy = Math.sin(angle) * SHOOTING_STAR_SPEED;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en el último segundo de vida
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Glow amarillo
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = 'rgba(255, 230, 0, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ── Agujero de gusano ──────────────────────────────────────────────────────────
class Wormhole {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.radius = WORMHOLE_RADIUS;
    this.dead   = false;
    this.ttl    = WORMHOLE_TTL;
    this.rot    = 0;
    this.rotSpeed = rand(2, 4);
  }

  update(dt) {
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en el último segundo de vida
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Anillo tenue del radio de succión
    ctx.strokeStyle = 'rgba(160, 0, 255, 0.18)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Espiral púrpura: tres arcos concéntricos girando en sentidos alternos
    ctx.shadowColor = '#a0f';
    ctx.shadowBlur  = 18;
    ctx.strokeStyle = '#c3f';
    ctx.lineWidth   = 2.2;
    const rings = [10, 20, 30];
    for (let i = 0; i < rings.length; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.arc(0, 0, rings[i], this.rot * dir, this.rot * dir + Math.PI * 1.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
// Cada skin define color del fuselaje, color de la llama y polígono local
// con la nariz apuntando hacia +x (convención de la nave). `scale` multiplica
// el tamaño visual, el radio de colisión y la posición de la nariz; `pointsMult`
// multiplica los puntos obtenidos al destruir enemigos.
const SKINS = [
  {
    name:  'CLÁSICA',
    color: '#fff',
    flame: 'rgba(255, 130, 0, 0.85)',
    verts: [[ 20,  0], [-12, -9], [ -7,  0], [-12,  9]],
    scale: 1,
    pointsMult: 1,
  },
  {
    name:  'CARMESÍ',
    color: '#f44',
    flame: 'rgba(255, 200, 0, 0.85)',
    verts: [[ 20,  0], [-14, -6], [ -8,  0], [-14,  6]],
    scale: 1,
    pointsMult: 1,
  },
  {
    name:  'ESMERALDA',
    color: '#3f3',
    flame: 'rgba(0, 255, 170, 0.85)',
    verts: [[ 20,  0], [-10, -10], [ -7, -3], [-12,  0], [ -7,  3], [-10, 10]],
    scale: 1,
    pointsMult: 1,
  },
  {
    name:  'SAFIRO',
    color: '#4af',
    flame: 'rgba(120, 200, 255, 0.85)',
    verts: [[ 20,  0], [  6, -8], [-12, -6], [ -6,  0], [-12,  6], [  6,  8]],
    scale: 1,
    pointsMult: 1,
  },
  {
    name:  'SOLAR',
    color: '#fd0',
    flame: 'rgba(255, 80, 0, 0.9)',
    verts: [[ 20,  0], [  8, -8], [-10, -8], [ -6,  0], [-10,  8], [  8,  8]],
    scale: 1,
    pointsMult: 1,
  },
  {
    name:  'MORADA',
    color: '#a0f',
    flame: 'rgba(220, 120, 255, 0.9)',
    verts: [[ 20,  0], [-12, -9], [ -7,  0], [-12,  9]],
    scale: 2,
    pointsMult: 2,
  },
];

const SKIN_STORAGE_KEY = 'asteroids.skin';
let currentSkin = 0;

function loadSkin() {
  const saved = parseInt(localStorage.getItem(SKIN_STORAGE_KEY), 10);
  if (Number.isInteger(saved) && saved >= 0 && saved < SKINS.length) {
    currentSkin = saved;
  }
}

function saveSkin() {
  localStorage.setItem(SKIN_STORAGE_KEY, String(currentSkin));
}

loadSkin();

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.skinIndex = currentSkin;
    this.radius = 12 * SKINS[this.skinIndex].scale;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.boostTtl      = 0;
    this.shieldTtl     = 0;
    this.tripleTtl     = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.boostTtl      > 0) this.boostTtl      -= dt;
    if (this.shieldTtl     > 0) this.shieldTtl     -= dt;
    if (this.tripleTtl     > 0) this.tripleTtl     -= dt;

    const THRUST = this.boostTtl > 0 ? 260 * BOOST_MULT : 260;  // px/s²
    const DRAG   = 0.987;

    // Movimiento direccional directo (8 direcciones)
    let ax = 0, ay = 0;
    if (keys['ArrowLeft'])  ax -= 1;
    if (keys['ArrowRight']) ax += 1;
    if (keys['ArrowUp'])    ay -= 1;
    if (keys['ArrowDown'])  ay += 1;

    this.thrusting = (ax !== 0 || ay !== 0);
    if (this.thrusting) {
      // Normalizar para que la diagonal no sea más rápida
      const len = Math.hypot(ax, ay);
      ax /= len; ay /= len;
      this.vx += ax * THRUST * dt;
      this.vy += ay * THRUST * dt;
      // La nariz apunta hacia la dirección del movimiento
      this.angle = Math.atan2(ay, ax);
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21 * SKINS[this.skinIndex].scale;
    if (this.tripleTtl > 0) {
      // Triple disparo: 3 balas en fila a lo largo de la nariz, mismo ángulo
      const shots = [];
      for (let i = 0; i < 3; i++) {
        const d = NOSE + i * TRIPLE_SPACING;
        const ox = this.x + Math.cos(this.angle) * d;
        const oy = this.y + Math.sin(this.angle) * d;
        shots.push(new Bullet(ox, oy, this.angle));
      }
      return shots;
    }
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[this.skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(skin.scale, skin.scale);

    // Aura del power-up Velocidad
    if (this.boostTtl > 0) {
      ctx.save();
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur  = 14;
      ctx.strokeStyle = 'rgba(0,255,255,0.55)';
      ctx.lineWidth   = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Aura del power-up Escudo
    if (this.shieldTtl > 0) {
      ctx.save();
      ctx.shadowColor = '#0f0';
      ctx.shadowBlur  = 14;
      ctx.strokeStyle = 'rgba(0,255,0,0.55)';
      ctx.lineWidth   = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Aura del power-up Triple disparo
    if (this.tripleTtl > 0) {
      ctx.save();
      ctx.shadowColor = '#f80';
      ctx.shadowBlur  = 14;
      ctx.strokeStyle = 'rgba(255,136,0,0.55)';
      ctx.lineWidth   = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Tinte del fuselaje: respeta el color del skin; el aura indica el power-up
    ctx.strokeStyle = skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta definida por el skin
    ctx.beginPath();
    ctx.moveTo(skin.verts[0][0], skin.verts[0][1]);
    for (let i = 1; i < skin.verts.length; i++)
      ctx.lineTo(skin.verts[i][0], skin.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars, wormholes, shieldPickups, triplePickups;
let score, lives, level;
let state;      // 'menu' | 'playing' | 'dead' | 'gameover' | 'paused'
let deadTimer;
let shootingStarTimer, wormholeTimer;
let menuIndex = 0;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function resetShootingStarTimer() {
  shootingStarTimer = rand(SHOOTING_STAR_MIN_INT, SHOOTING_STAR_MAX_INT);
}

function spawnShootingStar() {
  // Spawn desde un borde, posición aleatoria
  const side = randInt(0, 3);
  let x, y;
  if      (side === 0) { x = rand(0, W); y = 0; }
  else if (side === 1) { x = W;          y = rand(0, H); }
  else if (side === 2) { x = rand(0, W); y = H; }
  else                 { x = 0;          y = rand(0, H); }
  shootingStars.push(new ShootingStar(x, y));
  resetShootingStarTimer();
}

function resetWormholeTimer() {
  wormholeTimer = rand(WORMHOLE_MIN_INT, WORMHOLE_MAX_INT);
}

function spawnWormhole() {
  // Posición aleatoria en el área de juego (no desde borde)
  const x = rand(80, W - 80);
  const y = rand(80, H - 80);
  wormholes.push(new Wormhole(x, y));
  resetWormholeTimer();
}

function initMenu() {
  menuIndex = currentSkin;
  state = 'menu';
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  wormholes     = [];
  shieldPickups = [];
  triplePickups = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  resetShootingStarTimer();
  resetWormholeTimer();
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  wormholes     = [];
  shieldPickups = [];
  triplePickups = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

// Suma puntos aplicando el multiplicador del skin seleccionado.
function addScore(amount) {
  score += amount * SKINS[ship.skinIndex].pointsMult;
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// Succión del agujero de gusano sobre asteroides y estrellas fugaces.
// Atrae dentro del radio y destruye (con puntos, sin split) al acercarse.
function applyWormholes(dt) {
  for (const w of wormholes) {
    // Asteroides
    for (const a of asteroids) {
      if (a.dead) continue;
      const d = dist(w, a);
      if (d < w.radius) {
        // Atracción hacia el gusano
        const ang = Math.atan2(w.y - a.y, w.x - a.x);
        const pull = WORMHOLE_PULL * (1 - d / w.radius);
        a.vx += Math.cos(ang) * pull * dt;
        a.vy += Math.sin(ang) * pull * dt;
        if (d < WORMHOLE_SUCTION) {
          a.dead = true;
          addScore(POINTS[a.size]);
          explode(a.x, a.y, a.size * 5);
        }
      }
    }
    // Estrellas fugaces
    for (const s of shootingStars) {
      if (s.dead) continue;
      const d = dist(w, s);
      if (d < w.radius) {
        const ang = Math.atan2(w.y - s.y, w.x - s.x);
        const pull = WORMHOLE_PULL * (1 - d / w.radius);
        s.vx += Math.cos(ang) * pull * dt;
        s.vy += Math.sin(ang) * pull * dt;
        if (d < WORMHOLE_SUCTION) {
          s.dead = true;
          addScore(SHOOTING_STAR_POINTS);
          explode(s.x, s.y, 10);
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead);
  shootingStars = shootingStars.filter(s => !s.dead);
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Menú de selección de skins
  if (state === 'menu') {
    if (pressed('ArrowLeft'))
      menuIndex = wrap(menuIndex - 1, SKINS.length);
    if (pressed('ArrowRight'))
      menuIndex = wrap(menuIndex + 1, SKINS.length);
    if (pressed('Enter')) {
      currentSkin = menuIndex;
      saveSkin();
      initGame();
    }
    return;
  }

  // Pausa con Enter (toggle entre 'playing' y 'paused')
  if (pressed('Enter')) {
    if (state === 'playing') state = 'paused';
    else if (state === 'paused') state = 'playing';
  }
  if (state === 'paused') return;

  if (state === 'gameover') {
    if (pressed('Space')) initMenu();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    shieldPickups.forEach(s => s.update(dt));
    shieldPickups = shieldPickups.filter(s => !s.dead);
    triplePickups.forEach(t => t.update(dt));
    triplePickups = triplePickups.filter(t => !t.dead);
    wormholes.forEach(w => w.update(dt));
    wormholes = wormholes.filter(w => !w.dead);
    // Timers pausados en gameover
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    shieldPickups.forEach(s => s.update(dt));
    shieldPickups = shieldPickups.filter(s => !s.dead);
    triplePickups.forEach(t => t.update(dt));
    triplePickups = triplePickups.filter(t => !t.dead);
    // Los timers siguen corriendo durante 'dead'
    shootingStarTimer -= dt;
    if (shootingStarTimer <= 0) spawnShootingStar();
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    wormholeTimer -= dt;
    if (wormholeTimer <= 0) spawnWormhole();
    wormholes.forEach(w => w.update(dt));
    // La succión del gusano sigue activa durante 'dead'
    applyWormholes(dt);
    wormholes = wormholes.filter(w => !w.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));
  shieldPickups.forEach(s => s.update(dt));
  triplePickups.forEach(t => t.update(dt));

  // Timer de estrella fugaz
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) spawnShootingStar();
  shootingStars.forEach(s => s.update(dt));

  // Timer de agujero de gusano
  wormholeTimer -= dt;
  if (wormholeTimer <= 0) spawnWormhole();
  wormholes.forEach(w => w.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);
  shieldPickups = shieldPickups.filter(s => !s.dead);
  triplePickups = triplePickups.filter(t => !t.dead);
  shootingStars = shootingStars.filter(s => !s.dead);
  wormholes = wormholes.filter(w => !w.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        addScore(POINTS[a.size]);
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        // Drop de power-up "Velocidad"
        if (Math.random() < POWERUP_DROP_CHANCE)
          powerups.push(new PowerUp(a.x, a.y));
        // Drop de power-up "Escudo" (independiente del de Velocidad)
        if (Math.random() < SHIELD_DROP_CHANCE)
          shieldPickups.push(new ShieldPickup(a.x, a.y));
        // Drop de power-up "Triple disparo" (independiente de los demás)
        if (Math.random() < TRIPLE_DROP_CHANCE)
          triplePickups.push(new TriplePickup(a.x, a.y));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        addScore(SHOOTING_STAR_POINTS);
        explode(s.x, s.y, 10);
      }
    }
  }
  bullets = bullets.filter(b => !b.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Succión del agujero de gusano
  applyWormholes(dt);

  // Nave vs asteroide
  if (ship.shieldTtl > 0) {
    // Escudo activo: destruye asteroides al contacto, da puntos, no se divide
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82) {
        a.dead = true;
        addScore(POINTS[a.size]);
        explode(a.x, a.y, a.size * 5);
      }
    }
    asteroids = asteroids.filter(a => !a.dead);
  } else if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
    // Nave vs estrella fugaz (el Escudo no destruye estrellas, pero sí inmuniza)
    if (!ship.dead) {
      for (const s of shootingStars) {
        if (dist(ship, s) < ship.radius + s.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
  }

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerups) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.boostTtl = BOOST_DURATION;   // refresca (no apila)
        explode(p.x, p.y, 8);
      }
    }
    powerups = powerups.filter(p => !p.dead);

    for (const s of shieldPickups) {
      if (!s.dead && dist(ship, s) < ship.radius + s.radius) {
        s.dead = true;
        ship.shieldTtl = SHIELD_DURATION;   // refresca (no apila)
        explode(s.x, s.y, 8);
      }
    }
    shieldPickups = shieldPickups.filter(s => !s.dead);

    for (const t of triplePickups) {
      if (!t.dead && dist(ship, t) < ship.radius + t.radius) {
        t.dead = true;
        ship.tripleTtl = TRIPLE_DURATION;   // refresca (no apila)
        explode(t.x, t.y, 8);
      }
    }
    triplePickups = triplePickups.filter(t => !t.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkin];
  const SCALE = 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * SCALE, skin.verts[0][1] * SCALE);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * SCALE, skin.verts[i][1] * SCALE);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  const mult = SKINS[ship.skinIndex].pointsMult;
  ctx.fillText(`SCORE  ${score}`, 14, 26);
  if (mult > 1) {
    const skin = SKINS[ship.skinIndex];
    ctx.fillStyle = skin.color;
    ctx.fillText(`x${mult}`, 14 + ctx.measureText(`SCORE  ${score}`).width + 8, 26);
    ctx.fillStyle = '#fff';
  }

  // Timer del power-up Velocidad
  if (ship.boostTtl > 0) {
    ctx.fillStyle = '#0ff';
    ctx.fillText(`VEL  ${Math.ceil(ship.boostTtl)}s`, 14, 46);

    // Barra de progreso (depleta de derecha a izquierda)
    const barX = 14, barY = 52, barW = 120, barH = 6;
    const ratio = ship.boostTtl / BOOST_DURATION;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#fff';
  }

  // Timer del power-up Escudo
  if (ship.shieldTtl > 0) {
    ctx.fillStyle = '#0f0';
    ctx.fillText(`ESCUDO  ${Math.ceil(ship.shieldTtl)}s`, 14, 78);

    const barX = 14, barY = 84, barW = 120, barH = 6;
    const ratio = ship.shieldTtl / SHIELD_DURATION;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#fff';
  }

  // Timer del power-up Triple disparo
  if (ship.tripleTtl > 0) {
    ctx.fillStyle = '#f80';
    ctx.fillText(`TRIPLE  ${Math.ceil(ship.tripleTtl)}s`, 14, 110);

    const barX = 14, barY = 116, barW = 120, barH = 6;
    const ratio = ship.tripleTtl / TRIPLE_DURATION;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#f80';
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#fff';
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function drawMenu() {
  const skin = SKINS[menuIndex];

  // Título
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font      = 'bold 46px monospace';
  ctx.fillText('SKINS', W / 2, 110);

  // Marcadores de posición: ← →
  ctx.font = '28px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('‹', W / 2 - 200, H / 2 + 8);
  ctx.fillText('›', W / 2 + 200, H / 2 + 8);

  // Preview del skin: nave estática apuntando hacia arriba (refleja la escala real)
  const previewScale = 2 * skin.scale;
  ctx.save();
  ctx.translate(W / 2, H / 2 + 10);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.color;
  ctx.fillStyle   = 'rgba(0,0,0,0)';
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.shadowColor = skin.color;
  ctx.shadowBlur  = 12;
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * previewScale, skin.verts[0][1] * previewScale);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * previewScale, skin.verts[i][1] * previewScale);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Nombre del skin
  ctx.shadowBlur = 0;
  ctx.font        = 'bold 24px monospace';
  ctx.fillStyle   = skin.color;
  ctx.fillText(skin.name, W / 2, H / 2 + 90);

  // Atributos especiales (tamaño y puntos)
  ctx.font      = '15px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  let attrY = H / 2 + 112;
  if (skin.scale > 1) {
    ctx.fillText(`TAMAÑO x${skin.scale}`, W / 2, attrY);
    attrY += 20;
  }
  if (skin.pointsMult > 1) {
    ctx.fillStyle = '#fc6';
    ctx.fillText(`PUNTOS x${skin.pointsMult}`, W / 2, attrY);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    attrY += 20;
  }

  // Posición
  ctx.font      = '16px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`${menuIndex + 1} / ${SKINS.length}`, W / 2, attrY);

  // Ayuda
  ctx.font      = '16px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('← →  CAMBIAR    ENTER  JUGAR', W / 2, H - 50);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state === 'menu') {
    drawMenu();
    return;
  }

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  shieldPickups.forEach(s => s.draw());
  triplePickups.forEach(t => t.draw());
  wormholes.forEach(w => w.draw());
  shootingStars.forEach(s => s.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'paused')
    drawOverlay('PAUSA', 'ENTER PARA CONTINUAR');
  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initMenu();
requestAnimationFrame(loop);
