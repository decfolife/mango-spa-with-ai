export interface UpdateServiceAccountApiAccessRequest {
  clientKey: string;
  apiAccess: boolean;
}

export interface UpdateServiceAccountEndPointAccessRequest {
  addScopes: string[];
  removeScopes: string[];
}

export interface UpdateServiceAccountExpiresInDaysRequest {
  expiresInDays?: number;
}
