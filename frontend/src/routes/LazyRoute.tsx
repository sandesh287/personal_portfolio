import { Suspense } from "react";
import type { ComponentType } from "react";

import { RouteFallback } from "@/components/common/RouteFallback";

interface LazyRouteProps {
  component: ComponentType;
}

export function LazyRoute({ component: Component }: LazyRouteProps) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  );
}
