import "server-only";
import type { HttpClient } from "../shared/HttpClient";
import { ContentType, RequestParams } from "../shared/types";

export interface ResponseErrorDto {
  /**
   * A URI reference identifying the problem type. Defaults to "about:blank" when absent.
   * @example "validation_failed"
   */
  type: string;
  /**
   * HTTP status code generated for this occurrence of the problem.
   * @example 422
   */
  status: number;
  /**
   * Short, human-readable summary of the problem type.
   * @example "Unprocessable Entity"
   */
  title: string;
  /**
   * The request path where this error occurred.
   * @example "/api/v1/auth/verify-email-otp"
   */
  instance: string;
  /**
   * Human-readable explanation specific to this occurrence of the problem.
   * @example "Request validation failed"
   */
  detail: string;
  /**
   * ISO 8601 timestamp of when this error occurred.
   * @format date-time
   * @example "2026-04-01T12:00:00.000Z"
   */
  timestamp?: string;
  /**
   * Per-field validation errors. Present only on 422 validation failures.
   * @example [{"email":"email must be an email"}]
   */
  properties?: Array<Record<string, string>>;
}

export interface OtpRequestedDto {
  /** Confirmation message */
  message: string;
}

export interface RegisterDto {
  /** @example "user@example.com" */
  email: string;
}

export interface AuthTokensDto {
  /** JWT access token */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /**
   * Token type
   * @example "Bearer"
   */
  tokenType: string;
  /** Access token expiry in seconds */
  expiresIn: number;
}

export interface VerifyOtpDto {
  /** @example "user@example.com" */
  email: string;
  /**
   * 6-digit OTP code
   * @example "123456"
   */
  token: string;
}

export interface PageMetaDto {
  /**
   * The current page number.
   * @example 1
   */
  page: number;
  /**
   * The number of items per page.
   * @example 10
   */
  pageSize: number;
  /**
   * The total number of items across all pages.
   * @example 100
   */
  totalItems: number;
  /**
   * Indicates if there is a previous page available.
   * @example false
   */
  hasPreviousPage: boolean;
  /**
   * Indicates if there is a next page available.
   * @example true
   */
  hasNextPage: boolean;
}

export interface PageDto {
  /** An array of results for the current page. */
  results: Array<Array<any>>;
  /** Metadata for the paginated response, including pagination details. */
  meta: PageMetaDto;
}

export interface AddressDto {
  /** @example "Tunisia" */
  country?: string;
  /** @example "Bizerte" */
  state?: string;
  /** @example "Bizerte" */
  city?: string;
  /** @example "Rue Habib Bourguiba" */
  street?: string;
  /** @example "7000" */
  zip?: string;
  /**
   * Full display form; overrides the composed parts when present.
   * @example "Rue Habib Bourguiba, 7000 Bizerte, Tunisia"
   */
  formattedAddress?: string;
  /** @example 37.2744 */
  latitude?: number;
  /** @example 9.8739 */
  longitude?: number;
}

export interface TimeWindowDto {
  /** @example "08:00" */
  open: string;
  /** @example "18:00" */
  close: string;
}

export interface WeeklyOpeningHoursDto {
  mon?: Array<TimeWindowDto>;
  tue?: Array<TimeWindowDto>;
  wed?: Array<TimeWindowDto>;
  thu?: Array<TimeWindowDto>;
  fri?: Array<TimeWindowDto>;
  sat?: Array<TimeWindowDto>;
  sun?: Array<TimeWindowDto>;
}

export interface ClosedDayDto {
  /**
   * First closed day (inclusive).
   * @example "2026-03-20"
   */
  from: string;
  /**
   * Last closed day (inclusive).
   * @example "2026-03-20"
   */
  to: string;
  /** @example "Independence Day" */
  description: string;
  /**
   * 'yearly' repeats the range every year (fixed-date holidays);
   * omit for one-off closures.
   */
  occurrence?: "yearly";
}

export interface LocationDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Hyperspace Bizerte" */
  name: string;
  address?: AddressDto | null;
  /** @example "Africa/Tunis" */
  timezone: string;
  openingHours?: WeeklyOpeningHoursDto | null;
  closedDays: Array<ClosedDayDto>;
  /** @example true */
  active: boolean;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export type Sort = "ASC" | "DESC";

export interface CreateLocationDto {
  /** @example "Hyperspace Bizerte" */
  name: string;
  address?: AddressDto;
  /**
   * IANA timezone name. Defaults to Africa/Tunis.
   * @default "Africa/Tunis"
   * @example "Africa/Tunis"
   */
  timezone?: string;
  openingHours?: WeeklyOpeningHoursDto;
  closedDays?: Array<ClosedDayDto>;
  /**
   * @default true
   * @example true
   */
  active?: boolean;
}

export interface UpdateLocationDto {
  /** @example "Hyperspace Bizerte" */
  name?: string;
  address?: AddressDto;
  /**
   * IANA timezone name. Defaults to Africa/Tunis.
   * @default "Africa/Tunis"
   * @example "Africa/Tunis"
   */
  timezone?: string;
  openingHours?: WeeklyOpeningHoursDto;
  closedDays?: Array<ClosedDayDto>;
  /**
   * @default true
   * @example true
   */
  active?: boolean;
}

export interface CompanyDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Acme Consulting SARL" */
  name: string;
  /**
   * Tunisian matricule fiscal.
   * @example "1234567/A/M/000"
   */
  taxId?: string | null;
  billingAddress?: AddressDto | null;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  website?: string | null;
  tags: Array<string>;
  metadata: Record<string, any>;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateCompanyDto {
  /** @example "Acme Consulting SARL" */
  name: string;
  /**
   * Tunisian matricule fiscal.
   * @example "1234567/A/M/000"
   */
  taxId?: string;
  billingAddress?: AddressDto;
  /** @example "billing@acme.tn" */
  email?: string;
  /** @example "+21622123456" */
  phone?: string;
  description?: string;
  /** @example "https://acme.tn" */
  website?: string;
  tags?: Array<string>;
  metadata?: Record<string, any>;
}

export interface UpdateCompanyDto {
  /** @example "Acme Consulting SARL" */
  name?: string;
  /**
   * Tunisian matricule fiscal.
   * @example "1234567/A/M/000"
   */
  taxId?: string;
  billingAddress?: AddressDto;
  /** @example "billing@acme.tn" */
  email?: string;
  /** @example "+21622123456" */
  phone?: string;
  description?: string;
  /** @example "https://acme.tn" */
  website?: string;
  tags?: Array<string>;
  metadata?: Record<string, any>;
}

export type MemberSegment =
  | "student"
  | "freelancer"
  | "remote_employee"
  | "entrepreneur"
  | "company_team"
  | "visiting_professional"
  | "other";

export type MemberKindHint = "lead" | "visitor" | "member";

/**
 * DERIVED status (OfficeRnD vocabulary) — computed, never stored.
 * Phase 1 derives from kindHint; Phase 2 from membership data.
 */
export type MemberStatus = "lead" | "drop-in" | "pending" | "active" | "former";

export interface MemberDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Mohamed Ali May" */
  fullName: string;
  email?: string | null;
  phone?: string | null;
  /** @format uuid */
  companyId?: string | null;
  segment?: MemberSegment | null;
  kindHint: MemberKindHint;
  /**
   * DERIVED status (OfficeRnD vocabulary) — computed, never stored.
   * Phase 1 derives from kindHint; Phase 2 from membership data.
   */
  status: MemberStatus;
  /** True when a portal user has claimed this member (§6.5). */
  hasPortalAccess: boolean;
  notes?: string | null;
  tags: Array<string>;
  metadata: Record<string, any>;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateMemberDto {
  /** @example "Mohamed Ali May" */
  fullName: string;
  /** @example "mohamed@example.tn" */
  email?: string;
  /** @example "+21622123456" */
  phone?: string;
  /**
   * Employer company id.
   * @format uuid
   */
  companyId?: string;
  segment?: MemberSegment;
  /**
   * Defaults to `lead` — the CRM entry point.
   * @default "lead"
   */
  kindHint?: MemberKindHint;
  notes?: string;
  tags?: Array<string>;
  metadata?: Record<string, any>;
}

export interface UpdateMemberDto {
  /** @example "Mohamed Ali May" */
  fullName?: string;
  /** @example "mohamed@example.tn" */
  email?: string;
  /** @example "+21622123456" */
  phone?: string;
  /**
   * Employer company id.
   * @format uuid
   */
  companyId?: string;
  segment?: MemberSegment;
  /**
   * Defaults to `lead` — the CRM entry point.
   * @default "lead"
   */
  kindHint?: MemberKindHint;
  notes?: string;
  tags?: Array<string>;
  metadata?: Record<string, any>;
}

export interface InviteResponseDto {
  /**
   * Single-use claim token — deliver to the customer out-of-band
   * (email/WhatsApp). v1 displays it to staff.
   * @example "3f1c9a…48 hex chars"
   */
  inviteToken: string;
  /** @format date-time */
  inviteExpiresAt: string;
}

export interface ClaimMemberDto {
  /**
   * The invite token received from staff.
   * @example "a3f1c9…"
   */
  inviteToken: string;
}

export type BookingMode = "hourly" | "daily" | "none";

export interface ResourceTypeDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "meeting_room" */
  slug: string;
  /** @example "Meeting Room" */
  name: string;
  bookingMode: BookingMode;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateResourceTypeDto {
  /**
   * Stable machine identifier (snake_case).
   * @example "meeting_room"
   */
  slug: string;
  /** @example "Meeting Room" */
  name: string;
  bookingMode: BookingMode;
}

export interface UpdateResourceTypeDto {
  /**
   * Stable machine identifier (snake_case).
   * @example "meeting_room"
   */
  slug?: string;
  /** @example "Meeting Room" */
  name?: string;
  bookingMode?: BookingMode;
}

export interface ResourceDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  locationId: string;
  /** @format uuid */
  resourceTypeId: string;
  /** @format uuid */
  parentId?: string | null;
  /** @example "Meeting Room" */
  name: string;
  description?: string | null;
  /** @example 8 */
  capacity: number;
  bookingTimes?: WeeklyOpeningHoursDto | null;
  minDurationMin?: number | null;
  maxDurationMin?: number | null;
  /** @example 24 */
  cancellationHours: number;
  hidden: boolean;
  active: boolean;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateResourceDto {
  /** @format uuid */
  locationId: string;
  /** @format uuid */
  resourceTypeId: string;
  /**
   * Parent resource for hierarchical setups (desk inside a space).
   * @format uuid
   */
  parentId?: string;
  /** @example "Meeting Room" */
  name: string;
  description?: string;
  /** @example 8 */
  capacity: number;
  /** Bookable windows; omit for anytime within opening hours. */
  bookingTimes?: WeeklyOpeningHoursDto;
  /** @example 60 */
  minDurationMin?: number;
  /** @example 480 */
  maxDurationMin?: number;
  /**
   * @default 0
   * @example 24
   */
  cancellationHours?: number;
  /** @default false */
  hidden?: boolean;
  /** @default true */
  active?: boolean;
}

export interface UpdateResourceDto {
  /** @format uuid */
  locationId?: string;
  /** @format uuid */
  resourceTypeId?: string;
  /**
   * Parent resource for hierarchical setups (desk inside a space).
   * @format uuid
   */
  parentId?: string;
  /** @example "Meeting Room" */
  name?: string;
  description?: string;
  /** @example 8 */
  capacity?: number;
  /** Bookable windows; omit for anytime within opening hours. */
  bookingTimes?: WeeklyOpeningHoursDto;
  /** @example 60 */
  minDurationMin?: number;
  /** @example 480 */
  maxDurationMin?: number;
  /**
   * @default 0
   * @example 24
   */
  cancellationHours?: number;
  /** @default false */
  hidden?: boolean;
  /** @default true */
  active?: boolean;
}

export type RateType = "hourly" | "daily";

export type RateAudience = "member" | "visitor";

export interface ResourceRateDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  resourceId: string;
  rateType: RateType;
  audience: RateAudience;
  /**
   * Price per unit excluding VAT, in millimes (20 TND = 20000).
   * @example 20000
   */
  priceHtMillimes: number;
  /**
   * VAT in basis points (1900 = 19%).
   * @example 1900
   */
  vatRateBp: number;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateResourceRateDto {
  /** @format uuid */
  resourceId: string;
  rateType: RateType;
  audience: RateAudience;
  /**
   * Price per unit excluding VAT, in millimes.
   * @example 20000
   */
  priceHtMillimes: number;
  /**
   * VAT in basis points. Defaults to 1900 (19%).
   * @default 1900
   * @example 1900
   */
  vatRateBp?: number;
}

export interface UpdateResourceRateDto {
  /**
   * Price per unit excluding VAT, in millimes.
   * @example 20000
   */
  priceHtMillimes?: number;
  /**
   * VAT in basis points. Defaults to 1900 (19%).
   * @default 1900
   * @example 1900
   */
  vatRateBp?: number;
}

