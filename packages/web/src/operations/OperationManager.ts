import { Database, keyRange } from "@/utils/idb";
import type { Action, Operation, OperationInput } from "./types";

interface StoredOperationRecord<TAction extends Action> {
  id?: number;
  operation: Operation<TAction>;
}

interface StoredMeta {
  key: string;
  currentId: number | null;
  lastId: number | null;
}

const schema = {
  operations: {
    keyPath: "id",
    autoIncrement: true,
  },
  meta: {
    keyPath: "key",
  },
} as const;

const META_KEY = "state";
const MAX_OPERATIONS = 100;

export class OperationManager<TAction extends Action> {
  private readonly db: Database<typeof schema>;
  private readonly operationsStore;
  private readonly metaStore;

  private currentId: number | null = null;
  private lastId: number | null = null;
  private loadPromise: Promise<void> | null = null;

  // TODO: Scope database by userId to prevent data leakage between accounts.
  // This requires refactoring initialization to make userId available synchronously.
  constructor(pageId: string) {
    this.db = new Database({
      name: `tiles-undo-${pageId}`,
      version: 1,
      schema,
    });
    this.operationsStore =
      this.db.store<StoredOperationRecord<TAction>>("operations");
    this.metaStore = this.db.store<StoredMeta>("meta");
  }

  get canUndo(): boolean {
    return this.currentId !== null;
  }

  get canRedo(): boolean {
    return (this.currentId ?? 0) < (this.lastId ?? 0);
  }

  load(): Promise<void> {
    return (this.loadPromise ??= this.metaStore.get(META_KEY).then((meta) => {
      this.currentId = meta?.currentId ?? null;
      this.lastId = meta?.lastId ?? null;
    }));
  }

  private async persistMeta(): Promise<void> {
    await this.metaStore.put({
      key: META_KEY,
      currentId: this.currentId,
      lastId: this.lastId,
    });
  }

  async record(input: OperationInput<TAction>): Promise<void> {
    await this.load();

    // Delete redo stack
    if (this.currentId !== null) {
      await this.operationsStore.delete(
        keyRange({ lower: this.currentId, lowerOpen: true }),
      );
    } else if (this.lastId !== null) {
      // currentId is null but we have operations - clear all
      await this.operationsStore.clear();
    }

    // Normalize single actions to arrays
    const operation: Operation<TAction> = {
      apply: Array.isArray(input.apply) ? input.apply : [input.apply],
      reverse: Array.isArray(input.reverse) ? input.reverse : [input.reverse],
      timestamp: new Date(),
      ...(input.coalesceKey && { coalesceKey: input.coalesceKey }),
    };
    const id = await this.operationsStore.add({ operation });
    if (typeof id !== "number") {
      throw new Error("Expected numeric auto-increment key");
    }

    this.currentId = id;
    this.lastId = id;

    await this.persistMeta();
    await this.prune();
  }

  async undo(): Promise<Operation<TAction> | null> {
    await this.load();

    const currentId = this.currentId;
    if (currentId === null) {
      return null;
    }

    // Get current operation
    const current = await this.operationsStore.get(currentId);
    if (!current) {
      return null;
    }

    // Find previous operation
    const [previous] = await this.operationsStore.query({
      query: keyRange({ upper: currentId, upperOpen: true }),
      direction: "prev",
      limit: 1,
    });

    this.currentId = previous?.id ?? null;
    await this.persistMeta();

    return current.operation;
  }

  async redo(): Promise<Operation<TAction> | null> {
    await this.load();

    if (!this.canRedo) {
      return null;
    }

    // Find next operation
    const [next] = await this.operationsStore.query({
      query: keyRange({ lower: this.currentId ?? 0, lowerOpen: true }),
      direction: "next",
      limit: 1,
    });

    if (!next?.id) {
      return null;
    }

    this.currentId = next.id;
    await this.persistMeta();

    return next.operation;
  }

  private async prune(): Promise<void> {
    const totalCount = await this.operationsStore.count();
    const excess = totalCount - MAX_OPERATIONS;
    if (excess <= 0) {
      return;
    }

    const keys = await this.operationsStore.getKeys(undefined, excess);
    const cutoffId = keys[keys.length - 1];
    if (cutoffId !== undefined) {
      await this.operationsStore.delete(keyRange({ upper: cutoffId }));
    }
  }

  async clear(): Promise<void> {
    await Promise.all([this.operationsStore.clear(), this.metaStore.clear()]);
    this.currentId = null;
    this.lastId = null;
  }

  dispose(): void {
    this.db.close();
  }
}
