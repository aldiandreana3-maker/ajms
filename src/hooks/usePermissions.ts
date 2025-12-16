import { useAuth } from "@/contexts/AuthContext";

export type DataCategory = "red" | "blue";

// RED Category - Super Admin Only
export const RED_CATEGORY_FEATURES = [
  "tentang-kami",
  "agent-berkantor", 
  "struktur-fasilitas",
  "type-unit",
  "laporan-keuangan",
  "tagihan",
  "berita",
  "total-unit",
  "penghuni-aktif",
  "daftar-komersil",
] as const;

// BLUE Category - User-owned data
export const BLUE_CATEGORY_FEATURES = [
  "keluhan",
  "work-order",
  "abonemen-parkir",
  "kartu-akses",
  "keluar-masuk-barang",
  "izin-kerja",
] as const;

export type RedFeature = typeof RED_CATEGORY_FEATURES[number];
export type BlueFeature = typeof BLUE_CATEGORY_FEATURES[number];

export function usePermissions() {
  const { user, role, isSuperAdmin, isAdmin, isStaff } = useAuth();

  const isAuthenticated = !!user;

  // Check if user can edit RED category data
  const canEditRedCategory = isSuperAdmin;

  // Check if user can view RED category data
  const canViewRedCategory = isAuthenticated;

  // Check if user can create BLUE category data
  const canCreateBlueCategory = isAuthenticated;

  // Check if user can edit their own BLUE category data
  const canEditOwnBlueData = isAuthenticated;

  // Check if user can view all BLUE category data (super admin only)
  const canViewAllBlueData = isSuperAdmin || isAdmin || isStaff;

  // Get permission for a specific feature
  const getFeaturePermission = (feature: string) => {
    const isRedCategory = RED_CATEGORY_FEATURES.includes(feature as RedFeature);
    const isBlueCategory = BLUE_CATEGORY_FEATURES.includes(feature as BlueFeature);

    if (isRedCategory) {
      return {
        canCreate: canEditRedCategory,
        canEdit: canEditRedCategory,
        canDelete: canEditRedCategory,
        canView: canViewRedCategory,
        category: "red" as DataCategory,
        tooltip: canEditRedCategory ? undefined : "Hanya dapat diubah oleh Super Admin",
      };
    }

    if (isBlueCategory) {
      return {
        canCreate: canCreateBlueCategory,
        canEdit: canEditOwnBlueData,
        canDelete: canEditOwnBlueData,
        canView: true,
        category: "blue" as DataCategory,
        tooltip: isAuthenticated ? "Hanya data akun Anda" : "Silakan login terlebih dahulu",
      };
    }

    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canView: true,
      category: undefined,
      tooltip: undefined,
    };
  };

  return {
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    canEditRedCategory,
    canViewRedCategory,
    canCreateBlueCategory,
    canEditOwnBlueData,
    canViewAllBlueData,
    getFeaturePermission,
    userId: user?.id,
  };
}
