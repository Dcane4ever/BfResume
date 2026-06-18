'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  theme:       'sunset',
  isMuted:     false,
  isSubmitted: false,
  nahAttempts: 0,
};

// Preload vine boom audio separately from the video element
const vineBoomAudio = new Audio('vine-boom.mp4');
vineBoomAudio.preload = 'auto';

// ── Audio ─────────────────────────────────────────────────────────────────────
let audioCtx   = null;
let masterGain = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(audioCtx.destination);
}

function playAudioTone(freq, type = 'sine', duration = 0.5, gainVal = 0.08) {
  if (state.isMuted) return;
  try {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc    = audioCtx.createOscillator();
    const gain   = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) { /* audio blocked */ }
}

function playSynthesizedMelody(rootTone) {
  const scale    = [rootTone, rootTone * 1.25, rootTone * 1.5, rootTone * 1.875];
  const waveType = state.theme === 'midnight' ? 'triangle' : 'sine';
  scale.forEach((freq, idx) => {
    setTimeout(() => playAudioTone(freq, waveType, 0.6, 0.05), idx * 100);
  });
}

// ── Sparks ────────────────────────────────────────────────────────────────────
const sparkContainer = document.getElementById('spark-container');

function spawnFountainOfSparks(x, y, emojis, colors) {
  const useEmojis = emojis || ['💖','✨','🌹','🌈','💫','🧸'];
  const useColors = colors || ['#f43f5e','#ec4899','#ffb703','#a78bfa'];

  for (let i = 0; i < 12; i++) {
    const angle    = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 120 + 60;
    const tx       = Math.cos(angle) * velocity;
    const ty       = Math.sin(angle) * velocity - 20;
    const rot      = Math.random() * 360 - 180;
    const emoji    = useEmojis[Math.floor(Math.random() * useEmojis.length)];
    const color    = useColors[Math.floor(Math.random() * useColors.length)];
    const size     = Math.random() * 12 + 16;

    const el = document.createElement('span');
    el.className = 'sparkle-particle';
    el.textContent = emoji;
    el.style.left     = x + 'px';
    el.style.top      = y + 'px';
    el.style.fontSize = size + 'px';
    el.style.color    = color;
    el.style.setProperty('--tx',  tx  + 'px');
    el.style.setProperty('--ty',  ty  + 'px');
    el.style.setProperty('--rot', rot + 'deg');
    sparkContainer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

// ── Particle Canvas ───────────────────────────────────────────────────────────
const pCanvas = document.getElementById('particle-canvas');
let   pAnimId = null;

const THEME_EMOJIS = {
  sunset:   ['❤️','💖','🌹','✨','🧸'],
  morning:  ['🌱','☕','🌸','✨','☁️'],
  midnight: ['🌌','⭐','☄️','💫','💎'],
};

function initParticleCanvas() {
  if (pAnimId) cancelAnimationFrame(pAnimId);
  const ctx = pCanvas.getContext('2d');
  let W = pCanvas.width  = window.innerWidth;
  let H = pCanvas.height = window.innerHeight;
  const mouse = { x: null, y: null, active: false };

  class Particle {
    constructor() { this.reset(true); }
    reset(scatter) {
      this.x       = Math.random() * W;
      this.y       = scatter ? Math.random() * H * 2 : Math.random() * H + H;
      this.size    = Math.random() * 15 + 10;
      this.speedY  = -(Math.random() * 1.2 + 0.4);
      this.speedX  = Math.random() * 1 - 0.5;
      this.emoji   = THEME_EMOJIS[state.theme][Math.floor(Math.random() * THEME_EMOJIS[state.theme].length)];
      this.opacity = Math.random() * 0.4 + 0.25;
      this.angle   = Math.random() * Math.PI * 2;
      this.spin    = Math.random() * 0.02 - 0.01;
    }
    update() {
      this.y     += this.speedY;
      this.x     += this.speedX;
      this.angle += this.spin;
      if (mouse.active && mouse.x != null) {
        const dx   = mouse.x - this.x;
        const dy   = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) { this.x += (dx / dist); this.y += (dy / dist); }
      }
      if (this.y < -30 || this.x < -30 || this.x > W + 30) this.reset(false);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.font = this.size + 'px Arial';
      ctx.fillText(this.emoji, -this.size / 2, this.size / 2);
      ctx.restore();
    }
  }

  const particles = Array.from({ length: 50 }, () => new Particle());

  function animate() {
    ctx.clearRect(0, 0, W, H);
    if (state.theme === 'midnight') {
      ctx.strokeStyle = 'rgba(139,92,246,0.05)';
      ctx.lineWidth   = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }
    particles.forEach(p => { p.update(); p.draw(); });
    pAnimId = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    W = pCanvas.width  = window.innerWidth;
    H = pCanvas.height = window.innerHeight;
  });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
  window.addEventListener('mouseleave', () => { mouse.active = false; });

  animate();
}

