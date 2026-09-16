import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '../../design';
import { useTranslation } from 'react-i18next';
import { stripHtml } from '../../utils/htmlUtils';
import type { News } from '../../types/news';

interface Props {
  news: News;
}

export default function NewsCard({ news }: Props) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const currentLocale = (i18n.language || 'vi').startsWith('en')
    ? 'en-US'
    : (i18n.language || 'vi').startsWith('lo')
    ? 'lo-LA'
    : 'vi-VN';

  const handlePress = () => {
    router.push(`/news/${news.id}`);
  };

  // Làm sạch HTML và cắt ngắn đoạn trích
  const snippet = (() => {
    const clean = stripHtml(news.content);
    if (clean.length > 85) return clean.substring(0, 85) + '...';
    return clean;
  })();

  const formattedDate = new Date(news.created_at).toLocaleDateString(currentLocale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={news.image_url ? { uri: news.image_url } : require('../../../assets/images/icon.png')}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        {news.is_pinned && (
          <View style={styles.pinBadge}>
            <Ionicons name="pin" size={12} color="#fff" />
            <Text style={styles.pinText}>{t('news.pinned')}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{news.title}</Text>
        <Text style={styles.snippet} numberOfLines={2}>{snippet}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  imageContainer: {
    width: '100%',
    height: 170, // Giảm 10px từ 180 xuống 170
    backgroundColor: colors.border,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pinBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...shadows.small,
  },
  pinText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    padding: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  snippet: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
