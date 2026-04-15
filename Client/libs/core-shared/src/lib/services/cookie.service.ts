import { Injectable } from '@angular/core';
import { UtilitiesService } from '@mango/core-shared';
import { SharedInfo } from '@mango/data-models/lib-data-models';

@Injectable()
/**
 * Provides a wrapper for accessing cookies that are accessible via JS.
 */
export class CookieService {
  public static readonly SHARED_INFO_COOKIE = '.SharedInfo';
  public static readonly EXPIRES_PROPERTY = 'expires';

  public static get(name: string): string {
    const cookies = document.cookie.split(';').map((item) => item.trim());

    for (let i = 0; i < cookies.length; i++) {
      const [key, value] = cookies[i].split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }

    return '';
  }

  public static getCookie<T>(name: string): T {
    let data = this.get(name);
    if (!data) return null;

    return <T>JSON.parse(data);
  }

  public static getSpecificValue(propertyName: string): string {
    const data = document.cookie
      .split(';')
      .find((item) => item.includes(propertyName));
    if (!data) return null;

    return data.split('=')[1];
  }

  public static set(
    name: string,
    value: string,
    expireHours: number,
    path: string = ''
  ) {
    let d: Date = new Date();
    let seconds = expireHours * 3600;
    d.setTime(d.getTime() + seconds * 1000);

    let expires: string = `expires=${d.toUTCString()}`;
    let cpath: string = path ? `path=${path}` : '';

    const isLocal = UtilitiesService.isLocalEnvironment();
    let sameSite: string = isLocal ? 'SameSite=None' : 'SameSite=Strict';

    document.cookie = `${name}=${value}; ${expires};${cpath};${sameSite};Secure`;
  }

  public static delete(name: string) {
    this.set(name, '', -1);
  }

  // Shared info cookie used by both SPA and V06 to share non-sensitive data
  public static getSharedInfoCookie(): SharedInfo {
    let clientKey = UtilitiesService.getClientKeyFromUrl();
    const cookieName = `${clientKey}${CookieService.SHARED_INFO_COOKIE}`;

    let data = this.get(cookieName);
    if (!data) return null;

    return JSON.parse(data);
  }

  public static setSharedInfoCookie(
    sharedInfo: SharedInfo,
    expireHours: number = 8
  ) {
    let clientKey = UtilitiesService.getClientKeyFromUrl();
    const cookieName = `${clientKey}${CookieService.SHARED_INFO_COOKIE}`;

    let d: Date = new Date();
    let seconds = expireHours * 3600;
    d.setTime(d.getTime() + seconds * 1000);

    let expires: string = d.toUTCString();
    let domain: string = `.${window.location.hostname
      .split('.')
      .splice(2)
      .join('.')}`;
    const data = encodeURIComponent(JSON.stringify(sharedInfo));

    const isLocal = UtilitiesService.isLocalEnvironment();
    let sameSite: string = isLocal ? 'SameSite=None' : 'SameSite=Strict';

    document.cookie = `${cookieName}=${data}; domain=${domain}; expires=${expires};path=/;${sameSite};Secure`;
  }

  public static isV06Idle(): boolean {
    let sharedInfo = CookieService.getSharedInfoCookie();

    if (!sharedInfo) return true;

    return sharedInfo.V06Idle;
  }

  public static setMangoIdleCookieProperty(isMangoIdle: boolean): void {
    let sharedInfo = CookieService.getSharedInfoCookie();
    if (!sharedInfo) return;

    //if (sharedInfo.mangoIdle === isMangoIdle) return

    sharedInfo.MangoIdle = isMangoIdle;

    // Always default this value to true. V06 is responsible for updating this value
    sharedInfo.V06Idle = true;

    CookieService.setSharedInfoCookie(sharedInfo);
  }

  public static setQuickSearchCookieProperties(
    searchCriteria: string,
    moduleCriteria: string
  ): void {
    let sharedInfo = CookieService.getSharedInfoCookie();
    if (!sharedInfo) return;

    sharedInfo.QSSearchCriteria = searchCriteria;
    sharedInfo.QSModuleCriteria = moduleCriteria;

    CookieService.setSharedInfoCookie(sharedInfo);
  }
  // Shared info cookie used by both SPA and V06
}
