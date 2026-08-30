/** Returns responsive minimum widths and visibility for one result column. */
export function resultColumnClass(columnId: string) {
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
    return "w-12 px-2";
  }
  return "px-3";
}
