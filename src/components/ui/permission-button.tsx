import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PermissionButtonProps extends ButtonProps {
  hasPermission: boolean;
  tooltip?: string;
  category?: "red" | "blue";
}

export function PermissionButton({
  hasPermission,
  tooltip,
  category,
  className,
  children,
  ...props
}: PermissionButtonProps) {
  const categoryStyles = {
    red: "ring-2 ring-admin-red/50",
    blue: "ring-2 ring-user-blue/50",
  };

  if (!hasPermission && tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                {...props}
                disabled
                className={cn(
                  "opacity-50 cursor-not-allowed",
                  category && categoryStyles[category],
                  className
                )}
              >
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      {...props}
      className={cn(category && hasPermission && categoryStyles[category], className)}
    >
      {children}
    </Button>
  );
}
