import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { TranslateFn } from '../../lib/i18n';
import { useI18n } from '../../lib/i18n/useI18n';
import { completeOnboarding, getState, hydrateStoreFromSession, useSession } from '../../lib/store';

type TourStep = {
  id: string;
  title: string;
  body: string;
  href: string;
  anchors: string[];
  requestNotify?: boolean;
};

const TOUR_ACTIVE_KEY = 'br-tour-active';
const TOUR_STEP_KEY = 'br-tour-step';

function buildOwnerSteps(t: TranslateFn): TourStep[] {
  return [
    {
      id: 'dashboard',
      title: t('tour.owner.dashboardTitle'),
      body: t('tour.owner.dashboardBody'),
      href: '/app',
      anchors: ['tour-nav-dashboard', 'tour-dashboard'],
    },
    {
      id: 'stocks',
      title: t('tour.owner.stocksTitle'),
      body: t('tour.owner.stocksBody'),
      href: '/app/stocks',
      anchors: ['tour-nav-stocks', 'tour-stocks'],
    },
    {
      id: 'supply',
      title: t('tour.owner.supplyTitle'),
      body: t('tour.owner.supplyBody'),
      href: '/app/approvisionnements',
      anchors: ['tour-nav-supply', 'tour-supply'],
    },
    {
      id: 'production',
      title: t('tour.owner.productionTitle'),
      body: t('tour.owner.productionBody'),
      href: '/app/production',
      anchors: ['tour-nav-production', 'tour-production'],
    },
    {
      id: 'alerts',
      title: t('tour.owner.alertsTitle'),
      body: t('tour.owner.alertsBody'),
      href: '/app/alertes',
      anchors: ['tour-nav-alerts', 'tour-alerts-bell', 'tour-alerts'],
    },
    {
      id: 'reports',
      title: t('tour.owner.reportsTitle'),
      body: t('tour.owner.reportsBody'),
      href: '/app/recaps',
      anchors: ['tour-nav-reports', 'tour-reports'],
    },
    {
      id: 'payroll',
      title: t('tour.owner.payrollTitle'),
      body: t('tour.owner.payrollBody'),
      href: '/app/paie',
      anchors: ['tour-nav-payroll', 'tour-payroll'],
    },
    {
      id: 'notify',
      title: t('tour.owner.notifyTitle'),
      body: t('tour.owner.notifyBody'),
      href: '/app/notifications',
      anchors: ['tour-nav-notifications', 'tour-notify'],
      requestNotify: true,
    },
  ];
}

function buildDefaultSteps(t: TranslateFn): TourStep[] {
  return [
    {
      id: 'welcome',
      title: t('tour.default.welcomeTitle'),
      body: t('tour.default.welcomeBody'),
      href: '/app',
      anchors: ['tour-nav-dashboard', 'tour-dashboard'],
    },
    {
      id: 'stocks',
      title: t('tour.default.stocksTitle'),
      body: t('tour.default.stocksBody'),
      href: '/app/stocks',
      anchors: ['tour-nav-stocks', 'tour-stocks'],
    },
    {
      id: 'alerts',
      title: t('tour.default.alertsTitle'),
      body: t('tour.default.alertsBody'),
      href: '/app/alertes',
      anchors: ['tour-nav-alerts', 'tour-alerts-bell', 'tour-alerts'],
    },
  ];
}

type Rect = { top: number; left: number; width: number; height: number };

