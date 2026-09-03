/* IFK Skövde FK – admin: matchstatistik, publicering av fantasypoäng */
(function () {
  document.addEventListener("ifk:ready", async () => {
    const root = document.getElementById("admin"); if (!root) return;
    const D = window.IFK, B = window.IFKBackend, S = window.IFKScoring;
    const { esc, toast } = window.IFKUtil;
    const { fixtures } = window.IFKFixtures;
    const fxId = B.fixtureId;
    const FIELDS = [["min", "Min"], ["g", "Mål"], ["a", "Ass"], ["sv", "Rädd"], ["ps", "Str.rädd"], ["pm", "Str.miss"], ["yc", "Gult"], ["rc", "Rött"], ["og", "Självmål"]];
    await B.ready;

    B.onAuth(async (user) => {
      if (!user) { root.innerHTML = `<div class="card"><h3>Admin</h3><p>Logga in via <a href="fantasy.html">Fantasy-sidan</a> med ett adminkonto.</p></div>`; return; }
      if (!B.isAdmin()) { root.innerHTML = `<div class="card"><h3>Ingen behörighet</h3><p>${esc(user.email)} finns inte i adminlistan (<code>IFK.admins</code> i data.js).</p></div>`; return; }
      renderPicker();
    });

    async function renderPicker() {
      const stats = Object.fromEntries((await B.list("stats")).map((s) => [s.id, s]));
      const played = fixtures.filter((f) => f.d < new Date());
      root.innerHTML = `<div class="card"><h3>Välj match</h3><div class="fixture-list">${played.map((f) => { const st = stats[fxId(f)]; return `<button type="button" class="fixture" data-fx="${fxId(f)}" style="text-align:left;cursor:pointer;font:inherit"><div class="fixture__date">${window.IFKUtil.fmtDay(f.d)}<small>${f.d.getFullYear()}</small></div><div><div class="fixture__teams">${f.home ? `<span class="ifk">${esc(D.club.shortName)}</span> – ${esc(f.opponent)}` : `${esc(f.opponent)} – <span class="ifk">${esc(D.club.shortName)}</span>`}</div><div class="fixture__meta">${st ? (st.published ? "Publicerad" : "Sparad, ej publicerad") : "Ingen statistik"}</div></div><div class="fixture__score ${st && st.published ? "fixture__score--W" : "fixture__score--upcoming"}">${st && st.result ? `${st.result.us}–${st.result.them}` : "Öppna"}</div></button>`; }).reverse().join("") || `<p class="empty">Inga spelade matcher än.</p>`}</div></div>
      <div class="card" style="margin-top:14px"><h3>Nyheter, matcher och tabell</h3><p style="margin:0;color:var(--muted);font-size:.92rem">Redigeras i <code>assets/js/data.js</code>. Resultatet du sparar här styr fantasypoängen; glöm inte att även lägga in <code>score</code> i data.js så att spelschemat visar rätt.</p></div>`;
      root.querySelectorAll("[data-fx]").forEach((b) => b.addEventListener("click", () => renderMatch(fixtures.find((f) => fxId(f) === b.dataset.fx), stats[b.dataset.fx])));
    }

    async function renderMatch(f, st) {
      const id = fxId(f);
      st = st || { fixtureId: id, result: f.score ? { us: f.score[0], them: f.score[1] } : { us: 0, them: 0 }, players: {}, published: false };
      const votes = await B.list("motm", { where: ["fixtureId", "==", id] });
      const tally = {}; votes.forEach((v) => { tally[v.pid] = (tally[v.pid] || 0) + 1; });
      const leader = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      root.innerHTML = `
        <button class="btn btn--ghost btn--sm" type="button" id="ad-back">← Alla matcher</button>
        <div class="card" style="margin-top:12px">
          <div class="section-head"><div><span class="eyebrow">${window.IFKUtil.fmtLong(f.d)}</span><h3 style="margin:0">${f.home ? `${esc(D.club.shortName)} – ${esc(f.opponent)}` : `${esc(f.opponent)} – ${esc(D.club.shortName)}`}</h3></div>
            <div class="tip-row"><label><span>IFK mål</span><input type="number" min="0" id="ad-us" value="${st.result.us}"></label><span class="tip-dash">–</span><label><span>${esc(f.opponent)}</span><input type="number" min="0" id="ad-them" value="${st.result.them}"></label></div></div>
          <p style="font-size:.88rem;color:var(--muted)">Fyll i minuter för alla som spelade. Matchens lirare: ${leader ? `fansens val är <b>${esc((D.squad.find((p) => p.id === leader[0]) || {}).name)}</b> (${leader[1]} röster)` : "inga röster ännu"}. Du kan ändra i kolumnen MOTM.</p>
          <div class="table-wrap"><table class="ad-table"><thead><tr><th>#</th><th>Spelare</th>${FIELDS.map(([k, l]) => `<th class="num">${l}</th>`).join("")}<th>MOTM</th><th class="num">P</th></tr></thead><tbody>
            ${D.squad.map((p) => { const s = st.players[p.id] || {}; const motm = s.motm || (!Object.keys(st.players).length && leader && leader[0] === p.id ? 1 : 0); return `<tr data-pid="${p.id}"><td>${p.number}</td><td>${esc(p.name)} <small style="color:var(--muted)">${p.pos}</small></td>${FIELDS.map(([k]) => `<td class="num"><input type="number" min="0" max="${k === "min" ? 120 : 9}" data-f="${k}" value="${s[k] || 0}" class="ad-in"></td>`).join("")}<td><input type="radio" name="motm" value="${p.id}" ${motm ? "checked" : ""}></td><td class="num ad-pts">0</td></tr>`; }).join("")}
          </tbody></table></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;align-items:center">
            <button class="btn btn--dark" type="button" id="ad-save">Spara utkast</button>
            <button class="btn btn--primary" type="button" id="ad-publish">${st.published ? "Publicera om (räkna om poäng)" : "Publicera omgången"}</button>
            <span id="ad-status" style="font-size:.88rem;color:var(--muted)">${st.published ? "Publicerad. Ändringar kräver ny publicering." : ""}</span>
          </div>
        </div>`;
      root.querySelector("#ad-back").addEventListener("click", renderPicker);
      const collect = () => {
        const result = { us: +root.querySelector("#ad-us").value || 0, them: +root.querySelector("#ad-them").value || 0 };
        const players = {}; const motm = (root.querySelector("input[name=motm]:checked") || {}).value;
        root.querySelectorAll("tr[data-pid]").forEach((tr) => { const o = {}; tr.querySelectorAll("[data-f]").forEach((i) => (o[i.dataset.f] = +i.value || 0)); if (tr.dataset.pid === motm) o.motm = 1; if (Object.values(o).some((v) => v)) players[tr.dataset.pid] = o; });
        return { fixtureId: id, result, players, home: f.home, opponent: f.opponent, date: f.date };
      };
      const preview = () => { const doc = collect(); root.querySelectorAll("tr[data-pid]").forEach((tr) => { const p = D.squad.find((x) => x.id === tr.dataset.pid); tr.querySelector(".ad-pts").textContent = S.playerPoints(p.pos, doc.players[p.id], doc.result).total; }); };
      root.addEventListener("input", preview); root.addEventListener("change", preview); preview();
      root.querySelector("#ad-save").addEventListener("click", async () => { await B.setDoc(`stats/${id}`, { ...collect(), published: st.published || false, updatedAt: Date.now() }); toast("Utkast sparat"); });
      root.querySelector("#ad-publish").addEventListener("click", async () => {
        if (!confirm("Publicera omgången och räkna poäng för alla lag?")) return;
        const doc = { ...collect(), published: true, publishedAt: Date.now() };
        await B.setDoc(`stats/${id}`, doc);
        const status = root.querySelector("#ad-status"); status.textContent = "Räknar poäng…";
        const n = await publish(f, doc); status.textContent = `Publicerad. ${n} lag har fått poäng.`; toast("Omgången publicerad");
      });
    }

    /* Räkna poäng för alla användare för match f */
    async function publish(f, doc) {
      const id = fxId(f);
      const users = await B.list("users");
      const entries = Object.fromEntries((await B.list("entries")).filter((e) => e.id.startsWith(id + "_")).map((e) => [e.id.slice(id.length + 1), e]));
      const lineups = Object.fromEntries((await B.list("lineups")).map((l) => [l.id, l]));
      const preds = Object.fromEntries((await B.list("predictions", { where: ["fixtureId", "==", id] })).map((p) => [p.uid, p]));
      let n = 0;
      for (const u of users) {
        // Laget som gällde: sparat för just denna match, annars senast sparade lag (innan avspark)
        let lu = entries[u.id] || null;
        if (!lu && lineups[u.id] && lineups[u.id].savedAt < f.d.getTime()) lu = lineups[u.id];
        const tip = preds[u.id] ? S.tipPoints(preds[u.id], doc.result) : null;
        if (!lu && tip === null) continue;
        let points = 0, rows = [];
        if (lu) {
          const chipApplies = lu.chip && (lu.chipFixture === id || !lu.chipFixture);
          const r = S.lineupPoints({ ...lu, chip: chipApplies ? lu.chip : null }, doc, D.squad);
          points = r.total; rows = r.rows;
          if (chipApplies && lineups[u.id]) { await B.setDoc(`lineups/${u.id}`, { usedChips: [...new Set([...(lineups[u.id].usedChips || []), lu.chip])], chip: null, chipFixture: null }, true); }
        }
        await B.setDoc(`scores/${id}_${u.id}`, { uid: u.id, fixtureId: id, points, rows, tip: tip ?? 0 });
        const st = (await B.getDoc(`standings/${u.id}`)) || {};
        await B.setDoc(`standings/${u.id}`, { uid: u.id, name: u.name || st.name || "", teamName: u.teamName || st.teamName || "", gw: { ...(st.gw || {}), [id]: points }, tips: { ...(st.tips || {}), [id]: tip ?? 0 } }, true);
        n++;
      }
      // Rank
      const all = (await B.list("standings")).map((r) => ({ id: r.id, g: Object.values(r.gw || {}).reduce((a, b) => a + b, 0) + Object.values(r.tips || {}).reduce((a, b) => a + b, 0) })).sort((a, b) => b.g - a.g);
      for (let i = 0; i < all.length; i++) await B.setDoc(`standings/${all[i].id}`, { rank: i + 1 }, true);
      return n;
    }
  });
})();
