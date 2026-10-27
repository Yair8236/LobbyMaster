// Pruebas de las utilidades de ubicacion: node tests/geo.test.js
const assert = require('assert'), Geo = require('../backend/src/geo.js');
let n = 0; const ok = (name, fn) => { fn(); n++; };

ok('lee coordenadas de enlaces de Google Maps', () => {
  const casos = [
    ['https://www.google.com/maps/place/Plaza+Abaroa/@-16.5112,-68.1262,17z/data=!3m1', -16.5112, -68.1262],
    ['https://www.google.com/maps/place/X/data=!3d-16.5395!4d-68.082', -16.5395, -68.082],
    ['https://www.google.com/maps?q=-16.4958,-68.1337', -16.4958, -68.1337],
    ['https://www.google.com/maps/search/?api=1&query=-16.5265%2C-68.105', -16.5265, -68.105],
    ['https://www.google.com/maps/dir/?api=1&destination=-16.5045,-68.163', -16.5045, -68.163],
    ['-16.5112, -68.1262', -16.5112, -68.1262],
    ['(-16.5112 -68.1262)', -16.5112, -68.1262],
    ['  -16.511234567,-68.126234567 ', -16.511235, -68.126235]
  ];
  casos.forEach(([t, la, ln]) => { const r = Geo.parseMapsLink(t); assert.ok(r, t); assert.strictEqual(r.latitud, la, t); assert.strictEqual(r.longitud, ln, t); });
});
ok('rechaza lo que no es una ubicacion', () => {
  ['', 'hola', 'https://www.google.com/maps', '95, 20', '10, 200', null].forEach(t => assert.strictEqual(Geo.parseMapsLink(t), null, String(t)));
  assert.ok(Geo.isShortLink('https://maps.app.goo.gl/AbCd123') && !Geo.isShortLink('https://www.google.com/maps?q=1,2'));
});
ok('enlaces de Google Maps', () => {
  assert.strictEqual(Geo.verEnMaps(-16.5, -68.15), 'https://www.google.com/maps/search/?api=1&query=-16.5,-68.15');
  assert.strictEqual(Geo.comoLlegar(-16.5, -68.15), 'https://www.google.com/maps/dir/?api=1&destination=-16.5,-68.15');
  assert.ok(Geo.abrirMapsParaElegir('Plaza Abaroa').includes('Plaza%20Abaroa'));
});
ok('proyeccion Web Mercator: ida y vuelta', () => {
  [[-16.5112, -68.1262, 13], [-16.5395, -68.082, 17], [0, 0, 3], [40.4, -3.7, 10]].forEach(([la, ln, z]) => {
    const p = Geo.project(la, ln, z), q = Geo.unproject(p.x, p.y, z);
    assert.ok(Math.abs(q.lat - la) < 1e-9 && Math.abs(q.lng - ln) < 1e-9, la + ',' + ln);
  });
  const c = Geo.project(0, 0, 0); assert.ok(Math.abs(c.x - 128) < 1e-9 && Math.abs(c.y - 128) < 1e-9); // el mundo mide 256 px a zoom 0
  // mosaico de La Paz a zoom 13, calculado aparte con la formula estandar de OpenStreetMap (x=2545, y=4476)
  const p = Geo.project(-16.5, -68.15, 13); assert.strictEqual(Math.floor(p.x / 256), 2545); assert.strictEqual(Math.floor(p.y / 256), 4476);
});
ok('zoom que abarca varias sedes', () => {
  const pts = [{ lat: -16.4958, lng: -68.1337 }, { lat: -16.5395, lng: -68.082 }];
  const z = Geo.fitZoom(pts, 600, 400, 3, 17), a = Geo.project(pts[0].lat, pts[0].lng, z), b = Geo.project(pts[1].lat, pts[1].lng, z);
  assert.ok(Math.abs(a.x - b.x) <= 600 && Math.abs(a.y - b.y) <= 400 && z >= 12 && z <= 15, 'z=' + z);
});
console.log('Pruebas de ubicacion: ' + n + ' grupos OK');
