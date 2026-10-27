// LobbyMaster Beta - motor de brackets (eliminacion directa). Autor: Yair Anibal Mamani Ticona
(function (root) {
  const pow2 = n => { let s = 1; while (s < n) s *= 2; return s; };
  function clear(b, r, i) {
    const m = b[r][i]; m.sa = m.sb = null;
    if (m.w) { m.w = null; if (r + 1 < b.length) { b[r + 1][i >> 1][i % 2 ? 'b' : 'a'] = null; clear(b, r + 1, i >> 1); } }
  }
  function advance(b, r, i, team) {
    b[r][i].w = team;
    if (r + 1 < b.length) {
      const nm = b[r + 1][i >> 1], side = i % 2 ? 'b' : 'a';
      if (nm[side] !== team) { nm[side] = team; clear(b, r + 1, i >> 1); }
    }
  }
  function generate(teams) {
    if (teams.length < 2) throw new Error('Se necesitan al menos 2 equipos');
    const size = pow2(teams.length), slots = teams.concat(Array(size - teams.length).fill(null));
    const b = [];
    for (let r = 0; r < Math.log2(size); r++) {
      b.push([]);
      for (let i = 0; i < size / 2 ** (r + 1); i++) b[r].push({ id: 'R' + (r + 1) + '_' + (i + 1), a: null, b: null, sa: null, sb: null, w: null });
    }
    for (let i = 0; i < size / 2; i++) { b[0][i].a = slots[i]; b[0][i].b = slots[size - 1 - i]; }
    b[0].forEach((m, i) => { if (!m.a !== !m.b) advance(b, 0, i, m.a || m.b); }); // BYE: pasa directo
    return b;
  }
  function setResult(b, r, i, sa, sb) {
    const m = b[r][i];
    if (!m.a || !m.b) throw new Error('El cruce aun no tiene ambos equipos');
    if (!Number.isInteger(sa) || !Number.isInteger(sb) || sa < 0 || sb < 0) throw new Error('Marcador invalido');
    if (sa === sb) throw new Error('No se permiten empates en eliminacion directa');
    m.sa = sa; m.sb = sb; advance(b, r, i, sa > sb ? m.a : m.b);
  }
  const champion = b => b[b.length - 1][0].w;
  function stats(b) {
    const T = {}, g = n => T[n] || (T[n] = { team: n, pj: 0, pg: 0, pp: 0, gf: 0, gc: 0 });
    b.flat().forEach(m => {
      if (m.sa === null) return;
      const A = g(m.a), B = g(m.b);
      A.pj++; B.pj++; A.gf += m.sa; A.gc += m.sb; B.gf += m.sb; B.gc += m.sa;
      if (m.sa > m.sb) { A.pg++; B.pp++; } else { B.pg++; A.pp++; }
    });
    return Object.values(T).sort((x, y) => y.pg - x.pg || (y.gf - y.gc) - (x.gf - x.gc));
  }
  const API = { generate, setResult, champion, stats };
  if (typeof module !== 'undefined') module.exports = API; else root.Bracket = API;
})(this);
