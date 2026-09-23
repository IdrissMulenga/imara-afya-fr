// The four app languages and the useLang hook. Welcome copy is verbatim from the design file.
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

export const LANGS = ['en', 'fr', 'sw', 'rn'] as const;
export type Lang = (typeof LANGS)[number];

const STORE_KEY = 'imara.lang';

// Current language, for the Apollo link (outside React). Sent as Accept-Language.
let current: Lang = 'en';
export const currentLang = (): Lang => current;

type Copy = {
  label: string;
  tagline: string;
  headA: string;
  headB: string;
  sub: string;
  primary: string;
  secondary: string;
  legal: string;

  // shared
  email: string;
  emailHint: string;
  password: string;
  show: string;
  hide: string;
  back: string;
  continue: string;
  cancel: string;

  // login
  loginTitle: string;
  loginSub: string;
  forgot: string;
  loginCta: string;
  noAccount: string;
  createOne: string;

  // signup
  signupTitle: string;
  signupSub: string;
  choosePassword: string;
  passwordRule: string;
  signupCta: string;
  afterSignup: string;
  haveAccount: string;
  signIn: string;

  // verify
  verifyTitle: string;
  verifySubA: string;
  verifySubB: string;
  expiresIn: string;
  verifyCta: string;
  noCode: string;
  resend: string;
  resendIn: string;
  spam: string;

  // forgot
  forgotTitle: string;
  forgotSub: string;
  forgotCta: string;
  privacyNote: string;
  remembered: string;

  // reset
  resetTitle: string;
  resetSub: string;
  newPassword: string;
  confirmPassword: string;
  match: string;
  noMatch: string;
  resetCta: string;
  signsOut: string;

  // signup extras
  nameLabel: string;
  nameHint: string;
  genderLabel: string;
  genderFemale: string;
  genderMale: string;
  genderUnspecified: string;
  genderWhy: string;
  termsPrefix: string;
  termsLink: string;
  termsMiddle: string;
  privacyLink: string;
  legalPending: string;

  // home placeholder
  homeTitle: string;
  homeSub: string;
  signOut: string;
  unverified: string;
  verifyNow: string;
};

