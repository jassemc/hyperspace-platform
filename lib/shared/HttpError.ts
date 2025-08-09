import { FormattedHttpResponse, Problem } from "./types"

export class HttpError<T = unknown> extends Error implements FormattedHttpResponse<T, Problem> {
  public data = undefined as T

  constructor(
    msg: string,
    public status: number,
    public error: Problem
  ) {
    super(`Status Code ${status}: ${msg}`)
  }
}
