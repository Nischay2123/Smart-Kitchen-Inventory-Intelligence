import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import DataCard from '@/components/data-card/data-card'
import { CreateBrandManagerModal } from '@/components/Form/super-admin-form/create-brand-manager-form'
import { useLocation,useParams } from "react-router-dom";

import {
  useGetAllBrandManagersQuery,
  useDeleteBrandManagerMutation,
} from "@/redux/apis/super-admin/brandApi" 

// ------------------ TABLE COLUMNS ------------------
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

// ------------------ PAGE ------------------
export const Brand = () => {
  const {id} = useParams()
  const location = useLocation();
  const brandName = location.state?.name;
  const [open, setOpen] = useState(false)
  // ✅ GET ALL BRAND MANAGERS
  const {
    data,
    isLoading,
    isError,
  } = useGetAllBrandManagersQuery({tenantId:id})
  
  // ✅ DELETE BRAND MANAGER
  const [deleteBrandManager, { isLoading: isDeleting }] =
    useDeleteBrandManagerMutation()

  const handleDeleteBrandManager = async (manager) => {
  const result = window.confirm(
    `Are you sure you want to delete the Brand Manager "${manager.userName}"?`
  )

  if (!result) return

  try {
    await deleteBrandManager({ managerId: manager._id }).unwrap()
  } catch (error) {
    console.error("Failed to delete brand manager", error)
  }
}


  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <SiteHeader
        headerTitle={`Brand: ${brandName}`}
        description="Manage brand managers"
        actionTooltip="Create Brand Manager"
        onActionClick={() => setOpen(true)}
      />

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        <DataCard
          title="Brand Managers"
          searchable
          loading={isLoading || isDeleting}
          columns={brandManagerColumns(handleDeleteBrandManager)}
          data={data?.data ?? []}
        />
      </div>

      <CreateBrandManagerModal
        open={open}
        onOpenChange={setOpen}
        id={id}
      />
    </div>
  )
}






