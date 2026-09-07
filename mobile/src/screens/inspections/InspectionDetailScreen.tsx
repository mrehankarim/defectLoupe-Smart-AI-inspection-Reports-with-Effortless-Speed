import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { HeaderBar } from "../../components/HeaderBar";
import { GlassCard } from "../../components/GlassCard";
import { StatusBadge } from "../../components/StatusBadge";
import { GlassButton } from "../../components/GlassButton";
import { GlassInput } from "../../components/GlassInput";
import { EmptyState } from "../../components/EmptyState";
import {
  coreService,
  Inspection,
  InspectionArea,
} from "../../services/coreService";
import { mediaService, AreaPhoto, AreaObservation } from "../../services/mediaService";
import { aiReportService } from "../../services/aiReportService";
import { getErrorMessage } from "../../services/api";
import {
  Layers,
  Camera,
  Mic,
  FileCheck,
  Plus,
  Play,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Trash2,
  Edit2,
  Image as ImageIcon,
} from "lucide-react-native";

export const InspectionDetailScreen: React.FC<{
  route: any;
  navigation: any;
}> = ({ route, navigation }) => {
  const { inspectionId, title: initialTitle } = route.params;
  const { colors, isDark } = useTheme();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [areas, setAreas] = useState<InspectionArea[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"areas" | "media" | "report">("areas");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Area modal
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [addingArea, setAddingArea] = useState(false);

  // Edit Area modal
  const [showEditAreaModal, setShowEditAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<InspectionArea | null>(null);
  const [editAreaName, setEditAreaName] = useState("");
  const [updatingArea, setUpdatingArea] = useState(false);

  // State transitions
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadInspectionData = useCallback(async () => {
    try {
      const [insp, areaList, mediaList] = await Promise.all([
        coreService.getInspection(inspectionId).catch(() => null),
        coreService.listAreas(inspectionId).catch(() => []),
        mediaService.getInspectionMedia(inspectionId).catch(() => []),
      ]);

      if (insp) setInspection(insp);
      setAreas(areaList);
      setMedia(mediaList);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    loadInspectionData();
  }, [loadInspectionData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInspectionData();
  };

  const handleStatusTransition = async (nextStatus: Inspection["status"]) => {
    setUpdatingStatus(true);
    try {
      const updated = await coreService.updateInspectionStatus(
        inspectionId,
        nextStatus
      );
      setInspection(updated);
      Alert.alert("Status Updated", `Inspection is now marked as ${nextStatus.replace("_", " ")}.`);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddArea = async () => {
    if (!newAreaName.trim()) return;
    setAddingArea(true);
    try {
      await coreService.addArea(inspectionId, newAreaName.trim(), areas.length);
      setNewAreaName("");
      setShowAddAreaModal(false);
      loadInspectionData();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setAddingArea(false);
    }
  };

  const handleUpdateArea = async () => {
    if (!editingArea || !editAreaName.trim()) return;
    setUpdatingArea(true);
    try {
      await coreService.updateArea(editingArea.id, editAreaName.trim());
      setShowEditAreaModal(false);
      setEditingArea(null);
      setEditAreaName("");
      loadInspectionData();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setUpdatingArea(false);
    }
  };

  const handleDeleteArea = (areaId: string, areaName: string) => {
    const doDelete = async () => {
      try {
        await coreService.deleteArea(areaId);
        loadInspectionData();
      } catch (err) {
        Alert.alert("Error", getErrorMessage(err));
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm(`Are you sure you want to remove "${areaName}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Delete Area",
        `Are you sure you want to remove "${areaName}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  // Determine transition buttons
  const renderStatusActions = () => {
    if (!inspection) return null;

    switch (inspection.status) {
      case "draft":
        return (
          <GlassButton
            title="Schedule Inspection"
            onPress={() => handleStatusTransition("scheduled")}
            loading={updatingStatus}
            size="sm"
            icon={<Play size={13} color="#fff" />}
          />
        );
      case "scheduled":
        return (
          <GlassButton
            title="Start Walkthrough"
            onPress={() => handleStatusTransition("in_progress")}
            loading={updatingStatus}
            size="sm"
            icon={<Play size={13} color="#fff" />}
          />
        );
      case "in_progress":
        return (
          <GlassButton
            title="Mark Completed"
            onPress={() => handleStatusTransition("completed")}
            loading={updatingStatus}
            size="sm"
            icon={<CheckCircle size={13} color="#fff" />}
          />
        );
      case "completed":
        return (
          <GlassButton
            title="Generate AI Report"
            onPress={() =>
              navigation.navigate("ReportViewer", { inspectionId })
            }
            variant="ai"
            size="sm"
            icon={<Sparkles size={13} color="#fff" />}
          />
        );
      case "report_generated":
        return (
          <GlassButton
            title="View Final Report"
            onPress={() =>
              navigation.navigate("ReportViewer", { inspectionId })
            }
            variant="primary"
            size="sm"
            icon={<FileCheck size={13} color="#fff" />}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <HeaderBar
        title={inspection?.title || initialTitle || "Walkthrough"}
        subtitle="Inspection Details"
        showBack
        onBack={() => navigation.goBack()}
      />

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
        {/* Header Summary Card */}
        <GlassCard elevated style={styles.headerCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                {inspection?.title || "Property Inspection"}
              </Text>
              <Text style={[styles.address, { color: colors.textMuted }]}>
                {inspection?.property?.address || "Address on record"}
              </Text>
            </View>
            <StatusBadge status={inspection?.status || "draft"} />
          </View>

          {/* Workflow Action Row */}
          <View
            style={[
              styles.workflowBanner,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.workflowLabel, { color: colors.textSubtle }]}>
                CURRENT PHASE
              </Text>
              <Text style={[styles.workflowStatus, { color: colors.text }]}>
                {(inspection?.status || "draft").toUpperCase().replace("_", " ")}
              </Text>
            </View>
            {renderStatusActions()}
          </View>
        </GlassCard>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab("areas")}
            style={[
              styles.tabItem,
              activeTab === "areas" && {
                borderBottomColor: colors.accent,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Layers
              size={15}
              color={activeTab === "areas" ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "areas" ? colors.accent : colors.textMuted },
              ]}
            >
              Areas ({areas.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("media")}
            style={[
              styles.tabItem,
              activeTab === "media" && {
                borderBottomColor: colors.accent,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Camera
              size={15}
              color={activeTab === "media" ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "media" ? colors.accent : colors.textMuted },
              ]}
            >
              Media Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("report")}
            style={[
              styles.tabItem,
              activeTab === "report" && {
                borderBottomColor: colors.accent,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Sparkles
              size={15}
              color={activeTab === "report" ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "report" ? colors.accent : colors.textMuted,
                },
              ]}
            >
              AI Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: AREAS */}
        {activeTab === "areas" && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Walkthrough Zones
              </Text>
              <GlassButton
                title="Add Area"
                onPress={() => setShowAddAreaModal(true)}
                size="sm"
                icon={<Plus size={13} color="#fff" />}
              />
            </View>

            {areas.length === 0 ? (
              <EmptyState
                title="No Areas Configured"
                description="Add rooms or zones (e.g. Roof, Kitchen) to start capturing photos and voice observations."
                actionTitle="Add First Area"
                onAction={() => setShowAddAreaModal(true)}
              />
            ) : (
              areas.map((area, index) => (
                <TouchableOpacity
                  key={area.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("AreaWalkthrough", {
                      inspectionId,
                      areaId: area.id,
                      areaName: area.name,
                    })
                  }
                >
                  <GlassCard style={styles.areaCard}>
                    <View style={styles.areaTopRow}>
                      <View style={styles.areaTitleRow}>
                        <View
                          style={[
                            styles.areaIndexBadge,
                            { backgroundColor: colors.surfaceElevated },
                          ]}
                        >
                          <Text
                            style={[
                              styles.areaIndexText,
                              { color: colors.textMuted },
                            ]}
                          >
                            {index + 1}
                          </Text>
                        </View>
                        <Text
                          style={[styles.areaName, { color: colors.text }]}
                        >
                          {area.name}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingArea(area);
                            setEditAreaName(area.name);
                            setShowEditAreaModal(true);
                          }}
                          style={styles.deleteAreaBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Edit2 size={15} color={colors.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteArea(area.id, area.name)}
                          style={styles.deleteAreaBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={15} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.areaBottomRow}>
                      <View style={styles.statsChips}>
                        <View
                          style={[
                            styles.chip,
                            { backgroundColor: colors.surfaceElevated },
                          ]}
                        >
                          <Camera size={12} color={colors.textMuted} />
                          <Text
                            style={[
                              styles.chipText,
                              { color: colors.textMuted },
                            ]}
                          >
                            Photos & Voice Notes
                          </Text>
                        </View>
                      </View>

                      <View style={styles.walkthroughAction}>
                        <Text
                          style={[styles.startWalkText, { color: colors.accent }]}
                        >
                          Conduct Walkthrough
                        </Text>
                        <ArrowRight size={13} color={colors.accent} />
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 2: MEDIA GALLERY */}
        {activeTab === "media" && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Captured Media & Observations
            </Text>
            {media.length === 0 ? (
              <EmptyState
                title="No Media Uploaded"
                description="Select an area to take defect photos and record voice observations."
                icon={<Camera size={36} color={colors.textMuted} />}
              />
            ) : (
              media.map((group, idx) => (
                <GlassCard key={idx} style={styles.mediaGroupCard}>
                  <Text style={[styles.groupTitle, { color: colors.text }]}>
                    {group.area_name || `Area ${idx + 1}`}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                    {group.photos?.length || 0} photos •{" "}
                    {group.observations?.length || 0} observations
                  </Text>
                </GlassCard>
              ))
            )}
          </View>
        )}

        {/* TAB 3: REPORT */}
        {activeTab === "report" && (
          <View style={styles.tabContent}>
            <GlassCard elevated style={styles.reportPromoCard}>
              <View style={styles.reportHeader}>
                <Sparkles size={28} color={colors.secondary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.reportTitle, { color: colors.text }]}>
                    Synthesize Technical Report
                  </Text>
                  <Text style={[styles.reportDesc, { color: colors.textMuted }]}>
                    DefectLoupe Vision AI and RAG engine aggregate all findings, photos, and voice notes into an executive report.
                  </Text>
                </View>
              </View>

              <GlassButton
                title="Open AI Report Generator"
                onPress={() =>
                  navigation.navigate("ReportViewer", { inspectionId })
                }
                variant="ai"
                size="lg"
                style={{ marginTop: 16 }}
              />
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Add Area Modal */}
      <Modal
        visible={showAddAreaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddAreaModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard elevated style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Inspection Area
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Enter room or zone name (e.g., "Master Bedroom", "Basement", "Attic")
            </Text>

            <GlassInput
              placeholder="e.g. Attic & Crawlspace"
              value={newAreaName}
              onChangeText={setNewAreaName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <GlassButton
                title="Cancel"
                onPress={() => setShowAddAreaModal(false)}
                variant="outline"
                size="sm"
              />
              <GlassButton
                title="Create Area"
                onPress={handleAddArea}
                loading={addingArea}
                size="sm"
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Edit Area Modal */}
      <Modal
        visible={showEditAreaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditAreaModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard elevated style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Walkthrough Zone
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Update room or area name
            </Text>

            <GlassInput
              placeholder="e.g. Master Bedroom"
              value={editAreaName}
              onChangeText={setEditAreaName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <GlassButton
                title="Cancel"
                onPress={() => setShowEditAreaModal(false)}
                variant="outline"
                size="sm"
              />
              <GlassButton
                title="Save Changes"
                onPress={handleUpdateArea}
                loading={updatingArea}
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  address: {
    fontSize: 13,
    marginTop: 4,
  },
  workflowBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  workflowLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  workflowStatus: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tabContent: {
    paddingBottom: 20,
  },
  tabHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  areaCard: {
    marginBottom: 10,
    padding: 14,
  },
  areaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  areaIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  areaIndexText: {
    fontSize: 11,
    fontWeight: "700",
  },
  areaName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  deleteAreaBtn: {
    padding: 6,
  },
  areaBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  statsChips: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  walkthroughAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  startWalkText: {
    fontSize: 12,
    fontWeight: "700",
  },
  mediaGroupCard: {
    marginBottom: 10,
    padding: 14,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  reportPromoCard: {
    padding: 20,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  reportDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
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
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
});
