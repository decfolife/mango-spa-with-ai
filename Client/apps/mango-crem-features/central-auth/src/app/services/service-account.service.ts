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

  generateClientSecret(): Observable<any> {
    const url = `${this.identityUrl}/oauth/secret`;
    const body = {};
    return this.http.post(url, body, { withCredentials: true }).pipe<string>(
      tap((response: any) => {
        console.log(response.data);
        return response.data;
      })
    );
  }

  getServiceAccountInfo(): Observable<ServiceAccountInfo> {
    //console.log(`${this.identityUrl}/oauth/client`);
    return this.http.get<ServiceAccountInfo>(
      `${this.identityUrl}/oauth/client`,
      { withCredentials: true }
    );
  }

  updateServiceAccountApiAccess(
    request: UpdateServiceAccountApiAccessRequest
  ): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.identityUrl}/oauth/api-access`,
      request,
      { withCredentials: true }
    );
  }

  updateServiceAccountExpiresInDays(
    request: UpdateServiceAccountExpiresInDaysRequest
  ): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.identityUrl}/oauth/expires-in-days`,
      request,
      { withCredentials: true }
    );
  }

  updateServiceAccountEndPointAccess(
    request: UpdateServiceAccountEndPointAccessRequest
  ): Observable<boolean> {
    return this.http.put<boolean>(`${this.identityUrl}/oauth/scopes`, request, {
      withCredentials: true,
    });
  }

  getServiceAccountChangeHistory(): Observable<ServiceAccountChangeHistory[]> {
    return this.http.get<ServiceAccountChangeHistory[]>(
      `${this.identityUrl}/oauth/history`,
      { withCredentials: true }
    );
  }
}
