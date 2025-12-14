"use client"
import { cn } from "@/lib/utils"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    totalCount?: number
    showTypeFilter?: boolean
    showStatusTabs?: boolean
}

export function DataTable<TData, TValue>({
    columns,
    data,
    totalCount,
    showTypeFilter = false,
    showStatusTabs = false,
}: DataTableProps<TData, TValue>) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: (Number(searchParams.get("page")) || 1) - 1,
        pageSize: Number(searchParams.get("pageSize")) || 10,
    })

    // Initialize filters from URL params
    const initialFilters: ColumnFiltersState = React.useMemo(() => {
        const nameFilter = searchParams.get("name") || ""
        const typeFilter = searchParams.get("type") || ""
        const filters: ColumnFiltersState = []
        if (nameFilter) {
            filters.push({ id: "name", value: nameFilter })
        }
        if (typeFilter && showTypeFilter) {
            filters.push({ id: "type", value: typeFilter })
        }
        return filters
    }, [searchParams, showTypeFilter])

    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters)
    const isInitialMount = React.useRef(true)

    // Update filters when URL params change (e.g., browser back/forward)
    React.useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }
        const nameFilter = searchParams.get("name") || ""
        const typeFilter = searchParams.get("type") || ""
        const filters: ColumnFiltersState = []
        if (nameFilter) {
            filters.push({ id: "name", value: nameFilter })
        }
        if (typeFilter && showTypeFilter) {
            filters.push({ id: "type", value: typeFilter })
        }
        setColumnFilters(filters)
    }, [searchParams, showTypeFilter])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        // Server-side pagination: do not paginate again client-side
        manualPagination: true,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            pagination,
            columnFilters,
        },
    })

    // Sync pagination and filters to URL
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", String(pagination.pageIndex + 1))
        params.set("pageSize", String(pagination.pageSize))

        // Sync name filter
        const nameFilter = table.getColumn("name")?.getFilterValue() as string
        if (nameFilter) {
            params.set("name", nameFilter)
        } else {
            params.delete("name")
        }

        // Sync type filter if enabled
        if (showTypeFilter) {
            const typeFilter = table.getColumn("type")?.getFilterValue() as string
            if (typeFilter) {
                params.set("type", typeFilter)
            } else {
                params.delete("type")
            }
        }

        router.replace(`?${params.toString()}`)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, columnFilters, showTypeFilter])

    return (
        <div className="w-full">
            <div className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Filter names..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    {showTypeFilter && (
                        <Input
                            placeholder="Filter type key..."
                            value={(table.getColumn("type")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("type")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="flex h-9 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={pagination.pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                    >
                        {[10, 25, 50, 100].map((size) => (
                            <option key={size} value={size}>{size} / page</option>
                        ))}
                    </select>
                </div>
            </div>
            {showStatusTabs && (
                <div className="px-4 pb-4">
                    <Tabs
                        defaultValue={searchParams.get("status") || "all"}
                        onValueChange={(value) => {
                            const params = new URLSearchParams(searchParams.toString())
                            if (value && value !== "all") {
                                params.set("status", value)
                            } else {
                                params.delete("status")
                            }
                            params.set("page", "1") // Reset to page 1 on filter change
                            router.push(`?${params.toString()}`)
                        }}
                        className="w-full"
                    >
                        <TabsList className="w-full justify-start overflow-x-auto">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="AVAILABLE">Available</TabsTrigger>
                            <TabsTrigger value="OCCUPIED">Occupied</TabsTrigger>
                            <TabsTrigger value="UNAVAILABLE">Unavailable</TabsTrigger>
                            <TabsTrigger value="AVAILABLE_SOON">Available Soon</TabsTrigger>
                            <TabsTrigger value="RESERVED">Reserved</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            )}
            <div className="overflow-hidden rounded-md border mx-4">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="text-sm text-muted-foreground">No results</div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex items-center justify-between py-4 px-4 text-sm text-muted-foreground">
                    <div>
                        {(() => {
                            const total = totalCount ?? data.length
                            const start = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
                            const end = total === 0 ? 0 : Math.min(start + (data.length || 0) - 1, total)
                            return `Showing ${start}-${end} of ${total}`
                        })()}
                    </div>
                    <div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => table.setPageIndex(Math.max(0, pagination.pageIndex - 1))}
                                        disabled={pagination.pageIndex === 0}
                                    >
                                        Previous
                                    </PaginationPrevious>
                                </PaginationItem>
                                {
                                    (() => {
                                        const pageCount = Math.max(1, Math.ceil((totalCount ?? data.length) / pagination.pageSize))
                                        return Array.from({ length: pageCount }).map((_, index) => {
                                            const isActive = table.getState().pagination.pageIndex === index
                                            // Windowed pages if many pages
                                            const total = pageCount
                                            const current = table.getState().pagination.pageIndex
                                            const show = index === 0 || index === total - 1 || Math.abs(index - current) <= 1
                                            if (!show) {
                                                if (index === 1 && current > 2) {
                                                    return (
                                                        <PaginationItem key={index}>
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    )
                                                }
                                                if (index === total - 2 && current < total - 3) {
                                                    return (
                                                        <PaginationItem key={index}>
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    )
                                                }
                                                return null
                                            }
                                            return (
                                                <PaginationItem key={index}>
                                                    <PaginationLink
                                                        isActive={isActive}
                                                        onClick={() => table.setPageIndex(index)}
                                                    >
                                                        {index + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                        })
                                    })()
                                }
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => table.setPageIndex(
                                            Math.min(
                                                Math.max(1, Math.ceil((totalCount ?? data.length) / pagination.pageSize)) - 1,
                                                pagination.pageIndex + 1
                                            )
                                        )}
                                        disabled={pagination.pageIndex >= Math.max(1, Math.ceil((totalCount ?? data.length) / pagination.pageSize)) - 1}
                                    >
                                        Next
                                    </PaginationNext>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </div>
    )
}

