// Prueba de la sincronizacion con la base remota usando un servidor PostgREST simulado: node tests/sync.test.js
const assert = require('assert'), vm = require('vm'), fs = require('fs'), path = require('path'), Store = require('../backend/src/store.js');
const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, removeItem: k => { delete m[k]; } }; };
const PKS = { usuarios: 'id_usuario', juegos: 'id_juego', sedes_mapa: 'id_sede', torneos: 'id_torneo', equipos: 'id_equipo', jugadores_roster: 'id_roster', inscripciones: 'id_inscripcion', enfrentamientos_brackets: 'id_enfrentamiento', resultados: 'id_resultado', bitacora: 'id_bitacora' };

function servidor() {
  const tabla = {}; Object.keys(PKS).forEach(t => { tabla[t] = []; });
  const llamadas = []; let caido = false;
  const fetch = async (url, o) => {
    if (caido) throw new Error('sin internet');
    const u = new URL(url), t = u.pathname.split('/').pop(), pk = PKS[t], m = (o && o.method) || 'GET';
    assert.ok(t in PKS, 'tabla desconocida ' + t); assert.ok(o.headers.apikey, 'falta apikey');
    llamadas.push(m + ' ' + t);
    const res = (st, body) => ({ ok: st < 300, status: st, text: async () => (body == null ? '' : JSON.stringify(body)) }); // como PostgREST: 201/204 sin cuerpo
    if (m === 'GET') return res(200, JSON.parse(JSON.stringify(tabla[t])));
    if (m === 'POST') { JSON.parse(o.body).forEach(r => { const i = tabla[t].findIndex(x => x[pk] === r[pk]); if (i >= 0) tabla[t][i] = Object.assign({}, tabla[t][i], r); else tabla[t].push(r); }); return res(201, null); }
    if (m === 'DELETE') { const ids = u.searchParams.get(pk).replace(/^in\.\(|\)$/g, '').split(',').map(Number); tabla[t] = tabla[t].filter(r => !ids.includes(r[pk])); return res(204, null); }
    throw new Error('metodo ' + m);
  };
  return { tabla, llamadas, fetch, caer: v => { caido = v; } };
}
function cliente(srv, storage) {
  const sb = { fetch: srv.fetch, AbortController, setTimeout, clearTimeout, console };
  vm.createContext(sb); sb.window = sb; sb.LOBBY_CONFIG = { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'sb_publishable_test', usarSupabase: true };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../frontend/js/sync.js'), 'utf8'), sb);
  const db = Store.create(storage || mem(), { now: () => new Date('2026-10-26T12:00:00'), onSave: () => sb.Sync.schedule() });
  return { Sync: sb.Sync, db };
}
const esperar = ms => new Promise(r => setTimeout(r, ms));
const admin = db => db.login('admin', 'Admin2026'), org = db => db.login('organizador', 'Organiza2026');

(async () => {
  let n = 0; const ok = async (name, fn) => { await fn(); n++; };
  const srv = servidor();

  await ok('base vacia: sube los datos de demostracion', async () => {
    const a = cliente(srv); await a.Sync.init(a.db);
    assert.strictEqual(a.Sync.status().estado, 'conectado');
    const t = a.db.tables(); Object.keys(t).forEach(k => assert.strictEqual(srv.tabla[k].length, t[k].length, k));
    assert.ok(srv.tabla.bitacora.length >= 1);
    // las llaves foraneas se respetan: padres antes que hijos
    const orden = srv.llamadas.filter(x => x.startsWith('POST')).map(x => x.slice(5));
    assert.ok(orden.indexOf('usuarios') < orden.indexOf('torneos') && orden.indexOf('torneos') < orden.indexOf('enfrentamientos_brackets') && orden.indexOf('enfrentamientos_brackets') < orden.indexOf('resultados'));
  });

  await ok('otro navegador: descarga lo guardado y no vuelve a sembrar', async () => {
    srv.llamadas.length = 0;
    const b = cliente(srv); await b.Sync.init(b.db);
    assert.ok(!srv.llamadas.some(x => x.startsWith('POST')), 'no debe subir nada');
    assert.strictEqual(b.db.listTorneos().length, 5); assert.ok(b.db.login('admin', 'Admin2026'));
    assert.strictEqual(b.db.listSedes()[0].direccion, 'Zona Sopocachi, La Paz');
    assert.strictEqual(typeof b.db.listSedes()[0].latitud, 'number');
  });

  await ok('cada cambio se guarda solo en las filas modificadas', async () => {
    const c = cliente(srv); await c.Sync.init(c.db); srv.llamadas.length = 0;
    const o = org(c.db), s = c.db.addSede(o, { nombre: 'Sede Nueva', direccion: 'Calle 1', latitud: -16.52, longitud: -68.11, enlace_maps: 'https://www.google.com/maps/@-16.52,-68.11,17z' });
    await esperar(500);
    assert.ok(srv.tabla.sedes_mapa.some(x => x.id_sede === s.id_sede && x.nombre === 'Sede Nueva' && x.enlace_maps), 'sede en la nube');
    assert.deepStrictEqual([...new Set(srv.llamadas.filter(x => x.startsWith('POST')))].sort(), ['POST bitacora', 'POST sedes_mapa']);
    assert.strictEqual(c.Sync.status().estado, 'conectado');
  });

  await ok('borrar un torneo: primero los hijos, luego el padre', async () => {
    const c = cliente(srv); await c.Sync.init(c.db); srv.llamadas.length = 0;
    const a = admin(c.db), t = c.db.listTorneos().find(x => x.nombre === 'Copa Illimani Valorant');
    c.db.deleteTorneo(a, t.id_torneo); await esperar(500);
    const dels = srv.llamadas.filter(x => x.startsWith('DELETE')).map(x => x.slice(7));
    assert.ok(dels.indexOf('resultados') < dels.indexOf('enfrentamientos_brackets') && dels.indexOf('enfrentamientos_brackets') < dels.indexOf('torneos'), dels.join());
    assert.ok(!srv.tabla.torneos.some(x => x.id_torneo === t.id_torneo)); assert.ok(!srv.tabla.resultados.some(r => r.id_enfrentamiento <= 7));
  });

  await ok('sin internet: sigue funcionando y sube los cambios al reconectar', async () => {
    const srv2 = servidor(); const sem = cliente(srv2); await sem.Sync.init(sem.db); // siembra
    srv2.caer(true);
    const st = mem(); const d = cliente(srv2, st); await d.Sync.init(d.db);
    assert.strictEqual(d.Sync.status().estado, 'sin_conexion');
    d.db.addGame(admin(d.db), 'Dota 2'); await esperar(500);
    assert.ok(!srv2.tabla.juegos.some(g => g.nombre === 'Dota 2'));
    srv2.caer(false); assert.strictEqual(await d.Sync.reconectar(), true);
    assert.ok(srv2.tabla.juegos.some(g => g.nombre === 'Dota 2'), 'el cambio hecho sin internet se subio');
    assert.strictEqual(srv2.tabla.torneos.length, 5, 'no se perdieron los datos remotos');
  });

  await ok('restaurar datos de demostracion deja la nube igual al modelo', async () => {
    const c = cliente(srv); await c.Sync.init(c.db); c.db.reset(admin(c.db)); await esperar(600);
    const t = c.db.tables(); Object.keys(t).forEach(k => assert.strictEqual(srv.tabla[k].length, t[k].length, k));
  });
  console.log('Pruebas de sincronizacion: ' + n + ' grupos OK');
})().catch(e => { console.error(e); process.exit(1); });
