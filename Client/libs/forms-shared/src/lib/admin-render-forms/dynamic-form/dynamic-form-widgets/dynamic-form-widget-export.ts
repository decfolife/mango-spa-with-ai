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
import { exportDataGrid } from 'devextreme/excel_exporter';
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
import { ToastState } from '@mango/data-models/lib-data-models';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { GridMasterDetail } from './dynamic-widget.model';

@Component({
  selector: 'mango-dynamic-form-export-widget',
  template: `
    <dx-data-grid
      #exportGrid
      [visible]="true"
      [dataSource]="widget.renderFormWidgetData"
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
  imports: [CommonModule, DxDataGridModule],
})
export class DynamicFormWidgetExportComponent implements OnInit {
  @Input() widget: Widget;
  @Input() gridMasterDetail: GridMasterDetail;
  @Input() columnFormatMap;
  @Input() dateFormat;
  @Input() selectWidget$: Observable<Widget>;
  @Input() exportType: 'dataGrid' | 'pivotGrid';

  widgetName: string;

  DATE_COL_ID = '7';

  /**
   * Renders a temporary, hidden dxDataGrid solely for export purposes.
   * This allows exporting all necessary columns (including those hidden in the UI)
   * without toggling the 'visible' flag on the main grid.
   */
  @ViewChild('exportGrid', { static: false }) exportGrid: DxDataGridComponent;

  @Output() exportDone = new EventEmitter<boolean>();

  @HostBinding('class.export-hidden')
  isHidden = true;

  constructor(
    private widgetService: DynamicWidgetService,
    private toastService: CremToastService
  ) {}

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
  handleExportGridReady() {
    const baseStyle = { name: 'Arial', size: 10 };
    const fileName = this.widgetService.buildExcelFileName(
      this.widgetName,
      environment
    );

    if (this.exportType === 'dataGrid') {
      this.exportDataGrid(baseStyle, fileName);
    } else {
      // todo: add exportPivotGrid method.
    }
    this.exportDone.emit(true);
  }

  /**
   * Export Widget when is Dx Data Grid
   *
   * @param {(Record<string, string | number>)} baseStyle
   * @param {string} fileName
   * @memberof DynamicFormWidgetExportComponent
   */
  exportDataGrid(baseStyle: Record<string, string | number>, fileName: string) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(this.widgetName);

    exportDataGrid({
      component: this.exportGrid.instance, // this.widgetDataGrid.instance
      worksheet: worksheet,
      autoFilterEnabled: true,
      customizeCell: function (options) {
        options.excelCell.font = baseStyle;
        options.excelCell.alignment = { wrapText: true };
      },
    })
      .then(() => {
        const worksheet = workbook.worksheets[0];

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

        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(
            new Blob([buffer], { type: 'application/octet-stream' }),
            `${fileName}.xlsx`
          );
        });
      })
      .catch((e) => {
        console.error('An error has occurred. Please try again.', e);
        this.toastService.show(
          'An error has occurred. Please try again.',
          '',
          ToastState.ERROR,
          {
            position: 'bottom right',
            maxWidth: '350px',
          }
        );
      });
  }
}
