import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { environment } from 'apps/mango/src/environments/environment.local';
import { MapDataRequest } from '../../shared/models/map-data-request';
import {
  ApiResponse,
  GetGridDataRequest,
  GetViewDropdownDataRequest,
  HideListViewRequest,
  LeaseInfo,
  ListView,
  ObjectSecurityRequest,
  SetDefaultListViewRequest,
} from '../../shared/models';
import { Api } from '@mango/data-models/lib-data-models';

@Injectable()
export class ListPageService extends EndpointService {
  listpages: string = UtilitiesService.getBaseApiUrl(Api.listpages);
  formWizard: string = UtilitiesService.getBaseApiUrl(Api.formWizard);
  // financials = 'https://localhost:64062/api/';
  financials: string = UtilitiesService.getBaseApiUrl(Api.financials);

  // this function's endpoint will always go to the ListPage.aspx. This is used to get
  // properties that was passed in as input variables into the old version of the list
  // pages custom element
  getListPageProperties(
    objectId,
    objectTypeId,
    navPageId
  ): Observable<ApiResponse> {
    return this.callHttpGet(
      `${this.listpages}listpage/getlistpageproperties?objectId=${objectId}&objectTypeId=${objectTypeId}&navpageid=${navPageId}`,
      'getlistpageproperties'
    );
  }

  getGridData(request: GetGridDataRequest): Observable<ApiResponse> {
    return this.callHttpPost(
      `${this.listpages}listpage/gridData`,
      'getGridData',
      request
    );
  }

  getListPageColumns(listPageId: number): Observable<ApiResponse> {
    return this.callHttpGet(
      `${this.listpages}listpage/${listPageId}/columnDefinitionList`,
      'getListPageColumns'
    );
  }

  updateListView(listView): Observable<ApiResponse> {
    return this.callHttpPut(
      `${this.listpages}listpage/ListViewUpdate`,
      'updateListView',
      listView
    );
  }

  setDefaultListView(
    request: SetDefaultListViewRequest
  ): Observable<ApiResponse> {
    return this.callHttpPut(
      `${this.listpages}listpage/SetDefaultListView`,
      'setDefaultListView',
      request
    );
  }

  getClientPreferenceByField(Field: string): Observable<any> {
    return this.callHttpGet(
      `${this.formWizard}FormWizards/GetClientPreferenceByField?Pref=${Field}`,
      'getClientPreferenceByField'
    );
  }

  getListView(listView: ListView): Observable<ApiResponse> {
    return this.callHttpGet(
      `${this.listpages}listpage/views/${listView.id}/${listView.listViewType}`,
      'getListView'
    );
  }

  getListViewSelectorItems(
    request: GetViewDropdownDataRequest
  ): Observable<ApiResponse> {
    return this.callHttpGet(
      `${this.listpages}listpage/ListViewSelectorItems/${request.objectTypeId}`,
      'getListViewSelectorItems'
    );
  }

  getAddWizards(
    objectTypeId: number,
    objectTypeTypeId: number,
    navPageId: number
  ): Observable<ApiResponse> {
    return this.callHttpGet(
      `${this.listpages}listpage/addWizards/${objectTypeId}/${objectTypeTypeId}/${navPageId}`,
      'getAddWizards'
    );
  }

  getUserModuleRights(objectTypeIds: string): Observable<ApiResponse> {
    return this.callHttpPost(
      `${this.listpages}listpage/GetUserModuleRights`,
      'getUserModuleRights',
      { objectTypeIds }
    );
  }

  getRedirectorLinkList(): Observable<ApiResponse> {
    return this.callHttpGet(
      `${this.listpages}listpage/RedirectorLinkList`,
      'getRedirectorLinkList'
    );
  }

  getObjectSecurity(request: ObjectSecurityRequest): Observable<ApiResponse> {
    return this.callHttpPost(
      `${this.listpages}listpage/objectSecurity`,
      'getObjectSecurity',
      request
    );
  }

  getDynamicSQL(request: GetGridDataRequest): Observable<ApiResponse> {
    return this.callHttpPost(
      `${this.listpages}listpage/dynamicSQL`,
      'getDynamicSQL',
      request
    );
  }

