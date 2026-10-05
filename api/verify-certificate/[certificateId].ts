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

  try {
    const rawParam = req.params?.certificateId || req.query?.certificateId;
    const rawId = typeof rawParam === 'string' ? rawParam.trim().toUpperCase() : '';

    if (!rawId) {
      return sendJson(res, 400, { isValid: false, error: 'Certificate ID is required.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const isSupabaseLive = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id'));
    const supabase = isSupabaseLive ? createClient(supabaseUrl!, supabaseKey!) : null;

    if (supabase) {
      const { data: cert, error } = await supabase
        .from('certificates')
        .select('certificate_id, user_name, completed_at, verification_url')
        .ilike('certificate_id', rawId)
        .maybeSingle();

      if (cert) {
        return sendJson(res, 200, {
          isValid: true,
          isTest: rawId.includes('-TEST'),
          certificateId: cert.certificate_id,
          userName: cert.user_name,
          completedAt: cert.completed_at,
          totalProblems: 25,
          totalXp: 250,
          verificationUrl: cert.verification_url || `https://dp-quest-isju.vercel.app/verify/${cert.certificate_id}`
        });
      }
    }

    return sendJson(res, 404, {
      isValid: false,
      error: `Certificate '${rawId}' not found in official registry.`
    });
  } catch (err: any) {
    console.error('API /api/verify-certificate error:', err);
    return sendJson(res, 500, { isValid: false, error: 'Internal server error while verifying certificate.' });
  }
}
