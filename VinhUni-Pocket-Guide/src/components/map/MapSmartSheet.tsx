import React, { useRef, useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../design';
import type { Location } from '../../types/location';
import LocationItem from './LocationItem';

type BottomSheetState = 'search' | 'detail' | 'routing';

interface Props {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location | null) => void;
  onDrawRoute: (start: Location | 'USER_LOCATION', end: Location) => void;
  onClearRoute: () => void;
}

export default function MapSmartSheet({
  locations,
  selectedLocation,
  onSelectLocation,
  onDrawRoute,
  onClearRoute,
}: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sheetState, setSheetState] = useState<BottomSheetState>('search');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Routing state
  const [routingStart, setRoutingStart] = useState<Location | 'USER_LOCATION'>('USER_LOCATION');
  const [routingEnd, setRoutingEnd] = useState<Location | null>(null);
  const [activeRoutingInput, setActiveRoutingInput] = useState<'start' | 'end' | null>(null);

  // Computed snap points based on state
  const snapPoints = useMemo(() => {
    switch (sheetState) {
      case 'search': return ['15%', '80%']; // 15% is just the search bar
      case 'detail': return ['38%', '65%'];
      case 'routing': return ['25%', '60%'];
      default: return ['15%', '80%'];
    }
  }, [sheetState]);

  // Sync external props to internal sheet state
  useEffect(() => {
    if (selectedLocation) {
      setSheetState('detail');
      // Always snap to first point in new state
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      // If we are not in routing mode, go back to search
      if (sheetState === 'detail') {
        setSheetState('search');
        bottomSheetRef.current?.snapToIndex(0);
      }
    }
  }, [selectedLocation]);

  // Handle Search Input Focus
  const handleSearchFocus = () => {
    bottomSheetRef.current?.snapToIndex(1); // expand to 80%
  };

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const lowerQ = searchQuery.toLowerCase();
    return locations.filter(l => 
      l.name.toLowerCase().includes(lowerQ) || 
      (l.category && l.category.toLowerCase().includes(lowerQ))
    );
  }, [searchQuery, locations]);

  // Handlers
  const handleSelectSearchLocation = (loc: Location) => {
    Keyboard.dismiss();
    onSelectLocation(loc); // This will trigger useEffect above and change state to 'detail'
  };

  const handleStartRouting = () => {
    setRoutingEnd(selectedLocation);
    setSheetState('routing');
    bottomSheetRef.current?.snapToIndex(0);
    if (selectedLocation) {
      onDrawRoute('USER_LOCATION', selectedLocation);
    }
  };

  const handleCancelRouting = () => {
    onClearRoute();
    setSheetState('search');
    onSelectLocation(null);
    setSearchQuery('');
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleRoutingSearchSelect = (loc: Location | 'USER_LOCATION') => {
    Keyboard.dismiss();
    if (activeRoutingInput === 'start') {
      setRoutingStart(loc);
    } else {
      setRoutingEnd(loc as Location);
    }
    setActiveRoutingInput(null);
    bottomSheetRef.current?.snapToIndex(0); // Snap down to routing summary
    
    // Auto trigger route update if both are set
    // In a real app we need useEffect for this, but doing it here for simplicity
    const newStart = activeRoutingInput === 'start' ? loc : routingStart;
    const newEnd = activeRoutingInput === 'end' ? loc : routingEnd;
    
    if (newStart && newEnd && newEnd !== 'USER_LOCATION') {
      onDrawRoute(newStart, newEnd as Location);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      keyboardBehavior="interactive"
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.contentContainer}>
        
        {/* --- STATE: SEARCH --- */}
        {sheetState === 'search' && (
          <>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm địa điểm..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <BottomSheetFlatList
              data={filteredLocations}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <LocationItem location={item} onPress={() => handleSelectSearchLocation(item)} />
              )}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
            />
          </>
        )}

        {/* --- STATE: DETAIL --- */}
        {sheetState === 'detail' && selectedLocation && (
          <View style={styles.detailContainer}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => onSelectLocation(null)}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.detailHeader}>
              <View style={styles.detailIconBox}>
                <Ionicons name="location" size={26} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle} numberOfLines={2}>{selectedLocation.name}</Text>
                {selectedLocation.phone && (
                  <Text style={styles.detailCategory}>📞 {selectedLocation.phone}</Text>
                )}
              </View>
            </View>
            
            {/* Hộp hiển thị Mô tả */}
            <View style={styles.descBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={styles.detailDesc} numberOfLines={4}>
                {selectedLocation.description || selectedLocation.purpose || 'Chưa có thông tin mô tả chi tiết cho địa điểm này.'}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.navigateBtn} onPress={handleStartRouting}>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.navigateBtnText}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- STATE: ROUTING --- */}
        {sheetState === 'routing' && (
          <View style={styles.routingContainer}>
            {/* Header Routing */}
            <View style={styles.routingHeader}>
              <View style={{width: 40}}/>
              <Text style={styles.routingTitle}>Lộ trình</Text>
              <TouchableOpacity onPress={handleCancelRouting} style={styles.backBtn}>
                <Text style={{color: colors.primary, fontWeight: '600', fontSize: 16}}>Hủy</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View style={styles.routingInputsBox}>
              <View style={styles.routingTimeline}>
                <Ionicons name="ellipse-outline" size={16} color={colors.textSecondary} />
                <View style={styles.timelineLine} />
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              
              <View style={styles.routingInputs}>
                <TouchableOpacity 
                  style={[styles.routeInputItem, activeRoutingInput === 'start' && styles.routeInputActive]}
                  onPress={() => {
                    setActiveRoutingInput('start');
                    bottomSheetRef.current?.snapToIndex(1); // expand
                  }}
                >
                  <Text style={styles.routeInputText}>
                    {routingStart === 'USER_LOCATION' ? 'Vị trí của bạn' : (routingStart?.name || 'Chọn điểm xuất phát')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.routeInputItem, activeRoutingInput === 'end' && styles.routeInputActive]}
                  onPress={() => {
                    setActiveRoutingInput('end');
                    bottomSheetRef.current?.snapToIndex(1); // expand
                  }}
                >
                  <Text style={styles.routeInputText}>
                    {routingEnd?.name || 'Chọn điểm đến'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.swapBtn} onPress={() => {
                if (routingStart !== 'USER_LOCATION' && routingEnd) {
                  setRoutingStart(routingEnd);
                  setRoutingEnd(routingStart as Location);
                  onDrawRoute(routingEnd, routingStart as Location);
                }
              }}>
                <Ionicons name="swap-vertical" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Expanded Search for Routing */}
            {activeRoutingInput && (
              <BottomSheetFlatList
                data={locations}
                keyExtractor={(i) => i.id}
                ListHeaderComponent={
                  activeRoutingInput === 'start' ? (
                    <LocationItem 
                      location={{ id: 'USER_LOCATION', name: 'Vị trí của bạn', description: 'Sử dụng GPS hiện tại', latitude: 0, longitude: 0, category: 'gps' }} 
                      onPress={() => handleRoutingSearchSelect('USER_LOCATION')}
                      isGps
                    />
                  ) : null
                }
                renderItem={({ item }) => (
                  <LocationItem location={item} onPress={() => handleRoutingSearchSelect(item)} />
                )}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        )}

      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    ...shadows.large,
  },
  handleIndicator: {
    backgroundColor: '#CBD5E1',
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  // Search Styles
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  // Detail Styles
  detailContainer: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    padding: spacing.xs,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.round,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingRight: 40,
  },
  detailIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailCategory: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  descBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  detailDesc: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  navigateBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.round,
    ...shadows.medium,
  },
  navigateBtnText: {
    color: '#fff',
    fontSize: typography.size.md,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  // Routing Styles
  routingContainer: {
    flex: 1,
  },
  routingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  routingTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  routingInputsBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  routingTimeline: {
    alignItems: 'center',
    marginRight: spacing.md,
    paddingTop: 14,
    paddingBottom: 14,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  routingInputs: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routeInputItem: {
    height: 44,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  routeInputActive: {
    borderColor: colors.primary,
  },
  routeInputText: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  swapBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  }
});
