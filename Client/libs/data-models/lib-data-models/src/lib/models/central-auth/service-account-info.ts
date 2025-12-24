export interface ServiceAccountInfo {
  clientID: string;
  name: string;
  email: string;
  isActive: boolean;
  isInternal: boolean;
  accessTokenLifetimeSeconds: number;
  secretExpiresInDays: number;
  secretExpiresOn: Date;
  secretGeneratedDate: Date;
  secretStatus: string;
  scopes: ServiceAccountEndpoint[];
  availableScopes: ServiceAccountEndpoint[];
  clientSites: ServiceAccountSite[];
}

export interface ServiceAccountEndpoint {
  scopeName: string;
  description: string;
}

export interface ServiceAccountSite {
  clientKey: string;
  apiAccess: boolean;
  isActive: boolean;
}

export interface ServiceAccountToggle {
  scopeName: string;
  description: string;
  selected: boolean;
}
