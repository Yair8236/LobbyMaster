// LobbyMaster Beta 4 · controlador: sesion, rutas y estructura general. Autor: Yair Anibal Mamani Ticona
(function (root) {
  const { h, clear, icon, svgEl, chip, rolChip, avatar, toast, modal, field, showErrors } = root.UI;
  const Auth = root.Auth, V = root.Views;

  // almacenamiento: si el navegador bloquea localStorage, la app funciona en memoria
  const mem = {}, memory = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
  let storage = memory; try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); storage = localStorage; } catch (e) { /* modo memoria */ }
  const db = root.Store.create(storage, { onSave: () => { if (root.Sync) root.Sync.schedule(); } });
  const SES = 'lobbymaster.sesion', TEMA = 'lobbymaster.tema';
  const app = document.getElementById('app');
  let sidebarOpen = false;

  const theme = () => { try { return storage.getItem(TEMA) || 'dark'; } catch (e) { return 'dark'; } };
  const setTheme = t => { document.documentElement.setAttribute('data-theme', t); try { storage.setItem(TEMA, t); } catch (e) { /* sin persistencia */ } };
  setTheme(theme());

  const currentUser = () => { const id = Number(storage.getItem(SES)); return id ? db.getUser(id) : null; };
  const parse = () => { const raw = (location.hash || '#/inicio').replace(/^#\/?/, ''), [p, q] = raw.split('?'); return { parts: p.split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(q || '')) }; };
  const go = path => { const t = '#/' + path; if (location.hash === t) render(); else location.hash = t; };
  const ctxBase = { db, go, refresh: () => render() };

  // ---------- ingreso y registro ----------
  let fails = 0, lockUntil = 0;
  function artSvg() {
    const s = svgEl('svg', { class: 'lines', viewBox: '0 0 520 460', 'aria-hidden': 'true' }), g = svgEl('g', { fill: 'none', stroke: '#2f3c55', 'stroke-width': 1.5 }), on = svgEl('g', { fill: 'none', stroke: 'var(--ac)', 'stroke-width': 2.4 }), W = 112, H = 30;
    const col = [0, 150, 300, 440], ys = [[20, 76, 132, 188, 244, 300, 356, 412], [48, 160, 272, 384], [104, 328], [216]];
    ys.forEach((c, r) => c.forEach((y, i) => { const x = col[r]; s.appendChild(svgEl('rect', { x, y, width: r === 3 ? 80 : W, height: H, rx: 3, fill: '#101722', stroke: (r === 3 || (r === 2 && i === 0) || (r === 1 && i === 0) || (r === 0 && i < 2)) ? 'var(--ac)' : '#2f3c55', 'stroke-width': 1.3 }));
      if (r < 3) { const x1 = x + W, y1 = y + H / 2, nx = col[r + 1], ny = ys[r + 1][i >> 1] + H / 2, hot = (r === 2 && i === 0) || (r === 1 && i === 0) || (r === 0 && i < 2); (hot ? on : g).appendChild(svgEl('path', { d: 'M' + x1 + ' ' + y1 + 'H' + (x1 + (nx - x1) / 2) + 'V' + ny + 'H' + nx })); } }));
    s.insertBefore(g, s.firstChild); s.appendChild(on); return s;
  }
  function renderAuth() {
    clear(app); app.className = '';
    let mode = 'login';
    const box = h('div', { class: 'auth-card' }), msg = h('div', { class: 'alert bad hidden', role: 'alert' });
    const draw = () => {
      clear(box);
      const seg = h('div', { class: 'seg', style: { marginBottom: '22px' } }, h('button', { type: 'button', class: mode === 'login' ? 'on' : '', onclick: () => { mode = 'login'; draw(); } }, 'Ingresar'), h('button', { type: 'button', class: mode === 'reg' ? 'on' : '', onclick: () => { mode = 'reg'; draw(); } }, 'Crear cuenta'));
      msg.classList.add('hidden');
      if (mode === 'login') {
        const fu = field({ label: 'Usuario o correo', name: 'u', autocomplete: 'username' }), fp = field({ label: 'Contraseña', name: 'p', type: 'password', autocomplete: 'current-password' });
        const btn = h('button', { class: 'btn pri', type: 'submit', style: { height: '44px', width: '100%' } }, 'Entrar a LobbyMaster');
        const submit = (u, p) => {
          if (Date.now() < lockUntil) { msg.textContent = 'Demasiados intentos fallidos. Espera ' + Math.ceil((lockUntil - Date.now()) / 1000) + ' s para volver a intentar.'; msg.classList.remove('hidden'); return; }
          fu.error(''); fp.error('');
          if (!u.trim()) { fu.error('Ingresa tu usuario o correo'); return; } if (!p) { fp.error('Ingresa tu contraseña'); return; }
          try { const user = db.login(u, p); fails = 0; storage.setItem(SES, user.id_usuario); toast('Bienvenido, ' + user.nombre_usuario, 'ok'); go('inicio'); render(); }
          catch (e) { fails++; if (fails >= 5) { lockUntil = Date.now() + 30000; fails = 0; } msg.textContent = fails === 0 ? 'Cuenta bloqueada 30 segundos por demasiados intentos.' : e.message + (fails >= 3 ? ' (' + (5 - fails) + ' intento(s) restantes)' : ''); msg.classList.remove('hidden'); fp.input.value = ''; }
        };
        const form = h('form', { class: 'form', novalidate: true }, fu.el, fp.el, msg, btn); form.addEventListener('submit', e => { e.preventDefault(); submit(fu.value, fp.value); });
        const demo = [['Administrador', 'admin', 'Admin2026'], ['Organizador', 'organizador', 'Organiza2026'], ['Jugador', 'jugador', 'Jugador2026']];
        box.append(h('h2', null, 'Bienvenido'), h('p', { class: 'muted', style: { margin: '6px 0 20px' } }, 'Ingresa para gestionar torneos o inscribir a tu equipo.'), seg, form,
          h('div', { class: 'demo' }, h('h4', null, 'Cuentas de demostración (beta)'), h('div', { class: 'demo-btns' }, demo.map(([l, u, p]) => h('button', { type: 'button', onclick: () => submit(u, p) }, h('b', null, l), h('small', null, u))))));
      } else {
        const f = { u: field({ label: 'Usuario', name: 'nombre_usuario', maxlength: 20, autocomplete: 'username', hint: '3 a 20 caracteres: letras, números o guion bajo.' }), c: field({ label: 'Correo electrónico', name: 'correo', type: 'email', autocomplete: 'email', maxlength: 100 }), p: field({ label: 'Contraseña', name: 'password', type: 'password', autocomplete: 'new-password' }), q: field({ label: 'Confirmar contraseña', name: 'q', type: 'password', autocomplete: 'new-password' }) };
        const bar = h('i'), meter = h('div', { class: 'strength' }, bar);
        f.p.input.addEventListener('input', () => { const v = f.p.value; const sc = (v.length >= 8) + /[A-Z]/.test(v) + /\d/.test(v) + /[^A-Za-z0-9]/.test(v); bar.style.width = (sc * 25) + '%'; bar.style.background = sc <= 1 ? 'var(--bad)' : sc === 2 ? 'var(--warn)' : 'var(--ok)'; });
        const form = h('form', { class: 'form', novalidate: true }, f.u.el, f.c.el, h('div', null, f.p.el, h('div', { style: { marginTop: '8px' } }, meter)), f.q.el, msg, h('button', { class: 'btn pri', type: 'submit', style: { height: '44px', width: '100%' } }, 'Crear cuenta de jugador'));
        form.addEventListener('submit', e => {
          e.preventDefault(); const all = [f.u, f.c, f.p, f.q]; all.forEach(x => x.error(''));
          if (f.p.value !== f.q.value) { f.q.error('Las contraseñas no coinciden'); return; }
          try { const u = db.register({ nombre_usuario: f.u.value, correo: f.c.value, password: f.p.value }); storage.setItem(SES, u.id_usuario); toast('Cuenta creada. ¡Bienvenido!', 'ok'); go('inicio'); render(); }
          catch (er) { if (er.name !== 'VErr') throw er; showErrors(all, er); }
        });
        box.append(h('h2', null, 'Crea tu cuenta'), h('p', { class: 'muted', style: { margin: '6px 0 20px' } }, 'Regístrate como jugador para armar tu equipo y competir.'), seg, form);
      }
    };
    draw();
    app.appendChild(h('div', { class: 'auth' },
      h('div', { class: 'auth-art' }, artSvg(), h('div', { class: 'row', style: { position: 'relative' } }, brandMark(), h('div', null, h('b', { style: { font: '700 22px var(--display)', letterSpacing: '.1em', color: '#e8ecf4' } }, 'LOBBYMASTER'))),
        h('div', null, h('h1', { style: { color: '#e8ecf4' } }, 'Tu torneo, ', h('em', null, 'bien armado.')), h('p', null, 'Inscripciones, brackets automáticos y estadísticas para la comunidad eSports de La Paz y El Alto, en un solo lugar.'),
          h('div', { class: 'stats' }, [['9', 'tablas normalizadas'], ['3', 'roles de usuario'], ['4–32', 'equipos por torneo']].map(([a, b]) => h('div', null, h('b', null, a), h('span', null, b))))),
        h('div', { class: 'foot' }, 'Proyecto universitario · Yair Anibal Mamani Ticona · Beta 4')),
      h('div', { class: 'auth-form' }, box)));
  }
  function brandMark() {
    const s = svgEl('svg', { class: 'brand-mark', viewBox: '0 0 34 34', 'aria-hidden': 'true' });
    s.appendChild(svgEl('path', { d: 'M0 0h28l6 6v28H6l-6-6z', fill: 'var(--ac)' }));
    s.appendChild(svgEl('path', { d: 'M8 11h7v5M8 23h7v-5M15 16v2M15 17h11', fill: 'none', stroke: '#fff', 'stroke-width': 2.6, 'stroke-linecap': 'square' }));
    return s;
  }

  // ---------- estructura ----------
  function navItems(user) {
    const pend = user.rol === 'jugador' ? 0 : db.listTorneos().filter(t => Auth.canManageTorneo(user, t) && t.estado === 'abierto').reduce((s, t) => s + t.pendientes, 0);
    const items = [['Principal'], ['inicio', 'home', 'Inicio', pend], ['torneos', 'trophy', 'Torneos'], ['equipos', 'users', user.rol === 'admin' ? 'Equipos' : 'Mis equipos'], ['sedes', 'map', 'Sedes y mapa'], ['ranking', 'chart', 'Ranking'], ['Sistema'], ['modelo', 'db', 'Modelo de datos']];
    if (Auth.can(user, 'usuarios.admin')) items.splice(7, 0, ['admin', 'shield', 'Administración']);
    return items;
  }
  function accountModal(user) {
    const fa = field({ label: 'Contraseña actual', name: 'actual', type: 'password', autocomplete: 'current-password' }), fn = field({ label: 'Nueva contraseña', name: 'nueva', type: 'password', autocomplete: 'new-password', hint: 'Mínimo 8 caracteres, con letras y números.' });
    const form = h('form', { class: 'form', novalidate: true }, h('dl', { class: 'kv' }, h('dt', null, 'Usuario'), h('dd', null, user.nombre_usuario), h('dt', null, 'Correo'), h('dd', null, user.correo), h('dt', null, 'Rol'), h('dd', null, rolChip(user.rol))), h('h4', null, 'Cambiar contraseña'), fa.el, fn.el);
    const save = () => { try { db.changePassword(user, fa.value, fn.value); toast('Contraseña actualizada', 'ok'); m.close(); } catch (e) { if (e.name !== 'VErr') throw e; showErrors([fa, fn], e); } };
    form.addEventListener('submit', e => { e.preventDefault(); save(); });
    const m = modal({ title: 'Mi cuenta', body: form, actions: [{ label: 'Cerrar', cls: 'ghost' }, { label: 'Guardar contraseña', cls: 'pri', onClick: () => { save(); return false; }, keep: true }] });
  }

  // ---------- estado de la base de datos en la nube ----------
  const SYNC_TXT = { apagado: ['Solo en este navegador', 'off'], conectando: ['Conectando…', 'wait'], guardando: ['Guardando…', 'wait'], conectado: ['Supabase conectado', 'ok'], sin_conexion: ['Sin conexión · modo local', 'bad'], error: ['Error al guardar', 'bad'] };
  function paintChip(el) { const st = root.Sync.status(), v = SYNC_TXT[st.estado] || SYNC_TXT.apagado; el.className = 'sync-chip ' + v[1]; el.title = (st.detalle ? st.detalle + ' · ' : '') + 'Clic para sincronizar'; el.textContent = ''; el.append(h('i'), v[0]); }
  root.Sync.onStatus(() => document.querySelectorAll('.sync-chip').forEach(paintChip));
  function syncChip() {
    const el = h('button', { type: 'button', class: 'sync-chip', onclick: async () => { const st = root.Sync.status().estado; if (st === 'apagado') { toast('La base en la nube está desactivada (frontend/js/config.js)'); return; } const ok = (st === 'sin_conexion' || st === 'error') ? await root.Sync.reconectar() : await root.Sync.refrescar(); toast(ok ? 'Datos sincronizados con Supabase' : 'No se pudo sincronizar', ok ? 'ok' : 'bad'); render(); } });
    paintChip(el); return el;
  }
  const TITLES = { inicio: 'Inicio', torneos: 'Torneos', equipos: 'Equipos', sedes: 'Sedes y mapa', ranking: 'Ranking', admin: 'Administración', modelo: 'Modelo de datos' };

  function render() {
    const user = currentUser();
    if (!user) { if (storage.getItem(SES)) storage.removeItem(SES); renderAuth(); return; }
    const { parts, query } = parse(), name = parts[0] || 'inicio';
    if (name === 'admin' && !Auth.can(user, 'usuarios.admin')) { toast('No tienes permiso para abrir esa sección', 'bad'); go('inicio'); return; }
    const ctx = Object.assign({}, ctxBase, { user, query, params: { id: parts[1] } });
    let view, crumb = TITLES[name] || 'Inicio';
    try {
      if (name === 'torneos' && parts[1]) { view = V.torneoDetalle(ctx); const t = db.getTorneo(Number(parts[1])); crumb = 'Torneos / ' + (t ? t.nombre : '—'); }
      else if (V[name] && TITLES[name]) view = V[name](ctx);
      else view = V.inicio(ctx);
    } catch (e) { console.error(e); view = h('div', { class: 'alert bad' }, 'Ocurrió un error al mostrar esta pantalla. Recarga la página o restaura los datos desde Administración.'); }
    const side = h('aside', { class: 'side' + (sidebarOpen ? ' open' : ''), 'aria-label': 'Navegación principal' },
      h('div', { class: 'brand' }, brandMark(), h('div', null, h('b', null, 'LobbyMaster'), h('small', null, 'Beta 4'))),
      h('nav', { class: 'nav' }, navItems(user).map(it => it.length === 1 ? h('h6', null, it[0]) : h('a', { href: '#/' + it[0], class: name === it[0] ? 'on' : '', onclick: () => { sidebarOpen = false; } }, icon(it[1]), it[2], it[3] ? h('span', { class: 'badge', 'aria-label': it[3] + ' pendientes' }, it[3]) : null))),
      h('div', { class: 'me' }, avatar(user.nombre_usuario), h('div', { class: 'who grow' }, h('b', null, user.nombre_usuario), rolChip(user.rol)), h('button', { class: 'btn ghost icon', title: 'Cerrar sesión', 'aria-label': 'Cerrar sesión', onclick: () => { storage.removeItem(SES); toast('Sesión cerrada'); go('inicio'); render(); } }, icon('logout'))));
    const top = h('header', { class: 'top' }, h('button', { class: 'btn ghost icon menu-btn', 'aria-label': 'Abrir menú', onclick: () => { sidebarOpen = !sidebarOpen; side.classList.toggle('open', sidebarOpen); } }, icon('menu')), h('div', { class: 'crumbs' }, 'LobbyMaster / ', h('b', null, crumb)),
      h('div', { class: 'row sp' }, syncChip(), h('button', { class: 'btn ghost icon', 'aria-label': 'Cambiar tema claro u oscuro', title: 'Tema', onclick: () => { setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); render(); } }, icon(document.documentElement.getAttribute('data-theme') === 'light' ? 'moon' : 'sun')),
        h('button', { class: 'btn sm', onclick: () => accountModal(user) }, icon('user'), 'Mi cuenta')));
    const sy = window.scrollY, keep = app.querySelector('.bk-view'), kx = keep ? keep.scrollLeft : 0, same = keep && parts[0] === 'torneos';
    clear(app); app.className = 'app';
    app.append(side, h('div', { class: 'main' }, top, h('main', { class: 'page', id: 'contenido' }, view)));
    if (same) { const nv = app.querySelector('.bk-view'); if (nv) nv.scrollLeft = kx; }
    window.scrollTo(0, sy);
  }
  window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });
  // arranque: primero se sincroniza con la base de datos (si hay internet) y luego se muestra la aplicacion
  clear(app); app.className = ''; app.appendChild(h('div', { class: 'splash' }, h('div', { class: 'spin' }), h('p', null, 'Conectando con la base de datos…')));
  root.Sync.init(db).then(render, render);
  root.LobbyApp = { db, render, go };
})(this);
