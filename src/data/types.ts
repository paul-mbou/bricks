export type RoleId = 'owner' | 'manager' | 'storekeeper' | 'production' | 'accounting' | 'secretary';

export type MaterialKind = 'CEMENT' | 'SAND' | 'GRAVEL' | 'POZZOLAN' | 'BLACK_EARTH' | 'OTHER';
export type MaterialUnit = 'bag' | 'tonne' | 'm3' | 'truck';

export type SupplyStatus =
  | 'BL_RECORDED'
  | 'RECEIVED'
  | 'INVOICE_FILED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PARTIALLY_PAID'
  | 'PAID';

export type MovementReason =
  | 'RECEPTION'
  | 'PRODUCTION'
  | 'SALE'
  | 'LOSS'
  | 'ADJUSTMENT'
  | 'DELIVERY_LOSS';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'new' | 'seen' | 'resolved';

export type Site = { id: string; name: string; city: string };

export type Material = {
  id: string;
  name: string;
  kind: MaterialKind;
  unit: MaterialUnit;
  alertThreshold: number;
  unitCost: number;
};

export type BlockType = {
  id: string;
  name: string;
  dimensions?: string;
  priceDeliveredCity: number;
  priceExWorks: number;
  alertThreshold: number;
  blocksPerBag: number;
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  materials: string[];
  paymentTerms?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
};

export type StockMovement = {
  id: string;
  siteId: string;
  itemType: 'MATERIAL' | 'BLOCK';
  itemId: string;
  quantity: number;
  reason: MovementReason;
  unitCost: number;
  sourceRef?: string;
  note?: string;
  createdAt: string;
  createdById: string;
  clientOpId?: string;
};

export type SupplyDossier = {
  id: string;
  siteId: string;
  kind: 'CEMENT' | 'AGGREGATE';
  materialId: string;
  supplierId: string;
  blNumber: string;
  blDate: string;
  announcedQty: number;
  receivedQty?: number;
  unitPrice: number;
  truckCapacity?: '20t' | '30t' | '50t';
  vehicle?: string;
  status: SupplyStatus;
  invoiceAmount?: number;
  paidTotal: number;
  directionComment?: string;
  attachmentNames: string[];
  createdAt: string;
};

export type ProductionRun = {
  id: string;
  siteId: string;
  date: string;
  blockTypeId: string;
  bagsUsed: number;
  goodBlocks: number;
  lostBlocks: number;
  lossReason?: string;
  chiefName: string;
  materialCost: number;
  createdAt: string;
};

export type Sale = {
  id: string;
  siteId: string;
  customerId: string;
  date: string;
  deliveryMode: 'city' | 'exworks' | 'out_of_city';
  paymentMode: 'cash' | 'credit';
  deposit: number;
  lines: { blockTypeId: string; qty: number; unitPrice: number; deliveryFee: number }[];
  brokenInTransit: number;
  createdAt: string;
};

export type Meter = {
  id: string;
  name: string;
  kind: 'electricity' | 'water';
  unit: 'kWh' | 'm3';
  unitTariff: number;
};

export type MeterReading = {
  id: string;
  meterId: string;
  previousIndex: number;
  newIndex: number;
  date: string;
};

export type UtilityBill = {
  id: string;
  meterId: string;
  month: string;
  amount: number;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  contract: 'monthly' | 'weekly' | 'daily' | 'piece';
  baseRate: number;
  hiredAt: string;
  paymentInfo?: string;
};

export type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  code: 'present' | 'absent' | 'half' | 'leave' | 'overtime';
};

export type PayrollPeriod = {
  id: string;
  label: string;
  start: string;
  end: string;
  status: 'draft' | 'ready' | 'approved' | 'paid';
  slips: {
    employeeId: string;
    gross: number;
    advances: number;
    deductions: number;
    net: number;
  }[];
};

export type Alert = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  href: string;
  createdAt: string;
  dedupeKey: string;
};

export type WeeklyReport = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: 'draft' | 'closed';
  version: number;
  snapshot: {
    revenue: number;
    charges: number;
    profit: number;
    marginRate: number;
    treasury: number;
    productionBlocks: number;
    bagsUsed: number;
    losses: number;
  };
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
};

export type Settings = {
  currency: string;
  weekEndsOn: 'saturday' | 'sunday';
  yieldAlertThreshold: number;
  lossAlertThreshold: number;
  utilityRiseThreshold: number;
  pushFallbackMinutes: number;
  cnpsEnabled: boolean;
  cnpsEmployeeRate: number;
  companyName: string;
  city: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  roleId: RoleId;
  siteIds: string[];
  onboardingCompleted: boolean;
  onboardingVersion: number;
  notificationPrefs: {
    stock: boolean;
    supply: boolean;
    production: boolean;
    payroll: boolean;
    weekly: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
};

/** App users managed by Direction (demo store; Appwrite later). */
export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  roleId: RoleId;
  status: 'active' | 'disabled';
  siteIds: string[];
  /** Demo UX only — passwords are never stored in cleartext. */
  passwordSet: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  actorId: string;
  at: string;
};

export type AppState = {
  sites: Site[];
  materials: Material[];
  blockTypes: BlockType[];
  suppliers: Supplier[];
  customers: Customer[];
  movements: StockMovement[];
  supplies: SupplyDossier[];
  productionRuns: ProductionRun[];
  sales: Sale[];
  meters: Meter[];
  readings: MeterReading[];
  utilityBills: UtilityBill[];
  employees: Employee[];
  attendance: Attendance[];
  payrollPeriods: PayrollPeriod[];
  alerts: Alert[];
  weeklyReports: WeeklyReport[];
  expenses: Expense[];
  settings: Settings;
  profile: Profile;
  users: ManagedUser[];
  auditLogs: AuditLog[];
  demoMode: boolean;
};
