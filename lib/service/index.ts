"use server";
import type { RequestParams } from "@hscowork/service-generator/runtime";
import "server-only";
import { hsService } from "./api";
import type {
  AnalyticsMembershipsParams,
  AnalyticsOccupancyParams,
  AnalyticsRevenueParams,
  CompanyStatsParams,
  ConfirmBookingDto,
  CreateAmenityDto,
  CreateAssignmentDto,
  CreateBookingDto,
  CreateBookingRequestDto,
  CreateChargeDto,
  CreateCheckinDto,
  CreateCompanyDto,
  CreateContactRequestDto,
  CreateDiscountDto,
  CreateExtraDto,
  CreateInvoiceDto,
  CreateLocationDto,
  CreateMemberDto,
  CreateMembershipDto,
  CreateMembershipPauseDto,
  CreateOpportunityDto,
  CreatePaymentDto,
  CreatePlanCategoryDto,
  CreatePlanDto,
  CreatePlanRequestDto,
  CreateResourceDto,
  CreateResourceRateDto,
  CreateResourceTypeDto,
  EndAssignmentDto,
  FileDto,
  GetBookingCalendarParams,
  GetBookingStatsParams,
  GetCreditBalancesParams,
  GetOccupancyParams,
  GetResourceAvailabilityParams,
  GrantCreditDto,
  ListAmenitiesParams,
  ListAssignmentsParams,
  ListBookingsParams,
  ListChargesParams,
  ListCheckinsParams,
  ListCompaniesParams,
  ListCreditsParams,
  ListDiscountsParams,
  ListExtrasParams,
  ListInvoicesParams,
  ListLocationsParams,
  ListMembersParams,
  ListMembershipsParams,
  ListOpportunitiesParams,
  ListPlanCategoriesParams,
  ListPlansParams,
  ListResourceRatesParams,
  ListResourceTypesParams,
  ListResourcesParams,
  MemberStatsParams,
  MembershipStatsParams,
  OnboardLeadDto,
  OnboardingQuoteDto,
  OpportunityStatsParams,
  PublicListPlansParams,
  PublicListResourcesParams,
  PublicResourceAvailabilityParams,
  RelocateAssignmentDto,
  ResumeMembershipDto,
  UpdateAmenityDto,
  UpdateBookingDto,
  UpdateCompanyDto,
  UpdateCreditDto,
  UpdateDiscountDto,
  UpdateExtraDto,
  UpdateLocationDto,
  UpdateMemberCompanyDto,
  UpdateMemberDto,
  UpdateMemberStatusDto,
  UpdateMembershipDto,
  UpdateOpportunityDto,
  UpdatePlanCategoryDto,
  UpdatePlanDto,
  UpdateResourceDto,
  UpdateResourceRateDto,
  UpdateResourceTypeDto,
} from "./HsService";

export async function getListLocations(query: ListLocationsParams, params?: RequestParams) {
  return hsService.api.listLocations(query, params);
}

export async function createLocation(data: CreateLocationDto, params?: RequestParams) {
  return hsService.api.createLocation(data, params);
}

export async function getLocation(id: string, params?: RequestParams) {
  return hsService.api.getLocation(id, params);
}

export async function updateLocation(id: string, data: UpdateLocationDto, params?: RequestParams) {
  return hsService.api.updateLocation(id, data, params);
}

export async function getListCompanies(query: ListCompaniesParams, params?: RequestParams) {
  return hsService.api.listCompanies(query, params);
}

export async function createCompany(data: CreateCompanyDto, params?: RequestParams) {
  return hsService.api.createCompany(data, params);
}

export async function getCompanyStats(query: CompanyStatsParams, params?: RequestParams) {
  return hsService.api.companyStats(query, params);
}

export async function updateCompany(id: string, data: UpdateCompanyDto, params?: RequestParams) {
  return hsService.api.updateCompany(id, data, params);
}

export async function getCompany(id: string, params?: RequestParams) {
  return hsService.api.getCompany(id, params);
}

export async function getListMembers(query: ListMembersParams, params?: RequestParams) {
  return hsService.api.listMembers(query, params);
}

export async function createMember(data: CreateMemberDto, params?: RequestParams) {
  return hsService.api.createMember(data, params);
}

export async function getMemberStats(query: MemberStatsParams, params?: RequestParams) {
  return hsService.api.memberStats(query, params);
}

export async function updateMember(id: string, data: UpdateMemberDto, params?: RequestParams) {
  return hsService.api.updateMember(id, data, params);
}

export async function getMember(id: string, params?: RequestParams) {
  return hsService.api.getMember(id, params);
}

export async function updateMemberStatus(id: string, data: UpdateMemberStatusDto, params?: RequestParams) {
  return hsService.api.updateMemberStatus(id, data, params);
}

