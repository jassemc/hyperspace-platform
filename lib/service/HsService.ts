import "server-only";
import type { HttpClient } from "../shared/HttpClient";
import { ContentType, RequestParams } from "../shared/types";

export interface PageMetaDto {
  /**
   * The current page number.
   * @example 1
   */
  page: number;
  /**
   * The number of items per page.
   * @example 10
   */
  pageSize: number;
  /**
   * The total number of items across all pages.
   * @example 100
   */
  totalItems: number;
  /**
   * Indicates if there is a previous page available.
   * @example false
   */
  hasPreviousPage: boolean;
  /**
   * Indicates if there is a next page available.
   * @example true
   */
  hasNextPage: boolean;
}

export interface PageDto {
  /** An array of results for the current page. */
  results: Array<Array<any>>;
  /** Metadata for the paginated response, including pagination details. */
  meta: PageMetaDto;
}

export interface AmenityDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /**
   * The name of the amenity
   * @example "amenity 1"
   */
  name: string;
  /**
   * The description of the amenity
   * @example "amenity Description"
   */
  description?: string;
  /**
   * The type of the amenity
   * @example "meeting_room"
   */
  icon: string;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface ResourceDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /**
   * The parent resource if this is a sub-resource, e.g. a private office with office desks associated with it
   * @example {"id":"9df3cd63-ad9a-48fb-8d48-2744da103c39","name":"Office 1","description":"This is a parent resource","type":"office","size":10,"createdAt":"2025-05-25T10:03:33.169Z","updatedAt":"2025-05-25T10:03:33.169Z"}
   */
  parent?: ResourceDto | null;
  /**
   * An array containing the amenities in this resource.
   * @example [{"id":"9df3cd63-ad9a-48fb-8d48-2744da103c39","name":"Amenity 1","description":"This is a parent resource","icon":"fa-chair"}]
   */
  amenities: Array<AmenityDto>;
  /**
   * The name of the resource
   * @example "Resource 1"
   */
  name: string;
  /**
   * The description of the resource
   * @example "Resource Description"
   */
  description?: string;
  /**
   * The type of the resource
   * @example "meeting_room"
   */
  type: string;
  /**
   * The number of people that can inhabit the resource
   * @example "7"
   */
  capacity: number;
  /**
   * status of the resource. One of types listed above.
   * `AVAILABLE`, `OCCUPIED`, `UNAVAILABLE`, `AVAILABLE_SOON`, `RESERVED`
   * @example "AVAILABLE"
   */
  status: "UNAVAILABLE" | "AVAILABLE" | "OCCUPIED" | "AVAILABLE_SOON" | "RESERVED";
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export type Sort = "ASC" | "DESC";

export interface CreateResourceDto {
  /**
   * The parent resource id if this is a sub-resource, e.g. a private office with office desks associated with it
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  parent?: string;
  /**
   * An array containing resource ids the amenities in this resource.
   * @example ["9df3cd63-ad9a-48fb-8d48-2744da103c39","b2f3cd63-ad9a-48fb-8d48-2744da103c40"]
   */
  amenities: Array<string>;
  /**
   * The name of the resource
   * @example "Resource 1"
   */
  name: string;
  /**
   * The description of the resource
   * @example "Resource Description"
   */
  description?: string;
  /**
   * The type of the resource
   * @example "meeting_room"
   */
  type: string;
  /**
   * The number of people that can inhabit the resource
   * @example "7"
   */
  capacity: number;
  /**
   * status of the resource. One of types listed above.
   * `AVAILABLE`, `OCCUPIED`, `UNAVAILABLE`, `AVAILABLE_SOON`, `RESERVED`
   * @example "AVAILABLE"
   */
  status: "UNAVAILABLE" | "AVAILABLE" | "OCCUPIED" | "AVAILABLE_SOON" | "RESERVED";
}

