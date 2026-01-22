import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import {
  useGetAllUnitsQuery,
} from "@/redux/apis/brand-admin/baseUnitApi.js"
import { CreateUnitModal } from '@/components/Form/brand-admin-form/create-unit-form'
import { unitColumn } from '@/utils/columns/brand-admin'
import { SkeletonLoader } from '@/components/laoder'


export const Unit = () => {
  const [open, setOpen] = useState(false)

  const {
    data,
    isLoading,
    isError,
  } = useGetAllUnitsQuery()


  return (
    <div className='w-full bg-gray-50 min-h-screen'>
      <SiteHeader
        headerTitle={`Recipes`}
        description="Create and Edit Recipes Items For all Outlets"
        actionTooltip='Create New Unit'
        onActionClick={() => setOpen(true)}
      />
      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {
          isLoading ?
            <SkeletonLoader/>:
            <DataCard
              title={"Create and update Recipies for the items"}
              searchable
              loading={isLoading }
              columns={unitColumn()}
              data={data?.data ?? []}
              titleWhenEmpty={"No units found"}
              descriptionWhenEmpty={"We couldn’t find any units here. Try adding a new one or adjust your filters."}
            />
        }

      </div>
      
      <CreateUnitModal
      onOpenChange={setOpen}
      open={open}/>
    </div>
  )
}

