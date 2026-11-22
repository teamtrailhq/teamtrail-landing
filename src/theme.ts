import { createTheme } from '@teamtrail/site/browser';

/** The site's day or night look: night unless the visitor chose day. */
export type Look = 'day' | 'night';

/**
 * The site's theme (teamtrail's packages/site): `day` or `night` on `<html data-theme>`, kept in this site's storage
 * and in the `tt_theme` cookie it shares with Teamtrail Cloud. The boot script in every page's head set it first.
 */
export const theme = createTheme({ names: { day: 'day', night: 'night' }, storageKey: 'teamtrail-theme' });

export const isNight = () => theme.isNight();

export const onThemeChange = (listener: () => void) => theme.onChange(listener);
