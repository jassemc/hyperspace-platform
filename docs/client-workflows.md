# Client workflows — from first contact to closing the account

How a client moves through Hyperspace for each offer we sell: who creates what,
which screen does it, what the system generates on its own, and how the
relationship ends.

Every step below is backed by an endpoint in `swagger.json`. Where the system
does something automatically it is called out — those are the steps people most
often try to do by hand and cannot.

---

## The cast

| Thing | What it is |
|---|---|
| **Member** | A person. Every client starts as one, even a lead. `kindHint` defaults to `lead`. |
| **Company** | An employer. Members attach to it; it can hold memberships and invoices itself. |
| **Opportunity** | A line in the sales pipeline, always attached to a member. |
| **Plan** | A catalog offer: price, cycle, benefits, extras. |
| **Membership** | A signed contract. Freezes a *snapshot* of the plan at signature. |
| **Assignment** | A resource reserved for a membership over a date range (desk, office). |
| **Booking** | A resource reserved for a slot of time (meeting room). |
| **Check-in** | A presence interval at a location. |
| **Credit** | Spendable allowance (meeting-room hours, half-days) tied to a membership. |
| **Charge** | One billable line, not yet on an invoice. |
| **Invoice** | A frozen group of charges with a sequential number. |

### Member status is derived, never typed in

`MemberStatus` (`lead`, `drop-in`, `pending`, `active`, `former`, `contact`) is
computed on every read, in this order:

1. A manual pin, if one was set via the **Status** action on the members table
2. Otherwise from their memberships
3. Otherwise from one-off charges
4. Otherwise from open opportunities

So a lead becomes `active` on its own the moment a membership starts. You only
pin a status to say something the data cannot: *this person is a contact, not a
client* (`contact`), or *they are gone* (`former`). Pinning freezes it until you
send `auto` again.

---

## Three doors in

### Door 1 — the website (self-service)

Three public endpoints create everything in a single transaction, with no user
account involved. Identity comes from the form body alone.

| Endpoint | Creates |
|---|---|
| `POST /public/plan-requests` | member (`visitor`) **+** opportunity carrying the requested plan, its extras and the quoted price |
| `POST /public/booking-requests` | member (`visitor`) **+** a **pending** booking **+** opportunity |
| `POST /public/contact-requests` | member (`visitor`) **+** opportunity for a lighter lead — someone asking about a service category, or wanting a free day |

All three land in staff screens: the opportunity in **Community →
Opportunities**, the pending booking in **Booking → Bookings** awaiting
confirmation. The quoted price is carried on the opportunity so staff can
honour what the visitor saw.

Contact requests are the lightest door: the visitor names a **plan category**
(the sections in Settings → Plan Categories) rather than a specific plan, and
may ask for a free day or a preferred date. They arrive as an opportunity with
no plan attached, for staff to qualify.

### Door 2 — staff (walk-in, phone, referral)

Staff create the member directly in **Community → Members**, then usually an
opportunity in **Community → Opportunities** to track the conversation.

---

## The common spine

Every offer runs through the same five stages. What differs is stages 3 and 5.

```
1. Member exists            Community → Members
2. Opportunity tracks it    Community → Opportunities   new → contacted → tour → quote → won/lost
3. The offer is delivered   ← differs per scenario
4. Money is collected       Billing → Charges → Invoices
5. The relationship closes  ← differs per scenario
```

---

# Scenario A — Coworking (hot desk)

The plain membership: access to the space, no reserved desk.

### 1. Qualify
**Community → Opportunities** → interest `coworking`. Move through the stages as
you talk. Mark **won** when they sign.

### 2. Sign them up
**Community → Memberships → Add Membership**

- Customer: **Member** (or **Company** — see Scenario G)
- Plan: the coworking plan
- Extras: whichever the plan offers
- Starts at: first active day. **Ends at**: leave blank for open-ended, or set the
  last active day for a fixed term
- Price / deposit override: only when you agreed something off-catalog

**What the system does in that one transaction** — do not try to do these by hand:

