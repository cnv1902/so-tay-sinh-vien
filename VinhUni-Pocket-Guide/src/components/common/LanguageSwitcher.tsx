import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, typography, spacing } from '../../design';
import { changeAppLanguage, SupportedLanguage } from '../../i18n';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'button';
  style?: any;
}

export default function LanguageSwitcher({ variant = 'pill', style }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'vi').startsWith('en')
    ? 'en'
    : (i18n.language || 'vi').startsWith('lo')
    ? 'lo'
    : 'vi';

  const selectLanguage = (lng: SupportedLanguage) => {
    changeAppLanguage(lng);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.pillBox}>
        {/* Vietnamese Tab */}
        <TouchableOpacity
          style={[styles.langItem, currentLang === 'vi' && styles.langItemActive]}
          onPress={() => selectLanguage('vi')}
          activeOpacity={0.7}
        >
          <Text style={[styles.flagText, currentLang === 'vi' && styles.textActive]}>🇻🇳</Text>
          <Text style={[styles.langText, currentLang === 'vi' && styles.textActive]}>VI</Text>
        </TouchableOpacity>

        {/* English Tab */}
        <TouchableOpacity
          style={[styles.langItem, currentLang === 'en' && styles.langItemActive]}
          onPress={() => selectLanguage('en')}
          activeOpacity={0.7}
        >
          <Text style={[styles.flagText, currentLang === 'en' && styles.textActive]}>🇬🇧</Text>
          <Text style={[styles.langText, currentLang === 'en' && styles.textActive]}>EN</Text>
        </TouchableOpacity>

        {/* Lao Tab */}
        <TouchableOpacity
          style={[styles.langItem, currentLang === 'lo' && styles.langItemActive]}
          onPress={() => selectLanguage('lo')}
          activeOpacity={0.7}
        >
          <Text style={[styles.flagText, currentLang === 'lo' && styles.textActive]}>🇱🇦</Text>
          <Text style={[styles.langText, currentLang === 'lo' && styles.textActive]}>LO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    padding: 3,
    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    gap: 4,
  },
  langItemActive: {
    backgroundColor: colors.primary,
    ...shadows.small,
  },
  flagText: {
    fontSize: 12,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  textActive: {
    color: '#FFFFFF',
  },
});
