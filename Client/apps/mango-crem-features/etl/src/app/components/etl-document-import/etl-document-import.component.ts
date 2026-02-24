import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ETLService } from '@etl/services/etl.service';
import { FileUploadService } from '@etl/services/file-upload-service';
import { Subscription } from 'rxjs';
import {
  PageHeaderComponent,
  ButtonModule,
  CardModule,
  CheckBoxComponent,
  InputComponent,
  NoObjectsFoundComponent,
  ToastComponent,
  CremToastService,
} from '@mango/ui-shared/lib-ui-elements';
import { ToastState } from 'libs/data-models/lib-data-models/src';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { DxFileUploaderModule } from 'devextreme-angular';
import {
  DxFileUploaderComponent,
  DxFileUploaderTypes,
} from 'devextreme-angular/ui/file-uploader';
import {
  ETLDocImportLongProcess,
  ETLDocumentImportStatus,
  ETLDocumentImportStep,
} from '@etl/model/document-import-enums';
import { Router, RouterStateSnapshot } from '@angular/router';
import { MangoDialogService } from '@mango/core-shared';
import { FilesValidationResultsComponent } from '../etl-document-import/files-validation-results/files-validation-results.component';
import { TemplateValidationResultsComponent } from '../etl-document-import/template-validation-results/template-validation-results.component';
import { MapToObjectsComponent } from '../etl-document-import/map-to-objects/map-to-objects.component';

@Component({
  selector: 'mango-etl-document-import',
  templateUrl: './etl-document-import.component.html',
  styleUrls: [
    './etl-document-import.component.scss',
    './etl-document-import-shared-styles.scss',
  ],
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonModule,
    CardModule,
    CheckBoxComponent,
    InputComponent,
    NoObjectsFoundComponent,
    MatStepperModule,
    ToastComponent,
    DxFileUploaderModule,
    FilesValidationResultsComponent,
    TemplateValidationResultsComponent,
    MapToObjectsComponent,
  ],
})
export class EtlDocumentImportComponent {
  @ViewChild('DocumentImportStepper', { static: false }) stepper: MatStepper;
  routerSnapshot: RouterStateSnapshot;
  dxfileUploaderComponent!: DxFileUploaderComponent;
  subs: Subscription[] = [];
  canAccessDocumentImportPage = true;
  currentUrl = '';
  allowedExtensions = '';
  isFTP = false;
  fileSelected = false;
  fileToUpload: File | null = null;
  fileLoading = false;
  uploadStatus = '';
  uploadedFileName = '';
  fileValidationCompleted = false;
  filesValidationResults = null;
  isTemplateValid = false;
  hasValidTemplateData = false;
  templateFile: File | null = null;
  templateFileName = '';
  templateValidating = false;
  templateValidationCompleted = false;
  templateValidationResults = null;
  mappingTemplateCompleted = false;
  comparisonResults = [];
  executing = false;
  executingCompleted = false;
  toastDuration = 5000;
  toastMaxWidth = '500px';
  showAllFormatsDiv = false;
  ftpPath = 'Inbound/toCoStar/DocumentImport/';
  ftpWarning =
    'This is the directory where the compressed file should be loaded via the CoStar sFTP site.';
  msgInvalidTemplate =
    'Template is not valid, please verify you are loading the Document Mapping template.';
  msgErrorMapDocumentToObject =
    'Error occurred when mapping document to object.';
  msgErrorValidateTemplate = 'Error occurred when validating template.';
  msgErrorUploadExtractFiles =
    'Error occurred when uploading or extracting files.';
  msgErrorValidateFiles = 'Error occurred when validating files.';
  msgSuccess = 'Document Import Completed Successfully';
  msgNoFiles = 'No files found in sFTP site';

  constructor(
    private etlService: ETLService,
    private fileUploadService: FileUploadService,
    private toastService: CremToastService,
    private router: Router,
    private dialogService: MangoDialogService
  ) {
    this.routerSnapshot = router.routerState.snapshot;
  }

