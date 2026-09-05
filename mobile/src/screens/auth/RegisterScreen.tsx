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
import { User, Mail, Lock, Phone, Award, ArrowLeft } from "lucide-react-native";

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        phone_number: phone.trim() || undefined,
        license_number: license.trim() || undefined,
      });

      Alert.alert(
        "Account Created",
        "Your inspector account has been registered. Please sign in.",
        [{ text: "Sign In", onPress: () => navigation.navigate("Login") }]
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <ArrowLeft size={16} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Join DefectLoupe as an independent or agency inspector
          </Text>
        </View>

        <GlassCard elevated style={styles.card}>
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

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <GlassInput
                label="First Name *"
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                leftIcon={<User size={15} color={colors.textMuted} />}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <GlassInput
                label="Last Name *"
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <GlassInput
            label="Email Address *"
            placeholder="john.doe@inspection.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Mail size={15} color={colors.textMuted} />}
          />

          <GlassInput
            label="Password * (min 8 chars)"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={15} color={colors.textMuted} />}
          />

          <GlassInput
            label="Phone Number"
            placeholder="+1 (555) 019-2834"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={15} color={colors.textMuted} />}
          />

          <GlassInput
            label="License / Certification #"
            placeholder="TREC #24819"
            value={license}
            onChangeText={setLicense}
            autoCapitalize="characters"
            leftIcon={<Award size={15} color={colors.textMuted} />}
          />

          <GlassButton
            title="Register as Inspector"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingVertical: 40 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    gap: 6,
  },
  backText: { fontSize: 12, fontWeight: "600" },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4 },
  card: { padding: 20 },
  row: { flexDirection: "row" },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: { fontSize: 12, fontWeight: "600" },
  submitBtn: { marginTop: 8 },
});
