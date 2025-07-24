import { Injectable } from '@angular/core';
import { Dropdown, ToastState } from '@mango/data-models/lib-data-models';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CardDetails,
  ChartData,
  FilterDetail,
  GridData,
  userSettings,
} from '../models';
import { PortfolioDashboardService } from './portfolio-dashboard.service';
import { ProjectsDashboardLeftNavService } from '../../../../../micro-components/src/app/services/projects-dashboard-left-nav.service';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';

@Injectable({ providedIn: 'root' })
export class PortfolioDataService {
  filteredData: any[];
  filterDropdownData: any[];
  public recentlyArchivedLeasesDropdown: Dropdown;
  public criticalDatesDropdown: Dropdown;
  public annualExpirationRentValueDropdown: Dropdown;
  public newLeasesDropdown: Dropdown;
  filterObservables: Observable<FilterDetail>[] = [];
  private _filterStringSource: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  private redirectorLinks: any[] = null;
  public filterString$ = this._filterStringSource.asObservable();
  public userId: number;
  public unitOfMeasureId: number;
  public exchangeRateId: number;
  public dateFormat: string;

  constructor(
    private portfolioDashboardService: PortfolioDashboardService,
    private leftNavService: ProjectsDashboardLeftNavService,
    private toastService: CremToastService
  ) {
    //This should only be called once but just in case.
    if (this.redirectorLinks === null) {
      this.portfolioDashboardService
        .getRedirectorLinkList()
        .subscribe((res) => {
          this.redirectorLinks = res.data;
        });
    }
  }

  sendFilterString(filters: string) {
    this._filterStringSource.next(filters);
  }

  generateCardDetails(
    cards: any,
    monthsBackFilters: any,
    monthsForwardFilters: any,
    yearFilters: any,
    selectedFilters
  ): CardDetails[] {
    let cardDetails: CardDetails[] = [];

    cards.forEach((card) => {
      let newGridData: GridData = {
        id: card.elementType.elementTypeName,
        dataSource: undefined,
      };

      let newChartData: ChartData = {
        id: card.elementType.elementTypeName,
        dataSource: undefined,
        xAxis: undefined,
        yAxis: undefined,
        keyName: undefined,
        type: 'bar',
        color: '#ec4a08',
      };

      let newCardDetail: CardDetails = {
        title: card.title,
        subtitle: card.subTitle,
        id: card.elementType.elementTypeName,
        elementId: card.id,
        elementTypeId: card.elementType.id,
        elementOrder: card.cardOrder,
        isActive: card.isActive,
        contentType: card.dashboardCardType.cardType,
        width:
          card.elementType.elementTypeName === 'project_milestones_card'
            ? '100'
            : '49',
        gridData: newGridData,
        chartData: newChartData,
        dispCard: false,
      };

      if (
        card.elementType.elementTypeName == 'new_leases_card' ||
        card.elementType.elementTypeName == 'recently_archived_leases_card'
      ) {
        newCardDetail.filterData = monthsBackFilters;
        newCardDetail.filterInitialValue = monthsBackFilters[1];
      } else if (card.elementType.elementTypeName == 'critical_dates_card') {
        newCardDetail.filterData = monthsForwardFilters;
        newCardDetail.filterInitialValue = monthsForwardFilters[2];
      } else if (
        card.elementType.elementTypeName == 'annual_expiration_rent_value_card'
      ) {
        newCardDetail.filterData = yearFilters;
        newCardDetail.filterInitialValue = yearFilters[2];
      } else {
        newCardDetail.filterData = [];
        newCardDetail.filterInitialValue = [];
      }

      cardDetails.push(newCardDetail);
    });

    this.sendFilterString(selectedFilters);
    return cardDetails;
  }

  public createUserSettingRec(element: any, order: number): userSettings {
    let userSettingsRec: userSettings;
    if (element.elementType) {
      userSettingsRec = {
        dashboardId: 2,
        elementId: element.id,
        elementTypeId: element.elementType.id,
        isActive: element.isActive,
        elementOrder: order,
      };
    } else {
      userSettingsRec = {
        dashboardId: 2,
        elementId: element.elementId,
        elementTypeId: element.elementTypeId,
        isActive: element.isActive,
        elementOrder: order,
      };
    }
    return userSettingsRec;
  }

