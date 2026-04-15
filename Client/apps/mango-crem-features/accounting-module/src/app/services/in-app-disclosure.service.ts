import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import {
  Api,
  CardRequest,
  CardConfig,
  DashboardConfig,
} from '@mango/data-models/lib-data-models';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { BehaviorSubject, from, Observable, of, Subscription } from 'rxjs';
import {
  catchError,
  map,
  switchMap,
  tap,
  debounceTime,
  filter,
} from 'rxjs/operators';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';

import {
  CurrencyPrecisionSchema,
  DashboardSchema,
  IADCardSchema,
  SegmentListSchema,
} from '../shared/models/cards.schema';
import { UtilityService } from './utility.service';
import { DashboardService } from '@accounting-dashboard/services/dashboard.service';
import { StorageService } from '@mango/core-shared';
import { DataService } from './data.service';

interface DashboardViewDataSubject {
  IADCardData: any[];
  pivotDataSources: any[];
  gridDataSources: any[];
  cardFieldConfigs: any[];
  decimalPrecision: number;
  localCardConfig: CardConfig[];
  cache?: boolean;
  cardRequest?: CardRequest;
}
interface DashboardViewDataStore {
  IADCardConfigs: any[];
  cardRequest: CardRequest;
  decimalPrecision: number;
  gridDataSources: any[];
  expiration: number;
  localCardConfig: any[];
  cache?: boolean;
}

@Injectable()
export class InAppDisclosureService extends EndpointService {
  reportsUrl: string = UtilitiesService.getBaseApiUrl(Api.reports);
  accountingServiceUrl: string = UtilitiesService.getBaseApiUrl(
    Api.accountingService
  );
  dashboardsUrl: string = UtilitiesService.getBaseApiUrl(Api.dashboards);
  public dateFormat: string;
  private _debounceTime = 300 as number;
  private _subs$: Subscription[] = [];

  /**
   * Dashboard Data
   *
   * @memberof InAppDisclosureService
   */
  private _dashboardViewData = new BehaviorSubject<DashboardViewDataSubject>({
    IADCardData: [],
    pivotDataSources: [],
    gridDataSources: [],
    cardFieldConfigs: [],
    decimalPrecision: 2,
    localCardConfig: [],
    cardRequest: null,
  });
  DashboardViewData$ = this._dashboardViewData.asObservable();

  private _isLoading = new BehaviorSubject<boolean>(true);
  IsLoading$ = this._isLoading.asObservable();

  private _skeletons = new BehaviorSubject<number>(8);
  Skeletons$ = this._skeletons.asObservable();

  /**
   * Cache Time to Live represented in Hours
   *
   * @type {number}
   * @memberof InAppDisclosureService
   */
  public ttl = (0.3 * (60 * 60 * 1000)) as number;

  private _debug = false as boolean;
  private _sessionId: string;
  private _isCacheActive: boolean;

  constructor(
    protected http: HttpClient,
    @Optional() facade: MangoAppFacade,
    private utilityService: UtilityService,
    private dashboardService: DashboardService,
    private storageService: StorageService,
    private dataService: DataService
  ) {
    super(http, facade);
  }

  public getSegments(
    criteriaSetID?,
    includeArchived = false as boolean
  ): Observable<SegmentListSchema> {
    let param;

    if (criteriaSetID) {
      param = {
        CriteriaSetID: criteriaSetID,
        includeArchived: includeArchived,
      };
    } else {
      param = { includeArchived: includeArchived };
    }

    const url = `${this.reportsUrl}ReportsSegments/Segments`;
    return this.callHttpGet(url, 'getSegments', param);
  }

