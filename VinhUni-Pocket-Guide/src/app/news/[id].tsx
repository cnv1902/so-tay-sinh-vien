import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useNewsDetail } from '../../features/news/useNews';
import { colors, spacing, typography, radius, shadows } from '../../design';
import { htmlToMarkdown } from '../../utils/htmlUtils';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { newsDetail, isLoading, error } = useNewsDetail(id as string);
  const { width } = useWindowDimensions();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !newsDetail) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không thể tải nội dung bài viết.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = new Date(newsDetail.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <View style={styles.container}>
      {/* Floating Back Button */}
      <TouchableOpacity 
        style={styles.floatingBackBtn}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Cover Image */}
        <View style={[styles.coverContainer, { width, height: width * 0.65 }]}>
          <Image
            source={newsDetail.image_url ? { uri: newsDetail.image_url } : require('../../../assets/images/icon.png')}
            style={styles.coverImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.imageOverlay} />
        </View>

        {/* Content Wrapper */}
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>{newsDetail.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
            {newsDetail.is_pinned && (
              <View style={styles.pinBadge}>
                <Ionicons name="pin" size={12} color="#fff" />
                <Text style={styles.pinText}>Đã ghim</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Markdown style={markdownStyles}>
            {htmlToMarkdown(newsDetail.content)}
          </Markdown>
        </View>
      </ScrollView>
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 16,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  blockquote: {
    backgroundColor: '#F1F5F9',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 12,
    borderRadius: 4,
  },
  list_item: {
    marginBottom: 6,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'none',
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: typography.size.md,
    color: colors.error,
    marginBottom: spacing.md,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 50, // SafeArea top roughly
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.medium,
  },
  coverContainer: {
    position: 'relative',
    backgroundColor: colors.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
    // We could use a LinearGradient here for a smooth fade, but for now a simple transparent view is fine
    // as the border top radius of the content wrapper provides the clean cut.
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -24, // Pull up over the image
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.round,
    gap: 4,
  },
  pinText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
});
