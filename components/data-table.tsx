"use client"
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
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
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
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react"
import { DateRangeFilter } from "@/components/ui/date-range-filter"

interface StatusTabOption {
    value: string
    label: string
    /** Rows in this status, when the caller can count them. */
    count?: number
}

export interface TableFilterOption {
    value: string
    label: string
    count?: number
}

/** A dropdown that narrows the list through its own URL param. */
export interface TableSelectFilter {
    /** Defaults to "select" so every existing call site is unchanged. */
    kind?: "select"
    /** The query-string key it owns, e.g. "interest". */
    key: string
    label: string
    value?: string
    options: TableFilterOption[]
}

/**
 * A from/to pair owning two URL params. The control writes ISO instants,
 * not date strings: the API takes instants and refuses to guess what a
 * "day" means, because the answer depends on where the reader is.
 */
export interface TableDateRangeFilter {
    kind: "dateRange"
    label: string
    fromKey: string
    toKey: string
    fromValue?: string
    toValue?: string
    /** Named shortcuts, e.g. "Last 7 days". Values are computed on click. */
    presets?: { label: string; days: number }[]
}

export type TableFilter = TableSelectFilter | TableDateRangeFilter

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    totalCount?: number
    showTypeFilter?: boolean
    showStatusTabs?: boolean
    statusTabOptions?: StatusTabOption[]
    /**
     * The search box filters a client-side column named "name" by default,
     * which does nothing for a table that has no such column. Set this when the
     * endpoint searches instead: the term goes to the URL as `name` and the
     * server decides what matches.
     */
    serverSearch?: boolean
    searchPlaceholder?: string
    /** Rows across every status, for the "All" tab. */
    statusAllCount?: number
    /** Extra dropdown filters, each owning one query param. */
    filters?: TableFilter[]
    /**
     * Zone in which a picked day is converted to instants. Pass the
     * location's when one is in scope; the reader's own is the right
     * answer when nothing is (an opportunity has no location).
     */
    timeZone?: string
}

