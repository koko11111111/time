/* =========================================================
   1) ICONS (inline SVG, replaces emoji glyphs)
========================================================= */
const ICON_PATHS = {
  sun: '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>',
  grip: '<circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle>',
  undo: '<polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>',
  trash: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>',
  x: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
  archive: '<polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>',
  volumeOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>',
  bellOff: '<path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line>',
  flame: '<path d="M8.5 14.5a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>'
};
function svgIcon(name, extraClass){
  const cls = "icon" + (extraClass ? " " + extraClass : "");
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;
}

/* =========================================================
   2) STATE
========================================================= */
let uid = null;
let state = {
  displayName: "",
  email: "",
  photoURL: "",
  theme: "dark",
  soundEnabled: true,
  dailyGoalMinutes: 120,
  studyMinutes: 25,
  breakMinutes: 5,
  prayerMinutes: 15,
  personalMinutes: 10,
  todayMinutes: 0,
  todayDate: "",
  subjects: [], // {id, name, active, minutesStudied, lessons:[{id,title,done}], color, archived, order}
  dailyLog: {}, // "YYYY-MM-DD" -> minutes studied that day (drives streak + weekly chart)
  sessions: [] // {id, subject, minutes, at} — most recent first, capped at 50
};

let saveTimer = null;
function queueSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    if(!uid) return;
    db.collection("users").doc(uid).set(state, {merge:true}).catch(console.error);
  }, 500);
}

function todayStr(){
  return new Date().toISOString().slice(0,10);
}
function dateStr(d){
  return d.toISOString().slice(0,10);
}

/* =========================================================
   2B) THEME
========================================================= */
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  const icon = svgIcon(theme === "light" ? "moon" : "sun");
  ["themeToggleLanding", "themeToggleApp"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.innerHTML = icon;
  });
}
function toggleTheme(){
  const next = (state.theme === "light") ? "dark" : "light";
  state.theme = next;
  localStorage.setItem("studyflow-theme", next);
  applyTheme(next);
  if (uid) queueSave();
}
// Apply saved/system theme immediately, before sign-in state is known.
(function initTheme(){
  const saved = localStorage.getItem("studyflow-theme");
  const theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  state.theme = theme;
  applyTheme(theme);
})();
document.getElementById("themeToggleLanding").addEventListener("click", toggleTheme);
document.getElementById("themeToggleApp").addEventListener("click", toggleTheme);

/* =========================================================
   3) AUTH
========================================================= */
const authErrorEl = document.getElementById("authError");
const emailForm = document.getElementById("emailForm");
const nameFieldWrap = document.getElementById("nameFieldWrap");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const emailSubmitBtn = document.getElementById("emailSubmitBtn");
const authSwitchText = document.getElementById("authSwitchText");
const authSwitchBtn = document.getElementById("authSwitchBtn");
const forgotBtn = document.getElementById("forgotBtn");

let authMode = "login"; // or "signup"

function showAuthError(msg){
  authErrorEl.textContent = msg;
  authErrorEl.style.display = "block";
}
function clearAuthError(){
  authErrorEl.style.display = "none";
  authErrorEl.textContent = "";
}
function friendlyAuthError(err){
  switch (err.code) {
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/user-not-found": return "No account found with that email.";
    case "auth/wrong-password": return "Incorrect password. Try again.";
    case "auth/invalid-credential": return "Incorrect email or password.";
    case "auth/email-already-in-use": return "An account already exists with that email — try logging in instead.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    case "auth/missing-password": return "Enter a password.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user": return "Sign-in was closed before finishing.";
    default: return "Something went wrong. Please try again.";
  }
}

const pwToggleBtn = document.getElementById("pwToggleBtn");
pwToggleBtn.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  pwToggleBtn.innerHTML = showing ? svgIcon("eye") : svgIcon("eyeOff");
  pwToggleBtn.title = showing ? "Show password" : "Hide password";
  pwToggleBtn.classList.toggle("showing", !showing);
});

function setAuthMode(mode){
  authMode = mode;
  clearAuthError();
  if (mode === "signup") {
    nameFieldWrap.classList.remove("hidden");
    emailSubmitBtn.textContent = "Sign up";
    authSwitchText.textContent = "Already have an account?";
    authSwitchBtn.textContent = "Log in";
    forgotBtn.classList.add("hidden");
  } else {
    nameFieldWrap.classList.add("hidden");
    emailSubmitBtn.textContent = "Log in";
    authSwitchText.textContent = "Don't have an account?";
    authSwitchBtn.textContent = "Sign up";
    forgotBtn.classList.remove("hidden");
  }
}
setAuthMode("login");

