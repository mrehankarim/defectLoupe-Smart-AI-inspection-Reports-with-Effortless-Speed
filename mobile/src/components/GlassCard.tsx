import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  elevated = false,
  glow = false,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surfaceGlass,
          borderColor: glow
            ? colors.accentGlow
            : elevated
            ? colors.borderHighlight
            : colors.border,
          shadowColor: glow ? colors.accent : "#000000",
          shadowOpacity: isDark ? (glow ? 0.35 : elevated ? 0.45 : 0.25) : 0.08,
        },
        elevated && styles.elevated,
        glow && styles.glow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    borderWidth: 1.5,
  },
});
