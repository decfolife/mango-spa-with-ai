import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  InputComponent,
  DropdownModule,
  CheckBoxComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { IconModule } from '@mango/ui-shared/lib-ui-elements';
import { BalanceCardType, CardsConfiguration } from './balance-card';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { AddEventFormService } from '@accounting-summary/services/add-event-form.service';
import { Subscription } from 'rxjs';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';

@Component({
  selector: 'mango-balance-card',
  standalone: true,
  templateUrl: './balance-card.component.html',
  styleUrls: ['./balance-card.component.scss'],
  imports: [
    CommonModule,
    IconModule,
    InputComponent,
    DropdownModule,
    DxNumberBoxModule,
    CheckBoxComponent,
  ],
})
export class BalanceCardComponent implements OnInit, OnDestroy {
  /**
   * The cards' data
   *
   * @type {BalanceCardsType}
   * @memberof BalanceCardComponent
   */
  @Input() cards: BalanceCardType[];

  /**
   * The Cards presentation configuration
   *
   * @type {CardsConfiguration}
   * @memberof BalanceCardComponent
   */
  @Input() configuration?: CardsConfiguration;
  /**
   * The Cards emit change when an input loses focus instead when it changes
   *
   * @type {CardsConfiguration}
   * @memberof BalanceCardComponent
   */
  @Input() useOnBlurChangeForInputs?: boolean = false;
  private defaultCardConfiguration: Partial<BalanceCardType> = {
    valueTarget: 'self',
  };
  @Output() valueChange = new EventEmitter();

  @Output() onBlurChange = new EventEmitter();
  private subscription = new Subscription();

  constructor(
    private accountingSummaryService: AccountingSummaryService,
    private accountingToastService: AccountingToastService,
    private addEventService: AddEventFormService,
    private formatService: FormattingService
  ) {}

  ngOnInit(): void {
    this.cards.forEach((element) => {
      return { ...this.defaultCardConfiguration, ...element };
    });
    this.configuration = {
      // e.g. 'repeat(auto-fit, minmax(200px, 1fr))'
      gap: 10,
      direction: 'column',
      repeat: 'auto-fit',
      maxWidth: 200,
    };
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  valueInputChange(
    value: string | number,
    cardTitle: string,
    elementLabel: string,
    previousValue?: string | number,
    isInputComponent: boolean = false
  ): void {
    if (this.useOnBlurChangeForInputs && isInputComponent) {
      return;
    }

    this.valueChange.emit({
      value: value,
      cardTitle: cardTitle,
      elementLabel: elementLabel,
      previousValue: previousValue,
    });
  }

  onBlurInputChange(
    value: string | number,
    cardTitle: string,
    elementLabel: string,
    previousValue?: string | number
  ): void {
    if (!this.useOnBlurChangeForInputs) {
      return;
    }
    this.onBlurChange.emit({
      value: value,
      cardTitle: cardTitle,
      elementLabel: elementLabel,
      previousValue: previousValue,
    });
  }

  formatCurrency(precision: number) {
    return this.formatService.buildCurrencyMask(precision);
  }

  cardValueToNumber(value: string | number) {
    if (!isNaN(Number(value))) {
      return Number(value);
    } else {
      return null;
    }
  }

  addID(cardTitle: string, elementLabel: string, idType: string): string {
    const formattedCardTitle = cardTitle
      ? cardTitle.replace(/\s+/g, '-').toLowerCase()
      : '';
    const formattedElementLabel = elementLabel
      ? elementLabel.replace(/\s+/g, '-').toLowerCase()
      : '';
    let suffix = '';
    switch (idType) {
      case 'label': {
        suffix = '-label';
        break;
      }
      case 'value': {
        suffix = '-value';
        break;
      }
      case 'dropdown': {
        suffix = '-dropdown';
        break;
      }
      case 'checkbox': {
        suffix = '-checkbox';
        break;
      }
      case 'input': {
        suffix = '-input';
        break;
      }
      default: {
        suffix = 'default';
        break;
      }
    }
    return `${formattedCardTitle}-card-${formattedElementLabel}${suffix}`;
  }

  presentValuePreviewExcel() {
    const filename =
      this.accountingSummaryService.getFileName('PresentValueTable');
    let data;
    this.addEventService.presentValuePayload$.subscribe((value) => {
      data = value;
    });

    this.subscription.add(
      this.accountingSummaryService
        .exportPresentValuePreviewFile(data)
        .subscribe((presentValueResponse: any) => {
          if (!presentValueResponse.data) {
            this.accountingToastService.errorNotify(
              'Downloading the present value table failed.'
            );
          } else {
            this.accountingSummaryService.downloadExcel(
              presentValueResponse.data,
              filename
            );
          }
        })
    );
  }
}
