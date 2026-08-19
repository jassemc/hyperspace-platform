# Backend API — outstanding issues

Findings from auditing `swagger.json` and the generated client in `lib/service/`
against what the frontend actually needs.

Audited: 2026-08-18, after the `rateIds`/`amenityIds` regeneration.

**Already fixed — no action needed.** The previous round reported that every
`*Ids` property was declared as an array *of arrays* of uuid, and that
property-level metadata (`description`, `required: false`) was leaking into the
`items` schema. Both are gone: all 13 id-list properties are now flat
`array<string>`, and there are zero boolean `required` keys left inside schema
objects. Verified across the whole spec.

What follows is what is still open.

---

## 1. `PageDto.results` is typed as an array of strings — HIGH

**Where:** `components.schemas.PageDto.properties.results`

```json
"results": {
  "description": "An array of results for the current page.",
  "type": "array",
  "items": { "type": "string" }
}
```

`results` carries the page's entities — objects, never strings.

### Why it matters more than it looks

Every paginated endpoint declares its 200 response as an `allOf` of `PageDto`
plus an inline override of `results`:

```json
"200": {
  "allOf": [
    { "$ref": "#/components/schemas/PageDto" },
    { "properties": { "results": { "type": "array", "items": { "$ref": "#/components/schemas/ResourceDto" } } } }
  ]
}
```

`allOf` generates as a TypeScript **intersection**, so `results` resolves to:

```ts
Array<string> & Array<ResourceDto>   // element type: string & ResourceDto
```

That type is incoherent but not an error, so the compiler accepts nonsense
silently instead of rejecting it. Every call site in the frontend needs a cast
to get a usable type — for example in `app/space/resources/table-section.tsx`:

```ts
const response = await getListResources(query) as unknown as PageDto & { results?: ResourceDto[] }
```

This repeats at every list endpoint we consume. It also hides genuine mistakes:
because the intersection carries *both* `string` methods and the DTO's members,
a typo like `results[0].lenght` or a misused `.trim()` type-checks.

### Fix — preferred

Drop `results` from `PageDto` entirely and let each endpoint declare it. The
base then carries only pagination metadata:

```json
"PageDto": {
  "type": "object",
  "properties": {
    "meta": { "$ref": "#/components/schemas/PageMetaDto" }
  },
  "required": ["meta"]
}
```

The intersection becomes `{ meta } & { results: ResourceDto[] }` — clean, no
cast needed anywhere.

In NestJS this usually means the shared paginated-response class should not
declare `results` at all; the per-endpoint `@ApiOkResponse({ schema: { allOf: [...] } })`
already supplies it.

### Fix — alternative

If `results` must stay on the base for documentation reasons, type it as an
untyped array so the intersection collapses to the concrete type:

```json
"results": { "type": "array", "items": {} }
```

This is strictly worse than removing it (it generates `any[]`, so nothing is
checked until the per-endpoint override applies) but it does eliminate the
`string &` contamination.

### Related — `results` generates as optional

The inline override in each endpoint has no `required` array, so the generated
type is `results?: Array<ResourceDto>` and every consumer writes
`response.results ?? []` for a field the API always returns. Adding
`"required": ["results"]` to the inline schema removes that.

---

## 2. 38 nullable fields are typed as a bare `object` — HIGH

**Where:** across the spec. Full list reproducible with a scan for properties
whose schema is `{"type": "object"}` with no `properties`, `additionalProperties`
or `$ref`.

The worst-affected DTOs:

| DTO | Properties |
|---|---|
| `ChargeDto` | `memberId`, `companyId`, `membershipId`, `bookingId`, `planId`, `accountingCode`, `invoiceId` |
| `OpportunityDto` | `expectedValue`, `source`, `notes`, `requestedPlanId`, `requestedPlanPriceHt` |
| `CreditTransactionDto` | `bookingId`, `checkinId`, `resourceTypeId`, `reason` |
| `InvoiceDto` | `memberId`, `companyId` |
| `PaymentDto` | `reference`, `recordedBy` |
| `PublicPlanDto`, `PublicResourceDto`, `PublicPlanBenefitDto`, … | most optional fields |

Every one of them is a **nullable** field carrying a uuid, string or number at
runtime. The type says only `object`, so the client cannot read them without a
cast:

```ts
// InvoiceDto.memberId is `object | undefined`, but holds a uuid.
const name = companyNames[invoice.memberId]   // does not compile
```

