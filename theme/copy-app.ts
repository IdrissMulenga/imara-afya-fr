// Copy for the in-app screens (auth and welcome copy is in i18n.tsx).
// Kiswahili and Ikirundi are drafts pending review by a native speaker.
import type { Lang } from './i18n';

/** low = score 1–2, mid = 3, high = 4–5. */
export type MoodBand = 'low' | 'mid' | 'high';

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
  moodReminders: string;
  moodRemindersNote: string;
  moodReminderTitle: string;
  moodReminderBody: string;
  warmMessages: string;
  warmMessagesNote: string;
  warmMessageTitle: string;
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
  checkInQuickHint: string;
  checkInDetails: string;
  menuCheckIn: string;
  /** Warm message by mood (outer) and energy (inner): low = 1–2, mid = 3, high = 4–5. */
  moodMessages: Record<MoodBand, Record<MoodBand, string>>;
  moodSupport: string;
  /** {h} is a duration such as "7 h 30 min". */
  sleepScheduleTitle: string;
  sleepScheduleEmpty: string;
  sleepScheduleSet: string;
  bedtimeLabel: string;
  wakeUpLabel: string;
  sleepGoalShort: string;
  inBedHours: string;
  meetsGoal: string;
  shortOfGoal: string;
  saveSchedule: string;
  removeSchedule: string;
  scheduleSaved: string;
  scheduleRemoved: string;
  bedtimeReminders: string;
  bedtimeRemindersNote: string;
  windDownTitle: string;
  windDownBody: string;
  goodMorningTitle: string;
  goodMorningBody: string;
  sleepFromSchedule: string;
  dragToAdjust: string;
  weekdaysLabel: string;
  weekendLabel: string;
  weekendDifferent: string;
  weekendNote: string;
  bedtimeRemindersNeedsSchedule: string;
  tonightSchedule: string;
  menuSleep: string;
  flowMoodTitle: string;
  flowEnergyTitle: string;
  flowNoteTitle: string;
  newCheckIn: string;
  /** {n} is a number of goals. */
  sectionFeel: string;
  sectionActivity: string;
  sectionWaterSleep: string;
  goalsMet: string;
  goalsAllMet: string;
  goalsNone: string;
  /** {n} is a number of days; {date} is a date. */
  menuCycle: string;
  cycleTitle: string;
  cycleSub: string;
  cycleDayN: string;
  phaseMenstrual: string;
  phaseFollicular: string;
  phaseFertile: string;
  phaseLuteal: string;
  phaseUnknown: string;
  nextPeriodIn: string;
  nextPeriodTomorrow: string;
  periodToday: string;
  periodLate: string;
  periodDayN: string;
  fertileFrom: string;
  fertileNow: string;
  periodStartedToday: string;
  periodEndedToday: string;
  periodStartedOn: string;
  periodEndedOn: string;
  anotherDay: string;
  cycleEmpty: string;
  legendPeriod: string;
  legendPredicted: string;
  legendFertile: string;
  legendOvulation: string;
  avgCycle: string;
  avgPeriod: string;
  usingTypical: string;
  periodsHistory: string;
  ongoing: string;
  daysN: string;
  removePeriodConfirm: string;
  periodSaved: string;
  periodRemoved: string;
  cycleDisclaimer: string;
  flowNone: string;
  flowSpotting: string;
  flowLight: string;
  flowMedium: string;
  flowHeavy: string;
  symCramps: string;
  symHeadache: string;
  symBackPain: string;
  symBloating: string;
  symTenderBreasts: string;
  symAcne: string;
  symFatigue: string;
  symNausea: string;
  symCravings: string;
  symInsomnia: string;
  symMoodSwings: string;
  symAnxiety: string;
  disDry: string;
  disSticky: string;
  disCreamy: string;
  disWatery: string;
  disEggWhite: string;
  disUnusual: string;
  tipMenstrual: string;
  tipFollicular: string;
  tipFertile: string;
  tipLuteal: string;
  tipUnknown: string;
  inMenstrual: string;
  inFollicular: string;
  inFertile: string;
  inLuteal: string;
  noteIrregular: string;
  noteShort: string;
  noteLong: string;
  noteLongPeriods: string;
  noteVeryLate: string;
  legendLogged: string;
  todayLogTitle: string;
  nothingLogged: string;
  logToday: string;
  editToday: string;
  insightsTitle: string;
  patternText: string;
  patternCount: string;
  upcomingTitle: string;
  upcomingFertile: string;
  openCalendar: string;
  calendarPageTitle: string;
  calendarPageSub: string;
  calendarAhead: string;
  calendarJourney: string;
  variationLabel: string;
  cycleOfN: string;
  autoEndedNote: string;
  setEndDay: string;
  cycleReminders: string;
  cycleRemindersNote: string;
  periodSoonTitle: string;
  periodSoonBody: string;
  fertileTitle: string;
  fertileBody: string;
  dayLogTitle: string;
  flowLabel: string;
  symptomsLabel: string;
  dischargeLabel: string;
  dayNoteLabel: string;
  futureDay: string;
  dayTooOld: string;
  dayInPeriod: string;
  dayExpectedPeriod: string;
  dayFertile: string;
  dayOvulation: string;
  periodStartedHere: string;
  periodEndedHere: string;
  reportTitle: string;
  reportSub: string;
  shareReport: string;
  reportSummary: string;
  reportGenerated: string;
  reportTypicalCycle: string;
  reportTypicalPeriod: string;
  reportCyclesLogged: string;
  reportNextPeriod: string;
  reportNotes: string;
  reportSymptoms: string;
  reportCycles: string;
  reportNoPeriods: string;
  /** {n} is the number of check-ins. */
  checkInAgain: string;
  checkInsToday: string;
  checkInsTodayOne: string;
  checkInTodayList: string;
  checkInRemoveOne: string;
  trendTitle: string;
  trend7: string;
  trend30: string;
  trendUp: string;
  trendDown: string;
  trendSteady: string;
  trendNotEnough: string;
  bestMorning: string;
  bestAfternoon: string;
  bestEvening: string;
  moodLabel: string;
  energyLabel: string;
  checkInNote: string;
  checkInNotePlaceholder: string;
  checkInSave: string;
  checkInSaved: string;
  checkInRemoved: string;
  remove: string;
  moodAverage: string;
  energyAverage: string;
  checkInDays: string;
  checkInHistory: string;
  noCheckIns: string;
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
    moodReminders: 'Mood check reminders',
    moodRemindersNote: 'At 9:00, 14:00 and 19:00. Skipped if you checked in shortly before.',
    moodReminderTitle: 'How are you feeling?',
    moodReminderBody: 'Take a moment to check in: pick a face and a battery.',
    warmMessages: 'Warm messages',
    warmMessagesNote: 'A kind note a few hours after you check in, based on how you feel.',
    warmMessageTitle: 'A note for you',
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
    checkInQuickHint: 'Tap a face and a battery. It saves by itself.',
    checkInDetails: 'Details',
    menuCheckIn: 'Mood',
    moodMessages: {
      low: {
        low: 'Today feels heavy, and that is okay. Be gentle with yourself: rest, drink some water and take it one small step at a time.',
        mid: 'Not every day is easy. Try one small thing that usually lifts you: a short walk, a song you love or a call to a friend.',
        high: 'You have energy even if your heart feels low. A walk outside or a talk with someone you trust might make it feel lighter.',
      },
      mid: {
        low: 'An okay day with low energy. Rest when you can, and try going to bed a little earlier tonight.',
        mid: 'A steady day. Keep going: small habits like water and moving your body add up.',
        high: 'You have good energy today. Use some of it for something that makes you smile.',
      },
      high: {
        low: 'Your mood is bright even though you are tired. Enjoy the good feeling and give your body the rest it asks for.',
        mid: 'So good to see you feeling well! Hold on to what made today good.',
        high: 'You are shining today! Share that energy, it might brighten someone else’s day too.',
      },
    },
    moodSupport: 'Your mood has been low for several days. You do not have to carry it alone: talking to someone you trust or a health worker can help.',
    sleepScheduleTitle: 'SLEEP SCHEDULE',
    sleepScheduleEmpty: 'Set a bedtime and a wake-up time. Imara uses them to track your sleep each night, like Apple Health, and to remind you when it is time for bed.',
    sleepScheduleSet: 'Set sleep schedule',
    bedtimeLabel: 'Bedtime',
    wakeUpLabel: 'Wake up',
    sleepGoalShort: 'Sleep goal',
    inBedHours: '{h} in bed',
    meetsGoal: 'Meets your {h} goal',
    shortOfGoal: '{h} less than your goal',
    saveSchedule: 'Save schedule',
    removeSchedule: 'Remove schedule',
    scheduleSaved: 'Sleep schedule saved',
    scheduleRemoved: 'Sleep schedule removed',
    bedtimeReminders: 'Bedtime reminders',
    bedtimeRemindersNote: 'A reminder 30 minutes before bedtime and a good-morning note at wake-up.',
    windDownTitle: 'Bedtime in 30 minutes',
    windDownBody: 'Time to wind down: dim the lights and put your phone away.',
    goodMorningTitle: 'Good morning!',
    goodMorningBody: 'Open Imara to see how you slept.',
    sleepFromSchedule: 'Nights your phone misses are estimated from your schedule and your movement · correct with − and +',
    dragToAdjust: 'Drag the bed or the alarm around the ring, or drag the arc to move both.',
    weekdaysLabel: 'Weekdays',
    weekendLabel: 'Weekend',
    weekendDifferent: 'Different times on weekends',
    weekendNote: 'For Friday and Saturday nights.',
    bedtimeRemindersNeedsSchedule: 'Set a sleep schedule on the Sleep page to get these.',
    tonightSchedule: 'Tonight: bed {bed} · wake {wake}',
    menuSleep: 'Sleep',
    flowMoodTitle: 'How are you feeling right now?',
    flowEnergyTitle: 'How is your energy right now?',
    flowNoteTitle: 'Anything you want to add?',
    newCheckIn: 'New check-in',
    sectionFeel: 'HOW YOU FEEL',
    sectionActivity: 'ACTIVITY',
    sectionWaterSleep: 'WATER & SLEEP',
    goalsMet: '{n} of 3 goals met today',
    goalsAllMet: 'All 3 goals met today. Well done!',
    goalsNone: 'Your goals for today are waiting',
    menuCycle: 'Cycle',
    cycleTitle: 'Cycle',
    cycleSub: 'Your periods and what comes next.',
    cycleDayN: 'Day {n}',
    phaseMenstrual: 'Period',
    phaseFollicular: 'Follicular phase',
    phaseFertile: 'Fertile window',
    phaseLuteal: 'Luteal phase',
    phaseUnknown: 'No data yet',
    nextPeriodIn: 'Next period in {n} days',
    nextPeriodTomorrow: 'Next period expected tomorrow',
    periodToday: 'Period expected today',
    periodLate: 'Period is {n} days late',
    periodDayN: 'Period · day {n}',
    fertileFrom: 'Fertile window from {date} (estimate)',
    fertileNow: 'You are in your fertile window (estimate)',
    periodStartedToday: 'My period started today',
    periodEndedToday: 'My period ended today',
    periodStartedOn: 'It started on this day',
    periodEndedOn: 'It ended on this day',
    anotherDay: 'Pick another day',
    cycleEmpty: 'Log the first day of your period to start. Imara learns your cycle as you go.',
    legendPeriod: 'Period',
    legendPredicted: 'Expected period',
    legendFertile: 'Fertile window',
    legendOvulation: 'Ovulation (estimate)',
    avgCycle: 'Cycle length',
    avgPeriod: 'Period length',
    usingTypical: 'Using typical lengths (28 and 5 days) until you log two periods.',
    periodsHistory: 'PAST PERIODS',
    ongoing: 'Ongoing',
    daysN: '{n} days',
    removePeriodConfirm: 'Remove this period?',
    periodSaved: 'Saved',
    periodRemoved: 'Period removed',
    cycleDisclaimer: 'Dates are estimates from the periods you log. They can be wrong and are not a method of contraception. See a health worker if your periods are very irregular, very painful, very heavy, or stop.',
    flowNone: 'None',
    flowSpotting: 'Spotting',
    flowLight: 'Light',
    flowMedium: 'Medium',
    flowHeavy: 'Heavy',
    symCramps: 'Cramps',
    symHeadache: 'Headache',
    symBackPain: 'Back pain',
    symBloating: 'Bloating',
    symTenderBreasts: 'Tender breasts',
    symAcne: 'Acne',
    symFatigue: 'Tiredness',
    symNausea: 'Nausea',
    symCravings: 'Cravings',
    symInsomnia: 'Poor sleep',
    symMoodSwings: 'Mood swings',
    symAnxiety: 'Anxiety',
    disDry: 'Dry',
    disSticky: 'Sticky',
    disCreamy: 'Creamy',
    disWatery: 'Watery',
    disEggWhite: 'Egg white',
    disUnusual: 'Unusual',
    tipMenstrual: 'Rest when you need to. Warmth on your belly and gentle movement can ease cramps. Drink plenty of water.',
    tipFollicular: 'Energy often rises after your period. A good time for more activity.',
    tipFertile: 'The chance of pregnancy is highest around now. This is an estimate, not a method of contraception.',
    tipLuteal: 'Some people feel bloated, tired or low before their period. Sleep, water and gentle exercise can help.',
    tipUnknown: 'Log your period to get estimates and tips for each phase.',
    inMenstrual: 'during your period',
    inFollicular: 'after your period',
    inFertile: 'around your fertile window',
    inLuteal: 'in the days before your period',
    noteIrregular: 'Your cycles vary by more than 9 days. Stress or illness can do this; if it continues, talk to a health worker.',
    noteShort: 'Your cycles are often shorter than 24 days. If this continues, talk to a health worker.',
    noteLong: 'Your cycles are often longer than 38 days. If this continues, talk to a health worker.',
    noteLongPeriods: 'A recent period lasted more than 8 days. If periods are often this long or very heavy, talk to a health worker.',
    noteVeryLate: 'Your period is more than a week late. If you could be pregnant, a pregnancy test can tell you. A health worker can help.',
    legendLogged: 'Symptoms logged',
    todayLogTitle: 'TODAY',
    nothingLogged: 'Nothing logged yet. How is your body today?',
    logToday: 'Log today',
    editToday: 'Edit today',
    insightsTitle: 'INSIGHTS',
    patternText: '{symptom} usually comes {phase}',
    patternCount: 'Logged {n} times',
    upcomingTitle: 'NEXT PERIODS',
    upcomingFertile: 'Fertile window {range}',
    openCalendar: 'Open full calendar',
    calendarPageTitle: 'Calendar',
    calendarPageSub: 'Your period journey',
    calendarAhead: 'THIS MONTH AND AHEAD',
    calendarJourney: 'YOUR JOURNEY',
    variationLabel: 'Variation',
    cycleOfN: 'cycle of {n} days',
    autoEndedNote: 'Marked as over after your usual {n} days. Still bleeding? Log flow on those days or set the end day.',
    setEndDay: 'Set the end day',
    cycleReminders: 'Cycle reminders',
    cycleRemindersNote: 'Two days before your period, and when your fertile window starts.',
    periodSoonTitle: 'Period expected in 2 days',
    periodSoonBody: 'Your period may start around {date}. It helps to have pads ready.',
    fertileTitle: 'Fertile window starts today',
    fertileBody: 'Estimated from your cycle. Not a method of contraception.',
    dayLogTitle: 'Day log',
    flowLabel: 'FLOW',
    symptomsLabel: 'SYMPTOMS',
    dischargeLabel: 'DISCHARGE',
    dayNoteLabel: 'NOTE (OPTIONAL)',
    futureDay: 'This day has not come yet. Here is what is expected.',
    dayTooOld: 'Days more than 90 days ago cannot be changed.',
    dayInPeriod: 'Part of your period',
    dayExpectedPeriod: 'Period expected (estimate)',
    dayFertile: 'Fertile window (estimate)',
    dayOvulation: 'Estimated ovulation',
    periodStartedHere: 'My period started this day',
    periodEndedHere: 'My period ended this day',
    reportTitle: 'Health report',
    reportSub: 'A cycle summary to show a health worker',
    shareReport: 'Share report',
    reportSummary: 'SUMMARY',
    reportGenerated: 'Made with Imara Afya on {date}',
    reportTypicalCycle: 'Typical cycle',
    reportTypicalPeriod: 'Typical period',
    reportCyclesLogged: 'Periods logged',
    reportNextPeriod: 'Next expected period',
    reportNotes: 'Notes',
    reportSymptoms: 'Common symptoms',
    reportCycles: 'Cycles',
    reportNoPeriods: 'No periods logged yet.',
    checkInAgain: 'Check in again',
    checkInsToday: '{n} check-ins today',
    checkInsTodayOne: '1 check-in today',
    checkInTodayList: 'TODAY’S CHECK-INS',
    checkInRemoveOne: 'Remove this check-in?',
    trendTitle: 'TREND',
    trend7: '7 days',
    trend30: '30 days',
    trendUp: 'Your mood is up compared with last week.',
    trendDown: 'Your mood is a little lower than last week. Be kind to yourself.',
    trendSteady: 'Your mood has been steady compared with last week.',
    trendNotEnough: 'Check in on a few more days to see your trend.',
    bestMorning: 'You tend to feel best in the morning.',
    bestAfternoon: 'You tend to feel best in the afternoon.',
    bestEvening: 'You tend to feel best in the evening.',
    moodLabel: 'MOOD',
    energyLabel: 'ENERGY',
    checkInNote: 'NOTE (OPTIONAL)',
    checkInNotePlaceholder: 'Anything on your mind?',
    checkInSave: 'Save check-in',
    checkInSaved: 'Check-in saved',
    checkInRemoved: 'Check-in removed',
    remove: 'Remove',
    moodAverage: 'Mood (7 days)',
    energyAverage: 'Energy (7 days)',
    checkInDays: 'Days checked in (30 days)',
    checkInHistory: 'RECENT CHECK-INS',
    noCheckIns: 'No check-ins yet. Your first one starts your streak.',
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
    moodReminders: 'Rappels de bilan d’humeur',
    moodRemindersNote: 'À 9 h, 14 h et 19 h. Sautés si vous venez de faire votre bilan.',
    moodReminderTitle: 'Comment vous sentez-vous ?',
    moodReminderBody: 'Prenez un moment pour faire votre bilan : un visage et une batterie.',
    warmMessages: 'Messages bienveillants',
    warmMessagesNote: 'Un petit mot quelques heures après votre bilan, selon ce que vous ressentez.',
    warmMessageTitle: 'Un mot pour vous',
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
    checkInQuickHint: 'Touchez un visage et une batterie. C’est enregistré tout seul.',
    checkInDetails: 'Détails',
    menuCheckIn: 'Humeur',
    moodMessages: {
      low: {
        low: 'La journée semble lourde, et c’est normal. Soyez doux avec vous-même : reposez-vous, buvez de l’eau et avancez un petit pas à la fois.',
        mid: 'Tous les jours ne sont pas faciles. Essayez une petite chose qui vous fait du bien : une courte marche, une chanson que vous aimez ou un appel à un ami.',
        high: 'Vous avez de l’énergie même si le cœur est bas. Une marche dehors ou une discussion avec une personne de confiance peut alléger ce poids.',
      },
      mid: {
        low: 'Une journée correcte avec peu d’énergie. Reposez-vous quand vous pouvez et couchez-vous un peu plus tôt ce soir.',
        mid: 'Une journée stable. Continuez : les petites habitudes comme boire de l’eau et bouger comptent.',
        high: 'Vous avez une belle énergie aujourd’hui. Utilisez-en un peu pour quelque chose qui vous fait sourire.',
      },
      high: {
        low: 'Votre humeur est belle même si vous êtes fatigué. Profitez-en et donnez à votre corps le repos qu’il demande.',
        mid: 'Ça fait plaisir de vous voir bien ! Gardez en tête ce qui a rendu cette journée agréable.',
        high: 'Vous rayonnez aujourd’hui ! Partagez cette énergie, elle peut illuminer la journée de quelqu’un d’autre.',
      },
    },
    moodSupport: 'Votre humeur est basse depuis plusieurs jours. Vous n’avez pas à porter cela seul : parler à une personne de confiance ou à un agent de santé peut aider.',
    sleepScheduleTitle: 'HORAIRES DE SOMMEIL',
    sleepScheduleEmpty: 'Choisissez une heure de coucher et de réveil. Imara s’en sert pour suivre votre sommeil chaque nuit, comme Santé d’Apple, et pour vous rappeler l’heure du coucher.',
    sleepScheduleSet: 'Définir mes horaires',
    bedtimeLabel: 'Coucher',
    wakeUpLabel: 'Réveil',
    sleepGoalShort: 'Objectif de sommeil',
    inBedHours: '{h} au lit',
    meetsGoal: 'Atteint votre objectif de {h}',
    shortOfGoal: '{h} de moins que votre objectif',
    saveSchedule: 'Enregistrer les horaires',
    removeSchedule: 'Supprimer les horaires',
    scheduleSaved: 'Horaires de sommeil enregistrés',
    scheduleRemoved: 'Horaires de sommeil supprimés',
    bedtimeReminders: 'Rappels du coucher',
    bedtimeRemindersNote: 'Un rappel 30 minutes avant le coucher et un petit mot au réveil.',
    windDownTitle: 'Coucher dans 30 minutes',
    windDownBody: 'C’est le moment de ralentir : baissez la lumière et posez votre téléphone.',
    goodMorningTitle: 'Bonjour !',
    goodMorningBody: 'Ouvrez Imara pour voir comment vous avez dormi.',
    sleepFromSchedule: 'Les nuits manquées par le téléphone sont estimées d’après vos horaires et vos mouvements · corrigez avec − et +',
    dragToAdjust: 'Faites glisser le lit ou le réveil autour du cercle, ou l’arc pour déplacer les deux.',
    weekdaysLabel: 'Semaine',
    weekendLabel: 'Week-end',
    weekendDifferent: 'Horaires différents le week-end',
    weekendNote: 'Pour les nuits du vendredi et du samedi.',
    bedtimeRemindersNeedsSchedule: 'Définissez vos horaires sur la page Sommeil pour les recevoir.',
    tonightSchedule: 'Ce soir : coucher {bed} · réveil {wake}',
    menuSleep: 'Sommeil',
    flowMoodTitle: 'Comment vous sentez-vous en ce moment ?',
    flowEnergyTitle: 'Comment est votre énergie en ce moment ?',
    flowNoteTitle: 'Quelque chose à ajouter ?',
    newCheckIn: 'Nouveau bilan',
    sectionFeel: 'VOTRE HUMEUR',
    sectionActivity: 'ACTIVITÉ',
    sectionWaterSleep: 'EAU ET SOMMEIL',
    goalsMet: '{n} objectifs sur 3 atteints aujourd’hui',
    goalsAllMet: 'Les 3 objectifs atteints aujourd’hui. Bravo !',
    goalsNone: 'Vos objectifs du jour vous attendent',
    menuCycle: 'Cycle',
    cycleTitle: 'Cycle',
    cycleSub: 'Vos règles et la suite.',
    cycleDayN: 'Jour {n}',
    phaseMenstrual: 'Règles',
    phaseFollicular: 'Phase folliculaire',
    phaseFertile: 'Période fertile',
    phaseLuteal: 'Phase lutéale',
    phaseUnknown: 'Pas encore de données',
    nextPeriodIn: 'Prochaines règles dans {n} jours',
    nextPeriodTomorrow: 'Prochaines règles attendues demain',
    periodToday: 'Règles attendues aujourd’hui',
    periodLate: 'Règles en retard de {n} jours',
    periodDayN: 'Règles · jour {n}',
    fertileFrom: 'Période fertile à partir du {date} (estimation)',
    fertileNow: 'Vous êtes en période fertile (estimation)',
    periodStartedToday: 'Mes règles ont commencé aujourd’hui',
    periodEndedToday: 'Mes règles se sont terminées aujourd’hui',
    periodStartedOn: 'Elles ont commencé ce jour-là',
    periodEndedOn: 'Elles se sont terminées ce jour-là',
    anotherDay: 'Choisir un autre jour',
    cycleEmpty: 'Indiquez le premier jour de vos règles pour commencer. Imara apprend votre cycle au fil du temps.',
    legendPeriod: 'Règles',
    legendPredicted: 'Règles prévues',
    legendFertile: 'Période fertile',
    legendOvulation: 'Ovulation (estimation)',
    avgCycle: 'Durée du cycle',
    avgPeriod: 'Durée des règles',
    usingTypical: 'Durées habituelles (28 et 5 jours) utilisées jusqu’à deux règles notées.',
    periodsHistory: 'RÈGLES PASSÉES',
    ongoing: 'En cours',
    daysN: '{n} jours',
    removePeriodConfirm: 'Supprimer ces règles ?',
    periodSaved: 'Enregistré',
    periodRemoved: 'Règles supprimées',
    cycleDisclaimer: 'Les dates sont des estimations d’après les règles notées. Elles peuvent être fausses et ne sont pas une méthode de contraception. Consultez un agent de santé si vos règles sont très irrégulières, très douloureuses, très abondantes ou s’arrêtent.',
    flowNone: 'Aucun',
    flowSpotting: 'Traces',
    flowLight: 'Léger',
    flowMedium: 'Moyen',
    flowHeavy: 'Abondant',
    symCramps: 'Crampes',
    symHeadache: 'Mal de tête',
    symBackPain: 'Mal de dos',
    symBloating: 'Ballonnements',
    symTenderBreasts: 'Seins sensibles',
    symAcne: 'Acné',
    symFatigue: 'Fatigue',
    symNausea: 'Nausée',
    symCravings: 'Fringales',
    symInsomnia: 'Mauvais sommeil',
    symMoodSwings: 'Sautes d’humeur',
    symAnxiety: 'Anxiété',
    disDry: 'Sèche',
    disSticky: 'Collante',
    disCreamy: 'Crémeuse',
    disWatery: 'Aqueuse',
    disEggWhite: 'Blanc d’œuf',
    disUnusual: 'Inhabituelle',
    tipMenstrual: 'Reposez-vous si besoin. La chaleur sur le ventre et bouger doucement peuvent soulager les crampes. Buvez beaucoup d’eau.',
    tipFollicular: 'L’énergie remonte souvent après les règles. Un bon moment pour bouger davantage.',
    tipFertile: 'La probabilité de grossesse est la plus élevée en ce moment. C’est une estimation, pas une méthode de contraception.',
    tipLuteal: 'Certaines personnes se sentent gonflées, fatiguées ou tristes avant les règles. Le sommeil, l’eau et un peu d’exercice peuvent aider.',
    tipUnknown: 'Notez vos règles pour obtenir des estimations et des conseils pour chaque phase.',
    inMenstrual: 'pendant vos règles',
    inFollicular: 'après vos règles',
    inFertile: 'autour de votre période fertile',
    inLuteal: 'dans les jours avant vos règles',
    noteIrregular: 'Vos cycles varient de plus de 9 jours. Le stress ou une maladie peuvent en être la cause ; si cela continue, parlez-en à un agent de santé.',
    noteShort: 'Vos cycles durent souvent moins de 24 jours. Si cela continue, parlez-en à un agent de santé.',
    noteLong: 'Vos cycles durent souvent plus de 38 jours. Si cela continue, parlez-en à un agent de santé.',
    noteLongPeriods: 'Des règles récentes ont duré plus de 8 jours. Si c’est fréquent ou très abondant, parlez-en à un agent de santé.',
    noteVeryLate: 'Vos règles ont plus d’une semaine de retard. Si vous pourriez être enceinte, un test de grossesse peut vous le dire. Un agent de santé peut vous aider.',
    legendLogged: 'Symptômes notés',
    todayLogTitle: 'AUJOURD’HUI',
    nothingLogged: 'Rien de noté. Comment va votre corps aujourd’hui ?',
    logToday: 'Noter aujourd’hui',
    editToday: 'Modifier aujourd’hui',
    insightsTitle: 'CONSEILS',
    patternText: '{symptom} vient souvent {phase}',
    patternCount: 'Noté {n} fois',
    upcomingTitle: 'PROCHAINES RÈGLES',
    upcomingFertile: 'Période fertile {range}',
    openCalendar: 'Ouvrir le calendrier',
    calendarPageTitle: 'Calendrier',
    calendarPageSub: 'Votre parcours de règles',
    calendarAhead: 'CE MOIS ET LA SUITE',
    calendarJourney: 'VOTRE PARCOURS',
    variationLabel: 'Variation',
    cycleOfN: 'cycle de {n} jours',
    autoEndedNote: 'Considérées comme finies après vos {n} jours habituels. Toujours des saignements ? Notez le flux ces jours-là ou indiquez le jour de fin.',
    setEndDay: 'Indiquer le jour de fin',
    cycleReminders: 'Rappels du cycle',
    cycleRemindersNote: 'Deux jours avant vos règles, et au début de votre période fertile.',
    periodSoonTitle: 'Règles attendues dans 2 jours',
    periodSoonBody: 'Vos règles pourraient commencer vers le {date}. Pensez à préparer des protections.',
    fertileTitle: 'La période fertile commence aujourd’hui',
    fertileBody: 'Estimation d’après votre cycle. Pas une méthode de contraception.',
    dayLogTitle: 'Journal du jour',
    flowLabel: 'FLUX',
    symptomsLabel: 'SYMPTÔMES',
    dischargeLabel: 'PERTES',
    dayNoteLabel: 'NOTE (FACULTATIF)',
    futureDay: 'Ce jour n’est pas encore arrivé. Voici ce qui est prévu.',
    dayTooOld: 'Les jours de plus de 90 jours ne peuvent plus être modifiés.',
    dayInPeriod: 'Pendant vos règles',
    dayExpectedPeriod: 'Règles prévues (estimation)',
    dayFertile: 'Période fertile (estimation)',
    dayOvulation: 'Ovulation estimée',
    periodStartedHere: 'Mes règles ont commencé ce jour',
    periodEndedHere: 'Mes règles ont fini ce jour',
    reportTitle: 'Rapport de santé',
    reportSub: 'Un résumé du cycle à montrer à un agent de santé',
    shareReport: 'Partager le rapport',
    reportSummary: 'RÉSUMÉ',
    reportGenerated: 'Créé avec Imara Afya le {date}',
    reportTypicalCycle: 'Cycle habituel',
    reportTypicalPeriod: 'Règles habituelles',
    reportCyclesLogged: 'Règles notées',
    reportNextPeriod: 'Prochaines règles prévues',
    reportNotes: 'Remarques',
    reportSymptoms: 'Symptômes fréquents',
    reportCycles: 'Cycles',
    reportNoPeriods: 'Aucunes règles notées.',
    checkInAgain: 'Refaire un bilan',
    checkInsToday: '{n} bilans aujourd’hui',
    checkInsTodayOne: '1 bilan aujourd’hui',
    checkInTodayList: 'BILANS DU JOUR',
    checkInRemoveOne: 'Supprimer ce bilan ?',
    trendTitle: 'TENDANCE',
    trend7: '7 jours',
    trend30: '30 jours',
    trendUp: 'Votre humeur est meilleure que la semaine dernière.',
    trendDown: 'Votre humeur est un peu plus basse que la semaine dernière. Prenez soin de vous.',
    trendSteady: 'Votre humeur est stable par rapport à la semaine dernière.',
    trendNotEnough: 'Faites votre bilan quelques jours de plus pour voir votre tendance.',
    bestMorning: 'Vous vous sentez souvent mieux le matin.',
    bestAfternoon: 'Vous vous sentez souvent mieux l’après-midi.',
    bestEvening: 'Vous vous sentez souvent mieux le soir.',
    moodLabel: 'HUMEUR',
    energyLabel: 'ÉNERGIE',
    checkInNote: 'NOTE (FACULTATIF)',
    checkInNotePlaceholder: 'Quelque chose en tête ?',
    checkInSave: 'Enregistrer le bilan',
    checkInSaved: 'Bilan enregistré',
    checkInRemoved: 'Bilan supprimé',
    remove: 'Supprimer',
    moodAverage: 'Humeur (7 jours)',
    energyAverage: 'Énergie (7 jours)',
    checkInDays: 'Jours avec bilan (30 jours)',
    checkInHistory: 'BILANS RÉCENTS',
    noCheckIns: 'Aucun bilan pour l’instant. Le premier lance votre série.',
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
    moodReminders: 'Vikumbusho vya hali',
    moodRemindersNote: 'Saa 3:00 asubuhi, 8:00 mchana na 1:00 usiku. Havitumwi kama umeandika hali muda mfupi kabla.',
    moodReminderTitle: 'Unajisikiaje?',
    moodReminderBody: 'Chukua muda kuandika hali yako: chagua uso na betri.',
    warmMessages: 'Ujumbe wa faraja',
    warmMessagesNote: 'Ujumbe mzuri saa chache baada ya kuandika hali yako, kulingana na unavyojisikia.',
    warmMessageTitle: 'Ujumbe kwa ajili yako',
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
    checkInQuickHint: 'Gusa uso na betri. Inahifadhiwa yenyewe.',
    checkInDetails: 'Maelezo',
    menuCheckIn: 'Hisia',
    moodMessages: {
      low: {
        low: 'Leo inaonekana nzito, na hilo ni sawa. Jihurumie: pumzika, kunywa maji na chukua hatua ndogo moja baada ya nyingine.',
        mid: 'Si kila siku ni rahisi. Jaribu jambo dogo linalokufurahisha: matembezi mafupi, wimbo unaoupenda au kumpigia rafiki simu.',
        high: 'Una nguvu hata kama moyo uko chini. Matembezi nje au kuzungumza na mtu unayemwamini kunaweza kukupunguzia uzito.',
      },
      mid: {
        low: 'Siku ya kawaida yenye nguvu kidogo. Pumzika unapoweza, na ujaribu kulala mapema kidogo leo usiku.',
        mid: 'Siku tulivu. Endelea: tabia ndogo kama kunywa maji na kutembea zina maana.',
        high: 'Una nguvu nzuri leo. Tumia sehemu yake kwa jambo linalokufanya utabasamu.',
      },
      high: {
        low: 'Hali yako ni nzuri ingawa umechoka. Furahia hisia hiyo na upe mwili wako mapumziko unayoyahitaji.',
        mid: 'Inafurahisha kukuona ukiwa vizuri! Kumbuka kilichoifanya leo kuwa nzuri.',
        high: 'Unang’aa leo! Shiriki nguvu hiyo, inaweza kuifurahisha siku ya mtu mwingine pia.',
      },
    },
    moodSupport: 'Hali yako imekuwa chini kwa siku kadhaa. Si lazima ubebe hili peke yako: kuzungumza na mtu unayemwamini au mhudumu wa afya kunaweza kusaidia.',
    sleepScheduleTitle: 'RATIBA YA USINGIZI',
    sleepScheduleEmpty: 'Weka saa ya kulala na ya kuamka. Imara inazitumia kufuatilia usingizi wako kila usiku, kama Apple Health, na kukukumbusha wakati wa kulala.',
    sleepScheduleSet: 'Weka ratiba ya usingizi',
    bedtimeLabel: 'Kulala',
    wakeUpLabel: 'Kuamka',
    sleepGoalShort: 'Lengo la usingizi',
    inBedHours: '{h} kitandani',
    meetsGoal: 'Inafikia lengo lako la {h}',
    shortOfGoal: '{h} chini ya lengo lako',
    saveSchedule: 'Hifadhi ratiba',
    removeSchedule: 'Ondoa ratiba',
    scheduleSaved: 'Ratiba ya usingizi imehifadhiwa',
    scheduleRemoved: 'Ratiba ya usingizi imeondolewa',
    bedtimeReminders: 'Vikumbusho vya kulala',
    bedtimeRemindersNote: 'Kikumbusho dakika 30 kabla ya kulala na salamu ya asubuhi unapoamka.',
    windDownTitle: 'Kulala baada ya dakika 30',
    windDownBody: 'Ni wakati wa kupumzika: punguza mwanga na weka simu pembeni.',
    goodMorningTitle: 'Habari za asubuhi!',
    goodMorningBody: 'Fungua Imara uone ulivyolala.',
    sleepFromSchedule: 'Usiku ambao simu haikupima unakadiriwa kutoka ratiba yako na mwendo wako · rekebisha kwa − na +',
    dragToAdjust: 'Buruta kitanda au saa ya kengele kuzunguka duara, au buruta tao kusogeza vyote viwili.',
    weekdaysLabel: 'Siku za kazi',
    weekendLabel: 'Wikendi',
    weekendDifferent: 'Saa tofauti wikendi',
    weekendNote: 'Kwa usiku wa Ijumaa na Jumamosi.',
    bedtimeRemindersNeedsSchedule: 'Weka ratiba ya usingizi kwenye ukurasa wa Usingizi ili kupata hivi.',
    tonightSchedule: 'Leo usiku: kulala {bed} · kuamka {wake}',
    menuSleep: 'Usingizi',
    flowMoodTitle: 'Unajisikiaje sasa hivi?',
    flowEnergyTitle: 'Nguvu zako ziko vipi sasa hivi?',
    flowNoteTitle: 'Kuna chochote ungependa kuongeza?',
    newCheckIn: 'Andika hali mpya',
    sectionFeel: 'UNAVYOJISIKIA',
    sectionActivity: 'SHUGHULI',
    sectionWaterSleep: 'MAJI NA USINGIZI',
    goalsMet: 'Malengo {n} kati ya 3 yamefikiwa leo',
    goalsAllMet: 'Malengo yote 3 yamefikiwa leo. Hongera!',
    goalsNone: 'Malengo yako ya leo yanakusubiri',
    menuCycle: 'Mzunguko',
    cycleTitle: 'Mzunguko',
    cycleSub: 'Hedhi zako na kinachofuata.',
    cycleDayN: 'Siku {n}',
    phaseMenstrual: 'Hedhi',
    phaseFollicular: 'Awamu ya folikuli',
    phaseFertile: 'Kipindi cha rutuba',
    phaseLuteal: 'Awamu ya luteal',
    phaseUnknown: 'Bado hakuna taarifa',
    nextPeriodIn: 'Hedhi ijayo baada ya siku {n}',
    nextPeriodTomorrow: 'Hedhi ijayo inatarajiwa kesho',
    periodToday: 'Hedhi inatarajiwa leo',
    periodLate: 'Hedhi imechelewa siku {n}',
    periodDayN: 'Hedhi · siku {n}',
    fertileFrom: 'Kipindi cha rutuba kuanzia {date} (makadirio)',
    fertileNow: 'Uko kwenye kipindi cha rutuba (makadirio)',
    periodStartedToday: 'Hedhi yangu imeanza leo',
    periodEndedToday: 'Hedhi yangu imeisha leo',
    periodStartedOn: 'Ilianza siku hii',
    periodEndedOn: 'Iliisha siku hii',
    anotherDay: 'Chagua siku nyingine',
    cycleEmpty: 'Andika siku ya kwanza ya hedhi yako kuanza. Imara itajifunza mzunguko wako polepole.',
    legendPeriod: 'Hedhi',
    legendPredicted: 'Hedhi inayotarajiwa',
    legendFertile: 'Kipindi cha rutuba',
    legendOvulation: 'Ovulesheni (makadirio)',
    avgCycle: 'Urefu wa mzunguko',
    avgPeriod: 'Urefu wa hedhi',
    usingTypical: 'Tunatumia urefu wa kawaida (siku 28 na 5) hadi uandike hedhi mbili.',
    periodsHistory: 'HEDHI ZILIZOPITA',
    ongoing: 'Inaendelea',
    daysN: 'siku {n}',
    removePeriodConfirm: 'Ondoa hedhi hii?',
    periodSaved: 'Imehifadhiwa',
    periodRemoved: 'Hedhi imeondolewa',
    cycleDisclaimer: 'Tarehe ni makadirio kutoka hedhi unazoandika. Zinaweza kukosea na si njia ya kuzuia mimba. Muone mhudumu wa afya kama hedhi zako haziko sawa kabisa, zinauma sana, ni nzito sana, au zimekoma.',
    flowNone: 'Hakuna',
    flowSpotting: 'Matone',
    flowLight: 'Kidogo',
    flowMedium: 'Wastani',
    flowHeavy: 'Nyingi',
    symCramps: 'Maumivu ya tumbo',
    symHeadache: 'Kichwa kuuma',
    symBackPain: 'Maumivu ya mgongo',
    symBloating: 'Kuvimba tumbo',
    symTenderBreasts: 'Matiti kuuma',
    symAcne: 'Chunusi',
    symFatigue: 'Uchovu',
    symNausea: 'Kichefuchefu',
    symCravings: 'Hamu ya chakula',
    symInsomnia: 'Kukosa usingizi',
    symMoodSwings: 'Hisia kubadilika',
    symAnxiety: 'Wasiwasi',
    disDry: 'Kavu',
    disSticky: 'Nata',
    disCreamy: 'Kama krimu',
    disWatery: 'Majimaji',
    disEggWhite: 'Kama ute wa yai',
    disUnusual: 'Si ya kawaida',
    tipMenstrual: 'Pumzika unapohitaji. Joto tumboni na kutembea polepole kunaweza kupunguza maumivu. Kunywa maji mengi.',
    tipFollicular: 'Nguvu mara nyingi huongezeka baada ya hedhi. Ni wakati mzuri wa kufanya mazoezi zaidi.',
    tipFertile: 'Uwezekano wa kupata mimba ni mkubwa zaidi wakati huu. Haya ni makadirio, si njia ya kuzuia mimba.',
    tipLuteal: 'Baadhi ya watu huvimba, huchoka au huhisi huzuni kabla ya hedhi. Usingizi, maji na mazoezi mepesi yanaweza kusaidia.',
    tipUnknown: 'Andika hedhi yako ili kupata makadirio na ushauri kwa kila awamu.',
    inMenstrual: 'wakati wa hedhi',
    inFollicular: 'baada ya hedhi',
    inFertile: 'karibu na kipindi cha rutuba',
    inLuteal: 'siku chache kabla ya hedhi',
    noteIrregular: 'Mizunguko yako inatofautiana kwa zaidi ya siku 9. Msongo au ugonjwa unaweza kusababisha hili; likiendelea, zungumza na mhudumu wa afya.',
    noteShort: 'Mizunguko yako mara nyingi ni mifupi kuliko siku 24. Likiendelea, zungumza na mhudumu wa afya.',
    noteLong: 'Mizunguko yako mara nyingi ni mirefu kuliko siku 38. Likiendelea, zungumza na mhudumu wa afya.',
    noteLongPeriods: 'Hedhi ya karibuni ilidumu zaidi ya siku 8. Ikiwa hutokea mara nyingi au ni nzito sana, zungumza na mhudumu wa afya.',
    noteVeryLate: 'Hedhi yako imechelewa zaidi ya wiki moja. Kama unaweza kuwa mjamzito, kipimo cha mimba kitakuambia. Mhudumu wa afya anaweza kusaidia.',
    legendLogged: 'Dalili zimeandikwa',
    todayLogTitle: 'LEO',
    nothingLogged: 'Bado hakuna kilichoandikwa. Mwili wako uko vipi leo?',
    logToday: 'Andika leo',
    editToday: 'Hariri leo',
    insightsTitle: 'MAARIFA',
    patternText: '{symptom} mara nyingi hutokea {phase}',
    patternCount: 'Imeandikwa mara {n}',
    upcomingTitle: 'HEDHI ZIJAZO',
    upcomingFertile: 'Kipindi cha rutuba {range}',
    openCalendar: 'Fungua kalenda nzima',
    calendarPageTitle: 'Kalenda',
    calendarPageSub: 'Safari ya hedhi yako',
    calendarAhead: 'MWEZI HUU NA IJAYO',
    calendarJourney: 'SAFARI YAKO',
    variationLabel: 'Tofauti',
    cycleOfN: 'mzunguko wa siku {n}',
    autoEndedNote: 'Imewekwa kuwa imeisha baada ya siku {n} zako za kawaida. Bado unatoka damu? Andika mtiririko siku hizo au weka siku ya mwisho.',
    setEndDay: 'Weka siku ya mwisho',
    cycleReminders: 'Vikumbusho vya mzunguko',
    cycleRemindersNote: 'Siku mbili kabla ya hedhi, na kipindi cha rutuba kinapoanza.',
    periodSoonTitle: 'Hedhi inatarajiwa baada ya siku 2',
    periodSoonBody: 'Hedhi yako inaweza kuanza karibu {date}. Ni vizuri kuwa na pedi tayari.',
    fertileTitle: 'Kipindi cha rutuba kinaanza leo',
    fertileBody: 'Makadirio kutoka mzunguko wako. Si njia ya kuzuia mimba.',
    dayLogTitle: 'Kumbukumbu ya siku',
    flowLabel: 'MTIRIRIKO',
    symptomsLabel: 'DALILI',
    dischargeLabel: 'UTOKAJI',
    dayNoteLabel: 'MAELEZO (SI LAZIMA)',
    futureDay: 'Siku hii bado haijafika. Hiki ndicho kinachotarajiwa.',
    dayTooOld: 'Siku zaidi ya 90 zilizopita haziwezi kubadilishwa.',
    dayInPeriod: 'Sehemu ya hedhi yako',
    dayExpectedPeriod: 'Hedhi inatarajiwa (makadirio)',
    dayFertile: 'Kipindi cha rutuba (makadirio)',
    dayOvulation: 'Ovulesheni inayokadiriwa',
    periodStartedHere: 'Hedhi yangu ilianza siku hii',
    periodEndedHere: 'Hedhi yangu iliisha siku hii',
    reportTitle: 'Ripoti ya afya',
    reportSub: 'Muhtasari wa mzunguko kumwonyesha mhudumu wa afya',
    shareReport: 'Shiriki ripoti',
    reportSummary: 'MUHTASARI',
    reportGenerated: 'Imetengenezwa na Imara Afya tarehe {date}',
    reportTypicalCycle: 'Mzunguko wa kawaida',
    reportTypicalPeriod: 'Hedhi ya kawaida',
    reportCyclesLogged: 'Hedhi zilizoandikwa',
    reportNextPeriod: 'Hedhi ijayo inayotarajiwa',
    reportNotes: 'Maelezo',
    reportSymptoms: 'Dalili za kawaida',
    reportCycles: 'Mizunguko',
    reportNoPeriods: 'Bado hakuna hedhi iliyoandikwa.',
    checkInAgain: 'Andika hali tena',
    checkInsToday: 'Mara {n} leo',
    checkInsTodayOne: 'Mara 1 leo',
    checkInTodayList: 'HALI ZA LEO',
    checkInRemoveOne: 'Ondoa hali hii?',
    trendTitle: 'MWENENDO',
    trend7: 'Siku 7',
    trend30: 'Siku 30',
    trendUp: 'Hali yako ni bora kuliko wiki iliyopita.',
    trendDown: 'Hali yako iko chini kidogo kuliko wiki iliyopita. Jitunze.',
    trendSteady: 'Hali yako imekuwa tulivu ukilinganisha na wiki iliyopita.',
    trendNotEnough: 'Andika hali yako siku chache zaidi ili kuona mwenendo wako.',
    bestMorning: 'Mara nyingi unajisikia vizuri zaidi asubuhi.',
    bestAfternoon: 'Mara nyingi unajisikia vizuri zaidi mchana.',
    bestEvening: 'Mara nyingi unajisikia vizuri zaidi jioni.',
    moodLabel: 'HALI YA MOYO',
    energyLabel: 'NGUVU',
    checkInNote: 'MAELEZO (SI LAZIMA)',
    checkInNotePlaceholder: 'Kuna jambo lolote akilini?',
    checkInSave: 'Hifadhi hali',
    checkInSaved: 'Hali imehifadhiwa',
    checkInRemoved: 'Hali imefutwa',
    remove: 'Futa',
    moodAverage: 'Hali ya moyo (siku 7)',
    energyAverage: 'Nguvu (siku 7)',
    checkInDays: 'Siku zilizoandikwa (siku 30)',
    checkInHistory: 'HALI ZA KARIBUNI',
    noCheckIns: 'Bado hakuna hali iliyoandikwa. Ya kwanza inaanzisha mfululizo wako.',
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
    moodReminders: 'Kwibutswa kwandika uko umerewe',
    moodRemindersNote: 'Isaha 9:00, 14:00 na 19:00. Ntibiza niwaba umaze kwandika hari hageze.',
    moodReminderTitle: 'Wiyumva gute?',
    moodReminderBody: 'Fata akanya wandike uko umerewe: hitamwo isura na bateri.',
    warmMessages: 'Ubutumwa buhumuriza',
    warmMessagesNote: 'Akajambo keza amasaha makeyi inyuma yo kwandika uko umerewe, bivanye n’ingene wiyumva.',
    warmMessageTitle: 'Akajambo kawe',
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
    checkInQuickHint: 'Kora ku isura no kuri bateri. Birabikwa ubwabyo.',
    checkInDetails: 'Ibisobanuro',
    menuCheckIn: 'Uko ndi',
    moodMessages: {
      low: {
        low: 'Uyu munsi uraremereye, kandi ni ibisanzwe. Iyiteho: ruhuka, nywa amazi kandi ugende intambwe ntoya ku yindi.',
        mid: 'Si iminsi yose yoroshe. Gerageza ikintu gitoyi gikunda kukunezereza: gutembera gato, indirimbo ukunda canke guhamagara umugenzi.',
        high: 'Ufise inguvu naho umutima wiyumva nabi. Gutembera hanze canke kuyaga n’uwo wizigira vyogufasha kworoherwa.',
      },
      mid: {
        low: 'Umunsi umeze neza ariko inguvu ni nke. Ruhuka igihe ubishoboye, kandi ugerageze kuryama kare gatoyi iri joro.',
        mid: 'Umunsi utekanye. Bandanya: utumenyero dutoyi nko kunywa amazi no kwinyegeza turafasha.',
        high: 'Ufise inguvu nziza uyu munsi. Koresha zimwe mu kintu gituma umwenyura.',
      },
      high: {
        low: 'Wiyumva neza naho uruhiye. Nezerwa kandi uhe umubiri wawe akaruhuko usaba.',
        mid: 'Birashimishije kukubona umeze neza! Ibuka icatumye uyu munsi uba mwiza.',
        high: 'Uyu munsi urarabagirana! Sangiza abandi izo nguvu, zoshobora kunezereza umunsi w’uwundi.',
      },
    },
    moodSupport: 'Hari iminsi itari mike wiyumva nabi. Ntukwiye kubyikorera wenyene: kuyaga n’uwo wizigira canke umukozi w’amagara vyogufasha.',
    sleepScheduleTitle: 'INGENGABIHE Y’IBITOTSI',
    sleepScheduleEmpty: 'Shinga isaha yo kuryama n’iyo kuvyuka. Imara izikoresha mu gukurikirana ibitotsi vyawe buri joro, nka Apple Health, no kukwibutsa igihe co kuryama.',
    sleepScheduleSet: 'Shinga ingengabihe',
    bedtimeLabel: 'Kuryama',
    wakeUpLabel: 'Kuvyuka',
    sleepGoalShort: 'Intumbero y’ibitotsi',
    inBedHours: '{h} ku buriri',
    meetsGoal: 'Ushikira intumbero yawe ya {h}',
    shortOfGoal: '{h} munsi y’intumbero yawe',
    saveSchedule: 'Bika ingengabihe',
    removeSchedule: 'Kuraho ingengabihe',
    scheduleSaved: 'Ingengabihe y’ibitotsi yabitswe',
    scheduleRemoved: 'Ingengabihe y’ibitotsi yakuweho',
    bedtimeReminders: 'Kwibutswa kuryama',
    bedtimeRemindersNote: 'Kwibutswa iminota 30 imbere yo kuryama n’akajambo keza mu gitondo.',
    windDownTitle: 'Kuryama mu minota 30',
    windDownBody: 'Igihe co kuruhuka: gabanya umuco kandi ushire terefone hirya.',
    goodMorningTitle: 'Mwaramutse!',
    goodMorningBody: 'Fungura Imara urabe ingene waryamye.',
    sleepFromSchedule: 'Amajoro terefone itapimye aharurwa bivanye n’ingengabihe yawe n’ukwinyegeza kwawe · kosora na − na +',
    dragToAdjust: 'Kwegera uburiri canke isaha yo kuvyuka ku ruziga, canke kwegera umurongo wose ngo uhindure vyose.',
    weekdaysLabel: 'Iminsi y’akazi',
    weekendLabel: 'Impera y’indwi',
    weekendDifferent: 'Amasaha atandukanye mu mpera y’indwi',
    weekendNote: 'Ku majoro yo ku wa gatanu no ku wa gatandatu.',
    bedtimeRemindersNeedsSchedule: 'Shinga ingengabihe y’ibitotsi ku rupapuro rw’Ibitotsi kugira ubironke.',
    tonightSchedule: 'Iri joro: kuryama {bed} · kuvyuka {wake}',
    menuSleep: 'Ibitotsi',
    flowMoodTitle: 'Wiyumva gute ubu nyene?',
    flowEnergyTitle: 'Inguvu zawe zimeze gute ubu nyene?',
    flowNoteTitle: 'Hari ico wokwongerako?',
    newCheckIn: 'Andika uko umerewe',
    sectionFeel: 'INGENE WIYUMVA',
    sectionActivity: 'IBIKORWA',
    sectionWaterSleep: 'AMAZI N’IBITOTSI',
    goalsMet: 'Intumbero {n} kuri 3 zashitswe uyu munsi',
    goalsAllMet: 'Intumbero 3 zose zashitswe uyu munsi. Ni vyiza!',
    goalsNone: 'Intumbero zawe z’uyu munsi ziragutegereje',
    menuCycle: 'Ukwezi',
    cycleTitle: 'Ukwezi',
    cycleSub: 'Imihango yawe n’ibizokurikira.',
    cycleDayN: 'Umunsi {n}',
    phaseMenstrual: 'Imihango',
    phaseFollicular: 'Igihe ca folikile',
    phaseFertile: 'Igihe co kwibaruka',
    phaseLuteal: 'Igihe ca luteyale',
    phaseUnknown: 'Nta makuru arahari',
    nextPeriodIn: 'Imihango ikurikira mu minsi {n}',
    nextPeriodTomorrow: 'Imihango ikurikira yitezwe ejo',
    periodToday: 'Imihango yitezwe uyu munsi',
    periodLate: 'Imihango yatevye iminsi {n}',
    periodDayN: 'Imihango · umunsi {n}',
    fertileFrom: 'Igihe co kwibaruka kuva {date} (igereranyo)',
    fertileNow: 'Uri mu gihe co kwibaruka (igereranyo)',
    periodStartedToday: 'Imihango yanje yatanguye uyu munsi',
    periodEndedToday: 'Imihango yanje yarangiye uyu munsi',
    periodStartedOn: 'Yatanguye uwo munsi',
    periodEndedOn: 'Yarangiye uwo munsi',
    anotherDay: 'Hitamwo uwundi munsi',
    cycleEmpty: 'Andika umunsi wa mbere w’imihango yawe gutangura. Imara izogenda imenya ukwezi kwawe.',
    legendPeriod: 'Imihango',
    legendPredicted: 'Imihango yitezwe',
    legendFertile: 'Igihe co kwibaruka',
    legendOvulation: 'Ovilasiyo (igereranyo)',
    avgCycle: 'Uburebure bw’ukwezi',
    avgPeriod: 'Uburebure bw’imihango',
    usingTypical: 'Dukoresha uburebure busanzwe (iminsi 28 na 5) gushika wanditse imihango ibiri.',
    periodsHistory: 'IMIHANGO YAHESHEJE',
    ongoing: 'Iriko irabandanya',
    daysN: 'iminsi {n}',
    removePeriodConfirm: 'Ukuraho iyi mihango?',
    periodSaved: 'Vyabitswe',
    periodRemoved: 'Imihango yakuweho',
    cycleDisclaimer: 'Amatariki ni igereranyo rivanye n’imihango wanditse. Arashobora kuba ataribyo kandi si uburyo bwo kwirinda imbanyi. Raba umukozi w’amagara niba imihango yawe idahoraho, ibabaza cane, iremereye cane, canke yahagaze.',
    flowNone: 'Nta na kimwe',
    flowSpotting: 'Udutonyanga',
    flowLight: 'Bike',
    flowMedium: 'Hagati',
    flowHeavy: 'Vyinshi',
    symCramps: 'Kuribwa mu nda',
    symHeadache: 'Kuribwa n’umutwe',
    symBackPain: 'Kuribwa mu mugongo',
    symBloating: 'Kuvyimba inda',
    symTenderBreasts: 'Amabere aribwa',
    symAcne: 'Ibiheri',
    symFatigue: 'Uburuhe',
    symNausea: 'Iseseme',
    symCravings: 'Ukwipfuza ibifungurwa',
    symInsomnia: 'Kubura ibitotsi',
    symMoodSwings: 'Guhindagurika kw’umutima',
    symAnxiety: 'Amaganya',
    disDry: 'Vyumye',
    disSticky: 'Bifata',
    disCreamy: 'Nk’amavuta',
    disWatery: 'Nk’amazi',
    disEggWhite: 'Nk’umweru w’igi',
    disUnusual: 'Bidasanzwe',
    tipMenstrual: 'Ruhuka igihe bikenewe. Ubushuhe ku nda no kwinyegeza buhoro birashobora kugabanya ububabare. Nywa amazi menshi.',
    tipFollicular: 'Inguvu akenshi ziriyongera inyuma y’imihango. Ni igihe ciza co kwinyegeza kurushirizaho.',
    tipFertile: 'Igihe co kwibaruka kiri hejuru ubu. Ni igereranyo, si uburyo bwo kwirinda imbanyi.',
    tipLuteal: 'Bamwe biyumva bavyimbye, baruhiye canke bababaye imbere y’imihango. Ibitotsi, amazi n’imyitozo mitoya birashobora gufasha.',
    tipUnknown: 'Andika imihango yawe kugira uronke igereranyo n’impanuro kuri buri gihe.',
    inMenstrual: 'mu gihe c’imihango',
    inFollicular: 'inyuma y’imihango',
    inFertile: 'hafi y’igihe co kwibaruka',
    inLuteal: 'mu minsi iri imbere y’imihango',
    noteIrregular: 'Ukwezi kwawe guhinduka ku minsi irenga 9. Umuhangayiko canke indwara birashobora kubitera; nibibandanya, vugana n’umukozi w’amagara.',
    noteShort: 'Ukwezi kwawe akenshi kuri munsi y’iminsi 24. Nibibandanya, vugana n’umukozi w’amagara.',
    noteLong: 'Ukwezi kwawe akenshi kurenza iminsi 38. Nibibandanya, vugana n’umukozi w’amagara.',
    noteLongPeriods: 'Imihango iheruka yamaze iminsi irenga 8. Niba bikunda kuba canke iremereye cane, vugana n’umukozi w’amagara.',
    noteVeryLate: 'Imihango yawe yatevye indwi irenga imwe. Niba ushobora kuba wibungenze, igipimo c’imbanyi kirabikwereka. Umukozi w’amagara arashobora gufasha.',
    legendLogged: 'Ibimenyetso vyanditswe',
    todayLogTitle: 'UYU MUNSI',
    nothingLogged: 'Nta co wanditse. Umubiri wawe umeze gute uyu munsi?',
    logToday: 'Andika uyu munsi',
    editToday: 'Hindura uyu munsi',
    insightsTitle: 'IMPANURO',
    patternText: '{symptom} akenshi kiza {phase}',
    patternCount: 'Vyanditswe incuro {n}',
    upcomingTitle: 'IMIHANGO IKURIKIRA',
    upcomingFertile: 'Igihe co kwibaruka {range}',
    openCalendar: 'Fungura kalindari yose',
    calendarPageTitle: 'Kalindari',
    calendarPageSub: 'Urugendo rw’imihango yawe',
    calendarAhead: 'UKU KWEZI N’IBIZOKURIKIRA',
    calendarJourney: 'URUGENDO RWAWE',
    variationLabel: 'Ihinduka',
    cycleOfN: 'ukwezi kw’iminsi {n}',
    autoEndedNote: 'Yafashwe nk’iyarangiye inyuma y’iminsi {n} isanzwe. Uracava amaraso? Andika amaraso kuri iyo minsi canke ushinge umunsi yaherereyeko.',
    setEndDay: 'Shinga umunsi yaherereyeko',
    cycleReminders: 'Kwibutswa ukwezi',
    cycleRemindersNote: 'Imisi ibiri imbere y’imihango, n’igihe co kwibaruka gitanguye.',
    periodSoonTitle: 'Imihango yitezwe mu minsi 2',
    periodSoonBody: 'Imihango yawe irashobora gutangura hafi ya {date}. Ni vyiza kwitegurira ibikoresho.',
    fertileTitle: 'Igihe co kwibaruka gitanguye uyu munsi',
    fertileBody: 'Igereranyo rivanye n’ukwezi kwawe. Si uburyo bwo kwirinda imbanyi.',
    dayLogTitle: 'Ivyo wanditse ku munsi',
    flowLabel: 'AMARASO',
    symptomsLabel: 'IBIMENYETSO',
    dischargeLabel: 'IVISOHOKA',
    dayNoteLabel: 'ICIBUTSO (SI NGOMBWA)',
    futureDay: 'Uyu munsi ntarashika. Ng’ibi ibitezwe.',
    dayTooOld: 'Iminsi irenga 90 iheze ntishobora guhindurwa.',
    dayInPeriod: 'Mu mihango yawe',
    dayExpectedPeriod: 'Imihango yitezwe (igereranyo)',
    dayFertile: 'Igihe co kwibaruka (igereranyo)',
    dayOvulation: 'Ovilasiyo igereranijwe',
    periodStartedHere: 'Imihango yanje yatanguye uyu munsi',
    periodEndedHere: 'Imihango yanje yarangiye uyu munsi',
    reportTitle: 'Raporo y’amagara',
    reportSub: 'Incamake y’ukwezi kwereka umukozi w’amagara',
    shareReport: 'Sangiza raporo',
    reportSummary: 'INCAMAKE',
    reportGenerated: 'Yakozwe na Imara Afya ku wa {date}',
    reportTypicalCycle: 'Ukwezi gusanzwe',
    reportTypicalPeriod: 'Imihango isanzwe',
    reportCyclesLogged: 'Imihango yanditswe',
    reportNextPeriod: 'Imihango ikurikira yitezwe',
    reportNotes: 'Ivyitonderwa',
    reportSymptoms: 'Ibimenyetso bikunda kuza',
    reportCycles: 'Amezi',
    reportNoPeriods: 'Nta mihango irandikwa.',
    checkInAgain: 'Andika kandi',
    checkInsToday: 'Incuro {n} uyu munsi',
    checkInsTodayOne: 'Incuro 1 uyu munsi',
    checkInTodayList: 'UKO WARI UMEREWE UYU MUNSI',
    checkInRemoveOne: 'Ukuraho ivyo wanditse?',
    trendTitle: 'UKO BIGENDA',
    trend7: 'Iminsi 7',
    trend30: 'Iminsi 30',
    trendUp: 'Wiyumva neza kuruta indwi iheze.',
    trendDown: 'Wiyumva nabi gatoyi kuruta indwi iheze. Iyiteho.',
    trendSteady: 'Uko wiyumva ntivyahindutse ugereranije n’indwi iheze.',
    trendNotEnough: 'Andika uko umerewe iminsi mikeyi yindi kugira ubone uko bigenda.',
    bestMorning: 'Akenshi wiyumva neza mu gitondo.',
    bestAfternoon: 'Akenshi wiyumva neza ku murango.',
    bestEvening: 'Akenshi wiyumva neza ku mugoroba.',
    moodLabel: 'INGENE WIYUMVA',
    energyLabel: 'INGUVU',
    checkInNote: 'ICANDIKO (SI NGOMBWA)',
    checkInNotePlaceholder: 'Hari ico uriko uriyumvira?',
    checkInSave: 'Bika',
    checkInSaved: 'Vyabitswe',
    checkInRemoved: 'Vyakuweho',
    remove: 'Kuraho',
    moodAverage: 'Ingene wiyumva (iminsi 7)',
    energyAverage: 'Inguvu (iminsi 7)',
    checkInDays: 'Iminsi wanditse (iminsi 30)',
    checkInHistory: 'IVYANDITSWE VUBA',
    noCheckIns: 'Nta co urandika. Ica mbere gitangura urukurikirane rwawe.',
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
