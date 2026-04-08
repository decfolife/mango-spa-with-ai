# AI Lease Abstractions Feature

This document covers the AI Lease Abstractions feature added to the Mango SPA. The feature ports the AI lease summary concept from VL-MS-UI-App into Mango as a `forms-shared` library feature, exposing it in two ways: a standalone list/form experience and a slide-in sidebar on existing lease render-forms.

---

## How to Run

From the `Client/` directory:

```bash
# Install dependencies (first time or after pulling)
npm run prepare

# Start the dev server
npm start
# Equivalent: node --max_old_space_size=8192 ./node_modules/@angular/cli/bin/ng serve mango
```

The app will be available at `http://localhost:4200`.

---

## Navigating to the Feature

### 1. AI Lease Abstractions — List + Form

Navigate to:

```
http://localhost:4200/crem/portfolio/ai-abstractions
```

- The **list page** loads immediately with 5 mock AI-abstracted leases in a searchable, filterable DevExtreme grid.
- **Click any row** to navigate to the full-page **AI Lease Form** for that lease.
- The form renders 4 collapsible sections: **Overview**, **Key Dates**, **Rent**, and **Expenses**.
- The Rent section includes embedded **Base Rent Schedule** and **Rent Abatements** tables.
- Click **Edit** to enable inline editing of all fields. Click **Save** or **Cancel** to exit edit mode.
- Click **Back to List** to return to the list page.

### 2. AI Summary Sidebar — on Lease Render-Forms

Navigate to any existing lease render-form, e.g.:

```
http://localhost:4200/crem/forms/render-form?oid=<leaseId>&otid=4
```

- An **AI Summary** button appears in the page header actions (next to the Alerts button, lease-only).
- Clicking it slides open a **fixed right-hand panel** (420px wide) showing a condensed read-only summary of the AI abstraction for the current lease.
- The panel contains the same 4 sections as the full-page form, but read-only with collapsible headers.
- Rent schedule and abatement tables are embedded in the Rent section.
- Citations from the AI extraction appear as yellow callout blocks beneath relevant fields.
- Click **×** in the panel header to close it.

> **Note:** The sidebar reads the lease `oid` from the URL query params automatically — no extra configuration needed.

---

## Architecture

### Data Source (Mock)

The feature currently uses a **mock service** (`AiLeaseService`) with 5 hardcoded `IAIOutput` records simulating an 800ms network delay. When the real API endpoint is available, replace the mock methods in:

```
libs/forms-shared/src/lib/ai/services/ai-lease.service.ts
```

The two methods to replace:
- `getLeaseList()` → call the API that returns a list of abstracted leases
- `getLeaseById(id)` → call the API that returns `IAIOutput` for a given lease

### Data Model

The `IAIOutput` interface (ported from VL-MS-UI-App) lives at:

```
libs/forms-shared/src/lib/ai/models/ai-output.model.ts
```

It has four top-level sections:

```typescript
interface IAIOutput {
  basics?: Basics;    // tenant, landlord, address, sq ft, lease type, etc.
  dates?: Dates;      // sign date, commencement, RCD, end date, term
  rent?: Rent;        // effective rent, escalation, TI allowance, rent schedule, abatements
  expenses?: Expenses // service type, CAM, insurance, taxes, utilities, HVAC, cleaning
}
```

---

## File Map

### New files — `libs/forms-shared/src/lib/ai/`

