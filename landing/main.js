/* ===================================================
   JOULET LANDING — GSAP SCROLL ANIMATIONS v2.0
   Enhanced with image reveals, parallax, and effects
   =================================================== */

function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // ── Create lightweight energy particles ──
  createHeroParticles();
  createShowcaseParticles();

  // ──────────────────────────────────────────────
  // SECTION 1: HERO — quick scrub-through
  // ──────────────────────────────────────────────

  // Hero sub text + CTA row entrance
  gsap.to('.hero-sub', {
    opacity: 1,
    y: 0,
    duration: 0.8,
    delay: 0.3,
    ease: 'power3.out'
  });

  gsap.to('.hero-cta-row', {
    opacity: 1,
    y: 0,
    duration: 0.8,
    delay: 0.6,
    ease: 'power3.out'
  });

  // Slow zoom on hero background image
  gsap.to('.hero-bg-image img', {
    scale: 1.2,
    duration: 30,
    repeat: -1,
    yoyo: true,
    ease: 'none'
  });

  // Hero scroll-through
  gsap.timeline({
    scrollTrigger: {
      trigger: '#section-hero',
      start: 'top top',
      end: '+=60%',
      pin: true,
      scrub: 0.5,
      anticipatePin: 1
    }
  })
    .to('.hero-line', {
      scale: 2,
      opacity: 0,
      stagger: 0.04,
      ease: 'power2.in'
    }, 0)
    .to('.hero-sub', {
      opacity: 0,
      y: -30,
      ease: 'power2.in'
    }, 0)
    .to('.hero-cta-row', {
      opacity: 0,
      y: -20,
      ease: 'power2.in'
    }, 0)
    .to('.hero-glow', {
      scale: 2,
      opacity: 0,
      ease: 'power2.in'
    }, 0)
    .to('.scroll-hint', {
      opacity: 0,
      y: 20,
      ease: 'power2.in'
    }, 0);

  // ──────────────────────────────────────────────
  // SECTION 2: SHOWCASE GALLERY
  // ──────────────────────────────────────────────

  gsap.from('#showcase-header', {
    scrollTrigger: {
      trigger: '#showcase',
      start: 'top 85%',
      end: 'top 50%',
      scrub: 0.5
    },
    y: 60,
    opacity: 0,
    ease: 'power3.out'
  });

  // Showcase cards stagger entry
  mm.add('(min-width: 601px)', () => {
    gsap.from('#sc-1', {
      scrollTrigger: { trigger: '#showcase-grid', start: 'top 90%', end: 'top 50%', scrub: 0.5 },
      x: -100, opacity: 0, rotateY: 10, ease: 'power3.out'
    });
    gsap.from('#sc-2', {
      scrollTrigger: { trigger: '#showcase-grid', start: 'top 85%', end: 'top 45%', scrub: 0.5 },
      y: 80, opacity: 0, ease: 'power3.out'
    });
    gsap.from('#sc-3', {
      scrollTrigger: { trigger: '#showcase-grid', start: 'top 80%', end: 'top 40%', scrub: 0.5 },
      y: 120, opacity: 0, ease: 'power3.out'
    });
  });

  mm.add('(max-width: 600px)', () => {
    gsap.from('.showcase-card', {
      scrollTrigger: { trigger: '#showcase-grid', start: 'top 90%', end: 'bottom 70%', scrub: 0.5 },
      y: 60, opacity: 0, stagger: 0.15, ease: 'power3.out'
    });
  });

  // ──────────────────────────────────────────────
  // SECTION 3: PRODUCT MOCKUP — tighter scroll
  // ──────────────────────────────────────────────

  gsap.timeline({
    scrollTrigger: {
      trigger: '#section-mockup',
      start: 'top top',
      end: '+=70%',
      pin: true,
      scrub: 0.5,
      anticipatePin: 1
    }
  })
    .to('#mockup-phone', {
      scale: 0.85,
      x: -80,
      opacity: 0,
      ease: 'power2.in'
    }, 0.4)
    .to('.mockup-caption', {
      x: 80,
      opacity: 0,
      ease: 'power2.in'
    }, 0.4);

  // Entry animations
  gsap.from('#mockup-phone', {
    scrollTrigger: {
      trigger: '#section-mockup',
      start: 'top 80%',
      end: 'top 30%',
      scrub: 0.5
    },
    y: 150,
    opacity: 0,
    rotateX: 12,
    ease: 'power3.out'
  });

  gsap.from('.mockup-caption', {
    scrollTrigger: {
      trigger: '#section-mockup',
      start: 'top 70%',
      end: 'top 30%',
      scrub: 0.5
    },
    x: 80,
    opacity: 0,
    ease: 'power3.out'
  });

  // ──────────────────────────────────────────────
  // SECTION 4: PARALLAX IMAGE STRIP
  // ──────────────────────────────────────────────

  // Stagger entry of parallax cards
  gsap.from('#pimg-1', {
    scrollTrigger: { trigger: '#section-parallax', start: 'top 90%', end: 'top 50%', scrub: 0.5 },
    y: 100, opacity: 0, scale: 0.9, ease: 'power3.out'
  });
  gsap.from('#pimg-2', {
    scrollTrigger: { trigger: '#section-parallax', start: 'top 85%', end: 'top 45%', scrub: 0.5 },
    y: 140, opacity: 0, scale: 0.9, ease: 'power3.out'
  });
  gsap.from('#pimg-3', {
    scrollTrigger: { trigger: '#section-parallax', start: 'top 80%', end: 'top 40%', scrub: 0.5 },
    y: 180, opacity: 0, scale: 0.9, ease: 'power3.out'
  });

  // Parallax effect on cards as you scroll
  gsap.to('#pimg-1 img', {
    scrollTrigger: { trigger: '#section-parallax', start: 'top bottom', end: 'bottom top', scrub: 1 },
    y: -40, ease: 'none'
  });
  gsap.to('#pimg-2 img', {
    scrollTrigger: { trigger: '#section-parallax', start: 'top bottom', end: 'bottom top', scrub: 1 },
    y: -60, ease: 'none'
  });
  gsap.to('#pimg-3 img', {
    scrollTrigger: { trigger: '#section-parallax', start: 'top bottom', end: 'bottom top', scrub: 1 },
    y: -30, ease: 'none'
  });

  // ──────────────────────────────────────────────
  // SECTION 5: BOLD STATEMENT — tighter scroll
  // ──────────────────────────────────────────────

  gsap.timeline({
    scrollTrigger: {
      trigger: '#section-statement',
      start: 'top top',
      end: '+=60%',
      pin: true,
      scrub: 0.5,
      anticipatePin: 1
    }
  })
    .to('.statement-line', {
      scale: 1.5,
      opacity: 0,
      stagger: 0.03,
      ease: 'power2.in'
    }, 0.5)
    .to('.statement-sub', {
      opacity: 0,
      y: -20,
      ease: 'power2.in'
    }, 0.5);

  // Entry
  gsap.from('.statement-line', {
    scrollTrigger: {
      trigger: '#section-statement',
      start: 'top 80%',
      end: 'top 40%',
      scrub: 0.5
    },
    scale: 0.6,
    opacity: 0,
    stagger: 0.06,
    ease: 'power3.out'
  });

  gsap.from('.statement-sub', {
    scrollTrigger: {
      trigger: '#section-statement',
      start: 'top 60%',
      end: 'top 30%',
      scrub: 0.5
    },
    y: 30,
    opacity: 0,
    ease: 'power3.out'
  });

  // Parallax background shapes
  gsap.to('.shape-1', {
    scrollTrigger: {
      trigger: '#section-statement',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    },
    y: -80,
    rotation: 20,
    ease: 'none'
  });

  gsap.to('.shape-2', {
    scrollTrigger: {
      trigger: '#section-statement',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    },
    y: -50,
    rotation: -20,
    ease: 'none'
  });

  gsap.to('.shape-3', {
    scrollTrigger: {
      trigger: '#section-statement',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    },
    y: -100,
    rotation: 30,
    ease: 'none'
  });

  // ──────────────────────────────────────────────
  // SECTION 6: BENTO GRID — simple fade (no pin)
  // ──────────────────────────────────────────────

  gsap.from('#bento-header', {
    scrollTrigger: {
      trigger: '#section-bento',
      start: 'top 85%',
      end: 'top 55%',
      scrub: 0.5
    },
    y: 40,
    opacity: 0,
    ease: 'power3.out'
  });

  mm.add('(min-width: 601px)', () => {
    gsap.from('#bento-physics', {
      scrollTrigger: { trigger: '#bento-grid', start: 'top 90%', end: 'top 50%', scrub: 0.5 },
      x: -120, opacity: 0, ease: 'power3.out'
    });
    gsap.from('#bento-chain', {
      scrollTrigger: { trigger: '#bento-grid', start: 'top 80%', end: 'top 40%', scrub: 0.5 },
      x: -120, opacity: 0, ease: 'power3.out'
    });
    gsap.from('#bento-iot', {
      scrollTrigger: { trigger: '#bento-grid', start: 'top 90%', end: 'top 50%', scrub: 0.5 },
      x: 120, opacity: 0, ease: 'power3.out'
    });
    gsap.from('#bento-trade', {
      scrollTrigger: { trigger: '#bento-grid', start: 'top 80%', end: 'top 40%', scrub: 0.5 },
      x: 120, opacity: 0, ease: 'power3.out'
    });
  });

  mm.add('(max-width: 600px)', () => {
    gsap.from('.bento-card', {
      scrollTrigger: { trigger: '#bento-grid', start: 'top 90%', end: 'bottom 70%', scrub: 0.5 },
      y: 50, opacity: 0, stagger: 0.1, ease: 'power3.out'
    });
  });

  // ──────────────────────────────────────────────
  // SECTION 7: CTA — simple fade
  // ──────────────────────────────────────────────

  gsap.from('.cta-title', {
    scrollTrigger: { trigger: '#section-cta', start: 'top 85%', end: 'top 55%', scrub: 0.5 },
    y: 40, opacity: 0, ease: 'power3.out'
  });

  gsap.from('.cta-sub', {
    scrollTrigger: { trigger: '#section-cta', start: 'top 80%', end: 'top 50%', scrub: 0.5 },
    y: 30, opacity: 0, ease: 'power3.out'
  });

  gsap.from('.cta-buttons', {
    scrollTrigger: { trigger: '#section-cta', start: 'top 75%', end: 'top 45%', scrub: 0.5 },
    y: 20, opacity: 0, scale: 0.95, ease: 'power3.out'
  });

  gsap.from('.chain-pill', {
    scrollTrigger: { trigger: '#section-cta', start: 'top 70%', end: 'top 40%', scrub: 0.5 },
    y: 15, opacity: 0, stagger: 0.03, ease: 'power3.out'
  });

  // ──────────────────────────────────────────────
  // SCROLL INDICATOR
  // ──────────────────────────────────────────────

  const sections = [
    '#section-hero', '#showcase', '#section-mockup',
    '#section-parallax', '#section-statement', '#section-bento', '#section-cta'
  ];
  const dots = document.querySelectorAll('.scroll-dot');

  sections.forEach((sectionId, index) => {
    ScrollTrigger.create({
      trigger: sectionId,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveDot(index),
      onEnterBack: () => setActiveDot(index)
    });
  });

  function setActiveDot(index) {
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const target = document.querySelector(sections[index]);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ──────────────────────────────────────────────
  // NAVBAR COLLAPSE
  // ──────────────────────────────────────────────

  const navbar = document.getElementById('main-nav');

  ScrollTrigger.create({
    start: 300,
    end: 99999,
    onEnter: () => navbar.classList.add('collapsed', 'scrolled'),
    onLeaveBack: () => navbar.classList.remove('collapsed', 'scrolled')
  });

  // ──────────────────────────────────────────────
  // MASCOT — simple pulse (lightweight)
  // ──────────────────────────────────────────────

  const mascot = document.getElementById('fixed-mascot');
  let lastPulseSection = -1;

  sections.forEach((sectionId, index) => {
    ScrollTrigger.create({
      trigger: sectionId,
      start: 'top center',
      onEnter: () => {
        if (lastPulseSection !== index) {
          lastPulseSection = index;
          gsap.fromTo(mascot, { scale: 1 }, {
            scale: 1.1, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut'
          });
        }
      }
    });
  });

  // ──────────────────────────────────────────────
  // TILT EFFECT ON SHOWCASE CARDS (desktop only)
  // ──────────────────────────────────────────────

  mm.add('(min-width: 901px)', () => {
    document.querySelectorAll('.showcase-card, .parallax-img-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateY: x * 8,
          rotateX: -y * 8,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 800
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.5,
          ease: 'power2.out'
        });
      });
    });
  });
}

