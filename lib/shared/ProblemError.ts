import { Problem } from "./types"

export class ProblemError extends Error implements Problem {
  type?: string
  title?: string
  detail?: string
  instance?: string
  status?: number
  timestamp?: string

  constructor(detail: string) {
    super()
    this.detail = detail
    this.name = 'ProblemError'
  }
}