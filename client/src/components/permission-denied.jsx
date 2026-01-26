import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PermissionDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-center px-4">
      <ShieldAlert className="h-14 w-14 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold">Permission Denied</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        You don’t have permission to access this page.
        If you believe this is a mistake, contact your administrator.
      </p>

      <Button className="mt-6" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </div>
  );
}
