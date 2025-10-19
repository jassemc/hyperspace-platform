"use client"

import { DataTable } from "@/app/dashboard/resources/data-table"
import type { ResourceDto } from "@/lib/service/HsService"
import { columns } from "./columns"

export function ResourceTable({ data }: Readonly<{ data: ResourceDto[] }>) {
    return <DataTable columns={columns} data={data} />
}


