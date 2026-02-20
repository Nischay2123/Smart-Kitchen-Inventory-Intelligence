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


export const TableOverlayLoader = () => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl transition-all">
      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border border-gray-100">
        <svg
          className="h-4 w-4 animate-spin text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-500 font-medium">Updating…</span>
      </div>
    </div>
  );
};


export const FullPageLoader = () => {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="h-8 w-8 animate-spin text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    </div>
  );
};