// ── Score ring (decorative on avatar) ────────────────────────────────────────
function updateAvatarRing() {
  // Fixed at a nice high score — purely decorative
  const score  = 88;
  const aFill  = document.getElementById('avatar-ring-fill');
  const aBadge = document.getElementById('avatar-score-badge');
  if (aFill)  aFill.style.strokeDashoffset = (376.99 * (1 - score / 100)).toFixed(2);
  if (aBadge) aBadge.textContent = score;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  initParticleCanvas();
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
function parseEmoji(el) {
  if (window.twemoji && el) {
    twemoji.parse(el, { folder: 'svg', ext: '.svg', base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/' });
  }
}

function showQuizStep(step) {
  for (let i = 0; i <= 4; i++) {
    const el = document.getElementById('quiz-step-' + i);
    if (el) {
      el.hidden = i !== step;
      if (i === step) parseEmoji(el);
    }
  }
}

const NAH_LABELS = [
  'Nawp 🙅', 'Are you sure about that?', 'Yamete!! 😤', 'A lil more harder~',
  'Nuh uh 💅', 'Not today bestie', 'Try again babes', 'Absolutely not 😇',
  'Lol no', 'Char! 😂', 'Sige nga?', 'Ayaw ko eh',
  'Baka 🐄', 'Sus 🫢', 'Paano mo ko ginawa niyan', 'Huwag na 🥺',
];

function handleNahButton(btn) {
  state.nahAttempts++;
  playAudioTone(150, 'sawtooth', 0.15, 0.08);

  btn.textContent = NAH_LABELS[Math.floor(Math.random() * NAH_LABELS.length)];

  const maxX = Math.min(120, window.innerWidth * 0.28);
  const maxY = Math.min(100, window.innerHeight * 0.22);
  const rx = (Math.random() - 0.5) * maxX * 2;
  const ry = (Math.random() - 0.5) * maxY * 2;
  btn.style.transform  = `translate(${rx}px, ${ry}px)`;
  btn.style.transition = 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)';

  const rect = btn.getBoundingClientRect();
  spawnFountainOfSparks(
    rect.left + rect.width / 2,
    rect.top  + rect.height / 2,
    ['😢','💔','💦'],
    ['#60a5fa','#93c5fd','#bfdbfe']
  );

  const counter = document.getElementById('nah-counter-text');
  if (counter) {
    counter.textContent = state.nahAttempts > 1
      ? `You've tried to escape ${state.nahAttempts} times 😅`
      : 'Are you sure you wanna miss this? 🥺';
  }
}

function startLoader() {
  const bar = document.getElementById('loader-bar');
  if (!bar) return;
  let w = 0;
  const iv = setInterval(() => {
    w += 2;
    bar.style.width = Math.min(w, 100) + '%';
    if (w >= 100) { clearInterval(iv); enterPortfolio(); }
  }, 28);
}

function enterPortfolio() {
  document.getElementById('quiz-screen').hidden      = true;
  const portfolio = document.getElementById('portfolio-screen');
  portfolio.hidden = false;
  parseEmoji(portfolio);
  updateAvatarRing();
  startBgMusic();
}

// ── Background Music ──────────────────────────────────────────────────────────
function startBgMusic() {
  const music = document.getElementById('bg-music');
  if (!music) return;
  music.volume = 0.35;
  if (!state.isMuted) music.play().catch(() => {});
}

// ── Global Click Sparks ───────────────────────────────────────────────────────
document.body.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('button') || t.closest('input') || t.closest('a') || t.closest('[role="button"]')) return;
  spawnFountainOfSparks(e.clientX, e.clientY);
  playAudioTone(500 + Math.random() * 300, 'sine', 0.15, 0.03);
});

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  document.documentElement.setAttribute('data-theme', state.theme);
  initParticleCanvas();
  // Parse emojis on the first visible quiz step
  parseEmoji(document.getElementById('quiz-step-0'));

  // ─ NAH buttons ─
  const nahBtns = ['q0-nah','q1-nah','q2-nah'].map(id => document.getElementById(id));

  nahBtns.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('mouseover', () => handleNahButton(btn));
    btn.addEventListener('click',     () => handleNahButton(btn));
  });

  // ─ YES buttons ─
  document.getElementById('q0-yes')?.addEventListener('click', () => {
    playSynthesizedMelody(261.63);
    spawnFountainOfSparks(window.innerWidth / 2, window.innerHeight / 2);
    showQuizStep(1);
  });

  document.getElementById('q1-yes')?.addEventListener('click', () => {
    playAudioTone(329.63, 'sine', 0.4, 0.07);
    spawnFountainOfSparks(window.innerWidth / 2, window.innerHeight / 2, ['💖','✨','🌸']);
    showQuizStep(2);
  });

  document.getElementById('q2-yes')?.addEventListener('click', () => {
    playAudioTone(392, 'sine', 0.4, 0.07);
    spawnFountainOfSparks(window.innerWidth / 2, window.innerHeight / 2, ['🔥','✨','💫']);
    showQuizStep(3);
  });

  // ─ Pop quiz answers ─
  document.querySelectorAll('.btn-answer').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.correct === 'true') {
        // Fire audio immediately inside the click handler — gesture context intact
        vineBoomAudio.currentTime = 0;
        vineBoomAudio.play().catch(() => {});

        showQuizStep(4);
        // Play video muted (visuals only — audio handled above)
        const video = document.getElementById('vine-video');
        if (video) { video.muted = true; video.currentTime = 0; video.play().catch(() => {}); }

        spawnFountainOfSparks(
          window.innerWidth / 2, window.innerHeight / 2,
          ['😤','💥','🎉','✅'],
          ['#f43f5e','#a78bfa','#facc15']
        );
        setTimeout(startLoader, 3500);
      } else {
        playAudioTone(150, 'sawtooth', 0.2, 0.08);
        const msg = document.getElementById('wrong-msg');
        if (msg) { msg.hidden = false; setTimeout(() => { msg.hidden = true; }, 1500); }
        btn.style.borderColor = '#ef4444';
        setTimeout(() => { btn.style.borderColor = ''; }, 800);
      }
    });
  });

  // ─ Theme switcher ─
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });

  // ─ Mute ─
  const muteBtn = document.getElementById('mute-btn');
  muteBtn?.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    muteBtn.textContent = state.isMuted ? '🔇' : '🔊';
    const music = document.getElementById('bg-music');
    if (music) {
      if (state.isMuted) { music.pause(); }
      else { music.play().catch(() => {}); playAudioTone(440, 'sine', 0.2, 0.05); }
    }
  });

  // ─ Skills ─
  const skillModal      = document.getElementById('skill-modal');
  const skillModalEmoji = document.getElementById('skill-modal-emoji');
  const skillModalName  = document.getElementById('skill-modal-name');
  const skillModalJoke  = document.getElementById('skill-modal-joke');

  function openSkillModal(chip) {
    skillModalEmoji.textContent = chip.dataset.emoji;
    skillModalName.textContent  = chip.dataset.name;
    skillModalJoke.textContent  = chip.dataset.joke;

    const box = skillModal.querySelector('.skill-modal-box');

    // Show modal first (hidden=false) so we can measure its final center
    skillModal.hidden = false;

    // Chip center in viewport
    const chipRect  = chip.getBoundingClientRect();
    const chipCx    = chipRect.left + chipRect.width  / 2;
    const chipCy    = chipRect.top  + chipRect.height / 2;

    // Modal box center in viewport
    const boxRect   = box.getBoundingClientRect();
    const boxCx     = boxRect.left + boxRect.width  / 2;
    const boxCy     = boxRect.top  + boxRect.height / 2;

    // transform-origin offset: where the chip sits relative to the box center
    const originX = 50 + ((chipCx - boxCx) / boxRect.width)  * 100;
    const originY = 50 + ((chipCy - boxCy) / boxRect.height) * 100;
    box.style.setProperty('--origin-x', originX.toFixed(1) + '%');
    box.style.setProperty('--origin-y', originY.toFixed(1) + '%');

    // Re-trigger animation
    box.style.animation = 'none';
    box.offsetHeight;
    box.style.animation = '';

    playAudioTone(400 + Math.random() * 200, 'sine', 0.3, 0.05);
    spawnFountainOfSparks(chipCx, chipCy, ['✨','💫','⭐']);
  }

  document.querySelectorAll('.skill-chip').forEach(chip => {
    chip.addEventListener('click', () => openSkillModal(chip));
    chip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSkillModal(chip); }
    });
  });

  document.getElementById('skill-modal-close')?.addEventListener('click', () => {
    skillModal.hidden = true;
    playAudioTone(300, 'sine', 0.15, 0.04);
  });
  skillModal?.addEventListener('click', e => {
    if (e.target === skillModal) {
      skillModal.hidden = true;
      playAudioTone(300, 'sine', 0.15, 0.04);
    }
  });

  // ─ Sliders (just update label values) ─
  [
    { id: 'sl-cuddle', valId: 'val-cuddle' },
    { id: 'sl-spoil',  valId: 'val-spoil'  },
    { id: 'sl-gym',    valId: 'val-gym'    },
  ].forEach(({ id, valId }) => {
    const el = document.getElementById(id);
    const vl = document.getElementById(valId);
    el?.addEventListener('input', () => {
      if (vl) vl.textContent = el.value;
      playAudioTone(200 + (+el.value) * 3, 'sine', 0.12, 0.03);
    });
  });

  // ─ Green flags (audio feedback only) ─
  document.querySelectorAll('.flag-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        playAudioTone(523.25, 'triangle', 0.4, 0.06);
        const r = cb.getBoundingClientRect();
        spawnFountainOfSparks(r.left + r.width / 2, r.top + r.height / 2, ['🟢','✅','💚']);
      } else {
        playAudioTone(180, 'sine', 0.2, 0.05);
      }
    });
  });

  // ─ Calculate button ─
  document.getElementById('calculate-btn')?.addEventListener('click', function () {
    const result = document.getElementById('compat-result');
    if (!result) return;
    result.hidden = false;
    playSynthesizedMelody(261.63);
    spawnFountainOfSparks(
      window.innerWidth / 2, window.innerHeight / 2,
      ['💖','🌹','✨','💌','🧸'],
      ['#f43f5e','#ec4899','#a78bfa']
    );
    this.textContent = 'Calculated 💘';
    this.disabled = true;
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Update status badge
    const badge = document.querySelector('.status-badge');
    if (badge) badge.textContent = 'Taken (by you, hopefully) 😅';
  });

  // ─ Heart Submit ─
  document.getElementById('heart-submit-btn')?.addEventListener('click', function () {
    if (state.isSubmitted) return;
    state.isSubmitted = true;
    this.textContent  = 'APPLICATION SENT! ✅';
    this.disabled     = true;

    const fanfare = [261.63, 329.63, 392, 523.25, 659.25, 783.99];
    fanfare.forEach((freq, i) => setTimeout(() => playAudioTone(freq, 'sine', 0.7, 0.1), i * 100));

    for (let f = 0; f < 5; f++) {
      setTimeout(() => {
        spawnFountainOfSparks(
          window.innerWidth  * (0.15 + f * 0.17),
          window.innerHeight * 0.5,
          ['💌','✨','🌹','🌈','🔥','💖','🧸'],
          ['#ff007f','#ffaa00','#ff5500','#7a00ff']
        );
      }, f * 150);
    }

    document.getElementById('success-modal').hidden = false;
    document.getElementById('congrats-msg').hidden  = false;

    setTimeout(() => {
      window.open('mailto:vincentgabriellepimentel@gmail.com?subject=YES%20I%20DO%20-%20Interview%20Offer&body=Hi%20Vincent%2C%20I%20reviewed%20your%20amazing%20portfolio%20and%20I%20accept!%20Let%27s%20schedule%20a%20cozy%20coffee%20date%20soon!', '_self');
    }, 2200);
  });

  // ─ Modal ─
  document.getElementById('modal-close-btn')?.addEventListener('click', () => {
    document.getElementById('success-modal').hidden = true;
    playAudioTone(300, 'sine', 0.2, 0.04);
  });
  document.getElementById('modal-ok-btn')?.addEventListener('click', () => {
    document.getElementById('success-modal').hidden = true;
    playSynthesizedMelody(392);
  });
  document.getElementById('success-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      e.currentTarget.hidden = true;
      playAudioTone(300, 'sine', 0.2, 0.04);
    }
  });
}

init();
