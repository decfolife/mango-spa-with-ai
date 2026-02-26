import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { UserService, UtilitiesService } from '@mango/core-shared';
import {
  OAUTH_CLIENT_KEY_QUERY_PARAM,
  OAUTH_CONTACT_ID_QUERY_PARAM,
  OAUTH_REDIRECT_QUERY_PARAM,
} from '@mango/data-models/lib-data-models';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { SharedLeftNavLink } from 'libs/data-models/lib-data-models/src/lib/models/link.interface';
import { RedirectorMapping } from 'libs/data-models/lib-data-models/src/lib/models/redirector-links.interface';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MangoNavigationService {
  authorizeUrls: string[] = ['crem/projects/project-tasks'];

  constructor(
    private router: Router,
    private routerLocation: Location,
    private userService: UserService
  ) {}

  /**
   * Handles routing for SPA only.
   * Query params can either be provided separately OR as part of the path parameter
   *
   * e.g. Path only: '/projects/dashboard'
   *
   * e.g. Full url: 'https://blank.app.test.corp.virtualpremise.com:30443/crem/projects'
   *
   * @param {string} path - Full url OR path to navigate to.
   * @param {Params} queryParams - optional query params.
   */
  navigateTo(path: string, queryParams?: Params) {
    let isUrl = UtilitiesService.isValidUrl(path);
    if (isUrl) {
      if (queryParams) {
        const params = new URLSearchParams(queryParams as any).toString();
        path += `?${params}`;
      }

      this.router.navigateByUrl(path);
      return;
    }

    this.router.navigate([path], { queryParams: queryParams });
  }

  /**
   * Handles routing for V06 - ASPX and Classic ASP pages.
   * Query params can either be provided separately OR as part of the path parameter
   *
   * e.g. Path only: '/financials/EditCharge.aspx'
   *
   * e.g. Full url: 'https://blank.app.test.corp.virtualpremise.com:30443/v06/Forms/RenderForm.aspx?oid=859&otid=3&ottid=300'
   *
   * @param {string} path - Full url OR path to navigate to.
   * @param {Params} queryParams - optional query params.
   */
  navigateToV06(path: string, queryParams?: Params): void {
    let isUrl = UtilitiesService.isValidUrl(path);
    let clientKey = UtilitiesService.getClientKeyFromUrl();

    let v06Url = isUrl
      ? path
      : `${environment.cremBaseUrl.replace('[CLIENT]', clientKey)}`;

    if (!isUrl) {
      v06Url += path.includes('/v06/') ? `/${path}` : `/v06/${path}`;
    }

    if (queryParams) {
      const params = new URLSearchParams(queryParams as any).toString();
      v06Url += `?${params}`;
    }

    if (path.includes('.aspx')) {
      window.location.href = v06Url;
      return;
    }

    // Must be a classic asp page
    this.navigateToClassicAspUrl(v06Url);
  }

  navigateToClassicAspAdminUrl(
    path: string,
    options?: { queryParams?: Params; newTab?: boolean }
  ): void {
    const isUrl = UtilitiesService.isValidUrl(path);
    const clientKey = UtilitiesService.getClientKeyFromUrl();

    let v06Url = isUrl
      ? path
      : `${environment.cremBaseUrl.replace('[CLIENT]', clientKey)}`;

    if (!isUrl) {
      v06Url += path;
    }

    if (options?.queryParams) {
      const params = new URLSearchParams(options.queryParams).toString();
      v06Url += `?${params}`;
    }

    this.navigateToClassicAspUrl(v06Url, options?.newTab || true);
  }

  navigateToExternalUrl(url: string) {
    window.location.href = url;
  }

  handleLeftNavNavigation(
    navLink: SharedLeftNavLink,
    clientKey: string,
    redirectorMappings: RedirectorMapping[]
  ): void {
    let isCategory =
      !navLink.hasOwnProperty('dynamicName') &&
      navLink.hasOwnProperty('categoryHasFlyOutMenu') &&
      navLink.categoryHasFlyOutMenu;

    // When the linkUrl is an anchor link we need to scroll to the anchor.
    if (!isCategory && navLink.linkUrl.startsWith('#')) {
      this.scrollToAnchor(navLink.linkUrl);
      return;
    }

    // When navLink is the link for a category we need to navigate to the category url
    let redirectionUrl = isCategory ? navLink.categoryLinkUrl : navLink.linkUrl;
    redirectionUrl = `${
      redirectionUrl.startsWith('/') ? '' : '/'
    }${redirectionUrl}`;

    // if redirectionUrl contains a slash at the end, trim it!
    if (redirectionUrl.endsWith('/')) {
      redirectionUrl = redirectionUrl.slice(0, -1);
    }

    let redirectorMap: RedirectorMapping = null;

    // Compare just page name (ignore params)
    let redirectorMaps = redirectorMappings.filter(
      (x) =>
        x.cremUrl.split('?')[0].toLowerCase() ===
        redirectionUrl.split('?')[0].toLowerCase()
    );

    if (redirectorMaps.length === 1) {
      redirectorMap = redirectorMaps[0];
    } else if (redirectorMaps.length > 1) {
      // If there are duplicate pages,
      // Need to compare with the query param since it can be a page like /ListPage.aspx/?ObjectTypeId=4
      // Only the first query param matters
      redirectorMap = redirectorMaps.find(
        (x) =>
          x.cremUrl.split('&')[0].toLowerCase() ===
          redirectionUrl.split('&')[0].toLowerCase()
      );
    }

    if (redirectorMap && redirectorMap.spaUrl && redirectorMap.isActive) {
      let queryString = `?${redirectionUrl?.split('?')[1] ?? ''}`;
      let params = UtilitiesService.queryStringToParams(queryString);
      this.navigateTo(redirectorMap.spaUrl, params);
      return;
    }

    this.navigateToV06(redirectionUrl);
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  redirectToCentralAuth(includeRedirectUri: boolean = true): void {
    let clientKey = UtilitiesService.getClientKeyFromUrl();
    let caUrl = UtilitiesService.isLocalEnvironment()
      ? environment.CAUrl
      : `${environment.CAUrl}/${clientKey}`;

    const urlParts = this.routerLocation.path().split('?');
    const extraParamsIndex = urlParts.findIndex(
      (urlPart) =>
        urlPart.includes(OAUTH_CLIENT_KEY_QUERY_PARAM) ||
        urlPart.includes(OAUTH_CONTACT_ID_QUERY_PARAM)
    );

    const redirectUri = urlParts
      .filter((urlPart, index) => index !== extraParamsIndex)
      .join('?');

    let url = `${caUrl}?${
      extraParamsIndex !== -1 ? `${urlParts[extraParamsIndex]}&` : ''
    }${OAUTH_REDIRECT_QUERY_PARAM}=${`${window.location.origin}/auth/validate`}`;

    if (includeRedirectUri) {
      url += `?redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    window.location.href = url;
  }

  redirectToV06Logout(): void {
    let clientKey = UtilitiesService.getClientKeyFromUrl();
    let url = `${environment.cremBaseUrl.replace(
      '[CLIENT]',
      clientKey
    )}/v06/logout.aspx`;
    window.location.href = url;
  }

  redirectToV06Login(authCode: string): void {
    let clientKey = UtilitiesService.getClientKeyFromUrl();
    let url = `${environment.cremBaseUrl.replace(
      '[CLIENT]',
      clientKey
    )}/v06/login.aspx?auth_code=${authCode}&source=spa`;
    window.location.href = url;
  }

  redirectToV06(path: string, params: URLSearchParams): void {
    let clientKey = UtilitiesService.getClientKeyFromUrl();
    let url = `${environment.cremBaseUrl.replace(
      '[CLIENT]',
      clientKey
    )}/v06/${path}?${params.toString()}`;

    if (UtilitiesService.isLocalEnvironment()) {
      console.log(`Faking a redirect to V06 URL: ${url}`);
      return;
    }

    window.location.href = url;
  }

  extractValue(data, key) {
    const rx = new RegExp(key + '=(.*?)\\s+(&|?)');
    const values = rx.exec(data); // or: data.match(rx);
    return values && values[1];
  }

  // This is used because v06 needs a referer header when opening a classic asp page
  navigateToClassicAspUrl(url: string, newTab = false) {
    const f = document.createElement('FORM') as HTMLFormElement;
    f.action = url;

    if (newTab) {
      f.target = '_blank';
    }

    const indexQM = url.indexOf('?');
    if (indexQM >= 0) {
      const params = url.substring(indexQM + 1).split('&');
      for (let i = 0; i < params.length; i++) {
        const keyValuePair = params[i].split('=');
        const input = document.createElement('INPUT') as any;
        input.type = 'hidden';
        input.name = keyValuePair[0];
        input.value = keyValuePair[1];
        f.appendChild(input);
      }
    }

    document.body.appendChild(f);
    f.submit();
  }

  checkUserRights(spaUrl: string, queryParamsStr: string): Observable<boolean> {
    //Check to see if our url is in the authorizeUrls array
    let foundIndex = this.authorizeUrls.findIndex((au) => spaUrl.indexOf(au));
    if (foundIndex < 0) {
      return of(true);
    }

    if (!queryParamsStr.toLowerCase().includes('otid')) {
      return of(true);
    }

    let queryParams = queryParamsStr.toLowerCase().split('&');
    let objType = queryParams
      .find((qp) => qp.indexOf('otid') >= 0)
      .split('=')[1];
    let objId = queryParams.find((qp) => qp.indexOf('oid') >= 0).split('=')[1];

    if (!!objType && !!objId) {
      return this.userService
        .getUserRights(Number(objType), Number(objId), 2)
        .pipe(
          map((res: any) => {
            if (!!res && res.success) {
              return res.data;
            }
          })
        );
    }

    return of(false);
  }

  // Scroll to the anchor element ID
  scrollToAnchor(elementId: string) {
    document
      .getElementById(elementId.replace('#', ''))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
