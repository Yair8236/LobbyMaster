// Pruebas TDD del generador de brackets: node tests/bracket.test.js
const assert = require('assert'), B = require('../backend/src/bracket.js');
const eq = n => Array.from({ length: n }, (_, i) => 'Equipo ' + (i + 1));
let b = B.generate(eq(16));
assert.strictEqual(b.length, 4, '16 equipos => 4 rondas');
assert.strictEqual(b.flat().length, 15, '15 cruces');
B.setResult(b, 0, 0, 3, 1);
assert.strictEqual(b[1][0].a, b[0][0].w, 'el ganador de R1_1 avanza a R2_1');
assert.strictEqual(b[1].filter(m => m.a === b[0][0].w || m.b === b[0][0].w).length, 1, 'sin duplicados');
B.setResult(b, 0, 0, 0, 2); // cambia el ganador: se limpia lo posterior
assert.strictEqual(b[1][0].a, b[0][0].w);
assert.throws(() => B.setResult(b, 0, 1, 2, 2), /empates/);
let c = B.generate(eq(6)); // 6 equipos => 8 slots con 2 BYE
assert.strictEqual(c[0].filter(m => m.w).length, 2, '2 BYE avanzan solos');
c = B.generate(eq(2)); B.setResult(c, 0, 0, 1, 0);
assert.strictEqual(B.champion(c), 'Equipo 1');
console.log('Todas las pruebas pasaron');
