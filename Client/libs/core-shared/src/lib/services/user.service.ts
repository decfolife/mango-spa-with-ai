import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ContactRecord,
  Api,
  CurrencyMapping,
  StartPage,
} from '@mango/data-models/lib-data-models';
import { Observable } from 'rxjs';
import { UtilitiesService } from '@mango/core-shared';
import { ContactPreferences } from 'libs/data-models/lib-data-models/src/lib/models/contact.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  userMaintenanceUrl: string = UtilitiesService.getBaseApiUrl(
    Api.userMaintenance
  );

  quickSearchUrl: string = UtilitiesService.getBaseApiUrl(Api.quickSearch);

  projects: string = UtilitiesService.getBaseApiUrl(Api.projects);
  currencyMappingTable$: Observable<CurrencyMapping[]>;

  constructor(private http: HttpClient) {
    this.currencyMappingTable$ = this.getCurrencyMappings();
  }

  getContactRecords(email: string): Observable<ContactRecord[]> {
    return this.http.get<ContactRecord[]>(
      `${this.userMaintenanceUrl}usermaintenance/getusers/${email}`
    );
  }

  getContactRecord(contactId: number): Observable<ContactRecord> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.get<ContactRecord>(
      `${this.userMaintenanceUrl}usermaintenance/getuser/${contactId}`,
      { headers: headers }
    );
  }

  hasMultipleContactRecords(email: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.userMaintenanceUrl}usermaintenance/hasmultipleusers/${email}`
    );
  }

  hasSecurityProfiles(): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.userMaintenanceUrl}usermaintenance/hassecurityprofiles`
    );
  }

  getCurrencyMappings() {
    return this.http.get<CurrencyMapping[]>(
      `${this.userMaintenanceUrl}usermaintenance/getcurrencymappings`
    );
  }

  getPossibleUserStartPages() {
    return this.http.get<any>(
      `${this.userMaintenanceUrl}usermaintenance/GetPossibleUserStartPages`
    );
  }

  getMeasurementUnits() {
    return this.http.get<any>(
      `${this.userMaintenanceUrl}usermaintenance/GetMeasurementUnits`
    );
  }

  updateUserPreferences(updatedPreferences: ContactPreferences) {
    return this.http.put(
      `${this.userMaintenanceUrl}usermaintenance/UpdateUserPreferences`,
      { preferences: updatedPreferences }
    );
  }

  getUserRights(objectType: number, objectId: number, securityType: number) {
    const url = `${this.projects}projects/GetUserRights`;

    return this.http.post(url, {
      objectType,
      objectId,
      securityType,
    });
  }

  getUserQuickSearchModules() {
    return this.http.get<any>(
      `${this.quickSearchUrl}quicksearch/getmodulevalues`
    );
  }
}
