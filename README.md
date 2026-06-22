# 💸 Expense & Budget Visualizer

Aplikasi web pencatat pengeluaran harian yang ringan, responsif, dan berjalan sepenuhnya di browser tanpa backend.

Dibuat oleh **Ahmad Fikri** — RevoU Coding Camp, 22 Juni 2026.

---

## 📋 Deskripsi Proyek

**Expense & Budget Visualizer** adalah aplikasi single-page berbasis HTML, CSS, dan Vanilla JavaScript yang membantu pengguna memantau pengeluaran sehari-hari. Semua data disimpan secara lokal di browser menggunakan **Local Storage**, sehingga tidak memerlukan koneksi internet atau server tambahan.

---

## ✨ Fitur Utama

### Wajib (MVP)
| Fitur | Keterangan |
|---|---|
| **Form Input Transaksi** | Isi nama item, jumlah (format ribuan otomatis), dan kategori lalu klik "Add Transaction" |
| **Validasi Form** | Semua field wajib diisi; pesan error muncul per-field secara spesifik |
| **Daftar Transaksi** | Scrollable list menampilkan nama, jumlah, kategori, tanggal, dan tombol hapus |
| **Total Balance** | Ditampilkan di bagian atas, otomatis ter-update saat transaksi ditambah/dihapus |
| **Pie Chart** | Visualisasi distribusi pengeluaran per kategori menggunakan Chart.js 4, update otomatis |
| **Penyimpanan Data** | Semua data tersimpan di Local Storage dan tetap ada setelah browser ditutup/di-refresh |

### Fitur Tambahan (Optional Challenges)
| Fitur | Keterangan |
|---|---|
| **Kategori Kustom** | Tambahkan kategori sendiri dengan memilih nama dan warna |
| **Filter Bulanan** | Lihat transaksi dan ringkasan per bulan tertentu |
| **Monthly Summary** | Ringkasan total pengeluaran, jumlah transaksi, rata-rata, dan kategori terbesar |
| **Sorting Transaksi** | Urutkan berdasarkan tanggal (terbaru/terlama), jumlah (terbesar/terkecil), atau kategori |
| **Spending Limit** | Tetapkan batas pengeluaran bulanan; progress bar berubah warna saat mendekati/melewati batas |
| **Dark / Light Mode** | Tombol toggle tema di header; preferensi tersimpan otomatis |

---

## 🗂️ Struktur Folder

```
revou-codingcamp-22-juni-2026/
│
├── index.html                  # Markup utama aplikasi
├── css/
│   └── style.css               # Semua styling (mobile-first + responsive)
├── js/
│   └── app.js                  # Semua logika aplikasi (Vanilla JS, IIFE)
│
├── README.md
├── PROJECT OVERVIEW.md
├── REQUIREMENT FEATURES.md
└── FOLDER STRUCTURE AND RULES.md
```

> Sesuai aturan: tepat **1 file CSS** di `css/` dan **1 file JavaScript** di `js/`.

---

## 🚀 Cara Menjalankan

1. Clone atau download repository ini
2. Letakkan folder di direktori web server lokal (contoh: `htdocs` di XAMPP)
3. Buka browser dan akses `http://localhost/revou-codingcamp-22-juni-2026/`
4. Atau cukup buka file `index.html` langsung di browser

> Tidak perlu instalasi, tidak perlu Node.js, tidak perlu backend.

---

## 🛠️ Teknologi

| Teknologi | Keterangan |
|---|---|
| HTML5 | Struktur markup |
| CSS3 | Styling, flexbox, CSS variables, media queries |
| Vanilla JavaScript (ES6) | Logika aplikasi, DOM manipulation, Local Storage |
| [Chart.js 4](https://www.chartjs.org/) | Visualisasi pie chart (dimuat via CDN) |

---

## 📱 Kompatibilitas Browser

Berjalan di semua browser modern:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

Minimum viewport: **320px** (mobile-friendly).

---

## 💡 Cara Pakai

1. **Tambah transaksi** — isi nama item, jumlah (ketik angka, otomatis terformat ribuan), pilih kategori, klik **Add Transaction**
2. **Hapus transaksi** — klik tombol **✕** di item yang ingin dihapus
3. **Filter per bulan** — gunakan dropdown **Month** di bagian atas daftar
4. **Urutkan transaksi** — gunakan dropdown **Sort By**
5. **Tambah kategori baru** — klik tombol **+** di sebelah dropdown kategori
6. **Set batas pengeluaran** — klik **Set Limit** dan masukkan angka batas bulanan
7. **Ganti tema** — klik ikon ☀️/🌙 di pojok kanan header

---

## 📁 Aturan Folder

1. Hanya **1 file CSS** di dalam `css/`
2. Hanya **1 file JavaScript** di dalam `js/`
3. Kode harus bersih dan mudah dibaca

Aplikasi website ini dibuat dengan sepenuh hati dan perasaan menyenangkan menggunakan Kiro dan bantuan dari AI Agent. Terima kasih dengan model-model yang sangat variatif ini
![Logo](https://fikriahmad.my.id/wp-content/uploads/2024/02/logo_fikriahmadv2_blue.png)