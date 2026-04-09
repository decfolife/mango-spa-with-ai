import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AiFormField, AiFormSection, AiRentScheduleSection } from '../models/ai-form.model';
import { IAIOutput } from '../models/ai-output.model';
import { AiLeaseService } from '../services/ai-lease.service';
import { AiSidebarService } from '../ai-sidebar/ai-sidebar.service';

@Component({
  selector: 'mango-ai-lease-form',
  templateUrl: './ai-lease-form.component.html',
  styleUrls: ['./ai-lease-form.component.scss'],
})
export class AiLeaseFormComponent implements OnInit, OnDestroy {
  form: FormGroup = new FormGroup({});
  sections: AiFormSection[] = [];
  sectionsExpanded: boolean[] = [];
  isLoading = true;
  editMode = false;
  errorMessage: string | null = null;
  pageTitle = 'AI Lease Abstraction';

  private leaseId: number;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly aiLeaseService: AiLeaseService,
    private readonly aiSidebarService: AiSidebarService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.leaseId = Number(params.get('id'));
          this.isLoading = true;
          this.errorMessage = null;
          return this.aiLeaseService.getLeaseById(this.leaseId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          if (!data) {
            this.errorMessage = 'No AI abstraction data found for this lease.';
            this.isLoading = false;
            return;
          }
          this.sections = this.buildSections(data);
          this.sectionsExpanded = this.sections.map(() => true);
          this.form = this.buildFormGroup(this.sections);
          if (data.basics?.tenant?.value) {
            this.pageTitle = `AI Lease Abstraction — ${data.basics.tenant.value}`;
          }
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load lease abstraction data. Please try again.';
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.aiSidebarService.toggle();
  }

  expandAll(): void {
    this.sectionsExpanded = this.sectionsExpanded.map(() => true);
  }

  collapseAll(): void {
    this.sectionsExpanded = this.sectionsExpanded.map(() => false);
  }

