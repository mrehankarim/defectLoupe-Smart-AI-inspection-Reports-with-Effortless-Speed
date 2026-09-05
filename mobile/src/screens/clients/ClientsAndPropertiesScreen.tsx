import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { HeaderBar } from "../../components/HeaderBar";
import { GlassCard } from "../../components/GlassCard";
import { GlassInput } from "../../components/GlassInput";
import { GlassButton } from "../../components/GlassButton";
import { EmptyState } from "../../components/EmptyState";
import {
  coreService,
  Client,
  Property,
} from "../../services/coreService";
import { getErrorMessage } from "../../services/api";
import {
  Users,
  Building,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react-native";

export const ClientsAndPropertiesScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<"clients" | "properties">("clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Add Client Modal
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [savingClient, setSavingClient] = useState(false);

  // Add Property Modal
  const [showAddProp, setShowAddProp] = useState(false);
  const [propClientId, setPropClientId] = useState("");
  const [propAddress, setPropAddress] = useState("");
  const [propCity, setPropCity] = useState("");
  const [propType, setPropType] = useState("Single Family");
  const [propSqft, setPropSqft] = useState("");
  const [propYear, setPropYear] = useState("");
  const [savingProp, setSavingProp] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cList, pList] = await Promise.all([
        coreService.listClients({ limit: 50 }).catch(() => []),
        coreService.listProperties({ limit: 50 }).catch(() => []),
      ]);
      setClients(cList);
      setProperties(pList);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateClient = async () => {
    if (!clientName.trim() || !clientEmail.trim()) {
      Alert.alert("Validation", "Name and email are required.");
      return;
    }
    setSavingClient(true);
    try {
      await coreService.createClient({
        name: clientName.trim(),
        email: clientEmail.trim(),
        phone: clientPhone.trim() || undefined,
      });
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setShowAddClient(false);
      loadData();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSavingClient(false);
    }
  };

  const handleCreateProperty = async () => {
    if (!propAddress.trim()) {
      Alert.alert("Validation", "Property address is required.");
      return;
    }
    if (!propClientId && clients.length > 0) {
      setPropClientId(clients[0].id);
    }

    const targetClientId = propClientId || (clients[0] && clients[0].id);
    if (!targetClientId) {
      Alert.alert("Error", "Please create at least one client first.");
      return;
    }

    setSavingProp(true);
    try {
      await coreService.createProperty({
        client_id: targetClientId,
        address: propAddress.trim(),
        city: propCity.trim() || undefined,
        property_type: propType,
        square_feet: propSqft ? parseInt(propSqft, 10) : undefined,
        year_built: propYear ? parseInt(propYear, 10) : undefined,
      });
      setPropAddress("");
      setPropCity("");
      setPropSqft("");
      setPropYear("");
      setShowAddProp(false);
      loadData();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSavingProp(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <HeaderBar
        title="Portfolio"
        subtitle="Assets & Records"
        rightAction={
          <TouchableOpacity
            onPress={() =>
              activeTab === "clients"
                ? setShowAddClient(true)
                : setShowAddProp(true)
            }
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        }
      />

      {/* Segmented Switch */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("clients")}
          style={[
            styles.segmentBtn,
            activeTab === "clients" && {
              backgroundColor: colors.accent,
            },
          ]}
        >
          <Users
            size={14}
            color={activeTab === "clients" ? "#fff" : colors.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "clients" ? "#fff" : colors.textMuted },
            ]}
          >
            Clients ({clients.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("properties")}
          style={[
            styles.segmentBtn,
            activeTab === "properties" && {
              backgroundColor: colors.accent,
            },
          ]}
        >
          <Building
            size={14}
            color={activeTab === "properties" ? "#fff" : colors.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "properties" ? "#fff" : colors.textMuted },
            ]}
          >
            Properties ({properties.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CLIENTS TAB */}
      {activeTab === "clients" ? (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            loading ? null : (
              <EmptyState
                title="No Clients"
                description="Create a client record to attach real estate properties and inspection reports."
                actionTitle="Add New Client"
                onAction={() => setShowAddClient(true)}
              />
            )
          }
          renderItem={({ item }) => (
            <GlassCard elevated style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[styles.clientName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <View
                  style={[
                    styles.avatarBadge,
                    { backgroundColor: colors.surfaceElevated },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.accent }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Mail size={13} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  {item.email}
                </Text>
              </View>

              {item.phone && (
                <View style={styles.infoRow}>
                  <Phone size={13} color={colors.textMuted} />
                  <Text style={[styles.infoText, { color: colors.textMuted }]}>
                    {item.phone}
                  </Text>
                </View>
              )}
            </GlassCard>
          )}
        />
      ) : (
        /* PROPERTIES TAB */
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            loading ? null : (
              <EmptyState
                title="No Properties"
                description="Add properties to begin inspection workflows."
                actionTitle="Add New Property"
                onAction={() => setShowAddProp(true)}
              />
            )
          }
          renderItem={({ item }) => (
            <GlassCard elevated style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[styles.propAddress, { color: colors.text }]}>
                  {item.address}
                </Text>
              </View>

              {item.city && (
                <View style={styles.infoRow}>
                  <MapPin size={13} color={colors.textMuted} />
                  <Text style={[styles.infoText, { color: colors.textMuted }]}>
                    {item.city}, {item.state || ""} {item.zip_code || ""}
                  </Text>
                </View>
              )}

              <View style={styles.propStatsRow}>
                <Text style={[styles.propStatBadge, { color: colors.textSubtle }]}>
                  {item.property_type || "Residential"}
                </Text>
                {item.square_feet && (
                  <Text style={[styles.propStatBadge, { color: colors.textSubtle }]}>
                    {item.square_feet.toLocaleString()} sqft
                  </Text>
                )}
                {item.year_built && (
                  <Text style={[styles.propStatBadge, { color: colors.textSubtle }]}>
                    Built {item.year_built}
                  </Text>
                )}
              </View>
            </GlassCard>
          )}
        />
      )}

      {/* Add Client Modal */}
      <Modal
        visible={showAddClient}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddClient(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard elevated style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create New Client
            </Text>
            <GlassInput
              label="Full Name *"
              placeholder="e.g. Sarah Jenkins"
              value={clientName}
              onChangeText={setClientName}
            />
            <GlassInput
              label="Email Address *"
              placeholder="sarah.jenkins@example.com"
              value={clientEmail}
              onChangeText={setClientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <GlassInput
              label="Phone Number"
              placeholder="+1 (555) 234-5678"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.modalActions}>
              <GlassButton
                title="Cancel"
                onPress={() => setShowAddClient(false)}
                variant="outline"
                size="sm"
              />
              <GlassButton
                title="Save Client"
                onPress={handleCreateClient}
                loading={savingClient}
                size="sm"
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Add Property Modal */}
      <Modal
        visible={showAddProp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddProp(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard elevated style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Real Estate Asset
            </Text>
            <GlassInput
              label="Street Address *"
              placeholder="742 Evergreen Terrace"
              value={propAddress}
              onChangeText={setPropAddress}
            />
            <GlassInput
              label="City"
              placeholder="Springfield"
              value={propCity}
              onChangeText={setPropCity}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <GlassInput
                  label="Sq Footage"
                  placeholder="2400"
                  value={propSqft}
                  onChangeText={setPropSqft}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <GlassInput
                  label="Year Built"
                  placeholder="2018"
                  value={propYear}
                  onChangeText={setPropYear}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <GlassButton
                title="Cancel"
                onPress={() => setShowAddProp(false)}
                variant="outline"
                size="sm"
              />
              <GlassButton
                title="Save Property"
                onPress={handleCreateProperty}
                loading={savingProp}
                size="sm"
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
  },
  propAddress: {
    fontSize: 16,
    fontWeight: "700",
  },
  avatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
  },
  propStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  propStatBadge: {
    fontSize: 11,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
});