```
ai/
├── models/
│   ├── ai-output.model.ts          IAIOutput interface and all nested types
│   └── ai-form.model.ts            AiFormSection, AiFormField, AiLeaseListItem
│
├── services/
│   └── ai-lease.service.ts         Mock service — replace with real API calls
│
├── ai-list-page/
│   ├── ai-list-page.component.ts   Loads lease list, navigates on row click
│   ├── ai-list-page.component.html DxDataGrid with search, filter, paging
│   ├── ai-list-page.component.scss
│   └── ai-list-page.module.ts
│
├── ai-lease-form/
│   ├── ai-form-section/
│   │   ├── ai-form-section.component.ts   Collapsible section, renders fields by type
│   │   ├── ai-form-section.component.html Fields + citation callouts + DxDataGrid tables
│   │   └── ai-form-section.component.scss
│   ├── ai-lease-form.component.ts  Builds 4 FormGroups from IAIOutput, edit mode
│   ├── ai-lease-form.component.html Page header + back button + Edit/Save + sections
│   ├── ai-lease-form.component.scss
│   └── ai-lease-form.module.ts
│
├── ai-sidebar/
│   ├── ai-sidebar.service.ts       providedIn root — toggle/open/close + isOpen$
│   ├── ai-sidebar.component.ts     Reacts to service + route oid, loads AI data
│   ├── ai-sidebar.component.html   Fixed right panel: header, skeleton, sections, tables
│   ├── ai-sidebar.component.scss   Fixed position, slides in from right (CSS transform)
│   └── ai-sidebar.module.ts
│
├── ai-routing.module.ts            '' → list page, ':id' → lease form
└── ai.module.ts                    Lazy-loadable entry point
```

### Modified files

| File | What changed |
|------|-------------|
| `libs/forms-shared/src/index.ts` | Exports `AiModule`, `AiSidebarModule`, models, and service |
| `apps/mango/src/app/app-routing.module.ts` | Added `crem/portfolio/ai-abstractions` route (lazy loads `AiModule`) |
| `apps/mango/src/app/components/crem-component/crem-component.html` | Added `<mango-ai-sidebar>` to the app shell |
| `apps/mango/src/app/components/crem-component/crem.module.ts` | Imported `AiSidebarModule` |
| `libs/forms-shared/src/lib/admin-render-forms/dynamic-form/dynamic-form.component.html` | Added **AI Summary** toggle button to lease form header actions |
| `libs/forms-shared/src/lib/admin-render-forms/dynamic-form/dynamic-form.component.ts` | Injected `AiSidebarService`, added `toggleAiSidebar()` |

---

## How the Sidebar Works

```
User opens a lease render-form
        ↓
"AI Summary" button appears in header (lease objectType only)
        ↓
Click → DynamicFormComponent.toggleAiSidebar()
        ↓
AiSidebarService.toggle() → isOpen$ emits true
        ↓
AiSidebarComponent (mounted in crem-component.html) reacts
        ↓
Reads oid from ActivatedRoute.queryParams
        ↓
AiLeaseService.getLeaseById(oid) → IAIOutput
        ↓
Renders condensed read-only summary in fixed right panel
        ↓
Click × → AiSidebarService.close() → panel slides out
```

---

## Switching from Mock to Real API

In `ai-lease.service.ts`, replace the two `of(...)` returns with `HttpClient` calls:

```typescript
// Before (mock)
getLeaseById(id: number): Observable<IAIOutput | null> {
  return of(MOCK_AI_OUTPUTS[id] ?? null).pipe(delay(800));
}

// After (real API)
getLeaseById(id: number): Observable<IAIOutput | null> {
  return this.http.get<IAIOutput>(`${this.apiBaseUrl}/ai-abstractions/${id}`);
}
```

Inject `HttpClient` in the constructor and set `apiBaseUrl` from your environment config. No other files need to change.

---

## Dependencies

All dependencies are already present in the workspace:

| Dependency | Used for |
|-----------|---------|
| `devextreme-angular` (`DxDataGridModule`) | List page grid + rent schedule tables in form/sidebar |
| `@angular/material` (Button, Icon, FormField, Input, Checkbox, Datepicker, Expansion) | Form controls and UI in the lease form |
| `@mango/ui-shared/lib-ui-elements` (`SkeletonModule`, `PageHeaderComponent`, `ButtonModule`) | Loading skeletons, page headers, action buttons |
| `RxJS` (`BehaviorSubject`, `combineLatest`, `switchMap`) | Reactive state in service and sidebar |
