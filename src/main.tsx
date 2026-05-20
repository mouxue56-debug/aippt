import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { isToolsHomePath } from "./app/publicMode";
import { ToolsHome } from "./app/ToolsHome";
import "./app/app.css";

const rootComponent = isToolsHomePath() ? <ToolsHome /> : <App />;

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {rootComponent}
  </React.StrictMode>
);
