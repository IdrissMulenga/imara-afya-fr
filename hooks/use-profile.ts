// hooks/use-profile.ts — reusable profile hook.
// Uploads the picked photo to Cloudinary (if configured), then sends the
// resulting URL plus height / weight / religion to `completeProfile`.
//
//   const { completeProfile, upgradeToPremium, loading, error } = useProfile();
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';

import {
  COMPLETE_PROFILE,
  UPGRADE_TO_PREMIUM,
  type CompleteProfileData,
  type CompleteProfileVars,
  type UpgradeToPremiumData,
} from '@/graphql';
import { prepareAvatarAsync } from '@/lib/image';
import { errorMessage } from '@/lib/errors';

export type ProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  /** local file URI from the image picker — uploaded before saving.
   *  Pass an http(s) URL (the existing image) and it's sent through unchanged. */
  imageUri?: string | null;
  height?: string | number | null;
  weight?: string | number | null;
  religion?: string | null;
};

// "" / null / undefined -> undefined, so we never send empty values
const num = (v?: string | number | null) => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apollo normalises the returned User by id, so `me` updates on its own —
  // but the dashboard reads the same user through the Dashboard query, and a
  // changed avatar has to show there immediately or it looks like the save
  // failed. Refetching by operation name reuses whatever variables that query
  // last ran with, so we don't have to know today's date here.
  const refreshUserEverywhere = { refetchQueries: ['Dashboard', 'Me'] };

  const [completeProfileMutation] = useMutation<CompleteProfileData, CompleteProfileVars>(
    COMPLETE_PROFILE,
    refreshUserEverywhere,
  );
  const [upgradeMutation] = useMutation<UpgradeToPremiumData>(
    UPGRADE_TO_PREMIUM,
    refreshUserEverywhere,
  );

  const completeProfile = async ({
    firstName, lastName, imageUri, height, weight, religion,
  }: ProfileInput) => {
    setError(null);
    setLoading(true);
    try {
      // 1. downsize a newly picked photo to a small base64 avatar.
      //    an already-stored image (url or data uri) passes through untouched,
      //    so re-saving the profile doesn't re-encode it.
      const alreadyStored = !!imageUri && /^(https?:\/\/|data:image\/)/i.test(imageUri);
      const image = imageUri
        ? alreadyStored
          ? null // unchanged — no need to resend it
          : await prepareAvatarAsync(imageUri)
        : null;

      // 2. only send fields the user actually filled in
      const input: CompleteProfileVars['input'] = {};
      if (firstName?.trim()) input.firstName = firstName.trim();
      if (lastName?.trim()) input.lastName = lastName.trim();
      if (image) input.image = image;
      if (num(height) !== undefined) input.height = num(height);
      if (num(weight) !== undefined) input.weight = num(weight);
      if (religion) input.religion = religion;

      const { data } = await completeProfileMutation({ variables: { input } });
      return data?.completeProfile;
    } catch (err) {
      setError(errorMessage(err, 'Could not save your profile. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await upgradeMutation();
      return data?.upgradeToPremium;
    } catch (err) {
      setError(errorMessage(err, 'Could not upgrade your plan. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { completeProfile, upgradeToPremium, loading, error, setError };
}

export default useProfile;
