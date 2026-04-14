import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import { IAIOutput } from '../models/ai-output.model';
import {
  AiAbstractionDetail,
  AiAbstractionDocument,
  AiLeaseService,
} from '../services/ai-lease.service';
import { AiSidebarService } from './ai-sidebar.service';
import type { DocumentSource } from 'document-viewer-sdk';

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

interface DocumentOption {
  documentId: number;
  fileName: string;
  mimeType?: string;
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
  searchQuery: string | null = null;
  sections: SidebarSection[] = [];
  rentScheduleItems: any[] = [];
  abatementItems: any[] = [];
  currentWidth = 420;
  activeTabIndex = 1;
  documentSource: DocumentSource | null = null;
  documentFileName: string | null = null;
  documentLoadError: string | null = null;
  documentOptions: DocumentOption[] = [];
  selectedDocumentId: number | null = null;
  isDocumentLoading = false;
  currentAiAbstractionId: number | null = null;
  private loadedDocumentContextId: number | null = null;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartWidth = 0;
  private readonly MIN_WIDTH = 250;
  private readonly MAX_WIDTH = 800;
  private resizeObserver: ResizeObserver;

  readonly rentScheduleColumns = [
    {
      dataField: 'startDate',
      caption: 'Start',
      dataType: 'date',
      format: 'MM/dd/yyyy',
    },
    {
      dataField: 'endDate',
      caption: 'End',
      dataType: 'date',
      format: 'MM/dd/yyyy',
    },
    {
      dataField: 'monthlyBaseRent',
      caption: 'Monthly Rent',
      dataType: 'number',
      format: { type: 'currency', precision: 0 },
    },
  ];

