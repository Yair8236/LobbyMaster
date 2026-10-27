// LobbyMaster Beta 4 · selector de ubicacion: se busca el lugar, se toca el mapa o se pega el enlace de Google Maps.
// Nadie necesita conocer coordenadas. Autor: Yair Anibal Mamani Ticona
(function (root) {
  const { h, icon, toast } = root.UI, Geo = root.Geo;
  const LAPAZ = { lat: -16.5, lng: -68.15 };

  // Selector para el formulario de sede. Devuelve un "campo" compatible con showErrors (name, input, error).
  function picker(o) {
    o = o || {};
    let cur = o.lat != null && o.lng != null ? { latitud: Number(o.lat), longitud: Number(o.lng), enlace_maps: o.enlace_maps || null } : null, pin = null;
    const q = h('input', { class: 'input', type: 'search', placeholder: 'Busca el lugar: calle, zona o nombre (ej. Plaza Abaroa)', 'aria-label': 'Buscar el lugar de la sede', autocomplete: 'off' });
    const results = h('ul', { class: 'pk-results', hidden: true });
    const box = h('div', { class: 'pk-map' });
    const paste = h('input', { class: 'input', placeholder: 'Pega aquí el enlace de Google Maps o las coordenadas', 'aria-label': 'Enlace de Google Maps o coordenadas', autocomplete: 'off' });
    const status = h('div', { class: 'pk-status' }), msg = h('div', { class: 'msg', role: 'alert' }), hint = h('div', { class: 'pk-hint' });
    const wrap = h('div', { class: 'field pk' });
    let map = null;

    const say = (t, bad) => { hint.textContent = t || ''; hint.classList.toggle('bad', !!bad); };
    function show() {
      status.textContent = '';
      if (cur) {
        status.append(icon('pin'), h('b', null, 'Lugar elegido'), h('span', { class: 'mono dim' }, ' ' + cur.latitud + ', ' + cur.longitud + ' · '), h('a', { href: Geo.verEnMaps(cur.latitud, cur.longitud), target: '_blank', rel: 'noopener' }, 'Ver en Google Maps'));
        status.classList.add('ok');
      } else { status.append(icon('info'), 'Todavía no elegiste el lugar: toca el mapa para poner el pin.'); status.classList.remove('ok'); }
    }
    function put(lat, lng, opts) {
      opts = opts || {};
      cur = { latitud: Geo.round6(lat), longitud: Geo.round6(lng), enlace_maps: opts.link || null };
      api.error('');
      if (map) {
        if (!pin) pin = map.addMarker({ lat: cur.latitud, lng: cur.longitud, title: 'Sede', active: true }); else pin.set(cur.latitud, cur.longitud);
        if (opts.center) map.setView(cur.latitud, cur.longitud, opts.zoom || 16);
      }
      show(); if (o.onChange) o.onChange(cur);
    }
    function usePasted() {
      const t = paste.value.trim(); if (!t) return;
      const p = Geo.parseMapsLink(t);
      if (p) { put(p.latitud, p.longitud, { center: true, link: /^https?:\/\//i.test(t) ? t : null }); say('Listo: se tomó la ubicación del enlace.'); paste.value = ''; }
      else if (Geo.isShortLink(t)) say('Ese enlace corto no trae las coordenadas. Ábrelo en el navegador y copia la dirección larga de la barra, o haz clic derecho sobre el lugar en Google Maps y copia los números que aparecen arriba.', true);
      else say('No pude leer una ubicación ahí. Pega el enlace largo de Google Maps o las coordenadas, por ejemplo -16.5112, -68.1262.', true);
    }
    async function buscar() {
      const t = q.value.trim(); if (t.length < 3) { say('Escribe al menos 3 letras del lugar.', true); return; }
      results.hidden = true; say('Buscando…');
      try {
        const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 9000);
        const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=bo&accept-language=es&q=' + encodeURIComponent(t), { signal: ctl.signal }); clearTimeout(tm);
        const list = await r.json();
        if (!list.length) { say('No encontré ese lugar. Prueba con otra palabra o toca el mapa directamente.', true); return; }
        say('Elige el resultado correcto:'); results.textContent = '';
        list.forEach(x => results.appendChild(h('li', null, h('button', { type: 'button', onclick: () => { put(Number(x.lat), Number(x.lon), { center: true }); results.hidden = true; say('Pin colocado. Puedes tocar el mapa para ajustarlo.'); } }, icon('pin'), x.display_name.split(',').slice(0, 3).join(',')))));
        results.hidden = false;
      } catch (e) { say('No se pudo buscar (¿sin internet?). Toca el mapa o pega el enlace de Google Maps.', true); }
    }
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } });
    paste.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); usePasted(); } });
    paste.addEventListener('paste', () => setTimeout(usePasted, 30));

    const locate = h('button', { class: 'btn sm', type: 'button', onclick: () => {
      if (!navigator.geolocation) { say('Tu navegador no permite obtener la ubicación.', true); return; }
      say('Obteniendo tu ubicación…'); navigator.geolocation.getCurrentPosition(p => { put(p.coords.latitude, p.coords.longitude, { center: true }); say('Se usó tu ubicación actual.'); }, () => say('No se pudo obtener tu ubicación (permiso denegado).', true), { timeout: 9000 });
    } }, icon('user'), 'Usar mi ubicación');
    const gmaps = h('a', { class: 'btn sm', href: Geo.abrirMapsParaElegir(''), target: '_blank', rel: 'noopener', onclick: () => { gmaps.href = Geo.abrirMapsParaElegir(q.value.trim()); } }, icon('map'), 'Abrir Google Maps');
    wrap.append(h('label', null, 'Ubicación de la sede'),
      h('div', { class: 'row pk-search' }, q, h('button', { class: 'btn sm pri', type: 'button', onclick: buscar }, icon('search'), 'Buscar')),
      results, hint, box,
      h('div', { class: 'row wrap pk-tools' }, locate, gmaps, h('span', { class: 'dim', style: { fontSize: '12px' } }, 'En Google Maps haz clic derecho sobre el lugar, copia los números y pégalos abajo.')),
      h('div', { class: 'row pk-search' }, paste, h('button', { class: 'btn sm', type: 'button', onclick: usePasted }, 'Usar')),
      status, msg);
    show();
    // el mapa se crea cuando el contenedor ya esta en pantalla (dentro del modal)
    const start = () => {
      if (map || !root.SlippyMap) return; map = new root.SlippyMap(box, { lat: cur ? cur.latitud : LAPAZ.lat, lng: cur ? cur.longitud : LAPAZ.lng, zoom: cur ? 16 : 13, onClick: (la, ln) => put(la, ln), label: 'Mapa para elegir la sede. Toca un lugar para poner el pin.' });
      if (cur) pin = map.addMarker({ lat: cur.latitud, lng: cur.longitud, title: 'Sede', active: true });
    };
    setTimeout(start, 40);
    const api = {
      el: wrap, name: o.name || 'ubicacion', input: q,
      get: () => cur, set: (la, ln) => put(la, ln, { center: true }),
      error(m) { wrap.classList.toggle('err', !!m); msg.textContent = m || ''; }
    };
    return api;
  }

  // Mapa de solo lectura con una o varias sedes (usado en la ficha del torneo y en "Sedes y mapa").
  function viewer(sedes, o) {
    o = o || {};
    const box = h('div', { class: 'pk-map ' + (o.tall ? 'tall' : '') });
    const mk = {};
    setTimeout(() => {
      if (!root.SlippyMap || !sedes.length) return;
      const m = new root.SlippyMap(box, { lat: sedes[0].latitud, lng: sedes[0].longitud, zoom: 14, label: o.label || 'Mapa de sedes' });
      sedes.forEach(s => { mk[s.id_sede] = m.addMarker({ lat: s.latitud, lng: s.longitud, title: s.nombre, active: o.selected === s.id_sede, label: o.labels ? s.nombre : '', onClick: () => o.onPick && o.onPick(s.id_sede) }); });
      m.fit(sedes.map(s => ({ lat: s.latitud, lng: s.longitud })));
      if (o.selected && mk[o.selected]) m.setView(mk[o.selected].lat, mk[o.selected].lng, Math.max(m.z, 14));
    }, 40);
    return box;
  }

  // Botones estandar de una sede: ver y como llegar
  const botones = s => h('div', { class: 'row wrap' },
    h('a', { class: 'btn sm', href: s.enlace_maps || Geo.verEnMaps(s.latitud, s.longitud), target: '_blank', rel: 'noopener' }, icon('map'), 'Ver en Google Maps'),
    h('a', { class: 'btn sm pri', href: Geo.comoLlegar(s.latitud, s.longitud), target: '_blank', rel: 'noopener' }, icon('pin'), 'Cómo llegar'));

  root.Mapa = { picker, viewer, botones };
})(this);
