import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SearchModule } from '@mango/ui-shared/cosmos';
import {
  LoaderModule,
  ButtonModule,
  DropdownModule,
  IconModule,
  CremToastService,
  SearchComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { DxDataGridComponent } from 'devextreme-angular';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';
import { BenchmarkingService } from '@benchmarking-files/services/benchmarking.service';
import { LogFileDownloadRequest } from '@benchmarking-files/model/log-file-download-request';
import { DownloadBenchmarkingFileRequest } from '@benchmarking-files/model/download-benchmarking-file-request';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { ToastState } from 'libs/data-models/lib-data-models/src/lib/enums/ui-shared-elements.enums';
import {
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { ExportDevexDatagridService } from 'libs/core-shared/src/lib/services/export-datagrid.service';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { BenchmarkingDocument } from '@benchmarking-files/model/benchmarking-document-interface';
import { MangoPdfViewerComponent } from '@benchmarking-files/modals/mango-pdf-viewer/mango-pdf-viewer.component';

@Component({
  selector: 'mango-benchmarking-files',
  standalone: true,
  imports: [
    CommonModule,
    LoaderModule,
    MatCardModule,
    MatDividerModule,
    DevExpressModule,
    SearchModule,
    ButtonModule,
    DropdownModule,
    IconModule,
    MatIconModule,
    MatMenuModule,
    SearchComponent,
    MangoPdfViewerComponent,
  ],
  providers: [ExportDevexDatagridService],
  templateUrl: './benchmarking-files.component.html',
  styleUrls: ['./benchmarking-files.component.scss'],
})
export class BenchmarkingFilesComponent implements OnInit, OnDestroy {
  @ViewChild('FilesDataGrid') FilesDataGrid!: DxDataGridComponent;

  private subs: Subscription = new Subscription();
  objectId!: number;
  objectTypeId!: number;
  objectTypeTypeId!: number;
  benchmarkingFiles: BenchmarkingDocument[] = [];
  objectTypeAndName = '';
  searchText = '';
  isLoading = true;
  isExpanded = true;
  showFilterBuilderPopup = false;
  availableAppliedFilterCount = 0;
  showClearFilters = false;
  ignoreFilterCount = false;
  showPdfModal: boolean = false;
  pdfTitle: string = '';
  pdfSrc: string | undefined;
  pdfPage: number = 1;
  selectedCount: number = 0;
  selectedRows: number[] = [];

  constructor(
    @Inject(BenchmarkingService)
    public benchmarkingService: BenchmarkingService,
    private route: ActivatedRoute,
    private facade: MangoAppFacade,
    private toastService: CremToastService,
    public exportToExcelService: ExportDevexDatagridService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((queryParams) => {
      const params = this.toLowerParams(queryParams);
      this.objectId = Number(params['oid']);
      this.objectTypeId = Number(params['otid']);
      this.objectTypeTypeId = Number(params['ottid']);
    });

    this.subs.add(this.getUserPreferences());
    this.getObjectTypeAndName();
    this.populateGrid();
  }

  populateGrid() {
    this.subs.add(
      this.benchmarkingService
        .lookupLease(this.objectId)
        .subscribe((result: any) => {
          if (result.success) {
            this.benchmarkingFiles = result.data;
            this.benchmarkingFiles.forEach((x) => {
              if (
                sessionStorage.getItem(x.documentId.toString()) === 'downloaded'
              ) {
                x.downloadIcon = 'faRefresh';
                x.downloadTitle = 'Download Again';
              } else {
                x.downloadIcon = 'faDownload';
                x.downloadTitle = 'Download';
              }
            });
            this.isLoading = false;
          } else {
            this.handleError(result.errorMessage);
          }
        })
    );
  }

  searchDataGrid(data: string) {
    this.ignoreFilterCount = true;
    this.searchText = data;
    this.FilesDataGrid.instance.searchByText(data);
  }

  showColumnChooser() {
    this.FilesDataGrid.instance.showColumnChooser();
  }

  sendToExcel(): void {
    if (this.FilesDataGrid?.instance) {
      this.exportToExcelService.exportToExcel(
        this.FilesDataGrid.instance,
        `${this.benchmarkingFiles[0].clientKey ?? ''}_${
          this.objectId ?? ''
        }_Benchmarking_Files_${this.getTimeStamp().toLocaleString()}_${
          environment.name
        }`
      );
    }
  }

  countFilterConditions(filter: any): number {
    if (!filter) return 0;
    if (
      Array.isArray(filter) &&
      typeof filter[0] === 'string' &&
      filter.length === 3 &&
      !filter.some((item) => item.selectedFilterOperation)
    ) {
      return 1;
    }
    if (Array.isArray(filter)) {
      return filter.reduce((count, item) => {
        if (item === 'and' || item === 'or') return count;
        return count + this.countFilterConditions(item);
      }, 0);
    }
    return 0;
  }

  onGridContentReady(event: any) {
    const filters = this.countFilterConditions(
      this.FilesDataGrid?.instance.getCombinedFilter(true)
    );
    if (!this.ignoreFilterCount) {
      this.availableAppliedFilterCount = filters;
    }

    this.ignoreFilterCount = false;
  }

  clearAvailableFilters(event: any) {
    event.stopPropagation();
    this.FilesDataGrid.instance.clearFilter();
    this.showClearFilters = false;
  }

  toggleAvailableFilters(): void {
    this.showClearFilters = !this.showClearFilters;
  }

  getUserPreferences() {
    this.facade.contactRecord$.subscribe((contact) => {
      this.benchmarkingService.dateFormat = contact.preferences?.contactDatesEU
        ? 'dd.MM.yyyy'
        : 'MM/dd/yyyy';
    });
  }

  getTimeStamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}${minutes}${seconds}`;
  }

  getObjectTypeAndName() {
    this.subs.add(
      this.benchmarkingService
        .getObjectTypeAndName(this.objectId, this.objectTypeId)
        .subscribe((result: any) => {
          if (result.success) {
            this.objectTypeAndName = result.data;
          } else {
            this.handleError(result.errorMessage);
          }
        })
    );
  }

  getRowBytes(rowData: { documentTotalBytes: any }) {
    return rowData.documentTotalBytes;
  }

  getRawDate(rowData: { dateUploaded: Date }) {
    let dateString = rowData.dateUploaded.toString().split('T')[0];
    return new Date(dateString);
  }

  openPdfViewerModal() {
    let dialogRef = this.dialog.open(MangoPdfViewerComponent, {
      data: {
        pdfTitle: this.pdfTitle,
        pdfSrc: this.pdfSrc,
      },
    });
    dialogRef.afterClosed().subscribe((response) => {
      if (response) {
        let matchingFile = this.benchmarkingFiles.find(
          (x) => x.userFileName === this.pdfTitle
        );
        if (matchingFile) {
          this.MarkFileAsDownloaded(matchingFile);
        } else {
          console.warn(
            'No matching file found for the given title:',
            this.pdfTitle
          );
        }
      }
    });
  }

  onFileDownloadClick(rowData: any, preview?: boolean): void {
    if (!rowData?.documentId) {
      console.error('Document ID is missing.');
      return;
    }

    this.logFileDownload(rowData);
    this.downloadBenchmarkingFile(rowData, preview);
  }

  // Download the benchmarking file from the api
  private downloadBenchmarkingFile(rowData: any, preview?: boolean) {
    const downloadBenchmarkingFileRequest: DownloadBenchmarkingFileRequest = {
      oid: this.objectId,
      otid: this.objectTypeId,
      documentId: rowData.documentId,
    };

    this.subs.add(
      this.benchmarkingService
        .downloadBenchmarkingFile(downloadBenchmarkingFileRequest)
        .subscribe(
          (response: HttpResponse<Blob>) => {
            if (response.body) {
              const fileName =
                (this.fileHasExtension(rowData?.userFileName) &&
                  rowData?.userFileName) ||
                (this.fileHasExtension(rowData?.systemFileName) &&
                  rowData?.systemFileName) ||
                null;

              if (preview) {
                this.previewFile(response.body, fileName);
              } else {
                this.downloadFile(response.body, fileName);
                this.successNotify('File Downloaded Successfully');
                let download = this.benchmarkingFiles.filter(
                  (f) => f.documentId == rowData.documentId
                )[0];
                this.MarkFileAsDownloaded(download);
                console.log(
                  sessionStorage.getItem(download.documentId.toString()) ||
                    'session not found'
                );
              }
            } else {
              this.handleError('Failed to download document');
            }
          },
          (error) => {
            this.handleBlobError(error);
          }
        )
    );
  }

  fileHasExtension(fileName: string) {
    const dot = fileName.lastIndexOf('.');
    return dot > 0 && dot < fileName.length - 1;
  }

  // handle any errors returning from the file downloading
  private handleBlobError(error: HttpErrorResponse) {
    if (error.error instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorJson = JSON.parse(reader.result as string);
          this.handleError(
            errorJson.clientErrorMessage ||
              errorJson ||
              'An unexpected error occurred.'
          );
        } catch (e) {
          this.handleError(
            'An error occurred, but could not parse error details.'
          );
        }
      };
      reader.readAsText(error.error);
    } else {
      this.handleError(error.message || 'An unexpected error occurred.');
    }
  }

  // Send file to the browser
  private downloadFile(blob: Blob, fileName: string) {
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  }

  private MarkFileAsDownloaded(download: any) {
    download.downloadIcon = 'faRefresh';
    download.downloadTitle = 'Download Again';
    sessionStorage.setItem(download.documentId.toString(), 'downloaded');
  }

  private previewFile(blob: Blob, fileName: string) {
    this.showPdfModal = false;
    this.pdfSrc = undefined;
    this.pdfTitle = fileName;
    const downloadUrl = window.URL.createObjectURL(blob);
    this.pdfSrc = downloadUrl;
    this.openPdfViewerModal();
  }

  // Log history that the file was opened
  private logFileDownload(rowData: any) {
    const logFileDownloadRequest: LogFileDownloadRequest = {
      userFileName: rowData.userFileName,
      systemFileName: rowData.systemFileName,
      documentTotalBytes: rowData.documentTotalBytes,
      oid: this.objectId,
      otid: this.objectTypeId,
      description: rowData.description,
      documentId: String(rowData.documentId),
      clientKey: rowData.clientKey,
    };

    this.subs.add(
      this.benchmarkingService
        .logFileDownload(logFileDownloadRequest)
        .subscribe((result: any) => {
          if (!result.success) {
            this.handleError(result.errorMessage);
          }
        })
    );
  }

  handleError(message: any) {
    this.errorNotify(message);
    return of(null);
  }

  downloadSelected() {
    const selected = this.FilesDataGrid.instance.getSelectedRowsData();
    selected.forEach((x) => {
      this.downloadBenchmarkingFile(x);
    });
  }

  private toLowerParams(params: Params): Params {
    return Object.keys(params).reduce((acc, key) => {
      acc[key.toLowerCase()] = params[key];
      return acc;
    }, {} as Params);
  }

  errorNotify(message: string) {
    this.toastService.show(message, '', ToastState.ERROR, {
      position: 'bottom right',
      maxWidth: '350px',
    });
  }

  successNotify(message: string) {
    this.toastService.show(message, 'Success', ToastState.SUCCESS);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
