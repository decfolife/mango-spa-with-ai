import {
  Component,
  Input,
  Output,
  ViewChild,
  EventEmitter,
  OnInit,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Workbook } from 'exceljs';
import { exportDataGrid, exportPivotGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver-es';
import {
  DxDataGridComponent,
  DxDataGridModule,
} from 'devextreme-angular/ui/data-grid';
import { DynamicWidgetService } from './dynamic-form.service';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { Observable } from 'rxjs';
import { Widget } from '@forms/model/dynamic-forms.interface';
import { take } from 'rxjs/operators';
import { DataPivotConfig } from '@mango/data-models/lib-data-models';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { GridMasterDetail } from './dynamic-widget.model';
import { DxPivotGridComponent, DxPivotGridModule } from 'devextreme-angular';

@Component({
  selector: 'mango-dynamic-form-export-widget',
  template: `
    <dx-data-grid
      *ngIf="exportType === 'dataGrid'"
      #exportDataGrid
      [visible]="true"
      [dataSource]="gridDataSource"
      (onContentReady)="handleExportGridReady()"
      [columnAutoWidth]="true"
    >
      <!-- Columns  -->
      <ng-container *ngFor="let columnField of gridMasterDetail.columnFields">
        <dxi-column
          [alignment]="'left'"
          [visible]="columnField.exportOnly"
          [caption]="columnField.columnHeader"
          [dataField]="columnField.dataFieldTableField | lowercase"
          [format]="
            columnField.dataFieldDataType === DATE_COL_ID
              ? dateFormat
              : columnField.dataTypeFormatString
          "
        ></dxi-column>
      </ng-container>
      <!-- End Grid Columns -->
    </dx-data-grid>

    <dx-pivot-grid
      *ngIf="exportType === 'pivotGrid'"
      #exportPivotGrid
      [visible]="true"
      [dataSource]="gridDataSource"
      (onContentReady)="handleExportGridReady()"
      [texts]="dataPivotConf?.texts"
      [showBorders]="dataPivotConf?.showBorders ?? true"
      [showRowTotals]="dataPivotConf?.showRowTotals ?? false"
      [allowFiltering]="dataPivotConf?.allowFiltering ?? true"
      [showColumnTotals]="dataPivotConf?.showColumnTotals ?? false"
      [showRowGrandTotals]="dataPivotConf?.showRowGrandTotals ?? false"
      [showColumnGrandTotals]="dataPivotConf?.showColumnGrandTotals ?? false"
      [allowSortingBySummary]="dataPivotConf?.allowSortingBySummary ?? true"
    >
    </dx-pivot-grid>
  `,
  styles: [
    `
      /* 
     * DevExtreme’s export utilities (like exportDataGrid) require the grid to be rendered and visible in the layout.
     * If the grid is display: none, it is not part of the render tree, and export will fail or generate a blank file.
     */
      :host.export-hidden {
        position: absolute;
        left: -9999px;
        top: -9999px;
        overflow: hidden;
        max-width: 1280px;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxPivotGridModule],
})
export class DynamicFormWidgetExportComponent implements OnInit {
  @Input() gridMasterDetail: GridMasterDetail;
  @Input() columnFormatMap;
  @Input() dateFormat;
  @Input() selectWidget$: Observable<Widget>;
  @Input() exportType: 'dataGrid' | 'pivotGrid';
  @Input() gridDataSource: any[];
  @Input() dataPivotConf: Partial<DataPivotConfig>;

  widgetName: string;

  DATE_COL_ID = '7';

  /**
   * Renders a temporary, hidden dxDataGrid solely for export purposes.
   * This allows exporting all necessary columns (including those hidden in the UI)
   * without toggling the 'visible' flag on the main grid.
   */
  @ViewChild('exportDataGrid', { static: false }) dataGrid: DxDataGridComponent;
  @ViewChild('exportPivotGrid', { static: false })
  pivotGrid: DxPivotGridComponent;

  @Output() exportDone = new EventEmitter<boolean>();

  @HostBinding('class.export-hidden')
  isHidden = true;

  constructor(private widgetService: DynamicWidgetService) {}

  async ngOnInit() {
    this.widgetName = (
      await this.selectWidget$.pipe(take(1)).toPromise()
    ).widgetName;

    this.gridMasterDetail.columnFields.sort((a, b) => {
      if (a.columnListRow < b.columnListRow) return -1;
      if (a.columnListRow > b.columnListRow) return 1;

      if (a.columnSortOrder < b.columnSortOrder) return -1;
      if (a.columnSortOrder > a.columnSortOrder) return 1;

      return 0;
    });
  }

  /**
   * Entry Logic to create Files to export
   *
   * @memberof DynamicFormWidgetExportComponent
   */
  async handleExportGridReady() {
    const baseStyle = { name: 'Arial', size: 10 };
    const fileName = this.widgetService.buildExcelFileName(
      this.widgetName,
      environment
    );

    try {
      if (this.exportType === 'dataGrid') {
        await this.exportDataGrid(baseStyle, fileName);
      } else if (this.exportType === 'pivotGrid') {
        await this.exportPivotGrid(baseStyle, fileName);
      }

      this.exportDone.emit(true);
    } catch (error) {
      console.error('Export failed:', error);
      this.exportDone.emit(false);
    }
  }

  /**
   * Export Widget when is Dx Data Grid
   *
   * @param {(Record<string, string | number>)} baseStyle
   * @param {string} fileName
   * @memberof DynamicFormWidgetExportComponent
   */
  async exportDataGrid(
    baseStyle: Record<string, string | number>,
    fileName: string
  ) {
    const workbook = new Workbook();
    let worksheet = workbook.addWorksheet(this.widgetName);

    await exportDataGrid({
      component: this.dataGrid.instance,
      worksheet: worksheet,
      autoFilterEnabled: true,
      customizeCell: function (options) {
        options.excelCell.font = baseStyle;
        options.excelCell.alignment = { wrapText: true };
      },
    });

    worksheet = workbook.worksheets[0];

    const columnNames = [];
    worksheet.getRow(1).eachCell((cell, _) => {
      columnNames.push(cell.value); // Get the value from each cell in the first row
      cell.style.font = { ...baseStyle, bold: true };
    });

    worksheet.columns.forEach((col, index) => {
      const header = columnNames[index];

      if (this.columnFormatMap.get(header)) {
        col.eachCell((cell, _) => {
          if (typeof cell.value === 'number') {
            cell.numFmt = this.columnFormatMap.get(header);
          }
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      `${fileName}.xlsx`
    );
  }

  /**
   * Export Widget when is Dx Pivot Grid
   *
   * @param {(Record<string, string | number>)} baseStyle
   * @param {string} fileName
   * @memberof DynamicFormWidgetExportComponent
   */
  async exportPivotGrid(
    baseStyle: Record<string, string | number>,
    fileName: string
  ) {
    const workbook = new Workbook();
    let worksheet = workbook.addWorksheet(this.widgetName);

    await exportPivotGrid({
      component: this.pivotGrid.instance,
      worksheet: worksheet,
      customizeCell: function (options) {
        const { pivotCell, excelCell } = options;

        excelCell.font = baseStyle;
        excelCell.alignment = { wrapText: true };

        const value = pivotCell.value;
        if (value != null && !isNaN(Number(value))) {
          excelCell.value = Number(value);
          excelCell.numFmt = '#,##0.00';
        }
      },
    });

    worksheet = workbook.worksheets[0];

    const columnNames = [];
    worksheet.getRow(1).eachCell((cell, _) => {
      columnNames.push(cell.value); // Get the value from each cell in the first row
      cell.style.font = { ...baseStyle, bold: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      `${fileName}.xlsx`
    );
  }
}
