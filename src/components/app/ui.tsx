import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  CircleAlert,
  Minus,
  Plus,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { useI18n } from '../../lib/i18n/useI18n';

export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'slate';

const toneClass: Record<Tone, string> = {
  success:
    'bg-lime-400/25 text-slate-900 ring-lime-500/30 dark:bg-lime-400/15 dark:text-lime-400 dark:ring-lime-400/25',
  warning:
    'bg-soft-yellow/60 text-amber-900 ring-amber-500/25 dark:bg-soft-yellow/15 dark:text-soft-yellow dark:ring-soft-yellow/30',
  danger: 'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20',
  neutral: 'bg-sunken text-ink-mute ring-line',
  slate: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-100 dark:ring-white/10',
};

export function Badge({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Delta({ value, suffix }: { value: number; suffix?: string }) {
  const { formatNumber } = useI18n();
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold ${up
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
          : 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300'
          }`}
      >
        <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
        {up ? '+' : '−'}
        {formatNumber(Math.abs(value))}&nbsp;%
      </span>
      {suffix && <span className="text-ink-mute">{suffix}</span>}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  tourAnchor,
}: {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  tourAnchor?: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
    >
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
        <p className="mt-1 text-[0.9375rem] text-ink-mute">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  children,
  tone = 'slate',
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  children?: ReactNode;
  tone?: 'slate' | 'clay' | 'danger' | 'warning';
}) {
  const iconTone = {
    slate: 'bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-100',
    clay: 'bg-clay-50 text-clay-700 dark:bg-clay-400/10 dark:text-clay-300',
    warning: 'bg-soft-yellow/70 text-amber-900 dark:bg-soft-yellow/15 dark:text-soft-yellow',
    danger: 'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300',
  }[tone];
  return (
    <div className="app-card p-4 sm:p-5">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-mute">{label}</p>
        <span className={`hidden size-9 shrink-0 place-items-center rounded-xl sm:grid ${iconTone}`}>
          <Icon className="size-[1.125rem]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-base font-extrabold tracking-tight text-ink tabular-nums min-[380px]:text-lg sm:mt-3 sm:text-2xl">
        {value}
      </p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-sunken text-ink-mute">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-bold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-mute">{children}</div>}
    </div>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizes = { xs: 'size-7 text-[0.6875rem]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base' };
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-linear-to-b from-clay-50 to-clay-100 font-semibold tracking-wide text-clay-700 ring-1 ring-clay-200/70 ring-inset dark:from-clay-400/15 dark:to-clay-400/5 dark:text-clay-200 dark:ring-clay-300/20 ${sizes[size]}`}
    >
      {initials}
    </span>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = '',
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`app-card ${className}`}>
      {title && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
          <div>
            <h2 className="font-bold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-mute">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName ?? (title ? 'px-5 pb-5 sm:px-6 sm:pb-6' : 'p-5 sm:p-6')}>{children}</div>
    </section>
  );
}

export const linkClass =
  'inline-flex items-center gap-1 text-sm font-semibold text-clay-700 hover:underline dark:text-clay-300';

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full overflow-x-auto rounded-xl bg-sunken p-1 ring-1 ring-line ring-inset"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold whitespace-nowrap transition ${active
              ? 'bg-panel text-ink shadow-[0_1px_3px_rgb(20_37_36/0.12)] dark:bg-slate-700'
              : 'text-ink-mute hover:text-ink'
              }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={`rounded-md px-1.5 text-xs tabular-nums ${active ? 'bg-clay-100 text-clay-700 dark:bg-clay-400/15 dark:text-clay-300' : 'bg-panel/70 dark:bg-white/5'}`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  label,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-ink-mute"
        aria-hidden="true"
      />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-line bg-panel pr-4 pl-10 text-[0.9375rem] text-ink transition placeholder:text-ink-mute/80 hover:border-slate-200 focus:border-clay-500 focus:ring-4 focus:ring-clay-400/25 focus-visible:outline-none dark:hover:border-white/20"
      />
    </div>
  );
}

export const selectClass =
  'h-11 appearance-none rounded-xl border border-line bg-panel pr-10 pl-3.5 text-[0.9375rem] font-medium text-ink transition hover:border-slate-200 focus:border-clay-500 focus:ring-4 focus:ring-clay-400/25 focus-visible:outline-none dark:hover:border-white/20';

