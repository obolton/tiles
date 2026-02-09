import { hydrateRoute } from "@/utils/hydration";
import { handleError } from "@/utils/errors";

hydrateRoute().catch(handleError);
