import React from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "@/components/site-header";
import BrandGrid from "@/components/card/grid";
import { CreateBrandModal } from "@/components/Form/super-admin-form/create-brand-form";
import { useGetAllTenantsQuery, useDeleteBrandMutation } from "@/redux/apis/super-admin/brandApi";
import { useLogoutMutation } from "@/redux/apis/userApi";
import { useAuth } from "@/auth/auth";
import { Button } from "@/components/ui/button";
import { GridLoader } from '@/components/laoder';

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [logoutUser] = useLogoutMutation();
  const { user, setUser } = useAuth();



  const {
    data,
    isLoading,
    isError,
  } = useGetAllTenantsQuery();

  const [deleteBrand, { isLoading: isDeleting }] =
    useDeleteBrandMutation();

  const brands =
    data?.data?.map((tenant) => ({
      id: tenant._id,
      name: tenant.name,
    })) ?? [];

  const handleDeleteBrand = async (brand) => {
    try {
      await deleteBrand({ tenantId: brand.id }).unwrap();
    } catch (err) {
      console.error(err);
      alert(err?.data?.message || "Failed to delete brand");
    }
  };
  const handleLogout = async () => {
    try {
      const res = confirm("Do you want to Log Out")
      if (!res) return;
      await logoutUser().unwrap();
      setUser(null);
    } catch (e) {
      console.log("Failed to LogOut: ", e?.message);
    }
  };

  return (
    <div className="w-full">
      <SiteHeader
        headerTitle="Brands"
        description="Manage brands and brand managers"
        actionTooltip="Create New Brand"
        onActionClick={() => setOpen(true)}
        isLogout={true}
        onLogOut={handleLogout}
      >
        <Button
          variant="outline"
          onClick={() => navigate("/scheduler-monitor")}
        >
          Scheduler Monitor
        </Button>
      </SiteHeader>

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
            brands={brands}
            onOpenBrand={(brand) =>
              navigate(`/brand/${brand.id}`, {
                state: { name: brand.name },
              })
            }
            onDeleteBrand={handleDeleteBrand}
            disabled={isDeleting}
          />
        )}
      </div>

      <CreateBrandModal
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
};


export default SuperAdmin;