/** The count rides in the tab as a quiet pill, the way a filter chip reads. */
function TabCount({ value, active }: Readonly<{ value?: number; active: boolean }>) {
    if (typeof value !== "number") return null
    return (
        <span
            className={cn(
                "ml-2 rounded px-1.5 py-0.5 text-xs tabular-nums",
                active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
        >
            {value}
        </span>
    )
}

/** Matches pageQuery() in lib/search-params, which assumes it when absent. */
const DEFAULT_PAGE_SIZE = 10

const DEFAULT_STATUS_TAB_OPTIONS: StatusTabOption[] = [
    { value: "AVAILABLE", label: "Available" },
    { value: "OCCUPIED", label: "Occupied" },
    { value: "UNAVAILABLE", label: "Unavailable" },
    { value: "AVAILABLE_SOON", label: "Available Soon" },
    { value: "RESERVED", label: "Reserved" },
]

export function DataTable<TData, TValue>({
    columns,
    data,
    totalCount,
    showTypeFilter = false,
    showStatusTabs = false,
    statusTabOptions = DEFAULT_STATUS_TAB_OPTIONS,
    serverSearch = false,
    searchPlaceholder = "Filter names...",
    statusAllCount,
    filters = [],
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: DataTableProps<TData, TValue>) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    // Status, page and search all refetch on the server; without this the table
    // sits on stale rows with nothing to show for the click.
    const [isPending, startTransition] = React.useTransition()

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: (Number(searchParams.get("page")) || 1) - 1,
        pageSize: Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
    })

    // Initialize filters from URL params. With serverSearch the term belongs to
    // the endpoint, and there is no "name" column to hang a filter on — passing
    // one makes the table complain about a column that does not exist.
    const initialFilters: ColumnFiltersState = React.useMemo(() => {
        const nameFilter = serverSearch ? "" : searchParams.get("name") || ""
        const typeFilter = searchParams.get("type") || ""
        const filters: ColumnFiltersState = []
        if (nameFilter) {
            filters.push({ id: "name", value: nameFilter })
        }
        if (typeFilter && showTypeFilter) {
            filters.push({ id: "type", value: typeFilter })
        }
        return filters
    }, [searchParams, showTypeFilter, serverSearch])

    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters)
    const [search, setSearch] = React.useState(searchParams.get("name") ?? "")
    const isInitialMount = React.useRef(true)

    // One request per pause in typing, not per keystroke.
    React.useEffect(() => {
        if (!serverSearch) return
        const current = searchParams.get("name") ?? ""
        if (search === current) return

        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (search) {
                params.set("name", search)
            } else {
                params.delete("name")
            }
            params.delete("page") // absent means the first page
            startTransition(() => router.replace(`?${params.toString()}`))
        }, 300)

        return () => clearTimeout(timer)
    }, [search, serverSearch, searchParams, router])

    // Update filters when URL params change (e.g., browser back/forward)
    React.useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }
        const nameFilter = serverSearch ? "" : searchParams.get("name") || ""
        const typeFilter = searchParams.get("type") || ""
        const filters: ColumnFiltersState = []
        if (nameFilter) {
            filters.push({ id: "name", value: nameFilter })
        }
        if (typeFilter && showTypeFilter) {
            filters.push({ id: "type", value: typeFilter })
        }
        setColumnFilters(filters)
    }, [searchParams, showTypeFilter, serverSearch])

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

    const getTableColumn = React.useCallback((id: string) => {
        return table.getAllFlatColumns().find((column) => column.id === id)
    }, [table])

    // Sync pagination and filters to URL
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())

        // Defaults stay out of the URL. Writing them meant every arrival from a
        // plain link navigated once more just to say page=1, and each of those
        // navigations re-renders the page and refetches its data.
        if (pagination.pageIndex > 0) {
            params.set("page", String(pagination.pageIndex + 1))
        } else {
            params.delete("page")
        }
        if (pagination.pageSize !== DEFAULT_PAGE_SIZE) {
            params.set("pageSize", String(pagination.pageSize))
        } else {
            params.delete("pageSize")
        }

        // Sync name filter — owned by the debounced effect when the server searches
        if (!serverSearch) {
            const nameFilter = getTableColumn("name")?.getFilterValue() as string
            if (nameFilter) {
                params.set("name", nameFilter)
            } else {
                params.delete("name")
            }
        }

        // Sync type filter if enabled
        if (showTypeFilter) {
            const typeFilter = getTableColumn("type")?.getFilterValue() as string
            if (typeFilter) {
                params.set("type", typeFilter)
            } else {
                params.delete("type")
            }
        }

        // Nothing to say? Then say nothing: an identical replace still costs a
        // render on the server.
        const next = params.toString()
        if (next === searchParams.toString()) return
        startTransition(() => router.replace(next ? `?${next}` : pathname))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, columnFilters, showTypeFilter, serverSearch])

    const total = totalCount ?? data.length
    const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize))
    const firstRow = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
    const lastRow = total === 0 ? 0 : Math.min(firstRow + (data.length || 0) - 1, total)

    const searchValue = serverSearch
        ? search
        : ((getTableColumn("name")?.getFilterValue() as string) ?? "")
    const typeValue = (getTableColumn("type")?.getFilterValue() as string) ?? ""
    const activeStatus = searchParams.get("status")
    const activeFilters = filters.filter((filter) =>
        filter.kind === "dateRange"
            ? Boolean(filter.fromValue || filter.toValue)
            : Boolean(filter.value)
    )
    const activeCount =
        activeFilters.length +
        (searchValue ? 1 : 0) +
        (typeValue ? 1 : 0) +
        (activeStatus ? 1 : 0)
    const hasFilters = activeCount > 0

    const applyFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        params.delete("page") // a narrower list starts at the first page
        startTransition(() => router.replace(`?${params.toString()}`))
    }

    const applyRange = (
        filter: TableDateRangeFilter,
        value: { fromIso?: string; toIso?: string }
    ) => {
        const params = new URLSearchParams(searchParams.toString())
        for (const [key, next] of [
            [filter.fromKey, value.fromIso],
            [filter.toKey, value.toIso],
        ] as const) {
            if (next) {
                params.set(key, next)
            } else {
                params.delete(key)
            }
        }
        params.delete("page") // a narrower list starts at the first page
        startTransition(() => router.replace(`?${params.toString()}`))
    }

    const changeSearch = (value: string) => {
        if (serverSearch) {
            setSearch(value)
            // A term typed on page 3 would otherwise land on an empty page of a
            // shorter result set.
            setPagination((current) =>
                current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }
            )
            return
        }
        getTableColumn("name")?.setFilterValue(value)
    }

    const clearFilters = () => {
        setSearch("")
        setColumnFilters([])
        setPagination((current) => ({ pageIndex: 0, pageSize: current.pageSize }))
        // A bare URL, rather than deleting keys one by one: the effects that
        // write the query back cannot then restore a filter mid-navigation.
        startTransition(() => router.replace(pathname))
    }

    return (
        <div className="w-full">
            {showStatusTabs && (
                /* Inset to match the table below, so the rule starts and ends
                   where every other block on the page does. */
                <div className="mx-4 border-b">
                <Tabs
                    value={activeStatus || "all"}
                    onValueChange={(value) => {
                        const params = new URLSearchParams(searchParams.toString())
                        if (value && value !== "all") {
                            params.set("status", value)
                        } else {
                            params.delete("status")
                        }
                        params.delete("page") // back to the first page
                        startTransition(() => router.push(`?${params.toString()}`))
                    }}
                    className="w-full"
                >
                    <TabsList
                        variant="line"
                        className="max-w-full overflow-x-auto border-b-0"
                    >
                        <TabsTrigger value="all">
                            All
                            <TabCount value={statusAllCount} active={!activeStatus} />
                        </TabsTrigger>
                        {statusTabOptions.map((option) => (
                            <TabsTrigger key={option.value} value={option.value}>
                                {option.label}
                                <TabCount
                                    value={option.count}
                                    active={activeStatus === option.value}
                                />
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(event) => changeSearch(event.target.value)}
                        className="pl-9 pr-9"
                    />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={() => changeSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span className="sr-only">Clear search</span>
                        </button>
                    )}
                </div>

                {showTypeFilter && (
                    <Input
                        placeholder="Filter type key..."
                        value={typeValue}
                        onChange={(event) =>
                            getTableColumn("type")?.setFilterValue(event.target.value)
                        }
                        className="w-full sm:w-56"
                    />
                )}

                {filters.length > 0 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="ml-auto h-9">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Filters
                                {activeFilters.length > 0 && (
                                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs tabular-nums text-primary">
                                        {activeFilters.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 space-y-3">
                            {filters.map((filter) =>
                                filter.kind === "dateRange" ? (
                                    <DateRangeFilter
                                        key={`${filter.fromKey}-${filter.toKey}`}
                                        label={filter.label}
                                        fromValue={filter.fromValue}
                                        toValue={filter.toValue}
                                        timeZone={timeZone}
                                        presets={filter.presets}
                                        onChange={(value) => applyRange(filter, value)}
                                    />
                                ) : (
                                    <div key={filter.key} className="grid gap-1.5">
                                        <span className="text-xs text-muted-foreground">
                                            {filter.label}
                                        </span>
                                        <select
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs dark:bg-input/30"
                                            value={filter.value ?? ""}
                                            onChange={(event) =>
                                                applyFilter(filter.key, event.target.value)
                                            }
                                        >
                                            <option value="">Any</option>
                                            {filter.options.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                    {typeof option.count === "number"
                                                        ? ` (${option.count})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )
                            )}
                            {hasFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="w-full text-muted-foreground"
                                >
                                    Clear all filters
                                </Button>
                            )}
                        </PopoverContent>
                    </Popover>
                )}

            </div>

            <div className="relative overflow-hidden rounded-md border mx-4">
                {isPending && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                )}
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
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
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="text-sm text-muted-foreground">
                                            {hasFilters
                                                ? "No rows match these filters."
                                                : "Nothing here yet."}
                                        </div>
                                        {hasFilters && (
                                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                                Clear filters
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Range, page and page size answer the same question, so they
                    sit together rather than at opposite corners of the screen. */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
                    <div className="whitespace-nowrap">
                        Showing {firstRow}–{lastRow} of {total}
                    </div>

                    {/* The nav is w-full by default, which pushed the count and
                        the page size onto lines of their own. */}
                    <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        table.setPageIndex(Math.max(0, pagination.pageIndex - 1))
                                    }
                                    disabled={pagination.pageIndex === 0}
                                >
                                    Previous
                                </PaginationPrevious>
                            </PaginationItem>
                            {Array.from({ length: pageCount }).map((_, index) => {
                                const current = pagination.pageIndex
                                const show =
                                    index === 0 ||
                                    index === pageCount - 1 ||
                                    Math.abs(index - current) <= 1
                                if (!show) {
                                    const leadingGap = index === 1 && current > 2
                                    const trailingGap =
                                        index === pageCount - 2 && current < pageCount - 3
                                    return leadingGap || trailingGap ? (
                                        <PaginationItem key={index}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    ) : null
                                }
                                return (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            isActive={current === index}
                                            onClick={() => table.setPageIndex(index)}
                                        >
                                            {index + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                )
                            })}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        table.setPageIndex(
                                            Math.min(pageCount - 1, pagination.pageIndex + 1)
                                        )
                                    }
                                    disabled={pagination.pageIndex >= pageCount - 1}
                                >
                                    Next
                                </PaginationNext>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>

                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Rows per page</span>
                        <select
                            aria-label="Rows per page"
                            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs dark:bg-input/30"
                            value={pagination.pageSize}
                            onChange={(event) =>
                                // Page 3 of ten-row pages does not exist once the
                                // rows per page grows, so start over at the top.
                                setPagination({
                                    pageIndex: 0,
                                    pageSize: Number(event.target.value),
                                })
                            }
                        >
                            {[10, 25, 50, 100].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    )
}
