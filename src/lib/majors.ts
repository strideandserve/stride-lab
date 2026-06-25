// ── WORLD MARATHON MAJORS DATA ──
// Sources: official race websites, therunningchannel.com (updated April 2026),
// marathonballot.com, pace-perfect.com, marathonhandbook.com, balott.run,
// rundida.com, marathontrainingacademy.com. All figures verified June 2026.
//
// UPDATE (June 2026): Cape Town Marathon confirmed as the 8th Abbott World
// Marathon Major on June 10, 2026, joining as Africa's first Major. It formally
// enters the series at its May 23, 2027 edition. Qualifying time standards for
// the inaugural Major edition had not yet been published as of this update.

export interface AlternativeEntry {
  name: string
  description: string
  guaranteed: boolean
  learnMoreUrl: string
}

export interface CharityInfo {
  spotsApprox: number | null
  numPartners: number | null
  minFundraisingUSD: number | null
  maxFundraisingUSD: number | null
  fundraisingNote: string
  applicationNote: string
  deadline: string           // When charity spots typically close (human-readable)
  deadlineUrgency: 'immediate' | 'weeks' | 'months'  // how fast they fill
  learnMoreUrl: string
}

export interface MajorMarathon {
  id: string
  name: string
  city: string
  country: string
  flag: string
  raceDate2026: string
  raceDate2027: string
  entryMethod: 'lottery' | 'qualifier-only' | 'both'
  lotteryWindow: string
  lotteryOpens: string | null
  lotteryCloses: string | null
  lotteryResultsDate: string | null
  lotteryResultsDesc: string
  lotteryOdds: string
  alternativeEntries: AlternativeEntry[]
  charity: CharityInfo | null
  qualifyingTimes: QualifyingTimes | null
  qualifyingUrl: string        // direct URL to the qualifying time application page
  qualifyingNotes: string
  entryUrl: string
  guaranteed: boolean
  color: string
}

export interface QualifyingTimes {
  male: AgeGroupTimes
  female: AgeGroupTimes
}

export type AgeGroupTimes = {
  '18-34': string
  '35-39': string
  '40-44': string
  '45-49': string
  '50-54': string
  '55-59': string
  '60-64': string
  '65-69': string
  '70-74': string
  '75+': string
}

export interface SeriesRace {
  id: string                    // unique within the series, e.g. 'shamrock_2027'
  name: string                  // display name
  distance: string              // e.g. '8K', 'Half Marathon', 'Marathon'
  date: string                  // YYYY-MM-DD race date
  registrationOpens: string     // YYYY-MM-DD when reg opens (approximate)
  registrationNote: string      // human-readable reg timing context
  registerUrl: string           // direct sign-up link
  isSeriesQualifier: boolean    // must finish to earn the series reward
}

export interface RaceSeries {
  id: string
  name: string
  majorId: string               // which major marathon this series feeds into
  reward: string                // what you get for completing all races
  rewardYear: number            // which year's marathon you earn entry into
  description: string
  seriesUrl: string             // official series info page
  races: SeriesRace[]
}

export const RACE_SERIES: RaceSeries[] = [
  {
    id: 'chicago_distance_2027',
    name: 'Bank of America Chicago Distance Series',
    majorId: 'chicago',
    reward: 'Guaranteed entry to 2028 Chicago Marathon + exclusive Distance Series medal',
    rewardYear: 2028,
    description: 'Complete all three Bank of America races — the Shamrock Shuffle 8K (spring), Chicago 13.1 Half Marathon (summer), and the Chicago Marathon (fall) — in a single calendar year and earn a guaranteed spot in the following year\'s Chicago Marathon. Now in its fourth year, the Distance Series is the most accessible guaranteed-entry path into Chicago: no qualifying time, no fundraising, just finish three iconic Chicago races. Registration for all three events typically opens together each October with early-bird discounted pricing.',
    seriesUrl: 'https://www.chicagomarathon.com/apply/chicago-distance-series/',
    races: [
      {
        id: 'shamrock_2027',
        name: 'Bank of America Shamrock Shuffle',
        distance: '8K',
        date: '2027-03-21',
        registrationOpens: '2026-10-01',
        registrationNote: 'Registration typically opens in early October alongside the marathon application window. Early-bird discount pricing is available for a limited time. First-come, first-served — no lottery.',
        registerUrl: 'https://www.shamrockshuffle.com/register/8krun/',
        isSeriesQualifier: true,
      },
      {
        id: 'chicago131_2027',
        name: 'Bank of America Chicago 13.1',
        distance: 'Half Marathon',
        date: '2027-06-06',
        registrationOpens: '2026-10-01',
        registrationNote: 'Registration opens each October with the series launch. The 2026 edition sold out — sign up early. First-come, first-served. Early-bird discount pricing available at launch.',
        registerUrl: 'https://www.chicago13point1.com/sign-up/register/',
        isSeriesQualifier: true,
      },
      {
        id: 'chicago_marathon_2027',
        name: 'Bank of America Chicago Marathon',
        distance: 'Marathon',
        date: '2027-10-10',
        registrationOpens: '2026-10-21',
        registrationNote: 'Chicago Marathon applications open mid-October for a four-week window. You must apply through the lottery or a guaranteed entry path — completing the 2026 Distance Series earns you guaranteed entry without entering the lottery.',
        registerUrl: 'https://www.chicagomarathon.com/apply/',
        isSeriesQualifier: true,
      },
    ],
  },
]

