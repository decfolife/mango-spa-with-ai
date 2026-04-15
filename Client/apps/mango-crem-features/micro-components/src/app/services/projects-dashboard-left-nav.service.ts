import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { Observable } from 'rxjs';
import { Api } from '@mango/data-models/lib-data-models';
import { SharedLeftNavLink } from 'libs/data-models/lib-data-models/src/lib/models/link.interface';
import { RedirectorMapping } from 'libs/data-models/lib-data-models/src/lib/models/redirector-links.interface';

@Injectable()
export class ProjectsDashboardLeftNavService extends EndpointService {
  dashboards: string = UtilitiesService.getBaseApiUrl(Api.dashboards);
  leftNav: string = UtilitiesService.getBaseApiUrl(Api.leftNav); //'http://localhost:5802/api/';

  constructor(protected http: HttpClient, @Optional() facade: MangoAppFacade) {
    super(http, facade);
  }

  DoesUserHaveDocumentStoreViewRights(): Observable<any> {
    const url = `${this.dashboards}Dashboards/DoesUserHaveDocumentStoreViewRights`;
    return this.callHttpGet(url, 'DoesUserHaveDocumentStoreViewRights');
  }

  DoesUserHaveManageTeamListsRights(): Observable<any> {
    const url = `${this.dashboards}Dashboards/DoesUserHaveManageTeamListsRights`;
    return this.callHttpGet(url, 'DoesUserHaveManageTeamListsRights');
  }

  getModuleNavigationLinks(moduleID: number): Observable<SharedLeftNavLink[]> {
    const url = `${this.leftNav}LeftNav/GetModulesNavigationLinks/${moduleID}`;
    return this.callHttpGet(url, 'GetModulesNavigationLinks');
  }

  getModuleNavigationLinksClient(moduleID: number): Observable<any> {
    const url = `${this.leftNav}LeftNav/GetModulesNavigationLinksClient/${moduleID}`;
    return this.callHttpGet(url, 'GetModulesNavigationLinks');
  }

  getModuleNavigationLinksForRenderForm(
    routeUrl: string,
    redirectorMappings: RedirectorMapping[]
  ): Observable<any> {
    let cremUrl = this.findCremUrl(routeUrl, redirectorMappings);
    let encodedUrl = encodeURIComponent(`${cremUrl}`);
    const url = `${this.leftNav}LeftNav/GetRenderFormsNavigationLinks?routeUrl=${encodedUrl}`;
    return this.callHttpGet(url, 'GetModuleNavigationLinksForRenderForm');
  }

  getToolbarModuleLinks(): Observable<any> {
    const url = `${this.leftNav}Navigation/GetSpaNavigationLinks`;
    return this.callHttpGet(url, 'GetToolbarModuleLinks');
  }

  getAdminModulesNavigationLinks(moduleID: number): Observable<any> {
    const url = `${this.leftNav}LeftNav/GetAdminModulesNavigationLinks/${moduleID}`;
    return this.callHttpGet(url, 'GetAdminModulesNavigationLinks');
  }

  // getETLModulesNavigationLinks(): Observable<any> {
  //   const url = `${this.leftNav}LeftNav/GetETLModulesNavigationLinks`;
  //   return this.callHttpGet(url, 'GetETLModulesNavigationLinks');
  // }

  private findCremUrl(
    url: string,
    redirectorMappings: RedirectorMapping[]
  ): string {
    if (url.toLowerCase().indexOf('/v06') >= 0) {
      return url;
    }

    if (!!redirectorMappings) {
      let redirectorMap: RedirectorMapping = null;

      // Clone the mappings to avoid mutating NgRx store state (frozen in dev mode).
      // Also normalize URLs by stripping trailing slashes for consistent comparison.
      const mappings = redirectorMappings.map((rm) => ({
        ...rm,
        cremUrl: rm.cremUrl?.endsWith('/')
          ? rm.cremUrl.slice(0, -1)
          : rm.cremUrl,
        spaUrl: rm.spaUrl?.endsWith('/') ? rm.spaUrl.slice(0, -1) : rm.spaUrl,
      }));

      // Compare just page name (ignore params)
      let redirectorMaps = mappings.filter(
        (x) =>
          x.spaUrl.split('?')[0].toLowerCase() ===
          url.split('?')[0].toLowerCase()
      );

      if (redirectorMaps.length === 1) {
        redirectorMap = redirectorMaps[0];
      } else if (redirectorMaps.length > 1) {
        // If there are duplicate pages,
        // Need to compare with the query param since it can be a page like /ListPage.aspx/?ObjectTypeId=4
        // Only the first query param matters
        redirectorMap = redirectorMaps.find(
          (x) =>
            x.spaUrl.split('&')[0].toLowerCase() ===
            url.split('&')[0].toLowerCase()
        );

        //If a match was not found from the query param of the spaUrl, check the first query param from the cremUrl
        //to the url.  If a match is found use this one, if not use the entry where the cremUrl does not have any query params
        if (!!!redirectorMap) {
          redirectorMap = redirectorMaps.find(
            (x) =>
              x.cremUrl.indexOf('?') >= 0 &&
              x.cremUrl.indexOf('&') >= 0 &&
              url.indexOf(x.cremUrl.split('?')[1].split('&')[0].toLowerCase()) >
                0
          );
        }

        if (!!!redirectorMap) {
          redirectorMap = redirectorMaps.find(
            (x) => x.cremUrl.indexOf('?') < 0
          );
        }
      }

      if (redirectorMap && redirectorMap.cremUrl && redirectorMap.isActive) {
        let queryString = `${url?.split('?')[1] ?? ''}`;
        let newUrl = redirectorMap.cremUrl;

        //newUrl may contain querystring values.  If it is in queryString, remove the string from queryString
        if (newUrl.indexOf('?') >= 0) {
          let newUrlParts = newUrl.split('?');
          let newUrlQueryStringParts = newUrlParts[1].split('&');

          newUrlQueryStringParts.forEach((nuqsPart) => {
            if (queryString.indexOf(nuqsPart.toLowerCase()) >= 0) {
              queryString = queryString.replace(nuqsPart.toLowerCase(), '');
            }

            //Make sure query string starts and do not end with a ampersand
            if (!queryString.startsWith('&')) {
              queryString = `&${queryString}`;
            }

            if (queryString.endsWith('&')) {
              queryString = queryString.slice(0, -1);
            }
          });
        } else {
          queryString = `?${queryString}`;
        }

        if (newUrl.endsWith('/')) {
          newUrl = newUrl.slice(0, -1);
        }

        return newUrl + queryString;
      } else {
        return url;
      }
    } else {
      return url;
    }
  }
}
