import { Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EndpointService } from './endpoint.service';
import { environment } from '../../../../../apps/mango/src/environments/environment.local';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { Observable } from 'rxjs';
import { UtilitiesService } from '@mango/core-shared';
import { Api } from '@mango/data-models/lib-data-models';

@Injectable({
  providedIn: 'root',
})
export class HeaderService extends EndpointService {
  headerServiceUrl: string = UtilitiesService.getBaseApiUrl(Api.header);

  constructor(protected http: HttpClient, @Optional() facade: MangoAppFacade) {
    super(http, facade);
  }

  getUserModules(): Observable<any> {
    const url = `${this.headerServiceUrl}Header/GetUserModules`;
    return this.callHttpGet(url, 'GetUserModules');
  }

  getDBLastRestore(): Observable<any> {
    const url = `${this.headerServiceUrl}Header/GetDBLastRestore`;
    return this.callHttpGet(url, 'GetDBLastRestore');
  }

  getClientLogoFile(): Observable<Blob> {
    const url = `${this.headerServiceUrl}Header/GetClientLogoFile`;
    return this.callHttpGetBlob(url, 'GetClientLogoFile');
  }
}
