export const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
export type WeekDay = (typeof WEEK_DAYS)[number]

export const DAY_LABELS: Record<WeekDay, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
}
