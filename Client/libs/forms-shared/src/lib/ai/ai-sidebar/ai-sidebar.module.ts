import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DxDataGridModule } from 'devextreme-angular';
import { SkeletonModule } from '@mango/ui-shared/lib-ui-elements';
import { AiSidebarComponent } from './ai-sidebar.component';

@NgModule({
  declarations: [AiSidebarComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    DxDataGridModule,
    SkeletonModule,
  ],
  exports: [AiSidebarComponent],
})
export class AiSidebarModule {}
