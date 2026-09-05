import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { HeaderBar } from "../../components/HeaderBar";
import { GlassCard } from "../../components/GlassCard";
import { GlassInput } from "../../components/GlassInput";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { GlassButton } from "../../components/GlassButton";
import { coreService, Inspection } from "../../services/coreService";
import { Search, Plus, Calendar, MapPin } from "lucide-react-native";

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "report_generated", label: "Report Ready" },
];

export const InspectionsListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  const fetchInspections = useCallback(async () => {
    try {
      const data = await coreService.listInspections({
        status: activeStatus || undefined,
        search: search.trim() || undefined,
      });
      setInspections(data);
    } catch {
      setInspections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStatus, search]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInspections();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <HeaderBar
        title="Inspections"
        subtitle="Operations"
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateInspection")}
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchSection}>
        <GlassInput
          placeholder="Search inspections or addresses..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={16} color={colors.textMuted} />}
          containerStyle={{ marginBottom: 12 }}
        />

        {/* Status Filter Horizontal Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = activeStatus === item.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveStatus(item.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? colors.accent
                      : colors.surfaceElevated,
                    borderColor: isSelected
                      ? colors.accent
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isSelected ? "#ffffff" : colors.textMuted },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={inspections}
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
              title="No Inspections Found"
              description="No inspections match the active status filter or search query."
              actionTitle="New Inspection"
              onAction={() => navigation.navigate("CreateInspection")}
            />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("InspectionDetail", {
                inspectionId: item.id,
                title: item.title || "Inspection Walkthrough",
              })
            }
          >
            <GlassCard elevated style={styles.card}>
              <View style={styles.cardHeader}>
                <Text
                  style={[styles.cardTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.title || "Property Inspection"}
                </Text>
                <StatusBadge status={item.status} size="sm" />
              </View>

              {item.property && (
                <View style={styles.metaRow}>
                  <MapPin size={13} color={colors.textMuted} />
                  <Text
                    style={[styles.metaText, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {item.property.address}
                  </Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.dateRow}>
                  <Calendar size={12} color={colors.textSubtle} />
                  <Text style={[styles.dateText, { color: colors.textSubtle }]}>
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={[styles.viewDetails, { color: colors.accent }]}>
                  View Details →
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
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
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  filterList: {
    paddingBottom: 6,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 10,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  viewDetails: {
    fontSize: 12,
    fontWeight: "700",
  },
});
