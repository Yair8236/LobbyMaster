// LobbyMaster Beta 3 · vistas: administracion y modelo de datos normalizado. Autor: Yair Anibal Mamani Ticona
(function (root) {
  const { h, icon, fmtDate, fmtStamp, chip, rolChip, avatar, toast, modal, confirmBox, field, showErrors, download, empty, sql } = root.UI;
  const Auth = root.Auth, V = (root.Views = root.Views || {});
  const tabsBar = (ctx, base, tabs, cur) => h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([k, ic, l]) => h('button', { role: 'tab', class: cur === k ? 'on' : '', 'aria-selected': String(cur === k), onclick: () => ctx.go(base + '?tab=' + k) }, icon(ic), l)));
  const simple = (heads, rows, cls) => h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl ' + (cls || '') }, h('thead', null, h('tr', null, heads.map(x => h('th', null, x)))), h('tbody', null, rows.map(r => h('tr', null, r.map(c => h('td', null, c)))))));

  // ---------- administracion ----------
  function userForm(ctx) {
    const { db, user } = ctx;
    const f = { nombre_usuario: field({ label: 'Usuario', name: 'nombre_usuario', maxlength: 20 }), correo: field({ label: 'Correo', name: 'correo', type: 'email', maxlength: 100 }), password: field({ label: 'Contraseña inicial', name: 'password', type: 'password', hint: 'Mínimo 8 caracteres, con letras y números.' }), rol: field({ label: 'Rol', name: 'rol', value: 'jugador', options: Object.keys(Auth.ROLES).map(r => ({ value: r, label: Auth.ROLES[r] })) }) };
    const all = Object.values(f), form = h('form', { class: 'form', novalidate: true }, f.nombre_usuario.el, f.correo.el, h('div', { class: 'two' }, f.password.el, f.rol.el));
    const save = () => { try { db.register({ nombre_usuario: f.nombre_usuario.value, correo: f.correo.value, password: f.password.value, rol: f.rol.value }, user); toast('Usuario creado', 'ok'); m.close(); ctx.refresh(); } catch (e) { if (e.name !== 'VErr') throw e; if (!showErrors(all, e)) toast(e.message, 'bad'); } };
    form.addEventListener('submit', e => { e.preventDefault(); save(); });
    const m = modal({ title: 'Nuevo usuario', body: form, actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Crear usuario', cls: 'pri', onClick: () => { save(); return false; }, keep: true }] });
  }
  let uq = '';
  V.admin = ctx => {
    const { db, user } = ctx, tab = ctx.query.tab || 'usuarios', root_ = h('div');
    root_.appendChild(h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Administración'), h('p', null, 'Usuarios, catálogos y mantenimiento de los datos de la plataforma.'))));
    root_.appendChild(tabsBar(ctx, 'admin', [['usuarios', 'users', 'Usuarios'], ['juegos', 'pad', 'Juegos'], ['sistema', 'shield', 'Sistema y bitácora']], tab));
    if (tab === 'usuarios') {
      const body = h('tbody'), draw = () => {
        const q = uq.trim().toLowerCase(), us = db.listUsers().filter(u => !q || (u.nombre_usuario + ' ' + u.correo).toLowerCase().includes(q));
        body.replaceChildren(...us.map(u => { const self = u.id_usuario === user.id_usuario;
          return h('tr', null, h('td', null, h('div', { class: 'row' }, avatar(u.nombre_usuario), h('div', null, h('b', null, u.nombre_usuario), self ? h('span', { class: 'chip ac plain', style: { marginLeft: '8px' } }, 'Tú') : null))), h('td', { class: 'muted' }, u.correo),
            h('td', null, h('select', { class: 'input', style: { width: '160px', height: '34px' }, disabled: self, 'aria-label': 'Rol de ' + u.nombre_usuario, onchange: e => { try { db.setRole(user, u.id_usuario, e.target.value); toast('Rol actualizado', 'ok'); } catch (er) { toast(er.message, 'bad'); } ctx.refresh(); } }, Object.keys(Auth.ROLES).map(r => h('option', { value: r, selected: r === u.rol }, Auth.ROLES[r])))),
            h('td', { class: 'r' }, h('button', { class: 'btn sm danger', disabled: self, 'aria-label': 'Eliminar usuario', onclick: async () => { if (await confirmBox({ title: 'Eliminar usuario', message: '¿Eliminar a «' + u.nombre_usuario + '»? Si tiene torneos o equipos asociados, la base de datos lo impedirá.', confirm: 'Eliminar', danger: true })) { try { db.deleteUser(user, u.id_usuario); toast('Usuario eliminado', 'ok'); ctx.refresh(); } catch (er) { toast(er.message, 'bad'); } } } }, icon('trash'))));
        }));
      };
      root_.appendChild(h('div', { class: 'row wrap', style: { marginBottom: '16px' } }, h('div', { class: 'search grow' }, icon('search'), h('input', { class: 'input', placeholder: 'Buscar usuario o correo', value: uq, 'aria-label': 'Buscar usuarios', oninput: e => { uq = e.target.value; draw(); } })), h('button', { class: 'btn pri', onclick: () => userForm(ctx) }, icon('plus'), 'Nuevo usuario')));
      root_.appendChild(h('section', { class: 'panel' }, h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['Usuario', 'Correo', 'Rol', ''].map(x => h('th', null, x)))), body)))); draw();
    }
    if (tab === 'juegos') {
      const f = field({ label: 'Nuevo videojuego', name: 'nombre', maxlength: 40, placeholder: 'Ej. Dota 2' }), form = h('form', { class: 'row', style: { alignItems: 'flex-start' }, novalidate: true }, h('div', { class: 'grow' }, f.el), h('button', { class: 'btn pri', style: { marginTop: '24px' }, type: 'submit' }, icon('plus'), 'Agregar'));
      form.addEventListener('submit', e => { e.preventDefault(); try { db.addGame(user, f.value); toast('Juego agregado', 'ok'); ctx.refresh(); } catch (er) { if (er.name !== 'VErr') throw er; f.error(er.fields.nombre || er.message); } });
      const gs = db.listGames(), nT = id => db.listTorneos().filter(t => t.id_juego === id).length;
      root_.appendChild(h('div', { class: 'grid g2' }, h('section', { class: 'panel' }, h('header', null, icon('pad'), h('h3', null, 'Catálogo de juegos')), h('ul', { class: 'list', style: { padding: '0 18px' } }, gs.map(g => h('li', null, h('b', { class: 'grow' }, g.nombre), h('span', { class: 'tag' }, nT(g.id_juego) + ' torneo(s)'), h('button', { class: 'btn sm danger', 'aria-label': 'Eliminar ' + g.nombre, onclick: () => { try { db.deleteGame(user, g.id_juego); toast('Juego eliminado', 'ok'); ctx.refresh(); } catch (er) { toast(er.message, 'bad'); } } }, icon('trash')))))), h('section', { class: 'panel' }, h('div', { class: 'body stack' }, form, h('div', { class: 'alert' }, 'Un juego usado por algún torneo no se puede eliminar: la clave foránea id_juego lo protege (ON DELETE RESTRICT).')))));
    }
    if (tab === 'sistema') {
      const t = db.tables(), total = Object.values(t).reduce((s, r) => s + r.length, 0);
      root_.appendChild(h('div', { class: 'grid g-main' }, h('section', { class: 'panel' }, h('header', null, icon('list'), h('h3', null, 'Bitácora de actividad')), h('ul', { class: 'list log', style: { padding: '0 18px', maxHeight: '440px', overflow: 'auto' } }, db.bitacora(40).map(l => h('li', null, h('span', { class: 't' }, fmtStamp(l.t)), h('div', null, h('b', null, l.u), ' ', l.msg))))),
        h('div', { class: 'stack' }, h('section', { class: 'panel' }, h('header', null, icon('db'), h('h3', null, 'Datos')), h('div', { class: 'body stack' }, h('p', { class: 'muted' }, total + ' registros en 9 tablas. La beta guarda todo en este navegador (localStorage).'),
          h('button', { class: 'btn', onclick: () => { download('lobbymaster_datos.sql', db.exportSQL(), 'application/sql'); toast('Archivo SQL descargado', 'ok'); } }, icon('download'), 'Exportar datos (SQL INSERT)'), h('button', { class: 'btn', onclick: () => { download('lobbymaster_datos.json', db.exportJSON(), 'application/json'); toast('Archivo JSON descargado', 'ok'); } }, icon('download'), 'Exportar datos (JSON)'),
          h('button', { class: 'btn danger', onclick: async () => { if (await confirmBox({ title: 'Restaurar datos de demostración', message: 'Se borrarán los datos actuales y se cargará nuevamente el conjunto de demostración. Tu sesión se mantiene.', confirm: 'Restaurar', danger: true })) { db.reset(user); toast('Datos de demostración restaurados', 'ok'); ctx.refresh(); } } }, icon('refresh'), 'Restaurar datos de demostración'))))));
    }
    return root_;
  };

  // ---------- modelo de datos ----------
  const tagOf = c => (c[2] === 'PK' ? h('span', { class: 'pk' }, 'PK') : c[2] === 'FK' ? h('span', { class: 'fk' }, 'FK') : c[2] === 'UQ' ? h('span', { class: 'uq' }, 'UQ') : c[2] === 'CK' ? h('span', { class: 'dim' }, 'CK') : '');
  const unnorm = [['Copa Illimani Valorant', 'Valorant', 'Arena Sopocachi', '-16.5112, -68.1262', 'organizador', 'organizador@correo-demo.bo', 'Illimani eSports', 'jugador', 'Kuntur, Yatiri, Tunupa, Nayra, Sami', '2–0 vs Pachakuti Team'],
    ['Copa Illimani Valorant', 'Valorant', 'Arena Sopocachi', '-16.5112, -68.1262', 'organizador', 'organizador@correo-demo.bo', 'Wayna Squad', 'wayna_pro', 'Ayni, Turpo, Mallki, Zorro, Vizcacha', '2–1 vs Mallku eSports'],
    ['Liga Altiplano LoL Open', 'League of Legends', 'Hub Miraflores', '-16.5045, -68.1188', 'organizador', 'organizador@correo-demo.bo', 'Condor Gaming', 'kuntur_gg', 'Puma, Pukara, Sullka, Wayra, Illa', '2–1 vs Tunari Gaming']];
  const finalRows = [['usuarios', 'id_usuario', '—', 'id_usuario → nombre_usuario, correo, contrasena_hash, rol'], ['juegos', 'id_juego', '—', 'id_juego → nombre'], ['sedes_mapa', 'id_sede', '—', 'id_sede → nombre, latitud, longitud'], ['torneos', 'id_torneo', 'id_juego, id_sede, id_organizador', 'id_torneo → nombre, fecha, cupos, estado, id_juego, id_sede, id_organizador'], ['equipos', 'id_equipo', 'id_capitan', 'id_equipo → nombre, id_capitan'], ['jugadores_roster', 'id_roster', 'id_equipo', 'id_roster → id_equipo, nickname'], ['inscripciones', 'id_inscripcion', 'id_torneo, id_equipo', 'id_inscripcion → estado   ·   (id_torneo, id_equipo) es llave candidata'], ['enfrentamientos_brackets', 'id_enfrentamiento', 'id_torneo, id_equipo_a, id_equipo_b, id_ganador, id_siguiente', 'id_enfrentamiento → ronda, posicion, equipos, ganador, siguiente'], ['resultados', 'id_resultado', 'id_enfrentamiento, registrado_por', 'id_resultado → puntaje_a, puntaje_b, registrado_por, fecha_registro']];
  const step = (n, title, body) => h('section', { class: 'panel' }, h('header', null, h('span', { class: 'step-n' }, n), h('h3', null, title)), h('div', { class: 'body stack' }, body));

  V.modelo = ctx => {
    const { db, user } = ctx, tab = ctx.query.tab || 'resumen', root_ = h('div'), sch = db.SCHEMA, T = db.tables();
    root_.appendChild(h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Modelo de datos'), h('p', null, 'Base de datos relacional de 9 tablas, normalizada hasta la tercera forma normal (3FN). Los datos que ves en la plataforma están guardados con esta misma estructura.'))));
    root_.appendChild(tabsBar(ctx, 'modelo', [['resumen', 'db', 'Resumen y reglas'], ['normalizacion', 'table', 'Normalización'], ['diccionario', 'list', 'Diccionario de datos'], ['datos', 'eye', 'Explorador de datos'], ['consultas', 'code', 'Consultas SQL']], tab));

    if (tab === 'resumen') {
      root_.appendChild(h('div', { class: 'grid g-main' }, h('section', { class: 'panel' }, h('header', null, icon('db'), h('h3', null, 'Diagrama entidad-relación')), h('div', { class: 'body' }, h('img', { src: '../docs/diagrama_er.png', alt: 'Diagrama entidad-relación de LobbyMaster con 9 tablas', style: { width: '100%', borderRadius: '4px', background: '#fff' }, onerror: e => { e.target.replaceWith(h('div', { class: 'alert warn' }, 'No se encontró docs/diagrama_er.png. Mantén la carpeta docs/ junto a frontend/.')); } }))),
        h('section', { class: 'panel' }, h('header', null, icon('shield'), h('h3', null, 'Reglas de integridad')), h('ul', { class: 'list', style: { padding: '0 18px', fontSize: '13px' } }, [
          ['CHECK', 'cupos entre 4 y 32; puntajes ≥ 0; resultado sin empate'], ['CHECK', 'rol ∈ {admin, organizador, jugador}; estados válidos'], ['UNIQUE', '(id_torneo, id_equipo): un equipo no se inscribe dos veces'], ['UNIQUE', '(id_torneo, ronda, posicion): un solo cruce por posición'], ['UNIQUE', 'id_enfrentamiento en resultados: un resultado por cruce'],
          ['CASCADE', 'al borrar un torneo se borran inscripciones, cruces y resultados'], ['RESTRICT', 'no se borra un juego, sede o usuario que esté en uso'], ['AUTO-REF', 'id_siguiente forma el árbol binario del bracket']].map(([k, v]) => h('li', { style: { alignItems: 'flex-start' } }, h('span', { class: 'chip ac plain', style: { minWidth: '84px', justifyContent: 'center' } }, k), h('span', null, v)))))));
      root_.appendChild(h('div', { class: 'fd mt' }, db.TABLES.map(n => h('div', { class: 'tabcard' }, h('h4', null, icon('table'), n, h('span', { class: 'sp dim' }, T[n].length + ' filas')), h('div', { style: { padding: '8px 14px 12px', fontSize: '12.5px' } }, sch[n].cols.map(c => h('div', { class: 'row mono', style: { gap: '8px', padding: '2px 0' } }, h('span', { style: { width: '24px' } }, tagOf(c)), c[0])))))));
      root_.appendChild(h('div', { class: 'alert mt' }, 'Leyenda: ', h('span', { class: 'pk' }, 'PK'), ' llave primaria · ', h('span', { class: 'fk' }, 'FK'), ' llave foránea · ', h('span', { class: 'uq' }, 'UQ'), ' valor único · CK restricción CHECK. Los datos derivados (campeón, posiciones, estadísticas) no se almacenan: se calculan a partir de enfrentamientos y resultados, lo que evita redundancia.'));
    }

    if (tab === 'normalizacion') {
      root_.appendChild(h('div', { class: 'stack' },
        step(0, 'Punto de partida: la hoja del organizador (sin normalizar)', [h('p', { class: 'muted' }, 'Así se llevan hoy los torneos en una hoja de cálculo o en grupos de mensajería: todo en una sola tabla.'),
          simple(['Torneo', 'Juego', 'Sede', 'Lat/Lon', 'Organizador', 'Correo org.', 'Equipo', 'Capitán', 'Jugadores', 'Resultado'], unnorm),
          h('div', { class: 'alert bad' }, h('b', null, 'Problemas: '), '① la celda «Jugadores» guarda varios valores (grupo repetitivo) · ② la sede, sus coordenadas y el correo del organizador se repiten en cada fila (redundancia) · ③ cambiar un correo obliga a editar muchas filas (anomalía de actualización) · ④ no se puede registrar una sede sin un torneo (anomalía de inserción) · ⑤ al borrar el único equipo de un torneo se pierde el torneo (anomalía de borrado).')]),
        step(1, 'Primera forma normal (1FN): valores atómicos y sin grupos repetidos', [h('p', null, 'Cada celda contiene un solo valor. Los jugadores pasan de una celda con comas a filas independientes. La llave pasa a ser ', h('code', { class: 'mono' }, '(torneo, equipo, jugador)'), '.'),
          simple(['Torneo', 'Equipo', 'Capitán', 'Jugador'], ['Kuntur', 'Yatiri', 'Tunupa', 'Nayra', 'Sami'].map(j => ['Copa Illimani Valorant', 'Illimani eSports', 'jugador', j])),
          h('div', { class: 'alert' }, 'Aún hay redundancia: el capitán y los datos del torneo se repiten por cada jugador.')]),
        step(2, 'Segunda forma normal (2FN): sin dependencias parciales', [h('p', null, 'Ningún atributo debe depender solo de una parte de la llave compuesta. Se identifican estas dependencias funcionales:'),
          h('ul', { class: 'list' }, [['torneo → juego, sede, coordenadas, organizador, fecha, cupos', 'torneos'], ['equipo → capitán, nombre del equipo', 'equipos'], ['equipo, jugador → pertenencia al roster', 'jugadores_roster'], ['torneo, equipo → estado de la inscripción', 'inscripciones']].map(([d, t]) => h('li', null, h('span', { class: 'mono grow' }, d), icon('check'), h('span', { class: 'chip ac plain' }, t)))),
          h('div', { class: 'alert ok' }, 'Resultado: la tabla se divide en torneos, equipos, jugadores_roster e inscripciones (tabla puente entre torneos y equipos, relación N:M).')]),
        step(3, 'Tercera forma normal (3FN): sin dependencias transitivas', [h('p', null, 'Un atributo no clave no puede depender de otro atributo no clave.'),
          h('ul', { class: 'list' }, [['torneo → sede → latitud, longitud', 'sedes_mapa'], ['torneo → juego → nombre del juego', 'juegos'], ['torneo → organizador → correo, rol', 'usuarios'], ['equipo → capitán → correo, rol (mismo usuario)', 'usuarios'], ['cruce → torneo, ronda, posición, ganador, siguiente', 'enfrentamientos_brackets'], ['resultado → cruce → puntajes, quién lo registró', 'resultados']].map(([d, t]) => h('li', null, h('span', { class: 'mono grow' }, d), icon('check'), h('span', { class: 'chip ac plain' }, t)))),
          h('div', { class: 'alert ok' }, 'Resultado: 9 tablas. Cada dato se guarda una sola vez y se enlaza con llaves foráneas.')]),
        step(4, 'Modelo final y dependencias funcionales', [simple(['Tabla', 'Llave primaria', 'Llaves foráneas', 'Dependencia funcional'], finalRows.map(r => [h('b', { class: 'mono' }, r[0]), h('span', { class: 'mono pk' }, r[1]), h('span', { class: 'mono' }, r[2]), h('span', { class: 'mono muted' }, r[3])])),
          h('div', { class: 'alert' }, 'Verificación: en cada tabla el único determinante es una llave candidata (PK o UNIQUE), por lo que el modelo también cumple la forma normal de Boyce-Codd (BCNF). Los datos derivados no se guardan.')])));
    }

    if (tab === 'diccionario') {
      root_.appendChild(h('div', { class: 'stack' }, db.TABLES.map(n => h('section', { class: 'panel' }, h('header', null, icon('table'), h('h3', { class: 'mono', style: { textTransform: 'none', fontFamily: 'var(--mono)', fontSize: '15px' } }, n), h('span', { class: 'sp dim' }, 'PK: ' + sch[n].pk)),
        simple(['Campo', 'Tipo', 'Clave / restricción', 'Descripción'], sch[n].cols.map(c => [h('span', { class: 'mono' }, c[0]), h('span', { class: 'mono muted' }, c[1]), tagOf(c) || '—', c[3]]))))));
      root_.appendChild(h('div', { class: 'row mt' }, h('a', { class: 'btn', href: '../database/schema.sql', download: 'schema.sql' }, icon('download'), 'Descargar schema.sql (DDL completo)')));
    }

    if (tab === 'datos') {
      if (!Auth.can(user, 'datos.ver')) { root_.appendChild(h('div', { class: 'panel' }, empty('lock', 'Solo administradores', 'El explorador muestra datos de todos los usuarios y está restringido al rol Administrador.'))); return root_; }
      let cur = ctx.query.t && sch[ctx.query.t] ? ctx.query.t : 'usuarios';
      const wrap = h('div'), draw = () => {
        const rows = T[cur], cols = sch[cur].cols;
        wrap.replaceChildren(h('section', { class: 'panel' }, h('header', null, icon('table'), h('h3', { class: 'mono', style: { textTransform: 'none', fontFamily: 'var(--mono)', fontSize: '15px' } }, cur), h('span', { class: 'sp dim' }, rows.length + ' filas')),
          rows.length ? h('div', { class: 'tbl-wrap', style: { maxHeight: '520px' } }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, cols.map(c => h('th', null, c[0], ' ', tagOf(c))))), h('tbody', null, rows.slice(0, 300).map(r => h('tr', null, cols.map(c => { const v = r[c[0]]; return h('td', { class: 'mono' + (v === null ? ' dim' : '') }, c[0] === 'contrasena_hash' ? String(v).slice(0, 14) + '…' : v === null ? 'NULL' : String(v)); })))))) : empty('table', 'Tabla vacía', 'No hay filas.')));
      };
      root_.appendChild(h('div', { class: 'row wrap', style: { marginBottom: '14px', gap: '6px' } }, db.TABLES.map(n => h('button', { class: 'btn sm ' + (n === cur ? 'pri' : ''), onclick: e => { cur = n; e.currentTarget.parentNode.querySelectorAll('button').forEach(b => { b.className = 'btn sm'; }); e.currentTarget.className = 'btn sm pri'; draw(); } }, n))));
      root_.appendChild(wrap); draw();
      root_.appendChild(h('p', { class: 'dim mt', style: { fontSize: '12.5px' } }, 'Las contraseñas se almacenan como hash SHA-256 con sal; aquí solo se muestran los primeros caracteres.'));
    }

    if (tab === 'consultas') {
      const ts = db.listTorneos().slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
      const camp = db.listTorneos().filter(t => t.estado === 'finalizado').map(t => [t.nombre, (db.getBracket(t.id_torneo).campeon || {}).nombre]);
      const vic = db.ranking().filter(r => r.pg > 0).sort((a, b) => b.pg - a.pg || a.nombre.localeCompare(b.nombre)).map(r => [r.nombre, r.pg]);
      const pend = db.listTorneos().map(t => [t.nombre, t.pendientes]).filter(r => r[1] > 0);
      const q = (title, text, heads, rows) => h('section', { class: 'panel' }, h('header', null, icon('code'), h('h3', null, title)), h('div', { class: 'body stack' }, sql(text), h('div', { class: 'dim', style: { fontSize: '12px' } }, 'Resultado calculado con los datos actuales de la beta (equivalente en JavaScript):'), rows.length ? simple(heads, rows) : h('div', { class: 'muted' }, 'Sin filas.')));
      root_.appendChild(h('div', { class: 'stack' },
        q('Torneos con su juego, sede y organizador (4 tablas con JOIN)', "SELECT t.nombre AS torneo, j.nombre AS juego, s.nombre AS sede,\n       u.nombre_usuario AS organizador, t.estado\nFROM torneos t\nJOIN juegos j     ON j.id_juego = t.id_juego\nJOIN sedes_mapa s ON s.id_sede = t.id_sede\nJOIN usuarios u   ON u.id_usuario = t.id_organizador\nORDER BY t.fecha;", ['torneo', 'juego', 'sede', 'organizador', 'estado'], ts.map(t => [t.nombre, t.juego, t.sede_nombre, t.organizador, t.estado])),
        q('Campeones de los torneos finalizados', "SELECT t.nombre AS torneo, e.nombre AS campeon\nFROM torneos t\nJOIN enfrentamientos_brackets b ON b.id_torneo = t.id_torneo\n                               AND b.id_siguiente IS NULL   -- la final no tiene siguiente\nJOIN equipos e ON e.id_equipo = b.id_ganador\nWHERE t.estado = 'finalizado';", ['torneo', 'campeon'], camp),
        q('Victorias por equipo (agregación)', "SELECT e.nombre AS equipo, COUNT(*) AS victorias\nFROM resultados r\nJOIN enfrentamientos_brackets b ON b.id_enfrentamiento = r.id_enfrentamiento\nJOIN equipos e ON e.id_equipo = b.id_ganador\nGROUP BY e.id_equipo, e.nombre\nORDER BY victorias DESC;", ['equipo', 'victorias'], vic),
        q('Inscripciones pendientes por torneo', "SELECT t.nombre AS torneo, COUNT(*) AS pendientes\nFROM inscripciones i\nJOIN torneos t ON t.id_torneo = i.id_torneo\nWHERE i.estado = 'pendiente'\nGROUP BY t.id_torneo, t.nombre;", ['torneo', 'pendientes'], pend)));
    }
    return root_;
  };
})(this);
