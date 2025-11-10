import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsHomeComponent } from './reports-home.component';
import { SearchModule } from '@mango/ui-shared/cosmos';
import {
  DropdownModule,
  ButtonModule,
  LoaderModule,
  IconModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { MatIconModule } from '@angular/material/icon';
import { DxDataGridModule, DxFileUploaderModule } from 'devextreme-angular';
import { MatMenuModule } from '@angular/material/menu';
import { ShareReportComponent } from './modals/share-report/share-report.component';
import { UploadOfflineTemplateComponent } from './modals/upload-offline-template/upload-offline-template.component';
import { DxProgressBarModule } from 'devextreme-angular';

@NgModule({
  declarations: [
    ReportsHomeComponent,
    ShareReportComponent,
    UploadOfflineTemplateComponent,
  ],
  imports: [
    CommonModule,
    SearchModule,
    DropdownModule,
    ButtonModule,
    MatIconModule,
    DxDataGridModule,
    DxFileUploaderModule,
    MatMenuModule,
    LoaderModule,
    IconModule,
    ModalModule,
    DxProgressBarModule,
  ],
  exports: [ReportsHomeComponent],
})
export class ReportsHomeModule {}
