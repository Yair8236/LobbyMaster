// LobbyMaster Beta 4 - autenticacion y permisos por rol. Autor: Yair Anibal Mamani Ticona
(function (root) {
  // SHA-256 en JavaScript puro (sincrono, funciona tambien abriendo el archivo sin servidor)
  function sha256(text) {
    const bytes = unescape(encodeURIComponent(String(text))).split('').map(c => c.charCodeAt(0));
    const K = [], H = [];
    for (let n = 2, c = 0; c < 64; n++) {
      let prime = true;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
      if (!prime) continue;
      if (c < 8) H[c] = Math.floor((Math.pow(n, 1 / 2) % 1) * 4294967296);
      K[c++] = Math.floor((Math.pow(n, 1 / 3) % 1) * 4294967296);
    }
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bitLen >>> (i * 8)) & 255);
    const rr = (v, n) => (v >>> n) | (v << (32 - n));
    const h = H.slice();
    for (let off = 0; off < bytes.length; off += 64) {
      const w = [];
      for (let i = 0; i < 16; i++) w[i] = (bytes[off + 4 * i] << 24) | (bytes[off + 4 * i + 1] << 16) | (bytes[off + 4 * i + 2] << 8) | bytes[off + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (hh + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) | 0; });
    }
    return h.map(v => ('00000000' + (v >>> 0).toString(16)).slice(-8)).join('');
  }

  const randomSalt = () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
  const hashPassword = (pw, salt) => { salt = salt || randomSalt(); return salt + '$' + sha256(salt + pw); };
  const verifyPassword = (pw, stored) => { const s = String(stored).split('$')[0]; return hashPassword(pw, s) === stored; };

  const ROLES = { admin: 'Administrador', organizador: 'Organizador', jugador: 'Jugador' };
  // Matriz de permisos: que puede hacer cada rol (el controlador la consulta antes de actuar)
  const PERMS = {
    admin: ['torneo.crear', 'torneo.gestionar_todos', 'equipo.crear', 'equipo.ver_todos', 'inscribir', 'usuarios.admin', 'catalogos.admin', 'sede.crear', 'datos.ver'],
    organizador: ['torneo.crear', 'sede.crear', 'equipo.crear', 'inscribir'],
    jugador: ['equipo.crear', 'inscribir']
  };
  const can = (user, perm) => !!user && (PERMS[user.rol] || []).includes(perm);
  const canManageTorneo = (user, torneo) => !!user && !!torneo && (can(user, 'torneo.gestionar_todos') || (user.rol === 'organizador' && torneo.id_organizador === user.id_usuario));

  const validators = {
    usuario: v => (/^[A-Za-z0-9_]{3,20}$/.test(v || '') ? '' : 'Entre 3 y 20 caracteres: letras, numeros o guion bajo'),
    correo: v => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v || '') && v.length <= 100 ? '' : 'Ingresa un correo valido'),
    password: v => ((v || '').length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v) ? '' : 'Minimo 8 caracteres, con letras y numeros')
  };
  const API = { sha256, hashPassword, verifyPassword, ROLES, PERMS, can, canManageTorneo, validators };
  if (typeof module !== 'undefined') module.exports = API; else root.Auth = API;
})(this);
