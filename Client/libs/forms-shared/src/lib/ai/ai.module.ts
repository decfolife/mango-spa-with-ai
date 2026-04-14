import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiRoutingModule } from './ai-routing.module';
import { AiListPageModule } from './ai-list-page/ai-list-page.module';
import { AiLeaseFormModule } from './ai-lease-form/ai-lease-form.module';
import { AiSidebarModule } from './ai-sidebar/ai-sidebar.module';
import { AiDocumentPageComponent } from './ai-document-page/ai-document-page.component';

@NgModule({
  declarations: [AiDocumentPageComponent],
  imports: [
    CommonModule,
    AiRoutingModule,
    AiListPageModule,
    AiLeaseFormModule,
    AiSidebarModule,
  ],
})
export class AiModule {}