export async function updateMemberCompany(id: string, data: UpdateMemberCompanyDto, params?: RequestParams) {
  return hsService.api.updateMemberCompany(id, data, params);
}

export async function getListResourceTypes(query: ListResourceTypesParams, params?: RequestParams) {
  return hsService.api.listResourceTypes(query, params);
}

export async function createResourceType(data: CreateResourceTypeDto, params?: RequestParams) {
  return hsService.api.createResourceType(data, params);
}

export async function getResourceType(id: string, params?: RequestParams) {
  return hsService.api.getResourceType(id, params);
}

export async function updateResourceType(id: string, data: UpdateResourceTypeDto, params?: RequestParams) {
  return hsService.api.updateResourceType(id, data, params);
}

export async function getListResources(query: ListResourcesParams, params?: RequestParams) {
  return hsService.api.listResources(query, params);
}

export async function createResource(data: CreateResourceDto, params?: RequestParams) {
  return hsService.api.createResource(data, params);
}

export async function getResource(id: string, params?: RequestParams) {
  return hsService.api.getResource(id, params);
}

export async function updateResource(id: string, data: UpdateResourceDto, params?: RequestParams) {
  return hsService.api.updateResource(id, data, params);
}

export async function getResourceStatus(id: string, params?: RequestParams) {
  return hsService.api.getResourceStatus(id, params);
}

export async function uploadResourceImage(id: string, data: FileDto, params?: RequestParams) {
  return hsService.api.uploadResourceImage(id, data, params);
}

export async function deleteResourceImage(id: string, params?: RequestParams) {
  return hsService.api.deleteResourceImage(id, params);
}

export async function getListResourceRates(query: ListResourceRatesParams, params?: RequestParams) {
  return hsService.api.listResourceRates(query, params);
}

export async function createResourceRate(data: CreateResourceRateDto, params?: RequestParams) {
  return hsService.api.createResourceRate(data, params);
}

export async function getResourceRate(id: string, params?: RequestParams) {
  return hsService.api.getResourceRate(id, params);
}

export async function updateResourceRate(id: string, data: UpdateResourceRateDto, params?: RequestParams) {
  return hsService.api.updateResourceRate(id, data, params);
}

export async function getListPlans(query: ListPlansParams, params?: RequestParams) {
  return hsService.api.listPlans(query, params);
}

export async function createPlan(data: CreatePlanDto, params?: RequestParams) {
  return hsService.api.createPlan(data, params);
}

export async function getPlan(id: string, params?: RequestParams) {
  return hsService.api.getPlan(id, params);
}

export async function updatePlan(id: string, data: UpdatePlanDto, params?: RequestParams) {
  return hsService.api.updatePlan(id, data, params);
}

export async function getListPlanCategories(query: ListPlanCategoriesParams, params?: RequestParams) {
  return hsService.api.listPlanCategories(query, params);
}

export async function createPlanCategory(data: CreatePlanCategoryDto, params?: RequestParams) {
  return hsService.api.createPlanCategory(data, params);
}

export async function getPlanCategory(id: string, params?: RequestParams) {
  return hsService.api.getPlanCategory(id, params);
}

export async function updatePlanCategory(id: string, data: UpdatePlanCategoryDto, params?: RequestParams) {
  return hsService.api.updatePlanCategory(id, data, params);
}

export async function getListAmenities(query: ListAmenitiesParams, params?: RequestParams) {
  return hsService.api.listAmenities(query, params);
}

export async function createAmenity(data: CreateAmenityDto, params?: RequestParams) {
  return hsService.api.createAmenity(data, params);
}

export async function getAmenity(id: string, params?: RequestParams) {
  return hsService.api.getAmenity(id, params);
}

export async function updateAmenity(id: string, data: UpdateAmenityDto, params?: RequestParams) {
  return hsService.api.updateAmenity(id, data, params);
}

export async function getListExtras(query: ListExtrasParams, params?: RequestParams) {
  return hsService.api.listExtras(query, params);
}

export async function createExtra(data: CreateExtraDto, params?: RequestParams) {
  return hsService.api.createExtra(data, params);
}

export async function getExtra(id: string, params?: RequestParams) {
  return hsService.api.getExtra(id, params);
}

export async function updateExtra(id: string, data: UpdateExtraDto, params?: RequestParams) {
  return hsService.api.updateExtra(id, data, params);
}

export async function getListDiscounts(query: ListDiscountsParams, params?: RequestParams) {
  return hsService.api.listDiscounts(query, params);
}

export async function createDiscount(data: CreateDiscountDto, params?: RequestParams) {
  return hsService.api.createDiscount(data, params);
}

export async function getDiscount(id: string, params?: RequestParams) {
  return hsService.api.getDiscount(id, params);
}

export async function updateDiscount(id: string, data: UpdateDiscountDto, params?: RequestParams) {
  return hsService.api.updateDiscount(id, data, params);
}

