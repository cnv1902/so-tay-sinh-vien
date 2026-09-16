import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { useHandbookDetail } from '../../features/handbook/useHandbook';
import { HANDBOOK_CATEGORIES } from '../../types/document';
import { colors, radius, spacing, typography, shadows } from '../../design';
import { htmlToMarkdown } from '../../utils/htmlUtils';

export default function HandbookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { document, isLoading, error } = useHandbookDetail(id as string);

  const currentLocale = (i18n.language || 'vi').startsWith('en')
    ? 'en-US'
    : (i18n.language || 'vi').startsWith('lo')
    ? 'lo-LA'
    : 'vi-VN';

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('handbook.loadingDoc')}</Text>
      </View>
    );
  }

  if (error || !document) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{t('handbook.errorDoc')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryConfig = HANDBOOK_CATEGORIES.find(c => c.id === document.doc_type) || {
    id: 'khac',
    label: 'Tài liệu',
    icon: 'document-text-outline'
  };

  const categoryLabel = document.doc_type
    ? t(`handbook.categories.${document.doc_type}` as any, { defaultValue: categoryConfig.label })
    : categoryConfig.label;

  const formattedDate = new Date(document.created_at).toLocaleDateString(currentLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Markdown content
  const markdownContent = document.full_content 
    ? htmlToMarkdown(document.full_content)
    : `### ${document.filename}\n\n*${t('handbook.emptyDocContent')}*`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={styles.navBackBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {document.filename}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content Viewer */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Document Metadata Header Card */}
        <View style={styles.metaCard}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Ionicons name={categoryConfig.icon as any} size={14} color={colors.primary} />
              <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
            </View>
            {document.year && (
              <View style={styles.yearBadge}>
                <Text style={styles.yearBadgeText}>{t('handbook.yearPrefix')} {document.year}</Text>
              </View>
            )}
          </View>

          <Text style={styles.docTitle}>{document.filename}</Text>

          <View style={styles.metaDetailsRow}>
            <View style={styles.metaDetailItem}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaDetailText}>{t('common.updatedAt')}: {formattedDate}</Text>
            </View>
            <View style={styles.metaDetailItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
              <Text style={[styles.metaDetailText, { color: '#10B981', fontWeight: '600' }]}>{t('common.approved')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentDivider} />

        {/* Rich Markdown Reader */}
        <View style={styles.markdownWrapper}>
          <Markdown style={markdownStyles}>
            {markdownContent}
          </Markdown>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1E293B',
  },
  heading1: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 18,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 14,
    lineHeight: 25,
  },
  strong: {
    fontWeight: '700',
    color: '#0F172A',
  },
  em: {
    fontStyle: 'italic',
  },
  blockquote: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 12,
    borderRadius: 4,
  },
  code_inline: {
    backgroundColor: '#F1F5F9',
    color: '#E11D48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    padding: 14,
    borderRadius: radius.md,
    marginVertical: 12,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  list_item: {
    marginBottom: 6,
    flexDirection: 'row',
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    marginVertical: 14,
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  th: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F1F5F9',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  td: {
    flex: 1,
    padding: 10,
    color: colors.textPrimary,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: typography.size.md,
    color: colors.error,
    fontWeight: '600',
  },
  backButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  metaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  yearBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  yearBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  docTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  metaDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  metaDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDetailText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  contentDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  markdownWrapper: {
    paddingHorizontal: 4,
  },
});
