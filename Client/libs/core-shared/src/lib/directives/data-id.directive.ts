import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Input,
} from '@angular/core';
import { DataIdBreadcrumbProviderService } from './data-id.service';
import { Router } from '@angular/router';
import { catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { BreadCrumb } from '@mango/data-models/lib-data-models';
import {
  DataIdObject,
  PendoFeature,
  SYNONYM_TO_FEATURE,
} from './data-id.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Directive for attaching a `data-id` attribute used by Pendo and automated tests.
 *
 * ⚠️ **Important:** Modifying the structure of the IDs may break Pendo analytics and test automation tagging.
 *
 * @export
 * @directive
 * @class CremDataIdDirective
 * @implements {OnInit}
 */
@Directive({
  selector: '[cremDataId]',
  standalone: true,
})
export class CremDataIdDirective implements AfterViewInit {
  /**
   * Accepts either a Pendo Feature name as defined by `PendoFeature`,
   * or an object of type `DataIdObject` to allow additional configuration options.
   *
   * @type {PendoFeature | DataIdObject}
   * @memberof CremDataIdDirective
   */
  @Input('cremDataId') dataId!: PendoFeature | DataIdObject;

  /**
   * Generate HTML attribute id automatically using dataId
   *
   * @memberof CremDataIdDirective
   */
  generateId = true as boolean;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private el: ElementRef,
    private router: Router,
    private breadcrumbProvider: DataIdBreadcrumbProviderService
  ) {}

  ngAfterViewInit(): void {
    // (1) Fully automatic: Directive applied w/o dataId input
    if (!this.dataId) {
      // Try getting dataId based on it's contents
      const dataId: PendoFeature = this.tryExtractingPendoFeature(
        this.el.nativeElement as HTMLElement
      );

      // Get the element html tag and apply it as a dataId selector
      const tagName = this.el.nativeElement.tagName.toLowerCase();

      // If is 'default' then at least add the tag name
      const finalDataId = `${dataId}.${tagName}`;

      this.setIdWithBreadcrumbs(finalDataId, this.generateId);
    }

    // (2) Object Provided: Type is `CremDataIdObject` object
    if (typeof this.dataId === 'object') {
      // If dataId is undefined, try extracting from any of the HTML elements
      let dataId: string;
      if (!this.dataId?.dataId) {
        dataId = this.tryExtractingPendoFeature(
          this.el.nativeElement as HTMLElement
        );
      }

      // Initialize cremDataIdObject
      const cremDataIdObject: DataIdObject = {
        dataId: dataId,
        generateId: this.generateId,
        ...this.dataId,
      };

      // Generate Id
      const fullDataId = `${
        cremDataIdObject.prefix ? cremDataIdObject.prefix + '.' : ''
      }${cremDataIdObject.dataId}${
        cremDataIdObject.suffix ? '.' + cremDataIdObject.suffix : ''
      }`;

      // Set ID
      this.setIdWithBreadcrumbs(fullDataId, cremDataIdObject.generateId);
    }

    // (3) Simple Text Provided: Type is `PendoFeature`
    if (typeof this.dataId === 'string') {
      this.setIdWithBreadcrumbs(this.dataId, this.generateId);
    }
    // else {
    //   console.error(`Pendo Data ID Directive: The dataId parameter provided is not valid. Error with dataId: ${this.dataId}`,this.el.nativeElement);
    // }
  }

  /**
   *
   *
   * @param {string} dataId
   * @param {boolean} generateId
   * @return {*}  {string}
   * @memberof CremDataIdDirective
   */
  setIdWithBreadcrumbs(dataId: string, generateId: boolean): void {
    this.breadcrumbProvider
      .getBreadcrumbs()
      .pipe(
        filter((b) => !!b && b.length > 0),
        takeUntilDestroyed(this.destroyRef),
        // take(1),
        catchError((error) => {
          // console.error(
          //   'Breadcrumbs for data-id tagging could not be generated. Please ensure they are being provided correctly.',
          //   error
          // );
          return of([]);
        })
      )
      .subscribe((breadcrumbs) => {
        // Format Breadcrumbs to be used as a string
        const breadcrumbPath =
          breadcrumbs?.length > 0 ? this.getFlatPath(breadcrumbs) : undefined;

        // Build dataId
        const fullDataId = `${dataId ? String(dataId) : ''}${
          breadcrumbPath ? '.' + breadcrumbPath : '.' + this.getRouterPath()
        }` as string;

        // Write data-id into html
        this.el.nativeElement.setAttribute('data-id', fullDataId);

        // Create ID: If there is not current id already defined
        const currentId: string | null =
          this.el.nativeElement.getAttribute('id');
        if (generateId && !currentId) {
          this.el.nativeElement.setAttribute('id', fullDataId);
        }
      });
  }

  /**
   * Uses the breadcrumbs objects and creates a safe if based on it
   * @param arr
   * @returns string
   */
  getFlatPath(arr: BreadCrumb[]): string {
    return arr
      .filter((e, i) => e.label.trim() !== '' && arr.length !== i + 1) // Don't include the last element
      .map((e) => this.slugify(e.label, '-'))
      .join('-');
  }

  /**
   * Retrieves the current route path segment as a fallback mechanism.
   * This is used when the breadcrumbs$ storage does not return a valid value.
   *
   * @return {*}  {string}
   * @memberof CremDataIdDirective
   */
  getRouterPath(): string {
    const path: string = this.router.url.split('?')[0];
    const segments: Array<string> = path.split('/').filter(Boolean);
    const current = segments.length
      ? segments[segments.length - 1]
      : 'path-not-found';
    return current;
  }

  /**
   * Makes strings safe to be used for an id
   * @param value
   * @param separator
   * @returns string
   */
  slugify(value: string, separator?: string) {
    separator = separator ?? '-';

    if (typeof value !== 'string') {
      console.warn(
        'CremDataIdDirective: Expected a string but received',
        value
      );
      return '';
    }

    const str = value
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, separator)
      .toLowerCase();
    return str;
  }

  /**
   * Attempts to extract a Pendo feature from the given element when the `dataId` is not provided.
   *
   * @param element - The HTML element to extract the feature from.
   * @returns The matched Pendo feature key, or `'default'` if no match is found.
   */
  tryExtractingPendoFeature(element: HTMLElement): PendoFeature {
    if (!element) {
      return 'default';
    }

    // 1. Gather all text tokens
    const tokens = (
      element.getAttribute('aria-label') +
      ' ' +
      element.getAttribute('title') +
      ' ' +
      element.innerHTML
    )
      .trim()
      .toLowerCase()
      .replace(/<[^>]*>/g, ' ') // remove HTML tags
      .replace(/[^\w\s]|_/g, ' ') // remove punctuation/symbols
      .replace(/\s+/g, ' ') // normalize whitespace
      .split(/\s+/)
      .filter((str) => str !== 'null');

    for (const token of tokens) {
      const f = SYNONYM_TO_FEATURE.get(token);
      if (f) return f;
    }

    return 'default';
  }
}
