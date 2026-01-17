import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import {
  useGetAllUnitsQuery,
} from "@/redux/apis/brand-admin/baseUnitApi.js"
import { CreateUnitModal } from '@/components/Form/brand-admin-form/create-unit-form'


 const unitColumn = () => [
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "baseUnit",
    header: "Base Unit",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.baseUnit}
      </span>
    ),
  },
  {
    accessorKey: "conversionRate",
    header: "Converstion Rate",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.conversionRate}
      </span>
    ),
  },
]

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
            <div>Loading...</div> :
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

