import { cn } from "@repo/design-system/lib/utils";
import { GeistMono } from "geist/font/mono";
import {
  GeistPixelCircle,
  GeistPixelGrid,
  GeistPixelLine,
  GeistPixelSquare,
  GeistPixelTriangle,
} from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";

/** Nakafa typography variables shared by every Rantau surface. */
export const fonts = cn(
  GeistSans.variable,
  GeistMono.variable,
  GeistPixelSquare.variable,
  GeistPixelGrid.variable,
  GeistPixelCircle.variable,
  GeistPixelTriangle.variable,
  GeistPixelLine.variable,
  "touch-manipulation font-sans antialiased"
);
