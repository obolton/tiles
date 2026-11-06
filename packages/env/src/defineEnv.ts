export type EnvValue = string | number | boolean | undefined;

export interface ValidateOptions {
  /** Throw when values are missing. When false, a warning is logged instead. Defaults to true. */
  strict?: boolean;
}

export type Env<Values extends Record<string, EnvValue>> = {
  readonly [Name in keyof Values]: Exclude<Values[Name], undefined>;
} & {
  validate(options?: ValidateOptions): void;
};

// Undefined and empty values are missing, as is NaN from converting a missing value to a number.
function isMissing(value: EnvValue) {
  return value === undefined || value === "" || Number.isNaN(value);
}

/**
 * Defines the environment variables used by a package. Reading a missing value throws, and
 * `validate()` reports every missing value at once, so call it when the process starts.
 */
export function defineEnv<Values extends Record<string, EnvValue>>(values: Values): Env<Values> {
  const env = {} as Env<Values>;

  for (const [name, value] of Object.entries(values)) {
    Object.defineProperty(env, name, {
      enumerable: true,
      get() {
        if (isMissing(value)) {
          throw new Error(`Missing environment variable: ${name}`);
        }
        return value;
      },
    });
  }

  Object.defineProperty(env, "validate", {
    value({ strict = true }: ValidateOptions = {}) {
      const missing = Object.entries(values)
        .filter(([, value]) => isMissing(value))
        .map(([name]) => name);
      if (missing.length === 0) {
        return;
      }
      const message = `Missing environment variables: ${missing.join(", ")}`;
      if (strict) {
        throw new Error(message);
      }
      console.warn(message);
    },
  });

  Object.freeze(env);
  return env;
}
