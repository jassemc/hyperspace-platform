"use server";
import "server-only";
import { hsService } from "./api";
import type {
  CreateAmenityDto,
  CreateMemberDto,
  CreateResourceDto,
  CreateResourceTypeDto,
  GetAmenitiesParams,
  GetMembersParams,
  GetResourcesParams,
  GetResourceTypesParams,
  UpdateAmenityDto,
  UpdateMemberDto,
  UpdateResourceDto,
  UpdateResourceTypeDto,
} from "./HsService";

import type { RequestParams } from "../shared/types";

export async function getResources(query: GetResourcesParams, params?: RequestParams) {
  return hsService.api.getResources(query, params);
}

export async function addResource(data: CreateResourceDto, params?: RequestParams) {
  return hsService.api.addResource(data, params);
}

export async function getResource(id: string, params?: RequestParams) {
  return hsService.api.getResource(id, params);
}

export async function updateResource(id: string, data: UpdateResourceDto, params?: RequestParams) {
  return hsService.api.updateResource(id, data, params);
}

export async function deleteResource(id: string, params?: RequestParams) {
  return hsService.api.deleteResource(id, params);
}

export async function getResourceTypes(query: GetResourceTypesParams, params?: RequestParams) {
  return hsService.api.getResourceTypes(query, params);
}

export async function addResourceType(data: CreateResourceTypeDto, params?: RequestParams) {
  return hsService.api.addResourceType(data, params);
}

export async function updateResourceType(id: string, data: UpdateResourceTypeDto, params?: RequestParams) {
  return hsService.api.updateResourceType(id, data, params);
}

export async function deleteResourceType(id: string, params?: RequestParams) {
  return hsService.api.deleteResourceType(id, params);
}

export async function getAmenities(query: GetAmenitiesParams, params?: RequestParams) {
  return hsService.api.getAmenities(query, params);
}

export async function addAmenity(data: CreateAmenityDto, params?: RequestParams) {
  return hsService.api.addAmenity(data, params);
}

export async function getAmenity(id: string, params?: RequestParams) {
  return hsService.api.getAmenity(id, params);
}

export async function updateAmenity(id: string, data: UpdateAmenityDto, params?: RequestParams) {
  return hsService.api.updateAmenity(id, data, params);
}

export async function deleteAmenity(id: string, params?: RequestParams) {
  return hsService.api.deleteAmenity(id, params);
}

export async function getMembers(query: GetMembersParams, params?: RequestParams) {
  return hsService.api.getMembers(query, params);
}

export async function addMember(data: CreateMemberDto, params?: RequestParams) {
  return hsService.api.addMember(data, params);
}

export async function getMember(id: string, params?: RequestParams) {
  return hsService.api.getMember(id, params);
}

export async function updateMember(id: string, data: UpdateMemberDto, params?: RequestParams) {
  return hsService.api.updateMember(id, data, params);
}

export async function deleteMember(id: string, params?: RequestParams) {
  return hsService.api.deleteMember(id, params);
}

export async function getHealthCheckerControllerCheck(params?: RequestParams) {
  return hsService.health.healthCheckerControllerCheck(params);
}
