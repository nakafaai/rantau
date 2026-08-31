type ResultColumnRegion = "body" | "header";

/** Returns responsive width, spacing, and pinning for one result column. */
export function resultColumnClass(
  columnId: string,
  region: ResultColumnRegion = "body"
) {
  if (columnId === "select") {
    return "w-14 min-w-14 px-4";
  }
  if (columnId === "recommendation") {
    return "w-44 min-w-44 px-4";
  }
  if (columnId === "role") {
    return "w-[28rem] min-w-[28rem] px-4";
  }
  if (columnId === "company") {
    return "w-80 min-w-80 px-4";
  }
  if (columnId === "location") {
    return "w-80 min-w-80 px-4";
  }
  if (columnId === "pathway") {
    return "w-48 min-w-48 px-4";
  }
  if (columnId === "mode") {
    return "w-40 min-w-40 px-4";
  }
  if (columnId === "salary") {
    return "w-60 min-w-60 px-4";
  }
  if (columnId === "source") {
    return region === "header" ? "w-60 min-w-60 after:hidden" : "w-60 min-w-60";
  }
  if (columnId === "actions") {
    return region === "header"
      ? "sticky right-0 z-30 w-16 min-w-16 max-w-16 border-s border-separator/50 bg-surface-secondary px-3"
      : "sticky right-0 z-20 w-16 min-w-16 max-w-16 border-s border-separator/50 bg-surface px-3";
  }
  return "";
}
