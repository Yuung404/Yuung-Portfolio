/* ═══════════════════════════════════════════════
   PORTFOLIO BTS SIO — script.js
   Modules : Matrix · Curseur · Nav · Typewriter
             Decrypt · Reveal · PDF viewer · Boot
═══════════════════════════════════════════════ */

/* ────────────────────────────────
   1. MATRIX RAIN (fond visible)
──────────────────────────────── */
(function matrix() {
  const cnv = document.getElementById('mx-canvas');
  if (!cnv) return;
  const ctx = cnv.getContext('2d');
  const resize = () => { cnv.width = innerWidth; cnv.height = innerHeight; };
  resize(); addEventListener('resize', resize);

  // Caractères mélangés : katakana + latin + symboles
  const CH = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop#@$%{}[]|<>\\!/';
  const FS = 15;
  // Palette plus lumineuse que l'ancienne version
  const COLS = ['#002d08','#004810','#006018','#008822','#00aa33','#00bb38','#00cc44','#33bb55'];
  let drops = Array.from({length: Math.floor(cnv.width / FS)}, () => -(Math.random() * 28 | 0));
  let sc = 0;

  const draw = () => {
    // Traînée plus légère = fond plus visible entre les colonnes
    ctx.fillStyle = 'rgba(2,21,2, 0.038)';
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    ctx.font = `${FS}px 'Share Tech Mono',monospace`;
    drops.forEach((y, i) => {
      const ch = CH[Math.random() * CH.length | 0];
      // Tête de colonne = blanc-vert très brillant
      const isHead = Math.random() > .91;
      ctx.fillStyle = isHead ? '#99ddbb' : COLS[Math.random() * COLS.length | 0];
      if (y >= 0) ctx.fillText(ch, i * FS, y * FS);
      if (y * FS > cnv.height && Math.random() > .97) drops[i] = -(Math.random() * 22 | 0);
      drops[i]++;
    });
    sc++;
    const el = document.getElementById('hud-scan');
    if (el) el.textContent = 'SCAN::' + String(sc).padStart(4, '0');
  };
  setInterval(draw, 38);
})();

/* ────────────────────────────────
   2. CURSEUR
──────────────────────────────── */
(function cursor() {
  const ring = document.getElementById('cur-ring');
  const dot  = document.getElementById('cur-dot');
  if (!ring || !dot) return;
  let mx=0, my=0, rx=0, ry=0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  document.addEventListener('mousedown', () => ring.style.transform = 'translate(-50%,-50%) scale(.55)');
  document.addEventListener('mouseup',   () => ring.style.transform = 'translate(-50%,-50%) scale(1)');
  (function anim() {
    rx += (mx - rx) * .12; ry += (my - ry) * .12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(anim);
  })();
})();

/* ────────────────────────────────
   3. HORLOGE HUD
──────────────────────────────── */
(function clock() {
  const tick = () => {
    const el = document.getElementById('hud-clock');
    if (!el) return;
    const n = new Date();
    el.textContent = [n.getHours(), n.getMinutes(), n.getSeconds()]
      .map(v => String(v).padStart(2, '0')).join(':');
  };
  tick(); setInterval(tick, 1000);
})();