  getCardDetails(card: any, filters: string): Observable<CardDetails> {
    let keyDate: string = null;
    let currency: number = this.exchangeRateId;
    let unitOfMeasureId: number = this.unitOfMeasureId;
    let newGridData: GridData = {
      id: card.id,
      dataSource: undefined,
    };

    if (
      card.id == 'upcoming_lease_expirations_card' ||
      card.id == 'portfolio_activity_feed_card' ||
      card.id == 'recently_archived_leases_card' ||
      card.id == 'new_leases_card' ||
      card.id == 'critical_dates_card'
    ) {
      card.moreOptions = {
        displayExpandOption: true,
        isExpanded: false,
        export: true,
      };
    } else {
      card.moreOptions = {
        displayExpandOption: false,
        isExpanded: false,
        export: true,
      };
    }

    if (
      card.id == 'buildings_by_state_card' ||
      card.id == 'ownership_type_card' ||
      card.id == 'building_type_card'
    ) {
      card.moreOptions = {
        hideLabels: true,
        hideLegend: true,
        export: true,
      };
    } else {
      card.moreOptions = {
        hideLabels: false,
        hideLegend: false,
        export: true,
      };
    }

    //***** Recently Archived Leases card has keyDate card filters */
    if (card.id == 'recently_archived_leases_card') {
      if (this.recentlyArchivedLeasesDropdown) {
        card.filterInitialValue = this.recentlyArchivedLeasesDropdown;
        keyDate = card.filterInitialValue.valueKey;
      } else {
        keyDate = card.filterInitialValue.valueKey;
      }
    }

    if (card.id == 'new_leases_card') {
      if (this.newLeasesDropdown) {
        card.filterInitialValue = this.newLeasesDropdown;
        keyDate = card.filterInitialValue.valueKey;
      } else {
        keyDate = card.filterInitialValue.valueKey;
      }
    }

    if (card.id == 'critical_dates_card') {
      if (this.criticalDatesDropdown) {
        card.filterInitialValue = this.criticalDatesDropdown;
        keyDate = card.filterInitialValue.valueKey;
      } else {
        keyDate = card.filterInitialValue.valueKey;
      }
    }

    if (card.id == 'annual_expiration_rent_value_card') {
      if (this.annualExpirationRentValueDropdown) {
        card.filterInitialValue = this.annualExpirationRentValueDropdown;
        keyDate = card.filterInitialValue.valueKey;
      } else {
        keyDate = card.filterInitialValue.valueKey;
      }
    }

    return this.getDataForCardDetail(
      currency,
      unitOfMeasureId,
      card,
      keyDate,
      filters
    );
  }

