import { Directive, Input } from '@angular/core';
import { DataIdObject, PendoFeature } from './data-id.model';

// TODO: Expand to only accept a pendo feature when is an object

/**
 * Use this abstract class to expand the shared components
 * to include the dataId input.
 */
@Directive()
export abstract class PendoDataId {
  /**
   * Identifier used for Pendo tracking and automated test selectors.
   *
   * This value is typically applied as a `data-id` attribute to support
   * analytics tagging and test automation hooks. Avoid changing this value
   * unless necessary, as it may affect tracking and test stability.
   *
   * @example
   * <button [dataId]="'submit-button'">Submit</button>
   *
   * @type {string}
   */
  @Input() dataId!: PendoFeature | DataIdObject;
}
