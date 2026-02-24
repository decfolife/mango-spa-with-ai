import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { ServiceAccount } from '../../../../../../../libs/data-models/lib-data-models/src/lib/models/service-account/service-account';
import { LatestSyncInfo } from '../../../../../../../libs/data-models/lib-data-models/src/lib/models/service-account/latest-sync-info.interface';
import { ServiceAccountHistory } from '../../../../../../../libs/data-models/lib-data-models/src/lib/models/service-account/service-account-history';
import { map } from 'rxjs/operators';
import { Api } from '@mango/data-models/lib-data-models';

@Injectable()
export class UserMaintenanceService extends EndpointService {
  userMaintenanceUrl: string = UtilitiesService.getBaseApiUrl(
    Api.userMaintenance
  );

  constructor(protected http: HttpClient, @Optional() facade: MangoAppFacade) {
    super(http, facade);
  }

  getUserList(filter: string): Observable<any> {
    const request: { UserListFilter: string } = { UserListFilter: filter };
    const url = `${this.userMaintenanceUrl}UserMaintenance/GetUserList`;
    return this.callHttpPost(url, 'GetUserList', request);
  }

  deleteUser(contactID: number): Observable<any> {
    const url =
      `${this.userMaintenanceUrl}UserMaintenance/DeleteUser/` +
      contactID.toString();
    return this.callHttpPost(url, 'DeleteUser', {});
  }

  getHasAdminLinkRights(): Observable<any> {
    const url = `${this.userMaintenanceUrl}UserMaintenance/GetHasAdminLinkRights`;
    return this.callHttpGet(url, 'GetHasAdminLinkRights');
  }

  getUserFormId(): Observable<any> {
    const url = `${this.userMaintenanceUrl}UserMaintenance/GetUserFormId`;
    return this.callHttpGet(url, 'GetUserFormId');
  }

  syncOnPremToAWS(): Observable<any> {
    const url = `${this.userMaintenanceUrl}ServiceAccounts/SyncOnPremToAWS`;
    return this.callHttpPost(url, 'SyncOnPremToAWS', {});
  }

  getLatestSyncInfo(): Observable<LatestSyncInfo> {
    const url = `${this.userMaintenanceUrl}ServiceAccounts/latestsyncinfo`;
    return this.callHttpGet(url, 'LastSyncInfo', {}).pipe(
      map((x) => x.data as LatestSyncInfo)
    );
  }

  getServiceAccounts(): Observable<ServiceAccount[]> {
    const url = `${this.userMaintenanceUrl}serviceaccounts`;
    return this.callHttpGet(url, 'GetServiceAccounts').pipe(
      map((x) => x.data as ServiceAccount[])
    );
  }

  getServiceAccountChangeHistory(
    contactId: number
  ): Observable<ServiceAccountHistory[]> {
    const url = `${this.userMaintenanceUrl}serviceaccounts/${contactId}/history`;
    return this.callHttpGet(url, 'GetServiceAccountChangeHistory').pipe(
      map((x) => x.data as ServiceAccountHistory[])
    );
  }
}
