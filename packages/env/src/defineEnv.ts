export interface EnvDefinition<Required extends Record<string, unknown>> {
  required: Required;
}

export interface ValidateOptions {
  /** Throw when values are missing. When false, a warning is logged instead. Defaults to true. */
  strict?: boolean;
}

export type Env<Required extends Record<string, unknown>> = {
  readonly [Name in keyof Required]: NonNullable<Required[Name]>;
} & {
  validate(options?: ValidateOptions): void;
};

function isMissing(value: unknown) {
  return !value;
}

/**
 * Defines the environment variables used by a package. Reading a missing required value throws,
 * and `validate()` reports every missing value at once, so call it when the process starts.
 */
export function defineEnv<Required extends Record<string, unknown>>({
  required,
}: EnvDefinition<Required>): Env<Required> {
  const names = Object.keys(required);
  const descriptors: PropertyDescriptorMap = {};

  for (const name of names) {
    descriptors[name] = {
      enumerable: true,
      get() {
        const value = required[name];
        if (isMissing(value)) {
          throw new Error(`Missing environment variable: ${name}`);
        }
        return value;
      },
    };
  }

  descriptors.validate = {
    value({ strict = true }: ValidateOptions = {}) {
      const missing = names.filter((name) => isMissing(required[name]));
      if (missing.length === 0) {
        return;
      }
      const message = `Missing environment variables: ${missing.join(", ")}`;
      if (strict) {
        throw new Error(message);
      }
      console.warn(message);
    },
  };

  return Object.freeze(Object.defineProperties({}, descriptors)) as Env<Required>;
}
