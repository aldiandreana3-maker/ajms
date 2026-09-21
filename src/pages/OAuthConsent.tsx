import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Bot, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type OAuthResult = {
  data: { redirect_url?: string; redirect_to?: string; client?: { name?: string } } | null;
  error: { message: string } | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

function oauthApi(): OAuthApi | null {
  const auth = supabase.auth as unknown as { oauth?: OAuthApi };
  return auth.oauth ?? null;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthResult["data"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!authorizationId) {
        setError("Permintaan koneksi tidak lengkap atau sudah kedaluwarsa.");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const next = window.location.pathname + window.location.search;
        window.location.assign(`/auth?next=${encodeURIComponent(next)}`);
        return;
      }

      const oauth = oauthApi();
      if (!oauth) {
        setError("Layanan persetujuan agen belum tersedia.");
        return;
      }

      const result = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (result.error) {
        setError(result.error.message);
        return;
      }

      const immediate = result.data?.redirect_url ?? result.data?.redirect_to;
      if (immediate && !result.data?.client) {
        window.location.assign(immediate);
        return;
      }
      setDetails(result.data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    const oauth = oauthApi();
    if (!oauth) {
      setError("Layanan persetujuan agen belum tersedia.");
      return;
    }

    setBusy(true);
    const result = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (result.error) {
      setError(result.error.message);
      setBusy(false);
      return;
    }

    const target = result.data?.redirect_url ?? result.data?.redirect_to;
    if (!target) {
      setError("Tujuan kembali dari layanan agen tidak tersedia.");
      setBusy(false);
      return;
    }
    window.location.assign(target);
  }

  const clientName = details?.client?.name ?? "aplikasi agen";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            {error ? <AlertCircle className="h-7 w-7 text-destructive" /> : <Bot className="h-7 w-7 text-primary" />}
          </div>
          <CardTitle>{error ? "Koneksi tidak dapat diproses" : `Hubungkan ${clientName}`}</CardTitle>
          <CardDescription>
            {error ?? `${clientName} meminta izin menggunakan AJMS melalui akun Anda.`}
          </CardDescription>
        </CardHeader>

        {!error && details && (
          <CardContent>
            <div className="flex gap-3 rounded-md border border-border bg-muted/40 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Agen hanya dapat melihat data yang memang dapat diakses oleh akun AJMS Anda.
              </p>
            </div>
          </CardContent>
        )}

        {!error && !details && (
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </CardContent>
        )}

        {details && !error && (
          <CardFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" disabled={busy} onClick={() => void decide(false)}>Tolak</Button>
            <Button disabled={busy} onClick={() => void decide(true)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Izinkan
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}