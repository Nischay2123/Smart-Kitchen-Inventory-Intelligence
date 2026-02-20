import CreateRecipeForm from '@/components/Form/brand-admin-form/create-update-recipe-form'
import SiteHeader from '@/components/site-header'
import { useGetRecipeQuery } from '@/redux/apis/brand-admin/recipeApi'
import React from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { FullPageLoader } from '@/components/laoder'

export const CreateRecipe = () => {
    const location = useLocation()
    const itemName = location.state.itemName
    const itemId = useParams();
    const {
        data,
        isLoading,
        isError,
    } = useGetRecipeQuery(itemId)
    let isUpdate = false;
    if (data?.data && JSON.stringify(data?.data) != "{}") {
        isUpdate = true;
    }

    return (
        <div className='w-full'>
            <SiteHeader
                headerTitle={`${itemName}`}
                description={"Manage Recipes"}
                isTooltip={false}
            />
            <div className="flex-1 min-h-0 p-4 lg:p-6">
                {isLoading ? (
                    <FullPageLoader />
                ) : (
                    <CreateRecipeForm data={data?.data ?? {}} isUpdate={isUpdate} />
                )}
            </div>
        </div>
    )
}
