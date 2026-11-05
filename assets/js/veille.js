/* ══════════════════════════════════════════════════════════════
   VEILLE EN DIRECT — IA et cybersécurité
   Lit assets/data/veille.json (produit toutes les heures par
   outils/veille.py via GitHub Actions) et l'affiche dans #veille-live.
   Trois onglets : IA & cyber · Failles exploitées (CISA KEV) · Toute l'actu.
   Bilingue : la langue vient de <html lang="fr|en">.
   ══════════════════════════════════════════════════════════════ */
(function () {
  const box = document.getElementById('veille-live');
  if (!box) return;

  const EN = document.documentElement.lang === 'en';
  const T = EN ? {
    tabs: { ia: 'AI & CYBERSECURITY', kev: 'EXPLOITED FLAWS (CISA KEV)', all: 'ALL NEWS' },
    search: 'Filter: CVE, vendor, keyword…', maj: 'Updated', next: 'refreshed every hour',
    none: 'No item matches.', loading: '// LOADING FEEDS…', err: '// FEEDS UNAVAILABLE FOR NOW — try again later.',
    due: 'Patch deadline (US federal)', ransom: 'USED BY RANSOMWARE', ai: 'AI', flaw: 'VULN',
    sources: 'Sources', ok: 'online', ko: 'unreachable', more: 'Show more', subscribe: 'Subscribe',
    rss: 'My AI & cyber RSS feed', opml: 'All sources (OPML, for Feedly / Inoreader)',
    count: (n, w) => `${n} items · last ${w} days`, ago: m => m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`,
  } : {
    tabs: { ia: 'IA & CYBERSÉCURITÉ', kev: 'FAILLES EXPLOITÉES (CISA KEV)', all: 'TOUTE L\'ACTU' },
    search: 'Filtrer : CVE, éditeur, mot-clé…', maj: 'Mis à jour', next: 'actualisé toutes les heures',
    none: 'Aucun élément ne correspond.', loading: '// CHARGEMENT DES FLUX…', err: '// FLUX INDISPONIBLES POUR LE MOMENT — réessaie plus tard.',
    due: 'Date limite de correction (agences US)', ransom: 'UTILISÉE PAR DES RANÇONGICIELS', ai: 'IA', flaw: 'FAILLE',
    sources: 'Sources', ok: 'en ligne', ko: 'injoignable', more: 'Afficher plus', subscribe: 'S\'abonner',
    rss: 'Mon flux RSS IA & cyber', opml: 'Toutes les sources (OPML, pour Feedly / Inoreader)',
    count: (n, w) => `${n} éléments · ${w} derniers jours`, ago: m => m < 60 ? `il y a ${m} min` : `il y a ${Math.round(m / 60)} h`,
  };

  const BASE = '../assets/data/';
  const RAW = 'https://raw.githubusercontent.com/Yuung404/Yuung-Portfolio/main/assets/data/';
  const PAS = 12;
  let data = null, onglet = 'ia', filtre = '', limite = PAS;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lienSur = u => /^https?:\/\//i.test(u) ? u : '#';
  const fmt = iso => new Date(iso).toLocaleDateString(EN ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtH = iso => new Date(iso).toLocaleString(EN ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  async function charger() {
    for (const url of [BASE + 'veille.json', RAW + 'veille.json']) {
      try {
        const r = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) return await r.json();
      } catch (e) { /* on essaie l'adresse suivante */ }
    }
    return null;
  }

  function carteArticle(a) {
    const tags = (a.tags || []).map(t => `<span class="vlv-tag ${t === 'ia' ? 'ia' : 'flaw'}">${t === 'ia' ? T.ai : T.flaw}</span>`).join('');
    const cves = (a.cve || []).map(c => `<span class="vlv-cve">${esc(c)}</span>`).join('');
    return `<a class="card vl-card vlv-card" href="${esc(lienSur(a.lien))}" target="_blank" rel="noopener noreferrer">
      <div class="vl-date">// ${esc(fmt(a.date))} ${tags}</div>
      <h3 class="vl-topic">${esc(a.titre)}</h3>
      <div class="vl-src">// ${esc(a.source)}${a.langue === 'fr' ? ' · FR' : ''}</div>
      ${a.resume ? `<p class="vl-txt">${esc(a.resume)}</p>` : ''}
      ${cves ? `<div class="vlv-cves">${cves}</div>` : ''}
    </a>`;
  }

  function carteKev(k) {
    return `<a class="card vl-card vlv-card vlv-kev" href="${esc(lienSur(k.lien))}" target="_blank" rel="noopener noreferrer">
      <div class="vl-date">// ${esc(fmt(k.date))} ${k.ia ? `<span class="vlv-tag ia">${T.ai}</span>` : ''}${k.rancongiciel ? `<span class="vlv-tag ransom">${T.ransom}</span>` : ''}</div>
      <h3 class="vl-topic"><span class="vlv-cve big">${esc(k.cve)}</span> ${esc(k.editeur)} — ${esc(k.produit)}</h3>
      <div class="vl-src">// ${esc(k.nom)}</div>
      <p class="vl-txt">${esc(k.description)}</p>
      ${k.echeance ? `<div class="vlv-due">${T.due} : ${esc(fmt(k.echeance))}</div>` : ''}
    </a>`;
  }

  function liste() {
    const q = filtre.trim().toLowerCase();
    let items;
    if (onglet === 'kev') items = data.kev.map(k => ({ k, txt: [k.cve, k.editeur, k.produit, k.nom, k.description].join(' ') }));
    else items = data.articles.filter(a => onglet === 'all' || (a.tags || []).includes('ia'))
      .map(a => ({ a, txt: [a.titre, a.resume, a.source, (a.cve || []).join(' ')].join(' ') }));
    if (q) items = items.filter(i => i.txt.toLowerCase().includes(q));
    return items;
  }

  function rendu() {
    const items = liste();
    const n = { ia: data.compteurs.ia, kev: data.compteurs.kev, all: data.compteurs.articles };
    const minutes = Math.max(0, Math.round((Date.now() - new Date(data.genere_le)) / 60000));
    const sources = data.sources.map(s =>
      `<a class="vlv-src ${s.ok ? 'ok' : 'ko'}" href="${esc(lienSur(s.site))}" target="_blank" rel="noopener noreferrer" title="${s.ok ? T.ok : T.ko}">
        <span class="ldot"></span>${esc(s.nom)} <b>${s.nb}</b></a>`).join('');

    box.innerHTML = `
      <div class="vlv-head">
        <div class="vlv-live"><span class="ldot"></span>LIVE · ${T.maj} ${esc(fmtH(data.genere_le))} (${T.ago(minutes)}) · ${T.next}</div>
        <div class="vlv-sub">${T.subscribe} :
          <a href="${BASE}veille-ia-cyber.xml" target="_blank" rel="noopener">◉ ${T.rss}</a>
          <a href="${BASE}veille-sources.opml" download>⇩ ${T.opml}</a>
        </div>
      </div>
      <div class="vlv-tabs" role="tablist">
        ${Object.keys(T.tabs).map(k => `<button role="tab" aria-selected="${k === onglet}" class="vlv-tab${k === onglet ? ' on' : ''}" data-t="${k}">${T.tabs[k]} <b>${n[k]}</b></button>`).join('')}
      </div>
      <input class="vlv-search" type="search" placeholder="${T.search}" value="${esc(filtre)}" aria-label="${T.search}">
      <div class="vlv-count">${T.count(items.length, data.fenetre_jours)}</div>
      <div class="vl-grid vlv-grid">
        ${items.length ? items.slice(0, limite).map(i => i.k ? carteKev(i.k) : carteArticle(i.a)).join('') : `<p class="vlv-empty">${T.none}</p>`}
      </div>
      ${items.length > limite ? `<div class="vlv-more"><button class="btn btn-g btn-sm">${T.more} (${items.length - limite})</button></div>` : ''}
      <div class="vlv-sources"><span>${T.sources} :</span>${sources}</div>`;

    box.querySelectorAll('.vlv-tab').forEach(b => b.onclick = () => { onglet = b.dataset.t; limite = PAS; rendu(); });
    const champ = box.querySelector('.vlv-search');
    champ.oninput = () => {
      filtre = champ.value; limite = PAS;
      const pos = champ.selectionStart; rendu();
      const c = box.querySelector('.vlv-search'); c.focus(); c.setSelectionRange(pos, pos);
    };
    const plus = box.querySelector('.vlv-more button');
    if (plus) plus.onclick = () => { limite += PAS; rendu(); };
  }

  async function demarrer() {
    if (!data) box.innerHTML = `<p class="vlv-empty">${T.loading}</p>`;
    const d = await charger();
    if (d) { data = d; rendu(); }
    else if (!data) box.innerHTML = `<p class="vlv-empty">${T.err}</p>`;
  }

  demarrer();
  setInterval(() => { if (!document.hidden && document.activeElement?.className !== 'vlv-search') demarrer(); }, 10 * 60 * 1000);
})();
