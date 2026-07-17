export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export const OAUTH_STATE_COOKIE = "vmt_oauth_state";
