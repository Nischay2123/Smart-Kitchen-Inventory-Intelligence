import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
    useGetRecipeQuery,
} from "@/redux/apis/brand-admin/recipeApi"
import { CreateItemModal } from '@/components/Form/brand-admin-form/create-item-form'
import { Empty } from '@/components/empty'


export const recipeColumn = () => [
    {
        accessorKey: "ingredientName",
        header: "Ingredient Name",
        cell: ({ row }) => (
            <span className="font-medium">
                {row.original.ingredientName}
            </span>
        ),
    },
    {
        accessorKey: "quantity",
        header: "Ouantity",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.quantity}
            </span>
        ),
    },
    {
        accessorKey: "unitName",
        header: "Base Unit",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.unitName}
            </span>
        ),
    },
]

const MenuItem = () => {
    const [open, setOpen] = useState(false)
    const Navigate = useNavigate()
    const location = useLocation()
    const {itemId} = useParams()
    const itemName = location?.state?.itemName

      const {
        data,
        isLoading,
        isError,
      } = useGetRecipeQuery({itemId})

    return (
        <div className='w-full bg-gray-50 min-h-screen'>
            <SiteHeader
                headerTitle={`${itemName}`}
                description="View Recipe of Item"
                isTooltip={false}
            />
            <div className="flex-1 min-h-0 p-4 lg:p-6">
                {
                    isLoading ?
                        <div>Loading...</div> :
                        data?.data?.length  == 0 ?
                            <div className='flex flex-col justify-center items-center'>
                                <Empty />
                                <Button 
                                variant='ghost'
                                className={"bg-gray-300 hover:bg-gray-500"}
                                onClick = {()=>Navigate("/recipes")}
                                >
                                    Create Recipe
                                </Button>
                            </div>
                            :
                            <DataCard
                                title={"INGREDIENTS ITEMS"}
                                searchable={false}
                                loading={isLoading }
                                columns={recipeColumn()}
                                data={data?.data?.recipeItems ?? []}

                            />
                }

            </div>

            <CreateItemModal
                open={open}
                onOpenChange={setOpen}
                isUpdate={true}
            />
        </div>
    )
}

export default MenuItem