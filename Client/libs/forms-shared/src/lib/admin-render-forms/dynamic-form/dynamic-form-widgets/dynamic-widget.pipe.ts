import { Pipe, PipeTransform } from '@angular/core';
import { FormWidgetTypeID } from '@forms/model/dynamic-forms.interface';

/**
 * Resolves the Widget's name based on the Widget Type ID
 *
 * @export
 * @class WidgetNamePipe
 * @implements {PipeTransform}
 */
@Pipe({
  name: 'widgetName',
  standalone: true,
})
export class WidgetNamePipe implements PipeTransform {
  transform(widgetTypeId: number): string | number {
    const keyName: string | undefined = FormWidgetTypeID[widgetTypeId];

    if (keyName) {
      return keyName.toLowerCase();
    }
    return widgetTypeId;
  }
}

/**
 * Checks whether an object has no own enumerable properties.
 *
 * @export
 * @class IsObjectEmptyPipe
 * @implements {PipeTransform}
 */
@Pipe({
  name: 'isObjectEmpty',
  standalone: true,
})
export class IsObjectEmptyPipe implements PipeTransform {
  transform(obj: object): boolean {
    return obj && Object.keys(obj).length === 0;
  }
}
