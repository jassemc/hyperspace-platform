import { requestSecurityWorker } from "../auth/session";
import { HttpError } from "./HttpError";
import { ProblemError } from "./ProblemError";
import type {
  ApiConfig,
  CancelToken,
  FormattedHttpResponse,
  FullRequestParams,
  Problem,
  QueryParamsType,
  RequestParams,
  ResponseFormat,
} from './types'
import { ContentType } from './types'


export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = '';
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
    this.baseUrl = `${(apiConfig.baseUrl?.replace(/\/+$/, '') ?? process.env.HS_API_BASE_URL)?.replace(/\/+$/, '')}`

    this.securityWorker = requestSecurityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  private async handleResponse<T = any>(
    response: Response,
    responseFormat: ResponseFormat | undefined
  ): Promise<FormattedHttpResponse<T, Problem>> {

    try {
      if (response.ok) {
        // case where response is ok
        if (response.status !== 200 && responseFormat == null) {
          // When we not get a 200 (e.g 201, 202, etc), and the responseFormat is not defined, we return null instead of the body stream
          return {
            status: response.status,
            data: null as T,
          }
        } else {
          return {
            status: response.status,
            data: responseFormat ? await response[responseFormat]() : response.body,
          }
        }
      }
      else if (response.status === 204) {
        // When we get a 204, there is no content, we avoid thrown of exception by response.json()
        return {
          status: response.status,
          data: null as T,
        }
      }
      else {
        // case where response is not ok
        const errorText = await response.text()
        try {
          const error: Problem = JSON.parse(errorText)

          return new HttpError(error.detail ?? response.statusText, response.status, error)
        } catch {
          // API didn't return JSON
          return new HttpError(errorText, response.status, { status: response.status, detail: errorText })
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e?.message : JSON.stringify(e)
      return new HttpError(msg, response.status, new ProblemError(msg));
    }
  }

  public request = async <T = unknown, E = unknown, P extends FullRequestParams = FullRequestParams>(
    params: P
  ): Promise<T> => {
    const response = await this.doRequest<T>(params)
    return response.data
  };

  private doRequest = async <T = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<FormattedHttpResponse<T, Problem>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const formattedResponse = await this.handleResponse<T>(response, responseFormat);

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (formattedResponse instanceof HttpError || !response.ok) {
        console.error("Error response:", formattedResponse);
        throw formattedResponse;
      }

      return formattedResponse;
    });
  }
}
