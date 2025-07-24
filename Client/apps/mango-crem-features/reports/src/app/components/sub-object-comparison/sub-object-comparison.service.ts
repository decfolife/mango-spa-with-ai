import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../mango/src/environments/environment.local';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { SubObjectComparisonDataRequest } from './sub-object-comparison.model';
import { Api } from '@mango/data-models/lib-data-models';

@Injectable()
export class SubObjectComparisonService extends EndpointService {
  reportsUrl: string = UtilitiesService.getBaseApiUrl(Api.reports);

  constructor(protected http: HttpClient, @Optional() facade: MangoAppFacade) {
    super(http, facade);
  }

  getSubObjectsComparisonData(
    formId,
    childObjectTypeId,
    widgetId,
    subObjectIds
  ): Observable<any> {
    // FormId = 221;
    // ObjectTypeId = 45;
    // FormSectionGRoupID = null;
    // ReturnFormat = 2;
    // ObjectIds = "3819,3856,3868";
    const objectIdValue = subObjectIds?.join(',');

    const request: SubObjectComparisonDataRequest = {
      formId: formId,
      objectTypeId: childObjectTypeId,
      formSectionGroupID: null,
      returnFormat: 4,
      objectIds: objectIdValue,
      widgetId: widgetId,
    };

    const url = `${this.reportsUrl}SubObjects/GetSubObjectsComparisonData`;
    return this.callHttpPost(url, 'getSubObjectsComparisonData', request);
  }
}
