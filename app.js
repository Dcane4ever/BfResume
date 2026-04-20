const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const heartContainer = document.getElementById('heart-container');
const heartSymbols = ['❤️', '💖', '✨', '🌹'];

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function createHeart() {
    if (!heartContainer) {
        return;
    }

    const heart = document.createElement('div');
    const emoji = document.createElement('span');
    const duration = randomRange(6, 12);
    const drift = Math.round(randomRange(-24, 24));

    heart.className = 'heart-float';
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.fontSize = `${Math.round(randomRange(12, 28))}px`;
    heart.style.setProperty('--duration', `${duration}s`);
    heart.style.setProperty('--drift', `${drift}px`);
    heart.style.setProperty('--sway', `${randomRange(2.8, 4.6).toFixed(2)}s`);

    emoji.className = 'heart-emoji';
    emoji.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];

    heart.appendChild(emoji);
    heartContainer.appendChild(heart);

    window.setTimeout(() => {
        heart.remove();
    }, duration * 1000);
}

if (!prefersReducedMotion) {
    window.setInterval(createHeart, 600);
}

const skillTip = document.getElementById('skill-tip');
const skillChips = document.querySelectorAll('.skill-chip');

function showTip(text) {
    if (!skillTip) {
        return;
    }

    skillTip.textContent = text;
    skillTip.classList.add('is-active');

    window.setTimeout(() => {
        skillTip.classList.remove('is-active');
    }, 220);
}

skillChips.forEach((chip) => {
    const tip = chip.getAttribute('data-tip');
    if (!tip) {
        return;
    }

    chip.addEventListener('click', () => showTip(tip));
    chip.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showTip(tip);
        }
    });
});

const hireBtn = document.getElementById('hireBtn');
const congrats = document.getElementById('congrats');

if (hireBtn && congrats) {
    const mailto = hireBtn.dataset.mailto;

    hireBtn.addEventListener('click', () => {
        if (hireBtn.dataset.sent === 'true') {
            return;
        }

        hireBtn.dataset.sent = 'true';
        hireBtn.textContent = 'APPLICATION SENT! ✅';
        hireBtn.classList.replace('bg-rose-500', 'bg-green-500');
        hireBtn.classList.replace('hover:bg-rose-600', 'hover:bg-green-600');
        hireBtn.classList.add('btn-sent');

        congrats.classList.add('is-visible');
        congrats.setAttribute('aria-hidden', 'false');

        if (!prefersReducedMotion) {
            for (let i = 0; i < 26; i += 1) {
                window.setTimeout(createHeart, i * 55);
            }
        }

        if (mailto) {
            window.setTimeout(() => {
                window.location.href = mailto;
            }, 180);
        }
    });
}
