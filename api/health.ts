import { handleHealth } from '../src/server/apiRouter';

export default async function handler(req: any, res: any) {
  return handleHealth(req, res);
}
