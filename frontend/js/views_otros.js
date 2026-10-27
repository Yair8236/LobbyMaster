// LobbyMaster Beta 3 · vistas: equipos, sedes (mapa) y ranking. Autor: Yair Anibal Mamani Ticona
(function (root) {
  const { h, icon, svgEl, fmtDate, chip, teamBadge, toast, modal, confirmBox, field, showErrors, barsH, empty } = root.UI;
  const Auth = root.Auth, V = (root.Views = root.Views || {});

  // ---------- equipos ----------
  function teamForm(ctx, team) {
    const { db, user } = ctx;
    const fN = field({ label: 'Nombre del equipo', name: 'nombre', value: team ? team.nombre : '', placeholder: 'Ej. Illimani eSports', maxlength: 24 });
    const list = h('div', { class: 'stack', style: { gap: '8px' } }), msg = h('div', { class: 'msg', style: { color: 'var(--bad)', fontSize: '12.5px' } });
    const count = h('span', { class: 'dim' });
    const rowsEl = [];
    const addRow = v => {
      const inp = h('input', { class: 'input', placeholder: 'Apodo del jugador', value: v || '', maxlength: 30, 'aria-label': 'Apodo del jugador' });
      const r = h('div', { class: 'row' }, inp, h('button', { type: 'button', class: 'btn icon ghost', 'aria-label': 'Quitar jugador', onclick: () => { const i = rowsEl.indexOf(r); rowsEl.splice(i, 1); r.remove(); upd(); } }, icon('x')));
      rowsEl.push(r); list.appendChild(r); upd(); return inp;
    };
    const vals = () => rowsEl.map(r => r.querySelector('input').value);
    const addBtn = h('button', { type: 'button', class: 'btn sm', onclick: () => addRow('').focus() }, icon('plus'), 'Agregar jugador');
    function upd() { count.textContent = rowsEl.length + ' / ' + db.ROSTER_MAX + ' jugadores (mínimo ' + db.ROSTER_MIN + ')'; addBtn.disabled = rowsEl.length >= db.ROSTER_MAX; }
    (team ? team.jugadores : ['', '', '']).forEach(addRow);
    const form = h('form', { class: 'form', novalidate: true }, fN.el, h('div', { class: 'field' }, h('div', { class: 'row' }, h('label', null, 'Roster de jugadores'), h('span', { class: 'sp' }, count)), list, msg, h('div', null, addBtn)));
    const save = () => {
      msg.textContent = '';
      try { if (team) db.updateTeam(user, team.id_equipo, { nombre: fN.value, jugadores: vals() }); else db.createTeam(user, { nombre: fN.value, jugadores: vals() }); toast(team ? 'Equipo actualizado' : 'Equipo creado', 'ok'); m.close(); ctx.refresh(); }
      catch (e) { if (e.name !== 'VErr') throw e; fN.error(e.fields.nombre || ''); msg.textContent = e.fields.jugadores || ''; if (!Object.keys(e.fields).length) toast(e.message, 'bad'); }
    };
    form.addEventListener('submit', e => { e.preventDefault(); save(); });
    const m = modal({ title: team ? 'Editar equipo' : 'Nuevo equipo', body: form, actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: team ? 'Guardar cambios' : 'Crear equipo', cls: 'pri', onClick: () => { save(); return false; }, keep: true }] });
  }
  function historyModal(ctx, team) {
    const hs = ctx.db.historialEquipo(team.id_equipo);
    modal({ title: 'Historial · ' + team.nombre, wide: true, body: hs.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['Torneo', 'Ronda', 'Rival', 'Marcador', 'Resultado'].map(x => h('th', null, x)))),
      h('tbody', null, hs.map(x => h('tr', null, h('td', null, h('b', null, x.torneo), h('div', { class: 'dim', style: { fontSize: '12px' } }, fmtDate(x.fecha))), h('td', null, x.ronda), h('td', null, x.rival), h('td', { class: 'num' }, x.pf + ' – ' + x.pc), h('td', null, h('span', { class: 'chip ' + (x.gano ? 'ok' : 'bad') }, x.gano ? 'Victoria' : 'Derrota'))))))) : empty('flag', 'Sin partidas', 'Este equipo todavía no ha jugado cruces.'), actions: [{ label: 'Cerrar', cls: 'pri' }] });
  }
  V.equipos = ctx => {
    const { db, user } = ctx, all = Auth.can(user, 'equipo.ver_todos'), teams = all ? db.listTeams() : db.listTeams({ captainId: user.id_usuario });
    const rk = Object.fromEntries(db.ranking().map(r => [r.id_equipo, r]));
    const root_ = h('div');
    root_.appendChild(h('div', { class: 'page-head' }, h('div', null, h('h1', null, all ? 'Equipos' : 'Mis equipos'), h('p', null, all ? 'Todos los equipos registrados en la plataforma.' : 'Administra tu equipo y su roster. Solo el capitán puede inscribirlo en torneos.')), h('div', { class: 'sp' }, Auth.can(user, 'equipo.crear') ? h('button', { class: 'btn pri', onclick: () => teamForm(ctx) }, icon('plus'), 'Nuevo equipo') : null)));
    if (!teams.length) { root_.appendChild(h('div', { class: 'panel' }, empty('users', 'Aún no tienes equipos', 'Crea tu equipo con al menos ' + db.ROSTER_MIN + ' jugadores para inscribirte en torneos.', h('button', { class: 'btn pri', onclick: () => teamForm(ctx) }, icon('plus'), 'Crear equipo')))); return root_; }
    root_.appendChild(h('div', { class: 'grid g3' }, teams.map(t => {
      const r = rk[t.id_equipo], mine = t.id_capitan === user.id_usuario || all;
      return h('article', { class: 'panel', style: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' } },
        h('div', { class: 'row' }, teamBadge(t.nombre, 'lg'), h('div', { class: 'grow', style: { minWidth: 0 } }, h('h3', null, t.nombre), h('div', { class: 'dim', style: { fontSize: '12.5px' } }, 'Capitán: ' + t.capitan))),
        h('div', { class: 'row wrap', style: { gap: '5px' } }, t.jugadores.map(j => h('span', { class: 'tag' }, j))),
        h('div', { class: 'row', style: { gap: '22px' } }, [['Torneos', r ? r.torneos : 0], ['Victorias', r ? r.pg : 0], ['Títulos', r ? r.titulos : 0]].map(([l, v]) => h('div', null, h('div', { style: { font: '700 22px var(--display)' } }, v), h('div', { class: 'dim', style: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em' } }, l)))),
        h('div', { class: 'row', style: { marginTop: 'auto' } }, h('button', { class: 'btn sm', onclick: () => historyModal(ctx, t) }, icon('flag'), 'Historial'),
          mine ? [h('button', { class: 'btn sm', onclick: () => teamForm(ctx, t) }, icon('edit'), 'Editar'), h('button', { class: 'btn sm danger sp', 'aria-label': 'Eliminar equipo', onclick: async () => { if (await confirmBox({ title: 'Eliminar equipo', message: '¿Eliminar «' + t.nombre + '»?', confirm: 'Eliminar', danger: true })) { try { db.deleteTeam(user, t.id_equipo); toast('Equipo eliminado', 'ok'); ctx.refresh(); } catch (e) { toast(e.message, 'bad'); } } } }, icon('trash'))] : null));
    })));
    return root_;
  };

  // ---------- sedes ----------
  function sedeForm(ctx, s) {
    const { db, user } = ctx;
    const f = { nombre: field({ label: 'Nombre de la sede', name: 'nombre', value: s ? s.nombre : '', maxlength: 60 }), latitud: field({ label: 'Latitud', name: 'latitud', value: s ? s.latitud : '', placeholder: '-16.5000', inputmode: 'decimal', hint: 'La Paz está cerca de -16.5' }), longitud: field({ label: 'Longitud', name: 'longitud', value: s ? s.longitud : '', placeholder: '-68.1500', inputmode: 'decimal' }) };
    const all = Object.values(f), form = h('form', { class: 'form', novalidate: true }, f.nombre.el, h('div', { class: 'two' }, f.latitud.el, f.longitud.el));
    const save = () => { try { const d = { nombre: f.nombre.value, latitud: f.latitud.value, longitud: f.longitud.value }; if (s) db.updateSede(user, s.id_sede, d); else db.addSede(user, d); toast('Sede guardada', 'ok'); m.close(); ctx.refresh(); } catch (e) { if (e.name !== 'VErr') throw e; if (!showErrors(all, e)) toast(e.message, 'bad'); } };
    form.addEventListener('submit', e => { e.preventDefault(); save(); });
    const m = modal({ title: s ? 'Editar sede' : 'Nueva sede', body: form, actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Guardar', cls: 'pri', onClick: () => { save(); return false; }, keep: true }] });
  }
  let selSede = null;
  V.sedes = ctx => {
    const { db, user } = ctx, sedes = db.listSedes(), ts = db.listTorneos(), isAdm = Auth.can(user, 'catalogos.admin');
    if (!sedes.some(s => s.id_sede === selSede)) selSede = sedes.length ? sedes[0].id_sede : null;
    const W = 900, Hh = 540, pad = 80, padR = 210;
    const lats = sedes.map(s => s.latitud), lons = sedes.map(s => s.longitud);
    const lat0 = lats.length ? (Math.min(...lats) + Math.max(...lats)) / 2 : -16.5, k = Math.cos(lat0 * Math.PI / 180);
    const x0 = lons.length ? Math.min(...lons) : -68.2, x1 = lons.length ? Math.max(...lons) : -68.1, y0 = lats.length ? Math.min(...lats) : -16.6, y1 = lats.length ? Math.max(...lats) : -16.4;
    const sc = Math.min((W - pad - padR) / Math.max(1e-4, (x1 - x0) * k), (Hh - 2 * pad) / Math.max(1e-4, y1 - y0)), ox = pad + (W - pad - padR - (x1 - x0) * k * sc) / 2, oy = (Hh - (y1 - y0) * sc) / 2;
    const px = lon => ox + (lon - x0) * k * sc, py = lat => oy + (y1 - lat) * sc;
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'aria-label': 'Mapa esquemático de sedes por coordenadas' });
    // cuadricula de coordenadas
    const step = 0.01, g = svgEl('g', { stroke: 'var(--line)', 'stroke-width': 1 });
    for (let lo = Math.ceil((x0 - 0.02) / step) * step; lo <= x1 + 0.02; lo += step) { const x = px(lo); if (x > 0 && x < W) { g.appendChild(svgEl('line', { x1: x, y1: 0, x2: x, y2: Hh })); const t = svgEl('text', { x: x + 4, y: Hh - 8, fill: 'var(--tx3)', 'font-size': 10, 'font-family': 'var(--mono)' }); t.textContent = lo.toFixed(2); svg.appendChild(t); } }
    for (let la = Math.ceil((y0 - 0.02) / step) * step; la <= y1 + 0.02; la += step) { const y = py(la); if (y > 0 && y < Hh) { g.appendChild(svgEl('line', { x1: 0, y1: y, x2: W, y2: y })); const t = svgEl('text', { x: 6, y: y - 4, fill: 'var(--tx3)', 'font-size': 10, 'font-family': 'var(--mono)' }); t.textContent = la.toFixed(2); svg.appendChild(t); } }
    svg.insertBefore(g, svg.firstChild);
    sedes.forEach(s => {
      const n = ts.filter(t => t.id_sede === s.id_sede).length, x = px(s.longitud), y = py(s.latitud), on = s.id_sede === selSede;
      const pin = svgEl('g', { class: 'pin', tabindex: 0, role: 'button', 'aria-label': s.nombre });
      pin.appendChild(svgEl('circle', { cx: x, cy: y, r: on ? 22 : 15, fill: 'var(--ac)', 'fill-opacity': on ? .22 : .12 }));
      pin.appendChild(svgEl('circle', { class: 'core', cx: x, cy: y, r: 9, fill: on ? 'var(--ac)' : 'var(--s3)', stroke: 'var(--ac)', 'stroke-width': 2 }));
      const c = svgEl('text', { x, y: y + 3.6, 'text-anchor': 'middle', fill: on ? '#fff' : 'var(--tx)', 'font-size': 11, 'font-weight': 700 }); c.textContent = n; pin.appendChild(c);
      const lw = s.nombre.length * 6.6 + 16;
      pin.appendChild(svgEl('rect', { x: x + 18, y: y - 11, width: lw, height: 22, rx: 3, fill: 'var(--s1)', stroke: on ? 'var(--ac)' : 'var(--line2)' }));
      const t = svgEl('text', { x: x + 26, y: y + 4, fill: 'var(--tx)', 'font-size': 12, 'font-weight': 600 }); t.textContent = s.nombre; pin.appendChild(t);
      pin.addEventListener('click', () => { selSede = s.id_sede; ctx.refresh(); }); pin.addEventListener('keydown', e => { if (e.key === 'Enter') { selSede = s.id_sede; ctx.refresh(); } });
      svg.appendChild(pin);
    });
    const sel = sedes.find(s => s.id_sede === selSede);
    const root_ = h('div');
    root_.appendChild(h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Sedes y mapa'), h('p', null, 'Lugares donde se juegan los torneos, ubicados por sus coordenadas (latitud y longitud).')), h('div', { class: 'sp' }, isAdm ? h('button', { class: 'btn pri', onclick: () => sedeForm(ctx) }, icon('plus'), 'Nueva sede') : null)));
    root_.appendChild(h('div', { class: 'grid g-main' }, h('div', null, h('div', { class: 'map' }, svg), h('p', { class: 'dim mt', style: { fontSize: '12.5px' } }, 'Esquema referencial a escala (proyección simple de coordenadas). En la versión final, esta vista usa Mapbox GL JS con mapa base. El número en cada marcador es la cantidad de torneos en la sede.')),
      h('div', { class: 'stack' }, sel ? h('section', { class: 'panel accent' }, h('header', null, icon('pin'), h('h3', null, sel.nombre)), h('dl', { class: 'kv body' }, h('dt', null, 'Latitud'), h('dd', { class: 'mono' }, String(sel.latitud)), h('dt', null, 'Longitud'), h('dd', { class: 'mono' }, String(sel.longitud)), h('dt', null, 'Mapa'), h('dd', null, h('a', { href: 'https://www.google.com/maps?q=' + sel.latitud + ',' + sel.longitud, target: '_blank', rel: 'noopener' }, 'Abrir en Google Maps')), h('dt', null, 'Torneos'), h('dd', null, ts.filter(t => t.id_sede === sel.id_sede).length ? ts.filter(t => t.id_sede === sel.id_sede).map(t => h('div', null, h('a', { href: '#/torneos/' + t.id_torneo }, t.nombre), h('span', { class: 'dim' }, ' · ' + fmtDate(t.fecha)))) : 'Ninguno por ahora')),
        isAdm ? h('div', { class: 'row', style: { padding: '0 18px 18px' } }, h('button', { class: 'btn sm', onclick: () => sedeForm(ctx, sel) }, icon('edit'), 'Editar'), h('button', { class: 'btn sm danger', onclick: async () => { if (await confirmBox({ title: 'Eliminar sede', message: '¿Eliminar «' + sel.nombre + '»?', confirm: 'Eliminar', danger: true })) { try { db.deleteSede(user, sel.id_sede); toast('Sede eliminada', 'ok'); ctx.refresh(); } catch (e) { toast(e.message, 'bad'); } } } }, icon('trash'), 'Eliminar')) : null) : null,
        h('section', { class: 'panel' }, h('header', null, icon('list'), h('h3', null, 'Todas las sedes')), h('ul', { class: 'list', style: { padding: '0 18px' } }, sedes.map(s => h('li', { style: { cursor: 'pointer' }, onclick: () => { selSede = s.id_sede; ctx.refresh(); } }, icon('pin'), h('b', { class: 'grow', style: { color: s.id_sede === selSede ? 'var(--ac2)' : '' } }, s.nombre), h('span', { class: 'mono dim' }, ts.filter(t => t.id_sede === s.id_sede).length))))))));
    return root_;
  };

  // ---------- ranking ----------
  V.ranking = ctx => {
    const rk = ctx.db.ranking(), root_ = h('div'), top = rk.slice(0, 3);
    root_.appendChild(h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Ranking global'), h('p', null, 'Rendimiento acumulado de los equipos en todos los torneos. Se ordena por títulos, victorias y diferencia de puntaje.'))));
    if (!rk.length) { root_.appendChild(h('div', { class: 'panel' }, empty('chart', 'Sin datos todavía', 'El ranking se genera al registrar resultados.'))); return root_; }
    root_.appendChild(h('div', { class: 'grid g3' }, top.map((t, i) => h('section', { class: 'panel ' + (i === 0 ? 'accent' : ''), style: { padding: '20px', textAlign: 'center' } }, h('div', { style: { font: '700 14px var(--display)', letterSpacing: '.2em', color: i === 0 ? 'var(--ac2)' : 'var(--tx3)' } }, ['PRIMER LUGAR', 'SEGUNDO LUGAR', 'TERCER LUGAR'][i]), h('div', { style: { margin: '14px 0 10px', display: 'flex', justifyContent: 'center' } }, teamBadge(t.nombre, 'lg')), h('h3', null, t.nombre),
      h('div', { class: 'row', style: { justifyContent: 'center', gap: '22px', marginTop: '12px' } }, [['Títulos', t.titulos], ['Victorias', t.pg], ['Efectividad', t.efectividad + '%']].map(([l, v]) => h('div', null, h('div', { style: { font: '700 22px var(--display)' } }, v), h('div', { class: 'dim', style: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em' } }, l))))))));
    root_.appendChild(h('div', { class: 'grid g-main mt' }, h('section', { class: 'panel' }, h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['#', 'Equipo', 'Títulos', 'Torneos', 'PJ', 'PG', 'PP', 'DG', 'Efect.'].map((x, i) => h('th', { class: i > 1 ? 'c' : '' }, x)))),
      h('tbody', null, rk.map((r, i) => h('tr', null, h('td', { class: 'dim num' }, i + 1), h('td', null, h('div', { class: 'row' }, teamBadge(r.nombre, 'sm'), h('b', null, r.nombre))), [r.titulos, r.torneos, r.pj, r.pg, r.pp, (r.gf - r.gc > 0 ? '+' : '') + (r.gf - r.gc), r.efectividad + '%'].map(v => h('td', { class: 'c num' }, v)))))))),
      h('section', { class: 'panel' }, h('header', null, icon('chart'), h('h3', null, 'Efectividad (% de victorias)')), h('div', { class: 'body' }, barsH(rk.filter(r => r.pj).slice().sort((a, b) => b.efectividad - a.efectividad).slice(0, 10).map(r => ({ label: r.nombre, value: r.efectividad, text: r.efectividad + '%' })), { width: 420, left: 140, label: 'Efectividad por equipo' })))));
    return root_;
  };
})(this);
