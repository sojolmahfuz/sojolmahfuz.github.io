/* ==========================================================================
   AL AMIN MAHFUZ — NEURAL.OS INTERACTIVE ANIMATION ENGINE
   ========================================================================== */

(() => {
  "use strict";

  const isInstantPreview = window.location.search.includes("skipboot=1");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  const CMS = window.NeuralCMS || null;
  let activeCmsData = CMS ? CMS.loadData() : null;
  let activeTypewriterRoles = [
    "AI Expert & Agentic Workflow Architect",
    "Senior Lecturer in CSE @ RSTU, Natore",
    "Full Stack Developer — React, Next.js, Node & Django",
    "LLM API Integrator (Claude • Gemini • OpenAI)",
    "Deep Learning Engineer — PyTorch, TensorFlow & Keras"
  ];
  let currentSkillFilter = "all";

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* -------------------- 1. COMPLETE CV SKILL MATRIX -------------------- */
  const SKILLS_DATA = [
    // AI, LLMs & Agentic IDEs
    { name: "Prompt Engineering", cat: "ai", tag: "LLM Core", note: "System prompts, few-shot & structured schemas", lvl: "97%" },
    { name: "Claude (Anthropic)", cat: "ai", tag: "LLM & API", note: "Reasoning workflows, tool-use & API integration", lvl: "96%" },
    { name: "Google Gemini", cat: "ai", tag: "LLM & API", note: "Multimodal & high-context Gemini API apps", lvl: "96%" },
    { name: "ChatGPT / OpenAI API", cat: "ai", tag: "LLM & API", note: "GPT streaming chat, assistants & automation", lvl: "97%" },
    { name: "AI Agents & Workflows", cat: "ai", tag: "Agentic", note: "Multi-step autonomous tool-calling agents", lvl: "95%" },
    { name: "Model Context Protocol", cat: "ai", tag: "MCP", note: "Connecting LLMs to live data, tools & APIs", lvl: "94%" },
    { name: "Deep Learning", cat: "ai", tag: "Neural Eng.", note: "Neural network architecture & training in Python", lvl: "90%" },
    { name: "PyTorch & TensorFlow", cat: "ai", tag: "DL Frameworks", note: "Including Keras model pipelines & evaluation", lvl: "89%" },
    { name: "Antigravity IDE", cat: "ai", tag: "Agentic IDE", note: "Autonomous multi-file AI pair programming", lvl: "96%" },
    { name: "Cursor & Windsurf", cat: "ai", tag: "AI Editors", note: "AI-native full-stack refactoring & shipping", lvl: "96%" },
    { name: "GitHub Copilot", cat: "ai", tag: "AI Coding", note: "Accelerated code generation, tests & docs", lvl: "97%" },

    // Frontend & Mobile
    { name: "ReactJS", cat: "frontend", tag: "Frontend", note: "Reusable component systems & state management", lvl: "96%" },
    { name: "NextJS", cat: "frontend", tag: "Full-Stack", note: "SSR, routing & modern React web applications", lvl: "94%" },
    { name: "React Native", cat: "frontend", tag: "Mobile UI", note: "Cross-platform mobile & tablet interfaces", lvl: "90%" },
    { name: "React Router", cat: "frontend", tag: "SPA Routing", note: "Dynamic client-side navigation architectures", lvl: "95%" },
    { name: "Tailwind CSS", cat: "frontend", tag: "Styling", note: "Utility-first responsive design systems", lvl: "96%" },
    { name: "HTML5, CSS3 & Bootstrap", cat: "frontend", tag: "Web Core", note: "Semantic markup & handset-specific responsive UI", lvl: "98%" },

    // Backend & Languages
    { name: "Python", cat: "backend", tag: "Language", note: "AI/ML, Django backends, data analysis & scripting", lvl: "96%" },
    { name: "JavaScript (ES6+)", cat: "backend", tag: "Language", note: "Async full-stack web & interactive architectures", lvl: "96%" },
    { name: "C++", cat: "backend", tag: "Language", note: "Competitive programming, algorithms & CSE labs", lvl: "91%" },
    { name: "NodeJS & ExpressJS", cat: "backend", tag: "Backend", note: "Scalable server-side logic, auth & middleware", lvl: "95%" },
    { name: "Django", cat: "backend", tag: "Python Web", note: "Secure, batteries-included web & API backends", lvl: "93%" },
    { name: "REST API & JSON", cat: "backend", tag: "Architecture", note: "Client-server API design, validation & integration", lvl: "96%" },

    // Databases
    { name: "MongoDB", cat: "database", tag: "NoSQL", note: "Schema design, aggregation & Node/Express apps", lvl: "94%" },
    { name: "PostgreSQL & MySQL", cat: "database", tag: "Relational", note: "Normalized relational modeling & SQL optimization", lvl: "93%" },
    { name: "Firebase", cat: "database", tag: "BaaS / Realtime", note: "Realtime DB, authentication & cloud hosting", lvl: "92%" },
    { name: "SQL Server & Sybase", cat: "database", tag: "Enterprise DB", note: "Enterprise relational querying & MS Access", lvl: "86%" },

    // Foundations, OS & Creative
    { name: "Linear Algebra & Calculus", cat: "foundations", tag: "Math Core", note: "Mathematical backbone for ML & neural networks", lvl: "88%" },
    { name: "Statistics & Probability", cat: "foundations", tag: "Data Science", note: "Statistical modeling & quantitative data analysis", lvl: "89%" },
    { name: "Linux & Windows", cat: "foundations", tag: "Platforms", note: "Development environments & production server ops", lvl: "92%" },
    { name: "Computer Networking & Sec", cat: "foundations", tag: "Systems", note: "Stack Exchange (InfoSec) problem solver", lvl: "87%" },
    { name: "Photoshop & Illustrator", cat: "foundations", tag: "Creative", note: "2D graphics, motion basics & visual assets", lvl: "84%" }
  ];

  /* -------------------- 2. CYBER SCRAMBLE TEXT DECODER -------------------- */
  const GLYPHS = "01/<>[]{}ΔΣ#*+=-_~";

  function scrambleElement(el, duration = 680) {
    if (!el || prefersReducedMotion) return;
    const target = el.dataset.value || el.textContent;
    if (el.dataset.scrambling === "1") return;
    el.dataset.scrambling = "1";

    const start = performance.now();
    const len = target.length;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const settled = Math.floor(progress * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        const ch = target[i];
        if (ch === " ") {
          out += " ";
        } else if (i < settled) {
          out += ch;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      el.textContent = out;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
        el.dataset.scrambling = "0";
      }
    }
    requestAnimationFrame(tick);
  }

  /* -------------------- 3. BOOT PRELOADER -------------------- */
  function initBootScreen(onComplete) {
    const screen = document.getElementById("boot-screen");
    const fill = document.getElementById("boot-bar-fill");
    const pctEl = document.getElementById("boot-percent");
    const statusEl = document.getElementById("boot-status");
    const skipBtn = document.getElementById("boot-skip");

    if (!screen) {
      onComplete();
      return;
    }

    const stages = [
      [0, "INITIALIZING NEURAL SYNAPSE ENGINE..."],
      [32, "MOUNTING MCP AGENT PROTOCOL..."],
      [66, "SYNCING RSTU ACADEMIC & FULL-STACK PROFILE..."],
      [92, "CALIBRATING HOLOGRAPHIC INTERFACE..."],
      [100, "NEURAL.OS ONLINE // WELCOME"]
    ];

    let finished = false;
    function finishBoot() {
      if (finished) return;
      finished = true;
      screen.classList.add("boot-hidden");
      setTimeout(onComplete, 180);
    }

    if (prefersReducedMotion || window.location.search.includes("skipboot=1")) {
      screen.style.display = "none";
      finished = true;
      onComplete();
      return;
    }

    skipBtn?.addEventListener("click", finishBoot);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") finishBoot();
    }, { once: true });

    const totalMs = 1150;
    const t0 = performance.now();

    function step(now) {
      if (finished) return;
      const p = Math.min((now - t0) / totalMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * 100);

      if (fill) fill.style.width = `${val}%`;
      if (pctEl) pctEl.textContent = `${String(val).padStart(2, "0")}%`;

      for (let i = stages.length - 1; i >= 0; i--) {
        if (val >= stages[i][0]) {
          if (statusEl) statusEl.textContent = stages[i][1];
          break;
        }
      }

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(finishBoot, 160);
      }
    }
    requestAnimationFrame(step);
  }

  /* -------------------- 4. 3D NEURAL SYNAPSE CANVAS + PULSES -------------------- */
  let scrollBoost = 0;

  function initNeuralCanvas() {
    const canvas = document.getElementById("neural-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes = [];
    const pulses = [];
    const ripples = [];
    const pointer = { x: -9999, y: -9999, active: false };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = width < 640 ? 42 : width < 1100 ? 68 : 88;
      if (nodes.length === 0) {
        for (let i = 0; i < targetCount; i++) {
          nodes.push(makeNode());
        }
      } else if (nodes.length > targetCount) {
        nodes.length = targetCount;
      } else {
        while (nodes.length < targetCount) nodes.push(makeNode());
      }
    }

    function makeNode() {
      const palette = ["#00f0ff", "#7c5cff", "#1fb5c4", "#10b981"];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.35 + Math.random() * 0.9, // depth factor
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: 1.3 + Math.random() * 1.9,
        color: palette[Math.floor(Math.random() * palette.length)],
        phase: Math.random() * Math.PI * 2
      };
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

    window.addEventListener("click", (e) => {
      if (prefersReducedMotion) return;
      ripples.push({ x: e.clientX, y: e.clientY, r: 4, alpha: 0.75 });
    });

    const maxDist = 148;

    function render(now) {
      ctx.clearRect(0, 0, width, height);
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const speedMult = prefersReducedMotion ? 0 : 1 + Math.min(scrollBoost, 3.2);
      scrollBoost *= 0.9;

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * n.z * speedMult;
        n.y += (n.vy * n.z - scrollBoost * 0.35 * n.z) * (prefersReducedMotion ? 0 : 1);

        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;

        if (pointer.active && !prefersReducedMotion) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 32400 && distSq > 40) {
            const dist = Math.sqrt(distSq);
            const force = (180 - dist) / 180;
            n.x += (dx / dist) * force * 0.65;
            n.y += (dy / dist) * force * 0.65;
          }
        }
      }

      // Draw synaptic edges & occasionally spawn data pulses
      ctx.lineWidth = 0.85;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxDist * maxDist) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / maxDist) * (isLight ? 0.22 : 0.26);
            ctx.strokeStyle = isLight
              ? `rgba(14, 116, 144, ${alpha})`
              : `rgba(0, 240, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            if (!prefersReducedMotion && pulses.length < 18 && Math.random() < 0.00075) {
              pulses.push({ a, b, t: 0, speed: 0.012 + Math.random() * 0.016 });
            }
          }
        }

        // Cursor tether lines
        if (pointer.active) {
          const pdx = pointer.x - a.x;
          const pdy = pointer.y - a.y;
          const pd2 = pdx * pdx + pdy * pdy;
          if (pd2 < 28900) {
            const pd = Math.sqrt(pd2);
            const pAlpha = (1 - pd / 170) * 0.42;
            ctx.strokeStyle = isLight
              ? `rgba(109, 74, 255, ${pAlpha})`
              : `rgba(124, 92, 255, ${pAlpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // Draw traveling synaptic data packets
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;
        if (p.t >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const px = p.a.x + (p.b.x - p.a.x) * p.t;
        const py = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.fillStyle = isLight ? "#6d4aff" : "#00f0ff";
        ctx.beginPath();
        ctx.arc(px, py, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulseScale = 0.82 + Math.sin(now * 0.0024 + n.phase) * 0.24;
        ctx.fillStyle = n.color;
        ctx.globalAlpha = isLight ? 0.65 : 0.85;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * n.z * pulseScale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw click shockwaves
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 4.2;
        rp.alpha *= 0.94;
        if (rp.alpha < 0.02) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(0, 240, 255, ${rp.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!prefersReducedMotion) {
        requestAnimationFrame(render);
      }
    }

    requestAnimationFrame(render);
  }

  /* -------------------- 5. CUSTOM CYBER CURSOR & MAGNETIC BUTTONS -------------------- */
  function initCursorAndMagnetism() {
    if (!isFinePointer || prefersReducedMotion) return;

    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    const label = document.getElementById("cursor-label");
    if (!dot || !ring) return;

    document.body.classList.add("custom-cursor-ready");

    let mx = -100, my = -100;
    let dx = -100, dy = -100;
    let rx = -100, ry = -100;

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    function loop() {
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      rx += (mx - rx) * 0.17;
      ry += (my - ry) * 0.17;

      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener("mouseover", (e) => {
      const interactive = e.target.closest("a, button, input, select, textarea, .tilt-card, [data-cursor]");
      if (interactive) {
        ring.classList.add("is-hover");
        const tag = interactive.getAttribute("data-cursor") || "";
        if (label) label.textContent = tag;
      } else {
        ring.classList.remove("is-hover");
        if (label) label.textContent = "";
      }
    });

    // Magnetic pull on .magnetic buttons
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate3d(${relX * 0.24}px, ${relY * 0.24}px, 0)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* -------------------- 6. DYNAMIC ROLE TYPEWRITER -------------------- */
  function initTypewriter() {
    const el = document.getElementById("typewriter-text");
    if (!el || prefersReducedMotion) return;

    let roleIdx = 0;
    let charIdx = (activeTypewriterRoles[0] || "").length;
    let deleting = true;

    function step() {
      const roles = activeTypewriterRoles.length > 0
        ? activeTypewriterRoles
        : ["AI Expert & Agentic Workflow Architect"];
      const current = roles[roleIdx % roles.length];
      if (!deleting) {
        charIdx++;
        el.textContent = current.slice(0, charIdx);
        if (charIdx >= current.length) {
          deleting = true;
          setTimeout(step, 2200);
          return;
        }
        setTimeout(step, 38);
      } else {
        charIdx--;
        el.textContent = current.slice(0, Math.max(0, charIdx));
        if (charIdx <= 0) {
          deleting = false;
          roleIdx = (roleIdx + 1) % roles.length;
          setTimeout(step, 240);
          return;
        }
        setTimeout(step, 18);
      }
    }

    setTimeout(step, 2000);
  }

  /* -------------------- 7. 3D CARD TILT & RADIAL SPOTLIGHT -------------------- */
  function bindInteractiveCards(root = document) {
    if (!isFinePointer) return;

    root.querySelectorAll(".spotlight-card").forEach((card) => {
      if (card.dataset.spotBound === "1") return;
      card.dataset.spotBound = "1";
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      }, { passive: true });
    });

    if (prefersReducedMotion) return;

    root.querySelectorAll(".tilt-card").forEach((card) => {
      if (card.dataset.tiltBound === "1") return;
      card.dataset.tiltBound = "1";
      const maxTilt = parseFloat(card.dataset.tiltMax || "6");
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        const rotY = nx * maxTilt * 2;
        const rotX = -ny * maxTilt * 2;
        card.style.transform = `perspective(960px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(0)`;
      }, { passive: true });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  function initTiltAndSpotlight() {
    bindInteractiveCards(document);
  }

  /* -------------------- 8. FILTERABLE TECHNICAL ARSENAL -------------------- */
  function getActiveSkillsList() {
    if (activeCmsData && Array.isArray(activeCmsData.skills) && activeCmsData.skills.length > 0) {
      return activeCmsData.skills.map((s) => ({
        name: s.name,
        cat: s.cat,
        tag: s.tag,
        note: s.note,
        lvl: typeof s.lvl === "number" ? `${s.lvl}%` : String(s.lvl || "90%")
      }));
    }
    return SKILLS_DATA;
  }

  function renderSkillsGrid(filter) {
    const grid = document.getElementById("skills-grid");
    if (!grid) return;
    const source = getActiveSkillsList();
    const list = filter === "all"
      ? source
      : source.filter((item) => item.cat === filter);

    grid.innerHTML = "";
    list.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "skill-card";
      card.style.animationDelay = `${Math.min(idx * 0.028, 0.45)}s`;
      card.innerHTML = `
        <div class="skill-head">
          <span class="skill-name">${escapeHtml(item.name)}</span>
          <span class="skill-cat-tag">${escapeHtml(item.tag)}</span>
        </div>
        <p class="skill-note">${escapeHtml(item.note)}</p>
        <div class="skill-meter">
          <div class="skill-meter-fill" style="--lvl: ${escapeHtml(item.lvl)}"></div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function initSkillsMatrix() {
    const buttons = document.querySelectorAll(".filter-btn");
    renderSkillsGrid(currentSkillFilter);

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentSkillFilter = btn.dataset.filter || "all";
        renderSkillsGrid(currentSkillFilter);
      });
    });
  }

  /* -------------------- 8B. LIVE CMS HYDRATION (PROFILE, TIMELINE, PROJECTS) -------------------- */
  function applyCmsDataToDOM(data, isLiveUpdate = false) {
    if (!data) return;
    activeCmsData = data;
    const p = data.profile || {};

    if (Array.isArray(p.typewriterRoles) && p.typewriterRoles.length > 0) {
      activeTypewriterRoles = p.typewriterRoles.slice();
      if (isLiveUpdate) {
        const twEl = document.getElementById("typewriter-text");
        if (twEl) twEl.textContent = activeTypewriterRoles[0];
      }
    }

    const firstEl = document.getElementById("hero-first-name");
    const lastEl = document.getElementById("hero-last-name");
    if (firstEl && p.firstName) {
      firstEl.textContent = p.firstName;
      firstEl.dataset.value = p.firstName;
    }
    if (lastEl && p.lastName) {
      lastEl.textContent = p.lastName;
      lastEl.dataset.value = p.lastName;
    }

    const availTextEl = document.getElementById("hero-avail-text");
    const beaconEl = document.getElementById("hero-status-beacon");
    if (availTextEl && p.availabilityText) availTextEl.textContent = p.availabilityText;
    if (beaconEl) beaconEl.classList.toggle("busy", p.isAvailable === false);

    const badgeTitle = document.getElementById("badge-role-title");
    const badgeSub = document.getElementById("badge-role-sub");
    if (badgeTitle && p.badgeRoleTitle) badgeTitle.textContent = p.badgeRoleTitle;
    if (badgeSub && p.badgeRoleSub) badgeSub.textContent = p.badgeRoleSub;

    const bioEl = document.getElementById("hero-bio");
    if (bioEl && p.heroBioHtml) bioEl.innerHTML = p.heroBioHtml;

    // Metrics
    const m = p.metrics || {};
    const updateMetric = (id, val) => {
      const el = document.getElementById(id);
      if (!el || val == null) return;
      el.dataset.target = String(val);
      if (el.dataset.counted === "1" || isLiveUpdate) {
        el.textContent = String(val);
      }
    };
    updateMetric("metric-exp", m.yearsExp);
    updateMetric("metric-llm", m.llmApis);
    updateMetric("metric-tech", m.totalTech);
    updateMetric("metric-stu", m.studentsMentored);

    // Contact & Footer
    if (p.email) {
      const emLink = document.getElementById("channel-email-link");
      const emCopy = document.getElementById("channel-email-copy");
      if (emLink) {
        emLink.textContent = p.email;
        emLink.href = `mailto:${p.email}`;
      }
      if (emCopy) emCopy.setAttribute("data-copy", p.email);
    }
    if (p.phonePrimary) {
      const ph1 = document.getElementById("channel-phone1-link");
      const ph1c = document.getElementById("channel-phone1-copy");
      const clean1 = p.phonePrimary.replace(/\s+/g, "");
      if (ph1) {
        ph1.textContent = p.phonePrimary;
        ph1.href = `tel:${clean1}`;
      }
      if (ph1c) ph1c.setAttribute("data-copy", clean1);
    }
    if (p.phoneSecondary) {
      const ph2 = document.getElementById("channel-phone2-link");
      const ph2c = document.getElementById("channel-phone2-copy");
      const clean2 = p.phoneSecondary.replace(/\s+/g, "");
      if (ph2) {
        ph2.textContent = p.phoneSecondary;
        ph2.href = `tel:${clean2}`;
      }
      if (ph2c) ph2c.setAttribute("data-copy", clean2);
    }
    const locEl = document.getElementById("channel-location-val");
    if (locEl && p.location) locEl.textContent = p.location;

    const footName = document.getElementById("footer-brand-name");
    const footHead = document.getElementById("footer-brand-headline");
    if (footName && (p.firstName || p.lastName)) {
      footName.textContent = `${p.firstName || ""} ${p.lastName || ""}`.trim();
    }
    if (footHead && p.headline) footHead.textContent = p.headline;

    // Experience Timeline
    const timeline = document.getElementById("experience-timeline");
    if (timeline && Array.isArray(data.experiences) && data.experiences.length > 0) {
      timeline.querySelectorAll(".timeline-item").forEach((n) => n.remove());
      data.experiences.forEach((exp, idx) => {
        const art = document.createElement("article");
        art.className = `timeline-item ${idx % 2 === 0 ? "reveal-left" : "reveal-right"} in-view`;
        const bulletsHtml = (exp.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("");
        const tagsHtml = (exp.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join("");
        art.innerHTML = `
          <div class="timeline-node" aria-hidden="true"><span></span></div>
          <div class="timeline-card tilt-card spotlight-card">
            <div class="timeline-meta">
              <span class="timeline-date">${escapeHtml(exp.period)}</span>
              <span class="timeline-badge ${exp.isCurrent ? "live" : ""}">${escapeHtml(exp.badge)}</span>
            </div>
            <h3 class="timeline-role">${escapeHtml(exp.role)}</h3>
            <p class="timeline-org">${escapeHtml(exp.org)}</p>
            <ul class="timeline-list">${bulletsHtml}</ul>
            <div class="card-tags">${tagsHtml}</div>
          </div>
        `;
        timeline.appendChild(art);
      });
      bindInteractiveCards(timeline);
    }

    // Featured Projects Showcase
    const projSec = document.getElementById("projects");
    const navProjLi = document.getElementById("nav-projects-li");
    const projGrid = document.getElementById("projects-public-grid");
    const showProjects = data.projectsSectionEnabled !== false && Array.isArray(data.projects) && data.projects.length > 0;

    if (projSec) projSec.hidden = !showProjects;
    if (navProjLi) navProjLi.hidden = !showProjects;

    if (projGrid && showProjects) {
      projGrid.innerHTML = data.projects.map((pr, idx) => {
        const tagsHtml = (pr.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join("");
        const liveBtn = pr.liveUrl
          ? `<a href="${escapeHtml(pr.liveUrl)}" class="project-link-btn">Explore ↗</a>`
          : "";
        const repoBtn = pr.repoUrl
          ? `<a href="${escapeHtml(pr.repoUrl)}" target="_blank" rel="noopener" class="project-link-btn">Source ⌘</a>`
          : "";
        return `
          <article class="bento-card project-public-card tilt-card spotlight-card reveal-up in-view" style="--delay:${(idx * 0.06).toFixed(2)}s">
            <div class="card-glow"></div>
            <div class="project-public-top">
              <span class="project-cat-pill">${escapeHtml(pr.category)}</span>
              <span class="bento-index">PRJ.0${idx + 1}</span>
            </div>
            <h3>${escapeHtml(pr.title)}</h3>
            <p>${escapeHtml(pr.summary)}</p>
            <div class="card-tags">${tagsHtml}</div>
            ${(liveBtn || repoBtn) ? `<div class="project-links-row">${liveBtn}${repoBtn}</div>` : ""}
          </article>
        `;
      }).join("");
      bindInteractiveCards(projGrid);
    }

    // Skills Matrix refresh
    renderSkillsGrid(currentSkillFilter);
  }

  /* -------------------- 9. INTERACTIVE MCP AI AGENT TERMINAL -------------------- */
  function initAiTerminal() {
    const output = document.getElementById("terminal-output");
    const form = document.getElementById("terminal-form");
    const input = document.getElementById("terminal-input");
    const chips = document.querySelectorAll(".prompt-chip");
    const modelBtns = document.querySelectorAll(".model-pill");

    if (!output || !form || !input) return;

    let activeModel = "Claude";
    let streaming = false;

    modelBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        modelBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeModel = btn.dataset.model || "Claude";
        showToast(`Switched agent runtime to ${activeModel}`);
      });
    });

    const KNOWLEDGE = {
      ai: {
        tool: 'mcp.cv.get_ai_stack({ focus: "agents_llms_dl" })',
        answer:
          "Al Amin Mahfuz architects production AI solutions across 5 pillars: (1) Deterministic Prompt Engineering & structured outputs, (2) LLM API integrations using Anthropic Claude, Google Gemini & OpenAI GPT in NodeJS, Django & NextJS, (3) Multi-step AI Agents connected via Model Context Protocol (MCP), (4) Deep Learning & neural network training in Python (PyTorch, TensorFlow, Keras), and (5) High-velocity engineering with Antigravity, Cursor, Windsurf & GitHub Copilot."
      },
      fullstack: {
        tool: 'mcp.cv.get_engineering_profile({ layer: "fullstack" })',
        answer:
          "On the Full-Stack side (including 3+ years as Full Stack Developer at KP Software Solutions and continuous architecture work), Al Amin builds responsive UIs with ReactJS, NextJS, React Native & Tailwind CSS, paired with NodeJS/ExpressJS and Python/Django backends, REST APIs, and MySQL, PostgreSQL, MongoDB, SQL Server & Firebase databases."
      },
      teaching: {
        tool: 'mcp.cv.get_academic_career({ current: "RSTU", previous: "CUB" })',
        answer:
          "Al Amin Mahfuz currently serves as Senior Lecturer in the Department of CSE at Rajshahi Science and Technology University (RSTU), Natore (2026–Present). Previously, he served at Canadian University of Bangladesh (CUB) as Lecturer in CSE (2022–2026) and Teaching Assistant (2021–2022). He teaches programming languages, software engineering, web technologies & AI fundamentals, designs modern curricula, and supervises undergraduate research & capstone projects."
      },
      clients: {
        tool: 'mcp.cv.get_notable_clients_and_events()',
        answer:
          "Al Amin has collaborated with premier national & enterprise institutions in Bangladesh — including Bangladesh Computer Council (BCC), Bangladesh Hi-Tech Park Authority, and SSL Wireless — and served as Team Associate (Social Media & Web Applications) for ICPC 2022 under the ICT Division."
      },
      hire: {
        tool: 'mcp.cv.get_contact_channels()',
        answer:
          "Ready to collaborate! Reach Al Amin directly at sojol.cub@gmail.com or +880 1701 012207 / +880 1717 704609 (South Badda, Dhaka-1212), or send an instant message via the Direct Transmission form in the Contact Command Deck below."
      }
    };

    function matchQuestion(q) {
      const s = q.toLowerCase();
      if (s.includes("teach") || s.includes("lectur") || s.includes("senior") || s.includes("rstu") || s.includes("rajshahi") || s.includes("natore") || s.includes("cub") || s.includes("universit") || s.includes("academ")) {
        return KNOWLEDGE.teaching;
      }
      if (s.includes("client") || s.includes("bcc") || s.includes("icpc") || s.includes("ssl") || s.includes("park")) {
        return KNOWLEDGE.clients;
      }
      if (s.includes("contact") || s.includes("email") || s.includes("phone") || s.includes("hire") || s.includes("reach") || s.includes("collaborat")) {
        return KNOWLEDGE.hire;
      }
      if (s.includes("react") || s.includes("node") || s.includes("django") || s.includes("database") || s.includes("sql") || s.includes("mongo") || s.includes("web") || s.includes("stack")) {
        return KNOWLEDGE.fullstack;
      }
      return KNOWLEDGE.ai;
    }

    function runAgentQuery(promptLabel, dataObj) {
      if (streaming) return;
      streaming = true;

      if (CMS) {
        try { CMS.recordAiQuery(promptLabel, activeModel); } catch { /* ignore */ }
      }

      const userDiv = document.createElement("div");
      userDiv.className = "term-msg term-user";
      userDiv.textContent = `> ${promptLabel}`;
      output.appendChild(userDiv);

      const traceDiv = document.createElement("div");
      traceDiv.className = "term-msg term-trace";
      traceDiv.textContent = `▸ [${activeModel} + MCP] invoking ${dataObj.tool} ... 200 OK (14ms)`;
      output.appendChild(traceDiv);

      const aiDiv = document.createElement("div");
      aiDiv.className = "term-msg term-ai";
      const badge = document.createElement("span");
      badge.className = "term-badge";
      badge.textContent = activeModel.toUpperCase();
      const textSpan = document.createElement("span");
      aiDiv.appendChild(badge);
      aiDiv.appendChild(textSpan);
      output.appendChild(aiDiv);
      output.scrollTop = output.scrollHeight;

      const full = dataObj.answer;
      if (prefersReducedMotion) {
        textSpan.textContent = full;
        streaming = false;
        output.scrollTop = output.scrollHeight;
        return;
      }

      let idx = 0;
      function streamStep() {
        idx += 4;
        textSpan.textContent = full.slice(0, idx);
        output.scrollTop = output.scrollHeight;
        if (idx < full.length) {
          requestAnimationFrame(streamStep);
        } else {
          streaming = false;
        }
      }
      setTimeout(() => requestAnimationFrame(streamStep), 180);
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const key = chip.dataset.query || "ai";
        runAgentQuery(chip.textContent.trim(), KNOWLEDGE[key] || KNOWLEDGE.ai);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      input.value = "";
      runAgentQuery(val, matchQuestion(val));
    });
  }

  /* -------------------- 10. SCROLL CHOREOGRAPHY, COUNTERS & GAUGES -------------------- */
  function animateCounter(el) {
    if (el.dataset.counted === "1") return;
    el.dataset.counted = "1";
    const target = parseInt(el.dataset.target || "0", 10);
    if (prefersReducedMotion || isInstantPreview) {
      el.textContent = String(target);
      return;
    }
    const dur = 1400;
    const t0 = performance.now();

    function frame(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = String(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function activateRevealElement(el) {
    if (el.classList.contains("in-view")) return;
    el.classList.add("in-view");
    el.querySelectorAll(".counter").forEach(animateCounter);
    if (el.classList.contains("counter")) animateCounter(el);
    el.querySelectorAll(".scramble-on-view").forEach((s) => scrambleElement(s, 720));
  }

  function initScrollSystems() {
    const revealEls = Array.from(document.querySelectorAll(".reveal-up, .reveal-scale, .reveal-left, .reveal-right"));

    if ("IntersectionObserver" in window) {
      const revealObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activateRevealElement(entry.target);
            revealObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05 });

      revealEls.forEach((el) => revealObs.observe(el));
    }

    function checkViewportReveals() {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      revealEls.forEach((el) => {
        if (el.classList.contains("in-view")) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.96 && r.bottom > -20) {
          activateRevealElement(el);
        }
      });
    }

    // Scramble on hover for hero title words
    document.querySelectorAll(".scramble-text").forEach((el) => {
      el.addEventListener("mouseenter", () => scrambleElement(el, 520));
    });

    // Scroll progress laser + timeline laser + scroll spy
    const topLaser = document.getElementById("scroll-laser");
    const timeline = document.getElementById("experience-timeline");
    const timelineLaser = document.getElementById("timeline-laser");
    const spySections = document.querySelectorAll(".section-spy");
    const navLinks = document.querySelectorAll(".nav-link");

    let lastY = window.scrollY;
    let ticking = false;

    function updateOnScroll() {
      checkViewportReveals();
      const y = window.scrollY;
      const dy = Math.abs(y - lastY);
      scrollBoost = Math.min(dy * 0.06, 3.2);
      lastY = y;

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
      if (topLaser) topLaser.style.width = `${pct.toFixed(2)}%`;

      // Experience laser rail
      if (timeline && timelineLaser) {
        const rect = timeline.getBoundingClientRect();
        const triggerPoint = window.innerHeight * 0.62;
        const progress = Math.max(0, Math.min(1, (triggerPoint - rect.top) / rect.height));
        timelineLaser.style.height = `${(progress * 100).toFixed(1)}%`;

        timeline.querySelectorAll(".timeline-item").forEach((item) => {
          const itemRect = item.getBoundingClientRect();
          if (itemRect.top < triggerPoint) {
            item.classList.add("ignited");
          } else {
            item.classList.remove("ignited");
          }
        });
      }

      // Active navbar link spy
      let currentId = "hero";
      spySections.forEach((sec) => {
        if (sec.hidden) return;
        const top = sec.offsetTop - 180;
        if (y >= top) currentId = sec.id;
      });
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.dataset.section === currentId);
      });

      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateOnScroll);
      }
    }, { passive: true });

    updateOnScroll();
  }

  /* -------------------- 11. UTILITIES: CLOCK, THEME, COPY, FORM, MENU -------------------- */
  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById("cyber-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function initUtilities() {
    // Live Dhaka Clock (UTC+6)
    const clockEl = document.getElementById("live-clock");
    function tickClock() {
      if (!clockEl) return;
      try {
        const str = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }).format(new Date());
        clockEl.textContent = `DAC ${str}`;
      } catch {
        clockEl.textContent = "DAC UTC+6";
      }
    }
    tickClock();
    setInterval(tickClock, 1000);

    // Theme toggle
    const themeBtn = document.getElementById("theme-toggle");
    themeBtn?.addEventListener("click", () => {
      const root = document.documentElement;
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      showToast(next === "dark" ? "NEURAL DARK MODE ACTIVE" : "ACADEMIC LIGHT MODE ACTIVE");
    });

    // Mobile drawer toggle
    const menuBtn = document.getElementById("mobile-menu-btn");
    const navList = document.getElementById("nav-links");
    menuBtn?.addEventListener("click", () => {
      const open = navList?.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navList?.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => navList.classList.remove("open"));
    });

    // One-click clipboard copy
    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.getAttribute("data-copy") || "";
        try {
          await navigator.clipboard.writeText(text);
          showToast(`COPIED TO CLIPBOARD: ${text}`);
        } catch {
          showToast(`CHANNEL: ${text}`);
        }
      });
    });

    // Contact transmission form -> saves directly to Admin Dashboard Inbox + optional mailto
    const contactForm = document.getElementById("contact-form");
    contactForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("sender-name")?.value.trim() || "";
      const email = document.getElementById("sender-email")?.value.trim() || "";
      const topic = document.getElementById("sender-topic")?.value || "Collaboration";
      const message = document.getElementById("sender-msg")?.value.trim() || "";

      if (CMS) {
        CMS.addMessage({ name, email, topic, message });
        showToast("✓ TRANSMISSION DELIVERED TO ADMIN DASHBOARD INBOX!");
        contactForm.reset();
        return;
      }

      const subject = encodeURIComponent(`[Portfolio Uplink] ${topic} — from ${name}`);
      const body = encodeURIComponent(
        `Hello Al Amin Mahfuz,\n\n${message}\n\n---\nSender: ${name}\nEmail: ${email}\nVector: ${topic}`
      );
      showToast("TRANSMISSION PREPARED — OPENING MAIL CLIENT...");
      window.location.href = `mailto:sojol.cub@gmail.com?subject=${subject}&body=${body}`;
      contactForm.reset();
    });
  }

  /* -------------------- INITIALIZE EVERYTHING -------------------- */
  if (!prefersReducedMotion && !window.location.search.includes("skipboot=1")) {
    document.documentElement.classList.add("js-anim");
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (CMS) {
      applyCmsDataToDOM(activeCmsData, false);
      if (!isInstantPreview) {
        try { CMS.recordPageView(); } catch { /* ignore */ }
      }
      CMS.syncFromServerIfAvailable().then((remoteData) => {
        if (remoteData) applyCmsDataToDOM(remoteData, false);
      });
      CMS.onSync((freshData) => {
        applyCmsDataToDOM(freshData, true);
        showToast("LIVE UPDATE RECEIVED FROM ADMIN DECK");
      });
    }

    initNeuralCanvas();
    initCursorAndMagnetism();
    initSkillsMatrix();
    initAiTerminal();
    initTiltAndSpotlight();
    initUtilities();

    initBootScreen(() => {
      if (isInstantPreview) {
        document.documentElement.style.scrollBehavior = "auto";
        if (window.location.hash) {
          const targetEl = document.querySelector(window.location.hash);
          if (targetEl) targetEl.scrollIntoView();
        }
      }
      initScrollSystems();
      initTypewriter();
      if (!isInstantPreview) {
        document.querySelectorAll(".hero-title .scramble-text").forEach((el, idx) => {
          setTimeout(() => scrambleElement(el, 760), idx * 140);
        });
      }
    });
  });
})();