// ──────────────────────────────────────────────
// LIGHTWEIGHT ENERGY PARTICLES (hero)
// ──────────────────────────────────────────────

function createHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const count = 18;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 2;

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${Math.random() > 0.5 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(45, 212, 191, 0.3)'}; 
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      pointer-events: none;
      box-shadow: 0 0 ${size * 3}px ${Math.random() > 0.5 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(45, 212, 191, 0.2)'};
    `;

    container.appendChild(particle);

    gsap.to(particle, {
      y: -100 - Math.random() * 150,
      x: (Math.random() - 0.5) * 80,
      opacity: 0,
      duration: 5 + Math.random() * 4,
      repeat: -1,
      delay: Math.random() * 4,
      ease: 'power1.out'
    });
  }
}

// ──────────────────────────────────────────────
// FLOATING PARTICLES FOR SHOWCASE SECTION
// ──────────────────────────────────────────────

function createShowcaseParticles() {
  const container = document.getElementById('showcase-particles');
  if (!container) return;

  const count = 10;
  const colors = [
    'rgba(52, 211, 153, 0.2)',
    'rgba(45, 212, 191, 0.15)',
    'rgba(129, 140, 248, 0.12)',
    'rgba(56, 189, 248, 0.15)'
  ];

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 6 + 3;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      pointer-events: none;
      box-shadow: 0 0 ${size * 4}px ${color};
    `;

    container.appendChild(particle);

    gsap.to(particle, {
      y: (Math.random() - 0.5) * 200,
      x: (Math.random() - 0.5) * 100,
      opacity: 0,
      duration: 6 + Math.random() * 5,
      repeat: -1,
      delay: Math.random() * 5,
      ease: 'sine.inOut',
      yoyo: true
    });
  }
}