export interface UpdateResourceDto {
  /**
   * The parent resource id if this is a sub-resource, e.g. a private office with office desks associated with it
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  parent?: string;
  /**
   * An array containing resource ids the amenities in this resource.
   * @example ["9df3cd63-ad9a-48fb-8d48-2744da103c39","b2f3cd63-ad9a-48fb-8d48-2744da103c40"]
   */
  amenities?: Array<string>;
  /**
   * The name of the resource
   * @example "Resource 1"
   */
  name?: string;
  /**
   * The description of the resource
   * @example "Resource Description"
   */
  description?: string;
  /**
   * The type of the resource
   * @example "meeting_room"
   */
  type?: string;
  /**
   * The number of people that can inhabit the resource
   * @example "7"
   */
  capacity?: number;
  /**
   * status of the resource. One of types listed above.
   * `AVAILABLE`, `OCCUPIED`, `UNAVAILABLE`, `AVAILABLE_SOON`, `RESERVED`
   * @example "AVAILABLE"
   */
  status: "UNAVAILABLE" | "AVAILABLE" | "OCCUPIED" | "AVAILABLE_SOON" | "RESERVED";
}

export interface ResourceTypeDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /**
   * The name of the resource type.
   * @example "Resource Type 1"
   */
  name: string;
  /**
   * The description of the resource type.
   * @example "Resource Type Description"
   */
  description?: string;
  /**
   * A unique key that links the resource type to a zone type.
   * @example "meeting_room"
   */
  type: string;
  /**
   * An icon to represent the resource type on the portal.
   * @example "fa-building"
   */
  icon: string;
  /**
   * Booking mode of the resource type, it is only available if we select Can Book. you can pick One of types listed above.
   * `DATE`, `TIME`
   * @example "DATE"
   */
  bookingMode: "TIME" | "DATE";
  /**
   * Select if the Resource Type should be available for booking on a calendar.
   * @example true
   */
  canBook: boolean;
  /**
   * Select if we want to assign memberships to the resource type.
   * @example true
   */
  canAssign: boolean;
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateResourceTypeDto {
  /**
   * The name of the resource type.
   * @example "Resource Type 1"
   */
  name: string;
  /**
   * The description of the resource type.
   * @example "Resource Type Description"
   */
  description?: string;
  /**
   * A unique key that links the resource type to a zone type.
   * @example "meeting_room"
   */
  type: string;
  /**
   * An icon to represent the resource type on the portal.
   * @example "fa-building"
   */
  icon: string;
  /**
   * Booking mode of the resource type, it is only available if we select Can Book. you can pick One of types listed above.
   * `DATE`, `TIME`
   * @example "DATE"
   */
  bookingMode: "TIME" | "DATE";
  /**
   * Select if the Resource Type should be available for booking on a calendar.
   * @example true
   */
  canBook: boolean;
  /**
   * Select if we want to assign memberships to the resource type.
   * @example true
   */
  canAssign: boolean;
}

export interface UpdateResourceTypeDto {
  /**
   * The name of the resource type.
   * @example "Resource Type 1"
   */
  name: string;
  /**
   * The description of the resource type.
   * @example "Resource Type Description"
   */
  description?: string;
  /**
   * A unique key that links the resource type to a zone type.
   * @example "meeting_room"
   */
  type: string;
  /**
   * An icon to represent the resource type on the portal.
   * @example "fa-building"
   */
  icon: string;
  /**
   * Booking mode of the resource type, it is only available if we select Can Book. you can pick One of types listed above.
   * `DATE`, `TIME`
   * @example "DATE"
   */
  bookingMode: "TIME" | "DATE";
  /**
   * Select if the Resource Type should be available for booking on a calendar.
   * @example true
   */
  canBook: boolean;
  /**
   * Select if we want to assign memberships to the resource type.
   * @example true
   */
  canAssign: boolean;
}

export interface CreateAmenityDto {
  /**
   * The name of the amenity
   * @example "amenity 1"
   */
  name: string;
  /**
   * The description of the amenity
   * @example "amenity Description"
   */
  description?: string;
  /**
   * The type of the amenity
   * @example "fa-building"
   */
  icon: string;
}

export interface UpdateAmenityDto {
  /**
   * The name of the amenity
   * @example "amenity 1"
   */
  name?: string;
  /**
   * The description of the amenity
   * @example "amenity Description"
   */
  description?: string;
  /**
   * An icon to represent the amenity on the portal.
   * @example "fa-building"
   */
  icon: string;
}

