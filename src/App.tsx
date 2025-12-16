import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TentangKami from "./pages/TentangKami";
import AgentBerkantor from "./pages/AgentBerkantor";
import StrukturFasilitas from "./pages/StrukturFasilitas";
import TypeUnit from "./pages/TypeUnit";
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
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/tentang-kami" element={<ProtectedRoute><TentangKami /></ProtectedRoute>} />
            <Route path="/agent-berkantor" element={<ProtectedRoute><AgentBerkantor /></ProtectedRoute>} />
            <Route path="/struktur-fasilitas" element={<ProtectedRoute><StrukturFasilitas /></ProtectedRoute>} />
            <Route path="/type-unit" element={<ProtectedRoute><TypeUnit /></ProtectedRoute>} />
            <Route path="/laporan-keuangan" element={<ProtectedRoute><LaporanKeuangan /></ProtectedRoute>} />
            <Route path="/tagihan" element={<ProtectedRoute><Tagihan /></ProtectedRoute>} />
            <Route path="/berita" element={<ProtectedRoute><Berita /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/manajemen-user" element={<ProtectedRoute requireSuperAdmin><ManajemenUser /></ProtectedRoute>} />
            <Route path="/kepenghunian/abonemen-parkir" element={<ProtectedRoute><AbonemenParkir /></ProtectedRoute>} />
            <Route path="/kepenghunian/keluhan" element={<ProtectedRoute><KeluhanPenghuni /></ProtectedRoute>} />
            <Route path="/kepenghunian/izin-kerja" element={<ProtectedRoute><IzinKerja /></ProtectedRoute>} />
            <Route path="/kepenghunian/barang" element={<ProtectedRoute><KeluarMasukBarang /></ProtectedRoute>} />
            <Route path="/kepenghunian/kartu-akses" element={<ProtectedRoute><KartuAkses /></ProtectedRoute>} />
            <Route path="/kepenghunian/tamu-asing" element={<ProtectedRoute><TamuAsing /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
