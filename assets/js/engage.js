/* IFK Skövde FK – tippa resultatet, matchens lirare, historiequiz, Instagram */
(function () {
  document.addEventListener("ifk:ready", async () => {
    const D = window.IFK, B = window.IFKBackend, S = window.IFKScoring;
    const { esc, toast, store } = window.IFKUtil;
    const { fixtures } = window.IFKFixtures;
    const fxId = B.fixtureId;
    await B.ready;
    let statsMap = {};
    try { statsMap = Object.fromEntries((await B.list("stats")).map((s) => [s.id, s])); } catch {}
    const isPublished = (f) => !!(statsMap[fxId(f)] && statsMap[fxId(f)].published);

    /* Vilka matcher går att tippa / rösta på? */
    const now = new Date();
    const tipMatch = fixtures.find((f) => !f.score && f.d > now) || null;                 // nästa ej spelade
    const voteMatch = [...fixtures].reverse().find((f) => f.d < now && !isPublished(f) && (f.score || now - f.d < 3 * 86400e3)) || null; // senast spelade, ej publicerad

    const loginHint = (what) => `<p class="notice" style="margin:10px 0 0">Logga in på <a href="fantasy.html">Fantasy</a> för att ${what}. Poängen räknas in i din supporterställning.</p>`;

    /* ---------- Tippa resultatet ---------- */
    async function renderTip(el) {
      if (!el) return;
      if (!tipMatch) { el.innerHTML = ""; return; }
      const user = B.user(); const id = fxId(tipMatch);
      const saved = user ? await B.getDoc(`predictions/${id}_${user.uid}`) : store.get(`ifk_tip_${id}`, null);
      const home = tipMatch.home ? D.club.shortName : tipMatch.opponent, away = tipMatch.home ? tipMatch.opponent : D.club.shortName;
      const us = saved ? saved.us : "", them = saved ? saved.them : "";
      el.innerHTML = `<div class="card engage">
        <span class="eyebrow">Tippa resultatet</span>
        <h3>${esc(home)} – ${esc(away)}</h3>
        <p style="font-size:.9rem;color:var(--muted)">${window.IFKUtil.fmtLong(tipMatch.d)} kl ${esc(tipMatch.time)}. Exakt rätt ger 3 p, rätt utfall 1 p.</p>
        <div class="tip-row">
          <label><span>${esc(home)}</span><input type="number" min="0" max="15" id="tip-h" value="${tipMatch.home ? us : them}" inputmode="numeric"></label>
          <span class="tip-dash">–</span>
          <label><span>${esc(away)}</span><input type="number" min="0" max="15" id="tip-a" value="${tipMatch.home ? them : us}" inputmode="numeric"></label>
        </div>
        <button class="btn btn--primary btn--sm" type="button" id="tip-save">${saved ? "Uppdatera tips" : "Skicka tips"}</button>
        ${saved ? `<span style="font-size:.85rem;color:var(--ok);margin-left:10px">Sparat</span>` : ""}
        ${user ? "" : loginHint("spara ditt tips")}
      </div>`;
      el.querySelector("#tip-save").addEventListener("click", async () => {
        const h = parseInt(el.querySelector("#tip-h").value, 10), a = parseInt(el.querySelector("#tip-a").value, 10);
        if (isNaN(h) || isNaN(a)) return toast("Fyll i båda målen");
        const tip = { us: tipMatch.home ? h : a, them: tipMatch.home ? a : h, fixtureId: id, savedAt: Date.now() };
        if (user) { await B.setDoc(`predictions/${id}_${user.uid}`, { ...tip, uid: user.uid }); await B.setDoc(`standings/${user.uid}`, { uid: user.uid, name: user.name }, true); }
        else store.set(`ifk_tip_${id}`, tip);
        toast("Tips sparat"); renderTip(el);
      });
    }

    /* ---------- Matchens lirare ---------- */
    async function renderMotm(el) {
      if (!el) return;
      if (!voteMatch) { el.innerHTML = ""; return; }
      const user = B.user(); const id = fxId(voteMatch);
      const mine = user ? await B.getDoc(`motm/${id}_${user.uid}`) : null;
      const votes = await B.list("motm", { where: ["fixtureId", "==", id] });
      const tally = {}; votes.forEach((v) => { tally[v.pid] = (tally[v.pid] || 0) + 1; });
      const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const title = voteMatch.home ? `${D.club.shortName} – ${voteMatch.opponent}` : `${voteMatch.opponent} – ${D.club.shortName}`;
      el.innerHTML = `<div class="card engage">
        <span class="eyebrow">Matchens lirare</span>
        <h3>${esc(title)}</h3>
        <p style="font-size:.9rem;color:var(--muted)">Rösta fram fansens matchhjälte. Vinnaren får +3 p i Fantasy.</p>
        <div class="discount-row"><select id="motm-pid">${D.squad.map((p) => `<option value="${p.id}" ${mine && mine.pid === p.id ? "selected" : ""}>${p.number} ${esc(p.name)}</option>`).join("")}</select><button class="btn btn--primary btn--sm" type="button" id="motm-vote" ${user ? "" : "disabled"}>${mine ? "Ändra röst" : "Rösta"}</button></div>
        ${top.length ? `<div class="motm-top">${top.map(([pid, n], i) => `<div><b>${i + 1}. ${esc((D.squad.find((p) => p.id === pid) || {}).name || pid)}</b><span>${n} röst${n === 1 ? "" : "er"}</span></div>`).join("")}</div>` : `<p style="font-size:.85rem;color:var(--muted)">Inga röster än. Bli först!</p>`}
        ${user ? "" : loginHint("rösta")}
      </div>`;
      const b = el.querySelector("#motm-vote"); if (b) b.addEventListener("click", async () => { await B.setDoc(`motm/${id}_${user.uid}`, { pid: el.querySelector("#motm-pid").value, fixtureId: id, uid: user.uid, at: Date.now() }); toast("Röst registrerad"); renderMotm(el); });
    }

    /* ---------- Quiz ---------- */
    function renderQuiz(el) {
      if (!el) return;
      const qs = D.quiz; let i = 0, score = 0, answered = false;
      const best = store.get("ifk_quiz_best", null);
      const start = () => { i = 0; score = 0; step(); };
      const step = () => {
        answered = false; const q = qs[i];
        el.innerHTML = `<div class="card quiz"><div class="quiz__head"><span class="eyebrow">Historiequiz</span><span>${i + 1} / ${qs.length} · ${score} rätt</span></div>
          <div class="quiz__bar"><i style="width:${i / qs.length * 100}%"></i></div>
          <h3>${esc(q.q)}</h3>
          <div class="quiz__opts">${q.answers.map((a, k) => `<button type="button" class="quiz__opt" data-k="${k}">${esc(a)}</button>`).join("")}</div>
          <p class="quiz__why" id="quiz-why" hidden></p>
          <button class="btn btn--primary btn--sm" id="quiz-next" type="button" hidden>${i === qs.length - 1 ? "Se resultat" : "Nästa fråga"}</button></div>`;
        el.querySelectorAll(".quiz__opt").forEach((b) => b.addEventListener("click", () => {
          if (answered) return; answered = true; const k = +b.dataset.k;
          el.querySelectorAll(".quiz__opt").forEach((x) => { x.disabled = true; if (+x.dataset.k === q.correct) x.classList.add("is-right"); });
          if (k === q.correct) { score++; } else b.classList.add("is-wrong");
          const why = el.querySelector("#quiz-why"); why.textContent = q.why; why.hidden = false; el.querySelector("#quiz-next").hidden = false;
        }));
        el.querySelector("#quiz-next").addEventListener("click", () => { i++; if (i < qs.length) step(); else finish(); });
      };
      const finish = () => {
        const b = Math.max(best || 0, score); store.set("ifk_quiz_best", b);
        const grade = score === qs.length ? "Kamraternas kamrat. Fullpoäng!" : score >= 8 ? "Äkta blåsvart. Du kan din klubb." : score >= 5 ? "Bra jobbat, du är på god väg." : "Läs historien ovan och försök igen!";
        el.innerHTML = `<div class="card quiz quiz--done"><span class="eyebrow">Resultat</span><div class="quiz__score"><b data-count="${score}">${score}</b> av ${qs.length}</div><h3>${grade}</h3><p style="color:var(--muted)">Bästa resultat i den här webbläsaren: ${b}/${qs.length}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn btn--primary btn--sm" type="button" id="quiz-again">Kör igen</button><button class="btn btn--ghost btn--sm" type="button" id="quiz-share">Dela resultatet</button></div></div>`;
        el.querySelector("#quiz-again").addEventListener("click", start);
        el.querySelector("#quiz-share").addEventListener("click", async () => { const text = `Jag fick ${score}/${qs.length} på IFK Skövdes historiequiz. Klarar du bättre? ${location.href}`; if (navigator.share) navigator.share({ text }); else { try { await navigator.clipboard.writeText(text); toast("Text kopierad"); } catch { toast(text); } } });
      };
      el.innerHTML = `<div class="card quiz quiz--intro"><span class="eyebrow">Historiequiz</span><h3>Hur väl kan du IFK Skövde?</h3><p style="color:var(--muted)">${qs.length} frågor från 1907 till i dag.${best !== null ? ` Ditt bästa: ${best}/${qs.length}.` : ""}</p><button class="btn btn--primary" type="button" id="quiz-start">Starta quizet</button></div>`;
      el.querySelector("#quiz-start").addEventListener("click", start);
    }

    /* ---------- Instagram ---------- */
    function renderInstagram(el) {
      if (!el) return;
      const ig = D.instagram || {};
      if (!ig.posts || !ig.posts.length) {
        el.innerHTML = `<div class="ig-empty"><div class="ph ph--square" data-img="ig-1.jpg"><img src="assets/img/ig-1.jpg" alt="" onerror="this.remove()"><span class="ph__label">Instagram</span></div><div class="ph ph--square" data-img="ig-2.jpg"><img src="assets/img/ig-2.jpg" alt="" onerror="this.remove()"><span class="ph__label">Instagram</span></div><div class="ph ph--square" data-img="ig-3.jpg"><img src="assets/img/ig-3.jpg" alt="" onerror="this.remove()"><span class="ph__label">Instagram</span></div></div>`;
        return;
      }
      el.innerHTML = `<div class="ig-grid">${ig.posts.slice(0, 6).map((u) => `<blockquote class="instagram-media" data-instgrm-permalink="${esc(u)}" data-instgrm-version="14" style="margin:0;min-width:0"><a href="${esc(u)}" target="_blank" rel="noopener">Visa inlägget på Instagram</a></blockquote>`).join("")}</div>`;
      const s = document.createElement("script"); s.async = true; s.src = "https://www.instagram.com/embed.js"; document.body.appendChild(s);
    }

    const run = () => { renderTip(document.getElementById("tip-widget")); renderMotm(document.getElementById("motm-widget")); };
    B.onAuth(run);
    renderQuiz(document.getElementById("quiz"));
    renderInstagram(document.getElementById("instagram"));
    window.IFKEngage = { renderTip, renderMotm };
  });
})();
