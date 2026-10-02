import type { Locale } from '@/storage/schemas';
import { en, type MessageKey, type Messages } from './en';

export const MESSAGES: Record<Locale, Messages> = { en };

export type TranslateParams = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: TranslateParams) => string;

export function createTranslator(locale: Locale): Translate {
  const messages = MESSAGES[locale];
  return (key, params) => {
    const template = messages[key];
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  };
}
