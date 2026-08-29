import type { HttpClient, RequestParams } from "@hscowork/service-generator/runtime";
import { ContentType } from "@hscowork/service-generator/runtime";
import "server-only";

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

/**
 * DERIVED status (OfficeRnD vocabulary) — computed from membership,
 * charge and opportunity data, never stored, never manually set.
 */
export type CompanyStatus = "lead" | "drop-in" | "pending" | "active" | "former" | "inactive";

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
  /** @example "2026-08-01" */
  startDate?: string | null;
  billingName?: string | null;
  registrationNumber?: string | null;
  billingAddress?: AddressDto | null;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  website?: string | null;
  /**
   * DERIVED status (OfficeRnD vocabulary) — computed from membership,
   * charge and opportunity data, never stored, never manually set.
   */
  status: CompanyStatus;
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

export interface CompanyStatusCountDto {
  status: CompanyStatus;
  /** @example 12 */
  count: number;
}

export interface CompanyWeekStatsDto {
  /**
   * Monday of the week, as a business date in Africa/Tunis.
   * @example "2026-08-24"
   */
  week: string;
  /**
   * Companies added that week, by created_at.
   * @example 3
   */
  created: number;
}

export interface CompanyStatsDto {
  /** @example 120 */
  total: number;
  /**
   * Every status, always — a zero reads as empty, a gap reads as broken.
   * Resolved, not grouped: status is derived, not a column.
   */
  byStatus: Array<CompanyStatusCountDto>;
  /**
   * Companies with at least one non-deleted member.
   * @example 80
   */
  withMembers: number;
  /**
   * The last eight weeks, oldest first, always all eight — a week nothing
   * happened in reads as zero rather than going missing and bending the
   * shape of a chart drawn from it.
   */
  byWeek: Array<CompanyWeekStatsDto>;
}

export interface CreateCompanyDto {
  /** @example "Acme Consulting SARL" */
  name: string;
  /**
   * Tunisian matricule fiscal.
   * @example "1234567/A/M/000"
   */
  taxId?: string;
  /**
   * First business day of the relationship (Africa/Tunis date).
   * @example "2026-08-01"
   */
  startDate?: string;
  /**
   * Name printed on invoices when it differs from the display name.
   * @example "ACME CONSULTING SARL"
   */
  billingName?: string;
  /**
   * Registre de commerce (RC) number.
   * @example "B0123452012"
   */
  registrationNumber?: string;
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
  /**
   * Name printed on invoices when it differs from the display name.
   * @example "ACME CONSULTING SARL"
   */
  billingName?: string;
  /**
   * Registre de commerce (RC) number.
   * @example "B0123452012"
   */
  registrationNumber?: string;
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
  /**
   * First business day of the relationship. `null` clears the date — and
   * with it the membership start-date floor — so a date set by mistake is
   * not permanent. (`@IsOptional` skips validation for null as well as
   * undefined, so null passes without a `@ValidateIf`.)
   * @example "2026-08-01"
   */
  startDate?: string | null;
}

