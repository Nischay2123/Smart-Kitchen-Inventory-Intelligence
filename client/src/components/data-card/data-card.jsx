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
  descriptionWhenEmpty
}) => {
  return (
    <div className="flex-1 min-w-0 flex flex-col border rounded-2xl gap-3 p-3 h-auto lg:min-h-150 bg-gray-100">

      <div className="flex flex-col items-start gap-0.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {description}
        </span>
      </div>

      <div className="flex-1 min-h-0">
        {
          data.length==0?
          <Empty
          title={titleWhenEmpty}
          descpription={descriptionWhenEmpty}/>:
          <DataTable
          searchable={searchable}
          pagination={pagination}
          columns={columns}
          data={data}
          onRowClick={onRowClick}
          selectedRowId={selectedRowId}
          rowSelection={rowSelection}
          onRowSelectionChange={onRowSelectionChange}
          />
        }
        
      </div>

    </div>
  )
}

export default DataCard
