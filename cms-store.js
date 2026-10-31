/* ==========================================================================
   NEURAL.CMS // SHARED DATA STORE, AUTH & LIVE MULTI-TAB SYNC ENGINE
   Works seamlessly via HTTP (/api/cms + localStorage) AND offline (file://)
   ========================================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "neural_cms_data_v1";
  const AUTH_KEY = "neural_cms_auth_session_v1";
  const CREDS_KEY = "neural_cms_admin_creds_v1";
  const CHANNEL_NAME = "neural_cms_live_sync";

  const SALT = "neural_cms_salt_2026::";

  // Compact pure-JS synchronous SHA-256 (works across https://, http://, and file://)
  function sha256Hex(ascii) {
    const rightRotate = (v, amt) => (v >>> amt) | (v << (32 - amt));
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = "";
    const words = [];
    const bytes = unescape(encodeURIComponent(ascii));
    const asciiBitLength = bytes.length * 8;

    const hash = [];
    const k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    let str = bytes + "\x80";
    while ((str.length % 64) - 56) str += "\x00";
    for (let i = 0; i < str.length; i++) {
      const j = str.charCodeAt(i);
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;

    for (let j = 0; j < words.length; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash.slice(0);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        const temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash.unshift((temp1 + temp2) | 0);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }

    for (let i = 0; i < 8; i++) {
      for (let j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? "0" : "") + b.toString(16);
      }
    }
    return result;
  }

  const DEFAULT_CREDENTIALS = {
    username: "sojol.cub@gmail.com",
    passwordHash: "3dd0adc0c93967ea3dcac1ba3fab235c5855c0f83683f42bdd7cc7f3433c762e"
  };

  const DEFAULT_CMS_DATA = {
    updatedAt: new Date().toISOString(),
    profile: {
      firstName: "AL AMIN",
      lastName: "MAHFUZ",
      headline: "Senior Lecturer in CSE • Full Stack Developer • AI Expert",
      availabilityText: "AVAILABLE FOR AI ARCHITECTURE, RESEARCH & FULL-STACK ROLES",
      isAvailable: true,
      heroBioHtml:
        'Computer Science &amp; Engineering <strong>Senior Lecturer at Rajshahi Science and Technology University (RSTU), Natore</strong>, <strong>Full Stack Developer</strong>, and <strong>AI Expert</strong> with <strong>7+ years of combined experience</strong>. I fuse modern web architectures (<span>ReactJS</span>, <span>NextJS</span>, <span>NodeJS</span>, <span>Django</span>) with frontier AI systems — building autonomous <strong>AI Agents</strong>, <strong>MCP workflows</strong>, production <strong>LLM integrations</strong>, and <strong>Deep Learning</strong> models in Python.',
      email: "sojol.cub@gmail.com",
      phonePrimary: "+880 1701 012207",
      phoneSecondary: "+880 1717 704609",
      location: "Nestor Living, 88/7, South Badda, Dhaka-1212, Bangladesh",
      linkedinUrl: "https://bd.linkedin.com/in/al-amin-mahfuz-05860220b",
      facebookUrl: "https://web.facebook.com/alaminmahfuz.sojol/",
      badgeRoleTitle: "Senior Lecturer",
      badgeRoleSub: "RSTU, Natore",
      metrics: {
        yearsExp: 7,
        llmApis: 3,
        totalTech: 34,
        studentsMentored: 1000
      },
      typewriterRoles: [
        "AI Expert & Agentic Workflow Architect",
        "Senior Lecturer in CSE @ RSTU, Natore",
        "Full Stack Developer — React, Next.js, Node & Django",
        "LLM API Integrator (Claude • Gemini • OpenAI)",
        "Deep Learning Engineer — PyTorch, TensorFlow & Keras"
      ]
    },

    experiences: [
      {
        id: "exp-rstu-2026",
        period: "2026 – PRESENT",
        badge: "CURRENT ROLE",
        isCurrent: true,
        role: "Senior Lecturer — Department of CSE",
        org: "Rajshahi Science and Technology University (RSTU), Natore",
        bullets: [
          "Deliver undergraduate Computer Science & Engineering lectures and labs across programming, software engineering, web technologies, and AI fundamentals.",
          "Supervise undergraduate thesis groups, full-stack software capstones, and AI-driven student research works.",
          "Design outcome-based CSE curricula, interactive lab assessments, and modern digital learning materials.",
          "Contribute to departmental academic planning, examination committees, and faculty leadership initiatives."
        ],
        tags: ["Senior CSE Faculty", "Thesis & Research Supervision", "AI & Web Curricula", "Academic Leadership"]
      },
      {
        id: "exp-cub-2022",
        period: "2022 – 2026",
        badge: "ACADEMIA",
        isCurrent: false,
        role: "Lecturer — Department of CSE",
        org: "Canadian University of Bangladesh (CUB)",
        bullets: [
          "Delivered undergraduate Computer Science & Engineering courses covering programming languages, modern web development, and data analysis.",
          "Supervised and mentored senior students on software engineering capstones and academic research works.",
          "Spearheaded the creation of digital learning resources, interactive lab curricula, and modernized course materials.",
          "Served actively on departmental academic committees, curriculum reviews, and faculty boards."
        ],
        tags: ["CSE Instruction", "Student Research Mentorship", "Web & Data Analysis", "Curriculum Design"]
      },
      {
        id: "exp-icpc-2022",
        period: "2022",
        badge: "NATIONAL / GLOBAL EVENT",
        isCurrent: false,
        role: "Team Associate (Social Media & Web Application)",
        org: "International Collegiate Programming Contest (ICPC) 2022",
        bullets: [
          "Selected for the official organizing team under the Bangladesh Computer Council (BCC) and the Ministry of ICT Division.",
          "Managed web application operations and digital social media communications for one of the world's premier algorithmic programming competitions."
        ],
        tags: ["ICPC World Finals Ecosystem", "BCC • ICT Division", "Web Operations"]
      },
      {
        id: "exp-cub-ta-2021",
        period: "2021 – 2022",
        badge: "ACADEMIA",
        isCurrent: false,
        role: "Teaching Assistant (TA)",
        org: "Canadian University of Bangladesh (CUB)",
        bullets: [
          "Led small-group tutorials, evaluated programming assignments & exams, and provided one-on-one debugging mentorship in CSE labs.",
          "Collaborated with faculty members on research projects through Python/C++ programming, data analysis, and technical experimentation.",
          "Co-developed syllabi, lab problem sets, and lesson plans while administering course portals, exam schedules, and academic records."
        ],
        tags: ["CSE Labs", "Faculty Research Support", "C++ & Python"]
      },
      {
        id: "exp-kp-2016",
        period: "2016 – 2019",
        badge: "INDUSTRY ENGINEERING",
        isCurrent: false,
        role: "Full Stack Developer",
        org: "KP Software Solutions",
        bullets: [
          "Engineered responsive component-driven frontends with ReactJS, HTML5, CSS3, and JavaScript, managing state and client-side routing.",
          "Architected NodeJS & ExpressJS RESTful APIs backed by MongoDB schemas, authentication pipelines, and server-side validation.",
          "Implemented automated test suites evaluating application performance, security posture, and horizontal scalability.",
          "Configured and maintained production servers, databases, and deployment workflows in close collaboration with stakeholders and UI designers."
        ],
        tags: ["ReactJS", "NodeJS & ExpressJS", "MongoDB", "REST APIs", "Production DevOps"]
      }
    ],

    skills: [
      { id: "sk-1", name: "Prompt Engineering", cat: "ai", tag: "LLM Core", note: "System prompts, few-shot & structured schemas", lvl: 97 },
      { id: "sk-2", name: "Claude (Anthropic)", cat: "ai", tag: "LLM & API", note: "Reasoning workflows, tool-use & API integration", lvl: 96 },
      { id: "sk-3", name: "Google Gemini", cat: "ai", tag: "LLM & API", note: "Multimodal & high-context Gemini API apps", lvl: 96 },
      { id: "sk-4", name: "ChatGPT / OpenAI API", cat: "ai", tag: "LLM & API", note: "GPT streaming chat, assistants & automation", lvl: 97 },
      { id: "sk-5", name: "AI Agents & Workflows", cat: "ai", tag: "Agentic", note: "Multi-step autonomous tool-calling agents", lvl: 95 },
      { id: "sk-6", name: "Model Context Protocol", cat: "ai", tag: "MCP", note: "Connecting LLMs to live data, tools & APIs", lvl: 94 },
      { id: "sk-7", name: "Deep Learning", cat: "ai", tag: "Neural Eng.", note: "Neural network architecture & training in Python", lvl: 90 },
      { id: "sk-8", name: "PyTorch & TensorFlow", cat: "ai", tag: "DL Frameworks", note: "Including Keras model pipelines & evaluation", lvl: 89 },
      { id: "sk-9", name: "Antigravity IDE", cat: "ai", tag: "Agentic IDE", note: "Autonomous multi-file AI pair programming", lvl: 96 },
      { id: "sk-10", name: "Cursor & Windsurf", cat: "ai", tag: "AI Editors", note: "AI-native full-stack refactoring & shipping", lvl: 96 },
      { id: "sk-11", name: "GitHub Copilot", cat: "ai", tag: "AI Coding", note: "Accelerated code generation, tests & docs", lvl: 97 },
      { id: "sk-12", name: "ReactJS", cat: "frontend", tag: "Frontend", note: "Reusable component systems & state management", lvl: 96 },
      { id: "sk-13", name: "NextJS", cat: "frontend", tag: "Full-Stack", note: "SSR, routing & modern React web applications", lvl: 94 },
      { id: "sk-14", name: "React Native", cat: "frontend", tag: "Mobile UI", note: "Cross-platform mobile & tablet interfaces", lvl: 90 },
      { id: "sk-15", name: "React Router", cat: "frontend", tag: "SPA Routing", note: "Dynamic client-side navigation architectures", lvl: 95 },
      { id: "sk-16", name: "Tailwind CSS", cat: "frontend", tag: "Styling", note: "Utility-first responsive design systems", lvl: 96 },
      { id: "sk-17", name: "HTML5, CSS3 & Bootstrap", cat: "frontend", tag: "Web Core", note: "Semantic markup & handset-specific responsive UI", lvl: 98 },
      { id: "sk-18", name: "Python", cat: "backend", tag: "Language", note: "AI/ML, Django backends, data analysis & scripting", lvl: 96 },
      { id: "sk-19", name: "JavaScript (ES6+)", cat: "backend", tag: "Language", note: "Async full-stack web & interactive architectures", lvl: 96 },
      { id: "sk-20", name: "C++", cat: "backend", tag: "Language", note: "Competitive programming, algorithms & CSE labs", lvl: 91 },
      { id: "sk-21", name: "NodeJS & ExpressJS", cat: "backend", tag: "Backend", note: "Scalable server-side logic, auth & middleware", lvl: 95 },
      { id: "sk-22", name: "Django", cat: "backend", tag: "Python Web", note: "Secure, batteries-included web & API backends", lvl: 93 },
      { id: "sk-23", name: "REST API & JSON", cat: "backend", tag: "Architecture", note: "Client-server API design, validation & integration", lvl: 96 },
      { id: "sk-24", name: "MongoDB", cat: "database", tag: "NoSQL", note: "Schema design, aggregation & Node/Express apps", lvl: 94 },
      { id: "sk-25", name: "PostgreSQL & MySQL", cat: "database", tag: "Relational", note: "Normalized relational modeling & SQL optimization", lvl: 93 },
      { id: "sk-26", name: "Firebase", cat: "database", tag: "BaaS / Realtime", note: "Realtime DB, authentication & cloud hosting", lvl: 92 },
      { id: "sk-27", name: "SQL Server & Sybase", cat: "database", tag: "Enterprise DB", note: "Enterprise relational querying & MS Access", lvl: 86 },
      { id: "sk-28", name: "Linear Algebra & Calculus", cat: "foundations", tag: "Math Core", note: "Mathematical backbone for ML & neural networks", lvl: 88 },
      { id: "sk-29", name: "Statistics & Probability", cat: "foundations", tag: "Data Science", note: "Statistical modeling & quantitative data analysis", lvl: 89 },
      { id: "sk-30", name: "Linux & Windows", cat: "foundations", tag: "Platforms", note: "Development environments & production server ops", lvl: 92 },
      { id: "sk-31", name: "Computer Networking & Sec", cat: "foundations", tag: "Systems", note: "Stack Exchange (InfoSec) problem solver", lvl: 87 },
      { id: "sk-32", name: "Photoshop & Illustrator", cat: "foundations", tag: "Creative", note: "2D graphics, motion basics & visual assets", lvl: 84 }
    ],

    publicationsSectionEnabled: true,
    publications: [
      {
        id: "pub-ijsrp-2024",
        title: "Enterprise Cyber Security Management Using Scapy and Kali Linux",
        journal: "International Journal of Scientific and Research Publications (IJSRP)",
        volumeIssue: "Volume 14, Issue 6, pp. 172–181",
        date: "June 2024",
        issn: "2250-3153",
        doi: "10.29322/IJSRP.14.06.2024.p15015",
        doiUrl: "https://doi.org/10.29322/IJSRP.14.06.2024.p15015",
        pdfUrl: "https://www.ijsrp.org/research-paper-0624/ijsrp-p15015.pdf",
        authors: "Dewan Juel Rahman, Al Amin Mahfuz, Most. Mithyla Zaman",
        affiliation: "Department of Computer Science and Engineering, Rajshahi Science and Technology University (RSTU), Natore, Bangladesh",
        abstract:
          "Proposes an enterprise and academic network security management framework built with Python, Scapy interactive packet manipulation, and Kali Linux penetration testing. Evaluates organizational network defenses against ARP spoofing, packet sniffing, and DNS spoofing while enabling group-based internet security monitoring across corporate workstations and university laboratories (supported by the DASPiB cybersecurity initiative).",
        keywords: [
          "Internet Security",
          "Kali Linux",
          "Scapy",
          "Python Network Security",
          "Packet Sniffing",
          "ARP & DNS Spoofing Defense",
          "Internet Security Monitoring"
        ]
      }
    ],

    projectsSectionEnabled: true,
    projects: [
      {
        id: "proj-1",
        title: "MCP Multi-Model Agent Orchestrator",
        category: "AI Agents & MCP",
        summary: "Autonomous agentic hub connecting Claude, Google Gemini, and OpenAI GPT APIs to live databases and external REST tools via Model Context Protocol.",
        tags: ["Python", "MCP", "Claude API", "Gemini API", "NextJS"],
        liveUrl: "#ai-lab",
        repoUrl: "",
        featured: true
      },
      {
        id: "proj-2",
        title: "Smart University Learning & Lab Portal",
        category: "Full-Stack EdTech",
        summary: "Interactive digital learning resource platform, programming assignment evaluator, and student mentorship tracker built for CSE coursework.",
        tags: ["ReactJS", "NodeJS", "ExpressJS", "MongoDB", "Tailwind CSS"],
        liveUrl: "#experience",
        repoUrl: "",
        featured: true
      },
      {
        id: "proj-3",
        title: "Deep Learning Vision & Analytics Suite",
        category: "Deep Learning",
        summary: "End-to-end neural network training, inference dashboard, and statistical evaluation pipeline engineered in Python.",
        tags: ["Python", "PyTorch", "TensorFlow", "Django", "PostgreSQL"],
        liveUrl: "#arsenal",
        repoUrl: "",
        featured: true
      }
    ],

    messages: [
      {
        id: "msg-welcome-1",
        name: "NEURAL.CMS System",
        email: "sojol.cub@gmail.com",
        topic: "System Initialization",
        message: "Welcome to your futuristic Admin Command Deck! Any messages submitted through your portfolio's 'Send Direct Transmission' form appear right here in real time.",
        createdAt: new Date().toISOString(),
        read: false,
        starred: true
      }
    ],

    analytics: {
      pageViews: 128,
      dailyViews: [14, 19, 17, 24, 21, 29, 32],
      aiQueries: [
        { q: "What AI & MCP systems do you build?", model: "Claude", at: new Date().toISOString() },
        { q: "Academic role at RSTU & CUB?", model: "Gemini", at: new Date().toISOString() }
      ]
    }
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  let channel = null;
  try {
    if ("BroadcastChannel" in global) {
      channel = new BroadcastChannel(CHANNEL_NAME);
    }
  } catch {
    channel = null;
  }

  function mergeWithDefaults(parsed) {
    if (!parsed || typeof parsed !== "object") return clone(DEFAULT_CMS_DATA);
    const def = clone(DEFAULT_CMS_DATA);
    return {
      updatedAt: parsed.updatedAt || def.updatedAt,
      profile: Object.assign(def.profile, parsed.profile || {}, {
        metrics: Object.assign(def.profile.metrics, parsed.profile?.metrics || {}),
        typewriterRoles: Array.isArray(parsed.profile?.typewriterRoles) && parsed.profile.typewriterRoles.length > 0
          ? parsed.profile.typewriterRoles
          : def.profile.typewriterRoles
      }),
      experiences: Array.isArray(parsed.experiences) && parsed.experiences.length > 0 ? parsed.experiences : def.experiences,
      skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : def.skills,
      publicationsSectionEnabled: parsed.publicationsSectionEnabled !== false,
      publications: Array.isArray(parsed.publications) ? parsed.publications : def.publications,
      projectsSectionEnabled: parsed.projectsSectionEnabled !== false,
      projects: Array.isArray(parsed.projects) ? parsed.projects : def.projects,
      messages: Array.isArray(parsed.messages) ? parsed.messages : def.messages,
      analytics: Object.assign(def.analytics, parsed.analytics || {})
    };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = clone(DEFAULT_CMS_DATA);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw);
      return mergeWithDefaults(parsed);
    } catch {
      return clone(DEFAULT_CMS_DATA);
    }
  }

  async function syncFromServerIfAvailable() {
    if (global.location.protocol === "file:") return loadData();

    let remote = null;

    // 1. Try dynamic /api/cms (for local Node.js server)
    try {
      const res = await fetch("/api/cms", { cache: "no-store" });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await res.json();
          if (json && json.profile) remote = json;
        }
      }
    } catch {
      // ignore
    }

    // 2. Try dynamic Cloud Database (/cms.json on Firebase Realtime DB)
    if (!remote) {
      try {
        const cfg = getDatabaseConfig();
        const dbUrl = (cfg.databaseURL || cfg.firebaseUrl || "").replace(/\/+$/, "");
        if (dbUrl) {
          const res = await fetch(`${dbUrl}/cms.json`, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (json && json.profile) remote = json;
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. If Cloud DB not available, try static data file (works on GitHub Pages, Netlify, static hosts)
    if (!remote) {
      try {
        const staticUrl = "./data/cms-data.json?v=" + Date.now();
        const res = await fetch(staticUrl, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json && json.profile) remote = json;
        }
      } catch {
        // ignore
      }
    }

    // 4. Fallback to /data/cms-data.json with absolute root
    if (!remote) {
      try {
        const staticUrl = "/data/cms-data.json?v=" + Date.now();
        const res = await fetch(staticUrl, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json && json.profile) remote = json;
        }
      } catch {
        // ignore
      }
    }

    if (remote) {
      const local = loadData();
      const localRaw = localStorage.getItem(STORAGE_KEY);
      const isLocalInitialized = Boolean(localRaw);

      const remoteTime = new Date(remote.updatedAt || 0).getTime();
      const localTime = new Date(local.updatedAt || 0).getTime();

      // If remote data is newer or local is uninitialized, adopt remote data
      if (!isLocalInitialized || remoteTime >= localTime) {
        const merged = mergeWithDefaults(remote);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      } else {
        // Local is newer! Keep local data so user's recent edits in admin are never erased.
        return local;
      }
    }

    return loadData();
  }

  function saveData(nextData, silent = false) {
    nextData.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    } catch (err) {
      console.warn("CMS localStorage write warning:", err);
    }

    if (!silent && channel) {
      try {
        channel.postMessage({ type: "CMS_UPDATED", updatedAt: nextData.updatedAt });
      } catch {
        // ignore
      }
    }

    if (global.location.protocol !== "file:") {
      fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextData)
      }).catch(() => {});
    }

    return nextData;
  }

  function resetToDefaults() {
    const fresh = clone(DEFAULT_CMS_DATA);
    return saveData(fresh);
  }

  /* -------------------- AUTHENTICATION -------------------- */
  function getAdminCredentials() {
    try {
      const raw = localStorage.getItem(CREDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.username && parsed.passwordHash) return parsed;
      }
    } catch {
      // fallback
    }
    return clone(DEFAULT_CREDENTIALS);
  }

  function updateAdminCredentials(username, password) {
    const creds = {
      username: String(username).trim(),
      passwordHash: sha256Hex(SALT + String(password))
    };
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    return creds;
  }

  function resetAdminCredentials() {
    localStorage.removeItem(CREDS_KEY);
    return clone(DEFAULT_CREDENTIALS);
  }

  function login(username, password, remember = true) {
    const creds = getAdminCredentials();
    const uOk = String(username || "").trim().toLowerCase() === creds.username.toLowerCase();
    const candidateHash = sha256Hex(SALT + String(password || ""));
    const pOk = candidateHash === creds.passwordHash;
    if (!uOk || !pOk) {
      return { ok: false, error: "Invalid credentials. Access denied by NEURAL.OS Security Gate." };
    }
    const tokenPayload = {
      user: creds.username,
      role: "SUPER_ADMIN",
      loginAt: new Date().toISOString(),
      token: "ncms_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
    };
    const store = remember ? localStorage : sessionStorage;
    store.setItem(AUTH_KEY, JSON.stringify(tokenPayload));
    return { ok: true, session: tokenPayload };
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  }

  /* -------------------- TELEMETRY & INBOX (NON-DESTRUCTIVE) -------------------- */
  function recordPageView() {
    try {
      const data = loadData();
      data.analytics = data.analytics || {};
      data.analytics.pageViews = (data.analytics.pageViews || 0) + 1;
      if (Array.isArray(data.analytics.dailyViews) && data.analytics.dailyViews.length > 0) {
        const last = data.analytics.dailyViews.length - 1;
        data.analytics.dailyViews[last] = (data.analytics.dailyViews[last] || 0) + 1;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  function recordAiQuery(question, model) {
    try {
      const data = loadData();
      data.analytics = data.analytics || {};
      if (!Array.isArray(data.analytics.aiQueries)) data.analytics.aiQueries = [];
      data.analytics.aiQueries.unshift({
        q: String(question).slice(0, 160),
        model: model || "Claude",
        at: new Date().toISOString()
      });
      data.analytics.aiQueries = data.analytics.aiQueries.slice(0, 30);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  /* ==========================================================================
     NEURAL.DATABASE // MULTI-ENGINE DATABASE FOR MESSAGES & ADMIN PORTAL
     Works seamlessly with Firebase Realtime Database, Local Node API, and LocalStorage
     ========================================================================== */
  const DB_CONFIG_KEY = "neural_cms_db_config_v2";
  const DEFAULT_DB_CONFIG = {
    provider: "firebase", // "firebase" | "auto" | "server"
    databaseURL: "https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com",
    firebaseUrl: "https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com",
    apiKey: "",
    authDomain: "alaminmahfuz-portfolio.firebaseapp.com",
    projectId: "alaminmahfuz-portfolio",
    autoSync: true
  };

  function getDatabaseConfig() {
    try {
      const raw = localStorage.getItem(DB_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = Object.assign(clone(DEFAULT_DB_CONFIG), parsed);
        merged.databaseURL = (merged.databaseURL || merged.firebaseUrl || DEFAULT_DB_CONFIG.databaseURL).trim();
        merged.firebaseUrl = merged.databaseURL;
        return merged;
      }
    } catch {
      // ignore
    }
    return clone(DEFAULT_DB_CONFIG);
  }

  function saveDatabaseConfig(cfg) {
    const current = getDatabaseConfig();
    const merged = Object.assign(current, cfg || {});
    merged.databaseURL = (merged.databaseURL || merged.firebaseUrl || DEFAULT_DB_CONFIG.databaseURL).trim();
    merged.firebaseUrl = merged.databaseURL;
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(merged));
    return merged;
  }

  async function testDatabaseConnection() {
    const cfg = getDatabaseConfig();
    const start = performance.now();
    const dbUrl = (cfg.databaseURL || cfg.firebaseUrl || "").replace(/\/+$/, "");

    // 1. If not file://, test local server DB endpoint first
    let localStatus = null;
    if (global.location.protocol !== "file:") {
      try {
        const res = await fetch("/api/db/status", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          localStatus = {
            ok: true,
            provider: "Node.js Local Server Database",
            storage: "data/messages.json & data/cms-data.json",
            messagesCount: json.messagesCount,
            unreadCount: json.unreadCount,
            latencyMs: Math.round(performance.now() - start)
          };
        }
      } catch {
        // ignore
      }
    }

    // 2. Test Firebase Realtime Database
    let firebaseStatus = null;
    if (dbUrl) {
      try {
        const fbStart = performance.now();
        const pingUrl = `${dbUrl}/messages.json?shallow=true${cfg.apiKey ? `&auth=${cfg.apiKey}` : ""}`;
        const res = await fetch(pingUrl, { cache: "no-store" });
        const latency = Math.round(performance.now() - fbStart);

        if (res.ok) {
          firebaseStatus = {
            ok: true,
            provider: "Firebase Realtime Database",
            storage: dbUrl,
            statusText: "Connected (Read/Write Operational)",
            latencyMs: latency
          };
        } else if (res.status === 401 || res.status === 403) {
          firebaseStatus = {
            ok: false,
            provider: "Firebase Realtime Database",
            storage: dbUrl,
            statusText: "Rules Restricted: Realtime Database Security Rules currently deny public access. Set '.read': true, '.write': true in Firebase Console.",
            latencyMs: latency
          };
        } else if (res.status === 404) {
          firebaseStatus = {
            ok: false,
            provider: "Firebase Realtime Database",
            storage: dbUrl,
            statusText: "Database Not Found (404): Please click 'Create Database' under 'Realtime Database' in your Firebase Console (https://console.firebase.google.com).",
            latencyMs: latency
          };
        } else {
          firebaseStatus = {
            ok: false,
            provider: "Firebase Realtime Database",
            storage: dbUrl,
            statusText: `Firebase responded with HTTP ${res.status}.`,
            latencyMs: latency
          };
        }
      } catch (err) {
        firebaseStatus = {
          ok: false,
          provider: "Firebase Realtime Database",
          storage: dbUrl,
          statusText: "Network/CORS connection check failed: " + err.message,
          latencyMs: Math.round(performance.now() - start)
        };
      }
    }

    if (firebaseStatus && firebaseStatus.ok) return firebaseStatus;
    if (localStatus && localStatus.ok) return { ...localStatus, firebaseInfo: firebaseStatus };
    if (firebaseStatus) return firebaseStatus;

    return {
      ok: true,
      provider: "Offline LocalStorage & Git Sync Engine",
      storage: "Browser LocalStorage Vault",
      statusText: "Offline Resilience Active",
      latencyMs: 1
    };
  }

  async function addMessage({ name, email, topic, message }) {
    const entry = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      name: String(name || "Anonymous").trim(),
      email: String(email || "").trim(),
      topic: String(topic || "General Inquiry").trim(),
      message: String(message || "").trim(),
      createdAt: new Date().toISOString(),
      read: false,
      starred: false
    };

    // 1. Save locally in localStorage immediately
    try {
      const data = loadData();
      if (!Array.isArray(data.messages)) data.messages = [];
      data.messages.unshift(entry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (channel) {
        channel.postMessage({ type: "CMS_MESSAGE_RECEIVED", entry });
      }
    } catch (err) {
      console.warn("CMS addMessage warning:", err);
    }

    // 2. Post to Local Node.js Server (/api/messages) if reachable
    if (global.location.protocol !== "file:") {
      try {
        fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry)
        }).catch(() => {});
      } catch {
        // static or offline
      }
    }

    // 3. Post to Firebase Cloud Realtime Database if configured
    const cfg = getDatabaseConfig();
    const dbUrl = (cfg.databaseURL || cfg.firebaseUrl || "").replace(/\/+$/, "");
    if (dbUrl) {
      try {
        fetch(`${dbUrl}/messages.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry)
        }).catch((err) => console.warn("Firebase message post async error:", err));
      } catch (err) {
        console.warn("Firebase message post error:", err);
      }
    }

    // 4. Free Direct Cloud Email Delivery (FormSubmit.co - 100% Free Forever, No Credit Card)
    try {
      fetch("https://formsubmit.co/ajax/sojol.cub@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          _subject: `[Portfolio Transmission] ${entry.topic} — from ${entry.name}`,
          _template: "table",
          _captcha: "false",
          name: entry.name,
          email: entry.email,
          topic: entry.topic,
          message: entry.message,
          timestamp: entry.createdAt
        })
      }).catch(() => {});
    } catch {
      // ignore
    }

    return entry;
  }

  async function fetchMessagesFromDatabase() {
    let remoteMessages = [];

    // 1. Try local server /api/messages
    if (global.location.protocol !== "file:") {
      try {
        const res = await fetch("/api/messages", { cache: "no-store" });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) remoteMessages = list;
        }
      } catch {
        // ignore
      }
    }

    // 2. If no server messages, try Firebase Realtime Database
    if (remoteMessages.length === 0) {
      const cfg = getDatabaseConfig();
      if (cfg.firebaseUrl) {
        try {
          const cleanUrl = cfg.firebaseUrl.replace(/\/+$/, "");
          const res = await fetch(`${cleanUrl}/messages.json`, { cache: "no-store" });
          if (res.ok) {
            const fbObj = await res.json();
            if (fbObj && typeof fbObj === "object") {
              remoteMessages = Object.entries(fbObj).map(([key, val]) => ({
                id: val.id || key,
                name: val.name || "Anonymous",
                email: val.email || "",
                topic: val.topic || "General",
                message: val.message || "",
                createdAt: val.createdAt || new Date().toISOString(),
                read: Boolean(val.read),
                starred: Boolean(val.starred)
              }));
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // 3. Merge with local messages deduplicating by ID
    const local = loadData();
    const localMsgs = Array.isArray(local.messages) ? local.messages : [];
    const seen = new Set();
    const combined = [];

    for (const m of [...remoteMessages, ...localMsgs]) {
      if (m && m.id && !seen.has(m.id)) {
        seen.add(m.id);
        combined.push(m);
      }
    }

    combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Update local cache
    local.messages = combined;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    } catch {
      // ignore
    }

    return combined;
  }

  async function updateMessageStatusInDatabase(id, updates) {
    // 1. Update in local cache
    const data = loadData();
    if (Array.isArray(data.messages)) {
      const idx = data.messages.findIndex((m) => m.id === id);
      if (idx !== -1) {
        Object.assign(data.messages[idx], updates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    }

    // 2. Update on local server
    if (global.location.protocol !== "file:") {
      try {
        fetch("/api/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...updates })
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    // 3. Update on Firebase Realtime DB
    const cfg = getDatabaseConfig();
    if (cfg.firebaseUrl) {
      try {
        const cleanUrl = cfg.firebaseUrl.replace(/\/+$/, "");
        fetch(`${cleanUrl}/messages/${id}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  async function deleteMessageFromDatabase(id) {
    // 1. Delete from local cache
    const data = loadData();
    if (Array.isArray(data.messages)) {
      data.messages = data.messages.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // 2. Delete from local server
    if (global.location.protocol !== "file:") {
      try {
        fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
          method: "DELETE"
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    // 3. Delete from Firebase Realtime DB
    const cfg = getDatabaseConfig();
    if (cfg.firebaseUrl) {
      try {
        const cleanUrl = cfg.firebaseUrl.replace(/\/+$/, "");
        fetch(`${cleanUrl}/messages/${id}.json`, {
          method: "DELETE"
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  async function syncAllCmsToDatabase() {
    const data = loadData();

    // 1. Save to local server /api/cms
    let serverOk = false;
    if (global.location.protocol !== "file:") {
      try {
        const res = await fetch("/api/cms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (res.ok) serverOk = true;
      } catch {
        // ignore
      }
    }

    // 2. Save to Firebase Realtime DB
    let cloudOk = false;
    const cfg = getDatabaseConfig();
    if (cfg.firebaseUrl) {
      try {
        const cleanUrl = cfg.firebaseUrl.replace(/\/+$/, "");
        const res = await fetch(`${cleanUrl}/cms.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (res.ok) cloudOk = true;
      } catch (err) {
        console.warn("Firebase CMS sync error:", err);
      }
    }

    return { ok: serverOk || cloudOk, serverOk, cloudOk };
  }

  function onSync(callback) {
    if (channel) {
      channel.addEventListener("message", (ev) => {
        if (ev.data && (ev.data.type === "CMS_UPDATED" || ev.data.type === "CMS_MESSAGE_RECEIVED")) {
          callback(loadData());
        }
      });
    }
    global.addEventListener("storage", (ev) => {
      if (ev.key === STORAGE_KEY) {
        callback(loadData());
      }
    });
  }

  /* -------------------- GITHUB PAGES & CLOUD PUBLISH ENGINE -------------------- */
  const GITHUB_REPO = "sojolmahfuz/sojolmahfuz.github.io";
  const GITHUB_PAT_KEY = "neural_cms_github_pat_v1";

  function getSavedGitHubPat() {
    try {
      return localStorage.getItem(GITHUB_PAT_KEY) || "";
    } catch {
      return "";
    }
  }

  function saveGitHubPat(token) {
    try {
      if (token) localStorage.setItem(GITHUB_PAT_KEY, String(token).trim());
      else localStorage.removeItem(GITHUB_PAT_KEY);
    } catch {
      // ignore
    }
  }

  async function publishToGitHub(patToken, customMessage) {
    const token = String(patToken || getSavedGitHubPat()).trim();
    if (!token) {
      return {
        ok: false,
        error: "GitHub Personal Access Token is required to commit directly to GitHub Pages repository."
      };
    }

    const data = loadData();
    const filePath = "data/cms-data.json";
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    };

    // 1. Get current SHA of data/cms-data.json from GitHub
    let sha = null;
    try {
      const getRes = await fetch(apiUrl + "?ref=main", { headers, cache: "no-store" });
      if (getRes.ok) {
        const meta = await getRes.json();
        sha = meta.sha;
      }
    } catch (err) {
      console.warn("Could not retrieve current file SHA from GitHub:", err);
    }

    // 2. Base64 encode the CMS data with UTF-8 support
    const jsonStr = JSON.stringify(data, null, 2);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64Content = btoa(binary);

    const commitMessage = customMessage || `NeuralCMS Live Sync: ${new Date().toLocaleString("en-GB")}`;

    const payload = {
      message: commitMessage,
      content: b64Content,
      branch: "main"
    };
    if (sha) payload.sha = sha;

    try {
      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
      });
      const resJson = await putRes.json().catch(() => ({}));
      if (putRes.ok) {
        saveGitHubPat(token);
        return {
          ok: true,
          commitUrl: resJson.commit?.html_url || `https://github.com/${GITHUB_REPO}/commits/main`
        };
      } else {
        const msg = resJson.message || `GitHub API responded with status ${putRes.status}`;
        return { ok: false, error: msg };
      }
    } catch (err) {
      return { ok: false, error: String(err.message || err) };
    }
  }

  function exportJson() {
    const data = loadData();
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cms-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.profile) {
        return { ok: false, error: "Invalid snapshot: Missing profile section." };
      }
      const merged = mergeWithDefaults(parsed);
      saveData(merged);
      return { ok: true, data: merged };
    } catch (err) {
      return { ok: false, error: "Failed to parse JSON file: " + err.message };
    }
  }

  global.NeuralCMS = {
    DEFAULT_CMS_DATA,
    loadData,
    saveData,
    syncFromServerIfAvailable,
    resetToDefaults,
    mergeWithDefaults,
    login,
    logout,
    getSession,
    getAdminCredentials,
    updateAdminCredentials,
    resetAdminCredentials,
    recordPageView,
    recordAiQuery,
    addMessage,
    onSync,
    publishToGitHub,
    getSavedGitHubPat,
    saveGitHubPat,
    exportJson,
    importJson,
    // Database Layer
    getDatabaseConfig,
    saveDatabaseConfig,
    testDatabaseConnection,
    fetchMessagesFromDatabase,
    updateMessageStatusInDatabase,
    deleteMessageFromDatabase,
    syncAllCmsToDatabase
  };
})(window);

