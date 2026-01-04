/**
 * Swagger path definitions index
 * Combines all route definitions into a single paths object
 */

import { productsDefinition } from "./products";
import { productsIdDefinition } from "./productsId";
import { devAuthDefinition } from "./devAuth";

export const swaggerPaths = {
  ...productsDefinition,
  ...productsIdDefinition,
  ...(process.env.NODE_ENV !== "production" ? devAuthDefinition : {}),
};

