import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


import React from "react";

export const SectionCard = ({ item }) => {
  const {
    title,
    description,
    value,
    formatter,
    icon: Icon,
  } = item;

  const displayValue =
    value === null || value === undefined
      ? "--"
      : formatter
      ? formatter(value)
      : value;

  return (
    <Card className="w-full bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between px-5 py-4">
        
        {/* Left Content */}
        <div className="flex flex-col gap-1.5">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-gray-500">
              {title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="text-2xl font-semibold text-gray-900 tracking-tight">
              {displayValue}
            </div>
          </CardContent>

          <CardDescription className="text-xs text-gray-500 leading-snug">
            {description}
          </CardDescription>
        </div>

        {/* Right Icon */}
        {Icon && (
          <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-gray-500" />
          </div>
        )}
      </div>
    </Card>
  );
};



export const SecondaryStatCard = ({
  title,
  description,
  value,
  formatter,
  icon: Icon,
  progress,
  colorClass,
}) => {
  const displayValue =
    value === null || value === undefined
      ? "--"
      : formatter
      ? formatter(value)
      : value;

  return (
    <div className="rounded-lg p-4 flex flex-col justify-between bg-white border border-gray-100 shadow-sm relative overflow-hidden w-full max-w-xs">
      
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${colorClass}`} />

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>

      <div className="text-xl font-semibold text-gray-900 mb-1">
        {displayValue}
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {description}
      </p>

    </div>
  );
};

