import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { OperationManager } from "../OperationManager";
import type { Action, OperationInput } from "../types";

interface TestAction extends Action<string, { tileId: string; changes: { x: number } }> {}

function createMockOperation(id: string): OperationInput<TestAction> {
  return {
    apply: [{ type: "tile.setProperties", data: { tileId: id, changes: { x: 10 } } }],
    reverse: [{ type: "tile.setProperties", data: { tileId: id, changes: { x: 0 } } }],
  };
}

describe("OperationManager", () => {
  describe("constructor", () => {
    test("creates an instance with page ID", () => {
      const manager = new OperationManager<TestAction>("page-id");
      expect(manager).toBeInstanceOf(OperationManager);
      manager.dispose();
    });

    test("canUndo is false before load", () => {
      const manager = new OperationManager<TestAction>("page");
      expect(manager.canUndo).toBe(false);
      manager.dispose();
    });

    test("canRedo is false before load", () => {
      const manager = new OperationManager<TestAction>("page");
      expect(manager.canRedo).toBe(false);
      manager.dispose();
    });
  });

  describe("load", () => {
    test("resolves successfully on empty database", async () => {
      const manager = new OperationManager<TestAction>("page");
      await expect(manager.load()).resolves.toBeUndefined();
      manager.dispose();
    });

    test("is idempotent", async () => {
      const manager = new OperationManager<TestAction>("page");
      await manager.load();
      await manager.record(createMockOperation("1"));

      await manager.load();
      await manager.load();

      expect(manager.canUndo).toBe(true);

      await manager.clear();
      manager.dispose();
    });

    test("restores state from previous session", async () => {
      const manager1 = new OperationManager<TestAction>("page");
      await manager1.load();
      await manager1.record(createMockOperation("1"));
      manager1.dispose();

      const manager2 = new OperationManager<TestAction>("page");
      await manager2.load();

      expect(manager2.canUndo).toBe(true);

      await manager2.clear();
      manager2.dispose();
    });

    test("restores currentId pointer correctly", async () => {
      const manager1 = new OperationManager<TestAction>("page");
      await manager1.load();
      await manager1.record(createMockOperation("1"));
      await manager1.record(createMockOperation("2"));
      await manager1.undo();
      manager1.dispose();

      const manager2 = new OperationManager<TestAction>("page");
      await manager2.load();

      expect(manager2.canUndo).toBe(true);
      expect(manager2.canRedo).toBe(true);

      await manager2.clear();
      manager2.dispose();
    });

  });

  describe("persistence", () => {
    test("isolates data between different pages", async () => {
      const manager1 = new OperationManager<TestAction>("page-1");
      await manager1.load();
      await manager1.record(createMockOperation("1"));

      const manager2 = new OperationManager<TestAction>("page-2");
      await manager2.load();

      expect(manager2.canUndo).toBe(false);

      await manager1.clear();
      manager1.dispose();
      manager2.dispose();
    });

    // TODO: Add test for user isolation once userId scoping is implemented
  });

  describe("operations", () => {
    let manager: OperationManager<TestAction>;

    beforeEach(async () => {
      manager = new OperationManager<TestAction>("test-page");
      await manager.load();
    });

    afterEach(async () => {
      await manager.clear();
      manager.dispose();
    });

    describe("initial state", () => {
      test("canUndo is false when empty", () => {
        expect(manager.canUndo).toBe(false);
      });

      test("canRedo is false when empty", () => {
        expect(manager.canRedo).toBe(false);
      });
    });

    describe("record", () => {
      test("enables undo after recording an operation", async () => {
        await manager.record(createMockOperation("1"));
        expect(manager.canUndo).toBe(true);
      });

      test("canRedo remains false after recording", async () => {
        await manager.record(createMockOperation("1"));
        expect(manager.canRedo).toBe(false);
      });

      test("records multiple operations", async () => {
        await manager.record(createMockOperation("1"));
        await manager.record(createMockOperation("2"));
        await manager.record(createMockOperation("3"));

        expect(manager.canUndo).toBe(true);
      });
    });

    describe("undo", () => {
      test("returns the recorded operation", async () => {
        const op = createMockOperation("1");
        await manager.record(op);

        const result = await manager.undo();
        expect(result).toMatchObject(op);
        expect(result?.timestamp).toBeInstanceOf(Date);
      });

      test("returns null when nothing to undo", async () => {
        const result = await manager.undo();
        expect(result).toBeNull();
      });

      test("enables redo after undo", async () => {
        await manager.record(createMockOperation("1"));
        await manager.undo();

        expect(manager.canRedo).toBe(true);
      });

      test("disables undo after undoing the only operation", async () => {
        await manager.record(createMockOperation("1"));
        await manager.undo();

        expect(manager.canUndo).toBe(false);
      });

      test("returns operations in reverse order", async () => {
        await manager.record(createMockOperation("1"));
        await manager.record(createMockOperation("2"));
        await manager.record(createMockOperation("3"));

        const first = await manager.undo();
        const second = await manager.undo();
        const third = await manager.undo();

        expect(first).toMatchObject(createMockOperation("3"));
        expect(second).toMatchObject(createMockOperation("2"));
        expect(third).toMatchObject(createMockOperation("1"));
      });
    });

    describe("redo", () => {
      test("returns the undone operation", async () => {
        const op = createMockOperation("1");
        await manager.record(op);
        await manager.undo();

        const result = await manager.redo();
        expect(result).toMatchObject(op);
      });

      test("returns null when nothing to redo", async () => {
        const result = await manager.redo();
        expect(result).toBeNull();
      });

      test("enables undo after redo", async () => {
        await manager.record(createMockOperation("1"));
        await manager.undo();
        await manager.redo();

        expect(manager.canUndo).toBe(true);
      });

      test("disables redo after redoing the only undone operation", async () => {
        await manager.record(createMockOperation("1"));
        await manager.undo();
        await manager.redo();

        expect(manager.canRedo).toBe(false);
      });

      test("returns operations in forward order", async () => {
        await manager.record(createMockOperation("1"));
        await manager.record(createMockOperation("2"));
        await manager.undo();
        await manager.undo();

        const first = await manager.redo();
        const second = await manager.redo();

        expect(first).toMatchObject(createMockOperation("1"));
        expect(second).toMatchObject(createMockOperation("2"));
      });
    });

    describe("redo stack clearing", () => {
      test("clears redo stack when recording a new operation", async () => {
        await manager.record(createMockOperation("1"));
        await manager.record(createMockOperation("2"));
        await manager.undo();

        expect(manager.canRedo).toBe(true);

        await manager.record(createMockOperation("3"));

        expect(manager.canRedo).toBe(false);
      });

      test("redo returns null after recording clears redo stack", async () => {
        await manager.record(createMockOperation("1"));
        await manager.undo();
        await manager.record(createMockOperation("2"));

        const result = await manager.redo();
        expect(result).toBeNull();
      });
    });

    describe("clear", () => {
      test("removes all operations", async () => {
        await manager.record(createMockOperation("1"));
        await manager.record(createMockOperation("2"));
        await manager.clear();

        expect(manager.canUndo).toBe(false);
        expect(manager.canRedo).toBe(false);
      });

      test("clears redo stack too", async () => {
        await manager.record(createMockOperation("1"));
        await manager.undo();
        await manager.clear();

        expect(manager.canRedo).toBe(false);
      });
    });

    describe("prune", () => {
      test("limits the number of operations", async () => {
        // Record more than MAX_OPERATIONS (100)
        for (let i = 0; i < 110; i++) {
          await manager.record(createMockOperation(`op-${i}`));
        }

        // Should still be able to undo, but only 100 times
        let undoCount = 0;
        while (manager.canUndo) {
          await manager.undo();
          undoCount++;
        }

        expect(undoCount).toBe(100);
      });

      test("keeps the most recent operations when pruning", async () => {
        for (let i = 0; i < 110; i++) {
          await manager.record(createMockOperation(`op-${i}`));
        }

        // The most recent operation should be op-109
        const lastOp = await manager.undo();
        expect(lastOp).toMatchObject(createMockOperation("op-109"));

        // After undoing all, the oldest should be op-10 (0-9 were pruned)
        for (let i = 0; i < 98; i++) {
          await manager.undo();
        }
        const oldestOp = await manager.undo();
        expect(oldestOp).toMatchObject(createMockOperation("op-10"));
      });
    });
  });
});
