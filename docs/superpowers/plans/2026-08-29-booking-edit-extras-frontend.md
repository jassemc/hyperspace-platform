# Booking Edit Extras (frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the Edit Booking dialog, show the booking's extras as toggleable tags (the same `ExtraTagPicker` the create form uses) and send the result to `PATCH /bookings/:id` as `extraIds`.

**Architecture:** `BookingCustomerFields` already owns the resource list and derives the resource's offered extras; in edit mode it currently hides everything below the room select. The extras block moves outside that gate and is seeded from the booking's stored snapshot. `updateBookingAction` forwards `extraIds` only when the form rendered the picker (a hidden `extrasEdited` marker), so an older client never wipes extras by accident. The read-only pills added to the dialog on 2026-08-29 are removed. Opportunities already round-trip extras on edit; that gets a verification task, not new code.

**Tech Stack:** Next.js (App Router, server actions), React 19, Tailwind, generated `HsService` client.

**Spec:** Design agreed in chat 2026-08-29. Depends on the backend plan `hscowork-backend-platform/docs/superpowers/plans/2026-08-29-booking-edit-extras-backend.md` being deployed (Tasks 1-4 there, including the client regeneration that adds `UpdateBookingDto.extraIds`).

## Global Constraints

- Branch: `feat/free-bookings-partnerships` (current branch, per user). Commit on it.
- No test runner exists in this repo; verification is `npx tsc --noEmit -p .`, `npx next lint --dir app --dir components`, and a manual run against the local API (`npm run dev`).
- `extraIds` omitted ⇒ backend leaves extras alone. Only send it when the picker was rendered.
- Retained extras keep their booked price; the UI copy must say that newly added ones are priced at today's rate.
- Commit message trailer: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 0: Prerequisite check

- [ ] **Step 1: Confirm the regenerated client is present**

Run: `grep -n "export interface UpdateBookingDto" -A20 lib/service/HsService.ts | grep extraIds`
Expected: `extraIds?: string[];`. If missing, stop: backend plan Task 4 has not been run.

---

### Task 1: Commit the tag picker work already in the tree

The working tree already holds the uncommitted `ExtraTagPicker` and its use in both create forms plus the read-only extras block in the edit dialog. Land that first so Task 2's diff is only the edit-mode change.

**Files:**
- Already modified: `components/extra-tag-picker.tsx` (new), `app/booking/bookings/booking-customer-fields.tsx`, `app/booking/bookings/booking-form-dialog.tsx`, `app/community/opportunities/add-opportunity-form.tsx`

- [ ] **Step 1: Verify**

Run: `npx tsc --noEmit -p . && npx next lint --dir app --dir components`
Expected: tsc silent; lint reports only the pre-existing `components/team-switcher.tsx:81:31` unused-`index` warning.

- [ ] **Step 2: Commit**

```bash
git add components/extra-tag-picker.tsx app/booking/bookings/booking-customer-fields.tsx app/booking/bookings/booking-form-dialog.tsx app/community/opportunities/add-opportunity-form.tsx
git commit -m "feat(forms): pick booking and opportunity add-ons as toggle tags

Replaces the checkbox lists with one ExtraTagPicker (role=checkbox pills,
hidden inputs for form posts). The edit-booking dialog shows its extras
read-only for now.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Editable extras in `BookingCustomerFields` (edit mode)

**Files:**
- Modify: `app/booking/bookings/booking-customer-fields.tsx`
- Modify: `app/booking/bookings/booking-form-dialog.tsx` (the `<BookingCustomerFields ... />` call ~line 357 and the read-only extras block right after it)

**Interfaces:**
- Consumes: `ExtraTagPicker` from `components/extra-tag-picker.tsx` — props `{ extras: {id,name,priceHt}[]; value: string[]; onChange(next: string[]); name?: string; disabled?: boolean }`.
- Produces: new prop `initialExtraIds?: string[]` on `BookingCustomerFields`. When the picker renders, the form posts `extraIds` (0..n hidden inputs) **and** one hidden `extrasEdited=1`.

- [ ] **Step 1: Add the prop and seed the state**

In `booking-customer-fields.tsx`, extend the props interface:

```ts
  /** A quote describes one exact set of extras, so the dialog clears it. */
  onExtrasChange?: () => void
  /** Edit mode: the ids already on the booking, so the tags start selected. */
  initialExtraIds?: string[]
```

Destructure it in the component signature (`initialExtraIds = []`) and change the state line to:

```ts
  // Controlled so the tags know their own state; the picker posts the
  // selection as hidden `extraIds` inputs, which is what the action reads.
  const [extraIds, setExtraIds] = useState<string[]>(initialExtraIds)
