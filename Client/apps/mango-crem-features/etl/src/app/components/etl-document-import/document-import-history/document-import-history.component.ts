import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { fromEvent, Subscription } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';
import { ETLService } from '@etl/services/etl.service';
import * as ExcelJS from 'exceljs';
import { CommonModule, DatePipe } from '@angular/common';
import { saveAs } from 'file-saver-es';
import { exportDataGrid } from 'devextreme/excel_exporter';
import {
  IconModule,
  ButtonModule,
  SearchComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { SystemLogRecordDtoHistoryDto } from '@etl/model/systemLog-history-dto';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    DxDataGridModule,
    SearchComponent,
    ButtonModule,
    IconModule,
  ],
  providers: [DatePipe],
  selector: 'mango-document-import-history',
  templateUrl: './document-import-history.component.html',
  styleUrls: ['./document-import-history.component.scss'],
})
export class DocumentImportHistoryComponent implements OnDestroy {
  subs: Subscription[] = [];
  documentImportHistory: SystemLogRecordDtoHistoryDto[] = [];

  @ViewChild('DataGrid') dataGrid: DxDataGridComponent;

  constructor(private etlService: ETLService, private datepipe: DatePipe) {
    this.getDocumentImportHistory();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  //Fix header filter ADA related issues
  onCellPrepared(e) {
    if (e.rowType === 'header') {
      ['click', 'keydown'].forEach((event) =>
        fromEvent(e.cellElement.querySelector('.dx-header-filter'), event)
          .pipe(
            delay(60),
            tap(() => this.FixFilterItems()),
            switchMap(() =>
              fromEvent(
                document.querySelector('.dx-texteditor-input'),
                'change'
              )
            ),
            delay(60),
            tap(() => this.FixFilterItems()),
            switchMap(() =>
              fromEvent(
                document.querySelector('span.dx-clear-button-area'),
                'click'
              )
            ),
            delay(60),
            tap(() => this.FixFilterItems())
          )
          .subscribe()
      );
    }
  }

  //Treeview scrollable needs to have role as group
  private FixFilterItems() {
    const scrollable = document.querySelector('.dx-scrollable');
    if (scrollable && scrollable.attributes['role'].value !== 'group') {
      scrollable.setAttribute('role', 'group');
    }
  }

  private getDocumentImportHistory(): void {
    this.subs.push(
      this.etlService.getDocumentImportHistory().subscribe((result) => {
        if (result.success) {
          //console.log(result);
          this.documentImportHistory = result.data;
        }
      })
    );
  }

  searchDataGrid(searchText: string): void {
    this.dataGrid?.instance?.searchByText(searchText);
  }

  exportGrids(): void {
    const workbook = new ExcelJS.Workbook();
    const serviceAccountMaintenanceSheet = workbook.addWorksheet(
      'Document Import History'
    );

    serviceAccountMaintenanceSheet.getRow(2).getCell(2).value =
      'Document Import History';
    serviceAccountMaintenanceSheet.getRow(2).getCell(2).font = {
      bold: true,
      size: 16,
      underline: 'double',
    };

    const setBackground = (gridCell, excelCell) => {
      if (gridCell.rowType === 'header') {
        excelCell.font.color = { argb: '00558E' };
        excelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'd2d2d2' },
          bgColor: { argb: 'd2d2d2' },
        };
      }
    };

    exportDataGrid({
      worksheet: serviceAccountMaintenanceSheet,
      component: this.dataGrid.instance,
      topLeftCell: { row: 5, column: 2 },
      customizeCell: ({ gridCell, excelCell }) => {
        setBackground(gridCell, excelCell);
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        const date = this.datepipe
          .transform(new Date())
          .trim()
          .replace(',', '_');
        const fileName = 'DocumentImportHistory' + '_' + date + '.xlsx';
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          fileName
        );
      });
    });
  }
}
