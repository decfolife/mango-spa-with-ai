import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AiLeaseListItem } from '../models/ai-form.model';
import { AiLeaseService } from '../services/ai-lease.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { ExportDevexDatagridService } from '@mango/core-shared';

@Component({
  selector: 'mango-ai-list-page',
  templateUrl: './ai-list-page.component.html',
  styleUrls: ['./ai-list-page.component.scss'],
})
export class AiListPageComponent implements OnInit, OnDestroy {
  @ViewChild(DxDataGridComponent)
  private grid?: DxDataGridComponent;

  leases: AiLeaseListItem[] = [];
  filteredLeases: AiLeaseListItem[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  createdAiAbstractionId: number | null = null;
  searchText = '';
  selectedPortfolioId: number | null = null;
  portfolioOptions: Array<{ id: number; name: string }> = [];

  private readonly destroy$ = new Subject<void>();
  private readonly stopPolling$ = new Subject<void>();

  constructor(
    private readonly aiLeaseService: AiLeaseService,
    private readonly exportToExcelService: ExportDevexDatagridService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (params) => {
          this.createdAiAbstractionId =
            Number(params.get('createdAiAbstractionId') ?? 0) || null;
          this.stopPolling$.next();
          this.loadLeases(true);
        },
      });
  }

  ngOnDestroy(): void {
    this.stopPolling$.next();
    this.stopPolling$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRowClick(event: { data: AiLeaseListItem }): void {
    const formId = event?.data?.formId;

    if (!formId) {
      this.errorMessage =
        'Missing required formId to open AI abstraction details.';
      return;
    }

    if (event?.data?.id) {
      this.router.navigate([event.data.id], {
        relativeTo: this.activatedRoute,
        queryParams: { formId },
      });
    }
  }

  isProcessing(status: string): boolean {
    return ['Pending', 'Processing'].includes(status);
  }

  isCreatedRow(row: AiLeaseListItem): boolean {
    return !!this.createdAiAbstractionId && row.id === this.createdAiAbstractionId;
  }

  onSearchChanged(value: string): void {
    this.searchText = value ?? '';
    this.applyFilters();
  }

  onPortfolioChanged(selectedItems: Array<{ id: number; name: string }>): void {
    this.selectedPortfolioId = selectedItems?.[0]?.id ?? null;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedPortfolioId = null;
    this.grid?.instance?.clearFilter();
    this.grid?.instance?.clearSorting();
    this.applyFilters();
  }

  exportToExcel(): void {
    if (!this.grid?.instance) {
      return;
    }

    this.exportToExcelService.exportToExcel(
      this.grid.instance,
      'AI Lease Abstractions'
    );
  }

  private loadLeases(showLoading = false): void {
    if (showLoading) {
      this.isLoading = true;
    }
    this.errorMessage = null;

    this.aiLeaseService
      .getLeaseList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (leases) => {
          this.leases = leases;
          this.portfolioOptions = this.buildPortfolioOptions(leases);
          this.applyFilters();
          this.isLoading = false;

          if (leases.some((lease) => this.isProcessing(lease.status))) {
            this.startPolling();
          }
        },
        error: () => {
          this.errorMessage =
            'Failed to load AI lease abstractions. Please try again.';
          this.isLoading = false;
        },
      });
  }

  private startPolling(): void {
    this.stopPolling$.next();
    timer(5000, 5000)
      .pipe(
        switchMap(() => this.aiLeaseService.getLeaseList()),
        takeUntil(this.stopPolling$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (leases) => {
          this.leases = leases;
          this.portfolioOptions = this.buildPortfolioOptions(leases);
          this.applyFilters();
          if (!leases.some((lease) => this.isProcessing(lease.status))) {
            this.stopPolling$.next();
          }
        },
        error: () => {
          this.stopPolling$.next();
        },
      });
  }

  private applyFilters(): void {
    const normalizedSearch = this.searchText.trim().toLowerCase();

    this.filteredLeases = this.leases.filter((lease) => {
      const matchesPortfolio =
        !this.selectedPortfolioId || lease.portfolioId === this.selectedPortfolioId;

      if (!matchesPortfolio) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        lease.id,
        lease.portfolioName,
        lease.buildingName,
        lease.formName,
        lease.aiTenant,
        lease.status,
        lease.aiLeaseEndDate,
        lease.createdDate,
        lease.lastModifiedDate,
      ];

      return searchableValues.some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }

  private buildPortfolioOptions(
    leases: AiLeaseListItem[]
  ): Array<{ id: number; name: string }> {
    const portfolioMap = new Map<number, string>();

    leases.forEach((lease) => {
      if (lease.portfolioId && lease.portfolioName) {
        portfolioMap.set(lease.portfolioId, lease.portfolioName);
      }
    });

    return Array.from(portfolioMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
