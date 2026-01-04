/**
 * Swagger path definitions index
 * Combines all route definitions into a single paths object
 */

import { productsDefinition } from "./products";
import { productsIdDefinition } from "./productsId";
import { promosDefinition } from "./promos";
import { promosIdDefinition } from "./promosId";
import { wishlistsDefinition } from "./wishlists";
import { cartsDefinition } from "./carts";
import { ordersDefinition } from "./orders";
import { devAuthDefinition } from "./devAuth";

export const swaggerPaths = {
  ...productsDefinition,
  ...productsIdDefinition,
  ...promosDefinition,
  ...promosIdDefinition,
  ...wishlistsDefinition,
  ...cartsDefinition,
  ...ordersDefinition,
  ...(process.env.NODE_ENV !== "production" ? devAuthDefinition : {}),
};

