import { Account } from 'appwrite';
import { client, isAppwriteConfigured } from './appwrite';

/** Live Appwrite when public env (or built-in fallbacks) resolve to a project. */
export const isAppwriteLive = isAppwriteConfigured;

/** Presentation demo stays available unless explicitly disabled. */
export const isDemoEnabled = import.meta.env.PUBLIC_DISABLE_DEMO !== '1';

const AUTH_TIMEOUT_MS = 4000;

export function getBrowserClient() {
  return client;
}

export function getAccount() {
  return new Account(client);
}

export type AuthState =
  | { status: 'demo' }
  | { status: 'anonymous' }
  | { status: 'granted'; email: string; name: string; userId: string };

export const DEMO_SESSION_KEY = 'br-auth-demo';
export const AUTH_COOKIE = 'br-auth';

function writeAuthCookie(value: 'demo' | 'live') {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=${value}; Path=/; SameSite=Lax; Max-Age=604800`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasDemoSessionFlag() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DEMO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('auth-timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function getAuthState(): Promise<AuthState> {
  // Demo sessions must not wait on Appwrite — that left the shell blank for 30–60s.
  if (isDemoEnabled && hasDemoSessionFlag()) {
    writeAuthCookie('demo');
    return { status: 'demo' };
  }

  try {
    const user = await withTimeout(getAccount().get(), AUTH_TIMEOUT_MS);
    writeAuthCookie('live');
    return { status: 'granted', email: user.email, name: user.name, userId: user.$id };
  } catch {
    return { status: 'anonymous' };
  }
}

export async function signIn(email: string, password: string) {
  const account = getAccount();
  await account.createEmailPasswordSession(email, password);
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* ignore */
  }
  writeAuthCookie('live');
  return { mode: 'live' as const };
}

export async function signOut() {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* ignore */
  }
  clearAuthCookie();
  try {
    await getAccount().deleteSession('current');
  } catch {
    // No live session — demo or already signed out.
  }
}

export function enterDemoSession() {
  if (!isDemoEnabled) {
    throw new Error('Mode démonstration désactivé');
  }
  sessionStorage.setItem(DEMO_SESSION_KEY, '1');
  writeAuthCookie('demo');
}
