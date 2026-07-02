import { BaseReactive, array } from "@/utils/reactivity";
import type { Reactive, ReactiveArray } from "@/utils/reactivity";
import type { Awareness } from "./types";

export interface Peer {
  clientId: number;
  id: string;
  name: string;
  color: string;
  imageId: string | null;
}

type PublishedUser = Omit<Peer, "clientId">;

interface AwarenessChange {
  added: number[];
  updated: number[];
  removed: number[];
}

const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});

const EMPTY: ReadonlySet<string> = new Set();

export default class Presence extends BaseReactive<readonly Peer[]> {
  private readonly peers = new Map<number, Peer>();
  private readonly selections = new Map<number, Set<string>>();
  private readonly occupants = new Map<string, Set<number>>();
  private readonly views = new Map<string, ReactiveArray<Peer>>();

  private cached: readonly Peer[] = [];
  private stale = true;
  private readonly onChange = this.handleChange.bind(this);

  constructor(private readonly awareness: Awareness) {
    super();
    for (const clientId of awareness.getStates().keys()) {
      this.sync(clientId);
    }
    awareness.on("change", this.onChange);
  }

  get value(): readonly Peer[] {
    if (this.stale) {
      this.cached = Array.from(this.peers.values()).sort(comparePeers);
      this.stale = false;
    }
    return this.cached;
  }

  peersForTile(tileId: string): Reactive<readonly Peer[]> {
    let view = this.views.get(tileId);
    if (!view) {
      view = array(this.peersOn(tileId));
      this.views.set(tileId, view);
    }
    return view;
  }

  getActiveTile(clientId: number): string | null {
    return this.selections.get(clientId)?.values().next().value ?? null;
  }

  dispose() {
    this.awareness.off("change", this.onChange);
    this.peers.clear();
    this.selections.clear();
    this.occupants.clear();
    this.views.clear();
    this.cached = [];
    this.stale = false;
    this.disconnect();
  }

  private handleChange({ added, updated, removed }: AwarenessChange) {
    let rosterChanged = false;

    for (const clientId of added) {
      rosterChanged = this.sync(clientId) || rosterChanged;
    }
    for (const clientId of updated) {
      rosterChanged = this.sync(clientId) || rosterChanged;
    }
    for (const clientId of removed) {
      rosterChanged = this.forget(clientId) || rosterChanged;
    }

    if (rosterChanged) {
      this.stale = true;
      this.notify();
    }
  }

  private sync(clientId: number): boolean {
    if (clientId === this.awareness.clientID) {
      return false;
    }

    const state = this.awareness.getStates().get(clientId);
    const user = state?.user as PublishedUser | undefined;
    if (!user || typeof user.id !== "string") {
      return this.forget(clientId);
    }

    const added = this.addPeer(clientId, user);
    this.updateSelection(clientId, readSelection(state));
    return added;
  }

  private addPeer(clientId: number, user: PublishedUser): boolean {
    if (this.peers.has(clientId)) {
      return false;
    }
    this.peers.set(clientId, {
      ...user,
      clientId,
      imageId: user.imageId ?? null,
    });
    return true;
  }

  private updateSelection(clientId: number, next: Set<string>) {
    const previous = this.selections.get(clientId) ?? EMPTY;

    for (const tileId of previous) {
      if (!next.has(tileId)) {
        this.leave(clientId, tileId);
      }
    }
    for (const tileId of next) {
      if (!previous.has(tileId)) {
        this.enter(clientId, tileId);
      }
    }

    if (next.size > 0) {
      this.selections.set(clientId, next);
    } else {
      this.selections.delete(clientId);
    }
  }

  private forget(clientId: number): boolean {
    for (const tileId of this.selections.get(clientId) ?? EMPTY) {
      this.leave(clientId, tileId);
    }
    this.selections.delete(clientId);
    return this.peers.delete(clientId);
  }

  private enter(clientId: number, tileId: string) {
    let occupants = this.occupants.get(tileId);
    if (!occupants) {
      occupants = new Set();
      this.occupants.set(tileId, occupants);
    }
    occupants.add(clientId);
    this.refresh(tileId);
  }

  private leave(clientId: number, tileId: string) {
    const occupants = this.occupants.get(tileId);
    if (!occupants) {
      return;
    }
    occupants.delete(clientId);
    if (occupants.size === 0) {
      this.occupants.delete(tileId);
    }
    this.refresh(tileId);
  }

  private refresh(tileId: string) {
    this.views.get(tileId)?.replace(this.peersOn(tileId));
  }

  private peersOn(tileId: string): Peer[] {
    const occupants = this.occupants.get(tileId);
    if (!occupants) {
      return [];
    }
    const peers: Peer[] = [];
    for (const clientId of occupants) {
      const peer = this.peers.get(clientId);
      if (peer) {
        peers.push(peer);
      }
    }
    // Occupant insertion order is oldest-first
    return peers.reverse();
  }
}

function readSelection(
  state: Record<string, unknown> | undefined,
): Set<string> {
  const raw = state?.selection;
  if (!Array.isArray(raw)) {
    return new Set();
  }
  return new Set(raw.filter((id): id is string => typeof id === "string"));
}

function comparePeers(a: Peer, b: Peer): number {
  const order = collator.compare(a.name, b.name);
  if (order !== 0) {
    return order;
  }
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}
