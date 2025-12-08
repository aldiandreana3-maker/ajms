import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TentangKami from "./pages/TentangKami";
import AgentBerkantor from "./pages/AgentBerkantor";
import StrukturFasilitas from "./pages/StrukturFasilitas";
import TypeUnit from "./pages/TypeUnit";
import LaporanKeuangan from "./pages/LaporanKeuangan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tentang-kami" element={<TentangKami />} />
          <Route path="/agent-berkantor" element={<AgentBerkantor />} />
          <Route path="/struktur-fasilitas" element={<StrukturFasilitas />} />
          <Route path="/type-unit" element={<TypeUnit />} />
          <Route path="/laporan-keuangan" element={<LaporanKeuangan />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
