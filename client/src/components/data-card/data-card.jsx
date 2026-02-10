import { Empty } from "../empty"
import { DataTable } from "./table"

const DataCard = ({
  title,
  description,
  columns,
  data,
  onRowClick,
  selectedRowId,
  rowSelection,
  onRowSelectionChange,
  searchable,
  pagination,
  titleWhenEmpty,
  descriptionWhenEmpty,
  manualPagination,
  pageCount,
  onPaginationChange,
  paginationState,
  onGlobalFilterChange,
}) => {
  return (
    <section className="flex-1 min-w-0 flex flex-col rounded-xl bg-white border border-border/40 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 bg-slate-50/60">
        <h2 className="text-sm font-semibold text-foreground leading-tight">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 p-4 bg-white">
        
          <DataTable
            searchable={searchable}
            pagination={pagination}
            columns={columns}
            data={data}
            onRowClick={onRowClick}
            selectedRowId={selectedRowId}
            rowSelection={rowSelection}
            onRowSelectionChange={onRowSelectionChange}
            manualPagination={manualPagination}
            pageCount={pageCount}
            onPaginationChange={onPaginationChange}
            paginationState={paginationState}
            onGlobalFilterChange={onGlobalFilterChange}
          />
      </div>

    </section>
  )
}

export default DataCard
