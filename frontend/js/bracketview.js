// LobbyMaster Beta 3 · dibujo del bracket de eliminacion directa. Autor: Yair Anibal Mamani Ticona
(function (root) {
  const { h, svgEl, icon, teamBadge } = root.UI;
  const CW = 236, CH = 68, GAP = 72, SLOT = 92, HEAD = 40, CHAMP_W = 214, CHAMP_H = 158;

  function slot(team, score, win, lose, bye) {
    const cls = 'slot' + (win ? ' win' : '') + (lose ? ' lose' : '') + (!team ? (bye ? ' bye' : ' empty-s') : '');
    return h('div', { class: cls, style: { height: CH / 2 + 'px' } },
      team ? teamBadge(team.nombre, 'sm') : h('span', { style: { width: '22px' } }),
      h('span', { class: 'nm' }, team ? team.nombre : bye ? 'BYE' : 'Por definir'),
      h('span', { class: 'sc' }, score === null || score === undefined ? '' : score));
  }

  // bk: resultado de store.getBracket(); opts.onPick(match) se llama al pulsar un cruce jugable (solo organizador/admin)
  function render(bk, opts) {
    opts = opts || {};
    const n0 = bk.rounds[0].length, total = bk.total;
    const width = total * (CW + GAP) + CHAMP_W, height = HEAD + n0 * SLOT + 8;
    const canvas = h('div', { class: 'bk-canvas', style: { width: width + 'px', height: height + 'px' } });
    const links = svgEl('svg', { class: 'links', width, height, viewBox: '0 0 ' + width + ' ' + height });
    const pathsOff = svgEl('g', { fill: 'none', stroke: 'var(--line2)', 'stroke-width': 1.5 }), pathsOn = svgEl('g', { fill: 'none', stroke: 'var(--ac)', 'stroke-width': 2 });
    links.appendChild(pathsOff); links.appendChild(pathsOn); canvas.appendChild(links);
    const cy = (r, i) => HEAD + SLOT * Math.pow(2, r) * (i + 0.5);

    bk.rounds.forEach((rd, r) => {
      const x = r * (CW + GAP);
      canvas.appendChild(h('div', { class: 'bk-rname', style: { left: x + 'px', width: CW + 'px' } }, bk.nombres[r]));
      rd.forEach((m, i) => {
        const y = cy(r, i) - CH / 2, aWin = m.w && m.a && m.w.id_equipo === m.a.id_equipo, bWin = m.w && m.b && m.w.id_equipo === m.b.id_equipo;
        const clickable = !!(opts.onPick && m.jugable);
        const isFinal = r === total - 1;
        const card = h('div', {
          class: 'mt-card' + (clickable ? ' click' : '') + (m.jugable && !m.jugado ? ' ready' : '') + (isFinal ? ' final' : ''),
          style: { left: x + 'px', top: y + 'px', width: CW + 'px', height: CH + 'px' },
          role: clickable ? 'button' : null, tabindex: clickable ? '0' : null,
          'aria-label': 'Cruce ' + m.ronda + '.' + m.posicion + ': ' + (m.a ? m.a.nombre : 'por definir') + ' contra ' + (m.b ? m.b.nombre : 'por definir'),
          title: clickable ? (m.jugado ? 'Corregir resultado' : 'Registrar resultado') : null,
          onclick: clickable ? () => opts.onPick(m) : null,
          onkeydown: clickable ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onPick(m); } } : null
        }, slot(m.a, m.sa, aWin, m.w && !aWin && m.a, false), slot(m.b, m.sb, bWin, m.w && !bWin && m.b, m.bye && !m.b));
        canvas.appendChild(card);
        canvas.appendChild(h('div', { style: { position: 'absolute', left: x + 'px', top: y - 15 + 'px', font: '600 9.5px var(--mono)', color: 'var(--tx3)', letterSpacing: '.05em' } }, (m.bye ? 'BYE · ' : '') + 'M' + m.ronda + '.' + m.posicion + (m.jugable && !m.jugado ? ' · PENDIENTE' : '')));
        // conector hacia el siguiente cruce
        const nx = r + 1 < total ? cy(r + 1, i >> 1) : cy(r, 0), x1 = x + CW, x2 = x1 + GAP, mid = x1 + GAP / 2;
        const d = r + 1 < total ? 'M' + x1 + ' ' + cy(r, i) + 'H' + mid + 'V' + nx + 'H' + x2 : 'M' + x1 + ' ' + cy(r, i) + 'H' + x2;
        (m.w ? pathsOn : pathsOff).appendChild(svgEl('path', { d }));
      });
    });

    // campeon
    const fx = total * (CW + GAP), fy = cy(total - 1, 0) - CHAMP_H / 2, c = bk.campeon;
    const trophy = svgEl('svg', { viewBox: '0 0 24 24', class: 'cup', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    trophy.innerHTML = '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>';
    canvas.appendChild(h('div', { class: 'bk-rname', style: { left: fx + 'px', width: CHAMP_W + 'px' } }, 'Campeón'));
    canvas.appendChild(h('div', { class: 'champ', style: { left: fx + 'px', top: fy + 'px', width: CHAMP_W + 'px', height: CHAMP_H + 'px', opacity: c ? 1 : .55, borderStyle: c ? 'solid' : 'dashed' } },
      trophy, h('small', null, c ? 'Campeón del torneo' : 'Por definir'), c ? teamBadge(c.nombre, 'lg') : h('span', { class: 'badge-team lg', style: { background: 'var(--s3)', color: 'var(--tx3)' } }, '?'), h('b', null, c ? c.nombre : 'Esperando la final')));

    // zoom
    const wrap = h('div', { style: { width: width + 'px', height: height + 'px' } }, canvas);
    const view = h('div', { class: 'bk-view' }, wrap);
    let scale = 1;
    const apply = s => { scale = Math.max(.45, Math.min(1.3, s)); canvas.style.transform = 'scale(' + scale + ')'; wrap.style.width = width * scale + 'px'; wrap.style.height = height * scale + 'px'; label.textContent = Math.round(scale * 100) + '%'; };
    const label = h('span', { class: 'mono muted', style: { minWidth: '40px', textAlign: 'center' } }, '100%');
    const fit = () => apply(Math.min(1, (view.clientWidth - 48) / width));
    const tools = h('div', { class: 'bk-tools' },
      h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Alejar', onclick: () => apply(scale - .1) }, icon('minus')), label,
      h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Acercar', onclick: () => apply(scale + .1) }, icon('plus')),
      h('button', { class: 'btn sm', type: 'button', onclick: fit }, 'Ajustar al ancho'), h('button', { class: 'btn sm', type: 'button', onclick: () => apply(1) }, '100%'),
      h('button', { class: 'btn sm sp', type: 'button', onclick: () => window.print() }, icon('print'), 'Imprimir'));
    const el = h('div', null, tools, view);
    setTimeout(() => { if (view.clientWidth && view.clientWidth - 48 < width) fit(); }, 0);
    return el;
  }
  root.BracketView = { render };
})(this);
