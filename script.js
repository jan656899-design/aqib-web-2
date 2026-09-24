(() => {
  const NAME_KEY = "aqibs-web2-student";

  const state = {
    student: localStorage.getItem(NAME_KEY) || "",
    classId: null,
    stream: null,
    category: "notes",
    subject: null,
    query: "",
  };

  const els = {
    gate: document.getElementById("gate"),
    landing: document.getElementById("landing"),
    desk: document.getElementById("desk"),
    crumbPath: document.getElementById("crumb-path"),
    streamRow: document.getElementById("stream-row"),
    streamChips: document.getElementById("stream-chips"),
    subjectRow: document.getElementById("subject-row"),
    results: document.getElementById("results"),
    search: document.getElementById("search"),
    toast: document.getElementById("toast"),
    nameForm: document.getElementById("name-form"),
    fullName: document.getElementById("full-name"),
    nameError: document.getElementById("name-error"),
    welcome: document.getElementById("welcome-line"),
  };

  let toastTimer;

  function isFullName(value) {
    const parts = value.trim().split(/\s+/).filter((part) => /[\p{L}]/u.test(part));
    return parts.length >= 2 && value.trim().length >= 5;
  }

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [classId, stream, subject] = raw.split("/").filter(Boolean);
    return {
      classId: classId || null,
      stream: stream || null,
      subject: subject || null,
    };
  }

  function setHash() {
    if (!state.student) {
      history.replaceState(null, "", "#/");
      return;
    }
    if (!state.classId) {
      history.replaceState(null, "", "#/class");
      return;
    }
    const parts = [state.classId];
    if (state.stream) parts.push(state.stream);
    if (state.subject) parts.push(state.subject);
    const path = `#/${parts.join("/")}`;
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
    if (!data || !state.subject) return [];
    const subjects = visibleSubjects();
    const bucket = data[state.category] || [];
    return bucket.filter((item) => {
      if (item.subject !== state.subject) return false;
      const subj = subjects.find((s) => s.id === item.subject) || { name: subjectName(item.subject) };
      return matchesQuery(item, subj);
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

  function openResource(url) {
    if (url) {
      window.open(url, "_blank", "noopener");
      return;
    }
    showToast("This file is not attached yet.");
  }

  function renderCrumbs() {
    const data = klass();
    if (!data) {
      els.crumbPath.textContent = "";
      return;
    }
    const stream = data.streams?.find((s) => s.id === state.stream);
    const subject = state.subject ? subjectName(state.subject) : null;
    const bits = [data.label];
    if (stream) bits.push(stream.name);
    if (subject) bits.push(subject);
    els.crumbPath.textContent = `/ ${bits.join(" / ")}`;
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
    if (!state.subject) {
      els.subjectRow.innerHTML = "";
      return;
    }
    els.subjectRow.innerHTML = subjects
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
    if (state.category === "notes") return `Chapter ${item.chapter} · official PDF`;
    if (state.category === "papers") return `${item.kind} · ${item.year}`;
    return `${item.kind} · official book`;
  }

  function renderSubjectPicker() {
    const subjects = visibleSubjects();
    document.getElementById("tab-notes").textContent = "Notes";
    document.getElementById("tab-papers").textContent = "Papers";
    document.getElementById("tab-books").textContent = "Books";
    els.results.innerHTML = `
      <div class="empty">
        <p>Select your subject. Notes, papers and books open only after that.</p>
        <div class="subject-grid">
          ${subjects
            .map(
              (subject) => `
              <button type="button" class="subject-tile" data-subject="${subject.id}">
                ${subject.name}
              </button>`
            )
            .join("")}
        </div>
      </div>`;
  }

  function renderResults() {
    if (!state.subject) {
      renderSubjectPicker();
      return;
    }

    const items = filteredItems();
    const counts = {
      notes: (klass()?.notes || []).filter((item) => item.subject === state.subject).length,
      papers: (klass()?.papers || []).filter((item) => item.subject === state.subject).length,
      books: (klass()?.books || []).filter((item) => item.subject === state.subject).length,
    };
    document.getElementById("tab-notes").textContent = `Notes (${counts.notes})`;
    document.getElementById("tab-papers").textContent = `Papers (${counts.papers})`;
    document.getElementById("tab-books").textContent = `Books (${counts.books})`;

    if (!items.length) {
      const label = state.category === "notes" ? "notes" : state.category === "papers" ? "papers" : "books";
      els.results.innerHTML = `
        <div class="empty">
          <p>No ${label} match that search in ${subjectName(state.subject)}. Clear the search box, or open another tab.</p>
        </div>`;
      return;
    }

    const rows = items
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

    els.results.innerHTML = `
      <section class="subject-block">
        <h2>${subjectName(state.subject)}</h2>
        <ul class="item-list">${rows}</ul>
      </section>`;
  }

  function render() {
    if (!state.student) {
      els.gate.hidden = false;
      els.landing.hidden = true;
      els.desk.hidden = true;
      document.title = "AQIBS WEB2 — write your name";
      setHash();
      return;
    }

    const data = klass();
    if (!data) {
      els.gate.hidden = true;
      els.landing.hidden = false;
      els.desk.hidden = true;
      els.welcome.textContent = `Welcome, ${state.student}. Choose your class.`;
      document.title = "AQIBS WEB2 — choose class";
      setHash();
      return;
    }

    if (data.streams && !state.stream) state.stream = data.streams[0].id;
    if (!data.streams) state.stream = null;
    if (state.subject && !visibleSubjects().some((s) => s.id === state.subject)) {
      state.subject = null;
    }

    els.gate.hidden = true;
    els.landing.hidden = true;
    els.desk.hidden = false;
    document.title = state.subject
      ? `${subjectName(state.subject)} · ${data.label} — AQIBS WEB2`
      : `${data.label} — AQIBS WEB2`;
    renderCrumbs();
    renderStreams();
    renderSubjects();
    renderResults();
    setHash();
  }

  function applyRoute() {
    if (!state.student) {
      render();
      return;
    }
    const route = parseHash();
    if (route.classId === "class") {
      state.classId = null;
      state.stream = null;
      state.subject = null;
      render();
      return;
    }
    state.classId = STUDY_DATA[route.classId] ? route.classId : null;
    const data = klass();
    if (data?.streams?.some((s) => s.id === route.stream)) {
      state.stream = route.stream;
      state.subject = route.subject || null;
    } else if (data && !data.streams) {
      state.stream = null;
      state.subject = route.stream || null;
    } else {
      state.stream = null;
      state.subject = null;
    }
    if (els.search) els.search.value = "";
    state.query = "";
    render();
  }

  els.nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = els.fullName.value.trim().replace(/\s+/g, " ");
    if (!isFullName(value)) {
      els.nameError.hidden = false;
      els.fullName.focus();
      return;
    }
    els.nameError.hidden = true;
    state.student = value;
    localStorage.setItem(NAME_KEY, value);
    render();
  });

  document.querySelectorAll("[data-class]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.classId = btn.dataset.class;
      state.stream = null;
      state.category = "notes";
      state.subject = null;
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
    state.subject = null;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("change-student").addEventListener("click", () => {
    localStorage.removeItem(NAME_KEY);
    state.student = "";
    state.classId = null;
    state.stream = null;
    state.subject = null;
    els.fullName.value = "";
    render();
    els.fullName.focus();
  });

  els.streamChips.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-stream]");
    if (!btn) return;
    state.stream = btn.dataset.stream;
    state.subject = null;
    render();
  });

  function pickSubject(id) {
    state.subject = id;
    render();
  }

  els.subjectRow.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-subject]");
    if (!btn) return;
    pickSubject(btn.dataset.subject);
  });

  els.results.addEventListener("click", (event) => {
    const subjectBtn = event.target.closest("[data-subject]");
    if (subjectBtn) {
      pickSubject(subjectBtn.dataset.subject);
      return;
    }
    const btn = event.target.closest("[data-action]");
    if (!btn) return;
    openResource(btn.dataset.url);
  });

  document.querySelector(".tabs").addEventListener("click", (event) => {
    const tab = event.target.closest("[data-cat]");
    if (!tab) return;
    event.preventDefault();
    state.category = tab.dataset.cat;
    state.query = "";
    if (els.search) els.search.value = "";
    document.querySelectorAll(".tabs [role='tab']").forEach((el) => {
      el.setAttribute("aria-selected", String(el === tab));
    });
    renderResults();
    renderCrumbs();
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderResults();
  });

  window.addEventListener("hashchange", applyRoute);
  applyRoute();
})();