export interface AddressDto {
  /** Full address location */
  address: string;
  /**
   * City location
   * @example "Seattle"
   */
  city: string;
  /**
   * State location
   * @example "WA"
   */
  state: string;
  /**
   * zipCode of the region
   * @example "98109"
   */
  zipCode: string;
}

export interface MemberDto {
  /**
   * Unique identifier
   * @format uuid
   * @example "9df3cd63-ad9a-48fb-8d48-2744da103c39"
   */
  id: string;
  /** The parent resource if this is a sub-resource, e.g. a private office with office desks associated with it */
  address?: AddressDto;
  /**
   * The name of the member
   * @example "Maya Mayer"
   */
  name: string;
  /**
   * The phone number of the member
   * @example "Maya Mayer"
   */
  phone: string;
  /**
   * A short description of the member
   * @example "Maya Mayer is a student"
   */
  description?: string;
  /**
   * The start date of the member
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  startedAt: string;
  /**
   * The email of the member
   * @example "maya.mayer@hscowork.com"
   */
  email?: string;
  /**
   * A generated sequence number provided by access door system when we add a fingerprint of the member to it.
   * @example 40
   */
  accessNumber?: number;
  /** flag to enable auto member status calculation based on their memberships. */
  enableAutoStatus?: boolean;
  /**
   * status of the member. One of types listed above. In case of nullable value the status is auto calculated
   * `INACTIVE`, `ACTIVE`, `DROP-IN`, `PENDING`, `FORMER`
   * @example "INACTIVE"
   */
  status?: "ACTIVE" | "INACTIVE" | "DROP-IN" | "PENDING" | "FORMER";
  /**
   * The date of creation of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  createdAt: string;
  /**
   * The date of the last update of the resource
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  updatedAt: string;
}

export interface CreateMemberDto {
  /** The parent resource if this is a sub-resource, e.g. a private office with office desks associated with it */
  address?: AddressDto;
  /**
   * The name of the member
   * @example "Maya Mayer"
   */
  name: string;
  /**
   * The phone number of the member
   * @example "Maya Mayer"
   */
  phone: string;
  /**
   * A short description of the member
   * @example "Maya Mayer is a student"
   */
  description?: string;
  /**
   * The start date of the member
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  startedAt: string;
  /**
   * The email of the member
   * @example "maya.mayer@hscowork.com"
   */
  email?: string;
  /**
   * A generated sequence number provided by access door system when we add a fingerprint of the member to it.
   * @example 40
   */
  accessNumber?: number;
  /** flag to enable auto member status calculation based on their memberships. */
  enableAutoStatus?: boolean;
  /**
   * status of the member. One of types listed above. In case of nullable value the status is auto calculated
   * `INACTIVE`, `ACTIVE`, `DROP-IN`, `PENDING`, `FORMER`
   * @example "INACTIVE"
   */
  status?: "ACTIVE" | "INACTIVE" | "DROP-IN" | "PENDING" | "FORMER";
}

export interface UpdateMemberDto {
  /** The parent resource if this is a sub-resource, e.g. a private office with office desks associated with it */
  address?: AddressDto;
  /**
   * The name of the member
   * @example "Maya Mayer"
   */
  name?: string;
  /**
   * The phone number of the member
   * @example "Maya Mayer"
   */
  phone?: string;
  /**
   * A short description of the member
   * @example "Maya Mayer is a student"
   */
  description?: string;
  /**
   * The start date of the member
   * @format date-time
   * @example "2025-05-25T10:03:33.169Z"
   */
  startedAt?: string;
  /**
   * The email of the member
   * @example "maya.mayer@hscowork.com"
   */
  email?: string;
  /**
   * A generated sequence number provided by access door system when we add a fingerprint of the member to it.
   * @example 40
   */
  accessNumber?: number;
  /** flag to enable auto member status calculation based on their memberships. */
  enableAutoStatus?: boolean;
  /**
   * status of the member. One of types listed above. In case of nullable value the status is auto calculated
   * `INACTIVE`, `ACTIVE`, `DROP-IN`, `PENDING`, `FORMER`
   * @example "INACTIVE"
   */
  status?: "ACTIVE" | "INACTIVE" | "DROP-IN" | "PENDING" | "FORMER";
}

