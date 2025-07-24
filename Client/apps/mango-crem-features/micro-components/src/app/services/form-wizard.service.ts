import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { environment } from 'apps/mango/src/environments/environment.local';
import { Api, ApiResponse } from '@mango/data-models/lib-data-models';
import { Observable } from 'rxjs';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { AddBuildingRequest } from 'libs/data-models/lib-data-models/src/lib/models/building.interface';

@Injectable()
export class FormWizardService extends EndpointService {
  formWizardUrl: string = UtilitiesService.getBaseApiUrl(Api.formWizard);
  dashboardsUrl: string = UtilitiesService.getBaseApiUrl(Api.dashboards);
  constructor(protected http: HttpClient, @Optional() facade: MangoAppFacade) {
    super(http, facade);
  }

  public getRenderSelect(
    lookupId,
    requestTypeId,
    lookupSql = '0',
    p1 = '0',
    p2 = '0',
    p3 = '0',
    page = 1,
    pageSize = 25,
    isDynamicPopup = false
  ): Observable<ApiResponse> {
    let url = `${this.formWizardUrl}renderSelects`;
    let param = {
      lookupId: lookupId,
      requestType: requestTypeId,
      p1: p1,
      p2: p2,
      p3: p3,
      LookupSQL: requestTypeId == 111 ? '127' : lookupSql,
      page: page,
      pageSize: pageSize,
      isDynamicPopup: isDynamicPopup,
    };

    return this.callHttpGet(url, 'RenderSelects', param);
  }

  public getUserPreferences(): Observable<any> {
    let url = `${this.dashboardsUrl}Dashboards/GetUserPreferences`;
    return this.callHttpGet(url, 'GetUserPreferences');
  }

  public getRedirectorLink(OTID: number, OTTID: number): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/GetRedirectorLink`;
    return this.callHttpGet(url, 'GetRedirectorLink', {
      OTID: OTID,
      OTTID: OTTID,
    });
  }

  public getBuildingLeaseDefaultInfo(
    OID: number,
    OTID: number
  ): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/GetBuildingLeaseDefaultInfo`;
    return this.callHttpGet(url, 'GetBuildingLeaseDefaultInfo', {
      ObjectID: OID,
      ObjectTypeID: OTID,
    });
  }

  public getLeaseInfo(OID: number): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/GetLeaseInfo`;
    return this.callHttpGet(url, 'GetLeaseInfo', {
      ObjectID: OID,
    });
  }

  public addContact(contactRequest: any): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/AddContact`;
    let param = contactRequest;
    return this.callHttpPost(url, 'AddContact', param);
  }

  public addTransaction(transaction: any): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/AddTransaction`;
    let param = transaction;

    return this.callHttpPost(url, 'AddTransaction', param);
  }

  public addBuilding(building: AddBuildingRequest): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/AddBuilding`;
    let param = building;

    return this.callHttpPost(url, 'AddBuilding', param);
  }

  public addSupplier(supplier: any): Observable<any> {
    const url = `${this.formWizardUrl}FormWizards/AddSupplier`;
    return this.callHttpPost(url, 'AddSupplier', supplier);
  }

  public addEquipment(equipment: any): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/AddEquipment`;
    let param = equipment;

    return this.callHttpPost(url, 'AddEquipment', param);
  }

  public getManagers(teamId: number): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/managers`;
    let param = {
      TeamID: teamId,
    };

    return this.callHttpGet(url, 'GetManagers', param);
  }

  public getClientPreferenceByField(field: string): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/GetClientPreferenceByField`;
    return this.callHttpGet(url, 'FormWizards/GetClientPreferenceByField', {
      Pref: field,
    });
  }

  public getProjectWizardClientPreferences(): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/GetProjectWizardClientPreferences`;
    return this.callHttpGet(
      url,
      'FormWizards/GetProjectWizardClientPreferences'
    );
  }

  public getAllUserGroups(): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/GetAllUserGroups`;
    return this.callHttpGet(url, 'FormWizards/GetAllUserGroups');
  }

  public addCompany(company: any): Observable<any> {
    let url = `${this.formWizardUrl}FormWizards/AddCompany`;
    let param = company;
    return this.callHttpPost(url, 'AddCompany', param);
  }

  public addLease(lease: any) {
    let url = `${this.formWizardUrl}FormWizards/AddLease`;
    let param = lease;

    return this.callHttpPost(url, 'AddLease', param);
  }

  public getObjectTypeName(otid: number) {
    let url = `${this.formWizardUrl}FormWizards/GetObjectTypeName/${otid}`;
    return this.callHttpGet(url, 'GetObjectTypeName');
  }

  public getPremiseTypes() {
    let url = `${this.formWizardUrl}FormWizards/GetObjectTypeName`;
    return this.callHttpGet(url, 'GetObjectTypeName');
  }

  public addPremise(
    BuildingID: number,
    ottid: number,
    premiseName: string,
    premiseTypeId: number
  ) {
    let url = `${this.formWizardUrl}FormWizards/AddPremise`;
    return this.callHttpPost(url, 'AddCompany', {
      buildingID: BuildingID,
      premiseName: premiseName,
      objectTypeTypeID: ottid,
      premiseTypeId: premiseTypeId,
    });
  }
}
