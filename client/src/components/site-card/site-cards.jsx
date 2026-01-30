import { IndianRupee, ShoppingCart, Receipt, TrendingUp,DollarSign,
  BarChart2,
  PieChart,
  AlertTriangle, } from "lucide-react";


import {SectionCard ,SecondaryStatCard} from "./site-card";


export const AnalyticsCards = ({ data }) => {
  const cardsConfig = [
  {
    title: "Total Sales",
    description: "Total revenue generated in the selected period",
    value: data?.totalSale,
    icon: IndianRupee,
    formatter: (v) => `₹${v.toLocaleString()}`,
  },
  {
    title: "Total Profit",
    description: "Net earnings after deducting all costs",
    value: data?.totalProfit,
    icon: Receipt,
    formatter: (v) => `₹${v.toFixed(2)}`,
  },
  {
    title: "Total Orders",
    description: "Number of completed customer orders",
    value: data?.totalOrder,
    icon: ShoppingCart,
  },
  {
    title: "Profit Margin",
    description: "Percentage of profit earned from total sales",
    value: data?.profitMargin,
    icon: TrendingUp, // import from lucide-react
    formatter: (v) => `${v.toFixed(2)}%`,
  },
];


  return (
    <section>
      {/* <h2 className="mb-4 text-sm text-gray-400 px-4  lg:px-6">Operational Insights</h2> */}

        <div className="grid grid-cols-1 gap-4 px-4  lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cardsConfig.map((item, index) => (
        <SectionCard item={item} key={index}
        />
      ))}
    </div>
    </section>
  );
};




export const SecondaryMetrics = ({ data }) => {
  console.log(data);
  
  const cardsConfig = [
    {
      title: "COGS",
      description: "Cost of Goods Sold, direct costs",
      value: data?.cogs,
      icon: DollarSign,
      formatter: (v) => `₹${v.toFixed(2)}`,
      colorClass: "bg-orange-200 text-orange-700",
    },
    {
      title: "Average Per Cover",
      description: "Average revenue per customer cover",
      value: data?.averagePerOrder,
      icon: BarChart2,
      formatter: (v) => `₹${v.toFixed(2)}`,
      colorClass: "bg-green-200 text-green-700",
    },
    {
      title: "Cancel Rate",
      description: "Percentage of orders cancelled",
      value: data?.cancelRate,
      icon: AlertTriangle,
      formatter: (v) => `${v.toFixed(2)}%`,
      colorClass: "bg-red-200 text-red-700",
    },
    {
      title: "Bills Cancelled",
      description: "Number of bills cancelled",
      value: data?.totalBillCanceled,
      icon: PieChart,
      formatter: (v) => v.toString(),
      colorClass: "bg-purple-200 text-purple-700",
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-sm text-gray-400 px-4  lg:px-6">Operational Insights</h2>
      <div className="grid grid-cols-1 gap-4 px-4  lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {cardsConfig.map((item, idx) => (
          <SecondaryStatCard key={idx} {...item} />
        ))}
      </div>
    </section>
  );
};

