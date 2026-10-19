import * as Y from "yjs";
import { ySyncPluginKey } from "y-prosemirror";
import { flag, type ReactiveFlag } from "reactivity";

export interface UndoStepHooks {
  onRecord?(meta: Map<unknown, unknown>): void;
  onApply?(meta: Map<unknown, unknown>): void;
}

export class PageUndoManager {
  readonly manager: Y.UndoManager;
  readonly canUndo: ReactiveFlag = flag(false);
  readonly canRedo: ReactiveFlag = flag(false);

  constructor(doc: Y.Doc, hooks?: UndoStepHooks) {
    this.manager = new Y.UndoManager(doc.getMap("tiles"), {
      trackedOrigins: new Set([null, ySyncPluginKey]),
      captureTimeout: 500,
    });

    this.syncState = this.syncState.bind(this);
    this.manager.on("stack-item-added", this.syncState);
    this.manager.on("stack-item-popped", this.syncState);
    this.manager.on("stack-cleared", this.syncState);
    this.manager.on("stack-item-updated", this.syncState);

    const { onRecord, onApply } = hooks ?? {};
    if (onRecord) {
      this.manager.on("stack-item-added", ({ stackItem }) => onRecord(stackItem.meta));
    }
    if (onApply) {
      this.manager.on("stack-item-popped", ({ stackItem }) => onApply(stackItem.meta));
    }
  }

  undo() {
    this.manager.undo();
  }

  redo() {
    this.manager.redo();
  }

  /**
   * Forces the next change to begin a new undo step.
   */
  stopCapturing() {
    this.manager.stopCapturing();
  }

  dispose() {
    this.manager.destroy();
  }

  private syncState() {
    this.canUndo.value = this.manager.canUndo();
    this.canRedo.value = this.manager.canRedo();
  }
}
