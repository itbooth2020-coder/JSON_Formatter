import { useEffect } from "react";

// Every tool page passes its TOOLS entry's `name` as `title`; the home
// page calls this with no argument for the plain site title.
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `JsonForge — ${title}` : "JsonForge";
  }, [title]);
};

export default usePageTitle;
