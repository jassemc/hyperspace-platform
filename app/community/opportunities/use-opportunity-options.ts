"use client"

import { useCallback, useState } from "react"
import {
  getListMembers,
  getListPlans,
  getListResources,
  getMember,
  getPlan,
  getResource,
} from "@/lib/service"
import type {
  MemberDto,
  OpportunityDto,
  PlanDto,
  ResourceDto,
} from "@/lib/service/HsService"
import { apiString } from "@/lib/api-value"
import { toast } from "sonner"

/** Which button is waiting, so only that one shows a spinner. */
export type OpportunityAction = "create" | "edit" | "convert"

export interface OptionsLoading {
  action: OpportunityAction
  /** The row being acted on; null when adding. */
  id: string | null
}

export interface OpportunityOptions {
  members: MemberDto[]
  plans: PlanDto[]
  resources: ResourceDto[]
}

const PAGE = { limit: 100, offset: 0, sort: "ASC" as const }

const EMPTY: OpportunityOptions = { members: [], plans: [], resources: [] }

/**
 * Reopening a drawer refetched the same catalogue every time. Members, plans
 * and spaces barely move during a session, so they are held for a few minutes
 * and shared by both drawers.
 */
const CACHE_TTL_MS = 5 * 60 * 1000
let cache: { at: number; options: OpportunityOptions } | null = null

/**
 * Everything the opportunity drawer needs to render its selects, fetched
 * before the drawer opens so it never appears with empty dropdowns.
 *
 * The lists are capped at 100, so an opportunity pointing at a member, plan
 * or space outside that page would show as unset — and be blanked on save.
 * Those three are fetched by id and folded in.
 */
export function useOpportunityOptions() {
  const [options, setOptions] = useState<OpportunityOptions>(EMPTY)
  const [loading, setLoading] = useState<OptionsLoading | null>(null)

  const loadOptions = useCallback(async (
    action: OpportunityAction,
    opportunity?: OpportunityDto | null
  ) => {
    setLoading({ action, id: opportunity?.id ?? null })
    try {
      const fresh = cache && Date.now() - cache.at < CACHE_TTL_MS ? cache.options : null

      // Editing locks the member to the one the lead was opened for, and the
      // row already names them — only Add needs the whole member list.
      const needsMembers = action !== "edit"

      const [memberPage, planPage, resourcePage] = await Promise.all([
        needsMembers && !fresh ? getListMembers(PAGE) : null,
        fresh ? null : getListPlans(PAGE),
        fresh ? null : getListResources(PAGE),
      ])

      const members = memberPage
        ? ((memberPage.results ?? []) as MemberDto[])
        : (fresh?.members ?? [])
      const plans = planPage
        ? ((planPage.results ?? []) as PlanDto[])
        : (fresh?.plans ?? [])
      const resources = resourcePage
        ? ((resourcePage.results ?? []) as ResourceDto[])
        : (fresh?.resources ?? [])

      const memberId = opportunity?.memberId
      const planId = apiString(opportunity?.requestedPlanId)
      const resourceId = apiString(opportunity?.requestedResourceId)

      const [member, plan, resource] = await Promise.all([
        memberId && !members.some((entry) => entry.id === memberId)
          ? getMember(memberId).catch(() => null)
          : null,
        planId && !plans.some((entry) => entry.id === planId)
          ? getPlan(planId).catch(() => null)
          : null,
        resourceId && !resources.some((entry) => entry.id === resourceId)
          ? getResource(resourceId).catch(() => null)
          : null,
      ])

      const loaded: OpportunityOptions = {
        members: member ? [...members, member as MemberDto] : members,
        plans: plan ? [...plans, plan as PlanDto] : plans,
        resources: resource ? [...resources, resource as ResourceDto] : resources,
      }
      // Only the lists as fetched are cached; a by-id backfill belongs to the
      // lead that needed it.
      if (!fresh) {
        cache = { at: Date.now(), options: { members, plans, resources } }
      }
      setOptions(loaded)
      return loaded
    } catch (error) {
      // The drawer stays shut on failure, so say why.
      console.error("Failed to load opportunity options", error)
      toast.error("Could not load members, plans and spaces")
      return null
    } finally {
      setLoading(null)
    }
  }, [])

  /**
   * The convert panel reviews one lead. The row already names its member, plan
   * and space; only the plan's benefits are missing, so that is the one call.
   */
  const loadConvert = useCallback(async (opportunity: OpportunityDto) => {
    setLoading({ action: "convert", id: opportunity.id })
    try {
      const planId = apiString(opportunity.requestedPlanId)
      const plan = planId ? await getPlan(planId) : null
      return { plan: (plan as PlanDto | null) ?? null }
    } catch (error) {
      console.error("Failed to load the plan for this lead", error)
      toast.error("Could not load this lead's plan")
      return null
    } finally {
      setLoading(null)
    }
  }, [])

  return { options, loading, loadOptions, loadConvert }
}

export interface ConvertContext {
  plan: PlanDto | null
}
