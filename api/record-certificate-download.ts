import { handleRecordCertificateDownload } from '../src/server/apiRouter';

export default async function handler(req: any, res: any) {
  return handleRecordCertificateDownload(req, res);
}