  getDataForCardDetail(
    currency: number,
    unitOfMeasureId: number,
    cardDetail: CardDetails,
    keyDate: string,
    selectedFilters: string
  ): Observable<CardDetails> {
    //Some cards do not require a key date to get the data so we use this defaultKeyDate value
    //instead of looking the value up.
    const defaultKeyDate = null;

    //Make sure date is in the correct format, replace foward slash with hyphen
    let keyDateParam =
      keyDate === null || keyDate === undefined
        ? defaultKeyDate
        : keyDate.replace(/\//g, '-');

    return this.portfolioDashboardService
      .getCardDataByElementType(
        currency,
        unitOfMeasureId,
        cardDetail.id,
        keyDateParam,
        selectedFilters
      )
      .pipe(
        map((results) => {
          if (!results.success) {
            this.toastService.show(
              "We're currently unable to retrieve data. Please try again shortly.",
              'Error',
              ToastState.ERROR
            );

            return null;
          } else {
            if (cardDetail.id === 'financials_accounting_links_card') {
              let accountingModuleId = 9;
              this.leftNavService
                .getModuleNavigationLinksClient(accountingModuleId)
                .subscribe((res: any) => {
                  if (res && res.data && res.data.length) {
                    for (var clientLink of res.data) {
                      if (clientLink.isActive === false) {
                        var accountingLinks = results.data.accountingLinks;
                        accountingLinks.splice(
                          accountingLinks.findIndex(
                            (link) => link.name === clientLink.name
                          ),
                          1
                        );
                      }
                    }
                  }
                });
            }
            const resultsData = Array.isArray(results.data)
              ? results.data.map((r, index) => ({ ...r, gridIndex: index }))
              : results.data;
            cardDetail.gridData.dataSource = resultsData;
            cardDetail.chartData.dataSource = resultsData;
            cardDetail.counter = results.data.length;
            return cardDetail;
          }
        })
      );
  }

  fetchAllPortfolioFilters(filters: any, userSelectedfiltersArr): any {
    if (this.filterObservables.length > 0)
      return forkJoin(this.filterObservables);

    return this.portfolioDashboardService.getAllPortfolioFilters(filters).pipe(
      map((results) => {
        let localArray: FilterDetail[] = [];
        var filterData = results.data;

        filters.map((filter) => {
          let filterObservable: Observable<FilterDetail>;
          let filterDetail: FilterDetail = this.createFilterDetail(
            filter,
            null,
            userSelectedfiltersArr
          );

          var queryDto = this.getDtoType(filterData, filterDetail.id);

          let dataSource: any =
            filterDetail.placeHolderText != 'Hierarchy'
              ? queryDto.map((fd) => {
                  let dataSourceObject = {
                    displayKey: fd[filterDetail.displayKey],
                    valueKey: fd[filterDetail.valueKey],
                  };
                  return dataSourceObject;
                })
              : filterData.hierarchyFilters;

          filterDetail.dataSource = dataSource;

          localArray.push(filterDetail);
          this.filterObservables.push(of(filterDetail));
        });
        return localArray;
      })
    );
  }

  getDtoType(filterData, id) {
    switch (id) {
      case 'portfolio_filter':
        return filterData.portfolioFilters;
        break;
      case 'hierarchy_filter':
        return filterData.hierarchyFilters;
        break;
      case 'portfolio_country_filter':
        return filterData.countryFilters;
        break;
      case 'lease_template_filter':
        return filterData.leaseTemplateFilters;
        break;
      case 'account_type_filter':
        return filterData.accountTypeFilters;
        break;
      case 'lease_status_filter':
        return filterData.leaseStatusFilters;
        break;
      case 'building_type_filter':
        return filterData.buildingTypeFilters;
        break;
    }
  }

  generateFilterDetailList(
    filters,
    userSelectedfiltersArr
  ): Observable<FilterDetail[]> {
    if (this.filterObservables.length > 0)
      return forkJoin(this.filterObservables);

    filters.map((filter) => {
      let filterObservable: Observable<FilterDetail>;
      let filterDetail: FilterDetail = this.createFilterDetail(
        filter,
        null,
        userSelectedfiltersArr
      );

      if (filter.isActive) {
        filterObservable = this.getDataForFilterDetail(filterDetail);
      } else {
        //If the filter is not active we do not make a call to get the data.  We still need to create the FilterDetail object
        //because this array is used to control the filters on the screen and the toggles that are visible in the user
        //settings popup.
        filterObservable = of(filterDetail);
      }

      this.filterObservables.push(filterObservable);
    });
    return forkJoin(this.filterObservables);
  }

  generateSelectedValues(userSelectedfiltersArr, elementTypeName) {
    let elementSelectedValues = userSelectedfiltersArr.filter((f) =>
      f.startsWith(elementTypeName)
    )[0];

    if (elementSelectedValues == undefined) return null;

    let selectedValues = elementSelectedValues.split('=')[1];

    let selectedValuesArr = selectedValues.split('!@!');

    return selectedValuesArr;
  }

  findUrl(
    objectId: number,
    objectTypeId: number,
    objectTypeTypeId: number
  ): string {
    let found = this.redirectorLinks.find(
      (x) =>
        x.objectTypeId === objectTypeId &&
        x.objectTypeTypeId === objectTypeTypeId
    );

    found =
      found ??
      this.redirectorLinks.find((x) => x.objectTypeId === objectTypeId);

    let urlLink = found ? found.urlLink : 'not found';
    urlLink = urlLink
      .replace(/\[OID\]/, objectId)
      .replace(/\[OTID\]/, objectTypeId)
      .replace(/\[OTTID\]/, objectTypeTypeId);

    return urlLink;
  }

  public setUserDateFormat(isDatesEU: boolean) {
    this.dateFormat = 'MM/dd/yyyy';

    if (isDatesEU) {
      this.dateFormat = 'dd.MM.yyyy';
    }
  }

  getDataForFilterDetail(filterDetail: FilterDetail): Observable<FilterDetail> {
    //Get the datasource for the filter detai
    return this.portfolioDashboardService
      .getFilterDataByElementType(filterDetail.id)
      .pipe(
        map((filterData: any) => {
          //Create the datasource object
          let dataSource: any =
            filterDetail.placeHolderText != 'Hierarchy'
              ? filterData.data.map((fd) => {
                  let dataSourceObject = {
                    displayKey: fd[filterDetail.displayKey],
                    valueKey: fd[filterDetail.valueKey],
                  };
                  return dataSourceObject;
                })
              : filterData.data;

          filterDetail.dataSource = dataSource;

          return filterDetail;
        })
      );
  }

  private createFilterDetail(
    filter: any,
    dataSource: any,
    userSelectedfiltersArr: any
  ): FilterDetail {
    let filterDetail: FilterDetail = {
      id: filter.elementType.elementTypeName,
      placeHolderText: filter.placeHolderText,
      label: null,
      valueKey: filter.idExpression,
      displayKey: filter.displayExpression,
      contentTemplate: null,
      showColumnHeaders: filter.showColumnHeaders,
      selectMode: filter.isMultiSelect ? 'multiple' : 'single',
      showCheckBoxesMode: filter.isMultiSelect ? 'always' : null,
      allowSearch: filter.allowSearch,
      isActive: filter.isActive,
      elementId: filter.id,
      elementTypeId: filter.elementType.id,
      dataSource: dataSource,
      selectedValues: this.generateSelectedValues(
        userSelectedfiltersArr,
        filter.elementType.elementTypeName
      ),
    };
    return filterDetail;
  }
}
