import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import DataCard from '@/components/data-card/data-card'
import { CreateBrandManagerModal } from '@/components/Form/super-admin-form/create-brand-manager-form'
import { useLocation, useParams } from "react-router-dom";

import {
  useGetAllBrandManagersQuery,
  useDeleteBrandManagerMutation,
} from "@/redux/apis/super-admin/brandApi"
import { brandManagerColumns } from '@/utils/columns/super-admin.jsx';
import { SkeletonLoader } from '@/components/laoder';


export const Brand = () => {
  const { id } = useParams()
  const location = useLocation();
  const brandName = location.state?.name;
  const [open, setOpen] = useState(false)
  const {
    data,
    isLoading,
    isError,
  } = useGetAllBrandManagersQuery({ tenantId: id })

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
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <DataCard
            title="Brand Managers"
            searchable
            columns={brandManagerColumns(handleDeleteBrandManager)}
            data={data?.data ?? []}
          />
        )}
      </div>

      <CreateBrandManagerModal
        open={open}
        onOpenChange={setOpen}
        id={id}
      />
    </div>
  )
}






