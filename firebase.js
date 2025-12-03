// --- Firebase SDK --- //
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// --- Firebase konfiguráció (EZ A JÓ!) --- //
const firebaseConfig = {
  apiKey: "AIzaSyAKhHvi3yObUurBKhT1r_feg4g0A5w766Q",
  authDomain: "szaki-app.firebaseapp.com",
  projectId: "szaki-app",
  storageBucket: "szaki-app.firebasestorage.app",
  messagingSenderId: "418149364598",
  appId: "1:418149364598:web:2ae4450dc8fadfbac30057"
};

// --- Inicializálás --- //
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
