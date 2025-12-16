import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, User } from "lucide-react";

export function LoginPromptButton() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate("/auth")}
      className="bg-login-orange hover:bg-login-orange/90 text-white shadow-lg"
    >
      <LogIn className="w-4 h-4 mr-2" />
      Login / Daftar
    </Button>
  );
}
