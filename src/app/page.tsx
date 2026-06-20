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
  Plus,
  Search,
  Settings2,
  Star,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { formatGermanDate, todayISO } from "@/lib/date";
import { closeSoundContext, playBell, playClose, playDelete, playOpen, playSave, playStepDown, playStepUp, playType } from "@/lib/sounds";
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
  MealType,
  Profile,
  Sex,
  TrainingEntry,
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

type InlineFood = {
  name: string;
  per100g: FoodResult["per100g"];
  stueckG?: number;
  measureUnit?: FoodResult["measure_unit"];
  portions?: FoodResult["portions"];
};

const TRAINING_ACTIVITIES = [
  { value: "yoga", label: "Yoga", met: 2.3 },
  { value: "pilates", label: "Pilates", met: 2.8 },
  { value: "spaziergang", label: "Spaziergang", met: 3.0 },
  { value: "tanzen", label: "Tanzen", met: 4.5 },
  { value: "wandern", label: "Wandern", met: 3.8 },
  { value: "radfahren", label: "Radfahren", met: 4.3 },
  { value: "schwimmen", label: "Schwimmen", met: 5.8 },
  { value: "krafttraining", label: "Krafttraining", met: 3.5 },
  { value: "bauch", label: "Bauchtraining", met: 2.8 },
  { value: "laufen", label: "Laufen", met: 7.5 },
  { value: "hiit", label: "HIIT", met: 7.0 },
];

const CYCLE_SYMPTOMS = [
  { id: "cramps", label: "Krämpfe" },
  { id: "bloating", label: "Blähungen" },
  { id: "headache", label: "Kopfschmerzen" },
  { id: "cravings", label: "Heißhunger" },
  { id: "breast_tenderness", label: "Brustspannen" },
  { id: "mood_swings", label: "Stimmungsschwankungen" },
] as const;

const CYCLE_FLOW_OPTIONS = [
  { value: "light", label: "Leicht" },
  { value: "medium", label: "Mittel" },
  { value: "heavy", label: "Stark" },
] as const;

function calculateTrainingCalories(met: number, weight: number, durationMin: number) {
  return Math.max(0, Math.round((met - 1) * weight * (durationMin / 60)));
}

function calculateCycleDay(currentDate: string, cycleStartDate: string | null | undefined) {
  if (!cycleStartDate) return null;
  const current = Date.parse(`${currentDate}T00:00:00Z`);
  const start = Date.parse(`${cycleStartDate}T00:00:00Z`);
  if (!Number.isFinite(current) || !Number.isFinite(start) || current < start) return null;
  return Math.floor((current - start) / 86_400_000) + 1;
}

const defaultGoals = {
  Stephan: { calories: 2400, protein: 180, carbs: 240, fat: 75 },
  Jen: { calories: 1900, protein: 130, carbs: 190, fat: 60 },
} as const;

const HEALTH_CONSENT_TYPE = "health_data_processing";
const HEALTH_CONSENT_VERSION = "2026-06-19-v1";
const HEALTH_CONSENT_TEXT =
  "Ich willige ausdrücklich ein, dass meine Gesundheits- und Ernährungsdaten – insbesondere Gewicht, Körpermaße, Kalorien- und Makroangaben, Trainings-, Schlaf-, Energie-, Zyklus- und Unverträglichkeitsangaben – zum Betrieb des Kalorientrackers, zur persönlichen Auswertung und zur Begleitung durch Jen verarbeitet werden. Mir ist bekannt, dass diese Einwilligung freiwillig ist und ich sie jederzeit mit Wirkung für die Zukunft widerrufen kann.";

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
  period_start: false,
  flow: "" as "" | "light" | "medium" | "heavy",
  symptoms: [] as string[],
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

