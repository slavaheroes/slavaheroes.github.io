/* ========================================================
   Win95 Retro Desktop — Client-Side Logic
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initVisitorCounter();
  initWindowControls();
  initCloseJoke();
  initBlogSearch();
  initPostGraph();
});

/* --- Theme Toggle --- */
function initTheme() {
  let saved = 'light';
  try { saved = localStorage.getItem('slava-theme') || 'light'; } catch (e) { }
  applyTheme(saved);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'light';
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  });
}

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('slava-theme', t); } catch (e) { }
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = t === 'light' ? '☾ Dark' : '☀ Light';
  });
}

/* --- Clock --- */
function initClock() {
  const el = document.getElementById('taskbar-clock');
  if (!el) return;
  function tick() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const hh = (h % 12) || 12, ap = h < 12 ? 'AM' : 'PM';
    el.textContent = hh + ':' + String(m).padStart(2, '0') + ' ' + ap;
  }
  tick();
  setInterval(tick, 30000);
}

/* --- Visitor Counter --- */
function initVisitorCounter() {
  const el = document.getElementById('visitor-count');
  if (!el) return;
  try {
    let count = parseInt(localStorage.getItem('slava-visitor-count') || '0', 10);
    if (!sessionStorage.getItem('slava-session-counted')) {
      count += 1;
      localStorage.setItem('slava-visitor-count', String(count));
      sessionStorage.setItem('slava-session-counted', '1');
    }
    el.textContent = String(count).padStart(6, '0');
  } catch (e) { }
}

/* --- Window Controls --- */
function initWindowControls() {
  const win = document.querySelector('.window');
  if (!win) return;

  const btnMin = document.getElementById('btn-minimize');
  const btnMax = document.getElementById('btn-maximize');

  if (btnMin) {
    btnMin.addEventListener('click', () => {
      win.classList.toggle('minimized');
    });
  }
  if (btnMax) {
    btnMax.addEventListener('click', () => {
      win.classList.toggle('maximized');
    });
  }
}

/* --- Close Joke --- */
function initCloseJoke() {
  const btnClose = document.getElementById('btn-close');
  const modal = document.getElementById('close-joke-modal');
  const btnOk = document.getElementById('close-joke-ok');

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.add('visible');
    });
  }
  if (btnOk && modal) {
    btnOk.addEventListener('click', () => {
      modal.classList.remove('visible');
    });
  }
}

/* --- Blog Search & Tag Filter --- */
function initBlogSearch() {
  const searchInput = document.getElementById('blog-search');
  const postCards = document.querySelectorAll('.post-card');
  const tagChips = document.querySelectorAll('.tag-chip');
  const modeBtns = document.querySelectorAll('.filter-mode__btn');
  const resultCount = document.getElementById('result-count');
  const noResults = document.getElementById('no-results');

  if (!searchInput || postCards.length === 0) return;

  const activeTags = new Set();
  let mode = 'any';

  // Per-card exact tag tokens (tags may contain spaces, never commas)
  const cardTags = new Map();
  postCards.forEach(card => {
    const tokens = (card.dataset.tags || '')
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
    cardTags.set(card, tokens);
  });

  // Tag chips: multi-select toggles
  tagChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag.trim().toLowerCase();
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        chip.classList.remove('active');
      } else {
        activeTags.add(tag);
        chip.classList.add('active');
      }
      filterPosts();
    });
  });

  // ANY / ALL match mode
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (mode === btn.dataset.mode) return;
      mode = btn.dataset.mode;
      modeBtns.forEach(b => b.classList.toggle('active', b === btn));
      filterPosts();
    });
  });

  // Search input
  searchInput.addEventListener('input', filterPosts);

  function filterPosts() {
    const q = searchInput.value.trim().toLowerCase();
    const selected = [...activeTags];
    const visibleUrls = new Set();
    let visible = 0;

    postCards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const teaser = (card.dataset.teaser || '').toLowerCase();
      const tokens = cardTags.get(card);

      const tagOk = selected.length === 0 || (mode === 'any'
        ? selected.some(t => tokens.includes(t))
        : selected.every(t => tokens.includes(t)));
      const qOk = !q || title.includes(q) || teaser.includes(q) || tokens.join(', ').includes(q);

      if (tagOk && qOk) {
        card.style.display = '';
        visibleUrls.add(card.getAttribute('href'));
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    if (resultCount) {
      resultCount.textContent = visible === postCards.length
        ? postCards.length + ' posts'
        : visible + ' of ' + postCards.length + ' posts';
    }
    if (noResults) {
      noResults.style.display = visible === 0 ? '' : 'none';
    }

    document.dispatchEvent(new CustomEvent('blog:filter', {
      detail: { visibleUrls: visible === postCards.length ? null : visibleUrls }
    }));
  }
}

