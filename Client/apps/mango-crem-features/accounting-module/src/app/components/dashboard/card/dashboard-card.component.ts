import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../../../../../../mango/src/environments/environment.local';
import { SimpleGridComponent } from '@mango/ui-shared/lib-ui-elements';
import { CremPivotTableComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/crem-pivot-table/crem-pivot-table.component';
import { NgStateObject } from '../../../shared/models/app-state.model';
import { DataService } from '../../../services/data.service';
import { DashboardService } from '../../../services/dashboard.service';
import { ColumnLimitComponent } from '../modal/column-limit/column-limit.component';
import { ColumnArray } from '../../../shared/models/dashboard-model';
import DataSource from 'devextreme/data/data_source';
import { ToastState } from '@mango/data-models/lib-data-models';
import { AccountingToastService } from 'apps/mango-crem-features/accounting-summary/src/app/services/accounting-toast.service';

interface ISummationTypeConfig {
  showSummationTypeConfig: boolean;
  showColumnFields: boolean;
  showRowFields: boolean;
  showDataFields: boolean;
  showFilterFields: boolean;
}
@Component({
  selector: 'mango-accounting-card',
  templateUrl: './dashboard-card.component.html',
  styleUrls: ['./dashboard-card.component.scss'],
})
export class DashboardCardComponent implements OnInit {
  loading = true;
  env = environment.name;

  _AppState: NgStateObject;

  public pivotDataSource = {};
  public exportData: any = [];
  public currentFields;
  public needUpdate = true;
  public saveCardConfig: any;
  public chartVisible;
  public config: any;
  public gridData: any;
  public isFirstLoad = true;
  public summationTypeConfig: Partial<ISummationTypeConfig>;
  public mangoDashboardCardId: number;
  public fieldModal: any;
  // This is the filename that is used when a user selects Export Datasource
  exportDataSourceFileName: string;

  @Input() cardData: any;
  @Input() dsExportFileName: string;
  @Input() canSaveDefault = false;
  @Input() pendoId: string;
  @Input() selectedSegmentId: number;
  @Output() cardMove: EventEmitter<any> = new EventEmitter();

  @ViewChild('CremPivotTable')
  cremPivotTable: CremPivotTableComponent;

  @ViewChild('SimpleGrid')
  simpleGrid: SimpleGridComponent;

  faChartBar = faChartBar;

  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private dashboardService: DashboardService,
    private toastService: AccountingToastService
  ) {
    this.summationTypeConfig = {
      showSummationTypeConfig: false,
      showDataFields: true,
    };
  }

  ngOnInit() {
    this.fieldModal = ColumnArray[this.cardData.cardJSONSchema.apiEndPoint];
    this.config = this.cardData.cardJSONSchema;

    this.mangoDashboardCardId =
      this.cardData.cardSource === 'mangodashboard'
        ? this.cardData.id
        : this.cardData.mangoDashboardCardId;
    this.dataService.cardNeedUpdate$.subscribe((item) => {
      if (item.key === this.config.apiEndPoint || item.key === 'everything') {
        this.needUpdate = item.needUpdate;
      }
    });

    this.dataService.dashboardDataUpdateKey$.subscribe((updateObj) => {
      if (updateObj && updateObj.key === this.config.apiEndPoint) {
        this.setCardData(updateObj);
      }
    });

    this.chartVisible = this.config.enableChart ?? true;
    this.exportDataSourceFileName = this.dsExportFileName + this.config.title;

    this.config.showMenuToggleFullWidth =
      this.config.showMenuToggleFullWidth || true;
    this.config.fullWidth = this.config.fullWidth || true;
  }

  public async setCardData(updateObj) {
    if (this.needUpdate || updateObj.requiredDataRefresh) {
      const data = await this.dataService.getDataSource(updateObj.key);

      this.gridData = data?.['0']?.['data'];

      if (this.config.cardType === 'pivot') {
        this.config.pivotDataSource.store = data?.['0']?.['data'];

        setTimeout(() => {
          const state = this.cremPivotTable.getPivotDataSource();
          const totalIndex = state.fields.findIndex((field) => {
            return !field.dataField;
          });

          if (totalIndex !== -1) {
            state.fields[totalIndex].caption = 'Total';
          }

          //needed to prevent duplicated field in state when a field is expanded, an issue with date fields
          this.config.pivotDataSource.fields = [];

          const uniquefields = [];
          const allColumns = ColumnArray[this.config.apiEndPoint];

          state.fields.forEach((field) => {
            if (field.dataField === 'accountingPeriodJEProcessingStatus') {
              field.sortingMethod = (a, b) => {
                switch (a.value) {
                  case 'Scheduled':
                    return -1;
                  case 'Approved':
                    if (b.value === 'Scheduled') {
                      return 1;
                    }
                    return -1;
                  case 'Exported':
                    return 1;
                }
              };
            }

            if (!uniquefields.includes(field.dataField)) {
              if (allColumns[field.dataField] === 'number') {
                field.dataType = 'number';
                field.format = ',###.##';

                if (field.summaryType !== 'sum') {
                  field.format = ',###';
                }
              } else if (allColumns[field.dataField] === 'boolean') {
                field.dataType = 'boolean';
                field.format = ',###';
              } else if (allColumns[field.dataField] === 'currency') {
                field.dataType = 'number';
                field.format = ',##0.00';

                if (field.summaryType !== 'sum') {
                  field.format = ',###';
                }
              } else if (allColumns[field.dataField] === 'Date') {
                field.dataType = 'date';
                field.format = ',###';
              } else {
                field.dataType = 'string';
                field.format = ',###';
              }

              this.config.pivotDataSource.fields.push(field);
              uniquefields.push(field.dataField);
            }
          });
          this.cremPivotTable.refreshData();
        });
      } else if (this.config.cardType === 'grid') {
        this.config.pivotDataSource = data?.['0']?.['data'];
      }
    }
    this.needUpdate = false;
  }

  public showColumnChooser() {
    this.cremPivotTable.showFieldChooser();
  }

  toggleGrandTotal(totalType: string) {
    if (totalType == 'row') {
      this.cremPivotTable.showRowGrandTotals =
        !this.cremPivotTable.showRowGrandTotals;
      return;
    }

    this.cremPivotTable.showColumnGrandTotals =
      !this.cremPivotTable.showColumnGrandTotals;
  }

  public async saveUserConfig(saveAsDefault) {
    const fieldsToSave = this.buildConfigFields();

    const configToSave = JSON.parse(JSON.stringify(this.config));
    configToSave.pivotDataSource.fields = [...new Set(fieldsToSave)];
    configToSave.enableChart = configToSave.enableChart ?? true;
    configToSave.pivotDataSource.store = null;

    configToSave.showColumnGrandTotals =
      this.cremPivotTable.showColumnGrandTotals;
    configToSave.showRowGrandTotals = this.cremPivotTable.showRowGrandTotals;

    if (!saveAsDefault) {
      if (
        this.cardData.cardSource === 'mangodashboard' ||
        this.cardData.isSiteDefault
      ) {
        //save new card
        this.dataService
          .saveCardConfig(this.mangoDashboardCardId, false, configToSave)
          .subscribe(() => {
            this.cardData.cardSource = 'clientdashboard';
            this.cardData.isSiteDefault = false;
            this.cardData.mangoDashboardCardId = this.mangoDashboardCardId;
          });
      } else if (
        this.cardData.cardSource === 'clientdashboard' &&
        !this.cardData.isSiteDefault
      ) {
        //update card
        this.dataService
          .updateCardConfig(this.mangoDashboardCardId, false, configToSave)
          .subscribe(() => {
            this.cardData.cardSource = 'clientdashboard';
            this.cardData.isSiteDefault = false;
          });
      }
    } else {
      this.dataService
        .saveCardConfig(this.mangoDashboardCardId, true, configToSave)
        .subscribe((apiResponse) => {
          if (apiResponse.clientErrorMessage === 'Card already exists.') {
            this.dataService
              .updateCardConfig(this.mangoDashboardCardId, true, configToSave)
              .subscribe();
          } else {
            if (this.cardData.cardSource === 'mangodashboard') {
              this.cardData.cardSource = 'clientdashboard';
              this.cardData.mangoDashboardCardId = this.mangoDashboardCardId;
            }
          }
        });
    }
  }

  public exportGrid() {
    try {
      this.cremPivotTable.exportToExcel(); // Current version doesn't has callback, no way to know if was a success
      this.exportNotification('success');
    } catch {
      this.exportNotification('error');
    }
  }

  public exportDatasource() {
    this.exportData = new DataSource({
      key: this.config.dataGridKeyExpr,
      load: () => this.config.pivotDataSource.store,
      onChanged: (_) => this.exportNotification('success'),
      onLoadError: (_) => this.exportNotification('error'),
    });
    setTimeout(() => {
      this.simpleGrid.exportGrid();
    }, 100);
  }

  exportNotification(type: 'success' | 'error') {
    switch (type) {
      case 'success': {
        this.toastService.showToast(
          'Success',
          'Report exported successfully.',
          ToastState.SUCCESS,
          false,
          6000
        );
        break;
      }
      case 'error': {
        this.toastService.showToast(
          'Export Failed',
          'Error encountered during export. Please try again.',
          ToastState.ERROR
        );
        break;
      }
    }
  }

  public toggleCardWidth() {
    this.config.fullWidth = !this.config.fullWidth;
    this.cremPivotTable.updateDimension();
  }

  public applyDashboardFilters() {
    return true;
  }

  public toggleChartButton() {
    this.config.enableChart = !this.config.enableChart;
    this.chartVisible = !this.chartVisible;

    if (this.chartVisible) {
      this.cremPivotTable.refreshPivotChartData();
    }
  }

  public toggleSummartyTypeDisplay() {
    this.summationTypeConfig.showSummationTypeConfig =
      !this.summationTypeConfig.showSummationTypeConfig;
  }

  public onPivotChangeCallback(dataSource) {
    const fields = [];
    const columns = dataSource.getAreaFields('column', false);
    const rows = dataSource.getAreaFields('row', false);
    const data = dataSource.getAreaFields('data', false);
    const filters = dataSource.getAreaFields('filter', false);

    columns.forEach((column) => {
      if (column.dataField && !fields.includes(column.dataField)) {
        fields.push(column.dataField);
      }
    });

    rows.forEach((row) => {
      if (row.dataField && !fields.includes(row.dataField)) {
        fields.push(row.dataField);
      }
    });

    data.forEach((e) => {
      if (e.dataField && !fields.includes(e.dataField)) {
        fields.push(e.dataField);
      }
    });

    filters.forEach((filter) => {
      if (filter.dataField && !fields.includes(filter.dataField)) {
        fields.push(filter.dataField);
      }
    });

    if (
      JSON.stringify(this.currentFields) !== JSON.stringify(fields) &&
      this.currentFields &&
      !this.isFirstLoad
    ) {
      this.currentFields = fields;
      this.needUpdate = true;
      this.currentFields = fields;

      this.dataService.updateColumnData(this.config.apiEndPoint, {
        dataSourceKey: this.config.apiEndPoint,
        columns: fields,
        segmentID: this.selectedSegmentId,
      });
    } else if (!this.currentFields) {
      this.isFirstLoad = false;
      this.currentFields = fields;
    }
  }

  public columnLimitWarning(columns) {
    this.dialog.open(ColumnLimitComponent, {
      width: '600px',
      panelClass: 'columnLimitModal',
      data: { columns },
    });
  }

  public useDefaultSetting() {
    if (
      !this.cardData.isSiteDefault &&
      this.cardData.cardSource === 'clientdashboard'
    ) {
      this.dataService
        .deleteUserConfig(this.cardData.mangoDashboardCardId)
        .subscribe(() => {
          this.resetConfigColumns();
        });
    } else {
      this.resetConfigColumns();
    }
  }

  public resetConfigColumns() {
    this.dashboardService.loadDashboardData().subscribe(async (result) => {
      const cardIndex = result.data.cardsMetaData.findIndex((card) => {
        return (
          (card.cardSource === 'clientdashboard' &&
            card.isSiteDefault === true &&
            card.mangoDashboardCardId === this.cardData.mangoDashboardCardId) ||
          (card.cardSource === 'mangodashboard' &&
            this.cardData.cardSource === 'clientdashboard' &&
            card.id === this.cardData.mangoDashboardCardId) ||
          (card.cardSource === 'mangodashboard' &&
            this.cardData.cardSource === 'mangodashboard' &&
            card.id === this.cardData.id)
        );
      });

      const config = result.data.cardsMetaData[cardIndex].cardJSONSchema;

      this.config = JSON.parse(config);
      this.cardData = result.data.cardsMetaData[cardIndex];

      setTimeout(() => {
        this.config.pivotDataSource.store = this.gridData;

        //add default fields
        const allColumns = ColumnArray[this.config.apiEndPoint];
        const pivotFields = [];

        for (const [key, value] of Object.entries(allColumns)) {
          const column = {
            dataField: key,
            dataType: '',
          };

          if (value === 'number') {
            column.dataType = 'number';
          } else if (value === 'boolean') {
            column.dataType = 'boolean';
          } else if (value === 'currency') {
            column.dataType = 'number';
          } else if (value === 'Date') {
            column.dataType = 'date';
          } else {
            column.dataType = 'string';
          }

          pivotFields.push(column);
        }

        const columnDictionaryByKey = {};

        this.config.pivotDataSource.fields.forEach((item) => {
          if (item.area && item.dataField) {
            if (!columnDictionaryByKey[this.config.apiEndPoint]) {
              columnDictionaryByKey[this.config.apiEndPoint] = [];
            }

            if (
              !columnDictionaryByKey[this.config.apiEndPoint].includes(
                item.dataField
              )
            ) {
              columnDictionaryByKey[this.config.apiEndPoint].push(
                item.dataField
              );
            }
          }
        });

        pivotFields.forEach((field) => {
          if (
            !columnDictionaryByKey[this.config.apiEndPoint].includes(
              field.dataField
            )
          ) {
            this.config.pivotDataSource.fields.push(field);
          }
        });

        //add default fields end
        setTimeout(() => {
          this.cremPivotTable.refreshData();
        });
      });
    });
  }

  private buildConfigFields() {
    const fields = [];
    const fieldsToSave = [];
    const columns = this.cremPivotTable.getAreaFields('column');
    const rows = this.cremPivotTable.getAreaFields('row');
    const data = this.cremPivotTable.getAreaFields('data');
    const filters = this.cremPivotTable.getAreaFields('filter');

    columns.forEach((column) => {
      if (column.dataField && !fields.includes(column.dataField)) {
        const field = JSON.parse(JSON.stringify(column));

        delete field['groupInterval'];
        delete field['caption'];
        delete field['groupIndex'];
        delete field['groupName'];

        fields.push(field.dataField);
        fieldsToSave.push(field);
      }
    });

    rows.forEach((row) => {
      if (row.dataField && !fields.includes(row.dataField)) {
        const field = JSON.parse(JSON.stringify(row));

        delete field['groupInterval'];
        delete field['caption'];
        delete field['groupIndex'];
        delete field['groupName'];

        fields.push(field.dataField);
        fieldsToSave.push(field);
      }
    });

    data.forEach((e) => {
      if (e.dataField && !fields.includes(e.dataField)) {
        const field = JSON.parse(JSON.stringify(e));

        delete field['groupInterval'];
        delete field['caption'];
        delete field['groupIndex'];
        delete field['groupName'];

        fields.push(field.dataField);
        fieldsToSave.push(field);
      }
    });

    filters.forEach((filter) => {
      if (filter.dataField && !fields.includes(filter.dataField)) {
        const field = JSON.parse(JSON.stringify(filter));

        delete field['groupInterval'];
        delete field['caption'];
        delete field['groupIndex'];
        delete field['groupName'];

        fields.push(field.dataField);
        fieldsToSave.push(field);
      }
    });

    return fieldsToSave;
  }
}
