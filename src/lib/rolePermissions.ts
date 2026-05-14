// Centralized role-based menu access control
// Roles: master_dev, super_admin, admin, staff, agent, penghuni,
// staff_tro, staff_finance, staff_hrd_ga, staff_engineering,
// staff_building_service, staff_outsourcing_cleaning,
// staff_outsourcing_security, staff_outsourcing_parkir, staff_purchasing

export type AppRole =
  | "master_dev"
  | "super_admin"
  | "admin"
  | "staff"
  | "agent"
  | "penghuni"
  | "staff_tro"
  | "staff_finance"
  | "staff_hrd_ga"
  | "staff_engineering"
  | "staff_building_service"
  | "staff_outsourcing_cleaning"
  | "staff_outsourcing_security"
  | "staff_outsourcing_parkir"
  | "staff_purchasing";

// Path prefixes each role is allowed to access (besides always-public ones)
const ROLE_ALLOWED_PREFIXES: Record<string, string[] | "*"> = {
  master_dev: "*",
  super_admin: "*",
  admin: "*",
  // ----- Divisi -----
  staff_tro: [
    "/kepengelolaan/tro",
    "/kepengelolaan/data-penghuni",
    "/kepengelolaan/akses-unit",
    "/kepengelolaan/laporan-inspeksi",
    "/kepenghunian", // semua menu kepenghunian (keluhan, izin, paket, dll)
    "/karyawan",
    "/profile",
  ],
  staff_finance: [
    "/kepengelolaan/finance",
    "/sistem-tagihan",
    "/tagihan",
    "/laporan-keuangan",
    "/karyawan",
    "/profile",
  ],
  staff_hrd_ga: [
    "/kepengelolaan/hrd-ga",
    "/karyawan",
    "/profile",
  ],
  staff_engineering: [
    "/kepengelolaan/engineering",
    "/kepengelolaan/laporan-inspeksi",
    "/karyawan",
    "/profile",
  ],
  staff_building_service: [
    "/kepengelolaan/building-service",
    "/kepengelolaan/laporan-inspeksi",
    "/karyawan",
    "/profile",
  ],
  staff_outsourcing_cleaning: [
    "/kepengelolaan/housekeeping",
    "/karyawan",
    "/profile",
  ],
  staff_outsourcing_security: [
    "/kepengelolaan/security",
    "/karyawan",
    "/profile",
  ],
  staff_outsourcing_parkir: [
    "/kepenghunian/abonemen-parkir",
    "/karyawan",
    "/profile",
  ],
  staff_purchasing: [
    "/kepengelolaan/purchasing",
    "/karyawan",
    "/profile",
  ],
  staff: [
    "/karyawan",
    "/profile",
  ],
  // Penghuni & agent: limited (handled via existing isLimitedAccess)
  agent: [
    "/sistem-tagihan",
    "/tagihan",
    "/kepenghunian",
    "/profile",
  ],
  penghuni: [
    "/sistem-tagihan",
    "/tagihan",
    "/kepenghunian",
    "/profile",
  ],
};

// Always accessible to anyone logged in (or public)
const ALWAYS_ALLOWED = [
  "/",
  "/auth",
  "/aktivasi-sistem",
  "/ambil-antrian",
  "/tentang-kami",
  "/agent-berkantor",
  "/struktur-fasilitas",
  "/berita",
];

export function canAccessPath(role: AppRole | null, path: string): boolean {
  if (!role) return ALWAYS_ALLOWED.some((p) => path === p || path.startsWith(p + "/"));
  if (ALWAYS_ALLOWED.some((p) => path === p || path.startsWith(p + "/"))) return true;

  const allowed = ROLE_ALLOWED_PREFIXES[role];
  if (allowed === "*") return true;
  if (!allowed) return false;
  return allowed.some((prefix) => path === prefix || path.startsWith(prefix + (prefix.endsWith("/") ? "" : "/")) || path.startsWith(prefix));
}

export function isFullAccessRole(role: AppRole | null): boolean {
  return role === "master_dev" || role === "super_admin" || role === "admin";
}
