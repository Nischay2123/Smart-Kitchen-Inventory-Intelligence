"use client"

import * as React from "react"
import Lottie from "lottie-react"
import noDataAnimation from "@/assets/no-data.json"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

function getPageNumbers(currentPage, totalPages, siblingCount = 1) {
  const pages = []
  const leftSibling = Math.max(currentPage - siblingCount, 2)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1)

  pages.push(1)

  if (leftSibling > 2) {
    pages.push("...")
  } else if (totalPages > 1) {
    for (let i = 2; i < leftSibling; i++) pages.push(i)
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i > 1 && i < totalPages) pages.push(i)
  }

  if (rightSibling < totalPages - 1) {
    pages.push("...")
  } else if (totalPages > 1) {
    for (let i = rightSibling + 1; i < totalPages; i++) pages.push(i)
  }

  if (totalPages > 1) pages.push(totalPages)

  return pages
}


export function DataTable({
  data,
  columns,
  pageSize = 10,
  searchable = false,
  pagination = true,
  onRowClick = () => { },
  rowSelection,
  onRowSelectionChange,
  selectedRowId,
  getRowId = (row) => row._id,
  manualPagination = false,
  pageCount,
  onPaginationChange,
  paginationState: manualPaginationState,
  onGlobalFilterChange,
}) {
  const [sorting, setSorting] = React.useState([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const [paginationStateInternal, setPaginationStateInternal] =
    React.useState({
      pageIndex: 0,
      pageSize,
    });

  const table = useReactTable({
    data,
    columns,
    pageCount: manualPagination ? pageCount : undefined,

    state: {
      sorting,
      globalFilter,
      rowSelection,
      pagination: manualPagination
        ? manualPaginationState
        : paginationStateInternal,
    },

    manualPagination,

    onPaginationChange: manualPagination
      ? onPaginationChange
      : setPaginationStateInternal,

    enableRowSelection: !!onRowSelectionChange,
    onRowSelectionChange,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,

    getRowId,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    ...(manualPagination
      ? {}
      : { getPaginationRowModel: getPaginationRowModel() }),
  });

  return (
    <div className="flex flex-col space-y-3 h-full min-h-0" >

      {/* Search */}
      {searchable && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={globalFilter ?? ""}
            onChange={(e) => {
              const value = e.target.value
              setGlobalFilter(value)
              onGlobalFilterChange?.(value)
            }}

            className="max-w-sm h-9 bg-white border-muted focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-muted bg-white overflow-hidden shadow-sm">
        <div className="overflow-auto min-h-100">

          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-[hsl(var(--table-border))] bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
                              : "flex items-center"
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-muted-foreground/50">
                              {{
                                asc: "↑",
                                desc: "↓",
                              }[header.column.getIsSorted()] ?? "↕"}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() =>
                      onRowClick
                        ? onRowClick(row.original)
                        : row.toggleSelected()
                    }
                    className={`
                  cursor-pointer transition-colors
                  hover:bg-muted/50
                  ${selectedRowId && row.original?._id === selectedRowId ? "bg-primary/5" : ""}
                `}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-2 text-sm text-foreground align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center py-6">
                      <Lottie
                        animationData={noDataAnimation}
                        loop={true}
                        className="w-40 h-40"
                      />
                      <p className="text-sm font-medium text-muted-foreground mt-2">
                        No results found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

        </div>
      </div>

      {
        pagination && (
          <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>

            <div className="flex items-center gap-1">
              {/* First Page */}
              <Button
                variant="ghost"
                size="icon"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.setPageIndex(0)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              {/* Previous */}
              <Button
                variant="ghost"
                size="icon"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers */}
              {getPageNumbers(
                table.getState().pagination.pageIndex + 1,
                table.getPageCount()
              ).map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-muted-foreground select-none"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={
                      table.getState().pagination.pageIndex + 1 === page
                        ? "default"
                        : "ghost"
                    }
                    size="icon"
                    className={`h-8 w-8 text-xs ${table.getState().pagination.pageIndex + 1 === page
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : ""
                      }`}
                    onClick={() => table.setPageIndex(page - 1)}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="ghost"
                size="icon"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                disabled={!table.getCanNextPage()}
                onClick={() =>
                  table.setPageIndex(table.getPageCount() - 1)
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      }

    </div>

  )
}
