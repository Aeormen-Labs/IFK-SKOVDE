/* IFK Skövde Fantasy – poängregler. Rena funktioner, används av både spelsida och admin. */
(function () {
  const RULES = [
    { key: "min60", label: "Spelade 60+ min", pts: { GK: 2, DEF: 2, MID: 2, FWD: 2 } },
    { key: "min1",  label: "Spelade 1–59 min", pts: { GK: 1, DEF: 1, MID: 1, FWD: 1 } },
    { key: "g",     label: "Mål",             pts: { GK: 6, DEF: 6, MID: 5, FWD: 4 } },
    { key: "a",     label: "Assist",          pts: { GK: 3, DEF: 3, MID: 3, FWD: 3 } },
    { key: "cs",    label: "Hållen nolla (60+ min)", pts: { GK: 4, DEF: 4, MID: 1, FWD: 0 } },
    { key: "sv3",   label: "Per 3 räddningar", pts: { GK: 1, DEF: 0, MID: 0, FWD: 0 } },
    { key: "ps",    label: "Räddad straff",   pts: { GK: 5, DEF: 5, MID: 5, FWD: 5 } },
    { key: "pm",    label: "Missad straff",   pts: { GK: -2, DEF: -2, MID: -2, FWD: -2 } },
    { key: "ga2",   label: "Per 2 insläppta", pts: { GK: -1, DEF: -1, MID: 0, FWD: 0 } },
    { key: "yc",    label: "Gult kort",       pts: { GK: -1, DEF: -1, MID: -1, FWD: -1 } },
    { key: "rc",    label: "Rött kort",       pts: { GK: -3, DEF: -3, MID: -3, FWD: -3 } },
    { key: "og",    label: "Självmål",        pts: { GK: -2, DEF: -2, MID: -2, FWD: -2 } },
    { key: "motm",  label: "Matchens lirare (fansens röst)", pts: { GK: 3, DEF: 3, MID: 3, FWD: 3 } },
    { key: "win",   label: "IFK vann (spelade)", pts: { GK: 1, DEF: 1, MID: 1, FWD: 1 } }
  ];
  const EMPTY = { min: 0, g: 0, a: 0, sv: 0, ps: 0, pm: 0, yc: 0, rc: 0, og: 0, motm: 0 };

  /* Poäng för en spelare i en match. stats = {min,g,a,sv,ps,pm,yc,rc,og,motm}; result = {us,them} */
  function playerPoints(pos, stats, result) {
    const s = { ...EMPTY, ...(stats || {}) };
    const r = (key) => RULES.find((x) => x.key === key).pts[pos];
    const rows = [];
    if (s.min <= 0) return { total: 0, rows: [{ label: "Spelade inte", pts: 0 }] };
    if (s.min >= 60) rows.push({ label: "Spelade 60+ min", pts: r("min60") }); else rows.push({ label: "Spelade 1–59 min", pts: r("min1") });
    if (s.g) rows.push({ label: `Mål ×${s.g}`, pts: r("g") * s.g });
    if (s.a) rows.push({ label: `Assist ×${s.a}`, pts: r("a") * s.a });
    if (result && s.min >= 60 && result.them === 0 && r("cs")) rows.push({ label: "Hållen nolla", pts: r("cs") });
    if (pos === "GK" && s.sv >= 3) rows.push({ label: `Räddningar ×${s.sv}`, pts: Math.floor(s.sv / 3) * r("sv3") });
    if (s.ps) rows.push({ label: "Räddad straff", pts: r("ps") * s.ps });
    if (s.pm) rows.push({ label: "Missad straff", pts: r("pm") * s.pm });
    if (result && result.them >= 2 && r("ga2")) rows.push({ label: `Insläppta ×${result.them}`, pts: Math.floor(result.them / 2) * r("ga2") });
    if (s.yc) rows.push({ label: "Gult kort", pts: r("yc") * s.yc });
    if (s.rc) rows.push({ label: "Rött kort", pts: r("rc") });
    if (s.og) rows.push({ label: "Självmål", pts: r("og") * s.og });
    if (s.motm) rows.push({ label: "Matchens lirare", pts: r("motm") });
    if (result && result.us > result.them) rows.push({ label: "IFK vann", pts: r("win") });
    return { total: rows.reduce((n, x) => n + x.pts, 0), rows };
  }

  /* Poäng för en hel elva. lineup = {players:[id], captain, vice, chip}; statsDoc = {players:{id:stats}, result} */
  function lineupPoints(lineup, statsDoc, squad) {
    const byId = Object.fromEntries(squad.map((p) => [p.id, p]));
    const st = (statsDoc && statsDoc.players) || {};
    const result = statsDoc && statsDoc.result;
    const capPlayed = ((st[lineup.captain] || {}).min || 0) > 0;
    const effCaptain = capPlayed ? lineup.captain : lineup.vice;
    const mult = lineup.chip === "tc" ? 3 : 2;
    let total = 0; const rows = [];
    for (const id of lineup.players || []) {
      const p = byId[id]; if (!p) continue;
      const pp = playerPoints(p.pos, st[id], result);
      let pts = pp.total; let note = "";
      if (id === effCaptain) { pts *= mult; note = mult === 3 ? "Trippelkapten" : "Kapten ×2"; }
      if (lineup.chip === "goals" && (st[id] || {}).g) { pts += 2 * st[id].g; note += (note ? ", " : "") + "Målfest +" + 2 * st[id].g; }
      total += pts; rows.push({ id, name: p.name, pos: p.pos, pts, base: pp.total, note, detail: pp.rows });
    }
    return { total, rows, effCaptain };
  }

  /* Tips: exakt resultat 3 p, rätt utfall 1 p. */
  function tipPoints(tip, result) {
    if (!tip || !result) return 0;
    if (tip.us === result.us && tip.them === result.them) return 3;
    const sg = Math.sign(tip.us - tip.them), rg = Math.sign(result.us - result.them);
    return sg === rg ? 1 : 0;
  }

  /* Validera uppställning mot IFK.fantasy */
  function validate(players, squad, cfg) {
    const byId = Object.fromEntries(squad.map((p) => [p.id, p]));
    const count = { GK: 0, DEF: 0, MID: 0, FWD: 0 }; let cost = 0;
    for (const id of players) { const p = byId[id]; if (!p) continue; count[p.pos]++; cost += p.price; }
    const errors = [];
    if (players.length !== 11) errors.push(`Välj 11 spelare (${players.length} valda).`);
    for (const pos of Object.keys(cfg.formation)) { const [lo, hi] = cfg.formation[pos]; if (count[pos] < lo || count[pos] > hi) errors.push(`${posName(pos)}: ${count[pos]} valda, tillåtet ${lo}–${hi}.`); }
    if (cost > cfg.budget + 1e-9) errors.push(`Budgeten är överskriden med ${(cost - cfg.budget).toFixed(1)} M.`);
    return { ok: errors.length === 0, errors, count, cost: Math.round(cost * 10) / 10 };
  }
  const posName = (p) => ({ GK: "Målvakt", DEF: "Försvar", MID: "Mittfält", FWD: "Anfall" }[p] || p);

  window.IFKScoring = { RULES, playerPoints, lineupPoints, tipPoints, validate, posName };
})();
