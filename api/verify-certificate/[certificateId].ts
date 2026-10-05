import { handleVerifyCertificate } from '../../src/server/apiRouter';

export default async function handler(req: any, res: any) {
  return handleVerifyCertificate(req, res);
}
