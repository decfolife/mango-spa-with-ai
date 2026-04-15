import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Api,
  ApiResponse,
  ToastState,
  isToastState,
} from '@mango/data-models/lib-data-models';
import { BehaviorSubject, Observable } from 'rxjs';
import { DashboardVm } from '../shared/models/dashboard-model';
import { DataService } from './data.service';
import { MatDialog } from '@angular/material/dialog';
import { GenericErrorComponent } from '../components/dashboard/modal/genericError/genericError.component';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { UtilitiesService } from '@mango/core-shared';
import { AccountingToastService } from 'apps/mango-crem-features/accounting-summary/src/app/services/accounting-toast.service';

@Injectable()
export class DashboardService extends DataService {
  dashboardsUrl: string = UtilitiesService.getBaseApiUrl(Api.dashboards);
  accountingServiceUrl: string = UtilitiesService.getBaseApiUrl(
    Api.accountingService
  );
  private _dashboardId: number;
  private _currentCalendarId: number;
  private hasResponse = true;

  constructor(
    protected http: HttpClient,
    dialog: MatDialog,
    facade: MangoAppFacade,
    private toastService: AccountingToastService
  ) {
    super(http, dialog, facade);
  }

  // VM Data
  private _dashboardData = new BehaviorSubject<DashboardVm>({
    calendarFilterData: [],
    clientSite: '',
    portfolioFilterData: [],
    yearFilterData: [],
    cardsMetaData: [],
    selectedPortfolioIds: '',
    selectedCalendarId: null,
    selectedYear: '',
  });
  DashboardData$ = this._dashboardData.asObservable();

  // Loading indicator that can be called by the service layer
  private _loading = new BehaviorSubject<boolean>(true);
  isLoading$ = this._loading.asObservable();

  public onLoad() {
    // It's assumed loading is TRUE at this point

    this.loadDashboardData().subscribe((apiResponse) => {
      if (apiResponse.success) {
        this._dashboardData.next(apiResponse.data);
        this._loading.next(true);
      } else if (!apiResponse.success) {
        this.errorDialog(apiResponse.clientErrorMessage);
        this._loading.next(false);
      } else {
        // At this point it's either validation issue or dashboard service 500
        this._loading.next(false);
      }
    });

    return this._loading.asObservable();
  }

  public onCalendarChange(calendarId: number) {
    throw 'Not Implemented';
  }

  public errorDialog(errorMsg) {
    this.dialog.open(GenericErrorComponent, {
      width: '600px',
      data: errorMsg,
    });
  }

  public loadDashboardData(): Observable<ApiResponse> {
    const route = `${this.accountingServiceUrl}accounting`;
    return this.getHttpGetApiResponse(route, 'GetDashboardData');
  }

  public getSecurityLevel(): Observable<ApiResponse> {
    const route = `${this.dashboardsUrl}accounting/securitylevel`;
    return this.getHttpGetApiResponse(route, 'GetUserSecurityLevel');
  }

  /**
   *
   *
   * @param {string} message
   * @param {string} type
   * @param {string} [title]
   * @param {number} [duration]
   * @param {string} [maxWidth]
   * @memberof DashboardService
   */
  public showToast(
    message: string,
    type: string,
    title?: string,
    duration?: number
  ) {
    const sticky = !duration;
    if (isToastState(!type)) {
      console.error('An error occurred: ', message);
    }

    switch (type) {
      case ToastState.SUCCESS: {
        this.toastService.showToast(
          message ?? `Operation succeeded.`,
          title ?? 'Success',
          ToastState.SUCCESS,
          sticky,
          duration
        );
        break;
      }
      default:
      case ToastState.ERROR: {
        console.error('An error occurred: ', message);
        this.toastService.showToast(
          message ?? `An error occurred, please try again.`,
          title ?? 'Error',
          ToastState.ERROR,
          sticky,
          duration
        );
        break;
      }
    }
  }
}
