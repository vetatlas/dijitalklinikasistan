import { db } from "../../js/firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const recordsList = document.getElementById("patientRecordsList");
const searchBar = document.getElementById("searchBar");
let allRecords = [];

// 1. VERİLERİ ÇEK VE LİSTELE
async function kayitlariGetir() {
    try {
        const q = query(collection(db, "hastalar"), orderBy("tarih", "desc"));
        const snap = await getDocs(q);
        allRecords = [];
        
        if (snap.empty) {
            recordsList.innerHTML = `<div style="text-align:center; color:#64748b;">Henüz dosyalanmış bir vaka yok şefim.</div>`;
            return;
        }

        snap.forEach(doc => {
            allRecords.push({ id: doc.id, ...doc.data() });
        });
        
        renderRecords(allRecords);
    } catch (e) {
        console.error("Yükleme hatası:", e);
        recordsList.innerHTML = "Hata oluştu.";
    }
}

// 2. KARTLARI EKRANA BAS
function renderRecords(data) {
    recordsList.innerHTML = "";
    data.forEach(vaka => {
        const tarihStr = vaka.tarih?.toDate().toLocaleDateString('tr-TR') || "-";
        const card = document.createElement("div");
        card.className = "patient-card";
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <span class="soap-badge badge-ai">AI SOAP RAPORU</span>
                    <h3 style="margin:0 0 10px 0; color:#fff;">${vaka.hastaAdi}</h3>
                </div>
                <small style="color:#64748b;">${tarihStr}</small>
            </div>
            <div class="soap-content">
                ${vaka.soapRaporu.replace(/\n/g, '<br>')}
            </div>
        `;
        recordsList.appendChild(card);
    });
}

// 3. AKILLI FİLTRELEME
searchBar.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allRecords.filter(r => 
        r.hastaAdi.toLowerCase().includes(term) || 
        r.soapRaporu.toLowerCase().includes(term)
    );
    renderRecords(filtered);
};

kayitlariGetir();