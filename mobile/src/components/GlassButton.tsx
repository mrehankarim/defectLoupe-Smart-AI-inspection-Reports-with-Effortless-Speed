import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.accent,
          borderColor: colors.accentHover,
          borderWidth: 1,
        };
      case "ai":
        return {
          backgroundColor: colors.secondary,
          borderColor: "#4f46e5",
          borderWidth: 1,
        };
      case "secondary":
        return {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderWidth: 1,
        };
      case "danger":
        return {
          backgroundColor: colors.danger,
          borderColor: "#be123c",
          borderWidth: 1,
        };
      case "outline":
      default:
        return {
          backgroundColor: "transparent",
          borderColor: colors.borderHighlight,
          borderWidth: 1,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === "primary" || variant === "ai" || variant === "danger") {
      return "#ffffff";
    }
    return colors.text;
  };

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 };
      case "lg":
        return { paddingVertical: 15, paddingHorizontal: 24, borderRadius: 16 };
      case "md":
      default:
        return { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return 12;
      case "lg":
        return 16;
      case "md":
      default:
        return 14;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getContainerStyle(),
        getSizeStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getTextSize() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    marginRight: 8,
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
