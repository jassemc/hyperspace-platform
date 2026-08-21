import "server-only";
import { HsService } from "./HsService.js";
import { httpClient } from "./http-client.js";

export const hsService = new HsService(httpClient);
