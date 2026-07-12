"use client";

import DevScreenshotTool from "./DevScreenshotTool";

export default function DevTools() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <DevScreenshotTool />;
}
