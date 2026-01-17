import React from "react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const SiteHeader = ({
  headerTitle,
  description,
  actionTooltip = "Create",
  onActionClick,
  isTooltip=true
}) => {
  return (
    <div className="flex flex-col w-full py-10 lg:py-0">
      <header className="flex justify-between gap-4 lg:gap-2">
        {/* Left */}
        <div className="flex items-center gap-2 px-4 lg:p-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold leading-tight lg:text-2xl">
              {headerTitle ?? "Dashboard Overview"}
            </h1>
            <span className=" text-sm text-muted-foreground ">
              {description ??
                "Real-time aggregated analytics for all restaurant locations"}
            </span>
          </div>
        </div>

        {/* Right */}
        {isTooltip &&
          <div className="flex items-center gap-2 px-4 lg:p-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onActionClick}
                  className="
                    bg-red-500 
                    hover:bg-red-600 
                    active:scale-95
                    transition-all
                    duration-200
                  "
                  size="icon"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{actionTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>}
      </header>
    </div>
  );
};

export default React.memo(SiteHeader);