authSwitchBtn.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "signup" : "login");
});

document.getElementById("googleSignIn").addEventListener("click", () => {
  clearAuthError();
  auth.signInWithPopup(provider).catch((err) => {
    console.error(err);
    showAuthError(friendlyAuthError(err));
  });
});

emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  emailSubmitBtn.disabled = true;
  try {
    if (authMode === "signup") {
      const name = nameInput.value.trim();
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (name) await cred.user.updateProfile({ displayName: name });
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  } catch (err) {
    console.error(err);
    showAuthError(friendlyAuthError(err));
  } finally {
    emailSubmitBtn.disabled = false;
  }
});

forgotBtn.addEventListener("click", async () => {
  clearAuthError();
  const email = emailInput.value.trim();
  if (!email) {
    showAuthError("Enter your email above first, then tap \u201cForgot password?\u201d");
    return;
  }
  try {
    await auth.sendPasswordResetEmail(email);
    authErrorEl.style.color = "var(--green-bright)";
    showAuthError("Password reset email sent — check your inbox.");
  } catch (err) {
    console.error(err);
    authErrorEl.style.color = "var(--danger)";
    showAuthError(friendlyAuthError(err));
  }
});

document.getElementById("signOutBtn").addEventListener("click", () => {
  stopTimer();
  auth.signOut();
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    uid = user.uid;
    document.getElementById("landing").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    emailForm.reset();
    passwordInput.type = "password";
    pwToggleBtn.innerHTML = svgIcon("eye");
    pwToggleBtn.classList.remove("showing");
    const firstName = user.displayName
      ? user.displayName.split(" ")[0]
      : (user.email ? user.email.split("@")[0] : "there");
    document.getElementById("userName").textContent = firstName;
    document.getElementById("userAvatar").src = user.photoURL || "";
    document.getElementById("userAvatar").style.display = user.photoURL ? "" : "none";

    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
      state = Object.assign({}, state, snap.data());
      applyTheme(state.theme || "dark");
      localStorage.setItem("studyflow-theme", state.theme || "dark");
    } else {
      state.displayName = user.displayName || "";
      state.email = user.email || "";
      state.photoURL = user.photoURL || "";
      state.todayDate = todayStr();
      await ref.set(state);
    }
    if (state.todayDate !== todayStr()) {
      state.todayDate = todayStr();
      state.todayMinutes = 0;
      queueSave();
    }
    renderAll();
  } else {
    uid = null;
    document.getElementById("app").classList.add("hidden");
    document.getElementById("landing").classList.remove("hidden");
  }
});

/* =========================================================
   4) SETTINGS INPUTS
========================================================= */
const studyMinInput = document.getElementById("studyMinInput");
const breakMinInput = document.getElementById("breakMinInput");
const prayerMinInput = document.getElementById("prayerMinInput");
const personalMinInput = document.getElementById("personalMinInput");
const goalInput = document.getElementById("goalInput");

studyMinInput.addEventListener("change", () => {
  state.studyMinutes = Math.max(1, parseInt(studyMinInput.value) || 25);
  queueSave();
  if (!timerRunning && timer.phase === "study") resetPhase();
});
breakMinInput.addEventListener("change", () => {
  state.breakMinutes = Math.max(1, parseInt(breakMinInput.value) || 5);
  queueSave();
  if (!timerRunning && timer.phase === "break") resetPhase();
});
prayerMinInput.addEventListener("change", () => {
  state.prayerMinutes = Math.max(1, parseInt(prayerMinInput.value) || 15);
  queueSave();
  if (!timerRunning && timer.phase === "prayer") resetPhase();
});
personalMinInput.addEventListener("change", () => {
  state.personalMinutes = Math.max(1, parseInt(personalMinInput.value) || 10);
  queueSave();
  if (!timerRunning && timer.phase === "personal") resetPhase();
});
goalInput.addEventListener("change", () => {
  state.dailyGoalMinutes = Math.max(5, parseInt(goalInput.value) || 120);
  queueSave();
  renderGoal();
});

