import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SystemInactiveGuard } from "@/components/shared/SystemInactiveGuard";
import { GlobalSystemGuard } from "@/components/shared/GlobalSystemGuard";
import { NotificationsProvider } from "@/components/shared/NotificationsProvider";
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
import BroadcastPesan from "./pages/BroadcastPesan";
import PesanPenghuni from "./pages/kepenghunian/PesanPenghuni";
import DataPenghuni from "./pages/kepengelolaan/DataPenghuni";
import TenantRelationOffice from "./pages/kepengelolaan/TenantRelationOffice";
import Finance from "./pages/kepengelolaan/Finance";
import SistemKasir from "./pages/kepengelolaan/SistemKasir";
import KasirListrik from "./pages/kepengelolaan/KasirListrik";
import RiwayatTransaksiListrik from "./pages/kepengelolaan/RiwayatTransaksiListrik";
import DataMeterListrik from "./pages/kepengelolaan/DataMeterListrik";
import LaporanPenjualanListrik from "./pages/kepengelolaan/LaporanPenjualanListrik";
import Kelistrikan from "./pages/kepengelolaan/Kelistrikan";
import Akuntansi from "./pages/kepengelolaan/akuntansi/Akuntansi";
import DaftarAkun from "./pages/kepengelolaan/akuntansi/DaftarAkun";
import JurnalTransaksi from "./pages/kepengelolaan/akuntansi/JurnalTransaksi";
import PostingData from "./pages/kepengelolaan/akuntansi/PostingData";
import BukuBesar from "./pages/kepengelolaan/akuntansi/BukuBesar";
import NeracaSaldo from "./pages/kepengelolaan/akuntansi/NeracaSaldo";
import Rekonsiliasi from "./pages/kepengelolaan/akuntansi/Rekonsiliasi";

import LaporanLabaRugi from "./pages/kepengelolaan/akuntansi/LaporanLabaRugi";
import LaporanNeraca from "./pages/kepengelolaan/akuntansi/LaporanNeraca";
import LaporanArusKas from "./pages/kepengelolaan/akuntansi/LaporanArusKas";
import HrdGa from "./pages/kepengelolaan/HrdGa";
import RekapKaryawan from "./pages/kepengelolaan/RekapKaryawan";
import SlipGaji from "./pages/kepengelolaan/SlipGaji";
import DataKaryawan from "./pages/kepengelolaan/DataKaryawan";
import Engineering from "./pages/kepengelolaan/Engineering";
import MeteranAir from "./pages/kepengelolaan/MeteranAir";
import Security from "./pages/kepengelolaan/Security";
import HouseKeeping from "./pages/kepengelolaan/HouseKeeping";
import LaporanInspeksi from "./pages/kepengelolaan/LaporanInspeksi";
import LaporanKerja from "./pages/kepengelolaan/LaporanKerja";
import AksesUnit from "./pages/kepengelolaan/AksesUnit";
import DataSepeda from "./pages/kepengelolaan/DataSepeda";
import AktivasiSistem from "./pages/AktivasiSistem";
import AmbilAntrian from "./pages/AmbilAntrian";
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
          <NotificationsProvider>
          <GlobalSystemGuard>
            <Routes>
              {/* Selalu accessible */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/aktivasi-sistem" element={<AktivasiSistem />} />
              <Route path="/kepenghunian/pelayanan-paket" element={<PelayananPaket />} />
              <Route path="/ambil-antrian" element={<AmbilAntrian />} />
              <Route path="/kepenghunian/broadcast-pesan" element={guarded(<BroadcastPesan />)} />
              <Route path="/kepenghunian/pesan" element={guarded(<PesanPenghuni />)} />

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
              <Route path="/kepengelolaan/finance/kasir" element={guarded(<SistemKasir />)} />
              <Route path="/kepengelolaan/finance/kelistrikan" element={guarded(<Kelistrikan />)} />
              <Route path="/kepengelolaan/finance/kasir-listrik" element={guarded(<KasirListrik />)} />
              <Route path="/kepengelolaan/finance/riwayat-listrik" element={guarded(<RiwayatTransaksiListrik />)} />
              <Route path="/kepengelolaan/finance/data-meter-listrik" element={guarded(<DataMeterListrik />)} />
              <Route path="/kepengelolaan/finance/laporan-listrik" element={guarded(<LaporanPenjualanListrik />)} />
              <Route path="/kepengelolaan/finance/akuntansi" element={guarded(<Akuntansi />)} />
              <Route path="/kepengelolaan/finance/akuntansi/daftar-akun" element={guarded(<DaftarAkun />)} />
              <Route path="/kepengelolaan/finance/akuntansi/jurnal" element={guarded(<JurnalTransaksi />)} />
              <Route path="/kepengelolaan/finance/akuntansi/posting" element={guarded(<PostingData />)} />
              <Route path="/kepengelolaan/finance/akuntansi/buku-besar" element={guarded(<BukuBesar />)} />
              <Route path="/kepengelolaan/finance/akuntansi/neraca-saldo" element={guarded(<NeracaSaldo />)} />
              <Route path="/kepengelolaan/finance/akuntansi/rekonsiliasi" element={guarded(<Rekonsiliasi />)} />
              
              <Route path="/kepengelolaan/finance/akuntansi/laporan-laba-rugi" element={guarded(<LaporanLabaRugi />)} />
              <Route path="/kepengelolaan/finance/akuntansi/laporan-neraca" element={guarded(<LaporanNeraca />)} />
              <Route path="/kepengelolaan/finance/akuntansi/laporan-arus-kas" element={guarded(<LaporanArusKas />)} />
              <Route path="/kepengelolaan/hrd-ga" element={guarded(<HrdGa />)} />
              <Route path="/kepengelolaan/hrd-ga/rekap" element={guarded(<RekapKaryawan />)} />
              <Route path="/kepengelolaan/hrd-ga/slip-gaji" element={guarded(<SlipGaji />)} />
              <Route path="/kepengelolaan/hrd-ga/data-karyawan" element={guarded(<DataKaryawan />)} />
              <Route path="/kepengelolaan/engineering" element={guarded(<Engineering />)} />
              <Route path="/kepengelolaan/engineering/meteran-air" element={guarded(<MeteranAir />)} />
              <Route path="/kepengelolaan/laporan-inspeksi" element={guarded(<LaporanInspeksi />)} />
              <Route path="/kepengelolaan/laporan-kerja" element={guarded(<LaporanKerja />)} />
              <Route path="/kepengelolaan/akses-unit" element={guarded(<AksesUnit />)} />
              <Route path="/kepengelolaan/data-sepeda" element={guarded(<DataSepeda />)} />
              <Route path="/kepengelolaan/security" element={guarded(<Security />)} />
              <Route path="/kepengelolaan/housekeeping" element={guarded(<HouseKeeping />)} />
              <Route path="/karyawan/absen" element={guarded(<Absen />)} />
              <Route path="/karyawan/cuti" element={guarded(<Cuti />)} />
              <Route path="/karyawan/lembur" element={guarded(<Lembur />)} />
              <Route path="/karyawan/izin" element={guarded(<Izin />)} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalSystemGuard>
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
