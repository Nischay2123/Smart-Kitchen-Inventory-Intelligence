import React from 'react'
import BrandGrid from '@/components/card/grid'
import { useNavigate } from "react-router-dom";
import SiteHeader from '@/components/site-header'
import { CreateOutletModal } from '@/components/Form/brand-admin-form/create-outlet-form';
import { useGetAllOutletsQuery, useDeleteOutletMutation } from "@/redux/apis/brand-admin/outletApi";
import { GridLoader } from '@/components/laoder';

const BrandAdmin = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false)

  const {
    data,
    isLoading,
    isError,
  } = useGetAllOutletsQuery();

  const [deleteOutlet, { isLoading: isDeleting }] =
    useDeleteOutletMutation();

  const outlets =
    data?.data?.map((outlet) => ({
      id: outlet._id,
      name: outlet.outletName,
    })) ?? [];

    const handleDeleteOutlet = async (outlet) => {
      
    try {
      
      await deleteOutlet({outletId:outlet.id}).unwrap();
    } catch (err) {
      console.error(err);
      alert(err?.data?.message || "Failed to delete brand");
    }
  };

  return (
    <div className='w-full'>
      <SiteHeader
        headerTitle="Outlets"
        description="Manage outlets and outlet managers"
        actionTooltip="Create Outlet"
        onActionClick={() => setOpen(true)}
      />
      <div className="px-4 lg:p-6">
        {isLoading && (
          <GridLoader />
        )}

        {isError && (
          <p className="text-sm text-red-500">
            Failed to load brands
          </p>
        )}

        {!isLoading && !isError && (
          <BrandGrid
            brands={outlets}
            onOpenBrand={(outlet) =>
              navigate(`/outlet/${outlet.id}`, {
                state: { name: outlet.name },
              })
            }
            onDeleteBrand={handleDeleteOutlet}
            disabled={isDeleting} 
          />
        )}
      </div>
      <CreateOutletModal
        open={open}
        onOpenChange={setOpen}
      />
    </div>


  )
}

export default BrandAdmin