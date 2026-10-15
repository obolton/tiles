// Test environment shared by the jsdom and browser configs.
export const testEnv = {
  GOOGLE_CLIENT_ID: "test-client-id",
  GOOGLE_CLIENT_SECRET: "test-client-secret",
  GOOGLE_REDIRECT_URI: "http://localhost:3000/sign-in/google/callback",
  PUBLIC_API_ORIGIN: "https://api.test",
  PUBLIC_FONTS_BASE_URL: "https://test-fonts.example.com",
  PUBLIC_IMAGES_BASE_URL: "https://images.test",
  PUBLIC_PROFILE_IMAGES_BASE_URL: "https://profile-images.test",
};
