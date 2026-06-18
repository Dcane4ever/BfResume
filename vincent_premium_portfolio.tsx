import React, { useState, useEffect, useRef } from 'react';
import PortfolioDashboard from './components/portfolio';
import CourtingQuiz from './components/quiz';
import SuccessModal from './components/success-modal';
import { themeStyles } from './data/themeStyles';
import { customStyleRules } from './styles/customStyleRules';
import type { ActiveTab, GreenFlagKey, GreenFlags, PlayAudioTone, Spark, ThemeId } from './types';
import type { Skill } from './data/portfolioData';

export default function App() {
  // State for the gamified Courting Quiz
  const [quizPassed, setQuizPassed] = useState<boolean>(false);
  const [quizStep, setQuizStep] = useState<number>(0); // 0 = ready for surprise, 1 = sure?, 2 = getting into, 3 = pop quiz 9+10, 4 = vine meme result
  const [nahButtonPos, setNahButtonPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [nahAttempts, setNahAttempts] = useState<number>(0);

  // Core application State
  const [theme, setTheme] = useState<ThemeId>('sunset'); // sunset, morning, midnight
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview'); // overview, qualifications, verifier, synth
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sparks, setSparks] = useState<Spark[]>([]);

  // Calibration Sliders
  const [cuddleLevel, setCuddleLevel] = useState<number>(85);
  const [spoilFrequency, setSpoilFrequency] = useState<number>(75);
  const [gymMotivation, setGymMotivation] = useState<number>(90);

  // Green Flags Checklist
  const [greenFlags, setGreenFlags] = useState<GreenFlags>({
    consistency: true,
    effort: true,
    provider: false,
    loyalty: true,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Dynamic Theme Styling Settings
  const currentStyle = themeStyles[theme];
  // Dynamic Synthesis Sound Engine (Polyphonic Synthesizer)
  const playAudioTone: PlayAudioTone = (freq, type = 'sine', duration = 0.5, gainVal = 0.08) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new ((window.AudioContext || window.webkitAudioContext) as typeof AudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const biquadFilter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      biquadFilter.type = 'lowpass';
      biquadFilter.frequency.setValueAtTime(1000, ctx.currentTime);

      gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(biquadFilter);
      biquadFilter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked.");
    }
  };

  // Synthesize custom cinematic Vine Boom bass sound in browser
  const playVineBoomSynth = () => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new ((window.AudioContext || window.webkitAudioContext) as typeof AudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle'; // Smooth bass tone
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      // Pitch drop curve replicating legendary boom bass
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 1.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } catch (e) {
      console.warn("Audio blocked.");
    }
  };

  const playSynthesizedMelody = (rootTone: number) => {
    const scale = [rootTone, rootTone * 1.25, rootTone * 1.5, rootTone * 1.875];
    scale.forEach((freq, idx) => {
      setTimeout(() => {
        playAudioTone(freq, theme === 'midnight' ? 'triangle' : 'sine', 0.6, 0.05);
      }, idx * 100);
    });
  };

  const handleTabToggle = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    const frequencies: Record<ActiveTab, number> = { overview: 261.63, qualifications: 293.66, verifier: 329.63, synth: 392.00 };
    playAudioTone(frequencies[tabId] || 440, 'sine', 0.3, 0.05);
  };

  // Premium particle sparkles spawner on click
  const spawnFountainOfSparks = (clientX: number, clientY: number, customEmojis: string[] | null = null, customColors: string[] | null = null) => {
    const newSparks: Spark[] = [];
    const count = 12;
    const defaultEmojis = ['ðŸ’–', 'âœ¨', 'ðŸŒ¹', 'ðŸŒˆ', 'ðŸ’«', 'ðŸ§'];
    const emojis = customEmojis || defaultEmojis;
    const defaultColors = ['#f43f5e', '#ec4899', '#ffb703', '#a78bfa'];
    const colors = customColors || defaultColors;

    for (let i = 0; i < count; i++) {
      const id = Date.now() + Math.random() + i;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 120 + 60;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity - 20;
      const rot = Math.random() * 360 - 180;
      const scale = Math.random() * 0.5 + 0.8;
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      newSparks.push({
        id,
        tx,
        ty,
        rot,
        scale,
        emoji,
        color,
        left: clientX,
        top: clientY,
        size: Math.random() * 12 + 16,
      });

      setTimeout(() => {
        setSparks((prev) => prev.filter((p) => p.id !== id));
      }, 1200);
    }

    setSparks((prev) => [...prev, ...newSparks]);
  };

  const handleGlobalScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('[role="button"]')) {
      return;
    }
    spawnFountainOfSparks(e.clientX, e.clientY);
    playAudioTone(500 + Math.random() * 300, 'sine', 0.15, 0.03);
  };

  // HTML5 Canvas Gravity-Based particles for gorgeous fluid movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawingContext = ctx;
    let animationFrameId: number;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Particle[] = [];
    const maxParticles = 50;
    const mouse: { x: number | null; y: number | null; active: boolean } = { x: null, y: null, active: false };

    const themeEmojis = {
      sunset: ['â¤ï¸', 'ðŸ’–', 'ðŸŒ¹', 'âœ¨', 'ðŸ§'],
      morning: ['ðŸŒ±', 'â˜•', 'ðŸŒ¸', 'âœ¨', 'â˜ï¸'],
      midnight: ['ðŸŒŒ', 'â­', 'â˜„ï¸', 'ðŸ’«', 'ðŸ’Ž']
    };

    class Particle {
      x = 0;
      y = 0;
      size = 0;
      speedY = 0;
      speedX = 0;
      emoji = '';
      opacity = 0;
      angle = 0;
      spin = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height + height;
        this.size = Math.random() * 15 + 10;
        this.speedY = -(Math.random() * 1.2 + 0.4);
        this.speedX = Math.random() * 1 - 0.5;
        this.emoji = themeEmojis[theme][Math.floor(Math.random() * themeEmojis[theme].length)];
        this.opacity = Math.random() * 0.4 + 0.25;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = Math.random() * 0.02 - 0.01;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.angle += this.spin;

        if (mouse.active && mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 200) {
            this.x += (dx / distance) * 1.0;
            this.y += (dy / distance) * 1.0;
          }
        }

        if (this.y < -30 || this.x < -30 || this.x > width + 30) {
          this.reset();
        }
      }

      draw() {
        drawingContext.save();
        drawingContext.globalAlpha = this.opacity;
        drawingContext.translate(this.x, this.y);
        drawingContext.rotate(this.angle);
        drawingContext.font = `${this.size}px Arial`;
        drawingContext.fillText(this.emoji, -this.size / 2, this.size / 2);
        drawingContext.restore();
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      drawingContext.clearRect(0, 0, width, height);

      if (theme === 'midnight') {
        drawingContext.strokeStyle = 'rgba(139, 92, 246, 0.05)';
        drawingContext.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
            if (dist < 100) {
              drawingContext.beginPath();
              drawingContext.moveTo(particles[i].x, particles[i].y);
              drawingContext.lineTo(particles[j].x, particles[j].y);
              drawingContext.stroke();
            }
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [theme]);

  // Inject Custom CSS to Document Head
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = customStyleRules;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  const getGreenFlagScore = () => {
    const checkedCount = Object.values(greenFlags).filter(Boolean).length;
    return (checkedCount / Object.keys(greenFlags).length) * 100;
  };

  const toggleGreenFlag = (key: GreenFlagKey) => {
    const updated = { ...greenFlags, [key]: !greenFlags[key] };
    setGreenFlags(updated);

    const count = Object.values(updated).filter(Boolean).length;
    if (updated[key]) {
      const scale = [261.63, 329.63, 392.00, 523.25];
      playAudioTone(scale[count - 1] || 523.25, 'triangle', 0.5, 0.06);
    } else {
      playAudioTone(180, 'sine', 0.2, 0.05);
    }
  };

  const getCalculatedScore = () => {
    const baseFlags = getGreenFlagScore();
    const dynamicCalibration = Math.round((cuddleLevel + spoilFrequency + gymMotivation) / 3);
    return Math.round((baseFlags + dynamicCalibration) / 2);
  };

  const getTunedCommentary = () => {
    const score = getCalculatedScore();
    if (score < 40) return "âš ï¸ Low power calibration. Vincent is currently conserving energy in quiet comfort mode.";
    if (score < 70) return "ðŸµ Warm & Cozy. High active listening unlocked. Ready for romantic evening walks and casual dates.";
    if (score < 90) return "ðŸ’– Attentiveness Master! Full morning messages, active gym companion, and structured weekend itineraries activated.";
    return "ðŸŒ… ULTIMATE SOULMATE ODYSSEY! 100% provider mindset, maximum physical affection, and lifetime safe emotional harbor verified.";
  };

  const getHeartbeatSpeed = () => {
    const score = getCalculatedScore();
    const maxSpeed = 0.45;
    const minSpeed = 2.5;
    const normalized = (100 - score) / 100;
    return (maxSpeed + (minSpeed - maxSpeed) * normalized).toFixed(2);
  };

  // Playful dynamic movement for the "NAH" button
  const handleNahHoverOrClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    playAudioTone(150, 'sawtooth', 0.15, 0.08);
    const randomX = (Math.random() - 0.5) * 200;
    const randomY = (Math.random() - 0.5) * 150;
    setNahButtonPos({ x: randomX, y: randomY });
    setNahAttempts(prev => prev + 1);

    // Spawn funny small bubbles/tears around button
    const rect = e.currentTarget.getBoundingClientRect();
    spawnFountainOfSparks(rect.left + rect.width / 2, rect.top + rect.height / 2, ['ðŸ˜¢', 'ðŸ’”', 'ðŸ’¦']);
  };

  const handleHeartSubmit = () => {
    setIsSubmitted(true);
    setShowModal(true);

    const fanfare = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    fanfare.forEach((freq, idx) => {
      setTimeout(() => {
        playAudioTone(freq, 'sine', 0.7, 0.1);
      }, idx * 100);
    });

    for (let f = 0; f < 5; f++) {
      setTimeout(() => {
        spawnFountainOfSparks(
          window.innerWidth * (0.15 + f * 0.17),
          window.innerHeight * 0.5,
          ['ðŸ’', 'âœ¨', 'ðŸŒ¹', 'ðŸŒˆ', 'ðŸ”¥', 'ðŸ’–', 'ðŸ§¸'],
          ['#ff007f', '#ffaa00', '#ff5500', '#7a00ff']
        );
      }, f * 150);
    }

    setTimeout(() => {
      window.location.href = "mailto:vincentgabriellepimentel@gmail.com?subject=YES%20I%20DO%20-%20Interview%20Offer&body=Hi%20Vincent,%20I%20reviewed%20your%20amazing%20highly%20interactive%20portfolio%20and%20I%20accept!%20Let's%20schedule%20a%20cozy%20coffee%20date%20soon!%20ðŸŒ…â˜•âœ¨";
    }, 2200);
  };


  return (
    <div
      className="min-h-screen theme-transition relative py-6 px-4 md:px-8 overflow-x-hidden flex items-center justify-center"
      style={{
        background: currentStyle.background,
        '--card-bg': currentStyle['--card-bg'],
        '--card-border': currentStyle['--card-border'],
        '--card-border-hover': currentStyle['--card-border-hover'],
        '--card-shadow': currentStyle['--card-shadow'],
        '--card-shadow-hover': currentStyle['--card-shadow-hover'],
        '--slider-track': currentStyle['--slider-track'],
        '--slider-thumb': currentStyle['--slider-thumb'],
      } as React.CSSProperties}
      onClick={handleGlobalScreenClick}
    >
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {sparks.map((p) => (
        <span
          key={p.id}
          className="sparkle-particle select-none"
          style={{
            left: `${p.left}px`,
            top: `${p.top}px`,
            fontSize: `${p.size}px`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rot}deg`,
            '--scale': p.scale,
            color: p.color,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}

      {!quizPassed ? (
        <CourtingQuiz
          quizStep={quizStep}
          setQuizStep={setQuizStep}
          nahButtonPos={nahButtonPos}
          nahAttempts={nahAttempts}
          handleNahHoverOrClick={handleNahHoverOrClick}
          playAudioTone={playAudioTone}
          playVineBoomSynth={playVineBoomSynth}
          playSynthesizedMelody={playSynthesizedMelody}
          spawnFountainOfSparks={spawnFountainOfSparks}
          setQuizPassed={setQuizPassed}
        />
      ) : (
        <PortfolioDashboard
          activeTab={activeTab}
          currentStyle={currentStyle}
          cuddleLevel={cuddleLevel}
          getCalculatedScore={getCalculatedScore}
          getHeartbeatSpeed={getHeartbeatSpeed}
          getTunedCommentary={getTunedCommentary}
          greenFlags={greenFlags}
          handleHeartSubmit={handleHeartSubmit}
          handleTabToggle={handleTabToggle}
          isMuted={isMuted}
          isSubmitted={isSubmitted}
          playAudioTone={playAudioTone}
          playSynthesizedMelody={playSynthesizedMelody}
          selectedSkill={selectedSkill}
          setCuddleLevel={setCuddleLevel}
          setGymMotivation={setGymMotivation}
          setIsMuted={setIsMuted}
          setSelectedSkill={setSelectedSkill}
          setSpoilFrequency={setSpoilFrequency}
          setTheme={setTheme}
          spoilFrequency={spoilFrequency}
          gymMotivation={gymMotivation}
          theme={theme}
          toggleGreenFlag={toggleGreenFlag}
        />
      )}

      {showModal && (
        <SuccessModal setShowModal={setShowModal} playAudioTone={playAudioTone} />
      )}
    </div>
  );
}

