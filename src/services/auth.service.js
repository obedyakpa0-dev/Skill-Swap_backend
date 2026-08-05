import { createSupabaseClient } from "../config/supabase.js";

/**
 * Registers a new user in Supabase Auth, then creates the matching row in
 * `profiles` (7.1). Student ID upload itself happens via a separate route
 * (POST /profiles/:id/student-id) after the account exists — this function
 * just creates the account and leaves verification_status = 'pending'.
 */
export async function registerUser({
  email,
  password,
  full_name,
  school,
  department,
  level,
}) {
  const serviceSupabase = createSupabaseClient();
  const { data: authData, error: authError } =
    await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // set false if you want Supabase to send a confirmation email instead
    });

  if (authError) {
    const err = new Error(authError.message);
    err.status = 400;
    throw err;
  }

  const userId = authData.user.id;

  const { data: profile, error: profileError } = await serviceSupabase
    .from("profiles")
    .insert({
      id: userId,
      full_name,
      school,
      department,
      level,
      verification_status: "pending",
      verified: false,
      reputation_score: 0,
      gamification_points: 0,
      rank: "Bronze Mentor",
    })
    .select()
    .single();

  if (profileError) {
    // Roll back the auth user so we don't end up with an orphaned account.
    await supabase.auth.admin.deleteUser(userId);
    const err = new Error(profileError.message);
    err.status = 400;
    throw err;
  }

  return { user: authData.user, profile };
}

/**
 * Logs a user in via Supabase Auth and returns the session (access_token,
 * refresh_token) the frontend should store and send back as
 * `Authorization: Bearer <access_token>` on future requests.
 */
export async function loginUser({ email, password }) {
  const authSupabase = createSupabaseClient();
  const { data, error } = await authSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  const profile = await getCurrentProfile(data.user.id);
  return { ...data, profile }; // { user, session, profile }
}

/**
 * Server-side logout: revokes the given access token so it can no longer
 * be used, in case the frontend copy leaks (device shared, tab left open).
 * The frontend should also clear its locally stored token regardless.
 */
export async function logoutUser(accessToken) {
  const serviceSupabase = createSupabaseClient();
  const { error } = await serviceSupabase.auth.admin.signOut(accessToken);
  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
}

/**
 * GET /auth/me — returns the profile row for the currently authenticated
 * user (req.user.id is set by requireAuth middleware).
 */

export async function getCurrentProfile(
  userId,
  client = createSupabaseClient(),
) {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    // PGRST116 = Supabase's code for "no rows matched" — a real 404.
    // Anything else (network failure, timeout, etc.) should surface as
    // a real error, not be disguised as "not found".
    if (error.code === "PGRST116") {
      const err = new Error("Profile not found.");
      err.status = 404;
      throw err;
    }
    const err = new Error(`Database error: ${error.message}`);
    err.status = 500;
    throw err;
  }

  return data;
}