export async function archiveDiscount(id: string, params?: RequestParams) {
  return hsService.api.archiveDiscount(id, params);
}

export async function getListCharges(query: ListChargesParams, params?: RequestParams) {
  return hsService.api.listCharges(query, params);
}

export async function createCharge(data: CreateChargeDto, params?: RequestParams) {
  return hsService.api.createCharge(data, params);
}

export async function getListInvoices(query: ListInvoicesParams, params?: RequestParams) {
  return hsService.api.listInvoices(query, params);
}

export async function createInvoice(data: CreateInvoiceDto, params?: RequestParams) {
  return hsService.api.createInvoice(data, params);
}

export async function getDownloadInvoicePdf(id: string, params?: RequestParams) {
  return hsService.api.downloadInvoicePdf(id, params);
}

export async function getInvoice(id: string, params?: RequestParams) {
  return hsService.api.getInvoice(id, params);
}

export async function deleteDraftInvoice(id: string, params?: RequestParams) {
  return hsService.api.deleteDraftInvoice(id, params);
}

export async function issueInvoice(id: string, params?: RequestParams) {
  return hsService.api.issueInvoice(id, params);
}

export async function voidInvoice(id: string, params?: RequestParams) {
  return hsService.api.voidInvoice(id, params);
}

export async function recordPayment(id: string, data: CreatePaymentDto, params?: RequestParams) {
  return hsService.api.recordPayment(id, data, params);
}

export async function getListCredits(query: ListCreditsParams, params?: RequestParams) {
  return hsService.api.listCredits(query, params);
}

export async function grantCredit(data: GrantCreditDto, params?: RequestParams) {
  return hsService.api.grantCredit(data, params);
}

export async function getCreditBalances(query: GetCreditBalancesParams, params?: RequestParams) {
  return hsService.api.getCreditBalances(query, params);
}

export async function getCredit(id: string, params?: RequestParams) {
  return hsService.api.getCredit(id, params);
}

export async function updateCredit(id: string, data: UpdateCreditDto, params?: RequestParams) {
  return hsService.api.updateCredit(id, data, params);
}

export async function deleteCredit(id: string, params?: RequestParams) {
  return hsService.api.deleteCredit(id, params);
}

export async function getListMemberships(query: ListMembershipsParams, params?: RequestParams) {
  return hsService.api.listMemberships(query, params);
}

export async function createMembership(data: CreateMembershipDto, params?: RequestParams) {
  return hsService.api.createMembership(data, params);
}

export async function getMembershipStats(query: MembershipStatsParams, params?: RequestParams) {
  return hsService.api.membershipStats(query, params);
}

export async function getMembership(id: string, params?: RequestParams) {
  return hsService.api.getMembership(id, params);
}

export async function updateMembership(id: string, data: UpdateMembershipDto, params?: RequestParams) {
  return hsService.api.updateMembership(id, data, params);
}

export async function cancelMembership(id: string, params?: RequestParams) {
  return hsService.api.cancelMembership(id, params);
}

export async function getListMembershipPauses(id: string, params?: RequestParams) {
  return hsService.api.listMembershipPauses(id, params);
}

export async function pauseMembership(id: string, data: CreateMembershipPauseDto, params?: RequestParams) {
  return hsService.api.pauseMembership(id, data, params);
}

export async function resumeMembership(id: string, data: ResumeMembershipDto, params?: RequestParams) {
  return hsService.api.resumeMembership(id, data, params);
}

export async function renewMembership(id: string, params?: RequestParams) {
  return hsService.api.renewMembership(id, params);
}

export async function getListAssignments(query: ListAssignmentsParams, params?: RequestParams) {
  return hsService.api.listAssignments(query, params);
}

export async function createAssignment(data: CreateAssignmentDto, params?: RequestParams) {
  return hsService.api.createAssignment(data, params);
}

export async function endAssignment(id: string, data: EndAssignmentDto, params?: RequestParams) {
  return hsService.api.endAssignment(id, data, params);
}

export async function relocateAssignment(id: string, data: RelocateAssignmentDto, params?: RequestParams) {
  return hsService.api.relocateAssignment(id, data, params);
}

export async function checkIn(data: CreateCheckinDto, params?: RequestParams) {
  return hsService.api.checkIn(data, params);
}

export async function getListCheckins(query: ListCheckinsParams, params?: RequestParams) {
  return hsService.api.listCheckins(query, params);
}

export async function checkOut(id: string, params?: RequestParams) {
  return hsService.api.checkOut(id, params);
}

export async function getOccupancy(query: GetOccupancyParams, params?: RequestParams) {
  return hsService.api.getOccupancy(query, params);
}

export async function getListBookings(query: ListBookingsParams, params?: RequestParams) {
  return hsService.api.listBookings(query, params);
}

