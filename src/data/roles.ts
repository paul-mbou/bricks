import type { RoleId } from './types';

export const ROLES: Record<
  RoleId,
  {
    labelKey: `roles.${RoleId}`;
    can: Record<string, boolean>;
  }
> = {
  owner: {
    labelKey: 'roles.owner',
    can: {
      dashboard: true,
      stock: true,
      supply: true,
      approve: true,
      pay: true,
      production: true,
      sales: true,
      utilities: true,
      alerts: true,
      payroll: true,
      payrollPay: true,
      reports: true,
      settings: true,
      users: true,
      audit: true,
      profit: true,
    },
  },
  manager: {
    labelKey: 'roles.manager',
    can: {
      dashboard: true,
      stock: true,
      supply: true,
      approve: false,
      pay: false,
      production: true,
      sales: true,
      utilities: true,
      alerts: true,
      payroll: true,
      payrollPay: false,
      reports: true,
      settings: false,
      users: false,
      audit: true,
      profit: true,
    },
  },
  storekeeper: {
    labelKey: 'roles.storekeeper',
    can: {
      dashboard: true,
      stock: true,
      supply: true,
      approve: false,
      pay: false,
      production: false,
      sales: false,
      utilities: false,
      alerts: true,
      payroll: false,
      payrollPay: false,
      reports: false,
      settings: false,
      users: false,
      audit: false,
      profit: false,
    },
  },
  production: {
    labelKey: 'roles.production',
    can: {
      dashboard: true,
      stock: true,
      supply: false,
      approve: false,
      pay: false,
      production: true,
      sales: false,
      utilities: false,
      alerts: true,
      payroll: false,
      payrollPay: false,
      reports: false,
      settings: false,
      users: false,
      audit: false,
      profit: false,
    },
  },
  accounting: {
    labelKey: 'roles.accounting',
    can: {
      dashboard: true,
      stock: false,
      supply: true,
      approve: false,
      pay: true,
      production: false,
      sales: true,
      utilities: true,
      alerts: true,
      payroll: true,
      payrollPay: false,
      reports: true,
      settings: false,
      users: false,
      audit: true,
      profit: true,
    },
  },
  secretary: {
    labelKey: 'roles.secretary',
    can: {
      dashboard: true,
      stock: false,
      supply: false,
      approve: false,
      pay: false,
      production: false,
      sales: false,
      utilities: false,
      alerts: true,
      payroll: true,
      payrollPay: true,
      reports: false,
      settings: false,
      users: false,
      audit: false,
      profit: false,
    },
  },
};

export type NavItem = {
  href: string;
  labelKey: string;
  permission: string;
  groupKey: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/app', labelKey: 'nav.dashboard', permission: 'dashboard', groupKey: 'nav.group.view' },
  { href: '/app/stocks', labelKey: 'nav.stocks', permission: 'stock', groupKey: 'nav.group.ops' },
  { href: '/app/approvisionnements', labelKey: 'nav.supply', permission: 'supply', groupKey: 'nav.group.ops' },
  { href: '/app/production', labelKey: 'nav.production', permission: 'production', groupKey: 'nav.group.ops' },
  { href: '/app/ventes', labelKey: 'nav.sales', permission: 'sales', groupKey: 'nav.group.ops' },
  { href: '/app/energie', labelKey: 'nav.energy', permission: 'utilities', groupKey: 'nav.group.track' },
  { href: '/app/alertes', labelKey: 'nav.alerts', permission: 'alerts', groupKey: 'nav.group.track' },
  { href: '/app/paie', labelKey: 'nav.payroll', permission: 'payroll', groupKey: 'nav.group.admin' },
  { href: '/app/recaps', labelKey: 'nav.reports', permission: 'reports', groupKey: 'nav.group.admin' },
  { href: '/app/partenaires', labelKey: 'nav.partners', permission: 'supply', groupKey: 'nav.group.admin' },
  { href: '/app/utilisateurs', labelKey: 'nav.users', permission: 'users', groupKey: 'nav.group.admin' },
  { href: '/app/parametres', labelKey: 'nav.settings', permission: 'settings', groupKey: 'nav.group.admin' },
  { href: '/app/audit', labelKey: 'nav.audit', permission: 'audit', groupKey: 'nav.group.admin' },
  { href: '/app/notifications', labelKey: 'nav.notifications', permission: 'alerts', groupKey: 'nav.group.admin' },
];

export const BOTTOM_NAV = [
  { href: '/app', labelKey: 'nav.homeShort', permission: 'dashboard' },
  { href: '/app/stocks', labelKey: 'nav.stocks', permission: 'stock' },
  { href: '/app/production', labelKey: 'nav.prodShort', permission: 'production' },
  { href: '/app/alertes', labelKey: 'nav.alerts', permission: 'alerts' },
] as const;
