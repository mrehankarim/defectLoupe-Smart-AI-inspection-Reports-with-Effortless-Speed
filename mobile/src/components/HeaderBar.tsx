import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Moon, Sun, Wifi, WifiOff } from "lucide-react-native";

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { isServerOnline, checkServerConnection } = useAuth();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.canvas,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.iconButton, { borderColor: colors.border }]}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.accent }]}>
              {subtitle.toUpperCase()}
            </Text>
          )}
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Server status pill */}
        <TouchableOpacity
          onPress={() => checkServerConnection()}
          style={[
            styles.serverBadge,
            {
              backgroundColor: isServerOnline
                ? "rgba(16, 185, 129, 0.12)"
                : "rgba(245, 158, 11, 0.12)",
              borderColor: isServerOnline
                ? "rgba(16, 185, 129, 0.3)"
                : "rgba(245, 158, 11, 0.3)",
            },
          ]}
        >
          {isServerOnline ? (
            <Wifi size={12} color={colors.accent} />
          ) : (
            <WifiOff size={12} color={colors.warning} />
          )}
        </TouchableOpacity>

        {/* Theme toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.iconButton, { borderColor: colors.border }]}
        >
          {isDark ? (
            <Sun size={17} color="#fbbf24" />
          ) : (
            <Moon size={17} color={colors.secondary} />
          )}
        </TouchableOpacity>

        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleContainer: {
    marginLeft: 8,
    flex: 1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  serverBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
});