export type PlanKind = "recurring" | "one_off";

export type PlanStatus = "active" | "archived";

export type BenefitKind = "credit" | "entitlement" | "amenity";

export type BenefitRenewal = "per_cycle" | "once";

export interface PlanBenefitDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  benefitKind: BenefitKind;
  /** @example "half_day" */
  benefitType: string;
  /** @example 20 */
  amount?: number | null;
  renewal?: BenefitRenewal | null;
  /** @example 60 */
  expiresAfterDays?: number | null;
  /** @format uuid */
  resourceTypeId?: string | null;
  config: Record<string, any>;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface PlanDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Full time +" */
  name: string;
  /** @example "FT_PLUS" */
  code?: string | null;
  kind: PlanKind;
  /** @example 1 */
  cycleMonths?: number | null;
  /** @example 240000 */
  priceHtMillimes: number;
  /** @example 1900 */
  vatRateBp: number;
  /** @example 0 */
  depositMillimes: number;
  /** @example 0 */
  cancellationDays: number;
  status: PlanStatus;
  hidden: boolean;
  description?: string | null;
  terms: Record<string, any>;
  benefits: Array<PlanBenefitDto>;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreatePlanBenefitDto {
  benefitKind: BenefitKind;
  /**
   * credit: half_day | room_hour | coin; entitlement:
   * access_business_hours | access_24_7 | domiciliation | dedicated_desk;
   * amenity: free-form.
   * @example "half_day"
   */
  benefitType: string;
  /**
   * Required for credits, forbidden otherwise.
   * @example 20
   */
  amount?: number;
  /** Required for credits, forbidden otherwise. */
  renewal?: BenefitRenewal;
  /** @example 60 */
  expiresAfterDays?: number;
  /**
   * Only allowed on room_hour credits.
   * @format uuid
   */
  resourceTypeId?: string;
  config?: Record<string, any>;
}

export interface CreatePlanDto {
  /** @example "Full time +" */
  name: string;
  /** @example "FT_PLUS" */
  code?: string;
  kind: PlanKind;
  /**
   * Required for recurring plans, forbidden for one-off plans.
   * @example 1
   */
  cycleMonths?: number;
  /**
   * Price excluding VAT, in millimes (240 TND = 240000).
   * @example 240000
   */
  priceHtMillimes: number;
  /** @default 1900 */
  vatRateBp?: number;
  /** @default 0 */
  depositMillimes?: number;
  /** @default 0 */
  cancellationDays?: number;
  /** @default false */
  hidden?: boolean;
  description?: string;
  terms?: Record<string, any>;
  benefits?: Array<CreatePlanBenefitDto>;
}

export interface UpdatePlanDto {
  /** @example "Full time +" */
  name?: string;
  /** @example "FT_PLUS" */
  code?: string;
  kind?: PlanKind;
  /**
   * Required for recurring plans, forbidden for one-off plans.
   * @example 1
   */
  cycleMonths?: number;
  /**
   * Price excluding VAT, in millimes (240 TND = 240000).
   * @example 240000
   */
  priceHtMillimes?: number;
  /** @default 1900 */
  vatRateBp?: number;
  /** @default 0 */
  depositMillimes?: number;
  /** @default 0 */
  cancellationDays?: number;
  /** @default false */
  hidden?: boolean;
  description?: string;
  terms?: Record<string, any>;
  benefits?: Array<CreatePlanBenefitDto>;
}

export type ChargeKind = "plan_fee" | "booking" | "store" | "one_off" | "deposit";

export interface ChargeDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  memberId?: object;
  /** @format uuid */
  companyId?: object;
  /** @format uuid */
  membershipId?: object;
  /** @format uuid */
  bookingId?: object;
  kind: ChargeKind;
  /** @example "Part time — cycle 1 (2026-07-12)" */
  description: string;
  /** @example 120000 */
  amountHtMillimes: number;
  /** @example 1900 */
  vatRateBp: number;
  /** @example 22800 */
  vatMillimes: number;
  accountingCode?: object;
  /** @format uuid */
  invoiceId?: object;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateChargeDto {
  /** @format uuid */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  kind: "one_off" | "store";
  /** @example "Printing — 50 pages" */
  description: string;
  /** @example 25000 */
  amountHtMillimes: number;
  /** @default 1900 */
  vatRateBp?: number;
  /** @example "707" */
  accountingCode?: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export interface InvoiceDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  memberId?: object;
  /** @format uuid */
  companyId?: object;
  /** @example "HS-2026-0042" */
  number: string;
  /** @example "2026-07-12" */
  issuedAt: string;
  /** @example "2026-07-12" */
  dueAt: string;
  status: InvoiceStatus;
  /** @example 325000 */
  totalHtMillimes: number;
  /** @example 61750 */
  totalVatMillimes: number;
  /** @example 386750 */
  totalTtcMillimes: number;
  /** @example 200000 */
  paidMillimes: number;
  charges: Array<ChargeDto>;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateInvoiceDto {
  /** @format uuid */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  chargeIds?: Array<string>;
  /** @example "2026-08-11" */
  dueAt?: string;
}

export type PaymentMethod = "cash" | "virement" | "card" | "check";

export interface PaymentDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  invoiceId: string;
  /** @example 200000 */
  amountMillimes: number;
  method: PaymentMethod;
  /** @example "VIR-2026-4471" */
  reference?: object;
  /** @format date-time */
  paidAt: string;
  /** @format uuid */
  recordedBy?: object;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface RecordPaymentResultDto {
  payment: PaymentDto;
  /** @example 386750 */
  paidMillimes: number;
  /** @example true */
  settled: boolean;
}

export interface CreatePaymentDto {
  /** @example 200000 */
  amountMillimes: number;
  method: PaymentMethod;
  /** @example "VIR-2026-4471" */
  reference?: string;
  /** @example "2026-07-12T14:30:00Z" */
  paidAt?: string;
}

/** Derived from dates on every read. */
export type MembershipStatus = "pending" | "active" | "paused" | "ended";

export interface MembershipDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  memberId?: string | null;
  /** @format uuid */
  companyId?: string | null;
  /**
   * Soft reference to the (possibly archived) catalog plan.
   * @format uuid
   */
  planId: string;
  /** The contractual terms this membership runs on — frozen at creation. */
  planSnapshot: Record<string, any>;
  /** @example "2026-08-01" */
  startsAt: string;
  /** @example "2026-12-31" */
  endsAt?: string | null;
  /** @example "2026-11-30" */
  cancelledAt?: string | null;
  /** Derived from dates on every read. */
  status: MembershipStatus;
  notes?: string | null;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateMembershipDto {
  /**
   * Exactly one of memberId / companyId (customer XOR, §3.3).
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /** @format uuid */
  planId: string;
  /**
   * First day of the membership (Africa/Tunis business date).
   * @example "2026-08-01"
   */
  startsAt: string;
  notes?: string;
}

export interface CreditBalanceDto {
  /** @example "half_day" */
  creditType: string;
  /** @example 18 */
  available: number;
  /** @example 20 */
  granted: number;
  /** @example 2 */
  consumed: number;
  /** @example 0 */
  expired: number;
  /** @format date-time */
  nextExpiry?: string;
}

export interface MembershipCreditBalancesDto {
  /** @format uuid */
  membershipId: string;
  balances: Array<CreditBalanceDto>;
}

export interface MeDto {
  member: MemberDto;
  memberships: Array<MembershipDto>;
  creditBalances: Array<MembershipCreditBalancesDto>;
}

export type CheckinMethod = "qr" | "manual";

export type EntitlementUsed = "access_24_7" | "access_business_hours" | "half_day_credit" | "visitor" | "trial";

export interface CheckinDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  memberId: string;
  /** @format uuid */
  locationId: string;
  /** @format date-time */
  checkedInAt: string;
  /** @format date-time */
  checkedOutAt?: string | null;
  method: CheckinMethod;
  entitlementUsed: EntitlementUsed;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateCheckinDto {
  /**
   * Target member. Staff/admin only — member-role callers check
   * themselves in and must omit this (or pass their own member id).
   * @format uuid
   */
  memberId?: string;
  /**
   * Optional when exactly one active location exists.
   * @format uuid
   */
  locationId?: string;
  /**
   * Staff-only manual override (§6.2.5): records a visitor or trial
   * check-in without entitlements or credits.
   */
  force?: "visitor" | "trial";
}

export interface OccupancyBucketDto {
  /** @format date-time */
  bucket: string;
  /**
   * Peak concurrent open check-ins within the bucket.
   * @example 12
   */
  concurrent: number;
  /**
   * Hot-desk capacity of the location at query time.
   * @example 20
   */
  capacity: number;
  /**
   * concurrent / capacity, rounded to 4 decimals; 0 when capacity is 0.
   * @example 0.6
   */
  occupancyRate: number;
  /**
   * Day granularity only: total check-ins started that day.
   * @example 31
   */
  totalCheckins?: number;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "no_show";

export type BookingSource = "portal" | "staff" | "public";

export interface BookingDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  resourceId: string;
  /** @format uuid */
  memberId?: string | null;
  /** @format uuid */
  companyId?: string | null;
  /** @format date-time */
  startsAt: string;
  /** @format date-time */
  endsAt: string;
  status: BookingStatus;
  /**
   * NULL = fully credit-covered (§4.11).
   * @example null
   */
  priceHtMillimes?: number | null;
  source: BookingSource;
  title?: string | null;
  notes?: string | null;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateBookingDto {
  /** @format uuid */
  resourceId: string;
  /**
   * Customer (member XOR company) — staff/admin only; member-role
   * callers book for themselves and must omit both.
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /** @example "2026-07-14T09:00:00Z" */
  startsAt: string;
  /** @example "2026-07-14T11:00:00Z" */
  endsAt: string;
  /** @example "Sprint planning" */
  title?: string;
  notes?: string;
}

export interface QuoteConsumptionDto {
  /** @format uuid */
  membershipId: string;
  /**
   * room_hour credits taken from this membership.
   * @example 2
   */
  amount: number;
}

export interface BookingQuoteDto {
  /** @format uuid */
  resourceId: string;
  bookingMode: BookingMode;
  /**
   * Billable units: ceil(duration / hour|day).
   * @example 2
   */
  units: number;
  /**
   * Units covered by room_hour credits (FIFO across memberships).
   * @example 2
   */
  creditsCovered: number;
  /** @example 0 */
  chargedUnits: number;
  consumptionPlan: Array<QuoteConsumptionDto>;
  /** Which rate audience applies to the charged remainder. */
  audience?: RateAudience | null;
  /**
   * NULL when fully credit-covered (§4.11).
   * @example null
   */
  priceHtMillimes?: number | null;
  /** @example 1900 */
  vatRateBp?: number | null;
  /** @example null */
  totalTtcMillimes?: number | null;
}

export interface UpdateBookingDto {
  /** @example "Sprint planning" */
  title?: string;
  notes?: string;
  status?: "no_show";
}

export interface AvailabilityDayDto {
  /** @example "2026-07-13" */
  date: string;
  /** Bookable windows that day (booking_times ?? location hours). */
  windows: Array<TimeWindowDto>;
}

export interface BusyIntervalDto {
  /** @format date-time */
  startsAt: string;
  /** @format date-time */
  endsAt: string;
}

export interface AvailabilityDto {
  /** @format uuid */
  resourceId: string;
  bookingMode: BookingMode;
  /** @example 60 */
  minDurationMin?: number | null;
  /** @example 480 */
  maxDurationMin?: number | null;
  /** @example 24 */
  cancellationHours: number;
  days: Array<AvailabilityDayDto>;
  /** Confirmed bookings overlapping the range, clipped to it. */
  busy: Array<BusyIntervalDto>;
}

export type OpportunityInterest = "coworking" | "domiciliation" | "private_office" | "meeting_room" | "other";

export type OpportunityStage = "new" | "contacted" | "tour" | "quote" | "won" | "lost";

export interface OpportunityDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  memberId: string;
  interest: OpportunityInterest;
  stage: OpportunityStage;
  /** @example 240000 */
  expectedValueMillimes?: object;
  /** @example "website" */
  source?: object;
  notes?: object;
  /** @format date-time */
  closedAt?: string;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateOpportunityDto {
  /** @format uuid */
  memberId: string;
  interest: OpportunityInterest;
  /** @default "new" */
  stage?: OpportunityStage;
  /** @example 240000 */
  expectedValueMillimes?: number;
  /** @example "walk-in" */
  source?: string;
  notes?: string;
}

export interface UpdateOpportunityDto {
  /** @format uuid */
  memberId?: string;
  interest?: OpportunityInterest;
  /** @default "new" */
  stage?: OpportunityStage;
  /** @example 240000 */
  expectedValueMillimes?: number;
  /** @example "walk-in" */
  source?: string;
  notes?: string;
}

export interface RevenueBucketDto {
  /** @example "2026-07" */
  bucket: string;
  /** @example 305000 */
  totalHtMillimes: number;
  /** @example 57950 */
  totalVatMillimes: number;
  /** @example 362950 */
  totalTtcMillimes: number;
  /** @example 4 */
  chargeCount: number;
}

export interface ActiveByPlanDto {
  /** @example "Part time" */
  planName: string;
  /** @example 12 */
  activeCount: number;
}

export interface ExpiringMembershipDto {
  /** @format uuid */
  membershipId: string;
  /** @example "Part time" */
  planName: string;
  /** @format uuid */
  memberId?: object;
  /** @format uuid */
  companyId?: object;
  /** @example "2026-08-01" */
  endsAt: string;
}

export interface ChurnCohortDto {
  /** @example "2026-05" */
  cohort: string;
  /** @example 10 */
  started: number;
  /** @example 3 */
  ended: number;
  /** @example 0.3 */
  churnRate: number;
}

export interface MembershipAnalyticsDto {
  activeByPlan: Array<ActiveByPlanDto>;
  expiring: Array<ExpiringMembershipDto>;
  churnByCohort: Array<ChurnCohortDto>;
}

export interface PublicPlanBenefitDto {
  /** @example "credit" */
  kind: string;
  /** @example "half_day" */
  type: string;
  /** @example 20 */
  amount?: object;
}

export interface PublicPlanDto {
  /** @format uuid */
  id: string;
  /** @example "Part time" */
  name: string;
  /** @example "PART_TIME" */
  code?: object;
  /** @example "recurring" */
  kind: string;
  /** @example 1 */
  cycleMonths?: object;
  /** @example 120000 */
  priceHtMillimes: number;
  /** @example 1900 */
  vatRateBp: number;
  /** @example 142800 */
  priceTtcMillimes: number;
  description?: object;
  benefits: Array<PublicPlanBenefitDto>;
}

export interface BookingRequestResultDto {
  /** @format uuid */
  bookingId: string;
  /** @example "pending" */
  status: string;
}

export interface CreateBookingRequestDto {
  /** @example "Sami Ben Salah" */
  fullName: string;
  /** @example "sami@company.tn" */
  email: string;
  /** @example "+21622123456" */
  phone?: string;
  /** @format uuid */
  resourceId: string;
  /** @example "2026-07-20T09:00:00Z" */
  startsAt: string;
  /** @example "2026-07-20T11:00:00Z" */
  endsAt: string;
  /** @example "Team workshop, 6 people" */
  notes?: string;
}

export interface ListLocationsParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** The search term to filter results. */
  q?: string;
}

export interface ListCompaniesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** Exact-match name filter (OfficeRnD-style); use `q` for fuzzy search. */
  name?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface ListMembersParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  kindHint?: MemberKindHint;
  /** @format uuid */
  companyId?: string;
  /** Exact-match email filter (OfficeRnD-style); use `q` for fuzzy search. */
  email?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface ListResourceTypesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** The search term to filter results. */
  q?: string;
}

