// Copy for the in-app screens (auth and welcome copy is in i18n.tsx).
// Kiswahili and Ikirundi are drafts pending review by a native speaker.
import type { Lang } from './i18n';

export type AppCopy = {
  // dashboard
  greetMorning: string;
  greetAfternoon: string;
  greetEvening: string;
  dashSub: string;
  yourProfile: string;
  openSettings: string;
  memberSince: string;
  notSet: string;
  verified: string;
  unverifiedShort: string;
  confirmNow: string;

  // photo
  photo: string;
  addPhoto: string;
  changePhoto: string;
  removePhoto: string;
  uploadingPhoto: string;
  photoHint: string;
  permissionDenied: string;
  openAppSettings: string;

  // profile fields
  fullName: string;
  gender: string;
  birthDate: string;
  birthDateHint: string;
  age: string;
  years: string;
  height: string;
  weight: string;
  bmi: string;
  bmiUnknown: string;
  bmiUnder: string;
  bmiHealthy: string;
  bmiOver: string;
  bmiObese: string;
  bmiNote: string;

  // settings hub
  youSection: string;
  appSection: string;
  personalDetails: string;
  personalDetailsSub: string;
  dailyGoals: string;
  appPreferences: string;
  unsaved: string;
  discard: string;
  useDetectedZone: string;
  otherZone: string;
  less: string;
  more: string;
  perDay: string;
  perNight: string;

  // settings shell
  settings: string;
  settingsSub: string;
  sectionProfile: string;
  sectionPrefs: string;
  sectionGoals: string;
  sectionSecurity: string;
  sectionAccount: string;
  save: string;
  saving: string;
  saved: string;
  nothingToSave: string;

  // preferences
  language: string;
  units: string;
  unitsMetric: string;
  unitsImperial: string;
  timezone: string;
  timezoneNote: string;
  cycleTracking: string;
  cycleNote: string;

  // goals
  stepGoal: string;
  stepGoalNote: string;
  waterGoal: string;
  waterGoalNote: string;
  sleepGoal: string;
  sleepGoalNote: string;
  glasses: string;
  hours: string;
  steps: string;

  // security
  changePassword: string;
  changePasswordNote: string;
  currentPassword: string;
  newPasswordLabel: string;
  confirmNewPassword: string;
  changePasswordCta: string;
  passwordChanged: string;
  trustedDevices: string;
  trustedDevicesNote: string;
  thisPhone: string;
  lastSeen: string;
  trustEnds: string;
  revoke: string;
  revoked: string;
  noDevices: string;

  // account
  emailAddress: string;
  signOutEverywhere: string;
  deleteAccount: string;
  deleteAccountNote: string;
  deleteWarning: string;
  deleteConfirmLabel: string;
  deleteCta: string;
  deleteTypeLabel: string;
  deleteTypeWord: string;

  // shared
  edit: string;
  cancel: string;
  loading: string;
  retry: string;
  outOfRange: string;
};

