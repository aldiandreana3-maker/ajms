import { User, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AgentWithUnits {
  id: string;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  office_location: string | null;
  photo_url: string | null;
  agent_units?: {
    id: string;
    unit_id: string;
    units?: { unit_number: string } | null;
  }[];
}

interface AgentCardProps {
  agent: AgentWithUnits;
  index: number;
  isSuperAdmin: boolean;
  onClick: () => void;
  onEdit: (agent: AgentWithUnits) => void;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, index, isSuperAdmin, onClick, onEdit, onDelete }: AgentCardProps) {
  return (
    <div
      className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-lg transition-all duration-300 animate-slide-up cursor-pointer"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {agent.photo_url ? (
            <img src={agent.photo_url} alt={agent.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">{agent.name}</h3>
              <p className="text-sm text-accent font-medium mb-3">{agent.position}</p>
            </div>
            {isSuperAdmin && (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={() => onEdit(agent)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(agent.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {agent.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{agent.phone}</span>
              </div>
            )}
            {agent.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{agent.email}</span>
              </div>
            )}
            {agent.office_location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{agent.office_location}</span>
              </div>
            )}
          </div>
          {agent.agent_units && agent.agent_units.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {agent.agent_units.slice(0, 3).map((au) => (
                <Badge key={au.id} variant="secondary" className="text-xs">
                  {au.units?.unit_number}
                </Badge>
              ))}
              {agent.agent_units.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.agent_units.length - 3} lainnya
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