/* --- Graph of the Blog --- */
function initPostGraph() {
  const dataEl = document.getElementById('post-graph-data');
  const canvas = document.getElementById('graph-canvas');
  const svg = document.getElementById('graph-svg');
  const tooltip = document.getElementById('graph-tooltip');
  const legend = document.getElementById('graph-legend');
  const toggle = document.getElementById('graph-toggle');
  const body = document.getElementById('graph-body');
  if (!dataEl || !canvas || !svg) return;

  let posts;
  try { posts = JSON.parse(dataEl.textContent); } catch (e) { return; }
  posts.forEach(p => {
    p.tags = p.tags || [];
    p.keywords = p.keywords || [];
  });

  const W = 640, H = 380, PAD_X = 60, PAD_Y = 42;
  const n = posts.length;
  if (n === 0) return;

  // --- Collapse / expand, persisted ---
  if (toggle && body) {
    let open = false;
    try { open = localStorage.getItem('slava-graph-open') === '1'; } catch (e) { }
    const arrow = toggle.querySelector('.graph-panel__arrow');
    const hint = toggle.querySelector('.graph-panel__hint');
    function render() {
      body.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (arrow) arrow.textContent = open ? '▾' : '▸';
      if (hint) hint.textContent = open ? 'hide' : 'show';
    }
    toggle.addEventListener('click', () => {
      open = !open;
      try { localStorage.setItem('slava-graph-open', open ? '1' : '0'); } catch (e) { }
      render();
    });
    render();
  }

  // --- Edges: posts sharing >= 1 keyword ---
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const kwJ = posts[j].keywords.map(k => k.trim().toLowerCase());
      const shared = posts[i].keywords.filter(k => kwJ.includes(k.trim().toLowerCase()));
      if (shared.length > 0) edges.push({ a: i, b: j, weight: shared.length, shared });
    }
  }

  // --- Deterministic force layout ---
  // Each connected component is laid out with its own Fruchterman-Reingold
  // pass, then fitted into a horizontal slice of the canvas sized by node
  // count — otherwise inter-component repulsion crushes each cluster into
  // a corner of the shared frame.
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const comp = new Array(n).fill(-1);
  let nComp = 0;
  for (let s = 0; s < n; s++) {
    if (comp[s] !== -1) continue;
    const stack = [s];
    comp[s] = nComp;
    while (stack.length) {
      const u = stack.pop();
      edges.forEach(e => {
        const v = e.a === u ? e.b : (e.b === u ? e.a : -1);
        if (v !== -1 && comp[v] === -1) { comp[v] = nComp; stack.push(v); }
      });
    }
    nComp++;
  }
  const components = [];
  for (let c = 0; c < nComp; c++) {
    components.push(posts.map((_, i) => i).filter(i => comp[i] === c));
  }
  components.sort((a, b) => b.length - a.length);

  const rng = mulberry32(20260706);
  const pos = new Array(n);
  const usableW = W - 2 * PAD_X, usableH = H - 2 * PAD_Y;

  // --- 2D elliptical placement of component centers ---
  // Sort so the largest component is first (already done above).
  // Place each component's center on an ellipse around the canvas center.
  // This prevents clusters from overlapping and staggers Y so labels don't
  // collide horizontally.
  const C = components.length;
  const centerX = W / 2, centerY = H / 2;
  // Radius of the placement ellipse — shrink when few components so nodes
  // don't hug the edges; grow when many so they don't overlap.
  const rx = Math.min(usableW * 0.35, usableW * 0.18 * C);
  const ry = Math.min(usableH * 0.30, usableH * 0.16 * C);

  components.forEach((idx, c) => {
    const cnt = idx.length;
    // Angle on the ellipse (start from top, go clockwise)
    const angle = (c / C) * 2 * Math.PI - Math.PI / 2;
    const cx = centerX + rx * Math.cos(angle);
    const cy = centerY + ry * Math.sin(angle);

    if (cnt === 1) {
      pos[idx[0]] = { x: cx, y: cy };
      return;
    }

    // Square bounding box sized by node count, capped to avoid overflow
    const boxSize = Math.min(usableW * 0.45, usableH * 0.55,
      Math.max(80, 60 * Math.sqrt(cnt)));
    const boxW = boxSize, boxH = boxSize;
    const bx = cx - boxW / 2, by = cy - boxH / 2;

    const p = idx.map((_, k) => {
      const a2 = (k / cnt) * 2 * Math.PI;
      return {
        x: 100 * Math.cos(a2) + (rng() - 0.5) * 30,
        y: 100 * Math.sin(a2) + (rng() - 0.5) * 30
      };
    });
    const local = new Map(idx.map((gi, k) => [gi, k]));
    const es = edges.filter(e => local.has(e.a) && local.has(e.b))
      .map(e => ({ a: local.get(e.a), b: local.get(e.b), weight: e.weight }));
    const K = Math.sqrt((boxW * boxH) / cnt) * 1.2; // slightly more repulsion
    const ITER = 250;
    for (let it = 0; it < ITER; it++) {
      const temp = 60 * (1 - it / ITER);
      const disp = p.map(() => ({ x: 0, y: 0 }));
      for (let i = 0; i < cnt; i++) {
        for (let j = i + 1; j < cnt; j++) {
          const dx = p[i].x - p[j].x, dy = p[i].y - p[j].y;
          const d = Math.max(Math.hypot(dx, dy), 0.01);
          const f = (K * K) / d;
          disp[i].x += (dx / d) * f; disp[i].y += (dy / d) * f;
          disp[j].x -= (dx / d) * f; disp[j].y -= (dy / d) * f;
        }
      }
      es.forEach(e => {
        const dx = p[e.a].x - p[e.b].x, dy = p[e.a].y - p[e.b].y;
        const d = Math.max(Math.hypot(dx, dy), 0.01);
        const f = (d * d) / K * (0.5 + 0.25 * e.weight);
        disp[e.a].x -= (dx / d) * f; disp[e.a].y -= (dy / d) * f;
        disp[e.b].x += (dx / d) * f; disp[e.b].y += (dy / d) * f;
      });
      for (let i = 0; i < cnt; i++) {
        disp[i].x += -p[i].x * 0.03;
        disp[i].y += -p[i].y * 0.03;
        const d = Math.max(Math.hypot(disp[i].x, disp[i].y), 0.01);
        const step = Math.min(d, temp);
        p[i].x += (disp[i].x / d) * step;
        p[i].y += (disp[i].y / d) * step;
      }
    }
    // Fit the settled component into its bounding box
    const xs = p.map(q => q.x), ys = p.map(q => q.y);
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    const spanX = Math.max(maxX - minX, 1), spanY = Math.max(maxY - minY, 1);
    const s = Math.min(boxW / spanX, boxH / spanY) * 0.85; // slight padding
    const offX = bx + (boxW - spanX * s) / 2;
    const offY = by + (boxH - spanY * s) / 2;
    idx.forEach((gi, k) => {
      pos[gi] = { x: offX + (p[k].x - minX) * s, y: offY + (p[k].y - minY) * s };
    });
  });

  // --- Post-placement: enforce minimum distance between all nodes ---
  // Push apart any nodes that ended up too close (e.g. singletons near clusters)
  const MIN_DIST = 55;
  for (let pass = 0; pass < 20; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
        const d = Math.hypot(dx, dy);
        if (d < MIN_DIST && d > 0.01) {
          const push = (MIN_DIST - d) / 2 + 1;
          const nx = (dx / d) * push, ny = (dy / d) * push;
          pos[i].x += nx; pos[i].y += ny;
          pos[j].x -= nx; pos[j].y -= ny;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  // Clamp to canvas
  for (let i = 0; i < n; i++) {
    pos[i].x = Math.max(PAD_X, Math.min(W - PAD_X, pos[i].x));
    pos[i].y = Math.max(PAD_Y, Math.min(H - PAD_Y, pos[i].y));
  }

  // --- Color groups: first tag -> palette slot ---
  const GROUP_SLOTS = { projects: 1, reviews: 2 };
  const groups = new Map(); // group key -> { name, slot }
  posts.forEach(p => {
    const g = p.tags[0] || 'Other';
    const key = g.trim().toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { name: g, slot: GROUP_SLOTS[key] || 3 });
    }
  });

  // --- Render edges ---
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const edgeEls = edges.map(e => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', pos[e.a].x.toFixed(1));
    line.setAttribute('y1', pos[e.a].y.toFixed(1));
    line.setAttribute('x2', pos[e.b].x.toFixed(1));
    line.setAttribute('y2', pos[e.b].y.toFixed(1));
    line.setAttribute('stroke-width', String(1 + 0.75 * e.weight));
    line.setAttribute('stroke-opacity', String(Math.min(0.55 + 0.1 * e.weight, 0.9)));
    svg.appendChild(line);
    return line;
  });

  // --- Render nodes ---
  function shortLabel(title) {
    if (title.length <= 22) return title;
    const cut = title.slice(0, 22);
    const sp = cut.lastIndexOf(' ');
    return (sp > 10 ? cut.slice(0, sp) : cut) + '…';
  }
  const nodeEls = posts.map((p, i) => {
    const a = document.createElement('a');
    a.className = 'graph-node';
    a.href = p.url;
    a.dataset.slot = String(groups.get((p.tags[0] || 'Other').trim().toLowerCase()).slot);
    a.style.left = (pos[i].x / W * 100).toFixed(2) + '%';
    a.style.top = (pos[i].y / H * 100).toFixed(2) + '%';
    const dot = document.createElement('span');
    dot.className = 'graph-node__dot';
    const label = document.createElement('span');
    label.className = 'graph-node__label';
    label.textContent = shortLabel(p.title);
    a.appendChild(dot);
    a.appendChild(label);
    canvas.appendChild(a);
    return a;
  });

  // --- Legend ---
  if (legend) {
    const note = legend.querySelector('.graph-legend__note');
    [...groups.values()].sort((a, b) => a.slot - b.slot).forEach(g => {
      const item = document.createElement('span');
      item.className = 'graph-legend__item';
      const dot = document.createElement('span');
      dot.className = 'graph-legend__dot';
      dot.dataset.slot = String(g.slot);
      item.appendChild(dot);
      item.appendChild(document.createTextNode(g.name.toUpperCase()));
      legend.insertBefore(item, note);
    });
  }

  // --- Hover / focus: highlight neighbors, dim the rest, tooltip ---
  const neighborsOf = posts.map((_, i) => {
    const map = new Map(); // neighbor index -> shared keywords
    edges.forEach(e => {
      if (e.a === i) map.set(e.b, e.shared);
      if (e.b === i) map.set(e.a, e.shared);
    });
    return map;
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function showTooltip(i) {
    if (!tooltip) return;
    const p = posts[i];
    let html = '<span class="graph-tooltip__title">' + escapeHtml(p.title) + '</span>' +
      ' <span class="graph-tooltip__date">· ' + escapeHtml(p.date) + '</span>';
    const nb = neighborsOf[i];
    if (nb.size > 0) {
      nb.forEach((shared, j) => {
        html += '<div class="graph-tooltip__shared">↔ ' + escapeHtml(posts[j].title) +
          ': <em>' + escapeHtml(shared.join(', ')) + '</em></div>';
      });
    } else if (p.keywords.length > 0) {
      html += '<div class="graph-tooltip__shared">Keywords: <em>' + escapeHtml(p.keywords.join(', ')) + '</em></div>';
    }
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const nx = pos[i].x / W * cw, ny = pos[i].y / H * ch;
    tooltip.style.left = '';
    tooltip.style.right = '';
    tooltip.style.top = '';
    tooltip.style.bottom = '';
    if (pos[i].x > W * 0.62) tooltip.style.right = (cw - nx + 14) + 'px';
    else tooltip.style.left = (nx + 14) + 'px';
    if (pos[i].y > H * 0.68) tooltip.style.bottom = (ch - ny + 10) + 'px';
    else tooltip.style.top = (ny + 10) + 'px';
  }

  function highlight(i) {
    const nb = neighborsOf[i];
    nodeEls.forEach((el, j) => {
      el.classList.toggle('is-active', j === i);
      el.classList.toggle('is-neighbor', nb.has(j));
      el.classList.toggle('is-dim', j !== i && !nb.has(j));
    });
    edges.forEach((e, k) => {
      const hot = e.a === i || e.b === i;
      edgeEls[k].classList.toggle('edge--hot', hot);
      edgeEls[k].classList.toggle('is-dim', !hot);
    });
    showTooltip(i);
  }

  function clearHighlight() {
    nodeEls.forEach(el => el.classList.remove('is-active', 'is-neighbor', 'is-dim'));
    edgeEls.forEach(el => el.classList.remove('edge--hot', 'is-dim'));
    if (tooltip) tooltip.hidden = true;
  }

  nodeEls.forEach((el, i) => {
    el.addEventListener('mouseenter', () => highlight(i));
    el.addEventListener('mouseleave', clearHighlight);
    el.addEventListener('focus', () => highlight(i));
    el.addEventListener('blur', clearHighlight);
  });

  // --- Sync with blog tag/search filter ---
  document.addEventListener('blog:filter', e => {
    const visible = e.detail.visibleUrls; // null = everything visible
    const hidden = nodeEls.map((el, i) => visible !== null && !visible.has(posts[i].url));
    nodeEls.forEach((el, i) => el.classList.toggle('is-filtered', hidden[i]));
    edges.forEach((ed, k) => {
      edgeEls[k].classList.toggle('is-filtered', hidden[ed.a] || hidden[ed.b]);
    });
  });
}
