// LobbyMaster Beta 4 · vistas: equipos, sedes (mapa) y ranking. Autor: Yair Anibal Mamani Ticona
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
  // Formulario de sede: se elige el lugar en el mapa (o se busca / pega el enlace de Google Maps); no se escriben coordenadas.
  function sedeForm(ctx, s, onSaved) {
    const { db, user } = ctx;
    const f = { nombre: field({ label: 'Nombre de la sede', name: 'nombre', value: s ? s.nombre : '', maxlength: 60, placeholder: 'Ej. Arena Sopocachi' }), direccion: field({ label: 'Dirección o referencia (opcional)', name: 'direccion', value: s && s.direccion ? s.direccion : '', maxlength: 120, placeholder: 'Ej. Calle Jaimes Freyre, frente a la plaza' }) };
    const pk = root.Mapa.picker({ lat: s ? s.latitud : null, lng: s ? s.longitud : null, enlace_maps: s ? s.enlace_maps : null, name: 'ubicacion' });
    const all = [f.nombre, f.direccion, pk], form = h('form', { class: 'form', novalidate: true }, f.nombre.el, f.direccion.el, pk.el);
    const save = () => {
      try {
        const u = pk.get() || {}, d = { nombre: f.nombre.value, direccion: f.direccion.value, latitud: u.latitud == null ? '' : u.latitud, longitud: u.longitud == null ? '' : u.longitud, enlace_maps: u.enlace_maps || (s && s.enlace_maps) || '' };
        const r = s ? db.updateSede(user, s.id_sede, d) : db.addSede(user, d); toast('Sede guardada', 'ok'); m.close(); if (onSaved) onSaved(r); else ctx.refresh();
      } catch (e) { if (e.name !== 'VErr') throw e; if (!showErrors(all, e)) toast(e.message, 'bad'); }
    };
    form.addEventListener('submit', e => { e.preventDefault(); save(); });
    const m = modal({ title: s ? 'Editar sede' : 'Nueva sede', wide: true, body: form, actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Guardar sede', cls: 'pri', onClick: () => { save(); return false; }, keep: true }] });
  }
  V.sedeForm = sedeForm;
  let selSede = null;
  V.sedes = ctx => {
    const { db, user } = ctx, sedes = db.listSedes(), ts = db.listTorneos(), isAdm = Auth.can(user, 'catalogos.admin'), puedeCrear = Auth.can(user, 'sede.crear');
    if (!sedes.some(s => s.id_sede === selSede)) selSede = sedes.length ? sedes[0].id_sede : null;
    const root_ = h('div');
    const sel = sedes.find(s => s.id_sede === selSede);
    root_.appendChild(h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Sedes y mapa'), h('p', null, 'Lugares donde se juegan los torneos. Se ubican en el mapa o con Google Maps; no hace falta saber coordenadas.')), h('div', { class: 'sp' }, puedeCrear ? h('button', { class: 'btn pri', onclick: () => sedeForm(ctx) }, icon('plus'), 'Nueva sede') : null)));
    if (!sedes.length) { root_.appendChild(h('div', { class: 'panel' }, empty('pin', 'Aún no hay sedes', puedeCrear ? 'Agrega la primera con el botón «Nueva sede».' : 'El administrador u organizadores pueden agregarlas.'))); return root_; }
    const torneosDe = id => ts.filter(t => t.id_sede === id);
    root_.appendChild(h('div', { class: 'grid g-main' },
      h('div', null, root.Mapa.viewer(sedes, { tall: true, selected: selSede, labels: true, onPick: id => { selSede = id; ctx.refresh(); }, label: 'Mapa con todas las sedes. Toca un pin para ver sus datos.' }),
        h('p', { class: 'dim mt', style: { fontSize: '12.5px' } }, 'Arrastra para mover el mapa y usa + / − para acercar. Toca un pin para ver la sede. Mapa © colaboradores de OpenStreetMap.')),
      h('div', { class: 'stack' }, sel ? h('section', { class: 'panel accent' }, h('header', null, icon('pin'), h('h3', null, sel.nombre)),
        h('dl', { class: 'kv body' }, h('dt', null, 'Dirección'), h('dd', null, sel.direccion || 'Sin dirección escrita'), h('dt', null, 'Ubicación'), h('dd', { class: 'mono' }, sel.latitud + ', ' + sel.longitud), h('dt', null, 'Torneos'), h('dd', null, torneosDe(sel.id_sede).length ? torneosDe(sel.id_sede).map(t => h('div', null, h('a', { href: '#/torneos/' + t.id_torneo }, t.nombre), h('span', { class: 'dim' }, ' · ' + fmtDate(t.fecha)))) : 'Ninguno por ahora')),
        h('div', { style: { padding: '0 18px 14px' } }, root.Mapa.botones(sel)),
        isAdm ? h('div', { class: 'row', style: { padding: '0 18px 18px' } }, h('button', { class: 'btn sm', onclick: () => sedeForm(ctx, sel) }, icon('edit'), 'Editar'), h('button', { class: 'btn sm danger', onclick: async () => { if (await confirmBox({ title: 'Eliminar sede', message: '¿Eliminar «' + sel.nombre + '»?', confirm: 'Eliminar', danger: true })) { try { db.deleteSede(user, sel.id_sede); toast('Sede eliminada', 'ok'); ctx.refresh(); } catch (e) { toast(e.message, 'bad'); } } } }, icon('trash'), 'Eliminar')) : null) : null,
        h('section', { class: 'panel' }, h('header', null, icon('list'), h('h3', null, 'Todas las sedes')), h('ul', { class: 'list', style: { padding: '0 18px' } }, sedes.map(s => h('li', { style: { cursor: 'pointer' }, onclick: () => { selSede = s.id_sede; ctx.refresh(); } }, icon('pin'), h('b', { class: 'grow', style: { color: s.id_sede === selSede ? 'var(--ac2)' : '' } }, s.nombre), h('span', { class: 'mono dim' }, torneosDe(s.id_sede).length))))))));
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
