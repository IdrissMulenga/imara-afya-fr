// constants/strings.tsx — i18n dictionary + language context (EN / SW / FR / RN)
import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

export const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'sw', label: 'SW' },
  { code: 'fr', label: 'FR' },
  { code: 'rn', label: 'RN' },
] as const;

export const STRINGS = {
  en: {
    welcomeBack: 'Welcome back',
    loginSub: 'Log in to keep your health on track.',
    createAccount: 'Create account',
    signupSub: 'Start your journey to stronger health.',
    name: 'Full name', namePh: 'e.g. Your Name',
    email: 'Email', emailPh: 'you@example.com',
    password: 'Password', passwordPh: '••••••••',
    create: 'Create account', login: 'Log in',
    forgot: 'Forgot password?',
    remember: 'Remember me',
    noAccount: "Don’t have an account?", haveAccount: 'Already have an account?',
    signup: 'Sign up', loginLink: 'Log in',
    continueWith: 'or continue with',
    terms: 'I agree to the Terms & Privacy Policy',
    errEmail: 'Enter a valid email address',
    errPwShort: 'Use at least 8 characters',
    errName: 'Please enter your name',
    errTerms: 'Please accept the terms to continue',
    errGeneric: 'Something went wrong. Please try again.',
    errSocialUnavailable: 'This sign-in option isn’t available yet. Please use email instead.',
    weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong',
    successTitle: 'You’re all set!', successLoginTitle: 'Welcome back!',
    successSub: 'Taking you to your health dashboard…',
    tagline: 'Your health, made simple.',
    verifyTitle: 'Verify your email',
    verifySub: 'Enter the 6-digit code we sent to',
    verifyCta: 'Verify', resend: 'Resend code', resendIn: 'Resend code in',
    noCode: 'Didn’t get a code?',
    codeErr: 'That code isn’t right. Try again.',
    verifiedTitle: 'Email verified!', verifiedSub: 'Now let’s set up your profile…',
    profileTitle: 'Set up your profile',
    profileSub: 'A few details to personalise your care.',
    addPhoto: 'Add a photo', changePhoto: 'Change photo',
    genderLabel: 'Gender', genderFemale: 'Female', genderMale: 'Male', genderOther: 'Other',
    religionLabel: 'Religion', religionPh: 'Select your religion',
    religions: ['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Traditional', 'None', 'Prefer not to say'],
    finish: 'Finish setup', skip: 'Skip for now', optional: 'Optional',
    home: 'Home', signOut: 'Sign out',
  },
  sw: {
    welcomeBack: 'Karibu tena',
    loginSub: 'Ingia ili kuendeleza afya yako.',
    createAccount: 'Fungua akaunti',
    signupSub: 'Anza safari yako ya afya bora.',
    name: 'Jina kamili', namePh: 'mf. Jina Lako',
    email: 'Barua pepe', emailPh: 'wewe@mfano.com',
    password: 'Nywila', passwordPh: '••••••••',
    create: 'Fungua akaunti', login: 'Ingia',
    forgot: 'Umesahau nywila?',
    remember: 'Nikumbuke',
    noAccount: 'Huna akaunti?', haveAccount: 'Una akaunti tayari?',
    signup: 'Jisajili', loginLink: 'Ingia',
    continueWith: 'au endelea na',
    terms: 'Nakubali Masharti na Sera ya Faragha',
    errEmail: 'Weka barua pepe sahihi',
    errPwShort: 'Tumia angalau herufi 8',
    errName: 'Tafadhali weka jina lako',
    errTerms: 'Tafadhali kubali masharti ili kuendelea',
    errGeneric: 'Hitilafu imetokea. Tafadhali jaribu tena.',
    errSocialUnavailable: 'Njia hii ya kuingia haipatikani bado. Tafadhali tumia barua pepe.',
    weak: 'Dhaifu', fair: 'Wastani', good: 'Nzuri', strong: 'Imara',
    successTitle: 'Uko tayari!', successLoginTitle: 'Karibu tena!',
    successSub: 'Tunakupeleka kwenye dashibodi yako ya afya…',
    tagline: 'Afya yako, kwa urahisi.',
    verifyTitle: 'Thibitisha barua pepe yako',
    verifySub: 'Weka nambari ya tarakimu 6 tuliyotuma kwa',
    verifyCta: 'Thibitisha', resend: 'Tuma tena nambari', resendIn: 'Tuma tena baada ya',
    noCode: 'Hukupata nambari?',
    codeErr: 'Nambari si sahihi. Jaribu tena.',
    verifiedTitle: 'Barua pepe imethibitishwa!', verifiedSub: 'Sasa tusanidi wasifu wako…',
    profileTitle: 'Sanidi wasifu wako',
    profileSub: 'Maelezo machache ili kuboresha huduma yako.',
    addPhoto: 'Ongeza picha', changePhoto: 'Badilisha picha',
    genderLabel: 'Jinsia', genderFemale: 'Mwanamke', genderMale: 'Mwanaume', genderOther: 'Nyingine',
    religionLabel: 'Dini', religionPh: 'Chagua dini yako',
    religions: ['Ukristo', 'Uislamu', 'Uhindu', 'Ubuddha', 'Kiasili', 'Hakuna', 'Sipendi kusema'],
    finish: 'Maliza usanidi', skip: 'Ruka kwa sasa', optional: 'Si lazima',
    home: 'Nyumbani', signOut: 'Toka',
  },
  fr: {
    welcomeBack: 'Bon retour',
    loginSub: 'Connectez-vous pour suivre votre santé.',
    createAccount: 'Créer un compte',
    signupSub: 'Commencez votre parcours vers une meilleure santé.',
    name: 'Nom complet', namePh: 'ex. Non complet',
    email: 'E-mail', emailPh: 'vous@exemple.com',
    password: 'Mot de passe', passwordPh: '••••••••',
    create: 'Créer un compte', login: 'Se connecter',
    forgot: 'Mot de passe oublié ?',
    remember: 'Se souvenir de moi',
    noAccount: 'Vous n’avez pas de compte ?', haveAccount: 'Vous avez déjà un compte ?',
    signup: 'S’inscrire', loginLink: 'Se connecter',
    continueWith: 'ou continuer avec',
    terms: 'J’accepte les Conditions et la Politique de confidentialité',
    errEmail: 'Saisissez une adresse e-mail valide',
    errPwShort: 'Utilisez au moins 8 caractères',
    errName: 'Veuillez saisir votre nom',
    errTerms: 'Veuillez accepter les conditions pour continuer',
    errGeneric: 'Une erreur s’est produite. Veuillez réessayer.',
    errSocialUnavailable: 'Cette option de connexion n’est pas encore disponible. Utilisez l’e-mail.',
    weak: 'Faible', fair: 'Moyen', good: 'Bon', strong: 'Fort',
    successTitle: 'Tout est prêt !', successLoginTitle: 'Bon retour !',
    successSub: 'Redirection vers votre tableau de bord santé…',
    tagline: 'Votre santé, en toute simplicité.',
    verifyTitle: 'Vérifiez votre e-mail',
    verifySub: 'Saisissez le code à 6 chiffres envoyé à',
    verifyCta: 'Vérifier', resend: 'Renvoyer le code', resendIn: 'Renvoyer dans',
    noCode: 'Pas reçu de code ?',
    codeErr: 'Code incorrect. Réessayez.',
    verifiedTitle: 'E-mail vérifié !', verifiedSub: 'Configurons votre profil…',
    profileTitle: 'Configurez votre profil',
    profileSub: 'Quelques détails pour personnaliser vos soins.',
    addPhoto: 'Ajouter une photo', changePhoto: 'Changer la photo',
    genderLabel: 'Genre', genderFemale: 'Femme', genderMale: 'Homme', genderOther: 'Autre',
    religionLabel: 'Religion', religionPh: 'Choisissez votre religion',
    religions: ['Christianisme', 'Islam', 'Hindouisme', 'Bouddhisme', 'Traditionnelle', 'Aucune', 'Préfère ne pas dire'],
    finish: 'Terminer', skip: 'Ignorer pour l’instant', optional: 'Facultatif',
    home: 'Accueil', signOut: 'Se déconnecter',
  },
  rn: {
    welcomeBack: 'Murakaza neza',
    loginSub: 'Injira kugira ukurikirane amagara yawe.',
    createAccount: 'Fungura konte',
    signupSub: 'Tangura urugendo rwawe rw’amagara meza.',
    name: 'Izina ryuzuye', namePh: 'akarorero Amazin Yawe',
    email: 'Imeyili', emailPh: 'wewe@akarorero.com',
    password: 'Ijambo ry’ibanga', passwordPh: '••••••••',
    create: 'Fungura konte', login: 'Injira',
    forgot: 'Wibagiwe ijambo ry’ibanga?',
    remember: 'Unyibuke',
    noAccount: 'Nta konte ufise?', haveAccount: 'Usanzwe ufise konte?',
    signup: 'Iyandikishe', loginLink: 'Injira',
    continueWith: 'canke winjire ukoresheje',
    terms: 'Ndemera Amabwirizwa n’Ipolitike y’ibanga',
    errEmail: 'Andika imeyili nyayo',
    errPwShort: 'Koresha nibura inyuguti 8',
    errName: 'Andika izina ryawe',
    errTerms: 'Emera amabwirizwa kugira ubandanye',
    errGeneric: 'Habaye ikibazo. Subira ugerageze.',
    errSocialUnavailable: 'Ubu buryo bwo kwinjira ntiburaboneka. Koresha imeyili.',
    weak: 'Ridakomeye', fair: 'Risanzwe', good: 'Ryiza', strong: 'Rikomeye',
    successTitle: 'Vyose birarangiye!', successLoginTitle: 'Murakaza neza!',
    successSub: 'Turiko turakujana ku rupapuro rwawe rw’amagara…',
    tagline: 'Amagara yawe, mu buryo bworoshe.',
    verifyTitle: 'Emeza imeyili yawe',
    verifySub: 'Andika kode y’imibare 6 twakwoherereje kuri',
    verifyCta: 'Emeza', resend: 'Subira wohereze kode', resendIn: 'Subira mu',
    noCode: 'Ntiwakiriye kode?',
    codeErr: 'Iyo kode siyo. Gerageza.',
    verifiedTitle: 'Imeyili yemejwe!', verifiedSub: 'Ubu reka dushireho umwidondoro wawe…',
    profileTitle: 'Shiraho umwidondoro wawe',
    profileSub: 'Amakuru make kugira twongere ubuvuzi bwawe.',
    addPhoto: 'Ongeraho ifoto', changePhoto: 'Hindura ifoto',
    genderLabel: 'Igitsina', genderFemale: 'Umugore', genderMale: 'Umugabo', genderOther: 'Ikindi',
    religionLabel: 'Idini', religionPh: 'Hitamwo idini ryawe',
    religions: ['Ubukirisu', 'Ubuyisilamu', 'Ubuhindu', 'Ububuda', 'Gakondo', 'Nta na rimwe', 'Sinshaka kuvuga'],
    finish: 'Rangiza', skip: 'Simba kuri ubu', optional: 'Si itegeko',
    home: 'Ahabanza', signOut: 'Sohoka',
  },
};

export type LangCode = keyof typeof STRINGS;
export type Strings = (typeof STRINGS)['en'];

type LangContextValue = {
  lang: LangCode;
  setLang: React.Dispatch<React.SetStateAction<LangCode>>;
  t: Strings;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({
  children,
  initialLang = 'en',
}: {
  children: ReactNode;
  initialLang?: LangCode;
}) {
  const [lang, setLang] = useState<LangCode>(initialLang);
  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: (STRINGS[lang] || STRINGS.en) as Strings }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useStrings() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useStrings must be used inside <LangProvider>');
  return ctx;
}
