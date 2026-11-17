/* Uba Heladería Artesanal: interacción y movimiento.
   Todo el contenido se lee sin este archivo; aquí solo se suma lo vivo. */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA = 'https://wa.me/573244838484?text=';

const FRUITS = {
  fresa: { disc: 'var(--banano)', one: 'fresa', many: 'fresas', fact: 'Helado cremoso de fresa vestido con una capa fina de chocolate. Casi siempre es la primera que desaparece del vaso.' },
  mora: { disc: 'var(--lulo)', one: 'mora', many: 'moras', fact: 'Helado de mora con su textura de granitos y el ácido justo para equilibrar el chocolate.' },
  mango: { disc: 'var(--vino)', one: 'mango', many: 'mangos', fact: 'Mango maduro hecho helado y devuelto a su forma, con la cara cortada para que se note por dentro.' },
  banano: { disc: 'var(--fresa)', one: 'banano', many: 'bananos', fact: 'Banano cremoso de punta a punta, curvo como el de verdad y el más suave del vaso.' },
  lulo: { disc: 'var(--mango)', one: 'lulo', many: 'lulos', fact: 'Lulo bien colombiano: verde por dentro, ácido y fresco, para cortar lo dulce.' },
};
const MAX = 8;

/* ---------- 1. Aparición por secciones (una sola vez) ---------- */
(() => {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  // las fotos que se abren como persiana arrancan un poco antes de entrar
  const early = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); early.unobserve(e.target); }
  }, { rootMargin: '0px 0px 20% 0px' });
  document.querySelectorAll('.shutter[data-reveal]').forEach((el) => early.observe(el));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  // red de seguridad: nada se queda escondido
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

/* ---------- 2. La foto principal del inicio cambia despacio ---------- */
(() => {
  const box = document.querySelector('[data-fade]');
  if (!box || reduced) return;
  const imgs = [...box.querySelectorAll('img')];
  let i = 0;
  let timer = null;
  const next = () => {
    const cur = imgs[i];
    i = (i + 1) % imgs.length;
    const nxt = imgs[i];
    const go = () => { cur.classList.remove('is-on'); nxt.classList.add('is-on'); };
    if (nxt.complete) go(); else nxt.addEventListener('load', go, { once: true });
  };
  const start = () => { if (!timer) timer = setInterval(next, 5600); };
  const stop = () => { clearInterval(timer); timer = null; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
})();

/* ---------- 3. Elige tu frutica ---------- */
const showcase = (() => {
  const section = document.querySelector('#fruticas');
  if (!section) return null;
  const buttons = [...section.querySelectorAll('[data-fruit]')];
  const specs = Object.fromEntries([...section.querySelectorAll('[data-spec]')].map((s) => [s.dataset.spec, s]));
  const nameEl = section.querySelector('[data-fact-name]');
  const textEl = section.querySelector('[data-fact-text]');
  const addBtn = section.querySelector('[data-add]');
  const note = section.querySelector('[data-fact-note]');
  let current = 'fresa';
  let touched = false;

  const select = (key, fromUser) => {
    if (key === current) return;
    if (fromUser) touched = true;
    const out = specs[current];
    const inn = specs[key];
    current = key;
    section.style.setProperty('--disc', FRUITS[key].disc);
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fruit === key)));
    nameEl.textContent = key;
    textEl.textContent = FRUITS[key].fact;
    addBtn.dataset.add = key;
    addBtn.textContent = key === 'fresa' || key === 'mora' ? 'Ponla en tu vaso' : 'Ponlo en tu vaso';
    note.textContent = '';

    if (reduced) { out.classList.remove('is-on'); inn.classList.add('is-on'); return; }
    out.animate([
      { opacity: 1, transform: 'translateY(0) rotate(0deg) scale(1)' },
      { opacity: 0, transform: 'translateY(-6%) rotate(-10deg) scale(0.86)' },
    ], { duration: 240, easing: 'cubic-bezier(0.55,0.055,0.675,0.19)', fill: 'forwards' });
    setTimeout(() => {
      if (out !== specs[current]) out.classList.remove('is-on');
      out.getAnimations().forEach((a) => a.cancel());
    }, 250);
    inn.classList.add('is-on');
    inn.animate([
      { opacity: 0, transform: 'translateY(18%) rotate(14deg) scale(0.8)' },
      { opacity: 1, transform: 'translateY(0) rotate(0deg) scale(1)' },
    ], { duration: 820, delay: 140, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'backwards' });
    [nameEl, textEl].forEach((el, k) => el.animate([
      { opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' },
    ], { duration: 500, delay: 120 + k * 70, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'backwards' }));
  };

  buttons.forEach((b) => b.addEventListener('click', () => select(b.dataset.fruit, true)));

  // Mientras nadie toca, las fruticas se presentan solas (solo si la sección está a la vista)
  if (!reduced && 'IntersectionObserver' in window) {
    const order = Object.keys(FRUITS);
    let timer = null;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !touched) {
        timer = timer || setInterval(() => {
          if (touched || document.hidden) return;
          select(order[(order.indexOf(current) + 1) % order.length], false);
        }, 3600);
      } else { clearInterval(timer); timer = null; }
    }, { threshold: 0.45 });
    io.observe(section);
    section.addEventListener('pointerenter', () => { touched = true; });
    section.addEventListener('focusin', () => { touched = true; });
  }

  addBtn.addEventListener('click', () => {
    const key = addBtn.dataset.add;
    const ok = builder && builder.add(key);
    const total = builder ? builder.total() : 0;
    note.textContent = ok ? `Listo, ya va en tu vaso (${total} de ${MAX}).` : `Tu vaso ya está lleno (${MAX} de ${MAX}).`;
  });
  return { select };
})();