  public getIADCardData(
    dashboardID: number,
    segmentID: number,
    reportingYear: number,
    reportingCurrency: string
  ): Observable<any> {
    const param = {
      dashboardID: dashboardID,
      segmentID: segmentID,
      reportingYear: reportingYear,
      reportingCurrencyISO: reportingCurrency,
    };
    const url = `${this.accountingServiceUrl}IAD/IADCardData`;
    return this.callHttpGet(url, 'getIADCardData', param).pipe(
      map((data) => {
        const schema = DashboardSchema(dashboardID); // Get right schema according to dashboardID
        if (!schema) {
          return data; // Skip validation if schema not found
        }
        const parsedData = schema.safeParse(data); // Parse the schema
        if (parsedData.success) {
          return parsedData.data;
        } else {
          const errorMessages = parsedData.error.errors
            .map((err) => {
              return `Validation failed for field "${err.path.join(
                '.'
              )}" with error: ${err.message}`;
            })
            .join('\n');
          throw new Error(
            `Invalid data structure on dashboardID ${dashboardID}. \n${errorMessages}`
          );
        }
      })
    );
  }

  public getIADCardConfigs(dashboardId: number): Observable<IADCardSchema> {
    const param = { dashboardId: dashboardId };
    const url = `${this.accountingServiceUrl}IAD/IADCardConfigs`;
    return this.callHttpGet(url, 'getIADCardData', param);
  }

  public getAccountingCriteriaSets() {
    const url = `${this.accountingServiceUrl}accounting/criteriasets`;
    return this.callHttpGet(url, 'getAccountingCriteriaSets');
  }

  /**
   * Gets the Accounting Dashboard available views
   *
   * @return {*}
   * @memberof InAppDisclosureService
   */
  public getAccountingClassifications() {
    const url = `${this.accountingServiceUrl}accounting/classifications`;
    return this.callHttpGet(url, 'getAccountingClassifications');
  }

