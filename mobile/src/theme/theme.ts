import { StyleSheet, ViewStyle } from "react-native";
import { ThemePalette } from "./colors";

export const typography = {
  h1: {
    fontSize: 26,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 17,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  mono: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
};

export const createGlassStyle = (colors: ThemePalette, elevated = false): ViewStyle => ({
  backgroundColor: elevated ? colors.surfaceElevated : colors.surfaceGlass,
  borderWidth: 1,
  borderColor: elevated ? colors.borderHighlight : colors.border,
  borderRadius: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: elevated ? 8 : 4 },
  shadowOpacity: elevated ? 0.35 : 0.18,
  shadowRadius: elevated ? 16 : 8,
  elevation: elevated ? 8 : 4,
});
