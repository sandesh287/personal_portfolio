import { Link } from "react-router";

import { routes } from "@/constants/routes";
import { cn } from "@/utils/cn";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6">
      <div>
        <p className="text-sm uppercase text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Workspace module not found</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          The requested route does not exist in this portfolio workspace.
        </p>
        <Link
          to={routes.home}
          className={cn(
            "mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm",
            "font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          )}
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