Contrast `ResourceDto.description`, which is declared nullable correctly and
generates as `string | null`. So the pattern is specific to how these particular
fields declare nullability — likely `@ApiProperty({ type: Object })` or a
nullable wrapper that drops the underlying type, rather than
`@ApiPropertyOptional({ type: String, nullable: true })`.

**Impact:** the frontend routes every one of these through
`lib/api-value.ts`, which exists only to hold these casts. Worse, the cast is
unchecked — a field that genuinely changes type will not fail to compile.

**Fix:** declare the real type alongside `nullable: true`. Once regenerated,
`lib/api-value.ts` can be deleted and its call sites read the fields directly.

---

## 3. `UpdateBookingDto.status` accepts only `no_show`

Not a bug — recording it because it is easy to model wrongly. `PATCH /bookings/{id}`
takes `status: "no_show"` and nothing else; confirming and cancelling go through
`POST /bookings/{id}/confirm` and `/cancel`. Likewise `CreateChargeDto.kind`
accepts only `one_off` and `store` — the other three kinds are system-generated.

Both are sensible designs. They are noted here so the next person reading
`BookingStatus` or `ChargeKind` does not assume the full enum is writable.

---

## 4. `POST /checkins/{id}/checkout` is missing from the generated wrapper

`HsService.ts` implements it as `api.checkOut(id)`, but `lib/service/index.ts`
does not re-export it the way it does every other operation. The frontend works
around this in `lib/service-supplement.ts`.

Worth checking whether the wrapper generator skips operations whose tag differs
from the resource path (`checkOut` is tagged *Attendance* while living under
`/checkins`), since any other endpoint in that shape would be missing too.

---

## 5. No `DELETE` endpoint for resources (and most entities) — MEDIUM

**Where:** `paths`

Only one delete exists in the entire API:

| Path | Methods |
|---|---|
| `/api/v1/credits/{id}` | `DELETE` |
| `/api/v1/resources`, `/api/v1/resources/{id}` | `GET`, `POST`, `PATCH` |
| `/api/v1/resource-types`, `/api/v1/resource-types/{id}` | `GET`, `POST`, `PATCH` |
| `/api/v1/resource-rates`, `/api/v1/resource-rates/{id}` | `GET`, `POST`, `PATCH` |
| `/api/v1/amenities`, `/api/v1/amenities/{id}` | `GET`, `POST`, `PATCH` |

The resources table ships a delete button whose action is a stub
(`app/space/resources/actions.ts` — `deleteResourceAction`, marked
`TODO: Implement deleteResource when API endpoint is available`). It currently
returns `"Delete not yet implemented"`.

This may well be deliberate — soft-delete via `active: false` is a legitimate
design. If so, say it explicitly and we will replace the delete button with an
archive/deactivate control. If not, `DELETE /api/v1/resources/{id}` is the
missing piece.

**Decision needed:** hard delete, or `active: false` as the supported path?

---

## 6. Duplicate error types in generated signatures — LOW / cosmetic

**Where:** every operation, via the shared error responses

Generated signatures read:

```ts
ResponseErrorDto | ResponseErrorDto | ResourceRateDto
```

75 occurrences across `lib/service/HsService.ts`. The duplication comes from
several status codes (401, 403, 422, 429, 500) all resolving to
`ResponseErrorDto`, which the generator unions without deduplicating.

Harmless — `A | A` is `A`. Listed only so it is not mistaken for a symptom of
something worse. No action required unless the noise bothers you.

---

# Billing document gaps

Found while building the invoice detail and print view. None of these are schema
bugs — they are capabilities the API does not have, and each one forces a
compromise in the frontend.

## 7. Payments are write-only — MEDIUM

**Where:** `paths./api/v1/invoices/{id}/payments`

`POST` records a payment. There is **no `GET`** — anywhere. A payment can be
written and then never read back individually.

`InvoiceDto` carries a `paid` total, so the balance is correct, but the
individual payments behind it are unreachable: method, date, reference and
`recordedBy` are all captured on write and then invisible.

**Impact:** the printed invoice shows *Paid: 240 TND* and cannot show
"240 TND by bank transfer on 12/03, ref XYZ". A customer disputing what they
paid cannot be answered from the app, and there is no reconciliation view.

**Fix:** `GET /invoices/{id}/payments` returning `PaymentDto[]`. The DTO already
exists and is fully specified — it is simply never returned by any operation.

---

## 8. `MemberDto` has no postal address — MEDIUM

