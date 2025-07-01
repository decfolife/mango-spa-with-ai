import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EtlTemplatesComponent } from './components/etl-templates/etl-templates.component';
import { EtlImportsComponent } from './components/etl-imports/etl-imports.component';
import { EtlLogComponent } from './components/etl-log/etl-log.component';
import { EtlStatusComponent } from './components/etl-status/etl-status.component';
import { EtlTemplatesDetailsComponent } from './components/etl-templates/details/etl-templates-details.component';
import { EtlTemplatesHistoryComponent } from './components/etl-templates/history/etl-templates-history.component';
import { EtlDocumentImportComponent } from './components/etl-document-import/etl-document-import.component';
import { AdminEtlComponent } from './components/admin-etl.component';
import { MangoSubApps } from '@mango/data-models/lib-data-models';
import { DocumentImportHistoryComponent } from './components/etl-document-import/document-import-history/document-import-history.component';

const routes: Routes = [
  { path: '', redirectTo: 'templates', pathMatch: 'full' },
  {
    path: 'imports',
    component: EtlImportsComponent,
    data: {
      moduleId: 6,
      breadCrumb: { label: 'Imports', append: true, activeLink: 'Imports' },
    },
  },
  {
    path: 'documents',
    component: EtlDocumentImportComponent,
    data: {
      moduleId: 6,
      breadCrumb: {
        label: 'Document Import',
        activeLink: 'Document Import',
      },
    },
  },
  {
    path: 'document-import-history',
    component: DocumentImportHistoryComponent,
    data: {
      moduleId: 6,
      breadCrumb: {
        label: 'Document Import History',
        activeLink: 'Document Import History',
      },
    },
  },
  {
    path: 'log',
    component: EtlLogComponent,
    data: {
      moduleId: 6,
      breadCrumb: {
        label: 'Import Log',
        append: true,
        activeLink: 'Import Log',
      },
    },
  },
  {
    path: 'status',
    component: EtlStatusComponent,
    data: {
      moduleId: 6,
      breadCrumb: {
        label: 'Queue Status',
        append: true,
        activeLink: 'Queue Status',
      },
    },
  },
  {
    path: 'templates',
    component: AdminEtlComponent,
    data: {
      moduleId: 6,
      breadCrumb: { label: 'Templates', append: true, activeLink: 'Templates' },
    },
    children: [
      {
        path: '',
        component: EtlTemplatesComponent,
        data: { moduleId: 6, breadCrumb: { append: false } },
      },
      {
        path: 'details/:id',
        component: EtlTemplatesDetailsComponent,
        data: {
          currentSubApp: MangoSubApps.ETL,
          moduleId: 6,
          breadCrumb: {
            label: 'Edit Template',
            append: true,
            activeLink: 'Details',
          },
        },
      },
      {
        path: 'history/:id',
        component: EtlTemplatesHistoryComponent,
        data: {
          currentSubApp: MangoSubApps.ETL,
          moduleId: 6,
          breadCrumb: {
            label: 'Template History',
            append: true,
            activeLink: 'View History',
          },
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