  scrollToTop(): void {
    document.getElementById('df-formContainer-formContainer')?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.form.enable();
    } else {
      this.form.disable();
    }
  }

  onSave(): void {
    // Placeholder for save logic when real API is wired in
    console.log('Saving AI form data:', this.form.value);
    this.editMode = false;
    this.form.disable();
  }

  onCancel(): void {
    this.editMode = false;
    this.form.disable();
  }

  navigateBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  getSectionFormGroup(sectionKey: string): FormGroup {
    return this.form.get(sectionKey) as FormGroup;
  }

  // ─── Section Builder ────────────────────────────────────────────────────────

  private buildSections(data: IAIOutput): AiFormSection[] {
    return [
      this.buildBasicsSection(data),
      this.buildDatesSection(data),
      this.buildRentSection(data),
      this.buildExpensesSection(data),
    ];
  }

  private buildBasicsSection(data: IAIOutput): AiFormSection {
    const address = data.basics?.addresses?.value
      ?.map((a) => [a.StreetAddress, a.CityStateZip].filter(Boolean).join(', '))
      .join('; ') ?? null;

    const floors = Array.isArray(data.basics?.floors?.value)
      ? data.basics.floors.value.join(', ')
      : null;

    return {
      key: 'basics',
      title: 'Overview',
      fields: [
        { key: 'tenant', label: 'Tenant', type: 'text', value: data.basics?.tenant?.value },
        { key: 'landlord', label: 'Landlord', type: 'text', value: data.basics?.landlord?.value },
        { key: 'address', label: 'Address', type: 'text', value: address },
        { key: 'squareFootage', label: 'Square Footage (SF)', type: 'number', value: data.basics?.squareFootage?.value },
        { key: 'suite', label: 'Suite', type: 'text', value: data.basics?.suite?.value },
        { key: 'floors', label: 'Floors', type: 'text', value: floors },
        { key: 'leaseType', label: 'Lease Type', type: 'text', value: data.basics?.leaseType?.value },
        { key: 'dealType', label: 'Deal Type', type: 'text', value: data.basics?.dealType?.value },
        { key: 'spaceUse', label: 'Space Use', type: 'text', value: data.basics?.spaceUse?.value },
        { key: 'entireBuilding', label: 'Entire Building', type: 'boolean', value: data.basics?.entireBuilding?.value },
        { key: 'includesAmendments', label: 'Includes Amendments', type: 'boolean', value: data.basics?.includesAmendments?.value },
        { key: 'abstractionDate', label: 'Abstraction Date', type: 'date', value: data.basics?.abstractionDate?.value },
      ],
    };
  }

  private buildDatesSection(data: IAIOutput): AiFormSection {
    return {
      key: 'dates',
      title: 'Key Dates',
      fields: [
        { key: 'leaseSignDate', label: 'Lease Sign Date', type: 'date', value: data.dates?.leaseSignDate?.value },
        { key: 'leaseStartDate', label: 'Lease Start Date', type: 'date', value: data.dates?.leaseStartDate?.value },
        { key: 'leaseCommencementDate', label: 'Commencement Date (CD)', type: 'date', value: data.dates?.leaseCommencementDate?.value },
        { key: 'rentCommencementDate', label: 'Rent Commencement Date (RCD)', type: 'date', value: data.dates?.rentCommencementDate?.value },
        { key: 'leaseEndDate', label: 'Lease End Date', type: 'date', value: data.dates?.leaseEndDate?.value },
        { key: 'leaseTermInMonths', label: 'Lease Term (Months)', type: 'number', value: data.dates?.leaseTermInMonths?.value },
      ],
    };
  }

  private buildRentSection(data: IAIOutput): AiFormSection {
    const rentSchedule: AiRentScheduleSection | undefined =
      (data.rent?.baseRentSchedule?.value?.length ?? 0) > 0
        ? {
            scheduleItems: data.rent.baseRentSchedule.value,
            abatementItems: data.rent?.rentAbatements?.value ?? [],
            startsFromRCD: data.rent.baseRentSchedule.subfields?.startsFromRCD ?? false,
            startsFromCD: data.rent.baseRentSchedule.subfields?.startsFromCD ?? false,
          }
        : undefined;

    return {
      key: 'rent',
      title: 'Rent',
      fields: [
        {
          key: 'effectiveRent',
          label: 'Effective Rent (Annual $/SF)',
          type: 'currency',
          value: data.rent?.effectiveRent?.value,
        },
        {
          key: 'annualEscalation',
          label: 'Annual Escalation',
          type: 'percent',
          value: data.rent?.annualEscalation?.value?.percent,
        },
        {
          key: 'tiAllowance',
          label: 'TI Allowance (Total)',
          type: 'currency',
          value: data.rent?.tenantImprovementAllowance?.value,
          citation: data.rent?.tenantImprovementAllowance?.citation,
        },
        {
          key: 'tiAllowancePerSf',
          label: 'TI Allowance ($/SF)',
          type: 'currency',
          value: data.rent?.tenantImprovementAllowance?.subfields?.allowances?.[0]?.amount,
        },
      ],
      rentSchedule,
    };
  }

  private buildExpensesSection(data: IAIOutput): AiFormSection {
    const expenseFields: AiFormField[] = [
      { key: 'serviceType', label: 'Service Type', type: 'text', value: data.expenses?.serviceTypeEstimate?.value },
      {
        key: 'operatingExpenses',
        label: 'Operating Expenses',
        type: 'text',
        value: data.expenses?.operatingExpenses?.value,
        citation: data.expenses?.operatingExpenses?.citation,
      },
      {
        key: 'cam',
        label: 'CAM',
        type: 'text',
        value: data.expenses?.cam?.value,
        citation: data.expenses?.cam?.citation,
      },
      { key: 'insurance', label: 'Insurance', type: 'text', value: data.expenses?.insurance?.value },
      { key: 'taxes', label: 'Taxes / Real Estate', type: 'text', value: data.expenses?.taxes?.value },
      { key: 'water', label: 'Water', type: 'text', value: data.expenses?.water?.value },
      { key: 'gas', label: 'Gas', type: 'text', value: data.expenses?.gas?.value },
      { key: 'electricity', label: 'Electricity', type: 'text', value: data.expenses?.electricity?.value },
      {
        key: 'hvac',
        label: 'HVAC',
        type: 'text',
        value: data.expenses?.hvac?.value,
        citation: data.expenses?.hvac?.citation,
      },
      {
        key: 'cleaning',
        label: 'Cleaning',
        type: 'text',
        value: data.expenses?.cleaning?.value,
        citation: data.expenses?.cleaning?.citation,
      },
    ];

    return { key: 'expenses', title: 'Expenses', fields: expenseFields };
  }

  // ─── Form Group Builder ──────────────────────────────────────────────────────

  private buildFormGroup(sections: AiFormSection[]): FormGroup {
    const root: { [key: string]: FormGroup } = {};

    sections.forEach((section) => {
      const sectionControls: { [key: string]: FormControl } = {};

      section.fields.forEach((field) => {
        sectionControls[field.key] = new FormControl({ value: field.value ?? '', disabled: true });
      });

      root[section.key] = new FormGroup(sectionControls);
    });

    return new FormGroup(root);
  }
}
