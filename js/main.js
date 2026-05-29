/**
 * NEXT LEVEL — JS principal
 * Navigation, scroll reveal, menu mobile, barre de progression
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════
     BARRE DE PROGRESSION SCROLL
  ══════════════════════════════════════════ */

  const progressBar = document.querySelector('.scroll-progress');

  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docH > 0 ? window.scrollY / docH : 0;
    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    // Nav scrolled
    const nav = document.querySelector('.nav');
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }

    // Liens nav actifs
    updateActiveNavLink();
  }, { passive: true });

  /* ══════════════════════════════════════════
     LIEN NAV ACTIF (SCROLL SPY)
  ══════════════════════════════════════════ */

  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link[data-target]');
    let current = '';

    sections.forEach(section => {
      const top = section.getBoundingClientRect().top;
      if (top <= 100) current = section.id;
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.target === current);
    });
  }

  /* ══════════════════════════════════════════
     SMOOTH SCROLL ANCRES
  ══════════════════════════════════════════ */

  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-target]');
    if (!target) return;

    const sectionId = target.dataset.target;
    const section = document.getElementById(sectionId);
    if (section) {
      e.preventDefault();
      section.scrollIntoView({ behavior: 'smooth' });

      // Ferme le menu mobile si ouvert
      const mobileMenu = document.querySelector('.nav__mobile-menu');
      if (mobileMenu) mobileMenu.classList.remove('open');
    }
  });

  /* ══════════════════════════════════════════
     MENU MOBILE
  ══════════════════════════════════════════ */

  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.querySelector('.nav__mobile-menu');
  const mobileClose = document.querySelector('.nav__mobile-close');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  /* ══════════════════════════════════════════
     SCROLL REVEAL (IntersectionObserver)
  ══════════════════════════════════════════ */

  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback sans IntersectionObserver
    revealElements.forEach(el => el.classList.add('visible'));
  }

  /* ══════════════════════════════════════════
     ANIMATION COMPTEURS STATS
  ══════════════════════════════════════════ */

  function animateCounter(el, target, suffix = '', duration = 1500) {
    const start = performance.now();
    const startVal = 0;

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(startVal + (target - startVal) * eased);
      el.textContent = value.toLocaleString('fr-FR') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const counterEls = document.querySelectorAll('[data-counter]');
  if (counterEls.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.counter, 10);
            const suffix = el.dataset.suffix || '';
            animateCounter(el, target, suffix);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    counterEls.forEach(el => counterObserver.observe(el));
  }

  /* ══════════════════════════════════════════
     FORMULAIRE CONTACT
  ══════════════════════════════════════════ */

  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;

      // Validation simple
      const inputs = contactForm.querySelectorAll('[required]');
      let valid = true;
      inputs.forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = 'var(--nl-danger)';
          input.addEventListener('input', () => {
            input.style.borderColor = '';
          }, { once: true });
        }
      });

      if (!valid) return;

      btn.textContent = 'Envoi en cours…';
      btn.disabled = true;

      const payload = {
        prenom  : contactForm.querySelector('[name="prenom"]')?.value  || '',
        nom     : contactForm.querySelector('[name="nom"]')?.value     || '',
        email   : contactForm.querySelector('[name="email"]')?.value   || '',
        sujet   : contactForm.querySelector('[name="sujet"]')?.value   || '',
        message : contactForm.querySelector('[name="message"]')?.value || '',
        website : contactForm.querySelector('[name="website"]')?.value || '',  // honeypot
      };

      fetch('/api/contact', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify(payload),
      })
        .then(r => r.json())
        .then(() => {
          btn.textContent = '✓ Message envoyé !';
          btn.style.background = 'var(--nl-success)';
          btn.style.color = 'var(--nl-bg-primary)';
          contactForm.reset();
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
            btn.disabled = false;
          }, 3000);
        })
        .catch(() => {
          btn.textContent = 'Erreur — réessaie';
          btn.style.background = 'var(--nl-danger)';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.disabled = false;
          }, 3000);
        });
    });
  }

  /* ══════════════════════════════════════════
     HOVER TILT CARDS (effet 3D léger)
  ══════════════════════════════════════════ */

  const tiltCards = document.querySelectorAll('.diff-card, .offre-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

})();

/* ══════════════════════════════════════════════════════════
   PHONE MOCKUP — CAROUSEL
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const slides  = document.getElementById('phoneSlides');
  if (!slides) return;

  const frame   = document.getElementById('phoneFrame');
  const btnPrev = document.getElementById('phonePrev');
  const btnNext = document.getElementById('phoneNext');
  const counter = document.getElementById('phoneCounter');
  const dots    = document.querySelectorAll('.phone-dot');
  const total   = slides.querySelectorAll('.phone-slide').length;
  let   current = 0;
  let   autoTimer = null;
  let   touchStartX = 0;
  let   touchMoved  = false;

  /* ── Aller à un écran précis ── */
  function goTo(idx) {
    current = (idx + total) % total;

    // Déplacer le ruban
    slides.style.transform = `translateX(-${current * 100}%)`;

    // Mettre à jour les points
    dots.forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle('phone-dot--active', active);
      dot.setAttribute('aria-selected', String(active));
    });

    // Mettre à jour le compteur
    if (counter) {
      const n = String(current + 1).padStart(2, '0');
      const t = String(total).padStart(2, '0');
      counter.textContent = `${n} / ${t}`;
    }
  }

  /* ── Auto-play ── */
  function startAuto() {
    autoTimer = setInterval(() => goTo(current + 1), 3800);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  function resetAuto() {
    stopAuto();
    startAuto();
  }

  startAuto();

  /* ── Boutons ── */
  if (btnPrev) btnPrev.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  if (btnNext) btnNext.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  /* ── Dots ── */
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.slide, 10));
      resetAuto();
    });
  });

  /* ── Pause on hover ── */
  if (frame) {
    frame.addEventListener('mouseenter', stopAuto);
    frame.addEventListener('mouseleave', startAuto);
  }

  /* ── Touch / swipe ── */
  slides.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchMoved  = false;
  }, { passive: true });

  slides.addEventListener('touchmove', (e) => {
    if (Math.abs(e.touches[0].clientX - touchStartX) > 8) touchMoved = true;
  }, { passive: true });

  slides.addEventListener('touchend', (e) => {
    if (!touchMoved) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff < -40)      { goTo(current + 1); resetAuto(); }
    else if (diff > 40)  { goTo(current - 1); resetAuto(); }
  });

  /* ── Keyboard (accessibilité) ── */
  if (frame) {
    frame.setAttribute('tabindex', '0');
    frame.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goTo(current + 1); resetAuto(); e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goTo(current - 1); resetAuto(); e.preventDefault();
      }
    });
  }

})();
