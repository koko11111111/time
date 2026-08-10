/* =========================================================
   1) PASTE YOUR OWN FIREBASE CONFIG BELOW
   (Firebase console → Project settings → General → Your apps)
   Make sure Google sign-in is enabled in Authentication,
   and that the domain you host this file on is added under
   Authentication → Settings → Authorized domains.
========================================================= */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
