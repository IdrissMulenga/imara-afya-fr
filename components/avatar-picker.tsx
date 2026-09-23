// Profile photo picker: square crop on the phone, quality 0.8, uploaded straight away.
// Photo permission is requested only when the user taps.
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Animated, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/components/panel';
import { LinkText, ErrorNote } from '@/components/ui';
import { useFade, usePressScale } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { useLang } from '@/theme/i18n';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { uploadAvatar, removeAvatar } from '@/lib/media';
import { errorMessage } from '@/lib/errors';

export function AvatarPicker() {
  const { lang } = useLang();
  const { c } = useTheme();
  const { user, setUser } = useSession();
  const notice = useNotice();
  const a = APP_COPY[lang];

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);

  const press = usePressScale(0.94);
  const veil = useFade(busy, 140);

  if (!user) return null;

  const apply = (photoUrl: string) => setUser({ ...user, photoUrl });

  const pick = async () => {
    setError('');
    setDenied(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      // The OS will no longer ask; the user has to allow it in Settings.
      setDenied(!permission.canAskAgain);
      setError(a.permissionDenied);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      exif: false,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setBusy(true);
    try {
      const photoUrl = await uploadAvatar(asset.uri);
      apply(photoUrl);
      notice.success(a.saved, a.changePhoto);
      notice.toast(a.photo);
    } catch (e) {
      setError(errorMessage(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setError('');
    setBusy(true);
    try {
      apply(await removeAvatar());
      notice.success(a.saved, a.removePhoto);
      notice.toast(a.removePhoto);
    } catch (e) {
      setError(errorMessage(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const hasPhoto = Boolean(user.photoUrl);

  return (
    <View style={{ gap: 12 }}>
      <Text style={[T.label, { color: c.faint }]}>{a.photo}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Animated.View style={press.style}>
          <Pressable
            onPress={pick}
            onPressIn={press.onPressIn}
            onPressOut={press.onPressOut}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={hasPhoto ? a.changePhoto : a.addPhoto}
            style={{ borderRadius: 40 }}
          >
            <Avatar name={user.name} email={user.email} photoUrl={user.photoUrl} size={76} />

            {/* Spinner over the avatar while uploading. */}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.veil,
                { backgroundColor: c.overlay, opacity: veil },
              ]}
            >
              <ActivityIndicator color="#FFFFFF" />
            </Animated.View>
          </Pressable>
        </Animated.View>

        <View style={{ flex: 1, gap: 8 }}>
          <LinkText label={hasPhoto ? a.changePhoto : a.addPhoto} onPress={pick} />
          {hasPhoto ? (
            <Pressable onPress={clear} disabled={busy} accessibilityRole="button" hitSlop={8}>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.danger }}>
                {a.removePhoto}
              </Text>
            </Pressable>
          ) : null}
          <Text style={[T.fine, { color: c.faint }]}>{busy ? a.uploadingPhoto : a.photoHint}</Text>
        </View>
      </View>

      {error ? <ErrorNote message={error} /> : null}

      {/* Shown only when the OS has stopped asking. */}
      {denied ? (
        <LinkText label={a.openAppSettings} onPress={() => void Linking.openSettings()} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  veil: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
