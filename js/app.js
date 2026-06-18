// ── Modal ────────────────────────────────────────────────────────────────────
const overlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');

function openModal(item) {
  const d = item.detail;
  const tagClass = 'tag-' + item.kind;

  const calcSteps = (d.calcul || []).map((s, i) =>
    `<li><strong>${i + 1}.</strong> ${s}</li>`
  ).join('');

  const signaux = (d.signaux || []).map(s => `<li>${s}</li>`).join('');

  const params = (d.parametres || []).map(p =>
    `<div class="param-item"><span class="param-key">${p.p}</span><span class="param-desc">${p.d}</span></div>`
  ).join('');

  const erreurs = (d.erreurs || []).map(e => `<li>${e}</li>`).join('');

  const pine = d.pine
    ? `<div class="modal-section full">
        <div class="modal-section-head vio">Pine Script (TradingView)</div>
        <div class="pinescript-box">${escHtml(d.pine)}</div>
       </div>`
    : '';

  modalBody.innerHTML = `
    <div class="modal-topbar">
      <button class="modal-close" onclick="closeModal()" aria-label="Fermer">&#x2715;</button>
      <div class="modal-title-area">
        <div class="modal-num">INDICATEUR ${String(item.num).padStart(2,'0')}</div>
        <div class="modal-title">${item.title}</div>
      </div>
      <span class="tag ${tagClass}">${item.tag}</span>
    </div>
    <div class="modal-body">
      <div class="modal-chart">${getSchema(item.schema)}</div>
      <div class="modal-content">
        <div class="modal-section">
          <div class="modal-section-head">Principe</div>
          <p>${d.principe}</p>
        </div>
        <div class="modal-section">
          <div class="modal-section-head amber">Formule</div>
          <div class="formula-box">${escHtml(d.formule)}</div>
        </div>
        <div class="modal-section full">
          <div class="modal-section-head bull">Calcul étape par étape</div>
          <ol>${calcSteps}</ol>
        </div>
        <div class="modal-section full">
          <div class="modal-section-head">Signaux &amp; Utilisation</div>
          <ul>${signaux}</ul>
        </div>
        <div class="modal-section">
          <div class="modal-section-head amber">Paramètres</div>
          <div class="param-grid">${params}</div>
        </div>
        <div class="modal-section">
          <div class="modal-section-head bear">Erreurs courantes</div>
          <ul>${erreurs}</ul>
        </div>
        ${pine}
      </div>
    </div>`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Card rendering ────────────────────────────────────────────────────────────
function renderCards(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  data.forEach(item => {
    if (item.section) {
      const band = document.createElement('div');
      band.className = 'section-band';
      band.innerHTML = `<div class="section-band-accent"></div><div class="section-band-inner"><h2>${item.title}</h2><p>${item.desc}</p></div>`;
      container.appendChild(band);
      return;
    }
    const card = document.createElement('div');
    card.className = 'ind-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', item.title);

    const principeList = (item.principe || []).map(p => `<li>${p}</li>`).join('');
    const tagClass = 'tag-' + item.kind;

    card.innerHTML = `
      <div class="ind-schema">${getSchema(item.schema)}</div>
      <div class="ind-card-right">
        <div class="ind-card-head">
          <span class="ind-num">${String(item.num).padStart(2,'0')}</span>
          <h3>${item.title}</h3>
          <span class="tag ${tagClass}">${item.tag}</span>
        </div>
        <div class="ind-principe"><ul>${principeList}</ul></div>
        <div class="ind-usage">${item.usage}</div>
        <span class="ind-cta">Voir la description détaillée &#8594;</span>
      </div>`;

    card.addEventListener('click', () => openModal(item));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(item); });
    container.appendChild(card);
  });
}

// ── Section data helpers ──────────────────────────────────────────────────────
function withSections(items, sections) {
  const result = [];
  sections.forEach(s => {
    result.push({ section: true, title: s.title, desc: s.desc });
    items.filter(i => s.ids.includes(i.id)).forEach(i => result.push(i));
  });
  return result;
}

// ── Page init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  // Highlight active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href === location.href) link.classList.add('active');
  });

  if (page === 'indicateurs') {
    const sections = [
      { title: 'Les moyennes mobiles', desc: 'Lisser le prix pour dégager la tendance et générer des signaux de croisement.', ids: ['sma','ema','cross'] },
      { title: 'Bandes, canaux &amp; VWAP', desc: 'Encadrer le prix, mesurer la volatilité et situer le prix moyen pondéré.', ids: ['boll','keltner','vwap'] },
      { title: 'Les oscillateurs de momentum', desc: 'Mesurer la vitesse et les excès du mouvement dans une fenêtre séparée.', ids: ['rsi','macd','stoch'] },
      { title: 'Force de tendance &amp; suivi', desc: 'Évaluer la solidité d\'une tendance et coller au prix avec un stop suiveur.', ids: ['atr','adx','supertrend'] },
      { title: 'Systèmes &amp; méthode', desc: 'Indicateurs tout-en-un et comment bien les combiner sans redondance.', ids: ['ichimoku','sar','combine'] }
    ];
    renderCards(withSections(INDICATEURS, sections), 'cards');
  }

  if (page === 'figures') {
    const sections = [
      { title: 'Les triangles', desc: 'La fourchette de prix se resserre. La cassure d\'une ligne donne le signal.', ids: ['tri_asc','tri_desc','tri_sym'] },
      { title: 'Les canaux', desc: 'Le prix oscille entre deux droites parallèles. On joue les rebonds ; la cassure clôt le canal.', ids: ['canal_h','canal_b','range'] },
      { title: 'Les retournements', desc: 'Elles signent la fin d\'une tendance. La cassure de la ligne de cou déclenche le signal.', ids: ['hs','hs_inv','double_top','double_bot'] },
      { title: 'Les biseaux (wedges)', desc: 'Deux lignes inclinées dans le même sens qui convergent. La cassure va à l\'inverse de la pente.', ids: ['wedge_r','wedge_f'] },
      { title: 'Drapeaux &amp; fanions', desc: 'Brève pause après un mouvement violent. Figures de continuation rapides et fiables.', ids: ['bull_flag','bear_flag','pennant'] }
    ];
    renderCards(withSections(FIGURES, sections), 'cards');
  }

  if (page === 'smc') {
    const sections = [
      { title: 'Structure de marché', desc: 'La base : lire la tendance via les sommets et creux, et repérer ses ruptures.', ids: ['structure','bos','choch'] },
      { title: 'La liquidité', desc: 'Le carburant du marché : le prix chasse les stops avant de partir dans la vraie direction.', ids: ['liquidity','sweep','inducement'] },
      { title: 'Les zones institutionnelles', desc: 'Les empreintes laissées par les gros ordres : zones de retour privilégiées du prix.', ids: ['ob_bull','ob_bear','breaker','mitigation'] },
      { title: 'Les déséquilibres', desc: 'Quand le prix se déplace trop vite, il laisse des vides qu\'il tend à venir combler.', ids: ['fvg','displacement','void_'] },
      { title: 'Premium / Discount &amp; synthèse', desc: 'Acheter "pas cher", vendre "cher", puis assembler le tout en un modèle d\'exécution.', ids: ['premium','model'] }
    ];
    renderCards(withSections(SMC, sections), 'cards');
  }
});
