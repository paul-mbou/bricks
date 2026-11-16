import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  computeProductionMetrics,
  computeWeeklyProfit,
  deliveryVariance,
  deriveStock,
  inventoryAdjustment,
  meterConsumption,
  stockStatus,
  supplierPayableAmount,
  weightedAverageUnitCost,
} from '../../packages/domain/src';
import { ROLES } from '../data/roles';
import { createSeed } from '../data/seed';
import type {
  Alert,
  AppState,
  Attendance,
  Employee,
  ManagedUser,
  MeterReading,
  ProductionRun,
  RoleId,
  Sale,
  StockMovement,
  SupplyDossier,
  UtilityBill,
  WeeklyReport,
} from '../data/types';
import { formatNumber, t } from './i18n';

const STORAGE_KEY = 'br-demo-state';
const ROLE_KEY = 'br-role';

/**
 * Always start from the same seed so Astro SSR HTML matches the first client
 * render. Reading sessionStorage during module init caused hydration mismatches
 * that wiped React islands (blank page) on every in-app navigation.
 */
let state: AppState = createSeed(true);
let storeHydrated = false;
const listeners = new Set<() => void>();

/**
 * Batch depth counter — while > 0, setState accumulates without
 * serialising or notifying.  runBatch() flushes exactly once at the end.
 * This collapses the 5-10 separate persist() calls in validateProduction /
 * createSale / receiveSupply into a single JSON.stringify + listeners sweep.
 */
let _batchDepth = 0;
let _batchDirty = false;

const ROLE_IDS = new Set(['owner', 'manager', 'storekeeper', 'production', 'accounting', 'secretary']);

/** Reject tampered / truncated session blobs that would crash islands. */
function isPlausibleAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  if (!Array.isArray(s.materials) || !Array.isArray(s.blockTypes) || !Array.isArray(s.movements)) return false;
  if (!Array.isArray(s.alerts) || !Array.isArray(s.auditLogs)) return false;
  if (s.users !== undefined && !Array.isArray(s.users)) return false;
  if (!s.settings || typeof s.settings !== 'object') return false;
  if (!s.profile || typeof s.profile !== 'object') return false;
  const profile = s.profile as Record<string, unknown>;
  if (typeof profile.roleId !== 'string' || !ROLE_IDS.has(profile.roleId)) return false;
  if (typeof s.demoMode !== 'boolean') return false;
  // Soft size cap — corrupted huge JSON can freeze the tab.
  try {
    if (JSON.stringify(value).length > 1_500_000) return false;
  } catch {
    return false;
  }
  return true;
}

function readPersistedState(): AppState | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 1_500_000) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isPlausibleAppState(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function hydrateStoreFromSession() {
  if (storeHydrated) return;
  storeHydrated = true;
  const persisted = readPersistedState();
  if (persisted) {
    const seedUsers = createSeed(true).users;
    state = {
      ...persisted,
      users: Array.isArray(persisted.users) && persisted.users.length > 0 ? persisted.users : seedUsers,
    };
  }
  listeners.forEach((l) => l());
}

let persistTimer = 0;

function writeSessionState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function persist() {
  if (_batchDepth > 0) {
    // Defer until runBatch() commits — avoids N serialisations per action.
    _batchDirty = true;
    return;
  }
  // Notify UI immediately; coalesce expensive sessionStorage writes.
  listeners.forEach((l) => l());
  if (typeof window === 'undefined') {
    writeSessionState();
    return;
  }
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(writeSessionState, 80);
}

// Flush debounced writes before hard navigations (tour hops, reload).
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    window.clearTimeout(persistTimer);
    writeSessionState();
  });
}

/**
 * Run `fn` as an atomic batch: all inner setState / persist calls are deferred
 * and only one JSON.stringify + one listener sweep fires at the end.
 */
export function runBatch(fn: () => void): void {
  _batchDepth++;
  try {
    fn();
  } finally {
    _batchDepth--;
    if (_batchDepth === 0 && _batchDirty) {
      _batchDirty = false;
      writeSessionState();
      listeners.forEach((l) => l());
    }
  }
}

export function getState() {
  return state;
}

export function setState(updater: (prev: AppState) => AppState) {
  state = updater(state);
  persist();
}

