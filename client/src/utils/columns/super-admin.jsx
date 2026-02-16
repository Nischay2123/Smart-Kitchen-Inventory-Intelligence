import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export const brandManagerColumns = (onDelete) => [
  {
    accessorKey: "userName",
    header: "Brand Manager Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.userName}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.email}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(row.original)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    ),
  },
]

const getStatusColor = (status) => {
  switch (status) {
    case "success":
      return "bg-green-500 hover:bg-green-600";
    case "failed":
      return "bg-red-500 hover:bg-red-600";
    case "started":
    case "running":
      return "bg-blue-500 hover:bg-blue-600";
    default:
      return "bg-gray-500";
  }
};

export const schedulerLogColumns = [
  {
    accessorKey: "eventType",
    header: "Event Type",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.eventType}</span>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={`${getStatusColor(row.original.status)}`}>
        {row.original.status}
      </Badge>
    )
  },
  {
    accessorKey: "startTime",
    header: "Start Time",
    cell: ({ row }) => (
      <span>{format(new Date(row.original.startTime), "PPpp")}</span>
    )
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <span>{row.original.duration ? `${row.original.duration}ms` : "-"}</span>
    )
  },
  {
    accessorKey: "details",
    header: "Error / Details",
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div className="max-w-md truncate">
          {log.error ? (
            <span className="text-red-500" title={log.error}>
              {log.error}
            </span>
          ) : log.details ? (
            <span title={JSON.stringify(log.details)}>
              {JSON.stringify(log.details)}
            </span>
          ) : (
            "-"
          )}
        </div>
      )
    }
  }
]