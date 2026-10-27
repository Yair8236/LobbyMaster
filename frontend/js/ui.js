// LobbyMaster Beta 4 · utilidades de interfaz (vista). Autor: Yair Anibal Mamani Ticona
(function (root) {
  // Se construye el DOM con nodos de texto (nunca innerHTML con datos del usuario) para evitar inyeccion de codigo (XSS)
  function h(tag, attrs) {
    const el = document.createElement(tag);
    attrs = attrs || {};
    for (const k in attrs) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(x => add(el, x));
    else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17.5 14.2c2.4.3 4 2.1 4 4.8"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    db: '<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>',
    logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    pad: '<rect x="2.5" y="7" width="19" height="11" rx="4"/><path d="M7 10.5v4M5 12.5h4M15.5 11.5h.01M18 13.5h.01"/>',
    bracket: '<path d="M3 5h5v5H3zM3 14h5v5H3zM16 9.5h5v5h-5z"/><path d="M8 7.5h3v9H8M11 12h5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.2A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.8C3.8 8.6 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
    shuffle: '<path d="M3 7h3.5c5 0 5 10 10 10H21M3 17h3.5c1.6 0 2.7-.7 3.6-1.7M21 7h-4.5c-1.6 0-2.7.7-3.6 1.7M18.5 4.5L21 7l-2.5 2.5M18.5 14.5L21 17l-2.5 2.5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5L20 15M20 20v-5h-5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    print: '<path d="M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    table: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M3.5 15h17M9.5 4.5v15"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>'
  };
  function icon(name) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICONS[name] || ''; // contenido estatico propio, no proviene del usuario
    return s;
  }
  function svgEl(tag, attrs) { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); for (let i = 2; i < arguments.length; i++) add(e, arguments[i]); return e; }

  // ---------- formatos ----------
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fmtDate = s => { if (!s) return '—'; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return d + ' ' + MESES[m - 1] + ' ' + y; };
  const fmtStamp = s => (s ? fmtDate(s) + ' · ' + String(s).slice(11, 16) : '—');
  const hash = s => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x; };
  const hue = s => hash(String(s)) % 360;
  const initials = n => { const p = String(n).trim().split(/\s+/); return (p.length > 1 ? p[0][0] + p[1][0] : String(n).slice(0, 2)).toUpperCase(); };
  function teamBadge(name, size) { return h('span', { class: 'badge-team ' + (size || ''), style: { background: 'hsl(' + hue(name) + ' 46% 38%)' }, title: name }, initials(name)); }
  function avatar(name) { return h('span', { class: 'avatar', style: { background: 'hsl(' + hue(name) + ' 40% 34%)' } }, String(name).slice(0, 2).toUpperCase()); }
  const ESTADO = { abierto: ['ok', 'Abierto'], en_curso: ['warn', 'En curso'], finalizado: ['mute', 'Finalizado'], pendiente: ['warn', 'Pendiente'], aprobado: ['ok', 'Aprobado'], rechazado: ['bad', 'Rechazado'] };
  const chip = (e, text) => h('span', { class: 'chip ' + (ESTADO[e] ? ESTADO[e][0] : 'mute') }, text || (ESTADO[e] ? ESTADO[e][1] : e));
  const ROLCHIP = { admin: ['ac', 'Administrador'], organizador: ['info', 'Organizador'], jugador: ['mute', 'Jugador'] };
  const rolChip = r => h('span', { class: 'chip plain ' + ROLCHIP[r][0] }, ROLCHIP[r][1]);
  const gameCover = name => { const hh = hue(name); return 'repeating-linear-gradient(135deg, rgba(255,255,255,.06) 0 2px, transparent 2px 11px), linear-gradient(120deg, hsl(' + hh + ' 58% 32%), hsl(' + ((hh + 48) % 360) + ' 62% 20%))'; };

  // ---------- avisos y dialogos ----------
  function toast(msg, type) {
    let box = document.querySelector('.toasts'); if (!box) { box = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(box); }
    const t = h('div', { class: 'toast ' + (type || '') }, icon(type === 'bad' ? 'x' : type === 'ok' ? 'check' : 'info'), h('div', null, msg));
    box.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, type === 'bad' ? 5200 : 3200);
  }
  function modal(o) {
    const close = () => { ov.remove(); document.removeEventListener('keydown', esc); if (o.onClose) o.onClose(); };
    const esc = e => { if (e.key === 'Escape') close(); };
    const footer = o.actions && o.actions.length ? h('footer', null, o.actions.map(a => h('button', { class: 'btn ' + (a.cls || ''), type: 'button', onclick: () => { if (!a.onClick || a.onClick(close) !== false) { if (!a.keep) close(); } } }, a.icon ? icon(a.icon) : null, a.label))) : null;
    const ov = h('div', { class: 'overlay', onmousedown: e => { if (e.target === ov) close(); } },
      h('div', { class: 'modal ' + (o.wide ? 'wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title },
        h('header', null, h('h2', null, o.title), h('button', { class: 'btn ghost icon sp', type: 'button', 'aria-label': 'Cerrar', onclick: close }, icon('x'))),
        h('div', { class: 'body' }, o.body), footer));
    document.body.appendChild(ov); document.addEventListener('keydown', esc);
    const f = ov.querySelector('input,select,textarea'); if (f) setTimeout(() => f.focus(), 30);
    return { close, el: ov };
  }
  function confirmBox(o) {
    return new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      modal({ title: o.title, body: h('div', { class: 'stack' }, h('p', null, o.message), o.extra || null), onClose: () => fin(false),
        actions: [{ label: o.cancel || 'Cancelar', cls: 'ghost' }, { label: o.confirm || 'Confirmar', cls: o.danger ? 'danger' : 'pri', onClick: () => { fin(true); } }] });
    });
  }

  // ---------- formularios ----------
  function field(o) {
    let input;
    const id = 'f_' + o.name + '_' + Math.random().toString(36).slice(2, 6);
    if (o.options) input = h('select', { class: 'input', id, name: o.name }, o.placeholder ? h('option', { value: '' }, o.placeholder) : null, o.options.map(x => h('option', { value: x.value, selected: String(x.value) === String(o.value) }, x.label)));
    else input = h('input', { class: 'input', id, name: o.name, type: o.type || 'text', value: o.value === undefined ? '' : o.value, placeholder: o.placeholder || '', autocomplete: o.autocomplete || 'off', maxlength: o.maxlength, min: o.min, max: o.max, step: o.step, inputmode: o.inputmode });
    const msg = h('div', { class: 'msg', role: 'alert' });
    let ctl = input;
    if (o.type === 'password') {
      const b = h('button', { type: 'button', 'aria-label': 'Mostrar u ocultar contraseña', onclick: () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; clear(b).appendChild(icon(show ? 'eyeoff' : 'eye')); } }, icon('eye'));
      ctl = h('div', { class: 'pw' }, input, b);
    }
    const el = h('div', { class: 'field' }, h('label', { for: id }, o.label), ctl, o.hint ? h('div', { class: 'hint' }, o.hint) : null, msg);
    const api = { el, input, name: o.name, get value() { return input.value; }, error(m) { el.classList.toggle('err', !!m); msg.textContent = m || ''; if (m) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); } };
    input.addEventListener('input', () => api.error(''));
    return api;
  }
  function showErrors(fields, err) {
    fields.forEach(f => f.error((err.fields && err.fields[f.name]) || ''));
    const bad = fields.find(f => err.fields && err.fields[f.name]); if (bad) bad.input.focus();
    return !!bad;
  }

  // ---------- graficos SVG ----------
  function barsH(data, o) {
    o = o || {}; const W = o.width || 520, rowH = 30, left = o.left || 150, right = 46, max = Math.max(1, ...data.map(d => d.value));
    const s = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + Math.max(40, data.length * rowH + 8), class: 'bars', role: 'img', 'aria-label': o.label || 'Gráfico de barras', width: '100%' });
    data.forEach((d, i) => {
      const y = i * rowH + 4, w = Math.max(2, (W - left - right) * d.value / max);
      const t = svgEl('text', { x: left - 10, y: y + 17, 'text-anchor': 'end', class: 'lab' }); t.textContent = d.label.length > 22 ? d.label.slice(0, 21) + '…' : d.label;
      s.appendChild(t);
      s.appendChild(svgEl('rect', { x: left, y: y + 4, width: W - left - right, height: 14, rx: 2, fill: 'var(--s3)' }));
      s.appendChild(svgEl('rect', { x: left, y: y + 4, width: w, height: 14, rx: 2, fill: d.color || 'var(--ac)' }));
      const v = svgEl('text', { x: left + w + 8, y: y + 17, class: 'val' }); v.textContent = (d.text !== undefined ? d.text : d.value); s.appendChild(v);
    });
    return s;
  }
  function download(name, text, mime) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' })), download: name });
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }
  const empty = (ic, title, text, action) => h('div', { class: 'empty' }, icon(ic), h('h3', null, title), h('p', null, text), action ? h('div', { class: 'mt' }, action) : null);
  const KW = /('[^']*')|(--[^\n]*)|\b(SELECT|FROM|JOIN|LEFT|INNER|ON|WHERE|GROUP BY|ORDER BY|DESC|ASC|COUNT|AS|AND|IS|NULL|INSERT INTO|VALUES|CREATE TABLE|PRIMARY KEY|FOREIGN KEY|REFERENCES|UNIQUE|CHECK|NOT NULL|DEFAULT|HAVING|DISTINCT|SUM|BY)\b/g;
  function sql(text) {
    const pre = h('div', { class: 'code' }); let last = 0, m; KW.lastIndex = 0;
    while ((m = KW.exec(text))) { if (m.index > last) pre.appendChild(document.createTextNode(text.slice(last, m.index))); pre.appendChild(h('span', { class: m[1] ? 's' : m[2] ? 'c' : 'k' }, m[0])); last = m.index + m[0].length; }
    pre.appendChild(document.createTextNode(text.slice(last))); return pre;
  }
  root.UI = { h, add, clear, icon, svgEl, fmtDate, fmtStamp, hue, initials, teamBadge, avatar, chip, rolChip, gameCover, toast, modal, confirmBox, field, showErrors, barsH, download, empty, sql, ESTADO };
})(this);
