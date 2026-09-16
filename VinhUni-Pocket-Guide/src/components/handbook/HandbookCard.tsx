import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography, shadows } from '../../design';
import { HANDBOOK_CATEGORIES, HandbookDocument } from '../../types/document';

interface Props {
  document: HandbookDocument;
  index?: number;
}

// Màu accent theo nhóm danh mục
const CATEGORY_COLORS: Record<string, { icon: string; bg: string; border: string }> = {
  de_an:          { icon: '#1E3A5F', bg: '#EBF0F7', border: 'rgba(30,58,95,0.15)' },
  quy_che:        { icon: '#7B3FA0', bg: '#F2E8FA', border: 'rgba(123,63,160,0.15)' },
  diem_chuan:     { icon: '#C8943A', bg: '#FDF4E7', border: 'rgba(200,148,58,0.20)' },
  huong_dan:      { icon: '#2E6B3E', bg: '#E8F5EC', border: 'rgba(46,107,62,0.15)' },
  hoc_phi:        { icon: '#B45309', bg: '#FEF3C7', border: 'rgba(180,83,9,0.15)' },
  doi_song:       { icon: '#0E7490', bg: '#ECFEFF', border: 'rgba(14,116,144,0.15)' },
  co_so_vat_chat: { icon: '#475569', bg: '#F1F5F9', border: 'rgba(71,85,105,0.15)' },
  thanh_tich:     { icon: '#C8943A', bg: '#FDF4E7', border: 'rgba(200,148,58,0.20)' },
  gioi_thieu:     { icon: '#1E3A5F', bg: '#EBF0F7', border: 'rgba(30,58,95,0.15)' },
  lich_su:        { icon: '#7C3AED', bg: '#EDE9FE', border: 'rgba(124,58,237,0.15)' },
  khac:           { icon: '#475569', bg: '#F1F5F9', border: 'rgba(71,85,105,0.12)' },
};

export default function HandbookCard({ document, index = 0 }: Props) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;

  const currentLocale = (i18n.language || 'vi').startsWith('en')
    ? 'en-US'
    : (i18n.language || 'vi').startsWith('lo')
    ? 'lo-LA'
    : 'vi-VN';

  const categoryConfig = HANDBOOK_CATEGORIES.find(c => c.id === document.doc_type) || {
    id: 'khac',
    label: 'Tài liệu',
    icon: 'document-text-outline',
  };

  const categoryLabel = document.doc_type
    ? t(`handbook.categories.${document.doc_type}` as any, { defaultValue: categoryConfig.label })
    : categoryConfig.label;

  const docType = (document.doc_type || 'khac') as keyof typeof CATEGORY_COLORS;
  const colorSet = CATEGORY_COLORS[docType] ?? CATEGORY_COLORS['khac'];

  const handlePress = () => router.push(`/handbook/${document.id}`);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  const formattedDate = new Date(document.created_at).toLocaleDateString(currentLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: colorSet.icon }]}
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colorSet.bg, borderColor: colorSet.border }]}>
          <Ionicons name={categoryConfig.icon as any} size={22} color={colorSet.icon} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Tags */}
          <View style={styles.tagRow}>
            <View style={[styles.categoryTag, { backgroundColor: colorSet.bg, borderColor: colorSet.border }]}>
              <Text style={[styles.categoryText, { color: colorSet.icon }]}>
                {categoryLabel.toUpperCase()}
              </Text>
            </View>
            {document.year && (
              <View style={styles.yearTag}>
                <Ionicons name="calendar-outline" size={10} color={colors.textTertiary} />
                <Text style={styles.yearText}>{document.year}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {document.filename}
          </Text>

          {/* Footer */}
          <View style={styles.footerRow}>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={11} color={colors.textTertiary} />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <View style={styles.readMore}>
              <Text style={styles.readMoreText}>{t('handbook.readDoc')}</Text>
              <Ionicons name="arrow-forward-circle" size={16} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    ...shadows.small,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  categoryTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.letterSpacing.wider,
  },
  yearTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearText: {
    fontSize: 9,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
    marginBottom: 5,
    letterSpacing: typography.letterSpacing.tight,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
});