```

- [ ] **Step 2: Move the extras block outside the `!disabled` gate**

Cut the whole `{availableExtras.length > 0 && ( ... )}` block out of the `{!disabled && (<> ... </>)}` fragment and paste it immediately after that fragment's closing `)}` (still inside the component's outer fragment). Then replace it with this version, which adds the marker input and the edit-mode copy:

```tsx
      {availableExtras.length > 0 && (
        <div className="grid gap-2">
          <Label>Extras</Label>
          {/* Tells updateBookingAction the picker was on screen, so an
              empty selection means "remove all" and not "field absent". */}
          <input type="hidden" name="extrasEdited" value="1" />
          <ExtraTagPicker
            extras={availableExtras}
            value={extraIds}
            name="extraIds"
            onChange={(next) => {
              setExtraIds(next)
              onExtrasChange?.()
            }}
          />
          <p className="text-xs text-muted-foreground">
            {disabled
              ? "Extras you keep stay at the price they were booked at; ones you add are priced at today's rate."
              : "Offered by the rates attached to this resource."}
          </p>
        </div>
      )}
```

- [ ] **Step 3: Handle a booked extra the room no longer offers**

Right after `const availableExtras = [...]` add:

```ts
  // An extra that was booked but has since been detached from the room's
  // rates still needs a tag, or the user could never remove it — and the
  // API refuses the patch (`extra_not_offered`) while it is selected.
  const bookedButGone = initialExtraIds
    .filter((id) => !availableExtras.some((extra) => extra.id === id))
    .map((id) => ({ id, name: "No longer offered", priceHt: 0 }))
  const pickerExtras = [...availableExtras, ...bookedButGone]
```

and pass `extras={pickerExtras}` to the picker; change the block's guard to `{pickerExtras.length > 0 && (`.

- [ ] **Step 4: Update the dialog**

In `booking-form-dialog.tsx`, add the prop to the call:

```tsx
            disabled={Boolean(editingBooking)}
            onExtrasChange={invalidateQuote}
            initialExtraIds={(editingBooking?.extras ?? []).map((extra) => extra.extraId)}
          />
```

Delete the entire `{editingBooking && ( <div className="grid gap-2"> <Label>Extras</Label> ... </div> )}` read-only block (with its comment) that follows the call.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit -p . && npx next lint --dir app/booking`
Expected: clean. If `formatPriceHt` is now unused in the dialog, remove its import.

- [ ] **Step 6: Commit**

```bash
git add app/booking/bookings/booking-customer-fields.tsx app/booking/bookings/booking-form-dialog.tsx
git commit -m "feat(bookings): pick extras as tags when editing a booking

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Send `extraIds` from `updateBookingAction`

**Files:**
- Modify: `app/booking/bookings/actions.ts` (`updateBookingAction`, the `const data: UpdateBookingDto = {...}` block ~line 197)

**Interfaces:**
- Consumes: hidden inputs `extrasEdited` and `extraIds` from Task 2; `UpdateBookingDto.extraIds` from the regenerated client.

- [ ] **Step 1: Forward the field**

Change the `data` literal to:

```ts
    const data: UpdateBookingDto = {
      // `clearableText`, not `text`: an emptied note must reach the API
      // as "" so it actually clears — see the helper above.
      title: clearableText(formData, "title"),
      notes: clearableText(formData, "notes"),
      status: formData.get("markNoShow") === "on" ? "no_show" : undefined,
      startsAt: startsAt ? toUtcIso(startsAt, timeZone) : undefined,
      endsAt: endsAt ? toUtcIso(endsAt, timeZone) : undefined,
      // Only when the picker was rendered: `[]` then means "remove all",
      // whereas a form without it must leave the extras alone.
      extraIds:
        formData.get("extrasEdited") === "1"
          ? formData.getAll("extraIds").map(String).filter(Boolean)
          : undefined,
    }
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit -p . && npx next lint --dir app/booking`
Expected: clean.

- [ ] **Step 3: Manual run against the local API**

With the backend running (`npm run start:dev` in `hscowork-backend-platform`) and `npm run dev` here:
1. Open Bookings → `⋯` → Edit on a confirmed booking that has one extra. The extra's tag is selected; the hint reads "Extras you keep stay at the price…".
2. Add a second extra, save. Reopen Details: two extras; the first keeps its original price line.
3. Edit again, deselect both, save. Details shows "No extras."
4. Edit a cancelled booking (only title/notes visible or, if extras render, saving with a change shows the `booking_not_reschedulable` toast).

- [ ] **Step 4: Commit**

```bash
git add app/booking/bookings/actions.ts
git commit -m "feat(bookings): post edited extras to PATCH /bookings/:id

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Verify opportunities (no code expected)

Opportunity edit already round-trips extras: `add-opportunity-form.tsx` seeds `extraIds` from `editingOpportunity.requestedExtras` and posts `requestedExtras` (hidden JSON input, ~line 180); `updateOpportunityAction` forwards it; the backend `OpportunityService.update()` merges it. The tag picker from Task 1 applies to it.

- [ ] **Step 1: Manual check**

Open Community → Opportunities → `⋯` → Edit on a lead with a requested plan and one add-on. The add-on tag is selected. Toggle another on, save, reopen Details: both add-ons listed and the expected value includes both.

- [ ] **Step 2: If anything fails, stop and report**

Do not patch around it here — the fix belongs to whichever layer misbehaves, and it would be a new task on this plan.

---

### Task 5: Push

- [ ] **Step 1: Push the branch**

```bash
git push origin feat/free-bookings-partnerships
```
