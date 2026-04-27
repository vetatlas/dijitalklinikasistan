import { db } from "../../js/firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const konuId = urlParams.get('konuId');

let sorular = [];
let mevcutSoruIndex = 0;
let dogruSayisi = 0;
let yanlisSayisi = 0;

const questionText = document.getElementById("questionText");
const optionsGrid = document.getElementById("optionsGrid");
const explanationBox = document.getElementById("explanationBox");
const explanationText = document.getElementById("explanationText");
const btnNext = document.getElementById("btnNext");
const correctCountEl = document.getElementById("correctCount");
const wrongCountEl = document.getElementById("wrongCount");
const questionProgressEl = document.getElementById("questionProgress");

async function sorulariYukle() {
    if (!konuId) return;
    try {
        const q = query(collection(db, "sorular"), where("konuId", "==", konuId));
        const snap = await getDocs(q);
        
        snap.forEach(doc => {
            sorular.push({ id: doc.id, ...doc.data() });
        });

        if (sorular.length === 0) {
            questionText.innerText = "Bu konuya henüz soru eklenmemiş.";
            return;
        }

        soruyuGoster();
    } catch (e) { console.error("Hata:", e); }
}

function soruyuGoster() {
    explanationBox.style.display = "none";
    btnNext.style.display = "none";
    optionsGrid.innerHTML = "";
    
    const soru = sorular[mevcutSoruIndex];
    questionText.innerText = soru.soru;
    questionProgressEl.innerText = `Soru: ${mevcutSoruIndex + 1} / ${sorular.length}`;

    const siklar = ['a', 'b', 'c', 'd', 'e'];
    siklar.forEach(harf => {
        if (soru[harf]) {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerHTML = `<b style="margin-right:10px;">${harf.toUpperCase()})</b> ${soru[harf]}`;
            btn.onclick = () => cevapKontrol(harf, btn);
            optionsGrid.appendChild(btn);
        }
    });
}

function cevapKontrol(secilenHarf, secilenBtn) {
    const soru = sorular[mevcutSoruIndex];
    const dogruCevap = soru.dogruCevap.toLowerCase();
    
    // Tüm butonları kilitle
    const tumButonlar = document.querySelectorAll(".option-btn");
    tumButonlar.forEach(b => b.classList.add("disabled"));

    if (secilenHarf === dogruCevap) {
        // DOĞRU
        secilenBtn.classList.add("correct");
        dogruSayisi++;
        correctCountEl.innerText = dogruSayisi;
    } else {
        // YANLIŞ
        secilenBtn.classList.add("wrong");
        yanlisSayisi++;
        wrongCountEl.innerText = yanlisSayisi;

        // Doğru şıkkı yeşil yap ki kullanıcı görsün
        tumButonlar.forEach(b => {
            if (b.innerText.toLowerCase().startsWith(dogruCevap + ")")) {
                b.classList.add("correct");
            }
        });

        // AÇIKLAMAYI GÖSTER
        explanationText.innerText = soru.aciklama || "Bu soru için ek bir açıklama girilmemiş.";
        explanationBox.style.display = "block";
    }

    // Sonraki soru butonu
    if (mevcutSoruIndex < sorular.length - 1) {
        btnNext.style.display = "block";
    } else {
        btnNext.innerText = "Testi Bitir";
        btnNext.style.display = "block";
        btnNext.onclick = () => alert(`Tebrikler! Test bitti.\nDoğru: ${dogruSayisi}\nYanlış: ${yanlisSayisi}`);
    }
}

btnNext.onclick = () => {
    mevcutSoruIndex++;
    soruyuGoster();
};

sorulariYukle();