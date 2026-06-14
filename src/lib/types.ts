export type Category = 'daily' | 'speed' | 'race'
export type RaceType = 'marathon' | 'half' | 'ten_k' | 'five_k' | 'other'

export interface Profile {
  id: string
  name: string
  birth_year: number | null
  gender: 'male' | 'female' | null
  height_in: number | null
  weight_lb: number | null
  created_at: string
}

export interface Shoe {
  id: string
  user_id: string
  name: string
  brand: string
  category: Category
  max_miles: number
  start_miles: number
  size: number | null
  wide: string
  price: number | null
  retired: boolean
  added_date: string
  created_at: string
}

export type RunType = 'recovery' | 'recovery_strides' | 'gen_aerobic' | 'med_long' | 'lt_run' | 'tempo' | 'long_run' | 'speed_intervals'

export interface TrainingPlan {
  id: string
  user_id: string
  name: string
  goal: string | null
  start_date: string
  weeks: number
  active: boolean
  created_at: string
}

export interface PlannedRun {
  id: string
  user_id: string
  plan_id: string
  week_number: number
  day_of_week: number
  date: string
  run_type: RunType
  planned_miles: number
  target_pace: string | null
  shoe_id: string | null
  notes: string | null
  logged_run_id: string | null
  created_at: string
}

export interface UpcomingRace {
  id: string
  user_id: string
  name: string
  date: string
  type: string
  location: string | null
  goal_time: string | null
  created_at: string
}

export interface Run {
  id: string
  user_id: string
  shoe_id: string
  miles: number
  date: string
  pace: string | null
  hr: number | null
  comfort: number
  elevation: number | null
  temp: number | null
  humidity: number | null
  location: string | null
  notes: string | null
  finish_time: string | null
  is_race: boolean
  race_name: string | null
  race_type: RaceType | null
  knee_pain: number | null
  foot_pain: number | null
  shin_pain: number | null
  created_at: string
}

export interface ShoeWithRuns extends Shoe {
  runs: Run[]
  totalMiles: number
  score: number | null
}
