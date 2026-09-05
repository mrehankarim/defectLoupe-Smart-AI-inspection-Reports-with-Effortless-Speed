import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { STATUS_CONFIG } from "../theme/colors";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const normStatus = (status || "draft").toLowerCase().replace("-", "_");
  const config = STATUS_CONFIG[normStatus] || STATUS_CONFIG.draft;

  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text
        style={[
          styles.text,
          { color: config.text, fontSize: isSmall ? 10 : 11 },
        ]}
      >
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
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
