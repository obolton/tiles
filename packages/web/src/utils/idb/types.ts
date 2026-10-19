/**
 * Definition for an index on an object store.
 */
export interface IndexDefinition {
  /** The key path(s) for the index */
  keyPath: string | string[];
  /** Whether values in the index must be unique */
  unique?: boolean;
  /** Whether array values should create multiple index entries */
  multiEntry?: boolean;
}

/**
 * Definition for an object store in the schema.
 */
export interface StoreDefinition {
  /** The key path for inline keys. Omit for out-of-line keys. */
  keyPath?: string | string[];
  /** Whether to auto-generate keys */
  autoIncrement?: boolean;
  /** Index definitions for this store */
  indexes?: Record<string, IndexDefinition>;
}

/**
 * A schema definition mapping store names to their definitions.
 */
export type SchemaDefinition = Record<string, StoreDefinition>;

/**
 * Options for opening a database.
 */
export interface DatabaseOptions<Schema extends SchemaDefinition> {
  /** Database name */
  name: string;
  /** Database version (increment to trigger upgrade) */
  version: number;
  /** Schema definition for stores and indexes */
  schema: Schema;
}
