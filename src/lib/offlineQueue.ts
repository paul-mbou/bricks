/** Offline queue for production & receptions — idempotent sync via clientOpId. */

export type QueuedOp = {
  clientOpId: string;
  type: 'production' | 'reception';
  payload: unknown;
  createdAt: string;
};

const KEY = 'br-offline-queue';

export function listQueue(): QueuedOp[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as QueuedOp[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedOp[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

/** @returns false when storage is full — caller should surface an error. */
export function enqueue(op: Omit<QueuedOp, 'createdAt'>): boolean {
  const queue = listQueue();
  if (queue.some((q) => q.clientOpId === op.clientOpId)) return true;
  queue.push({ ...op, createdAt: new Date().toISOString() });
  return writeQueue(queue);
}

export function dequeue(clientOpId: string): boolean {
  return writeQueue(listQueue().filter((q) => q.clientOpId !== clientOpId));
}

export async function flushQueue(handler: (op: QueuedOp) => Promise<void>) {
  for (const op of listQueue()) {
    await handler(op);
    dequeue(op.clientOpId);
  }
}

export function newClientOpId() {
  return `op-${crypto.randomUUID()}`;
}
