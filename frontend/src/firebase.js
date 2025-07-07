import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA4BqojxKEMJ9AGOx_bdf3-6uooOR0LHpA",
  authDomain: "scheduler-app-46237.firebaseapp.com",
  projectId: "scheduler-app-46237",
  storageBucket: "scheduler-app-46237.firebasestorage.app",
  messagingSenderId: "853471869037",
  appId: "1:853471869037:web:a1f2272331ef767d156764",
  measurementId: "G-7SYM1EWDGF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
