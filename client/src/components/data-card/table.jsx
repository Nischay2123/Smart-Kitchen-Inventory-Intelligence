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
  ArrowUpDown,
  Search,
} from "lucide-react"


export function DataTable({
  data,
  columns,
  pageSize = 10,
  searchable = false,
  pagination= false,
  onRowClick,
  rowSelection,
  onRowSelectionChange,
  selectedRowId,
  getRowId = (row) => row._id ,
}) {
  const [sorting, setSorting] = React.useState([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: !!onRowSelectionChange,
    onRowSelectionChange,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  return (
    <div className="flex flex-col space-y-4 h-full">

      {/* Search */}
      {searchable && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>

          <Input
            placeholder="Search..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border flex-1 overflow-auto bg-white">
        <Table>
          <TableHeader className={"bg-gray-300"}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <Button
                        variant="ghost"
                        onClick={header.column.getToggleSortingHandler()}
                        className="h-8 px-2 flex items-center gap-1"
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
                    cursor-pointer
                    ${row.original?._id === selectedRowId ? "bg-muted" : ""}
                  `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      { pagination &&
        <div className="flex items-center justify-between text-sm">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
    </div>
  )
}
