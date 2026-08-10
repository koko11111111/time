/* =========================================================
   Your Firebase project config
   (Firebase console → Project settings → General → Your apps)
   Make sure Google + Email/Password sign-in are enabled in
   Authentication, and that the domain you host this file on
   is added under Authentication → Settings → Authorized domains.
========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyDscfjRQyBNDhAKMBhCCmdj8OTFeb_L3Yo",
  authDomain: "sanatio-c4122.firebaseapp.com",
  projectId: "sanatio-c4122",
  storageBucket: "sanatio-c4122.firebasestorage.app",
  messagingSenderId: "580426949606",
  appId: "1:580426949606:web:4519fbccfb0e21db4cec27",
  measurementId: "G-CKG9HE5QXG"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
