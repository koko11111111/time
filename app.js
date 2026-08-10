/* =========================================================
   2) STATE
========================================================= */
let uid = null;
let state = {
  displayName: "",
  email: "",
  photoURL: "",
  dailyGoalMinutes: 120,
  studyMinutes: 25,
  breakMinutes: 5,
  prayerMinutes: 15,
  personalMinutes: 10,
  todayMinutes: 0,
  todayDate: "",
  subjects: [], // {id, name, active, minutesStudied, lessons:[{id,title,done}]}
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
function addSubject(){
  const input = document.getElementById("newSubjectInput");
  const name = input.value.trim();
  if (!name) return;
  state.subjects.push({ id: uid_(), name, active: true, minutesStudied: 0, lessons: [] });
  input.value = "";
  queueSave();
  renderSubjects();
  renderQueueHint();
}

function renderSubjects(){
  const list = document.getElementById("subjectsList");
  list.innerHTML = "";
  if (state.subjects.length === 0) {
    list.innerHTML = '<div class="empty-state">No subjects yet — add your first one above.</div>';
    return;
  }
  state.subjects.forEach((subj) => {
    const total = subj.lessons.length;
    const done = subj.lessons.filter(l => l.done).length;
    const pct = total ? Math.round((done/total)*100) : 0;

    const card = document.createElement("div");
    card.className = "subject-card";
    card.innerHTML = `
      <div class="subject-head">
        <div class="name-wrap">
          <div>
            <div class="name">${escapeHtml(subj.name)}</div>
            <div class="meta">${subj.minutesStudied} min studied · ${done}/${total} lessons</div>
          </div>
        </div>
        <div class="toggle ${subj.active ? "on" : ""}" data-id="${subj.id}" title="Include in today's queue"><div class="knob"></div></div>
        <button class="icon-btn" data-del="${subj.id}" title="Delete subject">✕</button>
      </div>
      <div class="subj-bar-row">
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="pct">${pct}%</div>
      </div>
      <div class="lessons">
        ${subj.lessons.map(l => `
          <label class="lesson ${l.done ? "done" : ""}">
            <input type="checkbox" data-subj="${subj.id}" data-lesson="${l.id}" ${l.done ? "checked" : ""}>
            <span class="title">${escapeHtml(l.title)}</span>
            <button class="icon-btn" data-dellesson="${l.id}" data-dellessonsubj="${subj.id}" title="Remove lesson">✕</button>
          </label>
        `).join("")}
      </div>
      <div class="lesson-add">
        <input type="text" placeholder="Add a lesson / topic" data-addlesson="${subj.id}">
        <button class="btn btn-ghost btn-small" data-addlessonbtn="${subj.id}">Add</button>
      </div>
    `;
    list.appendChild(card);
  });

  // toggle active
  list.querySelectorAll(".toggle").forEach(t => {
    t.addEventListener("click", () => {
      const s = state.subjects.find(s => s.id === t.dataset.id);
      s.active = !s.active;
      queueSave();
      renderSubjects();
      renderQueueHint();
    });
  });
  // delete subject
  list.querySelectorAll("[data-del]").forEach(b => {
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

function beep(){
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
    el.textContent = `🔥 ${streak} day${streak === 1 ? "" : "s"}`;
    el.classList.remove("hidden");
  } else {
    el.textContent = "";
    el.classList.add("hidden");
  }
}

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
  if (Notification.permission === "granted") btn.textContent = "🔔 Notifications on";
  else if (Notification.permission === "denied") btn.textContent = "🔕 Notifications blocked";
  else btn.textContent = "🔔 Enable notifications";
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
  renderSessions();
  updateNotifyBtn();
}