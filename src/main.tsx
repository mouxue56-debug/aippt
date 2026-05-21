import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { isStoryboardSlicerPath, isToolsHomePath } from "./app/publicMode";
import { StoryboardSlicer } from "./app/StoryboardSlicer";
import { ToolsHome } from "./app/ToolsHome";
import "./app/app.css";

function Root() {
  const [, setRouteKey] = React.useState(() => `${window.location.pathname}${window.location.hash}`);

  React.useEffect(() => {
    const refreshRoute = () => setRouteKey(`${window.location.pathname}${window.location.hash}`);
    window.addEventListener("hashchange", refreshRoute);
    window.addEventListener("popstate", refreshRoute);
    return () => {
      window.removeEventListener("hashchange", refreshRoute);
      window.removeEventListener("popstate", refreshRoute);
    };
  }, []);

  if (isToolsHomePath()) return <ToolsHome />;
  if (isStoryboardSlicerPath()) return <StoryboardSlicer />;
  return <App />;
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