/* ────────────────────────────────
   4. NAV DYNAMIQUE
──────────────────────────────── */
(function buildNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const lang    = document.documentElement.lang || 'fr';
  const rawPath = location.pathname;

  // Détecter la page courante
  const isFr   = rawPath.includes('/fr/');
  const isEn   = rawPath.includes('/en/');
  const isRoot = !isFr && !isEn;

  // Construire préfixe pour les liens
  const base = isFr ? '' : isEn ? '' : '';  // on est dans fr/ ou en/

  const pages_fr = [
    { href: 'index.html',          label: 'ACCUEIL'       },
    { href: 'competences.html',    label: 'COMPÉTENCES'   },
    { href: 'projets.html',        label: 'PROJETS'       },
    { href: 'veille.html',         label: 'VEILLE'        },
    { href: 'certifications.html', label: 'CERTIFICATIONS'},
    { href: 'objectifs.html',      label: 'OBJECTIFS'     },
    { href: 'contact.html',        label: 'CONTACT'       },
  ];
  const pages_en = [
    { href: 'index.html',           label: 'HOME'          },
    { href: 'skills.html',          label: 'SKILLS'        },
    { href: 'projects.html',        label: 'PROJECTS'      },
    { href: 'watch.html',           label: 'TECH WATCH'    },
    { href: 'certifications.html',  label: 'CERTIFICATIONS'},
    { href: 'goals.html',           label: 'GOALS'         },
    { href: 'contact.html',         label: 'CONTACT'       },
  ];
  const pages = lang === 'en' ? pages_en : pages_fr;
  const curFile = rawPath.split('/').pop() || 'index.html';

  // Logo
  const logo = document.createElement('a');
  logo.href  = 'index.html';
  logo.className = 'nav-logo';
  // ⚠ Remplace par tes initiales
  logo.innerHTML = '<em>_</em>PORTFOLIO';
  nav.appendChild(logo);

  // Links
  const ul = document.createElement('div');
  ul.className = 'nav-links';
  ul.id = 'nav-links';

  pages.forEach(p => {
    const a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.label;
    if (curFile === p.href) a.classList.add('active');
    ul.appendChild(a);
  });

  // Mapping des pages équivalentes FR ↔ EN
  const PAGE_MAP_FR_TO_EN = {
    'index.html':          'index.html',
    'competences.html':    'skills.html',
    'projets.html':        'projects.html',
    'veille.html':         'watch.html',
    'certifications.html': 'certifications.html',
    'objectifs.html':      'goals.html',
    'contact.html':        'contact.html',
    'projet-detail.html':  'project-detail.html',
    'projet-mallet.html':      'project-mallet.html',
    'projet-versailles.html':  'project-versailles.html',
  };
  const PAGE_MAP_EN_TO_FR = {
    'index.html':              'index.html',
    'skills.html':             'competences.html',
    'projects.html':           'projets.html',
    'watch.html':              'veille.html',
    'certifications.html':     'certifications.html',
    'goals.html':              'objectifs.html',
    'contact.html':            'contact.html',
    'project-detail.html':     'projet-detail.html',
    'project-mallet.html':     'projet-mallet.html',
    'project-versailles.html': 'projet-versailles.html',
  };

  // Switch langue — conserve la page courante
  const langBtn = document.createElement('a');
  if (lang === 'fr') {
    const target = PAGE_MAP_FR_TO_EN[curFile] || 'index.html';
    langBtn.href = '../en/' + target;
    langBtn.textContent = '🇬🇧 EN';
  } else {
    const target = PAGE_MAP_EN_TO_FR[curFile] || 'index.html';
    langBtn.href = '../fr/' + target;
    langBtn.textContent = '🇫🇷 FR';
  }
  langBtn.className = 'nav-lang';
  ul.appendChild(langBtn);

  nav.appendChild(ul);

  // Bouton mobile
  const mbtn = document.createElement('button');
  mbtn.className = 'nav-mobile-btn';
  mbtn.textContent = '≡ MENU';
  mbtn.onclick = () => ul.classList.toggle('open');
  nav.appendChild(mbtn);
})();

/* ────────────────────────────────
   5. PAGE FADE IN
──────────────────────────────── */
(function pageIn() {
  const pw = document.querySelector('.page-wrap');
  if (!pw) return;
  requestAnimationFrame(() => requestAnimationFrame(() => pw.classList.add('loaded')));
})();

/* ────────────────────────────────
   6. TYPEWRITER (hero)
──────────────────────────────── */
function initTypewriter(roles) {
  const el = document.getElementById('typed-text');
  if (!el) return;
  let ri=0, ci=0, del=false;
  const loop = () => {
    const w = roles[ri];
    if (!del) { el.textContent = w.slice(0, ci+1); ci++; if (ci===w.length) { del=true; setTimeout(loop, 2100); return; } }
    else       { el.textContent = w.slice(0, ci-1); ci--; if (ci===0) { del=false; ri=(ri+1)%roles.length; } }
    setTimeout(loop, del ? 44 : 82);
  };
  setTimeout(loop, 700);
}

/* ────────────────────────────────
   7. DECRYPT EFFET NOM HERO
──────────────────────────────── */
function initDecrypt() {
  const el = document.querySelector('.h-name');
  if (!el) return;
  const orig = el.getAttribute('data-text');
  const DC = 'アイウエオカキ0123456789#@$%ABCDEFGHIJ';
  let f = 0; const t = orig.length * 2.8;
  const iv = setInterval(() => {
    el.textContent = orig.split('').map((c, i) => {
      if (c === ' ') return ' ';
      if (i < f / 2.8) return c;
      return DC[Math.random() * DC.length | 0];
    }).join('');
    if (++f >= t) { el.textContent = orig; clearInterval(iv); }
  }, 34);
}

