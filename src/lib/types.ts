export type Category = 'daily' | 'speed' | 'race'
export type RaceType = 'marathon' | 'half' | 'ten_k' | 'five_k' | 'other'

export interface Profile {
  id: string
  name: string
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
  added_date: string
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
  created_at: string
}

export interface ShoeWithRuns extends Shoe {
  runs: Run[]
  totalMiles: number
  score: number | null
}
