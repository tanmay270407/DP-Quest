import { handleGenerateCertificate } from '../src/server/apiRouter';

export default async function handler(req: any, res: any) {
  return handleGenerateCertificate(req, res);
}
