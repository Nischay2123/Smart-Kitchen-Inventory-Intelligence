"use client"

import * as React from "react"
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
  ArrowUpDown,
} from "lucide-react"




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
    <div className="flex flex-col space-y-3 h-full">

      {/* Search */}
      {false && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm h-9 bg-white border-muted focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-muted bg-white flex-1 overflow-hidden shadow-sm">
        <div className="h-full overflow-auto">

          <Table>
            <TableHeader className="bg-muted/40 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-11 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      {header.isPlaceholder ? null : (
                        <Button
                          variant="ghost"
                          onClick={header.column.getToggleSortingHandler()}
                          className="h-8 px-1 flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </Button>
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
                  ${row.original?._id === selectedRowId ? "bg-primary/5" : ""}
                `}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-2 text-sm text-foreground"
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
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

        </div>
      </div>

      {/* Pagination */}
      {/* {pagination && (
        <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )} */}


      {pagination && (
  <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
    <span>
      Page {table.getState().pagination.pageIndex + 1} of{" "}
      {table.getPageCount()}
    </span>

    <div className="flex gap-1">
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

      {/* Next */}
      <Button
        variant="ghost"
        size="icon"
        disabled={!table.getCanNextPage()}
        onClick={() => table.nextPage()}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last Page */}
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
)}

    </div>

  )
}
