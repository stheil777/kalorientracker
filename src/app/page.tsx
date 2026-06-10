"use client";

import {
  cloneElement,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  Activity,
  Calculator,
  Droplets,
  Flame,
  Heart,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Settings2,
  Star,
  Trash2,
  Utensils,
  Zap,
} from "lucide-react";
import { formatGermanDate, todayISO } from "@/lib/date";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import type {
  ActivityLevel,
  DailyNote,
  DietType,
  FavoriteMeal,
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
  water_intake: "",
  sleep_quality: "3",
  energy_level: "3",
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
  const [goalForm, setGoalForm] = useState(blankGoals);

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
            water_intake: note.water_intake?.toString() ?? "",
            sleep_quality: note.sleep_quality?.toString() ?? "3",
            energy_level: note.energy_level?.toString() ?? "3",
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

    setMealForm(blankMeal);
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
        water_intake: dailyNote.water_intake ? Number(dailyNote.water_intake) : null,
        sleep_quality: dailyNote.sleep_quality ? Number(dailyNote.sleep_quality) : null,
        energy_level: dailyNote.energy_level ? Number(dailyNote.energy_level) : null,
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
                    {Math.max(activeProfile.calorie_goal - totals.calories, 0)}
                  </p>
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

            <section className="app-card reveal-in reveal-delay-3 mb-5 p-4">
              <SectionTitle icon={<Plus />} title="Mahlzeit eintragen" />
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
                <Input label="Lebensmittel" value={mealForm.food_name} onChange={(value) => setMealForm({ ...mealForm, food_name: value })} required />
                <Input label="Menge" value={mealForm.amount} onChange={(value) => setMealForm({ ...mealForm, amount: value })} placeholder="z.B. 250 g" />
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
            </section>

            <Section title="Favoriten" icon={<Star />}>
              {favorites.length ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {favorites.map((favorite) => (
                    <div
                      key={favorite.id}
                      className="min-w-40 rounded-md border border-[rgba(217,164,65,0.22)] bg-[rgba(255,255,255,0.7)] p-3 text-sm"
                    >
                      <button onClick={() => quickAddFavorite(favorite)} className="pressable w-full text-left">
                        <p className="font-black text-[var(--espresso)]">{favorite.name}</p>
                        <p className="mt-1 text-[var(--espresso-50)]">{favorite.calories} kcal · tap zum Adden</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFavorite(favorite.id)}
                        className="pressable mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-sm border border-[var(--espresso-14)] text-xs font-black text-[var(--espresso-50)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Speichere eine Mahlzeit als Favorit, dann ist sie hier mit einem Tap verfügbar." />
              )}
            </Section>

            <Section title="Heute gegessen" icon={<Utensils />}>
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
            </Section>

            <Section title="Tagesnotizen" icon={<Heart />}>
              <form onSubmit={saveDailyNote} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <IconInput icon={<Activity />} label="Gewicht kg" type="number" value={dailyNote.weight} onChange={(value) => setDailyNote({ ...dailyNote, weight: value })} />
                  <IconInput icon={<Droplets />} label="Wasser l" type="number" value={dailyNote.water_intake} onChange={(value) => setDailyNote({ ...dailyNote, water_intake: value })} />
                  <IconInput icon={<Moon />} label="Schlaf 1-5" type="number" min={1} max={5} value={dailyNote.sleep_quality} onChange={(value) => setDailyNote({ ...dailyNote, sleep_quality: value })} />
                  <IconInput icon={<Zap />} label="Energie 1-5" type="number" min={1} max={5} value={dailyNote.energy_level} onChange={(value) => setDailyNote({ ...dailyNote, energy_level: value })} />
                </div>
                <ToggleRow
                  label="Training heute?"
                  checked={dailyNote.training}
                  onChange={(checked) => setDailyNote({ ...dailyNote, training: checked })}
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--espresso-50)]">Notizen</span>
                  <textarea
                    value={dailyNote.notes}
                    onChange={(event) => setDailyNote({ ...dailyNote, notes: event.target.value })}
                    rows={3}
                    className="field h-auto min-h-28 py-3"
                    placeholder="Hunger, Stimmung, Besonderheiten..."
                  />
                </label>
                <button className="pressable h-14 w-full rounded-md border border-[var(--coral)] bg-white/70 px-5 text-base font-black text-[var(--coral-dark)]">
                  Notizen speichern
                </button>
              </form>
            </Section>
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

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="app-card reveal-in mb-5 p-4">
      <SectionTitle icon={icon} title={title} />
      {children}
    </section>
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

function IconInput({
  icon,
  label,
  value,
  onChange,
  ...props
}: {
  icon: ReactElement<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="soft-card block p-3">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.06em] text-[var(--espresso-50)]">
        {cloneElement(icon, { className: "h-4 w-4 text-[var(--coral)]" })}
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full bg-transparent text-lg font-black text-[var(--espresso)] outline-none"
        {...props}
      />
    </label>
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

function Empty({ text }: { text: string }) {
  return <p className="soft-card p-4 text-sm leading-6 text-[var(--espresso-50)]">{text}</p>;
}
