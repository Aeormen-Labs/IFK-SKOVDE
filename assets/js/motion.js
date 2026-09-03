/* IFK Skövde FK – rörelse: avslöja vid scroll, räkna upp siffror, tabellpuls */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("ifk:ready", () => {
    // Markera allt som ska animeras in
    const targets = document.querySelectorAll(".section > .container > *, .card, .team, .product, .tl, .pillar, .stat, .step, .news article, .quick a, .person");
    if (reduce || !("IntersectionObserver" in window)) return;
    targets.forEach((el, i) => { if (!el.closest(".hero")) { el.classList.add("reveal"); el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`; } });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    // Säkerhetsnät: om något inte hunnit synas (utskrift, långsam enhet, ovanlig scroll) visa allt efter 3 s
    setTimeout(() => document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => el.classList.add("is-in")), 3000);
    window.addEventListener("beforeprint", () => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in")));

    // Räkna upp siffror i .stat b och [data-count]
    const nums = document.querySelectorAll(".stat b, [data-count]");
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return; io2.unobserve(e.target);
        const el = e.target, raw = el.dataset.count ?? el.textContent;
        const m = String(raw).match(/^([^\d]*)([\d\s]+)(.*)$/); if (!m) return;
        const end = parseInt(m[2].replace(/\s/g, ""), 10); if (isNaN(end)) return;
        const t0 = performance.now(), dur = 1100;
        const step = (t) => { const k = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - k, 3))); el.textContent = m[1] + v.toLocaleString("sv-SE") + m[3]; if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    nums.forEach((n) => io2.observe(n));
  });
  // Tabellrad-puls när tabellen renderats (main.js skickar ifk:table)
  document.addEventListener("ifk:table", (e) => { const row = e.detail && e.detail.querySelector("tr.is-ifk"); if (row && !reduce) { row.classList.add("pulse"); } });
})();