// ──────────────────────────────────────────────
// HAMBURGER TOGGLE
// ──────────────────────────────────────────────

const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});

document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ──────────────────────────────────────────────
// LIVE API DATA FEED (connects to iot-simulation API Bridge)
// ──────────────────────────────────────────────

const API_BASE = 'http://localhost:5004';
let isApiAlive = false;

async function fetchLiveData() {
  try {
    // Fetch system status (includes metrics + contract info)
    const statusRes = await fetch(`${API_BASE}/api/status`);
    if (!statusRes.ok) throw new Error('API not reachable');
    const statusData = await statusRes.json();

    // Fetch grid status (voltage, frequency)
    const gridRes = await fetch(`${API_BASE}/api/grid/status`);
    const gridData = gridRes.ok ? await gridRes.json() : {};

    isApiAlive = true;

    // Update dashboard mockup with live data
    const voltageEl = document.querySelector('.dm-gauge-value');
    const statusEl = document.querySelector('.dm-gauge-status');
    const statusDot = document.querySelector('.dm-dot');
    const statusText = document.querySelector('.dm-status span:last-child');
    const fillBar = document.querySelector('.dm-gauge-fill');

    // Voltage
    const voltage = gridData.voltage || 230.0;
    if (voltageEl) voltageEl.innerHTML = `${voltage.toFixed(1)}<span>V</span>`;

    // Grid stable or brownout
    const isBrownout = voltage < 210;
    if (statusEl) {
      statusEl.textContent = isBrownout ? '⚠ BROWNOUT DETECTED' : '✓ GRID STABLE';
      statusEl.style.color = isBrownout ? '#f59e0b' : '#34d399';
    }

    // Connection status
    if (statusDot) statusDot.style.background = '#34d399';
    if (statusText) statusText.textContent = 'Live';

    // Voltage bar fill (0-460V range → percentage)
    if (fillBar) {
      const pct = Math.min(100, Math.max(0, (voltage / 260) * 100));
      fillBar.style.width = `${pct}%`;
      fillBar.style.background = isBrownout
        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
        : 'linear-gradient(90deg, #34d399, #2dd4bf)';
    }

    // Metrics — accumulated energy (pending buffer)
    const metrics = statusData.metrics || {};
    const accumulated = metrics.accumulated_energy || 0;
    const threshold = metrics.reporting_threshold || 10;

    const pendingEl = document.querySelector('#dm-pending-value');
    if (pendingEl) pendingEl.textContent = `${accumulated.toFixed(1)} / ${threshold} kWh`;

    // Total reported
    const totalReported = metrics.total_reported || 0;
    const jltMinted = Math.floor(totalReported / 10); // 10 kWh = 1 JLT (MINING_DIFFICULTY)
    const jltEl = document.querySelector('#dm-jlt-value');
    if (jltEl) jltEl.textContent = `${jltMinted.toLocaleString()} JLT`;

  } catch (err) {
    // API is offline — show static defaults
    if (isApiAlive) {
      isApiAlive = false;
      const statusDot = document.querySelector('.dm-dot');
      const statusText = document.querySelector('.dm-status span:last-child');
      if (statusDot) statusDot.style.background = '#ef4444';
      if (statusText) statusText.textContent = 'Offline';
    }
  }
}

