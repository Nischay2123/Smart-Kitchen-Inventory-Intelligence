export const SkeletonLoader = () => {
  return (
    <div className="w-full p-4 bg-white rounded-xl shadow-sm animate-pulse space-y-4">
      <div className="h-6 w-1/3 bg-gray-200 rounded"></div>

      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};



export const CardLineLoader = () => {
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>

      <div className="flex-1 space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      </div>

      <div className="h-6 w-16 bg-gray-200 rounded-md"></div>
    </div>
  );
};


export const GridLoader = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-28 bg-white rounded-xl shadow-sm animate-pulse p-4 space-y-3"
        >
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-6 w-2/3 bg-gray-200 rounded"></div>
          <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};
