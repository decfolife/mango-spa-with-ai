import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderModule } from './header/header.module';
import { RouterModule } from '@angular/router';
import { LibDataModelsModule } from '@mango/data-models/lib-data-models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListErrorsModule } from './list-errors/list-errors.module';
import { CremHeaderModule } from './crem-header/crem-header.module';
import { LibUiElementsModule } from '@mango/ui-shared/lib-ui-elements';
import { EnvInfoChipModule } from './env-info-chip/env-info-chip.module';
import { HeroMetricsContainerModule } from './hero-metrics-container';
import { DashboardFiltersModule } from './dashboard-filters';
import { ComposeEmailModule } from './compose-email';
import { SharedLeftNavModule } from './shared-left-nav';
import { ShadowFiltersContainerModule } from './shadow-filters-container';
import { CostarSuiteHeaderModule } from './costar-suite-header/costar-suite-header.module';
import { AddBuildingModalModule } from './add-building-modal/add-building-modal.module';
import { AddEquipmentModalComponent } from './add-equipment-modal/add-equipment-modal.component';
import { MangoDialogModule } from './mango-dialog';
import { AddSupplierModalComponent } from './add-supplier-modal/add-supplier-modal.component';
import { AddCompanyModalComponent } from './add-company-modal/add-company-modal.component';
import { AddLeaseModalModule } from './add-lease-modal/add-lease-modal.module';
import { AddAiLeaseModalModule } from './add-ai-lease-modal/add-ai-lease-modal.module';
import { CremCurrentObjectTextModule } from './crem-current-object-text/crem-current-object-text.module';
import { AddPremiseModalComponent } from './add-premise-modal/add-premise-modal.component';
import { ObjectInfoComponent } from './object-info-modal/object-info.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    LibDataModelsModule,
    LibUiElementsModule,
    EnvInfoChipModule,
    DashboardFiltersModule,
    HeroMetricsContainerModule,
    ShadowFiltersContainerModule,
    SharedLeftNavModule,
    MangoDialogModule,
    ComposeEmailModule,
    AddBuildingModalModule,
    AddSupplierModalComponent,
    AddEquipmentModalComponent,
    AddCompanyModalComponent,
    AddLeaseModalModule,
    AddAiLeaseModalModule,
    AddPremiseModalComponent,
    ObjectInfoComponent,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    HeaderModule,
    LibUiElementsModule,
    ListErrorsModule,
    CremHeaderModule,
    CremCurrentObjectTextModule,
    CostarSuiteHeaderModule,
    EnvInfoChipModule,
    DashboardFiltersModule,
    HeroMetricsContainerModule,
    ShadowFiltersContainerModule,
    SharedLeftNavModule,
    MangoDialogModule,
    ComposeEmailModule,
    AddBuildingModalModule,
    AddLeaseModalModule,
    AddAiLeaseModalModule,
    AddPremiseModalComponent,
    ObjectInfoComponent,
  ],
})
export class LibUiSharedModule {}
