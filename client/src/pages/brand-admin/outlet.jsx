import SiteHeader from '@/components/site-header'
import React, {  useState } from 'react'
import DataCard from '@/components/data-card/data-card'

import {
  useGetAllOutletManagersQuery,
  useDeleteOutletManagerMutation,
} from "@/redux/apis/brand-admin/outletApi"
import { useLocation, useParams } from 'react-router-dom'
import { CreateOutletManagerModal } from '@/components/Form/brand-admin-form/create-outlet-manager-form'
import { outletManagerColumns } from '@/utils/columns/brand-admin'
import {  SkeletonLoader } from '@/components/laoder'




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
            <SkeletonLoader/>:
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
