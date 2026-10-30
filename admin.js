/* ==========================================================================
   NEURAL.CMS // ADMIN COMMAND DECK CONTROLLER
   Strict authentication + Real-time Portfolio CMS + Telemetry + Inbox
   ========================================================================== */

(() => {
  "use strict";

  const CMS = window.NeuralCMS;
  if (!CMS) {
    console.error("NeuralCMS store failed to load.");
    return;
  }

  let cmsData = CMS.loadData();
  let activeTab = "overview";
  let activeSkillFilter = "all";
  let modalSubmitHandler = null;
  let toastTimer = null;

  const TAB_TITLES = {
    overview: "Command Overview",
    profile: "Profile & Hero Telemetry",
    experience: "Experience Timeline CRUD",
    skills: "Skills & AI Arsenal Matrix",
    projects: "Featured Projects Showcase",
    inbox: "Visitor Transmissions Inbox",
    security: "Security & Vault Backup"
  };

  /* -------------------- HELPERS -------------------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTimeAgo(iso) {
    if (!iso) return "Just now";
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function showToast(msg) {
    const el = $("#admin-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  function markSynced(label) {
    const syncEl = $("#sync-status-text");
    if (!syncEl) return;
    const t = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    syncEl.textContent = label || `SYNCED • ${t}`;
  }

  function persistAndRefresh(toastMsg) {
    cmsData = CMS.saveData(cmsData);
    markSynced();
    renderAll();
    if (toastMsg) showToast(toastMsg);
  }

  /* -------------------- 1. AMBIENT NEURAL CANVAS -------------------- */
  function initAdminCanvas() {
    const canvas = $("#admin-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const nodes = [];
    const pointer = { x: -9999, y: -9999, active: false };

    function makeNode() {
      const colors = ["#00f0ff", "#7c5cff", "#1fb5c4", "#10b981"];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.36,
        vy: (Math.random() - 0.5) * 0.36,
        r: 1.2 + Math.random() * 1.8,
        c: colors[Math.floor(Math.random() * colors.length)]
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = w < 700 ? 32 : 58;
      while (nodes.length < target) nodes.push(makeNode());
      if (nodes.length > target) nodes.length = target;
    }

    window.addEventListener("resize", resize);
    resize();

    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const isLight = document.documentElement.getAttribute("data-theme") === "light";

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!reduced) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -15) n.x = w + 15;
          if (n.x > w + 15) n.x = -15;
          if (n.y < -15) n.y = h + 15;
          if (n.y > h + 15) n.y = -15;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = n.x - b.x;
          const dy = n.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 19600) {
            const alpha = (1 - Math.sqrt(d2) / 140) * (isLight ? 0.16 : 0.22);
            ctx.strokeStyle = isLight ? `rgba(8,145,178,${alpha})` : `rgba(0,240,255,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        if (pointer.active) {
          const pdx = pointer.x - n.x;
          const pdy = pointer.y - n.y;
          const pd2 = pdx * pdx + pdy * pdy;
          if (pd2 < 25600) {
            const pAlpha = (1 - Math.sqrt(pd2) / 160) * 0.32;
            ctx.strokeStyle = isLight ? `rgba(109,74,255,${pAlpha})` : `rgba(124,92,255,${pAlpha})`;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = n.c;
        ctx.globalAlpha = isLight ? 0.55 : 0.82;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduced) requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }

  /* -------------------- 2. CLOCK & THEME -------------------- */
  function initClockAndTheme() {
    const clockEl = $("#admin-clock");
    function tick() {
      if (!clockEl) return;
      try {
        const s = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }).format(new Date());
        clockEl.textContent = `DAC ${s}`;
      } catch {
        clockEl.textContent = "DAC UTC+6";
      }
    }
    tick();
    setInterval(tick, 1000);

    const savedTheme = localStorage.getItem("neural_admin_theme");
    const themeBtn = $("#admin-theme-btn");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
    function syncThemeIcon() {
      if (!themeBtn) return;
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      themeBtn.textContent = cur === "dark" ? "☀" : "☾";
    }
    syncThemeIcon();

    themeBtn?.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("neural_admin_theme", next);
      syncThemeIcon();
      renderOverview();
      showToast(next === "dark" ? "Neural Dark Mode Active" : "Clean Light Mode Active");
    });
  }

  /* -------------------- 3. STRICT AUTHENTICATION GATE -------------------- */
  function showLoginView() {
    const loginView = $("#login-view");
    const dashView = $("#dashboard-view");
    if (dashView) dashView.hidden = true;
    if (loginView) loginView.hidden = false;
  }

  async function unlockDashboard() {
    const loginView = $("#login-view");
    const dashView = $("#dashboard-view");
    if (loginView) loginView.hidden = true;
    if (dashView) dashView.hidden = false;

    cmsData = await CMS.syncFromServerIfAvailable();
    populateProfileForm();
    populateCredentialsForm();
    renderAll();
    markSynced("LIVE SYNC READY");
  }

  function initAuthGate() {
    const loginForm = $("#login-form");
    const loginCard = $("#login-card");
    const userInp = $("#login-username");
    const passInp = $("#login-password");
    const togglePassBtn = $("#toggle-pass");
    const rememberChk = $("#login-remember");
    const alertBox = $("#login-alert");
    const btnText = $("#login-btn-text");
    const logoutBtn = $("#logout-btn");

    togglePassBtn?.addEventListener("click", () => {
      if (!passInp) return;
      const isPass = passInp.type === "password";
      passInp.type = isPass ? "text" : "password";
      togglePassBtn.textContent = isPass ? "Hide" : "Show";
    });

    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (alertBox) {
        alertBox.hidden = true;
        alertBox.classList.remove("success");
      }

      const username = userInp?.value.trim() || "";
      const password = passInp?.value || "";
      const remember = rememberChk ? rememberChk.checked : true;

      const result = CMS.login(username, password, remember);
      if (!result.ok) {
        if (alertBox) {
          alertBox.textContent = `⚠ ${result.error}`;
          alertBox.hidden = false;
        }
        if (loginCard) {
          loginCard.classList.remove("shake");
          void loginCard.offsetWidth;
          loginCard.classList.add("shake");
        }
        passInp?.select();
        return;
      }

      if (alertBox) {
        alertBox.textContent = "✓ ACCESS GRANTED — UNLOCKING NEURAL.CMS COMMAND DECK...";
        alertBox.classList.add("success");
        alertBox.hidden = false;
      }
      if (btnText) btnText.textContent = "Unlocking...";

      setTimeout(async () => {
        if (btnText) btnText.textContent = "Authenticate & Unlock";
        if (alertBox) alertBox.hidden = true;
        if (passInp) passInp.value = "";
        await unlockDashboard();
        showToast(`Welcome back, Al Amin Mahfuz (${result.session.user})`);
      }, 320);
    });

    logoutBtn?.addEventListener("click", () => {
      CMS.logout();
      showLoginView();
      showToast("Session locked. Signed out safely.");
    });

    // Check existing authenticated session on page load
    const existing = CMS.getSession();
    if (existing && existing.token) {
      unlockDashboard();
    } else {
      showLoginView();
    }
  }

  /* -------------------- 4. SIDEBAR & TAB NAVIGATION -------------------- */
  function switchTab(tabId) {
    if (!TAB_TITLES[tabId]) return;
    activeTab = tabId;

    $$(".side-link").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    $$(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `tab-${tabId}`);
    });

    const titleEl = $("#active-tab-title");
    if (titleEl) titleEl.textContent = TAB_TITLES[tabId];

    $("#admin-sidebar")?.classList.remove("open");

    if (tabId === "profile") populateProfileForm();
    if (tabId === "security") populateCredentialsForm();
  }

  function initNavigation() {
    $$(".side-link").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab || "overview"));
    });

    $$("[data-goto-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.gotoTab || "overview"));
    });

    const mobileToggle = $("#sidebar-toggle");
    const sidebar = $("#admin-sidebar");
    mobileToggle?.addEventListener("click", () => {
      sidebar?.classList.toggle("open");
    });
  }

  /* -------------------- 5. UNIVERSAL MODAL CONTROLLER -------------------- */
  function openModal(title, fieldsHtml, onSubmit) {
    const modal = $("#cms-modal");
    const titleEl = $("#modal-title");
    const form = $("#modal-form");
    if (!modal || !titleEl || !form) return;

    titleEl.textContent = title;
    form.innerHTML = `
      ${fieldsHtml}
      <div class="form-actions-end">
        <button type="button" id="modal-cancel-btn" class="btn btn-outline btn-sm">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save &amp; Sync</button>
      </div>
    `;
    modalSubmitHandler = onSubmit;
    modal.hidden = false;

    $("#modal-cancel-btn")?.addEventListener("click", closeModal);
    const firstInput = form.querySelector("input, textarea, select");
    firstInput?.focus();
  }

  function closeModal() {
    const modal = $("#cms-modal");
    if (modal) modal.hidden = true;
    modalSubmitHandler = null;
  }

  function initModal() {
    $("#modal-close")?.addEventListener("click", closeModal);
    $("#modal-backdrop")?.addEventListener("click", closeModal);
    $("#modal-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (typeof modalSubmitHandler === "function") {
        modalSubmitHandler(new FormData(e.target));
      }
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  /* -------------------- 6. RENDER OVERVIEW & TELEMETRY CHART -------------------- */
  function renderTelemetryChart(values) {
    const box = $("#telemetry-chart");
    if (!box) return;

    const series = Array.isArray(values) && values.length >= 2 ? values : [12, 18, 16, 22, 25, 29, 34];
    const W = 580;
    const H = 205;
    const padL = 36;
    const padR = 18;
    const padT = 20;
    const padB = 32;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const maxVal = Math.max(...series, 10) * 1.15;
    const pts = series.map((v, idx) => {
      const x = padL + (idx / (series.length - 1)) * plotW;
      const y = padT + plotH - (v / maxVal) * plotH;
      return { x, y, v };
    });

    // Smooth Catmull-Rom / cubic Bezier path
    let lineD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = ((p0.x + p1.x) / 2).toFixed(1);
      lineD += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

    const labels = ["D-6", "D-5", "D-4", "D-3", "D-2", "YEST", "TODAY"];
    const gridLines = [0, 0.5, 1].map((t) => {
      const gy = (padT + plotH * t).toFixed(1);
      const gv = Math.round(maxVal * (1 - t));
      return `
        <line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="rgba(125,165,225,0.14)" stroke-dasharray="4 4" />
        <text x="${padL - 8}" y="${Number(gy) + 4}" text-anchor="end" fill="#667d9c" font-family="JetBrains Mono, monospace" font-size="10">${gv}</text>
      `;
    }).join("");

    const dots = pts.map((p, i) => `
      <g>
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="#040914" stroke="#00f0ff" stroke-width="2.2" />
        <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" fill="#9eb3cf" font-family="JetBrains Mono, monospace" font-size="10">${p.v}</text>
        <text x="${p.x.toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="#667d9c" font-family="JetBrains Mono, monospace" font-size="10">${labels[i] || `D-${series.length - 1 - i}`}</text>
      </g>
    `).join("");

    box.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="7-Cycle Portfolio Engagement Chart">
        <defs>
          <linearGradient id="areaCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.36" />
            <stop offset="65%" stop-color="#7c5cff" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#7c5cff" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="strokeCyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#00f0ff" />
            <stop offset="55%" stop-color="#1fb5c4" />
            <stop offset="100%" stop-color="#7c5cff" />
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaD}" fill="url(#areaCyan)" />
        <path d="${lineD}" fill="none" stroke="url(#strokeCyan)" stroke-width="3" stroke-linecap="round" />
        ${dots}
      </svg>
    `;
  }

  function renderOverview() {
    const analytics = cmsData.analytics || {};
    const messages = Array.isArray(cmsData.messages) ? cmsData.messages : [];
    const unread = messages.filter((m) => !m.read).length;
    const aiQueries = Array.isArray(analytics.aiQueries) ? analytics.aiQueries : [];

    const setTxt = (sel, val) => {
      const el = $(sel);
      if (el) el.textContent = String(val);
    };

    setTxt("#kpi-views", analytics.pageViews ?? 0);
    setTxt("#kpi-downloads", analytics.cvDownloads ?? 0);
    setTxt("#kpi-unread", unread);
    setTxt("#kpi-ai-queries", aiQueries.length);

    // Sidebar badges
    setTxt("#count-exp", (cmsData.experiences || []).length);
    setTxt("#count-skills", (cmsData.skills || []).length);
    setTxt("#count-projects", (cmsData.projects || []).length);
    const unreadBadge = $("#count-unread");
    if (unreadBadge) {
      unreadBadge.textContent = String(unread);
      unreadBadge.classList.toggle("pill-alert", unread > 0);
    }

    renderTelemetryChart(analytics.dailyViews);

    // Recent AI Queries
    const aiList = $("#ai-query-list");
    if (aiList) {
      if (aiQueries.length === 0) {
        aiList.innerHTML = `<div class="log-row">No visitor AI queries recorded yet. Test the MCP Console on your portfolio!</div>`;
      } else {
        aiList.innerHTML = aiQueries.slice(0, 8).map((item) => `
          <div class="log-row">
            <div class="log-row-meta">
              <span>MODEL // ${esc(item.model || "Claude")}</span>
              <span>${esc(formatTimeAgo(item.at))}</span>
            </div>
            <div>&gt; ${esc(item.q)}</div>
          </div>
        `).join("");
      }
    }

    // Inbox preview
    const previewEl = $("#overview-inbox-preview");
    if (previewEl) {
      if (messages.length === 0) {
        previewEl.innerHTML = `<div class="log-row">Inbox is clear — no direct transmissions yet.</div>`;
      } else {
        previewEl.innerHTML = messages.slice(0, 3).map((m) => `
          <div class="log-row" style="cursor:pointer; ${!m.read ? "border-left: 3px solid var(--cyan);" : ""}" data-open-inbox="1">
            <div class="log-row-meta">
              <span>${!m.read ? "● UNREAD • " : ""}${esc(m.name)} (${esc(m.email)})</span>
              <span>${esc(formatTimeAgo(m.createdAt))}</span>
            </div>
            <div><strong>[${esc(m.topic)}]</strong> ${esc(m.message.slice(0, 120))}${m.message.length > 120 ? "..." : ""}</div>
          </div>
        `).join("");
        previewEl.querySelectorAll("[data-open-inbox]").forEach((row) => {
          row.addEventListener("click", () => switchTab("inbox"));
        });
      }
    }
  }

  /* -------------------- 7. PROFILE & HERO EDITOR -------------------- */
  function populateProfileForm() {
    const p = cmsData.profile || {};
    const m = p.metrics || {};

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v ?? "";
    };

    setVal("pf-first", p.firstName || "AL AMIN");
    setVal("pf-last", p.lastName || "MAHFUZ");
    setVal("pf-headline", p.headline || "");
    setVal("pf-avail-text", p.availabilityText || "");
    setVal("pf-avail-toggle", p.isAvailable === false ? "false" : "true");
    setVal("pf-badge-title", p.badgeRoleTitle || "Senior Lecturer");
    setVal("pf-badge-sub", p.badgeRoleSub || "RSTU, Natore");
    setVal("pf-bio", p.heroBioHtml || "");
    setVal("pf-email", p.email || "sojol.cub@gmail.com");
    setVal("pf-location", p.location || "");
    setVal("pf-phone1", p.phonePrimary || "");
    setVal("pf-phone2", p.phoneSecondary || "");
    setVal("pf-m-exp", m.yearsExp ?? 7);
    setVal("pf-m-llm", m.llmApis ?? 3);
    setVal("pf-m-tech", m.totalTech ?? 34);
    setVal("pf-m-stu", m.studentsMentored ?? 1000);
    setVal("pf-roles", Array.isArray(p.typewriterRoles) ? p.typewriterRoles.join("\n") : "");
  }

  function initProfileEditor() {
    const form = $("#profile-form");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (id) => document.getElementById(id)?.value.trim() || "";
      const roles = val("pf-roles")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      cmsData.profile = {
        ...cmsData.profile,
        firstName: val("pf-first") || "AL AMIN",
        lastName: val("pf-last") || "MAHFUZ",
        headline: val("pf-headline"),
        availabilityText: val("pf-avail-text"),
        isAvailable: val("pf-avail-toggle") !== "false",
        badgeRoleTitle: val("pf-badge-title") || "Senior Lecturer",
        badgeRoleSub: val("pf-badge-sub") || "RSTU, Natore",
        heroBioHtml: val("pf-bio"),
        email: val("pf-email"),
        location: val("pf-location"),
        phonePrimary: val("pf-phone1"),
        phoneSecondary: val("pf-phone2"),
        metrics: {
          yearsExp: Number(val("pf-m-exp")) || 7,
          llmApis: Number(val("pf-m-llm")) || 3,
          totalTech: Number(val("pf-m-tech")) || 34,
          studentsMentored: Number(val("pf-m-stu")) || 1000
        },
        typewriterRoles: roles.length > 0 ? roles : ["AI Expert & Agentic Workflow Architect"]
      };

      persistAndRefresh("Profile & Hero synced live to public website!");
    });
  }

  /* -------------------- 8. EXPERIENCE TIMELINE CRUD -------------------- */
  function openExperienceModal(existingItem = null) {
    const isEdit = Boolean(existingItem);
    const item = existingItem || {
      period: "2026 – PRESENT",
      badge: "ACADEMIA",
      isCurrent: false,
      role: "",
      org: "",
      bullets: [],
      tags: []
    };

    openModal(
      isEdit ? "Edit Experience Role" : "Add New Experience Role",
      `
        <div class="form-grid-2">
          <div class="field">
            <label>TIME PERIOD</label>
            <input type="text" name="period" value="${esc(item.period)}" placeholder="e.g., 2026 – PRESENT" required />
          </div>
          <div class="field">
            <label>BADGE LABEL</label>
            <input type="text" name="badge" value="${esc(item.badge)}" placeholder="e.g., CURRENT ROLE or ACADEMIA" required />
          </div>
        </div>
        <div class="field">
          <label>ROLE / POSITION TITLE</label>
          <input type="text" name="role" value="${esc(item.role)}" placeholder="e.g., Senior Lecturer — Department of CSE" required />
        </div>
        <div class="field">
          <label>UNIVERSITY / ORGANIZATION</label>
          <input type="text" name="org" value="${esc(item.org)}" placeholder="e.g., Rajshahi Science and Technology University (RSTU), Natore" required />
        </div>
        <label class="checkbox-row">
          <input type="checkbox" name="isCurrent" ${item.isCurrent ? "checked" : ""} />
          <span>Highlight with emerald LIVE 'CURRENT ROLE' beacon</span>
        </label>
        <div class="field">
          <label>KEY RESPONSIBILITIES / IMPACT BULLETS (ONE PER LINE)</label>
          <textarea name="bullets" rows="5" required placeholder="Deliver undergraduate CSE courses...">${esc((item.bullets || []).join("\n"))}</textarea>
        </div>
        <div class="field">
          <label>SKILL TAGS (COMMA SEPARATED)</label>
          <input type="text" name="tags" value="${esc((item.tags || []).join(", "))}" placeholder="Senior CSE Faculty, AI & Web Curricula" />
        </div>
      `,
      (fd) => {
        const nextObj = {
          id: isEdit ? item.id : "exp-" + Date.now(),
          period: String(fd.get("period") || "").trim(),
          badge: String(fd.get("badge") || "ROLE").trim(),
          isCurrent: fd.get("isCurrent") === "on",
          role: String(fd.get("role") || "").trim(),
          org: String(fd.get("org") || "").trim(),
          bullets: String(fd.get("bullets") || "")
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean),
          tags: String(fd.get("tags") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        };

        if (!Array.isArray(cmsData.experiences)) cmsData.experiences = [];
        if (isEdit) {
          const idx = cmsData.experiences.findIndex((x) => x.id === item.id);
          if (idx >= 0) cmsData.experiences[idx] = nextObj;
        } else {
          cmsData.experiences.unshift(nextObj);
        }

        closeModal();
        persistAndRefresh(isEdit ? "Experience role updated!" : "New experience role added!");
      }
    );
  }

  function renderExperiences() {
    const listEl = $("#exp-manager-list");
    if (!listEl) return;
    const list = Array.isArray(cmsData.experiences) ? cmsData.experiences : [];

    if (list.length === 0) {
      listEl.innerHTML = `<div class="log-row">No experience entries found. Click "+ Add New Role" above.</div>`;
      return;
    }

    listEl.innerHTML = list.map((exp, idx) => `
      <div class="crud-item">
        <div class="crud-item-main">
          <div>
            <span class="crud-period">${esc(exp.period)}</span>
            <span class="status-tag" style="${exp.isCurrent ? "background:rgba(16,185,129,0.18);color:var(--emerald);" : ""}">${esc(exp.badge)}</span>
          </div>
          <h4 style="margin-top:0.35rem;">${esc(exp.role)}</h4>
          <div class="crud-org">${esc(exp.org)}</div>
          <div style="font-size:0.83rem;color:var(--text-sub);">
            ${(exp.bullets || []).length} bullet points • Tags: ${esc((exp.tags || []).join(" · "))}
          </div>
        </div>
        <div class="crud-actions">
          <button type="button" class="btn-mini" data-exp-move="-1" data-idx="${idx}" title="Move Up" ${idx === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn-mini" data-exp-move="1" data-idx="${idx}" title="Move Down" ${idx === list.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn-mini" data-exp-edit="${esc(exp.id)}">Edit</button>
          <button type="button" class="btn-mini danger" data-exp-del="${esc(exp.id)}">Delete</button>
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll("[data-exp-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        const dir = Number(btn.dataset.expMove);
        const target = idx + dir;
        if (target < 0 || target >= cmsData.experiences.length) return;
        const arr = cmsData.experiences;
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        persistAndRefresh("Timeline order updated!");
      });
    });

    listEl.querySelectorAll("[data-exp-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = cmsData.experiences.find((x) => x.id === btn.dataset.expEdit);
        if (item) openExperienceModal(item);
      });
    });

    listEl.querySelectorAll("[data-exp-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = cmsData.experiences.find((x) => x.id === btn.dataset.expDel);
        if (!item) return;
        if (!window.confirm(`Delete "${item.role}" at "${item.org}"?`)) return;
        cmsData.experiences = cmsData.experiences.filter((x) => x.id !== item.id);
        persistAndRefresh("Experience entry removed.");
      });
    });
  }

  /* -------------------- 9. SKILLS & AI ARSENAL CRUD -------------------- */
  function openSkillModal(existingSkill = null) {
    const isEdit = Boolean(existingSkill);
    const sk = existingSkill || {
      name: "",
      cat: activeSkillFilter === "all" ? "ai" : activeSkillFilter,
      tag: "AI Tool",
      note: "",
      lvl: 95
    };

    const cats = [
      ["ai", "AI, LLMs & IDEs"],
      ["frontend", "Frontend & Mobile"],
      ["backend", "Backend & Languages"],
      ["database", "Databases"],
      ["foundations", "Math, OS & Creative"]
    ];

    openModal(
      isEdit ? "Edit Technical / AI Skill" : "Add New Skill to Matrix",
      `
        <div class="form-grid-2">
          <div class="field">
            <label>SKILL / TOOL NAME</label>
            <input type="text" name="name" value="${esc(sk.name)}" placeholder="e.g., LangGraph / Claude Code" required />
          </div>
          <div class="field">
            <label>MATRIX CATEGORY</label>
            <select name="cat">
              ${cats.map(([v, label]) => `<option value="${v}" ${sk.cat === v ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="field">
            <label>BADGE TAG</label>
            <input type="text" name="tag" value="${esc(sk.tag)}" placeholder="e.g., Agentic / LLM Core" required />
          </div>
          <div class="field">
            <label>PROFICIENCY LEVEL (50–100%)</label>
            <input type="number" name="lvl" min="50" max="100" value="${Number(sk.lvl) || 92}" required />
          </div>
        </div>
        <div class="field">
          <label>CONCISE CAPABILITY NOTE</label>
          <input type="text" name="note" value="${esc(sk.note)}" placeholder="e.g., Multi-agent orchestration & tool-use" required />
        </div>
      `,
      (fd) => {
        const nextSkill = {
          id: isEdit ? sk.id : "sk-" + Date.now(),
          name: String(fd.get("name") || "").trim(),
          cat: String(fd.get("cat") || "ai"),
          tag: String(fd.get("tag") || "Tech").trim(),
          note: String(fd.get("note") || "").trim(),
          lvl: Math.max(50, Math.min(100, Number(fd.get("lvl")) || 90))
        };

        if (!Array.isArray(cmsData.skills)) cmsData.skills = [];
        if (isEdit) {
          const idx = cmsData.skills.findIndex((x) => x.id === sk.id);
          if (idx >= 0) cmsData.skills[idx] = nextSkill;
        } else {
          cmsData.skills.unshift(nextSkill);
        }

        closeModal();
        persistAndRefresh(isEdit ? `Updated "${nextSkill.name}"!` : `Added "${nextSkill.name}" to Tech Arsenal!`);
      }
    );
  }

  function renderSkills() {
    const grid = $("#skills-manager-grid");
    if (!grid) return;

    const allSkills = Array.isArray(cmsData.skills) ? cmsData.skills : [];
    const filtered = activeSkillFilter === "all"
      ? allSkills
      : allSkills.filter((s) => s.cat === activeSkillFilter);

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="log-row">No skills in this category yet. Click "+ Add New Skill".</div>`;
      return;
    }

    grid.innerHTML = filtered.map((sk) => {
      const numLvl = typeof sk.lvl === "number" ? sk.lvl : parseInt(String(sk.lvl), 10) || 90;
      return `
        <div class="skill-admin-card">
          <div class="skill-admin-top">
            <strong>${esc(sk.name)}</strong>
            <span class="status-tag">${esc(sk.tag)}</span>
          </div>
          <div style="font-size:0.79rem;color:var(--text-sub);flex:1;">${esc(sk.note)}</div>
          <div class="skill-slider-row">
            <input type="range" min="50" max="100" value="${numLvl}" data-skill-range="${esc(sk.id)}" aria-label="${esc(sk.name)} proficiency" />
            <span class="skill-pct" id="pct-${esc(sk.id)}">${numLvl}%</span>
          </div>
          <div class="crud-actions" style="justify-content:flex-end;margin-top:0.2rem;">
            <button type="button" class="btn-mini" data-skill-edit="${esc(sk.id)}">Edit</button>
            <button type="button" class="btn-mini danger" data-skill-del="${esc(sk.id)}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    grid.querySelectorAll("[data-skill-range]").forEach((slider) => {
      const id = slider.dataset.skillRange;
      slider.addEventListener("input", () => {
        const lbl = document.getElementById(`pct-${id}`);
        if (lbl) lbl.textContent = `${slider.value}%`;
      });
      slider.addEventListener("change", () => {
        const target = cmsData.skills.find((x) => x.id === id);
        if (target) {
          target.lvl = Number(slider.value);
          cmsData = CMS.saveData(cmsData);
          markSynced();
          showToast(`${target.name} proficiency set to ${target.lvl}%`);
        }
      });
    });

    grid.querySelectorAll("[data-skill-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sk = cmsData.skills.find((x) => x.id === btn.dataset.skillEdit);
        if (sk) openSkillModal(sk);
      });
    });

    grid.querySelectorAll("[data-skill-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sk = cmsData.skills.find((x) => x.id === btn.dataset.skillDel);
        if (!sk) return;
        if (!window.confirm(`Remove skill "${sk.name}" from matrix?`)) return;
        cmsData.skills = cmsData.skills.filter((x) => x.id !== sk.id);
        persistAndRefresh(`Removed "${sk.name}".`);
      });
    });
  }

  /* -------------------- 10. FEATURED PROJECTS CRUD -------------------- */
  function openProjectModal(existingProj = null) {
    const isEdit = Boolean(existingProj);
    const pr = existingProj || {
      title: "",
      category: "AI Agents & MCP",
      summary: "",
      tags: [],
      liveUrl: "#contact",
      repoUrl: ""
    };

    openModal(
      isEdit ? "Edit Featured Project" : "Add Featured Project",
      `
        <div class="form-grid-2">
          <div class="field">
            <label>PROJECT TITLE</label>
            <input type="text" name="title" value="${esc(pr.title)}" placeholder="e.g., Autonomous Research Agent" required />
          </div>
          <div class="field">
            <label>CATEGORY PILL</label>
            <input type="text" name="category" value="${esc(pr.category)}" placeholder="e.g., AI Agents & MCP" required />
          </div>
        </div>
        <div class="field">
          <label>PROJECT ARCHITECTURE SUMMARY</label>
          <textarea name="summary" rows="3" required placeholder="Describe what the system solves and how it is architected...">${esc(pr.summary)}</textarea>
        </div>
        <div class="field">
          <label>TECH STACK TAGS (COMMA SEPARATED)</label>
          <input type="text" name="tags" value="${esc((pr.tags || []).join(", "))}" placeholder="Python, Claude API, NextJS, PostgreSQL" />
        </div>
        <div class="form-grid-2">
          <div class="field">
            <label>LIVE DEMO / SECTION URL (OPTIONAL)</label>
            <input type="text" name="liveUrl" value="${esc(pr.liveUrl || "")}" placeholder="https://... or #ai-lab" />
          </div>
          <div class="field">
            <label>GITHUB / REPO URL (OPTIONAL)</label>
            <input type="text" name="repoUrl" value="${esc(pr.repoUrl || "")}" placeholder="https://github.com/..." />
          </div>
        </div>
      `,
      (fd) => {
        const nextProj = {
          id: isEdit ? pr.id : "proj-" + Date.now(),
          title: String(fd.get("title") || "").trim(),
          category: String(fd.get("category") || "Engineering").trim(),
          summary: String(fd.get("summary") || "").trim(),
          tags: String(fd.get("tags") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          liveUrl: String(fd.get("liveUrl") || "").trim(),
          repoUrl: String(fd.get("repoUrl") || "").trim(),
          featured: true
        };

        if (!Array.isArray(cmsData.projects)) cmsData.projects = [];
        if (isEdit) {
          const idx = cmsData.projects.findIndex((x) => x.id === pr.id);
          if (idx >= 0) cmsData.projects[idx] = nextProj;
        } else {
          cmsData.projects.unshift(nextProj);
        }

        closeModal();
        persistAndRefresh(isEdit ? "Project updated!" : "New project published to portfolio!");
      }
    );
  }

  function renderProjects() {
    const toggleSec = $("#toggle-projects-sec");
    if (toggleSec) toggleSec.checked = cmsData.projectsSectionEnabled !== false;

    const grid = $("#projects-manager-grid");
    if (!grid) return;

    const list = Array.isArray(cmsData.projects) ? cmsData.projects : [];
    if (list.length === 0) {
      grid.innerHTML = `<div class="log-row">No featured projects yet. Click "+ Add Project" to showcase builds on your portfolio.</div>`;
      return;
    }

    grid.innerHTML = list.map((p) => `
      <div class="project-admin-card">
        <div class="skill-admin-top">
          <span class="status-tag">${esc(p.category)}</span>
        </div>
        <h4 style="font-family:var(--font-display);font-size:1.05rem;">${esc(p.title)}</h4>
        <p style="font-size:0.84rem;color:var(--text-sub);flex:1;">${esc(p.summary)}</p>
        <div style="font-family:var(--font-mono);font-size:0.71rem;color:var(--violet-soft);">
          ${esc((p.tags || []).join(" • "))}
        </div>
        <div class="crud-actions" style="justify-content:flex-end;margin-top:0.4rem;">
          <button type="button" class="btn-mini" data-proj-edit="${esc(p.id)}">Edit</button>
          <button type="button" class="btn-mini danger" data-proj-del="${esc(p.id)}">Delete</button>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll("[data-proj-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pr = cmsData.projects.find((x) => x.id === btn.dataset.projEdit);
        if (pr) openProjectModal(pr);
      });
    });

    grid.querySelectorAll("[data-proj-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pr = cmsData.projects.find((x) => x.id === btn.dataset.projDel);
        if (!pr) return;
        if (!window.confirm(`Delete project "${pr.title}"?`)) return;
        cmsData.projects = cmsData.projects.filter((x) => x.id !== pr.id);
        persistAndRefresh("Project deleted.");
      });
    });
  }

  /* -------------------- 11. TRANSMISSIONS INBOX -------------------- */
  function renderInbox() {
    const stack = $("#inbox-full-list");
    if (!stack) return;

    const messages = Array.isArray(cmsData.messages) ? cmsData.messages : [];
    if (messages.length === 0) {
      stack.innerHTML = `<div class="log-row">Your transmissions inbox is empty. Messages sent via the public Contact form appear here immediately.</div>`;
      return;
    }

    stack.innerHTML = messages.map((m) => {
      const replySubject = encodeURIComponent(`Re: ${m.topic || "Portfolio Inquiry"} — Al Amin Mahfuz`);
      return `
        <div class="msg-card ${!m.read ? "unread" : ""}">
          <div class="msg-head">
            <div class="msg-sender">
              <div>
                <strong>${m.starred ? "★ " : ""}${esc(m.name)}</strong>
                <span class="msg-email">&lt;${esc(m.email)}&gt;</span>
              </div>
              <span class="msg-topic">${esc(m.topic)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-dim);">
              ${esc(formatTimeAgo(m.createdAt))}
            </span>
          </div>
          <div class="msg-body">${esc(m.message)}</div>
          <div class="crud-actions">
            <button type="button" class="btn-mini" data-msg-read="${esc(m.id)}">
              ${m.read ? "Mark Unread" : "✓ Mark Read"}
            </button>
            <button type="button" class="btn-mini" data-msg-star="${esc(m.id)}">
              ${m.starred ? "Unstar" : "★ Star"}
            </button>
            <a class="btn-mini" href="mailto:${esc(m.email)}?subject=${replySubject}">Reply via Email ↗</a>
            <button type="button" class="btn-mini danger" data-msg-del="${esc(m.id)}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    stack.querySelectorAll("[data-msg-read]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const msg = cmsData.messages.find((x) => x.id === btn.dataset.msgRead);
        if (!msg) return;
        msg.read = !msg.read;
        persistAndRefresh(msg.read ? "Marked as read." : "Marked as unread.");
      });
    });

    stack.querySelectorAll("[data-msg-star]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const msg = cmsData.messages.find((x) => x.id === btn.dataset.msgStar);
        if (!msg) return;
        msg.starred = !msg.starred;
        persistAndRefresh(msg.starred ? "Message starred." : "Star removed.");
      });
    });

    stack.querySelectorAll("[data-msg-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.msgDel;
        cmsData.messages = cmsData.messages.filter((x) => x.id !== id);
        persistAndRefresh("Transmission deleted.");
      });
    });
  }

  /* -------------------- 12. SECURITY & VAULT BACKUP -------------------- */
  function populateCredentialsForm() {
    const creds = CMS.getAdminCredentials();
    const uEl = $("#sec-user");
    const pEl = $("#sec-pass");
    if (uEl) uEl.value = creds.username || "";
    if (pEl) pEl.value = "";
  }

  function initSecurityAndVault() {
    $("#creds-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = $("#sec-user")?.value.trim() || "";
      const p = $("#sec-pass")?.value || "";
      if (!u || p.length < 4) {
        showToast("Password must be at least 4 characters.");
        return;
      }
      CMS.updateAdminCredentials(u, p);
      showToast("Admin login credentials updated!");
    });

    $("#reset-creds-btn")?.addEventListener("click", () => {
      const def = CMS.resetAdminCredentials();
      populateCredentialsForm();
      showToast(`Default passkey restored (${def.username})`);
    });

    $("#export-json-btn")?.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(cmsData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `al-amin-mahfuz-cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Portfolio JSON snapshot exported!");
    });

    $("#import-json-input")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object" || !parsed.profile) {
          throw new Error("Invalid snapshot schema");
        }
        cmsData = parsed;
        persistAndRefresh("Snapshot imported & synced to website!");
        populateProfileForm();
      } catch {
        showToast("Invalid JSON snapshot file.");
      } finally {
        e.target.value = "";
      }
    });

    $("#factory-reset-btn")?.addEventListener("click", () => {
      if (!window.confirm("Restore all portfolio content (Profile, RSTU/CUB Timeline, Skills & Projects) to the Updated 2026 CV defaults?")) {
        return;
      }
      cmsData = CMS.resetToDefaults();
      populateProfileForm();
      renderAll();
      showToast("Portfolio restored to 2026 CV defaults!");
    });
  }

  /* -------------------- 13. ACTION BUTTON WIRING & LIVE SYNC -------------------- */
  function initCrudToolbars() {
    $("#add-exp-btn")?.addEventListener("click", () => openExperienceModal(null));
    $("#add-skill-btn")?.addEventListener("click", () => openSkillModal(null));
    $("#add-project-btn")?.addEventListener("click", () => openProjectModal(null));

    $("#toggle-projects-sec")?.addEventListener("change", (e) => {
      cmsData.projectsSectionEnabled = e.target.checked;
      persistAndRefresh(
        cmsData.projectsSectionEnabled
          ? "Featured Projects section enabled on website!"
          : "Featured Projects section hidden on website."
      );
    });

    $("#admin-skill-filters")?.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $("#admin-skill-filters")?.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeSkillFilter = btn.dataset.cat || "all";
        renderSkills();
      });
    });

    $("#clear-ai-logs")?.addEventListener("click", () => {
      if (!cmsData.analytics) cmsData.analytics = {};
      cmsData.analytics.aiQueries = [];
      persistAndRefresh("AI query logs cleared.");
    });

    $("#mark-all-read")?.addEventListener("click", () => {
      if (Array.isArray(cmsData.messages)) {
        cmsData.messages.forEach((m) => { m.read = true; });
      }
      persistAndRefresh("All transmissions marked as read.");
    });
  }

  function renderAll() {
    renderOverview();
    renderExperiences();
    renderSkills();
    renderProjects();
    renderInbox();
  }

  /* -------------------- BOOTSTRAP ADMIN DECK -------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initAdminCanvas();
    initClockAndTheme();
    initNavigation();
    initModal();
    initProfileEditor();
    initCrudToolbars();
    initSecurityAndVault();
    initAuthGate();

    CMS.onSync((freshData) => {
      cmsData = freshData;
      markSynced("LIVE EVENT RECEIVED");
      renderAll();
    });
  });
})();