function readStoredStep() {
  try {
    const raw = sessionStorage.getItem(TOUR_STEP_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function isTourActive() {
  try {
    return sessionStorage.getItem(TOUR_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

function setTourActive(active: boolean, step = 0) {
  try {
    if (active) {
      sessionStorage.setItem(TOUR_ACTIVE_KEY, '1');
      sessionStorage.setItem(TOUR_STEP_KEY, String(step));
    } else {
      sessionStorage.removeItem(TOUR_ACTIVE_KEY);
      sessionStorage.removeItem(TOUR_STEP_KEY);
    }
  } catch {
    /* ignore */
  }
}

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/';
}

function measureAnchors(anchors: string[]): Rect | null {
  if (document.documentElement.hasAttribute('data-auth-pending')) return null;

  for (const anchor of anchors) {
    const nodes = document.querySelectorAll(`[data-tour="${anchor}"]`);
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      // Prefer visible desktop sidebar / page anchors (skip zero-size mobile duplicates)
      if (r.width < 8 || r.height < 8) continue;
      const pad = 6;
      return {
        top: Math.max(8, r.top - pad),
        left: Math.max(8, r.left - pad),
        width: Math.min(window.innerWidth - 16, r.width + pad * 2),
        height: Math.min(window.innerHeight - 16, r.height + pad * 2),
      };
    }
  }
  return null;
}

function prefetchHref(href: string) {
  try {
    // Guard against duplicate <link> tags accumulating across tour replays.
    if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'document';
    document.head.appendChild(link);
  } catch {
    /* ignore */
  }
}

/**
 * Presentation demo uses full navigations (not ClientRouter swaps).
 * Soft swaps re-apply auth-pending and remount races that blank the shell;
 * prefetch + sessionStorage tour keys keep hops fast and replayable.
 * Auth is never escalated here — middleware + login own the session cookie.
 */
function tourNavigate(href: string) {
  const target = normalizePath(href);
  if (normalizePath(window.location.pathname) === target) return;
  window.location.assign(href);
}

export default function GuidedTour() {
  const { t } = useI18n();
  const { profile, roleId, app } = useSession();
  // Keep initial render identical to SSR (empty host); restore step after mount.
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const navigatingRef = useRef(false);
  const rafRef = useRef(0);

  const steps = useMemo(
    () => (roleId === 'owner' ? buildOwnerSteps(t) : buildDefaultSteps(t)),
    [roleId, t],
  );
  const safeStep = Math.min(Math.max(0, step), Math.max(0, steps.length - 1));
  const current = steps[safeStep];

  const refreshRect = useCallback(() => {
    if (!open || !current) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const next = measureAnchors(current.anchors);
      // Only schedule a re-render when the highlight box actually moved or appeared/disappeared.
      // Without this guard, every scroll event triggers a state update even when
      // the anchor is off-screen or the page doesn't scroll (e.g. dashboard).
      setRect((prev) => {
        if (!prev && !next) return prev;
        if (!prev || !next) return next;
        if (
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.height === next.height
        )
          return prev; // identical — skip re-render
        return next;
      });
    });
  }, [open, current]);

  const goStep = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, steps.length - 1));
      setStep(clamped);
      setTourActive(true, clamped);
      const upcoming = steps[clamped + 1];
      if (upcoming) prefetchHref(upcoming.href);
    },
    [steps],
  );

  const finish = useCallback(
    async (withNotify: boolean) => {
      if (withNotify && roleId === 'owner' && 'Notification' in window) {
        try {
          await Notification.requestPermission();
          if (Notification.permission === 'granted') {
            new Notification('Bricks', { body: t('tour.testNotification') });
          }
        } catch {
          /* ignore */
        }
      }
      // Clear tour keys first so a remount cannot treat this as an in-progress tour.
      setTourActive(false);
      completeOnboarding();
      setOpen(false);
      setRect(null);
    },
    [roleId, t],
  );

  useEffect(() => {
    if (step !== safeStep) {
      setStep(safeStep);
      if (isTourActive()) setTourActive(true, safeStep);
    }
  }, [step, safeStep]);

  const openTourAt = useCallback(
    (at: number) => {
      const stored = Math.min(Math.max(0, at), Math.max(0, steps.length - 1));
      setTourActive(true, stored);
      setStep(stored);
      setOpen(true);
      for (const s of steps) prefetchHref(s.href);
    },
    [steps],
  );

  /**
   * Hydrate session BEFORE deciding. Seed SSR always has onboardingCompleted=false;
   * opening from that snapshot re-set br-tour-active and made « Passer » come back.
   * After skip: only Settings (br-reopen-tour / Relancer) may show the tour again.
   */
  useLayoutEffect(() => {
    hydrateStoreFromSession();
    const completed = getState().profile.onboardingCompleted;
    if (isTourActive()) {
      openTourAt(readStoredStep());
      return;
    }
    if (!completed) {
      openTourAt(0);
      return;
    }
    setOpen(false);
    setRect(null);
  }, [openTourAt, roleId]);

  useEffect(() => {
    if (profile.onboardingCompleted && !isTourActive()) {
      setOpen(false);
      setRect(null);
    }
  }, [profile.onboardingCompleted]);

  useEffect(() => {
    const reopen = () => {
      openTourAt(0);
    };
    window.addEventListener('br-reopen-tour', reopen);
    return () => window.removeEventListener('br-reopen-tour', reopen);
  }, [openTourAt]);

  useEffect(() => {
    if (!open || !current || navigatingRef.current) return;
    const path = normalizePath(window.location.pathname);
    const target = normalizePath(current.href);
    if (path === target) {
      navigatingRef.current = false;
      refreshRect();
      return;
    }

    navigatingRef.current = true;
    setTourActive(true, safeStep);
    tourNavigate(current.href);
    // Hard nav unloads the page; if it doesn't, unblock the tour after a deadline.
    const navTimeout = window.setTimeout(() => {
      navigatingRef.current = false;
    }, 8000);
    return () => window.clearTimeout(navTimeout);
  }, [open, current, safeStep, refreshRect]);

  useEffect(() => {
    if (!open) return;

    refreshRect();
    const onPageReady = () => {
      navigatingRef.current = false;
      refreshRect();
    };
    document.addEventListener('astro:page-load', onPageReady);
    document.addEventListener('astro:after-swap', onPageReady);
    window.addEventListener('resize', refreshRect);
    window.addEventListener('scroll', refreshRect, { passive: true, capture: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('astro:page-load', onPageReady);
      document.removeEventListener('astro:after-swap', onPageReady);
      window.removeEventListener('resize', refreshRect);
      window.removeEventListener('scroll', refreshRect, true);
    };
  }, [open, safeStep, refreshRect]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        void finish(false);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (safeStep < steps.length - 1) goStep(safeStep + 1);
        else void finish(Boolean(current?.requestNotify));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goStep(safeStep - 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, safeStep, steps.length, current, finish, goStep]);

  // Stable SSR/client host — never return null (keeps Astro island hydration healthy)
  const cardStyle: CSSProperties = {
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
    width: 'min(100% - 2rem, 26rem)',
  };

  return (
    <div id="br-guided-tour-root" data-tour-root="">
      {open && current ? (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
          <div className="absolute inset-0 bg-slate-950/50" aria-hidden="true" />

          {rect && (
            <div
              className="pointer-events-none absolute z-[71] rounded-2xl border-2 border-clay-400 bg-clay-400/10 shadow-[0_0_0_4px_rgb(165_148_249/0.28)]"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }}
              aria-hidden="true"
            />
          )}

          <div
            className="absolute z-[72] rounded-3xl border border-line/80 bg-panel p-5 shadow-[0_24px_64px_-24px_rgb(15_15_18/0.5)]"
            style={cardStyle}
          >
            {app.demoMode && (
              <p className="mb-2 text-xs font-bold tracking-wider text-clay-600 uppercase dark:text-clay-300">
                {t('demo.banner')}
              </p>
            )}
            <p className="text-xs font-bold text-ink-mute">
              {t('tour.stepProgress', { current: safeStep + 1, total: steps.length })}
            </p>
            <h2 id="tour-title" className="mt-1.5 text-xl font-extrabold text-ink">
              {current.title}
            </h2>
            <p className="mt-2 text-[0.9375rem] text-ink-mute">{current.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn-quiet" onClick={() => goStep(safeStep - 1)} disabled={safeStep === 0}>
                {t('tour.back')}
              </button>
              {safeStep < steps.length - 1 ? (
                <button type="button" className="btn-clay" onClick={() => goStep(safeStep + 1)}>
                  {t('tour.next')}
                </button>
              ) : (
                <button type="button" className="btn-clay" onClick={() => void finish(Boolean(current.requestNotify))}>
                  {t('tour.done')}
                </button>
              )}
              <button
                type="button"
                className="ml-auto text-sm font-semibold text-ink-mute hover:text-ink"
                onClick={() => void finish(false)}
              >
                {t('tour.skip')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
