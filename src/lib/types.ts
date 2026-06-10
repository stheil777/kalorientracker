export type ProfileName = "Stephan" | "Jen";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Sex = "male" | "female";
export type ActivityLevel = "low" | "light" | "moderate" | "high";
export type GoalType = "lose" | "maintain" | "gain";
export type DietType = "balanced" | "high_protein" | "vegetarian" | "vegan" | "low_carb";

export type Profile = {
  id: string;
  user_id: string;
  name: ProfileName;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  current_weight: number | null;
  height_cm: number | null;
  age: number | null;
  sex: Sex | null;
  activity_level: ActivityLevel | null;
  goal_type: GoalType | null;
  diet_type: DietType | null;
  calculated_tdee: number | null;
};

export type MealEntry = {
  id: string;
  user_id: string;
  profile_id: string;
  date: string;
  meal_type: MealType;
  food_name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
};

export type FavoriteMeal = {
  id: string;
  user_id: string;
  profile_id: string | null;
  name: string;
  amount: string;
  meal_type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
};

export type DailyNote = {
  id: string;
  user_id: string;
  profile_id: string;
  date: string;
  weight: number | null;
  training: boolean;
  water_intake: number | null;
  sleep_quality: number | null;
  energy_level: number | null;
  notes: string | null;
};

export type MealFormState = {
  meal_type: MealType;
  food_name: string;
  amount: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  saveFavorite: boolean;
};