export interface ListResourcesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** @format uuid */
  locationId?: string;
  /** @format uuid */
  resourceTypeId?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface ListResourceRatesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** @format uuid */
  resourceId?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface ListPlansParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** Admin-only filter; ignored for other roles. */
  status?: PlanStatus;
  /** The search term to filter results. */
  q?: string;
}

export interface ListChargesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** @format uuid */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  kind?: ChargeKind;
  uninvoiced?: boolean;
  /** The search term to filter results. */
  q?: string;
}

export interface ListInvoicesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  status?: InvoiceStatus;
  /** @format uuid */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface ListMembershipsParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** Filters on the DERIVED status via date conditions. */
  status?: MembershipStatus;
  /** @format uuid */
  planId?: string;
  /**
   * Memberships whose ends_at falls on or before this date.
   * @example "2026-09-01"
   */
  expiringBefore?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface ListCheckinsParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** @example "2026-07-01T00:00:00Z" */
  from?: string;
  /** @example "2026-07-31T23:59:59Z" */
  to?: string;
  /** @format uuid */
  memberId?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface GetOccupancyParams {
  /** @example "2026-07-13T00:00:00Z" */
  from: string;
  /** @example "2026-07-13T23:59:59Z" */
  to: string;
  /** @default "hour" */
  granularity?: "hour" | "day";
  /** @format uuid */
  locationId?: string;
}

export interface ListBookingsParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** @format uuid */
  resourceId?: string;
  /** @example "2026-07-01T00:00:00Z" */
  from?: string;
  /** @example "2026-07-31T23:59:59Z" */
  to?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface GetResourceAvailabilityParams {
  /** @example "2026-07-13T00:00:00Z" */
  from: string;
  /** @example "2026-07-19T23:59:59Z" */
  to: string;
  id: string;
}

export interface ListOpportunitiesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  stage?: OpportunityStage;
  interest?: OpportunityInterest;
  /** @format uuid */
  memberId?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface AnalyticsOccupancyParams {
  /** @example "2026-07-13T00:00:00Z" */
  from: string;
  /** @example "2026-07-13T23:59:59Z" */
  to: string;
  /** @default "hour" */
  granularity?: "hour" | "day";
  /** @format uuid */
  locationId?: string;
}

export interface AnalyticsRevenueParams {
  /** @example "2026-01-01" */
  from: string;
  /** @example "2026-12-31" */
  to: string;
  /** @default "month" */
  groupBy?: "month" | "plan";
}

export interface AnalyticsMembershipsParams {
  /**
   * @min 1
   * @max 365
   * @default 30
   */
  expiringWithinDays?: number;
}

export interface PublicResourceAvailabilityParams {
  /** @example "2026-07-13T00:00:00Z" */
  from: string;
  /** @example "2026-07-19T23:59:59Z" */
  to: string;
  id: string;
}

export namespace Api {
  /**
   * @description Sends a 6-digit OTP to the provided email. Works for both new and existing users — Supabase creates the account on first use.
   * @tags Auth (Deprecated)
   * @name RequestEmailOtp
   * @summary Request an Email OTP (sign-in or sign-up)
   * @request POST:/api/v1/auth/otp/request
   * @response `200` `(OtpRequestedDto)` 200
   * @response `400` `(ResponseErrorDto)` Bad Request
   * @response `403` `(ResponseErrorDto)` Rejected outside development
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `OtpRequestedDto`
   */
  export namespace RequestEmailOtp {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RegisterDto;
    export type RequestHeaders = {};
    export type ResponseBody = OtpRequestedDto;
  }

  /**
   * @description Validates the OTP and returns access + refresh tokens on success.
   * @tags Auth (Deprecated)
   * @name VerifyEmailOtp
   * @summary Verify Email OTP and obtain tokens
   * @request POST:/api/v1/auth/otp/verify
   * @response `200` `(AuthTokensDto)` 200
   * @response `400` `(ResponseErrorDto)` Bad Request
   * @response `401` `((ResponseErrorDto))` 401
   * @response `403` `(ResponseErrorDto)` Rejected outside development
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AuthTokensDto`
   */
  export namespace VerifyEmailOtp {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VerifyOtpDto;
    export type RequestHeaders = {};
    export type ResponseBody = AuthTokensDto;
  }

  /**
   * @description Invalidates the current Supabase session server-side.
   * @tags Auth (Deprecated)
   * @name SignOut
   * @summary Sign out and revoke session
   * @request POST:/api/v1/auth/sign-out
   * @secure
   * @response `204` `void` 204
   * @response `401` `((ResponseErrorDto))` 401
   * @response `403` `(ResponseErrorDto)` Rejected outside development
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `void`
   */
  export namespace SignOut {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
 * @description Paginated list of locations. `q` filters by name.
 * @tags Locations
 * @name ListLocations
 * @summary List locations
 * @request GET:/api/v1/locations
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<LocationDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListLocations {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<LocationDto>;
    };
  }