export const APP_COPY: Record<Lang, AppCopy> = {
  en: {
    greetMorning: 'Good morning',
    greetAfternoon: 'Good afternoon',
    greetEvening: 'Good evening',
    dashSub: 'Here is what the app knows about you so far. Tracking comes next.',
    yourProfile: 'YOUR PROFILE',
    openSettings: 'Settings',
    memberSince: 'With us since',
    notSet: 'Not set',
    verified: 'Email confirmed',
    unverifiedShort: 'Email not confirmed',
    confirmNow: 'Confirm it',

    photo: 'PHOTO',
    addPhoto: 'Add a photo',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    uploadingPhoto: 'Sending your photo…',
    photoHint: 'A square works best. We shrink it before sending, so it costs little data.',
    permissionDenied: 'We need permission to open your photos.',
    openAppSettings: 'Open app settings',

    fullName: 'NAME',
    gender: 'GENDER',
    birthDate: 'DATE OF BIRTH',
    birthDateHint: 'YYYY-MM-DD',
    age: 'Age',
    years: 'years',
    height: 'HEIGHT (CM)',
    weight: 'WEIGHT (KG)',
    bmi: 'BMI',
    bmiUnknown: 'Add your height and weight to see this.',
    bmiUnder: 'Below the usual range',
    bmiHealthy: 'In the usual range',
    bmiOver: 'Above the usual range',
    bmiObese: 'Well above the usual range',
    bmiNote: 'BMI is a rough guide, not a diagnosis. It says nothing about muscle, build or health.',

    youSection: 'YOU',
    appSection: 'THE APP',
    personalDetails: 'Personal details',
    personalDetailsSub: 'Name, gender, date of birth, height and weight',
    dailyGoals: 'Daily goals',
    appPreferences: 'App preferences',
    unsaved: 'Not saved yet',
    discard: 'Undo',
    useDetectedZone: 'Use this phone’s zone',
    otherZone: 'Type it myself',
    less: 'Less',
    more: 'More',
    perDay: 'a day',
    perNight: 'a night',

    settings: 'Settings',
    settingsSub: 'Your profile, your goals, and who can get into your account.',
    sectionProfile: 'PROFILE',
    sectionPrefs: 'PREFERENCES',
    sectionGoals: 'DAILY GOALS',
    sectionSecurity: 'SECURITY',
    sectionAccount: 'ACCOUNT',
    save: 'Save changes',
    saving: 'Saving',
    saved: 'Saved',
    nothingToSave: 'Nothing has changed yet.',

    language: 'LANGUAGE',
    units: 'UNITS',
    unitsMetric: 'Metric',
    unitsImperial: 'Imperial',
    timezone: 'TIME ZONE',
    timezoneNote: 'Decides where your day starts and ends, so a late-night entry counts on the right day.',
    cycleTracking: 'Cycle tracking',
    cycleNote: 'Adds period and cycle features. You can turn it off at any time.',

    stepGoal: 'STEPS A DAY',
    stepGoalNote: 'Between 500 and 100,000.',
    waterGoal: 'GLASSES OF WATER A DAY',
    waterGoalNote: 'Between 1 and 30.',
    sleepGoal: 'HOURS OF SLEEP A NIGHT',
    sleepGoalNote: 'Between 3 and 14.',
    glasses: 'glasses',
    hours: 'hours',
    steps: 'steps',

    changePassword: 'Change password',
    changePasswordNote: 'Signs you out on every other device.',
    currentPassword: 'CURRENT PASSWORD',
    newPasswordLabel: 'NEW PASSWORD',
    confirmNewPassword: 'CONFIRM NEW PASSWORD',
    changePasswordCta: 'Change my password',
    passwordChanged: 'Your password has been changed.',
    trustedDevices: 'Trusted phones',
    trustedDevicesNote: 'These can sign in without an emailed code. Remove any you do not recognise.',
    thisPhone: 'This phone',
    lastSeen: 'Last used',
    trustEnds: 'Trust ends',
    revoke: 'Remove',
    revoked: 'Removed.',
    noDevices: 'No other phone is trusted.',

    emailAddress: 'EMAIL',
    signOutEverywhere: 'Sign out',
    deleteAccount: 'Delete my account',
    deleteAccountNote: 'Permanent. Everything goes.',
    deleteWarning:
      'This erases your account and every piece of health data in it. It cannot be undone and we cannot get it back for you.',
    deleteConfirmLabel: 'YOUR PASSWORD',
    deleteCta: 'Delete everything',
    deleteTypeLabel: 'TYPE DELETE TO CONFIRM',
    deleteTypeWord: 'DELETE',

    edit: 'Edit',
    cancel: 'Cancel',
    loading: 'Loading',
    retry: 'Try again',
    outOfRange: 'That number is outside the allowed range.',
  },

  fr: {
    greetMorning: 'Bonjour',
    greetAfternoon: 'Bon après-midi',
    greetEvening: 'Bonsoir',
    dashSub: 'Voici ce que l’application sait de vous pour l’instant. Le suivi arrive ensuite.',
    yourProfile: 'VOTRE PROFIL',
    openSettings: 'Paramètres',
    memberSince: 'Avec nous depuis',
    notSet: 'Non renseigné',
    verified: 'E-mail confirmé',
    unverifiedShort: 'E-mail non confirmé',
    confirmNow: 'Confirmer',

    photo: 'PHOTO',
    addPhoto: 'Ajouter une photo',
    changePhoto: 'Changer la photo',
    removePhoto: 'Retirer la photo',
    uploadingPhoto: 'Envoi de votre photo…',
    photoHint: 'Un carré convient le mieux. Nous la réduisons avant l’envoi, cela consomme peu de données.',
    permissionDenied: 'Nous avons besoin de votre autorisation pour ouvrir vos photos.',
    openAppSettings: 'Ouvrir les réglages',

    fullName: 'NOM',
    gender: 'GENRE',
    birthDate: 'DATE DE NAISSANCE',
    birthDateHint: 'AAAA-MM-JJ',
    age: 'Âge',
    years: 'ans',
    height: 'TAILLE (CM)',
    weight: 'POIDS (KG)',
    bmi: 'IMC',
    bmiUnknown: 'Ajoutez votre taille et votre poids pour le voir.',
    bmiUnder: 'En dessous de la plage habituelle',
    bmiHealthy: 'Dans la plage habituelle',
    bmiOver: 'Au-dessus de la plage habituelle',
    bmiObese: 'Bien au-dessus de la plage habituelle',
    bmiNote:
      'L’IMC est un repère approximatif, pas un diagnostic. Il ne dit rien de votre masse musculaire, de votre morphologie ni de votre santé.',

    youSection: 'VOUS',
    appSection: 'L’APPLICATION',
    personalDetails: 'Informations personnelles',
    personalDetailsSub: 'Nom, genre, date de naissance, taille et poids',
    dailyGoals: 'Objectifs quotidiens',
    appPreferences: 'Préférences',
    unsaved: 'Pas encore enregistré',
    discard: 'Annuler',
    useDetectedZone: 'Utiliser le fuseau du téléphone',
    otherZone: 'Le saisir moi-même',
    less: 'Moins',
    more: 'Plus',
    perDay: 'par jour',
    perNight: 'par nuit',

    settings: 'Paramètres',
    settingsSub: 'Votre profil, vos objectifs, et qui peut accéder à votre compte.',
    sectionProfile: 'PROFIL',
    sectionPrefs: 'PRÉFÉRENCES',
    sectionGoals: 'OBJECTIFS QUOTIDIENS',
    sectionSecurity: 'SÉCURITÉ',
    sectionAccount: 'COMPTE',
    save: 'Enregistrer',
    saving: 'Enregistrement',
    saved: 'Enregistré',
    nothingToSave: 'Rien n’a encore changé.',

    language: 'LANGUE',
    units: 'UNITÉS',
    unitsMetric: 'Métrique',
    unitsImperial: 'Impérial',
    timezone: 'FUSEAU HORAIRE',
    timezoneNote:
      'Détermine le début et la fin de votre journée, pour qu’une entrée tard le soir compte le bon jour.',
    cycleTracking: 'Suivi du cycle',
    cycleNote: 'Ajoute les fonctions de règles et de cycle. Vous pouvez le désactiver à tout moment.',

    stepGoal: 'PAS PAR JOUR',
    stepGoalNote: 'Entre 500 et 100 000.',
    waterGoal: 'VERRES D’EAU PAR JOUR',
    waterGoalNote: 'Entre 1 et 30.',
    sleepGoal: 'HEURES DE SOMMEIL PAR NUIT',
    sleepGoalNote: 'Entre 3 et 14.',
    glasses: 'verres',
    hours: 'heures',
    steps: 'pas',

    changePassword: 'Changer le mot de passe',
    changePasswordNote: 'Vous déconnecte de tous les autres appareils.',
    currentPassword: 'MOT DE PASSE ACTUEL',
    newPasswordLabel: 'NOUVEAU MOT DE PASSE',
    confirmNewPassword: 'CONFIRMER LE NOUVEAU MOT DE PASSE',
    changePasswordCta: 'Changer mon mot de passe',
    passwordChanged: 'Votre mot de passe a été changé.',
    trustedDevices: 'Téléphones de confiance',
    trustedDevicesNote:
      'Ceux-ci peuvent se connecter sans code par e-mail. Retirez ceux que vous ne reconnaissez pas.',
    thisPhone: 'Ce téléphone',
    lastSeen: 'Dernière utilisation',
    trustEnds: 'Confiance jusqu’au',
    revoke: 'Retirer',
    revoked: 'Retiré.',
    noDevices: 'Aucun autre téléphone n’est de confiance.',

    emailAddress: 'E-MAIL',
    signOutEverywhere: 'Se déconnecter',
    deleteAccount: 'Supprimer mon compte',
    deleteAccountNote: 'Définitif. Tout disparaît.',
    deleteWarning:
      'Ceci efface votre compte et toutes vos données de santé. C’est irréversible et nous ne pourrons rien récupérer pour vous.',
    deleteConfirmLabel: 'VOTRE MOT DE PASSE',
    deleteCta: 'Tout supprimer',
    deleteTypeLabel: 'TAPEZ SUPPRIMER POUR CONFIRMER',
    deleteTypeWord: 'SUPPRIMER',

    edit: 'Modifier',
    cancel: 'Annuler',
    loading: 'Chargement',
    retry: 'Réessayer',
    outOfRange: 'Ce nombre est en dehors de la plage autorisée.',
  },

  sw: {
    greetMorning: 'Habari za asubuhi',
    greetAfternoon: 'Habari za mchana',
    greetEvening: 'Habari za jioni',
    dashSub: 'Haya ni yale programu inayajua kukuhusu kwa sasa. Ufuatiliaji unafuata.',
    yourProfile: 'WASIFU WAKO',
    openSettings: 'Mipangilio',
    memberSince: 'Nasi tangu',
    notSet: 'Haijawekwa',
    verified: 'Barua pepe imethibitishwa',
    unverifiedShort: 'Barua pepe haijathibitishwa',
    confirmNow: 'Thibitisha',

    photo: 'PICHA',
    addPhoto: 'Ongeza picha',
    changePhoto: 'Badilisha picha',
    removePhoto: 'Ondoa picha',
    uploadingPhoto: 'Inatuma picha yako…',
    photoHint: 'Mraba inafaa zaidi. Tunaipunguza kabla ya kutuma, hivyo hutumia data kidogo.',
    permissionDenied: 'Tunahitaji ruhusa ili kufungua picha zako.',
    openAppSettings: 'Fungua mipangilio ya programu',

    fullName: 'JINA',
    gender: 'JINSIA',
    birthDate: 'TAREHE YA KUZALIWA',
    birthDateHint: 'MWAKA-MWEZI-SIKU',
    age: 'Umri',
    years: 'miaka',
    height: 'URefu (CM)',
    weight: 'UZITO (KG)',
    bmi: 'BMI',
    bmiUnknown: 'Ongeza urefu na uzito wako ili kuona hii.',
    bmiUnder: 'Chini ya kiwango cha kawaida',
    bmiHealthy: 'Katika kiwango cha kawaida',
    bmiOver: 'Juu ya kiwango cha kawaida',
    bmiObese: 'Juu sana ya kiwango cha kawaida',
    bmiNote:
      'BMI ni kipimo cha jumla, sio uchunguzi wa daktari. Haisemi chochote kuhusu misuli, muundo wa mwili au afya yako.',

    youSection: 'WEWE',
    appSection: 'PROGRAMU',
    personalDetails: 'Taarifa zako',
    personalDetailsSub: 'Jina, jinsia, tarehe ya kuzaliwa, urefu na uzito',
    dailyGoals: 'Malengo ya kila siku',
    appPreferences: 'Mapendeleo',
    unsaved: 'Bado haijahifadhiwa',
    discard: 'Rudisha',
    useDetectedZone: 'Tumia saa za simu hii',
    otherZone: 'Niandike mwenyewe',
    less: 'Punguza',
    more: 'Ongeza',
    perDay: 'kwa siku',
    perNight: 'kwa usiku',

    settings: 'Mipangilio',
    settingsSub: 'Wasifu wako, malengo yako, na nani anaweza kuingia katika akaunti yako.',
    sectionProfile: 'WASIFU',
    sectionPrefs: 'MAPENDELEO',
    sectionGoals: 'MALENGO YA KILA SIKU',
    sectionSecurity: 'USALAMA',
    sectionAccount: 'AKAUNTI',
    save: 'Hifadhi mabadiliko',
    saving: 'Inahifadhi',
    saved: 'Imehifadhiwa',
    nothingToSave: 'Hakuna kilichobadilika bado.',

    language: 'LUGHA',
    units: 'VIPIMO',
    unitsMetric: 'Metriki',
    unitsImperial: 'Imperial',
    timezone: 'SAA ZA ENEO',
    timezoneNote:
      'Huamua siku yako inapoanza na kuisha, ili kitu ulichoingiza usiku kihesabike siku inayofaa.',
    cycleTracking: 'Ufuatiliaji wa mzunguko',
    cycleNote: 'Huongeza vipengele vya hedhi na mzunguko. Unaweza kuizima wakati wowote.',

    stepGoal: 'HATUA KWA SIKU',
    stepGoalNote: 'Kati ya 500 na 100,000.',
    waterGoal: 'GLASI ZA MAJI KWA SIKU',
    waterGoalNote: 'Kati ya 1 na 30.',
    sleepGoal: 'MASAA YA KULALA KWA USIKU',
    sleepGoalNote: 'Kati ya 3 na 14.',
    glasses: 'glasi',
    hours: 'masaa',
    steps: 'hatua',

    changePassword: 'Badilisha nenosiri',
    changePasswordNote: 'Hukutoa kwenye vifaa vingine vyote.',
    currentPassword: 'NENOSIRI LA SASA',
    newPasswordLabel: 'NENOSIRI JIPYA',
    confirmNewPassword: 'THIBITISHA NENOSIRI JIPYA',
    changePasswordCta: 'Badilisha nenosiri langu',
    passwordChanged: 'Nenosiri lako limebadilishwa.',
    trustedDevices: 'Simu zinazoaminika',
    trustedDevicesNote:
      'Hizi zinaweza kuingia bila msimbo wa barua pepe. Ondoa yoyote usiyoitambua.',
    thisPhone: 'Simu hii',
    lastSeen: 'Mara ya mwisho',
    trustEnds: 'Uaminifu unaisha',
    revoke: 'Ondoa',
    revoked: 'Imeondolewa.',
    noDevices: 'Hakuna simu nyingine inayoaminika.',

    emailAddress: 'BARUA PEPE',
    signOutEverywhere: 'Toka',
    deleteAccount: 'Futa akaunti yangu',
    deleteAccountNote: 'Ya kudumu. Kila kitu kinaondoka.',
    deleteWarning:
      'Hii inafuta akaunti yako na kila taarifa ya afya iliyo ndani yake. Haiwezi kurudishwa na hatuwezi kuirejesha kwako.',
    deleteConfirmLabel: 'NENOSIRI LAKO',
    deleteCta: 'Futa kila kitu',
    deleteTypeLabel: 'ANDIKA FUTA ILI KUTHIBITISHA',
    deleteTypeWord: 'FUTA',

    edit: 'Badilisha',
    cancel: 'Ghairi',
    loading: 'Inapakia',
    retry: 'Jaribu tena',
    outOfRange: 'Nambari hiyo iko nje ya kiwango kinachoruhusiwa.',
  },

  rn: {
    greetMorning: 'Bwakeye',
    greetAfternoon: 'Mwiriwe',
    greetEvening: 'Mwiriwe',
    dashSub: 'Ibi ni ivyo porogaramu izi kuri wewe ubu. Gukurikirana biraza.',
    yourProfile: 'UMWIDONDORO WAWE',
    openSettings: 'Ibigenamiterere',
    memberSince: 'Turi kumwe kuva',
    notSet: 'Ntibashizwemwo',
    verified: 'Imeyili yemejwe',
    unverifiedShort: 'Imeyili ntiyemejwe',
    confirmNow: 'Yemeza',

    photo: 'IFOTO',
    addPhoto: 'Shiramwo ifoto',
    changePhoto: 'Hindura ifoto',
    removePhoto: 'Kura ifoto',
    uploadingPhoto: 'Ifoto yawe irarungikwa…',
    photoHint: 'Ikaruro kingana impande zose ni co kiza. Turayigabanya imbere yo kurungika, ntibitwara data nyinshi.',
    permissionDenied: 'Dukeneye uruhusha rwo kwugurura amafoto yawe.',
    openAppSettings: 'Ugurura ibigenamiterere vya porogaramu',

    fullName: 'IZINA',
    gender: 'IGITSINA',
    birthDate: 'ITARIKI Y’IVUKA',
    birthDateHint: 'UMWAKA-UKWEZI-UMUSI',
    age: 'Imyaka',
    years: 'imyaka',
    height: 'UBUREBURE (CM)',
    weight: 'IBIRO (KG)',
    bmi: 'BMI',
    bmiUnknown: 'Shiramwo uburebure n’ibiro vyawe ubone ibi.',
    bmiUnder: 'Munsi y’urugero rusanzwe',
    bmiHealthy: 'Mu rugero rusanzwe',
    bmiOver: 'Hejuru y’urugero rusanzwe',
    bmiObese: 'Hejuru cane y’urugero rusanzwe',
    bmiNote:
      'BMI ni ikimenyetso gito, ntiyo isuzuma ry’umuganga. Ntivuga ikintu ku mikaya, ku mubumbe w’umubiri canke ku magara yawe.',

    youSection: 'WEWE',
    appSection: 'POROGARAMU',
    personalDetails: 'Amakuru yawe',
    personalDetailsSub: 'Izina, igitsina, itariki y’ivuka, uburebure n’ibiro',
    dailyGoals: 'Intumbero z’umusi',
    appPreferences: 'Ivyo ukunda',
    unsaved: 'Ntibiribitswe',
    discard: 'Subiza',
    useDetectedZone: 'Koresha isaha y’iyi terefone',
    otherZone: 'Nzoyandika jewe',
    less: 'Gabanya',
    more: 'Ongereza',
    perDay: 'ku musi',
    perNight: 'mw’ijoro',

    settings: 'Ibigenamiterere',
    settingsSub: 'Umwidondoro wawe, intumbero zawe, n’uwushobora kwinjira mu konte yawe.',
    sectionProfile: 'UMWIDONDORO',
    sectionPrefs: 'IVYO UKUNDA',
    sectionGoals: 'INTUMBERO Z’UMUSI',
    sectionSecurity: 'UMUTEKANO',
    sectionAccount: 'KONTE',
    save: 'Bika impinduka',
    saving: 'Birabikwa',
    saved: 'Vyabitswe',
    nothingToSave: 'Nta kintu cahindutse ubu.',

    language: 'URURIMI',
    units: 'IBIPIMO',
    unitsMetric: 'Metriki',
    unitsImperial: 'Imperial',
    timezone: 'ISAHA Y’AKARERE',
    timezoneNote:
      'Ni yo yerekana aho umusi wawe utangura n’aho uhera, ku buryo ico wanditse mw’ijoro kiharurwa ku musi ubereye.',
    cycleTracking: 'Gukurikirana ukwezi',
    cycleNote: 'Vyongera ibijanye n’imihango n’ukwezi. Urashobora kubihagarika igihe ushaka.',

    stepGoal: 'INTAMBWE KU MUSI',
    stepGoalNote: 'Hagati ya 500 na 100.000.',
    waterGoal: 'IBIROBO VY’AMAZI KU MUSI',
    waterGoalNote: 'Hagati ya 1 na 30.',
    sleepGoal: 'AMASAHA YO KURYAMA MW’IJORO',
    sleepGoalNote: 'Hagati ya 3 na 14.',
    glasses: 'ibirobo',
    hours: 'amasaha',
    steps: 'intambwe',

    changePassword: 'Hindura ijambo ry’ibanga',
    changePasswordNote: 'Bikuvana ku bikoresho vyose bindi.',
    currentPassword: 'IJAMBO RY’IBANGA RIRIHO',
    newPasswordLabel: 'IJAMBO RY’IBANGA RISHASHA',
    confirmNewPassword: 'EMEZA IJAMBO RISHASHA',
    changePasswordCta: 'Hindura ijambo ryanje',
    passwordChanged: 'Ijambo ryawe ry’ibanga ryahinduwe.',
    trustedDevices: 'Terefone zizewe',
    trustedDevicesNote:
      'Izi zirashobora kwinjira ata code yoherejwe kuri imeyili. Kura izo utazi.',
    thisPhone: 'Iyi terefone',
    lastSeen: 'Iheruka gukoreshwa',
    trustEnds: 'Icizere kirangira',
    revoke: 'Kura',
    revoked: 'Yakuwe.',
    noDevices: 'Nta yindi terefone yizewe.',

    emailAddress: 'IMEYILI',
    signOutEverywhere: 'Sohoka',
    deleteAccount: 'Hanagura konte yanje',
    deleteAccountNote: 'Bizoba burundu. Vyose birazoshira.',
    deleteWarning:
      'Ibi bihanagura konte yawe n’amakuru yose y’amagara ari muri yo. Ntibishobora kugarukwa kandi ntidushobora kubigarukana.',
    deleteConfirmLabel: 'IJAMBO RYAWE RY’IBANGA',
    deleteCta: 'Hanagura vyose',
    deleteTypeLabel: 'ANDIKA HANAGURA KWEMEZA',
    deleteTypeWord: 'HANAGURA',

    edit: 'Hindura',
    cancel: 'Reka',
    loading: 'Birapakirwa',
    retry: 'Gerageza',
    outOfRange: 'Iyo nomero iri hanze y’urugero rwemewe.',
  },
};

