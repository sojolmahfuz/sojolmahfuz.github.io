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

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = clone(DEFAULT_CMS_DATA);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw);
      return Object.assign(clone(DEFAULT_CMS_DATA), parsed, {
        profile: Object.assign(clone(DEFAULT_CMS_DATA.profile), parsed.profile || {}),
        analytics: Object.assign(clone(DEFAULT_CMS_DATA.analytics), parsed.analytics || {})
      });
    } catch {
      return clone(DEFAULT_CMS_DATA);
    }
  }

  async function syncFromServerIfAvailable() {
    if (global.location.protocol === "file:") return loadData();
    try {
      const res = await fetch("/api/cms", { cache: "no-store" });
      if (res.ok) {
        const remote = await res.json();
        if (remote && remote.profile) {
          const merged = Object.assign(clone(DEFAULT_CMS_DATA), remote, {
            profile: Object.assign(clone(DEFAULT_CMS_DATA.profile), remote.profile || {}),
            analytics: Object.assign(clone(DEFAULT_CMS_DATA.analytics), remote.analytics || {})
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {
      // Offline or static server without /api/cms — localStorage handles everything seamlessly
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

  /* -------------------- TELEMETRY HELPERS -------------------- */
  function recordPageView() {
    const data = loadData();
    data.analytics.pageViews = (data.analytics.pageViews || 0) + 1;
    if (Array.isArray(data.analytics.dailyViews) && data.analytics.dailyViews.length > 0) {
      const last = data.analytics.dailyViews.length - 1;
      data.analytics.dailyViews[last] = (data.analytics.dailyViews[last] || 0) + 1;
    }
    saveData(data, true);
  }

  function recordAiQuery(question, model) {
    const data = loadData();
    if (!Array.isArray(data.analytics.aiQueries)) data.analytics.aiQueries = [];
    data.analytics.aiQueries.unshift({
      q: String(question).slice(0, 160),
      model: model || "Claude",
      at: new Date().toISOString()
    });
    data.analytics.aiQueries = data.analytics.aiQueries.slice(0, 30);
    saveData(data);
  }

  function addMessage({ name, email, topic, message }) {
    const data = loadData();
    if (!Array.isArray(data.messages)) data.messages = [];
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
    data.messages.unshift(entry);
    saveData(data);
    return entry;
  }

  function onSync(callback) {
    if (channel) {
      channel.addEventListener("message", (ev) => {
        if (ev.data && ev.data.type === "CMS_UPDATED") {
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

  global.NeuralCMS = {
    DEFAULT_CMS_DATA,
    loadData,
    saveData,
    syncFromServerIfAvailable,
    resetToDefaults,
    login,
    logout,
    getSession,
    getAdminCredentials,
    updateAdminCredentials,
    resetAdminCredentials,
    recordPageView,
    recordAiQuery,
    addMessage,
    onSync
  };
})(window);

