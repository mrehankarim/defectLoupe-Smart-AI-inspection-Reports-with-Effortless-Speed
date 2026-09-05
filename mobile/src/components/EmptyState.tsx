import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { GlassButton } from "./GlassButton";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  onAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        {description}
      </Text>
      {actionTitle && onAction && (
        <GlassButton
          title={actionTitle}
          onPress={onAction}
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  iconWrapper: {
    marginBottom: 16,
    opacity: 0.7,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 260,
  },
  button: {
    marginTop: 4,
  },
});
