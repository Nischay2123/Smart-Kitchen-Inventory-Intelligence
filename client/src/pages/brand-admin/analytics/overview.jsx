import AnalyticsHeader from "@/components/AnalyticsHeader"

export const Overview = () => {
  return (
    <div className='w-full bg-gray-50 min-h-screen'>
        <AnalyticsHeader
        headerTitle="Sales Analytics"
        description="Live performance insights across all outlets"
        outlets={ []}
        // onRefresh={refetch}
      />
      {/* overview */}
    </div>
  )
}
