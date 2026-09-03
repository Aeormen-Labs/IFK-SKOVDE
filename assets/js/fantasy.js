/* IFK Skövde Fantasy – spelsidan */
(function () {
  document.addEventListener("ifk:ready", async () => {
    const root = document.getElementById("fantasy"); if (!root) return;
    const D = window.IFK, B = window.IFKBackend, S = window.IFKScoring;
    const { esc, toast, store } = window.IFKUtil;
    const { fixtures } = window.IFKFixtures;
    const squad = D.squad, byId = Object.fromEntries(squad.map((p) => [p.id, p]));
    const cfg = D.fantasy;
    const fxId = B.fixtureId;
    const POS = ["GK", "DEF", "MID", "FWD"];
    const fmtDate = (f) => `${window.IFKUtil.fmtLong(f.d)} kl ${f.time}`;

    let user = null, profile = null, lineup = null, statsMap = {}, published = [], gw = null, tab = "lag";
    let pickPos = null; // öppen väljare

    await B.ready;
    root.innerHTML = `<div class="fantasy-shell" id="fx-shell"></div>`;
    const shell = document.getElementById("fx-shell");

    async function loadCommon() {
      const stats = await B.list("stats");
      statsMap = Object.fromEntries(stats.map((s) => [s.id, s]));
      published = fixtures.filter((f) => statsMap[fxId(f)] && statsMap[fxId(f)].published);
      const now = Date.now();
      gw = fixtures.find((f) => f.d.getTime() > now) || null;                       // nästa avspark
      const prev = [...fixtures].reverse().find((f) => f.d.getTime() <= now);       // senast startade
      live = !!prev && now - prev.d.getTime() < 2.5 * 3600e3 && !(statsMap[fxId(prev)] && statsMap[fxId(prev)].published);
    }
    let live = false;
    const gwOpen = () => !!gw && !live;
    const seasonPoints = (pid) => published.reduce((n, f) => n + S.playerPoints(byId[pid].pos, (statsMap[fxId(f)].players || {})[pid], statsMap[fxId(f)].result).total, 0);
    const lastPoints = (pid) => { const f = published[published.length - 1]; return f ? S.playerPoints(byId[pid].pos, (statsMap[fxId(f)].players || {})[pid], statsMap[fxId(f)].result).total : 0; };

    /* ---------- Auth ---------- */
    function renderAuth() {
      shell.innerHTML = `
        <div class="fx-auth">
          <div class="fx-auth__intro">
            <span class="eyebrow">IFK Skövde Fantasy · ${esc(cfg.seasonName)}</span>
            <h2>Sätt din egen blåsvarta elva</h2>
            <p>Välj 11 spelare ur Herr A-truppen för ${cfg.budget} IFK-miljoner, utse kapten och samla poäng varje match. Tävla mot hela Skövde, eller skapa en egen liga med kompisarna.</p>
            <ul class="fx-bullets">
              <li>Poäng för mål, assist, hållen nolla och matchens lirare</li>
              <li>Byt fritt mellan matcherna, laget låses vid avspark</li>
              <li>Två chips per säsong: Trippelkapten och Målfest</li>
              <li>Tippa resultatet och samla extra supporterpoäng</li>
              <li><b>${esc(cfg.prizes.round)}</b>${cfg.prizes.grand ? ` ${esc(cfg.prizes.grand)}` : " Säsongens totalsegrare får ett stort pris som presenteras senare."}</li>
            </ul>
          </div>
          <div class="card fx-auth__card">
            <div class="fx-tabs" role="tablist"><button class="chip" data-auth="in" aria-pressed="true" type="button">Logga in</button><button class="chip" data-auth="up" aria-pressed="false" type="button">Skapa konto</button></div>
            <form id="auth-form">
              <div class="field" id="f-name" hidden><label for="a-name">Ditt namn</label><input id="a-name" name="name" autocomplete="name"></div>
              <div class="field" id="f-team" hidden><label for="a-team">Lagnamn</label><input id="a-team" name="team" placeholder="T.ex. Södermalms Stjärnor" maxlength="28"></div>
              <div class="field"><label for="a-email">E-post</label><input id="a-email" name="email" type="email" required autocomplete="email"></div>
              <div class="field"><label for="a-pw">Lösenord</label><input id="a-pw" name="pw" type="password" required minlength="6" autocomplete="current-password"></div>
              <p class="notice notice--warn" id="auth-err" hidden></p>
              <button class="btn btn--primary btn--block" type="submit" id="auth-submit">Logga in</button>
              ${B.mode === "firebase" ? `<button class="btn btn--ghost btn--block" type="button" id="auth-google" style="margin-top:8px">Fortsätt med Google</button><button type="button" class="popup__later" id="auth-reset">Glömt lösenordet?</button>` : `<p class="notice" style="margin-top:12px">Demoläge: kontot sparas bara i den här webbläsaren. Koppla Firebase i <code>data.js</code> för riktiga konton.</p>`}
            </form>
          </div>
        </div>`;
      let mode = "in";
      shell.querySelectorAll("[data-auth]").forEach((b) => b.addEventListener("click", () => {
        mode = b.dataset.auth; shell.querySelectorAll("[data-auth]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        shell.querySelector("#f-name").hidden = shell.querySelector("#f-team").hidden = mode === "in";
        shell.querySelector("#a-name").required = shell.querySelector("#a-team").required = mode === "up";
        shell.querySelector("#auth-submit").textContent = mode === "in" ? "Logga in" : "Skapa konto";
      }));
      const err = (m) => { const e = shell.querySelector("#auth-err"); e.textContent = m; e.hidden = !m; };
      shell.querySelector("#auth-form").addEventListener("submit", async (e) => {
        e.preventDefault(); err(""); const f = Object.fromEntries(new FormData(e.target).entries());
        try {
          if (mode === "up") { await B.signUp(f.email, f.pw, f.name.trim()); await B.setDoc(`users/${B.user().uid}`, { teamName: f.team.trim() }, true); }
          else await B.signIn(f.email, f.pw);
        } catch (ex) { err(friendly(ex)); }
      });
      const g = shell.querySelector("#auth-google"); if (g) g.addEventListener("click", () => B.signInGoogle().catch((ex) => err(friendly(ex))));
      const r = shell.querySelector("#auth-reset"); if (r) r.addEventListener("click", async () => { const em = shell.querySelector("#a-email").value; if (!em) return err("Fyll i e-post först."); try { await B.resetPassword(em); toast("Återställningsmejl skickat"); } catch (ex) { err(friendly(ex)); } });
    }
    const friendly = (ex) => ({ "auth/email-already-in-use": "E-postadressen används redan.", "auth/invalid-credential": "Fel e-post eller lösenord.", "auth/wrong-password": "Fel lösenord.", "auth/user-not-found": "Inget konto med den e-posten.", "auth/weak-password": "Lösenordet måste vara minst 6 tecken." }[ex.code] || ex.message || "Något gick fel.");

    /* ---------- App ---------- */
    async function loadUser() {
      profile = (await B.getDoc(`users/${user.uid}`)) || { name: user.name };
      lineup = (await B.getDoc(`lineups/${user.uid}`)) || { players: [], captain: null, vice: null, chip: null, usedChips: [] };
      // Nollställ chip om det gällde en redan publicerad omgång
      if (lineup.chip && lineup.chipFixture && statsMap[lineup.chipFixture] && statsMap[lineup.chipFixture].published) { lineup.usedChips = [...new Set([...(lineup.usedChips || []), lineup.chip])]; lineup.chip = null; lineup.chipFixture = null; }
    }
    function renderApp() {
      const tabs = [["lag", "Mitt lag"], ["poang", "Poäng"], ["tabell", "Tabell"], ["ligor", "Ligor"], ["regler", "Regler"]];
      shell.innerHTML = `
        <div class="fx-top">
          <div><span class="eyebrow">IFK Skövde Fantasy · ${esc(cfg.seasonName)}</span><h2 style="margin:0">${esc(profile.teamName || "Mitt lag")}</h2><span class="team__meta">${esc(profile.name || user.name)} · <button class="linklike" id="fx-edit-profile" type="button">Ändra</button> · <button class="linklike" id="fx-logout" type="button">Logga ut</button>${B.isAdmin() ? ` · <a href="admin.html">Admin</a>` : ""}</span></div>
          <div id="fx-badges" class="fx-badges"></div>
        </div>
        ${B.mode === "local" ? `<p class="notice notice--warn" style="margin:0 0 14px">Demoläge: allt sparas bara i din webbläsare. Koppla Firebase för riktiga konton och gemensamma tabeller.</p>` : ""}
        <div class="fx-tabs" role="tablist">${tabs.map(([k, l]) => `<button class="chip" type="button" data-tab="${k}" aria-pressed="${k === tab}">${l}</button>`).join("")}</div>
        <div id="fx-view"></div>`;
      shell.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; renderApp(); }));
      shell.querySelector("#fx-logout").addEventListener("click", () => B.signOut());
      shell.querySelector("#fx-edit-profile").addEventListener("click", async () => {
        const name = prompt("Ditt namn", profile.name || "") ; if (name === null) return;
        const teamName = prompt("Lagnamn", profile.teamName || ""); if (teamName === null) return;
        profile = { ...profile, name: name.trim(), teamName: teamName.trim() }; await B.setDoc(`users/${user.uid}`, { name: profile.name, teamName: profile.teamName }, true);
        await B.setDoc(`standings/${user.uid}`, { name: profile.name, teamName: profile.teamName }, true); renderApp();
      });
      renderBadges();
      ({ lag: renderTeam, poang: renderPoints, tabell: renderStandings, ligor: renderLeagues, regler: renderRules })[tab]();
    }
    async function renderBadges() {
      const st = (await B.getDoc(`standings/${user.uid}`)) || {}; const gwv = Object.values(st.gw || {});
      const badges = [];
      if (lineup.players.length === 11) badges.push(["⚽", "Startelvan klar"]);
      if (gwv.length >= 1) badges.push(["🎯", "Första omgången"]);
      if (gwv.some((v) => v >= 60)) badges.push(["🔥", "60+ i en omgång"]);
      if ((st.rank || 0) > 0 && st.rank <= 10) badges.push(["🏆", "Topp 10"]);
      if ((lineup.usedChips || []).length) badges.push(["🃏", "Chip använt"]);
      if (lineup.players.filter((id) => byId[id] && byId[id].academy).length >= 5) badges.push(["🏠", "Egna produkter ×5"]);
      shell.querySelector("#fx-badges").innerHTML = badges.map(([i, t]) => `<span class="badge" title="${esc(t)}">${i} ${esc(t)}</span>`).join("");
    }

    /* ---------- Mitt lag ---------- */
    function renderTeam() {
      const v = shell.querySelector("#fx-view");
      const val = S.validate(lineup.players, squad, cfg);
      const open = gwOpen();
      const deadline = gw ? (open ? `Deadline: ${fmtDate(gw)} · ${gw.home ? "hemma" : "borta"} mot ${esc(gw.opponent)}` : `Låst: match pågår. Öppnar igen efter slutsignal.`) : "Inga fler matcher inlagda den här säsongen";
      const slot = (p) => {
        const capt = lineup.captain === p.id, vice = lineup.vice === p.id;
        return `<div class="fx-chip ${p.academy ? "fx-chip--academy" : ""}" data-pid="${p.id}">
          <div class="fx-shirt">${p.number}</div>
          <b>${esc(p.name.split(" ").slice(-1)[0])}</b><span>${p.price.toFixed(1)} M · ${seasonPoints(p.id)} p</span>
          <div class="fx-chip__acts">
            <button type="button" class="fx-mini ${capt ? "is-on" : ""}" data-cap="${p.id}" title="Kapten" ${open ? "" : "disabled"}>C</button>
            <button type="button" class="fx-mini ${vice ? "is-on" : ""}" data-vice="${p.id}" title="Vicekapten" ${open ? "" : "disabled"}>V</button>
            <button type="button" class="fx-mini fx-mini--x" data-rm="${p.id}" title="Ta bort" ${open ? "" : "disabled"}>×</button>
          </div></div>`;
      };
      const row = (pos) => {
        const mine = lineup.players.map((id) => byId[id]).filter((p) => p && p.pos === pos);
        const [lo, hi] = cfg.formation[pos];
        const empties = Math.max(0, Math.max(lo, mine.length) - mine.length);
        const canAdd = mine.length < hi && lineup.players.length < 11;
        return `<div class="fx-row" data-pos="${pos}"><div class="fx-row__label">${S.posName(pos)}<small>${mine.length}/${hi}</small></div><div class="fx-row__slots">
          ${mine.map(slot).join("")}${Array.from({ length: empties }).map(() => `<button type="button" class="fx-empty" data-pick="${pos}" ${open ? "" : "disabled"}>+ ${S.posName(pos)}</button>`).join("")}
          ${canAdd && !empties && open ? `<button type="button" class="fx-empty fx-empty--opt" data-pick="${pos}">+</button>` : ""}</div></div>`;
      };
      const left = cfg.budget - val.cost;
      v.innerHTML = `
        <div class="fx-deadline ${open ? "" : "fx-deadline--locked"}"><span>${deadline}</span>${open ? `<span id="fx-cd"></span>` : ""}</div>
        <div class="fx-layout">
          <div>
            <div class="fx-budget"><div><span>Budget kvar</span><b class="${left < 0 ? "neg" : ""}">${left.toFixed(1)} M</b></div><div class="fx-bar"><i style="width:${Math.min(100, val.cost / cfg.budget * 100)}%"></i></div><div><span>Spelare</span><b>${lineup.players.length}/11</b></div></div>
            <div class="pitch">${POS.map(row).join("")}</div>
          </div>
          <aside class="fx-side">
            <div class="card">
              <h3>Chips</h3>
              <p style="font-size:.88rem;color:var(--muted)">Ett chip per match, varje chip en gång per säsong.</p>
              ${cfg.chips.map((c) => { const used = (lineup.usedChips || []).includes(c.id); return `<label class="fx-chipopt ${used ? "is-used" : ""}"><input type="radio" name="chip" value="${c.id}" ${lineup.chip === c.id ? "checked" : ""} ${used || !open ? "disabled" : ""}><span><b>${esc(c.name)}</b><small>${esc(c.text)}${used ? " · Använt" : ""}</small></span></label>`; }).join("")}
              <label class="fx-chipopt"><input type="radio" name="chip" value="" ${!lineup.chip ? "checked" : ""} ${open ? "" : "disabled"}><span><b>Inget chip</b></span></label>
            </div>
            <div class="card">
              ${val.errors.length ? `<ul class="fx-errors">${val.errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : `<p class="notice notice--ok" style="margin:0 0 10px">Laget är giltigt. ${lineup.captain ? "" : "Välj kapten (C) för dubbla poäng."}</p>`}
              <button class="btn btn--primary btn--block" id="fx-save" type="button" ${open && val.ok ? "" : "disabled"}>Spara laget</button>
              <button class="btn btn--ghost btn--block btn--sm" id="fx-auto" type="button" style="margin-top:8px" ${open ? "" : "disabled"}>Fyll automatiskt</button>
              ${lineup.savedAt ? `<p style="font-size:.8rem;color:var(--muted);margin:10px 0 0">Senast sparat ${new Date(lineup.savedAt).toLocaleString("sv-SE")}</p>` : ""}
            </div>
          </aside>
        </div>
        <div id="fx-picker" hidden></div>`;
      if (open) { const cd = v.querySelector("#fx-cd"); const tick = () => { const s = Math.max(0, Math.floor((gw.d - Date.now()) / 1000)); cd.textContent = `${Math.floor(s / 86400)}d ${Math.floor(s % 86400 / 3600)}h ${Math.floor(s % 3600 / 60)}m`; if (s > 0 && document.body.contains(cd)) setTimeout(tick, 30000); }; tick(); }
      v.addEventListener("click", async (e) => {
        const t = e.target;
        if (t.dataset.pick) return openPicker(t.dataset.pick);
        if (t.dataset.rm) { lineup.players = lineup.players.filter((id) => id !== t.dataset.rm); if (lineup.captain === t.dataset.rm) lineup.captain = null; if (lineup.vice === t.dataset.rm) lineup.vice = null; return renderTeam(); }
        if (t.dataset.cap) { lineup.captain = t.dataset.cap; if (lineup.vice === lineup.captain) lineup.vice = null; return renderTeam(); }
        if (t.dataset.vice) { lineup.vice = t.dataset.vice; if (lineup.captain === lineup.vice) lineup.captain = null; return renderTeam(); }
        if (t.id === "fx-auto") return autoFill();
        if (t.id === "fx-save") return save();
      });
      v.querySelectorAll("input[name=chip]").forEach((r) => r.addEventListener("change", () => { lineup.chip = r.value || null; lineup.chipFixture = lineup.chip ? fxId(gw) : null; }));
    }
    function openPicker(pos) {
      const box = shell.querySelector("#fx-picker"); box.hidden = false;
      const val = S.validate(lineup.players, squad, cfg); const left = cfg.budget - val.cost;
      const list = squad.filter((p) => p.pos === pos).sort((a, b) => seasonPoints(b.id) - seasonPoints(a.id) || b.price - a.price);
      box.innerHTML = `<div class="fx-picker"><div class="fx-picker__head"><h3 style="margin:0">Välj ${S.posName(pos).toLowerCase()}</h3><span style="color:var(--muted);font-size:.9rem">${left.toFixed(1)} M kvar</span><button class="close" type="button" data-close>×</button></div>
        <div class="table-wrap"><table><thead><tr><th>#</th><th>Spelare</th><th class="num">Pris</th><th class="num">Senast</th><th class="num">Totalt</th><th></th></tr></thead><tbody>
        ${list.map((p) => { const inTeam = lineup.players.includes(p.id); const afford = p.price <= left + 1e-9; return `<tr class="${inTeam ? "is-ifk" : ""}"><td>${p.number}</td><td>${esc(p.name)}${p.academy ? ' <span class="tag">Egen produkt</span>' : ""}</td><td class="num">${p.price.toFixed(1)}</td><td class="num">${lastPoints(p.id)}</td><td class="num"><b>${seasonPoints(p.id)}</b></td><td>${inTeam ? "I laget" : `<button type="button" class="btn btn--sm ${afford ? "btn--primary" : "btn--ghost"}" data-add="${p.id}" ${afford ? "" : "disabled"}>Välj</button>`}</td></tr>`; }).join("")}
        </tbody></table></div></div>`;
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      box.onclick = (e) => {
        if (e.target.dataset.close !== undefined) { box.hidden = true; return; }
        const id = e.target.dataset.add; if (!id) return;
        const p = byId[id]; const cnt = lineup.players.filter((x) => byId[x].pos === p.pos).length;
        if (cnt >= cfg.formation[p.pos][1]) return toast(`Max ${cfg.formation[p.pos][1]} i ${S.posName(p.pos).toLowerCase()}`);
        if (lineup.players.length >= 11) return toast("Du har redan 11 spelare");
        lineup.players.push(id); box.hidden = true; renderTeam();
      };
    }
    function autoFill() {
      // Greedy: uppfyll minimum per position med bäst poäng/pris, fyll sedan på efter budget
      const picked = [...lineup.players];
      // Utan publicerade omgångar är priset bästa signalen på kvalitet; annars poäng per miljon
      const score = (p) => published.length ? (seasonPoints(p.id) + 1) / p.price : p.price;
      const cost = () => picked.reduce((n, id) => n + byId[id].price, 0);
      const cnt = (pos) => picked.filter((id) => byId[id].pos === pos).length;
      const cands = (pos) => squad.filter((p) => p.pos === pos && !picked.includes(p.id)).sort((a, b) => score(b) - score(a));
      for (const pos of POS) while (cnt(pos) < cfg.formation[pos][0]) { const c = cands(pos).find((p) => cost() + p.price <= cfg.budget); if (!c) break; picked.push(c.id); }
      let guard = 0;
      while (picked.length < 11 && guard++ < 30) {
        const all = POS.filter((pos) => cnt(pos) < cfg.formation[pos][1]).flatMap(cands).sort((a, b) => score(b) - score(a));
        const c = all.find((p) => cost() + p.price <= cfg.budget); if (!c) break; picked.push(c.id);
      }
      // Uppgraderingspass: byt till dyrare spelare på samma position så länge budgeten räcker
      let improved = true, guard2 = 0;
      while (improved && guard2++ < 40) {
        improved = false;
        for (const id of [...picked].sort((a, b) => byId[a].price - byId[b].price)) {
          const cur = byId[id]; const room = cfg.budget - cost();
          const better = squad.filter((p) => p.pos === cur.pos && !picked.includes(p.id) && p.price > cur.price && p.price - cur.price <= room + 1e-9 && score(p) >= score(cur)).sort((a, b) => b.price - a.price)[0];
          if (better) { picked[picked.indexOf(id)] = better.id; improved = true; break; }
        }
      }
      lineup.players = picked.slice(0, 11);
      if (!lineup.captain) lineup.captain = [...lineup.players].sort((a, b) => byId[b].price - byId[a].price)[0];
      if (!lineup.vice) lineup.vice = [...lineup.players].filter((id) => id !== lineup.captain).sort((a, b) => byId[b].price - byId[a].price)[0];
      renderTeam();
    }
    async function save() {
      const val = S.validate(lineup.players, squad, cfg); if (!val.ok) return toast(val.errors[0]);
      if (!lineup.captain) return toast("Välj en kapten först");
      const data = { players: lineup.players, captain: lineup.captain, vice: lineup.vice || null, chip: lineup.chip || null, chipFixture: lineup.chipFixture || null, usedChips: lineup.usedChips || [], savedAt: Date.now(), fixtureId: fxId(gw), uid: user.uid };
      await B.setDoc(`lineups/${user.uid}`, data);
      await B.setDoc(`entries/${fxId(gw)}_${user.uid}`, data);
      await B.setDoc(`standings/${user.uid}`, { name: profile.name || user.name, teamName: profile.teamName || "", uid: user.uid }, true);
      lineup = data; toast("Laget sparat"); renderTeam(); renderBadges();
    }

    /* ---------- Poäng ---------- */
    async function renderPoints() {
      const v = shell.querySelector("#fx-view");
      if (!published.length) { v.innerHTML = `<p class="empty">Inga omgångar är publicerade än. Poängen dyker upp här efter första matchen.</p>`; return; }
      const cards = [];
      for (const f of [...published].reverse()) {
        const sc = await B.getDoc(`scores/${fxId(f)}_${user.uid}`);
        const st = statsMap[fxId(f)]; const r = st.result;
        const title = `${f.home ? D.club.shortName : f.opponent} ${f.home ? r.us : r.them}–${f.home ? r.them : r.us} ${f.home ? f.opponent : D.club.shortName}`;
        cards.push(`<details class="card fx-gw" ${cards.length === 0 ? "open" : ""}><summary><span><b>${esc(title)}</b><small>${window.IFKUtil.fmtDay(f.d)} ${f.d.getFullYear()}</small></span><span class="fx-gw__pts">${sc ? sc.points : "–"} p</span></summary>
          ${sc ? `<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Spelare</th><th>Poäng för</th><th class="num">P</th></tr></thead><tbody>${sc.rows.map((row) => `<tr><td>${esc(row.name)}${row.note ? ` <span class="tag">${esc(row.note)}</span>` : ""}</td><td style="font-size:.85rem;color:var(--muted)">${row.detail.map((d) => `${esc(d.label)} ${d.pts > 0 ? "+" : ""}${d.pts}`).join(", ")}</td><td class="num"><b>${row.pts}</b></td></tr>`).join("")}</tbody></table></div>${sc.tip !== undefined ? `<p style="font-size:.88rem;margin:10px 0 0">Tips: ${sc.tip} p</p>` : ""}` : `<p class="empty">Du hade inget sparat lag den här omgången.</p>`}
        </details>`);
      }
      v.innerHTML = `<div class="accordion">${cards.join("")}</div>`;
    }

    /* ---------- Tabell ---------- */
    const inRound = (fid, r) => { const d = fid.slice(3); return d >= r.from && d <= r.to; };
    const sumIn = (map, r) => Object.entries(map || {}).filter(([k]) => !r || inRound(k, r)).reduce((n, [, x]) => n + x, 0);
    const roundState = (r) => { const today = new Date().toISOString().slice(0, 10); return today > r.to ? "done" : today < r.from ? "coming" : "live"; };
    async function renderStandings(filterUids) {
      const v = shell.querySelector("#fx-view");
      let rows = await B.list("standings");
      if (filterUids) rows = rows.filter((r) => filterUids.includes(r.id));
      const lastId = published.length ? fxId(published[published.length - 1]) : null;
      const rounds = cfg.rounds || [];
      const cur = rounds.find((r) => roundState(r) === "live") || rounds[rounds.length - 1];
      rows = rows.map((r) => { const o = { ...r, total: sumIn(r.gw), tips: sumIn(r.tips), last: lastId ? (r.gw || {})[lastId] || 0 : 0 }; rounds.forEach((rd) => (o[rd.id] = sumIn(r.gw, rd) + sumIn(r.tips, rd))); o.grand = o.total + o.tips; return o; });
      const medal = (i) => ["🥇", "🥈", "🥉"][i] || i + 1;
      const table = (key, label, podium) => `<div class="table-wrap"><table><thead><tr><th>#</th><th>Lag</th><th>Manager</th><th class="num">${label}</th></tr></thead><tbody>${[...rows].sort((a, b) => b[key] - a[key]).slice(0, 100).map((r, i) => `<tr class="${r.id === user.uid ? "is-ifk" : ""} ${podium && i < 3 ? "is-podium" : ""}"><td>${podium ? medal(i) : i + 1}</td><td>${esc(r.teamName || "Utan namn")}${podium && i < 3 ? ' <span class="tag">Merch</span>' : ""}</td><td>${esc(r.name || "")}</td><td class="num"><b>${r[key]}</b></td></tr>`).join("") || `<tr><td colspan="4" class="empty">Inga lag ännu.</td></tr>`}</tbody></table></div>`;
      const views = [...rounds.map((rd) => [rd.id, rd.name.split(" · ")[0], rd.name.split(" · ")[1] || "", true]), ["grand", "Hela säsongen", "Totalt", false], ["last", "Senaste matchen", "Match", false], ["tips", "Tips", "Tips", false]];
      const startKey = cur ? cur.id : "grand";
      const render = (key) => { const vw = views.find((x) => x[0] === key); const rd = rounds.find((x) => x.id === key); v.querySelector("#st-table").innerHTML = (rd ? `<p class="fx-round ${roundState(rd)}">${esc(rd.name)} · ${roundState(rd) === "done" ? "Avslutad. Topp 3 har vunnit merch!" : roundState(rd) === "coming" ? "Startar " + rd.from : "Pågår till " + rd.to + ". " + esc(cfg.prizes.round)}</p>` : key === "grand" ? `<p class="fx-round">${cfg.prizes.grand ? esc(cfg.prizes.grand) : "Säsongens totalsegrare får ett stort pris som presenteras senare."}</p>` : "") + table(key, vw[2], vw[3]); };
      v.innerHTML = `<div class="fx-tabs">${views.map(([k, l]) => `<button class="chip" type="button" data-st="${k}" aria-pressed="${k === startKey}">${esc(l)}</button>`).join("")}</div><div id="st-table"></div>
        <p style="font-size:.85rem;color:var(--muted);margin-top:10px">Poäng per omgång = fantasypoäng + tipspoäng för matcherna i omgången. ${filterUids ? "" : `<a href="#" id="fx-share">Dela din placering</a>`}</p>`;
      render(startKey);
      v.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => { v.querySelectorAll("[data-st]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); render(b.dataset.st); }));
      const sh = v.querySelector("#fx-share"); if (sh) sh.addEventListener("click", async (e) => { e.preventDefault(); const me = [...rows].sort((a, b) => b.grand - a.grand).findIndex((r) => r.id === user.uid) + 1; const text = `Jag ligger ${me || "–"}:a i IFK Skövde Fantasy med ${(rows.find((r) => r.id === user.uid) || {}).grand || 0} poäng. Utmana mig: ${location.href}`; if (navigator.share) navigator.share({ text }); else { try { await navigator.clipboard.writeText(text); toast("Text kopierad"); } catch { toast(text); } } });
    }

    /* ---------- Ligor ---------- */
    async function renderLeagues() {
      const v = shell.querySelector("#fx-view");
      const mine = await B.list("leagues", { where: ["members", "array-contains", user.uid] });
      v.innerHTML = `<div class="grid grid--2" style="align-items:start">
        <div class="card"><h3>Skapa liga</h3><p style="font-size:.9rem;color:var(--muted)">Du får en kod att dela med kompisar, laget, jobbet eller läktarsektionen.</p><div class="discount-row"><input id="lg-name" placeholder="Liganamn" maxlength="30"><button class="btn btn--primary btn--sm" type="button" id="lg-create">Skapa</button></div></div>
        <div class="card"><h3>Gå med i liga</h3><p style="font-size:.9rem;color:var(--muted)">Skriv in koden du fått.</p><div class="discount-row"><input id="lg-code" placeholder="Kod, t.ex. BLÅ-1234" style="text-transform:uppercase"><button class="btn btn--dark btn--sm" type="button" id="lg-join">Gå med</button></div></div>
      </div><div id="lg-list" style="margin-top:18px">${mine.length ? "" : `<p class="empty">Du är inte med i någon liga än.</p>`}</div>`;
      const listEl = v.querySelector("#lg-list");
      for (const lg of mine) {
        const d = document.createElement("div"); d.className = "card"; d.style.marginBottom = "12px";
        d.innerHTML = `<div class="section-head" style="margin-bottom:10px"><div><h3 style="margin:0">${esc(lg.name)}</h3><span class="team__meta">Kod <b>${esc(lg.id)}</b> · ${lg.members.length} lag</span></div><button class="btn btn--ghost btn--sm" type="button" data-copy="${esc(lg.id)}">Kopiera kod</button></div><div class="lg-table"></div>`;
        listEl.appendChild(d);
        const rows = (await B.list("standings")).filter((r) => lg.members.includes(r.id)).map((r) => ({ ...r, grand: Object.values(r.gw || {}).reduce((n, x) => n + x, 0) + Object.values(r.tips || {}).reduce((n, x) => n + x, 0) })).sort((a, b) => b.grand - a.grand);
        d.querySelector(".lg-table").innerHTML = `<div class="table-wrap"><table><thead><tr><th>#</th><th>Lag</th><th>Manager</th><th class="num">Poäng</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${r.id === user.uid ? "is-ifk" : ""}"><td>${i + 1}</td><td>${esc(r.teamName || "Utan namn")}</td><td>${esc(r.name || "")}</td><td class="num"><b>${r.grand}</b></td></tr>`).join("")}</tbody></table></div>`;
        d.querySelector("[data-copy]").addEventListener("click", async () => { try { await navigator.clipboard.writeText(lg.id); toast("Kod kopierad"); } catch { toast(lg.id); } });
      }
      v.querySelector("#lg-create").addEventListener("click", async () => {
        const name = v.querySelector("#lg-name").value.trim(); if (!name) return toast("Skriv ett liganamn");
        const code = "BLÅ-" + Math.floor(1000 + Math.random() * 9000);
        await B.setDoc(`leagues/${code}`, { name, owner: user.uid, members: [user.uid], createdAt: Date.now() });
        await ensureStanding(); toast(`Ligan ${name} skapad`); renderLeagues();
      });
      v.querySelector("#lg-join").addEventListener("click", async () => {
        const code = v.querySelector("#lg-code").value.trim().toUpperCase(); const lg = await B.getDoc(`leagues/${code}`);
        if (!lg) return toast("Hittade ingen liga med den koden");
        if (!lg.members.includes(user.uid)) await B.setDoc(`leagues/${code}`, { members: [...lg.members, user.uid] }, true);
        await ensureStanding(); toast(`Du är med i ${lg.name}`); renderLeagues();
      });
    }
    const ensureStanding = () => B.setDoc(`standings/${user.uid}`, { name: profile.name || user.name, teamName: profile.teamName || "", uid: user.uid }, true);

    /* ---------- Regler ---------- */
    function renderRules() {
      const v = shell.querySelector("#fx-view");
      v.innerHTML = `<div class="grid grid--2" style="align-items:start">
        <div class="card"><h3>Så funkar det</h3><ol style="padding-left:18px;color:var(--muted);font-size:.95rem;line-height:1.7">
          <li>Välj 11 spelare ur Herr A-truppen för ${cfg.budget} IFK-miljoner. Minst 1 målvakt, 3 försvarare, 2 mittfältare och 1 anfallare.</li>
          <li>Utse kapten (dubbla poäng) och vicekapten (tar över om kaptenen inte spelar).</li>
          <li>Laget låses vid avspark. Mellan matcherna byter du fritt.</li>
          <li>Efter matchen matar kansliet in statistiken och poängen publiceras.</li>
          <li>Chips: <b>Trippelkapten</b> ger kaptenen 3×, <b>Målfest</b> ger +2 per mål dina spelare gör. Ett chip per match, varje chip en gång per säsong.</li>
          <li>Tippa resultatet på matchsidan: exakt rätt 3 p, rätt utfall 1 p. Räknas in i supporterpoängen.</li>
          <li>Rösta på matchens lirare efter slutsignal. Vinnaren får +3 i fantasy.</li>
          <li>Säsongen delas i två omgångar: ${(cfg.rounds || []).map((r) => esc(r.name.toLowerCase())).join(" och ")}. <b>${esc(cfg.prizes.round)}</b> ${cfg.prizes.grand ? esc(cfg.prizes.grand) : "Säsongens totalsegrare får ett stort pris som presenteras senare."}</li></ol></div>
        <div class="card"><h3>Poängtabell</h3><div class="table-wrap"><table><thead><tr><th>Händelse</th><th class="num">MV</th><th class="num">FÖ</th><th class="num">MF</th><th class="num">AN</th></tr></thead><tbody>${S.RULES.map((r) => `<tr><td>${esc(r.label)}</td><td class="num">${r.pts.GK}</td><td class="num">${r.pts.DEF}</td><td class="num">${r.pts.MID}</td><td class="num">${r.pts.FWD}</td></tr>`).join("")}</tbody></table></div></div></div>`;
    }

    /* ---------- Start ---------- */
    B.onAuth(async (u) => {
      user = u; tab = "lag"; await loadCommon();
      if (!user) { renderAuth(); return; }
      await loadUser(); renderApp();
    });
  });
})();
