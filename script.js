/* ========================================================
   1. REAL-TIME CLOCK (MAC MENU BAR)
======================================================== */
function updateClock() {
    const now = new Date();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    
    let h = now.getHours();
    let m = now.getMinutes();
    
    // Tambahin angka 0 di depan kalau menit/jam di bawah 10
    m = m < 10 ? '0' + m : m;
    h = h < 10 ? '0' + h : h;
    
    const timeString = `${dayName}, ${date} ${monthName} ${h}:${m}`;
    const clockElement = document.getElementById('top-clock');
    
    if (clockElement) {
        clockElement.innerText = timeString;
    }
}
// Update jam setiap 1 detik
setInterval(updateClock, 1000);
updateClock();


/* ========================================================
   2. WINDOW MANAGER (BUKA, TUTUP, FOKUS)
======================================================== */
let highestZIndex = 100;
const appWindows = document.querySelectorAll('.app-window');
const triggerIcons = document.querySelectorAll('.interactive[data-window]');
const closeButtons = document.querySelectorAll('.close-btn');

// Fungsi Buka Jendela
triggerIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        const targetId = icon.getAttribute('data-window');
        if (!targetId) return;
        
        const targetWindow = document.getElementById(targetId);
        if (targetWindow) {
            targetWindow.style.display = 'flex';
            // Trik buat ngakalin CSS transition biar animasinya jalan
            void targetWindow.offsetWidth; 
            targetWindow.classList.add('active');
            bringToFront(targetWindow);
        }
    });
});

// Fungsi Tutup Jendela (Tombol Merah)
closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetWindow = e.target.closest('.app-window');
        if (targetWindow) {
            targetWindow.classList.remove('active');
            // Tunggu animasi selesai baru dihilangkan dari layar (200ms)
            setTimeout(() => {
                targetWindow.style.display = 'none';
            }, 200);
        }
    });
});

// Fungsi Bawa Jendela ke Paling Depan saat diklik
appWindows.forEach(win => {
    win.addEventListener('mousedown', () => bringToFront(win));
    win.addEventListener('touchstart', () => bringToFront(win));
});

function bringToFront(winElement) {
    highestZIndex++;
    winElement.style.zIndex = highestZIndex;
}


/* ========================================================
   3. DRAGGABLE WINDOWS (BISA DIGESER PAKAI MOUSE)
======================================================== */
const isMobile = window.innerWidth <= 768;

if (!isMobile) {
    appWindows.forEach(win => {
        const header = win.querySelector('.window-top-bar');
        if (!header) return;

        let isDragging = false, startX, startY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            // Cegah drag kalau yang diklik tombol merah/kuning/hijau
            if(e.target.closest('.traffic-lights')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = win.offsetLeft;
            initialY = win.offsetTop;
            document.body.style.userSelect = 'none'; // Biar teks nggak keblok biru
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            win.style.left = `${initialX + dx}px`;
            win.style.top = `${initialY + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = 'auto';
        });
    });
}


/* ========================================================
   4. CATATCUAN SAAS (LOGIKA & LOCAL STORAGE)
======================================================== */
// Ngambil data dari memori browser, kalau kosong bikin Array [] baru
let transactions = JSON.parse(localStorage.getItem('catatcuan_data')) || [];
let totalBalance = 0;
let totalIncome = 0;
let totalExpense = 0;

// Fungsi buat ngerender ulang UI Dashboard Uang
function updateFinanceDashboard() {
    totalBalance = 0; 
    totalIncome = 0; 
    totalExpense = 0;
    
    const tableBody = document.getElementById('transaction-list');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Bersihin tabel sebelum diisi ulang

    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr class="empty-state"><td colspan="4">No transactions yet. Start adding!</td></tr>';
    } else {
        // Balik urutan biar transaksi terbaru ada di paling atas (reverse)
        transactions.slice().reverse().forEach(trx => {
            // Hitung logika uang
            if (trx.type === 'income') {
                totalBalance += trx.amount;
                totalIncome += trx.amount;
            } else {
                totalBalance -= trx.amount;
                totalExpense += trx.amount;
            }

            // Bikin baris tabel baru
            const tr = document.createElement('tr');
            const typeColor = trx.type === 'income' ? 'text-green' : 'text-red';
            const typeLabel = trx.type === 'income' ? 'Income' : 'Expense';
            
            tr.innerHTML = `
                <td>${trx.date}</td>
                <td>${trx.desc}</td>
                <td class="${typeColor} fw-bold">${typeLabel}</td>
                <td>Rp ${trx.amount.toLocaleString('id-ID')}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Update angka di kartu atas
    document.getElementById('display-balance').innerText = totalBalance.toLocaleString('id-ID');
    document.getElementById('display-income').innerText = totalIncome.toLocaleString('id-ID');
    document.getElementById('display-expense').innerText = totalExpense.toLocaleString('id-ID');
    
    // Simpan data ke memori browser
    localStorage.setItem('catatcuan_data', JSON.stringify(transactions));
}

// Fungsi ngeklik tombol Income / Expense
function addTransaction(type) {
    const descInput = document.getElementById('input-desc');
    const amountInput = document.getElementById('input-amount');
    
    const desc = descInput.value.trim();
    const amount = parseInt(amountInput.value);
    
    // Validasi kalau input salah atau kosong
    if (!desc || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid description and amount greater than 0!");
        return;
    }

    // Bikin format tanggal cantik
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;

    // Masukin data ke Array
    transactions.push({
        id: Date.now(),
        date: dateStr,
        desc: desc,
        type: type,
        amount: amount
    });

    // Kosongin form
    descInput.value = '';
    amountInput.value = '';

    // Render ulang tabel & kartu
    updateFinanceDashboard();
}

// Pasang pendengar klik (Event Listener) ke tombol CatatCuan
const btnAddIncome = document.getElementById('btn-add-income');
const btnAddExpense = document.getElementById('btn-add-expense');

if (btnAddIncome) btnAddIncome.addEventListener('click', () => addTransaction('income'));
if (btnAddExpense) btnAddExpense.addEventListener('click', () => addTransaction('expense'));

// Jalankan fungsi pas web pertama kali dibuka
updateFinanceDashboard();
/* ========================================================
   5. INTERAKTIVITAS TAMBAHAN (ANTI DEAD-CLICK)
======================================================== */

// Bikin elemen Toast Notification otomatis
const toastEl = document.createElement('div');
toastEl.className = 'toast';
document.body.appendChild(toastEl);
let toastTimeout;

// Fungsi untuk nampilin notifikasi
function showToast(message) {
    toastEl.innerText = message;
    toastEl.classList.add('show');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2500);
}

// 1. Respon untuk Menu Bar Atas (File, View, Help, dll)
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        // Abaikan kalau yang diklik itu jam/wifi/baterai
        if(!item.classList.contains('time-display') && !item.querySelector('.sys-icon')) {
            showToast(`Menu "${item.innerText.trim()}" belum tersedia, bro!`);
        }
    });
});

