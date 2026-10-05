import { handleCertificateStats } from '../src/server/apiRouter';

export default async function handler(req: any, res: any) {
  return handleCertificateStats(req, res);
}
