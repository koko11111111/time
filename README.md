# StudyFlow

A black-and-green study time manager: pomodoro-style focus/break timer, subjects with checklists of lessons, per-subject progress bars, a daily study-time goal, and Google sign-in backed by Firebase.

## Structure

```
studyflow/
├── index.html          # markup
├── css/
│   └── style.css       # all styling (dark + green gradient theme)
├── js/
│   ├── firebase-config.js   # your Firebase project config + init (EDIT THIS)
│   └── app.js                # auth, timer, subjects/lessons, Firestore sync
└── README.md
```

## Setup

1. **Add your Firebase config.** Open `js/firebase-config.js` and replace the placeholder values with the config from your Firebase project (Project settings → General → Your apps → SDK setup and configuration):

   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

2. **Enable sign-in methods** in Firebase → Authentication → Sign-in method: turn on both **Google** and **Email/Password** (if not already on).

3. **Authorize your domain.** In Firebase → Authentication → Settings → Authorized domains, add the domain you'll host this on. `localhost` is included by default, which covers local testing.

4. **Firestore rules.** Each signed-in user reads/writes only their own `users/{uid}` document. Add a rule like:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

## Running locally

Google's sign-in popup needs a real `http(s)` origin — opening `index.html` directly as a `file://` URL won't work. Serve the folder locally, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed `http://localhost` URL.

## Deploying

Any static host works — GitHub Pages, Firebase Hosting, Netlify, Vercel. Just make sure the deployed domain is in your Firebase Authorized domains list (step 3 above).

## How it works

- **Sign in**: Google one-tap, or email/password with a sign-up / log-in toggle and a "forgot password" reset email. Both land the same signed-in user in Firestore.
- **Timer**: a study/break pomodoro loop. Toggle subjects "on" to add them to today's queue — the timer cycles through them, logging minutes studied to each one when a study block finishes.
- **Prayer break / Personal time**: two on-demand buttons that pause whatever's running and start a separate countdown — "Personal time" covers anything off-screen (eating, bathroom, shower, etc.), "Prayer break" is its own timer. Both durations are adjustable in settings. When the break ends, the timer returns to exactly where it left off — running again if it was running, paused if it was paused.
- **Subjects & lessons**: add subjects, add lessons/topics under each, check them off. Each subject's progress bar tracks lessons completed.
- **Daily goal**: set a daily minutes target; the top bar fills as you complete study blocks.
- **Data**: everything is stored in Firestore under `users/{uid}`, so it persists across sessions and devices.
