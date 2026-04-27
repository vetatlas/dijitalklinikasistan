import { db } from "../../js/firebase-config.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const dersEkleForm = document.getElementById("dersEkleForm");
const konuEkleForm = document.getElementById("konuEkleForm");
const dersSecimi = document.getElementById("dersSecimi");
const adminDersListesi = document.getElementById("adminDersListesi");
const adminKonuListesi = document.getElementById("adminKonuListesi"); // YENİ
const vipToast = document.getElementById("vipToast");
const toastMsg = document.getElementById("toastMsg");

function showToast(message, isError = false) {
    toastMsg.innerText = message;
    if (isError) vipToast.classList.add("error");
    else vipToast.classList.remove("error");
    vipToast.classList.add("show");
    setTimeout(() => { vipToast.classList.remove("show"); }, 3000);
}

// 1. DERSLERİ GETİR
async function dersleriGetir() {
    try {
        const querySnapshot = await getDocs(collection(db, "dersler"));
        dersSecimi.innerHTML = "<option value=''>Bir ders seçin...</option>";
        adminDersListesi.innerHTML = "";

        if (querySnapshot.empty) {
            adminDersListesi.innerHTML = "<p style='text-align:center; color:#9CA3AF;'>Henüz ders yok.</p>";
            return;
        }

        querySnapshot.forEach((dokuman) => {
            const dersId = dokuman.id;
            const dersAdi = dokuman.data().baslik;

            const opt = document.createElement("option");
            opt.value = dersId;
            opt.innerText = dersAdi;
            dersSecimi.appendChild(opt);

            const div = document.createElement("div");
            div.className = "admin-list-item";
            div.innerHTML = `
                <span>${dersAdi}</span>
                <div>
                    <button class="action-btn btn-edit" data-id="${dersId}" data-ad="${dersAdi}" data-tur="ders">Düzenle</button>
                    <button class="action-btn btn-delete" data-id="${dersId}" data-tur="ders">Sil</button>
                </div>
            `;
            adminDersListesi.appendChild(div);
        });

        butonOlaylariniBagla();
    } catch (error) { showToast("Dersler yüklenirken hata oluştu!", true); }
}

// 2. YENİ EKLENEN: KONULARI GETİR
async function konulariPaneldeGetir() {
    try {
        // Önce ders isimlerini bir sözlüğe (map) alalım ki konuların yanına ders adını da yazabilelim
        const derslerSnapshot = await getDocs(collection(db, "dersler"));
        const dersHaritasi = {};
        derslerSnapshot.forEach(doc => { dersHaritasi[doc.id] = doc.data().baslik; });

        const konularSnapshot = await getDocs(collection(db, "konular"));
        adminKonuListesi.innerHTML = "";

        if (konularSnapshot.empty) {
            adminKonuListesi.innerHTML = "<p style='text-align:center; color:#9CA3AF;'>Henüz konu yok.</p>";
            return;
        }

        konularSnapshot.forEach((dokuman) => {
            const konuId = dokuman.id;
            const konuVerisi = dokuman.data();
            const aitOlduguDersAdi = dersHaritasi[konuVerisi.dersId] || "Bilinmeyen Ders";

            const div = document.createElement("div");
            div.className = "admin-list-item";
            div.innerHTML = `
                <div style="display:flex; flex-direction:column; text-align:left;">
                    <span style="font-size: 0.75rem; color: #D4AF37; text-transform:uppercase; letter-spacing:1px;">${aitOlduguDersAdi}</span>
                    <span>${konuVerisi.baslik}</span>
                </div>
                <div style="min-width: 110px; text-align:right;">
                    <button class="action-btn btn-edit" data-id="${konuId}" data-ad="${konuVerisi.baslik}" data-tur="konu">Düzenle</button>
                    <button class="action-btn btn-delete" data-id="${konuId}" data-tur="konu">Sil</button>
                </div>
            `;
            adminKonuListesi.appendChild(div);
        });

        butonOlaylariniBagla();
    } catch (error) { showToast("Konular yüklenirken hata oluştu!", true); }
}

// 3. ORTAK DÜZENLEME VE SİLME OLAYLARI
function butonOlaylariniBagla() {
    document.querySelectorAll(".btn-delete").forEach(btn => {
        // Önceden eklenmiş eventleri temizlemek için klonluyoruz (Çift tıklama bug'ını önler)
        const yeniBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(yeniBtn, btn);
        
        yeniBtn.addEventListener("click", async (e) => {
            const id = e.target.dataset.id;
            const tur = e.target.dataset.tur;
            if(confirm(`VIP Uyarı: Bu ${tur} kalıcı olarak silinecek. Onaylıyor musunuz?`)){
                try {
                    await deleteDoc(doc(db, tur === "ders" ? "dersler" : "konular", id));
                    showToast(`${tur.toUpperCase()} başarıyla silindi.`);
                    tur === "ders" ? dersleriGetir() : konulariPaneldeGetir();
                } catch (err) { showToast("Silme başarısız!", true); }
            }
        });
    });

    document.querySelectorAll(".btn-edit").forEach(btn => {
        const yeniBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(yeniBtn, btn);
        
        yeniBtn.addEventListener("click", async (e) => {
            const id = e.target.dataset.id;
            const eskiAd = e.target.dataset.ad;
            const tur = e.target.dataset.tur;
            const yeniAd = prompt(`Yeni ${tur} adını girin:`, eskiAd);
            
            if (yeniAd && yeniAd.trim() !== "" && yeniAd !== eskiAd) {
                try {
                    await updateDoc(doc(db, tur === "ders" ? "dersler" : "konular", id), { baslik: yeniAd });
                    showToast(`${tur.toUpperCase()} başarıyla güncellendi.`);
                    tur === "ders" ? dersleriGetir() : konulariPaneldeGetir();
                } catch (err) { showToast("Güncelleme başarısız!", true); }
            }
        });
    });
}

// 4. EKLEME FORMLARI
dersEkleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "dersler"), { baslik: document.getElementById("yeniDersAdi").value });
        showToast("Ders başarıyla eklendi.");
        document.getElementById("yeniDersAdi").value = "";
        dersleriGetir(); 
    } catch (error) { showToast("Hata!", true); }
});

konuEkleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const secilenDersId = dersSecimi.value;
    if (!secilenDersId) return showToast("Önce ders seçmelisiniz!", true);
    try {
        await addDoc(collection(db, "konular"), { baslik: document.getElementById("yeniKonuAdi").value, dersId: secilenDersId });
        showToast("Konu başarıyla eklendi.");
        document.getElementById("yeniKonuAdi").value = "";
        konulariPaneldeGetir(); // Ekledikten sonra listeyi yenile
    } catch (error) { showToast("Hata!", true); }
});

// Sayfa açıldığında her iki listeyi de doldur
dersleriGetir();
konulariPaneldeGetir();