  public exportIADData(
    segmentID: number,
    reportingYear: number,
    reportingCurrencyISO: string,
    dashboardID: number
  ) {
    const param = {
      segmentID: segmentID,
      reportingYear: reportingYear,
      reportingCurrencyISO: reportingCurrencyISO,
      dashboardID: dashboardID,
    };
    const url = `${this.accountingServiceUrl}IAD/Export`;

    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      Accept: 'application/octet-stream',
      UseQueryOptimization: '1',
    });

    return this.callHttpGet(url, 'Export', param, headers, 'blob');
  }

  getUserPreferences(): Observable<any> {
    const url = `${this.dashboardsUrl}Dashboards/GetUserPreferences`;
    return this.callHttpGet(url, 'getGetUserPreferences');
  }

  public getCurrencyDecimalPrecision(
    currencyISO
  ): Observable<CurrencyPrecisionSchema> {
    const param = { currencyISO: currencyISO };
    const url = `${this.accountingServiceUrl}IAD/CurrencyPrecision`;

    return this.callHttpGet(url, 'getCurrencyPrecision', param);
  }

  public SetDefault(segmentID: number, criteriaSetID: number) {
    const body = { SegmentID: segmentID, CriteriaSetID: criteriaSetID };
    const url = `${this.reportsUrl}ReportsSegments/SetDefault`;

    return this.callHttpPost(url, 'setDefault', body);
  }

  public callHttpGet(
    url: string,
    functionName: string,
    httpOptionsParams?: any,
    httpOptionsHeaders?: any,
    responseType?: any
  ): Observable<any> {
    const httpOptions = this.getHttpHeaders();

    if (httpOptionsParams) {
      httpOptions.params = httpOptionsParams;
    }
    if (httpOptionsHeaders) {
      httpOptions.headers = httpOptionsHeaders;
    }
    if (responseType) {
      httpOptions.responseType = responseType;
      httpOptions.observe = 'response';
    }

    return this.http.get(url, httpOptions).pipe(
      map((x) => this.toObject(x) as any),
      catchError(this.handleError(functionName))
    );
  }

  public toObject(value: any): any {
    if (value instanceof HttpResponse) {
      const apiSuccess = value.status === 200;
      const cemsg = apiSuccess ? null : value.statusText;
      return {
        success: apiSuccess,
        data: { headers: value.headers, body: value.body },
        clientErrorMessage: cemsg,
      };
    } else {
      return super.toObject(value);
    }
  }

  /**
   * Get Card configuration base primarily on cardRequest.dashboardId
   *
   * @private
   * @param {CardRequest} cardRequest
   * @return {*}  {Observable<DashboardConfig>}
   * @memberof InAppDisclosureService
   */
  private _getCardConfig(
    cardRequest: CardRequest
  ): Observable<DashboardConfig> {
    // A) Importing HardCoded card configuration
    const getConfig = async (): Promise<DashboardConfig> => {
      // Get LocalCardConfig
      switch (cardRequest.dashboardId) {
        default:
        case 1:
        case 4: {
          const { dashboardASCAnnually } = await import(
            '@accounting-dashboard/shared/configurations/dashboard-view.config'
          );
          return dashboardASCAnnually;
        }
        case 5: {
          const { dashboardASCQuarterly } = await import(
            '@accounting-dashboard/shared/configurations/dashboard-view.config'
          );
          return dashboardASCQuarterly;
        }
        case 6: {
          const { dashboardIFRSAnnually } = await import(
            '@accounting-dashboard/shared/configurations/dashboard-view.config'
          );
          return dashboardIFRSAnnually;
        }
        case 7: {
          const { dashboardIFRSQuarterly } = await import(
            '@accounting-dashboard/shared/configurations/dashboard-view.config'
          );
          return dashboardIFRSQuarterly;
        }
      }
    };

    return from(getConfig());
  }

  /**
   * Main entry points for the cards. Use `forceReload` true to refetch all the data
   * and ignore the browser's storage.
   *
   * @param {CardRequest} cardRequest
   * @param {boolean} [forceReload=false as boolean]: Refetch all the API data, typically used when the query parameters change
   * @param {boolean} [debug]: Show all the data needed to build the cards
   * @return {*}  {Observable<boolean>}
   * @memberof InAppDisclosureService
   */
  public onLoad(
    cardRequest: CardRequest,
    forceReload = false as boolean,
    debug?: boolean
  ): Observable<boolean> {
    this._debug = debug;
    this._isLoading.next(true);

    // A) Attempts to get dashboard from Browser's cache
    if (this._getCardsFromStorage(cardRequest, forceReload)) {
      this._isLoading.next(false);
    }
    // B) Attempts to get dashboard from APIs
    else {
      this._subs$.push(
        this._getCardConfig(cardRequest)
          .pipe(
            switchMap((dashboardConfig) => {
              // Determine if cache is active or not
              this._isCacheActive =
                dashboardConfig.cache === undefined ||
                dashboardConfig.cache === true
                  ? true
                  : false;

              // Determine how many skeletons to show
              this._skeletons.next(dashboardConfig.localCardConfig.length);

              // Set setting ID for the current dashboardId/View
              this._sessionId = this.getSessionId(dashboardConfig.dashboardId);

              return this._getCards(cardRequest, dashboardConfig);
            }),
            tap((result) => {
              this._dashboardViewData.next({
                IADCardData: result.IADCardData,
                pivotDataSources: result.pivotDataSources,
                gridDataSources: result.gridDataSources,
                cardFieldConfigs: result.cardFieldConfigs,
                decimalPrecision: result.decimalPrecision,
                localCardConfig: result.localCardConfig,
                cardRequest: cardRequest,
              });
              this._isLoading.next(false);

              // Save to cache only if cache True or Undefined
              if (this._isCacheActive === true) {
                this.storageService.saveSyncedSessionData(
                  {
                    IADCardConfigs: result.IADCardConfigs,
                    decimalPrecision: result.decimalPrecision,
                    localCardConfig: result.localCardConfig,
                    gridDataSources: result.gridDataSources,
                    cache: true,
                    // Metadata
                    cardRequest: cardRequest,
                    expiration: new Date().getTime() + this.ttl,
                  } as DashboardViewDataStore,
                  this._sessionId
                );
              }
            })
          )
          .subscribe({
            error: (error: { code: string; message: string }) =>
              this.dashboardService.showToast(error.message, 'error', 'Error'),
          })
      );
    }

    return this._isLoading.asObservable();
  }

  /**
   * It creates a session ID string for the browser's storage key by
   * fetching the client key from the storage.
   *
   * @private
   * @param {number} dashboardId
   * @return {*}  {string}
   * @memberof InAppDisclosureService
   */
  private getSessionId(dashboardId: number): string {
    let sessionIdName = '';
    this._subs$.push(
      this.facade.clientKey$
        .pipe(
          switchMap(() =>
            this.facade.clientKey$.pipe(filter((client) => !!client))
          ),
          tap((client) => {
            sessionIdName =
              `accounting_module_${client}_${dashboardId}` as string;
          })
        )
        .subscribe()
    );
    return sessionIdName;
  }

  /**
   * It builds the PivotDataSource and Cards based on the browser's storage, no API calls.
   *
   * @private
   * @param {CardRequest} cardRequest
   * @param {boolean} forceReload
   * @return {*}  {boolean}
   * @memberof InAppDisclosureService
   */
  private _getCardsFromStorage(
    cardRequest: CardRequest,
    forceReload: boolean
  ): boolean {
    const now = new Date().getTime();

    // 0) Set setting ID for the current dashboardId/View
    this._sessionId = this.getSessionId(cardRequest.dashboardId);

    // 1) Get Data from Session Storage
    const { sessionDashboardView, sessionDashboardViewData } =
      this._getSessionStorage() as {
        sessionDashboardView: DashboardViewDataStore;
        sessionDashboardViewData: any;
      };
    // 1.1) Determines if cache is currently working, if saved next time will be true
    this._isCacheActive = sessionDashboardView?.cache ?? false;

    // 1.2) Determine how many skeletons to show
    this._skeletons.next(sessionDashboardView?.localCardConfig.length ?? 8);

    // 1.3) Stop showing the loading indicator
    this._isLoading.next(true);

    // 2) Deletes the Browser's cache if expired and return
    if (this._isCacheActive && now > sessionDashboardView?.expiration) {
      this.storageService.deleteData(this._sessionId);
      return false;
    }

    // 3) Cache is Off, nothing to retrieve, return
    if (this._isCacheActive === false) return false;

    // 4) Cache is On/undefined, create
    if (
      sessionDashboardView &&
      sessionDashboardViewData && // Get data from the session if the parameters have not changed
      cardRequest.reportingYear ===
        sessionDashboardView.cardRequest.reportingYear &&
      cardRequest.selectedCurrency ===
        sessionDashboardView.cardRequest.selectedCurrency &&
      // cardRequest.selectedSegment ===
      //   sessionDashboardView.cardRequest.selectedSegment &&
      !forceReload
    ) {
      const cardFieldConfigs = this.utilityService.configureFieldsPerCard(
        // Build FieldConfiguration for each card
        sessionDashboardView.IADCardConfigs,
        sessionDashboardView.localCardConfig,
        sessionDashboardView.decimalPrecision
      );

      const {
        pivotDataSources,
        gridDataSources,
      }: {
        pivotDataSources: Array<PivotGridDataSource>;
        gridDataSources: Array<any>;
      } = this.utilityService.buildDataSources(
        // Build DevExtreme's pivot grid for each card
        sessionDashboardViewData,
        sessionDashboardView.localCardConfig, //cardRequest.viewConfiguration.localCardConfig,
        cardRequest.reportingYear,
        cardFieldConfigs,
        this._debug
      );

      this._dashboardViewData.next({
        IADCardData: sessionDashboardViewData,
        cardFieldConfigs: cardFieldConfigs, // Fresh card config, it cannot be saved on sessionStorage, it lost the callback functions
        pivotDataSources: pivotDataSources, // Fresh pivotDataSources, it cannot be saved on sessionStorage
        gridDataSources: gridDataSources,
        decimalPrecision: sessionDashboardView.decimalPrecision,
        localCardConfig: sessionDashboardView.localCardConfig,
        cardRequest: cardRequest,
      });

      return true;
    }
    return false;
  }

  /**
   * Rebuilds the cards with new parameters
   *
   * @param {*} event
   * @param {CardConfig} config
   * @param {boolean} [forceReload]
   * @memberof InAppDisclosureService
   */
  updateCard(event, config: CardConfig, forceReload?: boolean) {
    this._isLoading.next(true);

    // 0) Attempt to get configurations from browser's storage
    const { sessionDashboardView, sessionDashboardViewData } =
      this._getSessionStorage() as {
        sessionDashboardView: DashboardViewDataStore;
        sessionDashboardViewData: any;
      };

    // A) Use browser's storage
    if (sessionDashboardView && sessionDashboardViewData && !forceReload) {
      // 1) Get CardConfigs
      const localCardConfig = sessionDashboardView.localCardConfig;
      const index = this.utilityService.findObjectByID(
        sessionDashboardView.localCardConfig,
        config.id
      );
      localCardConfig[index].filterInitialValue = event;

      // 2) Configure Fields per Card
      const cardFieldConfigs = this.utilityService.configureFieldsPerCard(
        // Build FieldConfiguration for each card
        sessionDashboardView.IADCardConfigs,
        localCardConfig,
        sessionDashboardView.decimalPrecision
      );

      // 3) Rebuild the PivotDataSources and GridDataSources
      const {
        pivotDataSources,
        gridDataSources,
      }: {
        pivotDataSources: Array<PivotGridDataSource>;
        gridDataSources: Array<any>;
      } = this.utilityService.buildDataSources(
        // Build DevExtreme's pivot grid for each card
        sessionDashboardViewData,
        localCardConfig,
        sessionDashboardView.cardRequest.reportingYear,
        cardFieldConfigs,
        this._debug
      );

      // 4) Emit the new Dashboard configuration
      this._dashboardViewData.next({
        IADCardData: sessionDashboardViewData,
        cardFieldConfigs: cardFieldConfigs, // Fresh card config, it cannot be saved on sessionStorage, it lost the callback functions
        pivotDataSources: pivotDataSources, // Fresh pivotDataSources, it cannot be saved on sessionStorage
        gridDataSources: gridDataSources,
        decimalPrecision: sessionDashboardView.decimalPrecision,
        localCardConfig: localCardConfig,
        cardRequest: sessionDashboardView.cardRequest,
      });

      // 5) Stop the loading indicator
      this._isLoading.next(false);

      // 6) Save to browser's storage the CardConfigs
      this.storageService.saveSyncedSessionData(
        {
          IADCardConfigs: sessionDashboardView.IADCardConfigs,
          decimalPrecision: sessionDashboardView.decimalPrecision,
          localCardConfig: localCardConfig,
          gridDataSources: gridDataSources,
          cache: sessionDashboardView.cache,
          // Metadata
          cardRequest: sessionDashboardView.cardRequest,
          expiration: new Date().getTime() + this.ttl,
        } as DashboardViewDataStore,
        this._sessionId
      );
    } else {
      // TODO: When browser storage fails to save, still want to reflect UI changes
      // B) No Browser's storage, fetch data and update configuration
      // this._dashboardViewData.next({
      // 	IADCardData: result.IADCardData,
      // 	pivotDataSources: result.pivotDataSources,
      // 	gridDataSources: result.gridDataSources,
      // 	cardFieldConfigs: result.cardFieldConfigs,
      // 	decimalPrecision: result.decimalPrecision,
      // 	localCardConfig: result.localCardConfig,
      //	cardRequest: cardRequest,
      // });
    }
  }

  /**
   * It gets the ready to use cards for the selected Dashboard view
   *
   * @private
   * @param {CardRequest} cardRequest
   * @return {*}  {Observable<{
   * 		IADCardConfigs: Array<any>,
   * 		IADCardData: Array<any>,
   *     pivotDataSources: Array<PivotGridDataSource>,
   *     decimalPrecision: number,
   * 		localCardConfig: CardConfig[],
   *     cardFieldConfigs: any,
   *   }>}
   * @memberof InAppDisclosureService
   */
  private _getCards(
    cardRequest: CardRequest,
    dashboardConfig: DashboardConfig
  ): Observable<{
    IADCardConfigs: Array<any>;
    IADCardData: Array<any>;
    pivotDataSources: Array<PivotGridDataSource>;
    gridDataSources: Array<any>;
    decimalPrecision: number;
    localCardConfig: CardConfig[];
    cardFieldConfigs: any;
  }> {
    let IADCardConfigs: Array<any>;
    let IADcardData: Array<any>;
    let pivotDataSources: Array<PivotGridDataSource>;
    let gridDataSources: Array<any>;
    let decimalPrecision: number;
    let cardFieldConfigs;
    let cardConfig: CardConfig[] = [];

    // Get Card Configurations
    return of(cardRequest).pipe(
      debounceTime(this._debounceTime),
      switchMap(() =>
        this.getCurrencyDecimalPrecision(cardRequest.selectedCurrency)
      ),
      switchMap((currencyPrecision) => {
        decimalPrecision = currencyPrecision.data.DecimalPrecision;

        return this.getIADCardConfigs(cardRequest.dashboardId);
      }),
      switchMap((rIADCardConfigs) => {
        IADCardConfigs = rIADCardConfigs.data;

        // Build final localCardConfig using the available information
        cardConfig = this.setCardConfigurations(
          dashboardConfig.localCardConfig,
          decimalPrecision
        );

        cardFieldConfigs = this.utilityService.configureFieldsPerCard(
          IADCardConfigs,
          cardConfig,
          decimalPrecision
        );

        return this.getIADCardData(
          cardRequest.dashboardId,
          cardRequest.selectedSegment,
          cardRequest.reportingYear,
          cardRequest.selectedCurrency
        );
      }),
      tap((result) => {
        IADcardData = result.data;

        // Save data to cache if cache is undefined or true
        if (this._isCacheActive === true) {
          this.storageService.saveSyncedSessionData(
            result.data,
            this._sessionId + '_card_data'
          );
        }
        ({ pivotDataSources, gridDataSources } =
          this.utilityService.buildDataSources(
            IADcardData,
            cardConfig,
            cardRequest.reportingYear,
            cardFieldConfigs,
            this._debug
          ));
      }),
      map(() => ({
        IADCardConfigs: IADCardConfigs,
        IADCardData: IADcardData,
        pivotDataSources: pivotDataSources,
        gridDataSources: gridDataSources,
        decimalPrecision: decimalPrecision,
        localCardConfig: cardConfig,
        cardFieldConfigs: cardFieldConfigs,
      }))
    );
  }

  /**
   * Sets basic card configurations that may apply to both data and pivot grid.
   *
   * @param {CardConfig[]} initialCardConfig
   * @param {number} decimalPrecision
   * @memberof InAppDisclosureService
   */
  setCardConfigurations(
    initialCardConfig: CardConfig[],
    decimalPrecision: number
  ): CardConfig[] {
    const newCardConfigs: Array<any> = [];

    initialCardConfig.map((card, i) => {
      const tempCardConfig: CardConfig = card;

      if (!initialCardConfig[i].format) {
        tempCardConfig.format = {
          type: 'fixedPoint',
          precision: decimalPrecision,
        };
      }

      newCardConfigs.push(tempCardConfig);
    });

    return newCardConfigs;
  }

  private _getSessionStorage(): {
    sessionDashboardView: DashboardViewDataStore;
    sessionDashboardViewData: Array<any>;
  } {
    // 1) Get Full Dashboard View Configuration
    const sessionDashboardView: DashboardViewDataStore =
      this.storageService.getData(this._sessionId);

    // 2) Get Raw Data from the Session Storage
    const sessionDashboardViewData: Array<any> = this.storageService.getData(
      this._sessionId + '_card_data'
    );

    return { sessionDashboardView, sessionDashboardViewData };
  }

  /**
   * Saves or updates a specific card configuration in both the browser's storage
   * and the corresponding API as defined in the dataService.
   *
   * @param {CardConfig} newCardConfig
   * @param {number} dashboardId
   * @memberof InAppDisclosureService
   */
  saveCard(newCardConfig, dashboardId: number) {
    // 1) Update Browser's storage w/ new config object
    if (this._isCacheActive === true) {
      const sessionDashboardView: { [key: string]: any } =
        this.storageService.getData(this._sessionId);
      // 1.1) Get current IADCardConfigs
      const currentViewData: DashboardViewDataSubject =
        this._dashboardViewData.getValue();
      const cardIndexToUpdate: number =
        currentViewData.localCardConfig.findIndex(
          (card) => card.id === newCardConfig.id
        );
      const newLocalCardConfig: any[] = currentViewData.localCardConfig.slice(); // Initialize with old data
      newLocalCardConfig[cardIndexToUpdate] = newCardConfig; // Modify the card with the current index

      // 1.2) Update card config in IADCardConfig
      this._dashboardViewData.next({
        ...currentViewData,
        localCardConfig: newLocalCardConfig,
      });

      // 1.3) Save Browser Storage
      this.storageService.saveSyncedSessionData(
        {
          ...sessionDashboardView,
          localCardConfig: newLocalCardConfig,
          expiration: new Date().getTime() + this.ttl,
        } as DashboardViewDataStore,
        this._sessionId
      );

      // 1.4) Notify user of success
      this.dashboardService.showToast(
        `The '${
          newCardConfig.name ? newCardConfig.name + ' card' : 'card'
        }' was saved successfully.`,
        'success',
        'Card configuration saved',
        8000
      );
    } else {
      this.dashboardService.showToast(
        `The saving feature is deactivated for this dashboard or card.`,
        'success',
        'Card configuration cannot be saved',
        8000
      );
    }

    // 2) Save new Card Data Configuration on DB
    // this._subs$.push(
    // 	this.dataService
    // 		.saveCardConfig(dashboardId, false, newCardConfig)
    // 		.subscribe(
    // 			(data) => {
    // 				if(!data.success){
    // 					console.warn('Error saving card. The card was saved only in the browser\'s storage. ')
    // 					this.dashboardService.showToast('The card could not be saved.', 'error', 'Error saving card');
    // 					return;
    // 				}
    // 				this.dashboardService.showToast(
    // 					`The '${newCardConfig.name ? newCardConfig.name + ' card' : 'card'}' was saved successfully.`,
    // 					 'success',
    // 						'Card configuration saved',
    //						8000,
    // 				);
    // 			},
    // 			(error) => this.dashboardService.showToast(error, 'error')
    // 		)
    // );
  }

  resetCard(cardToReset: CardConfig) {
    // 1) Refetch localCardConfig
    if (this._isCacheActive === true) {
      // 1.1) Get current session id
      const currentViewData: DashboardViewDataSubject =
        this._dashboardViewData.getValue();
      const cardRequest: CardRequest = currentViewData.cardRequest;

      this._subs$.push(
        this._getCardConfig(cardRequest)
          .pipe(
            tap((dashboardConfig) => {
              // Get cardIndex of card to reset
              const cardIndexToReset: number =
                dashboardConfig.localCardConfig.findIndex(
                  (card) => card.id === cardToReset.id
                );

              // 1.2) Get the original card configuration
              const newLocalCardConfig: any[] =
                currentViewData.localCardConfig.slice(); // Get current conf
              newLocalCardConfig[cardIndexToReset] =
                dashboardConfig.localCardConfig[cardIndexToReset]; // replace conf w/ default one

              // 1.3) Save to cache configuration
              // Get current conf from the browser's storage
              const sessionDashboardView: { [key: string]: any } =
                this.storageService.getData(this._sessionId);
              this.storageService.saveSyncedSessionData(
                {
                  ...sessionDashboardView,
                  localCardConfig: newLocalCardConfig,
                  cache: true,
                  // Metadata
                  cardRequest: cardRequest,
                  expiration: new Date().getTime() + this.ttl,
                },
                this._sessionId
              );

              // 1.4) Emit new value of dashboard/reload card(s)
              this._dashboardViewData.next({
                ...currentViewData,
                localCardConfig: newLocalCardConfig,
                cardRequest: cardRequest,
              });
            })
          )
          .subscribe({
            error: (error: { code: string; message: string }) =>
              this.dashboardService.showToast(error.message, 'error'),
          })
      );
    }
    // 2) No cache // TODO: Complete when browser's cache not available
  }

  /**
   * Destroys all active subscriptions
   *
   * @return {*}
   * @memberof InAppDisclosureService
   */
  public cancelAllRequests() {
    this._subs$.forEach((s) => s.unsubscribe());
    this._subs$ = [];
  }
}
