import { Injectable } from '@angular/core';
import { DataIdBreadcrumbProviderService } from '@mango/core-shared';
import { MangoAppFacade } from '../+state/app/app.facade';
import { BreadCrumb } from '@mango/data-models/lib-data-models';
import { Observable } from 'rxjs';

/**
 * This service is used to inject breadcrumbs into shared components
 * without breaking the modularity of the library. If breadcrumbs are not available
 * within a shared component, the library should handle it gracefully.
 */
@Injectable()
export class DataIdService extends DataIdBreadcrumbProviderService {
  constructor(private mangoFacade: MangoAppFacade) {
    super();
  }

  getBreadcrumbs(): Observable<BreadCrumb[]> {
    return this.mangoFacade.breadcrumbs$;
  }
}
