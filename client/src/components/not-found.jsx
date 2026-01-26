import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-center px-4">
      <SearchX className="h-14 w-14 text-gray-500 mb-4" />
      <h1 className="text-3xl font-bold">404 – Page Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        The page you are looking for doesn’t exist or has been moved.
      </p>

      <Button className="mt-6" onClick={() => navigate("/")}>
        Go to Dashboard
      </Button>
    </div>
  );
}
