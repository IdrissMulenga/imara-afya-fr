// The Terms of use and Privacy policy pages, served by the backend at /terms and /privacy, opened
// in the in-app browser. The pages are in English and French; French opens at its own section.
import * as WebBrowser from 'expo-web-browser';
import { GRAPHQL_URL } from './apollo';
import type { Lang } from '@/theme/i18n';

export type LegalDoc = 'terms' | 'privacy';

/** The page's address: the backend's origin, the page, and #fr for French. */
export const legalUrl = (doc: LegalDoc, lang: Lang): string =>
  `${GRAPHQL_URL.replace(/\/graphql\/?$/, '')}/${doc}${lang === 'fr' ? '#fr' : ''}`;

/** Opens the page; does nothing if the phone has no browser to show it. */
export const openLegal = (doc: LegalDoc, lang: Lang): void => {
  WebBrowser.openBrowserAsync(legalUrl(doc, lang)).catch(() => {});
};
