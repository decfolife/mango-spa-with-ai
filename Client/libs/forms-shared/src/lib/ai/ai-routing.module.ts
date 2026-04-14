import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AiListPageComponent } from './ai-list-page/ai-list-page.component';
import { AiLeaseFormComponent } from './ai-lease-form/ai-lease-form.component';
import { AiDocumentPageComponent } from './ai-document-page/ai-document-page.component';

const routes: Routes = [
  {
    path: '',
    component: AiListPageComponent,
  },
  {
    path: 'document/:id',
    component: AiDocumentPageComponent,
  },
  {
    path: ':id',
    component: AiLeaseFormComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AiRoutingModule {}
