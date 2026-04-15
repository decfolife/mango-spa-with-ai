import { V06Breadcrumb } from './bread-crumb.interface';

// export interface V06GlobalSession {
//   currencyFormat?: string;
//   breadCrumbs?: V06Breadcrumb[];
// }

// export interface GlobalSessionHttpObject {
//   data: V06GlobalSession;
// }

// Used to share small and non-sensitive data between MangoSPA and V06
export interface SharedInfo {
  ClientIdleTimeout: number;
  MangoIdle: boolean;
  V06Idle: boolean;
  ProfileName: string;
  CurrencyFormat?: string;
  // BreadCrumbs?: V06Breadcrumb[];
  BreadCrumbs?: string; // v06 has this set to a string
  QSSearchCriteria?: string;
  QSModuleCriteria?: string;
}
