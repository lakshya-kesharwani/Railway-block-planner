/**
 * Application Configuration & Branding Constants
 * Centralized definition for NIYANTRAN Railway Management System
 */

export const APP_CONFIG = {
  appName: 'NIYANTRAN',
  appTitle: 'NIYANTRAN — AI-Assisted Railway Corridor Maintenance Block Optimization',
  siteTitle: 'NIYANTRAN | Intelligent Railway Maintenance & Traffic Control',
  version: 'v2.4',
  tagline: 'AI-Assisted Corridor Maintenance Block Optimization & Conflict Resolution',
  division: 'South East Central Railway',
  subtitle: 'Intelligent corridor maintenance block scheduling, conflict detection, and traffic control.',
  storagePrefix: 'niyantran'
} as const;

export const APP_NAME = APP_CONFIG.appName;
export const APP_TITLE = APP_CONFIG.appTitle;
export const SITE_TITLE = APP_CONFIG.siteTitle;
export const APP_TAGLINE = APP_CONFIG.tagline;
export const APP_DIVISION = APP_CONFIG.division;
