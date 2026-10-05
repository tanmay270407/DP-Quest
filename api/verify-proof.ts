import { handleVerifyProof } from '../src/server/apiRouter';

export default async function handler(req: any, res: any) {
  return handleVerifyProof(req, res);
}
