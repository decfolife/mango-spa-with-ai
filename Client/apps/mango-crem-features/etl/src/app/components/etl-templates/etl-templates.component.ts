import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ETLService } from '@etl/services/etl.service';
import { Observable, of, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';
import { SearchModule } from '@mango/ui-shared/cosmos';
import {
  DropdownModule,
  ButtonModule,
  LoaderModule,
  IconModule,
} from '@mango/ui-shared/lib-ui-elements';
import { DxDataGridComponent } from 'devextreme-angular';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { faL } from '@fortawesome/free-solid-svg-icons';
import { SharedLeftNavLink } from '@mango/data-models/lib-data-models';
import { ProjectsDashboardLeftNavService } from '@micro-components/services/projects-dashboard-left-nav.service';
import { filter, map } from 'rxjs/operators';
import notify from 'devextreme/ui/notify';
import { EtlTemplatesSelectPortfolioComponent } from '../etl-modals/etl-templates-select-portfolio/etl-templates-select-portfolio.component';
import { ExportDevexDatagridService } from '@mango/core-shared';
import { DownloadExcelTemplateDto } from '@etl/model/download-excel-template-dto';
import { EtlTemplatesCopyTemplateComponent } from '../etl-modals/etl-templates-copy-template/etl-templates-copy-template.component';
import { DataGridQueryDto } from '@etl/model/data-grid-query-dto';
import { EtlTemplatesDeleteTemplateComponent } from '../etl-modals/etl-templates-delete-template/etl-templates-delete-template.component';

@Component({
  selector: 'mango-etl-templates',
  standalone: true,
  imports: [
    CommonModule,
    LoaderModule,
    MatDialogModule,
    MatCardModule,
    MatDividerModule,
    DevExpressModule,
    SearchModule,
    ButtonModule,
    DropdownModule,
    IconModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './etl-templates.component.html',
  styleUrls: ['./etl-templates.component.scss'],
  providers: [ExportDevexDatagridService],
})
export class EtlTemplatesComponent implements OnInit, OnDestroy {
  @ViewChild('TemplatesDataGrid') templatesDataGrid: DxDataGridComponent;

  private subs: Subscription = new Subscription();
  templates;
  portfolios;
  dto: DownloadExcelTemplateDto;
  searchText: string = '';
  isLoading = true;
  isExpanded: boolean = true;
  hasEditRights: boolean = false;
  componentName = 'etl-templates';
  originalPortfolios: any;
  portfolioBasedObjectTypeIds = [
    2, 3, 4, 32, 34, 38, 125, 129, 156, 159, 162, 163, 169,
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public etlService: ETLService,
    private leftNavService: ProjectsDashboardLeftNavService,
    public dialog: MatDialog,
    public exportToExcelService: ExportDevexDatagridService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.getUserPreferences().subscribe());

    this.subs.add(
      this.etlService.getPortfolios().subscribe((result) => {
        if (result.success) {
          // Make a deep copy of result.data for originalPortfolios
          this.originalPortfolios = JSON.parse(JSON.stringify(result.data));
          this.portfolios = result.data;
        } else {
          this.handleError(result.errorMessage);
        }
      })
    );

    // this.subs.add(
    //   this.leftNavService
    //     .getETLModulesNavigationLinks()
    //     .pipe()
    //     .subscribe((result) => {
    //       if (result.success) {
    //         this.setCustomLeftNav(result.data);
    //       } else {
    //         this.handleError(result.errorMessage);
    //       }
    //     })
    // );

    this.subs.add(
      this.etlService.getHasEditRights().subscribe((result) => {
        if (result.success) {
          this.hasEditRights = result.data;
        } else {
          this.handleError(result.errorMessage);
        }
      })
    );
    this.refreshTemplates();
  }

  downloadTemplate(e) {
    const data = e.data;
    this.dto = new DownloadExcelTemplateDto();
    this.dto.objectTypeId = data.objectTypeId;
    this.dto.formId = data.formId ?? 0;
    this.dto.templateId = data.templateId;
    this.dto.templateName = data.templateName;
    this.dto.objectTypeTypeId = data.objectTypeTypeId;
    this.dto.objectType = data.objectType;

    const isTransactionNote =
      this.dto.objectTypeId === 129 && this.dto.parentObjectTypeId === 1;
    if (
      (this.portfolioBasedObjectTypeIds.includes(this.dto.objectTypeId) ||
        this.portfolioBasedObjectTypeIds.includes(
          this.dto.parentObjectTypeId
        )) &&
      !isTransactionNote
    ) {
      if (this.dto.objectType === 'Calendar') {
        this.filterPortfolios();
      } else if (this.originalPortfolios) {
        this.restorePortfolios();
      }
    } else {
      this.initiateDownload();
    }
  }

  filterPortfolios(): void {
    this.subs.add(
      this.etlService.getFiscalCalendarPortfolios().subscribe((result) => {
        if (result.success) {
          result.data.forEach((returnedPortfolio: any) => {
            const index = this.portfolios.findIndex(
              (p) => p.companyID === returnedPortfolio.companyID
            );
            if (index !== -1) {
              this.portfolios.splice(index, 1);
            }
          });
          if (this.portfolios.length === 0) {
            this.portfolios = [...this.originalPortfolios];
          }
          setTimeout(() => {
            this.launchPortfolioSelectionPopup(this.portfolios);
          });
        } else {
          this.handleError(result.errorMessage);
        }
      })
    );
  }

  restorePortfolios() {
    this.portfolios = [...this.originalPortfolios];
    setTimeout(() => {
      this.launchPortfolioSelectionPopup(this.portfolios);
    });
  }

  initiateDownload() {
    this.successNotify('Template Being Generated');

    this.subs.add(
      this.etlService.generateExcelTemplate(this.dto).subscribe(
        (result) => {
          if (result.success) {
            this.downloadFile(result.data);
          } else {
            this.handleError(
              result.message ||
                result.errorMessage ||
                'Failed to generate template'
            );
          }
        },
        (error) => {
          this.handleError(
            error.message ||
              error.errorMessage ||
              'An unexpected error occurred.'
          );
        }
      )
    );
  }

  private downloadFile(data: any) {
    // Decode base64 content
    const byteCharacters = window.atob(data.fileContents); // Decode base64 string to binary string
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Create a Blob from the binary data
    const blob = new Blob([byteArray], { type: data.contentType });

    // Create a URL for the Blob and trigger a download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.fileDownloadName; // Use the file name from the response
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  launchPortfolioSelectionPopup(data) {
    let dialogRef = this.dialog.open(EtlTemplatesSelectPortfolioComponent, {
      disableClose: false,
      height: '25%',
      width: '40%',
      data: {
        portfolios: this.portfolios,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dto.portfolioId = result.companyID;
        this.initiateDownload();
      }
    });
  }

  newTemplate() {
    this.router.navigate(['/crem/admin/etl/templates/details', 0], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
    });
  }

  importData() {
    this.router.navigate(['/v06/Admin/ClientSetup/ImportData.aspx']);
  }

  editTemplate(e) {
    this.router.navigate(
      ['/crem/admin/etl/templates/details', e.data.templateId],
      {
        relativeTo: this.route,
        queryParamsHandling: 'merge',
      }
    );
  }

  copyTemplate(e) {
    let dialogRef = this.dialog.open(EtlTemplatesCopyTemplateComponent, {
      disableClose: false,
      height: '28%',
      width: '40%',
      data: this.templates,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.etlService
          .getTemplateDetails(e.data.templateId)
          .subscribe((templateDetails) => {
            if (templateDetails.success) {
              templateDetails.data.isCopy = true;
              templateDetails.data.templateName = result;
              templateDetails.data.isImportForAccounting =
                templateDetails.data.isImportForAccounting ?? false;
              templateDetails.data.isImportForFinancials =
                templateDetails.data.isImportForFinancials ?? false;
              let data = new DataGridQueryDto();
              data.objectTypeId = templateDetails.data.objectTypeId;
              data.formId = templateDetails.data.formId ?? 0;
              data.initialDataFormId = templateDetails.data.formId ?? 0;
              data.templateId = templateDetails.data.templateId;
              data.templateTypeId = templateDetails.data.templateTypeId;
              data.objectTypeTypeId = templateDetails.data.objectTypeTypeId;
              data.keySourceColumn = templateDetails.data.keyField;
              data.parentKeySourceColumn =
                templateDetails.data.parentLookupValue;
              data.updateOnly = templateDetails.data.updateOnly;
              data.keyFieldDisplayName =
                templateDetails.data.keyFieldDisplayName;
              templateDetails.data.userID = e.data.userID;
              if (
                templateDetails.data.templateTypeId === 0 &&
                templateDetails.data.templateId === 0 &&
                templateDetails.data.formId === 0
              ) {
                return;
              }
              let gridColumns = [];
              this.etlService.getDataGridFields(data).subscribe((result) => {
                if (result.success) {
                  result.data.forEach((item, index) => {
                    gridColumns.push({
                      include: item.included || false,
                      required: item.required || '',
                      displayLabel: item.displayLabel || '',
                      controlType: item.controlType || '',
                      dataType: item.dataType || '',
                      helpText: item.helpText || '',
                    });
                  });
                  const filteredGridColumns = gridColumns.filter(
                    (column) => column.include
                  );
                  templateDetails.data.templateId = 0;
                  this.etlService
                    .saveTemplateForm({
                      ...templateDetails.data,
                      gridColumns: filteredGridColumns,
                    })
                    .subscribe((saveResult) => {
                      this.isLoading = false;
                      this.router.navigate(
                        ['/crem/admin/etl/templates/details', saveResult.data],
                        {
                          relativeTo: this.route,
                          queryParamsHandling: 'merge',
                        }
                      );
                    });
                }
              });
            } else {
              this.isLoading = false;
              this.handleError(templateDetails.errorMessage);
            }
          });
      }
    });
  }

  deleteTemplate(e) {
    let dialogRef = this.dialog.open(EtlTemplatesDeleteTemplateComponent, {
      disableClose: false,
      height: '23%',
      width: '40%',
      data: e.data.templateName,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.etlService
          .deleteTemplate(e.data.templateId)
          .subscribe((deleteResult) => {
            if (deleteResult.success) {
              this.successNotify(
                'You have successfully deleted template ' +
                  e.data.templateName +
                  '!'
              );
              this.refreshTemplates();
            } else {
              this.handleError(deleteResult.errorMessage);
            }
          });
      }
    });
  }

  searchDataGrid(data) {
    this.searchText = data;
    this.templatesDataGrid.instance.searchByText(data);
  }

  setCustomLeftNav(data: any) {
    const customLeftNavDataList: SharedLeftNavLink[] = data;
    const evt = new CustomEvent('SetCustomLeftNavItems', {
      detail: customLeftNavDataList,
    });
    window.dispatchEvent(evt);
  }

  getUserPreferences(): Observable<any> {
    return this.etlService.getUserPreferences().pipe(
      filter((res) => !!res && !!res.success),
      map((res) => this.etlService.setUserDateFormat(res.data.isDatesEU))
    );
  }

  handleError(message: any) {
    this.errorNotify(message);
    return of(null);
  }

  onSendToExcel() {
    this.exportToExcelService.exportToExcel(
      this.templatesDataGrid.instance,
      'Templates_' + this.formatDate()
    );
  }

  formatDate() {
    const now = new Date();

    // Pad single digits with leading zeros
    const pad = (n: number): string => n.toString().padStart(2, '0');

    // Format the date and time
    const formattedDate =
      now.getFullYear().toString() + // yyyy
      pad(now.getMonth() + 1) + // MM (Months are 0-based, so add 1)
      pad(now.getDate()) + // dd
      pad(now.getHours()) + // HH
      pad(now.getMinutes()) + // mm
      pad(now.getSeconds()); // ss

    return formattedDate;
  }

  errorNotify(message: string) {
    this.notifyPopup(message, 'error');
  }

  successNotify(message: string) {
    this.notifyPopup(message, 'success');
  }

  private notifyPopup(message: string, messageType: string) {
    notify({
      message: message,
      type: messageType,
      displayTime: 5000,
      position: { at: 'right bottom', my: 'right bottom', offset: '-16 -16' },
      maxWidth: '400px',
      closeOnClick: true,
    });
  }

  private refreshTemplates() {
    this.isLoading = true;
    this.subs.add(
      this.etlService.getETLTemplates().subscribe((result) => {
        if (result.success) {
          this.templates = result.data;
          this.isLoading = false;
        } else {
          this.isLoading = false;
          this.handleError(result.errorMessage);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
