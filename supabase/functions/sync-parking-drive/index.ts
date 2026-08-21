import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';
const ROOT_FOLDER = 'AJMS - Abonemen Parkir';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const DRIVE_KEY = Deno.env.get('GOOGLE_DRIVE_API_KEY');

function driveHeaders(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': DRIVE_KEY!,
    ...extra,
  };
}

async function driveJson(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: driveHeaders((init?.headers as Record<string, string>) || {}),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Drive request failed [${res.status}] ${path}: ${text}`);
    throw new Error(`[${res.status}]: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

/** Cari folder berdasarkan nama (opsional di dalam parent), buat jika belum ada. */
async function ensureFolder(name: string, parentId?: string) {
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    'trashed = false',
    parentId ? `'${parentId}' in parents` : null,
  ]
    .filter(Boolean)
    .join(' and ');

  const found = await driveJson(`/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`);
  if (found.files?.length) return found.files[0].id as string;

  const created = await driveJson('/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  return created.id as string;
}

async function uploadFile(name: string, mimeType: string, bytes: Uint8Array, parentId: string) {
  const boundary = `ajms${crypto.randomUUID()}`;
  const meta = JSON.stringify({ name, parents: [parentId] });
  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const tail = enc.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);

  const res = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink`, {
    method: 'POST',
    headers: driveHeaders({ 'Content-Type': `multipart/related; boundary=${boundary}` }),
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Drive upload failed [${res.status}]: ${text}`);
    throw new Error(`[${res.status}]: ${text}`);
  }
  return JSON.parse(text);
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
    if (!DRIVE_KEY) throw new Error('GOOGLE_DRIVE_API_KEY is not configured');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: isStaff } = await supabase.rpc('is_staff_or_above', { _user_id: user.id });
    if (!isStaff) return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const raw = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const now = new Date();
    const month = Number.isInteger(raw?.month) && raw.month >= 1 && raw.month <= 12 ? raw.month : now.getMonth() + 1;
    const year = Number.isInteger(raw?.year) && raw.year >= 2000 && raw.year <= 2100 ? raw.year : now.getFullYear();
    const includeProofs = raw?.includeProofs !== false;

    const { data: rows, error: rowsError } = await supabase
      .from('parking_payment_history')
      .select('*')
      .eq('period_month', month)
      .eq('period_year', year)
      .order('unit_number', { ascending: true });
    if (rowsError) throw rowsError;

    const periodLabel = `${year}-${String(month).padStart(2, '0')}`;
    const rootId = await ensureFolder(ROOT_FOLDER);
    const monthFolderId = await ensureFolder(periodLabel, rootId);

    // 1) Rekap CSV (bisa dibuka langsung di Excel / Google Sheets)
    const header = ['Unit', 'Nama', 'Plat', 'Periode', 'Nominal', 'Metode', 'Tanggal Bayar', 'Status Verifikasi', 'Catatan'];
    const csv = [
      header.map(csvCell).join(','),
      ...(rows || []).map((r) =>
        [
          r.unit_number,
          r.owner_name,
          r.vehicle_number,
          r.period_label || periodLabel,
          Number(r.nominal || 0),
          r.payment_method,
          r.payment_date ? new Date(r.payment_date).toISOString().slice(0, 10) : '',
          r.verification_status,
          r.notes,
        ]
          .map(csvCell)
          .join(','),
      ),
    ].join('\r\n');

    const recap = await uploadFile(
      `Rekap_Abonemen_Parkir_${periodLabel}.csv`,
      'text/csv',
      new TextEncoder().encode('\uFEFF' + csv),
      monthFolderId,
    );

    // 2) Bukti transfer (opsional)
    let proofsUploaded = 0;
    const proofErrors: string[] = [];
    if (includeProofs && rows?.length) {
      const proofFolderId = await ensureFolder('Bukti Transfer', monthFolderId);
      for (const r of rows) {
        if (!r.payment_proof_url) continue;
        try {
          let bytes: Uint8Array | null = null;
          let mime = 'image/jpeg';
          if (r.payment_proof_url.startsWith('http')) {
            const res = await fetch(r.payment_proof_url);
            if (!res.ok) throw new Error(`fetch ${res.status}`);
            mime = res.headers.get('content-type') || mime;
            bytes = new Uint8Array(await res.arrayBuffer());
          } else {
            const { data, error } = await supabase.storage.from('kepenghunian-files').download(r.payment_proof_url);
            if (error) throw error;
            mime = data.type || mime;
            bytes = new Uint8Array(await data.arrayBuffer());
          }
          const ext = r.payment_proof_url.split('.').pop()?.split('?')[0] || 'jpg';
          const safeName = `${r.unit_number || 'UNIT'}_${(r.vehicle_number || 'PLAT').replace(/[\s/\\]/g, '')}_${periodLabel}.${ext}`;
          await uploadFile(safeName, mime, bytes!, proofFolderId);
          proofsUploaded++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`Proof upload failed for ${r.id}: ${msg}`);
          proofErrors.push(`${r.unit_number || r.id}: ${msg}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        period: periodLabel,
        folder: `${ROOT_FOLDER}/${periodLabel}`,
        records: rows?.length || 0,
        recap_file: recap.name,
        recap_link: recap.webViewLink || null,
        proofs_uploaded: proofsUploaded,
        proof_errors: proofErrors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('sync-parking-drive error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