/* =========================================================
   5) SUBJECTS + LESSONS
========================================================= */
function uid_(){ return Math.random().toString(36).slice(2,10); }

document.getElementById("addSubjectBtn").addEventListener("click", addSubject);
document.getElementById("newSubjectInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSubject();
});
const SUBJECT_COLORS = ["#4ade80", "#facc15", "#f87171", "#7dd3fc", "#c084fc", "#fb923c"];
function nextColor(){
  const used = state.subjects.map(s => s.color);
  return SUBJECT_COLORS.find(c => !used.includes(c)) || SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length];
}

function addSubject(){
  const input = document.getElementById("newSubjectInput");
  const name = input.value.trim();
  if (!name) return;
  state.subjects.push({ id: uid_(), name, active: true, archived: false, minutesStudied: 0, lessons: [], color: nextColor() });
  input.value = "";
  queueSave();
  renderSubjects();
  renderQueueHint();
}

function subjectCardHtml(subj, archived){
  const total = subj.lessons.length;
  const done = subj.lessons.filter(l => l.done).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  const color = subj.color || SUBJECT_COLORS[0];
  return `
    <div class="subject-card" data-cardid="${subj.id}" style="border-left:3px solid ${color};" ${archived ? "" : 'draggable="true"'}>
      <div class="subject-head">
        ${archived ? "" : `<span class="drag-handle" title="Drag to reorder">${svgIcon("grip")}</span>`}
        <div class="color-dot" data-colorid="${subj.id}" style="background:${color};" title="Change color"></div>
        <div class="name-wrap">
          <div>
            <div class="name">${escapeHtml(subj.name)}</div>
            <div class="meta">${subj.minutesStudied} min studied · ${done}/${total} lessons</div>
          </div>
        </div>
        ${archived
          ? `<button class="icon-btn" data-restore="${subj.id}" title="Restore subject">${svgIcon("undo")}</button>
             <button class="icon-btn" data-del="${subj.id}" title="Delete permanently">${svgIcon("trash")}</button>`
          : `<div class="toggle ${subj.active ? "on" : ""}" data-id="${subj.id}" title="Include in today's queue"><div class="knob"></div></div>
             <button class="icon-btn" data-archive="${subj.id}" title="Archive subject">${svgIcon("archive")}</button>`
        }
      </div>
      <div class="subj-bar-row">
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="pct">${pct}%</div>
      </div>
      <div class="lessons">
        ${subj.lessons.map(l => `
          <label class="lesson ${l.done ? "done" : ""}">
            <input type="checkbox" data-subj="${subj.id}" data-lesson="${l.id}" ${l.done ? "checked" : ""} ${archived ? "disabled" : ""}>
            <span class="title">${escapeHtml(l.title)}</span>
            ${archived ? "" : `<button class="icon-btn" data-dellesson="${l.id}" data-dellessonsubj="${subj.id}" title="Remove lesson">${svgIcon("x", "icon-sm")}</button>`}
          </label>
        `).join("")}
      </div>
      ${archived ? "" : `
      <div class="lesson-add">
        <input type="text" placeholder="Add a lesson / topic" data-addlesson="${subj.id}">
        <button class="btn btn-ghost btn-small" data-addlessonbtn="${subj.id}">Add</button>
      </div>`}
    </div>
  `;
}

let dragSrcId = null;
let archivedExpanded = false;

function setArchivedLabel(count){
  const btn = document.getElementById("archivedToggleBtn");
  btn.textContent = archivedExpanded ? "Hide archived" : `Archived (${count})`;
}

document.getElementById("archivedToggleBtn").addEventListener("click", () => {
  archivedExpanded = !archivedExpanded;
  document.getElementById("archivedList").classList.toggle("hidden", !archivedExpanded);
  setArchivedLabel(state.subjects.filter(s => s.archived).length);
});

