import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AccountingHistoryService } from '@accounting-history/services/accounting-history.service';
import { AccountingHistoryColumnsService } from '../../services/accounting-history-columns.service';
import { DropdownModule } from '@mango/ui-shared/lib-ui-elements';
import { ToastState } from '@mango/data-models/lib-data-models';
import {
  DevExtremeModule,
  DxDataGridComponent,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { ButtonModule } from '../../../../../../../libs/ui-shared/lib-ui-elements/src';
import { exportDataGrid } from 'devextreme/excel_exporter';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver-es';
import { UserPreferences } from '../../models/interfaces/user-preferences.interface';
import { UserPortfolios } from '../../models/interfaces/user-portfolios.interface';
import { AccountingHistory } from '../../models/interfaces/accounting-history.interface';
import { AccountingToastService } from 'apps/mango-crem-features/accounting-summary/src/app/services/accounting-toast.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
@Component({
  selector: 'mango-accounting-history',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    DevExtremeModule,
    ButtonModule,
    DxLoadPanelModule,
    ToastModule,
  ],
  providers: [AccountingToastService, MessageService],
  templateUrl: './accounting-history.component.html',
  styleUrls: ['./accounting-history.component.scss'],
})
export class AccountingHistoryComponent implements OnInit {
  @ViewChild('AccountingHistoryGrid')
  accountingHistoryGrid: DxDataGridComponent;

  userPreferences: UserPreferences;
  userPortfolios: UserPortfolios;
  accountingHistory: AccountingHistory;
  portfolioID: number;
  workSheet: string;
  dateFormat = 'MM/dd/yyyy';
  accountingHistoryColumns: any[] = [];
  showLoading: boolean = true;
  sendToExcelClicked = false;

  public subscription = new Subscription();

  constructor(
    public accountingHistoryService: AccountingHistoryService,
    public accountingHistoryColumnsService: AccountingHistoryColumnsService,
    private toastService: AccountingToastService
  ) {}

  ngOnInit(): void {
    this.getUserInfo();
    this.getUserPortfolios();
  }

  onPortfolioSelectedItem(event: any) {
    this.showLoading = true;
    this.portfolioID = event[0].companyID;
    this.workSheet = event[0].companyName;
    this.getAccountingHistory(this.portfolioID);
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
    const fileName = `Accounting_History_${dateTimeStamp}.xlsx`;
    return fileName;
  }

  sendToExcel(event: any): void {
    this.sendToExcelClicked = true;
    const fileName = this.sendToExcelFileName();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.workSheet);

    exportDataGrid({
      component: this.accountingHistoryGrid.instance,
      worksheet: worksheet,
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

  getUserInfo() {
    this.subscription.add(
      this.accountingHistoryService.getUserPreferences().subscribe(
        (response) => {
          if (response.success) {
            this.userPreferences = response.data;
            this.dateFormat = response.data.isDatesEU
              ? 'dd.MM.yyyy hh:mm:ss a'
              : 'MM/dd/yyyy hh:mm:ss a';
          } else if (response === null) {
            this.toastService.showToast(
              'Error',
              'An error has occurred. Please try again.',
              ToastState.ERROR
            );
          }
        },
        (error) => {
          this.toastService.showToast(
            'Error',
            'An error has occurred retrieving user preferences',
            ToastState.ERROR
          );
        }
      )
    );
  }

  getUserPortfolios() {
    this.subscription.add(
      this.accountingHistoryService
        .getUserPortfolios()
        .subscribe((response) => {
          if (response.success) {
            this.userPortfolios = response.data;
          } else if (response === null) {
            this.toastService.showToast(
              'Error',
              response.clientErrorMessage ||
                'An error has occurred. Please try again.',
              ToastState.ERROR
            );
          }
        })
    );
  }

  getAccountingHistory(portfolioID) {
    this.subscription.add(
      this.accountingHistoryService
        .getAccountingHistory(portfolioID)
        .subscribe((response) => {
          if (response.success) {
            this.accountingHistory = response.data;
            this.accountingHistoryColumns =
              this.accountingHistoryColumnsService.getAccountingHistoryColumns(
                this.dateFormat
              );
            this.showLoading = false;
          } else if (response === null) {
            this.toastService.showToast(
              'Error',
              response.clientErrorMessage ||
                'An error has occurred. Please try again.',
              ToastState.ERROR
            );
          }
        })
    );
  }
}
