
# Rencana Perbaikan: Data Paket Terbatas 1000

## Ringkasan Masalah
Data paket Anda saat ini berjumlah **4.471 entri** di database, tetapi hanya **1.000** yang bisa ditampilkan. Ini disebabkan oleh batasan default dari sistem database yang membatasi query maksimal 1.000 baris.

## Solusi yang Akan Diterapkan
Mengubah cara pengambilan data dari **mengambil semua sekaligus** menjadi **mengambil per halaman** (server-side pagination). Dengan cara ini, data akan diambil sesuai kebutuhan halaman yang sedang dilihat.

## Keuntungan Solusi Ini
- Data lebih dari 1.000 bisa diakses
- Performa lebih cepat karena hanya mengambil data yang diperlukan
- Tidak ada batasan jumlah data

---

## Detail Teknis

### 1. Modifikasi Hook usePackages
**File:** `src/hooks/usePackages.ts`

Mengubah fungsi `usePackages` untuk mendukung server-side pagination:

```text
Perubahan:
┌─────────────────────────────────────────────────────────────┐
│ SEBELUM (mengambil semua data):                             │
│ - Query tanpa limit → Default Supabase: 1000 baris          │
│ - Pagination dilakukan di frontend (client-side)            │
├─────────────────────────────────────────────────────────────┤
│ SESUDAH (mengambil per halaman):                            │
│ - Query dengan range() → Mengambil sesuai halaman           │
│ - Query count terpisah → Menghitung total data              │
│ - Pagination dilakukan di server (server-side)              │
└─────────────────────────────────────────────────────────────┘
```

**Fungsi baru yang akan ditambahkan:**
- `usePackagesPaginated(page, pageSize, search?, dateFilter?)` - Mengambil data per halaman
- Query dengan `.range(from, to)` untuk membatasi data yang diambil
- Query terpisah untuk menghitung total data

### 2. Modifikasi Halaman Pelayanan Paket
**File:** `src/pages/kepenghunian/PelayananPaket.tsx`

Mengubah halaman untuk menggunakan pagination dari server:

**Perubahan utama:**
- Menggunakan hook `usePackagesPaginated` yang baru
- Filter pencarian dan tanggal dilakukan di server (bukan client)
- Menampilkan total data yang akurat dari server

### 3. Optimasi Filter (Server-Side)
Filter pencarian dan tanggal akan dijalankan di server:

```text
┌───────────────────────────────────────────────────────────┐
│ Filter Server-Side:                                       │
│ - Pencarian: owner_name, unit_number, courier, item_type  │
│ - Filter Tanggal: today, week, month, year, all           │
│ - Sorting: created_at descending                          │
└───────────────────────────────────────────────────────────┘
```

---

## Hasil yang Diharapkan
1. Semua **4.471+ paket** dapat diakses melalui navigasi halaman
2. Performa lebih baik karena hanya mengambil 10/50/100 data per halaman
3. Filter pencarian dan tanggal tetap berfungsi normal
4. Tidak ada lagi batasan 1.000 data
