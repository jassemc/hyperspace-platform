import { HttpClient, bearerTokenSecurityWorker } from '@hscowork/service-generator/runtime'
import { getAccessToken } from '../auth/session'
import { assertApiAuthOk } from '../auth/api-auth'

/**
 * Every API response passes through here, so 401 and 403 become typed
 * errors instead of empty tables (#75 / S-11). `assertApiAuthOk` leaves
 * everything else untouched — including other 4xx, which the callers
 * already surface as messages.
 */
const authAwareFetch: typeof fetch = async (input, init) =>
  assertApiAuthOk(await fetch(input, init))

export const httpClient = new HttpClient({
  securityWorker: bearerTokenSecurityWorker(getAccessToken),
  customFetch: authAwareFetch,
})
