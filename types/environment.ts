export type EnvironmentVariables = {
  NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY: string;
  NEXT_PUBLIC_EDAMAM_APP_ID: string;
  NEXT_PUBLIC_EDAMAM_APP_KEY: string;
};

declare global {
  interface Window {
    ENV?: EnvironmentVariables;
  }
}

export type EnvVarKey = keyof EnvironmentVariables;
