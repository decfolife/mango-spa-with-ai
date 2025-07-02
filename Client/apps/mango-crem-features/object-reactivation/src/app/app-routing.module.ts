import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ObjectReactivationComponent } from '../app/components/object-reactivation/object-reactivation.component';


const routes: Routes = [
  {
    path: '',
    // loadComponent: () =>
    //   import(
    //     './components/object-reactivation/object-reactivation.component'
    //   ).then((mod) => mod.ObjectReactivationComponent),
    component: ObjectReactivationComponent,
    data: {
      pageTitle: 'Reactivation',
      breadCrumb: { append: true, label: 'Reactivation' },
    },
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
