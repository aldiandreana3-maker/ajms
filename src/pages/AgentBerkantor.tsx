import { MainLayout } from "@/components/layout/MainLayout";
import { User, Phone, Mail, MapPin } from "lucide-react";

const agents = [
  {
    id: 1,
    name: "Budi Santoso",
    position: "Property Manager",
    phone: "+62 812-3456-7890",
    email: "budi.s@ajms.co.id",
    office: "Tower A - Lt. 1",
  },
  {
    id: 2,
    name: "Siti Rahayu",
    position: "Admin Keuangan",
    phone: "+62 813-4567-8901",
    email: "siti.r@ajms.co.id",
    office: "Tower A - Lt. 1",
  },
  {
    id: 3,
    name: "Ahmad Wijaya",
    position: "Technical Support",
    phone: "+62 814-5678-9012",
    email: "ahmad.w@ajms.co.id",
    office: "Tower B - Lt. G",
  },
  {
    id: 4,
    name: "Dewi Lestari",
    position: "Customer Service",
    phone: "+62 815-6789-0123",
    email: "dewi.l@ajms.co.id",
    office: "Tower A - Lt. 1",
  },
];

const AgentBerkantor = () => {
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Berkantor</h1>
          <p className="text-muted-foreground">Daftar staff pengelola gedung</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground">{agent.name}</h3>
                  <p className="text-sm text-accent font-medium mb-3">{agent.position}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{agent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{agent.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{agent.office}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default AgentBerkantor;
