import { db } from "../../js/firebase-config.js";
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const dersSecimi = document.getElementById("dersSecimi");
const konuSecimi = document.getElementById("konuSecimi");
const btnKaydet = document.getElementById("btnKaydet");
const vipToast = document.getElementById("vipToast");
const toastMsg = document.getElementById("toastMsg");

function showToast(message, isError = false) {
    toastMsg.innerText = message;
    vipToast.className = isError ? "vip-toast show error" : "vip-toast show";
    setTimeout(() => { vipToast.classList.remove("show"); }, 3000);
}

// 1. Quill.js Editörünü Başlatma (VIP Araç Çubuğu ve Özel Görsel Motoru ile)
const quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'VIP makalenizi buraya yazın veya görsel ekleyin...',
    modules: {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }], // Başlıklar
                ['bold', 'italic', 'underline', 'strike'], // Kalın, italik vb.
                [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Listeler
                ['link', 'image'], // Link ve Resim Ekleme Butonları
                ['clean'] // Biçimlendirmeyi temizle
            ],
            handlers: {
                // Görsel butonuna tıklandığında bilgisayar klasörlerini açmak yerine bu çalışacak
                image: function() {
                    const range = this.quill.getSelection();
                    const url = prompt("VIP Görsel Ekleme:\nLütfen görselin URL (link) adresini buraya yapıştırın:");
                    
                    if (url) {
                        // Linki alır ve tam imlecin (cursor) olduğu yere resim olarak gömer
                        this.quill.insertEmbed(range ? range.index : 0, 'image', url);
                    }
                }
            }
        }
    }
});
// 2. Dersleri Getir
async function dersleriYukle() {
    try {
        const snap = await getDocs(collection(db, "dersler"));
        snap.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id; opt.innerText = d.data().baslik;
            dersSecimi.appendChild(opt);
        });
    } catch (e) { showToast("Dersler yüklenemedi!", true); }
}

// 3. Ders Seçilince Konuları Getir
dersSecimi.addEventListener("change", async (e) => {
    konuSecimi.innerHTML = "<option value=''>Konular yükleniyor...</option>";
    quill.root.innerHTML = ""; // Editörü temizle
    if(!e.target.value) return konuSecimi.innerHTML = "<option value=''>Sonra konu seçin...</option>";

    try {
        const q = query(collection(db, "konular"), where("dersId", "==", e.target.value));
        const snap = await getDocs(q);
        konuSecimi.innerHTML = "<option value=''>Bir konu seçin...</option>";
        snap.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id; opt.innerText = d.data().baslik;
            konuSecimi.appendChild(opt);
        });
    } catch (e) { showToast("Konular yüklenemedi!", true); }
});

// 4. Konu Seçilince, Varsa Eski İçeriği Editöre Çek
konuSecimi.addEventListener("change", async (e) => {
    quill.root.innerHTML = "Yükleniyor...";
    if(!e.target.value) return quill.root.innerHTML = "";
    try {
        const docSnap = await getDoc(doc(db, "konular", e.target.value));
        if (docSnap.exists() && docSnap.data().icerikHtml) {
            // Veritabanında daha önceden yazılmış VIP içerik varsa ekrana getir
            quill.root.innerHTML = docSnap.data().icerikHtml;
        } else {
            quill.root.innerHTML = ""; // Yoksa tertemiz bir sayfa aç
        }
    } catch (e) { showToast("İçerik çekilemedi!", true); }
});

// 5. Kaydet Butonu
btnKaydet.addEventListener("click", async () => {
    const konuId = konuSecimi.value;
    if(!konuId) return showToast("Önce bir konu seçmelisiniz!", true);

    // Quill editörünün içindeki tüm HTML kodunu alıyoruz
    const icerikHtml = quill.root.innerHTML;
    
    btnKaydet.innerText = "Kaydediliyor...";
    try {
        await updateDoc(doc(db, "konular", konuId), { icerikHtml: icerikHtml });
        showToast("İçerik başarıyla kaydedildi!");
    } catch (error) {
        showToast("Kaydetme hatası!", true);
    } finally {
        btnKaydet.innerText = "İçeriği Veritabanına Kaydet";
    }
});

dersleriYukle();