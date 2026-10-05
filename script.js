// DATA PENGGUNA AWAL (AKUN CONTOH FIKTIF)
let users = JSON.parse(localStorage.getItem('smp6_users')) || [
    { name: "Pak Deni", password: "Password123", role: "guru", code: "DENI-MTK", mapel: ["MTK"] },
    { name: "Bu Cinta", password: "Password123", role: "guru", code: "CINTA-INDO", mapel: ["B. Indo"] },
    { name: "Rangga", password: "Password123", role: "murid", kelas: "7A" }
];

let tasks = JSON.parse(localStorage.getItem('smp6_tasks')) || [];
let submissions = JSON.parse(localStorage.getItem('smp6_submissions')) || [];
let currentUser = null;

// LIST TARGET KELAS LENGKAP
const targetKelasList = [
    "Semua Kelas 7",
    "Semua kelas 8",
    "Semua kelas 9",
    "7A", "7B", "7C", "7D", "7E", "7F", "7G", "7H", "7I",
    "8A", "8B", "8C", "8D", "8E", "8F", "8G", "8H", "8I", "8J", "8K",
    "9A", "9B", "9C", "9D", "9E", "9F", "9G"
];

function initKelasOptions() {
    const selectReg = document.getElementById('regKelas');
    if(!selectReg) return;
    selectReg.innerHTML = '';
    
    // Opsi untuk pendaftaran murid (hanya kelas spesifik)
    targetKelasList.slice(3).forEach(k => {
        selectReg.innerHTML += `<option value="${k}">${k}</option>`;
    });

    // Opsi untuk target kelas pada form pembuat tugas guru
    const selectTarget = document.getElementById('taskTargetKelas');
    if(!selectTarget) return;
    selectTarget.innerHTML = '';
    targetKelasList.forEach(k => {
        selectTarget.innerHTML += `<option value="${k}">${k}</option>`;
    });
}

// TAMPILKAN ATAU SEMBUNYIKAN PASSWORD
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

// VALIDASI ATURAN PASSWORD SECARA REALTIME
function validatePasswordRules() {
    const password = document.getElementById('regPassword').value;

    const ruleLength = document.getElementById('ruleLength');
    const ruleUpper = document.getElementById('ruleUpper');
    const ruleNumber = document.getElementById('ruleNumber');

    const isLengthValid = password.length >= 6;
    const isUpperValid = /[A-Z]/.test(password);
    const isNumberValid = /[0-9]/.test(password);

    updateRuleUI(ruleLength, isLengthValid, "Minimal 6 Karakter");
    updateRuleUI(ruleUpper, isUpperValid, "Minimal 1 Huruf Besar (A-Z)");
    updateRuleUI(ruleNumber, isNumberValid, "Minimal 1 Angka (0-9)");

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

// FUNGSI UMUM TAMPILKAN POPUP NOTIFIKASI
function showAlert(elementId, message, isSuccess) {
    const alertBox = document.getElementById(elementId);
    if(!alertBox) return;
    alertBox.classList.remove('hidden', 'success', 'error');
    
    if (isSuccess) {
        alertBox.classList.add('success');
        alertBox.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
    } else {
        alertBox.classList.add('error');
        alertBox.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>${message}</span>`;
    }
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

function handleRegister(e) {
    e.preventDefault();
    hideAlert('popAlert');

    // Cek Kepatuhan Password
    if(!validatePasswordRules()) {
        showAlert('popAlert', 'Password belum memenuhi ketentuan! Harap periksa kembali syarat di bawah kolom password.', false);
        return;
    }

    const name = document.getElementById('regName').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    const existingUser = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.role === role);
    if(existingUser) {
        showAlert('popAlert', 'Nama tersebut sudah terdaftar! Gunakan nama lain.', false);
        return;
    }

    if(role === 'guru') {
        const checkedMapel = Array.from(document.querySelectorAll('input[name="mapel"]:checked')).map(cb => cb.value);
        if(checkedMapel.length === 0) {
            showAlert('popAlert', 'Pilih minimal 1 Mata Pelajaran!', false);
            return;
        }
        const code = name.toUpperCase().replace(/\s+/g, '') + '-' + checkedMapel[0].toUpperCase().replace(/\s+/g, '');
        const newUser = { name, password, role, code, mapel: checkedMapel };
        users.push(newUser);
        localStorage.setItem('smp6_users', JSON.stringify(users));
        showAlert('popAlert', `Pendaftaran Guru Berhasil! Kode Guru: ${code}`, true);
        setTimeout(() => loginUser(newUser), 1200);
    } else {
        const kelas = document.getElementById('regKelas').value;
        const newUser = { name, password, role, kelas };
        users.push(newUser);
        localStorage.setItem('smp6_users', JSON.stringify(users));
        showAlert('popAlert', 'Pendaftaran Murid Berhasil!', true);
        setTimeout(() => loginUser(newUser), 1200);
    }
}

function handleLogin(e) {
    e.preventDefault();
    hideAlert('popAlert');
    const name = document.getElementById('loginName').value.trim();
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.role === role && u.password === password);
    if(user) {
        showAlert('popAlert', 'Password benar! Berhasil masuk ke portal...', true);
        setTimeout(() => {
            loginUser(user);
        }, 1000);
    } else {
        showAlert('popAlert', 'Password, Nama, atau Pilihan Role salah!', false);
    }
}

function loginUser(user) {
    currentUser = user;
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

    renderGuruSubmissions();
}

function handleCreateTask(e) {
    e.preventDefault();
    hideAlert('guruTaskAlert');

    const mapel = document.getElementById('taskMapelSelect').value;
    const targetKelas = document.getElementById('taskTargetKelas').value;
    const title = document.getElementById('taskTitle').value;
    const desc = document.getElementById('taskDesc').value;
    const fileInput = document.getElementById('taskFile');

    const saveTask = (fileName, fileData) => {
        const newTask = {
            id: Date.now(),
            teacherName: currentUser.name,
            teacherCode: currentUser.code,
            mapel,
            targetKelas,
            title,
            desc,
            fileName: fileName || null,
            fileData: fileData || null
        };
        tasks.push(newTask);
        localStorage.setItem('smp6_tasks', JSON.stringify(tasks));
        
        showAlert('guruTaskAlert', 'Tugas berhasil dikirim dan dipublikasikan ke kelas ' + targetKelas + '!', true);
        e.target.reset();
    };

    if(fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(evt) { saveTask(file.name, evt.target.result); };
        reader.readAsDataURL(file);
    } else {
        saveTask(null, null);
    }
}

function renderGuruSubmissions() {
    const table = document.getElementById('guruSubmissionsTable');
    table.innerHTML = '';
    const teacherSubs = submissions.filter(s => s.teacherCode === currentUser.code);

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
            <td>${s.grade !== null ? `<strong style="color:var(--success); font-size:1rem;">${s.grade}</strong>` : '<span class="badge-status badge-pending">Belum Dinilai</span>'}</td>
            <td>
                <button class="btn btn-accent" style="padding:4px 8px; font-size:0.75rem;" onclick="openGradeModal(${s.id})"><i class="fa-solid fa-star"></i> Nilai</button>
                <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="deleteSubmission(${s.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
            </td>
        `;
        table.appendChild(tr);
    });
}

