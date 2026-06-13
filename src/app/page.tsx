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
  ChevronDown,
  Flame,
  Heart,
  Loader2,
  LogOut,
  Plus,
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
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [date] = useState(todayISO());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [dailyNote, setDailyNote] = useState(blankNote);
  const [mealForm, setMealForm] = useState<MealFormState>(blankMeal);
  const [editingGoals, setEditingGoals] = useState(false);
  const [mealSectionOpen, setMealSectionOpen] = useState(false);
  const [goalForm, setGoalForm] = useState(blankGoals);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FoodResult[]>([]);
  const [foodSearching, setFoodSearching] = useState(false);
  const [showFoodResults, setShowFoodResults] = useState(false);
  const [foodFocused, setFoodFocused] = useState(false);
  const [selectedFoodPer100g, setSelectedFoodPer100g] = useState<FoodResult["per100g"] | null>(null);
  const [selectedFoodStueckG, setSelectedFoodStueckG] = useState<number | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(100);

  const jenMatches = useMemo(() => {
    if (!foodFocused) return [];
    const q = foodQuery.trim().toLowerCase();
    if (!q) return JEN_FOODS.slice(0, 8);
    return JEN_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
  }, [foodQuery, foodFocused]);

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    const userId = user.id;

    async function loadProfiles() {
      const { data, error } = await supabase!
        .from("profiles")
        .select("*")
        .order("name", { ascending: false });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      if (data.length === 0) {
        const { data: created, error: createError } = await supabase!
          .from("profiles")
          .insert([
            {
              user_id: userId,
              name: "Stephan",
              calorie_goal: defaultGoals.Stephan.calories,
              protein_goal: defaultGoals.Stephan.protein,
              carbs_goal: defaultGoals.Stephan.carbs,
              fat_goal: defaultGoals.Stephan.fat,
            },
            {
              user_id: userId,
              name: "Jen",
              calorie_goal: defaultGoals.Jen.calories,
              protein_goal: defaultGoals.Jen.protein,
              carbs_goal: defaultGoals.Jen.carbs,
              fat_goal: defaultGoals.Jen.fat,
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
    setSaving(true);
    setAuthMessage("");

    const result =
      authMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setAuthMessage(result.error.message);
    } else if (authMode === "signup") {
      setAuthMessage("Account erstellt. Prüfe ggf. deine E-Mail-Bestätigung.");
    }

    setSaving(false);
  }

  async function addMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !activeProfile) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      profile_id: activeProfile.id,
      date,
      meal_type: mealForm.meal_type,
      food_name: mealForm.food_name.trim(),
      amount: mealForm.amount.trim(),
      calories: Number(mealForm.calories) || 0,
      protein: Number(mealForm.protein) || 0,
      carbs: Number(mealForm.carbs) || 0,
      fat: Number(mealForm.fat) || 0,
    };

    const { error } = await supabase.from("meal_entries").insert(payload);

    if (!error && mealForm.saveFavorite) {
      await supabase.from("favorite_meals").insert({
        user_id: user.id,
        profile_id: activeProfile.id,
        name: payload.food_name,
        amount: payload.amount,
        meal_type: payload.meal_type,
        calories: payload.calories,
        protein: payload.protein,
        carbs: payload.carbs,
        fat: payload.fat,
      });
    }

    setMealForm((current) => ({ ...blankMeal, meal_type: current.meal_type }));
    setSelectedFoodPer100g(null);
    setSelectedFoodStueckG(null);
    setSelectedAmount(100);
    await refreshDay();
    await refreshFavorites();
    setSaving(false);
  }

  async function quickAddFavorite(favorite: FavoriteMeal) {
    if (!supabase || !user || !activeProfile) return;
    setSaving(true);
    await supabase.from("meal_entries").insert({
      user_id: user.id,
      profile_id: activeProfile.id,
      date,
      meal_type: favorite.meal_type,
      food_name: favorite.name,
      amount: favorite.amount,
      calories: favorite.calories,
      protein: favorite.protein,
      carbs: favorite.carbs,
      fat: favorite.fat,
    });
    await refreshDay();
    setSaving(false);
  }

  async function deleteMeal(mealId: string) {
    if (!supabase) return;
    setSaving(true);
    await supabase.from("meal_entries").delete().eq("id", mealId);
    await refreshDay();
    setSaving(false);
  }

  async function deleteFavorite(favoriteId: string) {
    if (!supabase) return;
    setSaving(true);
    await supabase.from("favorite_meals").delete().eq("id", favoriteId);
    await refreshFavorites();
    setSaving(false);
  }

  async function saveGoals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !activeProfile) return;
    setSaving(true);
    const calculated = calculateTargets(goalForm);

    const { data } = await supabase
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

    if (data) {
      setProfiles((current) => current.map((profile) => (profile.id === data.id ? (data as Profile) : profile)));
      setEditingGoals(false);
      if (favorites.length === 0) {
        await addStarterFavorites();
      }
    }

    setSaving(false);
  }

  function selectFood(food: FoodResult) {
    const defaultG = food.stueck_g ?? 100;
    const f = defaultG / 100;
    setSelectedFoodPer100g(food.per100g);
    setSelectedFoodStueckG(food.stueck_g ?? null);
    setSelectedAmount(defaultG);
    setMealForm((current) => ({
      ...current,
      food_name: food.name,
      amount: food.stueck_g ? "1 Stück" : "100 g",
      calories: Math.round(food.per100g.calories * f).toString(),
      protein: Math.round(food.per100g.protein * f).toString(),
      carbs: Math.round(food.per100g.carbs * f).toString(),
      fat: Math.round(food.per100g.fat * f).toString(),
      saveFavorite: food.source !== "jen",
    }));
    setFoodQuery("");
    setFoodResults([]);
    setShowFoodResults(false);
    setFoodFocused(false);
  }

  function selectFoodAndOpen(food: FoodResult) {
    selectFood(food);
    setMealSectionOpen(true);
  }

  function changeAmount(grams: number, label?: string) {
    if (!selectedFoodPer100g) return;
    const g = Math.max(10, grams);
    const f = g / 100;
    setSelectedAmount(g);
    setMealForm((current) => ({
      ...current,
      amount: label ?? `${g} g`,
      calories: Math.round(selectedFoodPer100g.calories * f).toString(),
      protein: Math.round(selectedFoodPer100g.protein * f).toString(),
      carbs: Math.round(selectedFoodPer100g.carbs * f).toString(),
      fat: Math.round(selectedFoodPer100g.fat * f).toString(),
    }));
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

    await supabase.from("daily_notes").upsert(
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

    await refreshDay();
    setSaving(false);
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

  if (!user) {
    return (
      <main className="app-shell px-5 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
          <div className="mb-10 reveal-in">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-[var(--coral)] text-white shadow-[0_18px_36px_rgba(240,107,93,0.24)]">
              <Flame className="h-7 w-7" />
            </div>
            <p className="kicker mb-4">Stephan & Jen</p>
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
                  onClick={() => setAuthMode(mode)}
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
            {authMessage ? (
              <p className="rounded-md bg-[rgba(230,182,74,0.14)] p-3 text-sm leading-6 text-[var(--espresso-70)]">
                {authMessage}
              </p>
            ) : null}
            <button className="coral-button flex h-14 w-full items-center justify-center rounded-md text-base font-black">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : authMode === "login" ? "Einloggen" : "Account erstellen"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-md px-4 pb-28 pt-6">
        <header className="reveal-in mb-6 flex items-start justify-between">
          <div>
            <p className="kicker mb-2">{formatGermanDate(date)}</p>
            <h1 className="serif text-5xl leading-none text-[var(--espresso)]">
              Heute <span className="italic text-[var(--coral)]">tracken.</span>
            </h1>
          </div>
          <button
            onClick={() => supabase?.auth.signOut()}
            className="pressable flex h-11 w-11 items-center justify-center rounded-md border border-[var(--espresso-14)] bg-white/70 text-[var(--espresso-50)]"
            aria-label="Ausloggen"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="app-card reveal-in reveal-delay-1 mb-4 grid grid-cols-2 gap-1 p-1">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => selectProfile(profile)}
              className={`pressable rounded-md py-3 text-base font-black ${
                activeProfile?.id === profile.id
                  ? "bg-[var(--coral)] text-white shadow-[0_14px_28px_rgba(240,107,93,0.2)]"
                  : "text-[var(--espresso-50)]"
              }`}
            >
              {profile.name}
            </button>
          ))}
        </div>

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

            <section className="app-card reveal-in reveal-delay-2 mb-5 overflow-hidden p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="kicker mb-2">Kalorien übrig</p>
                  <p className="serif text-[4.4rem] leading-none text-[var(--coral)]">
                    {Math.max(activeProfile.calorie_goal - totals.calories + (Number(dailyNote.training_kcal) || 0), 0)}
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
                className="pressable mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--espresso-14)] bg-white/60 text-sm font-black text-[var(--espresso-70)]"
              >
                <Settings2 className="h-4 w-4 text-[var(--coral)]" />
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

            <AccordionSection title="Check-In" icon={<Heart />}>
              <form onSubmit={saveDailyNote} className="space-y-3">
                <ToggleRow
                  label="Training heute?"
                  checked={dailyNote.training}
                  onChange={(checked) => setDailyNote({
                    ...dailyNote,
                    training: checked,
                    training_activity: checked ? (dailyNote.training_activity || "yoga") : "",
                    training_duration_min: checked ? (dailyNote.training_duration_min || "30") : "",
                    training_kcal: checked ? dailyNote.training_kcal : "",
                  })}
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

            <AccordionSection title="Mahlzeit eintragen" icon={<Plus />} open={mealSectionOpen} onOpenChange={setMealSectionOpen}>
              <form onSubmit={addMeal} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(mealLabels) as MealType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMealForm((current) => ({ ...current, meal_type: type }))}
                      className={`pressable h-12 rounded-md text-sm font-black ${
                        mealForm.meal_type === type
                          ? "bg-[var(--espresso)] text-white"
                          : "soft-card text-[var(--espresso-50)]"
                      }`}
                    >
                      {mealLabels[type]}
                    </button>
                  ))}
                </div>
                <FoodSearch
                  query={mealForm.food_name}
                  jenFoods={jenMatches}
                  apiResults={foodResults}
                  searching={foodSearching}
                  showResults={showDropdown}
                  onQueryChange={(value) => {
                    setMealForm({ ...mealForm, food_name: value });
                    setFoodQuery(value);
                    setSelectedFoodPer100g(null);
                    if (value.length < 2) { setFoodResults([]); setShowFoodResults(false); }
                  }}
                  onSelect={selectFood}
                  onFocus={() => setFoodFocused(true)}
                  onDismiss={() => { setShowFoodResults(false); setFoodFocused(false); }}
                />
                {selectedFoodPer100g ? (
                  <AmountStepper amount={selectedAmount} onChange={changeAmount} stueckG={selectedFoodStueckG ?? undefined} />
                ) : (
                  <Input label="Menge" value={mealForm.amount} onChange={(value) => setMealForm({ ...mealForm, amount: value })} placeholder="z.B. 250 g" />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Kalorien" type="number" value={mealForm.calories} onChange={(value) => setMealForm({ ...mealForm, calories: value })} required />
                  <Input label="Protein" type="number" value={mealForm.protein} onChange={(value) => setMealForm({ ...mealForm, protein: value })} />
                  <Input label="Carbs" type="number" value={mealForm.carbs} onChange={(value) => setMealForm({ ...mealForm, carbs: value })} />
                  <Input label="Fett" type="number" value={mealForm.fat} onChange={(value) => setMealForm({ ...mealForm, fat: value })} />
                </div>
                <ToggleRow
                  label="Als Favorit speichern"
                  checked={mealForm.saveFavorite}
                  onChange={(checked) => setMealForm({ ...mealForm, saveFavorite: checked })}
                />
                <button className="coral-button flex h-14 w-full items-center justify-center rounded-md text-base font-black">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Mahlzeit speichern"}
                </button>
              </form>
            </AccordionSection>

            <AccordionSection title="Favoriten" icon={<Star />}>
              {favorites.length > 0 && (
                <div className="mb-5 divide-y divide-[var(--espresso-14)]">
                  {[...favorites]
                    .sort((a, b) => {
                      const aMatch = a.meal_type === mealForm.meal_type ? 0 : 1;
                      const bMatch = b.meal_type === mealForm.meal_type ? 0 : 1;
                      return aMatch - bMatch;
                    })
                    .map((favorite) => {
                      return (
                        <div key={favorite.id} className="flex items-center gap-3 py-3">
                          <button onClick={() => quickAddFavorite(favorite)} className="pressable min-w-0 flex-1 text-left">
                            <p className="truncate font-black text-sm text-[var(--espresso)]">{favorite.name}</p>
                            <p className="text-xs text-[var(--espresso-50)]">
                              {mealLabels[favorite.meal_type]} · {favorite.calories} kcal
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteFavorite(favorite.id)}
                            className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[var(--espresso-14)] text-[var(--espresso-50)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
              <p className="kicker mb-3">{favorites.length > 0 ? "Jens Lebensmittel" : "Jens Lebensmittel"}</p>
              <div className="divide-y divide-[var(--espresso-14)]">
                {[...JEN_FOODS]
                  .sort((a, b) => a.name.localeCompare("" + b.name, "de"))
                  .map((food) => (
                    <div key={food.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[var(--espresso)]">{food.name}</p>
                        <p className="text-xs text-[var(--espresso-50)]">
                          P {food.per100g.protein} · C {food.per100g.carbs} · F {food.per100g.fat}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="serif text-lg text-[var(--coral)]">{food.per100g.calories}</p>
                          <p className="text-[10px] text-[var(--espresso-50)]">kcal/100g</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectFoodAndOpen(food)}
                          className="pressable flex h-9 w-9 items-center justify-center rounded-sm bg-[rgba(240,107,93,0.12)] text-[var(--coral)]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Heute gegessen" icon={<Utensils />}>
              {meals.length ? (
                <div className="space-y-2">
                  {meals.map((meal) => (
                    <div key={meal.id} className="soft-card flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="font-black text-[var(--espresso)]">{meal.food_name}</p>
                        <p className="text-sm text-[var(--espresso-50)]">
                          {mealLabels[meal.meal_type]} · {meal.amount || "ohne Menge"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteMeal(meal.id)}
                          className="pressable flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--espresso-14)] text-[var(--espresso-50)]"
                          aria-label={`${meal.food_name} löschen`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div>
                        <p className="serif text-2xl text-[var(--coral)]">{meal.calories}</p>
                        <p className="text-xs text-[var(--espresso-50)]">kcal</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Noch keine Mahlzeit für diesen Tag." />
              )}
            </AccordionSection>
          </>
        ) : null}
      </div>
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
          className={`h-5 w-5 text-[var(--espresso-50)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
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
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-[var(--espresso-14)] bg-white shadow-[0_8px_32px_rgba(52,40,32,0.12)]">
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {jenFoods.length > 0 && (
              <>
                {showBoth && (
                  <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--espresso-50)] bg-[rgba(241,231,214,0.7)]">
                    Jens Lebensmittel
                  </div>
                )}
                {jenFoods.map((food) => (
                  <FoodItem key={food.id} food={food} onSelect={onSelect} />
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
                  <FoodItem key={food.id} food={food} onSelect={onSelect} />
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

function FoodItem({ food, onSelect }: { food: FoodResult; onSelect: (food: FoodResult) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(food)}
      className="pressable flex w-full items-start justify-between gap-3 border-b border-[var(--espresso-14)] px-4 py-3 text-left last:border-0 hover:bg-[rgba(240,107,93,0.05)]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-[var(--espresso)]">{food.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {food.brand ? <p className="truncate text-xs text-[var(--espresso-50)]">{food.brand}</p> : null}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="serif text-lg text-[var(--coral)]">{food.per100g.calories}</p>
        <p className="text-xs text-[var(--espresso-50)]">kcal</p>
        <p className="mt-0.5 text-xs text-[var(--espresso-50)]">
          P {food.per100g.protein} · C {food.per100g.carbs} · F {food.per100g.fat}
        </p>
      </div>
    </button>
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