- Snapshots the plan and its benefits onto the membership
- Grants the initial credits, with their expiry
- Writes the `plan_fee` charge — **and** the `deposit` charge if the plan has one

### 3. They come in
**Booking → Check-ins**, or the member scans the door QR themselves.

Authorization is attempted in order: 24/7 entitlement → business-hours
entitlement → half-day credit (consumed oldest-first). Staff can override with
**Visitor** or **Trial** when someone has no entitlement.

### 4. Bill them
The `plan_fee` charge is already waiting in **Billing → Charges** (filter
*Uninvoiced*). See [Money](#money-how-charges-become-invoices).

### 5. Each cycle
**Renew** on the membership row. This grants the next cycle's credits (expiring
at the cycle's end) and writes the next `plan_fee` charge. Cycles are anchored to
`startsAt`. Recurring plans only.

### 6. Close it
**Cancel** on the membership row. This sets `cancelledAt = today` and computes
`endsAt` from the **snapshot's** notice period — not from today's catalog, and
never later than an agreed fixed-term end.

The membership **stays active until `endsAt` passes**. It is a notice, not a
switch-off. Status becomes `ended` on its own; the member's status follows to
`former` without you pinning anything.

**No notice needed?** (a mutual termination, a mistyped fixed term) **Edit**
the membership and set **Ends at** directly — today ends it tonight, a past
date ends it at once, and a blank field reopens it. No notice period applies.
Open assignments are capped the day after, exactly as Cancel does. A cancelled
membership can have its end moved but not cleared.

---

# Scenario B — Private office or dedicated desk

Coworking plus a specific resource held for them.

Everything in Scenario A, with one addition after the membership exists:

### Reserve the resource
**Booking → Assignments → Add Assignment**

- Resource, membership, start date, optional planned end

Constraints worth knowing before you hit save:

- The resource **type** must be marked `canAssign`
- The membership must not be ended
- Two assignments cannot overlap on the same resource — the database rejects it
  outright (409), so you cannot double-allocate an office
- On a fixed-term membership, an end date later than the membership is **silently
  capped** to the day after it ends. It is not rejected; it is quietly shortened

### Moving them
**Relocate** on the assignment row: ends the current assignment on the effective
date and opens one on the destination resource, in a single transaction.

### Closing
**End** on the assignment row. The date is **exclusive** — `endsAt` is the first
*free* day, not the last occupied one. Then cancel the membership as in A.

---

# Scenario C — Meeting room, visitor (one-off)

Someone with no membership wants a room. Usually arrives through the website.

### 1. The request
`POST /public/booking-requests` creates the visitor member, a **pending**
booking, and an opportunity — all at once. Nothing is priced or reserved yet.

A pending booking **does not block the slot**.

### 2. Confirm it
**Booking → Bookings** → the **✓** action on the row.

Confirming re-checks availability, prices it (typically at the visitor rate),
writes a `booking` charge, and flips it to confirmed. **From that moment it
blocks the slot.**

### 3. Bill and close
Invoice the `booking` charge. There is no membership to cancel — the
relationship simply ends. The member stays on record as a `drop-in`, which is
useful: they are a warm lead.

---

# Scenario D — Meeting room, existing member

### Before booking
Use **Check availability & price** in the booking drawer. It runs the exact
create pipeline and returns the quote — units, credits covered, remaining price,
TTC — **without booking anything**.

### Pricing, in order
1. `room_hour` credits are drained first, **soonest-expiring first**, scoped by
   the membership snapshot
2. Whatever remains is priced at the member rate

If credits cover the whole booking, `priceHt` is **NULL** and no charge is
raised. The table shows this as a **Credit covered** badge rather than a zero.

### Cancelling
**Cancel** on the row. Staff can cancel anytime; members only while
`now < startsAt − the resource's cancellationHours`.

Cancelling **restores the consumed credits** and **deletes the charge** if it has
not been invoiced yet. Once invoiced, the charge stands — void the invoice first
if you need to unwind it.

---

# Scenario E — Domiciliation (business address)

A plan with no space attached.

Identical to Scenario A, minus check-ins and assignments: opportunity with
interest `domiciliation` → membership on the domiciliation plan → recurring
`plan_fee` charges → invoice → cancel at the end.

There is nothing to assign and nobody to check in. The value is entirely the
contract, so the membership *is* the deliverable.

---

# Scenario F — Drop-in / day pass

Someone walks in for a day. No plan, no contract.

1. Create the member in **Community → Members** (`kindHint` = `visitor`)
2. Check them in with **force = Visitor**
3. Raise a **one-off** charge in **Billing → Charges → Add Charge**

Two things to know about that charge:

- Only `one_off` and `store` can be created by hand. `plan_fee`, `booking` and
  `deposit` are flow-generated and the form does not offer them
- Setting **planId** derives the amount, description, VAT and accounting code
  from a one-off catalog plan — the "add a fee from a plan" shortcut. Any of it
  can still be overridden

Their status derives to `drop-in` on its own.

---

# Scenario G — Company account (several employees)

When the company signs and pays, not the individual.

### 1. Create the company
**Community → Companies**

### 2. Attach the people
On the member's drawer, set **Employer**. This is the *only* way to move a
member between companies — `PATCH /members/:id` rejects `companyId` with a 422.

Mark one employee **Receives the company's invoices** and one **Is the company's
contact person**. Both roles are company-scoped: moving someone to a different
company **clears both roles**, deliberately, because the roles belong to the
company and are never carried across.

### 3. The membership goes on the company
**Community → Memberships → Add Membership** → Customer type **Company**.

A membership belongs to a member **or** a company, never both.

### 4. Billing is pooled
Bookings by employees draw on the company's credit pool. When invoicing, filter
charges by the **company**.

> One sharp edge: the memberships list filters by the **direct holder** only.
> Filtering by `memberId` does *not* pick up their employer company's
> memberships. For the pooled view you have to query both.

### 5. Closing
Cancel the company's membership, then detach employees (set Employer to **Solo**)
or pin them `former` individually.

---

# Scenario H — Trial

1. Member exists (usually a lead from an opportunity)
2. Check them in with **force = Trial**
3. If they convert → Scenario A. If not → pin them `contact`, or leave them as a
   lead for follow-up

No charge, no membership. The check-in records the visit with no entitlement or
credit behind it.

---

# Money: how charges become invoices

### Charges appear on their own

| Charge kind | Raised by |
|---|---|
| `plan_fee` | membership create, and every renew |
| `deposit` | membership create, when the plan has one |
| `booking` | booking confirm |
| `one_off`, `store` | staff, by hand |

### Invoicing
**Billing → Invoices → Add Invoice** — pick the customer, tick their uninvoiced
charges, set a due date.

On save the system claims those charges race-safely, freezes HT/VAT/TTC (VAT
rounded per line) and draws the next sequential number `HS-YYYY-NNNN`.

**Invoices are born issued** — status `sent`, not draft. There is no draft stage
to review in.

### Sending it to the client

Open the invoice — click its **number** in the table, or the document icon on the
row. That opens the printable invoice at `/billing/invoices/{id}`: issuer block,
billed-to block, line items with code / HT / VAT / total, then subtotal → VAT →
TTC → paid → outstanding.

**Download PDF** — on the detail page, or the download icon straight from the
table row — fetches the document from the API. It is a French VAT facture named
after the invoice number (`HS-2026-0042.pdf`), with totals printed from the
frozen invoice columns and void invoices marked **ANNULÉE**.

The document is rendered entirely by the API. Nothing about it is built in the
app, so what a client receives does not depend on whose browser produced it.

The screen view alongside it is for reading and reconciling — line items,
totals and payment progress — not for printing.

### Payments
**Record payment** on the row. Payments accumulate; when the total reaches TTC
the invoice flips to `paid` by itself. Partial payments are fine.

> The printed invoice shows the **paid total only**, never a payment history.
> Payments can be recorded but not read back — the API has a `POST` for them and
> no `GET`. Method, date and reference are captured and then invisible, so a
> client querying what they paid cannot be answered from the app.

### Credit notes
A charge with a **negative** amount is a credit-note line. An invoice built from
a negative selection *is* a credit note. There is no separate screen.

### Voiding
**Void** requires **zero recorded payments**. It releases the charges back to
uninvoiced so they can be re-invoiced. If money has been taken, issue a credit
note instead.

---

# Closing a clientship — the full checklist

In order, because each step depends on the one before:

1. **End assignments** — *Booking → Assignments → End*. Remember `endsAt` is the
   first free day
2. **Cancel future bookings** — restores credits and deletes uninvoiced charges
3. **Cancel the membership** — sets `endsAt` from the snapshot's notice period.
   It stays active until then
4. **Invoice what is left** — filter *Uninvoiced* in Billing → Charges. Do this
   *after* cancelling so the final `plan_fee` is included
5. **Send the final invoice** — download the PDF and email it. Nothing is sent
   automatically
6. **Collect** — record the final payment
7. **Settle the deposit** — refund with a negative `one_off` charge, or keep it.
   A negative invoice prints as a credit note
8. **Let the status settle** — it derives to `former` once the membership ends.
   Pin `former` only to close them out early

Nothing is deleted. Members, memberships and invoices are permanent records —
the API has no DELETE for them by design. A closed client stays queryable, which
is what you want for accounting and for winning them back.

---

# Quick reference

| I want to… | Screen | What happens underneath |
|---|---|---|
| Log a new lead | Community → Members | `kindHint = lead` |
| Track a sales conversation | Community → Opportunities | stage `new → … → won/lost` |
| Sign someone up | Community → Memberships | snapshot + credits + `plan_fee` + `deposit` |
| Reserve a desk or office | Booking → Assignments | overlap rejected by the database |
| Book a meeting room | Booking → Bookings | credits first, then rate |
| Price it before committing | *Check availability & price* | `POST /bookings/validate`, writes nothing |
| Record a visit | Booking → Check-ins | entitlement → entitlement → credit |
| Comp someone | Billing → Credits → Grant | the only manual credit entry |
| Charge an extra | Billing → Charges | `one_off` / `store` only |
| Send a bill | Billing → Invoices | freezes totals, numbers it, status `sent` |
| Get the PDF | Invoice row → Download | `GET /invoices/{id}/download`, a French VAT facture |
| Group plans for the website | Settings → Plan Categories | sales sections the public catalog filters by |
| Put a photo on a resource | Space → Resources → edit | `PUT /resources/{id}/image`, uploads immediately |
| Take payment | Invoice row → Record payment | auto-flips to `paid` at full TTC |
| Undo a bill | Invoice row → Void | needs zero payments |
| Retire a resource | Space → Resources → Archive | `active: false` — reversible, no hard delete |
| End the relationship | Membership row → Cancel | notice period from the snapshot |

---

## Things that surprise people

- **Cancel does not stop it today.** It schedules the end using the snapshot's
  notice period. To end it today, edit **Ends at** instead.
- **The snapshot wins over the catalog.** Changing a plan's price or notice
  period never affects memberships already signed on it.
- **A pending booking holds nothing.** Only confirmation blocks the slot.
- **Credits expire.** Per-cycle grants expire at the end of their cycle, and
  bookings drain the soonest-expiring first.
- **A NULL booking price is not free.** It means credits covered it entirely.
- **Moving a member between companies clears their billing and contact roles.**
- **You cannot hand-write a `plan_fee`.** If one is missing, the membership was
  not created or renewed through the proper flow.
- **Nothing is emailed automatically.** Downloading the PDF and sending it is a
  manual step.
- **Payment history is not readable.** Only the paid total comes back, so keep
  your own record of method and reference if you need to reconcile.
- **A resource photo saves immediately**, not when you submit the drawer — and
  only on a resource that already exists.
