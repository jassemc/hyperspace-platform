import "server-only";
import { HttpClient } from "../shared/HttpClient";
import { HsService } from "./HsService";

const httpClient = new HttpClient();

export const hsService = new HsService(httpClient);
