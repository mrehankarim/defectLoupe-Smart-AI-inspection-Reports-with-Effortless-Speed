import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SEVERITY_CONFIG } from "../theme/colors";

interface SeverityBadgeProps {
  severity: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const norm = (severity || "low").toLowerCase();
  const config = SEVERITY_CONFIG[norm] || SEVERITY_CONFIG.low;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
