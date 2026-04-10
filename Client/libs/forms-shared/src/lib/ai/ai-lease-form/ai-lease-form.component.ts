import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { AiDropdownItem, AiFormField, AiFormSection, AiRentScheduleSection } from '../models/ai-form.model';
import { IAIOutput } from '../models/ai-output.model';
import { AiLeaseService } from '../services/ai-lease.service';
import { AiSidebarService } from '../ai-sidebar/ai-sidebar.service';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { RequestType } from '@forms/model/enums/render-selects.enums';

// ── Static dropdown option lists ─────────────────────────────────────────────

const DEAL_TYPE_OPTIONS: AiDropdownItem[] = [
  { id: 'New', name: 'New' },
  { id: 'Renewal', name: 'Renewal' },
  { id: 'Expansion', name: 'Expansion' },
  { id: 'Sublease', name: 'Sublease' },
  { id: 'Extension', name: 'Extension' },
  { id: 'Termination', name: 'Termination' },
  { id: 'Other', name: 'Other' },
];

const SPACE_USE_OPTIONS: AiDropdownItem[] = [
  { id: 'Office', name: 'Office' },
  { id: 'Retail', name: 'Retail' },
  { id: 'Industrial', name: 'Industrial' },
  { id: 'Medical', name: 'Medical' },
  { id: 'Mixed Use', name: 'Mixed Use' },
  { id: 'Data Center', name: 'Data Center' },
  { id: 'Other', name: 'Other' },
];

const SERVICE_TYPE_OPTIONS: AiDropdownItem[] = [
  { id: 'Full Service Gross', name: 'Full Service Gross' },
  { id: 'Modified Gross', name: 'Modified Gross' },
  { id: 'NNN', name: 'NNN (Triple Net)' },
  { id: 'Net', name: 'Net' },
  { id: 'Modified Net', name: 'Modified Net' },
  { id: 'Gross', name: 'Gross' },
  { id: 'Other', name: 'Other' },
];

