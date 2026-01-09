import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
// import { ProtectedRoute } from "@/components/ProtectedRoute"; // Temporarily disabled
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TentangKami from "./pages/TentangKami";
import AgentBerkantor from "./pages/AgentBerkantor";
import StrukturFasilitas from "./pages/StrukturFasilitas";
import LaporanKeuangan from "./pages/LaporanKeuangan";
import Tagihan from "./pages/Tagihan";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/tentang-kami" element={<TentangKami />} />
            <Route path="/agent-berkantor" element={<AgentBerkantor />} />
            <Route path="/struktur-fasilitas" element={<StrukturFasilitas />} />
            <Route path="/laporan-keuangan" element={<LaporanKeuangan />} />
            <Route path="/tagihan" element={<Tagihan />} />
            <Route path="/berita" element={<Berita />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/manajemen-user" element={<ManajemenUser />} />
            <Route path="/kepenghunian/abonemen-parkir" element={<AbonemenParkir />} />
            <Route path="/kepenghunian/keluhan" element={<KeluhanPenghuni />} />
            <Route path="/kepenghunian/izin-kerja" element={<IzinKerja />} />
            <Route path="/kepenghunian/barang" element={<KeluarMasukBarang />} />
            <Route path="/kepenghunian/kartu-akses" element={<KartuAkses />} />
            <Route path="/kepenghunian/tamu-asing" element={<TamuAsing />} />
            <Route path="/kepenghunian/work-order" element={<WorkOrder />} />
            <Route path="/kepenghunian/pelayanan-paket" element={<PelayananPaket />} />
            <Route path="/kepengelolaan/data-penghuni" element={<DataPenghuni />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