function renderSubjects(){
  const list = document.getElementById("subjectsList");
  const archivedWrap = document.getElementById("archivedList");
  const archivedBtn = document.getElementById("archivedToggleBtn");
  const active = state.subjects.filter(s => !s.archived);
  const archived = state.subjects.filter(s => s.archived);

  list.innerHTML = active.length === 0
    ? '<div class="empty-state">No subjects yet — add your first one above.</div>'
    : active.map(s => subjectCardHtml(s, false)).join("");

  document.getElementById("archivedCount").textContent = archived.length;
  archivedBtn.classList.toggle("hidden", archived.length === 0);
  archivedWrap.innerHTML = archived.map(s => subjectCardHtml(s, true)).join("");

  // drag-to-reorder (active list only)
  list.querySelectorAll(".subject-card[draggable=true]").forEach(card => {
    card.addEventListener("dragstart", () => { dragSrcId = card.dataset.cardid; card.classList.add("dragging"); });
    card.addEventListener("dragend", () => { card.classList.remove("dragging"); });
    card.addEventListener("dragover", (e) => e.preventDefault());
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetId = card.dataset.cardid;
      if (!dragSrcId || dragSrcId === targetId) return;
      const ids = state.subjects.map(s => s.id);
      const srcIdx = ids.indexOf(dragSrcId);
      const [moved] = state.subjects.splice(srcIdx, 1);
      const targetIdx = state.subjects.findIndex(s => s.id === targetId);
      state.subjects.splice(targetIdx, 0, moved);
      queueSave();
      renderSubjects();
      renderQueueHint();
    });
  });

  // color dot cycles through preset palette
  [...list.querySelectorAll("[data-colorid]"), ...archivedWrap.querySelectorAll("[data-colorid]")].forEach(dot => {
    dot.addEventListener("click", () => {
      const s = state.subjects.find(s => s.id === dot.dataset.colorid);
      const idx = SUBJECT_COLORS.indexOf(s.color);
      s.color = SUBJECT_COLORS[(idx + 1) % SUBJECT_COLORS.length];
      queueSave();
      renderSubjects();
    });
  });

  // toggle active (queue)
  list.querySelectorAll(".toggle").forEach(t => {
    t.addEventListener("click", () => {
      const s = state.subjects.find(s => s.id === t.dataset.id);
      s.active = !s.active;
      queueSave();
      renderSubjects();
      renderQueueHint();
    });
  });
  // archive subject
  list.querySelectorAll("[data-archive]").forEach(b => {
    b.addEventListener("click", () => {
      const s = state.subjects.find(s => s.id === b.dataset.archive);
      s.archived = true;
      s.active = false;
      queueSave();
      renderSubjects();
      renderQueueHint();
    });
  });
  // restore subject
  archivedWrap.querySelectorAll("[data-restore]").forEach(b => {
    b.addEventListener("click", () => {
      const s = state.subjects.find(s => s.id === b.dataset.restore);
      s.archived = false;
      queueSave();
      renderSubjects();
      renderQueueHint();
    });
  });
  // permanently delete (archived only)
  archivedWrap.querySelectorAll("[data-del]").forEach(b => {
    b.addEventListener("click", () => {
      state.subjects = state.subjects.filter(s => s.id !== b.dataset.del);
      queueSave();
      renderSubjects();
      renderQueueHint();
    });
  });
  // lesson checkbox
  list.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      const s = state.subjects.find(s => s.id === cb.dataset.subj);
      const l = s.lessons.find(l => l.id === cb.dataset.lesson);
      l.done = cb.checked;
      queueSave();
      renderSubjects();
    });
  });
  // delete lesson
  list.querySelectorAll("[data-dellesson]").forEach(b => {
    b.addEventListener("click", () => {
      const s = state.subjects.find(s => s.id === b.dataset.dellessonsubj);
      s.lessons = s.lessons.filter(l => l.id !== b.dataset.dellesson);
      queueSave();
      renderSubjects();
    });
  });
  // add lesson
  list.querySelectorAll("[data-addlessonbtn]").forEach(btn => {
    btn.addEventListener("click", () => addLesson(btn.dataset.addlessonbtn));
  });
  list.querySelectorAll("[data-addlesson]").forEach(inp => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addLesson(inp.dataset.addlesson);
    });
  });
}

function addLesson(subjId){
  const inp = document.querySelector(`[data-addlesson="${subjId}"]`);
  const title = inp.value.trim();
  if (!title) return;
  const s = state.subjects.find(s => s.id === subjId);
  s.lessons.push({ id: uid_(), title, done: false });
  queueSave();
  renderSubjects();
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================================
   6) TIMER
========================================================= */
const RADIUS = 96;
const CIRC = 2 * Math.PI * RADIUS;
document.getElementById("ringFg").style.strokeDasharray = CIRC;

let timer = { phase: "study", secondsLeft: 25*60, queueIndex: 0 };
let timerRunning = false;
let intervalId = null;

