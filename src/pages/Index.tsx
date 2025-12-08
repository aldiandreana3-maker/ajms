import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { KepenghunianSection } from "@/components/dashboard/KepenghunianSection";

type ActiveView = "dashboard" | "kepenghunian";

const Index = () => {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  return (
    <MainLayout>
      {activeView === "dashboard" ? (
        <DashboardContent onOpenKepenghunian={() => setActiveView("kepenghunian")} />
      ) : (
        <KepenghunianSection onBack={() => setActiveView("dashboard")} />
      )}
    </MainLayout>
  );
};

export default Index;
