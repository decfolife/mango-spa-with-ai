import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IconModule } from '../icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InputComponent, InputLabelComponent } from '../input';
import { SearchOption } from '@mango/data-models/lib-data-models';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IconModule,
    MatFormFieldModule,
    MatInputModule,
    InputLabelComponent,
    InputComponent,
  ],
  selector: 'crem-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  /**
   * Label is displayed or not
   * @type {boolean}
   * @memberof SearchComponent
   */
  @Input() showLabel?: boolean = false;

  /**Label for the search input box */
  @Input() label?: string;

  /**Placeholder for the search input box */
  @Input() placeholder? = 'Search';

  /**The search text displayed inside the search text box */
  @Input() value: string = null;

  /**Search text is required or not */
  @Input() required?: boolean = false;

  /**Disable the search text or not */
  @Input() disabled?: boolean = false;

  /**Info icon is displayed or not */
  @Input() showInfo?: boolean = false;

  /**Debounce time: The wait time in miliseconds to emit search change event when search option is typing.  */
  @Input() debounceTime?: number = 500;

  /**
   * Search option: Emit search change event when user clicks the mignifying glass or types the search text
   * @type {SearchOption}
   */
  @Input() searchOption: SearchOption = SearchOption.MAGNIFYING_GLASS;

  @Output() changed = new EventEmitter<string>();
  searchChangeObserver: any;

  handleClear() {
    this.value = '';
    this.changed.emit('');
  }

  outputSearchText(e) {
    this.value = e;
    if (this.searchOption == SearchOption.TYPING) {
      if (!this.searchChangeObserver) {
        Observable.create((observer) => {
          this.searchChangeObserver = observer;
        })
          .pipe(debounceTime(this.debounceTime)) // wait x time after the last event before emitting last event
          .pipe(distinctUntilChanged()) // only emit if value is different from previous value
          .subscribe((value) => {
            this.changed.emit(value);
          });
      }

      this.searchChangeObserver.next(e);
    }
  }

  searchByMagnifyingGlass() {
    if (this.searchOption == SearchOption.MAGNIFYING_GLASS) {
      this.changed.emit(this.value);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'NumpadEnter'
    ) {
      this.handleClear();
      event.preventDefault();
    }
  }
}
