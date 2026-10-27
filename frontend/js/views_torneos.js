// LobbyMaster Beta 4 · vistas: inicio y torneos (incluye bracket y resultados). Autor: Yair Anibal Mamani Ticona
(function (root) {
  const { h, icon, fmtDate, chip, teamBadge, toast, modal, confirmBox, field, showErrors, barsH, gameCover, empty } = root.UI;
  const Auth = root.Auth, V = (root.Views = root.Views || {});
  const run = (ctx, fn, ok) => { try { const r = fn(); if (ok) toast(typeof ok === 'function' ? ok(r) : ok, 'ok'); ctx.refresh(); return r; } catch (e) { if (e.name === 'VErr') toast(e.message, 'bad'); else { console.error(e); toast('Ocurrió un error inesperado', 'bad'); } return null; } };
  V.run = run;
  const kpi = (ic, label, value, sub) => h('div', { class: 'panel kpi' }, h('div', { class: 'l' }, icon(ic), label), h('div', { class: 'v' }, value), sub ? h('small', null, sub) : null);
  const pow2 = n => { let s = 1; while (s < n) s *= 2; return s; };

  // ---------- tarjeta de torneo ----------
  function tCard(ctx, t) {
    const pct = Math.min(100, Math.round(t.aprobados / t.cupos * 100));
    return h('article', { class: 'panel tcard', tabindex: '0', onclick: () => ctx.go('torneos/' + t.id_torneo), onkeydown: e => { if (e.key === 'Enter') ctx.go('torneos/' + t.id_torneo); } },
      h('div', { class: 'cover', style: { background: gameCover(t.juego) } }, h('span', { class: 'game' }, t.juego), chip(t.estado)),
      h('div', { class: 'tb' }, h('h3', null, t.nombre),
        h('div', { class: 'meta' }, h('div', null, icon('calendar'), fmtDate(t.fecha)), h('div', null, icon('pin'), t.sede_nombre), h('div', null, icon('user'), 'Organiza ' + t.organizador)),
        h('div', { style: { marginTop: 'auto' } }, h('div', { class: 'row', style: { marginBottom: '6px', fontSize: '12.5px' } }, h('span', { class: 'muted' }, 'Cupos aprobados'), h('b', { class: 'sp num' }, t.aprobados + ' / ' + t.cupos)), h('div', { class: 'prog' }, h('i', { style: { width: pct + '%' } })))));
  }

  // ---------- inicio ----------
  V.inicio = ctx => {
    const { db, user } = ctx, r = db.resumen(), isMgr = user.rol !== 'jugador';
    const root_ = h('div');
    root_.appendChild(h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Hola, ' + user.nombre_usuario), h('p', null, user.rol === 'admin' ? 'Panel de administración: supervisa usuarios, torneos y la integridad de los datos.' : user.rol === 'organizador' ? 'Gestiona tus torneos, aprueba inscripciones y registra resultados.' : 'Inscribe a tu equipo, sigue los brackets y revisa tus estadísticas.')),
      h('div', { class: 'row sp' }, Auth.can(user, 'torneo.crear') ? h('button', { class: 'btn pri', onclick: () => V.torneoForm(ctx) }, icon('plus'), 'Nuevo torneo') : h('button', { class: 'btn pri', onclick: () => ctx.go('torneos') }, icon('trophy'), 'Ver torneos'))));
    root_.appendChild(h('div', { class: 'grid g4' }, kpi('trophy', 'Torneos activos', r.abiertos + r.en_curso, r.abiertos + ' abiertos · ' + r.en_curso + ' en curso'), kpi('users', 'Equipos', r.equipos, r.jugadores + ' jugadores en roster'), kpi('flag', 'Partidas jugadas', r.partidas, r.finalizados + ' torneo(s) finalizado(s)'), kpi('clock', isMgr ? 'Por aprobar' : 'Sedes', isMgr ? r.pendientes : r.sedes, isMgr ? 'inscripciones pendientes' : 'puntos de juego en La Paz y El Alto')));

    const left = h('div', { class: 'stack' }), right = h('div', { class: 'stack' });
    // bloque segun rol
    if (isMgr) {
      const mine = db.listTorneos().filter(t => Auth.canManageTorneo(user, t));
      const pend = mine.filter(t => t.estado === 'abierto').flatMap(t => db.listInscripciones(t.id_torneo).filter(i => i.estado === 'pendiente').map(i => Object.assign(i, { torneo: t })));
      left.appendChild(h('section', { class: 'panel accent' }, h('header', null, icon('clock'), h('h3', null, 'Inscripciones pendientes'), h('span', { class: 'chip warn sp' }, pend.length)),
        pend.length ? h('ul', { class: 'list', style: { padding: '0 18px' } }, pend.slice(0, 6).map(i => h('li', null, teamBadge(i.equipo), h('div', { class: 'grow' }, h('b', null, i.equipo), h('div', { class: 'dim', style: { fontSize: '12.5px' } }, i.torneo.nombre + ' · capitán ' + i.capitan)),
          h('button', { class: 'btn sm ok', onclick: () => run(ctx, () => db.resolver(user, i.id_inscripcion, 'aprobado'), 'Inscripción aprobada') }, icon('check'), 'Aprobar'), h('button', { class: 'btn sm danger', onclick: () => run(ctx, () => db.resolver(user, i.id_inscripcion, 'rechazado'), 'Inscripción rechazada') }, icon('x'))))) : empty('check', 'Todo al día', 'No hay inscripciones esperando tu revisión.')));
      left.appendChild(h('section', { class: 'panel' }, h('header', null, icon('trophy'), h('h3', null, user.rol === 'admin' ? 'Todos los torneos' : 'Mis torneos'), h('a', { class: 'sp', href: '#/torneos' }, 'Ver todos')),
        mine.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['Torneo', 'Juego', 'Fecha', 'Cupos', 'Estado'].map(x => h('th', null, x)))),
          h('tbody', null, mine.slice(0, 6).map(t => h('tr', { style: { cursor: 'pointer' }, onclick: () => ctx.go('torneos/' + t.id_torneo) }, h('td', null, h('b', null, t.nombre)), h('td', null, t.juego), h('td', { class: 'num' }, fmtDate(t.fecha)), h('td', { class: 'num' }, t.aprobados + '/' + t.cupos), h('td', null, chip(t.estado))))))) : empty('trophy', 'Aún no tienes torneos', 'Crea tu primer torneo para empezar a recibir inscripciones.', h('button', { class: 'btn pri', onclick: () => V.torneoForm(ctx) }, icon('plus'), 'Crear torneo'))));
    } else {
      const teams = db.listTeams({ captainId: user.id_usuario }), ins = db.listInscripcionesDeEquipos(teams.map(t => t.id_equipo));
      left.appendChild(h('section', { class: 'panel accent' }, h('header', null, icon('users'), h('h3', null, 'Mi equipo'), h('a', { class: 'sp', href: '#/equipos' }, 'Gestionar')),
        teams.length ? h('div', { class: 'body stack' }, teams.map(t => h('div', { class: 'row' }, teamBadge(t.nombre, 'lg'), h('div', { class: 'grow' }, h('h3', null, t.nombre), h('div', { class: 'row wrap', style: { gap: '6px', marginTop: '6px' } }, t.jugadores.map(j => h('span', { class: 'tag' }, j))))))) : empty('users', 'Aún no tienes equipo', 'Crea tu equipo y registra a sus jugadores para poder inscribirte.', h('button', { class: 'btn pri', onclick: () => ctx.go('equipos') }, icon('plus'), 'Crear equipo'))));
      left.appendChild(h('section', { class: 'panel' }, h('header', null, icon('flag'), h('h3', null, 'Mis inscripciones')),
        ins.length ? h('ul', { class: 'list', style: { padding: '0 18px' } }, ins.map(i => h('li', { style: { cursor: 'pointer' }, onclick: () => ctx.go('torneos/' + i.id_torneo) }, teamBadge(i.equipo), h('div', { class: 'grow' }, h('b', null, i.torneo), h('div', { class: 'dim', style: { fontSize: '12.5px' } }, i.equipo)), chip(i.estado)))) : empty('flag', 'Sin inscripciones', 'Explora los torneos abiertos e inscribe a tu equipo.', h('button', { class: 'btn', onclick: () => ctx.go('torneos') }, 'Ver torneos'))));
    }
    // columna derecha
    const prox = db.listTorneos().filter(t => t.estado === 'abierto').slice(0, 4);
    right.appendChild(h('section', { class: 'panel' }, h('header', null, icon('calendar'), h('h3', null, 'Próximos torneos')), prox.length ? h('ul', { class: 'list', style: { padding: '0 18px' } }, prox.map(t => h('li', { style: { cursor: 'pointer' }, onclick: () => ctx.go('torneos/' + t.id_torneo) }, h('div', { class: 'grow' }, h('b', null, t.nombre), h('div', { class: 'dim', style: { fontSize: '12.5px' } }, t.juego + ' · ' + fmtDate(t.fecha))), h('span', { class: 'mono muted' }, t.aprobados + '/' + t.cupos)))) : empty('calendar', 'Sin torneos próximos', 'Cuando se abran nuevos torneos aparecerán aquí.')));
    right.appendChild(h('section', { class: 'panel' }, h('header', null, icon('chart'), h('h3', null, 'Torneos por juego')), h('div', { class: 'body' }, barsH(r.porJuego.map(x => ({ label: x.juego, value: x.torneos })), { width: 420, left: 130, label: 'Torneos por juego' }))));
    if (isMgr) right.appendChild(h('section', { class: 'panel' }, h('header', null, icon('list'), h('h3', null, 'Actividad reciente')), h('ul', { class: 'list log', style: { padding: '0 18px' } }, db.bitacora(7).map(l => h('li', null, h('span', { class: 't' }, l.t.slice(5, 16).replace('-', '/')), h('div', null, h('b', null, l.u), ' ', l.msg))))));
    root_.appendChild(h('div', { class: 'grid g-main mt' }, left, right));
    return root_;
  };

  // ---------- lista de torneos ----------
  const F = { q: '', estado: 'todos', juego: '' };
  V.torneos = ctx => {
    const { db, user } = ctx, root_ = h('div');
    const grid = h('div', { class: 'grid g3' });
    const draw = () => {
      const q = F.q.trim().toLowerCase();
      const list = db.listTorneos().filter(t => (F.estado === 'todos' || t.estado === F.estado) && (!F.juego || String(t.id_juego) === F.juego) && (!q || (t.nombre + ' ' + t.juego + ' ' + t.sede_nombre).toLowerCase().includes(q)));
      grid.replaceChildren(...(list.length ? list.map(t => tCard(ctx, t)) : [h('div', { style: { gridColumn: '1/-1' }, class: 'panel' }, empty('search', 'Sin resultados', 'Prueba con otros filtros o crea un torneo nuevo.'))]));
    };
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Filtrar por estado' }, [['todos', 'Todos'], ['abierto', 'Abiertos'], ['en_curso', 'En curso'], ['finalizado', 'Finalizados']].map(([v, l]) => h('button', { type: 'button', class: v === F.estado ? 'on' : '', onclick: e => { F.estado = v; seg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); } }, l)));
    const gsel = h('select', { class: 'input', style: { width: '190px' }, 'aria-label': 'Filtrar por juego', onchange: e => { F.juego = e.target.value; draw(); } }, h('option', { value: '' }, 'Todos los juegos'), db.listGames().map(g => h('option', { value: g.id_juego, selected: String(g.id_juego) === F.juego }, g.nombre)));
    root_.appendChild(h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Torneos'), h('p', null, 'Explora los torneos de la comunidad, revisa sus brackets y sigue los resultados.')), h('div', { class: 'sp' }, Auth.can(user, 'torneo.crear') ? h('button', { class: 'btn pri', onclick: () => V.torneoForm(ctx) }, icon('plus'), 'Nuevo torneo') : null)));
    root_.appendChild(h('div', { class: 'row wrap', style: { marginBottom: '16px' } }, h('div', { class: 'search grow', style: { minWidth: '220px' } }, icon('search'), h('input', { class: 'input', placeholder: 'Buscar por nombre, juego o sede', value: F.q, 'aria-label': 'Buscar torneos', oninput: e => { F.q = e.target.value; draw(); } })), seg, gsel));
    root_.appendChild(grid); draw(); return root_;
  };

  // ---------- formulario de torneo ----------
  V.torneoForm = (ctx, t) => {
    const { db, user } = ctx;
    const fN = field({ label: 'Nombre del torneo', name: 'nombre', value: t ? t.nombre : '', placeholder: 'Ej. Copa Illimani Valorant', maxlength: 40 });
    const fJ = field({ label: 'Videojuego', name: 'id_juego', value: t ? t.id_juego : '', placeholder: 'Selecciona…', options: db.listGames().map(g => ({ value: g.id_juego, label: g.nombre })) });
    const fS = field({ label: 'Sede', name: 'id_sede', value: t ? t.id_sede : '', placeholder: 'Selecciona…', options: db.listSedes().map(s => ({ value: s.id_sede, label: s.nombre })), hint: 'Si el lugar no está en la lista, agrégalo con «Nueva sede».' });
    if (Auth.can(user, 'sede.crear') && V.sedeForm) fS.el.appendChild(h('button', { class: 'btn sm', type: 'button', style: { marginTop: '6px' }, onclick: () => V.sedeForm(ctx, null, ns => { fS.input.appendChild(h('option', { value: ns.id_sede }, ns.nombre)); fS.input.value = String(ns.id_sede); fS.error(''); }) }, icon('pin'), 'Nueva sede en el mapa'));
    const fF = field({ label: 'Fecha', name: 'fecha', type: 'date', value: t ? t.fecha : '', min: db.today() });
    const fC = field({ label: 'Cupos (4 a 32)', name: 'cupos', type: 'number', value: t ? t.cupos : 8, min: 4, max: 32, hint: 'Cantidad máxima de equipos aprobados.' });
    const orgs = db.listUsers().filter(u => u.rol !== 'jugador'), fO = Auth.can(user, 'torneo.gestionar_todos') && !t ? field({ label: 'Organizador', name: 'id_organizador', value: user.id_usuario, options: orgs.map(u => ({ value: u.id_usuario, label: u.nombre_usuario })) }) : null;
    const all = [fN, fJ, fS, fF, fC].concat(fO ? [fO] : []);
    const form = h('form', { class: 'form', novalidate: true }, fN.el, h('div', { class: 'two' }, fJ.el, fS.el), h('div', { class: 'two' }, fF.el, fC.el), fO ? fO.el : null, h('div', { class: 'alert' }, 'Formato: eliminación directa. El bracket se genera cuando haya al menos ' + db.MIN_EQUIPOS + ' equipos aprobados.'));
    const save = () => {
      const data = { nombre: fN.value, id_juego: fJ.value, id_sede: fS.value, fecha: fF.value, cupos: fC.value === '' ? NaN : Number(fC.value), id_organizador: fO ? fO.value : undefined };
      try { const r = t ? db.updateTorneo(user, t.id_torneo, data) : db.createTorneo(user, data); toast(t ? 'Torneo actualizado' : 'Torneo creado', 'ok'); m.close(); if (t) ctx.refresh(); else ctx.go('torneos/' + r.id_torneo); }
      catch (e) { if (e.name !== 'VErr') throw e; if (!showErrors(all, e)) toast(e.message, 'bad'); }
      return false;
    };
    form.addEventListener('submit', e => { e.preventDefault(); save(); });
    const m = modal({ title: t ? 'Editar torneo' : 'Nuevo torneo', body: form, actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: t ? 'Guardar cambios' : 'Crear torneo', cls: 'pri', onClick: save, keep: true }] });
  };

  // ---------- modales del bracket ----------
  function resultModal(ctx, t, mt) {
    const { db, user } = ctx;
    const fa = field({ label: mt.a.nombre, name: 'sa', type: 'number', value: mt.jugado ? mt.sa : '', min: 0, max: db.MAX_PUNTAJE, inputmode: 'numeric' });
    const fb = field({ label: mt.b.nombre, name: 'sb', type: 'number', value: mt.jugado ? mt.sb : '', min: 0, max: db.MAX_PUNTAJE, inputmode: 'numeric' });
    const warn = h('div', { class: 'alert warn hidden' });
    const upd = () => { const a = Number(fa.value), b = Number(fb.value); const n = fa.value !== '' && fb.value !== '' ? db.previewImpact(mt.id_enfrentamiento, a, b) : 0; warn.classList.toggle('hidden', !n); warn.textContent = n ? 'Este cambio modifica al ganador: se borrarán ' + n + ' resultado(s) de rondas posteriores que dependían de este cruce.' : ''; };
    fa.input.addEventListener('input', () => { fb.error(''); upd(); }); fb.input.addEventListener('input', () => { fa.error(''); upd(); });
    const body = h('form', { class: 'form', novalidate: true }, h('div', { class: 'row', style: { gap: '14px' } }, teamBadge(mt.a.nombre, 'lg'), h('div', { class: 'grow' }, h('h3', null, mt.a.nombre), h('div', { class: 'dim' }, 'vs ' + mt.b.nombre)), teamBadge(mt.b.nombre, 'lg')),
      h('div', { class: 'two' }, fa.el, fb.el), h('div', { class: 'hint dim' }, 'Ingresa mapas o rondas ganadas (0 a ' + db.MAX_PUNTAJE + '). En eliminación directa no hay empates.'), warn);
    const save = async () => {
      const a = fa.value === '' ? NaN : Number(fa.value), b = fb.value === '' ? NaN : Number(fb.value);
      try {
        const n = db.previewImpact(mt.id_enfrentamiento, a, b);
        if (n && !(await confirmBox({ title: 'Cambiar el ganador', message: 'Se borrarán ' + n + ' resultado(s) posteriores. ¿Deseas continuar?', confirm: 'Sí, corregir', danger: true }))) return;
        const r = db.registrarResultado(user, mt.id_enfrentamiento, a, b);
        mdl.close(); toast(r.campeon ? '¡' + r.campeon.nombre + ' es el campeón de ' + t.nombre + '!' : 'Resultado registrado', 'ok'); ctx.refresh();
      } catch (e) { if (e.name !== 'VErr') throw e; if (!showErrors([fa, fb], e)) toast(e.message, 'bad'); }
    };
    body.addEventListener('submit', e => { e.preventDefault(); save(); });
    const mdl = modal({ title: mt.jugado ? 'Corregir resultado' : 'Registrar resultado', body, actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Guardar', cls: 'pri', icon: 'check', onClick: () => { save(); return false; }, keep: true }] });
  }
  function generateModal(ctx, t) {
    const { db, user } = ctx; let modo = 'orden';
    const n = t.aprobados, size = pow2(Math.max(n, 2));
    const opts = [['orden', 'Por orden de inscripción', 'Los equipos aprobados primero reciben los BYE si el número no es potencia de 2.'], ['sorteo', 'Sorteo aleatorio', 'Se mezclan los equipos antes de armar los cruces.']];
    const cards = opts.map(([v, l, d]) => h('button', { type: 'button', class: 'panel', style: { textAlign: 'left', padding: '14px', borderColor: v === modo ? 'var(--ac)' : '', background: v === modo ? 'var(--ac-soft)' : '' }, onclick: () => { modo = v; cards.forEach((c, i) => { c.style.borderColor = opts[i][0] === modo ? 'var(--ac)' : ''; c.style.background = opts[i][0] === modo ? 'var(--ac-soft)' : ''; }); } }, h('b', null, l), h('div', { class: 'muted', style: { fontSize: '13px', marginTop: '4px' } }, d)));
    modal({ title: 'Generar bracket', body: h('div', { class: 'stack' }, h('div', { class: 'alert' }, n + ' equipos aprobados → bracket de ' + size + ' posiciones' + (size > n ? ' con ' + (size - n) + ' BYE (pasan directo a la siguiente ronda)' : '') + '. Al generarlo se cierran las inscripciones.'), cards),
      actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Generar bracket', cls: 'pri', icon: 'bracket', onClick: () => { V.run(ctx, () => db.generarBracket(user, t.id_torneo, modo), 'Bracket generado. ¡Que comiencen los cruces!'); } }] });
  }
  function inscribirModal(ctx, t) {
    const { db, user } = ctx;
    const mine = Auth.can(user, 'equipo.ver_todos') ? db.listTeams() : db.listTeams({ captainId: user.id_usuario });
    const taken = new Set(db.listInscripciones(t.id_torneo).map(i => i.id_equipo)), free = mine.filter(e => !taken.has(e.id_equipo));
    if (!free.length) { modal({ title: 'Inscribir equipo', body: h('div', { class: 'stack' }, h('p', null, mine.length ? 'Todos tus equipos ya están inscritos en este torneo.' : 'Todavía no tienes un equipo. Créalo primero y vuelve a inscribirte.')), actions: mine.length ? [{ label: 'Entendido', cls: 'pri' }] : [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Crear equipo', cls: 'pri', onClick: () => ctx.go('equipos') }] }); return; }
    const f = field({ label: 'Equipo', name: 'id_equipo', value: free[0].id_equipo, options: free.map(e => ({ value: e.id_equipo, label: e.nombre + ' (' + e.jugadores.length + ' jugadores)' })) });
    modal({ title: 'Inscribir equipo', body: h('div', { class: 'stack' }, f.el, h('div', { class: 'alert' }, 'La inscripción queda pendiente hasta que el organizador la apruebe.')),
      actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Enviar inscripción', cls: 'pri', onClick: () => { try { db.inscribir(user, t.id_torneo, Number(f.value)); toast('Inscripción enviada', 'ok'); ctx.refresh(); } catch (e) { if (e.name !== 'VErr') throw e; f.error(e.message); return false; } } }] });
  }

  // ---------- detalle ----------
  V.torneoDetalle = ctx => {
    const { db, user } = ctx, t = db.getTorneo(Number(ctx.params.id));
    if (!t) return empty('trophy', 'Torneo no encontrado', 'Es posible que haya sido eliminado.', h('button', { class: 'btn', onclick: () => ctx.go('torneos') }, 'Volver a torneos'));
    const tab = ctx.query.tab || 'bracket', manage = Auth.canManageTorneo(user, t), bk = db.getBracket(t.id_torneo), ins = db.listInscripciones(t.id_torneo);
    const myTeams = db.listTeams({ captainId: user.id_usuario }).map(e => e.id_equipo), myIns = ins.filter(i => myTeams.includes(i.id_equipo));
    const root_ = h('div'), go = x => ctx.go('torneos/' + t.id_torneo + (x === 'bracket' ? '' : '?tab=' + x));
    // cabecera
    const acts = h('div', { class: 'row wrap sp' });
    if (t.estado === 'abierto' && Auth.can(user, 'inscribir') && !manage) acts.appendChild(h('button', { class: 'btn pri', onclick: () => inscribirModal(ctx, t) }, icon('plus'), 'Inscribir mi equipo'));
    if (manage && t.estado === 'abierto') { acts.appendChild(h('button', { class: 'btn pri', onclick: () => generateModal(ctx, t) }, icon('bracket'), 'Generar bracket')); acts.appendChild(h('button', { class: 'btn', onclick: () => V.torneoForm(ctx, t) }, icon('edit'), 'Editar')); }
    if (manage && bk) acts.appendChild(h('button', { class: 'btn', onclick: async () => { if (await confirmBox({ title: 'Reiniciar bracket', message: 'Se eliminarán todos los cruces y resultados y el torneo volverá a recibir inscripciones.', confirm: 'Reiniciar', danger: true })) V.run(ctx, () => db.reiniciarBracket(user, t.id_torneo), 'Bracket reiniciado'); } }, icon('refresh'), 'Reiniciar'));
    if (manage && (t.estado === 'abierto' || Auth.can(user, 'torneo.gestionar_todos'))) acts.appendChild(h('button', { class: 'btn danger', onclick: async () => { if (await confirmBox({ title: 'Eliminar torneo', message: '¿Eliminar «' + t.nombre + '»? Se borrarán sus inscripciones, cruces y resultados.', confirm: 'Eliminar', danger: true })) { try { db.deleteTorneo(user, t.id_torneo); toast('Torneo eliminado', 'ok'); ctx.go('torneos'); } catch (e) { toast(e.message, 'bad'); } } } }, icon('trash')));
    root_.appendChild(h('section', { class: 'panel hero' }, h('div', { class: 'cover-art', style: { background: gameCover(t.juego) } }),
      h('div', { class: 'grow', style: { minWidth: '260px' } }, h('div', { class: 'row wrap', style: { marginBottom: '8px' } }, chip(t.estado), h('span', { class: 'tag' }, t.juego)), h('h1', null, t.nombre),
        h('div', { class: 'row wrap muted', style: { marginTop: '12px', gap: '18px' } }, h('span', { class: 'row' }, icon('calendar'), fmtDate(t.fecha)), h('span', { class: 'row' }, icon('pin'), t.sede_nombre), h('span', { class: 'row' }, icon('user'), 'Organiza ' + t.organizador), h('span', { class: 'row' }, icon('users'), t.aprobados + ' / ' + t.cupos + ' equipos'))), acts));
    if (myIns.length && t.estado === 'abierto') root_.appendChild(h('div', { class: 'alert mt ' + (myIns[0].estado === 'aprobado' ? 'ok' : myIns[0].estado === 'rechazado' ? 'bad' : 'warn') }, 'Tu equipo «' + myIns[0].equipo + '» tiene la inscripción ' + myIns[0].estado + '.'));
    root_.appendChild(h('div', { class: 'tabs mt', role: 'tablist' }, [['bracket', 'bracket', 'Bracket'], ['equipos', 'users', 'Equipos e inscripciones (' + t.inscritos + ')'], ['posiciones', 'chart', 'Estadísticas'], ['info', 'info', 'Información']].map(([k, ic, l]) => h('button', { role: 'tab', class: tab === k ? 'on' : '', 'aria-selected': String(tab === k), onclick: () => go(k) }, icon(ic), l))));

    if (tab === 'bracket') {
      if (!bk) {
        root_.appendChild(h('div', { class: 'panel' }, empty('bracket', 'El bracket aún no se genera', t.estado === 'abierto' ? (manage ? (t.aprobados >= db.MIN_EQUIPOS ? 'Ya hay ' + t.aprobados + ' equipos aprobados. Genera los cruces cuando cierres las inscripciones.' : 'Aprueba al menos ' + db.MIN_EQUIPOS + ' equipos para poder generar los cruces (hay ' + t.aprobados + ').') : 'Se publicará cuando el organizador cierre las inscripciones.') : 'No hay cruces registrados.',
          manage && t.estado === 'abierto' ? h('button', { class: 'btn pri', disabled: t.aprobados < db.MIN_EQUIPOS, onclick: () => generateModal(ctx, t) }, icon('bracket'), 'Generar bracket') : null)));
      } else {
        const pend = bk.rounds.flat().filter(m => m.jugable && !m.jugado);
        root_.appendChild(h('div', { class: 'row wrap', style: { marginBottom: '12px', justifyContent: 'space-between' } }, h('div', { class: 'legend' }, h('span', null, h('i', { style: { background: 'var(--ac)' } }), 'Ganador / camino recorrido'), h('span', null, h('i', { style: { background: 'var(--line2)' } }), 'Pendiente'), h('span', null, 'BYE: pasa directo a la siguiente ronda')), manage ? h('span', { class: 'chip ac plain', style: { height: 'auto', padding: '3px 9px', whiteSpace: 'normal' } }, 'Pulsa un cruce para registrar o corregir el resultado') : null));
        root_.appendChild(root.BracketView.render(bk, { onPick: manage ? m => resultModal(ctx, t, m) : null }));
        if (pend.length) root_.appendChild(h('section', { class: 'panel mt' }, h('header', null, icon('clock'), h('h3', null, 'Próximos cruces'), h('span', { class: 'chip warn sp' }, pend.length)),
          h('ul', { class: 'list', style: { padding: '0 18px' } }, pend.map(m => h('li', null, h('span', { class: 'mono dim', style: { minWidth: '44px' } }, 'M' + m.ronda + '.' + m.posicion), teamBadge(m.a.nombre, 'sm'), h('b', null, m.a.nombre), h('span', { class: 'dim' }, 'vs'), teamBadge(m.b.nombre, 'sm'), h('b', null, m.b.nombre), h('span', { class: 'tag sp' }, bk.nombres[m.ronda - 1]), manage ? h('button', { class: 'btn sm', onclick: () => resultModal(ctx, t, m) }, 'Registrar') : null)))));
      }
    }
    if (tab === 'equipos') {
      const ord = { aprobado: 0, pendiente: 1, rechazado: 2 };
      root_.appendChild(h('section', { class: 'panel' }, ins.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['Equipo', 'Capitán', 'Roster', 'Estado', ''].map(x => h('th', null, x)))),
        h('tbody', null, ins.slice().sort((a, b) => ord[a.estado] - ord[b.estado] || a.id_inscripcion - b.id_inscripcion).map(i => h('tr', null,
          h('td', null, h('div', { class: 'row' }, teamBadge(i.equipo), h('b', null, i.equipo), myTeams.includes(i.id_equipo) ? h('span', { class: 'chip ac plain' }, 'Tu equipo') : null)), h('td', null, i.capitan),
          h('td', null, h('div', { class: 'row wrap', style: { gap: '4px' } }, i.jugadores.map(j => h('span', { class: 'tag' }, j)))), h('td', null, chip(i.estado)),
          h('td', { class: 'r' }, h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, manage && t.estado === 'abierto' ? [i.estado !== 'aprobado' ? h('button', { class: 'btn sm ok', onclick: () => V.run(ctx, () => db.resolver(user, i.id_inscripcion, 'aprobado'), 'Equipo aprobado') }, icon('check'), 'Aprobar') : null, i.estado !== 'rechazado' ? h('button', { class: 'btn sm danger', onclick: () => V.run(ctx, () => db.resolver(user, i.id_inscripcion, 'rechazado'), 'Inscripción rechazada') }, icon('x'), 'Rechazar') : null] : null,
            t.estado === 'abierto' && (myTeams.includes(i.id_equipo) && !manage) ? h('button', { class: 'btn sm', onclick: () => V.run(ctx, () => db.retirar(user, i.id_inscripcion), 'Inscripción retirada') }, 'Retirar') : null))))))) : empty('users', 'Aún no hay equipos inscritos', 'Los equipos aparecerán aquí cuando envíen su inscripción.')));
    }
    if (tab === 'posiciones') {
      const rows = db.tablaTorneo(t.id_torneo);
      root_.appendChild(rows.length ? h('div', { class: 'grid g-main' }, h('section', { class: 'panel' }, h('header', null, icon('chart'), h('h3', null, 'Tabla de rendimiento')), h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['#', 'Equipo', 'PJ', 'PG', 'PP', 'GF', 'GC', 'DG'].map((x, i) => h('th', { class: i > 1 ? 'c' : '' }, x)))),
        h('tbody', null, rows.map((r, i) => h('tr', null, h('td', { class: 'dim num' }, i + 1), h('td', null, h('div', { class: 'row' }, teamBadge(r.nombre, 'sm'), h('b', null, r.nombre), bk && bk.campeon && bk.campeon.id_equipo === r.id_equipo ? h('span', { class: 'chip ac plain' }, 'Campeón') : null)), [r.pj, r.pg, r.pp, r.gf, r.gc, (r.dg > 0 ? '+' : '') + r.dg].map(v => h('td', { class: 'c num' }, v)))))))),
        h('section', { class: 'panel' }, h('header', null, icon('flag'), h('h3', null, 'Victorias por equipo')), h('div', { class: 'body' }, barsH(rows.map(r => ({ label: r.nombre, value: r.pg })), { width: 420, left: 140, label: 'Victorias por equipo' })))) : h('div', { class: 'panel' }, empty('chart', 'Sin estadísticas todavía', 'Se calculan automáticamente cuando se registran resultados.')));
    }
    if (tab === 'info') {
      const s = t.sede;
      root_.appendChild(h('div', { class: 'grid g2' }, h('section', { class: 'panel' }, h('header', null, icon('info'), h('h3', null, 'Datos del torneo')), h('dl', { class: 'kv body' }, h('dt', null, 'Videojuego'), h('dd', null, t.juego), h('dt', null, 'Fecha'), h('dd', null, fmtDate(t.fecha)), h('dt', null, 'Formato'), h('dd', null, 'Eliminación directa'), h('dt', null, 'Cupos'), h('dd', null, t.aprobados + ' aprobados de ' + t.cupos + ' · ' + t.pendientes + ' pendientes'), h('dt', null, 'Organizador'), h('dd', null, t.organizador), h('dt', null, 'Estado'), h('dd', null, chip(t.estado)))),
        h('section', { class: 'panel' }, h('header', null, icon('pin'), h('h3', null, 'Sede del torneo')), s ? h('div', { class: 'body stack' }, h('dl', { class: 'kv' }, h('dt', null, 'Lugar'), h('dd', null, s.nombre), h('dt', null, 'Dirección'), h('dd', null, s.direccion || '—')), root.Mapa.viewer([s], { selected: s.id_sede, label: 'Mapa de la sede del torneo' }), root.Mapa.botones(s)) : h('div', { class: 'body' }, '—'))));
    }
    return root_;
  };
})(this);
