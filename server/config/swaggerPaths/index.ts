/**
 * Swagger path definitions index
 * Combines all route definitions into a single paths object
 */

import { productsDefinition } from "./products";
import { productsIdDefinition } from "./productsId";

export const swaggerPaths = {
  ...productsDefinition,
  ...productsIdDefinition,
};

