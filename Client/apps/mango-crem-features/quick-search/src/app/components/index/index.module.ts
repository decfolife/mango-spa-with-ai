import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SkeletonModule } from '@mango/ui-shared/lib-ui-elements';
import { IndexRoutingModule } from './index-routing.module';
import { IndexComponent } from './index.component';
import { DxDataGridModule, DxTabPanelModule } from 'devextreme-angular';
import {
  CremTabsComponent,
  CremTabItemComponent,
  LoaderModule,
  ModalModule,
  CremEmptyStateComponent,
  CardModule,
} from '@mango/ui-shared/lib-ui-elements';
import { MatDividerModule } from '@angular/material/divider';

@NgModule({
  declarations: [IndexComponent],
  imports: [
    CommonModule,
    IndexRoutingModule,
    DxDataGridModule,
    DxTabPanelModule,
    LoaderModule,
    ModalModule,
    MatDividerModule,
    CremTabsComponent,
    CremTabItemComponent,
    CremEmptyStateComponent,
    SkeletonModule,
    CardModule,
  ],
})
export class IndexModule {}
