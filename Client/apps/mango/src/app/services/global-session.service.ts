import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService, UtilitiesService } from '@mango/core-shared';
import { BreadCrumb, V06Breadcrumb } from '@mango/data-models/lib-data-models';

@Injectable()
export class GlobalSessionService {
  static generateMangoBreadcrumbs(
    v06Breadcrumbs: V06Breadcrumb[]
  ): BreadCrumb[] {
    return v06Breadcrumbs
      .filter(
        (v06Breadcrumb: V06Breadcrumb) =>
          v06Breadcrumb.label && v06Breadcrumb.url
      )
      .map((v06Breadcrumb: V06Breadcrumb) => {
        // Read query params from url since v06 always puts it in the URL.
        let params = UtilitiesService.queryStringToParams(v06Breadcrumb.url);
        let url = v06Breadcrumb.url?.split('?')[0];

        return {
          label: v06Breadcrumb.label,
          url: url,
          params: params ?? {}, 
          activeLink: '',
        }
      });
  }

  static generateV06Breadcrumbs(
    mangoBreadrcumbs: BreadCrumb[]
  ): V06Breadcrumb[] {
    return mangoBreadrcumbs.map((mangoBreadcrumb: BreadCrumb) => ({
      label: mangoBreadcrumb.label,
      url: `${mangoBreadcrumb.url}${UtilitiesService.paramsToQueryString(mangoBreadcrumb.params)}`,
      activeLink: mangoBreadcrumb.activeLink,
      append: '',
    }));
  }

  static setBreadcrumbsCookieProperty(breadCrumbs: BreadCrumb[]): void {
    if (!breadCrumbs || breadCrumbs.length === 0) return;

    let sharedInfo = CookieService.getSharedInfoCookie();
    if (!sharedInfo) return;

    const v06Breadcrumbs =
      GlobalSessionService.generateV06Breadcrumbs(breadCrumbs);

    sharedInfo.BreadCrumbs = JSON.stringify(v06Breadcrumbs);

    CookieService.setSharedInfoCookie(sharedInfo);
  }
}
