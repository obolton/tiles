import { ASPECT_RATIOS } from "@/constants/size";
import type { Sizing } from "doc/types/enums";

const DEFAULT_ASPECT = 16 / 9;

export function getAspect(sizing: Sizing, width: number | null, height: number): number {
  if (sizing === "CUSTOM" || sizing === "AUTO") {
    return width && height ? width / height : DEFAULT_ASPECT;
  }
  return ASPECT_RATIOS[sizing];
}
