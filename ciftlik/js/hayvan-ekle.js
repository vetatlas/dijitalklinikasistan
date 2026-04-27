import { db } from "../../js/firebase-config.js";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.getElementById("btnSaveAnimal").onclick = async () => {
    // 1. Formdaki Verileri Topla
    const animalData = {
        kupeNo: document.getElementById("kupeNo").value.trim(),
        hayvanAdi: document.getElementById("hayvanAdi").value.trim() || "İsimsiz",
        tur: document.getElementById("tur").value,
        irk: document.getElementById("irk").value.trim(),
        cinsiyet: document.getElementById("cinsiyet").value,
        dogumTarihi: document.getElementById("dogumTarihi").value,
        uremeDurumu: document.getElementById("uremeDurumu").value,
        grup: document.getElementById("grup").value.trim(),
        soyKutugu: {
            anne: document.getElementById("anneId").value.trim(),
            baba: document.getElementById("babaId").value.trim()
        },
        saglikNotu: document.getElementById("saglikNotu").value.trim(),
        kayitTarihi: serverTimestamp()
    };

    if (!animalData.kupeNo) {
        alert("Şefim, Küpe No / ID alanı zorunludur!");
        return;
    }

    const btn = document.getElementById("btnSaveAnimal");
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = "⏳ AI Analiz Ediyor ve Kaydediyor...";
        btn.disabled = true;
        btn.style.background = "#94a3b8";

        // 2. Groq API Anahtarını Çek
        const ayarlarSnap = await getDoc(doc(db, "ayarlar", "apikeys"));
        let apiKey = "";
        if (ayarlarSnap.exists() && ayarlarSnap.data().groqKeys) {
            apiKey = ayarlarSnap.data().groqKeys[0];
        }

        // 3. AI PROFESÖR VOLKAN'A ANALİZ YAPTIR (Eğer API Key varsa)
        let aiRaporu = "AI analizi yapılamadı (API Key eksik).";
        if (apiKey) {
            const aiPrompt = `Şefim, kliniğimize yeni bir ${animalData.irk || ''} ${animalData.tur} eklendi. 
            Küpe No: ${animalData.kupeNo}. Cinsiyet: ${animalData.cinsiyet}. Üreme Durumu: ${animalData.uremeDurumu}. 
            Sağlık Notu: ${animalData.saglikNotu || 'Yok'}. Doğum Tarihi: ${animalData.dogumTarihi || 'Bilinmiyor'}.
            Bir veteriner profesörü olarak, bu hayvanın yaşını ve durumunu göz önüne alarak önümüzdeki 3 ay için kritik aşı, besleme veya takip tavsiyelerini 3-4 maddelik kısa bir klinik not olarak yazar mısın?`;

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "Sen uzman bir veteriner hekim asistanısın." },
                        { role: "user", content: aiPrompt }
                    ],
                    temperature: 0.2
                })
            });
            const data = await response.json();
            aiRaporu = data.choices[0].message.content;
        }

        // 4. Firebase'e Kaydet (AI Raporu ile birlikte)
        animalData.aiGelisimPlani = aiRaporu; // Ürettiğimiz raporu veriye ekledik
        await addDoc(collection(db, "hayvanlar"), animalData);

        alert(`✅ ${animalData.kupeNo} Küpe No'lu hayvan sisteme işlendi!\n\nProfesör Volkan'ın Notu:\n${aiRaporu.substring(0, 100)}...`);
        
        // Formu temizle
        document.getElementById("animalForm").reset();

    } catch (e) {
        console.error("Kayıt hatası:", e);
        alert("Kaydedilirken bir hata oluştu şefim. Bağlantıyı kontrol et.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.background = "#D4AF37";
    }
};