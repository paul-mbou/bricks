import { Eye, EyeOff, Lock } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';
import { useI18n } from '../../lib/i18n/useI18n';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  /** Show leading lock icon (login). Default true. */
  withLeadingIcon?: boolean;
};

export default function PasswordField({
  label,
  id,
  className = '',
  withLeadingIcon = true,
  ...inputProps
}: Props) {
  const { t } = useI18n();
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        {withLeadingIcon && (
          <Lock
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-mute"
            aria-hidden="true"
          />
        )}
        <input
          {...inputProps}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={`h-11 w-full rounded-xl border border-line bg-panel py-0 text-[0.9375rem] focus:border-clay-500 focus:ring-4 focus:ring-clay-400/25 focus-visible:outline-none ${
            withLeadingIcon ? 'pr-11 pl-11' : 'pr-11 pl-4'
          } ${className}`}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-mute hover:bg-sunken hover:text-ink"
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
