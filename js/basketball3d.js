/**
 * NEXT LEVEL — Animation Basketball (Canvas 2D, zéro dépendance)
 *
 * ● Ballon visible dès le chargement (orbe pulsant en bas-gauche)
 * ● Scroll → le ballon monte en arc vers le panier (droite)
 * ● À ~75% du scroll : traverse le panier + flash néon vert
 * ● Particules bokeh en fond toute la page
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('basketball-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ─── Resize ─────────────────────────────────────────── */
  let W, H;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ─── Constantes de couleur ───────────────────────────── */
  const VIOLET = '#7B5CFF';
  const CYAN   = '#3DE0FF';
  const GREEN  = '#A8FF60';

  /* ─── Panier : ancré en haut-droit ───────────────────── */
  const HOOP_RX = 0.72;   // ratio viewport width
  const HOOP_RY = 0.38;   // ratio viewport height
  const RIM     = 52;     // rayon du cerceau (px, pour W=1200)
  function hx() { return W * HOOP_RX; }
  function hy() { return H * HOOP_RY; }
  function rimR() { return Math.max(30, RIM * W / 1200); }

  /* ─── Trajectoire Bézier cubique ──────────────────────── */
  // t=0 → bas-gauche écran  t=1 → centre du cerceau
  function arcPos(t) {
    const p0 = { x: W * 0.10, y: H * 0.90 };
    const p1 = { x: W * 0.15, y: H * -0.15 };
    const p2 = { x: W * 0.55, y: H * -0.05 };
    const p3 = { x: hx(),     y: hy() };
    const u  = 1 - t;
    return {
      x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
      y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
    };
  }

  const BALL_R = () => Math.max(18, 26 * W / 1200);

  /* ─── Particules de fond ──────────────────────────────── */
  const PARTS = [];
  for (let i = 0; i < 140; i++) {
    PARTS.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - .5) * .0003,
      vy: (Math.random() - .5) * .0002,
      col: [VIOLET, CYAN, GREEN, '#a070ff'][Math.floor(Math.random()*4)],
      a: Math.random() * 0.55 + 0.12,
    });
  }

  /* ─── Trail ───────────────────────────────────────────── */
  const TRAIL = [];
  const TRAIL_MAX = 22;

  /* ─── État ────────────────────────────────────────────── */
  let scroll = 0;
  let curT   = 0;
  let spin   = 0;
  let scoreFx = 0, scored = false;
  let time = 0;

  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scroll = max > 0 ? Math.min(1, scrollY / max) : 0;
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────
     DESSIN : FOND ATMOSPHÉRIQUE
  ──────────────────────────────────────────────────────────*/
  function drawAtmo(t) {
    // Halo violet à gauche (début)
    const a1 = Math.max(0, 1 - t * 2) * 0.22;
    if (a1 > 0.01) {
      const g = ctx.createRadialGradient(W*.12, H*.55, 0, W*.12, H*.55, W*.5);
      g.addColorStop(0, `rgba(123,92,255,${a1})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }
    // Halo cyan à droite (fin)
    const a2 = Math.max(0, (t - .3) / .7) * 0.20;
    if (a2 > 0.01) {
      const g = ctx.createRadialGradient(hx(), hy(), 0, hx(), hy(), W*.45);
      g.addColorStop(0, `rgba(61,224,255,${a2})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }
  }

  /* ─────────────────────────────────────────────────────────
     DESSIN : PARTICULES
  ──────────────────────────────────────────────────────────*/
  function drawParticles() {
    PARTS.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.shadowBlur  = 8; ctx.shadowColor = p.col;
      ctx.fillStyle   = p.col;
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* ─────────────────────────────────────────────────────────
     DESSIN : PANIER
  ──────────────────────────────────────────────────────────*/
  function drawHoop(fx) {
    const x = hx(), y = hy(), r = rimR();
    ctx.save();

    /* Poteau */
    ctx.strokeStyle = 'rgba(22,18,41,0.95)';
    ctx.lineWidth   = 7;
    ctx.beginPath();
    ctx.moveTo(x + r + 22, y + 8);
    ctx.lineTo(x + r + 22, y + H * .55);
    ctx.stroke();

    /* Bras horizontal */
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y - 5); ctx.lineTo(x + r + 22, y - 5);
    ctx.stroke();

    /* Backboard */
    ctx.fillStyle   = 'rgba(10,8,22,0.75)';
    ctx.strokeStyle = VIOLET;
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 12; ctx.shadowColor = VIOLET;
    const bx = x + r + 15, bw = 11, bh = 80, byt = y - 48;
    ctx.fillRect(bx, byt, bw, bh);
    ctx.strokeRect(bx, byt, bw, bh);
    // carré cible
    ctx.strokeStyle = CYAN;
    ctx.shadowColor = CYAN;
    ctx.lineWidth   = 1;
    ctx.strokeRect(bx + 1, byt + 18, bw - 2, 32);

    /* Rim glow */
    const rimA = 0.55 + fx * 1.8;
    ctx.shadowBlur  = 18 + fx * 40;
    ctx.shadowColor = fx > 0 ? GREEN : VIOLET;
    ctx.strokeStyle = fx > 0 ? GREEN : VIOLET;
    ctx.lineWidth   = 5;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * .18, 0, 0, Math.PI*2);
    ctx.stroke();

    /* Glow sous le rim */
    const rg = ctx.createRadialGradient(x, y+4, 0, x, y+4, r*1.6);
    rg.addColorStop(0, `rgba(123,92,255,${.14 + fx*.2})`);
    rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.shadowBlur = 0;
    ctx.fillRect(x - r*2, y, r*4, r*2);

    /* Filet */
    ctx.strokeStyle = `rgba(61,224,255,${.45 + fx*.3})`;
    ctx.shadowBlur  = 6; ctx.shadowColor = CYAN;
    ctx.lineWidth   = 1;
    const netT = y + r * .18, netB = y + r * 1.35;
    const nL = x - r + 5, nR = x + r - 5;
    for (let i = 0; i <= 8; i++) {
      const tx = nL + (nR - nL) * i / 8;
      const bx2 = x + (tx - x) * .35;
      ctx.beginPath();
      ctx.moveTo(tx, netT);
      ctx.quadraticCurveTo(tx, netT + (netB-netT)*.6, bx2, netB);
      ctx.stroke();
    }
    for (let ri = 0; ri < 4; ri++) {
      const ry = netT + (netB - netT) * ri / 3;
      const rspan = (r - 5) * (1 - ri * .25);
      ctx.beginPath();
      ctx.ellipse(x, ry, rspan, rspan*.16, 0, 0, Math.PI*2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ─────────────────────────────────────────────────────────
     DESSIN : BALLON
  ──────────────────────────────────────────────────────────*/
  function drawBall(x, y, alpha, pulse) {
    const r = BALL_R() * (1 + pulse * .08);
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.translate(x, y);
    ctx.rotate(spin);

    /* Glow externe */
    ctx.shadowBlur  = 35 + pulse * 20;
    ctx.shadowColor = VIOLET;

    /* Corps — gradient sombre violet */
    const gr = ctx.createRadialGradient(-r*.3, -r*.3, r*.05, 0, 0, r);
    gr.addColorStop(0, '#3d1f9e');
    gr.addColorStop(.55, '#1a0b52');
    gr.addColorStop(1, '#07060D');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);
    ctx.fillStyle = gr; ctx.fill();

    /* Reflet */
    ctx.shadowBlur = 0;
    const sh = ctx.createRadialGradient(-r*.38, -r*.38, 0, -r*.38, -r*.38, r*.6);
    sh.addColorStop(0, 'rgba(123,92,255,.40)');
    sh.addColorStop(1, 'rgba(123,92,255,0)');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);
    ctx.fillStyle = sh; ctx.fill();

    /* Lignes néon cyan */
    ctx.shadowBlur  = 12; ctx.shadowColor = CYAN;
    ctx.strokeStyle = CYAN; ctx.lineWidth = 1.8;
    ctx.globalAlpha = Math.min(1, alpha) * .75;

    // Équateur horizontal
    ctx.beginPath(); ctx.ellipse(0, 0, r, r*.28, 0, 0, Math.PI*2); ctx.stroke();
    // Méridien vertical
    ctx.beginPath(); ctx.ellipse(0, 0, r*.28, r, 0, 0, Math.PI*2); ctx.stroke();
    // Deux arcs de côté
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI*.65, Math.PI*1.35); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI*.35, Math.PI*.35); ctx.stroke();

    ctx.restore();
  }

  /* ─────────────────────────────────────────────────────────
     DESSIN : TRAIL
  ──────────────────────────────────────────────────────────*/
  function drawTrail(alpha) {
    if (TRAIL.length < 2) return;
    ctx.save();
    for (let i = 1; i < TRAIL.length; i++) {
      const ratio = i / TRAIL.length;
      const a     = ratio * alpha * .30;
      const r     = BALL_R() * ratio * .55;
      if (r < 1) continue;
      ctx.globalAlpha = a;
      ctx.shadowBlur  = 14; ctx.shadowColor = VIOLET;
      ctx.fillStyle   = 'rgba(123,92,255,.6)';
      ctx.beginPath();
      ctx.arc(TRAIL[i].x, TRAIL[i].y, r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ─────────────────────────────────────────────────────────
     DESSIN : FLASH SCORE
  ──────────────────────────────────────────────────────────*/
  function drawScoreFlash(fx) {
    if (fx < .01) return;
    ctx.save();
    const x = hx(), y = hy();
    const g = ctx.createRadialGradient(x, y, 0, x, y, 200);
    g.addColorStop(0, `rgba(168,255,96,${fx*.4})`);
    g.addColorStop(.5, `rgba(123,92,255,${fx*.15})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    if (fx > .5) {
      ctx.globalAlpha = (fx - .5) / .5;
      ctx.shadowBlur = 28; ctx.shadowColor = GREEN;
      ctx.fillStyle  = GREEN;
      ctx.font = `800 ${Math.round(22 + fx*14)}px "Saira Condensed", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('SCORE !', x, y - 70);
    }
    ctx.restore();
  }

  /* ─────────────────────────────────────────────────────────
     BOUCLE PRINCIPALE
  ──────────────────────────────────────────────────────────*/
  let last = performance.now();

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    time += dt;

    /* T cible : map scroll 0..1 → courbe 0..0.97 */
    const targetT = scroll * 0.97;
    curT += (targetT - curT) * .07;
    const t = Math.max(0, Math.min(.999, curT));

    /* Rotation */
    const spd = Math.abs(targetT - curT) * 15;
    spin += dt * (2 + spd * 5);

    /* Score */
    if (t > .73 && t < .88 && !scored) { scored = true; scoreFx = 1; }
    if (t < .70) scored = false;
    if (scoreFx > 0) scoreFx = Math.max(0, scoreFx - dt * .85);

    /* Position du ballon */
    const pos = arcPos(t);

    /* Pulse — visible même à scroll=0 */
    const pulse = Math.sin(time * 2.5) * .5 + .5;

    /* Alpha :
       - scroll=0 → ballon pleinement visible à sa position de départ
       - t>0.85  → fondu sortie dans le filet */
    let ballAlpha = 1;
    if (t > .84) ballAlpha = Math.max(0, 1 - (t - .84) / .12);

    /* Trail */
    if (t > .03 && ballAlpha > .05) {
      TRAIL.unshift({ x: pos.x, y: pos.y });
      if (TRAIL.length > TRAIL_MAX) TRAIL.pop();
    } else if (t <= .03) {
      TRAIL.length = 0;
    }

    /* ══ RENDU ══════════════════════════════════════ */
    ctx.clearRect(0, 0, W, H);

    drawParticles();
    drawAtmo(t);

    const inHoop = t > .74 && t < .88;
    if (!inHoop) {
      drawTrail(ballAlpha);
      drawBall(pos.x, pos.y, ballAlpha, pulse);
      drawHoop(scoreFx);
    } else {
      /* Ballon dans le filet : panier passe au-dessus */
      drawHoop(scoreFx);
      drawTrail(ballAlpha * .4);
      drawBall(pos.x, pos.y, ballAlpha, pulse);
    }

    drawScoreFlash(scoreFx);
  }

  requestAnimationFrame(loop);
})();
