/* IFK Skövde FK – tröjbyggare: namn och nummer på tröjan med live-förhandsvisning */
(function () {
  document.addEventListener("ifk:ready", () => {
    const el = document.getElementById("kit-builder"); if (!el) return;
    const { esc, money, toast } = window.IFKUtil;
    const D = window.IFK;
    const kits = [
      { id: "hemma-2026", name: "Hemma 2026", body: "#0A3A8C", trim: "#121417", text: "#FFFFFF" },
      { id: "borta-2026", name: "Borta 2026", body: "#FFFFFF", trim: "#0A3A8C", text: "#0A3A8C" }
    ];
    const printPrice = 99;
    const state = { kit: kits[0], name: "", number: "", size: "L", player: "" };
    const squad = D.squad;
    el.innerHTML = `
      <div class="kit">
        <div class="kit__preview">
          <svg viewBox="0 0 300 320" class="kit__svg" aria-hidden="true">
            <defs><linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>
            <path id="kit-body" d="M95 30 L150 45 L205 30 L275 70 L250 125 L215 108 L215 300 L85 300 L85 108 L50 125 L25 70 Z" fill="#0A3A8C" stroke="#121417" stroke-width="4" stroke-linejoin="round"/>
            <path d="M95 30 L150 45 L205 30 L275 70 L250 125 L215 108 L215 300 L85 300 L85 108 L50 125 L25 70 Z" fill="url(#shine)"/>
            <path id="kit-trim" d="M120 34 Q150 62 180 34" fill="none" stroke="#121417" stroke-width="7" stroke-linecap="round"/>
            <rect id="kit-stripe" x="85" y="285" width="130" height="15" fill="#121417"/>
            <text id="kit-name" x="150" y="150" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, Arial, sans-serif" font-weight="700" font-size="26" fill="#fff" letter-spacing="2"></text>
            <text id="kit-number" x="150" y="245" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, Arial, sans-serif" font-weight="700" font-size="96" fill="#fff"></text>
          </svg>
          <div class="kit__tabs">${kits.map((k) => `<button type="button" class="chip" data-kit="${k.id}" aria-pressed="${k === state.kit}">${esc(k.name)}</button>`).join("")}</div>
        </div>
        <div class="kit__form">
          <span class="eyebrow">Tröjbyggare</span>
          <h3>Gör tröjan till din</h3>
          <p style="color:var(--muted);font-size:.95rem">Välj en spelare från truppen eller skriv ditt eget namn. Tryck kostar ${printPrice} kr.</p>
          <div class="field"><label for="kit-player">Spelare i truppen</label>
            <select id="kit-player"><option value="">Eget namn och nummer</option>${squad.map((p) => `<option value="${p.id}">${p.number} ${esc(p.name)}</option>`).join("")}</select></div>
          <div class="field field--row">
            <div><label for="kit-name-in">Namn på ryggen</label><input id="kit-name-in" maxlength="14" placeholder="T.EX. SKÖVDE" autocomplete="off"></div>
            <div><label for="kit-number-in">Nummer</label><input id="kit-number-in" inputmode="numeric" maxlength="2" placeholder="10"></div>
          </div>
          <div class="field"><label>Storlek</label><div class="product__opts" id="kit-sizes">${["S","M","L","XL","XXL"].map((s) => `<button type="button" class="size" data-size="${s}" aria-pressed="${s === state.size}">${s}</button>`).join("")}</div></div>
          <div class="kit__total"><span>Matchtröja + tryck</span><b id="kit-price"></b></div>
          <button type="button" class="btn btn--primary btn--block" id="kit-add">Lägg i varukorg</button>
        </div>
      </div>`;
    const $ = (s) => el.querySelector(s);
    const draw = () => {
      $("#kit-body").setAttribute("fill", state.kit.body); $("#kit-body").setAttribute("stroke", state.kit.trim);
      $("#kit-trim").setAttribute("stroke", state.kit.trim); $("#kit-stripe").setAttribute("fill", state.kit.trim);
      $("#kit-name").setAttribute("fill", state.kit.text); $("#kit-number").setAttribute("fill", state.kit.text);
      const nm = state.name.toUpperCase(); const nameEl = $("#kit-name");
      nameEl.textContent = nm; nameEl.setAttribute("font-size", String(nm.length > 8 ? Math.max(14, Math.round(26 * 8 / nm.length)) : 26));
      $("#kit-number").textContent = state.number;
      const base = (D.products.find((p) => p.id === state.kit.id) || { price: 699 }).price;
      $("#kit-price").textContent = money(base + ((state.name || state.number) ? printPrice : 0));
    };
    el.addEventListener("click", (e) => {
      const k = e.target.closest("[data-kit]"); if (k) { state.kit = kits.find((x) => x.id === k.dataset.kit); el.querySelectorAll("[data-kit]").forEach((b) => b.setAttribute("aria-pressed", String(b === k))); draw(); }
      const s = e.target.closest("[data-size]"); if (s) { state.size = s.dataset.size; el.querySelectorAll("[data-size]").forEach((b) => b.setAttribute("aria-pressed", String(b === s))); }
    });
    $("#kit-player").addEventListener("change", (e) => { const p = squad.find((x) => x.id === e.target.value); state.name = p ? p.name.split(" ").slice(-1)[0] : ""; state.number = p ? String(p.number) : ""; $("#kit-name-in").value = state.name.toUpperCase(); $("#kit-number-in").value = state.number; draw(); });
    $("#kit-name-in").addEventListener("input", (e) => { state.name = e.target.value.replace(/[^A-Za-zÅÄÖåäö .-]/g, ""); draw(); });
    $("#kit-number-in").addEventListener("input", (e) => { state.number = e.target.value.replace(/\D/g, "").slice(0, 2); draw(); });
    $("#kit-add").addEventListener("click", () => {
      const print = (state.name || state.number) ? ` · Tryck: ${state.name.toUpperCase() || "–"} ${state.number}` : "";
      window.IFKShop.add(state.kit.id, state.size + print, (state.name || state.number) ? printPrice : 0);
    });
    draw();
  });
})();
