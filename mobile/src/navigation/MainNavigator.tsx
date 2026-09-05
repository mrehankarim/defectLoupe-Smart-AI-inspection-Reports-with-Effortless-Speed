import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";

// Screens
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { InspectionsListScreen } from "../screens/inspections/InspectionsListScreen";
import { CreateInspectionScreen } from "../screens/inspections/CreateInspectionScreen";
import { InspectionDetailScreen } from "../screens/inspections/InspectionDetailScreen";
import { AreaWalkthroughScreen } from "../screens/inspections/AreaWalkthroughScreen";
import { ClientsAndPropertiesScreen } from "../screens/clients/ClientsAndPropertiesScreen";
import { ReportViewerScreen } from "../screens/reports/ReportViewerScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";

// Icons
import {
  LayoutDashboard,
  ClipboardList,
  Building,
  Settings,
} from "lucide-react-native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="InspectionsTab"
        component={InspectionsListScreen}
        options={{
          tabBarLabel: "Inspections",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PortfolioTab"
        component={ClientsAndPropertiesScreen}
        options={{
          tabBarLabel: "Portfolio",
          tabBarIcon: ({ color, size }) => (
            <Building size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="CreateInspection"
        component={CreateInspectionScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="InspectionDetail"
        component={InspectionDetailScreen}
      />
      <Stack.Screen
        name="AreaWalkthrough"
        component={AreaWalkthroughScreen}
      />
      <Stack.Screen
        name="ReportViewer"
        component={ReportViewerScreen}
      />
    </Stack.Navigator>
  );
};