export interface MemberCompanyDto {
  /** @format uuid */
  id: string;
  /** @example "Hyperspace SARL" */
  name: string;
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
 * DERIVED status (OfficeRnD vocabulary) — computed on read, never stored.
 * A manual `statusOverride` pin (`former`/`contact`) wins when set;
 * otherwise it derives from memberships, then one-off charges, then open
 * opportunities, then kindHint.
 */
export type MemberStatus = "lead" | "drop-in" | "pending" | "active" | "former" | "contact";

/** Manual lifecycle pin (staff-set via PUT /members/:id/status); null = auto. */
export type MemberStatusOverride = "former" | "contact";

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
  company?: MemberCompanyDto | null;
  /** True if this member receives their company's invoices. */
  isBillingPerson: boolean;
  /** True if this member is their company's contact person. */
  isContactPerson: boolean;
  segment?: MemberSegment | null;
  kindHint: MemberKindHint;
  /**
   * DERIVED status (OfficeRnD vocabulary) — computed on read, never stored.
   * A manual `statusOverride` pin (`former`/`contact`) wins when set;
   * otherwise it derives from memberships, then one-off charges, then open
   * opportunities, then kindHint.
   */
  status: MemberStatus;
  /** Manual lifecycle pin (staff-set via PUT /members/:id/status); null = auto. */
  statusOverride?: MemberStatusOverride | null;
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

export interface MemberStatusCountDto {
  status: MemberStatus;
  /** @example 12 */
  count: number;
}

export interface MemberKindHintCountDto {
  kindHint: MemberKindHint;
  /** @example 4 */
  count: number;
}

export interface MemberWeekStatsDto {
  /**
   * Monday of the week, as a business date in Africa/Tunis.
   * @example "2026-08-24"
   */
  week: string;
  /**
   * Members added that week, by created_at.
   * @example 3
   */
  created: number;
  /**
   * Members whose FIRST membership of their own starts that week, by
   * starts_at — the week they stopped being a lead or a walk-in. A
   * membership billed through the employer company is not theirs, so a
   * member covered only by a company plan never counts here.
   * @example 2
   */
  joined: number;
}

export interface MemberStatsDto {
  /** @example 120 */
  total: number;
  /**
   * Every status, always — a zero reads as empty, a gap reads as broken.
   * Resolved, not grouped: status is derived, not a column.
   */
  byStatus: Array<MemberStatusCountDto>;
  byKindHint: Array<MemberKindHintCountDto>;
  /**
   * Members attached to a company.
   * @example 80
   */
  withCompany: number;
  /**
   * The last eight weeks, oldest first, always all eight — a week nothing
   * happened in reads as zero rather than going missing and bending the
   * shape of a chart drawn from it.
   */
  byWeek: Array<MemberWeekStatsDto>;
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
  /**
   * Marks the company's invoice recipient; requires companyId.
   * @default false
   */
  isBillingPerson?: boolean;
  /**
   * Marks the company's contact person; requires companyId.
   * @default false
   */
  isContactPerson?: boolean;
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
   * Marks the company's invoice recipient; requires companyId.
   * @default false
   */
  isBillingPerson?: boolean;
  /**
   * Marks the company's contact person; requires companyId.
   * @default false
   */
  isContactPerson?: boolean;
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

/** `former`/`contact` pins the status; `auto` clears the pin. */
export type MemberStatusUpdate = "former" | "contact" | "auto";

export interface UpdateMemberStatusDto {
  /** `former`/`contact` pins the status; `auto` clears the pin. */
  status: MemberStatusUpdate;
}

export interface UpdateMemberCompanyDto {
  /**
   * Target employer company; `null` detaches into a solo member.
   * @format uuid
   */
  companyId: string | null;
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
  /** @example false */
  canAssign: boolean;
  /**
   * Whether resources of this type can be booked.
   * @example true
   */
  canBook: boolean;
  /**
   * True for pre-defined types; custom types are always false.
   * @example false
   */
  isDefault: boolean;
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
  /** @default false */
  canAssign?: boolean;
  /** Defaults to true whenever bookingMode is not `none`. */
  canBook?: boolean;
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
  /** @default false */
  canAssign?: boolean;
  /** Defaults to true whenever bookingMode is not `none`. */
  canBook?: boolean;
}

export interface AvailabilityPeriodDto {
  /**
   * When availability begins.
   * @format date-time
   * @example "2026-01-01T00:00:00.000Z"
   */
  startDate: string;
  /**
   * When availability ends (exclusive); null = indefinite.
   * @format date-time
   * @example "2026-06-30T23:00:00.000Z"
   */
  endDate?: string | null;
}

/**
 * Derived at read time (never stored): the resource's own occupancy
 * combined with its parent chain and, for parents, its children.
 */
export type ResourceStatus = "available" | "reserved" | "partially_occupied" | "occupied" | "unavailable";

export interface AmenityDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "projector" */
  slug: string;
  /** @example "Projector" */
  name: string;
  /** @example "projector" */
  icon?: string | null;
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

export type RateIntervalType = "once" | "hour" | "half_day" | "day" | "week" | "month";

export interface ExtraDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Locker" */
  name: string;
  description?: string | null;
  /**
   * Price excluding VAT, in dinars (30 = 30 TND).
   * @example 30
   */
  priceHt: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @example 19
   */
  vatRate: number;
  /** @example 0 */
  deposit: number;
  /**
   * Links this extra to the shared amenity vocabulary (name + icon).
   * @format uuid
   */
  amenityId?: string | null;
  /** @example "Screen" */
  amenityName?: string | null;
  /** @example "screen" */
  amenityIcon?: string | null;
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

export interface ResourceRateDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Meeting Room — hourly" */
  name: string;
  /**
   * Unique short code — the line-item code on invoice exports.
   * @example "ROOM-H"
   */
  code?: string | null;
  description?: string | null;
  /**
   * The rate attaches only to resources of this type.
   * @format uuid
   */
  resourceTypeId: string;
  intervalType: RateIntervalType;
  /**
   * Weekend variant (Sat/Sun): overrides the standard rate of the same interval.
   * @example false
   */
  isWeekendRate: boolean;
  /**
   * Price of the option excluding VAT, in dinars (20.5 = 20.5 TND):
   * per unit for hour/day/week/month, flat for once/half_day.
   * @example 20.5
   */
  priceHt: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @example 19
   */
  vatRate: number;
  extras: Array<ExtraDto>;
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
  /**
   * The type itself, so a caller can tell a bookable space from an
   * assignable one without fetching every resource type alongside.
   */
  resourceType?: ResourceTypeDto;
  /** @format uuid */
  parentId?: string | null;
  /**
   * Plans this resource is sold under (dedicated desks, private
   * offices, hot-desk pools); empty for bookable/structural resources.
   */
  targetPlanIds: Array<string>;
  /** @example "Meeting Room" */
  name: string;
  description?: string | null;
  /**
   * Card photo for the public website catalog. Server-managed via
   * PUT /resources/:id/image — never accepted as a plain string.
   * @example "https://cdn.hscowork.tn/spaces/office-1.jpg"
   */
  imageUrl?: string | null;
  /** @example 8 */
  capacity: number;
  bookingTimes?: WeeklyOpeningHoursDto | null;
  minDurationMin?: number | null;
  maxDurationMin?: number | null;
  /** @example 24 */
  cancellationHours: number;
  /**
   * Periods during which the resource is available for booking or
   * assignment; empty = always available.
   */
  availability: Array<AvailabilityPeriodDto>;
  hidden: boolean;
  active: boolean;
  /**
   * Derived at read time (never stored): the resource's own occupancy
   * combined with its parent chain and, for parents, its children.
   */
  status: ResourceStatus;
  amenities: Array<AmenityDto>;
  /** Attached price options — at most one per (interval, weekend) slot. */
  rates: Array<ResourceRateDto>;
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

export interface ResourceStatusDto {
  /**
   * Overall status: for children this reflects the parent chain, for
   * parents it includes the children's occupancy.
   */
  status: ResourceStatus;
  /** Status from the resource's own window and assignments only. */
  ownStatus: ResourceStatus;
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
  /**
   * Plans this resource is sold under — ACTIVE (non-archived) plans of
   * any kind; the same desk can back a dedicated-desk plan and hot-desk
   * plans. Link only — nothing is auto-assigned; the public catalog and
   * per-plan availability counts derive from it. Full-replace semantics
   * on update, like amenityIds.
   */
  targetPlanIds?: Array<string>;
  /**
   * Rates to attach (shareable price options of this resource's exact
   * type, at most one per (interval, weekend) slot). Full-replace
   * semantics on update, like amenityIds.
   */
  rateIds?: Array<string>;
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
  /**
   * Availability periods (non-overlapping); outside every period the
   * status derives as `unavailable`. Omit or send `[]` for always
   * available. Full-replace semantics on update.
   */
  availability?: Array<AvailabilityPeriodDto>;
  /** @default false */
  hidden?: boolean;
  /** @default true */
  active?: boolean;
  /** Amenity ids to attach; full-replace semantics on update. */
  amenityIds?: Array<string>;
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
  /**
   * Plans this resource is sold under — ACTIVE (non-archived) plans of
   * any kind; the same desk can back a dedicated-desk plan and hot-desk
   * plans. Link only — nothing is auto-assigned; the public catalog and
   * per-plan availability counts derive from it. Full-replace semantics
   * on update, like amenityIds.
   */
  targetPlanIds?: Array<string>;
  /**
   * Rates to attach (shareable price options of this resource's exact
   * type, at most one per (interval, weekend) slot). Full-replace
   * semantics on update, like amenityIds.
   */
  rateIds?: Array<string>;
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
  /**
   * Availability periods (non-overlapping); outside every period the
   * status derives as `unavailable`. Omit or send `[]` for always
   * available. Full-replace semantics on update.
   */
  availability?: Array<AvailabilityPeriodDto>;
  /** @default false */
  hidden?: boolean;
  /** @default true */
  active?: boolean;
  /** Amenity ids to attach; full-replace semantics on update. */
  amenityIds?: Array<string>;
}

export interface FileDto {
  /**
   * The file to upload
   * @format binary
   */
  file: File;
}

export interface CreateResourceRateDto {
  /** @example "Meeting Room — hourly" */
  name: string;
  /**
   * Unique short code — becomes the line-item code on invoice exports.
   * @example "ROOM-H"
   */
  code?: string;
  description?: string;
  /**
   * Resource type the rate belongs to; its booking mode gates the interval.
   * @format uuid
   */
  resourceTypeId: string;
  intervalType: RateIntervalType;
  /**
   * Weekend variant; only hour/half_day/day intervals accept it.
   * @default false
   */
  isWeekendRate?: boolean;
  /**
   * Price of the option excluding VAT, in dinars (TND).
   * @example 20.5
   */
  priceHt: number;
  /**
   * VAT rate as a percentage. Defaults to 19 (19%).
   * @default 19
   * @example 19
   */
  vatRate?: number;
  /**
   * Extras (add-ons) offered with this rate. Full-replace semantics on
   * update, like amenityIds/rateIds elsewhere in the catalog.
   */
  extraIds?: Array<string>;
}

export interface UpdateResourceRateDto {
  /** @example "Meeting Room — hourly" */
  name?: string;
  /**
   * Unique short code — becomes the line-item code on invoice exports.
   * @example "ROOM-H"
   */
  code?: string;
  description?: string;
  /**
   * Price of the option excluding VAT, in dinars (TND).
   * @example 20.5
   */
  priceHt?: number;
  /**
   * VAT rate as a percentage. Defaults to 19 (19%).
   * @default 19
   * @example 19
   */
  vatRate?: number;
  /**
   * Extras (add-ons) offered with this rate. Full-replace semantics on
   * update, like amenityIds/rateIds elsewhere in the catalog.
   */
  extraIds?: Array<string>;
}

export type PlanKind = "recurring" | "one_off";

export interface PlanCategoryDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "domiciliation" */
  slug: string;
  /** @example "Domiciliation" */
  name: string;
  /** @example "Registered business address services." */
  description?: string | null;
  /** @example 3 */
  sortOrder: number;
  /**
   * True only for the migration-shipped defaults; never API-writable.
   * @example true
   */
  isDefault: boolean;
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
  /**
   * The type's name, so a caller can render "5 × room hour — Meeting Room"
   * without fetching the resource types just for this label.
   * @example "Meeting Room"
   */
  resourceTypeName?: string | null;
  /**
   * Links an amenity-kind benefit to the structured amenities table.
   * @format uuid
   */
  amenityId?: string | null;
  /** @example "Locker" */
  amenityName?: string | null;
  /** @example "locker" */
  amenityIcon?: string | null;
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

export type DiscountKind = "plan" | "resource_rate";

export type DiscountStatus = "active" | "archived";

export interface DiscountDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Loyalty 10 %" */
  name: string;
  /** @example "10LOYALTY" */
  code: string;
  kind: DiscountKind;
  /** @example 10 */
  percentOff?: number | null;
  /** @example null */
  amountOffHt?: number | null;
  /** @example "2026-09-01" */
  validFrom?: string | null;
  /** @example "2026-12-31" */
  validUntil?: string | null;
  status: DiscountStatus;
  planIds: Array<string>;
  resourceRateIds: Array<string>;
  /**
   * Targets every plan (kind=plan) or every rate (kind=resource_rate).
   * @example false
   */
  appliesToAll: boolean;
  /**
   * "Show on the website" — only kind = plan may be true.
   * @example false
   */
  isPublic: boolean;
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
  /**
   * Sales grouping (website sections); null = uncategorized.
   * @format uuid
   */
  categoryId?: string | null;
  category?: PlanCategoryDto | null;
  /** @example 1 */
  cycleMonths?: number | null;
  /** @example 240 */
  priceHt: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @example 19
   */
  vatRate: number;
  /** @example 0 */
  deposit: number;
  /**
   * One-time joining fee, charged once at membership creation.
   * @example 0
   */
  setupFee: number;
  /** @example 0 */
  cancellationDays: number;
  status: PlanStatus;
  hidden: boolean;
  description?: string | null;
  terms: Record<string, any>;
  benefits: Array<PlanBenefitDto>;
  extras: Array<ExtraDto>;
  /**
   * Resource-rate discounts every membership on this plan receives at
   * booking (spec §5.3). Not contractual — edited in place, never
   * triggers archive+clone.
   */
  rateDiscounts: Array<DiscountDto>;
  /**
   * OfficeRnD "Active" column: memberships on this plan that are not yet
   * ended (currently active + pending). 0 for a plan nothing points at
   * yet (freshly created or cloned).
   * @example 4
   */
  activeMemberships: number;
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
  /**
   * Only allowed on amenity benefits; must reference an existing amenity.
   * @format uuid
   */
  amenityId?: string;
  config?: Record<string, any>;
}

export interface CreatePlanDto {
  /** @example "Full time +" */
  name: string;
  /** @example "FT_PLUS" */
  code?: string;
  kind: PlanKind;
  /**
   * Sales grouping (website sections). Cosmetic — changing it never
   * triggers archive+clone. Send null on PATCH to clear.
   * @format uuid
   */
  categoryId?: string | null;
  /**
   * Required for recurring plans, forbidden for one-off plans.
   * @example 1
   */
  cycleMonths?: number;
  /**
   * Price excluding VAT, in dinars (240 = 240 TND).
   * @example 240
   */
  priceHt: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @default 19
   */
  vatRate?: number;
  /** @default 0 */
  deposit?: number;
  /**
   * One-time joining fee, charged once at membership creation.
   * Contractual: changing it on a plan in use archives+clones.
   * @default 0
   */
  setupFee?: number;
  /** @default 0 */
  cancellationDays?: number;
  /** @default false */
  hidden?: boolean;
  description?: string;
  terms?: Record<string, any>;
  benefits?: Array<CreatePlanBenefitDto>;
  /**
   * Extras (add-ons) offered with this plan. Full-replace semantics on
   * update, like benefits.
   */
  extraIds?: Array<string>;
  /**
   * Resource-rate discounts granted to every membership on this plan.
   * Full replace on update; not contractual (no archive+clone) — each
   * id must be an active `resource_rate` discount.
   */
  rateDiscountIds?: Array<string>;
}

export interface UpdatePlanDto {
  /** @example "Full time +" */
  name?: string;
  /** @example "FT_PLUS" */
  code?: string;
  kind?: PlanKind;
  /**
   * Sales grouping (website sections). Cosmetic — changing it never
   * triggers archive+clone. Send null on PATCH to clear.
   * @format uuid
   */
  categoryId?: string | null;
  /**
   * Required for recurring plans, forbidden for one-off plans.
   * @example 1
   */
  cycleMonths?: number;
  /**
   * Price excluding VAT, in dinars (240 = 240 TND).
   * @example 240
   */
  priceHt?: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @default 19
   */
  vatRate?: number;
  /** @default 0 */
  deposit?: number;
  /**
   * One-time joining fee, charged once at membership creation.
   * Contractual: changing it on a plan in use archives+clones.
   * @default 0
   */
  setupFee?: number;
  /** @default 0 */
  cancellationDays?: number;
  /** @default false */
  hidden?: boolean;
  description?: string;
  terms?: Record<string, any>;
  benefits?: Array<CreatePlanBenefitDto>;
  /**
   * Extras (add-ons) offered with this plan. Full-replace semantics on
   * update, like benefits.
   */
  extraIds?: Array<string>;
  /**
   * Resource-rate discounts granted to every membership on this plan.
   * Full replace on update; not contractual (no archive+clone) — each
   * id must be an active `resource_rate` discount.
   */
  rateDiscountIds?: Array<string>;
}

export interface CreatePlanCategoryDto {
  /**
   * Stable machine identifier (snake_case).
   * @example "domiciliation"
   */
  slug: string;
  /** @example "Domiciliation" */
  name: string;
  /** @example "Registered business address services." */
  description?: string;
  /**
   * Ascending display order for the website sections.
   * @default 0
   */
  sortOrder?: number;
}

export interface UpdatePlanCategoryDto {
  /**
   * Stable machine identifier (snake_case).
   * @example "domiciliation"
   */
  slug?: string;
  /** @example "Domiciliation" */
  name?: string;
  /** @example "Registered business address services." */
  description?: string;
  /**
   * Ascending display order for the website sections.
   * @default 0
   */
  sortOrder?: number;
}

export interface CreateAmenityDto {
  /**
   * Stable machine identifier (snake_case).
   * @example "projector"
   */
  slug: string;
  /** @example "Projector" */
  name: string;
  /** @example "projector" */
  icon?: string;
}

export interface UpdateAmenityDto {
  /**
   * Stable machine identifier (snake_case).
   * @example "projector"
   */
  slug?: string;
  /** @example "Projector" */
  name?: string;
  /** @example "projector" */
  icon?: string;
}

export interface CreateExtraDto {
  /** @example "Locker" */
  name: string;
  description?: string;
  /**
   * Price excluding VAT, in dinars (30 = 30 TND).
   * @example 30
   */
  priceHt: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @default 19
   */
  vatRate?: number;
  /** @default 0 */
  deposit?: number;
  /**
   * Optional link to the shared amenity vocabulary (name + icon). On
   * update: omit to leave the existing link untouched, or send `null`
   * to clear it.
   * @format uuid
   */
  amenityId?: string | null;
}

export interface UpdateExtraDto {
  /** @example "Locker" */
  name?: string;
  description?: string;
  /**
   * Price excluding VAT, in dinars (30 = 30 TND).
   * @example 30
   */
  priceHt?: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @default 19
   */
  vatRate?: number;
  /** @default 0 */
  deposit?: number;
  /**
   * Optional link to the shared amenity vocabulary (name + icon). On
   * update: omit to leave the existing link untouched, or send `null`
   * to clear it.
   * @format uuid
   */
  amenityId?: string | null;
}

export interface CreateDiscountDto {
  /** @example "Loyalty 10 %" */
  name: string;
  /**
   * Unique, case-insensitive. Shown on invoices and typed by visitors as a discount code.
   * @example "10LOYALTY"
   */
  code: string;
  kind: DiscountKind;
  /** @example 10 */
  percentOff?: number;
  /** @example 15 */
  amountOffHt?: number;
  /**
   * Any kind may be time-boxed (amendment 2026-08-29).
   * @example "2026-09-01"
   */
  validFrom?: string;
  /** @example "2026-12-31" */
  validUntil?: string;
  planIds?: Array<string>;
  resourceRateIds?: Array<string>;
  /**
   * Targets every plan (kind=plan) or every resource rate
   * (kind=resource_rate) without maintaining a list — the replacement for
   * the dropped `promo` kind's implicit "applies to everything". A kind
   * needs either its own target list OR this flag (422
   * discount_targets_invalid otherwise).
   * @example false
   */
  appliesToAll?: boolean;
  /**
   * "Show on the website" (amendment 2026-08-29) — a marketing offer for
   * the landing/pricing pages and the public booking page. Only kind =
   * plan may be public (422 discount_targets_invalid otherwise).
   * Defaults false.
   * @default false
   * @example false
   */
  isPublic?: boolean;
}

export interface UpdateDiscountDto {
  /** @example "Loyalty 10 %" */
  name?: string;
  /**
   * Unique, case-insensitive. Shown on invoices and typed by visitors as a discount code.
   * @example "10LOYALTY"
   */
  code?: string;
  planIds?: Array<string>;
  resourceRateIds?: Array<string>;
  /**
   * Targets every plan (kind=plan) or every resource rate
   * (kind=resource_rate) without maintaining a list — the replacement for
   * the dropped `promo` kind's implicit "applies to everything". A kind
   * needs either its own target list OR this flag (422
   * discount_targets_invalid otherwise).
   * @example false
   */
  appliesToAll?: boolean;
  /**
   * "Show on the website" (amendment 2026-08-29) — a marketing offer for
   * the landing/pricing pages and the public booking page. Only kind =
   * plan may be public (422 discount_targets_invalid otherwise).
   * Defaults false.
   * @default false
   * @example false
   */
  isPublic?: boolean;
  /** @example 10 */
  percentOff?: number | null;
  /** @example 15 */
  amountOffHt?: number | null;
  /** @example "2026-09-01" */
  validFrom?: string | null;
  /** @example "2026-12-31" */
  validUntil?: string | null;
}

export type ChargeKind = "plan_fee" | "booking" | "store" | "one_off" | "deposit" | "setup_fee" | "discount";

export interface ChargeDto {
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
  /** @format uuid */
  membershipId?: string | null;
  /** @format uuid */
  bookingId?: string | null;
  /**
   * Soft reference to the one-off plan this fee was derived from, if any.
   * @format uuid
   */
  planId?: string | null;
  kind: ChargeKind;
  /** @example "Part time — cycle 1 (2026-07-12)" */
  description: string;
  /** @example 120 */
  amountHt: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @example 19
   */
  vatRate: number;
  /**
   * Per-line VAT (derived, HT × rate / 100 rounded to 3 decimals).
   * @example 22.8
   */
  vat: number;
  accountingCode?: string | null;
  /** @format uuid */
  invoiceId?: string | null;
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
  /**
   * Derive defaults from a one-off catalog plan. See class doc.
   * @format uuid
   */
  planId?: string;
  kind: "one_off" | "store";
  /**
   * Required unless `planId` is given (defaults to the plan's name) — but
   * an explicitly supplied value is always validated, even alongside a
   * `planId`, so callers cannot smuggle in an empty string.
   * @example "Printing — 50 pages"
   */
  description?: string;
  /**
   * HT dinars (TND); negative allowed (credit-note line). Never zero.
   * Required unless `planId` is given (defaults to the plan's priceHt) —
   * but an explicitly supplied value is always validated, even alongside
   * a `planId`, so callers cannot smuggle in 0 or a non-numeric value.
   * @example 25
   */
  amountHt?: number;
  /**
   * VAT rate as a percentage. Defaults to 19 (19%).
   * @default 19
   */
  vatRate?: number;
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
  memberId?: string | null;
  /** @format uuid */
  companyId?: string | null;
  /** @example "HS-2026-0042" */
  number: string | null;
  /** @example "2026-07-12" */
  issuedAt: string;
  /** @example "2026-07-12" */
  dueAt: string;
  status: InvoiceStatus;
  /** @example 325 */
  totalHt: number;
  /** @example 61.75 */
  totalVat: number;
  /** @example 386.75 */
  totalTtc: number;
  /**
   * Σ recorded payments (settlement progress).
   * @example 200
   */
  paid: number;
  /** The frozen line items (auditable per-line VAT). */
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
  /**
   * Customer: exactly one of memberId / companyId.
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /**
   * Charges to invoice; omit to take ALL the customer's uninvoiced
   * charges.
   */
  chargeIds?: Array<string>;
  /**
   * Defaults to the issue date (due on receipt).
   * @example "2026-08-11"
   */
  dueAt?: string;
  /**
   * Assemble the invoice for review instead of issuing it: no number is
   * drawn and the totals stay recomputable until `POST /invoices/:id/issue`.
   * The charges are still claimed, so nothing else can invoice them.
   * @default false
   */
  draft?: boolean;
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
  /** @example 200 */
  amount: number;
  method: PaymentMethod;
  /** @example "VIR-2026-4471" */
  reference?: string | null;
  /** @format date-time */
  paidAt: string;
  /**
   * Staff/admin user who recorded the payment.
   * @format uuid
   */
  recordedBy?: string | null;
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
  /**
   * Settlement progress after this payment.
   * @example 386.75
   */
  paid: number;
  /**
   * True when the payment settled the invoice (status flipped to paid).
   * @example true
   */
  settled: boolean;
}

export interface CreatePaymentDto {
  /** @example 200 */
  amount: number;
  method: PaymentMethod;
  /** @example "VIR-2026-4471" */
  reference?: string;
  /**
   * Defaults to now.
   * @example "2026-07-12T14:30:00Z"
   */
  paidAt?: string;
}

export interface CreditTransactionDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "half_day" */
  creditType: string;
  /** @example -1 */
  delta: number;
  /** @format uuid */
  bookingId?: string | null;
  /** @format uuid */
  checkinId?: string | null;
  /**
   * Resource-type scope of the grant/consumption; NULL = wildcard.
   * @format uuid
   */
  resourceTypeId?: string | null;
  /** @format date-time */
  expiresAt?: string | null;
  reason?: string | null;
  /** @format date-time */
  occurredAt: string;
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

export type CreditTransactionKind = "grant" | "consumption";

export interface CreditBalanceDto {
  /** @example "half_day" */
  creditType: string;
  /**
   * Currently usable amount (non-expired grants minus consumption, FIFO).
   * @example 18
   */
  available: number;
  /** @example 20 */
  granted: number;
  /** @example 2 */
  consumed: number;
  /**
   * Credits lost to expiry (granted, never consumed, now expired).
   * @example 0
   */
  expired: number;
  /**
   * Earliest upcoming expiry among grants still holding balance.
   * @format date-time
   */
  nextExpiry?: string | null;
}

export interface MembershipCreditBalancesDto {
  /** @format uuid */
  membershipId: string;
  balances: Array<CreditBalanceDto>;
}

export interface CreditBalancesDto {
  memberships: Array<MembershipCreditBalancesDto>;
}

export interface GrantCreditDto {
  /** @format uuid */
  membershipId: string;
  /** @example "room_hour" */
  creditType: string;
  /** @example 5 */
  amount: number;
  /**
   * Must lie in the future; omit for a never-expiring grant.
   * @format date-time
   */
  expiresAt?: string;
  /**
   * Restricts the grant to one resource type; omit for wildcard.
   * @format uuid
   */
  resourceTypeId?: string;
  /** @example "goodwill — meeting overran the booked slot" */
  reason?: string;
}

export interface UpdateCreditDto {
  /**
   * Future date-time, or null for a never-expiring grant.
   * @format date-time
   */
  expiresAt?: string | null;
  /**
   * Resource-type scope, or null for wildcard.
   * @format uuid
   */
  resourceTypeId?: string | null;
  /** @example "granted for the wrong resource type" */
  reason?: string;
}

export interface MembershipMemberDto {
  /** @format uuid */
  id: string;
  /** @example "Mohamed Ali May" */
  fullName: string;
  email?: string | null;
}

export interface MembershipCompanyDto {
  /** @format uuid */
  id: string;
  /** @example "Hyperspace SARL" */
  name: string;
}

/** Who receives this membership's charges. */
export type MembershipBillTo = "member" | "company";

export interface MembershipPlanDto {
  /** @format uuid */
  id: string;
  /** @example "Flex Desk" */
  name: string;
  /** @example "FLEX" */
  code?: string | null;
}

/** Derived from dates on every read. */
export type MembershipStatus = "pending" | "active" | "paused" | "ended";

export interface MembershipDiscountDto {
  /** @format uuid */
  discountId: string;
  /** @example "10LOYALTY" */
  code: string;
  /** @example 10 */
  percentOff?: number | null;
  /** @example null */
  amountOffHt?: number | null;
}

export interface MembershipDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  memberId?: string | null;
  member?: MembershipMemberDto | null;
  /** @format uuid */
  companyId?: string | null;
  company?: MembershipCompanyDto | null;
  /** Who receives this membership's charges. */
  billTo: MembershipBillTo;
  /**
   * Soft reference to the (possibly archived) catalog plan.
   * @format uuid
   */
  planId: string;
  /** The LIVE plan's summary — never null; blank name when unjoined. */
  plan: MembershipPlanDto;
  /** The contractual terms this membership runs on — frozen at creation. */
  planSnapshot: Record<string, any>;
  /**
   * Custom label; falls back to the snapshot plan name when unset.
   * @example "Office 3 — Acme"
   */
  name: string;
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
   * Soft reference to the discount snapshotted in planSnapshot.plan.discount.
   * @format uuid
   */
  discountId?: string | null;
  /** Snapshot copy of the applied discount (planSnapshot.plan.discount ?? null). */
  discount?: MembershipDiscountDto | null;
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

export interface MembershipStatusCountDto {
  status: MembershipStatus;
  /** @example 12 */
  count: number;
}

export interface MembershipBillToCountDto {
  billTo: MembershipBillTo;
  /** @example 8 */
  count: number;
}

export interface MembershipPlanCountDto {
  /** @format uuid */
  planId: string;
  /**
   * The LIVE plan's name — blank if the plan row has since vanished.
   * @example "Flex Desk"
   */
  name: string;
  /** @example 5 */
  count: number;
}

export interface MembershipWeekStatsDto {
  /**
   * Monday of the week, as a business date in Africa/Tunis.
   * @example "2026-08-24"
   */
  week: string;
  /**
   * Memberships created that week, by created_at.
   * @example 3
   */
  created: number;
  /**
   * Memberships whose term begins that week, by starts_at.
   * @example 2
   */
  starting: number;
}

export interface MembershipStatsDto {
  /** @example 120 */
  total: number;
  /**
   * All four statuses, always — a zero reads as empty, a gap reads as
   * broken. Derived in SQL from the same dates and pauses
   * `MembershipMapper.deriveStatus` reads.
   */
  byStatus: Array<MembershipStatusCountDto>;
  /** Both bill-to values, always. */
  byBillTo: Array<MembershipBillToCountDto>;
  /** Plans with at least one matching membership, busiest first. */
  byPlan: Array<MembershipPlanCountDto>;
  /**
   * The last eight weeks, oldest first, always all eight — a week nothing
   * happened in reads as zero rather than going missing and bending the
   * shape of a chart drawn from it.
   */
  byWeek: Array<MembershipWeekStatsDto>;
}

export interface CreateMembershipDto {
  /**
   * The customer. At least one of memberId / companyId is required.
   * BOTH together is an employee's seat paid by their employer: the
   * entitlements belong to that member alone (colleagues do not share
   * them, unlike a company-held membership) while `billTo` decides who
   * is charged.
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /**
   * Who receives the charges. Defaults to `company` when a companyId is
   * given, else `member`; must name a customer that is actually set.
   */
  billTo?: MembershipBillTo;
  /** @format uuid */
  planId: string;
  /**
   * First day of the membership (Africa/Tunis business date).
   * @example "2026-08-01"
   */
  startsAt: string;
  /**
   * Optional fixed term: the LAST active day (inclusive — same semantics
   * as the derived lifecycle). Omitted = open-ended until cancelled.
   * @example "2027-01-31"
   */
  endsAt?: string;
  notes?: string;
  /** Plan extras selected at creation (must be attached to the plan). */
  extraIds?: Array<string>;
  /**
   * Overrides the plan's price for THIS membership only (the quoted
   * figure when converting a website request). Null/omitted = plan price.
   * VAT, deposit and extras are unaffected.
   * @example 180
   */
  priceHt?: number;
  /**
   * Optional custom label; omitted = the plan name is displayed.
   * @example "Office 3 — Acme"
   */
  name?: string;
  /**
   * Overrides the plan's deposit for THIS membership only (0 = waived).
   * Written into the snapshot; extras' deposits are unaffected.
   * @example 100
   */
  deposit?: number;
  /**
   * Overrides the plan's one-time setup fee for THIS membership only
   * (0 = waived). Written into the snapshot; charged once at creation.
   * @example 0
   */
  setupFee?: number;
  /**
   * Plan discount to apply on every cycle (spec §5.2).
   * @format uuid
   */
  discountId?: string;
}

export interface UpdateMembershipDto {
  /**
   * New custom label. Omit to keep the current one.
   * @example "Office 3 — Acme"
   */
  name?: string;
  notes?: string;
  /**
   * Replace (uuid) or clear (null) the discount — affects future, non-invoiced cycles only.
   * @format uuid
   */
  discountId?: string | null;
}

export interface MembershipPauseDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  membershipId: string;
  /**
   * First paused day, inclusive.
   * @example "2026-09-01"
   */
  startsAt: string;
  /**
   * First active day again, EXCLUSIVE; null while still paused.
   * @example "2026-10-01"
   */
  endsAt?: string | null;
  /** @example "Travelling" */
  reason?: string | null;
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

export interface CreateMembershipPauseDto {
  /**
   * First paused day, inclusive. Must fall inside the membership.
   * @example "2026-09-01"
   */
  startsAt: string;
  /**
   * First active day again, EXCLUSIVE. Omit for an open-ended pause
   * closed later by resume. Silently capped at the membership's end.
   * @example "2026-10-01"
   */
  endsAt?: string;
  /** @example "Travelling" */
  reason?: string;
}

export interface ResumeMembershipDto {
  /**
   * First active day again, EXCLUSIVE. Defaults to today, so resuming
   * without a body makes the membership active again immediately.
   * @example "2026-09-20"
   */
  endsAt?: string;
}

export interface AssignmentDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  resourceId: string;
  /** @format uuid */
  membershipId: string;
  /** @example "2026-08-01" */
  startsAt: string;
  /** @example "2026-12-31" */
  endsAt?: string | null;
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

export interface CreateAssignmentDto {
  /** @format uuid */
  resourceId: string;
  /** @format uuid */
  membershipId: string;
  /**
   * First day of the assignment (Africa/Tunis business date).
   * @example "2026-08-01"
   */
  startsAt: string;
  /**
   * Optional planned end; omit for open-ended.
   * @example "2026-12-31"
   */
  endsAt?: string;
  notes?: string;
}

export interface EndAssignmentDto {
  /**
   * Last day (exclusive — half-open range like memberships).
   * @example "2026-09-01"
   */
  endsAt: string;
}

export interface RelocateAssignmentDto {
  /**
   * Destination resource (must be assignable).
   * @format uuid
   */
  resourceId: string;
  /**
   * Day the move takes effect: old assignment ends, new one starts.
   * @example "2026-09-01"
   */
  effectiveDate: string;
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

export interface BookingResourceDto {
  /** @format uuid */
  id: string;
  /** @example "Alpha Room" */
  name: string;
}

export interface BookingMemberDto {
  /** @format uuid */
  id: string;
  /** @example "Dali May" */
  fullName: string;
  /** @example "dali@example.tn" */
  email?: string | null;
}

export interface BookingCompanyDto {
  /** @format uuid */
  id: string;
  /** @example "Hyperspace SARL" */
  name: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "no_show";

export type BookingSource = "portal" | "staff" | "public";

export interface QuoteExtraDto {
  /** @format uuid */
  extraId: string;
  /** @example "Catering" */
  name: string;
  /** @example 50 */
  priceHt: number;
  /** @example 7 */
  vatRate: number;
  /** @example 53.5 */
  totalTtc: number;
}

export interface DiscountRateScopeDto {
  /** @example false */
  all: boolean;
  rateIds: Array<string>;
}

export interface BookingDiscountDto {
  /** @format uuid */
  discountId: string;
  /** @example "ROOM10" */
  code: string;
  /** @example null */
  percentOff: number | null;
  /** @example null */
  amountOffHt: number | null;
  /** Missing on a booking confirmed before the rateScope field existed. */
  rateScope?: DiscountRateScopeDto | null;
}

export type BookingFreeReason = "partnership" | "internal_event" | "goodwill" | "staff";

export interface BookingDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  resourceId: string;
  resource: BookingResourceDto;
  /** @format uuid */
  memberId?: string | null;
  member?: BookingMemberDto | null;
  /** @format uuid */
  companyId?: string | null;
  company?: BookingCompanyDto | null;
  /** @format date-time */
  startsAt: string;
  /** @format date-time */
  endsAt: string;
  status: BookingStatus;
  /**
   * NULL = fully credit-covered (§4.11).
   * @example null
   */
  priceHt?: number | null;
  source: BookingSource;
  title?: string | null;
  notes?: string | null;
  /** Snapshot of the extras priced at booking time (§6.3 Task 6). */
  extras?: Array<QuoteExtraDto>;
  /**
   * Discount code typed on the website, verbatim (a hint for staff — spec §5.4).
   * @example "ROOM10"
   */
  requestedDiscountCode?: string | null;
  /** The resource-rate discount staff applied at confirm, or null (spec §5.4). */
  discount?: BookingDiscountDto | null;
  /**
   * Complimentary: no credits, no charges (spec 2026-08-28).
   * @example false
   */
  isFree: boolean;
  freeReason?: BookingFreeReason | null;
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

export interface BookingStatusCountDto {
  status: BookingStatus;
  /** @example 12 */
  count: number;
  /**
   * Their priceHt summed. Which statuses count as money is the caller's
   * call — cancelled is money released, no_show is money kept.
   * @example 480
   */
  valueHt: number;
}

export interface BookingSourceCountDto {
  source: BookingSource;
  /** @example 4 */
  count: number;
}

export interface BookingResourceCountDto {
  /** @format uuid */
  resourceId: string;
  /** @example "Alpha Room" */
  name: string;
  /** @example 9 */
  count: number;
}

export interface BookingWeekStatsDto {
  /**
   * Monday of the week, as a business date in Africa/Tunis.
   * @example "2026-08-24"
   */
  week: string;
  /**
   * Bookings taken that week, by when they were created.
   * @example 6
   */
  created: number;
  /**
   * Bookings whose slot starts that week, by startsAt.
   * @example 4
   */
  starting: number;
  /**
   * Their priceHt summed; credit-covered bookings contribute 0.
   * @example 320
   */
  bookedValueHt: number;
}

export interface BookingStatsDto {
  /** Every status, always — a zero reads as empty, a gap reads as broken. */
  byStatus: Array<BookingStatusCountDto>;
  bySource: Array<BookingSourceCountDto>;
  /** @example 42 */
  total: number;
  /**
   * Sum of priceHt; credit-covered bookings (NULL price) contribute 0.
   * @example 1240.5
   */
  bookedValueHt: number;
  byResource: Array<BookingResourceCountDto>;
  /**
   * The last eight weeks, oldest first, always all eight — a week nothing
   * happened in reads as zero rather than going missing and bending the shape
   * of a chart drawn from it.
   */
  byWeek: Array<BookingWeekStatsDto>;
}

export interface AmenitySummaryDto {
  /** @format uuid */
  id: string;
  /** @example "Screen" */
  name: string;
  /** @example "tv" */
  icon: string | null;
}

export interface CalendarResourceSummaryDto {
  /** @format uuid */
  id: string;
  /** @example "Alpha Room" */
  name: string;
  /** @example 8 */
  capacity: number;
  imageUrl: string | null;
  /** @format uuid */
  resourceTypeId: string;
  bookingMode: BookingMode;
  /** @example 60 */
  minDurationMin: number | null;
  /** @example 480 */
  maxDurationMin: number | null;
  /** @example 24 */
  cancellationHours: number;
  amenities: Array<AmenitySummaryDto>;
}

export interface AvailabilityDayDto {
  /** @example "2026-07-13" */
  date: string;
  /** Bookable windows that day (booking_times ?? location hours). */
  windows: Array<TimeWindowDto>;
}

export interface CalendarBlockDto {
  /** @format uuid */
  bookingId: string;
  /** @format date-time */
  startsAt: string;
  /** @format date-time */
  endsAt: string;
  status: BookingStatus;
  title: string | null;
  /**
   * Resolved server-side; the grid must not re-derive it from ids.
   * @example "Amel Ben Ali"
   */
  customerName: string | null;
  source: BookingSource;
}

export interface CalendarResourceDto {
  resource: CalendarResourceSummaryDto;
  days: Array<AvailabilityDayDto>;
  blocks: Array<CalendarBlockDto>;
}

export interface BookingCalendarDto {
  /** @format date-time */
  from: string;
  /** @format date-time */
  to: string;
  /**
   * IANA zone of the location this grid belongs to. The time axis is
   * drawn in it — clients must not fall back to the browser's zone.
   * @example "Europe/Lisbon"
   */
  timezone: string;
  resources: Array<CalendarResourceDto>;
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
  /** Extras offered by the booked resource's rates (§6.3 Task 6). */
  extraIds?: Array<string>;
  /**
   * Staff/admin only: waive the room AND the extras, consume no
   * credits. Requires `freeReason`.
   * @example false
   */
  isFree?: boolean;
  freeReason?: BookingFreeReason;
  /**
   * Staff-picked discount (docs/superpowers/plans/2026-08-29-booking-
   * discount-select.md): must resolve to an active, in-window,
   * kind=resource_rate discount, else 404 discount_not_found (unknown id)
   * or 422 discount_not_eligible (wrong kind/archived/out of window, or
   * one that does not target this booking's winning rate). Also accepted
   * by POST /bookings/validate (same DTO).
   * @format uuid
   */
  discountId?: string;
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

/** Which rate audience applies to the charged remainder. */
export type RateAudience = "member" | "visitor";

export interface QuoteDiscountDto {
  /** @format uuid */
  discountId: string;
  /** @example "MEMBER10" */
  code: string;
  /** Which candidate won the single-discount rule (spec §5.4). */
  source: "code" | "plan";
  /**
   * Negative HT amount taken off the room line.
   * @example -5
   */
  amountHt: number;
}

export interface BookingQuoteDto {
  /** @format uuid */
  resourceId: string;
  /**
   * Resource type of the booked resource — the credit scope consumed.
   * @format uuid
   */
  resourceTypeId: string;
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
  priceHt?: number | null;
  /** @example 19 */
  vatRate?: number | null;
  /** @example null */
  totalTtc?: number | null;
  /**
   * Room line at list price for the charged units (pro-rated frozen list when confirming a website request); null when free.
   * @example 40
   */
  roomListHt?: number | null;
  /** The one discount applied to the room line, or null. priceHt/totalTtc are already net. */
  discount?: QuoteDiscountDto | null;
  /**
   * Whether the discount CODE passed to `quote()` (the 8th, `codeDiscount`
   * param) targets the winning rate, independent of whether it actually
   * won `discount` above — a plan rate discount can legitimately out-win
   * an applicable code. Null when no code was given, or nothing was
   * priced (fully credit-covered, no winning rate to check against).
   * `BookingService.confirm` refuses (422) a code that resolves but
   * targets a DIFFERENT rate — this is `false` in exactly that case
   * (spec §5.4 amendment 2026-08-29).
   * @example null
   */
  codeDiscountApplies?: boolean | null;
  /** Flat per-booking add-ons (§6.3 Task 6) — never credit-covered. */
  extras: Array<QuoteExtraDto>;
  /**
   * priceHt + the sum of extras' priceHt (0 when fully free).
   * @example 90
   */
  grandTotalHt: number;
  /**
   * totalTtc + the sum of extras' totalTtc (0 when fully free).
   * @example 107.1
   */
  grandTotalTtc: number;
}

export interface UpdateBookingDto {
  /** @example "Sprint planning" */
  title?: string;
  notes?: string;
  /** Extras offered by the booked resource's rates (§6.3 Task 6). */
  extraIds?: Array<string>;
  status?: "no_show";
  /**
   * Change the booking's discount (docs/superpowers/plans/2026-08-29-
   * booking-discount-select.md). Omitted = unchanged; `null` = remove the
   * discount; an id resolves the same way as create's `discountId` (404
   * `discount_not_found` for an unknown id, 422 `discount_not_eligible`
   * for one that is not an active, in-window, kind=resource_rate discount
   * or does not apply to this booking's rate). A CONFIRMED booking's
   * money is reversed and re-applied with the new discount, exactly like
   * an `extraIds` change; a PENDING booking has no money yet, so only its
   * stored snapshot is replaced — confirm() prices and re-validates it
   * then. Precedence at confirm (fix round 1, review of f443da4):
   * `ConfirmBookingDto.discountId`/`discountCode`, when SENT, always
   * override whatever was set here; confirm called with an EMPTY body
   * (the common case — a website confirm never sends either field) falls
   * back to this PATCHed snapshot instead of dropping it.
   * @format uuid
   */
  discountId?: string | null;
  /**
   * Reschedule. Both times or neither — one alone is refused with
   * `reschedule_requires_both`, because "move the end" alone is far
   * more often a dropped field than an intent.
   *
   * The resource deliberately cannot move: it would change the rate,
   * invalidate the extras (they hang off the old resource's rates) and
   * rescope the credits, which are scoped to a resource TYPE. Changing
   * rooms stays cancel-and-rebook.
   * @example "2026-08-26T09:00:00Z"
   */
  startsAt?: string;
  /** @example "2026-08-26T11:00:00Z" */
  endsAt?: string;
}

export interface ConfirmBookingDto {
  /**
   * Staff/admin only: waive the room AND the extras, consume no
   * credits. Requires `freeReason`.
   * @example false
   */
  isFree?: boolean;
  freeReason?: BookingFreeReason;
  /**
   * Staff-picked discount (docs/superpowers/plans/2026-08-29-booking-
   * discount-select.md): resolves the same 404/422 way as create's
   * discountId. Precedence at confirm (fix round 1, review of f443da4):
   * an explicit id here always wins over `discountCode`; explicit `null`
   * drops any discount outright; OMITTING both fields falls back to
   * whatever was already set on the booking via
   * `PATCH /bookings/:id { discountId }` while it was still PENDING
   * (docs/superpowers/plans/2026-08-29-booking-discount-select.md's
   * PATCH extension) — a website confirm with an empty body is the
   * common case, and that PATCHed discount must not silently vanish. The
   * fallback is re-validated here exactly like an explicit id (422
   * discount_not_eligible if the live rate no longer matches or the
   * booking is now fully credit-covered), never re-resolved from the
   * database — the snapshot IS the discount.
   * @format uuid
   */
  discountId?: string | null;
  /**
   * Discount code to apply (spec §5.4): send the requested code to KEEP it,
   * another code to replace it, null/omit to DROP it. Only an active,
   * in-window resource_rate discount code is accepted → 422
   * discount_code_invalid. Ignored when `discountId` is also sent —
   * `discountId` (a staff pick, docs/superpowers/plans/2026-08-29-booking-
   * discount-select.md) takes precedence over `discountCode` (a
   * visitor-typed code kept/replaced/dropped by staff).
   * @example "ROOM10"
   */
  discountCode?: string | null;
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
  /**
   * IANA zone of the resource's location. Windows in `days[]` are
   * wall-clock strings ("08:00") that only mean anything in this zone —
   * a client rendering them against its own zone shows the wrong hours
   * to anyone booking across a border.
   * @example "Europe/Lisbon"
   */
  timezone: string;
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

export interface OpportunityMemberDto {
  /** @format uuid */
  id: string;
  /** @example "Dali May" */
  fullName: string;
  /** @example "dali@example.tn" */
  email?: string | null;
}

export type OpportunityInterest = "coworking" | "domiciliation" | "private_office" | "meeting_room" | "other";

export type OpportunityStage = "new" | "contacted" | "tour" | "quote" | "won" | "lost";

export interface OpportunityPlanDto {
  /** @format uuid */
  id: string;
  /** @example "Part time" */
  name: string;
  /**
   * Price excluding VAT, in dinars (200 = 200 TND).
   * @example 200
   */
  priceHt: number;
}

export interface OpportunityResourceDto {
  /** @format uuid */
  id: string;
  /** @example "Private Office 2" */
  name: string;
}

export interface RequestedExtraDto {
  /** @format uuid */
  extraId: string;
  /** @example "Locker" */
  name: string;
  /**
   * Price excluding VAT, in dinars (30 = 30 TND).
   * @example 30
   */
  priceHt: number;
  /**
   * VAT rate as a percentage (19 = 19%, 20.5 = 20.5%).
   * @example 19
   */
  vatRate: number;
}

export interface OpportunityDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @format uuid */
  memberId: string;
  member: OpportunityMemberDto;
  interest: OpportunityInterest;
  stage: OpportunityStage;
  /** @example 240 */
  expectedValue?: number | null;
  /** @example "website" */
  source?: string | null;
  notes?: string | null;
  /** @format date-time */
  closedAt?: string | null;
  /**
   * The plan a website visitor requested (Task 6). NULL otherwise.
   * @format uuid
   */
  requestedPlanId?: string | null;
  requestedPlan?: OpportunityPlanDto | null;
  /**
   * The specific space the visitor or staff requested. NULL otherwise.
   * @format uuid
   */
  requestedResourceId?: string | null;
  requestedResource?: OpportunityResourceDto | null;
  /** Paid add-ons selected with the requested plan. */
  requestedExtras: Array<RequestedExtraDto>;
  /**
   * The PLAN FEE ONLY portion of the requested-plan quote — NOT
   * `expectedValue` (which also sums the requested extras). This is the
   * figure to paste into `CreateMembershipDto.priceHt` when converting.
   * Null for opportunities not sourced from a plan request.
   * @example 200
   */
  requestedPlanPriceHt?: number | null;
  /**
   * What the website visitor typed, verbatim — a hint staff keep or
   * drop at onboarding (spec §5.4). Never read for pricing. Null for
   * opportunities not sourced from a plan request, or with no code.
   * @example "SUMMER26"
   */
  requestedDiscountCode?: string | null;
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

export interface OpportunityStageStatsDto {
  stage: OpportunityStage;
  /**
   * Leads sitting in this stage. Present for every stage, zero included, so
   * a caller can render the whole pipeline without filling in the gaps.
   * @example 3
   */
  count: number;
  /**
   * Their expected value summed, excluding VAT, in dinars. Which stages
   * count as pipeline is the caller's call — won is money made, lost is
   * money gone.
   * @example 450
   */
  expectedValue: number;
}

export interface OpportunitySourceStatsDto {
  /**
   * Where the lead came from. Free text, so this is what the data actually
   * holds rather than a list someone decided in advance.
   * @example "website"
   */
  source: string;
  /** @example 7 */
  count: number;
}

export interface OpportunityWeekStatsDto {
  /**
   * Monday of the week, as a business date in Africa/Tunis.
   * @example "2026-08-24"
   */
  week: string;
  /**
   * Leads opened that week.
   * @example 4
   */
  created: number;
  /**
   * Leads closed won that week — by when they closed, not when they opened.
   * @example 1
   */
  won: number;
  /** @example 0 */
  lost: number;
  /**
   * Expected value of the leads opened that week, excluding VAT, in dinars.
   * @example 800
   */
  value: number;
}

export interface OpportunityStatsDto {
  byStage: Array<OpportunityStageStatsDto>;
  /**
   * Every source present in the data, busiest first — the options a source
   * filter can offer. Leads without one are left out: an option nothing can
   * be filtered by is worse than no option.
   */
  bySource: Array<OpportunitySourceStatsDto>;
  /**
   * The last eight weeks, oldest first, always all eight — a week nothing
   * happened in reads as zero rather than going missing and bending the shape
   * of a chart drawn from it.
   */
  byWeek: Array<OpportunityWeekStatsDto>;
}

export interface CreateOpportunityDto {
  /** @format uuid */
  memberId: string;
  interest: OpportunityInterest;
  /** @default "new" */
  stage?: OpportunityStage;
  /** @example 240 */
  expectedValue?: number;
  /** @example "walk-in" */
  source?: string;
  notes?: string;
  /**
   * The plan a website visitor requested (Task 6).
   * @format uuid
   */
  requestedPlanId?: string;
  /**
   * The specific space the visitor or staff requested.
   * @format uuid
   */
  requestedResourceId?: string;
  /** Paid add-ons selected with the requested plan. */
  requestedExtras?: Array<RequestedExtraDto>;
  /**
   * The PLAN FEE ONLY portion of the requested-plan quote (Task 6 —
   * distinct from `expectedValue`, which also includes extras).
   * @example 200
   */
  requestedPlanPriceHt?: number;
  /**
   * Discount code typed on the website, stored verbatim (spec §5.4).
   * @example "SUMMER26"
   */
  requestedDiscountCode?: string;
}

export interface UpdateOpportunityDto {
  /** @format uuid */
  memberId?: string;
  interest?: OpportunityInterest;
  /** @default "new" */
  stage?: OpportunityStage;
  /** Paid add-ons selected with the requested plan. */
  requestedExtras?: Array<RequestedExtraDto>;
  /** @example 240 */
  expectedValue?: number | null;
  /** @example "walk-in" */
  source?: string | null;
  notes?: string | null;
  /** @format uuid */
  requestedPlanId?: string | null;
  /** @format uuid */
  requestedResourceId?: string | null;
  /** @example 200 */
  requestedPlanPriceHt?: number | null;
  /**
   * Staff can clear the requested code on the opportunity itself.
   * @example "SUMMER26"
   */
  requestedDiscountCode?: string | null;
}

export interface OnboardingResultDto {
  membership: MembershipDto;
  /**
   * The space held from day one, or null when the opportunity named
   * none — assigning one later is a separate, ordinary action.
   */
  assignment?: AssignmentDto | null;
  /**
   * The converted opportunity, now stage=won.
   * @format uuid
   */
  opportunityId: string;
}

export interface OnboardLeadDto {
  /** @format uuid */
  opportunityId: string;
  /**
   * First day of the membership (Africa/Tunis business date).
   * @example "2026-09-01"
   */
  startsAt: string;
  /**
   * Optional fixed term: the LAST active day (inclusive), same
   * semantics as CreateMembershipDto.endsAt.
   * @example "2027-02-28"
   */
  endsAt?: string;
  /**
   * Discount code to apply to the new membership (spec §5.4):
   * send the opportunity's requested code to KEEP it, another code to
   * replace it, null/omit to DROP it. Resolved and checked for eligibility
   * → 422 discount_code_invalid / discount_not_eligible.
   * @example "SUMMER26"
   */
  discountCode?: string | null;
}

export interface RevenueBucketDto {
  /**
   * Month ('2026-07') or plan name ('Part time') / charge-kind bucket.
   * @example "2026-07"
   */
  bucket: string;
  /** @example 305 */
  totalHt: number;
  /** @example 57.95 */
  totalVat: number;
  /** @example 362.95 */
  totalTtc: number;
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
  memberId?: string | null;
  /** @format uuid */
  companyId?: string | null;
  /** @example "2026-08-01" */
  endsAt: string;
}

export interface ChurnCohortDto {
  /**
   * Cohort = membership start month.
   * @example "2026-05"
   */
  cohort: string;
  /** @example 10 */
  started: number;
  /** @example 3 */
  ended: number;
  /**
   * ended / started, 4 decimals.
   * @example 0.3
   */
  churnRate: number;
}

export interface MembershipAnalyticsDto {
  activeByPlan: Array<ActiveByPlanDto>;
  expiring: Array<ExpiringMembershipDto>;
  churnByCohort: Array<ChurnCohortDto>;
}

export interface PublicPlanCategoryDto {
  /** @example "domiciliation" */
  slug: string;
  /** @example "Domiciliation" */
  name: string;
  /** @example "Registered business address services." */
  description?: string | null;
}

export interface PublicPlanBenefitDto {
  /** @example "credit" */
  kind: string;
  /** @example "half_day" */
  type: string;
  /** @example 20 */
  amount?: number | null;
  /**
   * Resolved when the amenity benefit links to the structured amenities table.
   * @example "Locker"
   */
  amenityName?: string | null;
  /** @example "locker" */
  amenityIcon?: string | null;
}

export interface PublicPlanExtraDto {
  /** @format uuid */
  id: string;
  /** @example "Locker" */
  name: string;
  /** @example 30 */
  priceHt: number;
  /** @example 19 */
  vatRate: number;
  /**
   * Resolved when the extra links to the amenities table.
   * @example "Locker"
   */
  amenityName?: string | null;
  /** @example "lock" */
  amenityIcon?: string | null;
}

export interface PublicOfferDto {
  /** @example "SUMMER26" */
  code: string;
  /** @example "Summer 2026" */
  name: string;
  /** @example 25 */
  percentOff?: number | null;
  /** @example null */
  amountOffHt?: number | null;
  /** @example "2026-12-31" */
  validUntil?: string | null;
  /**
   * priceHt + the (negative) plan-fee reduction, rounded to millimes.
   * @example 90
   */
  discountedPriceHt: number;
  /**
   * discountedPriceHt × (1 + the plan's VAT rate).
   * @example 107.1
   */
  discountedPriceTtc: number;
}

export interface PublicPlanDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Part time" */
  name: string;
  /** @example "PART_TIME" */
  code?: string | null;
  /** @example "recurring" */
  kind: "recurring" | "one_off";
  /** @example 1 */
  cycleMonths?: number | null;
  /** @example 120 */
  priceHt: number;
  /** @example 19 */
  vatRate: number;
  /**
   * Convenience for the website: HT × (1 + VAT).
   * @example 142.8
   */
  priceTtc: number;
  /**
   * One-time joining fee HT, charged once when the membership starts.
   * @example 0
   */
  setupFee: number;
  description?: string | null;
  /** The website service section this plan belongs to; null = none. */
  category?: PublicPlanCategoryDto | null;
  /**
   * How many active, visible unit resources sold under this plan (via
   * their target plans, e.g. dedicated desks or private offices) are
   * currently available. 0 = unit-backed but sold out; null = the plan
   * is not unit-backed (no linked units, or pool-level links only —
   * seat counts for pools live on the catalog card), so show no badge.
   * @example 3
   */
  availableResourcesCount: number | null;
  benefits: Array<PublicPlanBenefitDto>;
  /** Paid add-ons offered with this plan. */
  extras: Array<PublicPlanExtraDto>;
  /** The single best public offer on this plan, or null. */
  offer?: PublicOfferDto | null;
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

export interface PublicAmenityDto {
  /** @example "projector" */
  slug: string;
  /** @example "Projector" */
  name: string;
  /** @example "projector" */
  icon?: string | null;
}

export interface PublicRateExtraDto {
  /** @format uuid */
  id: string;
  /** @example "Locker" */
  name: string;
  /** @example 30 */
  priceHt: number;
  /** @example 19 */
  vatRate: number;
  /**
   * Resolved when the extra links to the amenities table.
   * @example "Locker"
   */
  amenityName?: string | null;
  /** @example "lock" */
  amenityIcon?: string | null;
}

export interface PublicResourceRateDto {
  /**
   * Billing interval: once, hour, half_day, day, week or month.
   * @example "hour"
   */
  intervalType: string;
  /**
   * Applies on Sat/Sun instead of the standard rate of the interval.
   * @example false
   */
  isWeekendRate: boolean;
  /** @example 30 */
  priceHt: number;
  /** @example 19 */
  vatRate: number;
  /**
   * Convenience for the website: HT × (1 + VAT).
   * @example 35.7
   */
  priceTtc: number;
  /** Add-ons offered with this rate. */
  extras: Array<PublicRateExtraDto>;
}

export interface PublicTargetPlanDto {
  /** @format uuid */
  id: string;
  /** @example "Full time +" */
  name: string;
  /** @example "recurring" */
  kind: "recurring" | "one_off";
  /** @example 1 */
  cycleMonths?: number | null;
  /** @example 240 */
  priceHt: number;
  /** @example 19 */
  vatRate: number;
  /**
   * Convenience for the website: HT × (1 + VAT).
   * @example 285.6
   */
  priceTtc: number;
  /** The single best public offer on this plan, or null. */
  offer?: PublicOfferDto | null;
}

export interface PublicResourceDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** @example "Meeting Room" */
  name: string;
  description?: string | null;
  /**
   * Card photo.
   * @example "https://cdn.hscowork.tn/spaces/office-1.jpg"
   */
  imageUrl?: string | null;
  /** @example "meeting_room" */
  resourceTypeSlug: string;
  /** @example "Meeting Room" */
  resourceTypeName: string;
  /** @example "hourly" */
  bookingMode: string;
  /** Derived live status — the card's availability badge. */
  status: ResourceStatus;
  /** @example 8 */
  capacity: number;
  /**
   * Pool/parent cards (e.g. the open space): live unit counts over the
   * direct child seats. Null for unit cards.
   * @example 5
   */
  availableUnitsCount?: number | null;
  /** @example 8 */
  totalUnitsCount?: number | null;
  /** @example 60 */
  minDurationMin?: number | null;
  /** @example 480 */
  maxDurationMin?: number | null;
  /** @example 24 */
  cancellationHours: number;
  amenities: Array<PublicAmenityDto>;
  /** Attached price options — one per (interval, weekend) slot. */
  rates: Array<PublicResourceRateDto>;
  /**
   * Plans this space is sold under, cheapest first; empty for purely
   * bookable spaces. Request via POST /public/plan-requests.
   */
  targetPlans: Array<PublicTargetPlanDto>;
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

export interface PublicResourceTypeDto {
  /** @example "meeting_room" */
  slug: string;
  /** @example "Meeting Room" */
  name: string;
  /** @example "hourly" */
  bookingMode: string;
  /**
   * True = cards of this tab book time slots; false = plan requests.
   * @example true
   */
  canBook: boolean;
}

export interface BookingRequestResultDto {
  /** @format uuid */
  bookingId: string;
  /** @example "pending" */
  status: string;
  /**
   * NULL when fully credit-covered (§4.11).
   * @example null
   */
  priceHt?: number | null;
  extras: Array<QuoteExtraDto>;
  /**
   * priceHt + the sum of extras' priceHt (0 when fully free).
   * @example 80
   */
  grandTotalHt: number;
  /**
   * totalTtc + the sum of extras' totalTtc (0 when fully free).
   * @example 89.2
   */
  grandTotalTtc: number;
  /**
   * The code as typed (normalised), echoed back — not applied to any
   * price on this path. Staff keep or drop it at confirm.
   * @example "ROOM10"
   */
  discountCode?: string | null;
}

/**
 * Which public frontend sent this request — recorded as the
 * opportunity's `source`. Omitted keeps the historical `website`.
 */
export type RequestSource = "website" | "booking";

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
  /** Extras offered by the booked resource's rates (§6.3 Task 6). */
  extraIds?: Array<string>;
  /**
   * Discount code typed on the website. Stored verbatim for staff; not
   * validated or priced here (spec §5.4).
   * @example "ROOM10"
   */
  discountCode?: string;
  /**
   * Which public frontend sent this request — recorded as the
   * opportunity's `source`. Omitted keeps the historical `website`.
   * @default "website"
   */
  source?: RequestSource;
}

export interface PlanRequestResultDto {
  /** @format uuid */
  opportunityId: string;
  /** @format uuid */
  planId: string;
  /** @example 200 */
  priceHt: number;
  extras: Array<QuoteExtraDto>;
  /**
   * priceHt + the sum of the selected extras' priceHt.
   * @example 230
   */
  totalHt: number;
  /**
   * planTtc + the sum of the selected extras' totalTtc.
   * @example 273.7
   */
  totalTtc: number;
  /**
   * The code as typed (normalised), echoed back — not applied to any
   * price on this path. Staff keep or drop it at onboarding.
   * @example "SUMMER26"
   */
  discountCode?: string | null;
}

export interface CreatePlanRequestDto {
  /** @example "Sami Ben Salah" */
  fullName: string;
  /** @example "sami@company.tn" */
  email: string;
  /** @example "+21622123456" */
  phone?: string;
  /** @example "Acme SARL" */
  companyName?: string;
  /**
   * Plan to request. Optional when `resourceId` is sent and the space
   * is sold under exactly one plan; REQUIRED (one of the space's
   * plans) when it is sold under several.
   * @format uuid
   */
  planId?: string;
  /**
   * Space card the visitor clicked (catalog `GET /public/resources`);
   * the plan resolves through the space's target plans and the space is
   * recorded on the opportunity. At least one of planId/resourceId is
   * required.
   * @format uuid
   */
  resourceId?: string;
  /** Paid add-ons selected with the plan (§5 GET /public/plans). */
  extraIds?: Array<string>;
  /** @example "Interested in starting next month" */
  notes?: string;
  /**
   * Defaults to coworking — plans have no type field to derive it from.
   * @default "coworking"
   */
  interest?: OpportunityInterest;
  /**
   * Discount code typed on the website. Stored verbatim for staff; not
   * validated or priced here (spec §5.4).
   * @example "SUMMER26"
   */
  discountCode?: string;
  /**
   * Which public frontend sent this request — recorded as the
   * opportunity's `source`. Omitted keeps the historical `website`.
   * @default "website"
   */
  source?: RequestSource;
}

export interface ContactRequestResultDto {
  /** @format uuid */
  opportunityId: string;
}

export interface CreateContactRequestDto {
  /** @example "Sami Ben Salah" */
  fullName: string;
  /** @example "sami@company.tn" */
  email: string;
  /** @example "+21622123456" */
  phone?: string;
  /** @example "Acme SARL" */
  companyName?: string;
  /**
   * Service section the visitor asks about
   * (`GET /public/plan-categories`), or a bare interest slug such as
   * `meeting_room` — accepted without a category row, since bookable
   * services have no plan category. Mutually exclusive with `freeDay`.
   * @example "coworking"
   */
  categorySlug?: string;
  /**
   * True to request a free trial day instead of a category.
   * @example true
   */
  freeDay?: boolean;
  /**
   * Preferred visit date (Africa/Tunis business day) — recorded on the
   * opportunity for staff, mainly with `freeDay`.
   * @format date
   * @example "2026-09-01"
   */
  preferredDate?: string;
  /** @example "We are a team of 4" */
  notes?: string;
  /**
   * Which public frontend sent this request — recorded as the
   * opportunity's `source`. Omitted keeps the historical `website`.
   * @default "website"
   */
  source?: RequestSource;
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

export interface CompanyStatsParams {
  /** Matches name or email. */
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
  /**
   * Derived lifecycle status. Not a column: the list resolves every
   * candidate's status first and pages the matches, so totals stay true.
   */
  status?: MemberStatus;
  /** The search term to filter results. */
  q?: string;
}

export interface MemberStatsParams {
  kindHint?: MemberKindHint;
  /** @format uuid */
  companyId?: string;
  /** Matches fullName, email or phone. */
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
  /** Keep only resources whose derived status matches. */
  status?: ResourceStatus;
  /**
   * Keep only resources whose type allows booking. A resource on a
   * `canBook: false` type cannot be booked at all, so offering it in a
   * booking form is a trap.
   * @example true
   */
  canBook?: boolean;
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
  resourceTypeId?: string;
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
  kind?: PlanKind;
  /** The search term to filter results. */
  q?: string;
}

export interface ListPlanCategoriesParams {
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

export interface ListAmenitiesParams {
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

export interface ListExtrasParams {
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

export interface ListDiscountsParams {
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
  kind?: DiscountKind;
  status?: DiscountStatus;
  /**
   * The search term to filter results.
   * @example "LOYAL"
   */
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
  /** true → only charges not yet on an invoice. */
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

export interface ListCreditsParams {
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
  membershipId?: string;
  /**
   * Memberships held by the member OR their employer company.
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /** @format uuid */
  bookingId?: string;
  /** @format uuid */
  checkinId?: string;
  /** @example "room_hour" */
  creditType?: string;
  /** grant = positive deltas, consumption = negative deltas. */
  kind?: CreditTransactionKind;
  /**
   * Inclusive lower bound on occurred_at.
   * @format date-time
   */
  startDate?: string;
  /**
   * Inclusive upper bound on occurred_at.
   * @format date-time
   */
  endDate?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface GetCreditBalancesParams {
  /** @format uuid */
  membershipId?: string;
  /**
   * Memberships held by the member OR their employer company.
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /**
   * Inclusive start of the statement window.
   * @format date-time
   */
  startDate?: string;
  /**
   * Inclusive end of the statement window; defaults to now.
   * @format date-time
   */
  endDate?: string;
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
   * Memberships held DIRECTLY by this member (no employer-company pooling).
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /**
   * Memberships billed to this company or held by any of its members. Mutually exclusive with companyId.
   * @format uuid
   */
  forCompanyId?: string;
  /**
   * Memberships whose ends_at falls on or before this date.
   * @example "2026-09-01"
   */
  expiringBefore?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface MembershipStatsParams {
  /** @format uuid */
  planId?: string;
  /**
   * Memberships held DIRECTLY by this member (no employer-company pooling).
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /**
   * Memberships billed to this company or held by any of its members. Mutually exclusive with companyId.
   * @format uuid
   */
  forCompanyId?: string;
  /** Matches the membership label, the member name or the company name. */
  q?: string;
}

export interface ListAssignmentsParams {
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
  /** @format uuid */
  membershipId?: string;
  /**
   * Only assignments covering this business date.
   * @example "2026-08-01"
   */
  activeOn?: string;
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
  status?: BookingStatus;
  source?: BookingSource;
  /**
   * Customer filter; member XOR company, same as the booking itself.
   * @format uuid
   */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /**
   * Query strings arrive as text; "true"/"false" become booleans.
   * @example true
   */
  isFree?: boolean;
  /** The search term to filter results. */
  q?: string;
}

export interface GetBookingStatsParams {
  q?: string;
  /** @format uuid */
  resourceId?: string;
  /** @example "2026-08-01T00:00:00Z" */
  from?: string;
  /** @example "2026-08-31T23:59:59Z" */
  to?: string;
  source?: BookingSource;
  /** @format uuid */
  memberId?: string;
  /** @format uuid */
  companyId?: string;
  /**
   * Query strings arrive as text; "true"/"false" become booleans.
   * @example true
   */
  isFree?: boolean;
}

export interface GetBookingCalendarParams {
  /**
   * Inclusive start instant.
   * @example "2026-08-24T00:00:00Z"
   */
  from: string;
  /**
   * EXCLUSIVE end instant — a one-day grid is midnight to midnight.
   * @example "2026-08-25T00:00:00Z"
   */
  to: string;
  /**
   * Comma-separated; omit for every bookable room in scope.
   * @example "6f9619ff-8b86-4d11-b42d-00c04fc964ff,c6a2f0de-9a2c-4a1e-9b7a-2f1d3c4b5a60"
   */
  resourceIds?: string;
  /** @format uuid */
  resourceTypeId?: string;
  /** @format uuid */
  locationId?: string;
}

export interface GetResourceAvailabilityParams {
  /**
   * Inclusive start instant.
   * @example "2026-07-13T00:00:00Z"
   */
  from: string;
  /**
   * EXCLUSIVE end instant — the same half-open convention the busy
   * query (`starts_at < :to`) and the calendar already use. To cover
   * 13–19 July, pass the 20th at 00:00, not the 19th at 23:59:59.
   * @example "2026-07-20T00:00:00Z"
   */
  to: string;
  /**
   * The booking currently being rescheduled. Its own busy interval is
   * dropped from the response, so the slot it already holds reads as
   * free — which is where "make it half an hour longer" starts.
   * @format uuid
   */
  excludeBookingId?: string;
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
  /**
   * Exact match on the free-text source; the options come from stats.
   * @example "website"
   */
  source?: string;
  stage?: OpportunityStage;
  interest?: OpportunityInterest;
  /** @format uuid */
  memberId?: string;
  /**
   * Instants, not dates. An opportunity has no location, so the server
   * has no timezone in which to decide what "a day" is — and picking one
   * would bake a region into a region-neutral entity. The client turns
   * the day it means into a pair of instants.
   * @example "2026-08-01T00:00:00Z"
   */
  createdFrom?: string;
  /**
   * Exclusive upper bound.
   * @example "2026-08-08T00:00:00Z"
   */
  createdTo?: string;
  /** The search term to filter results. */
  q?: string;
}

export interface OpportunityStatsParams {
  /** Same search as the list: the member's name or the source. */
  q?: string;
  interest?: OpportunityInterest;
  /**
   * Instants, not dates. An opportunity has no location, so the server
   * has no timezone in which to decide what "a day" is — and picking one
   * would bake a region into a region-neutral entity. The client turns
   * the day it means into a pair of instants.
   * @example "2026-08-01T00:00:00Z"
   */
  createdFrom?: string;
  /**
   * Exclusive upper bound.
   * @example "2026-08-08T00:00:00Z"
   */
  createdTo?: string;
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

export interface PublicListPlansParams {
  /**
   * Category slug, as returned by GET /public/plan-categories.
   * @example "domiciliation"
   */
  category?: string;
}

export interface PublicResourceAvailabilityParams {
  /**
   * Inclusive start instant.
   * @example "2026-07-13T00:00:00Z"
   */
  from: string;
  /**
   * EXCLUSIVE end instant — the same half-open convention the busy
   * query (`starts_at < :to`) and the calendar already use. To cover
   * 13–19 July, pass the 20th at 00:00, not the 19th at 23:59:59.
   * @example "2026-07-20T00:00:00Z"
   */
  to: string;
  id: string;
}

export interface PublicListResourcesParams {
  /**
   * Resource-type slug, as returned by GET /public/resource-types.
   * @example "meeting_room"
   */
  resourceType?: string;
  /**
   * Plan code, as returned by GET /public/plans — keeps spaces whose
   * target plans include it. Code, not id: the code survives
   * archive+clone, so a stored link never goes stale. Unknown code =
   * empty list (filter semantics, like an unmatched resourceType).
   * @example "DAY_PASS"
   */
  planCode?: string;
}

export namespace Api {
  /**
 * @description Paginated list of locations. `q` filters by name.
 * @tags Locations
 * @name ListLocations
 * @summary List locations
 * @request GET:/api/v1/locations
 * @secure
 * @response `200` `{
    results: Array<LocationDto>,
    meta: PageMetaDto,

}` 200
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
    export type ResponseBody = {
      results: Array<LocationDto>;
      meta: PageMetaDto;
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
 * @description Paginated list. `q` fuzzy-matches name/email; `name` is exact-match. `status` is derived from membership/charge/opportunity data — never stored.
 * @tags Companies
 * @name ListCompanies
 * @summary List companies
 * @request GET:/api/v1/companies
 * @secure
 * @response `200` `{
    results: Array<CompanyDto>,
    meta: PageMetaDto,

}` 200
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
    export type ResponseBody = {
      results: Array<CompanyDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * @description `status` is derived from membership/charge/opportunity data — never stored.
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
   * @description Counts by derived status plus companies with at least one member, plus an eight-week creation trend. Accepts the list filters minus `name` and pagination.
   * @tags Companies
   * @name CompanyStats
   * @summary Company statistics
   * @request GET:/api/v1/companies/stats
   * @secure
   * @response `200` `(CompanyStatsDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CompanyStatsDto`
   */
  export namespace CompanyStats {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Matches name or email. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CompanyStatsDto;
  }

  /**
   * @description `status` is derived from membership/charge/opportunity data — never stored.
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
   * @description `status` is derived from membership/charge/opportunity data — never stored. `startDate: null` clears the date and with it the membership start-date floor.
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
 * @description Paginated list. `q` fuzzy-matches name/email/phone; `email` is exact-match; filter by `kindHint` and `companyId`. The `status` field on each result is derived on read, never stored: a manual `statusOverride` pin (set via PUT /members/:id/status) wins, otherwise it derives from memberships, then one-off charges, then open opportunities, then `kindHint`. `status` can also be used as a filter — since it is derived rather than a column, matching candidates are resolved before paging, so `totalItems` is always the exact count of matches, never a post-page approximation.
 * @tags Members
 * @name ListMembers
 * @summary List members
 * @request GET:/api/v1/members
 * @secure
 * @response `200` `{
    results: Array<MemberDto>,
    meta: PageMetaDto,

}` 200
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
      /**
       * Derived lifecycle status. Not a column: the list resolves every
       * candidate's status first and pages the matches, so totals stay true.
       */
      status?: MemberStatus;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<MemberDto>;
      meta: PageMetaDto;
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
   * @description Counts by derived status, kind hint and employer, plus an eight-week creation trend. Accepts the list filters minus status and pagination.
   * @tags Members
   * @name MemberStats
   * @summary Member statistics
   * @request GET:/api/v1/members/stats
   * @secure
   * @response `200` `(MemberStatsDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MemberStatsDto`
   */
  export namespace MemberStats {
    export type RequestParams = {};
    export type RequestQuery = {
      kindHint?: MemberKindHint;
      /** @format uuid */
      companyId?: string;
      /** Matches fullName, email or phone. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MemberStatsDto;
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
   * @description Staff/admin may update all business fields except `companyId` — sending it is rejected with 422; moving a member is PUT /members/:id/company. A member-role caller may only update their own record, restricted to fullName, email and phone — any other field is rejected with 403. The user link is never updatable here.
   * @tags Members
   * @name UpdateMember
   * @summary Update a member
   * @request PATCH:/api/v1/members/{id}
   * @secure
   * @response `200` `(MemberDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
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
   * @description Manually pins the derived `status` to `former` or `contact`; a pinned status never auto-updates. Send `auto` to clear the pin and let the status derive from membership, charge and opportunity data again.
   * @tags Members
   * @name UpdateMemberStatus
   * @summary Pin or clear a member lifecycle status
   * @request PUT:/api/v1/members/{id}/status
   * @secure
   * @response `200` `(MemberDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MemberDto`
   */
  export namespace UpdateMemberStatus {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateMemberStatusDto;
    export type RequestHeaders = {};
    export type ResponseBody = MemberDto;
  }

  /**
   * @description The only way to re-assign a member — `companyId` is not accepted by PATCH /members/:id, which rejects it with 422. Send `null` to detach the member into a solo member. A move that really changes the company clears `isBillingPerson`/`isContactPerson`: those roles are held within a company and are never carried across. Re-sending the current company is a no-op and keeps the flags.
   * @tags Members
   * @name UpdateMemberCompany
   * @summary Move a member to another company
   * @request PUT:/api/v1/members/{id}/company
   * @secure
   * @response `200` `(MemberDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `((ResponseErrorDto))` 404
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MemberDto`
   */
  export namespace UpdateMemberCompany {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateMemberCompanyDto;
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
 * @response `200` `{
    results: Array<ResourceTypeDto>,
    meta: PageMetaDto,

}` 200
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
    export type ResponseBody = {
      results: Array<ResourceTypeDto>;
      meta: PageMetaDto;
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
 * @description Admins see all resources; staff and members see only non-hidden ones. Filter by locationId / resourceTypeId; `q` matches the name. `status` keeps only resources whose derived status matches (computed over the full result set, then paginated).
 * @tags Catalog — Resources
 * @name ListResources
 * @summary List resources
 * @request GET:/api/v1/resources
 * @secure
 * @response `200` `{
    results: Array<ResourceDto>,
    meta: PageMetaDto,

}` 200
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
      /** Keep only resources whose derived status matches. */
      status?: ResourceStatus;
      /**
       * Keep only resources whose type allows booking. A resource on a
       * `canBook: false` type cannot be booked at all, so offering it in a
       * booking form is a trap.
       * @example true
       */
      canBook?: boolean;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<ResourceDto>;
      meta: PageMetaDto;
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
   * @response `422` `((ResponseErrorDto))` 422
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
   * @response `422` `((ResponseErrorDto))` 422
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
   * @description OfficeRnD-style derived occupancy. `status` reflects the parent chain and, for parents, the children; `ownStatus` derives from the resource's own availability window and assignments only.
   * @tags Catalog — Resources
   * @name GetResourceStatus
   * @summary Get a resource status
   * @request GET:/api/v1/resources/{id}/status
   * @secure
   * @response `200` `(ResourceStatusDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceStatusDto`
   */
  export namespace GetResourceStatus {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceStatusDto;
  }

  /**
   * @description Stores the image in the public resource-images bucket and sets imageUrl; a previous image is replaced. jpg/jpeg/png only. @FileUpload documents the 413/415 responses.
   * @tags Catalog — Resources
   * @name UploadResourceImage
   * @summary Upload a resource's catalog photo
   * @request PUT:/api/v1/resources/{id}/image
   * @secure
   * @response `200` `(ResourceDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `413` `(ResponseErrorDto)` Payload Too Large
   * @response `415` `(ResponseErrorDto)` Unsupported Media Type
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ResourceDto`
   */
  export namespace UploadResourceImage {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = FileDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceDto;
  }

  /**
   * No description
   * @tags Catalog — Resources
   * @name DeleteResourceImage
   * @summary Remove a resource's catalog photo
   * @request DELETE:/api/v1/resources/{id}/image
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
  export namespace DeleteResourceImage {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceDto;
  }

  /**
 * @description Rates are standalone, shareable, single-price objects typed by resource type; resources attach a set of them via `rateIds` (one per interval/weekend slot). Prices are dinars (TND) HT; VAT as a percentage rate. Filter by resourceTypeId; `q` matches the name.
 * @tags Catalog — Resource Rates
 * @name ListResourceRates
 * @summary List resource rates
 * @request GET:/api/v1/resource-rates
 * @secure
 * @response `200` `{
    results: Array<ResourceRateDto>,
    meta: PageMetaDto,

}` 200
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
      resourceTypeId?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<ResourceRateDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * @description Creates a standalone single-price rate for one resource type; attach it to resources via their `rateIds`. Intervals must fit the type's booking mode (hourly → once/hour/half_day/day, daily → once/day/week/month); weekend variants exist only for hour/half_day/day.
   * @tags Catalog — Resource Rates
   * @name CreateResourceRate
   * @summary Create a resource rate
   * @request POST:/api/v1/resource-rates
   * @secure
   * @response `201` `(ResourceRateDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
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
   * @summary Update a resource rate (type/interval/weekend are immutable)
   * @request PATCH:/api/v1/resource-rates/{id}
   * @secure
   * @response `200` `(ResourceRateDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
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
 * @description Staff and members see active, non-hidden plans only; admins see everything and may filter by `status`; any caller may filter by `kind`. Benefits are embedded, and each plan reports its current `activeMemberships` count (active + pending). Prices are dinars (TND) HT; VAT as a percentage rate.
 * @tags Catalog — Plans
 * @name ListPlans
 * @summary List plans
 * @request GET:/api/v1/plans
 * @secure
 * @response `200` `{
    results: Array<PlanDto>,
    meta: PageMetaDto,

}` 200
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
      kind?: PlanKind;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<PlanDto>;
      meta: PageMetaDto;
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
   * @description ⚠ When price, VAT, deposit, kind/cycle, benefits or extras change on a plan that has memberships, the plan is ARCHIVED and an active clone carrying the changes is returned — the response then has a DIFFERENT id than the request. Existing memberships keep their snapshot of the archived terms. Cosmetic edits (name, description, hidden, cancellationDays, code) always edit in place. Archived plans are immutable (409).
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
 * @description Sales groupings behind the website service sections (coworking, private offices, domiciliation, …), in display order. Defaults are shipped by migrations (isDefault); staff-created categories extend the vocabulary without code changes.
 * @tags Catalog — Plan Categories
 * @name ListPlanCategories
 * @summary List plan categories
 * @request GET:/api/v1/plan-categories
 * @secure
 * @response `200` `{
    results: Array<PlanCategoryDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListPlanCategories {
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
    export type ResponseBody = {
      results: Array<PlanCategoryDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * No description
   * @tags Catalog — Plan Categories
   * @name CreatePlanCategory
   * @summary Create a plan category
   * @request POST:/api/v1/plan-categories
   * @secure
   * @response `201` `(PlanCategoryDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `PlanCategoryDto`
   */
  export namespace CreatePlanCategory {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreatePlanCategoryDto;
    export type RequestHeaders = {};
    export type ResponseBody = PlanCategoryDto;
  }

  /**
   * No description
   * @tags Catalog — Plan Categories
   * @name GetPlanCategory
   * @summary Get a plan category
   * @request GET:/api/v1/plan-categories/{id}
   * @secure
   * @response `200` `(PlanCategoryDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `PlanCategoryDto`
   */
  export namespace GetPlanCategory {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PlanCategoryDto;
  }

  /**
   * No description
   * @tags Catalog — Plan Categories
   * @name UpdatePlanCategory
   * @summary Update a plan category
   * @request PATCH:/api/v1/plan-categories/{id}
   * @secure
   * @response `200` `(PlanCategoryDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `PlanCategoryDto`
   */
  export namespace UpdatePlanCategory {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdatePlanCategoryDto;
    export type RequestHeaders = {};
    export type ResponseBody = PlanCategoryDto;
  }

  /**
 * No description
 * @tags Catalog — Amenities
 * @name ListAmenities
 * @summary List amenities
 * @request GET:/api/v1/amenities
 * @secure
 * @response `200` `{
    results: Array<AmenityDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListAmenities {
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
    export type ResponseBody = {
      results: Array<AmenityDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * No description
   * @tags Catalog — Amenities
   * @name CreateAmenity
   * @summary Create an amenity
   * @request POST:/api/v1/amenities
   * @secure
   * @response `201` `(AmenityDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AmenityDto`
   */
  export namespace CreateAmenity {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateAmenityDto;
    export type RequestHeaders = {};
    export type ResponseBody = AmenityDto;
  }

  /**
   * No description
   * @tags Catalog — Amenities
   * @name GetAmenity
   * @summary Get an amenity
   * @request GET:/api/v1/amenities/{id}
   * @secure
   * @response `200` `(AmenityDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AmenityDto`
   */
  export namespace GetAmenity {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AmenityDto;
  }

  /**
   * No description
   * @tags Catalog — Amenities
   * @name UpdateAmenity
   * @summary Update an amenity
   * @request PATCH:/api/v1/amenities/{id}
   * @secure
   * @response `200` `(AmenityDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AmenityDto`
   */
  export namespace UpdateAmenity {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateAmenityDto;
    export type RequestHeaders = {};
    export type ResponseBody = AmenityDto;
  }

  /**
 * @description Priced add-ons (lockers, parking, catering) attached to plans (per cycle) or resource rates (per booking). Prices are dinars (TND) HT; VAT as a percentage rate.
 * @tags Catalog — Extras
 * @name ListExtras
 * @summary List extras
 * @request GET:/api/v1/extras
 * @secure
 * @response `200` `{
    results: Array<ExtraDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListExtras {
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
    export type ResponseBody = {
      results: Array<ExtraDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * No description
   * @tags Catalog — Extras
   * @name CreateExtra
   * @summary Create an extra
   * @request POST:/api/v1/extras
   * @secure
   * @response `201` `(ExtraDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ExtraDto`
   */
  export namespace CreateExtra {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateExtraDto;
    export type RequestHeaders = {};
    export type ResponseBody = ExtraDto;
  }

  /**
   * No description
   * @tags Catalog — Extras
   * @name GetExtra
   * @summary Get an extra
   * @request GET:/api/v1/extras/{id}
   * @secure
   * @response `200` `(ExtraDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ExtraDto`
   */
  export namespace GetExtra {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExtraDto;
  }

  /**
   * No description
   * @tags Catalog — Extras
   * @name UpdateExtra
   * @summary Update an extra
   * @request PATCH:/api/v1/extras/{id}
   * @secure
   * @response `200` `(ExtraDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `ExtraDto`
   */
  export namespace UpdateExtra {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateExtraDto;
    export type RequestHeaders = {};
    export type ResponseBody = ExtraDto;
  }

  /**
 * @description Plan discounts (per membership) and resource-rate discounts (granted by plans and/or claimed by code at booking confirm). Either kind may target every plan/rate via appliesToAll and carry a validity window. Filter by kind, status or code fragment.
 * @tags Billing — Discounts
 * @name ListDiscounts
 * @summary List discounts
 * @request GET:/api/v1/discounts
 * @secure
 * @response `200` `{
    results: Array<DiscountDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListDiscounts {
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
      kind?: DiscountKind;
      status?: DiscountStatus;
      /**
       * The search term to filter results.
       * @example "LOYAL"
       */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<DiscountDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * No description
   * @tags Billing — Discounts
   * @name CreateDiscount
   * @summary Create a discount
   * @request POST:/api/v1/discounts
   * @secure
   * @response `201` `(DiscountDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `((ResponseErrorDto))` 404
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `DiscountDto`
   */
  export namespace CreateDiscount {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateDiscountDto;
    export type RequestHeaders = {};
    export type ResponseBody = DiscountDto;
  }

  /**
   * No description
   * @tags Billing — Discounts
   * @name GetDiscount
   * @summary Get a discount
   * @request GET:/api/v1/discounts/{id}
   * @secure
   * @response `200` `(DiscountDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `DiscountDto`
   */
  export namespace GetDiscount {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DiscountDto;
  }

  /**
   * @description kind is immutable. Changes never touch existing membership snapshots or charge rows.
   * @tags Billing — Discounts
   * @name UpdateDiscount
   * @summary Update a discount
   * @request PATCH:/api/v1/discounts/{id}
   * @secure
   * @response `200` `(DiscountDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `((ResponseErrorDto))` 404
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `DiscountDto`
   */
  export namespace UpdateDiscount {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateDiscountDto;
    export type RequestHeaders = {};
    export type ResponseBody = DiscountDto;
  }

  /**
   * @description Stops new assignments; existing snapshots and charges keep their values.
   * @tags Billing — Discounts
   * @name ArchiveDiscount
   * @summary Archive a discount
   * @request POST:/api/v1/discounts/{id}/archive
   * @secure
   * @response `200` `(DiscountDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `DiscountDto`
   */
  export namespace ArchiveDiscount {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DiscountDto;
  }

  /**
 * @description Staff/admin billing screen. Filter by customer, kind and `uninvoiced=true` (what the next invoice would pick up).
 * @tags Billing
 * @name ListCharges
 * @summary List charges
 * @request GET:/api/v1/charges
 * @secure
 * @response `200` `{
    results: Array<ChargeDto>,
    meta: PageMetaDto,

}` 200
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
      /** true → only charges not yet on an invoice. */
      uninvoiced?: boolean;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<ChargeDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * @description plan_fee, deposit and booking charges are flow-generated and cannot be created here. Negative amounts are credit-note lines. Passing `planId` derives amountHt/description/vatRate/accountingCode from a one-off catalog plan (any may still be overridden) — OfficeRnD’s "add a fee from a plan".
   * @tags Billing
   * @name CreateCharge
   * @summary Create a manual charge (one_off / store)
   * @request POST:/api/v1/charges
   * @secure
   * @response `201` `(ChargeDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `((ResponseErrorDto))` 422
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
 * @response `200` `{
    results: Array<InvoiceDto>,
    meta: PageMetaDto,

}` 200
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
    export type ResponseBody = {
      results: Array<InvoiceDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * @description Claims the given chargeIds — or ALL uninvoiced charges of the customer — race-safely, freezes HT/VAT/TTC totals (VAT rounded per line) and draws the next sequential HS-YYYY-NNNN number. A negative selection produces a credit note. Invoices are born issued (status sent). Charges of cancelled/pending bookings are never billable: the sweep skips them silently, an explicit chargeIds selection naming one fails with 422.
   * @tags Billing
   * @name CreateInvoice
   * @summary Issue an invoice (§6.4)
   * @request POST:/api/v1/invoices
   * @secure
   * @response `201` `(InvoiceDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
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
   * @description Streams the invoice as a French VAT facture PDF (attachment named after the invoice number, e.g. HS-2026-0042.pdf). Totals are printed from the frozen invoice columns; void invoices are marked ANNULÉE and negative totals render as a facture d’avoir. Member-role callers may only download their own invoices.
   * @tags Billing
   * @name DownloadInvoicePdf
   * @summary Download an invoice as a PDF
   * @request GET:/api/v1/invoices/{id}/download
   * @secure
   * @response `200` `File` The invoice PDF
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `void`
   */
  export namespace DownloadInvoicePdf {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = File;
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
   * @description Drafts only — the charges are released back to uninvoiced. An issued invoice is retired with void, never deleted.
   * @tags Billing
   * @name DeleteDraftInvoice
   * @summary Drafts only — an issued invoice is retired with void (§4.14).
   * @request DELETE:/api/v1/invoices/{id}
   * @secure
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `void`
   */
  export namespace DeleteDraftInvoice {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = any;
  }

  /**
   * @description Draws the sequential number, stamps today as the issue date and re-freezes the totals from the charges as they stand now. The invoice becomes immutable.
   * @tags Billing
   * @name IssueInvoice
   * @summary Issue a draft invoice
   * @request POST:/api/v1/invoices/{id}/issue
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
  export namespace IssueInvoice {
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
   * @response `409` `((ResponseErrorDto))` 409
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
   * @description Payments accumulate; when Σ payments reach the TTC total the invoice flips to paid. A payment exceeding the remaining balance is rejected (the recording locks the invoice row, so concurrent payments cannot double-settle). recorded_by is the calling staff user, resolved server-side.
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
   * @response `422` `((ResponseErrorDto))` 422
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
 * @description Cross-cutting ledger listing. Filters: membership, booking, check-in, credit type, kind (grant/consumption), member (memberships held by the member or their employer company — the pool they actually spend), company, and an occurred_at range (startDate/endDate, both inclusive and independently optional). Balances live on GET /credits/balances — they are per-membership computations, not row queries.
 * @tags Credits
 * @name ListCredits
 * @summary List credit ledger rows
 * @request GET:/api/v1/credits
 * @secure
 * @response `200` `{
    results: Array<CreditTransactionDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListCredits {
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
      membershipId?: string;
      /**
       * Memberships held by the member OR their employer company.
       * @format uuid
       */
      memberId?: string;
      /** @format uuid */
      companyId?: string;
      /** @format uuid */
      bookingId?: string;
      /** @format uuid */
      checkinId?: string;
      /** @example "room_hour" */
      creditType?: string;
      /** grant = positive deltas, consumption = negative deltas. */
      kind?: CreditTransactionKind;
      /**
       * Inclusive lower bound on occurred_at.
       * @format date-time
       */
      startDate?: string;
      /**
       * Inclusive upper bound on occurred_at.
       * @format date-time
       */
      endDate?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<CreditTransactionDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * @description Staff/admin comps, goodwill and corrections — the only entry path for credits outside plan create/renew. An optional resource-type scope restricts where the credits are spendable (NULL = any); an optional future expiry bounds them in time.
   * @tags Credits
   * @name GrantCredit
   * @summary Manually grant credits to a membership
   * @request POST:/api/v1/credits
   * @secure
   * @response `201` `(CreditTransactionDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `((ResponseErrorDto))` 404
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CreditTransactionDto`
   */
  export namespace GrantCredit {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GrantCreditDto;
    export type RequestHeaders = {};
    export type ResponseBody = CreditTransactionDto;
  }

  /**
   * @description FIFO, expiry-aware balances grouped per membership, one entry per credit type. `memberId` covers memberships held by the member or their employer company; at least one id filter is required. With startDate/endDate the result is a STATEMENT for that window: granted/consumed/expired count only movement inside it, while available is the balance as of endDate (cumulative — the start bound cannot apply to it), so granted = consumed + expired + available holds only without a startDate. Members see their own balances via GET /me.
   * @tags Credits
   * @name GetCreditBalances
   * @summary Credit balances of a membership, member or company
   * @request GET:/api/v1/credits/balances
   * @secure
   * @response `200` `(CreditBalancesDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CreditBalancesDto`
   */
  export namespace GetCreditBalances {
    export type RequestParams = {};
    export type RequestQuery = {
      /** @format uuid */
      membershipId?: string;
      /**
       * Memberships held by the member OR their employer company.
       * @format uuid
       */
      memberId?: string;
      /** @format uuid */
      companyId?: string;
      /**
       * Inclusive start of the statement window.
       * @format date-time
       */
      startDate?: string;
      /**
       * Inclusive end of the statement window; defaults to now.
       * @format date-time
       */
      endDate?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreditBalancesDto;
  }

  /**
   * No description
   * @tags Credits
   * @name GetCredit
   * @summary Get a credit ledger row
   * @request GET:/api/v1/credits/{id}
   * @secure
   * @response `200` `(CreditTransactionDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CreditTransactionDto`
   */
  export namespace GetCredit {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreditTransactionDto;
  }

  /**
   * @description Grants only — consumptions are immutable (they belong to their booking/check-in). Explicit null clears a field (open-ended expiry / wildcard scope). A scope change that would orphan an already-allocated consumption is refused.
   * @tags Credits
   * @name UpdateCredit
   * @summary Correct a credit GRANT row
   * @request PATCH:/api/v1/credits/{id}
   * @secure
   * @response `200` `(CreditTransactionDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `((ResponseErrorDto))` 404
   * @response `409` `((ResponseErrorDto))` 409
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `CreditTransactionDto`
   */
  export namespace UpdateCredit {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateCreditDto;
    export type RequestHeaders = {};
    export type ResponseBody = CreditTransactionDto;
  }

  /**
   * @description Deletes a grant no consumption has been allocated against (fat-fingered manual grant). Anything already touched by consumption — and every consumption row — is refused: the ledger is append-only and corrections are compensating entries.
   * @tags Credits
   * @name DeleteCredit
   * @summary Void an UNCONSUMED grant (admin)
   * @request DELETE:/api/v1/credits/{id}
   * @secure
   * @response `204` `void` 204
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `((ResponseErrorDto))` 409
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `void`
   */
  export namespace DeleteCredit {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
 * @description Staff/admin only. `status` filters the derived lifecycle in the query (dates and pauses), so the totals match the tabs; `expiringBefore` matches ends_at ≤ date (renewal follow-ups); `memberId`/`companyId` filter the direct holder (no employer-company pooling), while `forCompanyId` returns a company's whole roster — its own memberships plus those held by its members — and cannot be combined with `companyId`. `q` searches the membership label, the member name and the company name.
 * @tags Memberships
 * @name ListMemberships
 * @summary List memberships
 * @request GET:/api/v1/memberships
 * @secure
 * @response `200` `{
    results: Array<MembershipDto>,
    meta: PageMetaDto,

}` 200
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
       * Memberships held DIRECTLY by this member (no employer-company pooling).
       * @format uuid
       */
      memberId?: string;
      /** @format uuid */
      companyId?: string;
      /**
       * Memberships billed to this company or held by any of its members. Mutually exclusive with companyId.
       * @format uuid
       */
      forCompanyId?: string;
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
    export type ResponseBody = {
      results: Array<MembershipDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * @description Single transaction: validates the customer (member XOR company), snapshots the plan + benefits, grants initial credits (with expiry), writes the plan_fee (and deposit) charge. Status is derived from the dates. An optional endsAt makes the membership fixed-term (inclusive last active day). Optional overrides: priceHt and deposit (0 = waived) write into the snapshot only; name defaults to the plan name.
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
   * @description Counts by derived status (dates and pauses, in the query — the same rule the list filters on), by bill-to and by plan, plus an eight-week trend of memberships created and memberships starting. Accepts the list filters minus `status`, `expiringBefore` and pagination.
   * @tags Memberships
   * @name MembershipStats
   * @summary Membership statistics
   * @request GET:/api/v1/memberships/stats
   * @secure
   * @response `200` `(MembershipStatsDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipStatsDto`
   */
  export namespace MembershipStats {
    export type RequestParams = {};
    export type RequestQuery = {
      /** @format uuid */
      planId?: string;
      /**
       * Memberships held DIRECTLY by this member (no employer-company pooling).
       * @format uuid
       */
      memberId?: string;
      /** @format uuid */
      companyId?: string;
      /**
       * Memberships billed to this company or held by any of its members. Mutually exclusive with companyId.
       * @format uuid
       */
      forCompanyId?: string;
      /** Matches the membership label, the member name or the company name. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipStatsDto;
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
   * @description Cosmetic fields (name/notes) plus discountId — the only contractual field editable post-creation: set to replace the snapshotted discount, or null to clear it. Affects future, non-invoiced cycles only; other contractual terms are frozen in planSnapshot.
   * @tags Memberships
   * @name UpdateMembership
   * @summary Update a membership label/notes/discount
   * @request PATCH:/api/v1/memberships/{id}
   * @secure
   * @response `200` `(MembershipDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipDto`
   */
  export namespace UpdateMembership {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateMembershipDto;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipDto;
  }

  /**
   * @description Sets cancelled_at = today and ends_at per the SNAPSHOT's cancellationDays notice period — never later than an agreed fixed-term ends_at. The membership stays active until ends_at passes.
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
   * @description Pauses are history: resuming closes a row, it never deletes one.
   * @tags Memberships
   * @name ListMembershipPauses
   * @summary List a membership’s pause history
   * @request GET:/api/v1/memberships/{id}/pauses
   * @secure
   * @response `200` `Array<MembershipPauseDto>`
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `Array<MembershipPauseDto>`
   */
  export namespace ListMembershipPauses {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Array<MembershipPauseDto>;
  }

  /**
   * @description Suspends the membership for a half-open date range (startsAt inclusive, endsAt exclusive; omit endsAt to pause indefinitely and close it later with resume). While paused the membership grants no credits, check-ins or bookings, and a cycle covered end to end by pauses is not billed — a partially paused cycle bills in full. The resource assignment is KEPT and credits already granted keep their original expiry.
   * @tags Memberships
   * @name PauseMembership
   * @summary Pause a membership
   * @request POST:/api/v1/memberships/{id}/pause
   * @secure
   * @response `201` `(MembershipPauseDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipPauseDto`
   */
  export namespace PauseMembership {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = CreateMembershipPauseDto;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipPauseDto;
  }

  /**
   * @description Closes the open pause. endsAt is the first ACTIVE day again and defaults to today.
   * @tags Memberships
   * @name ResumeMembership
   * @summary Resume a paused membership
   * @request POST:/api/v1/memberships/{id}/resume
   * @secure
   * @response `200` `(MembershipPauseDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `MembershipPauseDto`
   */
  export namespace ResumeMembership {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = ResumeMembershipDto;
    export type RequestHeaders = {};
    export type ResponseBody = MembershipPauseDto;
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
   * @response `422` `((ResponseErrorDto))` 422
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
 * @description Staff/admin only. `activeOn` matches assignments covering that business date (startsAt ≤ date < endsAt, endsAt NULL = open).
 * @tags Assignments
 * @name ListAssignments
 * @summary List resource assignments
 * @request GET:/api/v1/assignments
 * @secure
 * @response `200` `{
    results: Array<AssignmentDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
*/
  export namespace ListAssignments {
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
      /** @format uuid */
      membershipId?: string;
      /**
       * Only assignments covering this business date.
       * @example "2026-08-01"
       */
      activeOn?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<AssignmentDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * @description The resource type must be canAssign and the membership must not be ended. Overlaps for the same resource are rejected at the database (GiST exclusion) — 23P01 → 409. On a fixed-term membership an omitted or later `endsAt` is silently CAPPED to the day after the membership ends (its ends_at is the last active day, an assignment ends_at is the first free day), never rejected — read the response to see the stored boundary.
   * @tags Assignments
   * @name CreateAssignment
   * @summary Assign a resource to a membership
   * @request POST:/api/v1/assignments
   * @secure
   * @response `201` `(AssignmentDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AssignmentDto`
   */
  export namespace CreateAssignment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateAssignmentDto;
    export type RequestHeaders = {};
    export type ResponseBody = AssignmentDto;
  }

  /**
   * @description Sets ends_at on an open assignment (half-open: endsAt is the first free day). Already-ended assignments are rejected.
   * @tags Assignments
   * @name EndAssignment
   * @summary End an open assignment
   * @request POST:/api/v1/assignments/{id}/end
   * @secure
   * @response `200` `(AssignmentDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AssignmentDto`
   */
  export namespace EndAssignment {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = EndAssignmentDto;
    export type RequestHeaders = {};
    export type ResponseBody = AssignmentDto;
  }

  /**
   * @description OfficeRnD relocate: ends the current assignment at effectiveDate and opens a new one on the destination resource, in one transaction. On a fixed-term membership the successor is silently CAPPED to the day after the membership ends (its ends_at is the last active day, an assignment ends_at is the first free day), never rejected — read the response to see the stored boundary.
   * @tags Assignments
   * @name RelocateAssignment
   * @summary Relocate an assignment to another resource
   * @request POST:/api/v1/assignments/{id}/relocate
   * @secure
   * @response `201` `(AssignmentDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `((ResponseErrorDto))` 409
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AssignmentDto`
   */
  export namespace RelocateAssignment {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = RelocateAssignmentDto;
    export type RequestHeaders = {};
    export type ResponseBody = AssignmentDto;
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
   * @response `422` `((ResponseErrorDto))` 422
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
 * @response `200` `{
    results: Array<CheckinDto>,
    meta: PageMetaDto,

}` 200
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
    export type ResponseBody = {
      results: Array<CheckinDto>;
      meta: PageMetaDto;
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
   * @response `422` `((ResponseErrorDto))` 422
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
 * @description Staff/admin see everything; member-role callers see their own and their employer company's bookings. Filters: resourceId, status, source, memberId, companyId, isFree, and from/to (interval overlap — a booking matches when it touches the range). `q` searches title, notes and the customer name.
 * @tags Bookings
 * @name ListBookings
 * @summary List bookings
 * @request GET:/api/v1/bookings
 * @secure
 * @response `200` `{
    results: Array<BookingDto>,
    meta: PageMetaDto,

}` 200
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
      status?: BookingStatus;
      source?: BookingSource;
      /**
       * Customer filter; member XOR company, same as the booking itself.
       * @format uuid
       */
      memberId?: string;
      /** @format uuid */
      companyId?: string;
      /**
       * Query strings arrive as text; "true"/"false" become booleans.
       * @example true
       */
      isFree?: boolean;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<BookingDto>;
      meta: PageMetaDto;
    };
  }

  /**
   * @description Members book for themselves (source=portal); staff book for any member XOR company (source=staff). Pricing: room_hour credits first (scope from membership snapshots, drained soonest-expiring first), remainder at the member rate — or the visitor rate without a membership. price_ht is NULL when fully credit-covered. Conflicts are impossible at the database level (GiST exclusion constraint). Staff may pass isFree + freeReason: no credits are consumed and no charges written (room and extras alike).
   * @tags Bookings
   * @name CreateBooking
   * @summary Create a booking (§6.3 credit-first pricing)
   * @request POST:/api/v1/bookings
   * @secure
   * @response `201` `(BookingDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
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
   * @description Staff/admin only — unlike the list, this is never scoped to a caller's own bookings, so it stays off the member role entirely. Counts for the list tabs and the summary cards, computed in the database. Takes the same filters as the list except `status` — the counts are the per-status breakdown, so filtering by it would collapse them. Every status is present, zero included. Because `status` is not accepted, `total` and `bookedValueHt` NEVER narrow by it: on a status tab they still describe every row the other filters match, not the visible ones, and `bookedValueHt` sums cancelled and no-show bookings along with the rest. Label them accordingly — they are range totals, not tab totals. Also returns `byResource` (busiest room first) and `byWeek` — the last eight weeks, oldest first, always all eight, so a chart drawn from it keeps its shape. There is no weekly cancellation series: bookings have no cancelled_at column, and updated_at moves on any title or notes edit.
   * @tags Bookings
   * @name GetBookingStats
   * @summary Booking counts, values and weekly trend
   * @request GET:/api/v1/bookings/stats
   * @secure
   * @response `200` `(BookingStatsDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingStatsDto`
   */
  export namespace GetBookingStats {
    export type RequestParams = {};
    export type RequestQuery = {
      q?: string;
      /** @format uuid */
      resourceId?: string;
      /** @example "2026-08-01T00:00:00Z" */
      from?: string;
      /** @example "2026-08-31T23:59:59Z" */
      to?: string;
      source?: BookingSource;
      /** @format uuid */
      memberId?: string;
      /** @format uuid */
      companyId?: string;
      /**
       * Query strings arrive as text; "true"/"false" become booleans.
       * @example true
       */
      isFree?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BookingStatsDto;
  }

  /**
   * @description Everything one grid needs in a single read: per bookable room, its header summary, its bookable windows per local day, and its pending and confirmed bookings as blocks. `from` is inclusive and `to` is exclusive, so a one-day grid is midnight to midnight. Range ≤ 31 days. The grid covers one location — its timezone is on the envelope.
   * @tags Bookings
   * @name GetBookingCalendar
   * @summary Calendar grid: rooms, windows and blocks
   * @request GET:/api/v1/bookings/calendar
   * @secure
   * @response `200` `(BookingCalendarDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingCalendarDto`
   */
  export namespace GetBookingCalendar {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Inclusive start instant.
       * @example "2026-08-24T00:00:00Z"
       */
      from: string;
      /**
       * EXCLUSIVE end instant — a one-day grid is midnight to midnight.
       * @example "2026-08-25T00:00:00Z"
       */
      to: string;
      /**
       * Comma-separated; omit for every bookable room in scope.
       * @example "6f9619ff-8b86-4d11-b42d-00c04fc964ff,c6a2f0de-9a2c-4a1e-9b7a-2f1d3c4b5a60"
       */
      resourceIds?: string;
      /** @format uuid */
      resourceTypeId?: string;
      /** @format uuid */
      locationId?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BookingCalendarDto;
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
   * @response `403` `(ResponseErrorDto)` Forbidden
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
   * @description Title and notes anytime; staff may flag no_show after the start time. Passing startsAt AND endsAt reschedules: the slot is re-checked (ignoring this booking itself), the room is re-priced at the new duration and its credits and charges are reversed and re-applied. Passing extraIds replaces the extras ([] removes them all; omitted leaves them alone) and re-runs the money the same way. Extras that stay keep the prices they were booked at; only newly added ones are priced live. Passing discountId changes the booking's discount (docs/superpowers/plans/2026-08-29-booking-patch-discount.md): null removes it, an id resolves the same way as create's discountId and re-runs the money like an extraIds change for a CONFIRMED booking; a PENDING booking has no money yet, so only its stored snapshot is replaced. The resource cannot change — moving a booking between rooms is still cancel + rebook. Members may edit inside the cancellation window.
   * @tags Bookings
   * @name UpdateBooking
   * @summary Update a booking (metadata, no_show, reschedule, extras)
   * @request PATCH:/api/v1/bookings/{id}
   * @secure
   * @response `200` `(BookingDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `((ResponseErrorDto))` 404
   * @response `409` `((ResponseErrorDto))` 409
   * @response `422` `((ResponseErrorDto))` 422
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
   * @response `404` `(ResponseErrorDto)` Not Found
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
   * @response `403` `((ResponseErrorDto))` 403
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
   * @description Staff-only. Re-checks availability, prices the booking per §6.3 (typically the visitor rate → a booking charge) and flips it to confirmed — from then on it blocks the slot. Optional body { isFree, freeReason } confirms a partner request as complimentary.
   * @tags Bookings
   * @name ConfirmBooking
   * @summary Staff confirmation of website booking requests (Phase 6).
   * @request POST:/api/v1/bookings/{id}/confirm
   * @secure
   * @response `200` `(BookingDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `((ResponseErrorDto))` 404
   * @response `409` `(ResponseErrorDto)` Conflict
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `BookingDto`
   */
  export namespace ConfirmBooking {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = ConfirmBookingDto;
    export type RequestHeaders = {};
    export type ResponseBody = BookingDto;
  }

  /**
   * @description Bookable windows per day (booking_times, falling back to the location opening hours, minus closed days) plus confirmed busy intervals clipped to the range (≤ 31 days). `from` is inclusive and `to` is exclusive, so a week is midnight to midnight — the day `to` lands on is not part of the range. Clients render free slots; the server re-validates at create time. The response carries the resource location's IANA `timezone`; the `days[]` windows ("08:00") are wall-clock in that zone, not UTC. `excludeBookingId` drops one booking from the busy intervals — pass the booking being rescheduled so its own current slot reads as free.
   * @tags Bookings
   * @name GetResourceAvailability
   * @summary Resource availability (windows + busy intervals)
   * @request GET:/api/v1/resources/{id}/availability
   * @secure
   * @response `200` `(AvailabilityDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `AvailabilityDto`
   */
  export namespace GetResourceAvailability {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {
      /**
       * Inclusive start instant.
       * @example "2026-07-13T00:00:00Z"
       */
      from: string;
      /**
       * EXCLUSIVE end instant — the same half-open convention the busy
       * query (`starts_at < :to`) and the calendar already use. To cover
       * 13–19 July, pass the 20th at 00:00, not the 19th at 23:59:59.
       * @example "2026-07-20T00:00:00Z"
       */
      to: string;
      /**
       * The booking currently being rescheduled. Its own busy interval is
       * dropped from the response, so the slot it already holds reads as
       * free — which is where "make it half an hour longer" starts.
       * @format uuid
       */
      excludeBookingId?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AvailabilityDto;
  }

  /**
 * @description Pipeline view. Filter by stage, interest, source or memberId; `q` searches the member's name. Filter by creation time with createdFrom/createdTo (ISO instants, upper bound exclusive). They are instants rather than dates because an opportunity has no location and therefore no timezone in which to define a day — the client decides what day it means.
 * @tags CRM
 * @name ListOpportunities
 * @summary List opportunities
 * @request GET:/api/v1/opportunities
 * @secure
 * @response `200` `{
    results: Array<OpportunityDto>,
    meta: PageMetaDto,

}` 200
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
      /**
       * Exact match on the free-text source; the options come from stats.
       * @example "website"
       */
      source?: string;
      stage?: OpportunityStage;
      interest?: OpportunityInterest;
      /** @format uuid */
      memberId?: string;
      /**
       * Instants, not dates. An opportunity has no location, so the server
       * has no timezone in which to decide what "a day" is — and picking one
       * would bake a region into a region-neutral entity. The client turns
       * the day it means into a pair of instants.
       * @example "2026-08-01T00:00:00Z"
       */
      createdFrom?: string;
      /**
       * Exclusive upper bound.
       * @example "2026-08-08T00:00:00Z"
       */
      createdTo?: string;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      results: Array<OpportunityDto>;
      meta: PageMetaDto;
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
   * @description What the filters above the list need, in one request: per stage, how many leads and what they are worth, and every source present in the data with its count. Totals, the open/won/lost split and the pipeline all follow from the stage rows. Accepts the same q and interest filters as the list, so the numbers match the rows on screen. Every stage is present, zero included; sources are those that exist, busiest first; and byWeek carries the last eight weeks of leads opened, won and lost, always all eight so a quiet week reads as zero rather than going missing. Filter by creation time with createdFrom/createdTo (ISO instants, upper bound exclusive). They are instants rather than dates because an opportunity has no location and therefore no timezone in which to define a day — the client decides what day it means.
   * @tags CRM
   * @name OpportunityStats
   * @summary Pipeline totals
   * @request GET:/api/v1/opportunities/stats
   * @secure
   * @response `200` `(OpportunityStatsDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `OpportunityStatsDto`
   */
  export namespace OpportunityStats {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Same search as the list: the member's name or the source. */
      q?: string;
      interest?: OpportunityInterest;
      /**
       * Instants, not dates. An opportunity has no location, so the server
       * has no timezone in which to decide what "a day" is — and picking one
       * would bake a region into a region-neutral entity. The client turns
       * the day it means into a pair of instants.
       * @example "2026-08-01T00:00:00Z"
       */
      createdFrom?: string;
      /**
       * Exclusive upper bound.
       * @example "2026-08-08T00:00:00Z"
       */
      createdTo?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OpportunityStatsDto;
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
   * @description ONE transaction: creates the membership from the opportunity (requested plan, extras, quoted plan-fee figure), grants its initial credits and charges, and marks the opportunity won. When the opportunity names a space it is assigned from day one (assignable resources only, for now); when it names none the membership is created anyway and `assignment` comes back null, for staff to assign later. The request carries the dates and nothing else — to change what is sold, PATCH the opportunity first.
   * @tags Onboarding
   * @name OnboardLead
   * @summary Onboard a lead (opportunity → membership + assignment)
   * @request POST:/api/v1/onboarding
   * @secure
   * @response `201` `(OnboardingResultDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `403` `((ResponseErrorDto))` 403
   * @response `404` `(ResponseErrorDto)` Not Found
   * @response `409` `((ResponseErrorDto))` 409
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   * @response `default` `OnboardingResultDto`
   */
  export namespace OnboardLead {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OnboardLeadDto;
    export type RequestHeaders = {};
    export type ResponseBody = OnboardingResultDto;
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
   * @response `422` `((ResponseErrorDto))` 422
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
   * @description HT/VAT/TTC sums in dinars (TND). group_by=plan buckets membership-linked charges by their snapshot plan name; other charges by kind.
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
   * @description Active, non-hidden plans, cheapest first. Filter by ?category=<slug> for one service section (see GET /public/plan-categories). Each plan carries `offer`: the single best public, active, in-window discount targeting it, server-priced (discountedPriceHt/Ttc) — null when none applies. Server-to-server only.
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
    export type RequestQuery = {
      /**
       * Category slug, as returned by GET /public/plan-categories.
       * @example "domiciliation"
       */
      category?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = PublicPlanDto;
  }

  /**
   * @description Plan categories with at least one visible plan (coworking, private offices, domiciliation, …), in display order — the website landing/pricing sections. Server-to-server only.
   * @tags Public (website)
   * @name PublicListPlanCategories
   * @summary Service sections for the website
   * @request GET:/api/v1/public/plan-categories
   * @response `200` `(PublicPlanCategoryDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   */
  export namespace PublicListPlanCategories {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = PublicPlanCategoryDto;
  }

  /**
   * @description Any bookable, visible resource. Bookable windows + busy intervals. The response carries the resource location's IANA `timezone`; the `days[]` windows ("08:00") are wall-clock in that zone, not UTC or the browser's zone — render them against `timezone`, not a compiled-in default.
   * @tags Public (website)
   * @name PublicResourceAvailability
   * @summary Resource availability for the website
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
      /**
       * Inclusive start instant.
       * @example "2026-07-13T00:00:00Z"
       */
      from: string;
      /**
       * EXCLUSIVE end instant — the same half-open convention the busy
       * query (`starts_at < :to`) and the calendar already use. To cover
       * 13–19 July, pass the 20th at 00:00, not the 19th at 23:59:59.
       * @example "2026-07-20T00:00:00Z"
       */
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
   * @description Active, visible, sellable spaces: bookable ones carry rates, plan-sold ones carry their target plans (cheapest first, each with its own `offer` — see GET /public/plans), pool parents carry live seat counts; every card has a derived status badge. Filter by ?resourceType=<slug> for one catalog tab, and/or ?planCode=<code> for the spaces sold under one plan. Server-to-server only.
   * @tags Public (website)
   * @name PublicListResources
   * @summary Space catalog for the website
   * @request GET:/api/v1/public/resources
   * @response `200` `(PublicResourceDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   */
  export namespace PublicListResources {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Resource-type slug, as returned by GET /public/resource-types.
       * @example "meeting_room"
       */
      resourceType?: string;
      /**
       * Plan code, as returned by GET /public/plans — keeps spaces whose
       * target plans include it. Code, not id: the code survives
       * archive+clone, so a stored link never goes stale. Unknown code =
       * empty list (filter semantics, like an unmatched resourceType).
       * @example "DAY_PASS"
       */
      planCode?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = PublicResourceDto;
  }

  /**
   * @description Resource types with at least one publicly visible space, for the catalog tab bar. Server-to-server only.
   * @tags Public (website)
   * @name PublicListResourceTypes
   * @summary Catalog tabs for the website
   * @request GET:/api/v1/public/resource-types
   * @response `200` `(PublicResourceTypeDto)` 200
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `(ResponseErrorDto)` Unprocessable Entity
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   */
  export namespace PublicListResourceTypes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = PublicResourceTypeDto;
  }

  /**
   * @description Creates member (visitor) + PENDING booking + opportunity in one transaction; staff confirms (and prices) later. Identity comes only from the body — no user account involved. `discountCode`, if sent, is stored verbatim on the booking for staff to review — it is never validated or priced on this path.
   * @tags Public (website)
   * @name PublicCreateBookingRequest
   * @summary Website booking request
   * @request POST:/api/v1/public/booking-requests
   * @response `201` `(BookingRequestResultDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `((ResponseErrorDto))` 422
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
   * @description Creates member (visitor) + opportunity carrying the requested plan, its selected extras and the quoted value in one transaction; staff convert it into a membership at the price the visitor saw. Send planId (pricing page) or resourceId (a catalog space card — the plan resolves via its target plans, and planId picks one when the space is sold under several). Identity comes only from the body — no user account involved. `discountCode`, if sent, is stored verbatim on the opportunity for staff to review — it is never validated or priced on this path.
   * @tags Public (website)
   * @name PublicCreatePlanRequest
   * @summary Website plan request
   * @request POST:/api/v1/public/plan-requests
   * @response `201` `(PlanRequestResultDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   */
  export namespace PublicCreatePlanRequest {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreatePlanRequestDto;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = PlanRequestResultDto;
  }

  /**
   * @description Creates member (visitor) + opportunity for a lightweight lead: the visitor asks about a service category (categorySlug, see GET /public/plan-categories; bare interest slugs like meeting_room are accepted too) OR wants a free trial day (freeDay) — exactly one of the two. No plan and no quote; the priced funnels stay /plan-requests and /booking-requests. Identity comes only from the body — no user account involved.
   * @tags Public (website)
   * @name PublicCreateContactRequest
   * @summary Landing-page contact request
   * @request POST:/api/v1/public/contact-requests
   * @response `201` `(ContactRequestResultDto)` 201
   * @response `401` `(ResponseErrorDto)` Unauthorized
   * @response `422` `((ResponseErrorDto))` 422
   * @response `429` `(ResponseErrorDto)` Too Many Requests
   * @response `500` `(ResponseErrorDto)` Internal Server Error
   */
  export namespace PublicCreateContactRequest {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateContactRequestDto;
    export type RequestHeaders = {
      /** Pre-provisioned service key (see SERVICE_API_KEYS). No user identity is attached to this group. */
      "X-Api-Key": string;
    };
    export type ResponseBody = ContactRequestResultDto;
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
 * @title Hyperspace OS API
 * @version 0.0.1
 * @baseUrl /
 * @contact
 *
 * Hyperspace OS backend API
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
 * @description Paginated list of locations. `q` filters by name.
 *
 * @tags Locations
 * @name ListLocations
 * @summary List locations
 * @request GET:/api/v1/locations
 * @secure
 * @response `200` `{
    results: Array<LocationDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listLocations: (query: ListLocationsParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<LocationDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
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
      this.http.request<LocationDto, ResponseErrorDto | LocationDto>({
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
      this.http.request<LocationDto, ResponseErrorDto | LocationDto>({
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
      this.http.request<LocationDto, ResponseErrorDto | LocationDto>({
        path: `/api/v1/locations/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Paginated list. `q` fuzzy-matches name/email; `name` is exact-match. `status` is derived from membership/charge/opportunity data — never stored.
 *
 * @tags Companies
 * @name ListCompanies
 * @summary List companies
 * @request GET:/api/v1/companies
 * @secure
 * @response `200` `{
    results: Array<CompanyDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listCompanies: (query: ListCompaniesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<CompanyDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/companies`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description `status` is derived from membership/charge/opportunity data — never stored.
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
      this.http.request<CompanyDto, ResponseErrorDto | CompanyDto>({
        path: `/api/v1/companies`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Counts by derived status plus companies with at least one member, plus an eight-week creation trend. Accepts the list filters minus `name` and pagination.
     *
     * @tags Companies
     * @name CompanyStats
     * @summary Company statistics
     * @request GET:/api/v1/companies/stats
     * @secure
     * @response `200` `(CompanyStatsDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CompanyStatsDto`
     */
    companyStats: (query: CompanyStatsParams, params: RequestParams = {}) =>
      this.http.request<CompanyStatsDto, ResponseErrorDto | CompanyStatsDto>({
        path: `/api/v1/companies/stats`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description `status` is derived from membership/charge/opportunity data — never stored.
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
      this.http.request<CompanyDto, ResponseErrorDto | CompanyDto>({
        path: `/api/v1/companies/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description `status` is derived from membership/charge/opportunity data — never stored. `startDate: null` clears the date and with it the membership start-date floor.
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
      this.http.request<CompanyDto, ResponseErrorDto | CompanyDto>({
        path: `/api/v1/companies/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Paginated list. `q` fuzzy-matches name/email/phone; `email` is exact-match; filter by `kindHint` and `companyId`. The `status` field on each result is derived on read, never stored: a manual `statusOverride` pin (set via PUT /members/:id/status) wins, otherwise it derives from memberships, then one-off charges, then open opportunities, then `kindHint`. `status` can also be used as a filter — since it is derived rather than a column, matching candidates are resolved before paging, so `totalItems` is always the exact count of matches, never a post-page approximation.
 *
 * @tags Members
 * @name ListMembers
 * @summary List members
 * @request GET:/api/v1/members
 * @secure
 * @response `200` `{
    results: Array<MemberDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listMembers: (query: ListMembersParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<MemberDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
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
      this.http.request<MemberDto, ResponseErrorDto | MemberDto>({
        path: `/api/v1/members`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Counts by derived status, kind hint and employer, plus an eight-week creation trend. Accepts the list filters minus status and pagination.
     *
     * @tags Members
     * @name MemberStats
     * @summary Member statistics
     * @request GET:/api/v1/members/stats
     * @secure
     * @response `200` `(MemberStatsDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MemberStatsDto`
     */
    memberStats: (query: MemberStatsParams, params: RequestParams = {}) =>
      this.http.request<MemberStatsDto, ResponseErrorDto | MemberStatsDto>({
        path: `/api/v1/members/stats`,
        method: "GET",
        query: query,
        secure: true,
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
     * @description Staff/admin may update all business fields except `companyId` — sending it is rejected with 422; moving a member is PUT /members/:id/company. A member-role caller may only update their own record, restricted to fullName, email and phone — any other field is rejected with 403. The user link is never updatable here.
     *
     * @tags Members
     * @name UpdateMember
     * @summary Update a member
     * @request PATCH:/api/v1/members/{id}
     * @secure
     * @response `200` `(MemberDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
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
     * @description Manually pins the derived `status` to `former` or `contact`; a pinned status never auto-updates. Send `auto` to clear the pin and let the status derive from membership, charge and opportunity data again.
     *
     * @tags Members
     * @name UpdateMemberStatus
     * @summary Pin or clear a member lifecycle status
     * @request PUT:/api/v1/members/{id}/status
     * @secure
     * @response `200` `(MemberDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MemberDto`
     */
    updateMemberStatus: (id: string, data: UpdateMemberStatusDto, params: RequestParams = {}) =>
      this.http.request<MemberDto, ResponseErrorDto | MemberDto>({
        path: `/api/v1/members/${id}/status`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description The only way to re-assign a member — `companyId` is not accepted by PATCH /members/:id, which rejects it with 422. Send `null` to detach the member into a solo member. A move that really changes the company clears `isBillingPerson`/`isContactPerson`: those roles are held within a company and are never carried across. Re-sending the current company is a no-op and keeps the flags.
     *
     * @tags Members
     * @name UpdateMemberCompany
     * @summary Move a member to another company
     * @request PUT:/api/v1/members/{id}/company
     * @secure
     * @response `200` `(MemberDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `((ResponseErrorDto))` 404
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MemberDto`
     */
    updateMemberCompany: (id: string, data: UpdateMemberCompanyDto, params: RequestParams = {}) =>
      this.http.request<MemberDto, ResponseErrorDto | MemberDto>({
        path: `/api/v1/members/${id}/company`,
        method: "PUT",
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
 * @response `200` `{
    results: Array<ResourceTypeDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listResourceTypes: (query: ListResourceTypesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<ResourceTypeDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
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
      this.http.request<ResourceTypeDto, ResponseErrorDto | ResourceTypeDto>({
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
      this.http.request<ResourceTypeDto, ResponseErrorDto | ResourceTypeDto>({
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
      this.http.request<ResourceTypeDto, ResponseErrorDto | ResourceTypeDto>({
        path: `/api/v1/resource-types/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Admins see all resources; staff and members see only non-hidden ones. Filter by locationId / resourceTypeId; `q` matches the name. `status` keeps only resources whose derived status matches (computed over the full result set, then paginated).
 *
 * @tags Catalog — Resources
 * @name ListResources
 * @summary List resources
 * @request GET:/api/v1/resources
 * @secure
 * @response `200` `{
    results: Array<ResourceDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listResources: (query: ListResourcesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<ResourceDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
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
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceDto`
     */
    createResource: (data: CreateResourceDto, params: RequestParams = {}) =>
      this.http.request<ResourceDto, ResponseErrorDto | ResourceDto>({
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
      this.http.request<ResourceDto, ResponseErrorDto | ResourceDto>({
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
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceDto`
     */
    updateResource: (id: string, data: UpdateResourceDto, params: RequestParams = {}) =>
      this.http.request<ResourceDto, ResponseErrorDto | ResourceDto>({
        path: `/api/v1/resources/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description OfficeRnD-style derived occupancy. `status` reflects the parent chain and, for parents, the children; `ownStatus` derives from the resource's own availability window and assignments only.
     *
     * @tags Catalog — Resources
     * @name GetResourceStatus
     * @summary Get a resource status
     * @request GET:/api/v1/resources/{id}/status
     * @secure
     * @response `200` `(ResourceStatusDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceStatusDto`
     */
    getResourceStatus: (id: string, params: RequestParams = {}) =>
      this.http.request<ResourceStatusDto, ResponseErrorDto | ResourceStatusDto>({
        path: `/api/v1/resources/${id}/status`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Stores the image in the public resource-images bucket and sets imageUrl; a previous image is replaced. jpg/jpeg/png only. @FileUpload documents the 413/415 responses.
     *
     * @tags Catalog — Resources
     * @name UploadResourceImage
     * @summary Upload a resource's catalog photo
     * @request PUT:/api/v1/resources/{id}/image
     * @secure
     * @response `200` `(ResourceDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `413` `(ResponseErrorDto)` Payload Too Large
     * @response `415` `(ResponseErrorDto)` Unsupported Media Type
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceDto`
     */
    uploadResourceImage: (id: string, data: FileDto, params: RequestParams = {}) =>
      this.http.request<ResourceDto, ResponseErrorDto | ResourceDto>({
        path: `/api/v1/resources/${id}/image`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Resources
     * @name DeleteResourceImage
     * @summary Remove a resource's catalog photo
     * @request DELETE:/api/v1/resources/{id}/image
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
    deleteResourceImage: (id: string, params: RequestParams = {}) =>
      this.http.request<ResourceDto, ResponseErrorDto | ResourceDto>({
        path: `/api/v1/resources/${id}/image`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * @description Rates are standalone, shareable, single-price objects typed by resource type; resources attach a set of them via `rateIds` (one per interval/weekend slot). Prices are dinars (TND) HT; VAT as a percentage rate. Filter by resourceTypeId; `q` matches the name.
 *
 * @tags Catalog — Resource Rates
 * @name ListResourceRates
 * @summary List resource rates
 * @request GET:/api/v1/resource-rates
 * @secure
 * @response `200` `{
    results: Array<ResourceRateDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listResourceRates: (query: ListResourceRatesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<ResourceRateDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/resource-rates`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a standalone single-price rate for one resource type; attach it to resources via their `rateIds`. Intervals must fit the type's booking mode (hourly → once/hour/half_day/day, daily → once/day/week/month); weekend variants exist only for hour/half_day/day.
     *
     * @tags Catalog — Resource Rates
     * @name CreateResourceRate
     * @summary Create a resource rate
     * @request POST:/api/v1/resource-rates
     * @secure
     * @response `201` `(ResourceRateDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceRateDto`
     */
    createResourceRate: (data: CreateResourceRateDto, params: RequestParams = {}) =>
      this.http.request<ResourceRateDto, ResponseErrorDto | ResourceRateDto>({
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
      this.http.request<ResourceRateDto, ResponseErrorDto | ResourceRateDto>({
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
     * @summary Update a resource rate (type/interval/weekend are immutable)
     * @request PATCH:/api/v1/resource-rates/{id}
     * @secure
     * @response `200` `(ResourceRateDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ResourceRateDto`
     */
    updateResourceRate: (id: string, data: UpdateResourceRateDto, params: RequestParams = {}) =>
      this.http.request<ResourceRateDto, ResponseErrorDto | ResourceRateDto>({
        path: `/api/v1/resource-rates/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff and members see active, non-hidden plans only; admins see everything and may filter by `status`; any caller may filter by `kind`. Benefits are embedded, and each plan reports its current `activeMemberships` count (active + pending). Prices are dinars (TND) HT; VAT as a percentage rate.
 *
 * @tags Catalog — Plans
 * @name ListPlans
 * @summary List plans
 * @request GET:/api/v1/plans
 * @secure
 * @response `200` `{
    results: Array<PlanDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listPlans: (query: ListPlansParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<PlanDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
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
      this.http.request<PlanDto, ResponseErrorDto | PlanDto>({
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
      this.http.request<PlanDto, ResponseErrorDto | PlanDto>({
        path: `/api/v1/plans/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description ⚠ When price, VAT, deposit, kind/cycle, benefits or extras change on a plan that has memberships, the plan is ARCHIVED and an active clone carrying the changes is returned — the response then has a DIFFERENT id than the request. Existing memberships keep their snapshot of the archived terms. Cosmetic edits (name, description, hidden, cancellationDays, code) always edit in place. Archived plans are immutable (409).
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
      this.http.request<PlanDto, ResponseErrorDto | PlanDto>({
        path: `/api/v1/plans/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Sales groupings behind the website service sections (coworking, private offices, domiciliation, …), in display order. Defaults are shipped by migrations (isDefault); staff-created categories extend the vocabulary without code changes.
 *
 * @tags Catalog — Plan Categories
 * @name ListPlanCategories
 * @summary List plan categories
 * @request GET:/api/v1/plan-categories
 * @secure
 * @response `200` `{
    results: Array<PlanCategoryDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listPlanCategories: (query: ListPlanCategoriesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<PlanCategoryDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/plan-categories`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Plan Categories
     * @name CreatePlanCategory
     * @summary Create a plan category
     * @request POST:/api/v1/plan-categories
     * @secure
     * @response `201` `(PlanCategoryDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `PlanCategoryDto`
     */
    createPlanCategory: (data: CreatePlanCategoryDto, params: RequestParams = {}) =>
      this.http.request<PlanCategoryDto, ResponseErrorDto | PlanCategoryDto>({
        path: `/api/v1/plan-categories`,
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
     * @tags Catalog — Plan Categories
     * @name GetPlanCategory
     * @summary Get a plan category
     * @request GET:/api/v1/plan-categories/{id}
     * @secure
     * @response `200` `(PlanCategoryDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `PlanCategoryDto`
     */
    getPlanCategory: (id: string, params: RequestParams = {}) =>
      this.http.request<PlanCategoryDto, ResponseErrorDto | PlanCategoryDto>({
        path: `/api/v1/plan-categories/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Plan Categories
     * @name UpdatePlanCategory
     * @summary Update a plan category
     * @request PATCH:/api/v1/plan-categories/{id}
     * @secure
     * @response `200` `(PlanCategoryDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `PlanCategoryDto`
     */
    updatePlanCategory: (id: string, data: UpdatePlanCategoryDto, params: RequestParams = {}) =>
      this.http.request<PlanCategoryDto, ResponseErrorDto | PlanCategoryDto>({
        path: `/api/v1/plan-categories/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Catalog — Amenities
 * @name ListAmenities
 * @summary List amenities
 * @request GET:/api/v1/amenities
 * @secure
 * @response `200` `{
    results: Array<AmenityDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listAmenities: (query: ListAmenitiesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<AmenityDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/amenities`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Amenities
     * @name CreateAmenity
     * @summary Create an amenity
     * @request POST:/api/v1/amenities
     * @secure
     * @response `201` `(AmenityDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `AmenityDto`
     */
    createAmenity: (data: CreateAmenityDto, params: RequestParams = {}) =>
      this.http.request<AmenityDto, ResponseErrorDto | AmenityDto>({
        path: `/api/v1/amenities`,
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
     * @tags Catalog — Amenities
     * @name GetAmenity
     * @summary Get an amenity
     * @request GET:/api/v1/amenities/{id}
     * @secure
     * @response `200` `(AmenityDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `AmenityDto`
     */
    getAmenity: (id: string, params: RequestParams = {}) =>
      this.http.request<AmenityDto, ResponseErrorDto | AmenityDto>({
        path: `/api/v1/amenities/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Amenities
     * @name UpdateAmenity
     * @summary Update an amenity
     * @request PATCH:/api/v1/amenities/{id}
     * @secure
     * @response `200` `(AmenityDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `AmenityDto`
     */
    updateAmenity: (id: string, data: UpdateAmenityDto, params: RequestParams = {}) =>
      this.http.request<AmenityDto, ResponseErrorDto | AmenityDto>({
        path: `/api/v1/amenities/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Priced add-ons (lockers, parking, catering) attached to plans (per cycle) or resource rates (per booking). Prices are dinars (TND) HT; VAT as a percentage rate.
 *
 * @tags Catalog — Extras
 * @name ListExtras
 * @summary List extras
 * @request GET:/api/v1/extras
 * @secure
 * @response `200` `{
    results: Array<ExtraDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listExtras: (query: ListExtrasParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<ExtraDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/extras`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Extras
     * @name CreateExtra
     * @summary Create an extra
     * @request POST:/api/v1/extras
     * @secure
     * @response `201` `(ExtraDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ExtraDto`
     */
    createExtra: (data: CreateExtraDto, params: RequestParams = {}) =>
      this.http.request<ExtraDto, ResponseErrorDto | ExtraDto>({
        path: `/api/v1/extras`,
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
     * @tags Catalog — Extras
     * @name GetExtra
     * @summary Get an extra
     * @request GET:/api/v1/extras/{id}
     * @secure
     * @response `200` `(ExtraDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ExtraDto`
     */
    getExtra: (id: string, params: RequestParams = {}) =>
      this.http.request<ExtraDto, ResponseErrorDto | ExtraDto>({
        path: `/api/v1/extras/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog — Extras
     * @name UpdateExtra
     * @summary Update an extra
     * @request PATCH:/api/v1/extras/{id}
     * @secure
     * @response `200` `(ExtraDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ExtraDto`
     */
    updateExtra: (id: string, data: UpdateExtraDto, params: RequestParams = {}) =>
      this.http.request<ExtraDto, ResponseErrorDto | ExtraDto>({
        path: `/api/v1/extras/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Plan discounts (per membership) and resource-rate discounts (granted by plans and/or claimed by code at booking confirm). Either kind may target every plan/rate via appliesToAll and carry a validity window. Filter by kind, status or code fragment.
 *
 * @tags Billing — Discounts
 * @name ListDiscounts
 * @summary List discounts
 * @request GET:/api/v1/discounts
 * @secure
 * @response `200` `{
    results: Array<DiscountDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listDiscounts: (query: ListDiscountsParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<DiscountDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/discounts`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Billing — Discounts
     * @name CreateDiscount
     * @summary Create a discount
     * @request POST:/api/v1/discounts
     * @secure
     * @response `201` `(DiscountDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `((ResponseErrorDto))` 404
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `DiscountDto`
     */
    createDiscount: (data: CreateDiscountDto, params: RequestParams = {}) =>
      this.http.request<DiscountDto, ResponseErrorDto | DiscountDto>({
        path: `/api/v1/discounts`,
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
     * @tags Billing — Discounts
     * @name GetDiscount
     * @summary Get a discount
     * @request GET:/api/v1/discounts/{id}
     * @secure
     * @response `200` `(DiscountDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `DiscountDto`
     */
    getDiscount: (id: string, params: RequestParams = {}) =>
      this.http.request<DiscountDto, ResponseErrorDto | DiscountDto>({
        path: `/api/v1/discounts/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description kind is immutable. Changes never touch existing membership snapshots or charge rows.
     *
     * @tags Billing — Discounts
     * @name UpdateDiscount
     * @summary Update a discount
     * @request PATCH:/api/v1/discounts/{id}
     * @secure
     * @response `200` `(DiscountDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `((ResponseErrorDto))` 404
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `DiscountDto`
     */
    updateDiscount: (id: string, data: UpdateDiscountDto, params: RequestParams = {}) =>
      this.http.request<DiscountDto, ResponseErrorDto | DiscountDto>({
        path: `/api/v1/discounts/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Stops new assignments; existing snapshots and charges keep their values.
     *
     * @tags Billing — Discounts
     * @name ArchiveDiscount
     * @summary Archive a discount
     * @request POST:/api/v1/discounts/{id}/archive
     * @secure
     * @response `200` `(DiscountDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `DiscountDto`
     */
    archiveDiscount: (id: string, params: RequestParams = {}) =>
      this.http.request<DiscountDto, ResponseErrorDto | DiscountDto>({
        path: `/api/v1/discounts/${id}/archive`,
        method: "POST",
        secure: true,
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
 * @response `200` `{
    results: Array<ChargeDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listCharges: (query: ListChargesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<ChargeDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/charges`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description plan_fee, deposit and booking charges are flow-generated and cannot be created here. Negative amounts are credit-note lines. Passing `planId` derives amountHt/description/vatRate/accountingCode from a one-off catalog plan (any may still be overridden) — OfficeRnD’s "add a fee from a plan".
     *
     * @tags Billing
     * @name CreateCharge
     * @summary Create a manual charge (one_off / store)
     * @request POST:/api/v1/charges
     * @secure
     * @response `201` `(ChargeDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `ChargeDto`
     */
    createCharge: (data: CreateChargeDto, params: RequestParams = {}) =>
      this.http.request<ChargeDto, ResponseErrorDto | ChargeDto>({
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
 * @response `200` `{
    results: Array<InvoiceDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listInvoices: (query: ListInvoicesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<InvoiceDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/invoices`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Claims the given chargeIds — or ALL uninvoiced charges of the customer — race-safely, freezes HT/VAT/TTC totals (VAT rounded per line) and draws the next sequential HS-YYYY-NNNN number. A negative selection produces a credit note. Invoices are born issued (status sent). Charges of cancelled/pending bookings are never billable: the sweep skips them silently, an explicit chargeIds selection naming one fails with 422.
     *
     * @tags Billing
     * @name CreateInvoice
     * @summary Issue an invoice (§6.4)
     * @request POST:/api/v1/invoices
     * @secure
     * @response `201` `(InvoiceDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `InvoiceDto`
     */
    createInvoice: (data: CreateInvoiceDto, params: RequestParams = {}) =>
      this.http.request<InvoiceDto, ResponseErrorDto | InvoiceDto>({
        path: `/api/v1/invoices`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Streams the invoice as a French VAT facture PDF (attachment named after the invoice number, e.g. HS-2026-0042.pdf). Totals are printed from the frozen invoice columns; void invoices are marked ANNULÉE and negative totals render as a facture d’avoir. Member-role callers may only download their own invoices.
     *
     * @tags Billing
     * @name DownloadInvoicePdf
     * @summary Download an invoice as a PDF
     * @request GET:/api/v1/invoices/{id}/download
     * @secure
     * @response `200` `File` The invoice PDF
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `void`
     */
    downloadInvoicePdf: (id: string, params: RequestParams = {}) =>
      this.http.request<File, ResponseErrorDto | void>({
        path: `/api/v1/invoices/${id}/download`,
        method: "GET",
        secure: true,
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
      this.http.request<InvoiceDto, ResponseErrorDto | InvoiceDto>({
        path: `/api/v1/invoices/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Drafts only — the charges are released back to uninvoiced. An issued invoice is retired with void, never deleted.
     *
     * @tags Billing
     * @name DeleteDraftInvoice
     * @summary Drafts only — an issued invoice is retired with void (§4.14).
     * @request DELETE:/api/v1/invoices/{id}
     * @secure
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `void`
     */
    deleteDraftInvoice: (id: string, params: RequestParams = {}) =>
      this.http.request<any, ResponseErrorDto | void>({
        path: `/api/v1/invoices/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Draws the sequential number, stamps today as the issue date and re-freezes the totals from the charges as they stand now. The invoice becomes immutable.
     *
     * @tags Billing
     * @name IssueInvoice
     * @summary Issue a draft invoice
     * @request POST:/api/v1/invoices/{id}/issue
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
    issueInvoice: (id: string, params: RequestParams = {}) =>
      this.http.request<InvoiceDto, ResponseErrorDto | InvoiceDto>({
        path: `/api/v1/invoices/${id}/issue`,
        method: "POST",
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
     * @response `409` `((ResponseErrorDto))` 409
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `InvoiceDto`
     */
    voidInvoice: (id: string, params: RequestParams = {}) =>
      this.http.request<InvoiceDto, ResponseErrorDto | InvoiceDto>({
        path: `/api/v1/invoices/${id}/void`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Payments accumulate; when Σ payments reach the TTC total the invoice flips to paid. A payment exceeding the remaining balance is rejected (the recording locks the invoice row, so concurrent payments cannot double-settle). recorded_by is the calling staff user, resolved server-side.
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
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `RecordPaymentResultDto`
     */
    recordPayment: (id: string, data: CreatePaymentDto, params: RequestParams = {}) =>
      this.http.request<RecordPaymentResultDto, ResponseErrorDto | RecordPaymentResultDto>({
        path: `/api/v1/invoices/${id}/payments`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * @description Cross-cutting ledger listing. Filters: membership, booking, check-in, credit type, kind (grant/consumption), member (memberships held by the member or their employer company — the pool they actually spend), company, and an occurred_at range (startDate/endDate, both inclusive and independently optional). Balances live on GET /credits/balances — they are per-membership computations, not row queries.
 *
 * @tags Credits
 * @name ListCredits
 * @summary List credit ledger rows
 * @request GET:/api/v1/credits
 * @secure
 * @response `200` `{
    results: Array<CreditTransactionDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listCredits: (query: ListCreditsParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<CreditTransactionDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/credits`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff/admin comps, goodwill and corrections — the only entry path for credits outside plan create/renew. An optional resource-type scope restricts where the credits are spendable (NULL = any); an optional future expiry bounds them in time.
     *
     * @tags Credits
     * @name GrantCredit
     * @summary Manually grant credits to a membership
     * @request POST:/api/v1/credits
     * @secure
     * @response `201` `(CreditTransactionDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `((ResponseErrorDto))` 404
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CreditTransactionDto`
     */
    grantCredit: (data: GrantCreditDto, params: RequestParams = {}) =>
      this.http.request<CreditTransactionDto, ResponseErrorDto | CreditTransactionDto>({
        path: `/api/v1/credits`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description FIFO, expiry-aware balances grouped per membership, one entry per credit type. `memberId` covers memberships held by the member or their employer company; at least one id filter is required. With startDate/endDate the result is a STATEMENT for that window: granted/consumed/expired count only movement inside it, while available is the balance as of endDate (cumulative — the start bound cannot apply to it), so granted = consumed + expired + available holds only without a startDate. Members see their own balances via GET /me.
     *
     * @tags Credits
     * @name GetCreditBalances
     * @summary Credit balances of a membership, member or company
     * @request GET:/api/v1/credits/balances
     * @secure
     * @response `200` `(CreditBalancesDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CreditBalancesDto`
     */
    getCreditBalances: (query: GetCreditBalancesParams, params: RequestParams = {}) =>
      this.http.request<CreditBalancesDto, ResponseErrorDto | CreditBalancesDto>({
        path: `/api/v1/credits/balances`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Credits
     * @name GetCredit
     * @summary Get a credit ledger row
     * @request GET:/api/v1/credits/{id}
     * @secure
     * @response `200` `(CreditTransactionDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CreditTransactionDto`
     */
    getCredit: (id: string, params: RequestParams = {}) =>
      this.http.request<CreditTransactionDto, ResponseErrorDto | CreditTransactionDto>({
        path: `/api/v1/credits/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Grants only — consumptions are immutable (they belong to their booking/check-in). Explicit null clears a field (open-ended expiry / wildcard scope). A scope change that would orphan an already-allocated consumption is refused.
     *
     * @tags Credits
     * @name UpdateCredit
     * @summary Correct a credit GRANT row
     * @request PATCH:/api/v1/credits/{id}
     * @secure
     * @response `200` `(CreditTransactionDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `((ResponseErrorDto))` 404
     * @response `409` `((ResponseErrorDto))` 409
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CreditTransactionDto`
     */
    updateCredit: (id: string, data: UpdateCreditDto, params: RequestParams = {}) =>
      this.http.request<CreditTransactionDto, ResponseErrorDto | CreditTransactionDto>({
        path: `/api/v1/credits/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Deletes a grant no consumption has been allocated against (fat-fingered manual grant). Anything already touched by consumption — and every consumption row — is refused: the ledger is append-only and corrections are compensating entries.
     *
     * @tags Credits
     * @name DeleteCredit
     * @summary Void an UNCONSUMED grant (admin)
     * @request DELETE:/api/v1/credits/{id}
     * @secure
     * @response `204` `void` 204
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `((ResponseErrorDto))` 409
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `void`
     */
    deleteCredit: (id: string, params: RequestParams = {}) =>
      this.http.request<void, ResponseErrorDto | void>({
        path: `/api/v1/credits/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
 * @description Staff/admin only. `status` filters the derived lifecycle in the query (dates and pauses), so the totals match the tabs; `expiringBefore` matches ends_at ≤ date (renewal follow-ups); `memberId`/`companyId` filter the direct holder (no employer-company pooling), while `forCompanyId` returns a company's whole roster — its own memberships plus those held by its members — and cannot be combined with `companyId`. `q` searches the membership label, the member name and the company name.
 *
 * @tags Memberships
 * @name ListMemberships
 * @summary List memberships
 * @request GET:/api/v1/memberships
 * @secure
 * @response `200` `{
    results: Array<MembershipDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listMemberships: (query: ListMembershipsParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<MembershipDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/memberships`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Single transaction: validates the customer (member XOR company), snapshots the plan + benefits, grants initial credits (with expiry), writes the plan_fee (and deposit) charge. Status is derived from the dates. An optional endsAt makes the membership fixed-term (inclusive last active day). Optional overrides: priceHt and deposit (0 = waived) write into the snapshot only; name defaults to the plan name.
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
      this.http.request<MembershipDto, ResponseErrorDto | MembershipDto>({
        path: `/api/v1/memberships`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Counts by derived status (dates and pauses, in the query — the same rule the list filters on), by bill-to and by plan, plus an eight-week trend of memberships created and memberships starting. Accepts the list filters minus `status`, `expiringBefore` and pagination.
     *
     * @tags Memberships
     * @name MembershipStats
     * @summary Membership statistics
     * @request GET:/api/v1/memberships/stats
     * @secure
     * @response `200` `(MembershipStatsDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipStatsDto`
     */
    membershipStats: (query: MembershipStatsParams, params: RequestParams = {}) =>
      this.http.request<MembershipStatsDto, ResponseErrorDto | MembershipStatsDto>({
        path: `/api/v1/memberships/stats`,
        method: "GET",
        query: query,
        secure: true,
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
     * @description Cosmetic fields (name/notes) plus discountId — the only contractual field editable post-creation: set to replace the snapshotted discount, or null to clear it. Affects future, non-invoiced cycles only; other contractual terms are frozen in planSnapshot.
     *
     * @tags Memberships
     * @name UpdateMembership
     * @summary Update a membership label/notes/discount
     * @request PATCH:/api/v1/memberships/{id}
     * @secure
     * @response `200` `(MembershipDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipDto`
     */
    updateMembership: (id: string, data: UpdateMembershipDto, params: RequestParams = {}) =>
      this.http.request<MembershipDto, ResponseErrorDto | MembershipDto>({
        path: `/api/v1/memberships/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Sets cancelled_at = today and ends_at per the SNAPSHOT's cancellationDays notice period — never later than an agreed fixed-term ends_at. The membership stays active until ends_at passes.
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
      this.http.request<MembershipDto, ResponseErrorDto | MembershipDto>({
        path: `/api/v1/memberships/${id}/cancel`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Pauses are history: resuming closes a row, it never deletes one.
     *
     * @tags Memberships
     * @name ListMembershipPauses
     * @summary List a membership’s pause history
     * @request GET:/api/v1/memberships/{id}/pauses
     * @secure
     * @response `200` `Array<MembershipPauseDto>`
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `Array<MembershipPauseDto>`
     */
    listMembershipPauses: (id: string, params: RequestParams = {}) =>
      this.http.request<Array<MembershipPauseDto>, ResponseErrorDto | Array<MembershipPauseDto>>({
        path: `/api/v1/memberships/${id}/pauses`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Suspends the membership for a half-open date range (startsAt inclusive, endsAt exclusive; omit endsAt to pause indefinitely and close it later with resume). While paused the membership grants no credits, check-ins or bookings, and a cycle covered end to end by pauses is not billed — a partially paused cycle bills in full. The resource assignment is KEPT and credits already granted keep their original expiry.
     *
     * @tags Memberships
     * @name PauseMembership
     * @summary Pause a membership
     * @request POST:/api/v1/memberships/{id}/pause
     * @secure
     * @response `201` `(MembershipPauseDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipPauseDto`
     */
    pauseMembership: (id: string, data: CreateMembershipPauseDto, params: RequestParams = {}) =>
      this.http.request<MembershipPauseDto, ResponseErrorDto | MembershipPauseDto>({
        path: `/api/v1/memberships/${id}/pause`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Closes the open pause. endsAt is the first ACTIVE day again and defaults to today.
     *
     * @tags Memberships
     * @name ResumeMembership
     * @summary Resume a paused membership
     * @request POST:/api/v1/memberships/{id}/resume
     * @secure
     * @response `200` `(MembershipPauseDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipPauseDto`
     */
    resumeMembership: (id: string, data: ResumeMembershipDto, params: RequestParams = {}) =>
      this.http.request<MembershipPauseDto, ResponseErrorDto | MembershipPauseDto>({
        path: `/api/v1/memberships/${id}/resume`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
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
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `MembershipDto`
     */
    renewMembership: (id: string, params: RequestParams = {}) =>
      this.http.request<MembershipDto, ResponseErrorDto | MembershipDto>({
        path: `/api/v1/memberships/${id}/renew`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff/admin only. `activeOn` matches assignments covering that business date (startsAt ≤ date < endsAt, endsAt NULL = open).
 *
 * @tags Assignments
 * @name ListAssignments
 * @summary List resource assignments
 * @request GET:/api/v1/assignments
 * @secure
 * @response `200` `{
    results: Array<AssignmentDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listAssignments: (query: ListAssignmentsParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<AssignmentDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/assignments`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description The resource type must be canAssign and the membership must not be ended. Overlaps for the same resource are rejected at the database (GiST exclusion) — 23P01 → 409. On a fixed-term membership an omitted or later `endsAt` is silently CAPPED to the day after the membership ends (its ends_at is the last active day, an assignment ends_at is the first free day), never rejected — read the response to see the stored boundary.
     *
     * @tags Assignments
     * @name CreateAssignment
     * @summary Assign a resource to a membership
     * @request POST:/api/v1/assignments
     * @secure
     * @response `201` `(AssignmentDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `AssignmentDto`
     */
    createAssignment: (data: CreateAssignmentDto, params: RequestParams = {}) =>
      this.http.request<AssignmentDto, ResponseErrorDto | AssignmentDto>({
        path: `/api/v1/assignments`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Sets ends_at on an open assignment (half-open: endsAt is the first free day). Already-ended assignments are rejected.
     *
     * @tags Assignments
     * @name EndAssignment
     * @summary End an open assignment
     * @request POST:/api/v1/assignments/{id}/end
     * @secure
     * @response `200` `(AssignmentDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `AssignmentDto`
     */
    endAssignment: (id: string, data: EndAssignmentDto, params: RequestParams = {}) =>
      this.http.request<AssignmentDto, ResponseErrorDto | AssignmentDto>({
        path: `/api/v1/assignments/${id}/end`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description OfficeRnD relocate: ends the current assignment at effectiveDate and opens a new one on the destination resource, in one transaction. On a fixed-term membership the successor is silently CAPPED to the day after the membership ends (its ends_at is the last active day, an assignment ends_at is the first free day), never rejected — read the response to see the stored boundary.
     *
     * @tags Assignments
     * @name RelocateAssignment
     * @summary Relocate an assignment to another resource
     * @request POST:/api/v1/assignments/{id}/relocate
     * @secure
     * @response `201` `(AssignmentDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `((ResponseErrorDto))` 409
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `AssignmentDto`
     */
    relocateAssignment: (id: string, data: RelocateAssignmentDto, params: RequestParams = {}) =>
      this.http.request<AssignmentDto, ResponseErrorDto | AssignmentDto>({
        path: `/api/v1/assignments/${id}/relocate`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
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
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `CheckinDto`
     */
    checkIn: (data: CreateCheckinDto, params: RequestParams = {}) =>
      this.http.request<CheckinDto, ResponseErrorDto | CheckinDto>({
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
 * @response `200` `{
    results: Array<CheckinDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listCheckins: (query: ListCheckinsParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<CheckinDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
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
      this.http.request<CheckinDto, ResponseErrorDto | CheckinDto>({
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
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `Array<OccupancyBucketDto>`
     */
    getOccupancy: (query: GetOccupancyParams, params: RequestParams = {}) =>
      this.http.request<OccupancyBucketDto, ResponseErrorDto | Array<OccupancyBucketDto>>({
        path: `/api/v1/attendance/occupancy`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * @description Staff/admin see everything; member-role callers see their own and their employer company's bookings. Filters: resourceId, status, source, memberId, companyId, isFree, and from/to (interval overlap — a booking matches when it touches the range). `q` searches title, notes and the customer name.
 *
 * @tags Bookings
 * @name ListBookings
 * @summary List bookings
 * @request GET:/api/v1/bookings
 * @secure
 * @response `200` `{
    results: Array<BookingDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listBookings: (query: ListBookingsParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<BookingDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
      >({
        path: `/api/v1/bookings`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Members book for themselves (source=portal); staff book for any member XOR company (source=staff). Pricing: room_hour credits first (scope from membership snapshots, drained soonest-expiring first), remainder at the member rate — or the visitor rate without a membership. price_ht is NULL when fully credit-covered. Conflicts are impossible at the database level (GiST exclusion constraint). Staff may pass isFree + freeReason: no credits are consumed and no charges written (room and extras alike).
     *
     * @tags Bookings
     * @name CreateBooking
     * @summary Create a booking (§6.3 credit-first pricing)
     * @request POST:/api/v1/bookings
     * @secure
     * @response `201` `(BookingDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    createBooking: (data: CreateBookingDto, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | BookingDto>({
        path: `/api/v1/bookings`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff/admin only — unlike the list, this is never scoped to a caller's own bookings, so it stays off the member role entirely. Counts for the list tabs and the summary cards, computed in the database. Takes the same filters as the list except `status` — the counts are the per-status breakdown, so filtering by it would collapse them. Every status is present, zero included. Because `status` is not accepted, `total` and `bookedValueHt` NEVER narrow by it: on a status tab they still describe every row the other filters match, not the visible ones, and `bookedValueHt` sums cancelled and no-show bookings along with the rest. Label them accordingly — they are range totals, not tab totals. Also returns `byResource` (busiest room first) and `byWeek` — the last eight weeks, oldest first, always all eight, so a chart drawn from it keeps its shape. There is no weekly cancellation series: bookings have no cancelled_at column, and updated_at moves on any title or notes edit.
     *
     * @tags Bookings
     * @name GetBookingStats
     * @summary Booking counts, values and weekly trend
     * @request GET:/api/v1/bookings/stats
     * @secure
     * @response `200` `(BookingStatsDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingStatsDto`
     */
    getBookingStats: (query: GetBookingStatsParams, params: RequestParams = {}) =>
      this.http.request<BookingStatsDto, ResponseErrorDto | BookingStatsDto>({
        path: `/api/v1/bookings/stats`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Everything one grid needs in a single read: per bookable room, its header summary, its bookable windows per local day, and its pending and confirmed bookings as blocks. `from` is inclusive and `to` is exclusive, so a one-day grid is midnight to midnight. Range ≤ 31 days. The grid covers one location — its timezone is on the envelope.
     *
     * @tags Bookings
     * @name GetBookingCalendar
     * @summary Calendar grid: rooms, windows and blocks
     * @request GET:/api/v1/bookings/calendar
     * @secure
     * @response `200` `(BookingCalendarDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingCalendarDto`
     */
    getBookingCalendar: (query: GetBookingCalendarParams, params: RequestParams = {}) =>
      this.http.request<BookingCalendarDto, ResponseErrorDto | BookingCalendarDto>({
        path: `/api/v1/bookings/calendar`,
        method: "GET",
        query: query,
        secure: true,
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
     * @response `403` `(ResponseErrorDto)` Forbidden
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    getBooking: (id: string, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | BookingDto>({
        path: `/api/v1/bookings/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Title and notes anytime; staff may flag no_show after the start time. Passing startsAt AND endsAt reschedules: the slot is re-checked (ignoring this booking itself), the room is re-priced at the new duration and its credits and charges are reversed and re-applied. Passing extraIds replaces the extras ([] removes them all; omitted leaves them alone) and re-runs the money the same way. Extras that stay keep the prices they were booked at; only newly added ones are priced live. Passing discountId changes the booking's discount (docs/superpowers/plans/2026-08-29-booking-patch-discount.md): null removes it, an id resolves the same way as create's discountId and re-runs the money like an extraIds change for a CONFIRMED booking; a PENDING booking has no money yet, so only its stored snapshot is replaced. The resource cannot change — moving a booking between rooms is still cancel + rebook. Members may edit inside the cancellation window.
     *
     * @tags Bookings
     * @name UpdateBooking
     * @summary Update a booking (metadata, no_show, reschedule, extras)
     * @request PATCH:/api/v1/bookings/{id}
     * @secure
     * @response `200` `(BookingDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `((ResponseErrorDto))` 404
     * @response `409` `((ResponseErrorDto))` 409
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    updateBooking: (id: string, data: UpdateBookingDto, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | BookingDto>({
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
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingQuoteDto`
     */
    validateBooking: (data: CreateBookingDto, params: RequestParams = {}) =>
      this.http.request<BookingQuoteDto, ResponseErrorDto | BookingQuoteDto>({
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
     * @response `403` `((ResponseErrorDto))` 403
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
     * @description Staff-only. Re-checks availability, prices the booking per §6.3 (typically the visitor rate → a booking charge) and flips it to confirmed — from then on it blocks the slot. Optional body { isFree, freeReason } confirms a partner request as complimentary.
     *
     * @tags Bookings
     * @name ConfirmBooking
     * @summary Staff confirmation of website booking requests (Phase 6).
     * @request POST:/api/v1/bookings/{id}/confirm
     * @secure
     * @response `200` `(BookingDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `((ResponseErrorDto))` 404
     * @response `409` `(ResponseErrorDto)` Conflict
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `BookingDto`
     */
    confirmBooking: (id: string, data?: ConfirmBookingDto, params: RequestParams = {}) =>
      this.http.request<BookingDto, ResponseErrorDto | BookingDto>({
        path: `/api/v1/bookings/${id}/confirm`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Bookable windows per day (booking_times, falling back to the location opening hours, minus closed days) plus confirmed busy intervals clipped to the range (≤ 31 days). `from` is inclusive and `to` is exclusive, so a week is midnight to midnight — the day `to` lands on is not part of the range. Clients render free slots; the server re-validates at create time. The response carries the resource location's IANA `timezone`; the `days[]` windows ("08:00") are wall-clock in that zone, not UTC. `excludeBookingId` drops one booking from the busy intervals — pass the booking being rescheduled so its own current slot reads as free.
     *
     * @tags Bookings
     * @name GetResourceAvailability
     * @summary Resource availability (windows + busy intervals)
     * @request GET:/api/v1/resources/{id}/availability
     * @secure
     * @response `200` `(AvailabilityDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `422` `((ResponseErrorDto))` 422
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
 * @description Pipeline view. Filter by stage, interest, source or memberId; `q` searches the member's name. Filter by creation time with createdFrom/createdTo (ISO instants, upper bound exclusive). They are instants rather than dates because an opportunity has no location and therefore no timezone in which to define a day — the client decides what day it means.
 *
 * @tags CRM
 * @name ListOpportunities
 * @summary List opportunities
 * @request GET:/api/v1/opportunities
 * @secure
 * @response `200` `{
    results: Array<OpportunityDto>,
    meta: PageMetaDto,

}` 200
 * @response `401` `(ResponseErrorDto)` Unauthorized
 * @response `403` `((ResponseErrorDto))` 403
 * @response `422` `(ResponseErrorDto)` Unprocessable Entity
 * @response `429` `(ResponseErrorDto)` Too Many Requests
 * @response `500` `(ResponseErrorDto)` Internal Server Error
 * @response `default` `void`
 */
    listOpportunities: (query: ListOpportunitiesParams, params: RequestParams = {}) =>
      this.http.request<
        {
          results: Array<OpportunityDto>;
          meta: PageMetaDto;
        },
        ResponseErrorDto | void
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
      this.http.request<OpportunityDto, ResponseErrorDto | OpportunityDto>({
        path: `/api/v1/opportunities`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description What the filters above the list need, in one request: per stage, how many leads and what they are worth, and every source present in the data with its count. Totals, the open/won/lost split and the pipeline all follow from the stage rows. Accepts the same q and interest filters as the list, so the numbers match the rows on screen. Every stage is present, zero included; sources are those that exist, busiest first; and byWeek carries the last eight weeks of leads opened, won and lost, always all eight so a quiet week reads as zero rather than going missing. Filter by creation time with createdFrom/createdTo (ISO instants, upper bound exclusive). They are instants rather than dates because an opportunity has no location and therefore no timezone in which to define a day — the client decides what day it means.
     *
     * @tags CRM
     * @name OpportunityStats
     * @summary Pipeline totals
     * @request GET:/api/v1/opportunities/stats
     * @secure
     * @response `200` `(OpportunityStatsDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `OpportunityStatsDto`
     */
    opportunityStats: (query: OpportunityStatsParams, params: RequestParams = {}) =>
      this.http.request<OpportunityStatsDto, ResponseErrorDto | OpportunityStatsDto>({
        path: `/api/v1/opportunities/stats`,
        method: "GET",
        query: query,
        secure: true,
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
      this.http.request<OpportunityDto, ResponseErrorDto | OpportunityDto>({
        path: `/api/v1/opportunities/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description ONE transaction: creates the membership from the opportunity (requested plan, extras, quoted plan-fee figure), grants its initial credits and charges, and marks the opportunity won. When the opportunity names a space it is assigned from day one (assignable resources only, for now); when it names none the membership is created anyway and `assignment` comes back null, for staff to assign later. The request carries the dates and nothing else — to change what is sold, PATCH the opportunity first.
     *
     * @tags Onboarding
     * @name OnboardLead
     * @summary Onboard a lead (opportunity → membership + assignment)
     * @request POST:/api/v1/onboarding
     * @secure
     * @response `201` `(OnboardingResultDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `403` `((ResponseErrorDto))` 403
     * @response `404` `(ResponseErrorDto)` Not Found
     * @response `409` `((ResponseErrorDto))` 409
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `OnboardingResultDto`
     */
    onboardLead: (data: OnboardLeadDto, params: RequestParams = {}) =>
      this.http.request<OnboardingResultDto, ResponseErrorDto | OnboardingResultDto>({
        path: `/api/v1/onboarding`,
        method: "POST",
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
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     * @response `default` `Array<OccupancyBucketDto>`
     */
    analyticsOccupancy: (query: AnalyticsOccupancyParams, params: RequestParams = {}) =>
      this.http.request<OccupancyBucketDto, ResponseErrorDto | Array<OccupancyBucketDto>>({
        path: `/api/v1/analytics/occupancy`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description HT/VAT/TTC sums in dinars (TND). group_by=plan buckets membership-linked charges by their snapshot plan name; other charges by kind.
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
      this.http.request<RevenueBucketDto, ResponseErrorDto | Array<RevenueBucketDto>>({
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
      this.http.request<MembershipAnalyticsDto, ResponseErrorDto | MembershipAnalyticsDto>({
        path: `/api/v1/analytics/memberships`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Active, non-hidden plans, cheapest first. Filter by ?category=<slug> for one service section (see GET /public/plan-categories). Each plan carries `offer`: the single best public, active, in-window discount targeting it, server-priced (discountedPriceHt/Ttc) — null when none applies. Server-to-server only.
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
    publicListPlans: (query: PublicListPlansParams, params: RequestParams = {}) =>
      this.http.request<PublicPlanDto, ResponseErrorDto>({
        path: `/api/v1/public/plans`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Plan categories with at least one visible plan (coworking, private offices, domiciliation, …), in display order — the website landing/pricing sections. Server-to-server only.
     *
     * @tags Public (website)
     * @name PublicListPlanCategories
     * @summary Service sections for the website
     * @request GET:/api/v1/public/plan-categories
     * @response `200` `(PublicPlanCategoryDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     */
    publicListPlanCategories: (params: RequestParams = {}) =>
      this.http.request<PublicPlanCategoryDto, ResponseErrorDto>({
        path: `/api/v1/public/plan-categories`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Any bookable, visible resource. Bookable windows + busy intervals. The response carries the resource location's IANA `timezone`; the `days[]` windows ("08:00") are wall-clock in that zone, not UTC or the browser's zone — render them against `timezone`, not a compiled-in default.
     *
     * @tags Public (website)
     * @name PublicResourceAvailability
     * @summary Resource availability for the website
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
     * @description Active, visible, sellable spaces: bookable ones carry rates, plan-sold ones carry their target plans (cheapest first, each with its own `offer` — see GET /public/plans), pool parents carry live seat counts; every card has a derived status badge. Filter by ?resourceType=<slug> for one catalog tab, and/or ?planCode=<code> for the spaces sold under one plan. Server-to-server only.
     *
     * @tags Public (website)
     * @name PublicListResources
     * @summary Space catalog for the website
     * @request GET:/api/v1/public/resources
     * @response `200` `(PublicResourceDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     */
    publicListResources: (query: PublicListResourcesParams, params: RequestParams = {}) =>
      this.http.request<PublicResourceDto, ResponseErrorDto>({
        path: `/api/v1/public/resources`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Resource types with at least one publicly visible space, for the catalog tab bar. Server-to-server only.
     *
     * @tags Public (website)
     * @name PublicListResourceTypes
     * @summary Catalog tabs for the website
     * @request GET:/api/v1/public/resource-types
     * @response `200` `(PublicResourceTypeDto)` 200
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `(ResponseErrorDto)` Unprocessable Entity
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     */
    publicListResourceTypes: (params: RequestParams = {}) =>
      this.http.request<PublicResourceTypeDto, ResponseErrorDto>({
        path: `/api/v1/public/resource-types`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Creates member (visitor) + PENDING booking + opportunity in one transaction; staff confirms (and prices) later. Identity comes only from the body — no user account involved. `discountCode`, if sent, is stored verbatim on the booking for staff to review — it is never validated or priced on this path.
     *
     * @tags Public (website)
     * @name PublicCreateBookingRequest
     * @summary Website booking request
     * @request POST:/api/v1/public/booking-requests
     * @response `201` `(BookingRequestResultDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `((ResponseErrorDto))` 422
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
     * @description Creates member (visitor) + opportunity carrying the requested plan, its selected extras and the quoted value in one transaction; staff convert it into a membership at the price the visitor saw. Send planId (pricing page) or resourceId (a catalog space card — the plan resolves via its target plans, and planId picks one when the space is sold under several). Identity comes only from the body — no user account involved. `discountCode`, if sent, is stored verbatim on the opportunity for staff to review — it is never validated or priced on this path.
     *
     * @tags Public (website)
     * @name PublicCreatePlanRequest
     * @summary Website plan request
     * @request POST:/api/v1/public/plan-requests
     * @response `201` `(PlanRequestResultDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     */
    publicCreatePlanRequest: (data: CreatePlanRequestDto, params: RequestParams = {}) =>
      this.http.request<PlanRequestResultDto, ResponseErrorDto>({
        path: `/api/v1/public/plan-requests`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates member (visitor) + opportunity for a lightweight lead: the visitor asks about a service category (categorySlug, see GET /public/plan-categories; bare interest slugs like meeting_room are accepted too) OR wants a free trial day (freeDay) — exactly one of the two. No plan and no quote; the priced funnels stay /plan-requests and /booking-requests. Identity comes only from the body — no user account involved.
     *
     * @tags Public (website)
     * @name PublicCreateContactRequest
     * @summary Landing-page contact request
     * @request POST:/api/v1/public/contact-requests
     * @response `201` `(ContactRequestResultDto)` 201
     * @response `401` `(ResponseErrorDto)` Unauthorized
     * @response `422` `((ResponseErrorDto))` 422
     * @response `429` `(ResponseErrorDto)` Too Many Requests
     * @response `500` `(ResponseErrorDto)` Internal Server Error
     */
    publicCreateContactRequest: (data: CreateContactRequestDto, params: RequestParams = {}) =>
      this.http.request<ContactRequestResultDto, ResponseErrorDto>({
        path: `/api/v1/public/contact-requests`,
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
