# Frontend UI Components

This document catalog defines the reusable frontend user interface (UI) components, layout rules, forms styling guidelines, and buttons classes designed for FMDDS, based on Section 3.1 of the SRS.

---

## 1. Design Language & CSS Variables

To achieve consistent premium styling and support accessibility (`UI-002`, `UI-004`, `UI-021`), the UI client uses a dark-mode-ready theme, styled via standard CSS custom properties:

```css
:root {
  /* Color Palette - HSL Harmonies */
  --primary-color: hsl(210, 80%, 45%);       /* Slate Blue */
  --primary-hover: #1b5394;
  --secondary-color: #5b626b;                 /* Cool Gray */
  --success-color: #2b7d4d;                   /* Forest Green */
  --danger-color: #a82020;                    /* Legal Crimson */
  --warning-color: #c98a14;                   /* Amber Amber */
  --bg-color: #0f172a;                        /* Dark Slate Background */
  --surface-color: #1e293b;                   /* Card Surface */
  --border-color: #334155;                    /* Gray Slate Border */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  
  /* Layout Dimensions */
  --sidebar-width: 250px;
  --header-height: 60px;
}
```

---

## 2. Reusable UI Components Directory

### 2.1 Standard Buttons
Buttons use subtle hover micro-animations and consistent color indicators:

* **Primary Action** (Submit Forms / Create Cases):
  * **Class**: `.btn-primary`
  * **Style**: HSL Slate Blue background, rounded borders, white text. Hover scales button slightly (1.02x transform).
* **Secondary Action** (Cancel Forms / Navigate Back):
  * **Class**: `.btn-secondary`
  * **Style**: Bordered, transparent background, gray border, white text.
* **Confirm / Approve** (Lock Medico-Legal Reports):
  * **Class**: `.btn-success`
  * **Style**: Forest green background. Used solely for finalized actions (`BRL-016`).
* **Danger Action** (Deactivate user accounts):
  * **Class**: `.btn-danger`
  * **Style**: Crimson background. Prompts confirmation modal before executing.

### 2.2 Data Forms & Inputs
Forms are organized in multi-section structures with clear mandatory markings (`UI-012`).

* **Text / Date Input Fields**:
  * **Class**: `.form-input`
  * **Style**: Dark slate surface background (`--bg-color`), thin border (`--border-color`), white text. Focus state changes border color to HSL Slate Blue with a subtle outline glow.
* **Selection Dropdowns**:
  * **Class**: `.form-select`
  * **Style**: Predefined option wrappers matching form input styling.
* **Validated NIC Field**:
  * **Class**: `.form-input-nic`
  * **Behavior**: Displays a green validation checkmark icon if NIC format passes regex check; otherwise displays a red indicator with help tooltips explaining old/new Sri Lankan ID rules.
* **Clinical Observation Textareas**:
  * **Class**: `.form-textarea-clinical`
  * **Behavior**: Large input rows (min-height 150px) supporting standard browser scroll bars. Passes values to the sanitizer middleware before submitting.

### 2.3 Interactive Data Tables
Used in Case List, Evidence Log, and Audit Logs screens (`UI-016`).

* **Table Class**: `.data-table`
* **Features**:
  * **Header Sort Buttons**: Clickable columns showing small arrow markers (▲/▼) to indicate sorting.
  * **Status Badges**: Small colored pills indicating workflow progress:
    * `.badge-registered`: Gray pill.
    * `.badge-inprogress`: Blue pill.
    * `.badge-lab-pending`: Amber pill.
    * `.badge-approved`: Green pill.
    * `.badge-closed`: Slate pill.
  * **Pagination Rows**: Rendered at table footers, offering page count inputs, "Next", and "Prev" navigation keys.

### 2.4 Alert Banners & Modal Dialogs (`UI-019`, `UI-020`)
* **Success Banner**: `.alert-success` - Sliding top banner confirming successful data persistence ("Record saved successfully"). Autohides after 4 seconds.
* **Error Summary Box**: `.alert-error-box` - Placed at form headers when API validation returns error arrays. Highlights fields in red and lists specific correction directions.
* **Verification Modals**: Generic modal block overlaying screen, used to confirm critical tasks (e.g. "Are you sure you want to approve this report? Once approved, it cannot be modified").
