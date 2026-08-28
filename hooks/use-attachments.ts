// hooks/use-attachments.ts — photos and documents on a health record.
//
// A prescription, a lab result, a photo of a rash. The backend stores only a
// URL, so the file goes straight from the phone to Cloudinary and we send back
// the resulting link — the same path the profile avatar already uses.
//
// Uploading through our own backend instead would mean a health image passing
// through, and being logged by, a server that has no need to see it.
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import * as ImagePicker from 'expo-image-picker';

import {
  ADD_ATTACHMENT,
  REMOVE_ATTACHMENT,
  type AddAttachmentData,
  type RemoveAttachmentData,
} from '@/graphql';
import { cloudinaryConfigured, uploadImageAsync } from '@/lib/cloudinary';

export function useAttachments() {
  // separate from the mutation's own loading: the upload happens first and is
  // by far the slower half on a 2G connection
  const [uploading, setUploading] = useState(false);

  const [addMutation, { loading: adding }] = useMutation<AddAttachmentData>(ADD_ATTACHMENT);
  const [removeMutation, { loading: removing }] =
    useMutation<RemoveAttachmentData>(REMOVE_ATTACHMENT);

  /**
   * Pick an image, upload it, and attach the URL to the record.
   *
   * Returns null when the user backs out of the picker — which is a normal
   * outcome, not an error, and shouldn't produce a message.
   */
  const attachImage = async (recordId: string) => {
    if (!cloudinaryConfigured()) throw new Error('UPLOAD_NOT_CONFIGURED');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) throw new Error('MEDIA_PERMISSION_DENIED');

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // A lab result has to stay readable, so this is deliberately less
      // aggressive than the avatar compression — an unreadable prescription is
      // worth nothing however small the file is.
      quality: 0.8,
    });

    if (picked.canceled || !picked.assets?.length) return null;

    const asset = picked.assets[0];

    setUploading(true);

    try {
      const url = await uploadImageAsync(asset.uri);

      if (!url) throw new Error('UPLOAD_FAILED');

      // the filename is only a label, so a missing one is fine
      const name = asset.fileName ?? asset.uri.split('/').pop() ?? undefined;

      const { data } = await addMutation({
        variables: { recordId, input: { url, name } },
      });

      return data?.addAttachment ?? null;
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (recordId: string, attachmentId: string) => {
    const { data } = await removeMutation({ variables: { recordId, attachmentId } });

    return data?.removeAttachment ?? null;
  };

  return {
    attachImage,
    removeAttachment,
    // one flag for the UI: picking, uploading and saving all read as "busy"
    busy: uploading || adding,
    removing,
    configured: cloudinaryConfigured(),
  };
}

export default useAttachments;
