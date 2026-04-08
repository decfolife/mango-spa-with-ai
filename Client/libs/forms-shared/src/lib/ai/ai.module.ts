import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiRoutingModule } from './ai-routing.module';
import { AiListPageModule } from './ai-list-page/ai-list-page.module';
import { AiLeaseFormModule } from './ai-lease-form/ai-lease-form.module';

/**
 * Top-level module for the AI Lease Abstraction feature.
 *
 * Lazy-load this module from a consuming app's routing config:
 *
 * {
 *   path: 'ai-abstractions',
 *   loadChildren: () => import('@mango/forms-shared').then(m => m.AiModule)
 * }
 */
@NgModule({
  imports: [
    CommonModule,
    AiRoutingModule,
    AiListPageModule,
    AiLeaseFormModule,
  ],
})
export class AiModule {}
