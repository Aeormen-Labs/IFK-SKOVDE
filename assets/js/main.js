/* IFK Skövde FK – delad logik: header/footer, matcher, popup, hjälpfunktioner */
(function () {
  const D = window.IFK;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const page = document.body.dataset.page || "";
  const root = document.body.dataset.root || "";

  /* ---------- Hjälpfunktioner ---------- */
  const SV_DAYS = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
  const SV_MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const parseDate = (f) => new Date(`${f.date}T${f.time || "12:00"}:00`);
  const fmtDay = (d) => `${d.getDate()} ${SV_MONTHS[d.getMonth()]}`;
  const fmtLong = (d) => `${SV_DAYS[d.getDay()]} ${d.getDate()} ${SV_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => `${Math.round(n).toLocaleString("sv-SE")} ${D.shop.currency}`;
  const ph = (label, cls = "", img = "") =>
    `<div class="ph ${cls}" data-img="${esc(img)}"><img src="${root}assets/img/${esc(img)}" alt="" loading="lazy" onerror="this.remove()"><span class="ph__label">${esc(label)}</span></div>`;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  window.IFKUtil = { $, $$, esc, money, ph, store, parseDate, fmtDay, fmtLong, root, toast };

  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  /* ---------- Matchdata ---------- */
  const now = new Date();
  const fixtures = D.fixtures.map((f) => ({ ...f, d: parseDate(f) })).sort((a, b) => a.d - b.d);
  const nextMatch = fixtures.find((f) => !f.score && f.d >= new Date(now.getTime() - 3 * 3600e3)) || null;
  const resultOf = (f) => {
    if (!f.score) return null;
    const [us, them] = f.score;
    return us > them ? "W" : us < them ? "L" : "D";
  };
  window.IFKFixtures = { fixtures, nextMatch, resultOf };

  /* ---------- Header & footer ---------- */
  const NAV = [
    ["matcher.html", "Matcher", "matcher"],
    ["spelare.html", "Truppen", "spelare"],
    ["lag.html", "Våra lag", "lag"],
    ["klubben.html", "Klubben", "klubben"],
    ["historia.html", "Historia", "historia"],
    ["vision.html", "Vision 2030", "vision"],
    ["fantasy.html", "Fantasy", "fantasy", "nav__fantasy"],
    ["kontakt.html", "Kontakt", "kontakt"],
    ["shop.html", "Shop", "shop", "nav__shop"]
  ];
  const crest = `<img class="brand__crest" src="${root}assets/img/logo.svg" alt="" width="44" height="44">`;
  const cartCount = () => (store.get("ifk_cart", [])).reduce((n, i) => n + i.qty, 0);

  function renderHeader() {
    const mount = $("#site-header"); if (!mount) return;
    const nm = nextMatch;
    const nextTxt = nm
      ? `Nästa match: <a href="${root}matcher.html">${nm.home ? D.club.shortName : esc(nm.opponent)} – ${nm.home ? esc(nm.opponent) : D.club.shortName} · ${fmtDay(nm.d)} ${nm.time}</a>`
      : `<a href="${root}matcher.html">Se spelschema</a>`;
    mount.innerHTML = `
      <div class="topbar"><div class="container">
        <span class="next">${nextTxt}</span>
        <span><a href="${root}shop.html">10 % rabatt i shoppen med koden ${esc(D.promo.code)}</a></span>
      </div></div>
      <div class="container nav">
        <a class="brand" href="${root}index.html">${crest}<span><span class="brand__name">${esc(D.club.name)}</span><span class="brand__sub">Skövde · sedan ${D.club.founded}</span></span></a>
        <ul class="nav__links" id="nav-links">
          ${NAV.map(([href, label, key, cls]) => `<li class="${cls || ""}"><a href="${root}${href}" ${key === page ? 'aria-current="page"' : ""}>${label}</a></li>`).join("")}
        </ul>
        <div class="nav__actions">
          <button class="cart-btn" id="cart-open" aria-label="Öppna varukorg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
            <span class="cart-btn__count" id="cart-count"></span>
          </button>
          <button class="burger" id="burger" aria-label="Meny" aria-expanded="false" aria-controls="nav-links">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>`;
    $("#burger").addEventListener("click", (e) => {
      const links = $("#nav-links"); const open = links.classList.toggle("is-open");
      e.currentTarget.setAttribute("aria-expanded", String(open));
    });
    $("#cart-open").addEventListener("click", () => {
      if (window.IFKShop) window.IFKShop.open(); else location.href = `${root}shop.html#varukorg`;
    });
    updateCartBadge();
  }
  function updateCartBadge() {
    const b = $("#cart-count"); if (!b) return;
    const n = cartCount(); b.textContent = n || ""; if (n) b.removeAttribute("data-zero"); else b.setAttribute("data-zero", "1");
  }
  window.IFKUtil.updateCartBadge = updateCartBadge;

  function renderFooter() {
    const mount = $("#site-footer"); if (!mount) return;
    const c = D.club;
    mount.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="${root}index.html" style="color:#fff">${crest}<span><span class="brand__name">${esc(c.name)}</span></span></a>
            <p style="margin-top:12px;font-size:.92rem;max-width:36ch">Blått, svart och vitt sedan ${c.founded}. Hemmaarena ${esc(c.ground)}. Målet är Superettan 2030.</p>
            <p style="font-size:.9rem"><a href="${esc(c.social.instagram)}" target="_blank" rel="noopener">Instagram</a> · <a href="${esc(c.social.facebook)}" target="_blank" rel="noopener">Facebook</a> · <a href="${esc(c.social.x)}" target="_blank" rel="noopener">X</a></p>
          </div>
          <div><h4>Klubben</h4><ul>
            <li><a href="${root}matcher.html">Matcher &amp; tabell</a></li>
            <li><a href="${root}lag.html">Våra lag</a></li>
            <li><a href="${root}klubben.html">Organisation</a></li>
            <li><a href="${root}historia.html">Historia</a></li>
            <li><a href="${root}vision.html">Vision 2030</a></li>
          </ul></div>
          <div><h4>Shop</h4><ul>
            <li><a href="${root}shop.html">Alla produkter</a></li>
            <li><a href="${root}shop.html#kat-Matchkläder">Matchkläder</a></li>
            <li><a href="${root}shop.html#kat-Supporter">Supporterprylar</a></li>
            <li><a href="${root}shop.html#kat-Barn">Barn</a></li>
            <li><a href="${root}shop.html#kassa">Kassa</a></li>
          </ul></div>
          <div><h4>Kontakt</h4><ul>
            <li>${esc(c.address)}</li>
            <li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
            <li><a href="tel:${esc(c.phone.replace(/\s|-/g, ""))}">${esc(c.phone)}</a></li>
            <li><a href="${root}kontakt.html">Hitta hit &amp; kansli</a></li>
            <li><a href="${esc(c.social.svenskalag)}" target="_blank" rel="noopener">Medlemssidor (Svenskalag)</a></li>
          </ul></div>
        </div>
        <div class="footer-partners"><span>Partners</span>${D.sponsors.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener sponsored">${esc(s.name.replace(/ – .*$/, ""))}</a>`).join("")}</div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${esc(c.name)}</span>
          <span>Blå · Svart · Vit</span>
        </div>
      </div>`;
  }

  /* ---------- Matchkort & nedräkning ---------- */
  function renderNextMatch(el) {
    if (!el) return;
    const nm = nextMatch;
    if (!nm) { el.innerHTML = `<div class="match-card"><p class="empty">Inga kommande matcher inlagda. <a href="${root}matcher.html">Se resultat</a></p></div>`; return; }
    const homeName = nm.home ? D.club.shortName : nm.opponent;
    const awayName = nm.home ? nm.opponent : D.club.shortName;
    const msTo = nm.d - new Date();
    const state = msTo <= 0 && msTo > -2 * 3600e3 ? "live" : msTo <= 0 ? "ft" : msTo < 6 * 3600e3 ? "matchday" : "upcoming";
    const label = { live: "Pågår nu", ft: "Slutsignal · resultat kommer", matchday: "Matchdag", upcoming: "Nästa match" }[state];
    el.innerHTML = `
      <div class="match-card match-card--${state}">
        <div class="match-card__label"><span>${state === "live" ? '<i class="live-dot"></i>' : ""}${label}</span><span>${esc(nm.competition)}</span></div>
        <div class="match-card__teams">
          <div class="match-card__team">${esc(homeName)}<small>${nm.home ? "Hemma" : "Borta"}</small></div>
          <div class="match-card__vs">VS</div>
          <div class="match-card__team">${esc(awayName)}<small>${nm.home ? "Borta" : "Hemma"}</small></div>
        </div>
        <div class="match-card__meta"><span>${fmtLong(nm.d)}</span><span>kl ${esc(nm.time)}</span><span>${nm.home ? esc(D.club.ground) : "Bortaplan"}</span></div>
        <div class="countdown" id="countdown" aria-live="polite">
          <div><b data-u="d">0</b><span>dagar</span></div><div><b data-u="h">0</b><span>tim</span></div><div><b data-u="m">0</b><span>min</span></div><div><b data-u="s">0</b><span>sek</span></div>
        </div>
        <div class="match-card__actions">
          <a class="btn btn--primary btn--sm" href="${root}matcher.html">Hela spelschemat</a>
          ${nm.home ? `<a class="btn btn--ghost btn--sm" href="${root}kontakt.html#hitta">Hitta hit</a>` : ""}
          <a class="btn btn--ghost btn--sm" href="${icsFor(nm)}" download="ifk-skovde-${nm.date}.ics">Kalender</a>
          <button class="btn btn--ghost btn--sm" type="button" data-share="${nm.date}">Dela</button>
        </div>
      </div>`;
    bindShare(el);
    if (state !== "upcoming" && state !== "matchday") { $("#countdown").innerHTML = `<div style="grid-column:1/-1"><b>${state === "live" ? "Heja IFK!" : "Tack för stödet"}</b><span>${state === "live" ? "matchen pågår" : "resultatet läggs in efter matchen"}</span></div>`; return; }
    const tick = () => {
      const diff = Math.max(0, nm.d - new Date());
      const s = Math.floor(diff / 1000);
      const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      $$("#countdown b").forEach((b) => (b.textContent = v[b.dataset.u]));
      if (diff === 0) { const c = $("#countdown"); if (c) c.innerHTML = `<div style="grid-column:1/-1"><b>Matchdag</b><span>lycka till, IFK!</span></div>`; return; }
      setTimeout(tick, 1000);
    };
    tick();
  }

  const pad2 = (n) => String(n).padStart(2, "0");
  const icsStamp = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
  function icsFor(f) {
    const e = new Date(f.d.getTime() + 2 * 3600e3);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IFK Skövde FK//Matcher//SV", "BEGIN:VEVENT", `UID:${f.date}-${f.opponent.replace(/\W/g, "")}@ifkskovdefk`, `DTSTART:${icsStamp(f.d)}`, `DTEND:${icsStamp(e)}`, `SUMMARY:${f.home ? D.club.shortName + " – " + f.opponent : f.opponent + " – " + D.club.shortName}`, `LOCATION:${f.home ? D.club.ground + ", " + D.club.city : "Bortaplan"}`, "END:VEVENT", "END:VCALENDAR"];
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics.join("\r\n"));
  }
  function bindShare(scope) {
    $$("[data-share]", scope).forEach((b) => b.addEventListener("click", async () => {
      const f = fixtures.find((x) => x.date === b.dataset.share); if (!f) return;
      const title = f.home ? `${D.club.shortName} – ${f.opponent}` : `${f.opponent} – ${D.club.shortName}`;
      const text = f.score ? `${title} ${f.home ? f.score[0] + "–" + f.score[1] : f.score[1] + "–" + f.score[0]}` : `${title}, ${fmtLong(f.d)} kl ${f.time}${f.home ? " på " + D.club.ground : ""}. Kom och heja!`;
      const url = location.origin + root + "matcher.html";
      if (navigator.share) { try { await navigator.share({ title, text, url }); } catch {} }
      else { try { await navigator.clipboard.writeText(`${text} ${url}`); toast("Kopierat till urklipp"); } catch { toast(text); } }
    }));
  }
  window.IFKUtil.icsFor = icsFor;
  function fixtureRow(f, opts = {}) {
    const r = resultOf(f);
    const played = !!f.score;
    const isNext = nextMatch && f === nextMatch;
    const home = f.home;
    const teams = home
      ? `<span class="ifk">${esc(D.club.shortName)}</span> – ${esc(f.opponent)}`
      : `${esc(f.opponent)} – <span class="ifk">${esc(D.club.shortName)}</span>`;
    let score;
    if (played) {
      const [us, them] = f.score;
      score = `<div class="fixture__score fixture__score--${r}">${home ? `${us}–${them}` : `${them}–${us}`}</div>`;
    } else if (f.d < now) {
      score = `<div class="fixture__score fixture__score--upcoming">Resultat kommer</div>`;
    } else {
      score = `<div class="fixture__score fixture__score--upcoming">kl ${esc(f.time)}</div>`;
    }
    return `<div class="fixture ${isNext ? "fixture--next" : ""}" data-status="${played ? "played" : "upcoming"}" data-venue="${home ? "home" : "away"}">
      <div class="fixture__date">${fmtDay(f.d)}<small>${SV_DAYS[f.d.getDay()]} ${f.d.getFullYear()}</small></div>
      <div><div class="fixture__teams">${teams}${isNext ? '<span class="tag">Nästa</span>' : ""}</div>
        <div class="fixture__meta">${esc(f.competition)} · ${home ? esc(D.club.ground) : "Bortaplan"}${opts.actions === false ? "" : ` · <span class="fixture__acts">${played ? "" : `<a href="${icsFor(f)}" download="ifk-skovde-${f.date}.ics">Kalender</a> · `}<button type="button" class="linklike" data-share="${f.date}">Dela</button></span>`}</div></div>
      ${score}
    </div>`;
  }

  function renderFixtureList(el, list) {
    if (!el) return;
    el.innerHTML = list.length ? list.map((f) => fixtureRow(f)).join("") : `<p class="empty">Inga matcher matchar filtret.</p>`;
    bindShare(el);
  }

  function renderTable(el) {
    if (!el) return;
    const t = D.table;
    el.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Lag</th><th class="num">S</th><th class="num">V</th><th class="num">O</th><th class="num">F</th><th class="num">Mål</th><th class="num">+/-</th><th class="num">P</th><th>Form</th></tr></thead>
        <tbody>${t.rows.map((r, i) => {
          const ifk = /skövde/i.test(r.team);
          return `<tr class="${ifk ? "is-ifk" : ""}"><td>${i + 1}</td><td>${esc(r.team)}</td><td class="num">${r.p}</td><td class="num">${r.w}</td><td class="num">${r.d}</td><td class="num">${r.l}</td><td class="num">${r.gf}–${r.ga}</td><td class="num">${r.gf - r.ga > 0 ? "+" : ""}${r.gf - r.ga}</td><td class="num"><b>${r.pts}</b></td><td>${r.form ? `<span class="form">${r.form.map((x) => `<i class="${x}">${x === "W" ? "V" : x === "D" ? "O" : "F"}</i>`).join("")}</span>` : ""}</td></tr>`;
        }).join("")}</tbody>
      </table></div>
      <p style="font-size:.85rem;color:var(--muted);margin-top:10px">Uppdaterad ${esc(t.updated)}. ${esc(t.note)} <a href="${esc(D.club.externalTable)}" target="_blank" rel="noopener">Hela tabellen hos Svensk fotboll</a>.</p>`;
    document.dispatchEvent(new CustomEvent("ifk:table", { detail: el }));
  }
  window.IFKRender = { renderNextMatch, renderFixtureList, renderTable, fixtureRow };

  /* ---------- Rabatt-popup ---------- */
  function initPopup() {
    const P = D.promo;
    if (!P.enabled || page === "checkout-done") return;
    if (store.get("ifk_popup_done", false)) return;
    const wrap = document.createElement("div");
    wrap.className = "popup-backdrop"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true"); wrap.setAttribute("aria-labelledby", "popup-title");
    wrap.innerHTML = `
      <div class="popup">
        <button class="popup__close" id="popup-close" aria-label="Stäng">×</button>
        <div class="popup__top">
          <div class="big"><small>Bara för dig</small>${P.percent} %<small>rabatt</small></div>
        </div>
        <div class="popup__body">
          <h2 id="popup-title" style="font-size:1.7rem">${esc(P.headline)}</h2>
          <p>${esc(P.text)}</p>
          ${P.timerMinutes ? `<p class="popup__timer">Erbjudandet gäller i <b id="popup-timer">${P.timerMinutes}:00</b></p>` : ""}
          <div class="popup__code"><span>${esc(P.code)}</span><button class="btn btn--sm btn--dark" id="popup-copy" type="button">Kopiera</button></div>
          <a class="btn btn--primary btn--block" id="popup-go" href="${root}shop.html">Handla med ${P.percent} % rabatt</a>
          <button class="popup__later" id="popup-later" type="button">Nej tack, kanske senare</button>
        </div>
      </div>`;
    const close = () => { wrap.classList.remove("is-open"); store.set("ifk_popup_done", true); setTimeout(() => wrap.remove(), 300); };
    setTimeout(() => {
      if (document.hidden) { document.addEventListener("visibilitychange", () => { if (!document.hidden && !wrap.classList.contains("is-open")) open(); }, { once: true }); return; }
      open();
    }, P.delaySeconds * 1000);
    function open() {
      document.body.appendChild(wrap);
      requestAnimationFrame(() => { wrap.classList.add("is-open"); $("#popup-go").focus(); });
      if (P.timerMinutes) { let s = P.timerMinutes * 60; const t = $("#popup-timer"); const tick = () => { s--; if (!document.body.contains(t)) return; t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; if (s > 0) setTimeout(tick, 1000); else close(); }; setTimeout(tick, 1000); }
      $("#popup-close").addEventListener("click", close);
      $("#popup-later").addEventListener("click", close);
      wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
      $("#popup-copy").addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(P.code); toast(`Koden ${P.code} kopierad`); } catch { toast(`Kod: ${P.code}`); }
        store.set("ifk_discount", P.code);
      });
      $("#popup-go").addEventListener("click", () => { store.set("ifk_discount", P.code); store.set("ifk_popup_done", true); });
    }
  }

  /* ---------- Start ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    initPopup();
    document.dispatchEvent(new CustomEvent("ifk:ready"));
  });
})();
