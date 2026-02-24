import React from "react";
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom";
import SiteHeader from "@/components/site-header";
import BrandGrid from "@/components/card/grid";
import { CreateBrandModal } from "@/components/Form/super-admin-form/create-brand-form";
import { useGetAllTenantsQuery, useDeleteBrandMutation } from "@/redux/apis/super-admin/brandApi";
import { useLogoutMutation } from "@/redux/apis/userApi";
import { useAuth } from "@/auth/auth";
import { Button } from "@/components/ui/button";
import { GridLoader } from '@/components/laoder';
import { ConfirmModal } from '@/components/common/ConfirmModal'

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [logoutUser, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { user, setUser } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false);



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
      toast.success("Brand deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to delete brand");
    }
  };
  const handleLogout = () => {
    setIsLogoutOpen(true);
  };

  const confirmLogout = async () => {
    try {
      await logoutUser().unwrap();
      setUser(null);
      toast.success("Logged out successfully");
    } catch (e) {
      console.log("Failed to LogOut: ", e?.message);
      toast.error("Failed to LogOut");
    } finally {
      setIsLogoutOpen(false);
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
      <ConfirmModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={confirmLogout}
        title="Log Out?"
        description="Are you sure you want to log out of your session?"
        confirmText="Log Out"
        loading={isLoggingOut}
      />
    </div>
  );
};


export default SuperAdmin;
