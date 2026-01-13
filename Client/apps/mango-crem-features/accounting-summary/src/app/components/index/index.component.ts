import { Component, Input, OnInit } from '@angular/core';
import { AccountingSummaryService } from '../../services/accounting-summary.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'mango-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
})
export class IndexComponent implements OnInit {
  constructor(
    private accountingSummaryService: AccountingSummaryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.accountingSummaryService.setNavPageId(
      Number(this.route.snapshot.queryParamMap.get('navpageid'))
    );
    this.accountingSummaryService.setLeaseAbstractId(
      Number(this.route.snapshot.queryParamMap.get('oid'))
    );
  }
}
