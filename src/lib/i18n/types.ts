export type Locale = 'en' | 'fr';

export type MessageTree = { [key: string]: string | MessageTree };

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;