export async function createBooking(data: CreateBookingDto, params?: RequestParams) {
  return hsService.api.createBooking(data, params);
}

export async function getBookingStats(query: GetBookingStatsParams, params?: RequestParams) {
  return hsService.api.getBookingStats(query, params);
}

export async function getBookingCalendar(query: GetBookingCalendarParams, params?: RequestParams) {
  return hsService.api.getBookingCalendar(query, params);
}

export async function getBooking(id: string, params?: RequestParams) {
  return hsService.api.getBooking(id, params);
}

export async function updateBooking(id: string, data: UpdateBookingDto, params?: RequestParams) {
  return hsService.api.updateBooking(id, data, params);
}

export async function validateBooking(data: CreateBookingDto, params?: RequestParams) {
  return hsService.api.validateBooking(data, params);
}

export async function cancelBooking(id: string, params?: RequestParams) {
  return hsService.api.cancelBooking(id, params);
}

export async function confirmBooking(id: string, data?: ConfirmBookingDto, params?: RequestParams) {
  return hsService.api.confirmBooking(id, data, params);
}

export async function getResourceAvailability({ id, ...query }: GetResourceAvailabilityParams, params?: RequestParams) {
  return hsService.api.getResourceAvailability({ id, ...query }, params);
}

export async function getListOpportunities(query: ListOpportunitiesParams, params?: RequestParams) {
  return hsService.api.listOpportunities(query, params);
}

export async function createOpportunity(data: CreateOpportunityDto, params?: RequestParams) {
  return hsService.api.createOpportunity(data, params);
}

export async function getOpportunityStats(query: OpportunityStatsParams, params?: RequestParams) {
  return hsService.api.opportunityStats(query, params);
}

export async function updateOpportunity(id: string, data: UpdateOpportunityDto, params?: RequestParams) {
  return hsService.api.updateOpportunity(id, data, params);
}

export async function onboardLead(data: OnboardLeadDto, params?: RequestParams) {
  return hsService.api.onboardLead(data, params);
}

export async function quoteOnboarding(data: OnboardingQuoteDto, params?: RequestParams) {
  return hsService.api.quoteOnboarding(data, params);
}

export async function getAnalyticsOccupancy(query: AnalyticsOccupancyParams, params?: RequestParams) {
  return hsService.api.analyticsOccupancy(query, params);
}

export async function getAnalyticsRevenue(query: AnalyticsRevenueParams, params?: RequestParams) {
  return hsService.api.analyticsRevenue(query, params);
}

export async function getAnalyticsMemberships(query: AnalyticsMembershipsParams, params?: RequestParams) {
  return hsService.api.analyticsMemberships(query, params);
}

export async function getPublicListPlans(query: PublicListPlansParams, params?: RequestParams) {
  return hsService.api.publicListPlans(query, params);
}

export async function getPublicListPlanCategories(params?: RequestParams) {
  return hsService.api.publicListPlanCategories(params);
}

export async function getPublicResourceAvailability(
  { id, ...query }: PublicResourceAvailabilityParams,
  params?: RequestParams,
) {
  return hsService.api.publicResourceAvailability({ id, ...query }, params);
}

export async function getPublicListResources(query: PublicListResourcesParams, params?: RequestParams) {
  return hsService.api.publicListResources(query, params);
}

export async function getPublicListResourceTypes(params?: RequestParams) {
  return hsService.api.publicListResourceTypes(params);
}

export async function publicCreateBookingRequest(data: CreateBookingRequestDto, params?: RequestParams) {
  return hsService.api.publicCreateBookingRequest(data, params);
}

export async function publicCreatePlanRequest(data: CreatePlanRequestDto, params?: RequestParams) {
  return hsService.api.publicCreatePlanRequest(data, params);
}

export async function publicCreateContactRequest(data: CreateContactRequestDto, params?: RequestParams) {
  return hsService.api.publicCreateContactRequest(data, params);
}

export async function getHealthCheckerControllerCheckDatabase(params?: RequestParams) {
  return hsService.api.healthCheckerControllerCheckDatabase(params);
}

export async function getHealthCheckerControllerCheckSupabase(params?: RequestParams) {
  return hsService.api.healthCheckerControllerCheckSupabase(params);
}

export async function getHealthCheckerControllerCheckMonitoring(params?: RequestParams) {
  return hsService.api.healthCheckerControllerCheckMonitoring(params);
}

export async function getHealthCheckerControllerCheckInstance(params?: RequestParams) {
  return hsService.api.healthCheckerControllerCheckInstance(params);
}

export async function getHealthCheckerControllerCheck(params?: RequestParams) {
  return hsService.health.healthCheckerControllerCheck(params);
}

export async function getAppControllerAppInfo(params?: RequestParams) {
  return hsService.appControllerAppInfo(params);
}
