<!-- Panggil Library Firebase Online -->
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

<script>
    // 1. ISIKAN CONFIG FIREBASE KAMU DI SINI
    // (Bisa bikin gratis di https://console.firebase.google.com)
    const firebaseConfig = {
        apiKey: "ISI_API_KEY_KAMU",
        authDomain: "PROJECT_ID.firebaseapp.com",
        projectId: "PROJECT_ID",
        storageBucket: "PROJECT_ID.appspot.com",
        messagingSenderId: "SENDER_ID",
        appId: "APP_ID"
    };

    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    let currentUser = JSON.parse(localStorage.getItem('smp6_session')) || null;

    const targetKelasList = [
        "Semua Kelas 7", "Semua Kelas 8", "Semua Kelas 9",
        "7A", "7B", "7C", "7D", "7E", "7F", "7G", "7H", "7I",
        "8A", "8B", "8C", "8D", "8E", "8F", "8G", "8H", "8I", "8J", "8K",
        "9A", "9B", "9C", "9D", "9E", "9F", "9G"
    ];

    function initKelasOptions() {
        const selectReg = document.getElementById('regKelas');
        selectReg.innerHTML = '';
        targetKelasList.slice(3).forEach(k => {
            selectReg.innerHTML += `<option value="${k}">${k}</option>`;
        });

        const selectTarget = document.getElementById('taskTargetKelas');
        selectTarget.innerHTML = '';
        targetKelasList.forEach(k => {
            selectTarget.innerHTML += `<option value="${k}">${k}</option>`;
        });
    }

    function togglePasswordVisibility(inputId, icon) {
        const input = document.getElementById(inputId);
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }

    function validatePasswordRules() {
        const password = document.getElementById('regPassword').value;
        const isLengthValid = password.length >= 6;
        const isUpperValid = /[A-Z]/.test(password);
        const isNumberValid = /[0-9]/.test(password);

        updateRuleUI(document.getElementById('ruleLength'), isLengthValid, "Minimal 6 Karakter");
        updateRuleUI(document.getElementById('ruleUpper'), isUpperValid, "Minimal 1 Huruf Besar (A-Z)");
        updateRuleUI(document.getElementById('ruleNumber'), isNumberValid, "Minimal 1 Angka (0-9)");

        return isLengthValid && isUpperValid && isNumberValid;
    }

    function updateRuleUI(element, isValid, text) {
        if (isValid) {
            element.className = "rule-item valid";
            element.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${text}`;
        } else {
            element.className = "rule-item invalid";
            element.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${text}`;
        }
    }

    function showAlert(elementId, message, isSuccess) {
        const alertBox = document.getElementById(elementId);
        if(!alertBox) return;
        alertBox.classList.remove('hidden', 'success', 'error');
        alertBox.classList.add(isSuccess ? 'success' : 'error');
        alertBox.innerHTML = `<i class="fa-solid fa-${isSuccess ? 'circle-check' : 'circle-xmark'}"></i> <span>${message}</span>`;
    }

    function hideAlert(elementId) {
        const alertBox = document.getElementById(elementId);
        if(alertBox) alertBox.classList.add('hidden');
    }

    function switchAuthMode(mode) {
        hideAlert('popAlert');
        if(mode === 'login') {
            document.getElementById('tabLogin').classList.add('active');
            document.getElementById('tabRegister').classList.remove('active');
            document.getElementById('formLogin').classList.remove('hidden');
            document.getElementById('formRegister').classList.add('hidden');
        } else {
            document.getElementById('tabRegister').classList.add('active');
            document.getElementById('tabLogin').classList.remove('active');
            document.getElementById('formRegister').classList.remove('hidden');
            document.getElementById('formLogin').classList.add('hidden');
        }
    }

    function toggleRegFields() {
        const role = document.getElementById('regRole').value;
        if(role === 'guru') {
            document.getElementById('fieldKelas').classList.add('hidden');
            document.getElementById('fieldMapel').classList.remove('hidden');
        } else {
            document.getElementById('fieldKelas').classList.remove('hidden');
            document.getElementById('fieldMapel').classList.add('hidden');
        }
    }

    // REGISTRASI KE DATABASE ONLINE
    async function handleRegister(e) {
        e.preventDefault();
        hideAlert('popAlert');

        if(!validatePasswordRules()) {
            showAlert('popAlert', 'Password belum memenuhi ketentuan!', false);
            return;
        }

        const name = document.getElementById('regName').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;

        // Cek user terdaftar di database
        const userCheck = await db.collection('users').where('name', '==', name).where('role', '==', role).get();
        if(!userCheck.empty) {
            showAlert('popAlert', 'Nama tersebut sudah terdaftar!', false);
            return;
        }

        let newUser = { name, password, role };

        if(role === 'guru') {
            const checkedMapel = Array.from(document.querySelectorAll('input[name="mapel"]:checked')).map(cb => cb.value);
            if(checkedMapel.length === 0) {
                showAlert('popAlert', 'Pilih minimal 1 Mata Pelajaran!', false);
                return;
            }
            const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '') + '-' + checkedMapel[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
            newUser.code = code;
            newUser.mapel = checkedMapel;

            await db.collection('users').add(newUser);
            showAlert('popAlert', `Pendaftaran Berhasil! Kode Guru: ${code}`, true);
        } else {
            const kelas = document.getElementById('regKelas').value;
            newUser.kelas = kelas;

            await db.collection('users').add(newUser);
            showAlert('popAlert', 'Pendaftaran Murid Berhasil!', true);
        }

        setTimeout(() => loginUser(newUser), 1200);
    }

    // LOGIN DARI DATABASE ONLINE
    async function handleLogin(e) {
        e.preventDefault();
        hideAlert('popAlert');
        const name = document.getElementById('loginName').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;

        const query = await db.collection('users')
            .where('name', '==', name)
            .where('password', '==', password)
            .where('role', '==', role)
            .get();

        if(!query.empty) {
            const user = query.docs[0].data();
            showAlert('popAlert', 'Berhasil masuk ke portal...', true);
            setTimeout(() => loginUser(user), 800);
        } else {
            showAlert('popAlert', 'Nama, Password, atau Role salah!', false);
        }
    }

    function loginUser(user) {
        currentUser = user;
        localStorage.setItem('smp6_session', JSON.stringify(user));
        
        hideAlert('popAlert');
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('userNav').classList.remove('hidden');
        document.getElementById('navUserName').innerText = user.name;
        document.getElementById('navUserRole').innerText = user.role === 'guru' ? 'GURU' : 'MURID (' + user.kelas + ')';

        if(user.role === 'guru') {
            document.getElementById('guruDashboard').classList.remove('hidden');
            document.getElementById('muridDashboard').classList.add('hidden');
            loadGuruDashboard();
        } else {
            document.getElementById('muridDashboard').classList.remove('hidden');
            document.getElementById('guruDashboard').classList.add('hidden');
            loadMuridDashboard();
        }
    }

    function logout() {
        currentUser = null;
        localStorage.removeItem('smp6_session');
        
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('userNav').classList.add('hidden');
        document.getElementById('guruDashboard').classList.add('hidden');
        document.getElementById('muridDashboard').classList.add('hidden');
    }

    function loadGuruDashboard() {
        document.getElementById('displayTeacherCode').innerText = currentUser.code;
        document.getElementById('displayTeacherSubjects').innerText = currentUser.mapel.join(', ');

        const taskMapelSelect = document.getElementById('taskMapelSelect');
        taskMapelSelect.innerHTML = '';
        currentUser.mapel.forEach(m => {
            taskMapelSelect.innerHTML += `<option value="${m}">${m}</option>`;
        });

        // Realtime update pengumpulan tugas
        db.collection('submissions').where('teacherCode', '==', currentUser.code)
            .onSnapshot(snapshot => {
                const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderGuruSubmissions(subs);
            });
    }

    async function handleCreateTask(e) {
        e.preventDefault();
        hideAlert('guruTaskAlert');

        const mapel = document.getElementById('taskMapelSelect').value;
        const targetKelas = document.getElementById('taskTargetKelas').value;
        const title = document.getElementById('taskTitle').value;
        const desc = document.getElementById('taskDesc').value;
        const fileInput = document.getElementById('taskFile');

        const saveTask = async (fileName, fileData) => {
            try {
                await db.collection('tasks').add({
                    teacherName: currentUser.name,
                    teacherCode: currentUser.code,
                    mapel, targetKelas, title, desc,
                    fileName: fileName || null,
                    fileData: fileData || null,
                    createdAt: new Date()
                });
                showAlert('guruTaskAlert', 'Tugas berhasil dikirim ke kelas ' + targetKelas + '!', true);
                e.target.reset();
            } catch(err) {
                showAlert('guruTaskAlert', 'Gagal mengirim tugas. Coba lagi!', false);
            }
        };

        if(fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 1024 * 1024) {
                showAlert('guruTaskAlert', 'File maksimal 1MB.', false);
                return;
            }
            const reader = new FileReader();
            reader.onload = function(evt) { saveTask(file.name, evt.target.result); };
            reader.readAsDataURL(file);
        } else {
            saveTask(null, null);
        }
    }

    function renderGuruSubmissions(teacherSubs) {
        const table = document.getElementById('guruSubmissionsTable');
        table.innerHTML = '';

        if(teacherSubs.length === 0) {
            table.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Belum ada tugas masuk dari siswa.</td></tr>';
            return;
        }

        teacherSubs.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.studentName}</strong><br><small>${s.studentKelas}</small></td>
                <td>${s.mapel}</td>
                <td>${s.title}</td>
                <td><a href="${s.fileData}" download="${s.fileName}" class="file-link"><i class="fa-solid fa-file-arrow-down"></i> ${s.fileName}</a></td>
                <td>${s.grade !== null && s.grade !== undefined ? `<strong style="color:var(--success); font-size:1rem;">${s.grade}</strong>` : '<span class="badge-status badge-pending">Belum Dinilai</span>'}</td>
                <td>
                    <button class="btn btn-accent" style="padding:4px 8px; font-size:0.75rem;" onclick="openGradeModal('${s.id}', '${s.grade || ''}', '${s.feedback || ''}')"><i class="fa-solid fa-star"></i> Nilai</button>
                    <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="deleteSubmission('${s.id}')"><i class="fa-solid fa-trash"></i> Hapus</button>
                </td>
            `;
            table.appendChild(tr);
        });
    }

    async function deleteSubmission(id) {
        if(confirm('Hapus berkas ini dari sistem?')) {
            await db.collection('submissions').doc(id).delete();
        }
    }

    function openGradeModal(id, currentGrade, currentFeedback) {
        document.getElementById('gradeSubId').value = id;
        document.getElementById('gradeInput').value = currentGrade;
        document.getElementById('feedbackInput').value = currentFeedback;
        document.getElementById('gradeModal').classList.remove('hidden');
    }

    function closeGradeModal() {
        document.getElementById('gradeModal').classList.add('hidden');
    }

    async function saveGrade(e) {
        e.preventDefault();
        const id = document.getElementById('gradeSubId').value;
        const grade = parseInt(document.getElementById('gradeInput').value);
        const feedback = document.getElementById('feedbackInput').value;

        await db.collection('submissions').doc(id).update({ grade, feedback });
        closeGradeModal();
    }

    function loadMuridDashboard() {
        document.getElementById('displayMuridKelas').innerText = currentUser.kelas;
        
        // Load tugas online realtime
        db.collection('tasks').onSnapshot(snapshot => {
            const allTasks = snapshot.docs.map(doc => doc.data());
            renderMuridTasks(allTasks);
        });

        // Load riwayat tugas murid
        db.collection('submissions').where('studentName', '==', currentUser.name)
            .onSnapshot(snapshot => {
                const mySubs = snapshot.docs.map(doc => doc.data());
                renderMuridHistory(mySubs);
            });
    }

    function renderMuridTasks(tasks) {
        const list = document.getElementById('muridTaskList');
        list.innerHTML = '';

        const muridAngkatan = currentUser.kelas.charAt(0);
        const relevantTasks = tasks.filter(t => {
            return t.targetKelas === currentUser.kelas || 
                   t.targetKelas.toLowerCase().includes('semua kelas ' + muridAngkatan) ||
                   t.targetKelas === 'Semua Kelas';
        });

        if(relevantTasks.length === 0) {
            list.innerHTML = '<p style="color:#94a3b8; font-size:0.9rem;">Belum ada tugas khusus untuk kelas Anda.</p>';
            return;
        }

        relevantTasks.forEach(t => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.innerHTML = `
                <div>
                    <span class="tag">${t.mapel} | Target: ${t.targetKelas}</span>
                    <h4>${t.title}</h4>
                    <p style="font-size:0.8rem; color:#64748b; font-weight:700;">Guru: ${t.teacherName}</p>
                    <p>${t.desc}</p>
                    ${t.fileData ? `<a href="${t.fileData}" download="${t.fileName}" class="file-link"><i class="fa-solid fa-file-pdf"></i> Unduh Soal Guru</a>` : ''}
                </div>
            `;
            list.appendChild(card);
        });
    }

    async function verifyTeacherCode() {
        const code = document.getElementById('subTeacherCode').value.trim().toUpperCase();
        const status = document.getElementById('teacherCodeStatus');
        const select = document.getElementById('subMapel');
        
        const query = await db.collection('users').where('role', '==', 'guru').where('code', '==', code).get();
        if(!query.empty) {
            const teacher = query.docs[0].data();
            status.style.color = 'var(--success)';
            status.innerText = `Guru: ${teacher.name}`;
            select.innerHTML = '';
            teacher.mapel.forEach(m => {
                select.innerHTML += `<option value="${m}">${m}</option>`;
            });
        } else {
            status.style.color = 'var(--danger)';
            status.innerText = 'Kode Guru tidak ditemukan!';
            select.innerHTML = '<option value="">-- Masukkan Kode Guru Dulu --</option>';
        }
    }

    function handleSubmitAssignment(e) {
        e.preventDefault();
        hideAlert('muridSubAlert');

        const code = document.getElementById('subTeacherCode').value.trim().toUpperCase();
        const mapel = document.getElementById('subMapel').value;
        const title = document.getElementById('subTitle').value;
        const fileInput = document.getElementById('subFile');

        if(fileInput.files.length === 0) {
            showAlert('muridSubAlert', 'Silakan pilih file tugas Anda terlebih dahulu!', false);
            return;
        }

        const file = fileInput.files[0];
        if (file.size > 1024 * 1024) { 
            showAlert('muridSubAlert', 'Ukuran file terlalu besar! Maksimal 1MB.', false);
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(evt) {
            try {
                await db.collection('submissions').add({
                    studentName: currentUser.name,
                    studentKelas: currentUser.kelas,
                    teacherCode: code,
                    mapel, title,
                    fileName: file.name,
                    fileData: evt.target.result,
                    grade: null,
                    feedback: '',
                    createdAt: new Date()
                });
                
                showAlert('muridSubAlert', 'File tugas berhasil dikirim ke guru!', true);
                e.target.reset();
                document.getElementById('teacherCodeStatus').innerText = '';
            } catch(err) {
                showAlert('muridSubAlert', 'Gagal upload tugas. Coba lagi!', false);
            }
        };
        reader.readAsDataURL(file);
    }

    function renderMuridHistory(mySubs) {
        const table = document.getElementById('muridHistoryTable');
        table.innerHTML = '';

        if(mySubs.length === 0) {
            table.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Belum ada tugas yang dikumpulkan.</td></tr>';
            return;
        }

        mySubs.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.teacherCode}</strong></td>
                <td>${s.mapel}</td>
                <td>${s.title}</td>
                <td>${s.grade !== null && s.grade !== undefined ? `<strong style="color:var(--success); font-size:1.1rem;">${s.grade}</strong>` : '<span class="badge-status badge-pending">Belum Dinilai</span>'}</td>
                <td>${s.feedback || '<em style="color:#94a3b8;">Belum ada tanggapan</em>'}</td>
            `;
            table.appendChild(tr);
        });
    }

    // AUTO LOGIN
    initKelasOptions();
    if (currentUser) {
        loginUser(currentUser);
    }
</script>