  ngOnInit(): void {
    this.currentUrl = this.routerSnapshot.url;
    this.allowedExtensions = this.fileUploadService.getAllowedExtenstions();
    this.subs.push(
      this.etlService.hasDocumentImportRight().subscribe((result) => {
        if (result.success) {
          this.canAccessDocumentImportPage = result.data;
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.subs.push(
      this.etlService.getDocumentImportStatus().subscribe((result) => {
        if (result.success) {
          const data = result.data;
          const status: ETLDocumentImportStatus =
            data?.StatusId ?? ETLDocumentImportStatus.NOTSTARTED;

          if (status === ETLDocumentImportStatus.NOTSTARTED) return;

          this.uploadedFileName = data?.UntrustedFileName;
          this.templateFileName = data?.TemplateName;
          this.fileToUpload = result;

          switch (status) {
            case ETLDocumentImportStatus.SFTPFILEUPLOADING:
              this.stepper.selectedIndex =
                ETLDocumentImportStep.FILEUPLOADEXTRACT;
              this.fileSelected = true;
              this.isFTP = true;
              this.fileLoading = true;
              this.waitTillFilesValidated();
              break;
            case ETLDocumentImportStatus.FILESUPLOADED:
            case ETLDocumentImportStatus.FILESEXTRACTED:
              this.displayFileValidatingMsg();
              break;
            case ETLDocumentImportStatus.FILESVALIDATED:
              this.showFilesValidatinResult();
              break;
            case ETLDocumentImportStatus.TemplateFileUploaded:
              this.stepper.steps.get(
                ETLDocumentImportStep.FILEUPLOADEXTRACT
              ).completed = true;
              this.stepper.steps.get(
                ETLDocumentImportStep.FILEVALIDATION
              ).completed = true;
              this.stepper.selectedIndex =
                ETLDocumentImportStep.TEMPLATEVALIDATION;
              this.templateValidating = true;
              this.waitTillTemplateValidated();
              break;
            case ETLDocumentImportStatus.TEMPLATEVALIDATED:
              this.stepper.steps.get(
                ETLDocumentImportStep.FILEUPLOADEXTRACT
              ).completed = true;
              this.stepper.steps.get(
                ETLDocumentImportStep.FILEVALIDATION
              ).completed = true;
              this.stepper.selectedIndex =
                ETLDocumentImportStep.TEMPLATEVALIDATION;
              this.fileValidationCompleted = true;
              this.templateValidationCompleted = true;
              this.isTemplateValid = true;
              this.hasValidTemplateData = true;
              this.getTemplateValidationResults();
              break;
            case ETLDocumentImportStatus.TEMPLATEREADYTOPROCESS:
            case ETLDocumentImportStatus.PROCESSING:
              this.stepper.steps.get(
                ETLDocumentImportStep.FILEUPLOADEXTRACT
              ).completed = true;
              this.stepper.steps.get(
                ETLDocumentImportStep.FILEVALIDATION
              ).completed = true;
              this.stepper.steps.get(
                ETLDocumentImportStep.TEMPLATEVALIDATION
              ).completed = true;
              this.stepper.selectedIndex = ETLDocumentImportStep.EXECUTE;
              this.fileValidationCompleted = true;
              this.templateValidationCompleted = true;
              this.executing = true;
              this.waitTillMapToObjectsCompleted();
              break;
            default:
              break;
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  ftpCheckValueChanged() {
    this.isFTP = !this.isFTP;
    this.fileSelected = this.isFTP;
    if (this.isFTP) {
      this.refreshFileUploader();
    }
  }

  handleSelectFileValueChanged(e: DxFileUploaderTypes.ValueChangedEvent) {
    if (this.isFTP) return;

    const file = e.value[0];
    if (file) {
      this.fileToUpload = file;
      const isFileSizeValid = this.fileUploadService.isFileSizeFourGB(
        file.size
      );
      const extension = this.fileUploadService.getFileExtension(
        this.fileToUpload.name
      );

      if (!this.allowedExtensions.includes(extension) || !isFileSizeValid) {
        const invalidFiletypeOrEmpty = !isFileSizeValid
          ? `Maximum of 4GB allowed.`
          : `Input file not supported or empty, select only supported file types.`;

        this.toastService.show(invalidFiletypeOrEmpty, '', ToastState.ERROR, {
          maxWidth: this.toastMaxWidth,
          duration: this.toastDuration,
        });
        this.refreshFileUploader();
      } else {
        this.fileSelected = true;
        this.uploadedFileName = this.fileToUpload.name;
      }
    }
  }

  setTemplateValid(isValid: boolean) {
    this.isTemplateValid = isValid;
  }

  templateSelected(file: File) {
    this.templateFile = file;
    this.templateFileName = file.name;
  }

  reValidateTemplate(file: File) {
    this.templateFile = file;
    this.templateFileName = file.name;
    this.templateValidationCompleted = false;
    this.validateTemplate();
  }

  executeTemplate(): void {
    this.subs.push(
      this.etlService.mapDocumentToObject().subscribe((result) => {
        if (result.success) {
          this.executing = true;
          this.waitTillMapToObjectsCompleted();
        }
      })
    );
  }

  moveToValidateFilesStep(): void {
    if (this.fileSelected || !this.fileValidationCompleted) {
      this.uploadStatus = '';

      if (this.isFTP) {
        this.subs.push(
          this.etlService.getFilesFromSftp().subscribe((result) => {
            this.fileLoading = true;
            if (result.success) {
              this.uploadedFileName = result.data.fileName;
              this.waitTillFilesValidated();
            } else if (result.statusCode == 404) {
              this.toastService.show(this.msgNoFiles, '', ToastState.ERROR, {
                maxWidth: this.toastMaxWidth,
                duration: this.toastDuration,
              });
              this.refreshPage();
            }
          })
        );
      } else {
        this.fileLoading = true;
        const nextMoveFlg =
          this.fileUploadService.uploadLoadChunkFileSequentially(
            this.fileToUpload
          );

        nextMoveFlg.then(() => {
          this.waitTillFilesValidated();
        });
      }
    }
  }

  moveToMappingTemplateStep(stepper): void {
    stepper.selected.completed = true;
    stepper.selectedIndex = ETLDocumentImportStep.TEMPLATEVALIDATION;
  }

  moveToExecuteStep(stepper): void {
    if (!this.templateValidationCompleted) {
      this.validateTemplate();
    } else {
      stepper.selected.completed = true;
      stepper.selectedIndex = ETLDocumentImportStep.EXECUTE;
    }
  }

  downloadFileValidationResults() {
    this.etlService.downloadFileValidationReslts();
  }

  downloadMappingTemplateValidationResults() {
    this.etlService.downloadMappingTemplateValidationResults();
  }

  downloadComparisonResults() {
    this.etlService.downloadComparisonResults();
  }

  cancelProcess() {
    const dialogCloseEvent = this.dialogService.confirm(
      'Cancel Document Import Process',
      `Are you sure you want to cancel this process? If you cancel, all files and templates currently imported will be deleted.\r\n\t<strong>${
        this.uploadedFileName
      }\r\n\t${this.templateFileName ?? ''}</strong>`,
      'Confirm',
      'Cancel'
    );
    dialogCloseEvent.subscribe((res) => {
      if (res) {
        this.subs.push(
          this.etlService.cancelProcess().subscribe((result) => {
            if (result.success) {
              this.toastService.show(
                'Process Successfully Canceled',
                '',
                ToastState.SUCCESS,
                {
                  maxWidth: this.toastMaxWidth,
                  duration: this.toastDuration,
                }
              );
              this.refreshPage();
            }
          })
        );
      }
    });
  }

  showAllFormats() {
    this.showAllFormatsDiv = true;
  }

  hideAllFormats() {
    this.showAllFormatsDiv = false;
  }

  private refreshPage() {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([this.currentUrl]);
    });
  }

  private showFilesValidatinResult() {
    this.stepper.steps.get(ETLDocumentImportStep.FILEUPLOADEXTRACT).completed =
      true;
    this.stepper.selectedIndex = ETLDocumentImportStep.FILEVALIDATION;
    this.fileValidationCompleted = true;
    this.getValidationResults();
  }

  private displayFileValidatingMsg() {
    this.stepper.steps.get(ETLDocumentImportStep.FILEUPLOADEXTRACT).completed =
      true;
    this.stepper.selectedIndex = ETLDocumentImportStep.FILEVALIDATION;
  }

  private waitTillTemplateValidated() {
    this.fileUploadService
      .handleLongProcessPolling(ETLDocImportLongProcess.VALIDTEMPLATE)
      .then((status) => {
        if (status === ETLDocumentImportStatus.TEMPLATEVALIDATED) {
          this.templateValidating = false;
          this.isTemplateValid = true;
          this.templateValidationCompleted = true;
          this.getTemplateValidationResults();
        }
      })
      .catch(() => {
        this.toastService.show(
          this.msgErrorValidateTemplate,
          '',
          ToastState.ERROR,
          {
            maxWidth: this.toastMaxWidth,
            duration: this.toastDuration,
          }
        );
        this.refreshPage();
      });
  }

  private waitTillFilesValidated() {
    this.fileUploadService
      .handleLongProcessPolling(ETLDocImportLongProcess.UPLOADEXTRACTFILES)
      .then((status) => {
        // If already validated, skip to showing results
        if (status === ETLDocumentImportStatus.FILESVALIDATED) {
          this.showFilesValidatinResult();
          return;
        }

        if (status === ETLDocumentImportStatus.FILESEXTRACTED) {
          this.displayFileValidatingMsg();
          this.fileUploadService
            .handleLongProcessPolling(ETLDocImportLongProcess.VALIDATEFILES)
            .then((validateStatus) => {
              if (validateStatus === ETLDocumentImportStatus.FILESVALIDATED) {
                this.showFilesValidatinResult();
              }
            })
            .catch(() => {
              this.toastService.show(
                this.msgErrorValidateFiles,
                '',
                ToastState.ERROR,
                {
                  maxWidth: this.toastMaxWidth,
                  duration: this.toastDuration,
                }
              );
              this.refreshPage();
            });
        }
      })
      .catch(() => {
        this.toastService.show(
          this.msgErrorUploadExtractFiles,
          '',
          ToastState.ERROR,
          {
            maxWidth: this.toastMaxWidth,
            duration: this.toastDuration,
          }
        );
        this.refreshPage();
      });
  }

  private waitTillMapToObjectsCompleted() {
    this.fileUploadService
      .handleLongProcessPolling(ETLDocImportLongProcess.MAPTOOBJECTS)
      .then((status) => {
        if (status === ETLDocumentImportStatus.PROCESSCOMPLETED) {
          this.executingCompleted = true;
          this.toastService.show(this.msgSuccess, '', ToastState.SUCCESS, {
            maxWidth: this.toastMaxWidth,
            duration: this.toastDuration,
          });
          this.refreshPage();
        }
      })
      .catch(() => {
        this.toastService.show(
          this.msgErrorMapDocumentToObject,
          '',
          ToastState.ERROR,
          {
            maxWidth: this.toastMaxWidth,
            duration: this.toastDuration,
          }
        );
        this.refreshPage();
      });
  }

  private refreshFileUploader(): void {
    this.uploadedFileName = '';
    if (this.dxfileUploaderComponent != null) {
      this.dxfileUploaderComponent.instance.reset();
      this.dxfileUploaderComponent.instance.repaint();
    }
  }

  private getValidationResults(): void {
    this.subs.push(
      this.etlService.getValidateResults().subscribe((result) => {
        if (result.success) {
          this.filesValidationResults = result.data;
        }
      })
    );
  }

  private validateTemplate() {
    if (!this.templateValidationCompleted) {
      const formData = new FormData();
      formData.append('file', this.templateFile, this.templateFileName);
      this.subs.push(
        this.etlService
          .validateMappingTemplate(formData)
          .subscribe((result) => {
            if (result.success) {
              this.templateValidating = true;
              this.waitTillTemplateValidated();
            } else {
              this.isTemplateValid = false;
              this.toastService.show(
                this.msgInvalidTemplate,
                '',
                ToastState.ERROR,
                {
                  maxWidth: this.toastMaxWidth,
                  duration: this.toastDuration,
                }
              );
            }
          })
      );
    } else {
      this.getTemplateValidationResults();
    }
  }

  private getTemplateValidationResults(): void {
    this.subs.push(
      this.etlService.getDocTemplateValidateResults().subscribe((result) => {
        if (result) {
          this.templateValidationResults = result.data[0];
          this.getComparisonResults();
        }
      })
    );
  }

  private getComparisonResults(): void {
    this.subs.push(
      this.etlService.getComparisonResults().subscribe((result) => {
        if (result) {
          this.comparisonResults = result.data;
          this.hasValidTemplateData = this.comparisonResults.length > 0;
        }
      })
    );
  }
}
