import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import { toast } from 'sonner'
import DataCard from '@/components/data-card/data-card'
import { CreateBrandManagerModal } from '@/components/Form/super-admin-form/create-brand-manager-form'
import { useLocation, useParams } from "react-router-dom";

import {
  useGetAllBrandManagersQuery,
  useDeleteBrandManagerMutation,
} from "@/redux/apis/super-admin/brandApi"
import { brandManagerColumns } from '@/utils/columns/super-admin.jsx';
import { SkeletonLoader } from '@/components/laoder';
import { ConfirmModal } from '@/components/common/ConfirmModal'


export const Brand = () => {
  const { id } = useParams()
  const location = useLocation();
  const brandName = location.state?.name;
  const [open, setOpen] = useState(false)
  const [managerToDelete, setManagerToDelete] = useState(null);
  const {
    data,
    isLoading,
    isError,
  } = useGetAllBrandManagersQuery({ tenantId: id })

  const [deleteBrandManager, { isLoading: isDeleting }] =
    useDeleteBrandManagerMutation()

  const handleDeleteBrandManager = (manager) => {
    setManagerToDelete(manager);
  };

  const confirmDelete = async () => {
    try {
      if (!managerToDelete) return;
      await deleteBrandManager({ managerId: managerToDelete._id }).unwrap();
      toast.success("Brand Manager deleted successfully");
    } catch (error) {
      console.error("Failed to delete brand manager", error);
      toast.error(error?.data?.message || "Failed to delete brand manager");
    } finally {
      setManagerToDelete(null);
    }
  };


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
      <ConfirmModal
        isOpen={!!managerToDelete}
        onClose={() => setManagerToDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete Brand Manager "${managerToDelete?.userName}"?`}
        description="This action cannot be undone. This manager will be permanently removed."
        confirmText="Delete"
        isDanger={true}
        loading={isDeleting}
      />
    </div>
  )
}






