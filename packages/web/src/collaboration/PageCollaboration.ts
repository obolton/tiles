import * as Y from "yjs";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import { IndexeddbPersistence } from "y-indexeddb";
import { reactive, flag, type Reactive, type ReactiveFlag } from "reactivity";
import { Awareness } from "y-protocols/awareness";
import { user } from "@/utils/sessions";
import { publicEnv } from "@/env/public";
import { getUserColor } from "./userColor";
import Presence from "./Presence";

export class PageCollaboration {
  readonly pageId: string;
  readonly doc: Y.Doc;
  readonly status: Reactive<WebSocketStatus>;
  readonly synced: ReactiveFlag;
  readonly awareness: Awareness;
  readonly presence: Presence;

  #provider: HocuspocusProvider;
  #indexeddb: IndexeddbPersistence;
  #abort = new AbortController();
  #userColor: string | null = null;

  constructor(pageId: string, doc: Y.Doc) {
    this.pageId = pageId;
    this.doc = doc;
    this.status = reactive(WebSocketStatus.Connecting);
    this.synced = flag(false);

    this.#indexeddb = new IndexeddbPersistence(`tiles-yjs-${pageId}`, this.doc);

    this.awareness = new Awareness(this.doc);
    this.presence = new Presence(this.awareness);

    this.#provider = new HocuspocusProvider({
      url: publicEnv.PUBLIC_COLLABORATION_URL,
      name: `page:${pageId}`,
      document: this.doc,
      awareness: this.awareness,
      onStatus: ({ status }) => {
        this.status.value = status;
      },
      onSynced: () => {
        if (this.synced.value) {
          return;
        }
        this.synced.on();
      },
    });

    user.subscribe(this.publishUser.bind(this), this.#abort.signal);
    this.synced.subscribe(this.publishUser.bind(this), this.#abort.signal);
    this.publishUser();
  }

  /**
   * Ends the collaboration session.
   */
  dispose() {
    this.#abort.abort();
    this.presence.dispose();
    this.#provider.destroy();
    void this.#indexeddb.destroy();
  }

  publishUser() {
    const u = user.value;

    if (!u || !this.synced.value) {
      return;
    }

    if (this.#userColor === null) {
      this.#userColor = getUserColor(this.awareness.getStates().size - 1);
    }

    this.awareness.setLocalStateField("user", {
      id: u.id,
      name: u.name,
      color: this.#userColor,
      imageId: u.imageKey ?? null,
    });
  }

  publishSelection(ids: string[]) {
    this.awareness.setLocalStateField("selection", ids);
  }
}
