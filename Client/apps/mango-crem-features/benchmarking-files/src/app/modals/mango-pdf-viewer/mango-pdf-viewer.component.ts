import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonModule,
  IconModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'mango-pdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    ModalModule,
    MatDialogModule,
    ButtonModule,
    PdfViewerModule,
    MatDialogModule,
    IconModule,
  ],
  templateUrl: './mango-pdf-viewer.component.html',
  styleUrls: ['./mango-pdf-viewer.component.scss'],
})
export class MangoPdfViewerComponent implements OnInit {
  componentName = 'mango-pdf-viewer';
  @Input() showPdf: boolean = false;
  @Input() pdfTitle: string = '';
  @Input() pdfSrc: string | undefined;
  @Optional() @Input() width: number = 1200;
  @Optional() @Input() height: number = 650;
  @Optional() @Input() fitToPage: boolean = true;
  public pdfPage: number = 1;
  public magnification = 1;
  public styleString: string = '';
  public documentDownloaded: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<MangoPdfViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    if (this.data) {
      this.showPdf = this.data.showPdf;
      this.pdfTitle = this.data.pdfTitle;
      this.pdfSrc = this.data.pdfSrc;
      this.width = this.data.width ? this.data.width : 1200;
      this.height = this.data.height ? this.data.height : 650;
      this.styleString = `width: ${this.width}px; height: ${this.height}px;`;
    }
  }

  changePage(pages: number) {
    this.pdfPage += this.pdfPage + pages > 0 ? pages : 0;
  }

  changeZoom(zoom: number) {
    if (zoom == 1) {
      this.magnification += 0.25;
    } else {
      this.magnification -= 0.25;
    }
  }

  download() {
    if (this.pdfSrc) {
      const a = document.createElement('a');
      this.documentDownloaded = true;
      a.href = this.pdfSrc;
      a.download = this.pdfTitle;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(this.pdfSrc);
    }
  }
}
