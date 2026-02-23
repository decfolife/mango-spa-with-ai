import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  standalone: true,
  imports: [MatCardModule, DxDataGridModule],
  selector: 'mango-service-account-history',
  templateUrl: './service-account-history.component.html',
  styleUrls: ['./service-account-history.component.scss'],
})
export class ServiceAccountHistoryComponent implements OnDestroy {
  @Input() histories: any;
  subs: Subscription[] = [];

  //Fix header filter ADA related issues
  onCellPrepared(e: any) {
    if (e.rowType === 'header') {
      ['click', 'keydown'].forEach((event) =>
        fromEvent(e.cellElement.querySelector('.dx-header-filter'), event)
          .pipe(
            delay(60),
            tap(() => this.FixFilterItems()),
            switchMap(() =>
              fromEvent(
                document.querySelector('.dx-texteditor-input'),
                'change'
              )
            ),
            delay(60),
            tap(() => this.FixFilterItems()),
            switchMap(() =>
              fromEvent(
                document.querySelector('span.dx-clear-button-area'),
                'click'
              )
            ),
            delay(60),
            tap(() => this.FixFilterItems())
          )
          .subscribe()
      );
    }
  }

  ngOnInit() {
    this.histories.forEach((e: any) => {
      var endpoint = e.beforeChange != null ? e.beforeChange : e.afterChange;
      e.fieldName = e.fieldName == 'API Access' ? 'Sites' : e.fieldName;

      if (e.fieldName === 'ScopeName') {
        e.fieldName = 'Endpoints';

        e.description =
          endpoint
            .replace(/-inbound/, ' INBOUND')
            .replace(/-outbound/, ' OUTBOUND')
            .replace(/api./, '')
            .replace(/-/g, ' ')
            .replace(/(^|\s)\S/g, (match: any) => {
              return match.toUpperCase();
            }) + ' endpoint has been updated';

        if (e.beforeChange != null) {
          e.beforeChange = 'True';
          e.afterChange = 'False';
        } else {
          e.beforeChange = 'False';
          e.afterChange = 'True';
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  //Treeview scrollable needs to have role as group
  private FixFilterItems() {
    const scrollable = document.querySelector('.dx-scrollable');
    if (scrollable && scrollable.attributes['role'].value !== 'group') {
      scrollable.setAttribute('role', 'group');
    }
  }
}