function profileNeedsSetup(profile: Profile) {
  return !(
    profile.current_weight &&
    profile.height_cm &&
    profile.age &&
    profile.sex &&
    profile.activity_level &&
    profile.goal_type &&
    profile.diet_type
  );
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

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen.";
  if (h < 18) return "Jetzt tracken.";
  return "Guten Abend.";
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentStatus, setConsentStatus] = useState<"loading" | "required" | "granted">("loading");
  const [healthConsentAccepted, setHealthConsentAccepted] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [withdrawConsentConfirm, setWithdrawConsentConfirm] = useState(false);
  const [resetMode, setResetMode] = useState<"idle" | "sending" | "sent">("idle");
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [date] = useState(todayISO());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [dailyNote, setDailyNote] = useState(blankNote);
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);
  const [trainingDraft, setTrainingDraft] = useState({ activity: "spaziergang", duration: "30" });
  const [trainingSaving, setTrainingSaving] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType | null>(null);
  const [inlineKey, setInlineKey] = useState<string | null>(null);
  const [inlineFood, setInlineFood] = useState<InlineFood | null>(null);
  const [inlineGrams, setInlineGrams] = useState(100);
  const [inlineLabel, setInlineLabel] = useState("100 g");
  const [goalForm, setGoalForm] = useState(blankGoals);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FoodResult[]>([]);
  const [foodSearching, setFoodSearching] = useState(false);
  const [showFoodResults, setShowFoodResults] = useState(false);
  const [foodFocused, setFoodFocused] = useState(false);
  const [checkInSaved, setCheckInSaved] = useState(false);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const toastIdRef = useRef(0);

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
  const cycleDay = activeProfile?.sex === "female"
    ? calculateCycleDay(date, dailyNote.period_start ? date : activeProfile.cycle_start_date)
    : null;

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

  const trainingCalories = useMemo(
    () => trainingEntries.reduce((sum, entry) => sum + entry.calories, 0),
    [trainingEntries],
  );

  const caloriesLeft = Math.max(
    (activeProfile?.calorie_goal ?? 0) - totals.calories + trainingCalories,
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
      setProfiles([]);
      setActiveProfileId("");
      setMeals([]);
      setFavorites([]);
      setDailyNote(blankNote);
      setTrainingEntries([]);
      setConsentStatus(session?.user ? "loading" : "required");
      setHealthConsentAccepted(false);
      setConsentError("");
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return () => { closeSoundContext(); };
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    const userId = user.id;

    async function loadConsent() {
      setConsentStatus("loading");
      const { data, error } = await supabase!
        .from("user_consent_events")
        .select("event_type")
        .eq("user_id", userId)
        .eq("consent_type", HEALTH_CONSENT_TYPE)
        .eq("consent_version", HEALTH_CONSENT_VERSION)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setConsentError("Die Einwilligung konnte nicht geprüft werden. Bitte versuche es später erneut.");
        setConsentStatus("required");
        return;
      }

      setConsentStatus(data?.event_type === "granted" ? "granted" : "required");
    }

    loadConsent();
  }, [user]);

  useEffect(() => {
    if (consentStatus !== "granted") return;
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

        const createdProfile = created?.[0] as Profile | undefined;
        setProfiles(createdProfile ? [createdProfile] : []);
        setActiveProfileId(createdProfile?.id ?? "");
        if (createdProfile) {
          setGoalForm(goalsFromProfile(createdProfile));
          setProfileModalOpen(profileNeedsSetup(createdProfile));
        }
        return;
      }

      const loadedProfiles = data as Profile[];
      const initialProfile = loadedProfiles[0];
      setProfiles(loadedProfiles);
      setActiveProfileId((current) => current || initialProfile.id);
      setGoalForm(goalsFromProfile(initialProfile));
      setProfileModalOpen(profileNeedsSetup(initialProfile));
    }

    loadProfiles();
  }, [user, consentStatus]);

  useEffect(() => {
    if (consentStatus !== "granted") return;
    if (!user || !activeProfile || !supabase) return;
    refreshDay();
    refreshFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeProfileId, date, consentStatus]);

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
        const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(foodQuery)}`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Food search failed with status ${res.status}`);
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error("Food search returned an invalid response");
        setFoodResults(data);
        setShowFoodResults(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setFoodResults([]);
          setShowFoodResults(false);
        }
      } finally {
        setFoodSearching(false);
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [foodQuery]);

  async function refreshDay() {
    if (!supabase || !activeProfile) return;

    const [{ data: mealRows }, { data: noteRows }, { data: trainingRows }] = await Promise.all([
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
      supabase
        .from("daily_training_entries")
        .select("*")
        .eq("profile_id", activeProfile.id)
        .eq("date", date)
        .order("created_at", { ascending: true }),
    ]);

    setMeals((mealRows ?? []) as MealEntry[]);
    setTrainingEntries((trainingRows ?? []) as TrainingEntry[]);
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
            period_start: note.period_start ?? false,
            flow: note.flow ?? "",
            symptoms: Array.isArray(note.symptoms) ? note.symptoms.filter((item): item is string => typeof item === "string") : [],
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

  async function toggleFavorite(
    name: string,
    per100g: { calories: number; protein: number; carbs: number; fat: number },
    grams?: number,
    label?: string,
  ) {
    if (!supabase || !user || !activeProfile) return;
    const existing = favorites.find((f) => f.name === name);
    if (existing) {
      playDelete();
      await supabase.from("favorite_meals").delete().eq("id", existing.id);
    } else {
      playBell();
      const g = grams ?? 100;
      const lbl = label ?? `${g} g`;
      const f = g / 100;
      await supabase.from("favorite_meals").insert({
        user_id: user.id, profile_id: activeProfile.id,
        name, amount: lbl, meal_type: activeMealType ?? "snack",
        calories: Math.round(per100g.calories * f),
        protein: Math.round(per100g.protein * f * 10) / 10,
        carbs: Math.round(per100g.carbs * f * 10) / 10,
        fat: Math.round(per100g.fat * f * 10) / 10,
      });
    }
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
    setAuthSuccess("");

    const result =
      authMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName.trim(), full_name: firstName.trim() } } });

    if (result.error) {
      setAuthMessage(result.error.message);
    } else if (authMode === "signup") {
      setAuthSuccess("Wir haben dir eine E-Mail geschickt. Bitte bestätige deine Adresse.");
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

  async function grantHealthConsent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !healthConsentAccepted) return;
    setConsentSaving(true);
    setConsentError("");

    const { error } = await supabase.from("user_consent_events").insert({
      user_id: user.id,
      consent_type: HEALTH_CONSENT_TYPE,
      consent_version: HEALTH_CONSENT_VERSION,
      event_type: "granted",
      consent_text: HEALTH_CONSENT_TEXT,
    });

    if (error) {
      setConsentError("Die Einwilligung konnte nicht gespeichert werden. Bitte versuche es erneut.");
      setConsentSaving(false);
      return;
    }

    setConsentStatus("granted");
    setHealthConsentAccepted(false);
    setConsentSaving(false);
  }

  async function withdrawHealthConsent() {
    if (!supabase || !user) return;
    setConsentSaving(true);
    setConsentError("");

    const { error } = await supabase.from("user_consent_events").insert({
      user_id: user.id,
      consent_type: HEALTH_CONSENT_TYPE,
      consent_version: HEALTH_CONSENT_VERSION,
      event_type: "withdrawn",
      consent_text: HEALTH_CONSENT_TEXT,
    });

    if (error) {
      setSaveError("Die Einwilligung konnte nicht widerrufen werden.");
      setConsentSaving(false);
      return;
    }

    setProfiles([]);
    setActiveProfileId("");
    setMeals([]);
    setFavorites([]);
    setTrainingEntries([]);
    setDailyNote(blankNote);
    setWithdrawConsentConfirm(false);
    setConsentStatus("required");
    setConsentSaving(false);
    await supabase.auth.signOut();
  }

  async function deleteMeal(mealId: string) {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("meal_entries").delete().eq("id", mealId);
    if (error) { setSaveError("Mahlzeit konnte nicht gelöscht werden."); setSaving(false); return; }
    await refreshDay();
    playDelete();
    setSaving(false);
  }

  async function deleteFavorite(favoriteId: string) {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("favorite_meals").delete().eq("id", favoriteId);
    if (error) { setSaveError("Favorit konnte nicht gelöscht werden."); setSaving(false); return; }
    await refreshFavorites();
    playDelete();
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
            if (favorites.length === 0) {
        await addStarterFavorites();
      }
    }

    playSave();
    setSaving(false);
    setProfileModalOpen(false);
  }

  async function saveDailyNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !activeProfile) return;
    setSaving(true);

    const firstTraining = trainingEntries[0];
    const { error: noteError } = await supabase.from("daily_notes").upsert(
      {
        user_id: user.id,
        profile_id: activeProfile.id,
        date,
        weight: dailyNote.weight ? Number(dailyNote.weight) : null,
        training: trainingEntries.length > 0,
        training_notes: dailyNote.training_notes.trim() || null,
        training_activity: firstTraining?.activity ?? null,
        training_duration_min: firstTraining?.duration_min ?? null,
        training_kcal: trainingEntries.length > 0 ? trainingCalories : null,
        water_intake: dailyNote.water_intake ? Number(dailyNote.water_intake) : null,
        sleep_quality: dailyNote.sleep_quality ? Number(dailyNote.sleep_quality) : null,
        energy_level: dailyNote.energy_level ? Number(dailyNote.energy_level) : null,
        satiation: dailyNote.satiation ? Number(dailyNote.satiation) : null,
        mood: dailyNote.mood ? Number(dailyNote.mood) : null,
        cravings: dailyNote.cravings.trim() || null,
        period_start: dailyNote.period_start,
        flow: dailyNote.flow || null,
        symptoms: dailyNote.symptoms,
        notes: dailyNote.notes.trim() || null,
      },
      { onConflict: "user_id,profile_id,date" },
    );

    if (noteError) { setSaveError("Check-In konnte nicht gespeichert werden."); setSaving(false); return; }

    if (dailyNote.period_start && activeProfile.cycle_start_date !== date) {
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({ cycle_start_date: date })
        .eq("id", activeProfile.id)
        .select("*")
        .single();

      if (profileError) {
        setSaveError("Der Periodenstart konnte nicht im Profil gespeichert werden.");
        setSaving(false);
        return;
      }

      setProfiles((current) =>
        current.map((profile) => (profile.id === updatedProfile.id ? (updatedProfile as Profile) : profile)),
      );
    }

    await refreshDay();
    playSave();
    setCheckInSaved(true);
    setTimeout(() => setCheckInSaved(false), 2200);
    showToast("Check-In gespeichert");
    setSaving(false);
    setCheckInOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(msg: string) {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToast({ id, msg });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2700);
  }

  async function addTrainingEntry() {
    if (!supabase || !user || !activeProfile) return;
    const duration = Math.max(5, Number(trainingDraft.duration) || 30);
    const activity = TRAINING_ACTIVITIES.find((item) => item.value === trainingDraft.activity) ?? TRAINING_ACTIVITIES[0];
    const weight = Number(dailyNote.weight) || activeProfile.current_weight || 65;
    const calories = calculateTrainingCalories(activity.met, weight, duration);

    setTrainingSaving(true);
    const { data, error } = await supabase
      .from("daily_training_entries")
      .insert({
        user_id: user.id,
        profile_id: activeProfile.id,
        date,
        activity: activity.value,
        duration_min: duration,
        calories,
      })
      .select("*")
      .single();

    if (error) {
      setSaveError("Sportart konnte nicht gespeichert werden.");
      setTrainingSaving(false);
      return;
    }

    setTrainingEntries((current) => [...current, data as TrainingEntry]);
    setTrainingDraft({ activity: "spaziergang", duration: "30" });
    setTrainingSaving(false);
    playSave();
  }

  async function deleteTrainingEntry(entryId: string) {
    if (!supabase) return;
    setTrainingSaving(true);
    const { error } = await supabase.from("daily_training_entries").delete().eq("id", entryId);
    if (error) {
      setSaveError("Sportart konnte nicht gelöscht werden.");
      setTrainingSaving(false);
      return;
    }
    setTrainingEntries((current) => current.filter((entry) => entry.id !== entryId));
    setTrainingSaving(false);
    playDelete();
  }

  function openInlineFood(key: string, food: InlineFood, initialGrams?: number) {
    if (inlineKey === key) { setInlineKey(null); setInlineFood(null); return; }
    setInlineKey(key);
    setInlineFood(food);
    const firstPortion = food.portions?.[0];
    const g = initialGrams ?? firstPortion?.amount ?? food.stueckG ?? 100;
    setInlineGrams(g);
    setInlineLabel(
      initialGrams === undefined && firstPortion
        ? `1 ${firstPortion.label}`
        : food.stueckG && initialGrams === undefined
          ? "1 Stück"
          : `${g} ${food.measureUnit ?? "g"}`,
    );
    if (key.startsWith("search:")) { setFoodFocused(false); setShowFoodResults(false); }
  }

  async function inlineAddMeal() {
    if (!supabase || !user || !activeProfile || !inlineFood || !activeMealType) return;
    const addedName = inlineFood.name;
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
    playSave();
    showToast((addedName.length > 22 ? addedName.slice(0, 22) + "…" : addedName) + " hinzugefügt");
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
    playSave();
    showToast("Menge aktualisiert");
    setSaving(false);
    setInlineKey(null);
    setInlineFood(null);
  }

  async function deleteAccount() {
    if (!supabase || !user) return;
    setDeleting(true);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      setSaveError("Konto konnte nicht gelöscht werden: keine aktive Sitzung.");
      setDeleting(false);
      return;
    }
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveError("Konto konnte nicht gelöscht werden: " + (body?.error ?? res.statusText));
        setDeleting(false);
        return;
      }
    } catch {
      setSaveError("Konto konnte nicht gelöscht werden: Netzwerkfehler.");
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
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

  if (user && consentStatus === "loading") {
    return (
      <main className="app-shell grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--coral)]" />
      </main>
    );
  }

  if (user && consentStatus === "required") {
    return (
      <main className="app-shell px-5 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
          <div className="mb-8 reveal-in">
            <p className="mb-4 text-[0.82rem] font-medium leading-[1.2] text-[var(--espresso-50)]">Deine Daten. Deine Entscheidung.</p>
            <h1 className="serif text-[2.8rem] leading-[1.02] text-[var(--espresso)]">
              Gesundheitsdaten bewusst freigeben.
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--espresso-50)]">
              Der Tracker verarbeitet sensible Angaben. Deshalb benötigen wir dafür eine separate, ausdrückliche Einwilligung.
            </p>
          </div>

          <form onSubmit={grantHealthConsent} className="app-card reveal-in reveal-delay-1 space-y-5 p-5">
            <div className="space-y-3 text-sm leading-6 text-[var(--espresso-70)]">
              <p>{HEALTH_CONSENT_TEXT}</p>
              <p>
                Weitere Informationen findest du in der{" "}
                <a href="/datenschutz" target="_blank" className="font-bold text-[var(--coral)] underline underline-offset-2">
                  Datenschutzerklärung
                </a>.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-md bg-[rgba(241,231,214,0.55)] p-4">
              <input
                type="checkbox"
                checked={healthConsentAccepted}
                onChange={(event) => setHealthConsentAccepted(event.target.checked)}
                className="mt-1 h-5 w-5 flex-shrink-0 accent-[var(--coral)]"
              />
              <span className="text-sm font-bold leading-6 text-[var(--espresso)]">
                Ich willige ausdrücklich in die beschriebene Verarbeitung meiner Gesundheitsdaten ein.
              </span>
            </label>

            {consentError ? (
              <p className="rounded-md bg-[rgba(220,60,40,0.10)] p-3 text-sm leading-6 text-[#b83030]">
                {consentError}
              </p>
            ) : null}

            <button
              disabled={!healthConsentAccepted || consentSaving}
              className="coral-button flex h-14 w-full items-center justify-center rounded-md text-base font-black"
            >
              {consentSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Einwilligen und fortfahren"}
            </button>

            <button
              type="button"
              onClick={() => supabase?.auth.signOut()}
              className="pressable w-full text-center text-sm text-[var(--espresso-50)]"
            >
              Ausloggen
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
            <p className="mb-4 text-[0.82rem] font-medium leading-[1.2] text-[var(--espresso-50)]">Von Jen, für dich.</p>
            <h1 className="serif text-[3.15rem] leading-[0.98] text-[var(--espresso)]">Iss was dir gut tut.</h1>
            <p className="mt-5 max-w-sm text-[1.05rem] leading-8 text-[var(--espresso-50)]">
              Dein täglicher Begleiter für bewusstes Essen — mit Leichtigkeit.
            </p>
          </div>

          <form onSubmit={handleAuth} className="app-card reveal-in reveal-delay-1 space-y-4 p-5">
            <div className="grid grid-cols-2 rounded-md bg-[rgba(241,231,214,0.55)] p-1">
              {(["login", "signup"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setAuthMode(mode); setAuthMessage(""); setAuthSuccess(""); setResetMode("idle"); }}
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
              <p className="rounded-md bg-[rgba(220,60,40,0.10)] p-3 text-sm leading-6 text-[#b83030]">
                {authMessage}
              </p>
            ) : null}
            {authSuccess ? (
              <p className="rounded-md bg-[rgba(80,180,120,0.12)] p-3 text-sm leading-6 text-[#2a7a50]">
                {authSuccess}
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
      <div className="mx-auto max-w-md px-4 pt-12" style={{ paddingBottom: "max(4rem, env(safe-area-inset-bottom))" }}>
        <header className="reveal-in mb-6">
          <p className="mb-2 flex flex-wrap items-center gap-x-2 text-[0.82rem] font-medium leading-[1.2] text-[var(--espresso-50)]">
            <span>{formatGermanDate(date)}</span>
            {activeProfile?.sex === "female" && cycleDay !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span>Zyklustag {cycleDay}</span>
              </>
            )}
          </p>
          <div className="flex items-center justify-between gap-3">
            <h1 className="serif min-w-0 text-[2.55rem] leading-none text-[var(--espresso)]">
              Hey{" "}<span className="italic text-[var(--coral)] -ml-[0.08em]">{user?.user_metadata?.first_name || activeProfile?.name}.</span>
            </h1>
            {activeProfile && (
              <button
                type="button"
                aria-label="Profil bearbeiten"
                onClick={() => { setGoalForm(goalsFromProfile(activeProfile)); setProfileModalOpen(true); }}
                className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-[var(--coral)] shadow-sm"
              >
                <Settings2 className="h-5 w-5" />
              </button>
            )}
          </div>
          <p className="mt-2 text-base text-[var(--espresso-50)]">{getTimeGreeting()}</p>
        </header>

        {saveError && (
          <div className="mb-4 flex items-center justify-between rounded-md bg-[rgba(230,80,60,0.10)] px-4 py-3 text-sm font-bold text-[var(--coral-dark)]">
            {saveError}
            <button type="button" onClick={() => setSaveError("")} className="ml-3 text-lg leading-none">×</button>
          </div>
        )}

        {activeProfile ? (
          <>
            <AccordionSection title="Daily Check-in" icon={<Heart />} open={checkInOpen} onOpenChange={setCheckInOpen}>
              <form onSubmit={saveDailyNote} className="space-y-3">
                <TrainingEntriesEditor
                  entries={trainingEntries}
                  activity={trainingDraft.activity}
                  duration={trainingDraft.duration}
                  weight={Number(dailyNote.weight) || activeProfile.current_weight || 65}
                  saving={trainingSaving}
                  onActivityChange={(activity) => setTrainingDraft((current) => ({ ...current, activity }))}
                  onDurationChange={(duration) => setTrainingDraft((current) => ({ ...current, duration }))}
                  onAdd={addTrainingEntry}
                  onDelete={deleteTrainingEntry}
                />
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
                {activeProfile.sex === "female" && (
                  <CycleTracking
                    cycleDay={cycleDay}
                    periodStart={dailyNote.period_start}
                    flow={dailyNote.flow}
                    symptoms={dailyNote.symptoms}
                    onPeriodStartChange={(periodStart) =>
                      setDailyNote({
                        ...dailyNote,
                        period_start: periodStart,
                        flow: periodStart ? dailyNote.flow : "",
                      })
                    }
                    onFlowChange={(flow) => setDailyNote({ ...dailyNote, flow })}
                    onSymptomsChange={(symptoms) => setDailyNote({ ...dailyNote, symptoms })}
                  />
                )}
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--espresso-50)]">Gelüste</span>
                  <input
                    value={dailyNote.cravings}
                    onChange={(e) => { playType(); setDailyNote({ ...dailyNote, cravings: e.target.value }); }}
                    className="field"
                    placeholder="Worauf hattest du heute Lust?"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--espresso-50)]">Notizen</span>
                  <textarea
                    value={dailyNote.notes}
                    onChange={(e) => { playType(); setDailyNote({ ...dailyNote, notes: e.target.value }); }}
                    rows={2}
                    className="field h-auto min-h-20 py-3"
                    placeholder="Besonderheiten, Beobachtungen..."
                  />
                </label>
                <button className={`flex h-14 w-full items-center justify-center rounded-md text-base font-black transition-all duration-300 ${checkInSaved ? "bg-[#4a9e6f] text-white shadow-[0_8px_20px_rgba(74,158,111,0.22)]" : "coral-button"}`}>
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : checkInSaved ? "✓ Gespeichert" : "Check-In speichern"}
                </button>
              </form>
            </AccordionSection>

            <section className="app-card reveal-in reveal-delay-2 mb-5 p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[0.82rem] font-medium leading-[1.2] text-[var(--espresso-50)]">Kalorien übrig</p>
                  <p
                    className="serif nums text-[4.85rem] leading-[0.88] text-[var(--coral)]"
                    style={{ letterSpacing: "-0.085em" }}
                  >
                    {animatedCaloriesLeft}
                  </p>
                  {trainingCalories > 0 && (
                    <p className="mt-1 text-sm font-medium text-[var(--coral)]">+{trainingCalories} kcal Training</p>
                  )}
                </div>
                <div className="soft-card px-3 py-2 text-right">
                  <p className="text-sm font-medium text-[var(--espresso-50)]">Gegessen</p>
                  <p className="serif nums text-2xl text-[var(--espresso)]">{totals.calories}</p>
                  <p className="text-sm text-[var(--espresso-50)]">kcal</p>
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
            </section>

            <div className="mb-5 grid grid-cols-2 gap-3">
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
                    className="pressable relative flex flex-col items-start overflow-hidden rounded-lg px-4 pb-10 pt-4 text-left transition-colors"
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
                    <p className={`text-sm font-medium ${isActive ? "text-white" : "text-[var(--espresso-50)]"}`}>{mealLabels[type]}</p>
                    <p className={`serif mt-1 text-3xl leading-none ${isActive ? "text-white" : hasEntries ? "text-[var(--coral)]" : "text-[var(--espresso-20,rgba(52,40,32,0.2))]"}`}>
                      {hasEntries ? typeKcal : "+"}
                    </p>
                    {hasEntries ? (
                      <p className={`mt-0.5 text-sm ${isActive ? "text-white" : "text-[var(--espresso-50)]"}`}>
                        kcal <span className={isActive ? "text-white" : "text-[var(--espresso-50)]"}>/ {targetKcal}</span>
                      </p>
                    ) : (
                      <p className={`mt-0.5 text-sm ${isActive ? "text-white" : "text-[var(--espresso-50)]"}`}>Ziel {targetKcal}</p>
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
                    <div className="soft-card flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <span className="text-lg tracking-[0.3em] text-[var(--espresso-28)]">· · ·</span>
                      <p className="text-sm leading-6 text-[var(--espresso-50)]">Noch keine Favoriten. Tippe bei einem Lebensmittel auf den Stern ★, um es hier zu speichern.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--espresso-14)]">
                      {favorites.map((fav) => {
                        const key = `fav:${fav.id}`;
                        const isOpen = inlineKey === key;
                        return (
                          <div key={fav.id}>
                            <div className="flex items-center gap-3 py-3">
                              <button type="button" onClick={() => {
                                const sourceFood = JEN_FOODS.find((food) => food.name === fav.name);
                                const match = fav.amount.match(/^(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
                                const g = match
                                  ? parseFloat(match[1])
                                  : sourceFood?.per100g.calories
                                    ? (fav.calories / sourceFood.per100g.calories) * 100
                                    : 100;
                                const p100 = { calories: (fav.calories / g) * 100, protein: (fav.protein / g) * 100, carbs: (fav.carbs / g) * 100, fat: (fav.fat / g) * 100 };
                                openInlineFood(key, {
                                  name: fav.name,
                                  per100g: sourceFood?.per100g ?? p100,
                                  stueckG: sourceFood?.stueck_g,
                                  measureUnit: sourceFood?.measure_unit,
                                  portions: sourceFood?.portions,
                                }, g);
                              }} className="pressable min-w-0 flex-1 text-left">
                                <p className="truncate text-sm font-medium text-[var(--espresso)]">{fav.name}</p>
                                <p className="text-sm text-[var(--espresso-50)]">{fav.amount} · {fav.calories} kcal</p>
                              </button>
                              <button type="button" aria-label="Favorit löschen" onClick={() => deleteFavorite(fav.id)} className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-[var(--espresso-14)] text-[var(--espresso-40,rgba(52,40,32,0.4))]">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {isOpen && (
                              <div className="pb-4">
                                <AmountStepper
                                  key={fav.id}
                                  amount={inlineGrams}
                                  measureUnit={inlineFood?.measureUnit}
                                  portions={inlineFood?.portions}
                                  onChange={(g, l) => { setInlineGrams(g); setInlineLabel(l ?? `${g} ${inlineFood?.measureUnit ?? "g"}`); }}
                                />
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
                            <button type="button" onClick={() => openInlineFood(key, {
                              name: food.name,
                              per100g: food.per100g,
                              stueckG: food.stueck_g,
                              measureUnit: food.measure_unit,
                              portions: food.portions,
                            })} className="pressable flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-[var(--espresso)]">{food.name}</p>
                                <p className="text-sm text-[var(--espresso-50)]">{food.per100g.calories} kcal / 100g</p>
                              </div>
                              <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--espresso-30,rgba(52,40,32,0.3))] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            <button type="button" aria-label="Als Favorit speichern" onClick={() => { const open = inlineKey === `jen:${food.name}`; toggleFavorite(food.name, food.per100g, open ? inlineGrams : undefined, open ? inlineLabel : undefined); }} className="pressable flex h-11 w-11 shrink-0 items-center justify-center">
                              <Star className={`h-4 w-4 transition-colors ${favNames.has(food.name) ? "fill-[var(--coral)] text-[var(--coral)]" : "text-[var(--espresso-28)]"}`} />
                            </button>
                          </div>
                          {isOpen && (
                            <div className="pb-4">
                              <AmountStepper
                                key={food.id}
                                amount={inlineGrams}
                                stueckG={food.stueck_g}
                                measureUnit={food.measure_unit}
                                portions={food.portions}
                                onChange={(g, l) => { setInlineGrams(g); setInlineLabel(l ?? `${g} ${food.measure_unit ?? "g"}`); }}
                              />
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
                  <FoodSearch
                    query={foodQuery}
                    jenFoods={jenMatches}
                    apiResults={foodResults}
                    searching={foodSearching}
                    showResults={showDropdown}
                    onQueryChange={(value) => {
                      playType();
                      setFoodQuery(value);
                      setInlineKey(null);
                      if (value.length < 2) { setFoodResults([]); setShowFoodResults(false); }
                    }}
                    onSelect={(food) => openInlineFood(`search:${food.name}`, {
                      name: food.name,
                      per100g: food.per100g,
                      stueckG: food.stueck_g,
                      measureUnit: food.measure_unit,
                      portions: food.portions,
                    })}
                    onFavorite={(food) => toggleFavorite(food.name, food.per100g)}
                    favNames={favNames}
                    onFocus={() => setFoodFocused(true)}
                    onDismiss={() => { setShowFoodResults(false); setFoodFocused(false); }}
                  />
                  {inlineKey?.startsWith("search:") && inlineFood && (
                    <div className="mt-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-[var(--espresso)]">{inlineFood.name}</p>
                        <button type="button" aria-label="Als Favorit speichern" onClick={() => toggleFavorite(inlineFood.name, inlineFood.per100g, inlineGrams, inlineLabel)} className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-[var(--espresso-14)]">
                          <Star className={`h-4 w-4 transition-colors ${favNames.has(inlineFood.name) ? "fill-[var(--coral)] text-[var(--coral)]" : "text-[var(--espresso-28)]"}`} />
                        </button>
                      </div>
                      <AmountStepper
                        key={inlineFood.name}
                        amount={inlineGrams}
                        stueckG={inlineFood.stueckG}
                        measureUnit={inlineFood.measureUnit}
                        portions={inlineFood.portions}
                        onChange={(g, l) => { setInlineGrams(g); setInlineLabel(l ?? `${g} ${inlineFood.measureUnit ?? "g"}`); }}
                      />
                      <button type="button" onClick={inlineAddMeal} className="coral-button mt-3 flex h-11 w-full items-center justify-center rounded-md text-sm font-black">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hinzufügen"}
                      </button>
                    </div>
                  )}
                </div>

                {(mealsByType[activeMealType] ?? []).length > 0 && (
                  <div className="overflow-hidden rounded-lg" style={{ background: "var(--coral)" }}>
                    <p className="px-4 pb-2 pt-4 text-[0.82rem] font-medium leading-[1.2] text-white">Heute {mealLabels[activeMealType]}</p>
                    <div className="divide-y divide-white/20">
                      {(mealsByType[activeMealType] ?? []).map((meal) => {
                        const editKey = `edit:${meal.id}`;
                        const isEditing = inlineKey === editKey;
                        const match = meal.amount?.match(/^(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
                        const sourceFood = JEN_FOODS.find((food) => food.name === meal.food_name);
                        const g = match
                          ? parseFloat(match[1])
                          : sourceFood?.per100g.calories
                            ? (meal.calories / sourceFood.per100g.calories) * 100
                            : 100;
                        const p100 = { calories: (meal.calories / g) * 100, protein: (meal.protein / g) * 100, carbs: (meal.carbs / g) * 100, fat: (meal.fat / g) * 100 };
                        const isFav = favNames.has(meal.food_name);
                        return (
                          <div key={meal.id}>
                            <div className="flex items-center gap-2 px-4 py-3">
                              <button type="button" onClick={() => openInlineFood(editKey, {
                                name: meal.food_name,
                                per100g: sourceFood?.per100g ?? p100,
                                stueckG: sourceFood?.stueck_g,
                                measureUnit: sourceFood?.measure_unit,
                                portions: sourceFood?.portions,
                              }, g)} className="pressable flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">{meal.food_name}</p>
                                  <p className="text-sm text-white">{meal.amount || "—"}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <p className="serif text-xl text-white">{meal.calories}</p>
                                  <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/30 text-white">
                                    <Settings2 className="h-3.5 w-3.5" />
                                  </div>
                                </div>
                              </button>
                              <button type="button" aria-label="Als Favorit speichern" onClick={() => toggleFavorite(meal.food_name, p100, g, meal.amount ?? `${g} g`)} className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/30 text-white">
                                <Star className={`h-3.5 w-3.5 transition-colors ${isFav ? "fill-white" : ""}`} />
                              </button>
                              <button type="button" aria-label="Mahlzeit löschen" onClick={() => deleteMeal(meal.id)} className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/30 text-white">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {isEditing && (
                              <div className="mx-4 mb-4 rounded-lg bg-white p-4">
                                <AmountStepper
                                  key={meal.id}
                                  amount={inlineGrams}
                                  measureUnit={inlineFood?.measureUnit}
                                  portions={inlineFood?.portions}
                                  onChange={(g, l) => { setInlineGrams(g); setInlineLabel(l ?? `${g} ${inlineFood?.measureUnit ?? "g"}`); }}
                                />
                                <button type="button" onClick={() => inlineUpdateMeal(meal.id)} className="mt-3 flex h-11 w-full items-center justify-center rounded-md bg-[var(--coral)] text-sm font-black text-white">
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

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "var(--coral)" }}>
          <div className="mx-auto max-w-md px-4 pb-6 pt-12">
            <p className="mb-2 text-[0.82rem] font-medium leading-[1.2] text-white">{formatGermanDate(date)}</p>
            <div className="flex items-center justify-between gap-3">
              <h2 className="serif min-w-0 text-[2.55rem] leading-none text-white">
                Deine Basis.
              </h2>
              <button
                type="button"
                aria-label="Profil schließen"
                onClick={() => setProfileModalOpen(false)}
                className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mx-auto max-w-md px-4 pb-32 pt-6">
            <ProfileSetupForm
              goalForm={goalForm}
              setGoalForm={setGoalForm}
              calculatedPreview={calculatedPreview}
              saving={saving}
              onSubmit={saveGoals}
              inverted
            />
          </div>
        </div>
      )}

      {toast && <div key={toast.id} className="toast">✓ {toast.msg}</div>}

      <footer className="pb-12 pt-2 text-center">
        <p className="serif text-2xl italic leading-snug text-[var(--coral)]">Dein Körper kennt die Antwort.<br />Wir hören gemeinsam hin.</p>
        <div className="mx-auto mt-8 max-w-xs">
          <button
            type="button"
            onClick={() => supabase?.auth.signOut()}
            className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[var(--espresso-14)] bg-white/70 text-sm font-extrabold text-[var(--espresso-70)] shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Ausloggen
          </button>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => setWithdrawConsentConfirm(true)}
              className="text-sm text-[var(--espresso-50)] underline decoration-[var(--espresso-28)] underline-offset-4"
            >
              Einwilligung widerrufen
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="text-sm text-red-600/70 underline decoration-red-300 underline-offset-4"
            >
              Konto löschen
            </button>
          </div>
        </div>
        {withdrawConsentConfirm && (
          <div className="mx-auto mt-4 max-w-xs rounded-xl border border-[var(--espresso-14)] bg-white/80 p-4 text-left">
            <p className="text-sm font-bold text-[var(--espresso)]">Einwilligung widerrufen?</p>
            <p className="mt-1 text-sm leading-5 text-[var(--espresso-50)]">
              Danach wirst du ausgeloggt und kannst den Tracker erst nach einer erneuten Einwilligung wieder nutzen.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setWithdrawConsentConfirm(false)}
                className="flex-1 rounded-lg border border-[var(--espresso-14)] bg-white py-2 text-sm font-bold text-[var(--espresso-50)]"
              >
                Abbrechen
              </button>
              <button
                onClick={withdrawHealthConsent}
                disabled={consentSaving}
                className="flex-1 rounded-lg bg-[var(--espresso)] py-2 text-sm font-bold text-white"
              >
                {consentSaving ? "Wird gespeichert…" : "Widerrufen"}
              </button>
            </div>
          </div>
        )}
        {deleteConfirm && (
          <div className="mx-auto mt-4 max-w-xs rounded-xl border border-red-200 bg-red-50 p-4 text-left">
            <p className="text-sm font-bold text-red-700">Konto wirklich löschen?</p>
            <p className="mt-1 text-sm text-red-500">Alle deine Daten, Einträge und Favoriten werden unwiderruflich gelöscht.</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-[var(--espresso-14)] bg-white py-2 text-sm font-bold text-[var(--espresso-50)]"
              >
                Abbrechen
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {deleting ? "Wird gelöscht…" : "Ja, löschen"}
              </button>
            </div>
          </div>
        )}
      </footer>
    </main>
  );
}

function SetupMissing() {
  return (
    <main className="app-shell grid place-items-center px-5">
      <section className="app-card max-w-md p-5">
        <p className="mb-3 text-[0.82rem] font-medium leading-[1.2] text-[var(--espresso-50)]">Setup</p>
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
  badge,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  badge?: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  function toggle() {
    if (open) playClose(); else playOpen();
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
          {badge}
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
      <span className="mb-2 block text-sm font-medium text-[var(--espresso-50)]">Wasser</span>
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
      <span className="mb-2 block text-sm font-medium text-[var(--espresso-50)]">Gewicht</span>
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
      <span className="mb-2 block text-sm font-medium text-[var(--espresso-50)]">{label}</span>
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
            className="pressable flex h-11 w-11 items-center justify-center rounded-md text-xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
          >
            -
          </button>
          <span className="serif text-xl text-[var(--espresso)]">{score}</span>
          <button
            type="button"
            onClick={() => onChange(String(Math.min(5, score + 1)))}
            className="pressable flex h-11 w-11 items-center justify-center rounded-md text-xl font-black text-[var(--espresso-50)] active:bg-[rgba(52,40,32,0.08)]"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSetupForm({
  goalForm,
  setGoalForm,
  calculatedPreview,
  saving,
  onSubmit,
  inverted,
}: {
  goalForm: typeof blankGoals;
  setGoalForm: (form: typeof blankGoals) => void;
  calculatedPreview: ReturnType<typeof calculateTargets>;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  inverted?: boolean;
}) {
  const inv = inverted;
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input inverted={inv} label="Gewicht kg" type="number" value={goalForm.current_weight} onChange={(value) => setGoalForm({ ...goalForm, current_weight: value })} required />
        <Input inverted={inv} label="Größe cm" type="number" value={goalForm.height_cm} onChange={(value) => setGoalForm({ ...goalForm, height_cm: value })} required />
        <Input inverted={inv} label="Alter" type="number" value={goalForm.age} onChange={(value) => setGoalForm({ ...goalForm, age: value })} required />
        <SelectField inverted={inv} label="Körper" value={goalForm.sex} onChange={(value) => setGoalForm({ ...goalForm, sex: value as Sex })} options={[{ value: "male", label: "Männlich" }, { value: "female", label: "Weiblich" }]} />
      </div>
      <SelectField inverted={inv} label="Aktivität" value={goalForm.activity_level} onChange={(value) => setGoalForm({ ...goalForm, activity_level: value as ActivityLevel })} options={(Object.keys(activityLabels) as ActivityLevel[]).map((value) => ({ value, label: activityLabels[value] }))} />
      <SelectField inverted={inv} label="Ziel" value={goalForm.goal_type} onChange={(value) => setGoalForm({ ...goalForm, goal_type: value as GoalType })} options={(Object.keys(goalLabels) as GoalType[]).map((value) => ({ value, label: goalLabels[value] }))} />
      <SelectField inverted={inv} label="Ernährungsform" value={goalForm.diet_type} onChange={(value) => setGoalForm({ ...goalForm, diet_type: value as DietType })} options={(Object.keys(dietLabels) as DietType[]).map((value) => ({ value, label: dietLabels[value] }))} />

      {calculatedPreview ? (
        <div className={`rounded-lg p-4 ${inv ? "bg-white/15" : "soft-card"}`}>
          <div className="mb-4 flex items-center gap-2">
            <Calculator className={`h-4 w-4 ${inv ? "text-white" : "text-[var(--coral)]"}`} />
            <p className={`text-sm font-black ${inv ? "text-white" : "text-[var(--espresso)]"}`}>Berechneter Startpunkt</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <PreviewMetric inverted={inv} label="kcal" value={calculatedPreview.calories} />
            <PreviewMetric inverted={inv} label="Protein" value={`${calculatedPreview.protein} g`} />
            <PreviewMetric inverted={inv} label="Carbs" value={`${calculatedPreview.carbs} g`} />
            <PreviewMetric inverted={inv} label="Fett" value={`${calculatedPreview.fat} g`} />
          </div>
          <p className={`mt-4 text-sm leading-5 ${inv ? "text-white" : "text-[var(--espresso-50)]"}`}>
            Diese Werte sind ein persönlicher Richtwert — kein starres Ziel.
          </p>
        </div>
      ) : null}

      <div className="pt-4">
        <p className={`mb-4 text-[0.82rem] font-medium leading-[1.2] ${inv ? "text-white" : "text-[var(--espresso-50)]"}`}>Persönliches Profil</p>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input inverted={inv} label="Wunschgewicht kg" type="number" value={goalForm.target_weight} onChange={(value) => setGoalForm({ ...goalForm, target_weight: value })} />
            <SelectField inverted={inv} label="Training / Woche" value={goalForm.training_frequency} onChange={(value) => setGoalForm({ ...goalForm, training_frequency: value })}
              options={[{ value: "0", label: "Kein Training" }, { value: "1", label: "1 Tag" }, { value: "2", label: "2 Tage" }, { value: "3", label: "3 Tage" }, { value: "4", label: "4 Tage" }, { value: "5", label: "5 Tage" }, { value: "6", label: "6 Tage" }, { value: "7", label: "Täglich" }]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input inverted={inv} label="Schlafziel Stunden" type="number" step="0.5" value={goalForm.sleep_goal_hours} onChange={(value) => setGoalForm({ ...goalForm, sleep_goal_hours: value })} />
            <SelectField inverted={inv} label="Alkohol" value={goalForm.alcohol_frequency} onChange={(value) => setGoalForm({ ...goalForm, alcohol_frequency: value })}
              options={[{ value: "nie", label: "Nie" }, { value: "selten", label: "Selten" }, { value: "1-2x", label: "1-2x pro Woche" }, { value: "oefter", label: "Öfter" }]}
            />
          </div>
          <ToggleRow inverted={inv} label="Zyklus / Periode relevant?" checked={goalForm.cycle_relevant} onChange={(checked) => setGoalForm({ ...goalForm, cycle_relevant: checked })} />
          <TextArea inverted={inv} label="Unverträglichkeiten" value={goalForm.intolerances} onChange={(value) => setGoalForm({ ...goalForm, intolerances: value })} placeholder="z.B. Laktose, Gluten, Nüsse..." />
          <TextArea inverted={inv} label="No-go Foods" value={goalForm.no_go_foods} onChange={(value) => setGoalForm({ ...goalForm, no_go_foods: value })} placeholder="Was kommt gar nicht auf den Teller?" />
          <TextArea inverted={inv} label="Lieblingsfoods" value={goalForm.favorite_foods} onChange={(value) => setGoalForm({ ...goalForm, favorite_foods: value })} placeholder="Was isst du besonders gerne?" />
        </div>
      </div>

      <div className="pt-2">
        <button className={`flex h-14 w-full items-center justify-center rounded-md text-base font-black pressable ${inv ? "bg-white text-[var(--coral)]" : "coral-button"}`}>
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Profil speichern"}
        </button>
      </div>
    </form>
  );
}

function PreviewMetric({ label, value, inverted }: { label: string; value: number | string; inverted?: boolean }) {
  return (
    <div>
      <p className={`serif text-xl ${inverted ? "text-white" : "text-[var(--espresso)]"}`}>{value}</p>
      <p className={`text-sm font-medium ${inverted ? "text-white" : "text-[var(--espresso-50)]"}`}>{label}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  inverted,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  inverted?: boolean;
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-medium ${inverted ? "text-white" : "text-[var(--espresso-50)]"}`}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inverted ? "field-inv" : "field"}>
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
  inverted,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inverted?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-medium ${inverted ? "text-white" : "text-[var(--espresso-50)]"}`}>{label}</span>
      <input value={value} onChange={(event) => { playType(); onChange(event.target.value); }} className={inverted ? "field-inv" : "field"} {...props} />
    </label>
  );
}

function TrainingEntriesEditor({
  entries,
  activity,
  duration,
  weight,
  saving,
  onActivityChange,
  onDurationChange,
  onAdd,
  onDelete,
}: {
  entries: TrainingEntry[];
  activity: string;
  duration: string;
  weight: number;
  saving: boolean;
  onActivityChange: (activity: string) => void;
  onDurationChange: (duration: string) => void;
  onAdd: () => void;
  onDelete: (entryId: string) => void;
}) {
  const met = TRAINING_ACTIVITIES.find((a) => a.value === activity)?.met ?? 5.0;
  const durationMin = Math.max(5, parseInt(duration) || 30);
  const kcal = calculateTrainingCalories(met, weight, durationMin);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--espresso-50)]">Sport heute</p>
          <p className="text-sm text-[var(--coral)]">ca. {kcal} kcal</p>
        </div>
        {entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((entry) => {
              const label = TRAINING_ACTIVITIES.find((item) => item.value === entry.activity)?.label ?? entry.activity;
              return (
                <div key={entry.id} className="soft-card flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--espresso)]">{label}</p>
                    <p className="text-sm text-[var(--espresso-50)]">{entry.duration_min} min · ca. {entry.calories} kcal</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`${label} löschen`}
                    onClick={() => onDelete(entry.id)}
                    disabled={saving}
                    className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[var(--espresso-50)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--espresso-14)] bg-white/55 p-3">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--espresso-50)]">Sportart</span>
            <div className="relative">
              <select
                value={activity}
                onChange={(event) => onActivityChange(event.target.value)}
                className="field serif appearance-none pr-12 text-xl text-[var(--espresso)]"
                style={{ fontWeight: 400 }}
              >
                {TRAINING_ACTIVITIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--espresso-50)]" />
            </div>
          </label>
          <div>
            <span className="mb-2 block text-sm font-medium text-[var(--espresso-50)]">Dauer</span>
            <div className="soft-card flex h-[52px] items-center rounded-md">
              <button
                type="button"
                aria-label="Dauer reduzieren"
                onClick={() => onDurationChange(String(Math.max(5, durationMin - 5)))}
                className="pressable h-full w-10 text-xl text-[var(--espresso-50)]"
              >
                −
              </button>
              <span className="serif min-w-16 text-center text-xl font-normal text-[var(--espresso)]">{durationMin} min</span>
              <button
                type="button"
                aria-label="Dauer erhöhen"
                onClick={() => onDurationChange(String(Math.min(300, durationMin + 5)))}
                className="pressable h-full w-10 text-xl text-[var(--espresso-50)]"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={saving}
          className="coral-button mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-bold"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Sportart hinzufügen
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CycleTracking({
  cycleDay,
  periodStart,
  flow,
  symptoms,
  onPeriodStartChange,
  onFlowChange,
  onSymptomsChange,
}: {
  cycleDay: number | null;
  periodStart: boolean;
  flow: "" | "light" | "medium" | "heavy";
  symptoms: string[];
  onPeriodStartChange: (periodStart: boolean) => void;
  onFlowChange: (flow: "" | "light" | "medium" | "heavy") => void;
  onSymptomsChange: (symptoms: string[]) => void;
}) {
  const showFlow = periodStart || Boolean(flow);

  function toggleSymptom(symptomId: string) {
    onSymptomsChange(
      symptoms.includes(symptomId)
        ? symptoms.filter((id) => id !== symptomId)
        : [...symptoms, symptomId],
    );
  }

  return (
    <section className="soft-card space-y-4 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(52,40,32,0.08)] pb-3">
        <p className="text-sm font-medium text-[var(--espresso-50)]">Zyklus</p>
        {cycleDay !== null && (
          <p className="text-sm text-[var(--espresso-50)]">
            Zyklustag <span className="serif ml-1 text-2xl text-[var(--coral)]">{cycleDay}</span>
          </p>
        )}
      </div>

      {cycleDay === null && !periodStart ? (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[var(--espresso-50)]">Noch kein Zyklus erfasst.</p>
          <button
            type="button"
            onClick={() => onPeriodStartChange(true)}
            className="pressable flex min-h-12 w-full items-center justify-center rounded-md border border-[var(--coral)] px-4 text-sm font-medium text-[var(--coral)]"
          >
            Periode heute starten
          </button>
        </div>
      ) : (
        <>
          {cycleDay !== null && cycleDay > 45 && (
            <p className="rounded-md bg-[rgba(240,107,93,0.10)] px-3 py-2 text-sm leading-5 text-[var(--coral-dark)]">
              Letzter Zyklus vor {cycleDay - 1} Tagen. Vielleicht wurde ein neuer Periodenstart noch nicht erfasst.
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--espresso-50)]">Periodenstart heute?</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: true, label: "Ja" },
                { value: false, label: "Nein" },
              ].map((option) => {
                const active = periodStart === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onPeriodStartChange(option.value)}
                    className={`pressable min-h-12 rounded-md border px-4 text-sm font-medium transition-colors ${
                      active
                        ? "border-[var(--coral)] bg-[var(--coral)] text-white"
                        : "border-[rgba(52,40,32,0.12)] bg-white/70 text-[var(--espresso-50)]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showFlow && (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--espresso-50)]">Stärke</p>
          <div className="grid grid-cols-3 gap-2">
            {CYCLE_FLOW_OPTIONS.map((option) => {
              const active = flow === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onFlowChange(option.value)}
                  className={`pressable min-h-12 rounded-md border px-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-[var(--coral)] bg-[var(--coral)] text-white"
                      : "border-[rgba(52,40,32,0.12)] bg-white/70 text-[var(--espresso-50)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-[var(--espresso-50)]">Symptome</p>
        <div className="flex flex-wrap gap-2">
          {CYCLE_SYMPTOMS.map((symptom) => {
            const active = symptoms.includes(symptom.id);
            return (
              <button
                key={symptom.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSymptom(symptom.id)}
                className={`pressable min-h-11 rounded-full border px-4 text-sm transition-colors ${
                  active
                    ? "border-[var(--coral)] bg-[var(--coral)] text-white"
                    : "border-[rgba(52,40,32,0.12)] bg-white/70 text-[var(--espresso-50)]"
                }`}
              >
                {symptom.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ToggleRow({ label, checked, onChange, inverted }: { label: string; checked: boolean; onChange: (checked: boolean) => void; inverted?: boolean }) {
  return (
    <label className={`flex items-center justify-between rounded-lg p-3 text-sm font-medium ${inverted ? "bg-white/15 text-white" : "soft-card text-[var(--espresso)]"}`}>
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
  const pct = Math.min((current / goal) * 100, 100);
  const done = pct >= 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-label="Kalorien heute"
      className="h-3 overflow-hidden rounded-full bg-[rgba(52,40,32,0.08)]"
    >
      <div
        className={`progress-fill h-full rounded-full transition-colors duration-700 ${done ? "bg-[#4a9e6f]" : "bg-[var(--coral)]"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function fmtG(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

function Macro({ label, value, goal }: { label: string; value: number; goal: number }) {
  const remaining = Math.max(goal - value, 0);
  const formatted = fmtG(remaining);
  const valueSize = formatted.length >= 5 ? "text-[1.25rem]" : "text-[1.55rem]";
  return (
    <div className="soft-card p-3">
      <p className="text-sm font-medium text-[var(--espresso-50)]">{label}</p>
      <p className={`serif mt-2 whitespace-nowrap leading-[1.05] tracking-[-0.035em] text-[var(--coral)] ${valueSize}`}>
        {formatted} g
      </p>
      <p className="mt-2 text-sm leading-none text-[var(--espresso-50)]">von {goal} g</p>
    </div>
  );
}

function AmountStepper({
  amount,
  onChange,
  stueckG,
  measureUnit = "g",
  portions,
}: {
  amount: number;
  onChange: (amount: number, label?: string) => void;
  stueckG?: number;
  measureUnit?: "g" | "ml";
  portions?: FoodResult["portions"];
}) {
  const availablePortions = portions ?? (stueckG ? [{ label: "Stück", amount: stueckG }] : []);
  const [unit, setUnit] = useState<"base" | string>(availablePortions[0]?.label ?? "base");
  const fmt = (n: number) => n % 1 === 0 ? `${n}` : n.toFixed(1);
  const selectedPortion = availablePortions.find((portion) => portion.label === unit);

  if (selectedPortion) {
    const count = Math.max(0.5, Math.round((amount / selectedPortion.amount) * 2) / 2);
    return (
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-[var(--espresso-50)]">Menge</span>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setUnit("base");
                onChange(amount, `${amount} ${measureUnit}`);
              }}
              className="text-sm font-medium text-[var(--coral)]"
            >
              {measureUnit}
            </button>
            {availablePortions.map((portion) => (
              <button
                key={portion.label}
                type="button"
                onClick={() => {
                  setUnit(portion.label);
                  onChange(portion.amount, `1 ${portion.label}`);
                }}
                className={`text-sm font-medium ${portion.label === unit ? "text-[var(--espresso)]" : "text-[var(--coral)]"}`}
              >
                {portion.label}
              </button>
            ))}
          </div>
        </div>
        <div className="soft-card flex items-center justify-between rounded-md p-2">
          <button
            type="button"
            onClick={() => {
              playStepDown();
              const next = Math.max(0.5, count - 0.5);
              onChange(Math.round(next * selectedPortion.amount), `${fmt(next)} ${selectedPortion.label}`);
            }}
            className="pressable flex size-14 items-center justify-center rounded-xl bg-white text-3xl font-black text-[var(--espresso-50)] shadow-sm active:bg-[var(--sand)]"
          >−</button>
          <div className="text-center">
            <span className="serif text-4xl text-[var(--espresso)]">{fmt(count)}</span>
            <span className="ml-1.5 text-base text-[var(--espresso-50)]">{selectedPortion.label}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playStepUp();
              const next = count + 0.5;
              onChange(Math.round(next * selectedPortion.amount), `${fmt(next)} ${selectedPortion.label}`);
            }}
            className="pressable flex size-14 items-center justify-center rounded-xl bg-white text-3xl font-black text-[var(--coral)] shadow-sm active:bg-[var(--sand)]"
          >+</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--espresso-50)]">Menge</span>
        {availablePortions.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            <span className="text-sm font-medium text-[var(--espresso)]">{measureUnit}</span>
            {availablePortions.map((portion) => (
              <button
                key={portion.label}
                type="button"
                onClick={() => {
                  setUnit(portion.label);
                  onChange(portion.amount, `1 ${portion.label}`);
                }}
                className="text-sm font-medium text-[var(--coral)]"
              >
                {portion.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="soft-card flex items-center justify-between rounded-md p-2">
        <button
          type="button"
          onClick={() => {
            playStepDown();
            const step = measureUnit === "ml" ? 50 : 10;
            const next = Math.max(0, amount - step);
            onChange(next, `${next} ${measureUnit}`);
          }}
          className="pressable flex size-14 items-center justify-center rounded-xl bg-white text-3xl font-black text-[var(--espresso-50)] shadow-sm active:bg-[var(--sand)]"
        >−</button>
        <div className="text-center">
          <span className="serif text-4xl text-[var(--espresso)]">{amount}</span>
          <span className="ml-1.5 text-base text-[var(--espresso-50)]">{measureUnit}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            playStepUp();
            const step = measureUnit === "ml" ? 50 : 10;
            const next = amount + step;
            onChange(next, `${next} ${measureUnit}`);
          }}
          className="pressable flex size-14 items-center justify-center rounded-xl bg-white text-3xl font-black text-[var(--coral)] shadow-sm active:bg-[var(--sand)]"
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
        <div className="relative">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            placeholder="Lebensmittel finden"
            className="field pr-16"
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[var(--espresso-50)]">
            {query ? (
              <button type="button" aria-label="Suche löschen" onClick={() => onQueryChange("")} className="flex h-8 w-8 items-center justify-center p-2">
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
                  <div className="bg-[rgba(241,231,214,0.7)] px-4 py-2 text-xs font-medium text-[var(--espresso-50)]">
                    Jens Lebensmittel
                  </div>
                )}
                {jenFoods.map((food) => (
                  <FoodItem key={food.id} food={food} onSelect={onSelect} onFavorite={onFavorite} isFavorite={favNames.has(food.name)} />
                ))}
              </>
            )}
            {searching && apiResults.length === 0 && query.length >= 2 && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--espresso-50)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Datenbank wird durchsucht...
              </div>
            )}
            {apiResults.length > 0 && (
              <>
                {showBoth && (
                  <div className="bg-[rgba(52,40,32,0.04)] px-4 py-2 text-xs font-medium text-[var(--espresso-50)]">
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
          <p className="truncate text-sm font-medium text-[var(--espresso)]">{food.name}</p>
          {food.brand ? <p className="truncate text-sm text-[var(--espresso-50)]">{food.brand}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="serif text-lg text-[var(--coral)]">{food.per100g.calories}</p>
          <p className="text-sm text-[var(--espresso-50)]">kcal</p>
          <p className="mt-0.5 text-sm text-[var(--espresso-50)]">P {food.per100g.protein} · C {food.per100g.carbs} · F {food.per100g.fat}</p>
        </div>
      </button>
      <button
        type="button"
        aria-label="Als Favorit speichern"
        onClick={() => onFavorite(food)}
        className="pressable flex w-11 shrink-0 items-center justify-center border-l border-[var(--espresso-08)] hover:bg-[rgba(240,107,93,0.05)]"
      >
        <Star className={`h-4 w-4 transition-colors ${isFavorite ? "fill-[var(--coral)] text-[var(--coral)]" : "text-[var(--espresso-28)]"}`} />
      </button>
    </div>
  );
}

function WaterStatus({ water }: { water: string }) {
  const liters = parseFloat(water) || 0;
  return (
    <div className="soft-card p-3">
      <p className="text-sm font-medium text-[var(--espresso-50)]">Wasser</p>
      <p className="serif mt-2 text-2xl text-[var(--espresso)]">{liters > 0 ? `${liters} l` : "—"}</p>
      <p className="text-sm text-[var(--espresso-50)]">getrunken</p>
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
        <p className="text-sm font-medium text-[var(--espresso-50)]">Körpergefühl</p>
        <p className="serif mt-2 text-2xl text-[var(--espresso)]">—</p>
        <p className="text-sm text-[var(--espresso-50)]">Check-In ausfüllen</p>
      </div>
    );
  }
  const score = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const dots = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="soft-card p-3">
      <p className="text-sm font-medium text-[var(--espresso-50)]">Körpergefühl</p>
      <div className="mt-2 flex gap-1">
        {dots.map((d) => (
          <span
            key={d}
            className={`h-2.5 w-2.5 rounded-full ${d <= Math.round(score) ? "bg-[var(--coral)]" : "bg-[rgba(52,40,32,0.14)]"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-sm text-[var(--espresso-50)]">{score} / 5</p>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  inverted,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inverted?: boolean;
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-medium ${inverted ? "text-white" : "text-[var(--espresso-50)]"}`}>{label}</span>
      <textarea
        value={value}
        onChange={(event) => { playType(); onChange(event.target.value); }}
        rows={2}
        className={`${inverted ? "field-inv" : "field"} h-auto min-h-16 py-3 text-sm`}
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
    const duration = 1400;
    const startTime = performance.now();

    cancelAnimationFrame(rafRef.current);
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
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
