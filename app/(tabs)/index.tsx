import { useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { mockCafes, type Cafe } from '@/constants/mockCafes';

const PARIS_REGION = {
  latitude: 48.8608,
  longitude: 2.3547,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  const centerOnUser = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const position = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={PARIS_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {mockCafes.map((cafe) => (
          <Marker
            key={cafe.id}
            coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
            onPress={() => setSelectedCafe(cafe)}
          >
            <View style={styles.pin}>
              <Ionicons name="cafe" size={16} color={colors.paper} />
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            coffee<Text style={{ color: colors.terracotta }}>map</Text>
          </Text>
          <Pressable style={styles.locateButton} onPress={centerOnUser}>
            <Ionicons name="locate" size={20} color={colors.espresso} />
          </Pressable>
        </View>
      </SafeAreaView>

      {selectedCafe && (
        <SafeAreaView style={styles.bottomOverlay} pointerEvents="box-none">
          <Pressable style={[styles.previewCard, shadow.card]} onPress={() => setSelectedCafe(null)}>
            <View style={styles.previewIcon}>
              <Ionicons name="cafe" size={22} color={colors.paper} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{selectedCafe.name}</Text>
              <Text style={styles.previewAddress} numberOfLines={1}>
                {selectedCafe.address}
              </Text>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color={colors.espresso} />
              <Text style={styles.ratingText}>{selectedCafe.rating.toFixed(1)}</Text>
            </View>
          </Pressable>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.bricolageTest,
    fontSize: 24,
    color: colors.ink,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  locateButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.paper,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  previewAddress: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.latte,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  ratingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.espresso,
  },
});
