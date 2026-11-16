import { useMemo, useState } from 'react';
import { ROLES } from '../../data/roles';
import type { ManagedUser, RoleId } from '../../data/types';
import { useI18n } from '../../lib/i18n/useI18n';
import {
  createUser,
  impersonateUser,
  setUserStatus,
  updateUserRole,
  useSession,
} from '../../lib/store';
import PasswordField from '../auth/PasswordField';
import { Badge, Card, DemoBanner, FormField, Modal, PageHeader, SelectBox, inputClass } from './ui';

const ASSIGNABLE_ROLES = (Object.keys(ROLES) as RoleId[]).filter((id) => id !== 'owner');

export default function UsersPage() {
  const { t } = useI18n();
  const { app, can, profile, roleId } = useSession();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<RoleId>('storekeeper');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const users = useMemo(
    () => [...app.users].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [app.users],
  );

  if (!can('users')) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('users.title')} description={t('users.forbidden')} />
        <Card>
          <p className="text-sm text-ink-mute">{t('users.noPermission')}</p>
        </Card>
      </div>
    );
  }

  const resetForm = () => {
    setName('');
    setEmail('');
    setNewRole('storekeeper');
    setPassword('');
    setConfirm('');
    setError('');
  };

  const submit = () => {
    setError('');
    if (password && password.length < 6) {
      setError(t('users.passwordMin'));
      return;
    }
    if (password !== confirm) {
      setError(t('users.passwordMismatch'));
      return;
    }
    try {
      createUser({ name, email, roleId: newRole, password });
      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.createFailed'));
    }
  };

  const onRoleChange = (user: ManagedUser, next: RoleId) => {
    try {
      updateUserRole(user.id, next);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('users.updateFailed'));
    }
  };

  const onToggleStatus = (user: ManagedUser) => {
    try {
      setUserStatus(user.id, user.status === 'active' ? 'disabled' : 'active');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('users.updateFailed'));
    }
  };

  const onImpersonate = (user: ManagedUser) => {
    try {
      impersonateUser(user.id);
      window.location.assign('/app');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('users.impersonateFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        actions={
          <button type="button" className="btn-clay" onClick={() => setOpen(true)}>
            {t('users.newUser')}
          </button>
        }
      />

      <Card title={t('users.accounts')} description={t('users.accountsMeta', { count: users.length })}>
        <ul className="divide-y divide-line">
          {users.map((user) => {
            const isSelf = user.id === profile.id;
            return (
              <li key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{user.name}</p>
                    {isSelf && <Badge tone="slate">{t('users.you')}</Badge>}
                    <Badge tone={user.status === 'active' ? 'success' : 'neutral'}>
                      {user.status === 'active' ? t('users.active') : t('users.disabled')}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-mute">{user.email}</p>
                  <p className="mt-1 text-xs text-ink-mute">{t(ROLES[user.roleId].labelKey)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {user.roleId !== 'owner' ? (
                    <SelectBox
                      id={`role-${user.id}`}
                      value={user.roleId}
                      onChange={(e) => onRoleChange(user, e.target.value as RoleId)}
                      className="min-w-[10rem]"
                      aria-label={t('users.roleOf', { name: user.name })}
                    >
                      {ASSIGNABLE_ROLES.map((id) => (
                        <option key={id} value={id}>
                          {t(ROLES[id].labelKey)}
                        </option>
                      ))}
                    </SelectBox>
                  ) : (
                    <span className="rounded-xl bg-sunken px-3 py-2 text-sm font-semibold text-ink">
                      {t(ROLES.owner.labelKey)}
                    </span>
                  )}
                  <button type="button" className="btn-quiet" onClick={() => onToggleStatus(user)}>
                    {user.status === 'active' ? t('users.disable') : t('users.enable')}
                  </button>
                  {app.demoMode && user.status === 'active' && !isSelf && roleId === 'owner' && (
                    <button type="button" className="btn-quiet" onClick={() => onImpersonate(user)}>
                      {t('users.impersonate')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title={t('users.newUser')} variant="sheet">
        <div className="space-y-4">
          <FormField id="user-name" label={t('users.fullName')}>
            <input id="user-name" className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField id="user-email" label={t('users.email')}>
            <input
              id="user-email"
              type="email"
              className={inputClass()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField id="new-role" label={t('users.role')}>
            <SelectBox id="new-role" value={newRole} onChange={(e) => setNewRole(e.target.value as RoleId)}>
              {ASSIGNABLE_ROLES.map((id) => (
                <option key={id} value={id}>
                  {t(ROLES[id].labelKey)}
                </option>
              ))}
            </SelectBox>
          </FormField>
          <PasswordField
            label={t('users.passwordDemo')}
            withLeadingIcon={false}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordField
            label={t('users.confirmPassword')}
            withLeadingIcon={false}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <p className="text-xs text-ink-mute">{t('users.demoPasswordHint')}</p>
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-quiet flex-1" onClick={() => { setOpen(false); resetForm(); }}>
              {t('users.cancel')}
            </button>
            <button type="button" className="btn-clay flex-1" onClick={submit}>
              {t('users.createAccess')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
