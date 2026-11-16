import { Client } from 'appwrite';

const endpoint =
  import.meta.env.PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID || '6af3087500328dafc8ed';

export const isAppwriteConfigured = Boolean(endpoint && projectId);

const client = new Client().setEndpoint(endpoint).setProject(projectId);

export { client };

/** One quiet ping in development only — avoid console noise / info leak in prod. */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const flag = '__bricksAppwritePinged';
  const g = window as Window & { [flag]?: boolean };
  if (!g[flag]) {
    g[flag] = true;
    void client.ping().then(
      (result) => console.info('[Appwrite] ping OK:', result),
      (error) => console.warn('[Appwrite] ping failed:', error),
    );
  }
}
