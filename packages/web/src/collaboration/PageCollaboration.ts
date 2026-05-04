import * as Y from "yjs";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import { IndexeddbPersistence } from "y-indexeddb";
import {
  reactive,
  flag,
  type Reactive,
  type ReactiveFlag,
} from "@/utils/reactivity";
import { user } from "@/utils/sessions";
import { getUserColor } from "./userColor";
import type { Awareness } from "./types";

const COLLABORATION_URL = import.meta.env.PUBLIC_COLLABORATION_URL;

export class PageCollaboration {
  readonly pageId: string;
  readonly doc: Y.Doc;
  readonly status: Reactive<WebSocketStatus>;
  readonly synced: ReactiveFlag;

  #provider: HocuspocusProvider | null = null;
  #indexeddb: IndexeddbPersistence | null = null;
  #abort = new AbortController();
  #userColor: string | null = null;

  constructor(pageId: string) {
    this.pageId = pageId;
    this.doc = new Y.Doc();
    this.status = reactive(WebSocketStatus.Connecting);
    this.synced = flag(false);

    if (!COLLABORATION_URL) {
      return;
    }

    this.#indexeddb = new IndexeddbPersistence(`tiles-yjs-${pageId}`, this.doc);

    this.#provider = new HocuspocusProvider({
      url: COLLABORATION_URL,
      name: `page:${pageId}`,
      document: this.doc,
      onStatus: ({ status }) => {
        this.status.value = status;
      },
      onSynced: () => {
        this.synced.on();
      },
    });

    user.subscribe(this.publishUser.bind(this), this.#abort.signal);
    this.synced.subscribe(this.publishUser.bind(this), this.#abort.signal);
    this.publishUser();
  }

  get awareness(): Awareness | null {
    return this.#provider?.awareness ?? null;
  }

  dispose() {
    this.#abort.abort();
    this.#provider?.destroy();
    this.#indexeddb?.destroy();
    this.doc.destroy();
  }

  publishUser() {
    const awareness = this.#provider?.awareness;
    const u = user.value;

    if (!u || !this.synced.value || !awareness) {
      return;
    }

    if (this.#userColor === null) {
      this.#userColor = getUserColor(awareness.getStates().size - 1);
    }

    awareness.setLocalStateField("user", {
      id: u.id,
      name: u.name,
      color: this.#userColor,
    });
  }
}
