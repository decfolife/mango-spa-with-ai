import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AuthService,
  EndpointService,
  UtilitiesService,
} from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import {
  Api,
  CentralAuthHttpError,
  CreateClientRequest,
  CreateClientResponse,
} from '@mango/data-models/lib-data-models';

@Injectable({
  providedIn: 'root',
})
export class ClientDeliveryService extends EndpointService {
  authentication: string = UtilitiesService.getBaseApiUrl(Api.authentication);
  public isLoading = false;
  public isErrored = false;
  public requestHasBeenSent = false;

  constructor(
    private authService: AuthService,
    protected http: HttpClient,
    @Optional() facade: MangoAppFacade
  ) {
    super(http, facade);
  }

  getScopes(): Observable<CreateClientResponse> {
    const url = `${this.authentication}admin/oauth/scopes`;
    return this.callHttpGet(url, 'GetOAuthScopes');
  }

  updateServiceAccount(
    contactEmailAddress: string,
    contactID: number,
    contactActiveFlg: boolean
  ): Observable<any> {
    const url = `${this.authentication}oauth`;
    var reqbody = {
      email: contactEmailAddress,
      contactID: contactID,
      isActive: contactActiveFlg,
    };
    return this.callHttpPut(url, 'UpdateServiceAccount', reqbody);
  }

  addServiceAccount(request: CreateClientRequest): Observable<any> {
    const url = `${this.authentication}oauth`;
    return this.callHttpPost(url, 'AddServiceAccount', request);
  }

  resetPassword(emailAddress: string): Observable<any> {
    // //TODO: Integrate API call
    // const url = `${environment.appUrls.clientDelivery}ResetPassword/${emailAddress}`;
    // return this.callHttpPost(url, 'ResetPassword', {emailAddress})
    let cKey: string;
    this.facade.clientKey$.subscribe((clientKey) => {
      cKey = clientKey;
    });

    const request = { email: emailAddress, clientKey: cKey };

    this.authService.forceExpirePassword(request).subscribe(
      () => this.sendRequestSuccess(),
      (error) => this.sendRequestFailed(error)
    );
    return of(true);
  }

  private sendRequestSuccess() {
    this.isLoading = false;
    this.isErrored = false;
    this.requestHasBeenSent = true;
  }

  private sendRequestFailed(error: CentralAuthHttpError) {
    this.requestHasBeenSent = false;
    this.isLoading = false;
    this.isErrored = true;
  }
}
