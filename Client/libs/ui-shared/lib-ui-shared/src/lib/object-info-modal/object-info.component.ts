import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AccordionModule,
  CardModule,
  CremPopupComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { Subscription } from 'rxjs';
import { ObjectActionsService } from 'apps/mango-crem-features/object-actions/src/app/components/object-actions/object-actions.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'crem-object-info',
  standalone: true,
  imports: [CommonModule, CardModule, CremPopupComponent, AccordionModule],
  templateUrl: './object-info.component.html',
  styleUrls: ['./object-info.component.scss'],
  providers: [ObjectActionsService],
})
export class ObjectInfoComponent implements OnInit, OnDestroy {
  // Internal state derived from breadcrumbs
  OTID: number = 0;
  OID: number = 0;
  NavPageId: number = 0;
  subs: Subscription[] = [];
  modalTitle = 'Object Info';
  isLoading = true;
  isError = false;
  data = {};

  constructor(
    private objectService: ObjectActionsService,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.getRouteInfo();
    this.subs.push(
      this.objectService
        .getObjectInfo(this.OID, this.OTID, this.NavPageId)
        .subscribe((res) => {
          if (res && res.success && res.data) {
            this.data = res.data;
            this.isLoading = false;
          } else {
            console.error('Failed to fetch object info:', res);
            this.isError = true;
            this.isLoading = false;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  listFormat(text: string): string[] {
    if (!text) return [];
    const parts = text.split('|');

    return parts;
  }

  getRouteInfo() {
    const queryParams = this.route.snapshot.queryParamMap;

    this.NavPageId = Number(queryParams.get('navpageid') ?? 0);
    this.OTID = Number(queryParams.get('otid') ?? 0);
    this.OID = Number(queryParams.get('oid') ?? 0);
  }
}
