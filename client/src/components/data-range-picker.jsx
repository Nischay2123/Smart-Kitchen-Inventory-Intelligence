import { setDateRange } from "@/redux/reducers/brand-admin/dashboardFilters";
import React from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

const getDefaultRange = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  return {
    from: formatDate(today),
    to: formatDate(tomorrow),
  };
};

const DashboardDateRangePicker = ({
  value,
  onChange,
  className = "",
}) => {
  const dispatch = useDispatch()
  React.useEffect(() => {
    if (!value?.from || !value?.to) {
      const defaultRange = getDefaultRange();
      onChange?.(defaultRange);  
      dispatch(setDateRange(defaultRange)); 
    }
  }, []);
  let range;
  if(!value?.from)range = getDefaultRange();
  else range =value
  
  const handleChange = (key, val) => {
    const next = { ...range, [key]: val };

    // safety: avoid invalid ranges
    if (new Date(next.from) > new Date(next.to)){
      toast.error("Invalid date range: 'From' date cannot be later than 'To' date.")
      return;
    }
    
    onChange(next);
  };

return (
  <div className={`flex items-end gap-3 ${className}`}>
    <div className="flex flex-col">
      <label className="text-xs text-gray-500 mb-1">From</label>
      <input
        type="date"
        value={range.from}
        onChange={(e) => handleChange("from", e.target.value)}
        className="border rounded px-3 py-2 text-sm h-9.5"
      />
    </div>

    <div className="flex flex-col">
      <label className="text-xs text-gray-500 mb-1">To</label>
      <input
        type="date"
        value={range.to}
        onChange={(e) => handleChange("to", e.target.value)}
        className="border rounded px-3 py-2 text-sm h-9.5"
      />
    </div>
  </div>
);

};

export default React.memo(DashboardDateRangePicker);
