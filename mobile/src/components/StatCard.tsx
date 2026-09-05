import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassCard } from "./GlassCard";
import { useTheme } from "../context/ThemeContext";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  accentColor,
  icon,
}) => {
  const { colors } = useTheme();
  const accent = accentColor || colors.accent;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      {subtitle && (
        <View style={styles.subRow}>
          <View style={[styles.accentDot, { backgroundColor: accent }]} />
          <Text style={[styles.subtitle, { color: colors.textSubtle }]}>
            {subtitle}
          </Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    margin: 4,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  iconContainer: {
    opacity: 0.85,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "500",
  },
});