export function resetDemo() {
  const onboardingCompleted = state.profile.onboardingCompleted;
  state = createSeed(true);
  state = {
    ...state,
    profile: { ...state.profile, onboardingCompleted },
  };
  // Always land back as Direction — never keep an impersonated role after reset.
  localStorage.setItem(ROLE_KEY, 'owner');
  persist();
}

/** Demo escape hatch: leave an impersonated role and resume as Direction. */
export function restoreDemoAsOwner() {
  if (typeof window !== 'undefined') {
    hydrateStoreFromSession();
  }
  const seed = createSeed(true);
  const owner =
    state.users.find((u) => u.roleId === 'owner' && u.status === 'active') ??
    seed.users.find((u) => u.roleId === 'owner') ??
    seed.profile;

  localStorage.setItem(ROLE_KEY, 'owner');
  setState((s) => ({
    ...s,
    demoMode: true,
    profile: {
      ...s.profile,
      id: owner.id,
      name: owner.name,
      email: 'email' in owner ? owner.email : seed.profile.email,
      roleId: 'owner',
      siteIds: owner.siteIds,
    },
  }));
  if (typeof window !== 'undefined') {
    window.clearTimeout(persistTimer);
    writeSessionState();
  }
}

export function exitDemoMode() {
  setState((s) => ({ ...s, demoMode: false }));
}

/** Reset seed + reopen onboarding tour — keeps demo mode for presentation replay. */
export function replayPresentation() {
  resetDemo();
  setState((s) => ({
    ...s,
    demoMode: true,
    profile: { ...s.profile, onboardingCompleted: false },
  }));
  try {
    sessionStorage.setItem('br-tour-active', '1');
    sessionStorage.setItem('br-tour-step', '0');
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('br-reopen-tour'));
  }
}

export function setRole(roleId: RoleId) {
  localStorage.setItem(ROLE_KEY, roleId);
  setState((s) => ({
    ...s,
    profile: { ...s.profile, roleId },
  }));
}

function requireUsersAdmin() {
  const { profile } = getState();
  if (profile.roleId !== 'owner' || !ROLES.owner.can.users) {
    throw new Error('Réservé à la Direction');
  }
}

function activeOwners(users: ManagedUser[]) {
  return users.filter((u) => u.roleId === 'owner' && u.status === 'active');
}

export function createUser(input: {
  name: string;
  email: string;
  roleId: RoleId;
  siteIds?: string[];
  password?: string;
}) {
  requireUsersAdmin();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email) throw new Error('Nom et e-mail requis');
  if (!ROLE_IDS.has(input.roleId)) throw new Error('Rôle inconnu');

  const app = getState();
  if (app.users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error('Un compte existe déjà avec cet e-mail');
  }
  if (input.roleId === 'owner' && activeOwners(app.users).length > 0) {
    throw new Error('Un seul compte Direction est autorisé');
  }

  const now = new Date().toISOString();
  const user: ManagedUser = {
    id: uid('user'),
    name,
    email,
    roleId: input.roleId,
    status: 'active',
    siteIds: input.siteIds?.length ? input.siteIds : ['site-1'],
    passwordSet: Boolean(input.password && input.password.length >= 6),
    createdAt: now,
    updatedAt: now,
  };

  setState((s) => ({ ...s, users: [user, ...s.users] }));
  audit('user.create', 'ManagedUser', user.id, { email: user.email, roleId: user.roleId });
  return user;
}

export function updateUserRole(userId: string, roleId: RoleId) {
  requireUsersAdmin();
  if (!ROLE_IDS.has(roleId)) throw new Error('Rôle inconnu');
  const app = getState();
  const user = app.users.find((u) => u.id === userId);
  if (!user) throw new Error('Utilisateur introuvable');

  if (user.roleId === 'owner' && roleId !== 'owner') {
    if (activeOwners(app.users).length <= 1) {
      throw new Error('Impossible de retirer le dernier compte Direction');
    }
  }
  if (roleId === 'owner' && user.roleId !== 'owner' && activeOwners(app.users).length > 0) {
    throw new Error('Un seul compte Direction est autorisé');
  }

  const now = new Date().toISOString();
  setState((s) => ({
    ...s,
    users: s.users.map((u) => (u.id === userId ? { ...u, roleId, updatedAt: now } : u)),
    profile:
      s.profile.id === userId
        ? { ...s.profile, roleId }
        : s.profile,
  }));
  if (app.profile.id === userId) localStorage.setItem(ROLE_KEY, roleId);
  audit('user.role', 'ManagedUser', userId, { roleId });
}

