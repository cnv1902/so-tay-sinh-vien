import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  colors,
  typography,
} from '../../design';


type MapPlaceholderProps = {
  onMarkerPress?: () => void;
};

export default function MapPlaceholder({
  onMarkerPress,
}: MapPlaceholderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.grid} />

      <View style={styles.roadHorizontal} />
      <View style={styles.roadVertical} />

      <View style={[styles.building, styles.buildingOne]}>
        <Text style={styles.buildingText}>A</Text>
      </View>

      <View style={[styles.building, styles.buildingTwo]}>
        <Text style={styles.buildingText}>B</Text>
      </View>

      <View style={[styles.building, styles.buildingThree]}>
        <Text style={styles.buildingText}>C</Text>
      </View>

      <TouchableOpacity
        style={[styles.marker, styles.markerOne]}
        onPress={onMarkerPress}>
        <Text>📍</Text>
      </TouchableOpacity>

      <View style={[styles.marker, styles.markerTwo]}>
        <Text>📍</Text>
      </View>

      <View style={styles.currentLocation}>
        <View style={styles.currentLocationDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#E9F0E7',
  },

  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
    backgroundColor: '#D7E2D2',
  },

  roadHorizontal: {
    position: 'absolute',
    top: '48%',
    left: -100,
    right: -100,
    height: 34,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-8deg' }],
  },

  roadVertical: {
    position: 'absolute',
    left: '52%',
    top: -100,
    bottom: -100,
    width: 28,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '12deg' }],
  },

  building: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9E8F7',
    borderWidth: 1,
    borderColor: '#B7CCE0',
    borderRadius: 8,
  },

  buildingOne: {
    width: 100,
    height: 70,
    top: '28%',
    left: '15%',
  },

  buildingTwo: {
    width: 80,
    height: 100,
    top: '58%',
    right: '14%',
  },

  buildingThree: {
    width: 110,
    height: 60,
    top: '65%',
    left: '18%',
  },

  buildingText: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.primary,
  },

  marker: {
    position: 'absolute',
  },

  markerOne: {
    top: '36%',
    left: '48%',
  },

  markerTwo: {
    top: '55%',
    left: '30%',
  },

  currentLocation: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,119,255,0.2)',
    top: '45%',
    left: '60%',
  },

  currentLocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
});