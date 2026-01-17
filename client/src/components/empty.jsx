import { CircleOff } from "lucide-react"


export const Empty = ({
    title,
    descpription 
}) => {
    return (
        <div className="w-full h-[65vh] flex items-center justify-center">
            <div className="flex flex-col items-center text-center gap-3 px-6">
                <div className="bg-gray-100 rounded-full p-4">
                    <CircleOff className="w-7 h-7 text-gray-400" />
                </div>

                <h2 className="text-lg font-semibold text-gray-800">
                    {title ?? "No recipes found"}
                </h2>

                <p className="text-sm text-gray-500 max-w-xs">
                    {descpription ?? "We couldn’t find any recipes here. Try adding a new one or adjust your filters."}
                </p>
            </div>
        </div>

    )
}
