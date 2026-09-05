import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { HeaderBar } from "../../components/HeaderBar";
import { GlassCard } from "../../components/GlassCard";
import { GlassInput } from "../../components/GlassInput";
import { GlassButton } from "../../components/GlassButton";
import { coreService, Property } from "../../services/coreService";
import { getErrorMessage } from "../../services/api";
import { Building, Check, Layers, FileText } from "lucide-react-native";

const DEFAULT_AREAS = [
  "Roof & Gutters",
  "Exterior & Foundation",
  "Kitchen",
  "Master Bathroom",
  "Electrical Panel & HVAC",
  "Attic & Insulation",
];

export const CreateInspectionScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(DEFAULT_AREAS);
  const [loading, setLoading] = useState(false);
  const [fetchingProps, setFetchingProps] = useState(true);

  useEffect(() => {
    coreService
      .listProperties({ limit: 50 })
      .then((props) => {
        setProperties(props);
        if (props.length > 0) {
          setSelectedPropertyId(props[0].id);
          setTitle(`Walkthrough — ${props[0].address}`);
        }
      })
      .catch(() => {})
      .finally(() => setFetchingProps(false));
  }, []);

  const toggleArea = (area: string) => {
    if (selectedAreas.includes(area)) {
      setSelectedAreas(selectedAreas.filter((a) => a !== area));
    } else {
      setSelectedAreas([...selectedAreas, area]);
    }
  };

  const handleSelectProperty = (prop: Property) => {
    setSelectedPropertyId(prop.id);
    if (!title || title.startsWith("Walkthrough —")) {
      setTitle(`Walkthrough — ${prop.address}`);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      Alert.alert(
        "Property Required",
        "Please select an existing property or add one from the Portfolio tab."
      );
      return;
    }

    setLoading(true);
    try {
      const inspection = await coreService.createInspection({
        property_id: selectedPropertyId,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Add selected initial areas
      if (selectedAreas.length > 0) {
        for (let i = 0; i < selectedAreas.length; i++) {
          try {
            await coreService.addArea(inspection.id, selectedAreas[i], i);
          } catch {}
        }
      }

      Alert.alert("Inspection Created", "Ready to start walkthrough.", [
        {
          text: "Start Walkthrough",
          onPress: () => {
            navigation.replace("InspectionDetail", {
              inspectionId: inspection.id,
              title: inspection.title || "Inspection Walkthrough",
            });
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <HeaderBar
        title="New Inspection"
        subtitle="Setup"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step 1: Select Property */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          1. Select Target Property
        </Text>

        {properties.length === 0 ? (
          <GlassCard style={styles.noPropCard}>
            <Text style={[styles.noPropTitle, { color: colors.text }]}>
              No Properties Available
            </Text>
            <Text style={[styles.noPropDesc, { color: colors.textMuted }]}>
              Create a property first or seed demo data.
            </Text>
            <GlassButton
              title="Add Property in Portfolio"
              onPress={() => navigation.navigate("PortfolioTab")}
              size="sm"
              style={{ marginTop: 8 }}
            />
          </GlassCard>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.propList}
          >
            {properties.map((prop) => {
              const isSelected = selectedPropertyId === prop.id;
              return (
                <TouchableOpacity
                  key={prop.id}
                  onPress={() => handleSelectProperty(prop)}
                  activeOpacity={0.8}
                >
                  <GlassCard
                    style={[
                      styles.propCard,
                      isSelected && {
                        borderColor: colors.accent,
                        backgroundColor: colors.surfaceElevated,
                      },
                    ]}
                  >
                    <View style={styles.propIconRow}>
                      <Building
                        size={16}
                        color={isSelected ? colors.accent : colors.textMuted}
                      />
                      {isSelected && (
                        <View
                          style={[
                            styles.checkBadge,
                            { backgroundColor: colors.accent },
                          ]}
                        >
                          <Check size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.propAddress, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {prop.address}
                    </Text>
                    <Text style={[styles.propType, { color: colors.textSubtle }]}>
                      {prop.property_type || "Residential"} •{" "}
                      {prop.year_built || "Built n/a"}
                    </Text>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Step 2: Metadata */}
        <Text
          style={[styles.sectionHeading, { color: colors.text, marginTop: 24 }]}
        >
          2. Inspection Information
        </Text>
        <GlassCard elevated style={styles.metaCard}>
          <GlassInput
            label="Inspection Title"
            placeholder="e.g. Pre-Purchase Walkthrough"
            value={title}
            onChangeText={setTitle}
            leftIcon={<FileText size={16} color={colors.textMuted} />}
          />

          <GlassInput
            label="Initial Inspector Notes"
            placeholder="Client requested special attention to roof leaks and plumbing."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ height: 70, textAlignVertical: "top" }}
          />
        </GlassCard>

        {/* Step 3: Preset Areas */}
        <Text
          style={[styles.sectionHeading, { color: colors.text, marginTop: 24 }]}
        >
          3. Included Walkthrough Areas
        </Text>
        <GlassCard style={styles.areasCard}>
          <Text style={[styles.areaDesc, { color: colors.textMuted }]}>
            Select standard inspection areas to populate automatically:
          </Text>
          <View style={styles.areaChipsWrap}>
            {DEFAULT_AREAS.map((area) => {
              const selected = selectedAreas.includes(area);
              return (
                <TouchableOpacity
                  key={area}
                  onPress={() => toggleArea(area)}
                  style={[
                    styles.areaChip,
                    {
                      backgroundColor: selected
                        ? "rgba(16, 185, 129, 0.15)"
                        : colors.surfaceElevated,
                      borderColor: selected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.chipCheckbox,
                      {
                        backgroundColor: selected ? colors.accent : "transparent",
                        borderColor: selected ? colors.accent : colors.textSubtle,
                      },
                    ]}
                  >
                    {selected && <Check size={10} color="#fff" />}
                  </View>
                  <Text
                    style={[
                      styles.areaChipText,
                      { color: selected ? colors.accent : colors.text },
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Submit */}
        <GlassButton
          title="Create & Start Walkthrough"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  noPropCard: {
    padding: 16,
    alignItems: "center",
  },
  noPropTitle: { fontSize: 14, fontWeight: "600" },
  noPropDesc: { fontSize: 12, marginTop: 4 },
  propList: {
    gap: 12,
    paddingBottom: 4,
  },
  propCard: {
    width: 170,
    padding: 12,
  },
  propIconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  propAddress: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    minHeight: 36,
  },
  propType: {
    fontSize: 11,
    marginTop: 4,
  },
  metaCard: {
    padding: 16,
  },
  areasCard: {
    padding: 16,
  },
  areaDesc: {
    fontSize: 12,
    marginBottom: 12,
  },
  areaChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  areaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  chipCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  submitBtn: {
    marginTop: 24,
  },
});
