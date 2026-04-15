import { SharedLeftNavLink } from 'libs/data-models/lib-data-models/src/lib/models/link.interface';
export interface Module {
  objectTypeTypeId: number;
  objectTypeType: string;
}

export interface NavLinksByCategory {
  category: string;
  categoryHasFlyOutMenu: boolean;
  categoryIsCurrentlyActiveLink: boolean;
  categoryLinkUrl: string;
  categorySpaUrl: string;
  categorySpaQueryParameters?: string;
  categoryModuleID: number;
  children: SharedLeftNavLink[];
}
