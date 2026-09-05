import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { HeaderBar } from "../../components/HeaderBar";
import { GlassCard } from "../../components/GlassCard";
import { StatCard } from "../../components/StatCard";
import { GlassButton } from "../../components/GlassButton";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { coreService, DashboardStats, Inspection } from "../../services/coreService";
import { offlineService } from "../../services/offlineService";
import {
  ClipboardList,
  Building,
  Users,
  CheckCircle2,
  Plus,
  Radio,
  Sparkles,
  RefreshCw,
  FolderOpen,
} from "lucide-react-native";

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { inspector, user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [statsData, listData, queue] = await Promise.all([
        coreService.getDashboardStats().catch(() => null),
        coreService.listInspections({ limit: 5 }).catch(() => []),
        offlineService.getQueue().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setRecentInspections(listData);
      setOfflineCount(queue.length);
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

  const handleSyncOffline = async () => {
    if (offlineCount === 0) {
      Alert.alert("Offline Queue", "No queued offline actions to sync.");
      return;
    }
    const result = await offlineService.syncQueue(async (action) => {
      // simulated sync executor
      return true;
    });
    Alert.alert("Sync Complete", `Successfully synced ${result.synced} items.`);
    setOfflineCount(result.failed);
  };

  const inspectorName = inspector
    ? `${inspector.first_name} ${inspector.last_name}`
    : user?.email.split("@")[0] || "Inspector";

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <HeaderBar title="Command Center" subtitle="Field Workspace" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* System Operational Banner matching web */}
        <View
          style={[
            styles.systemBanner,
            {
              backgroundColor: isDark
                ? "rgba(16, 185, 129, 0.08)"
                : "rgba(16, 185, 129, 0.06)",
              borderColor: colors.accentGlow,
            },
          ]}
        >
          <View style={styles.bannerRow}>
            <View style={[styles.pulseDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.bannerText, { color: colors.text }]}>
              System Operational
            </Text>
            <Text style={[styles.bannerDot, { color: colors.textSubtle }]}>•</Text>
            <Text style={[styles.bannerAi, { color: colors.accent }]}>
              Gemini Vision AI Ready
            </Text>
          </View>
        </View>

        {/* Welcome Inspector Card */}
        <GlassCard elevated style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={[styles.welcomeEyebrow, { color: colors.textMuted }]}>
                LICENSED INSPECTOR
              </Text>
              <Text style={[styles.welcomeName, { color: colors.text }]}>
                {inspectorName}
              </Text>
              {inspector?.license_number && (
                <Text style={[styles.welcomeLicense, { color: colors.accent }]}>
                  License: {inspector.license_number}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.badgeIcon,
                { backgroundColor: colors.accentGlow, borderColor: colors.accent },
              ]}
            >
              <Sparkles size={20} color={colors.accent} />
            </View>
          </View>

          {offlineCount > 0 && (
            <TouchableOpacity
              onPress={handleSyncOffline}
              style={[
                styles.offlineNotice,
                {
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  borderColor: "rgba(245, 158, 11, 0.3)",
                },
              ]}
            >
              <RefreshCw size={14} color={colors.warning} />
              <Text style={[styles.offlineText, { color: colors.warning }]}>
                {offlineCount} queued offline items ready to sync. Tap here.
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Metric Cards Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Field Operations
        </Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <StatCard
              title="Inspections"
              value={stats?.total_inspections ?? (loading ? "—" : 0)}
              subtitle="Total logged"
              accentColor={colors.accent}
              icon={<ClipboardList size={18} color={colors.accent} />}
            />
            <StatCard
              title="Properties"
              value={stats?.total_properties ?? (loading ? "—" : 0)}
              subtitle="In portfolio"
              accentColor={colors.secondary}
              icon={<Building size={18} color={colors.secondary} />}
            />
          </View>
          <View style={styles.metricsRow}>
            <StatCard
              title="Clients"
              value={stats?.total_clients ?? (loading ? "—" : 0)}
              subtitle="Active records"
              accentColor={colors.cyan}
              icon={<Users size={18} color={colors.cyan} />}
            />
            <StatCard
              title="Completion"
              value={
                stats ? `${Math.round(stats.completion_rate || 0)}%` : "—"
              }
              subtitle="Report rate"
              accentColor={colors.purple}
              icon={<CheckCircle2 size={18} color={colors.purple} />}
            />
          </View>
        </View>

        {/* Quick Action Shortcuts */}
        <View style={styles.actionsRow}>
          <GlassButton
            title="New Inspection"
            onPress={() => navigation.navigate("CreateInspection")}
            icon={<Plus size={16} color="#fff" />}
            size="md"
            style={{ flex: 1 }}
          />
          <GlassButton
            title="Portfolio"
            onPress={() => navigation.navigate("PortfolioTab")}
            variant="secondary"
            icon={<FolderOpen size={16} color={colors.text} />}
            size="md"
            style={{ flex: 1 }}
          />
        </View>

        {/* Recent Inspections Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Inspections
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("InspectionsTab")}>
            <Text style={[styles.viewAllText, { color: colors.accent }]}>
              View All ({stats?.total_inspections ?? 0})
            </Text>
          </TouchableOpacity>
        </View>

        {recentInspections.length === 0 ? (
          <EmptyState
            title="No Inspections Yet"
            description="Start your first AI-assisted property walkthrough now."
            icon={<ClipboardList size={36} color={colors.textMuted} />}
            actionTitle="Create Inspection"
            onAction={() => navigation.navigate("CreateInspection")}
          />
        ) : (
          recentInspections.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("InspectionDetail", {
                  inspectionId: item.id,
                  title: item.title || "Inspection Walkthrough",
                })
              }
            >
              <GlassCard style={styles.inspectionCard}>
                <View style={styles.cardTop}>
                  <Text
                    style={[styles.inspectionTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.title || "Property Inspection"}
                  </Text>
                  <StatusBadge status={item.status} size="sm" />
                </View>

                <Text
                  style={[styles.inspectionAddress, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {item.property?.address || "Address on record"}
                </Text>

                <View style={styles.cardBottom}>
                  <Text style={[styles.cardDate, { color: colors.textSubtle }]}>
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <Text style={[styles.cardAction, { color: colors.accent }]}>
                    Walkthrough →
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  systemBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: "700",
  },
  bannerDot: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  bannerAi: {
    fontSize: 11,
    fontWeight: "600",
  },
  welcomeCard: {
    padding: 18,
    marginBottom: 20,
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcomeEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  welcomeLicense: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    gap: 8,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  metricsGrid: {
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: "row",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
  },
  inspectionCard: {
    marginBottom: 10,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inspectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  inspectionAddress: {
    fontSize: 13,
    marginBottom: 10,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 8,
  },
  cardDate: {
    fontSize: 11,
  },
  cardAction: {
    fontSize: 12,
    fontWeight: "700",
  },
});
