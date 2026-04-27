// Firebase SDK modüllerini CDN üzerinden içe aktarıyoruz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Sizin Firebase yapılandırma anahtarlarınız
const firebaseConfig = {
  apiKey: "AIzaSyBPHj5Lz9-j9CSi2FkJMyTgSywixV-cynw",
  authDomain: "dijital-klinik-asistan-31.firebaseapp.com",
  projectId: "dijital-klinik-asistan-31",
  storageBucket: "dijital-klinik-asistan-31.firebasestorage.app",
  messagingSenderId: "258101167501",
  appId: "1:258101167501:web:05f788778bf927a572a9c4",
  measurementId: "G-XTT8XHSWKH"
};

// Firebase'i başlatıyoruz
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Diğer sayfalarda kullanabilmek için Firestore ve Auth servislerini dışa aktarıyoruz
export const db = getFirestore(app);
export const auth = getAuth(app);