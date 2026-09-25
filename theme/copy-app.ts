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

  // habits
  habitsToday: string;
  dayToday: string;
  waterLabel: string;
  stepsLabel: string;
  sleepLabel: string;
  addGlass: string;
  removeGlass: string;
  stepsHint: string;
  streak: string;
  noStreak: string;
  goalMet: string;
  of: string;
  couldNotLoad: string;
  stepsTitle: string;
  stepsSub: string;
  stepsHistory: string;
  last14Days: string;
  enableSteps: string;
  enableStepsNote: string;
  stepsDenied: string;
  liveOnlyNote: string;
  noStepSensor: string;
  enterSteps: string;
  average: string;
  bestDay: string;
  distance: string;
  streakLabel: string;
  kmUnit: string;
  ofGoal: string;
  addHalfHour: string;
  removeHalfHour: string;
  seeHistory: string;
  seeHistorySub: string;
  menuHome: string;
  menuProfile: string;
  trackSleep: string;
  trackSleepNoteAndroid: string;
  trackSleepNoteIos: string;
  sleepAutoAndroid: string;
  sleepAutoIos: string;
  sleepNotStarted: string;
  waterReminders: string;
  waterRemindersNote: string;
  waterReminderTitle: string;
  waterReminderBody: string;
  addGlassAction: string;
  remindMe: string;
  remindersOn: string;
  notificationsDenied: string;
  openDetails: string;
  lastNight: string;
  waterSub: string;
  sleepSub: string;
  longestNight: string;
  remindersSection: string;
  autoTracking: string;
  mostWater: string;

  // check-in
  checkInLabel: string;
  checkInSub: string;
  checkInPrompt: string;
  checkInPromptSub: string;
  checkInCta: string;
  moodLabel: string;
  energyLabel: string;
  checkInNote: string;
  checkInNotePlaceholder: string;
  checkInSave: string;
  checkInUpdate: string;
  checkInSaved: string;
  checkInRemove: string;
  checkInRemoveConfirm: string;
  checkInRemoved: string;
  remove: string;
  moodAverage: string;
  energyAverage: string;
  checkInDays: string;
  checkInHistory: string;
  noCheckIns: string;
  pickBoth: string;
  moodName: string;
  energyName: string;
  last30Days: string;
  moodWords: [string, string, string, string, string];
  energyWords: [string, string, string, string, string];
};

