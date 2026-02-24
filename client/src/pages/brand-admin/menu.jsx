import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import CsvScanner from '@/components/common/CsvScanner'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import {
  useGetAllItemsQuery,
  useDeleteItemsMutation,
} from "@/redux/apis/brand-admin/itemApi"
import { menuColumns } from '@/utils/columns/brand-admin'
import { SkeletonLoader, TableOverlayLoader } from '@/components/laoder'
import { debounce } from 'lodash'
import { CreateItemModal } from '@/components/Form/brand-admin-form/create-item-form/create-item-form'
import { ConfirmModal } from '@/components/common/ConfirmModal'


const Item = () => {
  const [open, setOpen] = useState(false)
  const Navigate = useNavigate()
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);


  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetAllItemsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search
  })

  const [deleteItem, { isLoading: isDeleting }] =
    useDeleteItemsMutation()

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    try {
      if (!itemToDelete) return;
      await deleteItem({ itemId: itemToDelete._id }).unwrap();
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Failed to delete item", error);
      toast.error(error?.data?.message || "Failed to delete item");
    } finally {
      setItemToDelete(null);
    }
  };
  const debouncedSearch = React.useMemo(
    () =>
      debounce((value) => {
        setPagination((prev) => ({
          ...prev,
          pageIndex: 0,
        }));

        setSearch(value);
      }, 400),
    []
  );

  React.useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);
  return (
    <div className='w-full bg-gray-50 min-h-screen'>
      <SiteHeader
        headerTitle={`Items`}
        description="Manage, Create and Delete Menu Items For all Outlets"
        actionTooltip="Create New Item"
        onActionClick={() => setOpen(true)}
      >
        <CsvScanner type="menu-item" onSuccess={refetch} />
      </SiteHeader>
      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {
          isLoading ?
            <SkeletonLoader /> :
            <div className="relative">
              {(isFetching && !isLoading) && <TableOverlayLoader />}
              <DataCard
                title={"MENU ITEMS"}
                searchable
                columns={menuColumns(handleDeleteItem, Navigate)}
                data={data?.data.menuItems ?? []}
                titleWhenEmpty={"No items found"}
                descriptionWhenEmpty={"We couldn't find any items here. Try adding a new one or adjust your filters."}
                manualPagination={true}
                pageCount={data?.data?.pagination?.totalPages || 0}
                onPaginationChange={setPagination}
                paginationState={pagination}
                onGlobalFilterChange={debouncedSearch}
              />
            </div>

        }

      </div>

      <CreateItemModal
        open={open}
        onOpenChange={setOpen}
      />
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete Item "${itemToDelete?.itemName}"?`}
        description="This action cannot be undone. This item will be permanently removed."
        confirmText="Delete"
        isDanger={true}
        loading={isDeleting}
      />
    </div>
  )
}

export default Item