// Whether this phone draws Apple's Liquid Glass: iOS 26 and later. Older iPhones and Android
// keep the blur and translucent fills.
import { Platform } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

export const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();
