import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { Api, ApiResponse } from '@mango/data-models/lib-data-models';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { Observable } from 'rxjs';

@Injectable()
export class ObjectActionsService extends EndpointService {
  objectActionsURL = UtilitiesService.getBaseApiUrl(Api.objectActions);
  constructor(protected http: HttpClient, @Optional() facade: MangoAppFacade) {
    super(http, facade);
  }

  public getObjectInfo(
    OID: number,
    OTID: number,
    NavPageId: number
  ): Observable<ApiResponse> {
    return this.callHttpGet(
      `${this.objectActionsURL}objectactions/getobjectinfo?OID=${OID}&OTID=${OTID}&NavPageId=${NavPageId}`,
      'GetObjectInfo'
    );
  }
}
