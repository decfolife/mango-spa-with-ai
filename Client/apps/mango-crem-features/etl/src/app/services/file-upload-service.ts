import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { from, interval, of, throwError } from 'rxjs';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  mergeMap,
  tap,
  toArray,
} from 'rxjs/operators';
import {
  ETLDocImportLongProcess,
  ETLDocumentImportStatus,
} from '@etl/model/document-import-enums';
import { ETLService } from './etl.service';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  @Output() public onUploadFinished = new EventEmitter();
  uploadStatus = '';
  uploadProgress = 0;

  constructor(private etlService: ETLService) {}

  getAllowedExtenstions(): string {
    return '.ai, .avi, .bmp, .cdb, .csv, .ctb, .db, .dgn, .doc, .docm, .docx, .dot, .dotx, .dwf, .dwg, .dxf, .eml, .fmp, .g2m, .gif, .ics, .ipx, .jpeg, .jpg, .kmz, .mdb, .mdi, .mht, .mov, .mp4, .mpg, .mpp, .msg, .nsf, .ods, .oft, .pcp, .pdf, .plt, .png, .pps, .ppt, .pptm, .pptx, .psd, .ptm, .pub, .rar, .rtf, .rvt, .shx, .sif, .snag, .snp, .tif, .tiff, .ttf, .txt, .vcf, .vsd, .wav, .wk4, .wmv, .xlk, .xls, .xlsb, .xlsm, .xlsx, .xlt, .xltx, .xml, .xps, .zip, .cad';
  }

  getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  async uploadLoadChunkFileSequentially(file: File): Promise<boolean> {
    return this.uploadChunkFiles(file);
  }

  uploadChunkFiles = async (file: File): Promise<boolean> => {
    const filename = file.name;
    const chunkSizeBytes = 10 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSizeBytes);

    this.uploadStatus = '';
    this.uploadProgress = 0;

    const loadedByChunk = new Map<number, number>();
    const updateOverallProgress = () => {
      let loadedTotal = 0;
      for (const v of loadedByChunk.values()) loadedTotal += v;
      this.uploadProgress = file.size
        ? Math.round((100 * loadedTotal) / file.size)
        : 100;
    };

    const buildChunk = (chunkIndex: number) => {
      const start = chunkIndex * chunkSizeBytes;
      const end = Math.min(start + chunkSizeBytes, file.size);
      const chunkBlob = file.slice(start, end);
      const chunkSize = end - start;

      const formData = new FormData();
      formData.append('chunkFile', chunkBlob, filename);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileName', filename);
      formData.append('fileSize', file.size.toString());

      return { formData, chunkIndex, chunkSize };
    };

    const uploadChunkIndex$ = (chunkIndex: number) => {
      const { formData, chunkSize } = buildChunk(chunkIndex);

      return from(this.etlService.chunkFileUpload(formData)).pipe(
        mergeMap((http$) => http$),
        tap((event: any) => {
          if (!event) return;

          if (event.type === HttpEventType.UploadProgress) {
            const chunkLoaded = Math.min(event.loaded ?? 0, chunkSize);
            loadedByChunk.set(chunkIndex, chunkLoaded);
            updateOverallProgress();
          }

          if (event.type === HttpEventType.Response) {
            loadedByChunk.set(chunkIndex, chunkSize);
            updateOverallProgress();
            this.onUploadFinished.emit(event.body);
          }
        }),
        filter((event: any) => event?.type === HttpEventType.Response),
        map(() => true),
        catchError((err: HttpErrorResponse) => {
          this.uploadStatus = `Error uploading file. Status: ${err.status} ${err.statusText} Message: ${err.message}`;
          return throwError(err);
        })
      );
    };

    try {
      const lastIndex = totalChunks - 1;

      // Phase 1: upload 0..lastIndex-1 with 2 in parallel
      if (lastIndex > 0) {
        const indices = Array.from({ length: lastIndex }, (_, i) => i);

        await from(indices)
          .pipe(
            mergeMap((i) => uploadChunkIndex$(i), 2),
            toArray()
          )
          .toPromise();
      }

      // Phase 2: upload last chunk by itself
      if (lastIndex >= 0) {
        await uploadChunkIndex$(lastIndex).toPromise();
      }

      this.uploadProgress = 100;
      return true;
    } catch {
      return false;
    }
  };

  isProcessCompleted(
    statusId: ETLDocumentImportStatus,
    processName: ETLDocImportLongProcess
  ): boolean {
    switch (processName) {
      case ETLDocImportLongProcess.UPLOADEXTRACTFILES:
        return (
          statusId === ETLDocumentImportStatus.FILESEXTRACTED ||
          statusId === ETLDocumentImportStatus.FILESVALIDATED
        );
      case ETLDocImportLongProcess.VALIDATEFILES:
        return statusId === ETLDocumentImportStatus.FILESVALIDATED;
      case ETLDocImportLongProcess.VALIDTEMPLATE:
        return statusId === ETLDocumentImportStatus.TEMPLATEVALIDATED;
      case ETLDocImportLongProcess.MAPTOOBJECTS:
        return statusId === ETLDocumentImportStatus.PROCESSCOMPLETED;
      default:
        return false;
    }
  }

  // Get the status that indicates the process failed and reverted to previous step
  getPreviousStepStatus(
    processName: ETLDocImportLongProcess
  ): ETLDocumentImportStatus | null {
    switch (processName) {
      case ETLDocImportLongProcess.VALIDATEFILES:
        return ETLDocumentImportStatus.FILESUPLOADED;
      case ETLDocImportLongProcess.VALIDTEMPLATE:
        return ETLDocumentImportStatus.FILESVALIDATED;
      case ETLDocImportLongProcess.MAPTOOBJECTS:
        return ETLDocumentImportStatus.TEMPLATEVALIDATED;
      default:
        // ETLDocImportLongProcess.UPLOADEXTRACTFILES does not have a previous step.
        // If it errors out, it will be set to NOTSTARTED which is handled separately in handleLongProcessPolling
        return null;
    }
  }

  handleLongProcessPolling(processName: ETLDocImportLongProcess) {
    const milliseconds = 1000 * 2; // Poll for status every 2 seconds

    const previousStepStatus = this.getPreviousStepStatus(processName);

    return new Promise<ETLDocumentImportStatus>((resolve, reject) => {
      const subscription = interval(milliseconds)
        .pipe(
          // ExhaustMap ensures only one inner observable is active at a time
          // Ex: Polling every 2 seconds but a request is taking longer than 2 seconds,
          // wait until that request completes before sending another. In other words,
          // poll at most every two seconds.
          exhaustMap(() =>
            this.etlService.getDocumentImportStatus().pipe(
              catchError((err) => {
                console.warn('[Polling] API error, will retry:', err);
                return of(null);
              })
            )
          )
        )
        .subscribe({
          next: (response) => {
            const resp = response as { success: boolean; data: any } | null;
            // Skip invalid responses (but allow StatusId 0)
            if (
              !resp?.data ||
              (resp.data.StatusId === undefined && resp.data.StatusId !== 0)
            ) {
              return;
            }

            const statusId: ETLDocumentImportStatus = resp.data.StatusId;

            // Check if process was cancelled
            if (statusId === ETLDocumentImportStatus.NOTSTARTED) {
              console.warn('[Polling] Process Cancelled');
              subscription.unsubscribe();
              reject('Process Cancelled');
              return;
            }

            // Check if the process was set back to the last good step
            if (previousStepStatus && statusId <= previousStepStatus) {
              subscription.unsubscribe();
              console.error(
                '[Polling] Process Cancelled or Reverted',
                statusId,
                previousStepStatus
              );
              reject('Process Cancelled or Reverted');
              return;
            }

            if (this.isProcessCompleted(statusId, processName)) {
              subscription.unsubscribe();
              resolve(statusId);
            }
          },
          error: (err) => {
            console.error('[Polling] Error:', err);
            reject(`Error occurred. - ${err}`);
          },
        });
    });
  }

  isFileSizeFourGB(documentsize: number): boolean {
    const fileSize: number = documentsize;
    const gigabyte: number = 1024 * 1024 * 1024;
    return fileSize <= 4 * gigabyte;
  }
}
