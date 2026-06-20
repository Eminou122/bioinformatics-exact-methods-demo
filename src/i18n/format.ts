import type { TranslationDict } from './types';

/**
 * Retrieves a translated string and performs placeholder substitutions if provided.
 * Example: formatTranslation(dict, 'reasonDisconnected', { nodes: 'R4' })
 */
export function formatTranslation(
  dict: TranslationDict,
  key: keyof TranslationDict,
  replaceMap?: Record<string, string>
): string {
  let text = dict[key] || '';
  if (!replaceMap) {
    return text;
  }
  for (const placeholder in replaceMap) {
    text = text.replace(`{${placeholder}}`, replaceMap[placeholder]);
  }
  return text;
}
