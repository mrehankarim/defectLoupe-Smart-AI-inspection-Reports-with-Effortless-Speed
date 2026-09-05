import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { HeaderBar } from "../../components/HeaderBar";
import { GlassCard } from "../../components/GlassCard";
import { GlassInput } from "../../components/GlassInput";
import { GlassButton } from "../../components/GlassButton";
import { authService } from "../../services/authService";
import { offlineService } from "../../services/offlineService";
import { getErrorMessage } from "../../services/api";
import {
  User,
  Award,
  Server,
  Sun,
  Moon,
  Database,
  Trash2,
  LogOut,
  CheckCircle,
  Wifi,
  WifiOff,
} from "lucide-react-native";

export const SettingsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    user,
    inspector,
    serverUrl,
    isServerOnline,
    updateServerUrl,
    checkServerConnection,
    logout,
  } = useAuth();

  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testingConnection, setTestingConnection] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const ok = await updateServerUrl(inputUrl);
      if (ok) {
        Alert.alert("Success", `Connected to backend at ${inputUrl}`);
      } else {
        Alert.alert(
          "Connection Warning",
          `Could not reach ${inputUrl}. Ensure backend is running and accessible from this device.`
        );
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await authService.seedDemo();
      Alert.alert("Success", "Demo database seeded successfully.");
    } catch (err) {
      Alert.alert("Notice", getErrorMessage(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleClearCache = async () => {
    await offlineService.clearQueue();
    Alert.alert("Cleared", "Offline action queue cleared.");
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <HeaderBar title="Settings" subtitle="System & Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Inspector Profile
        </Text>
        <GlassCard elevated style={styles.card}>
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.accentGlow, borderColor: colors.accent },
              ]}
            >
              <User size={24} color={colors.accent} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {inspector
                  ? `${inspector.first_name} ${inspector.last_name}`
                  : user?.email.split("@")[0] || "Inspector"}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                {user?.email}
              </Text>
              {inspector?.license_number && (
                <View style={styles.licenseRow}>
                  <Award size={12} color={colors.accent} />
                  <Text style={[styles.licenseText, { color: colors.accent }]}>
                    License: {inspector.license_number}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </GlassCard>

        {/* Appearance Card */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Appearance
        </Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              {isDark ? (
                <Moon size={18} color={colors.secondary} />
              ) : (
                <Sun size={18} color="#fbbf24" />
              )}
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Dark Theme
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  Glassmorphic dark aesthetic matching web
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#cbd5e1", true: colors.accent }}
              thumbColor={isDark ? "#ffffff" : "#f1f5f9"}
            />
          </View>
        </GlassCard>

        {/* Backend Connection Card */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Backend API Gateway
        </Text>
        <GlassCard style={styles.card}>
          <View style={styles.serverStatusHeader}>
            <View style={styles.statusPillRow}>
              {isServerOnline ? (
                <Wifi size={14} color={colors.accent} />
              ) : (
                <WifiOff size={14} color={colors.warning} />
              )}
              <Text
                style={[
                  styles.statusPillText,
                  { color: isServerOnline ? colors.accent : colors.warning },
                ]}
              >
                {isServerOnline ? "Gateway Connected" : "Offline / Unreachable"}
              </Text>
            </View>
          </View>

          <GlassInput
            label="Gateway Host URL"
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="http://localhost:80"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <GlassButton
            title="Test & Save Host"
            onPress={handleTestConnection}
            loading={testingConnection}
            size="sm"
            style={{ alignSelf: "flex-start" }}
          />
        </GlassCard>

        {/* Developer & Demo Tools */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Field Tools
        </Text>
        <GlassCard style={styles.card}>
          <TouchableOpacity
            onPress={handleSeedDemo}
            disabled={seeding}
            style={styles.toolItem}
          >
            <Database size={16} color={colors.secondary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>
                Seed Demo Database
              </Text>
              <Text style={[styles.toolDesc, { color: colors.textMuted }]}>
                Load sample clients, properties, and inspections
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity onPress={handleClearCache} style={styles.toolItem}>
            <Trash2 size={16} color={colors.textMuted} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>
                Clear Offline Queue
              </Text>
              <Text style={[styles.toolDesc, { color: colors.textMuted }]}>
                Reset pending offline actions
              </Text>
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Sign Out */}
        <GlassButton
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          icon={<LogOut size={16} color="#fff" />}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 50 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  card: {
    padding: 16,
    marginBottom: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  licenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  licenseText: {
    fontSize: 11,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  serverStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  toolItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  toolDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 8,
  },
  logoutBtn: {
    marginTop: 24,
  },
});
