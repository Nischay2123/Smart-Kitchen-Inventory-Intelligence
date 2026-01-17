import SiteHeader from '@/components/site-header'
import React, {  useState } from 'react'
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import DataCard from '@/components/data-card/data-card'

import {
  useGetAllOutletManagersQuery,
  useDeleteOutletManagerMutation,
} from "@/redux/apis/brand-admin/outletApi"
import { useLocation, useParams } from 'react-router-dom'
import { CreateOutletManagerModal } from '@/components/Form/brand-admin-form/create-outlet-manager-form'

export const outletManagerColumns = (onDelete) => [
  {
    accessorKey: "userName",
    header: "Outlet Manager Name",
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
          e.stopPropagation() // ⛔ prevent row click
          onDelete(row.original)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    ),
  },
]


export const Outlet = () => {
  const {id} = useParams()
  const location = useLocation();
  const outletName = location.state?.name;
  const [open , setOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
  } = useGetAllOutletManagersQuery({outletId:id})
  
  const [deleteOutletManager, { isLoading: isDeleting }] =
      useDeleteOutletManagerMutation()

      const handleDeleteBrandManager = async(manager) => {
      const result = window.confirm(
      `Are you sure you want to delete the Outlet Manager "${manager.userName}"?`
    )

    if (!result) return

    try {
      await deleteOutletManager({ managerId: manager._id }).unwrap()
    } catch (error) {
      console.error("Failed to delete outlet manager", error)
    }
    }

  return (
    <div className='w-full bg-gray-50 min-h-screen'>
        <SiteHeader
        headerTitle={`Outlet: ${outletName}`}
        description="Manage outlet managers"
        actionTooltip="Create outlet Manager"
        onActionClick={()=>setOpen(true)}
        />
        <div className="flex-1 min-h-0 p-4 lg:p-6">
          {
            isLoading?
            <div>Loading...</div>:
            <DataCard
              title={"Outlet Managers"}
              searchable
              loading={isLoading || isDeleting}
              columns={outletManagerColumns(handleDeleteBrandManager)}
              data={data?.data ?? []}
              titleWhenEmpty={"No outlets found"}
              descriptionWhenEmpty={"We couldn’t find any outlets here. Try adding a new one or adjust your filters."}
            />
          }
            
        </div>

        <CreateOutletManagerModal
          open={open}
          onOpenChange={setOpen}
          id={id}
        />
    </div>
  )
}
