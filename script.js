document.addEventListener("DOMContentLoaded", () => {
  // --- image loader ---
  const imgs = document.querySelectorAll(".imgcrop1");
  imgs.forEach((img) => {
    if (img.complete) img.classList.add("loaded");
    else img.addEventListener("load", () => img.classList.add("loaded"));
  });

  // elements
  const imageEls = Array.from(document.querySelectorAll(".images"));
  const filterEls = Array.from(document.querySelectorAll(".sideSub"));
  const sideDomEls = Array.from(document.querySelectorAll(".sideDom"));
  const sideButton = document.getElementById("sideButton");

  // --- sideButton hover text/icon (used by inline onmouseenter/onmouseleave) ---
  // expose globally because you use inline attributes
  window.category = () => {
    if (!sideButton) return;
    sideButton.className = "";
    sideButton.textContent = "Categories";
    sideButton.style.fontFamily = "typewriter";
  };
  window.sideIcon = () => {
    if (!sideButton) return;
    sideButton.textContent = "";
    sideButton.className = "fa-brands fa-fulcrum";
    sideButton.style.fontFamily = "FontAwesome";
  };

  // --- dropdown open/close on header click (keeps your existing .cat.active logic) ---
  sideDomEls.forEach((dom) => {
    dom.addEventListener("click", () => {
      dom.parentElement.classList.toggle("active");
    });
    // keyboard support
    dom.setAttribute("tabindex", "0");
    dom.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dom.parentElement.classList.toggle("active");
      }
    });
  });

  // --- filter state (single selection per category) ---
  const activeFilters = {}; // e.g. { aesthetic: 'black', style: 'existential' }

  // apply filters to images
  function applyFilters() {
    const first = new Map();

    // 1️⃣ Measure current positions (only visible ones)
    imageEls.forEach((el) => {
      if (getComputedStyle(el).display !== "none") {
        first.set(el, el.getBoundingClientRect());
      }
    });

    // 2️⃣ Apply visibility (display + fade state)
    imageEls.forEach((img) => {
      let visible = true;

      for (const key in activeFilters) {
        const want = activeFilters[key];
        if (!want) continue;

        const attr = img.dataset[key];
        if (!attr || !attr.split(/\s+/).includes(want)) {
          visible = false;
          break;
        }
      }

      if (!visible) {
        img.classList.add("hidden");
        img.style.display = "none";
      } else {
        img.style.display = "";
        img.classList.remove("hidden");
      }
    });

    // 3️⃣ Force layout
    void document.body.offsetHeight;

    // 4️⃣ Animate movement using CSS variables (NOT transform overwrite)
    imageEls.forEach((el) => {
      if (getComputedStyle(el).display === "none") return;

      const last = el.getBoundingClientRect();
      const prev = first.get(el);

      if (!prev) return;

      const dx = prev.left - last.left;
      const dy = prev.top - last.top;

      if (!dx && !dy) return;

      el.style.transition = "none";
      el.style.setProperty("--tx", `${dx}px`);
      el.style.setProperty("--ty", `${dy}px`);

      requestAnimationFrame(() => {
        el.style.transition = "transform 400ms ease, opacity 400ms ease";
        el.style.setProperty("--tx", "0px");
        el.style.setProperty("--ty", "0px");
      });
    });
  }
  // toggle filter helper
  function toggleFilter(type, value) {
    if (activeFilters[type] === value) delete activeFilters[type];
    else activeFilters[type] = value;

    // update UI classes on filter buttons
    filterEls.forEach((el) => {
      const [t, v] = el.dataset.filter.split(":");
      el.classList.toggle("active", activeFilters[t] === v);
    });

    requestAnimationFrame(() => applyFilters());
  }

  // attach click + keyboard handlers to filter items
  filterEls.forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");

    el.addEventListener("click", () => {
      const [type, value] = el.dataset.filter.split(":");
      toggleFilter(type, value);
    });

    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const [type, value] = el.dataset.filter.split(":");
        toggleFilter(type, value);
      }
    });
  });

  // initial apply (show all)
  requestAnimationFrame(() => applyFilters());

  // --- image hover scaling logic (unchanged except uses imageEls) ---
  document.querySelectorAll(".images").forEach((el) => {
    let safeScale = 1.08;

    el.addEventListener("pointerenter", () => {
      if (el.classList.contains("hidden")) return; // don't compute for hidden items
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;

      const spaceLeft = rect.left;
      const spaceRight = vw - rect.right;
      const minSpace = Math.min(spaceLeft, spaceRight);

      const extra = (rect.width * (1.105 - 1)) / 2;
      const reduction = Math.max(0, extra - minSpace);
      safeScale = 1.08 - reduction / rect.width;
      safeScale = Math.max(1.02, Math.min(1.08, safeScale));

      const centerBias = (rect.left + rect.width / 2 - vw / 2) / (vw / 2);
      const originX = 50 + Math.max(-0.4, Math.min(0.4, centerBias)) * 30;

      el.style.transformOrigin = `${originX}% 50%`;
      el.style.setProperty("--scale", safeScale);
    });

    el.addEventListener("pointerleave", () => {
      el.style.transformOrigin = "50% 50%";
      el.style.setProperty("--scale", 1);
    });
  });
});
