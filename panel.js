// ===============================================
// ⚙️ PREMIUM YÖNETİM PANELİ (GLOBAL LOADING DESTEKLİ)
// ===============================================

let panelState = {
    level: 'courses',
    courseId: null,
    courseName: null,
    subjectId: null,
    subjectName: null
};

const panelView = document.getElementById('view-panel');

// ========== ANA RENDER ==========
async function renderPanel() {
    panelState.level = 'courses';
    panelView.innerHTML = `
        <div style="margin-bottom:20px;">
            <h2><i class="fas fa-cog"></i> Yönetim Paneli</h2>
            <p style="color:var(--text-secondary);">Ders, konu ve notlarını yönet.</p>
        </div>

        <div style="margin-bottom:20px;">
            <button id="panel-add-btn" class="btn-primary" onclick="handlePanelAdd()">
                <i class="fas fa-plus-circle"></i> Yeni Ders Ekle
            </button>
        </div>

        <div id="panel-list-area"></div>
    `;
    await loadPanelCourses();
}

// ========== DERSLERİ LİSTELE (GLOBAL LOADING'Lİ) ==========
async function loadPanelCourses() {
    const listArea = document.getElementById('panel-list-area');
    showGlobalLoading();
    
    try {
        const snap = await db.collection('courses').orderBy('createdAt', 'desc').get();
        let html = '';
        if (snap.empty) {
            html = '<div class="premium-card"><p style="text-align:center;">✨ Henüz ders eklenmemiş.</p></div>';
        } else {
            for (const doc of snap.docs) {
                const course = doc.data();
                const subSnap = await db.collection('courses').doc(doc.id).collection('subjects').get();
                html += `
                    <div class="premium-card" style="display:flex; justify-content:space-between; align-items:center;">
                        <div onclick="panelNavigateToSubjects('${doc.id}', '${course.name.replace(/'/g, "\\'")}')" style="flex:1; cursor:pointer;">
                            <h3>📘 ${course.name}</h3>
                            <p style="color:var(--text-secondary);">${subSnap.size} konu</p>
                        </div>
                        <button class="icon-btn" onclick="deleteCourse('${doc.id}')" style="color:#ef4444;"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            }
        }
        listArea.innerHTML = html;
    } catch(e) {
        listArea.innerHTML = '<p>Hata oluştu.</p>';
        console.error(e);
    } finally {
        hideGlobalLoading();
    }
}

// ========== DERS SİL ==========
async function deleteCourse(courseId) {
    if (!confirm('Bu dersi ve içindeki tüm konuları/notları silmek istediğine emin misin?')) return;
    showGlobalLoading();
    try {
        await db.collection('courses').doc(courseId).delete();
        showToast('Ders silindi', 'success');
        await loadPanelCourses();
    } catch(e) {
        showToast('Silme başarısız', 'error');
    } finally {
        hideGlobalLoading();
    }
}

// ========== EKLEME BUTONU YÖNLENDİRME ==========
function handlePanelAdd() {
    if (panelState.level === 'courses') {
        showAddCourseModal();
    } else if (panelState.level === 'subjects') {
        showAddSubjectModal();
    } else if (panelState.level === 'notes') {
        openFullEditorForPanel();
    }
}

function showAddCourseModal() {
    showModal(`
        <h3><i class="fas fa-plus-circle"></i> Yeni Ders</h3>
        <input type="text" id="new-course-name" placeholder="Ders adı" style="width:100%; padding:14px; border-radius:16px; background:#0f172a; color:white; border:1px solid #334155;">
    `, async () => {
        const name = document.getElementById('new-course-name').value.trim();
        if (!name) return showToast('Ders adı girin', 'error');
        showGlobalLoading();
        try {
            await db.collection('courses').add({
                name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Ders eklendi', 'success');
            await loadPanelCourses();
        } catch(e) {
            showToast('Ekleme başarısız', 'error');
        } finally {
            hideGlobalLoading();
        }
    });
}

// ========== KONULARA GEÇİŞ ==========
async function panelNavigateToSubjects(courseId, courseName) {
    panelState.level = 'subjects';
    panelState.courseId = courseId;
    panelState.courseName = courseName;
    
    panelView.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="icon-btn" onclick="renderPanel()"><i class="fas fa-arrow-left"></i></button>
            <h2>📚 ${courseName}</h2>
        </div>

        <div style="margin-bottom:20px;">
            <button class="btn-primary" onclick="handlePanelAdd()">
                <i class="fas fa-plus-circle"></i> Yeni Konu Ekle
            </button>
        </div>

        <div id="panel-list-area"></div>
    `;
    await loadPanelSubjects();
}

// ========== KONULARI LİSTELE (GLOBAL LOADING'Lİ) ==========
async function loadPanelSubjects() {
    const listArea = document.getElementById('panel-list-area');
    showGlobalLoading();
    
    try {
        const snap = await db.collection('courses').doc(panelState.courseId)
                                .collection('subjects').orderBy('createdAt', 'desc').get();
        let html = '';
        if (snap.empty) {
            html = '<div class="premium-card"><p style="text-align:center;">📌 Henüz konu yok.</p></div>';
        } else {
            snap.forEach(doc => {
                const sub = doc.data();
                html += `
                    <div class="premium-card" style="display:flex; justify-content:space-between;">
                        <div onclick="panelNavigateToNotes('${doc.id}', '${sub.name.replace(/'/g, "\\'")}')" style="flex:1; cursor:pointer;">
                            <h3>📑 ${sub.name}</h3>
                        </div>
                        <button class="icon-btn" onclick="deleteSubject('${doc.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            });
        }
        listArea.innerHTML = html;
    } catch(e) {
        listArea.innerHTML = '<p>Hata oluştu.</p>';
        console.error(e);
    } finally {
        hideGlobalLoading();
    }
}

function showAddSubjectModal() {
    showModal(`
        <h3><i class="fas fa-plus-circle"></i> Yeni Konu</h3>
        <input type="text" id="new-subject-name" placeholder="Konu adı" style="width:100%; padding:14px; border-radius:16px; background:#0f172a; color:white; border:1px solid #334155;">
    `, async () => {
        const name = document.getElementById('new-subject-name').value.trim();
        if (!name) return showToast('Konu adı girin', 'error');
        showGlobalLoading();
        try {
            await db.collection('courses').doc(panelState.courseId).collection('subjects').add({
                name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Konu eklendi', 'success');
            await loadPanelSubjects();
        } catch(e) {
            showToast('Ekleme başarısız', 'error');
        } finally {
            hideGlobalLoading();
        }
    });
}

async function deleteSubject(subjectId) {
    if (!confirm('Konuyu sil?')) return;
    showGlobalLoading();
    try {
        await db.collection('courses').doc(panelState.courseId).collection('subjects').doc(subjectId).delete();
        showToast('Konu silindi', 'success');
        await loadPanelSubjects();
    } catch(e) {
        showToast('Silme başarısız', 'error');
    } finally {
        hideGlobalLoading();
    }
}

// ========== NOTLARA GEÇİŞ ==========
async function panelNavigateToNotes(subjectId, subjectName) {
    panelState.level = 'notes';
    panelState.subjectId = subjectId;
    panelState.subjectName = subjectName;
    
    panelView.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="icon-btn" onclick="panelNavigateToSubjects('${panelState.courseId}','${panelState.courseName}')"><i class="fas fa-arrow-left"></i></button>
            <h2>📌 ${subjectName}</h2>
        </div>
        <div style="margin-bottom:20px;">
            <button class="btn-primary" onclick="handlePanelAdd()">
                <i class="fas fa-pen-fancy"></i> Yeni Not Ekle
            </button>
        </div>
        <div id="panel-list-area"></div>
    `;
    await loadPanelNotes();
}

// ========== NOTLARI LİSTELE (GLOBAL LOADING'Lİ) ==========
async function loadPanelNotes() {
    const listArea = document.getElementById('panel-list-area');
    showGlobalLoading();
    
    try {
        const snap = await db.collection('courses').doc(panelState.courseId)
                                .collection('subjects').doc(panelState.subjectId)
                                .collection('notes').orderBy('createdAt', 'desc').get();
        let html = '';
        if (snap.empty) {
            html = '<div class="premium-card"><p style="text-align:center;">📄 Henüz not yok.</p></div>';
        } else {
            snap.forEach(doc => {
                const note = doc.data();
                html += `
                    <div class="premium-card" style="display:flex; justify-content:space-between;">
                        <div style="flex:1;">
                            <h4>📄 ${note.title}</h4>
                            <p style="color:var(--text-secondary);">${note.cards?.length || 0} kart</p>
                        </div>
                        <button class="icon-btn" onclick="deleteNote('${doc.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            });
        }
        listArea.innerHTML = html;
    } catch(e) {
        listArea.innerHTML = '<p>Hata oluştu.</p>';
        console.error(e);
    } finally {
        hideGlobalLoading();
    }
}

async function deleteNote(noteId) {
    if (!confirm('Notu sil?')) return;
    showGlobalLoading();
    try {
        await db.collection('courses').doc(panelState.courseId)
                .collection('subjects').doc(panelState.subjectId)
                .collection('notes').doc(noteId).delete();
        showToast('Not silindi', 'success');
        await loadPanelNotes();
    } catch(e) {
        showToast('Silme başarısız', 'error');
    } finally {
        hideGlobalLoading();
    }
}

// Panel için editör (courses.js'teki openFullEditor'ı çağırır)
function openFullEditorForPanel() {
    if (typeof openFullEditor === 'function') {
        window.currentState = {
            level: 'notes',
            courseId: panelState.courseId,
            courseName: panelState.courseName,
            subjectId: panelState.subjectId,
            subjectName: panelState.subjectName
        };
        openFullEditor();
    } else {
        showToast('Editör hazır değil.', 'error');
    }
}