function deleteSubmission(id) {
    if(confirm('Hapus berkas ini dari sistem?')) {
        submissions = submissions.filter(s => s.id !== id);
        localStorage.setItem('smp6_submissions', JSON.stringify(submissions));
        renderGuruSubmissions();
    }
}

function openGradeModal(id) {
    const sub = submissions.find(s => s.id === id);
    if(sub) {
        document.getElementById('gradeSubId').value = sub.id;
        document.getElementById('gradeInput').value = sub.grade || '';
        document.getElementById('feedbackInput').value = sub.feedback || '';
        document.getElementById('gradeModal').classList.remove('hidden');
    }
}

function closeGradeModal() {
    document.getElementById('gradeModal').classList.add('hidden');
}

function saveGrade(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('gradeSubId').value);
    const grade = parseInt(document.getElementById('gradeInput').value);
    const feedback = document.getElementById('feedbackInput').value;

    const sub = submissions.find(s => s.id === id);
    if(sub) {
        sub.grade = grade;
        sub.feedback = feedback;
        localStorage.setItem('smp6_submissions', JSON.stringify(submissions));
        closeGradeModal();
        renderGuruSubmissions();
    }
}

function loadMuridDashboard() {
    document.getElementById('displayMuridKelas').innerText = currentUser.kelas;
    renderMuridTasks();
    renderMuridHistory();
}

function renderMuridTasks() {
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

function verifyTeacherCode() {
    const code = document.getElementById('subTeacherCode').value.trim().toUpperCase();
    const status = document.getElementById('teacherCodeStatus');
    const select = document.getElementById('subMapel');
    
    const teacher = users.find(u => u.role === 'guru' && u.code === code);
    if(teacher) {
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

    const teacher = users.find(u => u.role === 'guru' && u.code === code);
    if(!teacher) {
        showAlert('muridSubAlert', 'Kode Guru tidak ditemukan/salah! Periksa kembali.', false);
        return;
    }

    if(fileInput.files.length === 0) {
        showAlert('muridSubAlert', 'Silakan pilih file tugas Anda terlebih dahulu!', false);
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(evt) {
        const newSub = {
            id: Date.now(),
            studentName: currentUser.name,
            studentKelas: currentUser.kelas,
            teacherCode: teacher.code,
            teacherName: teacher.name,
            mapel,
            title,
            fileName: file.name,
            fileData: evt.target.result,
            grade: null,
            feedback: ''
        };
        submissions.push(newSub);
        localStorage.setItem('smp6_submissions', JSON.stringify(submissions));
        
        showAlert('muridSubAlert', 'File tugas berhasil dikirimkan ke ' + teacher.name + '!', true);
        
        e.target.reset();
        document.getElementById('teacherCodeStatus').innerText = '';
        renderMuridHistory();
    };
    reader.readAsDataURL(file);
}

function renderMuridHistory() {
    const table = document.getElementById('muridHistoryTable');
    table.innerHTML = '';
    const mySubs = submissions.filter(s => s.studentName === currentUser.name);

    if(mySubs.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Belum ada tugas yang dikumpulkan.</td></tr>';
        return;
    }

    mySubs.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.teacherName}</strong></td>
            <td>${s.mapel}</td>
            <td>${s.title}</td>
            <td>${s.grade !== null ? `<strong style="color:var(--success); font-size:1.1rem;">${s.grade}</strong>` : '<span class="badge-status badge-pending">Belum Dinilai</span>'}</td>
            <td>${s.feedback || '<em style="color:#94a3b8;">Belum ada tanggapan</em>'}</td>
        `;
        table.appendChild(tr);
    });
}

// Inisialisasi saat halaman dimuat
document.addEventListener("DOMContentLoaded", function() {
    initKelasOptions();
});
