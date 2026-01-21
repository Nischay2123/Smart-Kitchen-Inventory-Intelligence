import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const ReusableSelect = ({
  data = [],
  valueKey = "_id",      
  labelKey = "name",     
  value,
  onChange,
  placeholder = "Select",
  disabled = false,
}) => {

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {data.map((item) => (
          <SelectItem
            key={item[valueKey]}
            value={item[valueKey]}
          >
            {item[labelKey]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
