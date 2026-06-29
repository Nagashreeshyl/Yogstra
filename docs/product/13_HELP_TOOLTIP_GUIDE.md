# HelpTooltip Guidelines — Yogstra V2

**Sprint 12 · Contextual Guidance System**  
**Date:** June 30, 2026

---

## Component

`src/components/ui/HelpTooltip.tsx`

Also exports `LabelWithHelp` for form field labels.

---

## When to Use

Add contextual help to:

- Important form fields (names, dates, fees, limits)
- Wizard steps and dashboard actions
- Settings that affect public visibility or payments
- Competition, academy, and enrollment flows

---

## Content Structure

Each tooltip should include:

| Field | Required | Max length |
|-------|----------|------------|
| `label` | Yes | Short field name |
| `description` | Yes | 1–2 sentences |
| `example` | Recommended | Concrete sample value |
| `bestPractice` | Optional | Actionable tip |
| `validationHint` | Optional | Format or requirement note |

**Total content must not exceed 120 words.** Dev builds log a console warning if exceeded.

---

## Example

```tsx
<LabelWithHelp
  htmlFor="competition-name"
  help={{
    label: 'Competition name',
    description: 'Public name shown to participants on listings and certificates.',
    example: 'National Yoga Championship 2026',
    bestPractice: 'Use a clear, memorable name with the year or season.',
    validationHint: 'Required before publishing.',
  }}
>
  Competition name
</LabelWithHelp>
```

---

## Accessibility

- Trigger is a `<button>` with `aria-label="Help: {label}"`
- Panel uses `role="tooltip"` and `aria-expanded`
- Opens on hover, focus, and tap (toggle)
- Keyboard: focus trigger to open; blur or click outside to close
- Info icon from Lucide — consistent across the app

---

## Styling

- 288px (`w-72`) panel width
- Rounded `[14px]`, border, elevated background
- Muted body text; bold section prefixes (Example, Tip, Note)
- Positioned above trigger, centered

---

## Coverage (Sprint 12)

| Area | Status |
|------|--------|
| Teacher registration (bio) | Done |
| Competition creation wizard (name) | Done |
| Academy creation | Extend in follow-up |
| Programs & pricing | Extend in follow-up |
| Judge scoring | Extend in follow-up |

---

## Do Not

- Expose technical implementation (APIs, databases, vendors)
- Exceed 120 words
- Replace full help articles — tooltips supplement, not replace, Help Center content
- Use tooltips on every label — reserve for non-obvious or high-impact fields

---

*Paired with `InstructionPanel` for multi-step page overviews.*