export function setUserStatus(userId: string, status: ManagedUser['status']) {
  requireUsersAdmin();
  const app = getState();
  const user = app.users.find((u) => u.id === userId);
  if (!user) throw new Error('Utilisateur introuvable');
  if (userId === app.profile.id && status === 'disabled') {
    throw new Error('Vous ne pouvez pas désactiver votre propre compte');
  }
  if (user.roleId === 'owner' && status === 'disabled' && activeOwners(app.users).length <= 1) {
    throw new Error('Impossible de désactiver le dernier compte Direction');
  }

  const now = new Date().toISOString();
  setState((s) => ({
    ...s,
    users: s.users.map((u) => (u.id === userId ? { ...u, status, updatedAt: now } : u)),
  }));
  audit('user.status', 'ManagedUser', userId, { status });
}

/** Demo-only: Direction switches the active session profile to another active user. */
export function impersonateUser(userId: string) {
  requireUsersAdmin();
  if (!getState().demoMode) throw new Error('Impersonation disponible en mode démo uniquement');
  const user = getState().users.find((u) => u.id === userId);
  if (!user) throw new Error('Utilisateur introuvable');
  if (user.status !== 'active') throw new Error('Compte désactivé');

  localStorage.setItem(ROLE_KEY, user.roleId);
  setState((s) => ({
    ...s,
    profile: {
      ...s.profile,
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      siteIds: user.siteIds,
    },
  }));
  audit('user.impersonate', 'ManagedUser', userId, { roleId: user.roleId });
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState() {
  useEffect(() => {
    hydrateStoreFromSession();
  }, []);
  return useSyncExternalStore(subscribe, getState, () => createSeed(true));
}

export function useSession() {
  const app = useAppState();
  const role = ROLES[app.profile.roleId];
  const can = useCallback((permission: string) => Boolean(role.can[permission]), [role]);
  return { app, role, roleId: app.profile.roleId, can, profile: app.profile };
}

export function materialStock(app: AppState, materialId: string) {
  return deriveStock(app.movements.filter((m) => m.itemType === 'MATERIAL' && m.itemId === materialId));
}

export function blockStock(app: AppState, blockTypeId: string) {
  return deriveStock(app.movements.filter((m) => m.itemType === 'BLOCK' && m.itemId === blockTypeId));
}

export function materialStatus(app: AppState, materialId: string) {
  const mat = app.materials.find((m) => m.id === materialId);
  if (!mat) return 'out' as const;
  return stockStatus(materialStock(app, materialId), mat.alertThreshold);
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function audit(action: string, entity: string, entityId: string, after?: unknown) {
  setState((s) => ({
    ...s,
    auditLogs: [
      {
        id: uid('aud'),
        action,
        entity,
        entityId,
        after,
        actorId: s.profile.id,
        at: new Date().toISOString(),
      },
      ...s.auditLogs,
    ],
  }));
}

function upsertAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'status'> & { status?: Alert['status'] }) {
  setState((s) => {
    const existing = s.alerts.find((a) => a.dedupeKey === alert.dedupeKey && a.status !== 'resolved');
    if (existing) return s;
    return {
      ...s,
      alerts: [
        {
          ...alert,
          id: uid('al'),
          status: alert.status ?? 'new',
          createdAt: new Date().toISOString(),
        },
        ...s.alerts,
      ],
    };
  });
}

export function addStockMovement(input: Omit<StockMovement, 'id' | 'createdAt' | 'createdById' | 'siteId'>) {
  const movement: StockMovement = {
    ...input,
    id: uid('mov'),
    siteId: 'site-1',
    createdAt: new Date().toISOString(),
    createdById: getState().profile.id,
  };
  setState((s) => ({ ...s, movements: [...s.movements, movement] }));
  audit('stock.movement', 'StockMovement', movement.id, movement);

  if (movement.itemType === 'MATERIAL') {
    const mat = getState().materials.find((m) => m.id === movement.itemId);
    if (mat) {
      const qty = materialStock(getState(), mat.id);
      const status = stockStatus(qty, mat.alertThreshold);
      if (status !== 'ok') {
        upsertAlert({
          type: 'stock_low',
          title: t('runtime.stockLowTitle', { name: mat.name }),
          message: t('runtime.stockLowMaterial', {
            qty,
            unit: mat.unit,
            threshold: mat.alertThreshold,
          }),
          severity: status === 'out' ? 'critical' : 'warning',
          href: '/app/stocks',
          dedupeKey: `stock_low:${mat.id}`,
        });
      }
    }
  }
  if (movement.itemType === 'BLOCK') {
    const blk = getState().blockTypes.find((b) => b.id === movement.itemId);
    if (blk) {
      const qty = blockStock(getState(), blk.id);
      if (stockStatus(qty, blk.alertThreshold) !== 'ok') {
        upsertAlert({
          type: 'stock_low_block',
          title: t('runtime.stockLowTitle', { name: blk.name }),
          message: t('runtime.stockLowBlock', { qty, threshold: blk.alertThreshold }),
          severity: qty <= 0 ? 'critical' : 'warning',
          href: '/app/stocks',
          dedupeKey: `stock_low_block:${blk.id}`,
        });
      }
    }
  }
  return movement;
}

export function performInventory(materialId: string, counted: number, note: string) {
  const theoretical = materialStock(getState(), materialId);
  const delta = inventoryAdjustment(theoretical, counted);
  if (delta === 0) return;
  addStockMovement({
    itemType: 'MATERIAL',
    itemId: materialId,
    quantity: delta,
    reason: 'ADJUSTMENT',
    unitCost: getState().materials.find((m) => m.id === materialId)?.unitCost ?? 0,
    note,
  });
}

export function receiveSupply(dossierId: string, receivedQty: number) {
  const app = getState();
  const dossier = app.supplies.find((s) => s.id === dossierId);
  if (!dossier) throw new Error('Dossier introuvable');
  const variance = deliveryVariance(dossier.announcedQty, receivedQty);
  runBatch(() => {
    setState((s) => ({
      ...s,
      supplies: s.supplies.map((d) =>
        d.id === dossierId ? { ...d, receivedQty, status: 'RECEIVED' as const } : d,
      ),
    }));
    addStockMovement({
      itemType: 'MATERIAL',
      itemId: dossier.materialId,
      quantity: receivedQty,
      reason: 'RECEPTION',
      unitCost: dossier.unitPrice,
      sourceRef: dossierId,
    });
    if (variance !== 0) {
      upsertAlert({
        type: 'supply_variance',
        title: t('runtime.supplyVarianceTitle', { bl: dossier.blNumber }),
        message: t('runtime.supplyVarianceBody', {
          announced: dossier.announcedQty,
          received: receivedQty,
        }),
        severity: 'warning',
        href: '/app/approvisionnements',
        dedupeKey: `supply_variance:${dossierId}`,
      });
    }
    audit('supply.receive', 'SupplyDossier', dossierId, { receivedQty });
  });
}

export function advanceSupplyStatus(dossierId: string, status: SupplyDossier['status'], comment?: string) {
  setState((s) => ({
    ...s,
    supplies: s.supplies.map((d) =>
      d.id === dossierId ? { ...d, status, directionComment: comment ?? d.directionComment } : d,
    ),
  }));
  if (status === 'APPROVED') {
    upsertAlert({
      type: 'supply_to_pay',
      title: t('runtime.supplyToPayTitle'),
      message: t('runtime.supplyToPayBody'),
      severity: 'info',
      href: '/app/approvisionnements',
      dedupeKey: `supply_to_pay:${dossierId}`,
    });
  }
  audit('supply.status', 'SupplyDossier', dossierId, { status, comment });
}

export function paySupplier(dossierId: string, amount: number) {
  const app = getState();
  const dossier = app.supplies.find((s) => s.id === dossierId);
  if (!dossier || (dossier.status !== 'APPROVED' && dossier.status !== 'PARTIALLY_PAID')) {
    throw new Error(t('runtime.payNeedsApproval'));
  }
  if (app.profile.roleId !== 'owner' && !ROLES[app.profile.roleId].can.pay) {
    throw new Error(t('runtime.payNeedsDg'));
  }
  const due = supplierPayableAmount(dossier.receivedQty ?? 0, dossier.unitPrice, dossier.invoiceAmount);
  const paidTotal = dossier.paidTotal + amount;
  const status = paidTotal >= due ? 'PAID' : 'PARTIALLY_PAID';
  setState((s) => ({
    ...s,
    supplies: s.supplies.map((d) => (d.id === dossierId ? { ...d, paidTotal, status } : d)),
  }));
  audit('supply.pay', 'SupplyDossier', dossierId, { amount, paidTotal, status });
}

export function createSupply(input: Omit<SupplyDossier, 'id' | 'createdAt' | 'paidTotal' | 'status' | 'siteId'>) {
  const dossier: SupplyDossier = {
    ...input,
    id: uid('supd'),
    siteId: 'site-1',
    status: 'BL_RECORDED',
    paidTotal: 0,
    createdAt: new Date().toISOString(),
  };
  setState((s) => ({ ...s, supplies: [dossier, ...s.supplies] }));
  upsertAlert({
    type: 'supply_recorded',
    title: t('runtime.supplyRecordedTitle'),
    message: t('runtime.supplyRecordedBody', { bl: dossier.blNumber }),
    severity: 'info',
    href: '/app/approvisionnements',
    dedupeKey: `supply_recorded:${dossier.id}`,
  });
  return dossier;
}

export function validateProduction(input: {
  blockTypeId: string;
  bagsUsed: number;
  goodBlocks: number;
  lostBlocks: number;
  lossReason?: string;
  chiefName: string;
  sandUsed?: number;
}) {
  const app = getState();
  const block = app.blockTypes.find((b) => b.id === input.blockTypeId);
  if (!block) throw new Error('Type inconnu');
  const metrics = computeProductionMetrics({
    bagsUsed: input.bagsUsed,
    blocksPerBag: block.blocksPerBag,
    goodBlocks: input.goodBlocks,
  });
  const cement = app.materials.find((m) => m.kind === 'CEMENT')!;
  const materialCost = input.bagsUsed * cement.unitCost;
  const run: ProductionRun = {
    id: uid('prod'),
    siteId: 'site-1',
    date: new Date().toISOString().slice(0, 10),
    blockTypeId: input.blockTypeId,
    bagsUsed: input.bagsUsed,
    goodBlocks: input.goodBlocks,
    lostBlocks: input.lostBlocks,
    lossReason: input.lossReason,
    chiefName: input.chiefName,
    materialCost,
    createdAt: new Date().toISOString(),
  };
  // Batch all internal setState / audit / alert calls: 1 serialize + 1 notify
  // instead of the previous 5-7 separate flushes.
  runBatch(() => {
    setState((s) => ({ ...s, productionRuns: [run, ...s.productionRuns] }));
    addStockMovement({
      itemType: 'MATERIAL',
      itemId: cement.id,
      quantity: -input.bagsUsed,
      reason: 'PRODUCTION',
      unitCost: cement.unitCost,
      sourceRef: run.id,
    });
    if (input.sandUsed) {
      const sand = app.materials.find((m) => m.kind === 'SAND');
      if (sand) {
        addStockMovement({
          itemType: 'MATERIAL',
          itemId: sand.id,
          quantity: -input.sandUsed,
          reason: 'PRODUCTION',
          unitCost: sand.unitCost,
          sourceRef: run.id,
        });
      }
    }
    addStockMovement({
      itemType: 'BLOCK',
      itemId: input.blockTypeId,
      quantity: input.goodBlocks,
      reason: 'PRODUCTION',
      unitCost: materialCost / Math.max(1, input.goodBlocks),
      sourceRef: run.id,
    });
    if (metrics.yieldGapRate > app.settings.yieldAlertThreshold) {
      upsertAlert({
        type: 'yield_low',
        title: t('runtime.yieldLowTitle'),
        message: t('runtime.yieldLowBody', {
          yield: metrics.realYieldPerBag.toFixed(1),
          expected: block.blocksPerBag,
        }),
        severity: 'warning',
        href: '/app/production',
        dedupeKey: `yield_low:${run.id}`,
      });
    }
    audit('production.validate', 'ProductionRun', run.id, { run, metrics });
  });
  return { run, metrics };
}

export function createSale(input: Omit<Sale, 'id' | 'createdAt' | 'siteId'>) {
  const sale: Sale = {
    ...input,
    id: uid('sale'),
    siteId: 'site-1',
    createdAt: new Date().toISOString(),
  };
  // Batch all line movements + audit into one serialize + notify.
  runBatch(() => {
    setState((s) => ({ ...s, sales: [sale, ...s.sales] }));
    for (const line of sale.lines) {
      addStockMovement({
        itemType: 'BLOCK',
        itemId: line.blockTypeId,
        quantity: -line.qty,
        reason: 'SALE',
        unitCost: line.unitPrice,
        sourceRef: sale.id,
      });
    }
    if (sale.brokenInTransit > 0) {
      const first = sale.lines[0];
      addStockMovement({
        itemType: 'BLOCK',
        itemId: first.blockTypeId,
        quantity: -sale.brokenInTransit,
        reason: 'DELIVERY_LOSS',
        unitCost: first.unitPrice,
        sourceRef: sale.id,
        note: 'casse en livraison',
      });
    }
    audit('sale.create', 'Sale', sale.id, sale);
  });
  return sale;
}

export function addMeterReading(input: Omit<MeterReading, 'id'>) {
  const meter = getState().meters.find((m) => m.id === input.meterId);
  if (!meter) throw new Error('Compteur inconnu');
  meterConsumption(input.previousIndex, input.newIndex);
  const reading: MeterReading = { ...input, id: uid('rd') };
  setState((s) => ({ ...s, readings: [reading, ...s.readings] }));
  return reading;
}

export function addUtilityBill(bill: Omit<UtilityBill, 'id'>) {
  const row: UtilityBill = { ...bill, id: uid('bill') };
  setState((s) => ({ ...s, utilityBills: [row, ...s.utilityBills] }));
  return row;
}

export function markAlert(id: string, status: Alert['status']) {
  setState((s) => ({
    ...s,
    alerts: s.alerts.map((a) => (a.id === id ? { ...a, status } : a)),
  }));
}

export function saveEmployee(emp: Omit<Employee, 'id'> & { id?: string }) {
  if (emp.id) {
    setState((s) => ({
      ...s,
      employees: s.employees.map((e) => (e.id === emp.id ? { ...(emp as Employee) } : e)),
    }));
    return emp.id;
  }
  const id = uid('emp');
  setState((s) => ({ ...s, employees: [...s.employees, { ...emp, id }] }));
  return id;
}

export function addAttendance(row: Omit<Attendance, 'id'>) {
  const att: Attendance = { ...row, id: uid('att') };
  setState((s) => ({ ...s, attendance: [att, ...s.attendance] }));
  return att;
}

export function approvePayroll(periodId: string) {
  const app = getState();
  if (app.profile.roleId !== 'owner') throw new Error('Accord DG/PDG requis');
  setState((s) => ({
    ...s,
    payrollPeriods: s.payrollPeriods.map((p) => (p.id === periodId ? { ...p, status: 'approved' } : p)),
  }));
  audit('payroll.approve', 'PayrollPeriod', periodId);
}

export function markPayrollPaid(periodId: string) {
  const app = getState();
  const period = app.payrollPeriods.find((p) => p.id === periodId);
  if (!period || period.status !== 'approved') throw new Error('Paie non approuvée');
  setState((s) => ({
    ...s,
    payrollPeriods: s.payrollPeriods.map((p) => (p.id === periodId ? { ...p, status: 'paid' } : p)),
  }));
  audit('payroll.paid', 'PayrollPeriod', periodId);
}

export function generateWeeklyReport(): WeeklyReport {
  const app = getState();
  const revenue = app.sales.reduce(
    (sum, sale) => sum + sale.lines.reduce((s, l) => s + l.qty * l.unitPrice + l.deliveryFee, 0),
    0,
  );
  const materialCost = app.productionRuns.reduce((s, r) => s + r.materialCost, 0);
  const payrollCost = app.payrollPeriods
    .filter((p) => p.status === 'paid' || p.status === 'approved')
    .reduce((s, p) => s + p.slips.reduce((n, slip) => n + slip.net, 0), 0);
  const otherExpenses = app.expenses.reduce((s, e) => s + e.amount, 0);
  const electricityCost = app.readings
    .filter((r) => app.meters.find((m) => m.id === r.meterId)?.kind === 'electricity')
    .reduce((s, r) => {
      const meter = app.meters.find((m) => m.id === r.meterId)!;
      return s + (r.newIndex - r.previousIndex) * meter.unitTariff;
    }, 0);
  const waterCost = app.readings
    .filter((r) => app.meters.find((m) => m.id === r.meterId)?.kind === 'water')
    .reduce((s, r) => {
      const meter = app.meters.find((m) => m.id === r.meterId)!;
      return s + (r.newIndex - r.previousIndex) * meter.unitTariff;
    }, 0);
  const profit = computeWeeklyProfit({
    revenue,
    materialCost,
    electricityCost,
    waterCost,
    payrollCost,
    otherExpenses,
  });
  const productionBlocks = app.productionRuns.reduce((s, r) => s + r.goodBlocks, 0);
  const bagsUsed = app.productionRuns.reduce((s, r) => s + r.bagsUsed, 0);
  const losses = app.productionRuns.reduce((s, r) => s + r.lostBlocks, 0);
  const cashIn = app.sales.reduce((s, sale) => s + sale.deposit, 0);
  const cashOut = otherExpenses + payrollCost;
  const report: WeeklyReport = {
    id: uid('wr'),
    weekStart: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    weekEnd: new Date().toISOString().slice(0, 10),
    status: 'draft',
    version: 1,
    snapshot: {
      revenue,
      charges: profit.charges,
      profit: profit.profit,
      marginRate: profit.marginRate,
      treasury: cashIn - cashOut,
      productionBlocks,
      bagsUsed,
      losses,
    },
  };
  setState((s) => ({ ...s, weeklyReports: [report, ...s.weeklyReports] }));
  upsertAlert({
    type: 'weekly_ready',
    title: t('runtime.weeklyReadyTitle'),
    message: t('runtime.weeklyReadyBody', { amount: formatNumber(Math.round(profit.profit)) }),
    severity: 'info',
    href: '/app/recaps',
    dedupeKey: `weekly_ready:${report.id}`,
  });
  return report;
}

export function closeWeeklyReport(id: string) {
  if (getState().profile.roleId !== 'owner') throw new Error(t('runtime.closeNeedsOwner'));
  setState((s) => ({
    ...s,
    weeklyReports: s.weeklyReports.map((r) => (r.id === id ? { ...r, status: 'closed' } : r)),
  }));
  audit('weekly.close', 'WeeklyReport', id);
}

export function completeOnboarding() {
  setState((s) => ({
    ...s,
    profile: { ...s.profile, onboardingCompleted: true },
  }));
  // Flush immediately — skip must survive the next hard navigation / remount.
  if (typeof window !== 'undefined') {
    window.clearTimeout(persistTimer);
    writeSessionState();
  }
}

export function updateNotificationPrefs(prefs: AppState['profile']['notificationPrefs']) {
  setState((s) => ({ ...s, profile: { ...s.profile, notificationPrefs: prefs } }));
}

export function currentCmp(materialId: string) {
  const moves = getState().movements.filter((m) => m.itemType === 'MATERIAL' && m.itemId === materialId);
  let qty = 0;
  let value = 0;
  let unit = 0;
  for (const m of moves) {
    if (m.quantity > 0) {
      unit = weightedAverageUnitCost({
        stockQty: qty,
        stockValue: value,
        inboundQty: m.quantity,
        inboundUnitCost: m.unitCost,
      });
      qty += m.quantity;
      value = qty * unit;
    } else {
      qty += m.quantity;
      value = qty * unit;
    }
  }
  return unit;
}

/** Hook helper for local form feedback. */
export function useToasts() {
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const push = useCallback((message: string) => {
    const id = uid('toast');
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

export function useHydrationFlag() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
