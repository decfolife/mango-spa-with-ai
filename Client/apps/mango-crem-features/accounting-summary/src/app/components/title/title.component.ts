import { Component, OnDestroy, OnInit } from '@angular/core';
import { AccountingSummaryService } from '../../services/accounting-summary.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ObjectInfoComponent } from '@mango/ui-shared/lib-ui-shared';

@Component({
  selector: 'mango-accounts-summary-title',
  templateUrl: './title.component.html',
  styleUrls: ['./title.component.scss'],
})
export class TitleComponent implements OnInit, OnDestroy {
  leaseName = '';
  componentName = 'accounting-summary-lease';
  showTooltip = false;
  isLocked = false;
  isArchived = false;
  lockedReason = '';
  private subscription = new Subscription();

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.accountingSummaryService
        .getTitleInfoFromSubject()
        .subscribe((titleInfo) => {
          this.leaseName = titleInfo.leaseName;
          this.isLocked = titleInfo.isLocked;
          this.isArchived = titleInfo.isArchived;
          this.lockedReason = titleInfo.lockedReason;
        })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showObjectInfoPopup() {
    this.dialog.open(ObjectInfoComponent);
  }
}
