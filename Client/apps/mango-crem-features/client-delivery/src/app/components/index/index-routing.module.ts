import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiceAccountsComponent } from '../../components/service-accounts/service-accounts.component';

const routes: Routes = [
  {
    path: '',
    component: ServiceAccountsComponent,
    data: {
      pageTitle: 'Service Accounts',
      breadCrumb: { append: true, label: 'Service Accounts' },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IndexRoutingModule {}