  readonly abatementColumns = [
    {
      dataField: 'startDate',
      caption: 'Start',
      dataType: 'date',
      format: 'MM/dd/yyyy',
    },
    {
      dataField: 'endDate',
      caption: 'End',
      dataType: 'date',
      format: 'MM/dd/yyyy',
    },
    {
      dataField: 'discountAmount',
      caption: 'Amount',
      dataType: 'number',
      format: { type: 'currency', precision: 0 },
    },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly aiSidebarService: AiSidebarService,
    private readonly aiLeaseService: AiLeaseService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly el: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    // Repaint grids whenever the sidebar's width changes (drag or open/close transition)
    this.resizeObserver = new ResizeObserver(() => {
      this.dataGrids?.forEach((grid) => grid.instance?.repaint());
    });
    this.resizeObserver.observe(this.el.nativeElement);

    combineLatest([this.aiSidebarService.state$, this.route.queryParams])
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
        this.syncGlobalSidebarState();
        // Prefer explicit leaseId from service (AI abstraction route),
        // fall back to ?oid= query param (dynamic form route)
        const oid =
          state.leaseId ?? (params['oid'] ? Number(params['oid']) : null);

        if (state.isOpen && oid) {
          const abstractionChanged = this.currentAiAbstractionId !== oid;
          this.currentAiAbstractionId = oid;
          if (abstractionChanged) {
            this.documentSource = null;
            this.documentFileName = null;
            this.documentLoadError = null;
            this.documentOptions = [];
            this.selectedDocumentId = null;
            this.isDocumentLoading = false;
            this.loadedDocumentContextId = null;
          }

          if (this.activeTabIndex === 0) {
            this.ensureDocumentContextLoaded();
          }
          if (state.aiOutput && state.leaseId === oid) {
            this.populateFromAiOutput(state.aiOutput);
          } else {
            this.loadData(oid);
          }
        } else if (!state.isOpen) {
          this.sections = [];
          this.rentScheduleItems = [];
          this.abatementItems = [];
          this.errorMessage = null;
          this.documentSource = null;
          this.documentFileName = null;
          this.documentLoadError = null;
          this.documentOptions = [];
          this.selectedDocumentId = null;
          this.isDocumentLoading = false;
          this.currentAiAbstractionId = null;
          this.loadedDocumentContextId = null;
          this.activeTabIndex = 1;
        }
      });

    this.aiSidebarService.state$
      .pipe(
        takeUntil(this.destroy$),
        map((s) => s.searchQuery),
        distinctUntilChanged()
      )
      .subscribe((searchQuery) => {
        this.searchQuery = searchQuery;
        if (searchQuery) {
          this.activeTabIndex = 0;
          this.ensureDocumentContextLoaded();
        }
      });
  }

  ngOnDestroy(): void {
    this.clearGlobalSidebarState();
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

  copyCitation(text: string): void {
    navigator.clipboard?.writeText(text);
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;

    if (index === 0) {
      this.ensureDocumentContextLoaded();
    }
  }

  onDocumentSelectionChange(documentId: string): void {
    const resolvedDocumentId = Number(documentId);
    if (!resolvedDocumentId || resolvedDocumentId === this.selectedDocumentId) {
      return;
    }

    const document = this.documentOptions.find(
      (item) => item.documentId === resolvedDocumentId
    );
    if (!document) {
      return;
    }

    this.loadDocumentFile(document);
  }

  openDocumentInNewWindow(): void {
    if (!this.currentAiAbstractionId) {
      return;
    }

    const tree = this.router.createUrlTree(
      ['/crem/portfolio/ai-abstractions/document', this.currentAiAbstractionId],
      {
        queryParams: this.selectedDocumentId
          ? { documentId: this.selectedDocumentId }
          : {},
      }
    );

    const url = this.router.serializeUrl(tree);
    window.open(url, '_blank', 'noopener,noreferrer');
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
    this.currentWidth = Math.min(
      this.MAX_WIDTH,
      Math.max(this.MIN_WIDTH, this.dragStartWidth + delta)
    );
    this.syncGlobalSidebarState();
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
            this.aiSidebarService.setAiOutput(oid, data);
            this.populateFromAiOutput(data);
          }
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load AI summary data.';
          this.isLoading = false;
        },
      });
  }

  private loadDocumentContext(aiAbstractionId: number): void {
    this.documentLoadError = null;
    this.documentSource = null;
    this.documentFileName = null;
    this.documentOptions = [];
    this.selectedDocumentId = null;
    this.isDocumentLoading = true;

    this.aiLeaseService
      .getAbstractionDocuments(aiAbstractionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          if (this.populateDocumentContextFromDocuments(aiAbstractionId, documents)) {
            return;
          }

          this.loadDocumentContextFallback(aiAbstractionId);
        },
        error: () => {
          this.loadedDocumentContextId = null;
          this.loadDocumentContextFallback(aiAbstractionId);
        },
      });
  }

  private loadDocumentContextFallback(aiAbstractionId: number): void {
    this.aiLeaseService
      .getAbstractionById(aiAbstractionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.isDocumentLoading = false;
          this.populateDocumentContext(detail);
          if (this.documentSource) {
            this.loadedDocumentContextId = aiAbstractionId;
          } else {
            this.loadedDocumentContextId = null;
            this.documentLoadError = 'Failed to load document metadata.';
          }
        },
        error: () => {
          this.documentSource = null;
          this.documentFileName = null;
          this.loadedDocumentContextId = null;
          this.documentLoadError = 'Failed to load document metadata.';
          this.isDocumentLoading = false;
        },
      });
  }

  private populateDocumentContextFromDocuments(
    aiAbstractionId: number,
    documents: AiAbstractionDocument[] | null | undefined
  ): boolean {
    const validDocuments =
      documents
        ?.map((document) => ({
          documentId: document.documentId ?? 0,
          fileName:
            document.fileName ??
            document.documentFileName ??
            `Document ${document.documentId ?? ''}`.trim(),
          mimeType: document.mimeType,
        }))
        .filter((document) => document.documentId > 0) ?? [];

    this.documentOptions = validDocuments;

    if (!validDocuments.length) {
      this.isDocumentLoading = false;
      this.loadedDocumentContextId = null;
      return false;
    }

    this.loadedDocumentContextId = aiAbstractionId;
    this.loadDocumentFile(validDocuments[0]);

    return true;
  }

  private loadDocumentFile(document: DocumentOption): void {
    this.selectedDocumentId = document.documentId;
    this.documentFileName = document.fileName;
    this.documentLoadError = null;
    this.documentSource = null;
    this.isDocumentLoading = true;

    this.aiLeaseService
      .getAbstractionDocumentFile({
        documentId: document.documentId,
        fileName: document.fileName,
        mimeType: document.mimeType,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (file) => {
          this.documentSource = file;
          this.documentLoadError = null;
          this.isDocumentLoading = false;
        },
        error: () => {
          this.documentSource = null;
          this.documentLoadError = 'Failed to load document file.';
          this.isDocumentLoading = false;
        },
      });
  }

  private populateDocumentContext(detail: AiAbstractionDetail | null): void {
    const context = this.parseContext(detail?.contextJson);
    const documentUrl =
      (detail as any)?.documentUrl ??
      context?.documentUrl ??
      context?.documents?.[0]?.url ??
      null;
    const documentFileName =
      (detail as any)?.documentFileName ??
      context?.documentFileName ??
      context?.documents?.[0]?.fileName ??
      null;

    this.documentSource = documentUrl
      ? ({ url: documentUrl } as DocumentSource)
      : null;
    this.documentFileName = documentFileName;
  }

  private ensureDocumentContextLoaded(): void {
    if (!this.currentAiAbstractionId || this.isDocumentLoading) {
      return;
    }

    if (this.loadedDocumentContextId === this.currentAiAbstractionId) {
      if (!this.documentSource) {
        const selectedDocument =
          this.documentOptions.find(
            (document) => document.documentId === this.selectedDocumentId
          ) ?? this.documentOptions[0];

        if (selectedDocument) {
          this.loadDocumentFile(selectedDocument);
        }
      }

      return;
    }

    this.loadDocumentContext(this.currentAiAbstractionId);
  }

  private syncGlobalSidebarState(): void {
    document.documentElement.style.setProperty(
      '--ai-sidebar-width',
      this.isOpen ? `${this.currentWidth}px` : '0px'
    );
  }

  private clearGlobalSidebarState(): void {
    document.documentElement.style.setProperty('--ai-sidebar-width', '0px');
  }

  private parseContext(contextJson?: string | null): any | null {
    if (!contextJson) {
      return null;
    }

    try {
      return JSON.parse(contextJson);
    } catch {
      return null;
    }
  }

  private populateFromAiOutput(data: IAIOutput): void {
    this.errorMessage = null;
    this.sections = this.buildSections(data);
    this.rentScheduleItems = data.rent?.baseRentSchedule?.value ?? [];
    this.abatementItems = data.rent?.rentAbatements?.value ?? [];
    this.isLoading = false;
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
            value:
              data.basics?.addresses?.value
                ?.map((a) =>
                  [a.StreetAddress, a.CityStateZip].filter(Boolean).join(', ')
                )
                .join('; ') ?? '—',
          },
          {
            label: 'Square Footage',
            value: this.formatNumber(data.basics?.squareFootage?.value),
          },
          { label: 'Suite', value: data.basics?.suite?.value ?? '—' },
          { label: 'Lease Type', value: data.basics?.leaseType?.value ?? '—' },
          { label: 'Deal Type', value: data.basics?.dealType?.value ?? '—' },
          { label: 'Space Use', value: data.basics?.spaceUse?.value ?? '—' },
          {
            label: 'Entire Building',
            value: this.formatBoolean(data.basics?.entireBuilding?.value),
          },
        ],
      },
      {
        title: 'Key Dates',
        isExpanded: true,
        fields: [
          {
            label: 'Lease Sign Date',
            value: this.formatDate(data.dates?.leaseSignDate?.value),
          },
          {
            label: 'Commencement Date',
            value: this.formatDate(data.dates?.leaseCommencementDate?.value),
          },
          {
            label: 'Rent Commencement',
            value: this.formatDate(data.dates?.rentCommencementDate?.value),
          },
          {
            label: 'Lease End Date',
            value: this.formatDate(data.dates?.leaseEndDate?.value),
          },
          {
            label: 'Term (Months)',
            value: this.formatNumber(data.dates?.leaseTermInMonths?.value),
          },
        ],
      },
      {
        title: 'Rent',
        isExpanded: true,
        fields: [
          {
            label: 'Effective Rent ($/SF)',
            value: this.formatCurrency(data.rent?.effectiveRent?.value),
          },
          {
            label: 'Annual Escalation',
            value: this.formatPercent(
              data.rent?.annualEscalation?.value?.percent
            ),
          },
          {
            label: 'TI Allowance',
            value: this.formatCurrency(
              data.rent?.tenantImprovementAllowance?.value
            ),
            citation: data.rent?.tenantImprovementAllowance?.citation,
          },
          {
            label: 'TI ($/SF)',
            value: this.formatCurrency(
              data.rent?.tenantImprovementAllowance?.subfields?.allowances?.[0]
                ?.amount
            ),
          },
        ],
      },
      {
        title: 'Expenses',
        isExpanded: true,
        fields: [
          {
            label: 'Service Type',
            value: data.expenses?.serviceTypeEstimate?.value ?? '—',
          },
          {
            label: 'Operating Expenses',
            value: this.formatPayor(data.expenses?.operatingExpenses?.value),
            citation: data.expenses?.operatingExpenses?.citation,
          },
          {
            label: 'Common Area Maintenance',
            value: this.formatPayor(data.expenses?.cam?.value),
            citation: data.expenses?.cam?.citation,
          },
          {
            label: 'Insurance',
            value: this.formatPayor(data.expenses?.insurance?.value),
          },
          {
            label: 'Taxes',
            value: this.formatPayor(data.expenses?.taxes?.value),
          },
          {
            label: 'Water',
            value: this.formatPayor(data.expenses?.water?.value),
          },
          { label: 'Gas', value: this.formatPayor(data.expenses?.gas?.value) },
          {
            label: 'Electricity',
            value: this.formatPayor(data.expenses?.electricity?.value),
          },
          {
            label: 'HVAC',
            value: this.formatPayor(data.expenses?.hvac?.value),
            citation: data.expenses?.hvac?.citation,
          },
          {
            label: 'Cleaning',
            value: this.formatPayor(data.expenses?.cleaning?.value),
          },
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
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
