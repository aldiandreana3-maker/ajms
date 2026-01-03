import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
});

const forgotEmailSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmailOpen, setForgotEmailOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotFullName, setForgotFullName] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      const { error } = await signIn(validated.email, validated.password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email atau password salah");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Login berhasil!");
        navigate("/");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = signupSchema.parse({
        fullName: signupFullName,
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
      });

      const { error } = await signUp(validated.email, validated.password, validated.fullName);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email sudah terdaftar");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Registrasi berhasil! Silakan login.");
        // Reset form
        setSignupFullName("");
        setSignupEmail("");
        setSignupPassword("");
        setSignupConfirmPassword("");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsSendingRequest(true);
    try {
      const validated = forgotPasswordSchema.parse({
        email: forgotEmail,
        fullName: forgotFullName,
      });

      const { error } = await supabase
        .from("password_reset_requests")
        .insert({
          email: validated.email,
          full_name: validated.fullName,
          status: "pending",
          notes: "Permintaan reset password",
        });

      if (error) {
        console.error("Error submitting reset request:", error);
        toast.error("Gagal mengirim permintaan. Silakan coba lagi.");
      } else {
        toast.success("Permintaan reset password telah dikirim ke Badan Pengelola!");
        setForgotPasswordOpen(false);
        setForgotEmail("");
        setForgotFullName("");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleForgotEmail = async () => {
    setIsSendingRequest(true);
    try {
      const validated = forgotEmailSchema.parse({
        fullName: forgotFullName,
        phone: forgotPhone,
      });

      const { error } = await supabase
        .from("password_reset_requests")
        .insert({
          email: `lupa-email-${Date.now()}@temp.com`,
          full_name: validated.fullName,
          status: "pending",
          notes: `Permintaan lupa email. Nomor telepon: ${validated.phone}`,
        });

      if (error) {
        console.error("Error submitting email request:", error);
        toast.error("Gagal mengirim permintaan. Silakan coba lagi.");
      } else {
        toast.success("Permintaan bantuan email telah dikirim ke Badan Pengelola!");
        setForgotEmailOpen(false);
        setForgotFullName("");
        setForgotPhone("");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">AJMS</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sistem Manajemen Apartemen
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@ajms.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-primary hover:underline">
                        Lupa Password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Lupa Password</DialogTitle>
                        <DialogDescription>
                          Masukkan email dan nama lengkap Anda. Permintaan akan dikirim ke Badan Pengelola untuk diproses.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgot-name">Nama Lengkap</Label>
                          <Input
                            id="forgot-name"
                            type="text"
                            placeholder="Nama lengkap Anda"
                            value={forgotFullName}
                            onChange={(e) => setForgotFullName(e.target.value)}
                            disabled={isSendingRequest}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="email@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            disabled={isSendingRequest}
                          />
                        </div>
                        <Button 
                          type="button" 
                          className="w-full" 
                          onClick={handleForgotPassword}
                          disabled={isSendingRequest}
                        >
                          {isSendingRequest ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Mengirim...
                            </>
                          ) : (
                            "Kirim Permintaan"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <span className="text-xs text-muted-foreground">|</span>

                  <Dialog open={forgotEmailOpen} onOpenChange={setForgotEmailOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-primary hover:underline">
                        Lupa Email?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Lupa Email</DialogTitle>
                        <DialogDescription>
                          Masukkan nama lengkap dan nomor telepon Anda. Permintaan akan dikirim ke Badan Pengelola untuk membantu menemukan email akun Anda.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email-name">Nama Lengkap</Label>
                          <Input
                            id="forgot-email-name"
                            type="text"
                            placeholder="Nama lengkap Anda"
                            value={forgotFullName}
                            onChange={(e) => setForgotFullName(e.target.value)}
                            disabled={isSendingRequest}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="forgot-phone">Nomor Telepon</Label>
                          <Input
                            id="forgot-phone"
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            value={forgotPhone}
                            onChange={(e) => setForgotPhone(e.target.value)}
                            disabled={isSendingRequest}
                          />
                        </div>
                        <Button 
                          type="button" 
                          className="w-full" 
                          onClick={handleForgotEmail}
                          disabled={isSendingRequest}
                        >
                          {isSendingRequest ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Mengirim...
                            </>
                          ) : (
                            "Kirim Permintaan"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nama Lengkap</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="john@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Konfirmasi Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Daftar"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
