export type EnvValue = string | number | boolean | undefined;

export type Env<Values extends Record<string, EnvValue>> = Readonly<{
  [Name in keyof Values]: Exclude<Values[Name], undefined>;
}>;

// Undefined and empty values are missing, as is NaN from converting a missing value to a number.
function isMissing(value: EnvValue) {
  return value === undefined || value === "" || Number.isNaN(value);
}

/**
 * Defines the environment variables used by a package. Every value is validated up front, so a
 * missing variable throws where the registry is created.
 */
export function defineEnv<Values extends Record<string, EnvValue>>(values: Values): Env<Values> {
  const missing = Object.entries(values)
    .filter(([, value]) => isMissing(value))
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
  return Object.freeze({ ...values }) as Env<Values>;
}
