// LobbyMaster Beta 3 - capa MODELO. Guarda los datos en 9 tablas normalizadas (mismo esquema que database/schema.sql).
// En la beta persiste en localStorage; en la version final solo se reemplaza esta capa por MySQL/PostgreSQL.
// Autor: Yair Anibal Mamani Ticona
(function (root) {
  const Bracket = typeof require !== 'undefined' ? require('./bracket.js') : root.Bracket;
  const Auth = typeof require !== 'undefined' ? require('./auth.js') : root.Auth;

  class VErr extends Error { constructor(msg, fields) { super(msg); this.name = 'VErr'; this.fields = fields || {}; } }
  const fail = (msg, field) => { throw new VErr(msg, field ? { [field]: msg } : {}); };

  const MIN_EQUIPOS = 4, MAX_PUNTAJE = 99, ROSTER_MIN = 2, ROSTER_MAX = 8;

  // Diccionario de datos: lo usa el modulo "Modelo de datos" de la interfaz y la exportacion SQL
  const SCHEMA = {
    usuarios: { pk: 'id_usuario', cols: [['id_usuario', 'INT', 'PK', 'Identificador del usuario'], ['nombre_usuario', 'VARCHAR(20)', 'UQ', 'Nombre para iniciar sesión'], ['correo', 'VARCHAR(100)', 'UQ', 'Correo electrónico'], ['contrasena_hash', 'VARCHAR(255)', '', 'Contraseña cifrada (SHA-256 con sal)'], ['rol', 'VARCHAR(12)', 'CK', 'admin, organizador o jugador']] },
    juegos: { pk: 'id_juego', cols: [['id_juego', 'INT', 'PK', 'Identificador del juego'], ['nombre', 'VARCHAR(40)', 'UQ', 'Nombre del videojuego']] },
    sedes_mapa: { pk: 'id_sede', cols: [['id_sede', 'INT', 'PK', 'Identificador de la sede'], ['nombre', 'VARCHAR(60)', '', 'Nombre de la sede'], ['latitud', 'DECIMAL(9,6)', '', 'Latitud'], ['longitud', 'DECIMAL(9,6)', '', 'Longitud']] },
    torneos: { pk: 'id_torneo', cols: [['id_torneo', 'INT', 'PK', 'Identificador del torneo'], ['nombre', 'VARCHAR(40)', 'UQ', 'Nombre del torneo'], ['fecha', 'DATE', '', 'Fecha de realización'], ['cupos', 'INT', 'CK', 'Equipos permitidos (4 a 32)'], ['estado', 'VARCHAR(12)', 'CK', 'abierto, en_curso o finalizado'], ['id_juego', 'INT', 'FK', 'Juego → juegos'], ['id_sede', 'INT', 'FK', 'Sede → sedes_mapa'], ['id_organizador', 'INT', 'FK', 'Organizador → usuarios']] },
    equipos: { pk: 'id_equipo', cols: [['id_equipo', 'INT', 'PK', 'Identificador del equipo'], ['nombre', 'VARCHAR(24)', 'UQ', 'Nombre del equipo'], ['id_capitan', 'INT', 'FK', 'Capitán → usuarios']] },
    jugadores_roster: { pk: 'id_roster', cols: [['id_roster', 'INT', 'PK', 'Identificador'], ['id_equipo', 'INT', 'FK', 'Equipo → equipos'], ['nickname', 'VARCHAR(30)', '', 'Apodo del jugador']] },
    inscripciones: { pk: 'id_inscripcion', cols: [['id_inscripcion', 'INT', 'PK', 'Identificador'], ['id_torneo', 'INT', 'FK', 'Torneo → torneos'], ['id_equipo', 'INT', 'FK', 'Equipo → equipos'], ['estado', 'VARCHAR(10)', 'CK', 'pendiente, aprobado o rechazado']] },
    enfrentamientos_brackets: { pk: 'id_enfrentamiento', cols: [['id_enfrentamiento', 'INT', 'PK', 'Identificador del cruce'], ['id_torneo', 'INT', 'FK', 'Torneo → torneos'], ['ronda', 'INT', '', 'Número de ronda'], ['posicion', 'INT', '', 'Posición dentro de la ronda'], ['id_equipo_a', 'INT', 'FK', 'Equipo A → equipos (nulo = por definir)'], ['id_equipo_b', 'INT', 'FK', 'Equipo B → equipos (nulo = por definir)'], ['id_ganador', 'INT', 'FK', 'Ganador → equipos'], ['id_siguiente', 'INT', 'FK', 'Cruce siguiente → el mismo árbol']] },
    resultados: { pk: 'id_resultado', cols: [['id_resultado', 'INT', 'PK', 'Identificador'], ['id_enfrentamiento', 'INT', 'UQ', 'Cruce → enfrentamientos_brackets'], ['puntaje_a', 'INT', 'CK', 'Puntaje del equipo A'], ['puntaje_b', 'INT', 'CK', 'Puntaje del equipo B'], ['registrado_por', 'INT', 'FK', 'Quién lo registró → usuarios'], ['fecha_registro', 'TIMESTAMP', '', 'Fecha y hora del registro']] }
  };
  const TABLES = Object.keys(SCHEMA);

  const ROUND_NAMES = { 1: 'Final', 2: 'Semifinal', 3: 'Cuartos de final', 4: 'Octavos de final', 5: 'Dieciseisavos' };
  const roundName = (ronda, total) => ROUND_NAMES[total - ronda + 1] || 'Ronda ' + ronda;

  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const stamp = d => ymd(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  const ci = s => String(s || '').trim().toLowerCase();
  const clean = s => String(s == null ? '' : s).trim().replace(/\s+/g, ' ');

  function create(storage, opts) {
    opts = opts || {};
    const KEY = 'lobbymaster.beta3.db';
    const nowFn = opts.now || (() => new Date());
    let S, silent = false;

    // ---------- persistencia ----------
    const blank = () => ({ v: 3, seq: {}, t: Object.fromEntries(TABLES.map(t => [t, []])), log: [] });
    function save() { try { storage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento: la sesion funciona en memoria */ } }
    function load() {
      try { const raw = storage.getItem(KEY); S = raw ? JSON.parse(raw) : null; } catch (e) { S = null; }
      if (!S || S.v !== 3) { S = blank(); seed(); save(); }
    }
    function insert(table, row) { const pk = SCHEMA[table].pk; S.seq[table] = (S.seq[table] || 0) + 1; row = Object.assign({ [pk]: S.seq[table] }, row); S.t[table].push(row); return row; }
    const rows = (t, f) => (f ? S.t[t].filter(f) : S.t[t]);
    const find = (t, id) => S.t[t].find(r => r[SCHEMA[t].pk] === id);
    const remove = (t, f) => { S.t[t] = S.t[t].filter(r => !f(r)); };
    function log(actor, msg) {
      if (silent) return;
      S.log.unshift({ t: stamp(nowFn()), u: actor ? actor.nombre_usuario : 'sistema', msg });
      S.log = S.log.slice(0, 80);
    }
    const pub = u => u && { id_usuario: u.id_usuario, nombre_usuario: u.nombre_usuario, correo: u.correo, rol: u.rol };
    const need = (actor, perm) => { if (!Auth.can(actor, perm)) throw new VErr('No tienes permiso para realizar esta acción'); };
    const today = () => ymd(nowFn());

    // ---------- usuarios ----------
    function checkUserFields(f, ignoreId) {
      const e = {};
      let m;
      if ((m = Auth.validators.usuario(f.nombre_usuario))) e.nombre_usuario = m;
      else if (rows('usuarios', u => ci(u.nombre_usuario) === ci(f.nombre_usuario) && u.id_usuario !== ignoreId).length) e.nombre_usuario = 'Ese nombre de usuario ya está en uso';
      if ((m = Auth.validators.correo(f.correo))) e.correo = m;
      else if (rows('usuarios', u => ci(u.correo) === ci(f.correo) && u.id_usuario !== ignoreId).length) e.correo = 'Ese correo ya está registrado';
      if (f.password !== undefined && (m = Auth.validators.password(f.password))) e.password = m;
      if (Object.keys(e).length) throw new VErr('Revisa los campos marcados', e);
    }
    function register(f, actor) {
      f = { nombre_usuario: clean(f.nombre_usuario), correo: clean(f.correo), password: f.password, rol: f.rol };
      checkUserFields(f);
      let rol = 'jugador';
      if (f.rol && Auth.can(actor, 'usuarios.admin')) { if (!Auth.ROLES[f.rol]) fail('Rol no válido', 'rol'); rol = f.rol; } // el registro público siempre crea jugadores
      const u = insert('usuarios', { nombre_usuario: f.nombre_usuario, correo: f.correo, contrasena_hash: Auth.hashPassword(f.password), rol });
      log(actor || u, 'Registró al usuario ' + u.nombre_usuario + ' (' + rol + ')'); save();
      return pub(u);
    }
    function login(identifier, password) {
      const id = ci(identifier);
      const u = rows('usuarios', x => ci(x.nombre_usuario) === id || ci(x.correo) === id)[0];
      if (!u || !Auth.verifyPassword(password || '', u.contrasena_hash)) throw new VErr('Usuario o contraseña incorrectos');
      log(u, 'Inició sesión'); save();
      return pub(u);
    }
    const getUser = id => pub(find('usuarios', id));
    const listUsers = () => rows('usuarios').map(pub);
    function setRole(actor, id, rol) {
      need(actor, 'usuarios.admin');
      const u = find('usuarios', id); if (!u) fail('Usuario no encontrado');
      if (!Auth.ROLES[rol]) fail('Rol no válido');
      if (u.rol === 'admin' && rol !== 'admin' && rows('usuarios', x => x.rol === 'admin').length === 1) fail('Debe existir al menos un administrador');
      if (u.id_usuario === actor.id_usuario && rol !== 'admin') fail('No puedes quitarte tu propio rol de administrador');
      u.rol = rol; log(actor, 'Cambió el rol de ' + u.nombre_usuario + ' a ' + rol); save(); return pub(u);
    }
    function deleteUser(actor, id) {
      need(actor, 'usuarios.admin');
      const u = find('usuarios', id); if (!u) fail('Usuario no encontrado');
      if (u.id_usuario === actor.id_usuario) fail('No puedes eliminar tu propia cuenta');
      if (u.rol === 'admin' && rows('usuarios', x => x.rol === 'admin').length === 1) fail('Debe existir al menos un administrador');
      const nT = rows('torneos', t => t.id_organizador === id).length, nE = rows('equipos', e => e.id_capitan === id).length, nR = rows('resultados', r => r.registrado_por === id).length;
      if (nT || nE || nR) fail('No se puede eliminar: tiene ' + [nT && nT + ' torneo(s)', nE && nE + ' equipo(s)', nR && nR + ' resultado(s)'].filter(Boolean).join(', ') + ' asociados (integridad referencial)');
      remove('usuarios', x => x.id_usuario === id); log(actor, 'Eliminó al usuario ' + u.nombre_usuario); save();
    }
    function changePassword(actor, oldPw, newPw) {
      const u = find('usuarios', actor.id_usuario);
      if (!Auth.verifyPassword(oldPw || '', u.contrasena_hash)) fail('La contraseña actual no es correcta', 'actual');
      const m = Auth.validators.password(newPw); if (m) fail(m, 'nueva');
      u.contrasena_hash = Auth.hashPassword(newPw); log(actor, 'Cambió su contraseña'); save();
    }

    // ---------- catalogos: juegos y sedes ----------
    const listGames = () => rows('juegos').slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
    function addGame(actor, nombre) {
      need(actor, 'catalogos.admin'); nombre = clean(nombre);
      if (nombre.length < 2 || nombre.length > 40) fail('Entre 2 y 40 caracteres', 'nombre');
      if (rows('juegos', g => ci(g.nombre) === ci(nombre)).length) fail('Ese juego ya existe', 'nombre');
      const g = insert('juegos', { nombre }); log(actor, 'Agregó el juego ' + nombre); save(); return g;
    }
    function deleteGame(actor, id) {
      need(actor, 'catalogos.admin'); const g = find('juegos', id); if (!g) fail('Juego no encontrado');
      const n = rows('torneos', t => t.id_juego === id).length; if (n) fail('No se puede eliminar: lo usan ' + n + ' torneo(s)');
      remove('juegos', x => x.id_juego === id); log(actor, 'Eliminó el juego ' + g.nombre); save();
    }
    const listSedes = () => rows('sedes_mapa').slice();
    function checkSede(f) {
      const e = {}; const lat = Number(f.latitud), lon = Number(f.longitud);
      if (clean(f.nombre).length < 3 || clean(f.nombre).length > 60) e.nombre = 'Entre 3 y 60 caracteres';
      if (f.latitud === '' || !isFinite(lat) || lat < -90 || lat > 90) e.latitud = 'Latitud entre -90 y 90';
      if (f.longitud === '' || !isFinite(lon) || lon < -180 || lon > 180) e.longitud = 'Longitud entre -180 y 180';
      if (Object.keys(e).length) throw new VErr('Revisa los campos marcados', e);
      return { nombre: clean(f.nombre), latitud: Math.round(lat * 1e6) / 1e6, longitud: Math.round(lon * 1e6) / 1e6 };
    }
    function addSede(actor, f) { need(actor, 'catalogos.admin'); const d = checkSede(f); const s = insert('sedes_mapa', d); log(actor, 'Agregó la sede ' + d.nombre); save(); return s; }
    function updateSede(actor, id, f) { need(actor, 'catalogos.admin'); const s = find('sedes_mapa', id); if (!s) fail('Sede no encontrada'); Object.assign(s, checkSede(f)); log(actor, 'Editó la sede ' + s.nombre); save(); return s; }
    function deleteSede(actor, id) {
      need(actor, 'catalogos.admin'); const s = find('sedes_mapa', id); if (!s) fail('Sede no encontrada');
      const n = rows('torneos', t => t.id_sede === id).length; if (n) fail('No se puede eliminar: la usan ' + n + ' torneo(s)');
      remove('sedes_mapa', x => x.id_sede === id); log(actor, 'Eliminó la sede ' + s.nombre); save();
    }

    // ---------- equipos ----------
    function rosterOf(id) { return rows('jugadores_roster', j => j.id_equipo === id).map(j => j.nickname); }
    function teamView(e) {
      const cap = find('usuarios', e.id_capitan);
      const ins = rows('inscripciones', i => i.id_equipo === e.id_equipo);
      return Object.assign({}, e, { capitan: cap ? cap.nombre_usuario : '—', jugadores: rosterOf(e.id_equipo), inscripciones: ins.length });
    }
    function checkTeam(f, ignoreId) {
      const e = {}; const nombre = clean(f.nombre);
      if (nombre.length < 3 || nombre.length > 24) e.nombre = 'Entre 3 y 24 caracteres';
      else if (rows('equipos', x => ci(x.nombre) === ci(nombre) && x.id_equipo !== ignoreId).length) e.nombre = 'Ya existe un equipo con ese nombre';
      const js = (f.jugadores || []).map(clean).filter(Boolean);
      if (js.length < ROSTER_MIN || js.length > ROSTER_MAX) e.jugadores = 'El equipo necesita entre ' + ROSTER_MIN + ' y ' + ROSTER_MAX + ' jugadores';
      else if (js.some(j => j.length < 2 || j.length > 30)) e.jugadores = 'Cada apodo debe tener entre 2 y 30 caracteres';
      else if (new Set(js.map(ci)).size !== js.length) e.jugadores = 'Hay apodos repetidos en el equipo';
      if (Object.keys(e).length) throw new VErr('Revisa los campos marcados', e);
      return { nombre, jugadores: js };
    }
    function createTeam(actor, f) {
      need(actor, 'equipo.crear'); const d = checkTeam(f);
      const e = insert('equipos', { nombre: d.nombre, id_capitan: actor.id_usuario });
      d.jugadores.forEach(n => insert('jugadores_roster', { id_equipo: e.id_equipo, nickname: n }));
      log(actor, 'Creó el equipo ' + d.nombre); save(); return teamView(e);
    }
    function ownsTeam(actor, e) { return actor.id_usuario === e.id_capitan || Auth.can(actor, 'equipo.ver_todos'); }
    function updateTeam(actor, id, f) {
      const e = find('equipos', id); if (!e) fail('Equipo no encontrado');
      if (!ownsTeam(actor, e)) fail('Solo el capitán puede editar el equipo');
      const d = checkTeam(f, id); e.nombre = d.nombre;
      remove('jugadores_roster', j => j.id_equipo === id); d.jugadores.forEach(n => insert('jugadores_roster', { id_equipo: id, nickname: n }));
      log(actor, 'Editó el equipo ' + d.nombre); save(); return teamView(e);
    }
    function deleteTeam(actor, id) {
      const e = find('equipos', id); if (!e) fail('Equipo no encontrado');
      if (!ownsTeam(actor, e)) fail('Solo el capitán puede eliminar el equipo');
      const n = rows('inscripciones', i => i.id_equipo === id).length;
      if (n) fail('No se puede eliminar: el equipo tiene ' + n + ' inscripción(es). Retira primero las inscripciones.');
      remove('jugadores_roster', j => j.id_equipo === id); remove('equipos', x => x.id_equipo === id);
      log(actor, 'Eliminó el equipo ' + e.nombre); save();
    }
    function listTeams(f) {
      f = f || {};
      return rows('equipos', e => (f.captainId ? e.id_capitan === f.captainId : true)).map(teamView).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    const getTeam = id => { const e = find('equipos', id); return e ? teamView(e) : null; };

    // ---------- torneos ----------
    function torneoView(t) {
      const ins = rows('inscripciones', i => i.id_torneo === t.id_torneo);
      const sede = find('sedes_mapa', t.id_sede), org = find('usuarios', t.id_organizador), g = find('juegos', t.id_juego);
      return Object.assign({}, t, {
        juego: g ? g.nombre : '—', sede: sede || null, sede_nombre: sede ? sede.nombre : '—', organizador: org ? org.nombre_usuario : '—',
        aprobados: ins.filter(i => i.estado === 'aprobado').length, pendientes: ins.filter(i => i.estado === 'pendiente').length, inscritos: ins.length
      });
    }
    function checkTorneo(f, ignoreId, forSeed) {
      const e = {}; const nombre = clean(f.nombre); const cupos = Number(f.cupos);
      if (nombre.length < 5 || nombre.length > 40) e.nombre = 'Entre 5 y 40 caracteres';
      else if (rows('torneos', t => ci(t.nombre) === ci(nombre) && t.id_torneo !== ignoreId).length) e.nombre = 'Ya existe un torneo con ese nombre';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha || '') || isNaN(Date.parse(f.fecha))) e.fecha = 'Ingresa una fecha válida';
      else if (!forSeed && f.fecha < today()) e.fecha = 'La fecha no puede estar en el pasado';
      if (!Number.isInteger(cupos) || cupos < 4 || cupos > 32) e.cupos = 'Los cupos deben ser un entero entre 4 y 32';
      if (!find('juegos', Number(f.id_juego))) e.id_juego = 'Selecciona un juego';
      if (!find('sedes_mapa', Number(f.id_sede))) e.id_sede = 'Selecciona una sede';
      if (Object.keys(e).length) throw new VErr('Revisa los campos marcados', e);
      return { nombre, fecha: f.fecha, cupos, id_juego: Number(f.id_juego), id_sede: Number(f.id_sede) };
    }
    function createTorneo(actor, f, o) {
      need(actor, 'torneo.crear'); const d = checkTorneo(f, null, o && o.seed);
      let org = actor.id_usuario;
      if (f.id_organizador && Auth.can(actor, 'torneo.gestionar_todos')) { const u = find('usuarios', Number(f.id_organizador)); if (u && u.rol !== 'jugador') org = u.id_usuario; }
      const t = insert('torneos', Object.assign(d, { estado: 'abierto', id_organizador: org }));
      log(actor, 'Creó el torneo ' + d.nombre); save(); return torneoView(t);
    }
    function mustManage(actor, id) {
      const t = find('torneos', id); if (!t) fail('Torneo no encontrado');
      if (!Auth.canManageTorneo(actor, t)) fail('Solo el organizador del torneo o un administrador puede hacer esto');
      return t;
    }
    function updateTorneo(actor, id, f) {
      const t = mustManage(actor, id); if (t.estado !== 'abierto') fail('Solo se pueden editar torneos con inscripciones abiertas');
      const d = checkTorneo(f, id);
      const aprob = rows('inscripciones', i => i.id_torneo === id && i.estado === 'aprobado').length;
      if (d.cupos < aprob) fail('Hay ' + aprob + ' equipos aprobados: los cupos no pueden ser menores', 'cupos');
      Object.assign(t, d); log(actor, 'Editó el torneo ' + t.nombre); save(); return torneoView(t);
    }
    function deleteTorneo(actor, id) {
      const t = mustManage(actor, id);
      if (t.estado !== 'abierto' && !Auth.can(actor, 'torneo.gestionar_todos')) fail('Solo un administrador puede eliminar un torneo ya iniciado');
      const enfIds = rows('enfrentamientos_brackets', e => e.id_torneo === id).map(e => e.id_enfrentamiento);
      remove('resultados', r => enfIds.includes(r.id_enfrentamiento)); remove('enfrentamientos_brackets', e => e.id_torneo === id);
      remove('inscripciones', i => i.id_torneo === id); remove('torneos', x => x.id_torneo === id);
      log(actor, 'Eliminó el torneo ' + t.nombre); save();
    }
    const listTorneos = () => rows('torneos').map(torneoView).sort((a, b) => (a.estado === 'finalizado') - (b.estado === 'finalizado') || (a.estado === 'finalizado' ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha)));
    const getTorneo = id => { const t = find('torneos', id); return t ? torneoView(t) : null; };

    // ---------- inscripciones ----------
    function inscView(i) {
      const eq = find('equipos', i.id_equipo); const tv = teamView(eq);
      return Object.assign({}, i, { equipo: tv.nombre, capitan: tv.capitan, id_capitan: eq.id_capitan, jugadores: tv.jugadores });
    }
    const listInscripciones = idT => rows('inscripciones', i => i.id_torneo === idT).map(inscView);
    const listInscripcionesDeEquipos = ids => rows('inscripciones', i => ids.includes(i.id_equipo)).map(i => Object.assign(inscView(i), { torneo: (find('torneos', i.id_torneo) || {}).nombre, torneo_estado: (find('torneos', i.id_torneo) || {}).estado }));
    function inscribir(actor, idT, idE) {
      need(actor, 'inscribir');
      const t = find('torneos', idT); if (!t) fail('Torneo no encontrado');
      const e = find('equipos', idE); if (!e) fail('Selecciona un equipo', 'id_equipo');
      if (!ownsTeam(actor, e)) fail('Solo el capitán puede inscribir al equipo', 'id_equipo');
      if (t.estado !== 'abierto') fail('Este torneo ya no recibe inscripciones');
      if (rosterOf(idE).length < ROSTER_MIN) fail('El equipo debe tener al menos ' + ROSTER_MIN + ' jugadores', 'id_equipo');
      if (rows('inscripciones', i => i.id_torneo === idT && i.id_equipo === idE).length) fail('El equipo ya está inscrito en este torneo', 'id_equipo');
      const aprob = rows('inscripciones', i => i.id_torneo === idT && i.estado === 'aprobado').length;
      if (aprob >= t.cupos) fail('El torneo ya completó sus cupos');
      const choque = rows('inscripciones', i => i.id_equipo === idE && i.estado !== 'rechazado').map(i => find('torneos', i.id_torneo)).find(o => o && o.fecha === t.fecha && o.estado !== 'finalizado');
      if (choque) fail('El equipo ya está inscrito en «' + choque.nombre + '» el mismo día', 'id_equipo');
      const i = insert('inscripciones', { id_torneo: idT, id_equipo: idE, estado: 'pendiente' });
      log(actor, 'Inscribió a ' + e.nombre + ' en ' + t.nombre); save(); return inscView(i);
    }
    function resolver(actor, idI, estado) {
      const i = find('inscripciones', idI); if (!i) fail('Inscripción no encontrada');
      const t = mustManage(actor, i.id_torneo);
      if (t.estado !== 'abierto') fail('El torneo ya inició: no se pueden cambiar las inscripciones');
      if (!['aprobado', 'rechazado'].includes(estado)) fail('Estado no válido');
      if (estado === 'aprobado' && i.estado !== 'aprobado' && rows('inscripciones', x => x.id_torneo === t.id_torneo && x.estado === 'aprobado').length >= t.cupos) fail('Los cupos del torneo están completos');
      i.estado = estado; log(actor, (estado === 'aprobado' ? 'Aprobó' : 'Rechazó') + ' la inscripción de ' + find('equipos', i.id_equipo).nombre + ' en ' + t.nombre); save(); return inscView(i);
    }
    function retirar(actor, idI) {
      const i = find('inscripciones', idI); if (!i) fail('Inscripción no encontrada');
      const t = find('torneos', i.id_torneo), e = find('equipos', i.id_equipo);
      if (!(ownsTeam(actor, e) || Auth.canManageTorneo(actor, t))) fail('No puedes retirar esta inscripción');
      if (t.estado !== 'abierto') fail('El torneo ya inició: no se puede retirar la inscripción');
      remove('inscripciones', x => x.id_inscripcion === idI); log(actor, 'Retiró la inscripción de ' + e.nombre + ' en ' + t.nombre); save();
    }

    // ---------- brackets ----------
    function toRounds(idT) {
      const es = rows('enfrentamientos_brackets', e => e.id_torneo === idT);
      if (!es.length) return null;
      const total = Math.max(...es.map(e => e.ronda)), rounds = [];
      for (let r = 1; r <= total; r++) rounds.push([]);
      es.forEach(e => {
        const res = rows('resultados', x => x.id_enfrentamiento === e.id_enfrentamiento)[0];
        rounds[e.ronda - 1][e.posicion - 1] = { a: e.id_equipo_a, b: e.id_equipo_b, sa: res ? res.puntaje_a : null, sb: res ? res.puntaje_b : null, w: e.id_ganador, _row: e.id_enfrentamiento };
      });
      return rounds;
    }
    function saveRounds(rounds, actor, targetRow, when) {
      rounds.flat().forEach(m => {
        const e = find('enfrentamientos_brackets', m._row);
        e.id_equipo_a = m.a; e.id_equipo_b = m.b; e.id_ganador = m.w;
        const res = rows('resultados', x => x.id_enfrentamiento === m._row)[0];
        if (m.sa === null) { if (res) remove('resultados', x => x.id_enfrentamiento === m._row); }
        else if (!res) insert('resultados', { id_enfrentamiento: m._row, puntaje_a: m.sa, puntaje_b: m.sb, registrado_por: actor.id_usuario, fecha_registro: stamp(when || nowFn()) });
        else if (m._row === targetRow || res.puntaje_a !== m.sa || res.puntaje_b !== m.sb) Object.assign(res, { puntaje_a: m.sa, puntaje_b: m.sb, registrado_por: actor.id_usuario, fecha_registro: stamp(when || nowFn()) });
      });
    }
    const teamName = id => { const e = id ? find('equipos', id) : null; return e ? { id_equipo: e.id_equipo, nombre: e.nombre } : null; };
    function getBracket(idT) {
      const rounds = toRounds(idT); if (!rounds) return null;
      const total = rounds.length;
      const view = rounds.map((rd, ri) => rd.map((m, i) => {
        const bye = ri === 0 && m.sa === null && m.w !== null && (!m.a !== !m.b);
        return { id_enfrentamiento: m._row, ronda: ri + 1, posicion: i + 1, a: teamName(m.a), b: teamName(m.b), sa: m.sa, sb: m.sb, w: teamName(m.w), bye, jugable: !!(m.a && m.b), jugado: m.sa !== null, id_siguiente: find('enfrentamientos_brackets', m._row).id_siguiente };
      }));
      const champId = rounds[total - 1][0].w;
      return { rounds: view, total, nombres: view.map((_, ri) => roundName(ri + 1, total)), campeon: teamName(champId) };
    }
    function generarBracket(actor, idT, modo) {
      const t = mustManage(actor, idT);
      if (t.estado !== 'abierto' || rows('enfrentamientos_brackets', e => e.id_torneo === idT).length) fail('El bracket de este torneo ya fue generado');
      let ids = rows('inscripciones', i => i.id_torneo === idT && i.estado === 'aprobado').sort((a, b) => a.id_inscripcion - b.id_inscripcion).map(i => i.id_equipo);
      if (ids.length < MIN_EQUIPOS) fail('Se necesitan al menos ' + MIN_EQUIPOS + ' equipos aprobados (hay ' + ids.length + ')');
      if (modo === 'sorteo') { const rnd = opts.rng || Math.random; for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } }
      const rounds = Bracket.generate(ids);
      const rowIds = rounds.map((rd, ri) => rd.map((_, i) => { const r = insert('enfrentamientos_brackets', { id_torneo: idT, ronda: ri + 1, posicion: i + 1, id_equipo_a: null, id_equipo_b: null, id_ganador: null, id_siguiente: null }); return r.id_enfrentamiento; }));
      rounds.forEach((rd, ri) => rd.forEach((m, i) => { m._row = rowIds[ri][i]; if (ri + 1 < rounds.length) find('enfrentamientos_brackets', m._row).id_siguiente = rowIds[ri + 1][i >> 1]; }));
      saveRounds(rounds, actor);
      t.estado = 'en_curso'; log(actor, 'Generó el bracket de ' + t.nombre + ' (' + ids.length + ' equipos, ' + (modo === 'sorteo' ? 'sorteo' : 'por orden de inscripción') + ')'); save();
      return getBracket(idT);
    }
    function locate(rounds, idEnf) { for (let r = 0; r < rounds.length; r++) { const i = rounds[r].findIndex(m => m._row === idEnf); if (i >= 0) return [r, i]; } return null; }
    const clone = o => JSON.parse(JSON.stringify(o));
    function checkScores(sa, sb) {
      const e = {};
      if (!Number.isInteger(sa) || sa < 0 || sa > MAX_PUNTAJE) e.sa = 'Entero entre 0 y ' + MAX_PUNTAJE;
      if (!Number.isInteger(sb) || sb < 0 || sb > MAX_PUNTAJE) e.sb = 'Entero entre 0 y ' + MAX_PUNTAJE;
      if (!Object.keys(e).length && sa === sb) { e.sa = e.sb = 'No se permiten empates en eliminación directa'; }
      if (Object.keys(e).length) throw new VErr(e.sa && e.sa.startsWith('No se') ? e.sa : 'Marcador no válido', e);
    }
    // cuantos resultados posteriores se borrarian si se cambia el ganador de este cruce
    function previewImpact(idEnf, sa, sb) {
      const en = find('enfrentamientos_brackets', idEnf); if (!en) return 0;
      const rounds = toRounds(en.id_torneo), [r, i] = locate(rounds, idEnf);
      const before = rounds.flat().filter(m => m.sa !== null).length, hadResult = rounds[r][i].sa !== null;
      try { checkScores(sa, sb); Bracket.setResult(rounds, r, i, sa, sb); } catch (e) { return 0; }
      return Math.max(0, before + (hadResult ? 0 : 1) - rounds.flat().filter(m => m.sa !== null).length);
    }
    function registrarResultado(actor, idEnf, sa, sb, when) {
      const en = find('enfrentamientos_brackets', idEnf); if (!en) fail('Cruce no encontrado');
      const t = mustManage(actor, en.id_torneo);
      if (t.estado === 'abierto') fail('Primero genera el bracket del torneo');
      checkScores(sa, sb);
      const rounds = toRounds(en.id_torneo), [r, i] = locate(rounds, idEnf);
      if (!rounds[r][i].a || !rounds[r][i].b) fail('Este cruce aún no tiene a los dos equipos definidos');
      const before = rounds.flat().filter(m => m.sa !== null).length, hadResult = rounds[r][i].sa !== null;
      Bracket.setResult(rounds, r, i, sa, sb);
      saveRounds(rounds, actor, idEnf, when);
      const after = rounds.flat().filter(m => m.sa !== null).length;
      const champ = rounds[rounds.length - 1][0].w;
      t.estado = champ ? 'finalizado' : 'en_curso';
      const a = find('equipos', rounds[r][i].a).nombre, b = find('equipos', rounds[r][i].b).nombre;
      log(actor, (hadResult ? 'Corrigió' : 'Registró') + ' el resultado ' + a + ' ' + sa + '–' + sb + ' ' + b + ' (' + t.nombre + ')'); save();
      return { borrados: Math.max(0, before + (hadResult ? 0 : 1) - after), campeon: teamName(champ) };
    }
    function reiniciarBracket(actor, idT) {
      const t = mustManage(actor, idT);
      const ids = rows('enfrentamientos_brackets', e => e.id_torneo === idT).map(e => e.id_enfrentamiento);
      if (!ids.length) fail('Este torneo no tiene bracket');
      remove('resultados', r => ids.includes(r.id_enfrentamiento)); remove('enfrentamientos_brackets', e => e.id_torneo === idT);
      t.estado = 'abierto'; log(actor, 'Reinició el bracket de ' + t.nombre); save();
    }

    // ---------- estadisticas ----------
    function tablaTorneo(idT) {
      const rounds = toRounds(idT); if (!rounds) return [];
      return Bracket.stats(rounds).map(s => Object.assign({}, s, { nombre: find('equipos', s.team).nombre, id_equipo: s.team, dg: s.gf - s.gc }));
    }
    function ranking() {
      const T = {}; const g = id => T[id] || (T[id] = { id_equipo: id, nombre: find('equipos', id).nombre, pj: 0, pg: 0, pp: 0, gf: 0, gc: 0, titulos: 0, torneos: 0 });
      rows('torneos').forEach(t => {
        const rounds = toRounds(t.id_torneo); if (!rounds) return;
        const part = new Set(); rounds[0].forEach(m => { if (m.a) part.add(m.a); if (m.b) part.add(m.b); }); part.forEach(id => { g(id).torneos++; });
        Bracket.stats(rounds).forEach(s => { const x = g(s.team); x.pj += s.pj; x.pg += s.pg; x.pp += s.pp; x.gf += s.gf; x.gc += s.gc; });
        const c = rounds[rounds.length - 1][0].w; if (c) g(c).titulos++;
      });
      return Object.values(T).map(x => Object.assign(x, { efectividad: x.pj ? Math.round((x.pg / x.pj) * 100) : 0 })).sort((a, b) => b.titulos - a.titulos || b.pg - a.pg || (b.gf - b.gc) - (a.gf - a.gc) || a.nombre.localeCompare(b.nombre));
    }
    function historialEquipo(idE) {
      const out = [];
      rows('torneos').forEach(t => {
        const b = getBracket(t.id_torneo); if (!b) return;
        b.rounds.flat().forEach(m => {
          if (!m.jugado || !((m.a && m.a.id_equipo === idE) || (m.b && m.b.id_equipo === idE))) return;
          const esA = m.a.id_equipo === idE;
          out.push({ torneo: t.nombre, fecha: t.fecha, ronda: b.nombres[m.ronda - 1], rival: (esA ? m.b : m.a).nombre, pf: esA ? m.sa : m.sb, pc: esA ? m.sb : m.sa, gano: m.w.id_equipo === idE });
        });
      });
      return out.sort((a, b) => b.fecha.localeCompare(a.fecha));
    }
    function resumen() {
      const ts = rows('torneos');
      const porJuego = rows('juegos').map(j => ({ juego: j.nombre, torneos: ts.filter(t => t.id_juego === j.id_juego).length })).filter(x => x.torneos).sort((a, b) => b.torneos - a.torneos);
      return {
        usuarios: rows('usuarios').length, equipos: rows('equipos').length, jugadores: rows('jugadores_roster').length, sedes: rows('sedes_mapa').length,
        torneos: ts.length, abiertos: ts.filter(t => t.estado === 'abierto').length, en_curso: ts.filter(t => t.estado === 'en_curso').length, finalizados: ts.filter(t => t.estado === 'finalizado').length,
        partidas: rows('resultados').length, pendientes: rows('inscripciones', i => i.estado === 'pendiente').length, porJuego
      };
    }
    const bitacora = n => S.log.slice(0, n || 15);

    // ---------- exportacion ----------
    const lit = v => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'");
    function exportSQL() {
      const out = ['-- LobbyMaster · datos de la beta exportados (MySQL 8)', '-- Autor: Yair Anibal Mamani Ticona · generado ' + stamp(nowFn()), 'SET FOREIGN_KEY_CHECKS = 0;', ''];
      TABLES.forEach(t => {
        const cols = SCHEMA[t].cols.map(c => c[0]);
        rows(t).forEach(r => out.push('INSERT INTO ' + t + ' (' + cols.join(', ') + ') VALUES (' + cols.map(c => lit(r[c])).join(', ') + ');'));
        out.push('');
      });
      out.push('SET FOREIGN_KEY_CHECKS = 1;');
      return out.join('\n');
    }
    const exportJSON = () => JSON.stringify(S.t, null, 2);
    const tables = () => Object.fromEntries(TABLES.map(t => [t, clone(S.t[t])]));
    function reset(actor) { storage.removeItem && storage.removeItem(KEY); S = blank(); seed(); log(actor || null, 'Restauró los datos de demostración'); save(); }

    // ---------- datos de demostracion (ficticios) ----------
    function seed() {
      silent = true;
      const P = 'Jugador2026', O = 'Organiza2026', A = 'Admin2026';
      const addU = (n, rol, pw) => insert('usuarios', { nombre_usuario: n, correo: n + '@correo-demo.bo', contrasena_hash: Auth.hashPassword(pw, 'sal' + n.slice(0, 5)), rol });
      const admin = addU('admin', 'admin', A); addU('organizador', 'organizador', O); addU('ceja_events', 'organizador', O);
      const teams = [['Illimani eSports', 'jugador'], ['Wayna Squad', 'wayna_pro'], ['Condor Gaming', 'kuntur_gg'], ['Titikaka FC', 'titi_lake'], ['Sajama Clan', 'sajama_clan'], ['Chacaltaya Crew', 'chaca_crew'], ['Mallku eSports', 'mallku_es'], ['Pachakuti Team', 'pacha_team'], ['Huayna Legion', 'huayna_leg'], ['Altiplano Wolves', 'alti_wolves'], ['Tunari Gaming', 'tunari_gg'], ['Yungas Phoenix', 'yungas_px']];
      const tags = ['Kuntur', 'Yatiri', 'Tunupa', 'Nayra', 'Sami', 'Ayni', 'Turpo', 'Mallki', 'Zorro', 'Vizcacha', 'Puma', 'Pukara', 'Sullka', 'Wayra', 'Illa', 'Qhana', 'Amaru', 'Khuno', 'Chaska', 'Inti', 'Apu', 'Lluvia', 'Cóndor', 'Sirena', 'Jaguar', 'Tigre', 'Halcón', 'Lobo', 'Titán', 'Rayo', 'Sombra', 'Fénix', 'Cobra', 'Trueno', 'Águila', 'Nova', 'Viper', 'Blaze', 'Rex', 'Orion', 'Zeta', 'Kairos', 'Atlas', 'Drako', 'Neón', 'Vortex', 'Pixel', 'Glitch', 'Turbo', 'Ghost', 'Mono', 'Bravo', 'Kilo', 'Delta', 'Echo', 'Foxtrot', 'Gamma', 'Hotel', 'Indigo', 'Julio'];
      teams.forEach(([n, cap], i) => {
        let u = rows('usuarios', x => x.nombre_usuario === cap)[0]; if (!u) u = addU(cap, 'jugador', P);
        const e = insert('equipos', { nombre: n, id_capitan: u.id_usuario });
        for (let k = 0; k < 5; k++) insert('jugadores_roster', { id_equipo: e.id_equipo, nickname: tags[(i * 5 + k) % tags.length] + (i * 5 + k >= tags.length ? i : '') });
      });
      ['Valorant', 'League of Legends', 'Counter-Strike 2', 'EA Sports FC 26', 'Mobile Legends'].forEach(n => insert('juegos', { nombre: n }));
      [['Arena Sopocachi', -16.5112, -68.1262], ['Hub Miraflores', -16.5045, -68.1188], ['Centro Esports Calacoto', -16.5395, -68.082], ['Lobby Center El Alto', -16.5045, -68.163], ['Net Zone Obrajes', -16.5265, -68.105], ['Sala Gamer Centro', -16.4958, -68.1337]].forEach(([nombre, latitud, longitud]) => insert('sedes_mapa', { nombre, latitud, longitud }));
      const day = k => { const d = new Date(nowFn()); d.setDate(d.getDate() + k); return d; };
      const org = rows('usuarios', u => u.nombre_usuario === 'organizador')[0], ceja = rows('usuarios', u => u.nombre_usuario === 'ceja_events')[0];
      const mk = (nombre, k, cupos, g, s, o) => createTorneo(Object.assign({}, o, { rol: o.rol }), { nombre, fecha: ymd(day(k)), cupos, id_juego: g, id_sede: s }, { seed: true });
      const T1 = mk('Copa Illimani Valorant', -35, 8, 1, 1, org), T2 = mk('Liga Altiplano LoL Open', -2, 8, 2, 2, org), T3 = mk('Copa Ceja CS2', 12, 16, 3, 4, ceja), T4 = mk('Torneo Calacoto EA FC 26', 26, 8, 4, 3, org);
      mk('Mobile Legends Challenge', 40, 16, 5, 6, ceja);
      const insc = (idT, ids, est) => ids.forEach(id => { const i = insert('inscripciones', { id_torneo: idT, id_equipo: id, estado: est }); void i; });
      insc(T1.id_torneo, [1, 2, 3, 4, 5, 6, 7, 8], 'aprobado'); insc(T2.id_torneo, [3, 4, 5, 6, 7, 9, 10, 11], 'aprobado');
      insc(T3.id_torneo, [2, 4, 6, 8, 10], 'aprobado'); insc(T3.id_torneo, [1, 12], 'pendiente');
      insc(T4.id_torneo, [3, 5, 7, 9], 'aprobado'); insc(T4.id_torneo, [11], 'pendiente');
      generarBracket(org, T1.id_torneo, 'orden'); generarBracket(org, T2.id_torneo, 'orden');
      const play = (idT, list, when) => list.forEach(([r, i, sa, sb]) => { const b = getBracket(idT); registrarResultado(org, b.rounds[r][i].id_enfrentamiento, sa, sb, when); });
      play(T1.id_torneo, [[0, 0, 2, 0], [0, 1, 2, 1], [0, 2, 1, 2], [0, 3, 2, 1], [1, 0, 2, 0], [1, 1, 1, 2], [2, 0, 2, 1]], day(-35));
      play(T2.id_torneo, [[0, 0, 2, 1], [0, 1, 0, 2], [1, 0, 2, 0], [0, 2, 2, 0]], day(-2));
      void admin; silent = false;
      S.log = [{ t: stamp(nowFn()), u: 'sistema', msg: 'Datos de demostración cargados' }];
    }

    load();
    return {
      SCHEMA, TABLES, MIN_EQUIPOS, ROSTER_MIN, ROSTER_MAX, MAX_PUNTAJE,
      register, login, getUser, listUsers, setRole, deleteUser, changePassword,
      listGames, addGame, deleteGame, listSedes, addSede, updateSede, deleteSede,
      listTeams, getTeam, createTeam, updateTeam, deleteTeam,
      listTorneos, getTorneo, createTorneo, updateTorneo, deleteTorneo,
      listInscripciones, listInscripcionesDeEquipos, inscribir, resolver, retirar,
      getBracket, generarBracket, registrarResultado, previewImpact, reiniciarBracket,
      tablaTorneo, ranking, historialEquipo, resumen, bitacora,
      exportSQL, exportJSON, tables, reset, today
    };
  }

  const API = { create, VErr, SCHEMA, roundName };
  if (typeof module !== 'undefined') module.exports = API; else root.Store = API;
})(this);
