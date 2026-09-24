(() => {
  const state = {
    classId: null,
    stream: null,
    category: "notes",
    subject: "all",
    query: "",
  };

  const els = {
    landing: document.getElementById("landing"),
    desk: document.getElementById("desk"),
    crumbPath: document.getElementById("crumb-path"),
    streamRow: document.getElementById("stream-row"),
    streamChips: document.getElementById("stream-chips"),
    subjectRow: document.getElementById("subject-row"),
    results: document.getElementById("results"),
    search: document.getElementById("search"),
    toast: document.getElementById("toast"),
  };

  let toastTimer;

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [classId, stream] = raw.split("/").filter(Boolean);
    return { classId: classId || null, stream: stream || null };
  }

  function setHash() {
    if (!state.classId) {
      history.replaceState(null, "", "#/");
      return;
    }
    const path = state.stream ? `#/${state.classId}/${state.stream}` : `#/${state.classId}`;
    if (location.hash !== path) history.replaceState(null, "", path);
  }

  function klass() {
    return STUDY_DATA[state.classId] || null;
  }

  function subjectName(id) {
    const found = klass()?.subjects.find((s) => s.id === id);
    return found ? found.name : id;
  }

  function inStream(subject) {
    if (!state.stream) return true;
    if (subject.stream === "all" || subject.stream == null) return true;
    return Array.isArray(subject.stream) && subject.stream.includes(state.stream);
  }

  function visibleSubjects() {
    return (klass()?.subjects || []).filter(inStream);
  }

  function matchesQuery(item, subject) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    const hay = [item.title, item.chapter, item.year, item.kind, subject.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function filteredItems() {
    const data = klass();
    if (!data) return [];
    const subjects = visibleSubjects();
    const allowed = new Set(subjects.map((s) => s.id));
    return (data[state.category] || []).filter((item) => {
      if (!allowed.has(item.subject)) return false;
      if (state.subject !== "all" && item.subject !== state.subject) return false;
      const subj = subjects.find((s) => s.id === item.subject);
      return matchesQuery(item, subj || { name: item.subject });
    });
  }

  function showToast(message) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 2800);
  }

  function openResource(url, action) {
    if (url) {
      window.open(url, "_blank", "noopener");
      return;
    }
    showToast(
      action === "download"
        ? "PDF not attached yet. Drop a link on this item in data.js."
        : "Online view is empty until a PDF URL is added in data.js."
    );
  }

  function renderCrumbs() {
    const data = klass();
    if (!data) {
      els.crumbPath.textContent = "";
      return;
    }
    const stream = data.streams?.find((s) => s.id === state.stream);
    els.crumbPath.innerHTML = stream
      ? `/ ${data.label} / ${stream.name}`
      : `/ ${data.label}`;
  }

  function renderStreams() {
    const data = klass();
    if (!data?.streams) {
      els.streamRow.hidden = true;
      els.streamChips.innerHTML = "";
      return;
    }
    els.streamRow.hidden = false;
    els.streamChips.innerHTML = data.streams
      .map(
        (stream) => `
        <button
          type="button"
          class="chip"
          role="tab"
          data-stream="${stream.id}"
          aria-selected="${state.stream === stream.id}"
        >${stream.name}</button>`
      )
      .join("");
  }

  function renderSubjects() {
    const subjects = visibleSubjects();
    const chips = [
      { id: "all", name: "All subjects" },
      ...subjects,
    ];
    els.subjectRow.innerHTML = chips
      .map(
        (subject) => `
        <button
          type="button"
          class="chip"
          data-subject="${subject.id}"
          aria-pressed="${state.subject === subject.id}"
        >${subject.name}</button>`
      )
      .join("");
  }

  function itemMeta(item) {
    if (state.category === "notes") return `Chapter ${item.chapter}`;
    if (state.category === "papers") return `${item.kind} · ${item.year}`;
    return item.kind;
  }

  function renderResults() {
    const items = filteredItems();
    if (!items.length) {
      els.results.innerHTML = `
        <div class="empty">
          <p>Nothing matches that search in this class. Try another subject or clear the box.</p>
        </div>`;
      return;
    }

    const groups = new Map();
    items.forEach((item) => {
      if (!groups.has(item.subject)) groups.set(item.subject, []);
      groups.get(item.subject).push(item);
    });

    els.results.innerHTML = [...groups.entries()]
      .map(([subjectId, group]) => {
        const rows = group
          .map(
            (item) => `
            <li class="item">
              <div>
                <p class="item-kicker">${itemMeta(item)}</p>
                <p class="item-title">${item.title}</p>
              </div>
              <div class="item-actions">
                <button type="button" class="btn" data-action="view" data-url="${item.viewUrl || ""}">View online</button>
                <button type="button" class="btn primary" data-action="download" data-url="${item.downloadUrl || ""}">Download PDF</button>
              </div>
            </li>`
          )
          .join("");
        return `
          <section class="subject-block">
            <h2>${subjectName(subjectId)}</h2>
            <ul class="item-list">${rows}</ul>
          </section>`;
      })
      .join("");
  }

  function render() {
    const data = klass();
    if (!data) {
      els.landing.hidden = false;
      els.desk.hidden = true;
      document.title = "AQIB' WEB 2 — JKBOSE Study Portal";
      return;
    }

    if (data.streams && !state.stream) state.stream = data.streams[0].id;
    if (!data.streams) state.stream = null;
    if (state.subject !== "all" && !visibleSubjects().some((s) => s.id === state.subject)) {
      state.subject = "all";
    }

    els.landing.hidden = true;
    els.desk.hidden = false;
    document.title = `${data.label} — AQIB' WEB 2`;
    renderCrumbs();
    renderStreams();
    renderSubjects();
    renderResults();
    setHash();
  }

  function applyRoute() {
    const route = parseHash();
    state.classId = STUDY_DATA[route.classId] ? route.classId : null;
    state.stream = route.stream || null;
    state.subject = "all";
    state.query = "";
    els.search.value = "";
    render();
  }

  document.querySelectorAll("[data-class]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.classId = btn.dataset.class;
      state.stream = null;
      state.category = "notes";
      state.subject = "all";
      state.query = "";
      els.search.value = "";
      document.querySelectorAll(".tabs [role='tab']").forEach((tab) => {
        tab.setAttribute("aria-selected", tab.dataset.cat === "notes");
      });
      render();
      els.desk.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.getElementById("change-class").addEventListener("click", () => {
    state.classId = null;
    state.stream = null;
    setHash();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.streamChips.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-stream]");
    if (!btn) return;
    state.stream = btn.dataset.stream;
    state.subject = "all";
    render();
  });

  els.subjectRow.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-subject]");
    if (!btn) return;
    state.subject = btn.dataset.subject;
    render();
  });

  document.querySelector(".tabs").addEventListener("click", (event) => {
    const tab = event.target.closest("[data-cat]");
    if (!tab) return;
    state.category = tab.dataset.cat;
    document.querySelectorAll(".tabs [role='tab']").forEach((el) => {
      el.setAttribute("aria-selected", el === tab);
    });
    render();
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderResults();
  });

  els.results.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;
    openResource(btn.dataset.url, btn.dataset.action);
  });

  window.addEventListener("hashchange", applyRoute);
  applyRoute();
})();
