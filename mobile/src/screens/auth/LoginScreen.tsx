import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { GlassInput } from "../../components/GlassInput";
import { GlassButton } from "../../components/GlassButton";
import { getErrorMessage } from "../../services/api";
import { authService } from "../../services/authService";
import {
  ShieldAlert,
  Lock,
  Mail,
  Server,
  Zap,
  CheckCircle2,
} from "lucide-react-native";

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { login, serverUrl, isServerOnline, updateServerUrl, checkServerConnection } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl);
  const [seeding, setSeeding] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please provide your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("inspector@example.com");
    setPassword("password123");
    setError("");
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await authService.seedDemo();
      Alert.alert("Success", "Demo database seeded successfully with inspector, properties, and inspection data.");
      fillDemoCredentials();
    } catch (err) {
      Alert.alert("Notice", getErrorMessage(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveServerUrl = async () => {
    const ok = await updateServerUrl(customServerUrl);
    if (ok) {
      Alert.alert("Connected", `Successfully reached ${customServerUrl}`);
      setShowServerConfig(false);
    } else {
      Alert.alert("Error", `Could not reach ${customServerUrl}. Make sure your backend gateway is running.`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.canvas }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.accentGlow,
              },
            ]}
          >
            <ShieldAlert size={36} color={colors.accent} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>
            Defect<Text style={{ color: colors.accent }}>Loupe</Text>
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
            Smart AI Inspection Reports with Effortless Speed
          </Text>
        </View>

        {/* Server Status Pill */}
        <TouchableOpacity
          onPress={() => setShowServerConfig(!showServerConfig)}
          style={[
            styles.serverPill,
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
          <Server
            size={13}
            color={isServerOnline ? colors.accent : colors.warning}
          />
          <Text
            style={[
              styles.serverPillText,
              { color: isServerOnline ? colors.accent : colors.warning },
            ]}
          >
            {isServerOnline ? "Backend Connected" : "Connecting..."} ({serverUrl})
          </Text>
        </TouchableOpacity>

        {/* Server Config Accordion */}
        {showServerConfig && (
          <GlassCard style={styles.serverCard}>
            <Text style={[styles.serverTitle, { color: colors.text }]}>
              Backend Server Host
            </Text>
            <Text style={[styles.serverDesc, { color: colors.textMuted }]}>
              Use `http://localhost:80` for web, `http://10.0.2.2:80` for Android emulator, or your local machine IP.
            </Text>
            <GlassInput
              value={customServerUrl}
              onChangeText={setCustomServerUrl}
              placeholder="http://192.168.1.100:80"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.serverActions}>
              <GlassButton
                title="Save & Test"
                onPress={handleSaveServerUrl}
                size="sm"
              />
              <GlassButton
                title="Seed Demo DB"
                onPress={handleSeedDemo}
                variant="outline"
                size="sm"
                loading={seeding}
              />
            </View>
          </GlassCard>
        )}

        {/* Login Form Card */}
        <GlassCard elevated style={styles.formCard}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            Inspector Sign In
          </Text>

          {error ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: "rgba(244, 63, 94, 0.12)",
                  borderColor: "rgba(244, 63, 94, 0.3)",
                },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <GlassInput
            label="Email Address"
            placeholder="inspector@agency.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Mail size={16} color={colors.textMuted} />}
          />

          <GlassInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={16} color={colors.textMuted} />}
          />

          <GlassButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.loginBtn}
          />

          {/* Quick Demo Fill Button */}
          <TouchableOpacity
            onPress={fillDemoCredentials}
            style={[
              styles.demoFillBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
              },
            ]}
          >
            <Zap size={14} color={colors.accent} />
            <Text style={[styles.demoFillText, { color: colors.text }]}>
              Fill Demo Credentials
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            Don't have an inspector account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text
              style={{
                color: colors.accent,
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              Register Here
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
  },
  serverPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  serverPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  serverCard: {
    marginBottom: 16,
  },
  serverTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  serverDesc: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  serverActions: {
    flexDirection: "row",
    gap: 10,
  },
  formCard: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loginBtn: {
    marginTop: 8,
  },
  demoFillBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 6,
  },
  demoFillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