function getQueue(){
  return state.subjects.filter(s => s.active);
}

function currentSubject(){
  const q = getQueue();
  if (q.length === 0) return null;
  return q[timer.queueIndex % q.length];
}

function renderQueueHint(){
  const q = getQueue();
  const hint = document.getElementById("queueHint");
  if (q.length === 0) {
    hint.textContent = "Toggle subjects on the right to add them to today's queue.";
  } else {
    hint.textContent = "Today's queue: " + q.map(s => s.name).join(" → ");
  }
  renderRingSubject();
}

function renderRingSubject(){
  const subj = currentSubject();
  document.getElementById("ringSubject").textContent = subj ? subj.name : "No subject queued";
}

function resetPhase(){
  timer.secondsLeft = phaseMinutes(timer.phase) * 60;
  renderRing();
}

function phaseMinutes(phase){
  switch(phase){
    case "study": return state.studyMinutes;
    case "break": return state.breakMinutes;
    case "prayer": return state.prayerMinutes;
    case "personal": return state.personalMinutes;
    default: return state.studyMinutes;
  }
}

const PHASE_LABELS = { study: "Study", break: "Break", prayer: "Prayer", personal: "Personal time" };

function renderRing(){
  const total = phaseMinutes(timer.phase) * 60;
  const frac = total > 0 ? timer.secondsLeft / total : 0;
  const offset = CIRC * (1 - frac);
  document.getElementById("ringFg").style.strokeDashoffset = offset;
  const m = Math.floor(timer.secondsLeft / 60).toString().padStart(2,"0");
  const s = Math.floor(timer.secondsLeft % 60).toString().padStart(2,"0");
  document.getElementById("ringTime").textContent = `${m}:${s}`;
  const phaseEl = document.getElementById("ringPhase");
  phaseEl.textContent = PHASE_LABELS[timer.phase] || timer.phase;
  phaseEl.className = "ring-phase " + timer.phase;
  renderRingSubject();
  document.title = timerRunning ? `${m}:${s} · StudyFlow` : "StudyFlow — Grow your study habit";
}

function updateSoundBtn(){
  const btn = document.getElementById("soundToggleBtn");
  if (!btn) return;
  btn.innerHTML = state.soundEnabled
    ? `${svgIcon("volume")}<span>Sound on</span>`
    : `${svgIcon("volumeOff")}<span>Sound off</span>`;
}
document.getElementById("soundToggleBtn").addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  updateSoundBtn();
  queueSave();
});