export const MAJORS: MajorMarathon[] = [
  {
    id: 'tokyo',
    name: 'Tokyo Marathon',
    city: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    raceDate2026: '2026-03-01',
    raceDate2027: '2027-03-07',
    entryMethod: 'both',
    lotteryWindow: 'Mid-August (2 weeks)',
    lotteryOpens: '2026-08-15',
    lotteryCloses: '2026-08-31',
    lotteryResultsDate: '2026-09-15',
    lotteryResultsDesc: 'Mid-September',
    lotteryOdds: '~10%',
    alternativeEntries: [
      {
        name: 'ONE TOKYO Membership Priority Ballot',
        description: 'Paid annual membership (¥5,500/year) gives you priority access to the lottery before it opens to the general public, plus you automatically roll into the general draw if not selected — increasing overall odds.',
        guaranteed: false,
        learnMoreUrl: 'https://www.marathon.tokyo/en/participants/',
      },
      {
        name: 'ONE TOKYO Global — 3 Consecutive Rejections',
        description: 'After three consecutive unsuccessful lottery applications as an active ONE TOKYO Global member (2025, 2026, 2027), you become eligible for a guaranteed entry to a future Tokyo Marathon. This path activates starting from the 2028 race.',
        guaranteed: true,
        learnMoreUrl: 'https://www.marathon.tokyo/en/participants/guideline/',
      },
      {
        name: 'Semi-Elite Entry (RUN as ONE)',
        description: 'Runners who have completed a marathon in under 2:28:00 (men) or 3:09:00 (women) at a World Athletics Label Race within the qualifying window are eligible for 25 overseas spots per gender. Selected fastest-first.',
        guaranteed: false,
        learnMoreUrl: 'https://www.marathon.tokyo/en/participants/',
      },
      {
        name: 'Tour Operator Packages',
        description: 'International runners can book through official Abbott WMM tour partners who have guaranteed bibs allocated. Packages typically include entry, hotel, and race-day support. Many US operators sell out months in advance.',
        guaranteed: true,
        learnMoreUrl: 'https://www.marathon.tokyo/en/participants/',
      },
    ],
    charity: {
      spotsApprox: 5000,
      numPartners: 41,
      minFundraisingUSD: 625,
      maxFundraisingUSD: 1250,
      fundraisingNote: 'Donation minimum is ¥100,000 (~$625 USD) to ¥200,000 (~$1,250 USD) depending on the charity partner. Unlike Western marathons, you pay the full donation upfront — there is no fundraising window. Selection is NOT first-come, first-served; charities prioritize higher donation amounts. Application window is short (~2 weeks in late June).',
      applicationNote: 'Application opens June 24 for the 2027 race. You apply to an individual charity organization through the RUN with HEART program, not the Tokyo Marathon directly. Some charities restrict applications to Japan residents.',
      deadline: '~2 weeks in late June (window is June 24–July 9). The fastest-closing window of any Major — act the day applications open.',
      deadlineUrgency: 'immediate',
      learnMoreUrl: 'https://www.marathon.tokyo/en/charity/',
    },
    qualifyingTimes: {
      male:   { '18-34':'2:28', '35-39':'2:28', '40-44':'2:28', '45-49':'2:28', '50-54':'2:28', '55-59':'2:28', '60-64':'2:28', '65-69':'2:28', '70-74':'2:28', '75+':'2:28' },
      female: { '18-34':'2:54', '35-39':'2:54', '40-44':'2:54', '45-49':'2:54', '50-54':'2:54', '55-59':'2:54', '60-64':'2:54', '65-69':'2:54', '70-74':'2:54', '75+':'2:54' },
    },
    qualifyingNotes: 'Semi-elite only — 25 overseas spots per gender. Selected fastest-first. For most runners the lottery, charity, or tour operator is the practical path.',
    qualifyingUrl: 'https://www.marathon.tokyo/en/participants/',
    entryUrl: 'https://www.marathon.tokyo/en/',
    guaranteed: false,
    color: '#e8002d',
  },
  {
    id: 'boston',
    name: 'Boston Marathon',
    city: 'Boston',
    country: 'USA',
    flag: '🇺🇸',
    raceDate2026: '2026-04-20',
    raceDate2027: '2027-04-19',
    entryMethod: 'qualifier-only',
    lotteryWindow: 'Registration week: early September',
    lotteryOpens: '2026-09-08',
    lotteryCloses: '2026-09-12',
    lotteryResultsDate: '2026-09-25',
    lotteryResultsDesc: 'Late September',
    lotteryOdds: 'Qualifier-only (no lottery)',
    alternativeEntries: [
      {
        name: 'Charity Entry (John Hancock Program)',
        description: 'The B.A.A. Official Charity Program provides invitational entries (bypassing the qualifying standard entirely) to ~200 partner non-profits. Each charity sets its own fundraising minimum — typically $5,000–$15,000 USD. This is the only way in without a qualifying time. Charity places comprise roughly 10% of the total field (~3,000 entries). Apply directly through your chosen charity.',
        guaranteed: true,
        learnMoreUrl: 'https://www.baa.org/charities/',
      },
      {
        name: 'B.A.A. Gives Back Team',
        description: 'The B.A.A. runs its own fundraising team to support youth and community initiatives along the marathon route. Minimum fundraising commitment of $5,000. Open to registered Boston Marathon participants who are not already running for an official charity partner.',
        guaranteed: true,
        learnMoreUrl: 'https://www.baa.org/races/boston-marathon/charity/',
      },
      {
        name: 'International Tour Operators',
        description: 'Non-U.S. and non-Canadian runners can secure a guaranteed entry through an approved international tour operator. Packages include race entry, hotel, and local transfers. U.S. and Canadian residents are not eligible for this route — they must qualify.',
        guaranteed: true,
        learnMoreUrl: 'https://www.baa.org/races/boston-marathon/register/',
      },
    ],
    charity: {
      spotsApprox: 3000,
      numPartners: 193,
      minFundraisingUSD: 5000,
      maxFundraisingUSD: 15000,
      fundraisingNote: '193 official charity partners for 2026. Charity comprises ~10% of the total 30,000-person field. Minimum fundraising is $5,000 USD (set by the B.A.A.) but individual charities often require $10,000–$15,000. International runners: some charities require $15,000 upfront. No deferrals allowed — Boston is the only Major with no deferral program.',
      applicationNote: 'Apply directly to individual charity partners via the B.A.A. charity index. Each charity runs its own selection process — many include interviews. Applications for 2027 will open in late 2026. High-demand charities fill quickly.',
      deadline: 'Most charities open applications Oct–Nov and close Jan–Feb. Popular teams fill within days of opening. Apply the moment your target charity opens.',
      deadlineUrgency: 'immediate',
      learnMoreUrl: 'https://www.baa.org/charities/',
    },
    qualifyingTimes: {
      male:   { '18-34':'2:55', '35-39':'3:00', '40-44':'3:05', '45-49':'3:15', '50-54':'3:20', '55-59':'3:30', '60-64':'3:50', '65-69':'4:05', '70-74':'4:20', '75+':'4:35' },
      female: { '18-34':'3:25', '35-39':'3:30', '40-44':'3:35', '45-49':'3:45', '50-54':'3:50', '55-59':'4:00', '60-64':'4:20', '65-69':'4:35', '70-74':'4:50', '75+':'5:05' },
    },
    qualifyingNotes: 'Meeting the BQ standard does not guarantee entry — the 2026 cutoff was 4:34 faster than the standard. Aim for at least 5–7 minutes under your BQ. Based on age on race day.',
    qualifyingUrl: 'https://www.baa.org/races/boston-marathon/qualify',
    entryUrl: 'https://www.baa.org/races/boston-marathon/qualify',
    guaranteed: false,
    color: '#0075bf',
  },
  {
    id: 'london',
    name: 'London Marathon',
    city: 'London',
    country: 'UK',
    flag: '🇬🇧',
    raceDate2026: '2026-04-26',
    raceDate2027: '2027-04-25',
    entryMethod: 'both',
    lotteryWindow: 'Late April–early May (day after race)',
    lotteryOpens: '2026-04-27',
    lotteryCloses: '2026-05-04',
    lotteryResultsDate: '2026-07-15',
    lotteryResultsDesc: 'Mid-July',
    lotteryOdds: '<5%',
    alternativeEntries: [
      {
        name: 'Good For Age (GFA)',
        description: 'UK residents who have run a certified marathon within the GFA qualifying time for their age group can apply for one of 6,000 places (3,000 men, 3,000 women). Places are allocated fastest-first. Hitting the qualifying time does not guarantee a place — aim for well under it. Note: age is based on when you ran the qualifying time, not race day age.',
        guaranteed: false,
        learnMoreUrl: 'https://www.londonmarathonevents.co.uk/london-marathon/good-age-entry',
      },
      {
        name: 'Championship Entry',
        description: 'Open to UK Athletics-affiliated club runners who meet the Championship qualifying times (significantly faster than GFA). A small allocation of Championship bibs is available for the fastest domestic runners seeking a competitive field start.',
        guaranteed: false,
        learnMoreUrl: 'https://www.londonmarathonevents.co.uk/london-marathon/championship-entry',
      },
      {
        name: 'British Athletics Club Places',
        description: 'UK Athletics-affiliated clubs receive a small allocation of guaranteed places based on club size: clubs with 40–189 first-claim members get 1 entry; 190+ members get 2; clubs of 10–39 members enter a separate ballot for 228 places. Contact your club secretary.',
        guaranteed: true,
        learnMoreUrl: 'https://www.londonmarathonevents.co.uk/london-marathon/running-clubs',
      },
      {
        name: 'Ballot Deferral',
        description: 'Runners who secured a ballot place can defer to the following year right up until the night before the race. You will be notified in June to arrange the deferral. Deferrals from Good For Age and Championship places are not allowed (except for pregnancy).',
        guaranteed: true,
        learnMoreUrl: 'https://www.londonmarathonevents.co.uk/',
      },
      {
        name: 'International Tour Operators',
        description: 'Non-UK runners can book through official overseas tour operators (e.g. Sports Tours International for US, Ireland, and France runners). Tour packages typically include race entry, accommodation, and local transfers. Often the most reliable route for international runners.',
        guaranteed: true,
        learnMoreUrl: 'https://www.tcslondonmarathon.com/enter',
      },
    ],
    charity: {
      spotsApprox: 17000,
      numPartners: 750,
      minFundraisingUSD: 2500,
      maxFundraisingUSD: 5000,
      fundraisingNote: 'London has the largest charity programme of any marathon in the world — roughly 750+ partner charities and approximately 17,000 of the ~59,000 total field running for charity. Minimum fundraising is typically £1,500–£3,000 GBP (~$1,900–$3,800 USD) but varies significantly by charity. Marie Curie is the 2026 Charity of the Year. Large charity teams include Macmillan Cancer Support, British Heart Foundation, Alzheimer\'s Society, NSPCC, and Great Ormond Street Hospital.',
      applicationNote: 'Apply directly through your chosen charity\'s own website. Each charity manages its own spots independently. Many popular charities open applications immediately after ballot results in July and fill within weeks. Charity deferrals are at the charity\'s discretion.',
      deadline: 'Ballot results announced early July. Most charities open applications immediately after and set individual deadlines — Great Ormond Street closes July 25; others run through Jan 2027. Popular teams fill within days of opening.',
      deadlineUrgency: 'weeks',
      learnMoreUrl: 'https://www.tcslondonmarathon.com/enter/run-for-charity',
    },
    qualifyingTimes: {
      male:   { '18-34':'2:52', '35-39':'2:52', '40-44':'2:57', '45-49':'3:02', '50-54':'3:07', '55-59':'3:12', '60-64':'3:34', '65-69':'3:52', '70-74':'4:52', '75+':'5:07' },
      female: { '18-34':'3:38', '35-39':'3:38', '40-44':'3:43', '45-49':'3:46', '50-54':'3:53', '55-59':'3:58', '60-64':'4:23', '65-69':'4:53', '70-74':'5:35', '75+':'6:10' },
    },
    qualifyingNotes: 'Good For Age — UK residents only. Fastest-first basis, 3,000 places per gender. Based on age when you ran the qualifying time.',
    qualifyingUrl: 'https://www.londonmarathonevents.co.uk/london-marathon/good-age-entry',
    entryUrl: 'https://www.tcslondonmarathon.com/enter',
    guaranteed: false,
    color: '#0099cc',
  },
  {
    id: 'sydney',
    name: 'Sydney Marathon',
    city: 'Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    raceDate2026: '2026-08-30',
    raceDate2027: '2027-08-29',
    entryMethod: 'both',
    lotteryWindow: 'September (opens ~6 weeks after race)',
    lotteryOpens: '2026-09-10',
    lotteryCloses: '2026-10-15',
    lotteryResultsDate: '2026-11-10',
    lotteryResultsDesc: 'Mid-November',
    lotteryOdds: '~33%',
    alternativeEntries: [
      {
        name: 'Candidacy Club',
        description: 'Runners who completed the Sydney Marathon during its Abbott WMM candidacy years (2022–2025) earned priority entry rights. International runners who finished once during 2022–2024 qualify; South African runners needed two finishes. These guaranteed slots are now being exercised for 2026–2028 on a first-come, first-served basis once the Candidacy Club window opens.',
        guaranteed: true,
        learnMoreUrl: 'https://www.tcssydneymarathon.com/',
      },
      {
        name: 'High Performance Program (HPP)',
        description: 'Faster runners who have completed an AIMS-certified marathon within the qualifying window with a qualifying time (checking the official site for current standards by age/gender) are eligible for an accelerated entry pool with better odds than the general ballot.',
        guaranteed: false,
        learnMoreUrl: 'https://www.tcssydneymarathon.com/',
      },
      {
        name: 'Official Travel Partners',
        description: 'International runners can book guaranteed race entry through official travel partners including Marathon Tours & Travel (USA), Fitness International Travel, I Run The Globe, and Sports Tours International. Packages range from ~$1,300 to $7,500 per person, not including flights.',
        guaranteed: true,
        learnMoreUrl: 'https://www.tcssydneymarathon.com/',
      },
    ],
    charity: {
      spotsApprox: null,
      numPartners: null,
      minFundraisingUSD: 2000,
      maxFundraisingUSD: 5000,
      fundraisingNote: 'Headline charities for 2026 are Running for Premature Babies and the We Run Foundation. Hundreds of additional Australian, New Zealand, and international charity partners are available. Minimum fundraising varies by partner — international charities typically require $3,000–$5,000 USD (e.g. Free to Run requires $4,000 USD); some Australian charities start at $3,000 AUD (~$2,000 USD). International charity page features no-minimum-commitment charities. The best and most forgiving charity landscape of all the Majors.',
      applicationNote: 'Apply through the charity of your choice via charity.tcssydneymarathon.com. International and Australian/NZ charities have separate pages. Applications typically open alongside ballot results. Some charities are first-come, first-served; others have selection processes.',
      deadline: 'Ballot results mid-November. Charity applications open alongside results. International spots are limited and fill within weeks. Australian charities may accept applications further in advance.',
      deadlineUrgency: 'weeks',
      learnMoreUrl: 'https://www.charity.tcssydneymarathon.com/',
    },
    qualifyingTimes: {
      male:   { '18-34':'2:53', '35-39':'2:55', '40-44':'2:58', '45-49':'3:05', '50-54':'3:14', '55-59':'3:23', '60-64':'3:34', '65-69':'3:45', '70-74':'4:10', '75+':'4:30' },
      female: { '18-34':'3:13', '35-39':'3:15', '40-44':'3:26', '45-49':'3:38', '50-54':'3:51', '55-59':'4:10', '60-64':'4:27', '65-69':'4:50', '70-74':'5:30', '75+':'6:00' },
    },
    qualifyingNotes: 'Fastest-first within age/gender. Must be achieved on an AIMS-certified course. Unsuccessful qualifiers move into the main ballot. Most forgiving ballot odds of all Majors.',
    qualifyingUrl: 'https://www.tcssydneymarathon.com/',
    entryUrl: 'https://www.tcssydneymarathon.com/',
    guaranteed: false,
    color: '#008000',
  },
  {
    id: 'berlin',
    name: 'Berlin Marathon',
    city: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    raceDate2026: '2026-09-27',
    raceDate2027: '2027-09-26',
    entryMethod: 'both',
    lotteryWindow: 'Late September–early November',
    lotteryOpens: '2026-09-25',
    lotteryCloses: '2026-11-06',
    lotteryResultsDate: '2026-12-05',
    lotteryResultsDesc: 'Early December',
    lotteryOdds: '~20-30%',
    alternativeEntries: [
      {
        name: 'Fast Runner (Qualifying Time) — Guaranteed Entry',
        description: 'Berlin GUARANTEES entry to runners who meet the published fast-runner time standards by age and gender. Submit proof of your qualifying time during the lottery registration window (Sept 25–Nov 6) and receive guaranteed confirmation in November. This makes Berlin one of the most straightforward major qualifiers in the world — no cutoff like Boston.',
        guaranteed: true,
        learnMoreUrl: 'https://www.bmw-berlin-marathon.com/en/registration/',
      },
      {
        name: 'Tour Operator Packages',
        description: 'Official international tour operators offer guaranteed bibs bundled with accommodation. Packages typically open in November–December, shortly after lottery results. A reliable backup if you miss the lottery, especially for international runners. Check the official SCC EVENTS partner list for your country\'s operators.',
        guaranteed: true,
        learnMoreUrl: 'https://www.bmw-berlin-marathon.com/en/registration/',
      },
      {
        name: 'Sozialticket Program',
        description: 'A unique Berlin-only initiative: 50 spots are available at a reduced entry fee (€50) for Berlin residents who hold a Sozialticket S (means-tested social transit pass). This reflects the race\'s commitment to accessibility. Write to sozialticket@scc-events.com with your ID and Sozialticket S.',
        guaranteed: true,
        learnMoreUrl: 'https://www.bmw-berlin-marathon.com/en/registration/lottery',
      },
    ],
    charity: {
      spotsApprox: null,
      numPartners: null,
      minFundraisingUSD: 1500,
      maxFundraisingUSD: 3500,
      fundraisingNote: 'Berlin collects over €2 million for social projects at every race through its charity program. Official charity partners include organizations focused on children, health, sustainability, and social inclusion. The race works with the Berliner Stadtmission (Berlin City Mission) and other Berlin/Brandenburg-based charities. International charities like Achilles International require $3,000 USD minimum fundraising for the 2026 race. Entry fee is included with charity participation.',
      applicationNote: 'Charity entries are published each December for the following year\'s race. Apply through individual charity partner websites. For international runners, Achilles International is a well-known English-language option with guaranteed entry.',
      deadline: 'Charity partners announced each December. Individual applications typically open Jan–Mar and fill by spring (April–June). Achilles International\'s deadline for 2026 was September 21.',
      deadlineUrgency: 'months',
      learnMoreUrl: 'https://www.bmw-berlin-marathon.com/en/registration/charity',
    },
    qualifyingTimes: {
      male:   { '18-34':'2:45', '35-39':'2:45', '40-44':'2:45', '45-49':'2:55', '50-54':'2:55', '55-59':'2:55', '60-64':'3:25', '65-69':'3:25', '70-74':'3:25', '75+':'3:25' },
      female: { '18-34':'3:10', '35-39':'3:10', '40-44':'3:10', '45-49':'3:30', '50-54':'3:30', '55-59':'3:30', '60-64':'4:20', '65-69':'4:20', '70-74':'4:20', '75+':'4:20' },
    },
    qualifyingNotes: 'GUARANTEED entry if you meet the qualifying standard — no cutoff, no fastest-first selection. The world\'s fastest marathon course. Submit proof during the lottery window (Sept 25–Nov 6).',
    qualifyingUrl: 'https://www.bmw-berlin-marathon.com/en/registration/',
    entryUrl: 'https://www.bmw-berlin-marathon.com/en/',
    guaranteed: true,
    color: '#1a3a6b',
  },
  {
    id: 'chicago',
    name: 'Chicago Marathon',
    city: 'Chicago',
    country: 'USA',
    flag: '🇺🇸',
    raceDate2026: '2026-10-11',
    raceDate2027: '2027-10-10',
    entryMethod: 'both',
    lotteryWindow: 'Late October–late November',
    lotteryOpens: '2026-10-25',
    lotteryCloses: '2026-11-30',
    lotteryResultsDate: '2026-12-15',
    lotteryResultsDesc: 'Mid-December',
    lotteryOdds: '~25-35%',
    alternativeEntries: [
      {
        name: 'Bank of America Chicago Distance Series',
        description: 'Complete all three races in the Bank of America Chicago Distance Series — the Shamrock Shuffle 8K (March), Chicago 13.1 Half Marathon (June), and the Chicago Marathon itself — and you earn a GUARANTEED entry to the following year\'s Chicago Marathon plus an exclusive finisher medal. This is the most accessible guaranteed-entry program of all the Majors: no qualifying time, no fundraising, just run three Bank of America events in one year.',
        guaranteed: true,
        learnMoreUrl: 'https://www.chicagomarathon.com/apply/chicago-distance-series/',
      },
      {
        name: 'Legacy Finisher Program',
        description: 'If you have finished the Chicago Marathon five or more times within the last 10 years (2015–present), you qualify for guaranteed entry each year you apply. Finishes prior to 2015 do not count. Apply during the regular application window.',
        guaranteed: true,
        learnMoreUrl: 'https://www.chicagomarathon.com/apply/',
      },
      {
        name: 'Time Qualifier — Guaranteed Entry',
        description: 'Chicago GUARANTEES entry to any runner who meets the published age-graded time standards — no cutoff, no fastest-first selection. Unlike Boston, if you hit the Chicago qualifying standard you are in. Submit your qualifying time during the application window (Oct–Nov).',
        guaranteed: true,
        learnMoreUrl: 'https://www.chicagomarathon.com/apply/',
      },
      {
        name: 'Charity Program',
        description: 'Over 10,000 charity entries are available through the Chicago Marathon\'s official Charity Program — the largest guaranteed-entry charity allocation of any Major. Minimum fundraising is $2,200 USD. Charity entries are available through September 15, 2026 (or when the charity reaches capacity). Each charity sets its own additional requirements.',
        guaranteed: true,
        learnMoreUrl: 'https://www.chicagomarathon.com/apply/',
      },
    ],
    charity: {
      spotsApprox: 10000,
      numPartners: 130,
      minFundraisingUSD: 2200,
      maxFundraisingUSD: 5000,
      fundraisingNote: 'Chicago has the largest charity programme of any US Major — approximately 10,000 entries (~18% of the 55,000 field). Minimum fundraising is $2,200 USD, set by the race (lower than Boston). Individual charities may require more. Approximately 130 official charity partners. Entries available until September 15 or capacity. The Chicago Marathon raises millions annually for charitable causes and generates over $547 million in annual economic impact for the city.',
      applicationNote: 'Contact your chosen charity directly via the official Charity Index on the Chicago Marathon website. Each charity manages its own team independently. Early applications are encouraged — most charities fill well before the September deadline.',
      deadline: 'Hard cutoff: September 15 (race year) or when capacity is reached. Many popular charities fill months earlier — December lottery is the best time to pivot to charity if you didn\'t get in.',
      deadlineUrgency: 'months',
      learnMoreUrl: 'https://www.chicagomarathon.com/apply/',
    },
    qualifyingTimes: {
      male:   { '18-34':'2:50', '35-39':'2:55', '40-44':'3:00', '45-49':'3:10', '50-54':'3:15', '55-59':'3:25', '60-64':'3:40', '65-69':'3:55', '70-74':'4:15', '75+':'4:30' },
      female: { '18-34':'3:20', '35-39':'3:25', '40-44':'3:30', '45-49':'3:40', '50-54':'3:50', '55-59':'3:55', '60-64':'4:15', '65-69':'4:25', '70-74':'4:45', '75+':'5:00' },
    },
    qualifyingNotes: 'GUARANTEED entry with qualifying time — no cutoff, no waiting. Flat, fast course ideal for PRs. Time qualifiers from age 16+.',
    qualifyingUrl: 'https://www.chicagomarathon.com/apply/',
    entryUrl: 'https://www.chicagomarathon.com/runners/registration/',
    guaranteed: true,
    color: '#003087',
  },
  {
    id: 'nyc',
    name: 'New York City Marathon',
    city: 'New York',
    country: 'USA',
    flag: '🇺🇸',
    raceDate2026: '2026-11-01',
    raceDate2027: '2027-11-07',
    entryMethod: 'both',
    lotteryWindow: 'February',
    lotteryOpens: '2027-02-01',
    lotteryCloses: '2027-02-28',
    lotteryResultsDate: '2027-03-07',
    lotteryResultsDesc: 'Early March',
    lotteryOdds: '~4%',
    alternativeEntries: [
      {
        name: 'NYRR 9+1 Program',
        description: 'The most popular alternative path into NYC: run 9 qualifying NYRR races and volunteer at 1 NYRR event in a calendar year, and earn guaranteed entry to the following year\'s TCS New York City Marathon. Over 30 in-person races qualify in 2026, including the Brooklyn Half. You must be an active NYRR member by December 31. This program was designed specifically to give local members a reliable, effort-based path into the hometown race. Note: individual qualifying races like the Brooklyn Half can have their own lotteries.',
        guaranteed: true,
        learnMoreUrl: 'https://www.nyrr.org/run/guaranteed-entry/tcs-new-york-city-marathon-9plus1-program',
      },
      {
        name: 'Legacy Program — 15+ Finishes',
        description: 'Runners who have completed 15 or more NYC Marathons earn lifetime guaranteed entry to future races. A testament to the event\'s relationship with its most dedicated participants.',
        guaranteed: true,
        learnMoreUrl: 'https://www.nyrr.org/tcsnycmarathon/runners/entry/2026',
      },
      {
        name: 'NYRR Philanthropic Membership (5K/10K Level)',
        description: 'NYRR Philanthropic Members at the 5K ($5,000 donation) or 10K ($10,000 donation) annual level receive guaranteed entry to the TCS NYC Marathon plus VIP hospitality, among other benefits. A premium path for those who want to combine guaranteed access with major philanthropic support for NYRR\'s community running programs.',
        guaranteed: true,
        learnMoreUrl: 'https://www.nyrr.org/tcsnycmarathon/runners/entry/2026',
      },
      {
        name: 'Virtual NYC Marathon — Guaranteed Entry Tier',
        description: 'Runners who complete the Virtual TCS New York City Marathon in the Guaranteed Entry tier earn a guaranteed spot in the following year\'s in-person race. Includes a finisher medal shipped to you.',
        guaranteed: true,
        learnMoreUrl: 'https://www.nyrr.org/tcsnycmarathon',
      },
      {
        name: 'International Tour Operators',
        description: 'Non-US residents can book through official international tour operators who hold guaranteed bibs. Marathon Tours & Travel (including its Seven Continents Club program) is the most well-known. US residents are not eligible for international tour operator packages.',
        guaranteed: true,
        learnMoreUrl: 'https://www.nyrr.org/tcsnycmarathon/runners/entry/2026',
      },
    ],
    charity: {
      spotsApprox: 10000,
      numPartners: 500,
      minFundraisingUSD: 3000,
      maxFundraisingUSD: 5000,
      fundraisingNote: '~500 NYRR charity partners, with roughly 10,000 charity entries in a field of ~55,000. Minimum fundraising is $3,000–$3,500 USD depending on the charity. A 240,000+ record applicant pool in 2026 (20% increase year-over-year) makes this the hardest NYC entry to win through the ballot, making charity one of the few reliable paths. Teams for Kids (TFK) is NYRR\'s official charity team — register and raise a minimum amount for guaranteed entry plus coaching support.',
      applicationNote: 'Apply through NYRR-partnered charities via nyrr.org. The Teams for Kids program is the flagship option and includes a coach and virtual training platform. Charity applications typically open in March–April each year, following lottery results.',
      deadline: 'Lottery results announced early March. Individual charity teams set their own deadlines — TeamConcern\'s 2026 deadline was April 9, and spots were gone within weeks of lottery results. Act immediately after the March draw.',
      deadlineUrgency: 'immediate',
      learnMoreUrl: 'https://www.nyrr.org/tcsnycmarathon',
    },
    qualifyingTimes: {
      male:   { '18-34':'2:53', '35-39':'2:55', '40-44':'2:58', '45-49':'3:05', '50-54':'3:15', '55-59':'3:23', '60-64':'3:34', '65-69':'3:45', '70-74':'4:10', '75+':'4:30' },
      female: { '18-34':'3:13', '35-39':'3:15', '40-44':'3:26', '45-49':'3:38', '50-54':'3:51', '55-59':'4:10', '60-64':'4:27', '65-69':'4:50', '70-74':'5:30', '75+':'6:00' },
    },
    qualifyingNotes: 'Fastest-first in each age/gender bracket. NYRR 9+1 program (run 9 NYRR races + volunteer once) guarantees entry. Legacy: 15+ finishes earns lifetime entry.',
    qualifyingUrl: 'https://www.nyrr.org/tcsnycmarathon/runners/entry/2026',
    entryUrl: 'https://www.nyrr.org/tcsnycmarathon',
    guaranteed: false,
    color: '#ff6200',
  },
  {
    id: 'capetown',
    name: 'Cape Town Marathon',
    city: 'Cape Town',
    country: 'South Africa',
    flag: '🇿🇦',
    raceDate2026: '2026-05-24',
    raceDate2027: '2027-05-23',
    entryMethod: 'both',
    lotteryWindow: 'Mid-June (2 weeks)',
    lotteryOpens: '2026-06-10',
    lotteryCloses: '2026-06-24',
    lotteryResultsDate: '2026-06-26',
    lotteryResultsDesc: 'June 26',
    lotteryOdds: 'TBD — first year as a Major',
    alternativeEntries: [
      {
        name: 'Candidacy Club',
        description: 'Runners who completed the Sanlam Cape Town Marathon at least once during the candidacy evaluation years (2022–2025) earned priority entry rights to 2027, 2028, or 2029. International runners need one finish; South African runners need two. The Candidacy Club was developed to reward runners who supported the race during its path to Major status. Entries are available first-come, first-served once the Candidacy Club window opens alongside the ballot.',
        guaranteed: true,
        learnMoreUrl: 'https://capetownmarathon.com/candidacy-club/',
      },
      {
        name: 'International Tour Operators (ITO)',
        description: 'Guaranteed race entries are available through official International Tour Operator partners, opening June 26, 2026. ITOs bundle race entry with accommodation and travel assistance. A reliable fallback for international runners who miss the ballot, which closes the same day ITO entries open.',
        guaranteed: true,
        learnMoreUrl: 'https://capetownmarathon.com/marathon/',
      },
      {
        name: 'Charity Entry',
        description: 'Official charity partners hold guaranteed bibs available for runners who commit to fundraising. Charity and ITO entries both open June 26, 2026 — the same day ballot results are announced. This means you can immediately pivot to a charity entry if you are not selected in the ballot. Africa\'s newest Major; charity infrastructure is still developing — check the official site for 2027 charity partner list.',
        guaranteed: true,
        learnMoreUrl: 'https://capetownmarathon.com/charities/',
      },
    ],
    charity: {
      spotsApprox: null,
      numPartners: null,
      minFundraisingUSD: null,
      maxFundraisingUSD: null,
      fundraisingNote: 'As the newest Major (confirmed June 2026), the Cape Town Marathon\'s charity programme is still maturing. Charity and ITO entries open June 26, 2026 for the 2027 race. The race has a history of charity partnerships through its candidacy years. Two-thirds of the total field are reserved for African participants, which significantly affects international charity spot availability. Check the official site for current partner organizations and fundraising minimums.',
      applicationNote: 'Charity and ITO entries open simultaneously with ballot results on June 26, 2026 at capetownmarathon.com. The race moves quickly — act immediately if you are not selected in the ballot. International spots are limited due to the African-participant field reservation.',
      deadline: 'Charity entries open June 26, 2026 (same day as ballot results). As the newest Major, timelines are still being established — treat it as immediate and apply the day entries open.',
      deadlineUrgency: 'immediate',
      learnMoreUrl: 'https://capetownmarathon.com/charities/',
    },
    qualifyingTimes: null,
    qualifyingNotes: 'Africa\'s first Abbott World Marathon Major, confirmed June 2026. Qualifying time standards for the 2027 inaugural Major edition have not yet been published — check the official site for updates.',
    qualifyingUrl: 'https://capetownmarathon.com/marathon/',
    entryUrl: 'https://capetownmarathon.com/',
    guaranteed: false,
    color: '#ffb612',
  },
]

// Returns the qualifying time for a given major, gender, and age
export function getMajorQualifyingTime(major: MajorMarathon, gender: 'male' | 'female', age: number): string | null {
  if (!major.qualifyingTimes) return null
  const times = gender === 'male' ? major.qualifyingTimes.male : major.qualifyingTimes.female
  if (age < 35) return times['18-34']
  if (age < 40) return times['35-39']
  if (age < 45) return times['40-44']
  if (age < 50) return times['45-49']
  if (age < 55) return times['50-54']
  if (age < 60) return times['55-59']
  if (age < 65) return times['60-64']
  if (age < 70) return times['65-69']
  if (age < 75) return times['70-74']
  return times['75+']
}

export function hasQualified(finishTime: string, qualTime: string): boolean {
  const toSecs = (t: string) => {
    const parts = t.split(':').map(Number)
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2]
    return parts[0]*60 + parts[1]
  }
  return toSecs(finishTime) <= toSecs(qualTime)
}

export function formatQualTime(t: string): string {
  if (t.split(':').length === 2) return `${t}:00`
  return t
}
