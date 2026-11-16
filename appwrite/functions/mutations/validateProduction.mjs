/**
 * Appwrite Function stub — validateProduction
 * Deploy with node-appwrite; share packages/domain via bundling.
 */
import { Client, Databases, Users, ID } from 'node-appwrite';
// import { computeProductionMetrics } from '../../../packages/domain/src/production.js';

export default async ({ req, res, log, error }) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { bagsUsed, goodBlocks, blockTypeId, clientOpId } = body;
    if (!bagsUsed || goodBlocks == null || !blockTypeId) {
      return res.json({ ok: false, error: 'Invalid payload' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);
    const jwtUser = req.headers['x-appwrite-user-id'];
    if (!jwtUser) return res.json({ ok: false, error: 'Unauthorized' }, 401);

    // Re-check labels: production | manager | owner
    const user = await users.get(jwtUser);
    const labels = user.labels || [];
    const allowed = ['production', 'manager', 'owner'].some((l) => labels.includes(l));
    if (!allowed) return res.json({ ok: false, error: 'Forbidden' }, 403);

    // Idempotency: if clientOpId already exists on a movement, return success.
    const databases = new Databases(client);
    log(`validateProduction ${blockTypeId} bags=${bagsUsed} clientOpId=${clientOpId || ID.unique()}`);

    // TODO: create StockMovements in a transactional/idempotent sequence using domain metrics.
    return res.json({ ok: true, accepted: true });
  } catch (e) {
    error(String(e));
    return res.json({ ok: false, error: 'Server error' }, 500);
  }
};
