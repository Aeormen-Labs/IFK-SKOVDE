/* IFK Skövde FK – lagringslager för inloggning, fantasy, tips och röster.
   Två lägen:
   - "firebase": när IFK.firebase.apiKey är ifyllt. Firebase Auth + Firestore.
   - "local":    demoläge. Allt sparas i besökarens webbläsare (localStorage).
   Alla sidor pratar bara med window.IFKBackend, aldrig med Firebase direkt. */
(function () {
  const D = window.IFK;
  const cfg = D.firebase || {};
  const useFirebase = !!cfg.apiKey;
  const authListeners = [];
  let user = null;          // { uid, email, name }
  let fb = null;            // firebase namespace (compat)
  let db = null;

  /* ---------- Lokal databas (demoläge) ---------- */
  const LS_DB = "ifk_db_v1", LS_USER = "ifk_user_v1";
  const ldb = {
    read() { try { return JSON.parse(localStorage.getItem(LS_DB)) || {}; } catch { return {}; } },
    write(o) { localStorage.setItem(LS_DB, JSON.stringify(o)); },
    get(path) { return this.read()[path] || null; },
    set(path, data, merge) { const o = this.read(); o[path] = merge && o[path] ? { ...o[path], ...data } : { ...data }; this.write(o); },
    del(path) { const o = this.read(); delete o[path]; this.write(o); },
    list(col) { const o = this.read(); const pre = col + "/"; return Object.keys(o).filter((k) => k.startsWith(pre) && !k.slice(pre.length).includes("/")).map((k) => ({ id: k.slice(pre.length), ...o[k] })); }
  };
  const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };

  /* ---------- Firebase-laddning ---------- */
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  async function initFirebase() {
    const v = "10.12.0";
    await loadScript(`https://www.gstatic.com/firebasejs/${v}/firebase-app-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${v}/firebase-auth-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore-compat.js`);
    fb = window.firebase; fb.initializeApp(cfg); db = fb.firestore();
    fb.auth().onAuthStateChanged(async (u) => {
      if (u) {
        const prof = await getDoc(`users/${u.uid}`);
        user = { uid: u.uid, email: u.email, name: (prof && prof.name) || u.displayName || u.email.split("@")[0] };
        if (!prof) await setDoc(`users/${u.uid}`, { name: user.name, email: u.email, createdAt: Date.now() });
      } else user = null;
      authListeners.forEach((f) => f(user));
    });
  }

  /* ---------- Gemensamt API ---------- */
  async function getDoc(path) {
    if (useFirebase) { const s = await db.doc(path).get(); return s.exists ? s.data() : null; }
    return ldb.get(path);
  }
  async function setDoc(path, data, merge = false) {
    if (useFirebase) { await db.doc(path).set(data, { merge }); return; }
    ldb.set(path, data, merge);
  }
  async function deleteDoc(path) {
    if (useFirebase) { await db.doc(path).delete(); return; }
    ldb.del(path);
  }
  /* list(collection, {where:[field,op,value], orderBy:[field,dir], limit}) */
  async function list(col, opts = {}) {
    if (useFirebase) {
      let q = db.collection(col);
      if (opts.where) q = q.where(...opts.where);
      if (opts.orderBy) q = q.orderBy(...opts.orderBy);
      if (opts.limit) q = q.limit(opts.limit);
      const s = await q.get(); return s.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    let rows = ldb.list(col);
    if (opts.where) { const [f, op, v] = opts.where; rows = rows.filter((r) => op === "==" ? r[f] === v : op === "array-contains" ? (r[f] || []).includes(v) : true); }
    if (opts.orderBy) { const [f, dir] = opts.orderBy; rows.sort((a, b) => (a[f] > b[f] ? 1 : -1) * (dir === "desc" ? -1 : 1)); }
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return rows;
  }

  async function signUp(email, password, name) {
    email = email.trim().toLowerCase();
    if (useFirebase) {
      const c = await fb.auth().createUserWithEmailAndPassword(email, password);
      await c.user.updateProfile({ displayName: name });
      await setDoc(`users/${c.user.uid}`, { name, email, createdAt: Date.now() });
      return;
    }
    const accounts = ldb.get("_accounts") || {};
    if (accounts[email]) throw new Error("Det finns redan ett konto med den e-postadressen.");
    const uid = "u_" + hash(email);
    accounts[email] = { uid, pw: hash(password), name }; ldb.set("_accounts", accounts);
    await setDoc(`users/${uid}`, { name, email, createdAt: Date.now() });
    user = { uid, email, name }; localStorage.setItem(LS_USER, JSON.stringify(user)); authListeners.forEach((f) => f(user));
  }
  async function signIn(email, password) {
    email = email.trim().toLowerCase();
    if (useFirebase) { await fb.auth().signInWithEmailAndPassword(email, password); return; }
    const a = (ldb.get("_accounts") || {})[email];
    if (!a || a.pw !== hash(password)) throw new Error("Fel e-post eller lösenord.");
    user = { uid: a.uid, email, name: a.name }; localStorage.setItem(LS_USER, JSON.stringify(user)); authListeners.forEach((f) => f(user));
  }
  async function signInGoogle() {
    if (!useFirebase) throw new Error("Google-inloggning kräver Firebase.");
    await fb.auth().signInWithPopup(new fb.auth.GoogleAuthProvider());
  }
  async function resetPassword(email) {
    if (!useFirebase) throw new Error("I demoläget finns ingen återställning. Skapa ett nytt konto.");
    await fb.auth().sendPasswordResetEmail(email.trim());
  }
  async function signOut() {
    if (useFirebase) { await fb.auth().signOut(); return; }
    user = null; localStorage.removeItem(LS_USER); authListeners.forEach((f) => f(null));
  }
  function onAuth(fn) { authListeners.push(fn); if (ready) fn(user); }
  const isAdmin = () => !!user && (D.admins || []).map((e) => e.toLowerCase()).includes(user.email.toLowerCase());
  const fixtureId = (f) => "fx-" + f.date;

  let ready = false;
  const readyPromise = (async () => {
    if (useFirebase) { try { await initFirebase(); } catch (e) { console.error("Firebase kunde inte laddas", e); } }
    else { try { user = JSON.parse(localStorage.getItem(LS_USER)); } catch { user = null; } }
    ready = true;
    if (!useFirebase) authListeners.forEach((f) => f(user));
  })();

  window.IFKBackend = { mode: useFirebase ? "firebase" : "local", ready: readyPromise, user: () => user, onAuth, signUp, signIn, signInGoogle, signOut, resetPassword, isAdmin, getDoc, setDoc, deleteDoc, list, fixtureId };
})();