/** Morning / afternoon / evening, from the phone's own clock. */
export const greetingFor = (copy: AppCopy, date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return copy.greetMorning;
  if (hour < 18) return copy.greetAfternoon;
  return copy.greetEvening;
};

/** Whole years, counting only birthdays that have actually happened. */
export const ageFrom = (birthDate?: string | null): number | null => {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) years -= 1;

  return years >= 0 && years < 130 ? years : null;
};

// WHO BMI bands, worded as "the usual range" rather than "healthy".
export const bmiBand = (bmi: number | null, copy: AppCopy): { text: string; tone: 'low' | 'ok' | 'high' } | null => {
  if (bmi == null) return null;
  if (bmi < 18.5) return { text: copy.bmiUnder, tone: 'low' };
  if (bmi < 25) return { text: copy.bmiHealthy, tone: 'ok' };
  if (bmi < 30) return { text: copy.bmiOver, tone: 'high' };
  return { text: copy.bmiObese, tone: 'high' };
};

/** An ISO date or timestamp as a short local date, or null if unparseable. */
export const shortDate = (value?: string | null, lang: Lang = 'en'): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  try {
    return parsed.toLocaleDateString(lang === 'rn' ? 'fr' : lang, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return parsed.toISOString().slice(0, 10);
  }
};
