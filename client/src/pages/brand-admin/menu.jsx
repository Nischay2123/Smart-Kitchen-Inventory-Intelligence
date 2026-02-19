import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import CsvScanner from '@/components/common/CsvScanner'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetAllItemsQuery,
  useDeleteItemsMutation,
} from "@/redux/apis/brand-admin/itemApi"
import { menuColumns } from '@/utils/columns/brand-admin'
import { SkeletonLoader } from '@/components/laoder'
import { debounce } from 'lodash'
import { CreateItemModal } from '@/components/Form/brand-admin-form/create-item-form/create-item-form'


const Item = () => {
  const [open, setOpen] = useState(false)
  const Navigate = useNavigate()
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState("");


  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetAllItemsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search
  })

  const [deleteItem, { isLoading: isDeleting }] =
    useDeleteItemsMutation()

  const handleDeleteItem = async (item) => {
    const result = window.confirm(
      `Are you sure you want to delete the item "${item.itemName}"?`
    )

    if (!result) return

    try {
      await deleteItem({ itemId: item._id }).unwrap()
    } catch (error) {
      console.error("Failed to delete outlet manager", error)
    }
  }
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
            <DataCard
              title={"MENU ITEMS"}
              searchable
              loading={isLoading || isDeleting}
              columns={menuColumns(handleDeleteItem, Navigate)}
              data={data?.data.menuItems ?? []}
              titleWhenEmpty={"No items found"}
              descriptionWhenEmpty={"We couldn’t find any items here. Try adding a new one or adjust your filters."}
              manualPagination={true}
              pageCount={data?.data?.pagination?.totalPages || 0}
              onPaginationChange={setPagination}
              paginationState={pagination}
              onGlobalFilterChange={debouncedSearch}
            />
        }

      </div>

      <CreateItemModal
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}

export default Item