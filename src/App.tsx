import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SystemInactiveGuard } from "@/components/shared/SystemInactiveGuard";
import { GlobalSystemGuard } from "@/components/shared/GlobalSystemGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TentangKami from "./pages/TentangKami";
import AgentBerkantor from "./pages/AgentBerkantor";
import StrukturFasilitas from "./pages/StrukturFasilitas";
import LaporanKeuangan from "./pages/LaporanKeuangan";
import Tagihan from "./pages/Tagihan";
import SistemTagihan from "./pages/SistemTagihan";
import Berita from "./pages/Berita";
import Profile from "./pages/Profile";
import ManajemenUser from "./pages/ManajemenUser";
import AbonemenParkir from "./pages/kepenghunian/AbonemenParkir";
import KeluhanPenghuni from "./pages/kepenghunian/KeluhanPenghuni";
import IzinKerja from "./pages/kepenghunian/IzinKerja";
import KeluarMasukBarang from "./pages/kepenghunian/KeluarMasukBarang";
import KartuAkses from "./pages/kepenghunian/KartuAkses";
import TamuAsing from "./pages/kepenghunian/TamuAsing";
import WorkOrder from "./pages/kepenghunian/WorkOrder";
import PelayananPaket from "./pages/kepenghunian/PelayananPaket";
import DataPenghuni from "./pages/kepengelolaan/DataPenghuni";
import TenantRelationOffice from "./pages/kepengelolaan/TenantRelationOffice";
import Finance from "./pages/kepengelolaan/Finance";
import HrdGa from "./pages/kepengelolaan/HrdGa";
import RekapKaryawan from "./pages/kepengelolaan/RekapKaryawan";
import SlipGaji from "./pages/kepengelolaan/SlipGaji";
import Engineering from "./pages/kepengelolaan/Engineering";
import MeteranAir from "./pages/kepengelolaan/MeteranAir";
import LaporanInspeksi from "./pages/kepengelolaan/LaporanInspeksi";
import AksesUnit from "./pages/kepengelolaan/AksesUnit";
import AktivasiSistem from "./pages/AktivasiSistem";
import Absen from "./pages/karyawan/Absen";
import Cuti from "./pages/karyawan/Cuti";
import Lembur from "./pages/karyawan/Lembur";
import Izin from "./pages/karyawan/Izin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Wrap a page component with SystemInactiveGuard */
const guarded = (element: React.ReactNode) => (
  <SystemInactiveGuard>{element}</SystemInactiveGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GlobalSystemGuard>
            <Routes>
              {/* Selalu accessible */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/aktivasi-sistem" element={<AktivasiSistem />} />
              <Route path="/kepenghunian/pelayanan-paket" element={<PelayananPaket />} />

              {/* Guarded - juga diblock oleh GlobalSystemGuard untuk non-super-admin */}
              <Route path="/tentang-kami" element={guarded(<TentangKami />)} />
              <Route path="/agent-berkantor" element={guarded(<AgentBerkantor />)} />
              <Route path="/struktur-fasilitas" element={guarded(<StrukturFasilitas />)} />
              <Route path="/laporan-keuangan" element={guarded(<LaporanKeuangan />)} />
              <Route path="/tagihan" element={guarded(<Tagihan />)} />
              <Route path="/sistem-tagihan" element={guarded(<SistemTagihan />)} />
              <Route path="/berita" element={guarded(<Berita />)} />
              <Route path="/manajemen-user" element={guarded(<ManajemenUser />)} />
              <Route path="/kepenghunian/abonemen-parkir" element={guarded(<AbonemenParkir />)} />
              <Route path="/kepenghunian/keluhan" element={guarded(<KeluhanPenghuni />)} />
              <Route path="/kepenghunian/izin-kerja" element={guarded(<IzinKerja />)} />
              <Route path="/kepenghunian/barang" element={guarded(<KeluarMasukBarang />)} />
              <Route path="/kepenghunian/kartu-akses" element={guarded(<KartuAkses />)} />
              <Route path="/kepenghunian/tamu-asing" element={guarded(<TamuAsing />)} />
              <Route path="/kepenghunian/work-order" element={guarded(<WorkOrder />)} />
              <Route path="/kepengelolaan/data-penghuni" element={guarded(<DataPenghuni />)} />
              <Route path="/kepengelolaan/tro" element={guarded(<TenantRelationOffice />)} />
              <Route path="/kepengelolaan/finance" element={guarded(<Finance />)} />
              <Route path="/kepengelolaan/hrd-ga" element={guarded(<HrdGa />)} />
              <Route path="/kepengelolaan/hrd-ga/rekap" element={guarded(<RekapKaryawan />)} />
              <Route path="/kepengelolaan/hrd-ga/slip-gaji" element={guarded(<SlipGaji />)} />
              <Route path="/kepengelolaan/engineering" element={guarded(<Engineering />)} />
              <Route path="/kepengelolaan/engineering/meteran-air" element={guarded(<MeteranAir />)} />
              <Route path="/kepengelolaan/laporan-inspeksi" element={guarded(<LaporanInspeksi />)} />
              <Route path="/kepengelolaan/akses-unit" element={guarded(<AksesUnit />)} />
              <Route path="/karyawan/absen" element={guarded(<Absen />)} />
              <Route path="/karyawan/cuti" element={guarded(<Cuti />)} />
              <Route path="/karyawan/lembur" element={guarded(<Lembur />)} />
              <Route path="/karyawan/izin" element={guarded(<Izin />)} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalSystemGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
