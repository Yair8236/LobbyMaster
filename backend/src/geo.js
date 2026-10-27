// LobbyMaster Beta 4 - utilidades de ubicacion: leer coordenadas desde un enlace de Google Maps y armar enlaces.
// Asi nadie tiene que saber ni escribir coordenadas: se elige en el mapa o se pega el enlace/lugar de Google Maps.
// Autor: Yair Anibal Mamani Ticona
(function (root) {
  const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const valid = (lat, lng) => isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const round6 = n => Math.round(n * 1e6) / 1e6;

  // Acepta: enlace largo de Google Maps (@lat,lng | !3dlat!4dlng | ?q=lat,lng | ll= | query= | destination=),
  // o simplemente "lat, lng" (lo que Google Maps copia con clic derecho sobre el lugar).
  function parseMapsLink(text) {
    const s = decodeURIComponent(String(text || '').trim().replace(/\+/g, ' '));
    if (!s) return null;
    const pats = [
      new RegExp('!3d' + NUM + '!4d' + NUM),
      new RegExp('@' + NUM + ',' + NUM),
      new RegExp('[?&](?:q|query|ll|destination|center|daddr)=' + NUM + '\\s*,\\s*' + NUM),
      new RegExp('^\\(?\\s*' + NUM + '\\s*[,;\\s]\\s*' + NUM + '\\s*\\)?$')
    ];
    for (const p of pats) {
      const m = s.match(p);
      if (m) { const lat = parseFloat(m[1]), lng = parseFloat(m[2]); if (valid(lat, lng)) return { latitud: round6(lat), longitud: round6(lng) }; }
    }
    return null;
  }
  const isShortLink = t => /(?:maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i.test(String(t || ''));

  const verEnMaps = (lat, lng) => 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng;
  const comoLlegar = (lat, lng) => 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
  const abrirMapsParaElegir = q => 'https://www.google.com/maps' + (q ? '/search/?api=1&query=' + encodeURIComponent(q) : '/@-16.5,-68.15,13z');

  // ---- matematica de mapas "slippy" (Web Mercator, mosaicos de 256 px, igual que OpenStreetMap y Google Maps) ----
  const TS = 256;
  const project = (lat, lng, z) => {
    const S = TS * Math.pow(2, z), s = Math.max(-0.9999, Math.min(0.9999, Math.sin(lat * Math.PI / 180)));
    return { x: (lng + 180) / 360 * S, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * S };
  };
  const unproject = (x, y, z) => {
    const S = TS * Math.pow(2, z), n = Math.PI - 2 * Math.PI * y / S;
    return { lat: 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))), lng: x / S * 360 - 180 };
  };
  // mayor zoom en el que todos los puntos caben en un area de w x h pixeles
  function fitZoom(points, w, h, minZ, maxZ) {
    for (let z = maxZ; z >= minZ; z--) {
      const p = points.map(q => project(q.lat, q.lng, z));
      const dx = Math.max(...p.map(a => a.x)) - Math.min(...p.map(a => a.x)), dy = Math.max(...p.map(a => a.y)) - Math.min(...p.map(a => a.y));
      if (dx <= w && dy <= h) return z;
    }
    return minZ;
  }

  const API = { parseMapsLink, isShortLink, verEnMaps, comoLlegar, abrirMapsParaElegir, valid, round6, project, unproject, fitZoom, TS };
  if (typeof module !== 'undefined') module.exports = API; else root.Geo = API;
})(this);
