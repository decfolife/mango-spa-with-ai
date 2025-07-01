import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { ETLService } from '@etl/services/etl.service';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil, takeWhile } from 'rxjs/operators';
import {
  ETLDocImportLongProcess,
  ETLDocumentImportStatus,
} from '@etl/model/document-import-enums';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  @Output() public onUploadFinished = new EventEmitter();
  longProcessCompleted = false;
  isDocumentImportFailed = false;
  uploadStatus = '';
  uploadProgress = 0;
  stopSignal = new Subject<void>();

  constructor(private etlService: ETLService) {}

  getAllowedExtenstions(): string {
    return '.ai, .avi, .bmp, .cdb, .csv, .ctb, .db, .dgn, .doc, .docm, .docx, .dot, .dotx, .dwf, .dwg, .dxf, .eml, .fmp, .g2m, .gif, .ics, .ipx, .jpeg, .jpg, .kmz, .mdb, .mdi, .mht, .mov, .mp4, .mpg, .mpp, .msg, .nsf, .ods, .oft, .pcp, .pdf, .plt, .png, .pps, .ppt, .pptm, .pptx, .psd, .ptm, .pub, .rar, .rtf, .rvt, .shx, .sif, .snag, .snp, .tif, .tiff, .ttf, .txt, .vcf, .vsd, .wav, .wk4, .wmv, .xlk, .xls, .xlsb, .xlsm, .xlsx, .xlt, .xltx, .xml, .xps, .zip, .cad';
  }

  getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  async uploadLoadChunkFileSequentially(file: File): Promise<boolean> {
    const currentPromiseItems = await this.uploadChunkFiles(file);
    let canMoveToNextSetp = true;

    const processCompleted: number[] = [];
    for (let i = 0; i < currentPromiseItems.length; i++) {
      if (!canMoveToNextSetp) break;

      await this.processChunkFileUploadSequentially(currentPromiseItems[i])
        .then((results) => {
          processCompleted.push(i);
        })
        .catch((err) => {
          canMoveToNextSetp = false;
        });
    }

    if (
      canMoveToNextSetp &&
      processCompleted.length == currentPromiseItems.length
    ) {
      return true;
    } else {
      return false;
    }
  }

  async processChunkFileUploadSequentially(currentPromise: () => any) {
    return await currentPromise();
  }

  uploadChunkFiles = async (file: File) => {
    const filename = file.name;
    const chunkSize: number = 10 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let start = 0;
    let chunkIndex = 0;
    const arrPromiseFns = [];

    try {
      while (start < file.size) {
        const chunk = file.slice(start, start + chunkSize);
        const formData = new FormData();
        formData.append('chunkFile', chunk, filename);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', filename);
        formData.append('fileSize', file.size.toString());
        this.onUploadFinished = new EventEmitter();
        this.uploadProgress = 0;
        const successmsg = `Successfully completed chunk ${chunkIndex.toString()} in array`;
        arrPromiseFns.push(
          () =>
            new Promise<any>((resolve2) =>
              setTimeout(async () => {
                (await this.etlService.chunkFileUpload(formData)).subscribe({
                  next: (event: {
                    type: HttpEventType;
                    loaded: number;
                    total: number;
                    body: { data: string };
                  }) => {
                    if (event) {
                      if (event.type === HttpEventType.UploadProgress)
                        this.uploadProgress = Math.round(
                          (100 * event.loaded) / event.total
                        );
                      else if (event.type === HttpEventType.Response) {
                        this.onUploadFinished.emit(event.body);
                        resolve2(successmsg);
                      }
                    }
                  },
                  error: (err: HttpErrorResponse) => {
                    this.uploadStatus = `Error uploading file. Status: ${err.status} ${err.statusText} 
                          Message: ${err.message}`;
                  },
                  complete: () => {},
                });
              }, 1000)
            )
        );
        (start += chunkSize), chunkIndex++;
      }
      return arrPromiseFns;
    } catch (error) {
      console.log(error);
    }
  };

  handleLongProcessPooling(processName: ETLDocImportLongProcess) {
    let milliseconds: number = 0.01 * 60 * 1000;
    return new Promise<ETLDocumentImportStatus>((resolve, reject) => {
      interval(milliseconds)
        .pipe(
          switchMap(() => this.etlService.getDocumentImportStatus()),
          takeWhile((response: { success: boolean; data: any }) => {
            milliseconds = 0.5 * 60 * 1000;
            switch (processName) {
              case ETLDocImportLongProcess.UPLOADEXTRACTFILES:
                return (
                  response.data.StatusId !==
                  ETLDocumentImportStatus.FILESEXTRACTED &&                   
                  response.data.StatusId !==
                  ETLDocumentImportStatus.FILESVALIDATED
                );
              case ETLDocImportLongProcess.VALIDATEFILES:
                return (
                  response.data.StatusId !==
                  ETLDocumentImportStatus.FILESVALIDATED
                );
              case ETLDocImportLongProcess.VALIDTEMPLATE:
                return (
                  response.data.StatusId !==
                  ETLDocumentImportStatus.TEMPLATEVALIDATED
                );
              case ETLDocImportLongProcess.MAPTOOBJECTS:
                return (
                  response.data.StatusId !==
                  ETLDocumentImportStatus.PROCESSCOMPLETED
                );
            }
          }, true),
          takeUntil(this.stopSignal)
        )
        .subscribe({
          next: (response) => {
            let processCompleted = false;
            switch (processName) {
              case ETLDocImportLongProcess.UPLOADEXTRACTFILES:
                processCompleted =
                  response.data.StatusId ===
                  ETLDocumentImportStatus.FILESEXTRACTED ||
                  response.data.StatusId ===
                  ETLDocumentImportStatus.FILESVALIDATED;
                break;
              case ETLDocImportLongProcess.VALIDATEFILES:
                processCompleted =
                  response.data.StatusId ===
                  ETLDocumentImportStatus.FILESVALIDATED;
                break;
              case ETLDocImportLongProcess.VALIDTEMPLATE:
                processCompleted =
                  response.data.StatusId ===
                  ETLDocumentImportStatus.TEMPLATEVALIDATED;
                break;
              case ETLDocImportLongProcess.MAPTOOBJECTS:
                processCompleted =
                  response.data.StatusId ===
                  ETLDocumentImportStatus.PROCESSCOMPLETED;
                break;
            }
            if (processCompleted) {
              this.longProcessCompleted = true;
              this.stopSignal.next();
              this.stopSignal.complete();
              return resolve(response.data.StatusId);
            }
          },
          complete: () => {
            //console.log('interval Observable completed')
          },
          error: (err) => reject(`Error occurred. - ${err}`),
        });
    });
  }

  isFileSizeFourGB(documentsize: number): boolean {
    const fileSize: number = documentsize;
    const gigabyte: number = 1024 * 1024 * 1024;
    return fileSize <= 4 * gigabyte;
  }
}
