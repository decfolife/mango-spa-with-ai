import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AiLeaseListItem } from '../models/ai-form.model';
import { AiLeaseService } from '../services/ai-lease.service';

@Component({
  selector: 'mango-ai-list-page',
  templateUrl: './ai-list-page.component.html',
  styleUrls: ['./ai-list-page.component.scss'],
})
export class AiListPageComponent implements OnInit, OnDestroy {
  leases: AiLeaseListItem[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly aiLeaseService: AiLeaseService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadLeases();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLeases(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.aiLeaseService
      .getLeaseList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (leases) => {
          this.leases = leases;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load AI lease abstractions. Please try again.';
          this.isLoading = false;
        },
      });
  }

  onRowClick(event: { data: AiLeaseListItem }): void {
    if (event?.data?.id) {
      this.router.navigate([event.data.id], { relativeTo: this.activatedRoute });
    }
  }

  formatCurrency(value: number): string {
    return value != null
      ? `$${value.toFixed(2)}/SF`
      : '—';
  }

  formatNumber(value: number): string {
    return value != null
      ? value.toLocaleString()
      : '—';
  }
}
