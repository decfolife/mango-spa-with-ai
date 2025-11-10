import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ReportsService } from '@reports/services/reports.service';
import {
  DxFileUploaderComponent,
  DxFileUploaderTypes,
} from 'devextreme-angular/ui/file-uploader';
import { Subscription, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'mango-upload-offline-template',
  templateUrl: './upload-offline-template.component.html',
  styleUrls: ['./upload-offline-template.component.scss'],
})
export class UploadOfflineTemplateComponent implements OnDestroy {
  @ViewChild(DxFileUploaderComponent, { static: false })
  fileUploader?: DxFileUploaderComponent;

  allowedExtensions = ['.xls', '.xlsx'];
  maxFileSizeBytes = 100 * 1024 * 1024; // 100 MB
  selectedFile: File;
  isFileValid = false;
  uploadError?: string;
  uploadSuccess = false;
  uploadProgress?: number = undefined;
  upload$?: Subscription;

  constructor(
    private dialogRef: MatDialogRef<UploadOfflineTemplateComponent>,
    private reportsService: ReportsService
  ) {}

  handleValueChanged(event: DxFileUploaderTypes.ValueChangedEvent): void {
    this.selectedFile = (event.value as File[])[0]; // dx upload component supports multiple files, if we enable it
    this.uploadError = undefined;
    this.uploadSuccess = false;
    this.isFileValid = this.validateFile(this.selectedFile);
  }

  validateFile(file: File): boolean {
    if (!file) {
      return false;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSizeBytes) {
      return false;
    }

    return true;
  }

  uploadTemplate(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Select a file before uploading.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.upload$ = this.reportsService
      .uploadOfflineTemplate(formData)
      .pipe(
        // track progress
        tap((event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            const percentDone = Math.round((event.loaded / event.total!) * 100);
            this.uploadProgress = percentDone;
          } else if (event.type === HttpEventType.Response) {
            this.uploadSuccess = true;
            this.uploadProgress = 100;
            this.dialogRef.close({
              successMsg: true,
              message: 'Upload successful.',
            });
          }
        }),
        catchError((error) => {
          this.uploadError = 'Upload failed. Please try again.';
          this.uploadProgress = undefined;
          return throwError(error);
        })
      )
      .subscribe();
  }

  dismiss(): void {
    if (this.upload$) {
      this.reset();
      this.dialogRef.close({ successMsg: false, message: 'Upload cancelled.' });
      return;
    }

    this.dialogRef.close();
  }

  reset(): void {
    this.upload$?.unsubscribe();
    this.uploadProgress = undefined;
    this.uploadSuccess = false;
    this.fileUploader?.instance.reset();
    this.selectedFile = undefined;
    this.isFileValid = false;
  }

  ngOnDestroy(): void {
    this.upload$?.unsubscribe();
  }
}
