import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const schema = z.object({ afterId: z.string().uuid().optional(), limit: z.number().int().min(1).max(10).default(5) });
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
// Only download IDs already attached to complaint records; never accept arbitrary URLs.
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'POST required' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const gatewayKey = Deno.env.get('LOVABLE_API_KEY'); const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    if (!url || !key || !gatewayKey || !driveKey) return reply({ error: 'Connection configuration unavailable' }, 503);
    const db = createClient(url, key);
    const { data: { user }, error: authError } = await db.auth.getUser((req.headers.get('Authorization') || '').replace(/^Bearer /, ''));
    if (authError || !user) return reply({ error: 'Unauthorized' }, 401);
    const { data: admin, error: roleError } = await db.rpc('is_admin_or_above', { _user_id: user.id });
    if (roleError || !admin) return reply({ error: 'Admin only' }, 403);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return reply({ error: parsed.error.flatten() }, 400);
    // Keyset pagination: successful replacements cannot shift later pages.
    const { afterId, limit } = parsed.data;
    let query = db.from('keluhan').select('id,photo_url,created_by,penghuni_id').ilike('photo_url', '%drive.google.com%').order('id').limit(limit);
    if (afterId) query = query.gt('id', afterId);
    const { data: rows, error } = await query;
    if (error) throw error;
    const results: unknown[] = [];
    for (const row of rows || []) {
      if (!row.photo_url?.includes('drive.google.com')) continue;
      const original = row.photo_url;
      const parts = original.split(',').map((v: string) => v.trim()).filter(Boolean);
      let owner = row.created_by;
      if (!owner && row.penghuni_id) { const { data: resident } = await db.from('penghuni').select('user_id').eq('id', row.penghuni_id).maybeSingle(); owner = resident?.user_id; }
      const outcomes = [];
      for (let i = 0; i < parts.length; i++) {
        let fileId: string | null = null;
        try { const u = new URL(parts[i]); if (u.hostname === 'drive.google.com') fileId = u.searchParams.get('id') || u.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || null; } catch { /* Storage paths remain unchanged. */ }
        if (!fileId || !/^[\w-]+$/.test(fileId)) continue;
        const headers = { Authorization: `Bearer ${gatewayKey}`, 'X-Connection-Api-Key': driveKey };
        const base = `https://connector-gateway.lovable.dev/google_drive/drive/v3/files/${encodeURIComponent(fileId)}`;
        const metadata = await fetch(`${base}?fields=mimeType,size`, { headers });
        if (!metadata.ok) { const details = await metadata.text(); outcomes.push({ fileId, status: metadata.status, details }); continue; }
        const meta = await metadata.json();
        if (!String(meta.mimeType).startsWith('image/') || Number(meta.size) > 15 * 1024 * 1024) { outcomes.push({ fileId, status: 422, details: 'Not a supported photo or exceeds 15 MB' }); continue; }
        const download = await fetch(`${base}?alt=media`, { headers });
        if (!download.ok) { outcomes.push({ fileId, status: download.status, details: await download.text() }); continue; }
        const bytes = new Uint8Array(await download.arrayBuffer());
        if (!bytes.length || bytes.length > 15 * 1024 * 1024) { outcomes.push({ fileId, status: 422, details: 'Invalid file size' }); continue; }
        const ext = meta.mimeType === 'image/png' ? 'png' : meta.mimeType === 'image/webp' ? 'webp' : 'jpg';
        const path = `${owner || user.id}/keluhan/drive-${row.id}-${fileId}.${ext}`;
        const { error: uploadError } = await db.storage.from('kepenghunian-files').upload(path, bytes, { contentType: meta.mimeType, upsert: true });
        if (uploadError) { outcomes.push({ fileId, status: 500, details: uploadError.message }); continue; }
        const { data: check, error: checkError } = await db.storage.from('kepenghunian-files').download(path);
        if (checkError || check?.size !== bytes.length) { outcomes.push({ fileId, status: 500, details: 'Storage verification failed' }); continue; }
        parts[i] = path; outcomes.push({ fileId, status: 200, path, bytes: bytes.length });
      }
      if (parts.join(', ') !== original && outcomes.some(o => o.status === 200)) {
        const { error: updateError } = await db.from('keluhan').update({ photo_url: parts.join(', ') }).eq('id', row.id).eq('photo_url', original);
        if (updateError) throw updateError;
      }
      results.push({ id: row.id, outcomes });
    }
    return reply({ afterId: rows?.at(-1)?.id, done: (rows?.length || 0) < limit, results });
  } catch (e) { return reply({ error: e instanceof Error ? e.message : String(e) }, 500); }
});