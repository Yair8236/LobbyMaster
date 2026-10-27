// LobbyMaster Beta 4 · sincronización con Supabase (PostgreSQL).
// - Al abrir la página descarga las tablas y las carga en el modelo; si la base está vacía, sube los datos de demostración.
// - Cada cambio del modelo se envía a la base (solo las filas que cambiaron).
// - Si no hay internet, la app sigue funcionando con el navegador y avisa que está "sin conexión".
// Autor: Yair Anibal Mamani Ticona
(function (root) {
  const cfg = root.LOBBY_CONFIG || {};
  // orden respetando llaves foraneas: primero los padres
  const ORDER = ['usuarios', 'juegos', 'sedes_mapa', 'torneos', 'equipos', 'jugadores_roster', 'inscripciones', 'enfrentamientos_brackets', 'resultados', 'bitacora'];
  const PK = { bitacora: 'id_bitacora' };
  const pkOf = (t, SCHEMA) => PK[t] || SCHEMA[t].pk;

  let db = null, last = null, timer = null, busy = false, again = false, dirty = false, estado = 'apagado', detalle = '';
  const listeners = [];
  const set = (e, d) => { estado = e; detalle = d || ''; listeners.forEach(f => { try { f(estado, detalle); } catch (x) { /* vista cerrada */ } }); };
  const onStatus = f => { listeners.push(f); f(estado, detalle); };

  const base = () => cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/';
  const headers = extra => Object.assign({ apikey: cfg.supabaseKey, 'Content-Type': 'application/json' }, extra || {});
  async function http(path, opts, ms) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), ms || 12000);
    try {
      const r = await fetch(base() + path, Object.assign({ signal: ctl.signal }, opts, { headers: headers(opts && opts.headers) }));
      const txt = await r.text(); // PostgREST responde 201/204 sin cuerpo al guardar
      if (!r.ok) { let m = ''; try { m = JSON.parse(txt).message || ''; } catch (e) { /* sin cuerpo */ } throw new Error('HTTP ' + r.status + (m ? ' · ' + m : '')); }
      return txt ? JSON.parse(txt) : null;
    } finally { clearTimeout(tm); }
  }

  // ---- conversion entre el modelo del navegador y las filas de la base ----
  const toRemote = (t, r) => {
    if (t === 'bitacora') return { id_bitacora: r.id, fecha: r.t, usuario: String(r.u).slice(0, 30), mensaje: String(r.msg).slice(0, 300) };
    return r;
  };
  const fromRemote = (t, r) => {
    if (t === 'bitacora') return { id: Number(r.id_bitacora), t: r.fecha, u: r.usuario, msg: r.mensaje };
    const o = Object.assign({}, r);
    if (t === 'sedes_mapa') { o.latitud = Number(o.latitud); o.longitud = Number(o.longitud); }
    return o;
  };
  const dataOf = (snap, t) => (t === 'bitacora' ? snap.log : snap.t[t]).map(r => toRemote(t, r));

  async function pull() {
    const out = { t: {}, log: [] };
    const res = await Promise.all(ORDER.map(t => http(t + '?select=*&limit=5000', { method: 'GET' })));
    ORDER.forEach((t, i) => {
      const rows = res[i].map(r => fromRemote(t, r));
      if (t === 'bitacora') out.log = rows.sort((a, b) => b.id - a.id); else out.t[t] = rows;
    });
    return out;
  }

  async function pushDiff() {
    const snap = db.snapshot();
    const ops = { del: [], up: [] };
    ORDER.forEach(t => {
      const pk = pkOf(t, db.SCHEMA), now = dataOf(snap, t), before = new Map(dataOf(last, t).map(r => [r[pk], JSON.stringify(r)]));
      const nowIds = new Set(now.map(r => r[pk]));
      const changed = now.filter(r => before.get(r[pk]) !== JSON.stringify(r));
      const gone = [...before.keys()].filter(id => !nowIds.has(id));
      if (changed.length) ops.up.push([t, pk, changed]);
      if (gone.length) ops.del.push([t, pk, gone]);
    });
    // 1) borrar hijos antes que padres  2) insertar/actualizar padres antes que hijos
    for (const [t, pk, ids] of ops.del.slice().reverse()) await http(t + '?' + pk + '=in.(' + ids.join(',') + ')', { method: 'DELETE' });
    for (const [t, pk, rows] of ops.up) for (let i = 0; i < rows.length; i += 200)
      await http(t + '?on_conflict=' + pk, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(i, i + 200)) });
    last = snap;
  }

  async function flush() {
    if (busy) { again = true; return; }
    busy = true; set('guardando');
    try { do { again = false; await pushDiff(); } while (again); set('conectado'); }
    catch (e) { set('error', e.message); }
    finally { busy = false; }
  }
  const schedule = () => {
    if (estado === 'apagado') return;
    if (!last) { if (estado === 'sin_conexion') dirty = true; return; } // cambios hechos sin internet: se suben al reconectar
    clearTimeout(timer); timer = setTimeout(flush, 350);
  };

  async function init(model) {
    db = model;
    if (!cfg.usarSupabase || !cfg.supabaseUrl) { set('apagado'); return; }
    set('conectando');
    try {
      const remote = await pull();
      if (remote.t.usuarios.length && dirty) { last = { t: remote.t, log: remote.log }; dirty = false; await pushDiff(); }
      else if (remote.t.usuarios.length) { db.hydrate(remote); last = db.snapshot(); }
      else { last = { t: Object.fromEntries(Object.keys(db.snapshot().t).map(t => [t, []])), log: [] }; await pushDiff(); }
      set('conectado');
    } catch (e) { last = null; set('sin_conexion', e.message); }
  }
  // volver a descargar lo que otra persona o dispositivo guardó
  async function refrescar() {
    if (!cfg.usarSupabase) return false;
    set('conectando');
    try { const remote = await pull(); if (remote.t.usuarios.length) { db.hydrate(remote); last = db.snapshot(); } set('conectado'); return true; }
    catch (e) { set('sin_conexion', e.message); return false; }
  }
  // reintentar la conexion si estaba caida
  async function reconectar() { await init(db); return estado === 'conectado'; }

  root.Sync = { init, schedule, refrescar, reconectar, onStatus, status: () => ({ estado, detalle }) };
})(this);
