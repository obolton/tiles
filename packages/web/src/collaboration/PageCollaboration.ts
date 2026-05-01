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
  static #current?: PageCollaboration;

  readonly pageId: string;
  readonly doc: Y.Doc;
  readonly status: Reactive<WebSocketStatus>;
  readonly synced: ReactiveFlag;

  #provider: HocuspocusProvider;
  #indexeddb: IndexeddbPersistence;
  #abort = new AbortController();
  #userColor: string | null = null;

  private constructor(pageId: string) {
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
        this.synced.on();
      },
    });

    user.subscribe(this.publishUser.bind(this), this.#abort.signal);
    this.synced.subscribe(this.publishUser.bind(this), this.#abort.signal);
    this.publishUser();
  }

  static init(pageId: string): PageCollaboration {
    if (this.#current?.pageId === pageId) {
      return this.#current;
    }
    this.#current?.dispose();
    this.#current = new PageCollaboration(pageId);
    return this.#current;
  }

  static get current(): PageCollaboration | undefined {
    return this.#current;
  }

  get awareness(): Awareness | null {
    return this.#provider.awareness;
  }

  dispose() {
    this.#abort.abort();
    this.#provider.destroy();
    this.#indexeddb.destroy();
    this.doc.destroy();

    if (PageCollaboration.#current === this) {
      PageCollaboration.#current = undefined;
    }
  }

  publishUser() {
    const u = user.value;
    const awareness = this.#provider.awareness;

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
