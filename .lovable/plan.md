## Tambah Fitur Pengaturan Jadwal Kerja (Shift) di HRD & GA

Menu baru "Jadwal Kerja" pada dashboard HRD & GA untuk mengelola shift karyawan dengan kalender view, integrasi ke absensi, dan notifikasi otomatis.

### 1. Database (migration)

**Tabel baru:**

- `shift_definitions` — master shift
  - `name` (Pagi/Siang/Malam/custom), `start_time`, `end_time`, `late_tolerance_minutes` (default 15), `working_days` (int[] 0-6, Min-Sab), `color` (hex token), `is_default`, `is_active`, `created_by`
  - Seed: Pagi (07:00–15:00, biru), Siang (15:00–23:00, oranye), Malam (23:00–07:00, ungu)

- `employee_shift_schedules` — assignment per karyawan per tanggal
  - `user_id`, `employee_name`, `shift_id`, `schedule_date`, `notes`, `created_by`
  - Unique (`user_id`, `schedule_date`)

- `shift_rotation_rules` — rotasi otomatis (opsional)
  - `user_ids` (uuid[]), `shift_ids` (uuid[]), `start_date`, `end_date`, `rotation_type` (daily/weekly/monthly), `cycle_days`, `is_active`

**RLS:**
- Admin/HRD (`is_admin_or_above` atau `staff_hrd_ga`): full manage
- Staff lain: hanya SELECT jadwal milik sendiri (`user_id = auth.uid()`)

**Notifikasi:** trigger AFTER INSERT/UPDATE pada `employee_shift_schedules` → insert ke `broadcast_messages` (target_type=`user`, target_value=[user_id]) dengan judul "Perubahan Jadwal Shift".

**Integrasi absensi:** kolom `shift_id` ditambahkan ke `employee_attendance`. Saat check-in, sistem cari jadwal hari itu, hitung status (`hadir`/`terlambat`) berdasarkan `start_time + late_tolerance` shift tersebut.

### 2. Halaman & Komponen Baru

- `src/pages/kepengelolaan/hrd-ga/JadwalKerja.tsx` — halaman utama (Admin/HRD only) dengan 3 tab:
  1. **Kalender** — calendar view bulanan (pakai `react-day-picker` yg sudah ada), tiap sel menampilkan badge berwarna shift per karyawan; klik sel → dialog assign/edit
  2. **Pengaturan Shift** — CRUD `shift_definitions` (form: nama, jam masuk/pulang, toleransi, hari kerja multi-select, color picker)
  3. **Rotasi & Assignment** — assign shift batch (pilih karyawan + range tanggal + pola: harian/mingguan/bulanan + rotasi auto)

- `src/pages/karyawan/JadwalSaya.tsx` — read-only calendar untuk karyawan lihat shift sendiri (kartu di EmployeeGrid)

- Komponen pendukung di `src/components/shift/`:
  - `ShiftFormDialog.tsx`
  - `ShiftCalendarView.tsx`
  - `AssignShiftDialog.tsx`
  - `ShiftBadge.tsx` (pill berwarna per shift)

- Hooks: `src/hooks/useShifts.ts`, `src/hooks/useShiftSchedules.ts`

### 3. Integrasi UI

- Tambah card "Jadwal Kerja" (icon `CalendarClock`, warna warning) di `src/pages/kepengelolaan/HrdGa.tsx` → route `/kepengelolaan/hrd-ga/jadwal-kerja`
- Tambah card "Jadwal Saya" di `EmployeeGrid.tsx` (visible untuk semua staff) → route `/karyawan/jadwal-saya`
- Routes baru di `src/App.tsx` (ProtectedRoute)
- Sidebar: tambah submenu jadwal kerja jika ada submenu HRD

### 4. Integrasi Absensi (update `useEmployeeAttendance.ts`)

Pada `useCheckIn`: query `employee_shift_schedules` untuk user+today, ambil `shift.start_time + late_tolerance`, set status `terlambat` jika check-in > batas, simpan `shift_id` ke attendance row. Fallback ke logika lama jika tidak ada jadwal.

### Catatan Teknis
- Warna shift disimpan sebagai HSL token-friendly hex; rendering pakai inline style background untuk badge (sudah pola yang ada)
- Rotasi otomatis: dihitung client-side saat assign batch lalu insert banyak baris ke `employee_shift_schedules` (idempotent via upsert on conflict user_id+date)
- Lembur tetap independen; tampilkan jadwal sebagai konteks di rekap karyawan (read-only join nanti)
