import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, MessageCircle, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Icon */}
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-primary" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Access Denied
              </h1>
              <p className="text-muted-foreground">
                You don&rsquo;t have permission to view this page. Admin access
                is required.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/chat">
                <MessageCircle className="w-4 h-4" />
                Back to Chat
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="w-4 h-4" />
                Go to Home
              </Link>
            </Button>
          </div>

          {/* Help text */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              If you believe this is a mistake, please contact your
              administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