/* ────────────────────────────────
   8. SCROLL REVEAL
──────────────────────────────── */
function initReveal() {
  const obs = new IntersectionObserver(entries =>
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); }),
  { threshold: .1 });
  document.querySelectorAll('.rv').forEach(el => obs.observe(el));
}

/* ────────────────────────────────
   9. PDF VIEWER MODAL
──────────────────────────────── */
function openPDF(url, name) {
  const modal = document.getElementById('pdf-modal');
  const frame = document.getElementById('pdf-frame');
  const nm    = document.getElementById('pdf-name');
  if (!modal || !frame) { window.open(url, '_blank'); return; }
  frame.src   = url;
  nm.textContent = name || url.split('/').pop();
  modal.classList.add('open');
}
function closePDF() {
  const modal = document.getElementById('pdf-modal');
  const frame = document.getElementById('pdf-frame');
  if (modal) modal.classList.remove('open');
  if (frame) frame.src = '';
}

/* ────────────────────────────────
   10. BOOT SEQUENCE (splash)
──────────────────────────────── */
function runBoot(lang) {
  const inner = document.getElementById('term-inner');
  const tcur  = document.getElementById('tcur');
  if (!inner || !tcur) return 4500;

  const L = lang === 'en' ? [
    {t:'MATRIX PORTFOLIO SYSTEM v3.0',          c:'d',  d:0},
    {t:'Secure connection established.',         c:'n',  d:180},
    {t:'',                                       c:'sp', d:300},
    {t:'> Mounting file system...',              c:'n',  d:460},
    {t:'  /home/      [READY]',                 c:'ok', d:600},
    {t:'  /skills/    [READY]',                 c:'ok', d:720},
    {t:'  /projects/  [READY]',                 c:'ok', d:840},
    {t:'  /watch/     [READY]',                 c:'ok', d:960},
    {t:'  /certs/     [READY]',                 c:'ok', d:1080},
    {t:'  /contact/   [READY]',                 c:'ok', d:1200},
    {t:'',                                       c:'sp', d:1300},
    {t:'> Checking competences...',              c:'n',  d:1440},
    {t:'  HTML5/CSS3/JS  ....... OPERATIONAL',  c:'a',  d:1580},
    {t:'  LINUX/DEBIAN  ........ OPERATIONAL',  c:'a',  d:1700},
    {t:'  NETWORKS/SECURITY  ... OPERATIONAL',  c:'a',  d:1820},
    {t:'',                                       c:'sp', d:1920},
    {t:'! WARNING: IMPRESSIVE CONTENT DETECTED',c:'w',  d:2040},
    {t:'',                                       c:'sp', d:2160},
    {t:'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', c:'d',  d:2280},
    {t:'  SYSTEM READY.  SELECT LANGUAGE.',      c:'a',  d:2440},
    {t:'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', c:'d',  d:2560},
  ] : [
    {t:'MATRIX PORTFOLIO SYSTEM v3.0',          c:'d',  d:0},
    {t:'Connexion sécurisée établie.',            c:'n',  d:180},
    {t:'',                                       c:'sp', d:300},
    {t:'> Montage du système de fichiers...',    c:'n',  d:460},
    {t:'  /accueil/      [PRÊT]',               c:'ok', d:600},
    {t:'  /competences/  [PRÊT]',               c:'ok', d:720},
    {t:'  /projets/      [PRÊT]',               c:'ok', d:840},
    {t:'  /veille/       [PRÊT]',               c:'ok', d:960},
    {t:'  /certifications/[PRÊT]',              c:'ok', d:1080},
    {t:'  /contact/      [PRÊT]',               c:'ok', d:1200},
    {t:'',                                       c:'sp', d:1300},
    {t:'> Vérification des compétences...',      c:'n',  d:1440},
    {t:'  HTML5/CSS3/JS  ....... OPÉRATIONNEL', c:'a',  d:1580},
    {t:'  LINUX/DEBIAN  ........ OPÉRATIONNEL', c:'a',  d:1700},
    {t:'  RÉSEAUX/SÉCU  ........ OPÉRATIONNEL', c:'a',  d:1820},
    {t:'',                                       c:'sp', d:1920},
    {t:'! AVERTISSEMENT : CONTENU IMPRESSIONNANT',c:'w', d:2040},
    {t:'',                                       c:'sp', d:2160},
    {t:'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', c:'d',  d:2280},
    {t:'  SYSTÈME PRÊT.  CHOISISSEZ VOTRE LANGUE.',c:'a',d:2440},
    {t:'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', c:'d',  d:2560},
  ];

  const OFF = 500;
  L.forEach(({t,c,d}) => setTimeout(() => {
    const el = document.createElement('span');
    el.className = `tl ${c}`;
    el.textContent = t;
    inner.insertBefore(el, tcur);
    requestAnimationFrame(() => el.classList.add('v'));
    inner.parentElement.scrollTop = inner.parentElement.scrollHeight;
  }, d + OFF));

  return L.at(-1).d + OFF;
}

