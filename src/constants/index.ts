import { appConfig } from "@/config/app";

export const APP_NAME = appConfig.name;
export const APP_VERSION = appConfig.version;
export const COMPANY_NAME = appConfig.companyName;
export const SUPPORT_EMAIL = appConfig.supportEmail;
export const DEFAULT_CURRENCY = appConfig.defaultCurrency;

export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 80;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export { designTokens } from "./design";
export {
  SIDEBAR_LAYOUT_STORAGE_KEY,
  WORKSPACE_TABS_STORAGE_KEY,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_MINI_WIDTH,
  WORKSPACE_MAX_TABS,
} from "./workspace";
