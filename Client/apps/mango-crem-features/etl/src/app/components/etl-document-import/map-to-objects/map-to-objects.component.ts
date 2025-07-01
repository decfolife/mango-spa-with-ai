import { Component, Input } from '@angular/core';
import {CommonModule} from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'map-to-objects',
  templateUrl: './map-to-objects.component.html',
  styleUrls: ['./map-to-objects.component.scss', '../etl-document-import-shared-styles.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
  ],
})
export class MapToObjectsComponent {
  @Input() executing;
  @Input() executingCompleted;
  @Input() comparisonResults;
}
