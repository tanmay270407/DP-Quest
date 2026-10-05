import { createClient } from '@supabase/supabase-js';

function sendJson(res: any, statusCode: number, data: any) {
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  return res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed. Use POST.' });
  }

  let body: any = req.body;
  if (!body) {
    body = await new Promise((resolve) => {
      let raw = '';
      req.on('data', (chunk: any) => { raw += chunk; });
      req.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve({}); }
      });
      req.on('error', () => resolve({}));
    });
  } else if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const authHeader = req.headers?.authorization;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const isSupabaseLive = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id'));

  let userId: string | null = null;
  let dbClient = isSupabaseLive ? createClient(supabaseUrl!, supabaseKey!) : null;

  try {
    if (authHeader && authHeader.startsWith('Bearer ') && isSupabaseLive) {
      const token = authHeader.replace('Bearer ', '').trim();
      const userScopedSupabase = createClient(supabaseUrl!, supabaseKey!, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      const { data: authData } = await userScopedSupabase.auth.getUser(token);
      if (authData?.user) {
        userId = authData.user.id;
        dbClient = userScopedSupabase;
      }
    } else if (body.userId) {
      userId = body.userId;
    }

    const {
      certificateId,
      downloadedAt = new Date().toISOString()
    } = body;

    if (!certificateId) {
      return sendJson(res, 400, { error: 'certificateId is required.' });
    }

    if (!userId) {
      return sendJson(res, 401, { error: 'Unauthorized: Valid student session token required for certificate download.' });
    }

    let currentDownloadCount = 1;
    let firstDownloadedAt: string | null = downloadedAt;
    let lastDownloadedAt: string | null = downloadedAt;

    if (dbClient) {
      const { data: certRecord } = await dbClient
        .from('certificates')
        .select('id, user_name, download_count, first_downloaded_at')
        .eq('certificate_id', certificateId)
        .maybeSingle();

      if (certRecord) {
        currentDownloadCount = (certRecord.download_count || 0) + 1;
        firstDownloadedAt = certRecord.first_downloaded_at || downloadedAt;
        lastDownloadedAt = downloadedAt;

        await dbClient
          .from('certificates')
          .update({
            download_count: currentDownloadCount,
            first_downloaded_at: firstDownloadedAt,
            last_downloaded_at: lastDownloadedAt
          })
          .eq('id', certRecord.id);

        try {
          await dbClient
            .from('certificate_downloads')
            .insert({
              certificate_id: certRecord.id,
              user_id: userId,
              user_name: certRecord.user_name,
              certificate_public_id: certificateId,
              download_number: currentDownloadCount,
              downloaded_at: downloadedAt,
              is_test: false
            });
        } catch (auditErr) {
          console.warn('[RECORD_CERTIFICATE_DOWNLOAD] Audit write notice:', auditErr);
        }
      }
    }

    return sendJson(res, 200, {
      success: true,
      message: 'Certificate download recorded successfully.',
      certificateId,
      downloadCount: currentDownloadCount,
      firstDownloadedAt,
      lastDownloadedAt
    });
  } catch (err: any) {
    console.error('API /api/record-certificate-download error:', err);
    return sendJson(res, 500, { error: 'Failed to record certificate download.' });
  }
}
