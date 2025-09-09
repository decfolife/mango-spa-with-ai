import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  DevExtremeModule,
  DxDataGridComponent,
  DxLoadPanelModule,
  DxFilterBuilderModule,
  DxButtonModule,
} from 'devextreme-angular';
import { ExportHistoryService } from '../../services/export-history.service';
import {
  Condition,
  ExportHistoryColumnsService,
} from '../../services/export-history-columns.service';
import {
  CremToastService,
  ButtonModule,
  CremPopupComponent,
  SearchComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { ToastState } from '@mango/data-models/lib-data-models';
import { ExportHistory } from '../../models/interfaces/export-history.interface';
import { ActivatedRoute } from '@angular/router';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { ContactPreferences } from 'libs/data-models/lib-data-models/src/lib/models/contact.interface';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver-es';

@Component({
  selector: 'mango-export-history',
  standalone: true,
  imports: [
    CommonModule,
    DevExtremeModule,
    DxLoadPanelModule,
    ButtonModule,
    DxFilterBuilderModule,
    ButtonModule,
    CremPopupComponent,
    SearchComponent,
  ],
  templateUrl: './export-history.component.html',
  styleUrls: ['./export-history.component.scss'],
})
export class ExportHistoryComponent implements OnInit, OnDestroy {
  @ViewChild('ExportHistoryGrid') exportHistoryGrid: DxDataGridComponent;
  exportHistory: ExportHistory;
  exportHistoryColumns: any[] = [];
  showLoading: boolean = true;
  subs: Subscription = new Subscription();
  integrationType: string;
  contactPrefs: ContactPreferences;
  dateFormat = 'MM/dd/yyyy';
  sendToExcelClicked = false;
  workSheet: any;
  pageName: string;
  filter: Condition;
  gridFilterValue: Condition;
  showFilterBuilderPopUp: boolean;
  columnResizingMode = 'widget';
  searchText: string = '';

  constructor(
    public exportHistoryService: ExportHistoryService,
    public exportHistoryColumnsService: ExportHistoryColumnsService,
    private toastService: CremToastService,
    private activatedRoute: ActivatedRoute,
    private facade: MangoAppFacade
  ) {}

  ngOnInit(): void {
    this.integrationType = this.activatedRoute.snapshot.data.integrationType;
    this.getUserprefs();
    this.getExportHistory(this.integrationType);
    this.pageName = this.formatPageName(this.integrationType);

    const historyType = window.location.toString().split('/').pop();
    this.exportHistoryColumns =
      this.exportHistoryColumnsService.getExportHistoryColumns(
        this.dateFormat,
        historyType == null
          ? ''
          : historyType.toLocaleUpperCase().substring(0, 2)
      );

    this.filter = this.exportHistoryColumnsService.getFilter();
    this.gridFilterValue = this.filter;
    this.showFilterBuilderPopUp = false;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getExportHistory(integrationType) {
    this.subs.add(
      this.exportHistoryService
        .getLedgerExportHistoryByType(integrationType)
        .subscribe((response) => {
          if (response.success) {
            this.exportHistory = response.data;
            this.showLoading = false;
          } else if (response === null) {
            this.toastService.show(
              `An error occurred, please try again.`,
              'Error',
              ToastState.ERROR,
              {
                maxWidth: '360px',
                duration: 180000,
              }
            );
          }
        })
    );
  }

  getUserprefs() {
    this.subs.add(
      this.facade.contactRecord$.subscribe(
        (contactRecord) => (this.contactPrefs = contactRecord.preferences)
      )
    );
    this.dateFormat = this.contactPrefs.contactDatesEU
      ? 'dd.MM.yyyy hh:mm:ss a'
      : 'MM/dd/yyyy hh:mm:ss a';
  }

  sendToExcelFileName(): string {
    const dateTimeStamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const fileName = `${this.integrationType}_History_${dateTimeStamp}.xlsx`;
    return fileName;
  }

  sendToExcel(event: any): void {
    this.sendToExcelClicked = true;
    const fileName = this.sendToExcelFileName();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.workSheet);

    exportDataGrid({
      component: this.exportHistoryGrid.instance,
      worksheet: worksheet,
      customizeCell: (options: { gridCell?: any; excelCell?: any }) => {
        if (options.gridCell?.column?.dataField === 'vpDocumentsPath') {
          const fullFilePath = options.gridCell.value;
          if (fullFilePath) {
            const splitFileName = fullFilePath.split('/').pop();
            options.excelCell.value = splitFileName;
          }
        }
      },
    }).then(() => {
      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
          cell.alignment = { wrapText: true, vertical: 'top' };
        });
      });

      workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          fileName
        );
      });
    });
    setTimeout(() => {
      this.sendToExcelClicked = false;
    }, 100);
  }

  formatPageName(integrationType: string): string {
    switch (integrationType) {
      case 'AP':
        return 'AP Export History';
      case 'AR':
        return 'AR Export History';
      case 'JEtoExport':
        return 'JE Export History';
      default:
        return '';
    }
  }

  apply(e) {
    this.gridFilterValue = this.filter;
    this.exportHistoryGrid.instance.refresh();
    this.close(e);
  }

  onShowClick(e) {
    this.showFilterBuilderPopUp = true;
  }

  close(e) {
    this.showFilterBuilderPopUp = false;
  }

  clearFilters() {
    this.filter = [];
    this.gridFilterValue = [];

    if (this.exportHistoryGrid && this.exportHistoryGrid.instance) {
      this.exportHistoryGrid.instance.clearFilter();
      this.exportHistoryGrid.instance.refresh();
    }
  }

  changed(data) {
    this.searchText = data;
    this.exportHistoryGrid.instance.searchByText(data);
  }

  adaAttrNoDataGrid(e: any) {
    const dxGridwithTables = e.component
      .$element()
      .find('.dx-datagrid-headers.dx-bordered-top-view');
    if (dxGridwithTables && dxGridwithTables.length > 0) {
      for (let i = 0; i < dxGridwithTables.length; i++) {
        const element = dxGridwithTables[i];
        if (element) {
          element.setAttribute('role', 'grid');
        }
      }
    }
  }
}
