import {
  Bell,
  BrickWall,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Megaphone,
  Package,
  ScrollText,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS } from '../../data/roles';
import { useI18n } from '../../lib/i18n/useI18n';
import { useSession } from '../../lib/store';
import { useCurrentPath } from '../../lib/useCurrentPath';

const NAV_ICONS: Record<string, LucideIcon> = {
  '/app': LayoutDashboard,
  '/app/stocks': Package,
  '/app/approvisionnements': Truck,
  '/app/production': Factory,
  '/app/ventes': ShoppingCart,
  '/app/energie': Zap,
  '/app/alertes': Bell,
  '/app/paie': Wallet,
  '/app/recaps': ClipboardList,
  '/app/partenaires': Users,
  '/app/utilisateurs': UserCog,
  '/app/parametres': Settings,
  '/app/audit': ScrollText,
  '/app/notifications': Megaphone,
};

const NAV_TOUR_ANCHORS: Record<string, string> = {
  '/app': 'tour-nav-dashboard',
  '/app/stocks': 'tour-nav-stocks',
  '/app/approvisionnements': 'tour-nav-supply',
  '/app/production': 'tour-nav-production',
  '/app/ventes': 'tour-nav-sales',
  '/app/energie': 'tour-nav-energy',
  '/app/alertes': 'tour-nav-alerts',
  '/app/paie': 'tour-nav-payroll',
  '/app/recaps': 'tour-nav-reports',
  '/app/partenaires': 'tour-nav-partners',
  '/app/utilisateurs': 'tour-nav-users',
  '/app/parametres': 'tour-nav-settings',
  '/app/audit': 'tour-nav-audit',
  '/app/notifications': 'tour-nav-notifications',
};

export default function Sidebar({ current: initialCurrent }: { current: string }) {
  const current = useCurrentPath(initialCurrent);
  const { can } = useSession();
  const { t } = useI18n();
  const groups = [...new Set(NAV_ITEMS.map((i) => i.groupKey))];

  const toggle = () => {
    const collapsed = document.documentElement.dataset.sidebar === 'collapsed';
    if (collapsed) {
      delete document.documentElement.dataset.sidebar;
      localStorage.setItem('br-sidebar', 'expanded');
    } else {
      document.documentElement.dataset.sidebar = 'collapsed';
      localStorage.setItem('br-sidebar', 'collapsed');
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-slate-950 text-white transition-[width] duration-200 lg:flex lg:rail:w-20">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5" data-tour="tour-brand">
        <BrickWall className="size-7 shrink-0 text-clay-400" aria-hidden="true" />
        <div className="rail:sr-only">
          <p className="text-sm font-extrabold tracking-wide">{t('brand.name')}</p>
          <p className="text-xs text-white/50">{t('brand.factory')}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="ml-auto grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          aria-label={t('nav.collapse')}
        >
          <ChevronLeft className="size-4 rail:hidden" />
          <ChevronRight className="hidden size-4 rail:block" />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label={t('nav.main')}>
        {groups.map((groupKey) => {
          const items = NAV_ITEMS.filter((i) => i.groupKey === groupKey && can(i.permission));
          if (!items.length) return null;
          return (
            <div key={groupKey}>
              <p className="mb-2 px-3 text-[0.6875rem] font-bold tracking-[0.14em] text-white/40 uppercase rail:sr-only">
                {t(groupKey)}
              </p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = current === item.href || (item.href !== '/app' && current.startsWith(item.href));
                  const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
                  const label = t(item.labelKey);
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        title={label}
                        data-tour={NAV_TOUR_ANCHORS[item.href]}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition rail:justify-center rail:px-0 ${active ? 'bg-clay-500/20 text-clay-200' : 'text-white/70 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <Icon className="size-[1.125rem] shrink-0 opacity-90" aria-hidden="true" />
                        <span className="truncate rail:sr-only">{label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
