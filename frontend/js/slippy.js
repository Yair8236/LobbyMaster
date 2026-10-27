// LobbyMaster Beta 4 · mapa interactivo propio (sin librerias): arrastrar, zoom, marcadores y clic para elegir un lugar.
// Usa mosaicos de OpenStreetMap (© colaboradores de OpenStreetMap). Autor: Yair Anibal Mamani Ticona
(function (root) {
  const Geo = root.Geo, TS = Geo.TS, MINZ = 3, MAXZ = 18;
  const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const NS = 'http://www.w3.org/2000/svg';

  function pinSvg() {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 30 38'); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M15 37S2 24.5 2 14.5a13 13 0 0 1 26 0C28 24.5 15 37 15 37z');
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', '15'); c.setAttribute('cy', '14.5'); c.setAttribute('r', '5'); c.setAttribute('fill', '#fff');
    s.append(p, c); return s;
  }

  class SlippyMap {
    constructor(el, o) {
      o = o || {}; this.el = el; this.c = { lat: o.lat != null ? o.lat : -16.5, lng: o.lng != null ? o.lng : -68.15 }; this.z = o.zoom || 13;
      this.onClick = o.onClick || null; this.markers = []; this.tiles = new Map(); this.w = 600; this.h = 360;
      el.classList.add('slippy'); el.tabIndex = 0; el.setAttribute('role', 'application'); el.setAttribute('aria-label', o.label || 'Mapa interactivo. Arrastra para mover, usa + y - para acercar.');
      this.tl = document.createElement('div'); this.tl.className = 'sl-tiles'; this.ml = document.createElement('div'); this.ml.className = 'sl-markers';
      const ctl = document.createElement('div'); ctl.className = 'sl-ctl';
      const mk = (t, l, f) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('aria-label', l); b.title = l; b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('click', e => { e.stopPropagation(); f(); }); return b; };
      ctl.append(mk('+', 'Acercar', () => this.zoomBy(1)), mk('−', 'Alejar', () => this.zoomBy(-1)));
      const at = document.createElement('div'); at.className = 'sl-attr'; at.textContent = '© OpenStreetMap';
      el.append(this.tl, this.ml, ctl, at);
      this._bind(); this._measure();
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { this._measure(); this.render(); }).observe(el); else window.addEventListener('resize', () => { this._measure(); this.render(); });
      this.render();
    }
    _measure() { this.w = this.el.clientWidth || this.w; this.h = this.el.clientHeight || this.h; }
    _topLeft() { const p = Geo.project(this.c.lat, this.c.lng, this.z); return { x: p.x - this.w / 2, y: p.y - this.h / 2 }; }
    _at(cx, cy) { const r = this.el.getBoundingClientRect(), tl = this._topLeft(); return Geo.unproject(tl.x + cx - r.left, tl.y + cy - r.top, this.z); }
    _bind() {
      const el = this.el; let drag = null;
      el.addEventListener('pointerdown', e => { if (e.button > 0) return; drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }; try { el.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ } });
      el.addEventListener('pointermove', e => {
        if (!drag) return;
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 5) drag.moved = true;
        if (!drag.moved) return;
        const p = Geo.project(this.c.lat, this.c.lng, this.z); this.c = Geo.unproject(p.x - (e.clientX - drag.lx), p.y - (e.clientY - drag.ly), this.z);
        drag.lx = e.clientX; drag.ly = e.clientY; el.classList.add('moving'); this.render();
      });
      const end = e => { if (!drag) return; const d = drag; drag = null; el.classList.remove('moving'); if (!d.moved && e.type === 'pointerup' && this.onClick) { const g = this._at(e.clientX, e.clientY); this.onClick(Geo.round6(g.lat), Geo.round6(g.lng)); } };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      let wheelAt = 0;
      el.addEventListener('wheel', e => { e.preventDefault(); const now = Date.now(); if (now - wheelAt < 220) return; wheelAt = now; this.zoomBy(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY); }, { passive: false });
      el.addEventListener('dblclick', e => { e.preventDefault(); this.zoomBy(1, e.clientX, e.clientY); });
      el.addEventListener('keydown', e => {
        const k = e.key, step = 80, p = Geo.project(this.c.lat, this.c.lng, this.z);
        const mv = (dx, dy) => { e.preventDefault(); this.c = Geo.unproject(p.x + dx, p.y + dy, this.z); this.render(); };
        if (k === 'ArrowLeft') mv(-step, 0); else if (k === 'ArrowRight') mv(step, 0); else if (k === 'ArrowUp') mv(0, -step); else if (k === 'ArrowDown') mv(0, step);
        else if (k === '+' || k === '=') { e.preventDefault(); this.zoomBy(1); } else if (k === '-') { e.preventDefault(); this.zoomBy(-1); }
      });
    }
    zoomBy(d, cx, cy) {
      const nz = Math.max(MINZ, Math.min(MAXZ, this.z + d)); if (nz === this.z) return;
      if (cx != null) { // mantener fijo el punto bajo el cursor
        const g = this._at(cx, cy), r = this.el.getBoundingClientRect(), q = Geo.project(g.lat, g.lng, nz);
        this.c = Geo.unproject(q.x - (cx - r.left - this.w / 2), q.y - (cy - r.top - this.h / 2), nz);
      }
      this.z = nz; this.render();
    }
    setView(lat, lng, zoom) { this.c = { lat, lng }; if (zoom) this.z = Math.max(MINZ, Math.min(MAXZ, zoom)); this.render(); }
    fit(points) {
      this._measure();
      if (!points.length) return;
      if (points.length === 1) { this.setView(points[0].lat, points[0].lng, 15); return; }
      const z = Geo.fitZoom(points, Math.max(120, this.w - 220), Math.max(120, this.h - 120), MINZ, 17);
      const pr = points.map(p => Geo.project(p.lat, p.lng, z)), mx = (Math.max(...pr.map(a => a.x)) + Math.min(...pr.map(a => a.x))) / 2, my = (Math.max(...pr.map(a => a.y)) + Math.min(...pr.map(a => a.y))) / 2;
      const c = Geo.unproject(mx, my, z); this.setView(c.lat, c.lng, z);
    }
    addMarker(o) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sl-pin' + (o.active ? ' on' : ''); b.title = o.title || ''; b.setAttribute('aria-label', o.title || 'Ubicación');
      b.appendChild(pinSvg()); if (o.label) { const l = document.createElement('span'); l.textContent = o.label; b.appendChild(l); }
      b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('pointerup', e => e.stopPropagation());
      b.addEventListener('click', e => { e.stopPropagation(); if (o.onClick) o.onClick(); });
      const m = { lat: o.lat, lng: o.lng, el: b, set: (la, ln) => { m.lat = la; m.lng = ln; this.render(); }, active: v => { b.classList.toggle('on', !!v); }, remove: () => { b.remove(); this.markers = this.markers.filter(x => x !== m); } };
      this.markers.push(m); this.ml.appendChild(b); this.render(); return m;
    }
    clearMarkers() { this.markers.forEach(m => m.el.remove()); this.markers = []; }
    render() {
      const tl = this._topLeft(), z = this.z, n = Math.pow(2, z), need = new Set();
      const x0 = Math.floor(tl.x / TS), x1 = Math.floor((tl.x + this.w) / TS), y0 = Math.max(0, Math.floor(tl.y / TS)), y1 = Math.min(n - 1, Math.floor((tl.y + this.h) / TS));
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const wx = ((tx % n) + n) % n, key = z + '/' + wx + '/' + ty + '@' + tx; need.add(key);
        let im = this.tiles.get(key);
        if (!im) { im = document.createElement('img'); im.alt = ''; im.draggable = false; im.decoding = 'async'; im.referrerPolicy = 'strict-origin-when-cross-origin'; im.addEventListener('error', () => im.classList.add('off')); im.src = TILE.replace('{z}', z).replace('{x}', wx).replace('{y}', ty); this.tiles.set(key, im); this.tl.appendChild(im); }
        im.style.transform = 'translate(' + Math.round(tx * TS - tl.x) + 'px,' + Math.round(ty * TS - tl.y) + 'px)';
      }
      this.tiles.forEach((im, k) => { if (!need.has(k)) { im.remove(); this.tiles.delete(k); } });
      this.markers.forEach(m => { const p = Geo.project(m.lat, m.lng, z); m.el.style.transform = 'translate(' + Math.round(p.x - tl.x) + 'px,' + Math.round(p.y - tl.y) + 'px)'; });
    }
  }
  root.SlippyMap = SlippyMap;
})(this);