const controlBase =
  'w-full rounded-xl border bg-panel text-[0.9375rem] text-ink transition placeholder:text-ink-mute/70 focus:ring-4 focus-visible:outline-none';

export const inputClass = (invalid = false) =>
  `${controlBase} h-11 px-3.5 ${invalid
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
    : 'border-line hover:border-slate-200 focus:border-clay-500 focus:ring-clay-400/25 dark:hover:border-white/20'
  }`;

export const textareaClass = `${controlBase} border-line px-3.5 py-3 hover:border-slate-200 focus:border-clay-500 focus:ring-clay-400/25 dark:hover:border-white/20`;

export function FormField({
  id,
  label,
  hint,
  error,
  children,
  className = '',
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-ink-mute">{hint}</p>
      )}
    </div>
  );
}

export function SelectBox({ className = '', children, ...select }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative ${className}`}>
      <select {...select} className={`${selectClass} w-full`}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-mute"
        aria-hidden="true"
      />
    </div>
  );
}

export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string;
  tabs: readonly { id: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition ${active ? 'border-clay-500 text-ink' : 'border-transparent text-ink-mute hover:text-ink'
              }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-md bg-sunken px-1.5 text-xs text-ink-mute tabular-nums">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  labelledBy,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-clay-500' : 'bg-slate-200 dark:bg-white/15'}`}
    >
      <span
        className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-panel" aria-label={label}>
      <button
        type="button"
        className="grid size-11 place-items-center text-ink-mute hover:text-ink"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Diminuer"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-10 text-center font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid size-11 place-items-center text-ink-mute hover:text-ink"
        onClick={() => onChange(value + 1)}
        aria-label="Augmenter"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function useDismiss(ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, ref]);
}

const dialogShell =
  'fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none border-0 bg-transparent p-0 open:flex backdrop:bg-slate-950/40 backdrop:backdrop-blur-md backdrop:animate-[backdrop-in_0.28s_ease-out]';

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'sheet',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: 'center' | 'sheet';
}) {
  const { t } = useI18n();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  const isSheet = variant === 'sheet';

  return (
    <dialog
      ref={(node) => {
        dialogRef.current = node;
        if (node && !node.open) node.showModal();
      }}
      aria-labelledby={titleId}
      className={`${dialogShell} ${isSheet ? 'justify-end' : 'items-center justify-center p-4'}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div
        className={`flex w-full flex-col border border-line/80 bg-panel shadow-[0_24px_64px_-24px_rgb(15_15_18/0.45)] dark:border-white/10 ${isSheet
            ? 'h-full max-h-dvh max-w-lg animate-[sheet-in_0.28s_ease] rounded-none border-y-0 border-r-0 sm:rounded-l-3xl'
            : 'max-h-[min(92dvh,900px)] max-w-lg animate-[dialog-in_0.28s_ease] rounded-3xl'
          }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl hover:bg-sunken"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </dialog>
  );
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone = 'default',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  tone?: 'default' | 'danger';
}) {
  const { t } = useI18n();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolvedConfirm = confirmLabel ?? t('common.confirm');
  const resolvedCancel = cancelLabel ?? t('common.cancel');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={(node) => {
        dialogRef.current = node;
        if (node && !node.open) node.showModal();
      }}
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-desc`}
      className={`${dialogShell} items-center justify-center p-4`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="w-full max-w-md animate-[dialog-in_0.28s_ease] rounded-3xl border border-line/80 bg-panel p-6 shadow-[0_24px_64px_-24px_rgb(15_15_18/0.45)] dark:border-white/10">
        <h2 id={titleId} className="text-lg font-bold text-ink">
          {title}
        </h2>
        <div id={`${titleId}-desc`} className="mt-2 text-[0.9375rem] text-ink-mute">
          {description}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-quiet" onClick={onClose}>
            {resolvedCancel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn bg-red-600 text-white hover:bg-red-500' : 'btn-clay'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function DemoBanner({ visible }: { visible: boolean }) {
  const { t } = useI18n();
  if (!visible) return null;
  return (
    <div className="mb-4 rounded-xl border border-clay-200 bg-clay-50 px-4 py-2.5 text-sm font-semibold text-clay-700 dark:border-clay-400/20 dark:bg-clay-400/10 dark:text-clay-200">
      {t('demo.banner')}
    </div>
  );
}