  createUserListView(userView: ListView): Observable<ApiResponse> {
    return this.callHttpPost(
      `${this.listpages}listpage/views`,
      'createUserListView',
      userView
    );
  }

  deleteUserView(userViewId: number): Observable<ApiResponse> {
    return this.callHttpDelete(
      `${this.listpages}listpage/views/${userViewId}`,
      'deleteUserView'
    );
  }

  getMarkerList(request: MapDataRequest): Observable<ApiResponse> {
    return this.callHttpPost(
      `${this.listpages}listpage/MarkerList`,
      'getMarkerList',
      request
    );
  }

  hideListView(request: HideListViewRequest): Observable<ApiResponse> {
    return this.callHttpPost(
      `${this.listpages}listpage/HideListView`,
      'hideListView',
      request
    );
  }

  getPortfolios() {
    return this.callHttpGet(
      `${this.listpages}listpage/Portfolios`,
      'getPortfolios'
    );
  }

  getGoogleMapAPIKey() {
    const url = `${this.listpages}listpage/GoogleMapAPIKey`;
    return this.callHttpGet(
      `${this.listpages}listpage/GoogleMapAPIKey`,
      'getGoogleMapAPIKey'
    );
  }

  getGoogleMappingChannel() {
    return this.callHttpGet(
      `${this.listpages}listpage/GoogleMappingChannel`,
      'getGoogleMappingChannel'
    );
  }

  getLeaseInfo(leaseAbstractID: number) {
    return this.callHttpGet(
      `${this.financials}Lease/LeaseInfo/${leaseAbstractID}`,
      'getLeaseInfo'
    );
  }

  postLeaseInfo(request: LeaseInfo) {
    return this.callHttpPost(
      `${this.listpages}listpage/Lease/LeaseInfo`,
      'postLeaseInfo',
      request
    );
  }

  copyCharge(glEventID: number) {
    return this.callHttpPost(
      `${this.financials}Lease/CopyCharge`,
      'copyCharge',
      { glEventID }
    );
  }

  deleteCharge(objectTypeTypeId, gLEventIdList: number[]) {
    return this.callHttpDeleteWithBody(
      `${this.financials}lease/DeleteGLEvents`,
      'deleteCharge',
      { objectTypeTypeId, gLEventIdList }
    );
  }

  getGLEventInfo(leaseAbstractID: number, glEventID: number) {
    return this.callHttpGet(
      `${this.financials}Lease/GLEventInfo/${leaseAbstractID}/${glEventID}`,
      'getGLEventInfo'
    );
  }

  deleteLeaseOption(
    leaseOptionId: number,
    leaseAbstractID: number
  ): Observable<any> {
    return this.callHttpDeleteWithBody(
      `${this.financials}lease/DeleteLeaseOption`,
      'deleteLeaseOption',
      { leaseOptionId, leaseAbstractID }
    );
  }

  protected handleError(operation = 'operation not provided') {
    return (error: any): Observable<any> => {
      console.error(operation, error);
      // This code will fire when running locally. If hosted in aspx, the aspx page will
      // likely catch 500 or other status codes and return a ListPageResponse with success=false, which is a 200
      // in the sense of this error handling, therefore, these codes would be bypassed when hosted in aspx.
      if (operation === 'getGridData') {
        if (error.status === 404) {
          return of({
            success: false,
            clientErrorMessage:
              'You do not have permission to access this list view.',
          });
        } else if (error.status === 408) {
          return of({
            success: false,
            clientErrorMessage:
              'The query for this view did not return within ' +
              'the timeout limit. The recommendation is to reduce the number of columns and try ' +
              'again. If this problem persists then the ad-hoc reporting features may yield better results.',
            status: 408,
          });
        }
        return of({
          success: false,
          clientErrorMessage:
            'There was an error retrieving the data for this list view.',
        });
      }
      if (operation === 'getListPageColumns') {
        return of({
          success: false,
          clientErrorMessage:
            'There was an error retrieving the columns for this list view.',
        });
      }
      if (operation == 'getDynamicSQL') {
        return of({
          success: false,
          clientErrorMessage: 'There was an error retrieving the data.',
        });
      }
      return of(null);
    };
  }
}