export const COPY: Record<Lang, Copy> = {
  en: {
    label: 'English',
    tagline: 'Strong health, daily',
    headA: 'Small moves,',
    headB: 'every day.',
    sub: 'Steps, sleep, meals and recovery in one calm place. We’ll start wherever you are today.',
    primary: 'Create your account',
    secondary: 'I already have an account',
    legal: 'By continuing you agree to our Terms and Privacy Policy. Health data stays on your device unless you choose to sync.',

    email: 'EMAIL',
    emailHint: 'you@example.com',
    password: 'PASSWORD',
    show: 'Show',
    hide: 'Hide',
    back: 'Go back',
    continue: 'Continue',
    cancel: 'Cancel',

    loginTitle: 'Welcome back',
    loginSub: 'Sign in to pick up exactly where you left off.',
    forgot: 'Forgot password?',
    loginCta: 'Log in',
    noAccount: 'New to Imara Afya?',
    createOne: 'Create an account',

    signupTitle: 'Create your account',
    signupSub: 'Takes about a minute. You can add health data later.',
    choosePassword: 'CHOOSE A PASSWORD',
    passwordRule: 'At least 8 characters',
    signupCta: 'Create account',
    afterSignup: 'We will email you a 6-digit code to confirm the address.',
    haveAccount: 'Already have an account?',
    signIn: 'Log in',

    verifyTitle: 'Check your inbox',
    verifySubA: 'We sent a 6-digit code to',
    verifySubB: 'It is good for 10 minutes.',
    expiresIn: 'Expires in',
    verifyCta: 'Verify and continue',
    noCode: 'No code yet?',
    resend: 'Send a new code',
    resendIn: 'Resend in',
    spam: 'Check your spam folder if it has not arrived.',

    forgotTitle: 'Reset your password',
    forgotSub: 'Enter the email on your account and we will send a code to get you back in.',
    forgotCta: 'Send me a code',
    privacyNote: 'For your safety we send the same reply whether or not the address has an account.',
    remembered: 'Remembered it?',

    resetTitle: 'Choose a new password',
    resetSub: 'Almost there. Pick something you will remember without writing it down.',
    newPassword: 'NEW PASSWORD',
    confirmPassword: 'CONFIRM NEW PASSWORD',
    match: 'Both passwords match',
    noMatch: 'These do not match yet',
    resetCta: 'Save and log in',
    signsOut: 'This signs you out on every other device.',

    nameLabel: 'YOUR NAME',
    nameHint: 'Aline',
    genderLabel: 'GENDER',
    genderFemale: 'Female',
    genderMale: 'Male',
    genderUnspecified: 'Prefer not to say',
    genderWhy: 'Used only to tailor what the app shows you. You can change it any time.',
    termsPrefix: 'I agree to the',
    termsLink: 'Terms',
    termsMiddle: 'and the',
    privacyLink: 'Privacy Policy',
    legalPending: 'This document has not been written yet. It must be in place before the app goes on the Play Store.',

    homeTitle: 'You are signed in',
    homeSub: 'The rest of the app goes here. Auth is working end to end.',
    signOut: 'Sign out',
    unverified: 'Your email is not confirmed yet.',
    verifyNow: 'Confirm it',
  },

  fr: {
    label: 'Français',
    tagline: 'Une santé solide',
    headA: 'De petits pas,',
    headB: 'chaque jour.',
    sub: 'Pas, sommeil, repas et récupération au même endroit, en toute sérénité. Nous commençons là où vous en êtes aujourd’hui.',
    primary: 'Créer un compte',
    secondary: 'J’ai déjà un compte',
    legal: 'En continuant, vous acceptez nos Conditions et notre Politique de confidentialité. Vos données de santé restent sur votre appareil, sauf si vous choisissez de les synchroniser.',

    email: 'E-MAIL',
    emailHint: 'vous@exemple.com',
    password: 'MOT DE PASSE',
    show: 'Afficher',
    hide: 'Masquer',
    back: 'Retour',
    continue: 'Continuer',
    cancel: 'Annuler',

    loginTitle: 'Bon retour',
    loginSub: 'Connectez-vous pour reprendre là où vous vous êtes arrêté.',
    forgot: 'Mot de passe oublié ?',
    loginCta: 'Se connecter',
    noAccount: 'Nouveau sur Imara Afya ?',
    createOne: 'Créer un compte',

    signupTitle: 'Créer un compte',
    signupSub: 'Une minute environ. Vous pourrez ajouter vos données de santé plus tard.',
    choosePassword: 'CHOISIR UN MOT DE PASSE',
    passwordRule: 'Au moins 8 caractères',
    signupCta: 'Créer le compte',
    afterSignup: 'Nous vous enverrons un code à 6 chiffres pour confirmer l’adresse.',
    haveAccount: 'Vous avez déjà un compte ?',
    signIn: 'Se connecter',

    verifyTitle: 'Consultez votre boîte mail',
    verifySubA: 'Nous avons envoyé un code à 6 chiffres à',
    verifySubB: 'Il est valable 10 minutes.',
    expiresIn: 'Expire dans',
    verifyCta: 'Vérifier et continuer',
    noCode: 'Pas encore de code ?',
    resend: 'Envoyer un nouveau code',
    resendIn: 'Renvoyer dans',
    spam: 'Vérifiez vos spams s’il n’est pas arrivé.',

    forgotTitle: 'Réinitialiser le mot de passe',
    forgotSub: 'Saisissez l’e-mail de votre compte et nous vous enverrons un code.',
    forgotCta: 'Envoyez-moi un code',
    privacyNote: 'Pour votre sécurité, nous répondons de la même manière, que l’adresse ait un compte ou non.',
    remembered: 'Vous vous en souvenez ?',

    resetTitle: 'Choisir un nouveau mot de passe',
    resetSub: 'Presque fini. Choisissez quelque chose dont vous vous souviendrez sans l’écrire.',
    newPassword: 'NOUVEAU MOT DE PASSE',
    confirmPassword: 'CONFIRMER LE MOT DE PASSE',
    match: 'Les deux mots de passe correspondent',
    noMatch: 'Ils ne correspondent pas encore',
    resetCta: 'Enregistrer et se connecter',
    signsOut: 'Cela vous déconnecte sur tous les autres appareils.',

    nameLabel: 'VOTRE NOM',
    nameHint: 'Aline',
    genderLabel: 'GENRE',
    genderFemale: 'Femme',
    genderMale: 'Homme',
    genderUnspecified: 'Je préfère ne pas répondre',
    genderWhy: 'Sert uniquement à adapter ce que l’application vous montre. Modifiable à tout moment.',
    termsPrefix: 'J’accepte les',
    termsLink: 'Conditions',
    termsMiddle: 'et la',
    privacyLink: 'Politique de confidentialité',
    legalPending: 'Ce document n’a pas encore été rédigé. Il doit exister avant la publication sur le Play Store.',

    homeTitle: 'Vous êtes connecté',
    homeSub: 'Le reste de l’application viendra ici. L’authentification fonctionne.',
    signOut: 'Se déconnecter',
    unverified: 'Votre e-mail n’est pas encore confirmé.',
    verifyNow: 'Confirmer',
  },

  sw: {
    label: 'Kiswahili',
    tagline: 'Afya imara, kila siku',
    headA: 'Hatua ndogo,',
    headB: 'kila siku.',
    sub: 'Hatua, usingizi, chakula na uponyaji katika sehemu moja tulivu. Tutaanza pale ulipo leo.',
    primary: 'Fungua akaunti',
    secondary: 'Nina akaunti tayari',
    legal: 'Kwa kuendelea unakubali Masharti na Sera yetu ya Faragha. Data yako ya afya inabaki kwenye kifaa chako isipokuwa uchague kusawazisha.',

    email: 'BARUA PEPE',
    emailHint: 'wewe@mfano.com',
    password: 'NYWILA',
    show: 'Onyesha',
    hide: 'Ficha',
    back: 'Rudi',
    continue: 'Endelea',
    cancel: 'Ghairi',

    loginTitle: 'Karibu tena',
    loginSub: 'Ingia uendelee pale ulipoishia.',
    forgot: 'Umesahau nywila?',
    loginCta: 'Ingia',
    noAccount: 'Mgeni kwenye Imara Afya?',
    createOne: 'Fungua akaunti',

    signupTitle: 'Fungua akaunti yako',
    signupSub: 'Inachukua dakika moja. Utaongeza data ya afya baadaye.',
    choosePassword: 'CHAGUA NYWILA',
    passwordRule: 'Angalau herufi 8',
    signupCta: 'Fungua akaunti',
    afterSignup: 'Tutakutumia namba ya tarakimu 6 kuthibitisha barua pepe.',
    haveAccount: 'Una akaunti tayari?',
    signIn: 'Ingia',

    verifyTitle: 'Angalia barua pepe yako',
    verifySubA: 'Tumetuma namba ya tarakimu 6 kwenda',
    verifySubB: 'Inafaa kwa dakika 10.',
    expiresIn: 'Inaisha baada ya',
    verifyCta: 'Thibitisha uendelee',
    noCode: 'Hujapata namba?',
    resend: 'Tuma namba mpya',
    resendIn: 'Tuma tena baada ya',
    spam: 'Angalia folda ya spam kama haijafika.',

    forgotTitle: 'Weka upya nywila yako',
    forgotSub: 'Andika barua pepe ya akaunti yako nasi tutakutumia namba.',
    forgotCta: 'Nitumie namba',
    privacyNote: 'Kwa usalama wako tunajibu vivyo hivyo iwe anwani ina akaunti au la.',
    remembered: 'Umeikumbuka?',

    resetTitle: 'Chagua nywila mpya',
    resetSub: 'Karibu tumemaliza. Chagua kitu utakachokumbuka bila kuandika.',
    newPassword: 'NYWILA MPYA',
    confirmPassword: 'THIBITISHA NYWILA',
    match: 'Nywila zote mbili zinalingana',
    noMatch: 'Bado hazilingani',
    resetCta: 'Hifadhi na uingie',
    signsOut: 'Hii itakutoa kwenye vifaa vingine vyote.',

    nameLabel: 'JINA LAKO',
    nameHint: 'Aline',
    genderLabel: 'JINSIA',
    genderFemale: 'Mwanamke',
    genderMale: 'Mwanaume',
    genderUnspecified: 'Sipendi kusema',
    genderWhy: 'Hutumika tu kurekebisha kile programu inakuonyesha. Unaweza kubadilisha wakati wowote.',
    termsPrefix: 'Nakubali',
    termsLink: 'Masharti',
    termsMiddle: 'na',
    privacyLink: 'Sera ya Faragha',
    legalPending: 'Hati hii bado haijaandikwa. Ni lazima iwepo kabla programu haijawekwa kwenye Play Store.',

    homeTitle: 'Umeingia',
    homeSub: 'Sehemu nyingine ya programu itakuja hapa. Uthibitishaji unafanya kazi.',
    signOut: 'Toka',
    unverified: 'Barua pepe yako haijathibitishwa bado.',
    verifyNow: 'Ithibitishe',
  },

  rn: {
    label: 'Ikirundi',
    tagline: 'Amagara akomeye',
    headA: 'Intambwe nto,',
    headB: 'imisi yose.',
    sub: 'Intambwe, itiro, imfungurwa n’ukuruhuka ahantu hamwe hatekanye. Tuzotangurira aho uri uyu musi.',
    primary: 'Iyandikishe',
    secondary: 'Mfise konte',
    legal: 'Mu kubandanya, wemera Amabwirizwa n’Ingingo z’ibanga. Amakuru y’amagara yawe agumana mu gikoresho cawe, kiretse uhisemwo kubisangira.',

    email: 'IMEYILI',
    emailHint: 'wewe@akarorero.com',
    password: 'IJAMBO RYIBANGA',
    show: 'Erekana',
    hide: 'Nyegeza',
    back: 'Subira inyuma',
    continue: 'Bandanya',
    cancel: 'Hagarika',

    loginTitle: 'Ikaze garuka',
    loginSub: 'Injira ubandanye aho wari uhagaze.',
    forgot: 'Wibagiye ijambo ryibanga?',
    loginCta: 'Injira',
    noAccount: 'Uri mushasha kuri Imara Afya?',
    createOne: 'Iyandikishe',

    signupTitle: 'Iyandikishe',
    signupSub: 'Bifata umunota umwe. Uzokwongerako amakuru y’amagara mu nyuma.',
    choosePassword: 'HITAMWO IJAMBO RYIBANGA',
    passwordRule: 'Nibura inyuguti 8',
    signupCta: 'Fungura konte',
    afterSignup: 'Tuzokurungikira inomero z’imibare 6 kugira wemeze imeyili yawe.',
    haveAccount: 'Usanzwe ufise konte?',
    signIn: 'Injira',

    verifyTitle: 'Raba imeyili yawe',
    verifySubA: 'Twarungitse inomero z’imibare 6 kuri',
    verifySubB: 'Zimara iminota 10.',
    expiresIn: 'Zirangira mu',
    verifyCta: 'Emeza ubandanye',
    noCode: 'Ntiwaronse inomero?',
    resend: 'Rungika izindi nomero',
    resendIn: 'Rungika bushasha mu',
    spam: 'Raba muri spam nimba itashitse.',

    forgotTitle: 'Hindura ijambo ryibanga',
    forgotSub: 'Andika imeyili ya konte yawe, tukurungikire inomero.',
    forgotCta: 'Nyungikira inomero',
    privacyNote: 'Ku bw’umutekano wawe, twishura kumwe naho iyo meyili yoba ifise konte canke itayifise.',
    remembered: 'Waributse?',

    resetTitle: 'Hitamwo ijambo ryibanga rishasha',
    resetSub: 'Turi hafi. Hitamwo iryo uzokwibuka utariyanditse.',
    newPassword: 'IJAMBO RYIBANGA RISHASHA',
    confirmPassword: 'EMEZA IJAMBO RYIBANGA',
    match: 'Amajambo yompi arasa',
    noMatch: 'Ntiyarasa',
    resetCta: 'Bika winjire',
    signsOut: 'Ivyo bizogusohora ku bindi bikoresho vyose.',

    nameLabel: 'IZINA RYAWE',
    nameHint: 'Aline',
    genderLabel: 'IGITSINA',
    genderFemale: 'Umugore',
    genderMale: 'Umugabo',
    genderUnspecified: 'Sinshaka kubivuga',
    genderWhy: 'Bikoreshwa gusa mu guhindura ivyo porogaramu ikwereka. Urashobora guhindura igihe ico ari co cose.',
    termsPrefix: 'Nemeye',
    termsLink: 'Amabwirizwa',
    termsMiddle: 'n’',
    privacyLink: 'Ingingo z’ibanga',
    legalPending: 'Iyi nyandiko ntiranditswe. Itegerezwa kubaho imbere y’uko porogaramu ishirwa kuri Play Store.',

    homeTitle: 'Winjiye',
    homeSub: 'Ibisigaye vya porogaramu bizoza ng’aha. Kwinjira birakora.',
    signOut: 'Sohoka',
    unverified: 'Imeyili yawe ntiremezwa.',
    verifyNow: 'Yemeze',
  },
};

