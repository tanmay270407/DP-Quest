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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const isSupabaseLive = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id'));
  const supabase = isSupabaseLive ? createClient(supabaseUrl!, supabaseKey!) : null;

  try {
    let dbCertificatesCount = 0;
    let dbDownloadsCount = 0;
    let dbCertificates: any[] = [];
    let dbDownloads: any[] = [];

    if (supabase) {
      try {
        const { data: certs } = await supabase.from('certificates').select('*');
        if (certs) {
          dbCertificates = certs;
          dbCertificatesCount = certs.length;
        }

        const { data: downloads } = await supabase.from('certificate_downloads').select('*');
        if (downloads) {
          dbDownloads = downloads;
          dbDownloadsCount = downloads.length;
        }
      } catch (e) {
        console.warn('Supabase stats query notice:', e);
      }
    }

    const userSet = new Set<string>();
    dbCertificates.forEach((c) => { if (c.user_id) userSet.add(c.user_id); });

    return sendJson(res, 200, {
      success: true,
      totalUniqueUsersDownloaded: Math.max(userSet.size, dbCertificatesCount),
      totalDownloadEvents: Math.max(dbDownloadsCount, dbCertificatesCount),
      certificates: dbCertificates,
      recentDownloadEvents: dbDownloads
    });
  } catch (err: any) {
    console.error('API /api/certificate-stats error:', err);
    return sendJson(res, 500, { error: 'Failed to retrieve certificate stats.' });
  }
}