// 2. Respon untuk Tombol Maximize (Hijau)
document.querySelectorAll('.light.green').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const win = e.target.closest('.app-window');
        if(win) {
            win.classList.toggle('maximized');
            if(win.classList.contains('maximized')) {
                showToast('Window dimaksimalkan');
            } else {
                showToast('Window dikembalikan ke ukuran semula');
            }
        }
    });
});

// 3. Respon untuk Tombol Minimize (Kuning)
document.querySelectorAll('.light.yellow').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const win = e.target.closest('.app-window');
        if(win) {
            win.classList.remove('active'); 
            setTimeout(() => { win.style.display = 'none'; }, 200);
            showToast('Window disembunyikan ke Dock');
        }
    });
});

// 4. Respon untuk Sidebar Kiri di Portfolio
document.querySelectorAll('.sidebar-section li').forEach(li => {
    li.addEventListener('click', function() {
        // Hapus class active dari yang lain, pindahin ke yang diklik
        document.querySelectorAll('.sidebar-section li').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        
        // Bersihin emoji buat di notif
        const categoryName = this.innerText.replace(/[^\w\s]/gi, '').trim();
        showToast(`Memuat kategori: ${categoryName}...`);
    });
});

// 5. Respon untuk File/Project Card di Portfolio
document.querySelectorAll('.file-card').forEach(card => {
    card.addEventListener('click', () => {
        const title = card.querySelector('h5').innerText;
        showToast(`Membuka detail project: ${title} 🚀`);
    });
});

// 6. Ganti alert() bawaan di tombol Pricing & About jadi Toast biar lebih mulus
document.querySelectorAll('.btn').forEach(btn => {
    // Cek kalau tombol punya atribut onclick yang isinya alert
    if(btn.getAttribute('onclick') && btn.getAttribute('onclick').includes('alert')) {
        btn.removeAttribute('onclick'); // Hapus alert jelek bawaan browser
        btn.addEventListener('click', () => {
            showToast('Membuka WhatsApp/Email untuk diskusi lebih lanjut... 💬');
        });
    }
});
/* ========================================================
   6. CUSTOM RIGHT-CLICK CONTEXT MENU
======================================================== */
const contextMenu = document.getElementById('context-menu');
const workspace = document.getElementById('workspace');

// Matikan klik kanan bawaan dan munculin menu custom
workspace.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Cegah menu browser keluar
    
    // Posisi mouse
    let x = e.clientX;
    let y = e.clientY;
    
    // Biar menu gak keluar layar kalau diklik di pojok kanan/bawah
    const menuWidth = 200;
    const menuHeight = 120;
    
    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;
    
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = 'block';
});

// Hilangin menu kalau ngeklik kiri di sembarang tempat
document.addEventListener('click', (e) => {
    if(e.button !== 2) {
        contextMenu.style.display = 'none';
    }
});

// Fungsi tombol di dalam klik kanan
document.getElementById('ctx-refresh').addEventListener('click', () => {
    location.reload(); // Refresh halaman
});

document.getElementById('ctx-wallpaper').addEventListener('click', () => {
    // Ganti wallpaper random
    const colors = ['#0f172a', '#1e1b4b', '#171717', '#064e3b'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    document.getElementById('workspace').style.background = randomColor;
    showToast('Wallpaper berhasil diganti! 🎨');
});

document.getElementById('ctx-about').addEventListener('click', () => {
    // Buka window about
    document.getElementById('window-about').style.display = 'flex';
    setTimeout(() => document.getElementById('window-about').classList.add('active'), 10);
    bringToFront(document.getElementById('window-about'));
});