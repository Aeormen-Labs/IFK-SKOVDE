/* IFK Skövde FK – shop, varukorg, rabattkod och kassa */
(function () {
  const D = window.IFK;
  document.addEventListener("ifk:ready", () => {
    const { $, $$, esc, money, ph, store, root, toast, updateCartBadge } = window.IFKUtil;
    const products = D.products;
    const byId = (id) => products.find((p) => p.id === id);
    let cart = store.get("ifk_cart", []);
    let discount = store.get("ifk_discount", "");
    const save = () => { store.set("ifk_cart", cart); store.set("ifk_discount", discount); updateCartBadge(); renderDrawer(); renderSummary(); };

    /* ----- Beräkningar ----- */
    const validCode = (c) => c && c.trim().toUpperCase() === D.promo.code.toUpperCase();
    const unit = (i) => byId(i.id).price + (i.extra || 0);
    function totals() {
      const sub = cart.reduce((n, i) => n + unit(i) * i.qty, 0);
      const disc = validCode(discount) ? Math.round(sub * D.promo.percent / 100) : 0;
      const afterDisc = sub - disc;
      const pickup = ($("input[name=delivery]:checked") || {}).value === "pickup";
      const ship = cart.length === 0 || pickup || afterDisc >= D.shop.freeShippingFrom ? 0 : D.shop.shippingFee;
      return { sub, disc, ship, total: afterDisc + ship, count: cart.reduce((n, i) => n + i.qty, 0) };
    }

    /* ----- Varukorg ----- */
    function add(id, size, extra = 0) {
      const p = byId(id);
      if (p.sizes.length && !size) { toast("Välj storlek först"); return; }
      const key = `${id}|${size || ""}|${extra || 0}`;
      const found = cart.find((i) => i.key === key);
      if (found) found.qty += 1; else cart.push({ key, id, size: size || "", qty: 1, extra: extra || 0 });
      save(); toast(`${p.name} tillagd i varukorgen`); openDrawer();
    }
    function setQty(key, qty) { const i = cart.find((x) => x.key === key); if (!i) return; i.qty = qty; if (i.qty <= 0) cart = cart.filter((x) => x.key !== key); save(); }

    /* ----- Drawer ----- */
    const backdrop = document.createElement("div"); backdrop.className = "drawer-backdrop";
    const drawer = document.createElement("aside"); drawer.className = "drawer"; drawer.setAttribute("aria-label", "Varukorg");
    document.body.append(backdrop, drawer);
    function openDrawer() { drawer.classList.add("is-open"); backdrop.classList.add("is-open"); }
    function closeDrawer() { drawer.classList.remove("is-open"); backdrop.classList.remove("is-open"); }
    backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
    window.IFKShop = { open: openDrawer, add };

    function renderDrawer() {
      const t = totals();
      drawer.innerHTML = `
        <div class="drawer__head"><h2>Varukorg${t.count ? ` (${t.count})` : ""}</h2><button class="close" id="drawer-close" aria-label="Stäng">×</button></div>
        <div class="drawer__body">
          ${cart.length ? cart.map((i) => { const p = byId(i.id); return `
            <div class="cart-item">
              ${ph(p.name, "", p.img)}
              <div><b>${esc(p.name)}</b><small>${i.size ? `${esc(i.size)} · ` : ""}${money(unit(i))}</small>
                <div class="qty"><button data-q="${esc(i.key)}" data-d="-1" aria-label="Minska">−</button><span>${i.qty}</span><button data-q="${esc(i.key)}" data-d="1" aria-label="Öka">+</button></div>
                <button class="cart-item__remove" data-rm="${esc(i.key)}">Ta bort</button></div>
              <div class="cart-item__price">${money(unit(i) * i.qty)}</div>
            </div>`; }).join("") + upsell()
          : `<p class="empty">Varukorgen är tom.<br><a href="${root}shop.html">Till shoppen</a></p>`}
          ${cart.length ? `<div class="discount-row"><input id="drawer-code" placeholder="Rabattkod" value="${esc(discount)}" aria-label="Rabattkod"><button class="btn btn--dark btn--sm" id="drawer-apply" type="button">Använd</button></div>
            ${validCode(discount) ? `<p class="notice notice--ok" style="margin:0">Koden ${esc(D.promo.code)} ger ${D.promo.percent} % rabatt.</p>` : `<p style="font-size:.85rem;color:var(--muted);margin:0">Tips: koden <b>${esc(D.promo.code)}</b> ger ${D.promo.percent} % på hela ordern.</p>`}` : ""}
        </div>
        <div class="drawer__foot">
          <div class="totals">
            <div><span>Delsumma</span><span>${money(t.sub)}</span></div>
            ${t.disc ? `<div class="disc"><span>Rabatt ${D.promo.percent} %</span><span>−${money(t.disc)}</span></div>` : ""}
            <div><span>Frakt</span><span>${t.ship ? money(t.ship) : "Beräknas i kassan"}</span></div>
            <div class="grand"><span>Totalt</span><span>${money(t.total)}</span></div>
          </div>
          <a class="btn btn--primary btn--block" href="${root}shop.html#kassa" id="drawer-checkout" ${cart.length ? "" : "aria-disabled='true' style='opacity:.5;pointer-events:none'"}>Till kassan</a>
        </div>`;
      $("#drawer-close").addEventListener("click", closeDrawer);
      $$("[data-q]", drawer).forEach((b) => b.addEventListener("click", () => { const i = cart.find((x) => x.key === b.dataset.q); setQty(b.dataset.q, i.qty + Number(b.dataset.d)); }));
      $$("[data-rm]", drawer).forEach((b) => b.addEventListener("click", () => setQty(b.dataset.rm, 0)));
      $$("[data-upsell]", drawer).forEach((b) => b.addEventListener("click", () => { const p = byId(b.dataset.upsell); const key = `${p.id}||0`; const f = cart.find((i) => i.key === key); if (f) f.qty++; else cart.push({ key, id: p.id, size: "", qty: 1, extra: 0 }); save(); toast(`${p.name} tillagd`); }));
      const apply = $("#drawer-apply"); if (apply) apply.addEventListener("click", () => applyCode($("#drawer-code").value));
      const chk = $("#drawer-checkout"); if (chk) chk.addEventListener("click", () => { closeDrawer(); if (document.body.dataset.page === "shop") { document.getElementById("kassa").scrollIntoView({ behavior: "smooth" }); } });
    }
    /* Merförsäljning i varukorgen: föreslå en billig supporterpryl som inte redan ligger i korgen */
    function upsell() {
      const cands = D.products.filter((p) => p.cat === "Supporter" && !p.sizes.length && p.price <= 250 && !cart.some((i) => i.id === p.id));
      const p = cands[0]; if (!p) return "";
      return `<div class="upsell"><div>${ph(p.name, "", p.img)}</div><div><b>Komplettera med ${esc(p.name)}</b><span>${money(p.price)} · passar till allt i blått</span></div><button class="btn btn--dark btn--sm" type="button" data-upsell="${esc(p.id)}">Lägg till</button></div>`;
    }
    function applyCode(v) {
      if (validCode(v)) { discount = v.trim().toUpperCase(); save(); toast(`${D.promo.percent} % rabatt tillagd`); }
      else { discount = ""; save(); toast("Ogiltig rabattkod"); }
    }
    renderDrawer();

    /* ----- Produktgrid (bara på shopsidan) ----- */
    const grid = $("#products");
    if (grid) {
      const cats = ["Alla", ...new Set(products.map((p) => p.cat))];
      const filt = $("#shop-filters");
      let active = "Alla";
      const hashCat = decodeURIComponent((location.hash.match(/^#kat-(.+)$/) || [])[1] || "");
      if (cats.includes(hashCat)) active = hashCat;
      filt.innerHTML = cats.map((c) => `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === active}">${esc(c)}</button>`).join("");
      filt.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cat]"); if (!b) return;
        active = b.dataset.cat; $$("[data-cat]", filt).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderGrid();
      });
      const selectedSize = {};
      function renderGrid() {
        const list = products.filter((p) => active === "Alla" || p.cat === active);
        grid.innerHTML = list.map((p) => `
          <article class="product" id="p-${esc(p.id)}">
            ${p.badge ? `<span class="product__badge">${esc(p.badge)}</span>` : ""}
            ${p.stock !== undefined && p.stock <= 5 ? `<span class="product__badge product__badge--low">Endast ${p.stock} kvar</span>` : ""}
            ${ph(p.name, "", p.img)}
            <div class="product__body">
              <span class="product__cat">${esc(p.cat)}</span>
              <span class="product__name">${esc(p.name)}</span>
              <span class="product__price">${money(p.price)}${p.compareAt ? `<s>${money(p.compareAt)}</s>` : ""}</span>
              <p style="font-size:.85rem;color:var(--muted);margin:0 0 6px">${esc(p.desc)}</p>
              ${p.sizes.length ? `<div class="product__opts" role="group" aria-label="Storlek">${p.sizes.map((s) => `<button class="size" type="button" data-size="${esc(s)}" data-pid="${esc(p.id)}" aria-pressed="${selectedSize[p.id] === s}">${esc(s)}</button>`).join("")}</div>` : ""}
              <button class="btn btn--primary btn--sm" type="button" data-add="${esc(p.id)}">Lägg i varukorg</button>
            </div>
          </article>`).join("");
      }
      grid.addEventListener("click", (e) => {
        const s = e.target.closest("[data-size]");
        if (s) { selectedSize[s.dataset.pid] = s.dataset.size; $$(`[data-pid="${s.dataset.pid}"]`, grid).forEach((x) => x.setAttribute("aria-pressed", String(x === s))); return; }
        const a = e.target.closest("[data-add]");
        if (a) add(a.dataset.add, selectedSize[a.dataset.add]);
      });
      renderGrid();
    }

    /* ----- Kassa ----- */
    const form = $("#checkout-form");
    function renderSummary() {
      const el = $("#order-summary"); if (!el) return;
      const t = totals();
      el.innerHTML = `
        <div class="card summary">
          <h3>Din order</h3>
          ${cart.length ? cart.map((i) => { const p = byId(i.id); return `<div style="display:flex;justify-content:space-between;gap:10px;font-size:.92rem;padding:6px 0;border-bottom:1px solid var(--line)"><span>${i.qty} × ${esc(p.name)}${i.size ? ` (${esc(i.size)})` : ""}</span><span>${money(unit(i) * i.qty)}</span></div>`; }).join("") : `<p class="empty" style="padding:16px 0">Varukorgen är tom.</p>`}
          <div class="discount-row"><input id="code-input" placeholder="Rabattkod" value="${esc(discount)}" aria-label="Rabattkod"><button class="btn btn--dark btn--sm" type="button" id="code-apply">Använd</button></div>
          <div class="totals" style="margin-top:8px">
            <div><span>Delsumma</span><span>${money(t.sub)}</span></div>
            ${t.disc ? `<div class="disc"><span>Rabatt ${esc(discount)}</span><span>−${money(t.disc)}</span></div>` : ""}
            <div><span>Frakt</span><span>${t.ship ? money(t.ship) : "0 kr"}</span></div>
            <div class="grand"><span>Att betala</span><span>${money(t.total)}</span></div>
          </div>
          ${t.sub > 0 && t.sub - t.disc < D.shop.freeShippingFrom && ($("input[name=delivery]:checked") || {}).value !== "pickup" ? `<p style="font-size:.82rem;color:var(--muted);margin:10px 0 0">Handla för ${money(D.shop.freeShippingFrom - (t.sub - t.disc))} till så bjuder vi på frakten.</p>` : ""}
        </div>`;
      $("#code-apply").addEventListener("click", () => applyCode($("#code-input").value));
      $("#code-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); applyCode(e.target.value); } });
    }
    if (form) {
      renderSummary();
      $$("input[name=delivery]", form).forEach((r) => r.addEventListener("change", () => { renderSummary(); renderDrawer(); }));
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!cart.length) { toast("Varukorgen är tom"); return; }
        if (!form.reportValidity()) return;
        const f = Object.fromEntries(new FormData(form).entries());
        const t = totals();
        const lines = cart.map((i) => { const p = byId(i.id); return `${i.qty} x ${p.name}${i.size ? ` (${i.size})` : ""} – ${money(unit(i) * i.qty)}`; });
        const orderNo = `IFK-${Date.now().toString(36).toUpperCase()}`;
        const text = [
          `Order ${orderNo}`, "", ...lines, "",
          `Delsumma: ${money(t.sub)}`, t.disc ? `Rabatt (${discount}): -${money(t.disc)}` : null, `Frakt: ${money(t.ship)}`, `Totalt: ${money(t.total)}`, "",
          `Namn: ${f.name}`, `E-post: ${f.email}`, `Telefon: ${f.phone}`,
          `Leverans: ${f.delivery === "pickup" ? "Hämtas på kansliet" : `Post till ${f.address}, ${f.zip} ${f.city}`}`,
          `Betalning: ${f.payment === "swish" ? `Swish till ${D.club.swish}` : "Faktura via e-post"}`,
          f.note ? `Meddelande: ${f.note}` : null
        ].filter((x) => x !== null).join("\n");
        const btn = $("#place-order"); btn.disabled = true; btn.textContent = "Skickar…";
        let sent = false;
        if (D.shop.orderEndpoint) {
          try {
            const r = await fetch(D.shop.orderEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ orderNo, ...f, items: lines, total: t.total, discount: discount || "", message: text }) });
            sent = r.ok;
          } catch { sent = false; }
        }
        if (!sent) {
          location.href = `mailto:${encodeURIComponent(D.shop.orderEmail)}?subject=${encodeURIComponent(`Beställning ${orderNo}`)}&body=${encodeURIComponent(text)}`;
        }
        cart = []; discount = ""; save();
        const done = $("#checkout-done");
        done.hidden = false; form.hidden = true;
        done.innerHTML = `<div class="notice notice--ok"><b>Tack för din beställning, ${esc(f.name.split(" ")[0])}!</b><br>Ordernummer <b>${orderNo}</b>. ${sent ? "Vi har tagit emot ordern och hör av oss med bekräftelse." : "Ditt e-postprogram öppnas med ordern förifylld. Skicka mejlet så bekräftar vi inom en arbetsdag."}${f.payment === "swish" ? `<br>Swisha <b>${money(t.total)}</b> till <b>${esc(D.club.swish)}</b> och ange ${orderNo} som meddelande.` : ""}</div>`;
        done.scrollIntoView({ behavior: "smooth", block: "center" });
        btn.disabled = false; btn.textContent = "Slutför beställning";
      });
    }
  });
})();
