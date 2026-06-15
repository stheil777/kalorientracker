"use client";

import {
  useEffect,
  useRef,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  Calculator,
  Check,
  ChevronDown,
  Flame,
  Heart,
  Loader2,
  LogOut,
  Search,
  Settings2,
  Star,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { formatGermanDate, todayISO } from "@/lib/date";
import { JEN_FOODS } from "@/lib/jen-foods";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import type {
  ActivityLevel,
  DailyNote,
  DietType,
  FavoriteMeal,
  FoodResult,
  GoalType,
  MealEntry,
  MealFormState,
  MealType,
  Profile,
  Sex,
} from "@/lib/types";

const mealLabels: Record<MealType, string> = {
  breakfast: "Frühstück",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const mealGoalSplit: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.10,
};

const TRAINING_ACTIVITIES = [
  { value: "yoga", label: "Yoga", met: 3.0 },
  { value: "pilates", label: "Pilates", met: 3.0 },
  { value: "spaziergang", label: "Spaziergang", met: 3.0 },
  { value: "tanzen", label: "Tanzen", met: 4.5 },
  { value: "wandern", label: "Wandern", met: 5.3 },
  { value: "radfahren", label: "Radfahren", met: 6.8 },
  { value: "schwimmen", label: "Schwimmen", met: 6.0 },
  { value: "krafttraining", label: "Krafttraining", met: 5.0 },
  { value: "laufen", label: "Laufen", met: 8.3 },
  { value: "hiit", label: "HIIT", met: 8.0 },
];


const defaultGoals = {
  Stephan: { calories: 2400, protein: 180, carbs: 240, fat: 75 },
  Jen: { calories: 1900, protein: 130, carbs: 190, fat: 60 },
} as const;

const blankMeal: MealFormState = {
  meal_type: "breakfast",
  food_name: "",
  amount: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  saveFavorite: true,
};

const blankNote = {
  weight: "",
  training: false,
  training_notes: "",
  training_activity: "yoga",
  training_duration_min: "30",
  training_kcal: "",
  water_intake: "",
  sleep_quality: "3",
  energy_level: "3",
  satiation: "3",
  mood: "3",
  cravings: "",
  notes: "",
};

const blankGoals = {
  calorie_goal: "",
  protein_goal: "",
  carbs_goal: "",
  fat_goal: "",
  current_weight: "",
  height_cm: "",
  age: "",
  sex: "male" as Sex,
  activity_level: "moderate" as ActivityLevel,
  goal_type: "maintain" as GoalType,
  diet_type: "balanced" as DietType,
  target_weight: "",
  training_frequency: "3",
  cycle_relevant: false,
  sleep_goal_hours: "",
  intolerances: "",
  no_go_foods: "",
  favorite_foods: "",
  alcohol_frequency: "selten",
  alcohol_amount: "",
};

const activityLabels: Record<ActivityLevel, string> = {
  low: "Wenig Bewegung",
  light: "Leicht aktiv",
  moderate: "Moderat aktiv",
  high: "Sehr aktiv",
};

const goalLabels: Record<GoalType, string> = {
  lose: "Abnehmen",
  maintain: "Halten",
  gain: "Aufbauen",
};

const dietLabels: Record<DietType, string> = {
  balanced: "Ausgewogen",
  high_protein: "High Protein",
  vegetarian: "Vegetarisch",
  vegan: "Vegan",
  low_carb: "Low Carb",
};

const starterFavorites = [
  { name: "Hähnchenbrust", amount: "200 g", meal_type: "lunch" as MealType, calories: 330, protein: 62, carbs: 0, fat: 7 },
  { name: "Skyr natur", amount: "250 g", meal_type: "snack" as MealType, calories: 160, protein: 28, carbs: 10, fat: 1 },
  { name: "Reis gekocht", amount: "200 g", meal_type: "lunch" as MealType, calories: 260, protein: 5, carbs: 56, fat: 1 },
  { name: "Ei", amount: "2 Stück", meal_type: "breakfast" as MealType, calories: 156, protein: 13, carbs: 1, fat: 11 },
  { name: "Banane", amount: "1 Stück", meal_type: "snack" as MealType, calories: 105, protein: 1, carbs: 27, fat: 0 },
];

function goalsFromProfile(profile: Profile) {
  return {
    calorie_goal: profile.calorie_goal.toString(),
    protein_goal: profile.protein_goal.toString(),
    carbs_goal: profile.carbs_goal.toString(),
    fat_goal: profile.fat_goal.toString(),
    current_weight: profile.current_weight?.toString() ?? "",
    height_cm: profile.height_cm?.toString() ?? "",
    age: profile.age?.toString() ?? "",
    sex: profile.sex ?? (profile.name === "Jen" ? "female" : "male"),
    activity_level: profile.activity_level ?? "moderate",
    goal_type: profile.goal_type ?? "maintain",
    diet_type: profile.diet_type ?? "balanced",
    target_weight: profile.target_weight?.toString() ?? "",
    training_frequency: profile.training_frequency?.toString() ?? "3",
    cycle_relevant: profile.cycle_relevant ?? false,
    sleep_goal_hours: profile.sleep_goal_hours?.toString() ?? "",
    intolerances: profile.intolerances ?? "",
    no_go_foods: profile.no_go_foods ?? "",
    favorite_foods: profile.favorite_foods ?? "",
    alcohol_frequency: profile.alcohol_frequency ?? "selten",
    alcohol_amount: profile.alcohol_amount ?? "",
  };
}

function calculateTargets(form: typeof blankGoals) {
  const weight = Number(form.current_weight);
  const height = Number(form.height_cm);
  const age = Number(form.age);

  if (!weight || !height || !age) return null;

  const bmr = 10 * weight + 6.25 * height - 5 * age + (form.sex === "male" ? 5 : -161);
  const activityFactor: Record<ActivityLevel, number> = {
    low: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
  };
  const tdee = Math.round(bmr * activityFactor[form.activity_level]);
  const calorieAdjustment: Record<GoalType, number> = {
    lose: -400,
    maintain: 0,
    gain: 300,
  };
  const calories = Math.max(1300, Math.round((tdee + calorieAdjustment[form.goal_type]) / 10) * 10);

  const proteinFactor = form.goal_type === "lose" || form.diet_type === "high_protein" ? 2 : form.diet_type === "vegan" ? 1.6 : 1.7;
  const protein = Math.round(weight * proteinFactor);

  if (form.diet_type === "low_carb") {
    const carbs = 110;
    const fat = Math.max(45, Math.round((calories - protein * 4 - carbs * 4) / 9));
    return { calories, protein, carbs, fat, tdee };
  }

  const fatFactor = form.goal_type === "gain" ? 0.9 : 0.8;
  const fat = Math.round(weight * fatFactor);
  const carbs = Math.max(80, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat, tdee };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [resetMode, setResetMode] = useState<"idle" | "sending" | "sent">("idle");
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [date] = useState(todayISO());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [dailyNote, setDailyNote] = useState(blankNote);
  const [mealForm, setMealForm] = useState<MealFormState>(blankMeal);
  const [editingGoals, setEditingGoals] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType | null>(null);
  const [inlineKey, setInlineKey] = useState<string | null>(null);
  const [inlineFood, setInlineFood] = useState<{ name: string; per100g: FoodResult["per100g"]; stueckG?: number } | null>(null);
  const [inlineGrams, setInlineGrams] = useState(100);
  const [inlineLabel, setInlineLabel] = useState("100 g");
  const [goalForm, setGoalForm] = useState(blankGoals);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FoodResult[]>([]);
  const [foodSearching, setFoodSearching] = useState(false);
  const [showFoodResults, setShowFoodResults] = useState(false);
  const [foodFocused, setFoodFocused] = useState(false);

  const jenMatches = useMemo(() => {
    if (!foodFocused) return [];
    const q = foodQuery.trim().toLowerCase();
    if (!q) return JEN_FOODS.slice(0, 8);
    return JEN_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
  }, [foodQuery, foodFocused]);

  const favNames = useMemo(() => new Set(favorites.map((f) => f.name)), [favorites]);

  const showDropdown = foodFocused && (jenMatches.length > 0 || showFoodResults || foodSearching);

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
  const calculatedPreview = calculateTargets(goalForm);
  const profileNeedsSetup = Boolean(
    activeProfile &&
      (!activeProfile.current_weight ||
        !activeProfile.height_cm ||
        !activeProfile.age ||
        !activeProfile.sex ||
        !activeProfile.activity_level ||
        !activeProfile.goal_type ||
        !activeProfile.diet_type),
  );

  const totals = useMemo(
    () =>
      meals.reduce(
        (sum, meal) => ({
          calories: sum.calories + meal.calories,
          protein: sum.protein + meal.protein,
          carbs: sum.carbs + meal.carbs,
          fat: sum.fat + meal.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [meals],
  );

  const mealsByType = useMemo(
    () => meals.reduce((acc, m) => { (acc[m.meal_type] ??= []).push(m); return acc; }, {} as Record<string, MealEntry[]>),
    [meals],
  );

  const caloriesLeft = Math.max(
    (activeProfile?.calorie_goal ?? 0) - totals.calories + (Number(dailyNote.training_kcal) || 0),
    0,
  );
  const animatedCaloriesLeft = useAnimatedNumber(caloriesLeft);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    const userId = user.id;

    async function loadProfiles() {
      const profileName: "Stephan" | "Jen" =
        user!.email === "mail@stheil.de" ? "Stephan" : "Jen";

      const { data, error } = await supabase!
        .from("profiles")
        .select("*")
        .eq("name", profileName);

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      if (data.length === 0) {
        const goals = defaultGoals[profileName];
        const { data: created, error: createError } = await supabase!
          .from("profiles")
          .insert([
            {
              user_id: userId,
              name: profileName,
              calorie_goal: goals.calories,
              protein_goal: goals.protein,
              carbs_goal: goals.carbs,
              fat_goal: goals.fat,
            },
          ])
          .select("*");

        if (createError) {
          setAuthMessage(createError.message);
          return;
        }

        setProfiles((created ?? []) as Profile[]);
        setActiveProfileId(created?.[0]?.id ?? "");
        return;
      }

      setProfiles(data as Profile[]);
      setActiveProfileId((current) => current || data[0].id);
    }

    loadProfiles();
  }, [user]);

  useEffect(() => {
    if (!user || !activeProfile || !supabase) return;
    refreshDay();
    refreshFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeProfileId, date]);

  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(() => setSaveError(""), 4000);
    return () => clearTimeout(t);
  }, [saveError]);

  useEffect(() => {
    if (foodQuery.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setFoodSearching(true);
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(foodQuery)}`, { signal: controller.signal });
        const data: FoodResult[] = await res.json();
        setFoodResults(data);
        setShowFoodResults(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setFoodSearching(false);
      } finally {
        setFoodSearching(false);
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [foodQuery]);

  async function refreshDay() {
    if (!supabase || !activeProfile) return;

    const [{ data: mealRows }, { data: noteRows }] = await Promise.all([
      supabase
        .from("meal_entries")
        .select("*")
        .eq("profile_id", activeProfile.id)
        .eq("date", date)
        .order("created_at", { ascending: false }),
      supabase
        .from("daily_notes")
        .select("*")
        .eq("profile_id", activeProfile.id)
        .eq("date", date)
        .limit(1),
    ]);

    setMeals((mealRows ?? []) as MealEntry[]);
    const note = noteRows?.[0] as DailyNote | undefined;
    setDailyNote(
      note
        ? {
            weight: note.weight?.toString() ?? "",
            training: note.training,
            training_notes: note.training_notes ?? "",
            training_activity: note.training_activity ?? "yoga",
            training_duration_min: note.training_duration_min?.toString() ?? "30",
            training_kcal: note.training_kcal?.toString() ?? "",
            water_intake: note.water_intake?.toString() ?? "",
            sleep_quality: note.sleep_quality?.toString() ?? "3",
            energy_level: note.energy_level?.toString() ?? "3",
            satiation: note.satiation?.toString() ?? "3",
            mood: note.mood?.toString() ?? "3",
            cravings: note.cravings ?? "",
            notes: note.notes ?? "",
          }
        : blankNote,
    );
  }

  async function refreshFavorites() {
    if (!supabase || !activeProfile) return;
    const { data } = await supabase
      .from("favorite_meals")
      .select("*")
      .or(`profile_id.eq.${activeProfile.id},profile_id.is.null`)
      .order("created_at", { ascending: false });

    setFavorites((data ?? []) as FavoriteMeal[]);
  }

  async function saveAsFavorite(name: string, per100g: { calories: number; protein: number; carbs: number; fat: number }) {
    if (!supabase || !user || !activeProfile || favNames.has(name)) return;
    await supabase.from("favorite_meals").insert({
      user_id: user.id, profile_id: activeProfile.id,
      name, amount: "100 g", meal_type: activeMealType ?? "snack",
      calories: Math.round(per100g.calories),
      protein: Math.round(per100g.protein * 10) / 10,
      carbs: Math.round(per100g.carbs * 10) / 10,
      fat: Math.round(per100g.fat * 10) / 10,
    });
    await refreshFavorites();
  }

  async function addStarterFavorites() {
    if (!supabase || !user || !activeProfile) return;
    setSaving(true);
    await supabase.from("favorite_meals").insert(
      starterFavorites.map((favorite) => ({
        ...favorite,
        user_id: user.id,
        profile_id: activeProfile.id,
      })),
    );
    await refreshFavorites();
    setSaving(false);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    if (authMode === "signup" && !privacyAccepted) {
      setAuthMessage("Bitte stimme der Datenschutzerklärung zu.");
      return;
    }
    setSaving(true);
    setAuthMessage("");

    const result =
      authMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName.trim(), full_name: firstName.trim() } } });

    if (result.error) {
      setAuthMessage(result.error.message);
    } else if (authMode === "signup") {
      setAuthMessage("Account erstellt. Prüfe ggf. deine E-Mail-Bestätigung.");
    }

    setSaving(false);
  }

  async function handleResetPassword() {
    if (!supabase) return;
    if (!email) { setAuthMessage("Bitte zuerst deine E-Mail eingeben."); return; }
    setResetMode("sending");
    setAuthMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : "",
    });
    if (error) { setAuthMessage(error.message); setResetMode("idle"); }
    else setResetMode("sent");
  }

  async function handleNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setAuthMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setAuthMessage(error.message); }
    else { setPasswordRecovery(false); setAuthMessage(""); }
    setSaving(false);
  }

  async function deleteMeal(mealId: string) {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("meal_entries").delete().eq("id", mealId);
    if (error) { setSaveError("Mahlzeit konnte nicht gelöscht werden."); setSaving(false); return; }
    await refreshDay();
    setSaving(false);
  }

  async function deleteFavorite(favoriteId: string) {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("favorite_meals").delete().eq("id", favoriteId);
    if (error) { setSaveError("Favorit konnte nicht gelöscht werden."); setSaving(false); return; }
    await refreshFavorites();
    setSaving(false);
  }

  async function saveGoals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !activeProfile) return;
    setSaving(true);
    const calculated = calculateTargets(goalForm);

    const { data, error: saveError } = await supabase
      .from("profiles")
      .update({
        calorie_goal: calculated?.calories ?? (Number(goalForm.calorie_goal) || activeProfile.calorie_goal),
        protein_goal: calculated?.protein ?? (Number(goalForm.protein_goal) || activeProfile.protein_goal),
        carbs_goal: calculated?.carbs ?? (Number(goalForm.carbs_goal) || activeProfile.carbs_goal),
        fat_goal: calculated?.fat ?? (Number(goalForm.fat_goal) || activeProfile.fat_goal),
        current_weight: Number(goalForm.current_weight) || null,
        height_cm: Number(goalForm.height_cm) || null,
        age: Number(goalForm.age) || null,
        sex: goalForm.sex,
        activity_level: goalForm.activity_level,
        goal_type: goalForm.goal_type,
        diet_type: goalForm.diet_type,
        calculated_tdee: calculated?.tdee ?? null,
        target_weight: Number(goalForm.target_weight) || null,
        training_frequency: Number(goalForm.training_frequency) || null,
        cycle_relevant: goalForm.cycle_relevant,
        sleep_goal_hours: Number(goalForm.sleep_goal_hours) || null,
        intolerances: goalForm.intolerances.trim() || null,
        no_go_foods: goalForm.no_go_foods.trim() || null,
        favorite_foods: goalForm.favorite_foods.trim() || null,
        alcohol_frequency: goalForm.alcohol_frequency || null,
        alcohol_amount: goalForm.alcohol_amount.trim() || null,
      })
      .eq("id", activeProfile.id)
      .select("*")
      .single();

    if (saveError) { setSaveError("Profil konnte nicht gespeichert werden: " + saveError.message); setSaving(false); return; }
    if (data) {
      setProfiles((current) => current.map((profile) => (profile.id === data.id ? (data as Profile) : profile)));
      setEditingGoals(false);
      if (favorites.length === 0) {
        await addStarterFavorites();
      }
    }

    setSaving(false);
  }

  function selectProfile(profile: Profile) {
    setActiveProfileId(profile.id);
    setGoalForm(goalsFromProfile(profile));
    setEditingGoals(false);
  }

  function toggleGoals() {
    if (!activeProfile) return;
    setGoalForm(goalsFromProfile(activeProfile));
    setEditingGoals((current) => !current);
  }

  async function saveDailyNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !activeProfile) return;
    setSaving(true);

    const { error: noteError } = await supabase.from("daily_notes").upsert(
      {
        user_id: user.id,
        profile_id: activeProfile.id,
        date,
        weight: dailyNote.weight ? Number(dailyNote.weight) : null,
        training: dailyNote.training,
        training_notes: dailyNote.training_notes.trim() || null,
        training_activity: dailyNote.training ? (dailyNote.training_activity || null) : null,
        training_duration_min: dailyNote.training && dailyNote.training_duration_min ? Number(dailyNote.training_duration_min) : null,
        training_kcal: dailyNote.training && dailyNote.training_kcal ? Number(dailyNote.training_kcal) : null,
        water_intake: dailyNote.water_intake ? Number(dailyNote.water_intake) : null,
        sleep_quality: dailyNote.sleep_quality ? Number(dailyNote.sleep_quality) : null,
        energy_level: dailyNote.energy_level ? Number(dailyNote.energy_level) : null,
        satiation: dailyNote.satiation ? Number(dailyNote.satiation) : null,
        mood: dailyNote.mood ? Number(dailyNote.mood) : null,
        cravings: dailyNote.cravings.trim() || null,
        notes: dailyNote.notes.trim() || null,
      },
      { onConflict: "user_id,profile_id,date" },
    );

    if (noteError) { setSaveError("Check-In konnte nicht gespeichert werden."); setSaving(false); return; }
    await refreshDay();
    setSaving(false);
    setCheckInOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openInlineFood(key: string, food: { name: string; per100g: FoodResult["per100g"]; stueckG?: number }, initialGrams?: number) {
    if (inlineKey === key) { setInlineKey(null); setInlineFood(null); return; }
    setInlineKey(key);
    setInlineFood(food);
    const g = initialGrams ?? food.stueckG ?? 100;
    setInlineGrams(g);
    setInlineLabel(food.stueckG && initialGrams === undefined ? "1 Stück" : `${g} g`);
    if (key.startsWith("search:")) { setFoodFocused(false); setShowFoodResults(false); }
  }

  async function inlineAddMeal() {
    if (!supabase || !user || !activeProfile || !inlineFood || !activeMealType) return;
    setSaving(true);
    const f = inlineGrams / 100;
    const { error } = await supabase.from("meal_entries").insert({
      user_id: user.id, profile_id: activeProfile.id, date,
      meal_type: activeMealType, food_name: inlineFood.name, amount: inlineLabel,
      calories: Math.round(inlineFood.per100g.calories * f),
      protein: Math.round(inlineFood.per100g.protein * f * 10) / 10,
      carbs: Math.round(inlineFood.per100g.carbs * f * 10) / 10,
      fat: Math.round(inlineFood.per100g.fat * f * 10) / 10,
    });
    if (error) { setSaveError("Mahlzeit konnte nicht gespeichert werden."); setSaving(false); return; }
    await refreshDay();
    setSaving(false);
    setInlineKey(null);
    setInlineFood(null);
    setFoodQuery(""); setFoodResults([]); setShowFoodResults(false); setFoodFocused(false);
  }

  async function inlineUpdateMeal(mealId: string) {
    if (!supabase || !inlineFood) return;
    setSaving(true);
    const f = inlineGrams / 100;
    const { error } = await supabase.from("meal_entries").update({
      amount: inlineLabel,
      calories: Math.round(inlineFood.per100g.calories * f),
      protein: Math.round(inlineFood.per100g.protein * f * 10) / 10,
      carbs: Math.round(inlineFood.per100g.carbs * f * 10) / 10,
      fat: Math.round(inlineFood.per100g.fat * f * 10) / 10,
    }).eq("id", mealId);
    if (error) { setSaveError("Konnte nicht gespeichert werden."); setSaving(false); return; }
    await refreshDay();
    setSaving(false);
    setInlineKey(null);
    setInlineFood(null);
  }

  async function quickAddFavForType(fav: FavoriteMeal, mealType: MealType) {
    if (!supabase || !user || !activeProfile) return;
    setSaving(true);
    const { error } = await supabase.from("meal_entries").insert({
      user_id: user.id, profile_id: activeProfile.id, date, meal_type: mealType,
      food_name: fav.name, amount: fav.amount, calories: fav.calories,
      protein: Number(fav.protein), carbs: Number(fav.carbs), fat: Number(fav.fat),
    });
    if (error) { setSaveError("Mahlzeit konnte nicht gespeichert werden."); setSaving(false); return; }
    await refreshDay();
    setSaving(false);
    setInlineKey(null);
  }

  if (!hasSupabaseConfig) {
    return <SetupMissing />;
  }

  if (loading) {
    return (
      <main className="app-shell grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--coral)]" />
      </main>
    );
  }

  if (passwordRecovery && user) {
    return (
      <main className="app-shell px-5 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
          <div className="mb-8 reveal-in">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-[var(--coral)] text-white shadow-[0_18px_36px_rgba(240,107,93,0.24)]">
              <Flame className="h-7 w-7" />
            </div>
            <h1 className="serif text-[2.6rem] leading-tight text-[var(--espresso)]">Neues Passwort</h1>
            <p className="mt-3 text-sm text-[var(--espresso-50)]">Wähle ein neues Passwort für deinen Account.</p>
          </div>
          <form onSubmit={handleNewPassword} className="app-card reveal-in space-y-4 p-5">
            <Input label="Neues Passwort" type="password" value={password} onChange={setPassword} required minLength={6} />
            {authMessage && (
              <p className="rounded-md bg-[rgba(230,182,74,0.14)] p-3 text-sm leading-6 text-[var(--espresso-70)]">{authMessage}</p>
            )}
            <button className="coral-button flex h-14 w-full items-center justify-center rounded-md text-base font-black">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Passwort speichern"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell px-5 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
          <div className="mb-10 reveal-in">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-[var(--coral)] text-white shadow-[0_18px_36px_rgba(240,107,93,0.24)]">
              <Flame className="h-7 w-7" />
            </div>
            <p className="kicker mb-4">Dein Food-Log</p>
            <h1 className="serif text-[3.15rem] leading-[0.98] text-[var(--espresso)]">Kalorien lesbar machen.</h1>
            <p className="mt-5 max-w-sm text-[1.05rem] leading-8 text-[var(--espresso-50)]">
              Ein ruhiger Food-Log mit Makros, Favoriten und Tagesnotizen. Schnell genug für jeden Tag.
            </p>
          </div>

          <form onSubmit={handleAuth} className="app-card reveal-in reveal-delay-1 space-y-4 p-5">
            <div className="grid grid-cols-2 rounded-md bg-[rgba(241,231,214,0.55)] p-1">
              {(["login", "signup"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setAuthMode(mode); setAuthMessage(""); setResetMode("idle"); }}
                  className={`pressable rounded-sm px-4 py-3 text-sm font-extrabold ${
                    authMode === mode
                      ? "bg-white text-[var(--coral-dark)] shadow-[0_10px_24px_rgba(52,40,32,0.06)]"
                      : "text-[var(--espresso-50)]"
                  }`}
                >
                  {mode === "login" ? "Einloggen" : "Account erstellen"}
                </button>
              ))}
            </div>
            <Input label="E-Mail" type="email" value={email} onChange={setEmail} required />
            <Input label="Passwort" type="password" value={password} onChange={setPassword} required minLength={6} />
            {authMode === "signup" && (
              <Input label="Vorname" type="text" value={firstName} onChange={setFirstName} required />
            )}
            {authMode === "signup" && (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--coral)]"
                />
                <span className="text-sm leading-5 text-[var(--espresso-50)]">
                  Ich habe die{" "}
                  <a href="/datenschutz" target="_blank" className="font-bold text-[var(--coral)] underline underline-offset-2">
                    Datenschutzerklärung
                  </a>{" "}
                  gelesen und stimme zu.
                </span>
              </label>
            )}
            {authMessage ? (
              <p className="rounded-md bg-[rgba(230,182,74,0.14)] p-3 text-sm leading-6 text-[var(--espresso-70)]">
                {authMessage}
              </p>
            ) : null}
            {resetMode === "sent" ? (
              <p className="rounded-md bg-[rgba(80,180,120,0.12)] p-3 text-sm leading-6 text-[#2a7a50]">
                E-Mail gesendet. Prüfe dein Postfach und klicke den Link.
              </p>
            ) : null}
            <button className="coral-button flex h-14 w-full items-center justify-center rounded-md text-base font-black">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : authMode === "login" ? "Einloggen" : "Account erstellen"}
            </button>
            {authMode === "login" && resetMode !== "sent" && (
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetMode === "sending"}
                className="pressable w-full text-center text-sm text-[var(--espresso-40)] hover:text-[var(--coral)]"
              >
                {resetMode === "sending" ? "Wird gesendet..." : "Passwort vergessen?"}
              </button>
            )}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-md px-4 pb-28 pt-12">
        <header className="reveal-in mb-6">
          <p className="kicker mb-2">{formatGermanDate(date)}</p>
          <h1 className="serif text-[2.55rem] leading-none text-[var(--espresso)]">
            Hey <span className="italic text-[var(--coral)]">{user?.user_metadata?.first_name || activeProfile?.name}.</span>
          </h1>
          <p className="mt-2 text-base text-[var(--espresso-50)]">Jetzt tracken.</p>
        </header>

        {saveError && (
          <div className="mb-4 flex items-center justify-between rounded-md bg-[rgba(230,80,60,0.10)] px-4 py-3 text-sm font-bold text-[var(--coral-dark)]">
            {saveError}
            <button type="button" onClick={() => setSaveError("")} className="ml-3 text-lg leading-none">×</button>
          </div>
        )}

        {activeProfile ? (
          <>
            {profileNeedsSetup ? (
              <section className="app-card reveal-in reveal-delay-2 mb-5 p-4">
                <p className="kicker mb-2">Einmaliges Setup</p>
                <h2 className="serif mb-3 text-3xl leading-tight text-[var(--espresso)]">
                  Erst deine Daten, dann sinnvolle Ziele.
                </h2>
                <p className="mb-4 text-sm leading-6 text-[var(--espresso-50)]">
                  Diese Werte bleiben pro Profil gespeichert. Daraus berechnen wir Kalorien und Makros als Startpunkt.
                </p>
                <ProfileSetupForm
                  goalForm={goalForm}
                  setGoalForm={setGoalForm}
                  calculatedPreview={calculatedPreview}
                  saving={saving}
                  onSubmit={saveGoals}
                />
              </section>
            ) : null}

            <AccordionSection title="Check-In" icon={<Heart />} open={checkInOpen} onOpenChange={setCheckInOpen}>
              <form onSubmit={saveDailyNote} className="space-y-3">
                <ToggleRow
                  label="Training heute?"
                  checked={dailyNote.training}
                  onChange={(checked) => {
                    const activity = checked ? (dailyNote.training_activity || "yoga") : "";
                    const duration = checked ? (dailyNote.training_duration_min || "30") : "";
                    const weight = parseFloat(dailyNote.weight) || activeProfile?.current_weight || 65;
                    const met = TRAINING_ACTIVITIES.find((a) => a.value === activity)?.met ?? 3.0;
                    const kcal = checked ? String(Math.round(met * weight * (parseInt(duration) / 60))) : "";
                    setDailyNote({ ...dailyNote, training: checked, training_activity: activity, training_duration_min: duration, training_kcal: kcal });
                  }}
                />
                {dailyNote.training && (
                  <TrainingPicker
                    activity={dailyNote.training_activity}
                    duration={dailyNote.training_duration_min}
                    weight={parseFloat(dailyNote.weight) || activeProfile?.current_weight || 65}
                    onChange={(activity, duration, kcal) =>
                      setDailyNote({ ...dailyNote, training_activity: activity, training_duration_min: duration, training_kcal: kcal })
                    }
                  />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <WaterStepper
                    value={dailyNote.water_intake}
                    onChange={(v) => setDailyNote({ ...dailyNote, water_intake: v })}
                  />
                  <WeightStepper
                    value={dailyNote.weight}
                    fallback={activeProfile?.current_weight ?? 80}
                    onChange={(v) => setDailyNote({ ...dailyNote, weight: v })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <ScoreStepper
                    label="Sättigung"
                    value={dailyNote.satiation}
                    onChange={(v) => setDailyNote({ ...dailyNote, satiation: v })}
                  />
                  <ScoreStepper
                    label="Stimmung"
                    value={dailyNote.mood}
                    onChange={(v) => setDailyNote({ ...dailyNote, mood: v })}
                  />
                  <ScoreStepper
                    label="Energie"
                    value={dailyNote.energy_level}
                    onChange={(v) => setDailyNote({ ...dailyNote, energy_level: v })}
                  />
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">Gelüste</span>
                  <input
                    value={dailyNote.cravings}
                    onChange={(e) => setDailyNote({ ...dailyNote, cravings: e.target.value })}
                    className="field"
                    placeholder="Worauf hattest du heute Lust?"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">Notizen</span>
                  <textarea
                    value={dailyNote.notes}
                    onChange={(e) => setDailyNote({ ...dailyNote, notes: e.target.value })}
                    rows={2}
                    className="field h-auto min-h-20 py-3"
                    placeholder="Besonderheiten, Beobachtungen..."
                  />
                </label>
                <button className="coral-button flex h-14 w-full items-center justify-center rounded-md text-base font-black">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check-In speichern"}
                </button>
              </form>
            </AccordionSection>

            <section className="app-card reveal-in reveal-delay-2 mb-5 p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="kicker mb-2">Kalorien übrig</p>
                  <p className="serif text-[4.85rem] leading-none text-[var(--coral)]">
                    {animatedCaloriesLeft}
                  </p>
                  {Number(dailyNote.training_kcal) > 0 && (
                    <p className="mt-1 text-xs font-bold text-[var(--coral)]">+{dailyNote.training_kcal} kcal Training</p>
                  )}
                </div>
                <div className="soft-card px-3 py-2 text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--espresso-50)]">gegessen</p>
                  <p className="serif text-2xl text-[var(--espresso)]">{totals.calories}</p>
                  <p className="text-xs text-[var(--espresso-50)]">kcal</p>
                </div>
              </div>
              <Progress current={totals.calories} goal={activeProfile.calorie_goal} />
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Macro label="Protein" value={totals.protein} goal={activeProfile.protein_goal} />
                <Macro label="Carbs" value={totals.carbs} goal={activeProfile.carbs_goal} />
                <Macro label="Fett" value={totals.fat} goal={activeProfile.fat_goal} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <WaterStatus water={dailyNote.water_intake} />
                <BodyScore energy={dailyNote.energy_level} mood={dailyNote.mood} satiation={dailyNote.satiation} />
              </div>
              <button
                type="button"
                onClick={toggleGoals}
                className="coral-button pressable mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-black"
              >
                <Settings2 className="h-4 w-4" />
                Profil & Ziel {editingGoals ? "ausblenden" : "anpassen"}
              </button>
            </section>

            {editingGoals && !profileNeedsSetup ? (
              <section className="app-card reveal-in mb-5 p-4">
                <SectionTitle icon={<Settings2 />} title={`${activeProfile.name}s Profil`} />
                <ProfileSetupForm
                  goalForm={goalForm}
                  setGoalForm={setGoalForm}
                  calculatedPreview={calculatedPreview}
                  saving={saving}
                  onSubmit={saveGoals}
                />
              </section>
            ) : null}

            <div className="mb-5 grid grid-cols-2 gap-2">
              {(Object.keys(mealLabels) as MealType[]).map((type) => {
                const typeMeals = mealsByType[type] ?? [];
                const hasEntries = typeMeals.length > 0;
                const typeKcal = typeMeals.reduce((s, m) => s + m.calories, 0);
                const targetKcal = Math.round(activeProfile.calorie_goal * mealGoalSplit[type]);
                const pct = hasEntries ? Math.min(100, Math.round((typeKcal / targetKcal) * 100)) : 0;
                const isActive = activeMealType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setActiveMealType(isActive ? null : type); setInlineKey(null); setInlineFood(null); setFoodQuery(""); setFoodResults([]); }}
                    className="pressable relative flex flex-col items-start overflow-hidden rounded-xl px-4 pb-10 pt-4 text-left transition-colors"
                    style={
                      isActive
                        ? { background: "var(--coral)", border: "1px solid var(--coral)", boxShadow: "0 8px 24px rgba(240,107,93,0.28)" }
                        : hasEntries
                        ? { background: "rgba(255,255,255,0.78)", border: "1px solid rgba(217,164,65,0.18)", outline: "2px solid var(--coral)", outlineOffset: "-2px", boxShadow: "0 18px 46px rgba(52,40,32,0.045)" }
                        : { background: "rgba(255,255,255,0.78)", border: "1px solid rgba(217,164,65,0.18)", boxShadow: "0 18px 46px rgba(52,40,32,0.045)" }
                    }
                  >
                    {hasEntries && !isActive && (
                      <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--coral)]">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <p className={`text-sm font-black ${isActive ? "text-white/80" : "text-[var(--espresso-50)]"}`}>{mealLabels[type]}</p>
                    <p className={`serif mt-1 text-2xl leading-none ${isActive ? "text-white" : hasEntries ? "text-[var(--coral)]" : "text-[var(--espresso-20,rgba(52,40,32,0.2))]"}`}>
                      {hasEntries ? typeKcal : "+"}
                    </p>
                    {hasEntries ? (
                      <p className={`mt-0.5 text-xs ${isActive ? "text-white/70" : "text-[var(--espresso-50)]"}`}>
                        kcal <span className={isActive ? "text-white/50" : "text-[var(--espresso-50)]"}>/ {targetKcal}</span>
                      </p>
                    ) : (
                      <p className={`mt-0.5 text-xs ${isActive ? "text-white/60" : "text-[var(--espresso-50)]"}`}>Ziel {targetKcal}</p>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 h-[5px] rounded-full" style={{ background: isActive ? "rgba(255,255,255,0.22)" : "rgba(52,40,32,0.07)" }}>
                      {pct > 0 && <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: isActive ? "#ffffff" : "var(--coral)" }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {activeMealType && (
              <div className="mb-5 space-y-2">
                <AccordionSection title="Meine Favoriten" icon={<Star />}>
                  {favorites.length === 0 ? (
                    <p className="text-sm text-[var(--espresso-50)]">Noch keine Favoriten gespeichert.</p>
                  ) : (
                    <div className="divide-y divide-[var(--espresso-14)]">
                      {favorites.map((fav) => {
                        const key = `fav:${fav.id}`;
                        const isOpen = inlineKey === key;
                        return (
                          <div key={fav.id}>
                            <div className="flex items-center gap-3 py-3">
                              <button type="button" onClick={() => {
                                const match = fav.amount.match(/^(\d+(?:\.\d+)?)\s*g/i);
                                const g = match ? parseFloat(match[1]) : 100;
                                const p100 = { calories: (fav.calories / g) * 100, protein: (fav.protein / g) * 100, carbs: (fav.carbs / g) * 100, fat: (fav.fat / g) * 100 };
                                openInlineFood(key, { name: fav.name, per100g: p100 }, g);
                              }} className="pressable min-w-0 flex-1 text-left">
                                <p className="truncate text-sm font-black text-[var(--espresso)]">{fav.name}</p>
                                <p className="text-xs text-[var(--espresso-50)]">{fav.amount} · {fav.calories} kcal</p>
                              </button>
                              <button type="button" onClick={() => deleteFavorite(fav.id)} className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[var(--espresso-14)] text-[var(--espresso-40,rgba(52,40,32,0.4))]">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {isOpen && (
                              <div className="pb-4">
                                <AmountStepper amount={inlineGrams} onChange={(g, l) => { setInlineGrams(g); setInlineLabel(l ?? `${g} g`); }} />
                                <button type="button" onClick={inlineAddMeal} className="coral-button mt-3 flex h-11 w-full items-center justify-center rounded-md text-sm font-black">
                                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hinzufügen"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </AccordionSection>

                <AccordionSection title="Jens Lebensmittel" icon={<Utensils />}>
                  <div className="divide-y divide-[var(--espresso-14)]">
                    {[...JEN_FOODS].sort((a, b) => a.name.localeCompare(b.name, "de")).map((food) => {
                      const key = `jen:${food.name}`;
                      const isOpen = inlineKey === key;
                      return (
                        <div key={food.name}>
                          <div className="flex items-center gap-1 py-3">
                            <button type="button" onClick={() => openInlineFood(key, { name: food.name, per100g: food.per100g, stueckG: food.stueck_g })} className="pressable flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-[var(--espresso)]">{food.name}</p>
                                <p className="text-xs text-[var(--espresso-50)]">{food.per100g.calories} kcal / 100g</p>
                              </div>
                              <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--espresso-30,rgba(52,40,32,0.3))] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            <button type="button" onClick={() => saveAsFavorite(food.name, food.per100g)} className="pressable flex h-8 w-8 shrink-0 items-center justify-center">
                              <Star className={`h-4 w-4 transition-colors ${favNames.has(food.name) ? "fill-[var(--coral)] text-[var(--coral)]" : "text-[var(--espresso-28)]"}`} />
                            </button>
                          </div>
                          {isOpen && (
                            <div className="pb-4">
                              <AmountStepper amount={inlineGrams} stueckG={food.stueck_g} onChange={(g, l) => { setInlineGrams(g); setInlineLabel(l ?? `${g} g`); }} />
                              <button type="button" onClick={inlineAddMeal} className="coral-button mt-3 flex h-11 w-full items-center justify-center rounded-md text-sm font-black">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hinzufügen"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionSection>

                <div className="app-card relative z-10 p-4">
                  <p className="kicker mb-3">Suche</p>
                  <FoodSearch
                    query={foodQuery}
                    jenFoods={jenMatches}
                    apiResults={foodResults}
                    searching={foodSearching}
                    showResults={showDropdown}
                    onQueryChange={(value) => {
                      setFoodQuery(value);
                      setInlineKey(null);
                      if (value.length < 2) { setFoodResults([]); setShowFoodResults(false); }
                    }}
                    onSelect={(food) => openInlineFood(`search:${food.name}`, { name: food.name, per100g: food.per100g, stueckG: food.stueck_g })}
                    onFavorite={(food) => saveAsFavorite(food.name, food.per100g)}
                    favNames={favNames}
                    onFocus={() => setFoodFocused(true)}
                    onDismiss={() => { setShowFoodResults(false); setFoodFocused(false); }}
                  />
                  {inlineKey?.startsWith("search:") && inlineFood && (
                    <div className="mt-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-[var(--espresso)]">{inlineFood.name}</p>
                        <button type="button" onClick={() => saveAsFavorite(inlineFood.name, inlineFood.per100g)} className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[var(--espresso-14)]">
                          <Star className={`h-4 w-4 transition-colors ${favNames.has(inlineFood.name) ? "fill-[var(--coral)] text-[var(--coral)]" : "text-[var(--espresso-28)]"}`} />
                        </button>
                      </div>
                      <AmountStepper amount={inlineGrams} stueckG={inlineFood.stueckG} onChange={(g, l) => { setInlineGrams(g); setInlineLabel(l ?? `${g} g`); }} />
                      <button type="button" onClick={inlineAddMeal} className="coral-button mt-3 flex h-11 w-full items-center justify-center rounded-md text-sm font-black">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hinzufügen"}
                      </button>
                    </div>
                  )}
                </div>

                {(mealsByType[activeMealType] ?? []).length > 0 && (
                  <div className="app-card p-4">
                    <p className="kicker mb-3">Heute {mealLabels[activeMealType]}</p>
                    <div className="divide-y divide-[var(--espresso-14)]">
                      {(mealsByType[activeMealType] ?? []).map((meal) => {
                        const editKey = `edit:${meal.id}`;
                        const isEditing = inlineKey === editKey;
                        return (
                          <div key={meal.id}>
                            <div className="flex items-center gap-3 py-3">
                              <button type="button" onClick={() => {
                                const match = meal.amount?.match(/^(\d+(?:\.\d+)?)\s*g/i);
                                const g = match ? parseFloat(match[1]) : 100;
                                const p100 = { calories: (meal.calories / g) * 100, protein: (meal.protein / g) * 100, carbs: (meal.carbs / g) * 100, fat: (meal.fat / g) * 100 };
                                openInlineFood(editKey, { name: meal.food_name, per100g: p100 }, g);
                              }} className="pressable flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-black text-[var(--espresso)]">{meal.food_name}</p>
                                  <p className="text-xs text-[var(--espresso-50)]">{meal.amount || "—"}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <p className="serif text-xl text-[var(--coral)]">{meal.calories}</p>
                                  <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--espresso-14)] text-[var(--espresso-50)]">
                                    <Settings2 className="h-3.5 w-3.5" />
                                  </div>
                                </div>
                              </button>
                              <button type="button" onClick={() => deleteMeal(meal.id)} className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[var(--espresso-14)] text-[var(--espresso-40,rgba(52,40,32,0.4))]">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {isEditing && (
                              <div className="pb-4">
                                <AmountStepper amount={inlineGrams} onChange={(g, l) => { setInlineGrams(g); setInlineLabel(l ?? `${g} g`); }} />
                                <button type="button" onClick={() => inlineUpdateMeal(meal.id)} className="coral-button mt-3 flex h-11 w-full items-center justify-center rounded-md text-sm font-black">
                                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
      <footer className="pb-12 pt-2 text-center">
        <p className="serif text-lg italic leading-snug text-[var(--coral)]">Dein Körper kennt die Antwort.<br />Wir hören gemeinsam hin.</p>
        <hr className="mx-auto mt-6 w-16 border-[var(--espresso-14)]" />
        <button
          onClick={() => supabase?.auth.signOut()}
          className="mt-4 text-xs text-[var(--espresso-28)]"
        >
          Ausloggen
        </button>
      </footer>
    </main>
  );
}

function SetupMissing() {
  return (
    <main className="app-shell grid place-items-center px-5">
      <section className="app-card max-w-md p-5">
        <p className="kicker mb-3">Setup</p>
        <h1 className="serif text-3xl text-[var(--espresso)]">Supabase fehlt.</h1>
        <p className="mt-3 leading-7 text-[var(--espresso-50)]">
          Lege eine <code className="rounded bg-white px-1">.env.local</code> mit{" "}
          <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_URL</code> und{" "}
          <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> an.
        </p>
      </section>
    </main>
  );
}

function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  function toggle() {
    if (onOpenChange) onOpenChange(!open);
    else setInternalOpen((o) => !o);
  }

  return (
    <section className="app-card reveal-in mb-4 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="pressable flex w-full items-center justify-between px-4 py-4"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[rgba(240,107,93,0.12)] text-[var(--coral)]">
            {icon}
          </span>
          <span className="serif text-2xl text-[var(--espresso)]">{title}</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-[var(--espresso-50)] transition-transform duration-300 ease-in-out ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function WaterStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const liters = parseFloat(value) || 0;
  const dec = (n: number) => Math.round(n * 100) / 100;
  return (
    <div>
      <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">Wasser</span>
      <div className="soft-card flex items-center justify-between rounded-md p-1">
        <button
          type="button"
          onClick={() => onChange(String(dec(Math.max(0, liters - 0.25))))}
          className="pressable flex h-12 w-10 items-center justify-center rounded-md text-2xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
        >
          -
        </button>
        <div className="text-center">
          <span className="serif text-2xl text-[var(--espresso)]">{liters.toFixed(2)}</span>
          <span className="ml-1 text-sm text-[var(--espresso-50)]">l</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(String(dec(liters + 0.25)))}
          className="pressable flex h-12 w-10 items-center justify-center rounded-md text-2xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
        >
          +
        </button>
      </div>
    </div>
  );
}

function WeightStepper({
  value,
  fallback,
  onChange,
}: {
  value: string;
  fallback: number;
  onChange: (v: string) => void;
}) {
  const kg = parseFloat(value) || fallback;
  const dec = (n: number) => Math.round(n * 10) / 10;
  return (
    <div>
      <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">Gewicht</span>
      <div className="soft-card flex items-center justify-between rounded-md p-1">
        <button
          type="button"
          onClick={() => onChange(dec(Math.max(30, kg - 0.1)).toFixed(1))}
          className="pressable flex h-12 w-10 items-center justify-center rounded-md text-2xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
        >
          -
        </button>
        <div className="text-center">
          <span className="serif text-2xl text-[var(--espresso)]">{kg.toFixed(1)}</span>
          <span className="ml-1 text-sm text-[var(--espresso-50)]">kg</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(dec(kg + 0.1).toFixed(1))}
          className="pressable flex h-12 w-10 items-center justify-center rounded-md text-2xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ScoreStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const score = Math.min(5, Math.max(1, parseInt(value) || 3));
  return (
    <div>
      <span className="mb-2 block text-xs font-bold text-[var(--espresso-50)]">{label}</span>
      <div className="soft-card flex flex-col items-center gap-2 rounded-md py-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((d) => (
            <span
              key={d}
              className={`h-2 w-2 rounded-full ${d <= score ? "bg-[var(--coral)]" : "bg-[rgba(52,40,32,0.14)]"}`}
            />
          ))}
        </div>
        <div className="flex w-full items-center justify-between px-1">
          <button
            type="button"
            onClick={() => onChange(String(Math.max(1, score - 1)))}
            className="pressable flex h-9 w-9 items-center justify-center rounded-md text-xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
          >
            -
          </button>
          <span className="serif text-xl text-[var(--espresso)]">{score}</span>
          <button
            type="button"
            onClick={() => onChange(String(Math.min(5, score + 1)))}
            className="pressable flex h-9 w-9 items-center justify-center rounded-md text-xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[rgba(240,107,93,0.12)] text-[var(--coral)]">
        {icon}
      </span>
      <h2 className="serif text-2xl text-[var(--espresso)]">{title}</h2>
    </div>
  );
}

function ProfileSetupForm({
  goalForm,
  setGoalForm,
  calculatedPreview,
  saving,
  onSubmit,
}: {
  goalForm: typeof blankGoals;
  setGoalForm: (form: typeof blankGoals) => void;
  calculatedPreview: ReturnType<typeof calculateTargets>;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Gewicht kg"
          type="number"
          value={goalForm.current_weight}
          onChange={(value) => setGoalForm({ ...goalForm, current_weight: value })}
          required
        />
        <Input
          label="Größe cm"
          type="number"
          value={goalForm.height_cm}
          onChange={(value) => setGoalForm({ ...goalForm, height_cm: value })}
          required
        />
        <Input
          label="Alter"
          type="number"
          value={goalForm.age}
          onChange={(value) => setGoalForm({ ...goalForm, age: value })}
          required
        />
        <SelectField
          label="Körper"
          value={goalForm.sex}
          onChange={(value) => setGoalForm({ ...goalForm, sex: value as Sex })}
          options={[
            { value: "male", label: "Männlich" },
            { value: "female", label: "Weiblich" },
          ]}
        />
      </div>

      <SelectField
        label="Aktivität"
        value={goalForm.activity_level}
        onChange={(value) => setGoalForm({ ...goalForm, activity_level: value as ActivityLevel })}
        options={(Object.keys(activityLabels) as ActivityLevel[]).map((value) => ({ value, label: activityLabels[value] }))}
      />
      <SelectField
        label="Ziel"
        value={goalForm.goal_type}
        onChange={(value) => setGoalForm({ ...goalForm, goal_type: value as GoalType })}
        options={(Object.keys(goalLabels) as GoalType[]).map((value) => ({ value, label: goalLabels[value] }))}
      />
      <SelectField
        label="Ernährungsform"
        value={goalForm.diet_type}
        onChange={(value) => setGoalForm({ ...goalForm, diet_type: value as DietType })}
        options={(Object.keys(dietLabels) as DietType[]).map((value) => ({ value, label: dietLabels[value] }))}
      />

      {calculatedPreview ? (
        <div className="soft-card p-3">
          <div className="mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[var(--coral)]" />
            <p className="text-sm font-black text-[var(--espresso)]">Berechneter Startpunkt</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <PreviewMetric label="kcal" value={calculatedPreview.calories} />
            <PreviewMetric label="Protein" value={`${calculatedPreview.protein} g`} />
            <PreviewMetric label="Carbs" value={`${calculatedPreview.carbs} g`} />
            <PreviewMetric label="Fett" value={`${calculatedPreview.fat} g`} />
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--espresso-50)]">
            Formel: Mifflin-St Jeor plus Aktivitätsfaktor. Das ist ein sinnvoller Startwert, kein medizinischer Wert.
          </p>
        </div>
      ) : null}

      <div className="pt-2">
        <p className="kicker mb-3">Persönliches Profil</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Wunschgewicht kg"
              type="number"
              value={goalForm.target_weight}
              onChange={(value) => setGoalForm({ ...goalForm, target_weight: value })}
            />
            <SelectField
              label="Training / Woche"
              value={goalForm.training_frequency}
              onChange={(value) => setGoalForm({ ...goalForm, training_frequency: value })}
              options={[
                { value: "0", label: "Kein Training" },
                { value: "1", label: "1 Tag" },
                { value: "2", label: "2 Tage" },
                { value: "3", label: "3 Tage" },
                { value: "4", label: "4 Tage" },
                { value: "5", label: "5 Tage" },
                { value: "6", label: "6 Tage" },
                { value: "7", label: "Täglich" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Schlafziel Stunden"
              type="number"
              step="0.5"
              value={goalForm.sleep_goal_hours}
              onChange={(value) => setGoalForm({ ...goalForm, sleep_goal_hours: value })}
            />
            <SelectField
              label="Alkohol"
              value={goalForm.alcohol_frequency}
              onChange={(value) => setGoalForm({ ...goalForm, alcohol_frequency: value })}
              options={[
                { value: "nie", label: "Nie" },
                { value: "selten", label: "Selten" },
                { value: "1-2x", label: "1-2x pro Woche" },
                { value: "oefter", label: "Öfter" },
              ]}
            />
          </div>
          <ToggleRow
            label="Zyklus / Periode relevant?"
            checked={goalForm.cycle_relevant}
            onChange={(checked) => setGoalForm({ ...goalForm, cycle_relevant: checked })}
          />
          <TextArea
            label="Unverträglichkeiten"
            value={goalForm.intolerances}
            onChange={(value) => setGoalForm({ ...goalForm, intolerances: value })}
            placeholder="z.B. Laktose, Gluten, Nüsse..."
          />
          <TextArea
            label="No-go Foods"
            value={goalForm.no_go_foods}
            onChange={(value) => setGoalForm({ ...goalForm, no_go_foods: value })}
            placeholder="Was kommt gar nicht auf den Teller?"
          />
          <TextArea
            label="Lieblingsfoods"
            value={goalForm.favorite_foods}
            onChange={(value) => setGoalForm({ ...goalForm, favorite_foods: value })}
            placeholder="Was isst du besonders gerne?"
          />
        </div>
      </div>

      <button className="coral-button flex h-14 w-full items-center justify-center rounded-md text-base font-black">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Profil speichern"}
      </button>
    </form>
  );
}

function PreviewMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="serif text-xl text-[var(--espresso)]">{value}</p>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[var(--espresso-50)]">{label}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="field" {...props} />
    </label>
  );
}

function TrainingPicker({
  activity,
  duration,
  weight,
  onChange,
}: {
  activity: string;
  duration: string;
  weight: number;
  onChange: (activity: string, duration: string, kcal: string) => void;
}) {
  const met = TRAINING_ACTIVITIES.find((a) => a.value === activity)?.met ?? 5.0;
  const durationMin = Math.max(5, parseInt(duration) || 30);
  const kcal = Math.round(met * weight * (durationMin / 60));

  function update(newActivity: string, newDuration: string) {
    const newMet = TRAINING_ACTIVITIES.find((a) => a.value === newActivity)?.met ?? 5.0;
    const newMin = Math.max(5, parseInt(newDuration) || 30);
    onChange(newActivity, newDuration, String(Math.round(newMet * weight * (newMin / 60))));
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">Sport</span>
        <select value={activity || "yoga"} onChange={(e) => update(e.target.value, duration)} className="field">
          {TRAINING_ACTIVITIES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </label>
      <div>
        <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">Dauer</span>
        <div className="soft-card flex items-center justify-between rounded-md p-1">
          <button
            type="button"
            onClick={() => update(activity || "yoga", String(Math.max(5, durationMin - 5)))}
            className="pressable flex h-12 w-10 items-center justify-center rounded-md text-2xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
          >
            -
          </button>
          <div className="text-center">
            <span className="serif text-2xl text-[var(--espresso)]">{durationMin}</span>
            <span className="ml-1 text-sm text-[var(--espresso-50)]">min</span>
          </div>
          <button
            type="button"
            onClick={() => update(activity || "yoga", String(Math.min(180, durationMin + 5)))}
            className="pressable flex h-12 w-10 items-center justify-center rounded-md text-2xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
          >
            +
          </button>
        </div>
      </div>
      <div className="soft-card flex items-center justify-between p-3">
        <span className="text-sm font-bold text-[var(--espresso-50)]">Geschätzt verbrannt</span>
        <span className="serif text-2xl text-[var(--coral)]">≈ {kcal} kcal</span>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="soft-card flex items-center justify-between p-3 text-sm font-black text-[var(--espresso)]">
      {label}
      <span
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
          checked ? "bg-[var(--coral)]" : "bg-[rgba(52,40,32,0.16)]"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </label>
  );
}

function Progress({ current, goal }: { current: number; goal: number }) {
  const width = Math.min((current / goal) * 100, 100);
  return (
    <div className="h-3 overflow-hidden rounded-full bg-[rgba(52,40,32,0.08)]">
      <div className="progress-fill h-full rounded-full bg-[var(--coral)]" style={{ width: `${width}%` }} />
    </div>
  );
}

function Macro({ label, value, goal }: { label: string; value: number; goal: number }) {
  return (
    <div className="soft-card p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--espresso-50)]">{label}</p>
      <p className="serif mt-2 text-2xl text-[var(--espresso)]">{Math.max(goal - value, 0)} g</p>
      <p className="text-xs text-[var(--espresso-50)]">von {goal} g</p>
    </div>
  );
}

function AmountStepper({ amount, onChange, stueckG }: { amount: number; onChange: (g: number, label?: string) => void; stueckG?: number }) {
  const [unit, setUnit] = useState<"g" | "stueck">(stueckG ? "stueck" : "g");
  const fmt = (n: number) => n % 1 === 0 ? `${n}` : n.toFixed(1);

  if (unit === "stueck" && stueckG) {
    const stueck = Math.max(0.5, Math.round((amount / stueckG) * 2) / 2);
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--espresso-50)]">Menge</span>
          <button type="button" onClick={() => setUnit("g")} className="text-xs font-bold text-[var(--coral)]">in Gramm →</button>
        </div>
        <div className="soft-card flex items-center justify-between rounded-md p-1">
          <button
            type="button"
            onClick={() => { const n = Math.max(0.5, stueck - 0.5); onChange(Math.round(n * stueckG), `${fmt(n)} Stück`); }}
            className="pressable flex h-14 w-16 items-center justify-center rounded-md text-3xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
          >-</button>
          <div className="text-center">
            <span className="serif text-4xl text-[var(--espresso)]">{fmt(stueck)}</span>
            <span className="ml-1.5 text-base text-[var(--espresso-50)]">Stück</span>
          </div>
          <button
            type="button"
            onClick={() => { const n = stueck + 0.5; onChange(Math.round(n * stueckG), `${fmt(n)} Stück`); }}
            className="pressable flex h-14 w-16 items-center justify-center rounded-md text-3xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
          >+</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--espresso-50)]">Menge</span>
        {stueckG && <button type="button" onClick={() => { setUnit("stueck"); onChange(stueckG, "1 Stück"); }} className="text-xs font-bold text-[var(--coral)]">in Stück →</button>}
      </div>
      <div className="soft-card flex items-center justify-between rounded-md p-1">
        <button
          type="button"
          onClick={() => onChange(amount - 10)}
          className="pressable flex h-14 w-16 items-center justify-center rounded-md text-3xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
        >-</button>
        <div className="text-center">
          <span className="serif text-4xl text-[var(--espresso)]">{amount}</span>
          <span className="ml-1.5 text-base text-[var(--espresso-50)]">g</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(amount + 10)}
          className="pressable flex h-14 w-16 items-center justify-center rounded-md text-3xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
        >+</button>
      </div>
    </div>
  );
}

function FoodSearch({
  query,
  jenFoods,
  apiResults,
  searching,
  showResults,
  onQueryChange,
  onSelect,
  onFavorite,
  favNames,
  onFocus,
  onDismiss,
}: {
  query: string;
  jenFoods: FoodResult[];
  apiResults: FoodResult[];
  searching: boolean;
  showResults: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (food: FoodResult) => void;
  onFavorite: (food: FoodResult) => void;
  favNames: Set<string>;
  onFocus: () => void;
  onDismiss: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onDismiss]);

  const showBoth = jenFoods.length > 0 && apiResults.length > 0;
  const isEmpty = jenFoods.length === 0 && apiResults.length === 0;
  const showEmpty = showResults && isEmpty && !searching && query.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">Lebensmittel</span>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            placeholder="Tippen zum Suchen..."
            className="field pr-16"
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[var(--espresso-50)]">
            {query ? (
              <button type="button" onClick={() => onQueryChange("")}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </button>
            ) : null}
            <Search className="h-4 w-4" />
          </div>
        </div>
      </label>

      {showResults && !isEmpty ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-[var(--espresso-14)] bg-white shadow-[0_8px_32px_rgba(52,40,32,0.12)]">
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {jenFoods.length > 0 && (
              <>
                {showBoth && (
                  <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--espresso-50)] bg-[rgba(241,231,214,0.7)]">
                    Jens Lebensmittel
                  </div>
                )}
                {jenFoods.map((food) => (
                  <FoodItem key={food.id} food={food} onSelect={onSelect} onFavorite={onFavorite} isFavorite={favNames.has(food.name)} />
                ))}
              </>
            )}
            {searching && apiResults.length === 0 && query.length >= 2 && (
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--espresso-50)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Datenbank wird durchsucht...
              </div>
            )}
            {apiResults.length > 0 && (
              <>
                {showBoth && (
                  <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--espresso-50)] bg-[rgba(52,40,32,0.04)]">
                    Datenbank
                  </div>
                )}
                {apiResults.map((food) => (
                  <FoodItem key={food.id} food={food} onSelect={onSelect} onFavorite={onFavorite} isFavorite={favNames.has(food.name)} />
                ))}
              </>
            )}
          </div>
        </div>
      ) : showEmpty ? (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-[var(--espresso-14)] bg-white px-4 py-3 shadow-[0_8px_32px_rgba(52,40,32,0.12)]">
          <p className="text-sm text-[var(--espresso-50)]">Kein Ergebnis — Werte manuell eingeben.</p>
        </div>
      ) : null}
    </div>
  );
}

function FoodItem({ food, onSelect, onFavorite, isFavorite }: { food: FoodResult; onSelect: (food: FoodResult) => void; onFavorite: (food: FoodResult) => void; isFavorite: boolean }) {
  return (
    <div className="flex items-stretch border-b border-[var(--espresso-14)] last:border-0">
      <button
        type="button"
        onClick={() => onSelect(food)}
        className="pressable flex min-w-0 flex-1 items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[rgba(240,107,93,0.05)]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[var(--espresso)]">{food.name}</p>
          {food.brand ? <p className="truncate text-xs text-[var(--espresso-50)]">{food.brand}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="serif text-lg text-[var(--coral)]">{food.per100g.calories}</p>
          <p className="text-xs text-[var(--espresso-50)]">kcal</p>
          <p className="mt-0.5 text-xs text-[var(--espresso-50)]">P {food.per100g.protein} · C {food.per100g.carbs} · F {food.per100g.fat}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onFavorite(food)}
        className="pressable flex w-10 shrink-0 items-center justify-center border-l border-[var(--espresso-08)] hover:bg-[rgba(240,107,93,0.05)]"
      >
        <Star className={`h-4 w-4 transition-colors ${isFavorite ? "fill-[var(--coral)] text-[var(--coral)]" : "text-[var(--espresso-28)]"}`} />
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="soft-card p-4 text-sm leading-6 text-[var(--espresso-50)]">{text}</p>;
}

function WaterStatus({ water }: { water: string }) {
  const liters = parseFloat(water) || 0;
  return (
    <div className="soft-card p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--espresso-50)]">Wasser</p>
      <p className="serif mt-2 text-2xl text-[var(--espresso)]">{liters > 0 ? `${liters} l` : "—"}</p>
      <p className="text-xs text-[var(--espresso-50)]">getrunken</p>
    </div>
  );
}

function BodyScore({ energy, mood, satiation }: { energy: string; mood: string; satiation: string }) {
  const values = [energy, mood, satiation]
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v) && v >= 1);
  if (values.length === 0) {
    return (
      <div className="soft-card p-3">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--espresso-50)]">Körpergefühl</p>
        <p className="serif mt-2 text-2xl text-[var(--espresso)]">—</p>
        <p className="text-xs text-[var(--espresso-50)]">Check-In ausfüllen</p>
      </div>
    );
  }
  const score = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const dots = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="soft-card p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--espresso-50)]">Körpergefühl</p>
      <div className="mt-2 flex gap-1">
        {dots.map((d) => (
          <span
            key={d}
            className={`h-2.5 w-2.5 rounded-full ${d <= Math.round(score) ? "bg-[var(--coral)]" : "bg-[rgba(52,40,32,0.14)]"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-[var(--espresso-50)]">{score} / 5</p>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        className="field h-auto min-h-16 py-3 text-sm"
        placeholder={placeholder}
      />
    </label>
  );
}

function useAnimatedNumber(target: number) {
  const [displayed, setDisplayed] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prevRef.current === target) return;
    const start = prevRef.current;
    const diff = target - start;
    const duration = 500;
    const startTime = performance.now();

    cancelAnimationFrame(rafRef.current);
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return displayed;
}
