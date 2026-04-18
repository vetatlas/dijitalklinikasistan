// ===============================================
// 🔥 FIREBASE BAŞLATMA
// ===============================================

const firebaseConfig = { 
    apiKey: "AIzaSyD1UKnJ7BuN3EkYTQi4T4Il5ctLDGwDY0A", 
    authDomain: "vetasistan-6fdeb.firebaseapp.com", 
    projectId: "vetasistan-6fdeb", 
    storageBucket: "vetasistan-6fdeb.firebasestorage.app", 
    messagingSenderId: "137402648793", 
    appId: "1:137402648793:web:6fff76992c8828bc77d6c8" 
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.auth = firebase.auth();

console.log("✅ VetPremium Firebase Aktif. Auth:", !!window.auth);