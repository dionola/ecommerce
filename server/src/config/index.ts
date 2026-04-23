/**
 * Swagger path definitions index
 * Combines all route definitions into a single paths object
 */

import { productsDefinition } from "./products.js";
import { productsIdDefinition } from "./productsId.js";
import { promosDefinition } from "./promos.js";
import { promosIdDefinition } from "./promosId.js";
import { wishlistsDefinition } from "./wishlists.js";
import { cartsDefinition } from "./carts.js";
import { ordersDefinition } from "./orders.js";
import { usersDefinition } from "./users.js";
import { manufacturersDefinition } from "./manufacturers.js";
import { testAuthDefinition } from "./testAuth.js";

export const swaggerPaths = {
  ...productsDefinition,
  ...productsIdDefinition,
  ...promosDefinition,
  ...promosIdDefinition,
  ...wishlistsDefinition,
  ...cartsDefinition,
  ...ordersDefinition,
  ...usersDefinition,
  ...manufacturersDefinition,
  // Development-only endpoints
  ...(process.env.NODE_ENV !== "production" ? testAuthDefinition : {}),
};

