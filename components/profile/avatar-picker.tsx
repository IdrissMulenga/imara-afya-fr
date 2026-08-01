// components/profile/avatar-picker.tsx — circular photo picker (maps to User.image).
// Holds the local file URI only; uploading happens later when the backend is wired.
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';

export default function AvatarPicker({
  value,
  onPick,
}: {
  value: string | null;
  onPick: (uri: string) => void;
}) {
  const { c } = useTheme();
  const { t } = useStrings();

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!res.canceled && res.assets && res.assets[0]) onPick(res.assets[0].uri);
  };

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Pressable onPress={pick} style={[styles.avatar, { backgroundColor: c.fieldBg, shadowColor: c.primary }]}>
        {value ? (
          <Image source={{ uri: value }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person" size={48} color={c.textFaint} />
        )}
        <View style={[styles.badge, { backgroundColor: c.primary, borderColor: c.bg }]}>
          <Ionicons name="camera" size={17} color={c.onPrimary} />
        </View>
      </Pressable>
      <Text style={[styles.label, { color: c.primary }]}>{value ? t.changePhoto : t.addPhoto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  avatarImg: { width: 112, height: 112, borderRadius: 56 },
  badge: {
    position: 'absolute', right: 2, bottom: 2, width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3,
  },
  label: { fontSize: 13.5, fontWeight: '700' },
});