// Poll every 3 seconds
setInterval(fetchLiveData, 3000);
fetchLiveData(); // Initial call

// ──────────────────────────────────────────────
// INIT & PREMIUM LOADER
// ──────────────────────────────────────────────

function startPremiumLoader() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    requestAnimationFrame(startPremiumLoader);
    return;
  }

  const statusEl = document.getElementById('ul-status-text');
  const statusMessages = [
    { at: 0, text: 'INITIALIZING DECENTRALIZED ENERGY PROTOCOL...' },
    { at: 0.4, text: 'CONNECTING TO LOCAL BLOCKCHAIN...' },
    { at: 0.8, text: 'SYNCING SMART CONTRACTS...' },
    { at: 1.2, text: 'LOADING DEX LIQUIDITY ENGINE...' },
    { at: 1.6, text: 'CALIBRATING IoT ORACLE BRIDGE...' },
    { at: 2.0, text: 'ESTABLISHING P2P ENERGY CHANNELS...' },
    { at: 2.3, text: 'FINALIZING GENESIS BLOCK...' },
  ];

  // Schedule status text updates
  statusMessages.forEach(msg => {
    setTimeout(() => {
      if (statusEl) {
        statusEl.style.opacity = '0';
        statusEl.style.transform = 'translateY(5px)';
        setTimeout(() => {
          statusEl.textContent = msg.text;
          statusEl.style.opacity = '1';
          statusEl.style.transform = 'translateY(0)';
        }, 150);
      }
    }, msg.at * 1000);
  });

  // Animate progress bar fill over 2.5 seconds
  gsap.to('#ul-progress-fill', {
    width: '100%',
    duration: 2.5,
    ease: 'power2.inOut',
    onComplete: () => {
      // Show "NETWORK READY" before transitioning out
      if (statusEl) {
        statusEl.style.opacity = '0';
        setTimeout(() => {
          statusEl.textContent = 'NETWORK READY ✓';
          statusEl.style.color = '#34d399';
          statusEl.style.opacity = '1';
        }, 150);
      }

      // Transition out the loader after a brief pause
      setTimeout(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            document.getElementById('ultra-loader').style.display = 'none';
            document.getElementById('ultra-loader').remove();
            initAnimations();
          }
        });

        tl.to('.ul-text-box', { opacity: 0, y: -15, duration: 0.3, ease: 'power2.in' })
          .to('.ul-circuit', { opacity: 0, duration: 0.3 }, '-=0.2')
          .to('.ul-ring', { scale: 1.5, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.in' }, '-=0.2')
          .to('.ul-mascot', { scale: 3, opacity: 0, filter: 'blur(20px)', duration: 0.6, ease: 'power3.in' }, '-=0.6')
          .to('#ultra-loader', { opacity: 0, backgroundColor: 'transparent', duration: 0.8 }, '-=0.4');
      }, 500);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPremiumLoader);
} else {
  startPremiumLoader();
}