function beep(){
  if (!state.soundEnabled) return;
  try {
    const freqMap = { study: 660, break: 440, prayer: 550, personal: 500 };
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freqMap[timer.phase] || 660;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}

function tick(){
  timer.secondsLeft--;
  if (timer.secondsLeft <= 0) {
    completePhase();
  } else {
    renderRing();
  }
}

// Holds the study/break state to return to once a prayer or personal break ends.
let specialReturnState = null;

function completePhase(){
  beep();
  if (timer.phase === "prayer" || timer.phase === "personal") {
    const finishedPhase = timer.phase;
    const returnTo = specialReturnState;
    specialReturnState = null;
    maybeNotify("Break's over", finishedPhase === "prayer" ? "Prayer break finished — back to it." : "Personal time finished — back to it.");
    if (returnTo) {
      timer.phase = returnTo.phase;
      timer.secondsLeft = returnTo.secondsLeft;
      if (returnTo.wasRunning) {
        renderRing();
      } else {
        stopTimer();
      }
    } else {
      timer.phase = "study";
      resetPhase();
    }
    return;
  }
  if (timer.phase === "study") {
    const subj = currentSubject();
    if (subj) subj.minutesStudied += state.studyMinutes;
    state.todayMinutes += state.studyMinutes;
    logStudySession(subj, state.studyMinutes);
    renderGoal();
    renderSubjects();
    renderStreak();
    renderWeekChart();
    renderSessions();
    queueSave();
    timer.phase = "break";
    maybeNotify("Study block done", subj ? `${subj.name} — time for a break.` : "Time for a break.");
  } else {
    const q = getQueue();
    if (q.length > 0) timer.queueIndex = (timer.queueIndex + 1) % q.length;
    timer.phase = "study";
    maybeNotify("Break's over", "Back to studying.");
  }
  resetPhase();
}

function actuallyStart(){
  timerRunning = true;
  document.getElementById("startPauseBtn").textContent = "Pause";
  intervalId = setInterval(tick, 1000);
}
function startTimer(){
  if ((timer.phase === "study" || timer.phase === "break") && getQueue().length === 0) return;
  actuallyStart();
}
function stopTimer(){
  timerRunning = false;
  document.getElementById("startPauseBtn").textContent = "Start";
  clearInterval(intervalId);
  renderRing();
}
function startSpecialBreak(phase){
  if (timer.phase === "prayer" || timer.phase === "personal") return; // already on a break
  specialReturnState = { phase: timer.phase, secondsLeft: timer.secondsLeft, wasRunning: timerRunning };
  timer.phase = phase;
  timer.secondsLeft = phaseMinutes(phase) * 60;
  if (!timerRunning) actuallyStart();
  renderRing();
}

document.getElementById("startPauseBtn").addEventListener("click", () => {
  timerRunning ? stopTimer() : startTimer();
});
document.getElementById("skipBtn").addEventListener("click", () => {
  completePhase();
});
document.getElementById("resetBtn").addEventListener("click", () => {
  stopTimer();
  resetPhase();
});
document.getElementById("prayerBtn").addEventListener("click", () => {
  startSpecialBreak("prayer");
});
document.getElementById("personalBtn").addEventListener("click", () => {
  startSpecialBreak("personal");
});

/* =========================================================
   7B) STREAK + WEEKLY CHART + SESSION HISTORY
========================================================= */
function logStudySession(subj, minutes){
  const today = todayStr();
  state.dailyLog[today] = (state.dailyLog[today] || 0) + minutes;

  state.sessions.unshift({
    id: uid_(),
    subject: subj ? subj.name : "No subject",
    minutes,
    at: new Date().toISOString()
  });
  if (state.sessions.length > 50) state.sessions.length = 50;
}

function computeStreak(){
  const goal = state.dailyGoalMinutes;
  if (!goal) return 0;
  let d = new Date();
  // Today doesn't count against the streak until it's actually hit — start
  // checking from yesterday if today isn't there yet, so a streak in
  // progress doesn't drop to 0 partway through the day.
  if ((state.dailyLog[dateStr(d)] || 0) < goal) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  let streak = 0;
  while ((state.dailyLog[dateStr(d)] || 0) >= goal) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

function renderStreak(){
  const el = document.getElementById("streakBadge");
  if (!el) return;
  const streak = computeStreak();
  if (streak > 0) {
    el.innerHTML = `${svgIcon("flame", "icon-sm")}<span>${streak} day${streak === 1 ? "" : "s"}</span>`;
    el.classList.remove("hidden");
  } else {
    el.textContent = "";
    el.classList.add("hidden");
  }
}

function renderAllTimeStats(){
  const totalMinutes = Object.values(state.dailyLog).reduce((a,b) => a+b, 0);
  const totalHoursEl = document.getElementById("statTotalHours");
  if (totalHoursEl) totalHoursEl.textContent = (totalMinutes/60).toFixed(1) + "h";

  const goal = state.dailyGoalMinutes;
  let best = 0, run = 0;
  if (goal) {
    const days = Object.keys(state.dailyLog).sort();
    let prevDate = null;
    for (const ds of days) {
      if ((state.dailyLog[ds] || 0) >= goal) {
        if (prevDate) {
          const diff = (new Date(ds) - new Date(prevDate)) / 86400000;
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        best = Math.max(best, run);
        prevDate = ds;
      } else {
        run = 0;
        prevDate = null;
      }
    }
  }
  best = Math.max(best, computeStreak());
  const bestEl = document.getElementById("statBestStreak");
  if (bestEl) bestEl.textContent = best;
}

let chartRange = "week"; // or "month"
document.getElementById("chartRangeBtn").addEventListener("click", () => {
  chartRange = chartRange === "week" ? "month" : "week";
  document.getElementById("chartRangeBtn").textContent = chartRange === "week" ? "View month" : "View week";
  document.getElementById("chartTitle").textContent = chartRange === "week" ? "This week" : "This month";
  document.getElementById("weekChart").classList.toggle("hidden", chartRange !== "week");
  document.getElementById("monthHeatmap").classList.toggle("hidden", chartRange !== "month");
});

function renderMonthHeatmap(){
  const wrap = document.getElementById("monthHeatmap");
  if (!wrap) return;
  const goal = state.dailyGoalMinutes || 1;
  const today = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const dd = new Date(today);
    dd.setUTCDate(today.getUTCDate() - i);
    const ds = dateStr(dd);
    const minutes = state.dailyLog[ds] || 0;
    const ratio = minutes / goal;
    let level = 0;
    if (minutes > 0) level = ratio >= 1 ? 4 : ratio >= 0.66 ? 3 : ratio >= 0.33 ? 2 : 1;
    days.push({ ds, minutes, level });
  }
  wrap.innerHTML = days.map(d => `<div class="heatmap-cell" data-level="${d.level}" title="${d.ds}: ${d.minutes} min"></div>`).join("");
}

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const rows = [["Subject","Minutes","Date/Time"]];
  state.sessions.forEach(s => rows.push([s.subject, s.minutes, s.at]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `studyflow-sessions-${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

function renderWeekChart(){
  const wrap = document.getElementById("weekChart");
  if (!wrap) return;
  const days = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const dd = new Date(d);
    dd.setUTCDate(d.getUTCDate() - i);
    days.push({ ds: dateStr(dd), label: dd.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })[0], minutes: state.dailyLog[dateStr(dd)] || 0 });
  }
  const max = Math.max(state.dailyGoalMinutes, ...days.map(x => x.minutes), 1);
  wrap.innerHTML = days.map(x => `
    <div class="week-bar" title="${x.minutes} min">
      <div class="week-bar-track"><div class="week-bar-fill" style="height:${Math.min(100, Math.round((x.minutes/max)*100))}%"></div></div>
      <div class="week-bar-label">${x.label}</div>
    </div>
  `).join("");
}

function renderSessions(){
  const wrap = document.getElementById("sessionList");
  if (!wrap) return;
  if (state.sessions.length === 0) {
    wrap.innerHTML = '<div class="empty-state">No sessions logged yet.</div>';
    return;
  }
  wrap.innerHTML = state.sessions.slice(0, 10).map(s => {
    const t = new Date(s.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `
      <div class="session-item">
        <span class="session-subject">${escapeHtml(s.subject)}</span>
        <span class="session-minutes mono">${s.minutes} min</span>
        <span class="session-time mono">${t}</span>
      </div>
    `;
  }).join("");
}

/* =========================================================
   7C) NOTIFICATIONS
========================================================= */
function updateNotifyBtn(){
  const btn = document.getElementById("notifyBtn");
  if (!btn) return;
  if (!("Notification" in window)) {
    btn.textContent = "Notifications unsupported";
    btn.disabled = true;
    return;
  }
  if (Notification.permission === "granted") btn.innerHTML = `${svgIcon("bell")}<span>Notifications on</span>`;
  else if (Notification.permission === "denied") btn.innerHTML = `${svgIcon("bellOff")}<span>Notifications blocked</span>`;
  else btn.innerHTML = `${svgIcon("bell")}<span>Enable notifications</span>`;
}

document.getElementById("notifyBtn").addEventListener("click", async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  updateNotifyBtn();
});

function maybeNotify(title, body){
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return; // only nudge them if they've actually tabbed away
  try { new Notification(title, { body }); } catch(e) {}
}

/* =========================================================
   7) GOAL BAR
========================================================= */
function renderGoal(){
  document.getElementById("todayMinutes").textContent = state.todayMinutes;
  document.getElementById("goalMinutes").textContent = state.dailyGoalMinutes;
  const pct = Math.min(100, Math.round((state.todayMinutes / state.dailyGoalMinutes) * 100) || 0);
  document.getElementById("goalBar").style.width = pct + "%";
}

/* =========================================================
   8) RENDER ALL
========================================================= */
function renderAll(){
  studyMinInput.value = state.studyMinutes;
  breakMinInput.value = state.breakMinutes;
  prayerMinInput.value = state.prayerMinutes;
  personalMinInput.value = state.personalMinutes;
  goalInput.value = state.dailyGoalMinutes;
  timer.phase = "study";
  timer.secondsLeft = state.studyMinutes * 60;
  renderRing();
  renderSubjects();
  renderGoal();
  renderQueueHint();
  renderStreak();
  renderWeekChart();
  renderMonthHeatmap();
  renderSessions();
  renderAllTimeStats();
  updateNotifyBtn();
  updateSoundBtn();
}