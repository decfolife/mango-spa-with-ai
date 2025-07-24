import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'isNumericUI',
})
export class IsNumericPipe implements PipeTransform {
  transform(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }
}
