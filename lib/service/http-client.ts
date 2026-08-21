import { HttpClient, bearerTokenSecurityWorker } from '@hscowork/service-generator/runtime'
import { getAccessToken } from '../auth/session'

export const httpClient = new HttpClient({ securityWorker: bearerTokenSecurityWorker(getAccessToken) })