const PAYOR_OPTIONS: AiDropdownItem[] = [
  { id: 'tenant', name: 'Tenant' },
  { id: 'landlord', name: 'Landlord' },
  { id: 'shared', name: 'Shared' },
  { id: 'pro-rata', name: 'Pro-Rata' },
  { id: 'n/a', name: 'N/A' },
];

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
  abstractionStatus: string | null = null;
  pageTitle = 'AI Lease Abstraction';

  private leaseId: number;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly aiLeaseService: AiLeaseService,
    private readonly aiSidebarService: AiSidebarService,
    private readonly formWizardService: FormWizardService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.leaseId = Number(params.get('id'));
          this.isLoading = true;
          this.errorMessage = null;
          this.abstractionStatus = null;
          // Load abstraction detail and lease type dropdown options in parallel
          return forkJoin({
            detail: this.aiLeaseService.getAbstractionById(this.leaseId),
            leaseTypes: this.formWizardService
              .getRenderSelect('', RequestType.cnstDD_GetLeaseTypes)
              .pipe(catchError(() => of({ data: [] }))),
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ detail, leaseTypes }) => {
          if (!detail) {
            this.errorMessage = 'Abstraction not found.';
            this.isLoading = false;
            return;
          }

          this.abstractionStatus = detail.status;

          // Not yet complete — show status, no form to render
          if (detail.status !== 'Complete') {
            if (detail.status === 'Error') {
              this.errorMessage = detail.errorMessage ?? 'The AI abstraction encountered an error.';
            }
            this.isLoading = false;
            return;
          }

          if (!detail.aiOutputJson) {
            this.errorMessage = 'AI output is missing for this abstraction.';
            this.isLoading = false;
            return;
          }

          let aiOutput: IAIOutput;
          try {
            aiOutput = JSON.parse(detail.aiOutputJson) as IAIOutput;
          } catch {
            this.errorMessage = 'Failed to parse AI output data.';
            this.isLoading = false;
            return;
          }

          // Map raw lease type items from backend into AiDropdownItem format
          const leaseTypeItems: AiDropdownItem[] = (leaseTypes?.data ?? []).map((item: any) => ({
            id: item.leaseTypeID,
            name: item.leaseTypeName ?? item.leaseType ?? String(item.leaseTypeID),
          }));

          this.sections = this.buildSections(aiOutput, leaseTypeItems);
          this.sectionsExpanded = this.sections.map(() => true);
          this.form = this.buildFormGroup(this.sections);

          if (aiOutput.basics?.tenant?.value) {
            this.pageTitle = `AI Lease Abstraction — ${aiOutput.basics.tenant.value}`;
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
    this.aiSidebarService.toggle(this.leaseId);
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

  private buildSections(data: IAIOutput, leaseTypeItems: AiDropdownItem[]): AiFormSection[] {
    return [
      this.buildBasicsSection(data, leaseTypeItems),
      this.buildDatesSection(data),
      this.buildRentSection(data),
      this.buildExpensesSection(data),
    ];
  }

  private buildBasicsSection(data: IAIOutput, leaseTypeItems: AiDropdownItem[]): AiFormSection {
    const address = data.basics?.addresses?.value
      ?.map((a) => [a.StreetAddress, a.CityStateZip].filter(Boolean).join(', '))
      .join('; ') ?? null;

    const floors = Array.isArray(data.basics?.floors?.value)
      ? data.basics.floors.value.join(', ')
      : null;

    // Map the AI's string value for leaseType to the corresponding leaseTypeID
    const leaseTypeValue = data.basics?.leaseType?.value;
    const leaseTypeId = leaseTypeItems.find(
      (item) => item.name?.toLowerCase() === leaseTypeValue?.toLowerCase()
    )?.id ?? leaseTypeValue;

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
        {
          key: 'leaseType',
          label: 'Lease Type',
          type: 'dropdown',
          value: leaseTypeId,
          dropdownItems: leaseTypeItems,
        },
        {
          key: 'dealType',
          label: 'Deal Type',
          type: 'dropdown',
          value: data.basics?.dealType?.value,
          dropdownItems: DEAL_TYPE_OPTIONS,
        },
        {
          key: 'spaceUse',
          label: 'Space Use',
          type: 'dropdown',
          value: data.basics?.spaceUse?.value,
          dropdownItems: SPACE_USE_OPTIONS,
        },
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
    const schedule   = data.rent?.baseRentSchedule;
    const rentSchedule: AiRentScheduleSection | undefined =
      (schedule?.value?.length ?? 0) > 0
        ? {
            scheduleItems: schedule!.value!,
            abatementItems: data.rent?.rentAbatements?.value ?? [],
            startsFromRCD: schedule!.subfields?.startsFromRCD ?? false,
            startsFromCD:  schedule!.subfields?.startsFromCD  ?? false,
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
      {
        key: 'serviceType',
        label: 'Service Type',
        type: 'dropdown',
        value: data.expenses?.serviceTypeEstimate?.value,
        dropdownItems: SERVICE_TYPE_OPTIONS,
      },
      {
        key: 'operatingExpenses',
        label: 'Operating Expenses',
        type: 'dropdown',
        value: data.expenses?.operatingExpenses?.value,
        dropdownItems: PAYOR_OPTIONS,
        citation: data.expenses?.operatingExpenses?.citation,
      },
      {
        key: 'cam',
        label: 'CAM',
        type: 'dropdown',
        value: data.expenses?.cam?.value,
        dropdownItems: PAYOR_OPTIONS,
        citation: data.expenses?.cam?.citation,
      },
      {
        key: 'insurance',
        label: 'Insurance',
        type: 'dropdown',
        value: data.expenses?.insurance?.value,
        dropdownItems: PAYOR_OPTIONS,
      },
      {
        key: 'taxes',
        label: 'Taxes / Real Estate',
        type: 'dropdown',
        value: data.expenses?.taxes?.value,
        dropdownItems: PAYOR_OPTIONS,
      },
      {
        key: 'water',
        label: 'Water',
        type: 'dropdown',
        value: data.expenses?.water?.value,
        dropdownItems: PAYOR_OPTIONS,
      },
      {
        key: 'gas',
        label: 'Gas',
        type: 'dropdown',
        value: data.expenses?.gas?.value,
        dropdownItems: PAYOR_OPTIONS,
      },
      {
        key: 'electricity',
        label: 'Electricity',
        type: 'dropdown',
        value: data.expenses?.electricity?.value,
        dropdownItems: PAYOR_OPTIONS,
      },
      {
        key: 'hvac',
        label: 'HVAC',
        type: 'dropdown',
        value: data.expenses?.hvac?.value,
        dropdownItems: PAYOR_OPTIONS,
        citation: data.expenses?.hvac?.citation,
      },
      {
        key: 'cleaning',
        label: 'Cleaning',
        type: 'dropdown',
        value: data.expenses?.cleaning?.value,
        dropdownItems: PAYOR_OPTIONS,
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
        sectionControls[field.key] = new FormControl({ value: field.value ?? null, disabled: true });
      });

      root[section.key] = new FormGroup(sectionControls);
    });

    return new FormGroup(root);
  }
}
