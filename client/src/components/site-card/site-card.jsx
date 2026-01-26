import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


const SectionCard = ({ item }) => {
  return (
    <Card className="@container/card py-2 bg-white w-full flex-row items-center justify-between gap-1">
      
      <div className="flex-2 flex flex-col gap-4 ">
      <CardHeader className={" text-gray-500"}>
        {item.name}
      </CardHeader>
      <CardContent className={""}>
          <CardTitle className={"text-2xl"}>
              {Number(item.today).toFixed(2)}
          </CardTitle>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1.5 text-sm ">
        <CardDescription>
          <div className="flex flex-col text-[0.65rem]">
              <div className="flex justify-between gap-2 text-black">
                {
                  item.change>0 ? 
                  <span className="flex items-center text-green-700"><IconTrendingUp className="w-4 h-4 text-green-700"/> {item.change}</span>:
                  <span className="flex items-center text-red-700"><IconTrendingDown className="w-4 h-4 text-red-700"/> {item.change}</span>
                  
                }
                From last week same day
              </div>
              <div className="flex flex-justify-between gap-2 text-gray-500">
                Progress compared to <span className="text-black">{Number(item.prev).toFixed(2)}</span>
              </div>
          </div>
        </CardDescription>
      </CardFooter>
      </div>
    </Card>
  )
}

export default SectionCard