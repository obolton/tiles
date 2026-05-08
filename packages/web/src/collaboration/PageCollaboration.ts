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

  #provider: HocuspocusProvider;
  #indexeddb: IndexeddbPersistence;
  #abort = new AbortController();
  #userColor: string | null = null;

  constructor(pageId: string, onSynced: () => void) {
    if (!COLLABORATION_URL) {
      throw new Error("PUBLIC_COLLABORATION_URL is not set");
    }

    this.pageId = pageId;
    this.doc = new Y.Doc();
    this.status = reactive(WebSocketStatus.Connecting);
    this.synced = flag(false);

    this.#indexeddb = new IndexeddbPersistence(`tiles-yjs-${pageId}`, this.doc);

    this.#provider = new HocuspocusProvider({
      url: COLLABORATION_URL,
      name: `page:${pageId}`,
      document: this.doc,
      onStatus: ({ status }) => {
        this.status.value = status;
      },
      onSynced: () => {
        if (this.synced.value) {
          return;
        }
        this.synced.on();
        onSynced();
      },
    });

    user.subscribe(this.publishUser.bind(this), this.#abort.signal);
    this.synced.subscribe(this.publishUser.bind(this), this.#abort.signal);
    this.publishUser();
  }

  get awareness(): Awareness | null {
    return this.#provider.awareness ?? null;
  }

  dispose() {
    this.#abort.abort();
    this.#provider.destroy();
    this.#indexeddb.destroy();
    this.doc.destroy();
  }

  publishUser() {
    const awareness = this.#provider.awareness;
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
