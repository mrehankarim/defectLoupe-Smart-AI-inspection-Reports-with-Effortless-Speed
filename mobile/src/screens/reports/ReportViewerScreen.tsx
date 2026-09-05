import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Share,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { HeaderBar } from "../../components/HeaderBar";
import { GlassCard } from "../../components/GlassCard";
import { GlassButton } from "../../components/GlassButton";
import { SeverityBadge } from "../../components/SeverityBadge";
import {
  aiReportService,
  ReportJobStatus,
  ReportStructuredData,
} from "../../services/aiReportService";
import { getErrorMessage } from "../../services/api";
import {
  Sparkles,
  FileText,
  CheckCircle,
  Share2,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  ExternalLink,
} from "lucide-react-native";

export const ReportViewerScreen: React.FC<{
  route: any;
  navigation: any;
}> = ({ route, navigation }) => {
  const { inspectionId } = route.params;
  const { colors, isDark } = useTheme();

  const [jobStatus, setJobStatus] = useState<ReportJobStatus | null>(null);
  const [reportData, setReportData] = useState<ReportStructuredData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  const fetchStatusAndReport = useCallback(async () => {
    try {
      const status = await aiReportService.getReportStatus(inspectionId).catch(() => null);
      setJobStatus(status);

      if (status?.status === "READY") {
        const data = await aiReportService.getReportJson(inspectionId).catch(() => null);
        setReportData(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    fetchStatusAndReport();
  }, [fetchStatusAndReport]);

  // Poll while processing
  useEffect(() => {
    if (jobStatus?.status === "PROCESSING" || jobStatus?.status === "QUEUED") {
      const interval = setInterval(() => {
        fetchStatusAndReport();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [jobStatus?.status, fetchStatusAndReport]);

  const handleTriggerReport = async () => {
    setGenerating(true);
    try {
      const status = await aiReportService.triggerReportGeneration(inspectionId);
      setJobStatus(status);
      Alert.alert(
        "Synthesis Started",
        "Vision AI & RAG are compiling findings, defect labels, and executive narrative."
      );
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleShareReport = async () => {
    const pdfUrl = aiReportService.getReportPdfUrl(inspectionId);
    try {
      await Share.share({
        title: "DefectLoupe Property Inspection Report",
        message: `View complete technical property inspection report: ${pdfUrl}`,
        url: pdfUrl,
      });
    } catch {}
  };

  const handleVerifyReport = async () => {
    const token = reportData?.verify_token || jobStatus?.verify_token;
    if (!token) {
      Alert.alert("Token", "Verification token is generated upon report completion.");
      return;
    }
    try {
      const res = await aiReportService.verifyReportToken(token);
      setVerifiedData(res);
      Alert.alert("Verified", "This report is digitally signed and authentic on DefectLoupe.");
    } catch (err) {
      Alert.alert("Notice", getErrorMessage(err));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <HeaderBar
        title="AI Report Synthesis"
        subtitle="Final Deliverable"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          jobStatus?.status === "READY" ? (
            <TouchableOpacity onPress={handleShareReport} style={styles.shareBtn}>
              <Share2 size={16} color={colors.accent} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <GlassCard elevated style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <Sparkles size={24} color={colors.secondary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {jobStatus?.status === "READY"
                  ? "Report Ready & Verified"
                  : jobStatus?.status === "PROCESSING"
                  ? "Synthesizing Report..."
                  : "AI Technical Report"}
              </Text>
              <Text style={[styles.statusSub, { color: colors.textMuted }]}>
                {jobStatus?.status === "READY"
                  ? "Generated using Gemini Vision AI and RAG technical standards."
                  : jobStatus?.status === "PROCESSING"
                  ? "Analyzing defect photos and transcribing notes."
                  : "Ready to aggregate field photos, voice notes, and defect ratings."}
              </Text>
            </View>
          </View>

          {jobStatus?.status === "PROCESSING" && (
            <View style={styles.processingBar}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={[styles.procText, { color: colors.secondary }]}>
                Compiling multi-area findings & severity matrix...
              </Text>
            </View>
          )}

          {jobStatus?.status !== "PROCESSING" && (
            <View style={styles.btnRow}>
              <GlassButton
                title={
                  jobStatus?.status === "READY"
                    ? "Regenerate AI Report"
                    : "Generate Report Now"
                }
                onPress={handleTriggerReport}
                loading={generating}
                variant="ai"
                size="md"
                style={{ flex: 1 }}
                icon={<Sparkles size={15} color="#fff" />}
              />
              <GlassButton
                title="Refresh"
                onPress={fetchStatusAndReport}
                variant="outline"
                size="md"
                icon={<RefreshCw size={14} color={colors.text} />}
              />
            </View>
          )}
        </GlassCard>

        {/* REPORT SUMMARY CONTENT */}
        {reportData && (
          <>
            {/* Severity Matrix Card */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Defect Severity Matrix
            </Text>
            <View style={styles.matrixRow}>
              <GlassCard style={[styles.matrixCard, { borderColor: colors.danger }]}>
                <Text style={[styles.matrixNum, { color: colors.danger }]}>
                  {reportData.severity_matrix?.critical ?? 0}
                </Text>
                <Text style={[styles.matrixLabel, { color: colors.danger }]}>
                  CRITICAL
                </Text>
              </GlassCard>

              <GlassCard style={[styles.matrixCard, { borderColor: colors.warning }]}>
                <Text style={[styles.matrixNum, { color: colors.warning }]}>
                  {reportData.severity_matrix?.high ?? 0}
                </Text>
                <Text style={[styles.matrixLabel, { color: colors.warning }]}>
                  HIGH
                </Text>
              </GlassCard>

              <GlassCard style={[styles.matrixCard, { borderColor: "#fbb024" }]}>
                <Text style={[styles.matrixNum, { color: "#fbb024" }]}>
                  {reportData.severity_matrix?.medium ?? 0}
                </Text>
                <Text style={[styles.matrixLabel, { color: "#fbb024" }]}>
                  MEDIUM
                </Text>
              </GlassCard>

              <GlassCard style={[styles.matrixCard, { borderColor: colors.accent }]}>
                <Text style={[styles.matrixNum, { color: colors.accent }]}>
                  {reportData.severity_matrix?.low ?? 0}
                </Text>
                <Text style={[styles.matrixLabel, { color: colors.accent }]}>
                  LOW
                </Text>
              </GlassCard>
            </View>

            {/* Executive Summary */}
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.text, marginTop: 18 },
              ]}
            >
              Executive Summary
            </Text>
            <GlassCard style={styles.narrativeCard}>
              <Text style={[styles.narrativeText, { color: colors.text }]}>
                {reportData.executive_summary ||
                  "The property inspection was conducted according to standard operating guidelines. Observations and defect evidence were captured across walkthrough zones."}
              </Text>
            </GlassCard>

            {/* Actionable Recommendations */}
            {reportData.recommendations && reportData.recommendations.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: colors.text, marginTop: 18 },
                  ]}
                >
                  Key Remediation Steps
                </Text>
                <GlassCard style={styles.narrativeCard}>
                  {reportData.recommendations.map((rec, rIdx) => (
                    <View key={rIdx} style={styles.recItemRow}>
                      <CheckCircle size={14} color={colors.accent} />
                      <Text style={[styles.recItemText, { color: colors.text }]}>
                        {rec}
                      </Text>
                    </View>
                  ))}
                </GlassCard>
              </>
            )}

            {/* Public Verification Badge */}
            <GlassCard style={styles.verifyCard}>
              <View style={styles.verifyHeader}>
                <ShieldCheck size={20} color={colors.accent} />
                <Text style={[styles.verifyTitle, { color: colors.text }]}>
                  Verified by DefectLoupe
                </Text>
              </View>
              <Text style={[styles.verifyDesc, { color: colors.textMuted }]}>
                Scan QR or click below to check the tamper-proof cryptographic audit trail.
              </Text>
              <GlassButton
                title="Verify Authenticity"
                onPress={handleVerifyReport}
                variant="outline"
                size="sm"
                icon={<ExternalLink size={13} color={colors.text} />}
                style={{ marginTop: 8 }}
              />
            </GlassCard>

            {/* Share / Open PDF */}
            <GlassButton
              title="Share PDF Report"
              onPress={handleShareReport}
              variant="primary"
              size="lg"
              icon={<Share2 size={16} color="#fff" />}
              style={styles.shareFullBtn}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 50 },
  shareBtn: {
    padding: 8,
  },
  statusCard: {
    padding: 18,
    marginBottom: 20,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  statusSub: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  processingBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  procText: {
    fontSize: 12,
    fontWeight: "600",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  matrixRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  matrixCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  matrixNum: {
    fontSize: 22,
    fontWeight: "800",
  },
  matrixLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  narrativeCard: {
    padding: 16,
    marginBottom: 10,
  },
  narrativeText: {
    fontSize: 13,
    lineHeight: 20,
  },
  recItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  recItemText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  verifyCard: {
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  verifyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  verifyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  verifyDesc: {
    fontSize: 12,
    marginBottom: 8,
  },
  shareFullBtn: {
    marginTop: 10,
  },
});
