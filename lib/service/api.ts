import "server-only";
import { HsService } from "./HsService";
import { httpClient } from "./http-client";

export const hsService = new HsService(httpClient);