export interface GetResourcesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** The search term to filter results. */
  q?: string;
}

export interface GetResourceTypesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** The search term to filter results. */
  q?: string;
  name?: string;
  type?: string;
}

export interface GetAmenitiesParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** The search term to filter results. */
  q?: string;
}

export interface GetMembersParams {
  /**
   * The number of items to skip before starting to collect the result set, starting from 0.
   * @default 0
   * @example 0
   */
  offset: number;
  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  limit: number;
  /** The direction to sort the results, either 'ASC' or 'DESC'. */
  sort: Sort;
  /** The search term to filter results. */
  q?: string;
}

export namespace Api {
  /**
 * @description This operation allows to retrieve all resources.
 * @tags Resource
 * @name GetResources
 * @summary Retrieve a list of resources based on provided filters.
 * @request GET:/api/v1/resources
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceDto>,

})` List of resources retrieved successfully
 * @response `400` `void` Bad Request.
 * @response `401` `void` Unauthorized
 * @response `500` `void` Something went wrong.
 * @response `default` `void`
*/
  export namespace GetResources {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<ResourceDto>;
    };
  }

  /**
   * @description This operation allows to create a new resource.
   * @tags Resource
   * @name AddResource
   * @summary Create a new resource.
   * @request POST:/api/v1/resources
   * @secure
   * @response `201` `ResourceDto` Resource added successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `ResourceDto`
   */
  export namespace AddResource {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateResourceDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceDto;
  }

  /**
   * @description This operation allows to retrieve a single resource.
   * @tags Resource
   * @name GetResource
   * @summary Retrieve a single resource.
   * @request GET:/api/v1/resources/{id}
   * @secure
   * @response `200` `ResourceDto` Resource retrieved successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `ResourceDto`
   */
  export namespace GetResource {
    export type RequestParams = {
      /**
       * The ID of the resource to retrieve
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceDto;
  }

  /**
   * @description This operation allows to update a resource details.
   * @tags Resource
   * @name UpdateResource
   * @summary Update a resource.
   * @request PUT:/api/v1/resources/{id}
   * @secure
   * @response `202` `ResourceDto` Resource updated successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `ResourceDto`
   */
  export namespace UpdateResource {
    export type RequestParams = {
      /**
       * The ID of the resource to update
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateResourceDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceDto;
  }

  /**
   * @description This operation allows to delete a resource.
   * @tags Resource
   * @name DeleteResource
   * @summary Delete a resource.
   * @request DELETE:/api/v1/resources/{id}
   * @secure
   * @response `202` `void` Resource deleted successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `void`
   */
  export namespace DeleteResource {
    export type RequestParams = {
      /**
       * The ID of the resource to delete
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
 * @description This operation allows to retrieve all resource types.
 * @tags ResourceType
 * @name GetResourceTypes
 * @summary Retrieve a list of resource types based on provided filters.
 * @request GET:/api/v1/resource-types
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceTypeDto>,

})` List of resources retrieved successfully
 * @response `400` `void` Bad Request.
 * @response `401` `void` Unauthorized
 * @response `500` `void` Something went wrong.
 * @response `default` `void`
*/
  export namespace GetResourceTypes {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** The search term to filter results. */
      q?: string;
      name?: string;
      type?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<ResourceTypeDto>;
    };
  }

  /**
   * @description This operation allows to create a new resource type.
   * @tags ResourceType
   * @name AddResourceType
   * @summary Create a new resource type.
   * @request POST:/api/v1/resource-types
   * @secure
   * @response `201` `ResourceTypeDto` Resource type added successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `ResourceTypeDto`
   */
  export namespace AddResourceType {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateResourceTypeDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceTypeDto;
  }

  /**
   * @description This operation allows to update a resource type details.
   * @tags ResourceType
   * @name UpdateResourceType
   * @summary Update a resource type.
   * @request PUT:/api/v1/resource-types/{id}
   * @secure
   * @response `202` `ResourceTypeDto` Resource type updated successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `ResourceTypeDto`
   */
  export namespace UpdateResourceType {
    export type RequestParams = {
      /**
       * The ID of the resource type to update
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateResourceTypeDto;
    export type RequestHeaders = {};
    export type ResponseBody = ResourceTypeDto;
  }

  /**
   * @description This operation allows to delete a resource type.
   * @tags ResourceType
   * @name DeleteResourceType
   * @summary Delete a resource type.
   * @request DELETE:/api/v1/resource-types/{id}
   * @secure
   * @response `202` `void` Resource type deleted successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `void`
   */
  export namespace DeleteResourceType {
    export type RequestParams = {
      /**
       * The ID of the resource type to delete
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
 * @description This operation allows to retrieve all amenities.
 * @tags Amenity
 * @name GetAmenities
 * @summary Retrieve a list of amenities based on provided filters.
 * @request GET:/api/v1/amenities
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<AmenityDto>,

})` List of amenities retrieved successfully
 * @response `400` `void` Bad Request.
 * @response `401` `void` Unauthorized
 * @response `500` `void` Something went wrong.
 * @response `default` `void`
*/
  export namespace GetAmenities {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<AmenityDto>;
    };
  }

  /**
   * @description This operation allows to create a new amenity.
   * @tags Amenity
   * @name AddAmenity
   * @summary Create a new amenity.
   * @request POST:/api/v1/amenities
   * @secure
   * @response `201` `AmenityDto` Amenity added successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `AmenityDto`
   */
  export namespace AddAmenity {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateAmenityDto;
    export type RequestHeaders = {};
    export type ResponseBody = AmenityDto;
  }

  /**
   * @description This operation allows to retrieve a single amenity.
   * @tags Amenity
   * @name GetAmenity
   * @summary Retrieve a single amenity.
   * @request GET:/api/v1/amenities/{id}
   * @secure
   * @response `200` `AmenityDto` Amenity retrieved successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `AmenityDto`
   */
  export namespace GetAmenity {
    export type RequestParams = {
      /**
       * The ID of the amenity to retrieve
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AmenityDto;
  }

  /**
   * @description This operation allows to update a amenity details.
   * @tags Amenity
   * @name UpdateAmenity
   * @summary Update a amenity.
   * @request PUT:/api/v1/amenities/{id}
   * @secure
   * @response `202` `AmenityDto` Amenity updated successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `AmenityDto`
   */
  export namespace UpdateAmenity {
    export type RequestParams = {
      /**
       * The ID of the amenity to update
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateAmenityDto;
    export type RequestHeaders = {};
    export type ResponseBody = AmenityDto;
  }

  /**
   * @description This operation allows to delete a amenity.
   * @tags Amenity
   * @name DeleteAmenity
   * @summary Delete a amenity.
   * @request DELETE:/api/v1/amenities/{id}
   * @secure
   * @response `202` `void` Amenity deleted successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `void`
   */
  export namespace DeleteAmenity {
    export type RequestParams = {
      /**
       * The ID of the amenity to delete
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
 * @description This operation allows to retrieve all members.
 * @tags Member
 * @name GetMembers
 * @summary Retrieve a list of members based on provided filters.
 * @request GET:/api/v1/members
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<MemberDto>,

})` List of members retrieved successfully
 * @response `400` `void` Bad Request.
 * @response `401` `void` Unauthorized
 * @response `500` `void` Something went wrong.
 * @response `default` `void`
*/
  export namespace GetMembers {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * The number of items to skip before starting to collect the result set, starting from 0.
       * @default 0
       * @example 0
       */
      offset: number;
      /**
       * The number of items to retrieve per page.
       * @default 10
       * @example 10
       */
      limit: number;
      /** The direction to sort the results, either 'ASC' or 'DESC'. */
      sort: Sort;
      /** The search term to filter results. */
      q?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PageDto & {
      results?: Array<MemberDto>;
    };
  }

  /**
   * @description This operation allows to create a new member.
   * @tags Member
   * @name AddMember
   * @summary Create a new member.
   * @request POST:/api/v1/members
   * @secure
   * @response `201` `MemberDto` Member added successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `MemberDto`
   */
  export namespace AddMember {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateMemberDto;
    export type RequestHeaders = {};
    export type ResponseBody = MemberDto;
  }

  /**
   * @description This operation allows to retrieve a single member.
   * @tags Member
   * @name GetMember
   * @summary Retrieve a single member.
   * @request GET:/api/v1/members/{id}
   * @secure
   * @response `200` `MemberDto` Member retrieved successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `MemberDto`
   */
  export namespace GetMember {
    export type RequestParams = {
      /**
       * The ID of the member to retrieve
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MemberDto;
  }

  /**
   * @description This operation allows to update a member details.
   * @tags Member
   * @name UpdateMember
   * @summary Update a member.
   * @request PUT:/api/v1/members/{id}
   * @secure
   * @response `202` `MemberDto` Member updated successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `MemberDto`
   */
  export namespace UpdateMember {
    export type RequestParams = {
      /**
       * The ID of the member to update
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateMemberDto;
    export type RequestHeaders = {};
    export type ResponseBody = MemberDto;
  }

  /**
   * @description This operation allows to delete a member.
   * @tags Member
   * @name DeleteMember
   * @summary Delete a member.
   * @request DELETE:/api/v1/members/{id}
   * @secure
   * @response `202` `void` Member deleted successfully
   * @response `400` `void` Bad Request.
   * @response `401` `void` Unauthorized
   * @response `500` `void` Something went wrong.
   * @response `default` `void`
   */
  export namespace DeleteMember {
    export type RequestParams = {
      /**
       * The ID of the member to delete
       * @example "3c90c3cc-0d44-4b50-8888-8dd25736052a"
       */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }
}

export namespace Health {
  /**
 * No description
 * @tags HealthChecker
 * @name HealthCheckerControllerCheck
 * @request GET:/health
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
*/
  export namespace HealthCheckerControllerCheck {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      /** @example "ok" */
      status?: string;
      /** @example {"database":{"status":"up"}} */
      info?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {} */
      error?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
      /** @example {"database":{"status":"up"}} */
      details?: Record<
        string,
        {
          status: string;
          [key: string]: any;
        }
      >;
    };
  }
}

/**
 * @title platform_app
 * @version 0.0.1
 * @baseUrl /
 * @contact
 *
 * Service for managing hyperspace operations
 */
export class HsService<SecurityDataType extends unknown> {
  http: HttpClient<SecurityDataType>;

  constructor(http: HttpClient<SecurityDataType>) {
    this.http = http;
  }

  /**
   * No description
   *
   * @tags App
   * @name AppControllerAppInfo
   * @request GET:/
   * @response `default` `object`
   */
  appControllerAppInfo = (params: RequestParams = {}) =>
    this.http.request<any, object>({
      path: `/`,
      method: "GET",
      ...params,
    });

  api = {
    /**
 * @description This operation allows to retrieve all resources.
 *
 * @tags Resource
 * @name GetResources
 * @summary Retrieve a list of resources based on provided filters.
 * @request GET:/api/v1/resources
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceDto>,

})` List of resources retrieved successfully
 * @response `400` `void` Bad Request.
 * @response `401` `void` Unauthorized
 * @response `500` `void` Something went wrong.
 * @response `default` `void`
 */
    getResources: (query: GetResourcesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<ResourceDto>;
        },
        void
      >({
        path: `/api/v1/resources`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to create a new resource.
     *
     * @tags Resource
     * @name AddResource
     * @summary Create a new resource.
     * @request POST:/api/v1/resources
     * @secure
     * @response `201` `ResourceDto` Resource added successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `ResourceDto`
     */
    addResource: (data: CreateResourceDto, params: RequestParams = {}) =>
      this.http.request<ResourceDto, void | ResourceDto>({
        path: `/api/v1/resources`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to retrieve a single resource.
     *
     * @tags Resource
     * @name GetResource
     * @summary Retrieve a single resource.
     * @request GET:/api/v1/resources/{id}
     * @secure
     * @response `200` `ResourceDto` Resource retrieved successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `ResourceDto`
     */
    getResource: (id: string, params: RequestParams = {}) =>
      this.http.request<ResourceDto, void | ResourceDto>({
        path: `/api/v1/resources/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to update a resource details.
     *
     * @tags Resource
     * @name UpdateResource
     * @summary Update a resource.
     * @request PUT:/api/v1/resources/{id}
     * @secure
     * @response `202` `ResourceDto` Resource updated successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `ResourceDto`
     */
    updateResource: (id: string, data: UpdateResourceDto, params: RequestParams = {}) =>
      this.http.request<ResourceDto, void | ResourceDto>({
        path: `/api/v1/resources/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to delete a resource.
     *
     * @tags Resource
     * @name DeleteResource
     * @summary Delete a resource.
     * @request DELETE:/api/v1/resources/{id}
     * @secure
     * @response `202` `void` Resource deleted successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `void`
     */
    deleteResource: (id: string, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/v1/resources/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
 * @description This operation allows to retrieve all resource types.
 *
 * @tags ResourceType
 * @name GetResourceTypes
 * @summary Retrieve a list of resource types based on provided filters.
 * @request GET:/api/v1/resource-types
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<ResourceTypeDto>,

})` List of resources retrieved successfully
 * @response `400` `void` Bad Request.
 * @response `401` `void` Unauthorized
 * @response `500` `void` Something went wrong.
 * @response `default` `void`
 */
    getResourceTypes: (query: GetResourceTypesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<ResourceTypeDto>;
        },
        void
      >({
        path: `/api/v1/resource-types`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to create a new resource type.
     *
     * @tags ResourceType
     * @name AddResourceType
     * @summary Create a new resource type.
     * @request POST:/api/v1/resource-types
     * @secure
     * @response `201` `ResourceTypeDto` Resource type added successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `ResourceTypeDto`
     */
    addResourceType: (data: CreateResourceTypeDto, params: RequestParams = {}) =>
      this.http.request<ResourceTypeDto, void | ResourceTypeDto>({
        path: `/api/v1/resource-types`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to update a resource type details.
     *
     * @tags ResourceType
     * @name UpdateResourceType
     * @summary Update a resource type.
     * @request PUT:/api/v1/resource-types/{id}
     * @secure
     * @response `202` `ResourceTypeDto` Resource type updated successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `ResourceTypeDto`
     */
    updateResourceType: (id: string, data: UpdateResourceTypeDto, params: RequestParams = {}) =>
      this.http.request<ResourceTypeDto, void | ResourceTypeDto>({
        path: `/api/v1/resource-types/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to delete a resource type.
     *
     * @tags ResourceType
     * @name DeleteResourceType
     * @summary Delete a resource type.
     * @request DELETE:/api/v1/resource-types/{id}
     * @secure
     * @response `202` `void` Resource type deleted successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `void`
     */
    deleteResourceType: (id: string, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/v1/resource-types/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
 * @description This operation allows to retrieve all amenities.
 *
 * @tags Amenity
 * @name GetAmenities
 * @summary Retrieve a list of amenities based on provided filters.
 * @request GET:/api/v1/amenities
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<AmenityDto>,

})` List of amenities retrieved successfully
 * @response `400` `void` Bad Request.
 * @response `401` `void` Unauthorized
 * @response `500` `void` Something went wrong.
 * @response `default` `void`
 */
    getAmenities: (query: GetAmenitiesParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<AmenityDto>;
        },
        void
      >({
        path: `/api/v1/amenities`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to create a new amenity.
     *
     * @tags Amenity
     * @name AddAmenity
     * @summary Create a new amenity.
     * @request POST:/api/v1/amenities
     * @secure
     * @response `201` `AmenityDto` Amenity added successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `AmenityDto`
     */
    addAmenity: (data: CreateAmenityDto, params: RequestParams = {}) =>
      this.http.request<AmenityDto, void | AmenityDto>({
        path: `/api/v1/amenities`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to retrieve a single amenity.
     *
     * @tags Amenity
     * @name GetAmenity
     * @summary Retrieve a single amenity.
     * @request GET:/api/v1/amenities/{id}
     * @secure
     * @response `200` `AmenityDto` Amenity retrieved successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `AmenityDto`
     */
    getAmenity: (id: string, params: RequestParams = {}) =>
      this.http.request<AmenityDto, void | AmenityDto>({
        path: `/api/v1/amenities/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to update a amenity details.
     *
     * @tags Amenity
     * @name UpdateAmenity
     * @summary Update a amenity.
     * @request PUT:/api/v1/amenities/{id}
     * @secure
     * @response `202` `AmenityDto` Amenity updated successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `AmenityDto`
     */
    updateAmenity: (id: string, data: UpdateAmenityDto, params: RequestParams = {}) =>
      this.http.request<AmenityDto, void | AmenityDto>({
        path: `/api/v1/amenities/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to delete a amenity.
     *
     * @tags Amenity
     * @name DeleteAmenity
     * @summary Delete a amenity.
     * @request DELETE:/api/v1/amenities/{id}
     * @secure
     * @response `202` `void` Amenity deleted successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `void`
     */
    deleteAmenity: (id: string, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/v1/amenities/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
 * @description This operation allows to retrieve all members.
 *
 * @tags Member
 * @name GetMembers
 * @summary Retrieve a list of members based on provided filters.
 * @request GET:/api/v1/members
 * @secure
 * @response `200` `(PageDto & {
    results?: Array<MemberDto>,

})` List of members retrieved successfully
 * @response `400` `void` Bad Request.
 * @response `401` `void` Unauthorized
 * @response `500` `void` Something went wrong.
 * @response `default` `void`
 */
    getMembers: (query: GetMembersParams, params: RequestParams = {}) =>
      this.http.request<
        PageDto & {
          results?: Array<MemberDto>;
        },
        void
      >({
        path: `/api/v1/members`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to create a new member.
     *
     * @tags Member
     * @name AddMember
     * @summary Create a new member.
     * @request POST:/api/v1/members
     * @secure
     * @response `201` `MemberDto` Member added successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `MemberDto`
     */
    addMember: (data: CreateMemberDto, params: RequestParams = {}) =>
      this.http.request<MemberDto, void | MemberDto>({
        path: `/api/v1/members`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to retrieve a single member.
     *
     * @tags Member
     * @name GetMember
     * @summary Retrieve a single member.
     * @request GET:/api/v1/members/{id}
     * @secure
     * @response `200` `MemberDto` Member retrieved successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `MemberDto`
     */
    getMember: (id: string, params: RequestParams = {}) =>
      this.http.request<MemberDto, void | MemberDto>({
        path: `/api/v1/members/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to update a member details.
     *
     * @tags Member
     * @name UpdateMember
     * @summary Update a member.
     * @request PUT:/api/v1/members/{id}
     * @secure
     * @response `202` `MemberDto` Member updated successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `MemberDto`
     */
    updateMember: (id: string, data: UpdateMemberDto, params: RequestParams = {}) =>
      this.http.request<MemberDto, void | MemberDto>({
        path: `/api/v1/members/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation allows to delete a member.
     *
     * @tags Member
     * @name DeleteMember
     * @summary Delete a member.
     * @request DELETE:/api/v1/members/{id}
     * @secure
     * @response `202` `void` Member deleted successfully
     * @response `400` `void` Bad Request.
     * @response `401` `void` Unauthorized
     * @response `500` `void` Something went wrong.
     * @response `default` `void`
     */
    deleteMember: (id: string, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/v1/members/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  health = {
    /**
 * No description
 *
 * @tags HealthChecker
 * @name HealthCheckerControllerCheck
 * @request GET:/health
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 * @response `default` `object`
 */
    healthCheckerControllerCheck: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        | {
          /** @example "error" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"redis":{"status":"down","message":"Could not connect"}} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        }
        | object
      >({
        path: `/health`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