  /**
   * @description Opening hours, closed days, address and timezone are runtime configuration — they can be changed at any time via PATCH.
   * @tags Locations
   * @name CreateLocation
   * @summary Create a location
   * @request POST:/api/v1/locations
   * @secure
   * @response `201` `(LocationDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `LocationDto`
   */
  export namespace CreateLocation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateLocationDto;
    export type RequestHeaders = {};
    export type ResponseBody = LocationDto;
  }

  /**
   * No description
   * @tags Locations
   * @name GetLocation
   * @summary Get a location
   * @request GET:/api/v1/locations/{id}
   * @secure
   * @response `200` `(LocationDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `LocationDto`
   */
  export namespace GetLocation {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = LocationDto;
  }

  /**
   * No description
   * @tags Locations
   * @name UpdateLocation
   * @summary Update a location
   * @request PATCH:/api/v1/locations/{id}
   * @secure
   * @response `200` `(LocationDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `LocationDto`
   */
  export namespace UpdateLocation {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateLocationDto;
    export type RequestHeaders = {};
    export type ResponseBody = LocationDto;
  }

  /**
 * @description Paginated list. `q` fuzzy-matches name/email; `name` is exact-match.
 * @tags Companies
 * @name ListCompanies
 * @summary List companies
 * @request GET:/api/v1/companies
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<CompanyDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListCompanies {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** Exact-match name filter (OfficeRnD-style); use `q` for fuzzy search. */
      name?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<CompanyDto>;
    };
  }

  /**
   * No description
   * @tags Companies
   * @name CreateCompany
   * @summary Create a company
   * @request POST:/api/v1/companies
   * @secure
   * @response `201` `(CompanyDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CompanyDto`
   */
  export namespace CreateCompany {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCompanyDto;
    export type RequestHeaders = {};
    export type ResponseBody = CompanyDto;
  }

  /**
   * No description
   * @tags Companies
   * @name GetCompany
   * @summary Get a company
   * @request GET:/api/v1/companies/{id}
   * @secure
   * @response `200` `(CompanyDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CompanyDto`
   */
  export namespace GetCompany {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CompanyDto;
  }

  /**
   * No description
   * @tags Companies
   * @name UpdateCompany
   * @summary Update a company
   * @request PATCH:/api/v1/companies/{id}
   * @secure
   * @response `200` `(CompanyDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CompanyDto`
   */
  export namespace UpdateCompany {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateCompanyDto;
    export type RequestHeaders = {};
    export type ResponseBody = CompanyDto;
  }

  /**
 * @description Paginated list. `q` fuzzy-matches name/email/phone; `email` is exact-match; filter by `kindHint` and `companyId`. The `status` field on each result is derived, never stored.
 * @tags Members
 * @name ListMembers
 * @summary List members
 * @request GET:/api/v1/members
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<MemberDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListMembers {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      kindHint?: MemberKindHint;
      /** @format uuid */
      companyId?: string;
      /** Exact-match email filter (OfficeRnD-style); use `q` for fuzzy search. */
      email?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<MemberDto>;
    };
  }

  /**
   * @description kindHint defaults to `lead` — the CRM entry point.
   * @tags Members
   * @name CreateMember
   * @summary Create a member
   * @request POST:/api/v1/members
   * @secure
   * @response `201` `(MemberDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MemberDto`
   */
  export namespace CreateMember {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateMemberDto;
    export type RequestHeaders = {};
    export type ResponseBody = MemberDto;
  }

  /**
   * @description Staff and admins can fetch any member; a member-role caller can only fetch the member record linked to their account.
   * @tags Members
   * @name GetMember
   * @summary Get a member
   * @request GET:/api/v1/members/{id}
   * @secure
   * @response `200` `(MemberDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `(ResponseErrorDto)` Forbidden
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MemberDto`
   */
  export namespace GetMember {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MemberDto;
  }

  /**
   * @description Staff/admin may update all business fields. A member-role caller may only update their own record, restricted to fullName, email and phone — any other field is rejected with 403. The user link (portal access) is never updatable here; it belongs to the invite/claim flow.
   * @tags Members
   * @name UpdateMember
   * @summary Update a member
   * @request PATCH:/api/v1/members/{id}
   * @secure
   * @response `200` `(MemberDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `(ResponseErrorDto)` Forbidden
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MemberDto`
   */
  export namespace UpdateMember {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateMemberDto;
    export type RequestHeaders = {};
    export type ResponseBody = MemberDto;
  }

  /**
   * @description Provisions the Supabase identity (public signup is disabled) and returns a single-use claim token valid for 7 days. Deliver the token to the customer out-of-band. Re-inviting regenerates the token and invalidates the previous one.
   * @tags Members
   * @name InviteMember
   * @summary Issue a portal-access invite for a member
   * @request POST:/api/v1/members/{id}/invite
   * @secure
   * @response `201` `(InviteResponseDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `InviteResponseDto`
   */
  export namespace InviteMember {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InviteResponseDto;
  }

  /**
   * @description Clears the user link and revokes the member role. The member record and all its history remain intact.
   * @tags Members
   * @name UnlinkMember
   * @summary Revoke portal access
   * @request DELETE:/api/v1/members/{id}/portal-access
   * @secure
   * @response `204` `void` 204
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `void`
   */
  export namespace UnlinkMember {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * @description Links the CALLING user to the invited member, grants the `member` role and consumes the token — the explicit token is the only linking path; email equality never links (§6.5).
   * @tags Me
   * @name ClaimMember
   * @summary Claim portal access with an invite token
   * @request POST:/api/v1/me/claim
   * @secure
   * @response `200` `(MemberDto)` 200
   * @response `401` `((ResponseErrorDto))` 401
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MemberDto`
   */
  export namespace ClaimMember {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ClaimMemberDto;
    export type RequestHeaders = {};
    export type ResponseBody = MemberDto;
  }

  /**
 * No description
 * @tags Catalog — Resource Types
 * @name ListResourceTypes
 * @summary List resource types
 * @request GET:/api/v1/resource-types
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceTypeDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListResourceTypes {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<ResourceTypeDto>;
    };
  }

  /**
   * No description
   * @tags Catalog — Resource Types
   * @name CreateResourceType
   * @summary Create a resource type
   * @request POST:/api/v1/resource-types
   * @secure
   * @response `201` `(ResourceTypeDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceTypeDto`
   */
  export namespace CreateResourceType {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateResourceTypeDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceTypeDto;
  }

  /**
   * No description
   * @tags Catalog — Resource Types
   * @name GetResourceType
   * @summary Get a resource type
   * @request GET:/api/v1/resource-types/{id}
   * @secure
   * @response `200` `(ResourceTypeDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceTypeDto`
   */
  export namespace GetResourceType {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceTypeDto;
  }

  /**
   * No description
   * @tags Catalog — Resource Types
   * @name UpdateResourceType
   * @summary Update a resource type
   * @request PATCH:/api/v1/resource-types/{id}
   * @secure
   * @response `200` `(ResourceTypeDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceTypeDto`
   */
  export namespace UpdateResourceType {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateResourceTypeDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceTypeDto;
  }

  /**
 * @description Admins see all resources; staff and members see only non-hidden ones. Filter by locationId / resourceTypeId; `q` matches the name.
 * @tags Catalog — Resources
 * @name ListResources
 * @summary List resources
 * @request GET:/api/v1/resources
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListResources {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** @format uuid */
      locationId?: string;
      /** @format uuid */
      resourceTypeId?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<ResourceDto>;
    };
  }

  /**
   * @description Capacity, booking windows, durations and cancellation policy are runtime configuration, editable at any time via PATCH.
   * @tags Catalog — Resources
   * @name CreateResource
   * @summary Create a resource
   * @request POST:/api/v1/resources
   * @secure
   * @response `201` `(ResourceDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceDto`
   */
  export namespace CreateResource {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateResourceDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceDto;
  }

  /**
   * No description
   * @tags Catalog — Resources
   * @name GetResource
   * @summary Get a resource
   * @request GET:/api/v1/resources/{id}
   * @secure
   * @response `200` `(ResourceDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceDto`
   */
  export namespace GetResource {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceDto;
  }

  /**
   * No description
   * @tags Catalog — Resources
   * @name UpdateResource
   * @summary Update a resource
   * @request PATCH:/api/v1/resources/{id}
   * @secure
   * @response `200` `(ResourceDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceDto`
   */
  export namespace UpdateResource {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateResourceDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceDto;
  }

  /**
 * @description Prices are integer millimes HT; VAT in basis points.
 * @tags Catalog — Resource Rates
 * @name ListResourceRates
 * @summary List resource rates
 * @request GET:/api/v1/resource-rates
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceRateDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListResourceRates {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** @format uuid */
      resourceId?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<ResourceRateDto>;
    };
  }

  /**
   * @description One rate per (resource, rateType, audience). The rate type must match the resource type's booking mode.
   * @tags Catalog — Resource Rates
   * @name CreateResourceRate
   * @summary Create a resource rate
   * @request POST:/api/v1/resource-rates
   * @secure
   * @response `201` `(ResourceRateDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceRateDto`
   */
  export namespace CreateResourceRate {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateResourceRateDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceRateDto;
  }

  /**
   * No description
   * @tags Catalog — Resource Rates
   * @name GetResourceRate
   * @summary Get a resource rate
   * @request GET:/api/v1/resource-rates/{id}
   * @secure
   * @response `200` `(ResourceRateDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceRateDto`
   */
  export namespace GetResourceRate {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceRateDto;
  }

  /**
   * No description
   * @tags Catalog — Resource Rates
   * @name UpdateResourceRate
   * @summary Update a resource rate (price/VAT only)
   * @request PATCH:/api/v1/resource-rates/{id}
   * @secure
   * @response `200` `(ResourceRateDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceRateDto`
   */
  export namespace UpdateResourceRate {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateResourceRateDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceRateDto;
  }

  /**
 * @description Staff and members see active, non-hidden plans only; admins see everything and may filter by `status`. Benefits are embedded. Prices are integer millimes HT; VAT in basis points.
 * @tags Catalog — Plans
 * @name ListPlans
 * @summary List plans
 * @request GET:/api/v1/plans
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<PlanDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListPlans {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** Admin-only filter; ignored for other roles. */
      status?: PlanStatus;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<PlanDto>;
    };
  }

  /**
   * @description Plan and benefits are persisted in a single transaction. Credit benefits require amount + renewal; entitlements/amenities must not define them; resourceTypeId only scopes room_hour credits.
   * @tags Catalog — Plans
   * @name CreatePlan
   * @summary Create a plan with nested benefits
   * @request POST:/api/v1/plans
   * @secure
   * @response `201` `(PlanDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `PlanDto`
   */
  export namespace CreatePlan {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreatePlanDto;
    export type RequestHeaders = {};
    export type ResponseBody = PlanDto;
  }

  /**
   * No description
   * @tags Catalog — Plans
   * @name GetPlan
   * @summary Get a plan
   * @request GET:/api/v1/plans/{id}
   * @secure
   * @response `200` `(PlanDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `PlanDto`
   */
  export namespace GetPlan {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PlanDto;
  }

  /**
   * @description ⚠ When price, VAT, deposit, kind/cycle or benefits change on a plan that has memberships, the plan is ARCHIVED and an active clone carrying the changes is returned — the response then has a DIFFERENT id than the request. Existing memberships keep their snapshot of the archived terms. Cosmetic edits (name, description, hidden, cancellationDays, code) always edit in place. Archived plans are immutable (409).
   * @tags Catalog — Plans
   * @name UpdatePlan
   * @summary Update a plan (archive+clone when in use)
   * @request PATCH:/api/v1/plans/{id}
   * @secure
   * @response `200` `(PlanDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `PlanDto`
   */
  export namespace UpdatePlan {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdatePlanDto;
    export type RequestHeaders = {};
    export type ResponseBody = PlanDto;
  }

  /**
 * @description Staff/admin billing screen. Filter by customer, kind and `uninvoiced=true` (what the next invoice would pick up).
 * @tags Billing
 * @name ListCharges
 * @summary List charges
 * @request GET:/api/v1/charges
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ChargeDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListCharges {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** @format uuid */
      memberId?: string;
      /** @format uuid */
      companyId?: string;
      kind?: ChargeKind;
      uninvoiced?: boolean;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<ChargeDto>;
    };
  }

  /**
   * @description plan_fee, deposit and booking charges are flow-generated and cannot be created here. Negative amounts are credit-note lines.
   * @tags Billing
   * @name CreateCharge
   * @summary Create a manual charge (one_off / store)
   * @request POST:/api/v1/charges
   * @secure
   * @response `201` `(ChargeDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ChargeDto`
   */
  export namespace CreateCharge {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateChargeDto;
    export type RequestHeaders = {};
    export type ResponseBody = ChargeDto;
  }

  /**
 * @description Staff/admin see all (filters status/customer); member-role callers see their own and their employer company's invoices. Each result embeds its frozen charge lines and payment progress.
 * @tags Billing
 * @name ListInvoices
 * @summary List invoices
 * @request GET:/api/v1/invoices
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<InvoiceDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListInvoices {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      status?: InvoiceStatus;
      /** @format uuid */
      memberId?: string;
      /** @format uuid */
      companyId?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<InvoiceDto>;
    };
  }

  /**
   * @description Claims the given chargeIds — or ALL uninvoiced charges of the customer — race-safely, freezes HT/VAT/TTC totals (VAT rounded per line) and draws the next sequential HS-YYYY-NNNN number. A negative selection produces a credit note. Invoices are born issued (status sent).
   * @tags Billing
   * @name CreateInvoice
   * @summary Issue an invoice (§6.4)
   * @request POST:/api/v1/invoices
   * @secure
   * @response `201` `(InvoiceDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `InvoiceDto`
   */
  export namespace CreateInvoice {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateInvoiceDto;
    export type RequestHeaders = {};
    export type ResponseBody = InvoiceDto;
  }

  /**
   * No description
   * @tags Billing
   * @name GetInvoice
   * @summary Get an invoice
   * @request GET:/api/v1/invoices/{id}
   * @secure
   * @response `200` `(InvoiceDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `InvoiceDto`
   */
  export namespace GetInvoice {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InvoiceDto;
  }

  /**
   * @description Requires zero recorded payments. The invoice’s charges are released back to uninvoiced so they can be re-invoiced.
   * @tags Billing
   * @name VoidInvoice
   * @summary Admin only (§5) — enforced by the roles list, not just permissions.
   * @request POST:/api/v1/invoices/{id}/void
   * @secure
   * @response `200` `(InvoiceDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `InvoiceDto`
   */
  export namespace VoidInvoice {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InvoiceDto;
  }

  /**
   * @description Payments accumulate; when Σ payments ≥ the TTC total the invoice flips to paid. recorded_by is the calling staff user, resolved server-side.
   * @tags Billing
   * @name RecordPayment
   * @summary Record a payment against an invoice
   * @request POST:/api/v1/invoices/{id}/payments
   * @secure
   * @response `201` `(RecordPaymentResultDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `((ResponseErrorDto))` 409
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `RecordPaymentResultDto`
   */
  export namespace RecordPayment {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = CreatePaymentDto;
    export type RequestHeaders = {};
    export type ResponseBody = RecordPaymentResultDto;
  }

  /**
 * @description Staff/admin only. `status` filters the derived lifecycle; `expiringBefore` matches ends_at ≤ date (renewal follow-ups).
 * @tags Memberships
 * @name ListMemberships
 * @summary List memberships
 * @request GET:/api/v1/memberships
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<MembershipDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListMemberships {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** Filters on the DERIVED status via date conditions. */
      status?: MembershipStatus;
      /** @format uuid */
      planId?: string;
      /**
       * Memberships whose ends_at falls on or before this date.
       * @example "2026-09-01"
       */
      expiringBefore?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<MembershipDto>;
    };
  }

  /**
   * @description Single transaction: validates the customer (member XOR company), snapshots the plan + benefits, grants initial credits (with expiry), writes the plan_fee (and deposit) charge. Status is active when startsAt ≤ today, else pending.
   * @tags Memberships
   * @name CreateMembership
   * @summary Create a membership (§6.1)
   * @request POST:/api/v1/memberships
   * @secure
   * @response `201` `(MembershipDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipDto`
   */
  export namespace CreateMembership {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateMembershipDto;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipDto;
  }

  /**
   * @description Members reach only memberships held by themselves or their employer company. planSnapshot carries the contractual terms.
   * @tags Memberships
   * @name GetMembership
   * @summary Get a membership
   * @request GET:/api/v1/memberships/{id}
   * @secure
   * @response `200` `(MembershipDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `(ResponseErrorDto)` Forbidden
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipDto`
   */
  export namespace GetMembership {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipDto;
  }

  /**
   * @description Balances per credit type (FIFO, expiry-aware) plus the full transaction history. Members reach only their own memberships.
   * @tags Memberships
   * @name GetMembershipCredits
   * @summary Credit balances and ledger of a membership
   * @request GET:/api/v1/memberships/{id}/credits
   * @secure
   * @response `200` `void` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `(ResponseErrorDto)` Forbidden
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `void`
   */
  export namespace GetMembershipCredits {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * @description Sets cancelled_at = today and ends_at per the SNAPSHOT's cancellationDays notice period. The membership stays active until ends_at passes.
   * @tags Memberships
   * @name CancelMembership
   * @summary Cancel a membership
   * @request POST:/api/v1/memberships/{id}/cancel
   * @secure
   * @response `200` `(MembershipDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipDto`
   */
  export namespace CancelMembership {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipDto;
  }

  /**
   * @description Cycles are anchored to starts_at. Grants the per-cycle credits (expiring at the cycle's end) and writes the cycle's plan_fee charge. Recurring plans only.
   * @tags Memberships
   * @name RenewMembership
   * @summary Renew the next billing cycle
   * @request POST:/api/v1/memberships/{id}/renew
   * @secure
   * @response `200` `(MembershipDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipDto`
   */
  export namespace RenewMembership {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipDto;
  }

  /**
   * @description Resolves JWT → user → linked member and returns the member, all memberships benefiting them (own + employer company) and credit balances of the active ones. Users with no linked member (e.g. staff) get 404 no_linked_member.
   * @tags Me
   * @name GetMe
   * @summary Current member portal home
   * @request GET:/api/v1/me
   * @secure
   * @response `200` `(MeDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MeDto`
   */
  export namespace GetMe {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MeDto;
  }

  /**
   * @description QR flow: the static QR at the door opens the portal page, which calls this endpoint with the member’s own token (method=qr; memberId omitted). Staff check any member in (method=manual) and may force `visitor`/`trial`. Authorization walks §6.2 in order: 24/7 entitlement → business-hours entitlement → half-day credit (consumed FIFO, atomic with the check-in; a same-half-day return consumes nothing) → forced → precise denial.
   * @tags Attendance
   * @name CheckIn
   * @summary Check a member in (§6.2 authorization)
   * @request POST:/api/v1/checkins
   * @secure
   * @response `201` `(CheckinDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CheckinDto`
   */
  export namespace CheckIn {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCheckinDto;
    export type RequestHeaders = {};
    export type ResponseBody = CheckinDto;
  }

  /**
 * @description Staff/admin only. Filter by from/to/memberId.
 * @tags Attendance
 * @name ListCheckins
 * @summary List check-ins
 * @request GET:/api/v1/checkins
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<CheckinDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListCheckins {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** @example "2026-07-01T00:00:00Z" */
      from?: string;
      /** @example "2026-07-31T23:59:59Z" */
      to?: string;
      /** @format uuid */
      memberId?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<CheckinDto>;
    };
  }

  /**
   * No description
   * @tags Attendance
   * @name CheckOut
   * @summary Check out (close the presence interval)
   * @request POST:/api/v1/checkins/{id}/checkout
   * @secure
   * @response `200` `(CheckinDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CheckinDto`
   */
  export namespace CheckOut {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckinDto;
  }

  /**
   * @description Hourly buckets of concurrent presence intervals (open check-ins count until now) against the location’s active hot-desk capacity. granularity=day returns per-day PEAK hourly concurrency plus total check-ins. Bookable-room utilization arrives with Phase 4 bookings.
   * @tags Attendance
   * @name GetOccupancy
   * @summary Occupancy: concurrent check-ins vs hot-desk capacity
   * @request GET:/api/v1/attendance/occupancy
   * @secure
   * @response `200` `(OccupancyBucketDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `Array<OccupancyBucketDto>`
   */
  export namespace GetOccupancy {
    export type RequestParams = {};
    export type RequestQuery = {
      /** @example "2026-07-13T00:00:00Z" */
      from: string;
      /** @example "2026-07-13T23:59:59Z" */
      to: string;
      /** @default "hour" */
      granularity?: "hour" | "day";
      /** @format uuid */
      locationId?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OccupancyBucketDto;
  }

  /**
 * @description Staff/admin see everything; member-role callers see their own and their employer company's bookings. Filters: resourceId, from, to (interval overlap).
 * @tags Bookings
 * @name ListBookings
 * @summary List bookings
 * @request GET:/api/v1/bookings
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<BookingDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListBookings {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** @format uuid */
      resourceId?: string;
      /** @example "2026-07-01T00:00:00Z" */
      from?: string;
      /** @example "2026-07-31T23:59:59Z" */
      to?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<BookingDto>;
    };
  }

  /**
   * @description Members book for themselves (source=portal); staff book for any member XOR company (source=staff). Pricing: room_hour credits first (scope from membership snapshots, drained soonest-expiring first), remainder at the member rate — or the visitor rate without a membership. price_ht_millimes is NULL when fully credit-covered. Conflicts are impossible at the database level (GiST exclusion constraint).
   * @tags Bookings
   * @name CreateBooking
   * @summary Create a booking (§6.3 credit-first pricing)
   * @request POST:/api/v1/bookings
   * @secure
   * @response `201` `(BookingDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingDto`
   */
  export namespace CreateBooking {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateBookingDto;
    export type RequestHeaders = {};
    export type ResponseBody = BookingDto;
  }

  /**
   * No description
   * @tags Bookings
   * @name GetBooking
   * @summary Get a booking
   * @request GET:/api/v1/bookings/{id}
   * @secure
   * @response `200` `(BookingDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingDto`
   */
  export namespace GetBooking {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BookingDto;
  }

  /**
   * @description Metadata only — rescheduling is cancel + rebook. Members may edit inside the cancellation window; staff may flag no_show after the start time.
   * @tags Bookings
   * @name UpdateBooking
   * @summary Update booking metadata (title/notes; staff: no_show)
   * @request PATCH:/api/v1/bookings/{id}
   * @secure
   * @response `200` `(BookingDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingDto`
   */
  export namespace UpdateBooking {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateBookingDto;
    export type RequestHeaders = {};
    export type ResponseBody = BookingDto;
  }

  /**
   * @description Runs the exact create pipeline (validation + §6.3 pricing) and returns the quote — units, credits covered, remainder price and TTC total — without booking anything. The portal pre-flight; create re-computes the quote server-side.
   * @tags Bookings
   * @name ValidateBooking
   * @summary Validate a booking (dry-run quote, nothing persisted)
   * @request POST:/api/v1/bookings/validate
   * @secure
   * @response `200` `(BookingQuoteDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingQuoteDto`
   */
  export namespace ValidateBooking {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateBookingDto;
    export type RequestHeaders = {};
    export type ResponseBody = BookingQuoteDto;
  }

  /**
   * @description Staff cancel anytime; members while now < startsAt − the resource's cancellationHours. The booking’s consumed credits are restored (the linked ledger rows are removed) and its charge is deleted when not yet invoiced. Cancelled bookings free the slot.
   * @tags Bookings
   * @name CancelBooking
   * @summary Cancel a booking (refunds credits, voids uninvoiced charge)
   * @request POST:/api/v1/bookings/{id}/cancel
   * @secure
   * @response `200` `(BookingDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `(ResponseErrorDto)` Forbidden
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingDto`
   */
  export namespace CancelBooking {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BookingDto;
  }

  /**
   * @description Staff-only. Re-checks availability, prices the booking per §6.3 (typically the visitor rate → a booking charge) and flips it to confirmed — from then on it blocks the slot.
   * @tags Bookings
   * @name ConfirmBooking
   * @summary Staff confirmation of website booking requests (Phase 6).
   * @request POST:/api/v1/bookings/{id}/confirm
   * @secure
   * @response `200` `(BookingDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingDto`
   */
  export namespace ConfirmBooking {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BookingDto;
  }

  /**
   * @description Bookable windows per day (booking_times, falling back to the location opening hours, minus closed days) plus confirmed busy intervals clipped to the range (≤ 31 days). Clients render free slots; the server re-validates at create time.
   * @tags Bookings
   * @name GetResourceAvailability
   * @summary Resource availability (windows + busy intervals)
   * @request GET:/api/v1/resources/{id}/availability
   * @secure
   * @response `200` `(AvailabilityDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AvailabilityDto`
   */
  export namespace GetResourceAvailability {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {
      /** @example "2026-07-13T00:00:00Z" */
      from: string;
      /** @example "2026-07-19T23:59:59Z" */
      to: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AvailabilityDto;
  }

  /**
 * @description Pipeline view. Filter by stage, interest, memberId.
 * @tags CRM
 * @name ListOpportunities
 * @summary List opportunities
 * @request GET:/api/v1/opportunities
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<OpportunityDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListOpportunities {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      stage?: OpportunityStage;
      interest?: OpportunityInterest;
      /** @format uuid */
      memberId?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<OpportunityDto>;
    };
  }

  /**
   * @description Always attached to a member record (leads are members with kind_hint=lead). The website booking-request flow also creates opportunities automatically.
   * @tags CRM
   * @name CreateOpportunity
   * @summary Create an opportunity
   * @request POST:/api/v1/opportunities
   * @secure
   * @response `201` `(OpportunityDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `OpportunityDto`
   */
  export namespace CreateOpportunity {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateOpportunityDto;
    export type RequestHeaders = {};
    export type ResponseBody = OpportunityDto;
  }

  /**
   * @description Moving the stage to won/lost stamps closedAt; moving it back out clears it.
   * @tags CRM
   * @name UpdateOpportunity
   * @summary Update an opportunity
   * @request PATCH:/api/v1/opportunities/{id}
   * @secure
   * @response `200` `(OpportunityDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `OpportunityDto`
   */
  export namespace UpdateOpportunity {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateOpportunityDto;
    export type RequestHeaders = {};
    export type ResponseBody = OpportunityDto;
  }

  /**
   * @description Same engine as /attendance/occupancy, gated to the owner: concurrent check-ins vs hot-desk capacity per hour/day.
   * @tags Analytics
   * @name AnalyticsOccupancy
   * @summary Occupancy analytics (admin)
   * @request GET:/api/v1/analytics/occupancy
   * @secure
   * @response `200` `(OccupancyBucketDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `Array<OccupancyBucketDto>`
   */
  export namespace AnalyticsOccupancy {
    export type RequestParams = {};
    export type RequestQuery = {
      /** @example "2026-07-13T00:00:00Z" */
      from: string;
      /** @example "2026-07-13T23:59:59Z" */
      to: string;
      /** @default "hour" */
      granularity?: "hour" | "day";
      /** @format uuid */
      locationId?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OccupancyBucketDto;
  }

  /**
   * @description HT/VAT/TTC sums in millimes. group_by=plan buckets membership-linked charges by their snapshot plan name; other charges by kind.
   * @tags Analytics
   * @name AnalyticsRevenue
   * @summary Revenue by month or plan (accrual over charges)
   * @request GET:/api/v1/analytics/revenue
   * @secure
   * @response `200` `(RevenueBucketDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `Array<RevenueBucketDto>`
   */
  export namespace AnalyticsRevenue {
    export type RequestParams = {};
    export type RequestQuery = {
      /** @example "2026-01-01" */
      from: string;
      /** @example "2026-12-31" */
      to: string;
      /** @default "month" */
      groupBy?: "month" | "plan";
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RevenueBucketDto;
  }

  /**
   * No description
   * @tags Analytics
   * @name AnalyticsMemberships
   * @summary Membership KPIs: active by plan, expiring, churn cohorts
   * @request GET:/api/v1/analytics/memberships
   * @secure
   * @response `200` `(MembershipAnalyticsDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipAnalyticsDto`
   */
  export namespace AnalyticsMemberships {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * @min 1
       * @max 365
       * @default 30
       */
      expiringWithinDays?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipAnalyticsDto;
  }

  /**
   * @description Active, non-hidden plans. Server-to-server only.
   * @tags Public (website)
   * @name PublicListPlans
   * @summary Plans for the website pricing page
   * @request GET:/api/v1/public/plans
   * @response `200` `(PublicPlanDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   */
  export namespace PublicListPlans {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = PublicPlanDto;
  }

  /**
   * @description Meeting room only (§5). Bookable windows + busy intervals.
   * @tags Public (website)
   * @name PublicResourceAvailability
   * @summary Meeting-room availability for the website
   * @request GET:/api/v1/public/resources/{id}/availability
   * @response `200` `(AvailabilityDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   */
  export namespace PublicResourceAvailability {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {
      /** @example "2026-07-13T00:00:00Z" */
      from: string;
      /** @example "2026-07-19T23:59:59Z" */
      to: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = AvailabilityDto;
  }

  /**
   * @description Creates member (visitor) + PENDING booking + opportunity in one transaction; staff confirms (and prices) later. Identity comes only from the body — no user account involved.
   * @tags Public (website)
   * @name PublicCreateBookingRequest
   * @summary Website booking request
   * @request POST:/api/v1/public/booking-requests
   * @response `201` `(BookingRequestResultDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   */
  export namespace PublicCreateBookingRequest {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateBookingRequestDto;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = BookingRequestResultDto;
  }

  /**
 * No description
 * @tags Health
 * @name HealthCheckerControllerCheckDatabase
 * @request GET:/api/health/database
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
*/
  export namespace HealthCheckerControllerCheckDatabase {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      /** @example "ok" */
      status?: string;
      /** @example {"database":{"status":"up"}} */
      info?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {} */
      error?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {"database":{"status":"up"}} */
      details?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
    };
  }

  /**
 * No description
 * @tags Health
 * @name HealthCheckerControllerCheckSupabase
 * @request GET:/api/health/supabase
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
*/
  export namespace HealthCheckerControllerCheckSupabase {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      /** @example "ok" */
      status?: string;
      /** @example {"database":{"status":"up"}} */
      info?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {} */
      error?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {"database":{"status":"up"}} */
      details?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
    };
  }

  /**
 * No description
 * @tags Health
 * @name HealthCheckerControllerCheckMonitoring
 * @request GET:/api/health/monitoring
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
*/
  export namespace HealthCheckerControllerCheckMonitoring {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      /** @example "ok" */
      status?: string;
      /** @example {"database":{"status":"up"}} */
      info?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {} */
      error?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {"database":{"status":"up"}} */
      details?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
    };
  }

  /**
 * No description
 * @tags Health
 * @name HealthCheckerControllerCheckInstance
 * @request GET:/api/health/instance
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
*/
  export namespace HealthCheckerControllerCheckInstance {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      /** @example "ok" */
      status?: string;
      /** @example {"database":{"status":"up"}} */
      info?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {} */
      error?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {"database":{"status":"up"}} */
      details?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
    };
  }
}

