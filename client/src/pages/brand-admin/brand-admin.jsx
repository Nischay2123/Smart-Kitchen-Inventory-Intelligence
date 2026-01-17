import React from 'react'
import BrandGrid from '@/components/card/grid'
import { useNavigate } from "react-router-dom";
import SiteHeader from '@/components/site-header'
import { CreateOutletModal } from '@/components/Form/brand-admin-form/create-outlet-form';
import { useGetAllOutletsQuery, useDeleteOutletMutation } from "@/redux/apis/brand-admin/outletApi";


// const brands = [
//     { id: "1", name: "Acme Corp", count: 3 },
//     { id: "2", name: "Beta Ltd", count: 1 },
//   ]
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
      //console.log(outlet);
      
    try {
      //console.log(outlet.id);
      
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
          <p className="text-sm text-muted-foreground">
            Loading brands...
          </p>
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