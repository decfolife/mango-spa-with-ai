import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AiListPageComponent } from './ai-list-page/ai-list-page.component';
import { AiLeaseFormComponent } from './ai-lease-form/ai-lease-form.component';

const routes: Routes = [
  {
    path: '',
    component: AiListPageComponent,
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
