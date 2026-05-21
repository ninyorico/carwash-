import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { POS } from "./components/POS";
import { Transactions } from "./components/Transactions";
import { Inventory } from "./components/Inventory";
import { Scheduling } from "./components/Scheduling";
import { Analytics } from "./components/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/dashboard",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "pos", Component: POS },
      { path: "transactions", Component: Transactions },
      { path: "inventory", Component: Inventory },
      { path: "scheduling", Component: Scheduling },
      { path: "analytics", Component: Analytics },
    ],
  },
]);
