import { WorkFlowStatusHistory } from '@accounting-summary/models/interfaces/workflow-status-history.interfaces';
import { UserInfoResponse } from '@accounting-summary/models/user-info-response.modal';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';
import ScrollView from 'devextreme/ui/scroll_view';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver-es';

@Component({
  selector: 'mango-workflow-history-popup',
  templateUrl: './workflow-history-popup.component.html',
  styleUrls: ['./workflow-history-popup.component.scss'],
})
export class WorkflowHistoryPopupComponent {
  @ViewChild('WorkflowHistoryPopup') mainPopup: DxPopupComponent;
  @ViewChild('PopupMainScrollView') mainScrollView: DxScrollViewComponent;
  @Input() userInfo: UserInfoResponse;
  @Input() workflowStatusHistory: WorkFlowStatusHistory[];

  componentName = 'workflow-history-component';
  workflowHistoryPopVisible = false;
  isFullscreen = false;
  historyEvents: any[];
  dateFormat = 'MM/dd/yyyy, h:mm a';
  mainScrollViewId: string;
  currentTemplate = 'noDataTemplate';
  scrollViewComponents: ScrollView[];

  constructor(public accountingSummaryService: AccountingSummaryService) {
    this.mainScrollViewId = accountingSummaryService.getId(
      this.componentName,
      'main',
      'scrollview'
    );
    this.scrollViewComponents = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.userInfo !== undefined &&
      changes.userInfo.currentValue !== undefined
    ) {
      const isEuroDateFormat = this.userInfo?.useDateEU;
      if (isEuroDateFormat) {
        this.dateFormat = 'dd.MM.yyyy, h:mm a';
      }
    }

    if (
      changes.workflowStatusHistory !== undefined &&
      changes.workflowStatusHistory.currentValue !== undefined
    ) {
      if (changes.workflowStatusHistory.currentValue.length > 0) {
        this.historyEvents = this.workflowStatusHistory;
        this.currentTemplate = 'dataTemplate';
      }
    }
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheetName = `System Lease ID ${this.accountingSummaryService.getLeaseAbstractId()}`;
    const filename = this.accountingSummaryService.getFileName(
      'WorkflowChangeHistory'
    );

    const worksheet = workbook.addWorksheet(worksheetName);

    // Captions, corresponding keys, width of the column
    const headers = [
      { caption: 'Date', key: 'modifiedDate', width: 25 },
      { caption: 'User', key: 'modifiedByName', width: 25 },
      { caption: 'Status', key: 'workflowStatus', width: 25 },
      { caption: 'Description', key: 'description', width: 40 },
      { caption: 'Comment', key: 'comment', width: 40 },
    ];

    const headerRow = headers.map((header) => header.caption);
    const headerRowObject = worksheet.addRow(headerRow);
    headerRowObject.font = { bold: true };
    headerRowObject.height = 25;

    headers.forEach((header, index) => {
      worksheet.getColumn(index + 1).width = header.width;
    });

    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' },
    ];

    const workflowStatusHistory = this.workflowStatusHistory;

    workflowStatusHistory.forEach((item) => {
      const row = headers.map((header) => item[header.key]);
      worksheet.addRow(row);
    });

    worksheet.eachRow({ includeEmpty: true }, function (row) {
      row.eachCell({ includeEmpty: true }, function (cell) {
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
      saveAs(
        new Blob([buffer], { type: 'application/octet-stream' }),
        filename
      );
    });
  }

  showHistoryPopup(event: any) {
    this.workflowHistoryPopVisible = true;
  }

  hideHistoryPopup(event: any) {
    this.workflowHistoryPopVisible = false;
  }

  onPopupHiddenEvent(event) {
    this.isFullscreen = false;
    this.resetVerticalScrollToTheTop();
  }

  determineScrollViewHeight(event) {
    const svComponentsArray = this.scrollViewComponents.filter(
      (svc) => svc.scrollHeight() === svc.clientHeight()
    );
    svComponentsArray.forEach((svc) => svc.option('height', 'fit-content'));

    //Fix DevExtreme Popup ADA issues
    const popUpContent = document.querySelectorAll(
      '.dx-overlay-content.dx-popup-draggable'
    );
    popUpContent.forEach((element) => {
      element.setAttribute('aria-label', 'Workflow Change History');
    });
  }

  toggleFullscreen(event) {
    this.isFullscreen = !this.isFullscreen;
  }

  onScrollViewInitialized(event) {
    this.scrollViewComponents.push(event.component);
  }

  private resetVerticalScrollToTheTop() {
    const svComponentsWithScrollArray = this.scrollViewComponents.filter(
      (svc) => svc.scrollHeight() > svc.clientHeight()
    );
    svComponentsWithScrollArray.forEach((svc) => svc.scrollTo(0));

    this.mainPopup?.instance.option('height', '500');
    this.mainPopup?.instance.option('width', '900');
    this.mainScrollView?.instance.scrollTo(0);
  }

  formatComment(comment: string): string {
    return comment.replace(/\n/g, '<br>');
  }
}
