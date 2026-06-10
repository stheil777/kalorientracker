alter table public.profiles
add column if not exists current_weight numeric(6, 2),
add column if not exists height_cm integer,
add column if not exists age integer,
add column if not exists sex text check (sex in ('male', 'female')),
add column if not exists activity_level text check (activity_level in ('low', 'light', 'moderate', 'high')),
add column if not exists goal_type text check (goal_type in ('lose', 'maintain', 'gain')),
add column if not exists diet_type text check (diet_type in ('balanced', 'high_protein', 'vegetarian', 'vegan', 'low_carb')),
add column if not exists calculated_tdee integer;
