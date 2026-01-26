
import BrandAdmin from "@/pages/brand-admin/brand-admin"
import Item from "@/pages/brand-admin/menu-item"
import MenuItem from "@/pages/brand-admin/menu"
import { Outlet } from "@/pages/brand-admin/outlet"
import { Recipe } from "@/pages/brand-admin/recipe"
import { CreateRecipe } from "@/pages/brand-admin/create-recipe"
import { Ingredients } from "@/pages/brand-admin/ingredient"
import { Unit } from "@/pages/brand-admin/unit"
import { Overview } from "@/pages/brand-admin/analytics/overview"
import { MenuItemAnalysis } from "@/pages/brand-admin/analytics/menu-item-analyitcs"

export const brandAdminRoutes = [
  {
    path: "/",
    element: <BrandAdmin />
  },
  {
    path: "/outlet/:id",
    element: <Outlet />
  },
  {
    path: "/items",
    element: <MenuItem />
  },
  {
    path: "/item/:itemId",
    element: <Item />
  },
  {
    path: "/recipes",
    element: <Recipe />
  },
  {
    path: "/recipe/:itemId",
    element: <CreateRecipe />
  },
  {
    path: "/ingredients",
    element: <Ingredients />
  },
  {
    path: "/units",
    element: <Unit />
  },
  {
    path: "/overview",
    element: <Overview />
  },
  {
    path: "/menu-item",
    element: <MenuItemAnalysis />
  },
]
