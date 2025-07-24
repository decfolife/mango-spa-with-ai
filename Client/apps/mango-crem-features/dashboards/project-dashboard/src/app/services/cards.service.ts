import { Injectable } from '@angular/core';
import {
  Dropdown,
  Metric,
  ToastState,
} from '@mango/data-models/lib-data-models';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CardDetails,
  ChartData,
  FilterDetail,
  GridData,
  userSettings,
} from '../models';
import { DashboardService } from './dashboard.service';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';

@Injectable({ providedIn: 'root' })
export class CardsService {
  dashboardSchema: any = null;
  dashboardCardFiltersData: Dropdown[] = null;
  filterObservables: Observable<FilterDetail>[] = [];
  filteredData: any[];
  filterDropdownData: any[];
  public newTasksDropdown: Dropdown;
  public newProjectsDropdown: Dropdown;
  public selectedFilterString: string = null;

  private _filterStringSource: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  public filterString$ = this._filterStringSource.asObservable();

  public dateFormat: string = null;

  constructor(
    private dashboardService: DashboardService,
    private toastService: CremToastService
  ) {}

  // DashboardId is the current dashboard that you are on.
  // filters parameters is all of the selected parameters on the page.

  sendFilterString(filters: string) {
    this._filterStringSource.next(filters);
  }

  generateCardDetails(
    cards: any,
    cardFilters: any,
    selectedFilters: string
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
        filterData:
          card.elementType.elementTypeName == 'new_tasks_card' ||
          card.elementType.elementTypeName == 'new_projects_card'
            ? cardFilters
            : [],
        filterInitialValue:
          card.elementType.elementTypeName == 'new_tasks_card' ||
          card.elementType.elementTypeName == 'new_projects_card'
            ? cardFilters[1]
            : [],
        dispCard: false,
      };

      cardDetails.push(newCardDetail);
    });

    this.sendFilterString(selectedFilters);
    return cardDetails;
  }

  getCardDetails(card: any, filters: string): Observable<CardDetails> {
    let keyDate: string = null;
    let newGridData: GridData = {
      id: card.id,
      dataSource: undefined,
    };

    card.moreOptions = {
      export: true,
    };

    //***** new-tasks and new-projects cards have keyDate card filters */
    if (card.id == 'new_tasks_card') {
      if (this.newTasksDropdown) {
        card.filterInitialValue = this.newTasksDropdown;
        keyDate = card.filterInitialValue.valueKey;
      } else {
        keyDate = card.filterInitialValue.valueKey;
      }
    }
    if (card.id == 'new_projects_card') {
      if (this.newProjectsDropdown) {
        card.filterInitialValue = this.newProjectsDropdown;
        keyDate = card.filterInitialValue.valueKey;
      } else {
        keyDate = card.filterInitialValue.valueKey;
      }
    }

    return this.getDataForCardDetail(card, keyDate, filters);
  }

  fetchAllProjectFilters(filters: any, userSelectedfiltersArr): any {
    if (this.filterObservables.length > 0)
      return forkJoin(this.filterObservables);

    return this.dashboardService.getAllProjectFilters(filters).pipe(
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
      case 'business_unit_filter':
        return filterData.businessFilters;
        break;
      case 'client_filter':
        return filterData.clientFilters;
        break;
      case 'country_filter':
        return filterData.countryFilters;
        break;
      case 'project_manager_filter':
        return filterData.projectManagerFilters;
        break;
      case 'project_status_filter':
        return filterData.projectStatusFilters;
        break;
      case 'project_type_filter':
        return filterData.projectTypeFilters;
        break;
    }
  }

  generateFilterDetailList(
    filters,
    userSelectedfiltersArr
  ): Observable<FilterDetail[]> {
    // let filterDetails: FilterDetail[] = new Array(filters.length);
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

  getDataForFilterDetail(filterDetail: FilterDetail): Observable<FilterDetail> {
    //Get the datasource for the filter detail
    return this.dashboardService
      .getFilterDataByElementType(1, filterDetail.id)
      .pipe(
        map((filterData: any) => {
          //Create the datasource object
          let dataSource: any = filterData.data.map((fd) => {
            let dataSourceObject = {
              displayKey: fd[filterDetail.displayKey],
              valueKey: fd[filterDetail.valueKey],
            };
            return dataSourceObject;
          });

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

  generateSelectedValues(userSelectedfiltersArr, elementTypeName) {
    let elementSelectedValues = userSelectedfiltersArr.filter((f) =>
      f.startsWith(elementTypeName)
    )[0];

    if (elementSelectedValues == undefined) return null;

    let selectedValues = elementSelectedValues.split('=')[1];
    let selectedValuesArr = selectedValues.split('!@!');

    return selectedValuesArr;
  }

  generateMetricDetails(dashboardId, metrics, data): any {
    let metricsData: Metric[] = [];
    let oneMetric: Metric;
    metrics.forEach((metric) => {
      let metricDataIndex = data.findIndex(
        (m) => m.elementTypeName === metric.elementType.elementTypeName
      );
      let metricData = data[metricDataIndex];
      let oneMetric = this.createMetricDetail(metric, metricData.data[0]);
      metricsData.push(oneMetric);
    });
    return metricsData;
  }

  getDataForCardDetail(
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

    return this.dashboardService
      .getCardDataByElementType(1, cardDetail.id, keyDateParam, selectedFilters)
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

  private createMetricDetail(metric: any, data: any): Metric {
    let sidekickValue = null;

    if (data.sidekick !== null) {
      sidekickValue = {
        metricValue: data.sidekick.metricValue,
        valueIndicator: data.sidekick.valueIndicator,
      };
    }

    let metricDetail: Metric = {
      title: metric.title,
      subtitle: data.subtitle,
      id: metric.elementType.elementTypeName,
      tooltipData: data.tooltipData,
      heroMetric: data.heroMetric,
      sidekick: sidekickValue,
      isActive: metric.isActive,
      elementId: metric.id,
      elementTypeId: metric.elementType.id,
    };

    return metricDetail;
  }

  public createUserSettingRec(element: any, order: number): userSettings {
    let userSettingsRec: userSettings;
    if (element.elementType) {
      userSettingsRec = {
        dashboardId: 1,
        elementId: element.id,
        elementTypeId: element.elementType.id,
        isActive: element.isActive,
        elementOrder: order,
      };
    } else {
      userSettingsRec = {
        dashboardId: 1,
        elementId: element.elementId,
        elementTypeId: element.elementTypeId,
        isActive: element.isActive,
        elementOrder: order,
      };
    }
    return userSettingsRec;
  }

  public setUserDateFormat(isDatesEU: boolean) {
    this.dateFormat = 'MM/dd/yyyy';
    if (isDatesEU) {
      this.dateFormat = 'dd.MM.yyyy';
    }
  }
}

function Child<T>(): string {
  throw new Error('Function not implemented.');
}
