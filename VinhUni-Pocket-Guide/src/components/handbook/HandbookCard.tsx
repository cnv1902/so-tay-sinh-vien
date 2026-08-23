import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '../../design';
import { HANDBOOK_CATEGORIES, HandbookDocument } from '../../types/document';

interface Props {
  document: HandbookDocument;
}

export default function HandbookCard({ document }: Props) {
  const router = useRouter();

  const categoryConfig = HANDBOOK_CATEGORIES.find(c => c.id === document.doc_type) || {
    id: 'khac',
    label: 'Tài liệu',
    icon: 'document-text-outline'
  };

  const handlePress = () => {
    router.push(`/handbook/${document.id}`);
  };

  const formattedDate = new Date(document.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.75}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={categoryConfig.icon as any} size={24} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <View style={styles.tagRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{categoryConfig.label}</Text>
          </View>
          {document.year && (
            <View style={styles.yearTag}>
              <Text style={styles.yearText}>Năm {document.year}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>{document.filename}</Text>

        <View style={styles.footerRow}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>Đọc tài liệu</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  yearTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  yearText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readMoreText: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.primary,
  },
});
