import { HttpClientModule } from '@angular/common/http';
import { NgModule, Injector } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';

import {
  DxBulletModule,
  DxButtonModule,
  DxDataGridModule,
  DxFilterBuilderModule,
  DxPopupModule,
  DxFormModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxToolbarModule,
  DxNumberBoxModule,
  DxDateBoxModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { ExportDevexDatagridService } from '@mango/core-shared';

import { IndexComponent } from './index.component';
import { HomeComponent } from './listpage/home/home.component';
import { ListPageComponent } from './listpage/list-page.component';
import { ROUTES } from './index.routes';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { UtilitiesService } from './listpage/core/services/utilities.service';
import { NotesService } from './listpage/notes/notes.service';
import { ShareViewPopupService } from './listpage/share-view-popup/share-view-popup.service';

import { CoreModule } from './listpage/core/core.module';
import { CommonModule } from '@angular/common';

import { AddNewMenuComponent } from './listpage/add-new-menu/add-new-menu.component';
import { ListPageTestComponent } from './listpage/list-page-test/list-page-test.component';
import { ListViewMenuComponent } from './listpage/list-view-menu/list-view-menu.component';
import { MapComponent } from './listpage/map/map.component';
import { MoreMenuComponent } from './listpage/more-menu/more-menu.component';
import { ActionMenuComponent } from './listpage/action-menu/action-menu.component';
import { NotesComponent } from './listpage/notes/notes.component';
import { SanitizeHtmlPipe } from './listpage/shared/pipes';
import { ShareViewPopupComponent } from './listpage/share-view-popup/share-view-popup.component';
import { NavMenuComponent } from './listpage/nav-menu/nav-menu.component';
import { DateFnsModule } from 'ngx-date-fns';
import { SearchModule } from '@mango/ui-shared/cosmos';
import {
  ButtonModule,
  DropdownModule,
  InputComponent,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { AddFormWizardModule } from '@micro-components/form-wizard/modal/add-form-wizard/add-form-wizard.module';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { LeaseAlertsModule } from '@micro-components/lease-alerts/lease-alerts.module';
import { TaskApprovalModule } from '@project-dashboard/components/modal/task-approval/task-approval.module';
import { PaymentDetailsPopupComponent } from './listpage/payment-details/payment-details-popup.component';

@NgModule({
  declarations: [
    IndexComponent,
    AddNewMenuComponent,
    HomeComponent,
    ListPageComponent,
    ListPageTestComponent,
    ListViewMenuComponent,
    MapComponent,
    MoreMenuComponent,
    ActionMenuComponent,
    NotesComponent,
    SanitizeHtmlPipe,
    ShareViewPopupComponent,
    NavMenuComponent,
    PaymentDetailsPopupComponent,
  ],
  // NOTE: DevExtreme controls cannot be abstracted out into separate modules.
  // This is a known bug with dev extreme
  imports: [
    GoogleMapsModule,
    CommonModule,
    CoreModule,
    DxBulletModule,
    DxButtonModule,
    DxDataGridModule,
    DxFilterBuilderModule,
    DxPopupModule,
    DxFormModule,
    DxScrollViewModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxToolbarModule,
    DxNumberBoxModule,
    DxDateBoxModule,
    DxLoadPanelModule,
    FontAwesomeModule,
    HttpClientModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTabsModule,
    ModalModule,
    AddFormWizardModule,
    LeaseAlertsModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(ROUTES),
    DateFnsModule.forRoot(),
    SearchModule,
    ButtonModule,
    TaskApprovalModule,
    DropdownModule,
    InputComponent,
  ],
  providers: [
    {
      provide: 'BASE_URL',
      useFactory: UtilitiesService.baseUrl,
    },
    NotesService,
    ShareViewPopupService,
    ExportDevexDatagridService,
    FormWizardService,
  ],
  exports: [ListPageComponent],
  //bootstrap: [AppComponent]
})
export class IndexModule {
  // constructor(private injector: Injector) {}
  // ngDoBootstrap() {
  //   const el = createCustomElement(ListPageComponent, {
  //     injector: this.injector,
  //   });
  //   customElements.define("ngce-list-page", el);
  // }
}