/* ---------- 4. Arma tu vaso ---------- */
const builder = (() => {
  const layer = document.querySelector('[data-cup-fruits]');
  if (!layer) return null;
  const NS = 'http://www.w3.org/2000/svg';
  // posiciones dentro del vaso: centro x, centro y, giro, ancho
  const SLOTS = [
    [126, 140, -14, 118], [212, 132, 6, 122], [298, 142, 16, 118], [168, 92, -22, 110],
    [258, 88, 20, 110], [92, 108, -34, 100], [330, 106, 30, 100], [212, 52, -4, 112],
  ];
  const seq = [];
  const counts = Object.fromEntries(Object.keys(FRUITS).map((k) => [k, 0]));
  const status = document.querySelector('[data-status]');
  const order = document.querySelector('[data-order]');
  const desc = document.querySelector('[data-cup-desc]');

  const makeSlot = (key, i) => {
    const [cx, cy, rot, w] = SLOTS[i];
    const h = w * 1.2;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'slot');
    const use = document.createElementNS(NS, 'use');
    use.setAttribute('href', `#f-${key}`);
    use.setAttribute('x', String(cx - w / 2));
    use.setAttribute('y', String(cy - h / 2));
    use.setAttribute('width', String(w));
    use.setAttribute('height', String(h));
    use.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);
    g.appendChild(use);
    return g;
  };

  const render = () => {
    layer.replaceChildren(...seq.map((k, i) => makeSlot(k, i)));
  };

  const listText = () => {
    const parts = Object.keys(FRUITS).filter((k) => counts[k]).map((k) => `${counts[k]} ${counts[k] === 1 ? FRUITS[k].one : FRUITS[k].many}`);
    if (parts.length < 2) return parts.join('');
    return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
  };

  const update = () => {
    const total = seq.length;
    Object.keys(FRUITS).forEach((k) => {
      const c = document.querySelector(`[data-count="${k}"]`);
      if (c) c.textContent = counts[k];
      document.querySelector(`[data-pick="${k}"]`)?.classList.toggle('has-some', counts[k] > 0);
      document.querySelectorAll(`[data-fruit-btn="${k}"]`).forEach((b) => {
        b.disabled = b.dataset.step === '1' ? total >= MAX : counts[k] === 0;
      });
    });
    const list = listText();
    status.textContent = total === 0 ? `Tu vaso está vacío. Escoge hasta ${MAX} fruticas.`
      : total >= MAX ? `Vaso lleno: ${list}. Listo para pedir.`
      : `Llevas ${total} de ${MAX} fruticas: ${list}.`;
    const msg = total
      ? `Hola Uba, quiero pedir un vaso UBA POP'S armado con ${list}.`
      : 'Hola Uba, quiero armar un vaso UBA POP\'S.';
    order.href = WA + encodeURIComponent(msg);
    desc.textContent = total ? `Vaso UBA POP'S con ${list}.` : 'Vaso UBA POP\'S vacío.';
  };

  const add = (key) => {
    if (seq.length >= MAX) return false;
    seq.push(key);
    counts[key] += 1;
    const g = makeSlot(key, seq.length - 1);
    layer.appendChild(g);
    if (!reduced) {
      g.animate([
        { transform: 'translateY(-460px) rotate(-18deg)', opacity: 0 },
        { transform: 'translateY(-300px) rotate(-10deg)', opacity: 1, offset: 0.2 },
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
      ], { duration: 760, easing: 'cubic-bezier(0.16,1,0.3,1)' });
    }
    update();
    return true;
  };

  const remove = (key) => {
    const idx = seq.lastIndexOf(key);
    if (idx < 0) return;
    const el = layer.children[idx];
    seq.splice(idx, 1);
    counts[key] -= 1;
    update();
    if (reduced || !el) { render(); return; }
    el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-40px) scale(0.8)' }], { duration: 220, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });
    setTimeout(render, 230);
  };

  document.querySelectorAll('[data-fruit-btn]').forEach((b) => {
    b.addEventListener('click', () => (b.dataset.step === '1' ? add(b.dataset.fruitBtn) : remove(b.dataset.fruitBtn)));
  });
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    seq.length = 0;
    Object.keys(counts).forEach((k) => { counts[k] = 0; });
    render();
    update();
  });

  // un vaso de muestra para que se vea vivo desde el principio
  ['fresa', 'mango', 'mora', 'banano'].forEach((k) => { seq.push(k); counts[k] += 1; });
  render();
  update();

  return { add, total: () => seq.length };
})();

/* ---------- 5. Galería: se arrastra con el mouse y deriva sola ---------- */
(() => {
  const track = document.querySelector('[data-track]');
  if (!track) return;
  let down = false, startX = 0, startScroll = 0, moved = false, paused = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = false; startX = e.clientX; startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) moved = true;
    track.scrollLeft = startScroll - dx;
  });
  window.addEventListener('pointerup', () => { down = false; track.classList.remove('is-dragging'); });
  track.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);

  if (reduced) return;
  ['pointerenter', 'focusin', 'touchstart'].forEach((t) => track.addEventListener(t, () => { paused = true; }, { passive: true }));
  ['pointerleave', 'focusout'].forEach((t) => track.addEventListener(t, () => { paused = false; }));
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(track);
  let last = performance.now();
  let carry = 0;
  const tick = (now) => {
    const dt = Math.min(64, now - last);
    last = now;
    if (visible && !paused && !down && !document.hidden) {
      carry += dt * 0.03;
      const step = Math.floor(carry);
      if (step) {
        carry -= step;
        const max = track.scrollWidth - track.clientWidth;
        track.scrollLeft = track.scrollLeft >= max - 1 ? 0 : track.scrollLeft + step;
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
