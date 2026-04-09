import { Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import { IAIOutput } from '../models/ai-output.model';
import { AiLeaseService } from '../services/ai-lease.service';
import { AiSidebarService } from './ai-sidebar.service';

interface SidebarField {
  label: string;
  value: string;
  citation?: string;
}

interface SidebarSection {
  title: string;
  fields: SidebarField[];
  isExpanded: boolean;
}

@Component({
  selector: 'mango-ai-sidebar',
  templateUrl: './ai-sidebar.component.html',
  styleUrls: ['./ai-sidebar.component.scss'],
})
export class AiSidebarComponent implements OnInit, OnDestroy {
  @ViewChildren(DxDataGridComponent) dataGrids: QueryList<DxDataGridComponent>;

  isOpen = false;
  isLoading = false;
  errorMessage: string | null = null;
  sections: SidebarSection[] = [];
  rentScheduleItems: any[] = [];
  abatementItems: any[] = [];
  currentWidth = 420;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartWidth = 0;
  private readonly MIN_WIDTH = 250;
  private readonly MAX_WIDTH = 800;
  private resizeObserver: ResizeObserver;

  readonly rentScheduleColumns = [
    { dataField: 'startDate', caption: 'Start', dataType: 'date', format: 'MM/dd/yyyy' },
    { dataField: 'endDate', caption: 'End', dataType: 'date', format: 'MM/dd/yyyy' },
    { dataField: 'monthlyBaseRent', caption: 'Monthly Rent', dataType: 'number', format: { type: 'currency', precision: 0 } },
  ];

  readonly abatementColumns = [
    { dataField: 'startDate', caption: 'Start', dataType: 'date', format: 'MM/dd/yyyy' },
    { dataField: 'endDate', caption: 'End', dataType: 'date', format: 'MM/dd/yyyy' },
    { dataField: 'discountAmount', caption: 'Amount', dataType: 'number', format: { type: 'currency', precision: 0 } },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly aiSidebarService: AiSidebarService,
    private readonly aiLeaseService: AiLeaseService,
    private readonly route: ActivatedRoute,
    private readonly el: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    // Repaint grids whenever the sidebar's width changes (drag or open/close transition)
    this.resizeObserver = new ResizeObserver(() => {
      this.dataGrids?.forEach((grid) => grid.instance?.repaint());
    });
    this.resizeObserver.observe(this.el.nativeElement);

    combineLatest([
      this.aiSidebarService.state$,
      this.route.queryParams,
    ])
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(
          ([prevState, prevParams], [nextState, nextParams]) =>
            prevState.isOpen === nextState.isOpen &&
            prevState.leaseId === nextState.leaseId &&
            prevParams['oid'] === nextParams['oid']
        )
      )
      .subscribe(([state, params]) => {
        this.isOpen = state.isOpen;
        // Prefer explicit leaseId from service (AI abstraction route),
        // fall back to ?oid= query param (dynamic form route)
        const oid = state.leaseId ?? (params['oid'] ? Number(params['oid']) : null);

        if (state.isOpen && oid) {
          this.loadData(oid);
        } else if (!state.isOpen) {
          this.sections = [];
          this.rentScheduleItems = [];
          this.abatementItems = [];
          this.errorMessage = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.aiSidebarService.close();
  }

  toggleSection(section: SidebarSection): void {
    section.isExpanded = !section.isExpanded;
  }

  hasAbatements(): boolean {
    return this.abatementItems.length > 0;
  }

  // ─── Resize ──────────────────────────────────────────────────────────────────

  onResizeStart(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartWidth = this.currentWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    // Sidebar is on the right edge; dragging left (smaller clientX) increases width
    const delta = this.dragStartX - event.clientX;
    this.currentWidth = Math.min(this.MAX_WIDTH, Math.max(this.MIN_WIDTH, this.dragStartWidth + delta));
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  // ─── Data ────────────────────────────────────────────────────────────────────

  private loadData(oid: number): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.aiLeaseService
      .getLeaseById(oid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (!data) {
            this.errorMessage = 'No AI abstraction found for this lease.';
          } else {
            this.sections = this.buildSections(data);
            this.rentScheduleItems = data.rent?.baseRentSchedule?.value ?? [];
            this.abatementItems = data.rent?.rentAbatements?.value ?? [];
          }
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load AI summary data.';
          this.isLoading = false;
        },
      });
  }

  private buildSections(data: IAIOutput): SidebarSection[] {
    return [
      {
        title: 'Overview',
        isExpanded: true,
        fields: [
          { label: 'Tenant', value: data.basics?.tenant?.value ?? '—' },
          { label: 'Landlord', value: data.basics?.landlord?.value ?? '—' },
          {
            label: 'Address',
            value: data.basics?.addresses?.value
              ?.map((a) => [a.StreetAddress, a.CityStateZip].filter(Boolean).join(', '))
              .join('; ') ?? '—',
          },
          { label: 'Square Footage', value: this.formatNumber(data.basics?.squareFootage?.value) },
          { label: 'Suite', value: data.basics?.suite?.value ?? '—' },
          { label: 'Lease Type', value: data.basics?.leaseType?.value ?? '—' },
          { label: 'Deal Type', value: data.basics?.dealType?.value ?? '—' },
          { label: 'Space Use', value: data.basics?.spaceUse?.value ?? '—' },
          { label: 'Entire Building', value: this.formatBoolean(data.basics?.entireBuilding?.value) },
        ],
      },
      {
        title: 'Key Dates',
        isExpanded: true,
        fields: [
          { label: 'Lease Sign Date', value: this.formatDate(data.dates?.leaseSignDate?.value) },
          { label: 'Commencement Date', value: this.formatDate(data.dates?.leaseCommencementDate?.value) },
          { label: 'Rent Commencement', value: this.formatDate(data.dates?.rentCommencementDate?.value) },
          { label: 'Lease End Date', value: this.formatDate(data.dates?.leaseEndDate?.value) },
          { label: 'Term (Months)', value: this.formatNumber(data.dates?.leaseTermInMonths?.value) },
        ],
      },
      {
        title: 'Rent',
        isExpanded: true,
        fields: [
          { label: 'Effective Rent ($/SF)', value: this.formatCurrency(data.rent?.effectiveRent?.value) },
          { label: 'Annual Escalation', value: this.formatPercent(data.rent?.annualEscalation?.value?.percent) },
          {
            label: 'TI Allowance',
            value: this.formatCurrency(data.rent?.tenantImprovementAllowance?.value),
            citation: data.rent?.tenantImprovementAllowance?.citation,
          },
          {
            label: 'TI ($/SF)',
            value: this.formatCurrency(data.rent?.tenantImprovementAllowance?.subfields?.allowances?.[0]?.amount),
          },
        ],
      },
      {
        title: 'Expenses',
        isExpanded: true,
        fields: [
          { label: 'Service Type', value: data.expenses?.serviceTypeEstimate?.value ?? '—' },
          {
            label: 'Operating Expenses',
            value: this.formatPayor(data.expenses?.operatingExpenses?.value),
            citation: data.expenses?.operatingExpenses?.citation,
          },
          { label: 'CAM', value: this.formatPayor(data.expenses?.cam?.value), citation: data.expenses?.cam?.citation },
          { label: 'Insurance', value: this.formatPayor(data.expenses?.insurance?.value) },
          { label: 'Taxes', value: this.formatPayor(data.expenses?.taxes?.value) },
          { label: 'Water', value: this.formatPayor(data.expenses?.water?.value) },
          { label: 'Gas', value: this.formatPayor(data.expenses?.gas?.value) },
          { label: 'Electricity', value: this.formatPayor(data.expenses?.electricity?.value) },
          { label: 'HVAC', value: this.formatPayor(data.expenses?.hvac?.value), citation: data.expenses?.hvac?.citation },
          { label: 'Cleaning', value: this.formatPayor(data.expenses?.cleaning?.value) },
        ],
      },
    ];
  }

  // ─── Formatters ─────────────────────────────────────────────────────────────

  private formatDate(value: string | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US');
  }

  private formatCurrency(value: number | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  private formatNumber(value: number | undefined): string {
    if (value == null) return '—';
    return value.toLocaleString();
  }

  private formatPercent(value: number | undefined): string {
    if (value == null) return '—';
    return `${value.toFixed(2)}%`;
  }

  private formatBoolean(value: boolean | undefined): string {
    if (value == null) return '—';
    return value ? 'Yes' : 'No';
  }

  private formatPayor(value: string | boolean | number | undefined): string {
    if (value == null || value === '') return '—';
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
