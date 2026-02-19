import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
    useGetRecipeQuery,
} from "@/redux/apis/brand-admin/recipeApi"
import { recipeColumn } from '@/utils/columns/brand-admin'
import { GridLoader } from '@/components/laoder'




const MenuItem = () => {
    const [open, setOpen] = useState(false)
    const Navigate = useNavigate()
    const location = useLocation()
    const { itemId } = useParams()
    const itemName = location?.state?.itemName

    const {
        data,
        isLoading,
        isError,
    } = useGetRecipeQuery({ itemId })

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
                        <GridLoader /> :
                        <DataCard
                            title={"INGREDIENTS ITEMS"}
                            searchable={false}
                            loading={isLoading}
                            columns={recipeColumn()}
                            data={data?.data?.recipeItems ?? []}

                        />
                }

            </div>

        </div>
    )
}

export default MenuItem