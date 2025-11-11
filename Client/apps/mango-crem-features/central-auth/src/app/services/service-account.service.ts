import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Environment,
  ServiceAccountInfo,
  ServiceAccountChangeHistory,
  UpdateServiceAccountApiAccessRequest,
  UpdateServiceAccountEndPointAccessRequest,
  UpdateServiceAccountExpiresInDaysRequest,
} from '@mango/data-models/lib-data-models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UtilitiesService } from '@mango/core-shared';

@Injectable({
  providedIn: 'root',
})
export class ServiceAccountService {
  identityUrl: string = UtilitiesService.getCABackendBaseApiUrl();

  constructor(private http: HttpClient, private env: Environment) {}

  generateApiKey(): Observable<any> {
    const url = `${this.identityUrl}/serviceaccount/createapikey`;
    const body = {};
    return this.http.post(url, body).pipe<string>(
      tap((response: any) => {
        return response.data;
      })
    );
  }

  getServiceAccountInfo(): Observable<ServiceAccountInfo> {
    return this.http.get<ServiceAccountInfo>(
      `${this.identityUrl}/serviceaccount/accountinfo`,
      { withCredentials: true }
    );
  }

  updateServiceAccountApiAccess(
    request: UpdateServiceAccountApiAccessRequest
  ): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.identityUrl}/serviceaccount/updateapiaccess`,
      request,
      { withCredentials: true }
    );
  }

  updateServiceAccountExpiresInDays(
    request: UpdateServiceAccountExpiresInDaysRequest
  ): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.identityUrl}/serviceaccount/expiresindays`,
      request,
      { withCredentials: true }
    );
  }

  updateServiceAccountEndPointAccess(
    request: UpdateServiceAccountEndPointAccessRequest
  ): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.identityUrl}/serviceaccount/updateendpointaccess`,
      request,
      { withCredentials: true }
    );
  }

  getServiceAccountChangeHistory(): Observable<ServiceAccountChangeHistory[]> {
    return this.http.get<ServiceAccountChangeHistory[]>(
      `${this.identityUrl}/serviceaccount/accounthistory`,
      { withCredentials: true }
    );
  }
}
