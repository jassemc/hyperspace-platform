import { describe, expect, it } from "vitest"
import { navigationConfig } from "./navigation-config"

type Entry = { title: string; url: string }

/** Every leaf and branch in the sidebar, flattened. */
function allEntries(): Entry[] {
  const out: Entry[] = []
  for (const group of navigationConfig.navMain) {
    out.push({ title: group.title, url: group.url })
    for (const sub of group.subMenus ?? []) {
      out.push({ title: sub.title, url: sub.url })
      for (const item of sub.items ?? []) {
        out.push({ title: item.title, url: item.url })
      }
    }
  }
  return out
}

/**
 * #74 (S-10): twenty sidebar entries pointed at "#". New staff click
 * every item on day one, and twenty dead links hide the real pages among
 * decoys — the tool reads as unfinished. This test is the lint rule the
 * ticket asked for: a placeholder cannot come back unnoticed.
 */
describe("navigationConfig", () => {
  it("has no placeholder destinations", () => {
    const dead = allEntries().filter((entry) => entry.url === "#")

    expect(dead.map((entry) => entry.title)).toEqual([])
  })

  it("points every entry at an absolute app route", () => {
    const bad = allEntries().filter(
      (entry) => !entry.url.startsWith("/") || entry.url.trim() !== entry.url,
    )

    expect(bad.map((entry) => `${entry.title} -> ${entry.url}`)).toEqual([])
  })

  it("still exposes the sections staff actually use", () => {
    const urls = allEntries().map((entry) => entry.url)

    // A regression here would mean the cleanup above went too far.
    for (const route of [
      "/community/members",
      "/community/companies",
      "/community/opportunities",
      "/space/resources",
      "/billing/invoices",
      "/booking/bookings",
      "/booking/checkins",
      "/settings/locations",
      "/settings/resource-types",
    ]) {
      expect(urls).toContain(route)
    }
  })
})
