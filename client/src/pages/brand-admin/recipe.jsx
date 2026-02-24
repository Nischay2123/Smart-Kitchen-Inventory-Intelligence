import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import CsvScanner from '@/components/common/CsvScanner'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetAllItemsQuery,
} from "@/redux/apis/brand-admin/itemApi"
import { SkeletonLoader, TableOverlayLoader } from '@/components/laoder'
import { createRecipeColumn } from '@/utils/columns/brand-admin'
import { debounce } from 'lodash'




export const Recipe = () => {
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
    isFetching,
    refetch
  } = useGetAllItemsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search
  })


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
        headerTitle={`Recipes`}
        description="Create and Edit Recipes Items For all Outlets"
        isTooltip={false}
      >
        <CsvScanner type="recipe" onSuccess={refetch} />
      </SiteHeader>
      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {
          isLoading ?
            <SkeletonLoader /> :
            <div className="relative">
              {(isFetching && !isLoading) && <TableOverlayLoader />}
              <DataCard
                title={"Create and update Recipies for the items"}
                searchable
                columns={createRecipeColumn( Navigate)}
                data={data?.data.menuItems ?? []}
                titleWhenEmpty={"No items found to create recipes"}
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
    </div>
  )
}
