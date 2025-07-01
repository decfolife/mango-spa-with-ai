import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  ToastComponent,
  CremToastService,
  ButtonModule,
} from '@mango/ui-shared/lib-ui-elements';
import { ToastState } from 'libs/data-models/lib-data-models/src';

@Component({
  selector: 'template-validation-results',
  templateUrl: './template-validation-results.component.html',
  styleUrls: [
    './template-validation-results.component.scss',
    '../etl-document-import-shared-styles.scss',
  ],
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastComponent],
})
export class TemplateValidationResultsComponent {
  @Input() templateValidating;
  @Input() templateValidationCompleted;
  @Input() templateValidationResults;
  @Output() reValidateTemplate = new EventEmitter();
  @Output() templateSelected = new EventEmitter();
  @Output() templateValidated = new EventEmitter();
  @ViewChild('hdnFileInput') selectFileInput: ElementRef;
  templateFileName = '';
  isTemplateValid = false;
  toastDuration = 5000;
  toastMaxWidth = '500px';
  msgInvalidTemplate =
    'Template is not valid, please verify you are loading the Document Mapping template.';

  constructor(private toastService: CremToastService) {}

  triggerSelectInputFile(): void {
    this.selectFileInput.nativeElement.click();
  }

  selectFile(event: any): void {
    const fileToUpload = event.target.files[0];
    event.target.value = null;
    this.templateFileName = fileToUpload.name;
    if (fileToUpload) {
      this.isTemplateValid = this.templateFileName.slice(-5) === '.xlsx';
      this.templateValidated.emit(this.isTemplateValid);
      if (!this.isTemplateValid) {
        this.toastService.show(this.msgInvalidTemplate, '', ToastState.ERROR, {
          maxWidth: this.toastMaxWidth,
          duration: this.toastDuration,
          closeOnClick: true,
        });

        return;
      }

      if (this.templateValidationCompleted) {
        this.templateValidationCompleted = false;
        this.reValidateTemplate.emit(fileToUpload);
      } else {
        this.templateSelected.emit(fileToUpload);
      }
    }
  }
}
