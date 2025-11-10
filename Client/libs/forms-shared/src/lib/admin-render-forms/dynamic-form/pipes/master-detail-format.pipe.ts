import { Pipe, PipeTransform, Inject, LOCALE_ID } from '@angular/core';
import { formatDate } from '@angular/common';
import { DataType } from 'libs/data-models/lib-data-models/src/lib/enums/index';

@Pipe({
  name: 'masterDetailFormat',
  standalone: true,
  pure: true,
})
export class MasterDetailFormatPipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private locale: string) {}

  private numberColumnTypeIds = new Set([
    DataType.SINGLE.toString(),
    DataType.DOUBLE.toString(),
    DataType.CURRENCY.toString(),
    DataType.DECIMAL.toString(),
    DataType.NUMERIC_9W.toString(),
    DataType.NUMERIC_10W.toString(),
    DataType.PERCENT.toString(),
  ]);

  transform(
    value: any,
    dataType: number | string,
    dateFmt?: string,
    formatString?: string
  ): any {
    if (value === undefined || value === null || value === '') return value;

    if (dataType == DataType.DATE) {
      return this.convertDate(value, dateFmt);
    }

    // --- NUMERIC PATTERN HANDLING ---
    if (this.numberColumnTypeIds.has(dataType.toString()) && formatString) {
      const num = Number(value);
      if (!isFinite(num)) return value;

      const { minFraction, maxFraction, useGrouping } =
        this.parseNumericPattern(formatString);

      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: minFraction,
        maximumFractionDigits: maxFraction,
        useGrouping,
      }).format(num);
    }

    // --- BOOLEAN HANDLING ---
    if (value === true) return 'Yes';
    if (value === false) return 'No';

    return value;
  }

  private convertDate(value: any, dateFmt?: string): string | null {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date?.getTime())) return value;

    return formatDate(date, dateFmt, this.locale);
  }

  private parseNumericPattern(fmt: string) {
    // Split integer / fraction
    const [intPart, fracPartRaw] = fmt.split('.');
    const fracPart = fracPartRaw ? fracPartRaw.replace(/[^0#]/g, '') : '';

    const minFraction = (fracPart.match(/0/g) || []).length;
    const optFraction = (fracPart.match(/#/g) || []).length;
    const maxFraction = minFraction + optFraction;

    return {
      minFraction,
      maxFraction,
      useGrouping: intPart?.includes(','),
    };
  }
}