type Ctx = {
  lang: Lang;
  /** remember: false for an auto-rotated language. */
  setLang: (l: Lang, remember?: boolean) => void;
  t: Copy;
  ready: boolean;
  /** True once the language is settled and stops rotating. */
  pinned: boolean;
  /** Freeze the current language. */
  pin: () => void;
};

const LangContext = createContext<Ctx>({
  lang: 'en',
  t: COPY.en,
  setLang: () => {},
  ready: false,
  pinned: false,
  pin: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [ready, setReady] = useState(false);
  // Kept here so it survives the welcome screen unmounting.
  const [pinned, setPinned] = useState(false);

  // Load the saved language; stay on English if storage fails.
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORE_KEY);
        if (saved && (LANGS as readonly string[]).includes(saved)) {
          current = saved as Lang;
          setLangState(saved as Lang);
          // A saved language means the user already chose.
          setPinned(true);
        }
      } catch {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Auto-rotated languages are not saved.
  const setLang = useCallback((l: Lang, remember = true) => {
    current = l;
    setLangState(l);
    if (remember) SecureStore.setItemAsync(STORE_KEY, l).catch(() => {});
  }, []);

  // Pinning also saves the current language.
  const pin = useCallback(() => {
    setPinned(true);
    setLangState((current) => {
      SecureStore.setItemAsync(STORE_KEY, current).catch(() => {});
      return current;
    });
  }, []);

  const value = useMemo(
    () => ({ lang, t: COPY[lang], setLang, ready, pinned, pin }),
    [lang, ready, pinned, setLang, pin],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
