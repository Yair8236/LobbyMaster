// Pruebas de reglas de negocio de la capa Modelo: node tests/store.test.js
const assert = require('assert'), Store = require('../backend/src/store.js'), Auth = require('../backend/src/auth.js');
const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, removeItem: k => { delete m[k]; } }; };
const throwsMsg = (fn, re) => assert.throws(fn, e => re.test(e.message) || Object.values(e.fields || {}).some(v => re.test(v)), 'esperaba error ' + re);
let n = 0; const ok = (name, fn) => { fn(); n++; };

const db = Store.create(mem(), { rng: () => 0.3 });
const admin = db.login('admin', 'Admin2026'), org = db.login('organizador', 'Organiza2026'), org2 = db.login('ceja_events', 'Organiza2026'), jug = db.login('jugador', 'Jugador2026');

ok('sha256 y login', () => {
  assert.strictEqual(Auth.sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  throwsMsg(() => db.login('admin', 'mala'), /incorrectos/);
  assert.strictEqual(db.login('ADMIN@correo-demo.bo', 'Admin2026').rol, 'admin'); // por correo, sin distinguir mayusculas
});
ok('registro valida y no repite', () => {
  throwsMsg(() => db.register({ nombre_usuario: 'a', correo: 'x', password: '123' }), /Revisa/);
  throwsMsg(() => db.register({ nombre_usuario: 'JUGADOR', correo: 'nuevo@x.bo', password: 'Clave1234' }), /ya está en uso/);
  const u = db.register({ nombre_usuario: 'nuevo_1', correo: 'nuevo@x.bo', password: 'Clave1234', rol: 'admin' });
  assert.strictEqual(u.rol, 'jugador', 'el registro publico nunca crea administradores');
});
ok('datos de demostracion consistentes', () => {
  const t = db.tables(); assert.strictEqual(Object.keys(t).length, 9);
  const r = db.resumen(); assert.strictEqual(r.torneos, 5); assert.strictEqual(r.finalizados, 1); assert.strictEqual(r.en_curso, 1);
  const T1 = db.listTorneos().find(x => x.nombre === 'Copa Illimani Valorant'), b = db.getBracket(T1.id_torneo);
  assert.ok(b.campeon, 'T1 tiene campeon'); assert.strictEqual(b.total, 3); assert.deepStrictEqual(b.nombres, ['Cuartos de final', 'Semifinal', 'Final']);
  assert.strictEqual(T1.estado, 'finalizado');
  // cada cruce con ganador apunta a un siguiente existente (arbol binario)
  t.enfrentamientos_brackets.filter(e => e.id_siguiente).forEach(e => assert.ok(t.enfrentamientos_brackets.some(s => s.id_enfrentamiento === e.id_siguiente)));
});
ok('torneos: validaciones y permisos', () => {
  const f = { nombre: 'Torneo de prueba', fecha: '2099-01-01', cupos: 8, id_juego: 1, id_sede: 1 };
  throwsMsg(() => db.createTorneo(jug, f), /permiso/);
  throwsMsg(() => db.createTorneo(org, Object.assign({}, f, { cupos: 3 })), /entre 4 y 32/);
  throwsMsg(() => db.createTorneo(org, Object.assign({}, f, { fecha: '2001-01-01' })), /pasado/);
  throwsMsg(() => db.createTorneo(org, Object.assign({}, f, { nombre: 'copa ceja cs2' })), /Ya existe/);
  const t = db.createTorneo(org, f);
  throwsMsg(() => db.deleteTorneo(org2, t.id_torneo), /organizador del torneo/);
  db.deleteTorneo(org, t.id_torneo);
});
ok('inscripciones: reglas', () => {
  const t4 = db.listTorneos().find(x => x.nombre.includes('Calacoto'));
  const mine = db.listTeams({ captainId: jug.id_usuario })[0];
  throwsMsg(() => db.inscribir(db.login('wayna_pro', 'Jugador2026'), t4.id_torneo, mine.id_equipo), /capitán/);
  const i = db.inscribir(jug, t4.id_torneo, mine.id_equipo); assert.strictEqual(i.estado, 'pendiente');
  throwsMsg(() => db.inscribir(jug, t4.id_torneo, mine.id_equipo), /ya está inscrito/);
  throwsMsg(() => db.resolver(jug, i.id_inscripcion, 'aprobado'), /organizador/);
  db.resolver(org, i.id_inscripcion, 'aprobado');
  db.retirar(jug, i.id_inscripcion);
  const en = db.listTorneos().find(x => x.estado === 'en_curso');
  throwsMsg(() => db.inscribir(jug, en.id_torneo, mine.id_equipo), /ya no recibe/);
});
ok('equipos: validaciones y restriccion de borrado', () => {
  throwsMsg(() => db.createTeam(jug, { nombre: 'Illimani eSports', jugadores: ['a1', 'b2'] }), /Ya existe/);
  throwsMsg(() => db.createTeam(jug, { nombre: 'Equipo X', jugadores: ['solo'] }), /entre 2 y 8/);
  throwsMsg(() => db.createTeam(jug, { nombre: 'Equipo X', jugadores: ['aa', 'AA'] }), /repetidos/);
  const mine = db.listTeams({ captainId: jug.id_usuario })[0];
  throwsMsg(() => db.deleteTeam(jug, mine.id_equipo), /inscripción/);
  const e = db.createTeam(jug, { nombre: 'Equipo Temporal', jugadores: ['uno1', 'dos2', 'tres3'] }); db.deleteTeam(jug, e.id_equipo);
});
ok('bracket: resultados, avance, correccion y campeon', () => {
  const t4 = db.listTorneos().find(x => x.nombre.includes('Calacoto'));
  throwsMsg(() => db.generarBracket(org2, t4.id_torneo), /organizador del torneo/);
  const b0 = db.generarBracket(org, t4.id_torneo, 'sorteo'); assert.strictEqual(b0.total, 2);
  assert.strictEqual(db.getTorneo(t4.id_torneo).estado, 'en_curso');
  throwsMsg(() => db.generarBracket(org, t4.id_torneo), /ya fue generado/);
  const final = b0.rounds[1][0].id_enfrentamiento;
  throwsMsg(() => db.registrarResultado(org, final, 2, 0), /aún no tiene/);
  throwsMsg(() => db.registrarResultado(org, b0.rounds[0][0].id_enfrentamiento, 2, 2), /empates/);
  throwsMsg(() => db.registrarResultado(org, b0.rounds[0][0].id_enfrentamiento, -1, 2), /no válido/);
  throwsMsg(() => db.registrarResultado(org2, b0.rounds[0][0].id_enfrentamiento, 2, 1), /organizador del torneo/);
  db.registrarResultado(org, b0.rounds[0][0].id_enfrentamiento, 2, 1); db.registrarResultado(org, b0.rounds[0][1].id_enfrentamiento, 0, 2);
  let b = db.getBracket(t4.id_torneo); assert.ok(b.rounds[1][0].a && b.rounds[1][0].b);
  const r = db.registrarResultado(org, final, 2, 0); assert.ok(r.campeon); assert.strictEqual(db.getTorneo(t4.id_torneo).estado, 'finalizado');
  assert.strictEqual(db.previewImpact(b0.rounds[0][0].id_enfrentamiento, 1, 2), 1, 'cambiar el ganador borra la final');
  const c = db.registrarResultado(org, b0.rounds[0][0].id_enfrentamiento, 1, 2); assert.strictEqual(c.borrados, 1); assert.strictEqual(c.campeon, null);
  assert.strictEqual(db.getTorneo(t4.id_torneo).estado, 'en_curso');
  assert.strictEqual(db.tables().resultados.filter(x => x.id_enfrentamiento === final).length, 0, 'la final quedo sin resultado');
  db.reiniciarBracket(org, t4.id_torneo); assert.strictEqual(db.getBracket(t4.id_torneo), null); assert.strictEqual(db.getTorneo(t4.id_torneo).estado, 'abierto');
});
ok('integridad: admin y borrados con RESTRICT', () => {
  throwsMsg(() => db.setRole(admin, admin.id_usuario, 'jugador'), /al menos un administrador/);
  throwsMsg(() => db.deleteUser(admin, org.id_usuario), /integridad referencial/);
  throwsMsg(() => db.deleteGame(admin, 1), /lo usan/);
  throwsMsg(() => db.deleteSede(admin, 1), /la usan/);
  throwsMsg(() => db.setRole(jug, 3, 'admin'), /permiso/);
});
ok('ranking y exportacion SQL', () => {
  const rk = db.ranking(); assert.ok(rk.length >= 8); assert.ok(rk[0].titulos >= rk[rk.length - 1].titulos);
  rk.forEach(x => assert.strictEqual(x.pj, x.pg + x.pp));
  const sql = db.exportSQL(); assert.ok(/INSERT INTO usuarios/.test(sql) && /INSERT INTO resultados/.test(sql));
  assert.strictEqual((sql.match(/INSERT INTO/g) || []).length, Object.values(db.tables()).reduce((s, r) => s + r.length, 0));
});
ok('persistencia', () => {
  const st = mem(); const a = Store.create(st); a.addGame(a.login('admin', 'Admin2026'), 'Dota 2');
  assert.ok(Store.create(st).listGames().some(g => g.nombre === 'Dota 2'));
});
console.log('Pruebas del modelo: ' + n + ' grupos OK');
