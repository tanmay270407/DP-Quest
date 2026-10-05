import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function sendJson(res: any, statusCode: number, data: any) {
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  return res.end(JSON.stringify(data));
}

function getAppBaseUrl(req: any): string {
  const host = typeof req.get === 'function' ? req.get('host') : req.headers?.host;
  if (host) {
    const proto = req.protocol || 'https';
    return `${proto}://${host}`;
  }
  return 'https://dp-quest-isju.vercel.app';
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
      } else if (body.userId) {
        userId = body.userId;
      }
    } else if (body.userId) {
      userId = body.userId;
    }

    if (!userId) {
      return sendJson(res, 401, { error: 'Unauthorized: Valid student session token required.' });
    }

    let profileName = body.userName || 'Quest Explorer';

    if (dbClient) {
      const { data: profile } = await dbClient
        .from('profiles')
        .select('full_name, total_xp')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.full_name) {
        profileName = profile.full_name;
      }

      const { data: progressRows, error: progressErr } = await dbClient
        .from('user_progress')
        .select('xp_earned, status')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');

      if (progressErr) {
        return sendJson(res, 500, { error: 'Failed to verify progress records.' });
      }

      const completedCount = progressRows?.length || 0;
      const totalXp = progressRows ? progressRows.reduce((acc: number, r: any) => acc + (r.xp_earned || 0), 0) : 0;

      if (completedCount < 22 || totalXp < 220) {
        return sendJson(res, 403, {
          error: `Certificate Locked. You have completed ${completedCount}/22 problems (${totalXp} XP). All 22 problems and 220 XP are required.`
        });
      }

      // Check existing certificate
      const { data: existingCert } = await dbClient
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingCert) {
        return sendJson(res, 200, {
          success: true,
          certificate: {
            id: existingCert.id,
            userId: existingCert.user_id,
            certificateId: existingCert.certificate_id,
            userName: existingCert.user_name || profileName,
            completedAt: existingCert.completed_at,
            totalProblems: 22,
            totalXp: 220,
            verificationUrl: existingCert.verification_url,
            downloadCount: existingCert.download_count || 0,
            firstDownloadedAt: existingCert.first_downloaded_at,
            lastDownloadedAt: existingCert.last_downloaded_at
          }
        });
      }

      // Create new certificate
      const year = new Date().getFullYear();
      const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
      const certificateId = `DPQ-${year}-${randomHex}`;
      const now = new Date().toISOString();
      const baseUrl = getAppBaseUrl(req);
      const verificationUrl = `${baseUrl}/verify/${certificateId}`;

      const { data: newCert, error: createErr } = await dbClient
        .from('certificates')
        .insert({
          user_id: userId,
          certificate_id: certificateId,
          user_name: profileName,
          completed_at: now,
          verification_url: verificationUrl,
          download_count: 0
        })
        .select()
        .single();

      if (createErr) {
        console.error('[GENERATE_CERTIFICATE] DB create error:', createErr);
        return sendJson(res, 500, { error: 'Failed to create certificate record in database.' });
      }

      return sendJson(res, 200, {
        success: true,
        certificate: {
          id: newCert?.id || `cert_${Date.now()}`,
          userId: userId,
          certificateId: certificateId,
          userName: profileName,
          completedAt: now,
          totalProblems: 22,
          totalXp: 220,
          verificationUrl: verificationUrl,
          downloadCount: 0,
          firstDownloadedAt: null,
          lastDownloadedAt: null
        }
      });
    }

    return sendJson(res, 400, { error: 'Database service unavailable.' });
  } catch (err: any) {
    console.error('API /api/generate-certificate error:', err);
    return sendJson(res, 500, { error: 'Failed to generate certificate.' });
  }
}
