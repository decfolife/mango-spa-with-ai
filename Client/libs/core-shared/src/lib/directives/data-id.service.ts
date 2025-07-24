import { Observable } from 'rxjs';
import { BreadCrumb } from '@mango/data-models/lib-data-models';

/**
 * A shared layer for accessing the breadcrumbs state to generate `data-id` attributes,
 * ensuring dynamic, persistent, and consistently named data-ids for Pendo tracking and tests.
 * This is meant to be used along side the `CremDataIdDirective` directive.
 */
export abstract class DataIdBreadcrumbProviderService {
  abstract getBreadcrumbs(): Observable<BreadCrumb[]>;
}