export const APP_COPY: Record<Lang, AppCopy> = {
  en: {
    greetMorning: 'Good morning',
    greetAfternoon: 'Good afternoon',
    greetEvening: 'Good evening',
    dashSub: 'Your day at a glance.',
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
    habitsToday: 'TODAY',
    dayToday: 'Today',
    waterLabel: 'Water',
    stepsLabel: 'Steps',
    sleepLabel: 'Sleep',
    addGlass: 'Add a glass',
    removeGlass: 'Remove a glass',
    stepsHint: 'Type the number from your phone’s step counter.',
    streak: '{n}-day streak',
    noStreak: 'No streak yet',
    goalMet: 'Goal met',
    of: 'of',
    couldNotLoad: 'Could not load your day.',
    stepsTitle: 'Steps',
    stepsSub: 'Counted automatically by your phone.',
    stepsHistory: 'LAST 30 DAYS',
    last14Days: 'LAST 14 DAYS',
    enableSteps: 'Count my steps automatically',
    enableStepsNote: 'Imara Afya uses your phone’s step sensor. Only the daily total is saved to your account.',
    stepsDenied: 'Step counting is off. Allow “Physical activity” for Imara Afya in your phone settings.',
    liveOnlyNote: 'On this version of the app, steps are only counted while it is open.',
    noStepSensor: 'This phone has no step sensor. You can enter your steps yourself.',
    enterSteps: 'ENTER STEPS',
    average: 'Daily average (7 days)',
    bestDay: 'Best day',
    distance: 'Distance',
    streakLabel: 'Streak',
    kmUnit: 'km',
    ofGoal: 'Of goal',
    addHalfHour: 'Add half an hour',
    removeHalfHour: 'Remove half an hour',
    seeHistory: 'Steps history',
    seeHistorySub: 'Last 30 days',
    menuHome: 'Home',
    menuProfile: 'Profile',
    trackSleep: 'Track my sleep automatically',
    trackSleepNoteAndroid: 'Your phone estimates sleep from movement and light at night. Correct it with − and + if needed.',
    trackSleepNoteIos: 'Reads your sleep from Apple Health (Sleep Schedule or an Apple Watch). Correct it with − and + if needed.',
    sleepAutoAndroid: 'Estimated by your phone · correct with − and +',
    sleepAutoIos: 'From Apple Health · correct with − and +',
    sleepNotStarted: 'Sleep tracking could not start. Check the permission in your phone settings.',
    waterReminders: 'Water reminders',
    waterRemindersNote: 'At 9:00, 12:00, 15:00 and 18:00, with a “+1 glass” button.',
    waterReminderTitle: 'Time for a glass of water',
    waterReminderBody: 'Tap “+1 glass” once you have had one.',
    addGlassAction: '+1 glass',
    remindMe: 'Remind me to drink water',
    remindersOn: 'Water reminders are on',
    notificationsDenied: 'Notifications are off for Imara Afya. Turn them on in your phone settings.',
    openDetails: 'Opens the details',
    lastNight: 'Last night',
    waterSub: 'Glasses of water, one tap at a time.',
    sleepSub: 'Hours slept each night.',
    longestNight: 'Longest night',
    remindersSection: 'REMINDERS',
    autoTracking: 'AUTOMATIC TRACKING',
    mostWater: 'Most water',

    checkInLabel: 'Check-in',
    checkInSub: 'How you feel, one moment a day.',
    checkInPrompt: 'How are you feeling today?',
    checkInPromptSub: 'Two taps: your mood and your energy.',
    checkInCta: 'Check in',
    moodLabel: 'MOOD',
    energyLabel: 'ENERGY',
    checkInNote: 'NOTE (OPTIONAL)',
    checkInNotePlaceholder: 'Anything on your mind?',
    checkInSave: 'Save check-in',
    checkInUpdate: 'Update check-in',
    checkInSaved: 'Check-in saved',
    checkInRemove: 'Remove today’s check-in',
    checkInRemoveConfirm: 'Remove today’s check-in?',
    checkInRemoved: 'Check-in removed',
    remove: 'Remove',
    moodAverage: 'Mood (7 days)',
    energyAverage: 'Energy (7 days)',
    checkInDays: 'Days checked in (30 days)',
    checkInHistory: 'RECENT CHECK-INS',
    noCheckIns: 'No check-ins yet. Your first one starts your streak.',
    pickBoth: 'Choose your mood and your energy.',
    moodName: 'Mood',
    energyName: 'Energy',
    last30Days: 'LAST 30 DAYS',
    moodWords: ['Very low', 'Low', 'Okay', 'Good', 'Very good'],
    energyWords: ['Exhausted', 'Tired', 'Okay', 'Energetic', 'Full of energy'],
  },

  fr: {
    greetMorning: 'Bonjour',
    greetAfternoon: 'Bon après-midi',
    greetEvening: 'Bonsoir',
    dashSub: 'Votre journée en un coup d’œil.',
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
    habitsToday: 'AUJOURD’HUI',
    dayToday: 'Aujourd’hui',
    waterLabel: 'Eau',
    stepsLabel: 'Pas',
    sleepLabel: 'Sommeil',
    addGlass: 'Ajouter un verre',
    removeGlass: 'Retirer un verre',
    stepsHint: 'Saisissez le nombre indiqué par le podomètre de votre téléphone.',
    streak: '{n} jours d’affilée',
    noStreak: 'Pas encore de série',
    goalMet: 'Objectif atteint',
    of: 'sur',
    couldNotLoad: 'Impossible de charger votre journée.',
    stepsTitle: 'Pas',
    stepsSub: 'Comptés automatiquement par votre téléphone.',
    stepsHistory: '30 DERNIERS JOURS',
    last14Days: '14 DERNIERS JOURS',
    enableSteps: 'Compter mes pas automatiquement',
    enableStepsNote: 'Imara Afya utilise le capteur de pas de votre téléphone. Seul le total du jour est enregistré sur votre compte.',
    stepsDenied: 'Le comptage des pas est désactivé. Autorisez « Activité physique » pour Imara Afya dans les réglages du téléphone.',
    liveOnlyNote: 'Sur cette version de l’application, les pas ne sont comptés que lorsqu’elle est ouverte.',
    noStepSensor: 'Ce téléphone n’a pas de capteur de pas. Vous pouvez saisir vos pas vous-même.',
    enterSteps: 'SAISIR LES PAS',
    average: 'Moyenne par jour (7 jours)',
    bestDay: 'Meilleur jour',
    distance: 'Distance',
    streakLabel: 'Série',
    kmUnit: 'km',
    ofGoal: 'De l’objectif',
    addHalfHour: 'Ajouter une demi-heure',
    removeHalfHour: 'Retirer une demi-heure',
    seeHistory: 'Historique des pas',
    seeHistorySub: '30 derniers jours',
    menuHome: 'Accueil',
    menuProfile: 'Profil',
    trackSleep: 'Suivre mon sommeil automatiquement',
    trackSleepNoteAndroid: 'Votre téléphone estime votre sommeil grâce aux mouvements et à la lumière la nuit. Corrigez avec − et + si besoin.',
    trackSleepNoteIos: 'Lit votre sommeil dans Santé d’Apple (horaire de sommeil ou Apple Watch). Corrigez avec − et + si besoin.',
    sleepAutoAndroid: 'Estimé par votre téléphone · corrigez avec − et +',
    sleepAutoIos: 'Depuis Santé d’Apple · corrigez avec − et +',
    sleepNotStarted: 'Le suivi du sommeil n’a pas pu démarrer. Vérifiez l’autorisation dans les réglages du téléphone.',
    waterReminders: 'Rappels d’eau',
    waterRemindersNote: 'À 9 h, 12 h, 15 h et 18 h, avec un bouton « +1 verre ».',
    waterReminderTitle: 'C’est l’heure d’un verre d’eau',
    waterReminderBody: 'Touchez « +1 verre » une fois que vous en avez bu un.',
    addGlassAction: '+1 verre',
    remindMe: 'Me rappeler de boire de l’eau',
    remindersOn: 'Les rappels d’eau sont activés',
    notificationsDenied: 'Les notifications sont désactivées pour Imara Afya. Activez-les dans les réglages du téléphone.',
    openDetails: 'Ouvre les détails',
    lastNight: 'La nuit dernière',
    waterSub: 'Des verres d’eau, un geste à la fois.',
    sleepSub: 'Heures de sommeil chaque nuit.',
    longestNight: 'Nuit la plus longue',
    remindersSection: 'RAPPELS',
    autoTracking: 'SUIVI AUTOMATIQUE',
    mostWater: 'Le plus d’eau',

    checkInLabel: 'Bilan du jour',
    checkInSub: 'Comment vous vous sentez, un moment par jour.',
    checkInPrompt: 'Comment vous sentez-vous aujourd’hui ?',
    checkInPromptSub: 'Deux touches : votre humeur et votre énergie.',
    checkInCta: 'Faire le bilan',
    moodLabel: 'HUMEUR',
    energyLabel: 'ÉNERGIE',
    checkInNote: 'NOTE (FACULTATIF)',
    checkInNotePlaceholder: 'Quelque chose en tête ?',
    checkInSave: 'Enregistrer le bilan',
    checkInUpdate: 'Mettre à jour le bilan',
    checkInSaved: 'Bilan enregistré',
    checkInRemove: 'Supprimer le bilan du jour',
    checkInRemoveConfirm: 'Supprimer le bilan du jour ?',
    checkInRemoved: 'Bilan supprimé',
    remove: 'Supprimer',
    moodAverage: 'Humeur (7 jours)',
    energyAverage: 'Énergie (7 jours)',
    checkInDays: 'Jours avec bilan (30 jours)',
    checkInHistory: 'BILANS RÉCENTS',
    noCheckIns: 'Aucun bilan pour l’instant. Le premier lance votre série.',
    pickBoth: 'Choisissez votre humeur et votre énergie.',
    moodName: 'Humeur',
    energyName: 'Énergie',
    last30Days: '30 DERNIERS JOURS',
    moodWords: ['Très bas', 'Bas', 'Correct', 'Bien', 'Très bien'],
    energyWords: ['Épuisé', 'Fatigué', 'Correct', 'En forme', 'Plein d’énergie'],
  },

  sw: {
    greetMorning: 'Habari za asubuhi',
    greetAfternoon: 'Habari za mchana',
    greetEvening: 'Habari za jioni',
    dashSub: 'Siku yako kwa muhtasari.',
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
    habitsToday: 'LEO',
    dayToday: 'Leo',
    waterLabel: 'Maji',
    stepsLabel: 'Hatua',
    sleepLabel: 'Usingizi',
    addGlass: 'Ongeza glasi',
    removeGlass: 'Ondoa glasi',
    stepsHint: 'Andika idadi kutoka kihesabu hatua cha simu yako.',
    streak: 'Siku {n} mfululizo',
    noStreak: 'Bado hakuna mfululizo',
    goalMet: 'Lengo limefikiwa',
    of: 'kati ya',
    couldNotLoad: 'Imeshindikana kupakia siku yako.',
    stepsTitle: 'Hatua',
    stepsSub: 'Zinahesabiwa na simu yako moja kwa moja.',
    stepsHistory: 'SIKU 30 ZILIZOPITA',
    last14Days: 'SIKU 14 ZILIZOPITA',
    enableSteps: 'Hesabu hatua zangu moja kwa moja',
    enableStepsNote: 'Imara Afya hutumia kihisi hatua cha simu yako. Jumla ya siku pekee ndiyo huhifadhiwa kwenye akaunti yako.',
    stepsDenied: 'Kuhesabu hatua kumezimwa. Ruhusu “Shughuli za mwili” kwa Imara Afya kwenye mipangilio ya simu.',
    liveOnlyNote: 'Kwenye toleo hili la programu, hatua huhesabiwa tu programu ikiwa wazi.',
    noStepSensor: 'Simu hii haina kihisi hatua. Unaweza kuandika hatua zako mwenyewe.',
    enterSteps: 'ANDIKA HATUA',
    average: 'Wastani wa siku (siku 7)',
    bestDay: 'Siku bora',
    distance: 'Umbali',
    streakLabel: 'Mfululizo',
    kmUnit: 'km',
    ofGoal: 'Ya lengo',
    addHalfHour: 'Ongeza nusu saa',
    removeHalfHour: 'Punguza nusu saa',
    seeHistory: 'Historia ya hatua',
    seeHistorySub: 'Siku 30 zilizopita',
    menuHome: 'Nyumbani',
    menuProfile: 'Wasifu',
    trackSleep: 'Fuatilia usingizi wangu moja kwa moja',
    trackSleepNoteAndroid: 'Simu yako hukadiria usingizi kutokana na mwendo na mwanga usiku. Rekebisha kwa − na + ikihitajika.',
    trackSleepNoteIos: 'Husoma usingizi wako kutoka Apple Health (ratiba ya usingizi au Apple Watch). Rekebisha kwa − na + ikihitajika.',
    sleepAutoAndroid: 'Umekadiriwa na simu yako · rekebisha kwa − na +',
    sleepAutoIos: 'Kutoka Apple Health · rekebisha kwa − na +',
    sleepNotStarted: 'Ufuatiliaji wa usingizi haukuweza kuanza. Angalia ruhusa kwenye mipangilio ya simu.',
    waterReminders: 'Vikumbusho vya maji',
    waterRemindersNote: 'Saa 3:00, 6:00, 9:00 na 12:00, na kitufe cha “+1 glasi”.',
    waterReminderTitle: 'Ni wakati wa glasi ya maji',
    waterReminderBody: 'Gusa “+1 glasi” ukishakunywa moja.',
    addGlassAction: '+1 glasi',
    remindMe: 'Nikumbushe kunywa maji',
    remindersOn: 'Vikumbusho vya maji vimewashwa',
    notificationsDenied: 'Arifa zimezimwa kwa Imara Afya. Ziwashe kwenye mipangilio ya simu.',
    openDetails: 'Hufungua maelezo',
    lastNight: 'Usiku uliopita',
    waterSub: 'Glasi za maji, mguso mmoja kwa wakati.',
    sleepSub: 'Masaa ya usingizi kila usiku.',
    longestNight: 'Usiku mrefu zaidi',
    remindersSection: 'VIKUMBUSHO',
    autoTracking: 'UFUATILIAJI WA MOJA KWA MOJA',
    mostWater: 'Maji mengi zaidi',

    checkInLabel: 'Hali ya leo',
    checkInSub: 'Unavyojisikia, dakika moja kila siku.',
    checkInPrompt: 'Unajisikiaje leo?',
    checkInPromptSub: 'Miguso miwili: hali ya moyo na nguvu zako.',
    checkInCta: 'Andika hali',
    moodLabel: 'HALI YA MOYO',
    energyLabel: 'NGUVU',
    checkInNote: 'MAELEZO (SI LAZIMA)',
    checkInNotePlaceholder: 'Kuna jambo lolote akilini?',
    checkInSave: 'Hifadhi hali',
    checkInUpdate: 'Sasisha hali',
    checkInSaved: 'Hali imehifadhiwa',
    checkInRemove: 'Futa hali ya leo',
    checkInRemoveConfirm: 'Futa hali ya leo?',
    checkInRemoved: 'Hali imefutwa',
    remove: 'Futa',
    moodAverage: 'Hali ya moyo (siku 7)',
    energyAverage: 'Nguvu (siku 7)',
    checkInDays: 'Siku zilizoandikwa (siku 30)',
    checkInHistory: 'HALI ZA KARIBUNI',
    noCheckIns: 'Bado hakuna hali iliyoandikwa. Ya kwanza inaanzisha mfululizo wako.',
    pickBoth: 'Chagua hali ya moyo na nguvu zako.',
    moodName: 'Hali ya moyo',
    energyName: 'Nguvu',
    last30Days: 'SIKU 30 ZILIZOPITA',
    moodWords: ['Mbaya sana', 'Mbaya', 'Sawa', 'Nzuri', 'Nzuri sana'],
    energyWords: ['Nimechoka sana', 'Nimechoka', 'Sawa', 'Nina nguvu', 'Nguvu tele'],
  },

  rn: {
    greetMorning: 'Bwakeye',
    greetAfternoon: 'Mwiriwe',
    greetEvening: 'Mwiriwe',
    dashSub: 'Umusi wawe mu ncamake.',
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
    habitsToday: 'UYU MUNSI',
    dayToday: 'Uyu munsi',
    waterLabel: 'Amazi',
    stepsLabel: 'Intambwe',
    sleepLabel: 'Ibitotsi',
    addGlass: 'Ongeramwo ikirobo',
    removeGlass: 'Kuramwo ikirobo',
    stepsHint: 'Andika igitigiri kiri ku gaharuro k’intambwe ka terefone yawe.',
    streak: 'Imisi {n} ikurikirana',
    noStreak: 'Nta ruhererekane rurabaho',
    goalMet: 'Intumbero yashitse',
    of: 'kuri',
    couldNotLoad: 'Ntivyakunze gupakira umusi wawe.',
    stepsTitle: 'Intambwe',
    stepsSub: 'Ziharurwa na terefone yawe ubwayo.',
    stepsHistory: 'IMISI 30 IHEZE',
    last14Days: 'IMISI 14 IHEZE',
    enableSteps: 'Harura intambwe zanje ubwayo',
    enableStepsNote: 'Imara Afya ikoresha agakoresho k’intambwe ka terefone yawe. Igiteranyo c’umusi gusa ni co kibikwa kuri konte yawe.',
    stepsDenied: 'Guharura intambwe kwahagaritswe. Rekurira “Ibikorwa vy’umubiri” Imara Afya mu mategeko ya terefone.',
    liveOnlyNote: 'Kuri iyi verisiyo ya porogaramu, intambwe ziharurwa gusa iyo yuguruye.',
    noStepSensor: 'Iyi terefone ntigira agakoresho k’intambwe. Ushobora kwiyandikira intambwe zawe.',
    enterSteps: 'ANDIKA INTAMBWE',
    average: 'Ikigereranyo c’umusi (imisi 7)',
    bestDay: 'Umusi mwiza',
    distance: 'Urugendo',
    streakLabel: 'Uruhererekane',
    kmUnit: 'km',
    ofGoal: 'Vy’intumbero',
    addHalfHour: 'Ongeramwo isaha igice',
    removeHalfHour: 'Kuramwo isaha igice',
    seeHistory: 'Kahise k’intambwe',
    seeHistorySub: 'Imisi 30 iheze',
    menuHome: 'Ahabanza',
    menuProfile: 'Umwirondoro',
    trackSleep: 'Kurikirana ibitotsi vyanje ubwavyo',
    trackSleepNoteAndroid: 'Terefone yawe igereranya ibitotsi ikoresheje ivyiyumviro n’umuco mw’ijoro. Kosora na − na + nibiba ngombwa.',
    trackSleepNoteIos: 'Isoma ibitotsi vyawe muri Apple Health (gahunda y’ibitotsi canke Apple Watch). Kosora na − na + nibiba ngombwa.',
    sleepAutoAndroid: 'Vyagereranijwe na terefone yawe · kosora na − na +',
    sleepAutoIos: 'Biva muri Apple Health · kosora na − na +',
    sleepNotStarted: 'Gukurikirana ibitotsi ntivyashoboye gutangura. Raba uruhusha mu mategeko ya terefone.',
    waterReminders: 'Ivyibutsa vy’amazi',
    waterRemindersNote: 'Isaha 9:00, 12:00, 15:00 na 18:00, hamwe n’agafyondo “+1 ikirobo”.',
    waterReminderTitle: 'N’igihe c’ikirobo c’amazi',
    waterReminderBody: 'Fyonda “+1 ikirobo” umaze kunywa kimwe.',
    addGlassAction: '+1 ikirobo',
    remindMe: 'Nyibutsa kunywa amazi',
    remindersOn: 'Ivyibutsa vy’amazi vyatanguye',
    notificationsDenied: 'Imenyesha ryahagaritswe kuri Imara Afya. Ritangure mu mategeko ya terefone.',
    openDetails: 'Bifungura ibisobanuro',
    lastNight: 'Ijoro riheze',
    waterSub: 'Ibirobo vy’amazi, gufyonda rimwe.',
    sleepSub: 'Amasaha waryamye buri joro.',
    longestNight: 'Ijoro rirerire kuruta',
    remindersSection: 'IVYIBUTSA',
    autoTracking: 'GUKURIKIRANA UBWAVYO',
    mostWater: 'Amazi menshi kuruta',

    checkInLabel: 'Uko gute uyu munsi',
    checkInSub: 'Ingene wiyumva, akanya gato buri munsi.',
    checkInPrompt: 'Wiyumva gute uyu munsi?',
    checkInPromptSub: 'Gukanda kabiri: umutima wawe n’inguvu zawe.',
    checkInCta: 'Andika',
    moodLabel: 'INGENE WIYUMVA',
    energyLabel: 'INGUVU',
    checkInNote: 'ICANDIKO (SI NGOMBWA)',
    checkInNotePlaceholder: 'Hari ico uriko uriyumvira?',
    checkInSave: 'Bika',
    checkInUpdate: 'Hindura',
    checkInSaved: 'Vyabitswe',
    checkInRemove: 'Kuraho ivy’uyu munsi',
    checkInRemoveConfirm: 'Kuraho ivy’uyu munsi?',
    checkInRemoved: 'Vyakuweho',
    remove: 'Kuraho',
    moodAverage: 'Ingene wiyumva (iminsi 7)',
    energyAverage: 'Inguvu (iminsi 7)',
    checkInDays: 'Iminsi wanditse (iminsi 30)',
    checkInHistory: 'IVYANDITSWE VUBA',
    noCheckIns: 'Nta co urandika. Ica mbere gitangura urukurikirane rwawe.',
    pickBoth: 'Hitamwo ingene wiyumva n’inguvu zawe.',
    moodName: 'Ingene wiyumva',
    energyName: 'Inguvu',
    last30Days: 'IMINSI 30 IHERUKA',
    moodWords: ['Nabi cane', 'Nabi', 'Ni sawa', 'Neza', 'Neza cane'],
    energyWords: ['Naruhijwe cane', 'Naruhijwe', 'Ni sawa', 'Mfise inguvu', 'Inguvu nyinshi'],
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