export namespace Health {
  /**
 * No description
 * @tags Health
 * @name HealthCheckerControllerCheck
 * @request GET:/health
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
*/
  export namespace HealthCheckerControllerCheck {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      /** @example "ok" */
      status?: string;
      /** @example {"database":{"status":"up"}} */
      info?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {} */
      error?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {"database":{"status":"up"}} */
      details?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
    };
  }
}

/**
 * @title Platform Api
 * @version 0.0.1
 * @baseUrl /
 * @contact
 *
 * Service for managing hyperspace operations
 */
export class HsService<SecurityDataType extends unknown> {
  http: HttpClient<SecurityDataType>;

  constructor(http: HttpClient<SecurityDataType>) {
    this.http = http;
  }

  /**
   * No description
   *
   * @tags App
   * @name AppControllerAppInfo
   * @request GET:/
   * @response `default` `object`
   */
  appControllerAppInfo = (params: RequestParams = {}) =>
    this.http.request<any, object>({
      path: `/`,
      method: "GET",
      ...params,
    });

  api = {
    /**
     * @description Sends a 6-digit OTP to the provided email. Works for both new and existing users — Supabase creates the account on first use.
     *
     * @tags Auth (Deprecated)
     * @name RequestEmailOtp
     * @summary Request an Email OTP (sign-in or sign-up)
     * @request POST:/api/v1/auth/otp/request
     * @response `200` `(OtpRequestedDto)` 200
     * @response `400` `(ResponseErrorDto)` Bad Request
     * @response `403` `(ResponseErrorDto)` Rejected outside development
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `OtpRequestedDto`
     */
    requestEmailOtp: (data: RegisterDto, params: RequestParams = {}) =>
      this.http.request<OtpRequestedDto, ResponseErrorDto | OtpRequestedDto>({
        path: `/api/v1/auth/otp/request`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Validates the OTP and returns access + refresh tokens on success.
     *
     * @tags Auth (Deprecated)
     * @name VerifyEmailOtp
     * @summary Verify Email OTP and obtain tokens
     * @request POST:/api/v1/auth/otp/verify
     * @response `200` `(AuthTokensDto)` 200
     * @response `400` `(ResponseErrorDto)` Bad Request
     * @response `401` `((ResponseErrorDto))` 401
     * @response `403` `(ResponseErrorDto)` Rejected outside development
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `AuthTokensDto`
     */
    verifyEmailOtp: (data: VerifyOtpDto, params: RequestParams = {}) =>
      this.http.request<AuthTokensDto, ResponseErrorDto | ResponseErrorDto | AuthTokensDto>({
        path: `/api/v1/auth/otp/verify`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Invalidates the current Supabase session server-side.
     *
     * @tags Auth (Deprecated)
     * @name SignOut
     * @summary Sign out and revoke session
     * @request POST:/api/v1/auth/sign-out
     * @secure
     * @response `204` `void` 204
     * @response `401` `((ResponseErrorDto))` 401
     * @response `403` `(ResponseErrorDto)` Rejected outside development
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `void`
     */
    signOut: (params: RequestParams = {}) =>
      this.http.request<void, ResponseErrorDto | ResponseErrorDto | void>({
        path: `/api/v1/auth/sign-out`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
 * @description Paginated list of locations. `q` filters by name.
 *
 * @tags Locations
 * @name ListLocations
 * @summary List locations
 * @request GET:/api/v1/locations
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<LocationDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listLocations: (query: ListLocationsParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<LocationDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/locations`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Opening hours, closed days, address and timezone are runtime configuration — they can be changed at any time via PATCH.
     *
     * @tags Locations
     * @name CreateLocation
     * @summary Create a location
     * @request POST:/api/v1/locations
     * @secure
     * @response `201` `(LocationDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `LocationDto`
     */
    createLocation: (data: CreateLocationDto, params: RequestParams = {}) =>
      this.http.request<LocationDto, ResponseErrorDto | ResponseErrorDto | LocationDto>({
        path: `/api/v1/locations`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Locations
     * @name GetLocation
     * @summary Get a location
     * @request GET:/api/v1/locations/{id}
     * @secure
     * @response `200` `(LocationDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `LocationDto`
     */
    getLocation: (id: string, params: RequestParams = {}) =>
      this.http.request<LocationDto, ResponseErrorDto | ResponseErrorDto | LocationDto>({
        path: `/api/v1/locations/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Locations
     * @name UpdateLocation
     * @summary Update a location
     * @request PATCH:/api/v1/locations/{id}
     * @secure
     * @response `200` `(LocationDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `LocationDto`
     */
    updateLocation: (id: string, data: UpdateLocationDto, params: RequestParams = {}) =>
      this.http.request<LocationDto, ResponseErrorDto | ResponseErrorDto | LocationDto>({
        path: `/api/v1/locations/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Paginated list. `q` fuzzy-matches name/email; `name` is exact-match.
 *
 * @tags Companies
 * @name ListCompanies
 * @summary List companies
 * @request GET:/api/v1/companies
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<CompanyDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listCompanies: (query: ListCompaniesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<CompanyDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/companies`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Companies
     * @name CreateCompany
     * @summary Create a company
     * @request POST:/api/v1/companies
     * @secure
     * @response `201` `(CompanyDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CompanyDto`
     */
    createCompany: (data: CreateCompanyDto, params: RequestParams = {}) =>
      this.http.request<CompanyDto, ResponseErrorDto | ResponseErrorDto | CompanyDto>({
        path: `/api/v1/companies`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Companies
     * @name GetCompany
     * @summary Get a company
     * @request GET:/api/v1/companies/{id}
     * @secure
     * @response `200` `(CompanyDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CompanyDto`
     */
    getCompany: (id: string, params: RequestParams = {}) =>
      this.http.request<CompanyDto, ResponseErrorDto | ResponseErrorDto | CompanyDto>({
        path: `/api/v1/companies/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Companies
     * @name UpdateCompany
     * @summary Update a company
     * @request PATCH:/api/v1/companies/{id}
     * @secure
     * @response `200` `(CompanyDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CompanyDto`
     */
    updateCompany: (id: string, data: UpdateCompanyDto, params: RequestParams = {}) =>
      this.http.request<CompanyDto, ResponseErrorDto | ResponseErrorDto | CompanyDto>({
        path: `/api/v1/companies/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Paginated list. `q` fuzzy-matches name/email/phone; `email` is exact-match; filter by `kindHint` and `companyId`. The `status` field on each result is derived, never stored.
 *
 * @tags Members
 * @name ListMembers
 * @summary List members
 * @request GET:/api/v1/members
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<MemberDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listMembers: (query: ListMembersParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<MemberDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/members`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description kindHint defaults to `lead` — the CRM entry point.
     *
     * @tags Members
     * @name CreateMember
     * @summary Create a member
     * @request POST:/api/v1/members
     * @secure
     * @response `201` `(MemberDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MemberDto`
     */
    createMember: (data: CreateMemberDto, params: RequestParams = {}) =>
      this.http.request<MemberDto, ResponseErrorDto | ResponseErrorDto | MemberDto>({
        path: `/api/v1/members`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff and admins can fetch any member; a member-role caller can only fetch the member record linked to their account.
     *
     * @tags Members
     * @name GetMember
     * @summary Get a member
     * @request GET:/api/v1/members/{id}
     * @secure
     * @response `200` `(MemberDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `(ResponseErrorDto)` Forbidden
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MemberDto`
     */
    getMember: (id: string, params: RequestParams = {}) =>
      this.http.request<MemberDto, ResponseErrorDto | MemberDto>({
        path: `/api/v1/members/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff/admin may update all business fields. A member-role caller may only update their own record, restricted to fullName, email and phone — any other field is rejected with 403. The user link (portal access) is never updatable here; it belongs to the invite/claim flow.
     *
     * @tags Members
     * @name UpdateMember
     * @summary Update a member
     * @request PATCH:/api/v1/members/{id}
     * @secure
     * @response `200` `(MemberDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `(ResponseErrorDto)` Forbidden
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MemberDto`
     */
    updateMember: (id: string, data: UpdateMemberDto, params: RequestParams = {}) =>
      this.http.request<MemberDto, ResponseErrorDto | MemberDto>({
        path: `/api/v1/members/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Provisions the Supabase identity (public signup is disabled) and returns a single-use claim token valid for 7 days. Deliver the token to the customer out-of-band. Re-inviting regenerates the token and invalidates the previous one.
     *
     * @tags Members
     * @name InviteMember
     * @summary Issue a portal-access invite for a member
     * @request POST:/api/v1/members/{id}/invite
     * @secure
     * @response `201` `(InviteResponseDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `InviteResponseDto`
     */
    inviteMember: (id: string, params: RequestParams = {}) =>
      this.http.request<InviteResponseDto, ResponseErrorDto | ResponseErrorDto | InviteResponseDto>({
        path: `/api/v1/members/${id}/invite`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Clears the user link and revokes the member role. The member record and all its history remain intact.
     *
     * @tags Members
     * @name UnlinkMember
     * @summary Revoke portal access
     * @request DELETE:/api/v1/members/{id}/portal-access
     * @secure
     * @response `204` `void` 204
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `void`
     */
    unlinkMember: (id: string, params: RequestParams = {}) =>
      this.http.request<void, ResponseErrorDto | ResponseErrorDto | void>({
        path: `/api/v1/members/${id}/portal-access`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Links the CALLING user to the invited member, grants the `member` role and consumes the token — the explicit token is the only linking path; email equality never links (§6.5).
     *
     * @tags Me
     * @name ClaimMember
     * @summary Claim portal access with an invite token
     * @request POST:/api/v1/me/claim
     * @secure
     * @response `200` `(MemberDto)` 200
     * @response `401` `((ResponseErrorDto))` 401
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MemberDto`
     */
    claimMember: (data: ClaimMemberDto, params: RequestParams = {}) =>
      this.http.request<MemberDto, ResponseErrorDto | ResponseErrorDto | MemberDto>({
        path: `/api/v1/me/claim`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Catalog — Resource Types
 * @name ListResourceTypes
 * @summary List resource types
 * @request GET:/api/v1/resource-types
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceTypeDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listResourceTypes: (query: ListResourceTypesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<ResourceTypeDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/resource-types`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Resource Types
     * @name CreateResourceType
     * @summary Create a resource type
     * @request POST:/api/v1/resource-types
     * @secure
     * @response `201` `(ResourceTypeDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceTypeDto`
     */
    createResourceType: (data: CreateResourceTypeDto, params: RequestParams = {}) =>
      this.http.request<ResourceTypeDto, ResponseErrorDto | ResponseErrorDto | ResourceTypeDto>({
        path: `/api/v1/resource-types`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Resource Types
     * @name GetResourceType
     * @summary Get a resource type
     * @request GET:/api/v1/resource-types/{id}
     * @secure
     * @response `200` `(ResourceTypeDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceTypeDto`
     */
    getResourceType: (id: string, params: RequestParams = {}) =>
      this.http.request<ResourceTypeDto, ResponseErrorDto | ResponseErrorDto | ResourceTypeDto>({
        path: `/api/v1/resource-types/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Resource Types
     * @name UpdateResourceType
     * @summary Update a resource type
     * @request PATCH:/api/v1/resource-types/{id}
     * @secure
     * @response `200` `(ResourceTypeDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceTypeDto`
     */
    updateResourceType: (id: string, data: UpdateResourceTypeDto, params: RequestParams = {}) =>
      this.http.request<ResourceTypeDto, ResponseErrorDto | ResponseErrorDto | ResourceTypeDto>({
        path: `/api/v1/resource-types/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Admins see all resources; staff and members see only non-hidden ones. Filter by locationId / resourceTypeId; `q` matches the name.
 *
 * @tags Catalog — Resources
 * @name ListResources
 * @summary List resources
 * @request GET:/api/v1/resources
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listResources: (query: ListResourcesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<ResourceDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/resources`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Capacity, booking windows, durations and cancellation policy are runtime configuration, editable at any time via PATCH.
     *
     * @tags Catalog — Resources
     * @name CreateResource
     * @summary Create a resource
     * @request POST:/api/v1/resources
     * @secure
     * @response `201` `(ResourceDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceDto`
     */
    createResource: (data: CreateResourceDto, params: RequestParams = {}) =>
      this.http.request<ResourceDto, ResponseErrorDto | ResponseErrorDto | ResourceDto>({
        path: `/api/v1/resources`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Resources
     * @name GetResource
     * @summary Get a resource
     * @request GET:/api/v1/resources/{id}
     * @secure
     * @response `200` `(ResourceDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceDto`
     */
    getResource: (id: string, params: RequestParams = {}) =>
      this.http.request<ResourceDto, ResponseErrorDto | ResponseErrorDto | ResourceDto>({
        path: `/api/v1/resources/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Resources
     * @name UpdateResource
     * @summary Update a resource
     * @request PATCH:/api/v1/resources/{id}
     * @secure
     * @response `200` `(ResourceDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceDto`
     */
    updateResource: (id: string, data: UpdateResourceDto, params: RequestParams = {}) =>
      this.http.request<ResourceDto, ResponseErrorDto | ResponseErrorDto | ResourceDto>({
        path: `/api/v1/resources/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Prices are integer millimes HT; VAT in basis points.
 *
 * @tags Catalog — Resource Rates
 * @name ListResourceRates
 * @summary List resource rates
 * @request GET:/api/v1/resource-rates
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceRateDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listResourceRates: (query: ListResourceRatesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<ResourceRateDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/resource-rates`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description One rate per (resource, rateType, audience). The rate type must match the resource type's booking mode.
     *
     * @tags Catalog — Resource Rates
     * @name CreateResourceRate
     * @summary Create a resource rate
     * @request POST:/api/v1/resource-rates
     * @secure
     * @response `201` `(ResourceRateDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceRateDto`
     */
    createResourceRate: (data: CreateResourceRateDto, params: RequestParams = {}) =>
      this.http.request<ResourceRateDto, ResponseErrorDto | ResponseErrorDto | ResourceRateDto>({
        path: `/api/v1/resource-rates`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Resource Rates
     * @name GetResourceRate
     * @summary Get a resource rate
     * @request GET:/api/v1/resource-rates/{id}
     * @secure
     * @response `200` `(ResourceRateDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceRateDto`
     */
    getResourceRate: (id: string, params: RequestParams = {}) =>
      this.http.request<ResourceRateDto, ResponseErrorDto | ResponseErrorDto | ResourceRateDto>({
        path: `/api/v1/resource-rates/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Resource Rates
     * @name UpdateResourceRate
     * @summary Update a resource rate (price/VAT only)
     * @request PATCH:/api/v1/resource-rates/{id}
     * @secure
     * @response `200` `(ResourceRateDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceRateDto`
     */
    updateResourceRate: (id: string, data: UpdateResourceRateDto, params: RequestParams = {}) =>
      this.http.request<ResourceRateDto, ResponseErrorDto | ResponseErrorDto | ResourceRateDto>({
        path: `/api/v1/resource-rates/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff and members see active, non-hidden plans only; admins see everything and may filter by `status`. Benefits are embedded. Prices are integer millimes HT; VAT in basis points.
 *
 * @tags Catalog — Plans
 * @name ListPlans
 * @summary List plans
 * @request GET:/api/v1/plans
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<PlanDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listPlans: (query: ListPlansParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<PlanDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/plans`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Plan and benefits are persisted in a single transaction. Credit benefits require amount + renewal; entitlements/amenities must not define them; resourceTypeId only scopes room_hour credits.
     *
     * @tags Catalog — Plans
     * @name CreatePlan
     * @summary Create a plan with nested benefits
     * @request POST:/api/v1/plans
     * @secure
     * @response `201` `(PlanDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `PlanDto`
     */
    createPlan: (data: CreatePlanDto, params: RequestParams = {}) =>
      this.http.request<PlanDto, ResponseErrorDto | ResponseErrorDto | PlanDto>({
        path: `/api/v1/plans`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Plans
     * @name GetPlan
     * @summary Get a plan
     * @request GET:/api/v1/plans/{id}
     * @secure
     * @response `200` `(PlanDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `PlanDto`
     */
    getPlan: (id: string, params: RequestParams = {}) =>
      this.http.request<PlanDto, ResponseErrorDto | ResponseErrorDto | PlanDto>({
        path: `/api/v1/plans/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description ⚠ When price, VAT, deposit, kind/cycle or benefits change on a plan that has memberships, the plan is ARCHIVED and an active clone carrying the changes is returned — the response then has a DIFFERENT id than the request. Existing memberships keep their snapshot of the archived terms. Cosmetic edits (name, description, hidden, cancellationDays, code) always edit in place. Archived plans are immutable (409).
     *
     * @tags Catalog — Plans
     * @name UpdatePlan
     * @summary Update a plan (archive+clone when in use)
     * @request PATCH:/api/v1/plans/{id}
     * @secure
     * @response `200` `(PlanDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `PlanDto`
     */
    updatePlan: (id: string, data: UpdatePlanDto, params: RequestParams = {}) =>
      this.http.request<PlanDto, ResponseErrorDto | ResponseErrorDto | PlanDto>({
        path: `/api/v1/plans/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff/admin billing screen. Filter by customer, kind and `uninvoiced=true` (what the next invoice would pick up).
 *
 * @tags Billing
 * @name ListCharges
 * @summary List charges
 * @request GET:/api/v1/charges
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ChargeDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listCharges: (query: ListChargesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<ChargeDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/charges`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description plan_fee, deposit and booking charges are flow-generated and cannot be created here. Negative amounts are credit-note lines.
     *
     * @tags Billing
     * @name CreateCharge
     * @summary Create a manual charge (one_off / store)
     * @request POST:/api/v1/charges
     * @secure
     * @response `201` `(ChargeDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ChargeDto`
     */
    createCharge: (data: CreateChargeDto, params: RequestParams = {}) =>
      this.http.request<ChargeDto, ResponseErrorDto | ResponseErrorDto | ChargeDto>({
        path: `/api/v1/charges`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff/admin see all (filters status/customer); member-role callers see their own and their employer company's invoices. Each result embeds its frozen charge lines and payment progress.
 *
 * @tags Billing
 * @name ListInvoices
 * @summary List invoices
 * @request GET:/api/v1/invoices
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<InvoiceDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listInvoices: (query: ListInvoicesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<InvoiceDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/invoices`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Claims the given chargeIds — or ALL uninvoiced charges of the customer — race-safely, freezes HT/VAT/TTC totals (VAT rounded per line) and draws the next sequential HS-YYYY-NNNN number. A negative selection produces a credit note. Invoices are born issued (status sent).
     *
     * @tags Billing
     * @name CreateInvoice
     * @summary Issue an invoice (§6.4)
     * @request POST:/api/v1/invoices
     * @secure
     * @response `201` `(InvoiceDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `InvoiceDto`
     */
    createInvoice: (data: CreateInvoiceDto, params: RequestParams = {}) =>
      this.http.request<InvoiceDto, ResponseErrorDto | ResponseErrorDto | InvoiceDto>({
        path: `/api/v1/invoices`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Billing
     * @name GetInvoice
     * @summary Get an invoice
     * @request GET:/api/v1/invoices/{id}
     * @secure
     * @response `200` `(InvoiceDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `InvoiceDto`
     */
    getInvoice: (id: string, params: RequestParams = {}) =>
      this.http.request<InvoiceDto, ResponseErrorDto | ResponseErrorDto | InvoiceDto>({
        path: `/api/v1/invoices/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Requires zero recorded payments. The invoice’s charges are released back to uninvoiced so they can be re-invoiced.
     *
     * @tags Billing
     * @name VoidInvoice
     * @summary Admin only (§5) — enforced by the roles list, not just permissions.
     * @request POST:/api/v1/invoices/{id}/void
     * @secure
     * @response `200` `(InvoiceDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `InvoiceDto`
     */
    voidInvoice: (id: string, params: RequestParams = {}) =>
      this.http.request<InvoiceDto, ResponseErrorDto | ResponseErrorDto | InvoiceDto>({
        path: `/api/v1/invoices/${id}/void`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Payments accumulate; when Σ payments ≥ the TTC total the invoice flips to paid. recorded_by is the calling staff user, resolved server-side.
     *
     * @tags Billing
     * @name RecordPayment
     * @summary Record a payment against an invoice
     * @request POST:/api/v1/invoices/{id}/payments
     * @secure
     * @response `201` `(RecordPaymentResultDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `((ResponseErrorDto))` 409
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `RecordPaymentResultDto`
     */
    recordPayment: (id: string, data: CreatePaymentDto, params: RequestParams = {}) =>
      this.http.request<RecordPaymentResultDto, ResponseErrorDto | ResponseErrorDto | RecordPaymentResultDto>({
        path: `/api/v1/invoices/${id}/payments`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff/admin only. `status` filters the derived lifecycle; `expiringBefore` matches ends_at ≤ date (renewal follow-ups).
 *
 * @tags Memberships
 * @name ListMemberships
 * @summary List memberships
 * @request GET:/api/v1/memberships
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<MembershipDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listMemberships: (query: ListMembershipsParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<MembershipDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/memberships`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Single transaction: validates the customer (member XOR company), snapshots the plan + benefits, grants initial credits (with expiry), writes the plan_fee (and deposit) charge. Status is active when startsAt ≤ today, else pending.
     *
     * @tags Memberships
     * @name CreateMembership
     * @summary Create a membership (§6.1)
     * @request POST:/api/v1/memberships
     * @secure
     * @response `201` `(MembershipDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipDto`
     */
    createMembership: (data: CreateMembershipDto, params: RequestParams = {}) =>
      this.http.request<MembershipDto, ResponseErrorDto | ResponseErrorDto | MembershipDto>({
        path: `/api/v1/memberships`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Members reach only memberships held by themselves or their employer company. planSnapshot carries the contractual terms.
     *
     * @tags Memberships
     * @name GetMembership
     * @summary Get a membership
     * @request GET:/api/v1/memberships/{id}
     * @secure
     * @response `200` `(MembershipDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `(ResponseErrorDto)` Forbidden
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipDto`
     */
    getMembership: (id: string, params: RequestParams = {}) =>
      this.http.request<MembershipDto, ResponseErrorDto | MembershipDto>({
        path: `/api/v1/memberships/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Balances per credit type (FIFO, expiry-aware) plus the full transaction history. Members reach only their own memberships.
     *
     * @tags Memberships
     * @name GetMembershipCredits
     * @summary Credit balances and ledger of a membership
     * @request GET:/api/v1/memberships/{id}/credits
     * @secure
     * @response `200` `void` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `(ResponseErrorDto)` Forbidden
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `void`
     */
    getMembershipCredits: (id: string, params: RequestParams = {}) =>
      this.http.request<void, ResponseErrorDto | void>({
        path: `/api/v1/memberships/${id}/credits`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Sets cancelled_at = today and ends_at per the SNAPSHOT's cancellationDays notice period. The membership stays active until ends_at passes.
     *
     * @tags Memberships
     * @name CancelMembership
     * @summary Cancel a membership
     * @request POST:/api/v1/memberships/{id}/cancel
     * @secure
     * @response `200` `(MembershipDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipDto`
     */
    cancelMembership: (id: string, params: RequestParams = {}) =>
      this.http.request<MembershipDto, ResponseErrorDto | ResponseErrorDto | MembershipDto>({
        path: `/api/v1/memberships/${id}/cancel`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Cycles are anchored to starts_at. Grants the per-cycle credits (expiring at the cycle's end) and writes the cycle's plan_fee charge. Recurring plans only.
     *
     * @tags Memberships
     * @name RenewMembership
     * @summary Renew the next billing cycle
     * @request POST:/api/v1/memberships/{id}/renew
     * @secure
     * @response `200` `(MembershipDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipDto`
     */
    renewMembership: (id: string, params: RequestParams = {}) =>
      this.http.request<MembershipDto, ResponseErrorDto | ResponseErrorDto | MembershipDto>({
        path: `/api/v1/memberships/${id}/renew`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Resolves JWT → user → linked member and returns the member, all memberships benefiting them (own + employer company) and credit balances of the active ones. Users with no linked member (e.g. staff) get 404 no_linked_member.
     *
     * @tags Me
     * @name GetMe
     * @summary Current member portal home
     * @request GET:/api/v1/me
     * @secure
     * @response `200` `(MeDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MeDto`
     */
    getMe: (params: RequestParams = {}) =>
      this.http.request<MeDto, ResponseErrorDto | MeDto>({
        path: `/api/v1/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description QR flow: the static QR at the door opens the portal page, which calls this endpoint with the member’s own token (method=qr; memberId omitted). Staff check any member in (method=manual) and may force `visitor`/`trial`. Authorization walks §6.2 in order: 24/7 entitlement → business-hours entitlement → half-day credit (consumed FIFO, atomic with the check-in; a same-half-day return consumes nothing) → forced → precise denial.
     *
     * @tags Attendance
     * @name CheckIn
     * @summary Check a member in (§6.2 authorization)
     * @request POST:/api/v1/checkins
     * @secure
     * @response `201` `(CheckinDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CheckinDto`
     */
    checkIn: (data: CreateCheckinDto, params: RequestParams = {}) =>
      this.http.request<CheckinDto, ResponseErrorDto | ResponseErrorDto | CheckinDto>({
        path: `/api/v1/checkins`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff/admin only. Filter by from/to/memberId.
 *
 * @tags Attendance
 * @name ListCheckins
 * @summary List check-ins
 * @request GET:/api/v1/checkins
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<CheckinDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listCheckins: (query: ListCheckinsParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<CheckinDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/checkins`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Attendance
     * @name CheckOut
     * @summary Check out (close the presence interval)
     * @request POST:/api/v1/checkins/{id}/checkout
     * @secure
     * @response `200` `(CheckinDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CheckinDto`
     */
    checkOut: (id: string, params: RequestParams = {}) =>
      this.http.request<CheckinDto, ResponseErrorDto | ResponseErrorDto | CheckinDto>({
        path: `/api/v1/checkins/${id}/checkout`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Hourly buckets of concurrent presence intervals (open check-ins count until now) against the location’s active hot-desk capacity. granularity=day returns per-day PEAK hourly concurrency plus total check-ins. Bookable-room utilization arrives with Phase 4 bookings.
     *
     * @tags Attendance
     * @name GetOccupancy
     * @summary Occupancy: concurrent check-ins vs hot-desk capacity
     * @request GET:/api/v1/attendance/occupancy
     * @secure
     * @response `200` `(OccupancyBucketDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `Array<OccupancyBucketDto>`
     */
    getOccupancy: (query: GetOccupancyParams, params: RequestParams = {}) =>
      this.http.request<OccupancyBucketDto, ResponseErrorDto | ResponseErrorDto | Array<OccupancyBucketDto>>({
        path: `/api/v1/attendance/occupancy`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff/admin see everything; member-role callers see their own and their employer company's bookings. Filters: resourceId, from, to (interval overlap).
 *
 * @tags Bookings
 * @name ListBookings
 * @summary List bookings
 * @request GET:/api/v1/bookings
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<BookingDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listBookings: (query: ListBookingsParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<BookingDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/bookings`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Members book for themselves (source=portal); staff book for any member XOR company (source=staff). Pricing: room_hour credits first (scope from membership snapshots, drained soonest-expiring first), remainder at the member rate — or the visitor rate without a membership. price_ht_millimes is NULL when fully credit-covered. Conflicts are impossible at the database level (GiST exclusion constraint).
     *
     * @tags Bookings
     * @name CreateBooking
     * @summary Create a booking (§6.3 credit-first pricing)
     * @request POST:/api/v1/bookings
     * @secure
     * @response `201` `(BookingDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    createBooking: (data: CreateBookingDto, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | ResponseErrorDto | BookingDto>({
        path: `/api/v1/bookings`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Bookings
     * @name GetBooking
     * @summary Get a booking
     * @request GET:/api/v1/bookings/{id}
     * @secure
     * @response `200` `(BookingDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    getBooking: (id: string, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | ResponseErrorDto | BookingDto>({
        path: `/api/v1/bookings/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Metadata only — rescheduling is cancel + rebook. Members may edit inside the cancellation window; staff may flag no_show after the start time.
     *
     * @tags Bookings
     * @name UpdateBooking
     * @summary Update booking metadata (title/notes; staff: no_show)
     * @request PATCH:/api/v1/bookings/{id}
     * @secure
     * @response `200` `(BookingDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    updateBooking: (id: string, data: UpdateBookingDto, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | ResponseErrorDto | BookingDto>({
        path: `/api/v1/bookings/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Runs the exact create pipeline (validation + §6.3 pricing) and returns the quote — units, credits covered, remainder price and TTC total — without booking anything. The portal pre-flight; create re-computes the quote server-side.
     *
     * @tags Bookings
     * @name ValidateBooking
     * @summary Validate a booking (dry-run quote, nothing persisted)
     * @request POST:/api/v1/bookings/validate
     * @secure
     * @response `200` `(BookingQuoteDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingQuoteDto`
     */
    validateBooking: (data: CreateBookingDto, params: RequestParams = {}) =>
      this.http.request<BookingQuoteDto, ResponseErrorDto | ResponseErrorDto | BookingQuoteDto>({
        path: `/api/v1/bookings/validate`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff cancel anytime; members while now < startsAt − the resource's cancellationHours. The booking’s consumed credits are restored (the linked ledger rows are removed) and its charge is deleted when not yet invoiced. Cancelled bookings free the slot.
     *
     * @tags Bookings
     * @name CancelBooking
     * @summary Cancel a booking (refunds credits, voids uninvoiced charge)
     * @request POST:/api/v1/bookings/{id}/cancel
     * @secure
     * @response `200` `(BookingDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `(ResponseErrorDto)` Forbidden
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    cancelBooking: (id: string, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | BookingDto>({
        path: `/api/v1/bookings/${id}/cancel`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff-only. Re-checks availability, prices the booking per §6.3 (typically the visitor rate → a booking charge) and flips it to confirmed — from then on it blocks the slot.
     *
     * @tags Bookings
     * @name ConfirmBooking
     * @summary Staff confirmation of website booking requests (Phase 6).
     * @request POST:/api/v1/bookings/{id}/confirm
     * @secure
     * @response `200` `(BookingDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    confirmBooking: (id: string, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | ResponseErrorDto | BookingDto>({
        path: `/api/v1/bookings/${id}/confirm`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Bookable windows per day (booking_times, falling back to the location opening hours, minus closed days) plus confirmed busy intervals clipped to the range (≤ 31 days). Clients render free slots; the server re-validates at create time.
     *
     * @tags Bookings
     * @name GetResourceAvailability
     * @summary Resource availability (windows + busy intervals)
     * @request GET:/api/v1/resources/{id}/availability
     * @secure
     * @response `200` `(AvailabilityDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `AvailabilityDto`
     */
    getResourceAvailability: ({ id, ...query }: GetResourceAvailabilityParams, params: RequestParams = {}) =>
      this.http.request<AvailabilityDto, ResponseErrorDto | AvailabilityDto>({
        path: `/api/v1/resources/${id}/availability`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * @description Pipeline view. Filter by stage, interest, memberId.
 *
 * @tags CRM
 * @name ListOpportunities
 * @summary List opportunities
 * @request GET:/api/v1/opportunities
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<OpportunityDto>,

})` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listOpportunities: (query: ListOpportunitiesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<OpportunityDto>;
        },
        ResponseErrorDto | ResponseErrorDto | void
      >({
        path: `/api/v1/opportunities`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Always attached to a member record (leads are members with kind_hint=lead). The website booking-request flow also creates opportunities automatically.
     *
     * @tags CRM
     * @name CreateOpportunity
     * @summary Create an opportunity
     * @request POST:/api/v1/opportunities
     * @secure
     * @response `201` `(OpportunityDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `OpportunityDto`
     */
    createOpportunity: (data: CreateOpportunityDto, params: RequestParams = {}) =>
      this.http.request<OpportunityDto, ResponseErrorDto | ResponseErrorDto | OpportunityDto>({
        path: `/api/v1/opportunities`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Moving the stage to won/lost stamps closedAt; moving it back out clears it.
     *
     * @tags CRM
     * @name UpdateOpportunity
     * @summary Update an opportunity
     * @request PATCH:/api/v1/opportunities/{id}
     * @secure
     * @response `200` `(OpportunityDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `OpportunityDto`
     */
    updateOpportunity: (id: string, data: UpdateOpportunityDto, params: RequestParams = {}) =>
      this.http.request<OpportunityDto, ResponseErrorDto | ResponseErrorDto | OpportunityDto>({
        path: `/api/v1/opportunities/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Same engine as /attendance/occupancy, gated to the owner: concurrent check-ins vs hot-desk capacity per hour/day.
     *
     * @tags Analytics
     * @name AnalyticsOccupancy
     * @summary Occupancy analytics (admin)
     * @request GET:/api/v1/analytics/occupancy
     * @secure
     * @response `200` `(OccupancyBucketDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `Array<OccupancyBucketDto>`
     */
    analyticsOccupancy: (query: AnalyticsOccupancyParams, params: RequestParams = {}) =>
      this.http.request<OccupancyBucketDto, ResponseErrorDto | ResponseErrorDto | Array<OccupancyBucketDto>>({
        path: `/api/v1/analytics/occupancy`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description HT/VAT/TTC sums in millimes. group_by=plan buckets membership-linked charges by their snapshot plan name; other charges by kind.
     *
     * @tags Analytics
     * @name AnalyticsRevenue
     * @summary Revenue by month or plan (accrual over charges)
     * @request GET:/api/v1/analytics/revenue
     * @secure
     * @response `200` `(RevenueBucketDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `Array<RevenueBucketDto>`
     */
    analyticsRevenue: (query: AnalyticsRevenueParams, params: RequestParams = {}) =>
      this.http.request<RevenueBucketDto, ResponseErrorDto | ResponseErrorDto | Array<RevenueBucketDto>>({
        path: `/api/v1/analytics/revenue`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name AnalyticsMemberships
     * @summary Membership KPIs: active by plan, expiring, churn cohorts
     * @request GET:/api/v1/analytics/memberships
     * @secure
     * @response `200` `(MembershipAnalyticsDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipAnalyticsDto`
     */
    analyticsMemberships: (query: AnalyticsMembershipsParams, params: RequestParams = {}) =>
      this.http.request<MembershipAnalyticsDto, ResponseErrorDto | ResponseErrorDto | MembershipAnalyticsDto>({
        path: `/api/v1/analytics/memberships`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Active, non-hidden plans. Server-to-server only.
     *
     * @tags Public (website)
     * @name PublicListPlans
     * @summary Plans for the website pricing page
     * @request GET:/api/v1/public/plans
     * @response `200` `(PublicPlanDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     */
    publicListPlans: (params: RequestParams = {}) =>
      this.http.request<PublicPlanDto, ResponseErrorDto>({
        path: `/api/v1/public/plans`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Meeting room only (§5). Bookable windows + busy intervals.
     *
     * @tags Public (website)
     * @name PublicResourceAvailability
     * @summary Meeting-room availability for the website
     * @request GET:/api/v1/public/resources/{id}/availability
     * @response `200` `(AvailabilityDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     */
    publicResourceAvailability: ({ id, ...query }: PublicResourceAvailabilityParams, params: RequestParams = {}) =>
      this.http.request<AvailabilityDto, ResponseErrorDto>({
        path: `/api/v1/public/resources/${id}/availability`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates member (visitor) + PENDING booking + opportunity in one transaction; staff confirms (and prices) later. Identity comes only from the body — no user account involved.
     *
     * @tags Public (website)
     * @name PublicCreateBookingRequest
     * @summary Website booking request
     * @request POST:/api/v1/public/booking-requests
     * @response `201` `(BookingRequestResultDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     */
    publicCreateBookingRequest: (data: CreateBookingRequestDto, params: RequestParams = {}) =>
      this.http.request<BookingRequestResultDto, ResponseErrorDto>({
        path: `/api/v1/public/booking-requests`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Health
 * @name HealthCheckerControllerCheckDatabase
 * @request GET:/api/health/database
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
 */
    healthCheckerControllerCheckDatabase: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        | {
            /** @example "error" */
            status?: string;
            /** @example {"database":{"status":"up"}} */
            info?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"redis":{"status":"down","message":"Could not connect"}} */
            error?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
            details?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
          }
        | object
      >({
        path: `/api/health/database`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Health
 * @name HealthCheckerControllerCheckSupabase
 * @request GET:/api/health/supabase
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
 */
    healthCheckerControllerCheckSupabase: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        | {
            /** @example "error" */
            status?: string;
            /** @example {"database":{"status":"up"}} */
            info?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"redis":{"status":"down","message":"Could not connect"}} */
            error?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
            details?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
          }
        | object
      >({
        path: `/api/health/supabase`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Health
 * @name HealthCheckerControllerCheckMonitoring
 * @request GET:/api/health/monitoring
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
 */
    healthCheckerControllerCheckMonitoring: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        | {
            /** @example "error" */
            status?: string;
            /** @example {"database":{"status":"up"}} */
            info?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"redis":{"status":"down","message":"Could not connect"}} */
            error?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
            details?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
          }
        | object
      >({
        path: `/api/health/monitoring`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Health
 * @name HealthCheckerControllerCheckInstance
 * @request GET:/api/health/instance
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
 */
    healthCheckerControllerCheckInstance: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        | {
            /** @example "error" */
            status?: string;
            /** @example {"database":{"status":"up"}} */
            info?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"redis":{"status":"down","message":"Could not connect"}} */
            error?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
            details?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
          }
        | object
      >({
        path: `/api/health/instance`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  health = {
    /**
 * No description
 *
 * @tags Health
 * @name HealthCheckerControllerCheck
 * @request GET:/health
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
 */
    healthCheckerControllerCheck: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        | {
            /** @example "error" */
            status?: string;
            /** @example {"database":{"status":"up"}} */
            info?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"redis":{"status":"down","message":"Could not connect"}} */
            error?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
            /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
            details?: Record<
              string,
              {
                status: string;
                [key: string]: any;
              }
            >;
          }
        | object
      >({
        path: `/health`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
