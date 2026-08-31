type ResultColumnRegion = "body" | "header";

/** Returns responsive width, spacing, and pinning for one result column. */
export function resultColumnClass(
  columnId: string,
  region: ResultColumnRegion = "body"
) {
  if (columnId === "select") {
    return "w-11 px-3";
  }
  if (columnId === "recommendation") {
    return "min-w-32 px-3";
  }
  if (columnId === "role") {
    return "min-w-64 px-3";
  }
  if (columnId === "company") {
    return "min-w-52 px-3";
  }
  if (columnId === "location") {
    return "min-w-64 px-3";
  }
  if (columnId === "pathway") {
    return "min-w-40 px-3";
  }
  if (columnId === "mode") {
    return "min-w-32 px-3";
  }
  if (columnId === "salary") {
    return "min-w-52 px-3";
  }
  if (columnId === "source") {
    return "min-w-48 px-3";
  }
  if (columnId === "actions") {
    const layer = region === "header" ? "z-30" : "z-20";
    return `sticky right-0 ${layer} w-12 border-l-2 border-l-border bg-background px-2 group-hover:bg-muted group-data-[state=selected]:bg-muted`;
  }
  return "px-3";
}
