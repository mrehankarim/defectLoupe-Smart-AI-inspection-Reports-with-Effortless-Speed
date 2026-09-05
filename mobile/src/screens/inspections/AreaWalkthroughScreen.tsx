import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { useTheme } from "../../context/ThemeContext";
import { HeaderBar } from "../../components/HeaderBar";
import { GlassCard } from "../../components/GlassCard";
import { GlassButton } from "../../components/GlassButton";
import { GlassInput } from "../../components/GlassInput";
import { SeverityBadge } from "../../components/SeverityBadge";
import { EmptyState } from "../../components/EmptyState";
import {
  mediaService,
  AreaPhoto,
  AreaObservation,
} from "../../services/mediaService";
import {
  aiReportService,
  PhotoAnalysisResult,
  DefectItem,
} from "../../services/aiReportService";
import { getErrorMessage } from "../../services/api";
import {
  Camera,
  Image as ImageIcon,
  Mic,
  Square,
  Sparkles,
  Trash2,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Volume2,
} from "lucide-react-native";

export const AreaWalkthroughScreen: React.FC<{
  route: any;
  navigation: any;
}> = ({ route, navigation }) => {
  const { inspectionId, areaId, areaName } = route.params;
  const { colors, isDark } = useTheme();

  const [photos, setPhotos] = useState<AreaPhoto[]>([]);
  const [observations, setObservations] = useState<AreaObservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Uploading / Capturing
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [textNote, setTextNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Audio recording
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Vision AI state
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<
    Record<string, PhotoAnalysisResult>
  >({});

  const loadMedia = useCallback(async () => {
    try {
      const [photoList, obsList] = await Promise.all([
        mediaService.listAreaPhotos(areaId).catch(() => []),
        mediaService.listAreaObservations(areaId).catch(() => []),
      ]);
      setPhotos(photoList);
      setObservations(obsList);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Handle Photo Capture from Camera
  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera permission is required to capture defect photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingPhoto(true);
        try {
          const uploaded = await mediaService.uploadPhoto(areaId, asset.uri);
          setPhotos((prev) => [uploaded, ...prev]);
          Alert.alert("Photo Uploaded", "Would you like to analyze this photo with Gemini Vision AI?", [
            { text: "Later", style: "cancel" },
            {
              text: "Analyze Now",
              onPress: () => handleAnalyzePhoto(uploaded.id),
            },
          ]);
        } catch (err) {
          Alert.alert("Upload Failed", getErrorMessage(err));
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (err) {
      Alert.alert("Camera Error", getErrorMessage(err));
    }
  };

  // Handle Photo from Library
  const handlePickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Photo library permission is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingPhoto(true);
        try {
          const uploaded = await mediaService.uploadPhoto(areaId, asset.uri);
          setPhotos((prev) => [uploaded, ...prev]);
        } catch (err) {
          Alert.alert("Upload Failed", getErrorMessage(err));
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (err) {
      Alert.alert("Picker Error", getErrorMessage(err));
    }
  };

  // Delete Photo
  const handleDeletePhoto = (photoId: string) => {
    Alert.alert("Delete Photo", "Remove this inspection photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await mediaService.deletePhoto(photoId);
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
          } catch (err) {
            Alert.alert("Error", getErrorMessage(err));
          }
        },
      },
    ]);
  };

  // Analyze Photo with Gemini Vision
  const handleAnalyzePhoto = async (photoId: string) => {
    setAnalyzingPhotoId(photoId);
    try {
      const result = await aiReportService.analyzePhoto(photoId);
      setPhotoAnalysis((prev) => ({ ...prev, [photoId]: result }));
      Alert.alert("Analysis Complete", result.summary || `Identified ${result.defects?.length || 0} defects.`);
    } catch (err) {
      Alert.alert("AI Analysis Failed", getErrorMessage(err));
    } finally {
      setAnalyzingPhotoId(null);
    }
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Microphone Permission", "Audio recording requires microphone permission.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordDuration(0);
    } catch (err) {
      Alert.alert("Audio Error", "Could not start audio recording.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        setUploadingAudio(true);
        try {
          const obs = await mediaService.uploadVoiceObservation({
            area_id: areaId,
            audioUri: uri,
          });
          setObservations((prev) => [obs, ...prev]);

          // Trigger speech-to-text
          mediaService.triggerTranscription(obs.id).catch(() => {});
          Alert.alert("Voice Note Saved", "Audio recorded. AI transcription queued.");
        } catch (uploadErr) {
          Alert.alert("Upload Failed", getErrorMessage(uploadErr));
        } finally {
          setUploadingAudio(false);
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not complete audio recording.");
    }
  };

  // Add Text Observation
  const handleSaveTextNote = async () => {
    if (!textNote.trim()) return;
    setSavingNote(true);
    try {
      const obs = await mediaService.addTextObservation({
        area_id: areaId,
        text: textNote.trim(),
      });
      setObservations((prev) => [obs, ...prev]);
      setTextNote("");
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <HeaderBar
        title={areaName}
        subtitle="Walkthrough Zone"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Action Capture Bar */}
        <GlassCard elevated style={styles.captureCard}>
          <Text style={[styles.captureHeading, { color: colors.text }]}>
            Capture Defect Evidence
          </Text>
          <Text style={[styles.captureDesc, { color: colors.textMuted }]}>
            Take photos and record voice notes directly in {areaName}
          </Text>

          <View style={styles.captureButtonsRow}>
            <GlassButton
              title="Camera"
              onPress={handleTakePhoto}
              loading={uploadingPhoto}
              icon={<Camera size={16} color="#fff" />}
              size="md"
              style={{ flex: 1 }}
            />
            <GlassButton
              title="Library"
              onPress={handlePickPhoto}
              variant="secondary"
              icon={<ImageIcon size={16} color={colors.text} />}
              size="md"
              style={{ flex: 1 }}
            />
          </View>

          {/* Voice Recorder Button */}
          <View style={styles.voiceSection}>
            {isRecording ? (
              <TouchableOpacity
                onPress={stopRecording}
                style={[
                  styles.recordingBtn,
                  {
                    backgroundColor: "rgba(244, 63, 94, 0.15)",
                    borderColor: colors.danger,
                  },
                ]}
              >
                <View
                  style={[styles.recIndicator, { backgroundColor: colors.danger }]}
                />
                <Text style={[styles.recText, { color: colors.danger }]}>
                  Recording... Tap to Stop & Save
                </Text>
                <Square size={16} color={colors.danger} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startRecording}
                disabled={uploadingAudio}
                style={[
                  styles.voiceRecordBtn,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                {uploadingAudio ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <Mic size={16} color={colors.accent} />
                    <Text style={[styles.voiceBtnText, { color: colors.text }]}>
                      Hold or Tap to Record Voice Note
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Photos Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Photos ({photos.length})
          </Text>
        </View>

        {photos.length === 0 ? (
          <EmptyState
            title="No Photos Captured"
            description="Take a photo with the camera to log defects and run Vision AI analysis."
            icon={<Camera size={32} color={colors.textMuted} />}
          />
        ) : (
          photos.map((photo) => {
            const analysis = photoAnalysis[photo.id] || photo.defect_labels;
            const isAnalyzing = analyzingPhotoId === photo.id;

            return (
              <GlassCard key={photo.id} style={styles.photoCard}>
                <Image
                  source={{ uri: photo.file_url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />

                <View style={styles.photoActionsRow}>
                  <GlassButton
                    title={isAnalyzing ? "Analyzing..." : "Vision AI Analyze"}
                    onPress={() => handleAnalyzePhoto(photo.id)}
                    loading={isAnalyzing}
                    variant="ai"
                    size="sm"
                    icon={<Sparkles size={13} color="#fff" />}
                  />
                  <TouchableOpacity
                    onPress={() => handleDeletePhoto(photo.id)}
                    style={styles.trashBtn}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                {/* AI Analysis Findings Banner */}
                {analysis && (
                  <View
                    style={[
                      styles.findingsBox,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.findingsHeader}>
                      <Sparkles size={14} color={colors.secondary} />
                      <Text
                        style={[styles.findingsTitle, { color: colors.text }]}
                      >
                        Gemini Vision Analysis
                      </Text>
                    </View>

                    {analysis.summary && (
                      <Text
                        style={[styles.findingsSummary, { color: colors.textMuted }]}
                      >
                        {analysis.summary}
                      </Text>
                    )}

                    {analysis.defects?.map((defect: DefectItem, dIdx: number) => (
                      <View key={dIdx} style={styles.defectRow}>
                        <View style={styles.defectHeader}>
                          <Text
                            style={[
                              styles.defectCategory,
                              { color: colors.text },
                            ]}
                          >
                            {defect.category || "Defect"}
                          </Text>
                          <SeverityBadge severity={defect.severity} />
                        </View>
                        <Text
                          style={[
                            styles.defectDesc,
                            { color: colors.textMuted },
                          ]}
                        >
                          {defect.description}
                        </Text>
                        {defect.remediation && (
                          <Text
                            style={[
                              styles.defectRemedy,
                              { color: colors.accent },
                            ]}
                          >
                            Fix: {defect.remediation}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>
            );
          })
        )}

        {/* Written Observation Notes */}
        <Text
          style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}
        >
          Observations & Notes ({observations.length})
        </Text>

        <GlassCard style={styles.addNoteCard}>
          <GlassInput
            placeholder="Type field observation note..."
            value={textNote}
            onChangeText={setTextNote}
            multiline
            numberOfLines={2}
            style={{ height: 60, textAlignVertical: "top" }}
          />
          <GlassButton
            title="Attach Note"
            onPress={handleSaveTextNote}
            loading={savingNote}
            size="sm"
            style={{ alignSelf: "flex-end" }}
          />
        </GlassCard>

        {observations.map((obs) => (
          <GlassCard key={obs.id} style={styles.obsCard}>
            <View style={styles.obsHeader}>
              <View style={styles.obsTypeRow}>
                {obs.note_type === "voice" ? (
                  <Volume2 size={15} color={colors.secondary} />
                ) : (
                  <FileText size={15} color={colors.accent} />
                )}
                <Text style={[styles.obsTypeText, { color: colors.text }]}>
                  {obs.note_type === "voice" ? "Voice Observation" : "Text Note"}
                </Text>
              </View>
              <Text style={[styles.obsDate, { color: colors.textSubtle }]}>
                {new Date(obs.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <Text style={[styles.obsContent, { color: colors.textMuted }]}>
              {obs.transcription?.text || obs.content || "Processing speech-to-text..."}
            </Text>
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 50 },
  captureCard: {
    padding: 16,
    marginBottom: 20,
  },
  captureHeading: {
    fontSize: 16,
    fontWeight: "700",
  },
  captureDesc: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  captureButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  voiceSection: {
    marginTop: 4,
  },
  voiceRecordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  voiceBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  recordingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  recIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  photoCard: {
    padding: 12,
    marginBottom: 14,
  },
  photoImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#1e293b",
  },
  photoActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  trashBtn: {
    padding: 8,
  },
  findingsBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  findingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  findingsTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  findingsSummary: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  defectRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  defectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  defectCategory: {
    fontSize: 13,
    fontWeight: "700",
  },
  defectDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  defectRemedy: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  addNoteCard: {
    padding: 12,
    marginBottom: 12,
  },
  obsCard: {
    padding: 12,
    marginBottom: 8,
  },
  obsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  obsTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  obsTypeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  obsDate: {
    fontSize: 11,
  },
  obsContent: {
    fontSize: 13,
    lineHeight: 18,
  },
});