function runProgress(start, lang) {
  const S_FR = [
    {p:12, l:'CHARGEMENT DES PAGES...', d:0},
    {p:30, l:'COMPILATION DES SKILLS...', d:300},
    {p:50, l:'IMPORT DES PROJETS...', d:580},
    {p:68, l:'CHIFFREMENT AES-256...', d:840},
    {p:84, l:'RENDU DE L\'INTERFACE...', d:1080},
    {p:96, l:'OPTIMISATION FINALE...', d:1320},
    {p:100,l:'SYSTÈME OPÉRATIONNEL.', d:1560},
  ];
  const S_EN = [
    {p:12, l:'LOADING PAGES...', d:0},
    {p:30, l:'COMPILING SKILLS...', d:300},
    {p:50, l:'IMPORTING PROJECTS...', d:580},
    {p:68, l:'ENCRYPTION AES-256...', d:840},
    {p:84, l:'RENDERING INTERFACE...', d:1080},
    {p:96, l:'FINAL OPTIMISATION...', d:1320},
    {p:100,l:'SYSTEM OPERATIONAL.', d:1560},
  ];
  const S = lang === 'en' ? S_EN : S_FR;

  setTimeout(() => {
    const pw = document.getElementById('pg-w');
    if (pw) pw.classList.add('v');
    S.forEach(({p,l,d}) => setTimeout(() => {
      const f = document.getElementById('pg-fill');
      const t = document.getElementById('pg-n');
      const b = document.getElementById('pg-n2');
      const lb= document.getElementById('pg-lbl');
      const hs= document.getElementById('hud-status');
      if (f)  f.style.width = p + '%';
      if (t)  t.textContent = p + '%';
      if (b)  b.textContent = p + '%';
      if (lb) lb.textContent = l;
      if (p === 100 && hs) { hs.textContent = 'READY'; hs.style.color = '#00ff41'; }
    }, d));
    const last = S.at(-1).d + 700;
    setTimeout(() => {
      const tcur = document.getElementById('tcur');
      const pick = document.getElementById('lang-pick');
      if (tcur) tcur.style.display = 'none';
      if (pick) pick.classList.add('v');
    }, last);
  }, start + 400);
}

/* ────────────────────────────────
   AUTO-INIT
──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const lang = document.documentElement.lang || 'fr';

  // Splash
  if (document.getElementById('splash')) {
    document.body.style.overflow = 'hidden';
    const end = runBoot(lang);
    runProgress(end, lang);
  }

  // Portfolio pages
  if (document.getElementById('typed-text')) {
    const R_FR = ['ÉTUDIANT BTS SIO OPTION B — SLAM','FUTUR INGÉNIEUR EN CYBERSÉCURITÉ','EXPERT RÉSEAUX & SÉCURITÉ','ADMINISTRATEUR SYSTÈMES & RÉSEAUX','// SYSTÈME : EN LIGNE'];
    const R_EN = ['BTS SIO OPTION B — SLAM STUDENT','FUTURE CYBERSECURITY ENGINEER','NETWORKS & SECURITY EXPERT','SYSTEMS & NETWORK ADMINISTRATOR','// SYSTEM : ONLINE'];
    initTypewriter(lang === 'en' ? R_EN : R_FR);
    setTimeout(initDecrypt, 400);
  }
  initReveal();
});