**Where:** `components.schemas.MemberDto`

`CompanyDto` has what an invoice needs: `billingName`, `billingAddress`
(a full `AddressDto`), `taxId`, `registrationNumber`.

`MemberDto` has `fullName`, `email`, `phone` — and nothing else.

**Impact:** an invoice billed to an individual prints a name and an email where
the customer's address belongs. Whether that is acceptable depends on Tunisian
invoicing rules; if a postal address is required on a compliant invoice, invoices
to individuals cannot currently be issued correctly.

**Fix:** add `billingAddress` (and probably `taxId`) to `MemberDto`, mirroring
`CompanyDto`.

**Decision needed:** are individuals ever invoiced directly, or does every
invoice go to a company? If the latter, this is a non-issue — say so and the
frontend can stop rendering the individual case.

---

## 9. No organisation / tenant endpoint — MEDIUM

There is nowhere to read *our own* legal identity from: name, address, tax ID,
registration number, payment terms, bank details.

Every one of those has to appear on a compliant invoice, so the frontend
hardcodes them in `lib/invoice-identity.ts`. Changing the company address is
currently a code change and a deploy.

**Fix:** a `GET /organisation` (or settings) endpoint returning the issuer
identity. It would also give the app a real place to read the space's name and
branding, which are hardcoded in `lib/navigation-config.ts` for the same reason.

---

## 10. No document generation — MEDIUM

No endpoint in the spec produces a PDF or any rendered document. Verified by
scanning all 61 paths for `pdf`, `export`, `print` and `download`: none.

The frontend prints from the browser, and "Save as PDF" in the print dialog is
how a file is produced. That works, but it means:

- The PDF's appearance depends on the operator's browser and print settings
- Nothing can be emailed or archived automatically
- There is no immutable rendered copy of what the customer was sent

**Fix:** `GET /invoices/{id}/pdf`. Worth deciding early, because server-rendered
invoices are usually an accounting requirement rather than a nicety — the
document sent to a customer should not be re-rendered differently later.

---

## Verified healthy

Checks that came back clean, recorded so they need not be redone:

- No schema referenced but undefined; no schema defined but unreferenced.
- No boolean `required` inside schema objects (the previous round's bug).
- No nested arrays anywhere in the spec.
- No header parameters mis-declared as query parameters.
- No responses with a null or empty schema.
- Nullable fields generate correctly as `T | null`.
- `ResourceDto` — `amenities` and `rates` are properly `$ref` arrays of
  `AmenityDto` / `ResourceRateDto`, `availability` of `AvailabilityPeriodDto`.
- `ResourceStatus` enum matches what the frontend renders:
  `available | reserved | partially_occupied | occupied | unavailable`.

---

## Summary

| # | Issue | Severity | Action |
|---|---|---|---|
| 1 | `PageDto.results` typed `array<string>` | High | Remove `results` from `PageDto`; add `required: ["results"]` to the per-endpoint override |
| 2 | 38 nullable fields typed as bare `object` | High | Declare the real type alongside `nullable: true` |
| 3 | Write-restricted enums (`no_show`, charge kinds) | Info | None — documented so they are not modelled wrongly |
| 4 | `checkOut` missing from the generated wrapper | Medium | Check why the generator skips it; likely a tag/path mismatch |
| 5 | No `DELETE` for resources | Medium | Add the endpoint, or confirm `active: false` is the intended path |
| 6 | `ResponseErrorDto \| ResponseErrorDto` in signatures | Low | Optional — generator-side dedup |
| 7 | Payments are write-only | Medium | Add `GET /invoices/{id}/payments` — `PaymentDto` already exists |
| 8 | `MemberDto` has no postal address | Medium | Add `billingAddress`/`taxId`, or confirm individuals are never invoiced |
| 9 | No organisation / tenant endpoint | Medium | Add one; issuer identity is hardcoded in `lib/invoice-identity.ts` |
| 10 | No PDF generation | Medium | Add `GET /invoices/{id}/pdf` if a stable archived document is required |

**Types.** Issues 1 and 2 are the ones blocking clean frontend types. Between
them they account for every cast in `lib/api-value.ts` and every paginated call
site in the app; fixing both lets that module be deleted.

**Billing.** Issues 7–10 all bite the same workflow — issuing a compliant
invoice. 7 and 8 affect what the document can legally say; 9 and 10 affect
whether the document is reproducible. Worth triaging together with whoever owns
the accounting requirements.
