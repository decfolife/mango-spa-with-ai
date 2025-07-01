import { Component, Input } from '@angular/core';
import {CommonModule} from '@angular/common';
import {} from '../etl-document-import.component'

@Component({
  selector: 'files-validation-results',
  templateUrl: './files-validation-results.component.html',
  styleUrls: ['./files-validation-results.component.scss', '../etl-document-import-shared-styles.scss'],
  standalone: true,
  imports: [
    CommonModule,
  ],
})
export class FilesValidationResultsComponent {
  @Input() fileValidationCompleted;
  @Input() filesValidationResults;
}
