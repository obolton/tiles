import { BaseReactive } from "@/utils/reactivity";
import type { Awareness } from "./types";

export interface Peer {
  id: string;
  name: string;
  color: string;
  imageId: string | null;
}

interface AwarenessChange {
  added: number[];
  updated: number[];
  removed: number[];
}

const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});

export default class Presence extends BaseReactive<readonly Peer[]> {
  private readonly peers = new Map<number, Peer>();
  private cached: readonly Peer[] = [];
  private stale = true;
  private readonly onChange = this.handleChange.bind(this);

  constructor(private readonly awareness: Awareness) {
    super();
    for (const clientId of awareness.getStates().keys()) {
      this.add(clientId);
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

  dispose() {
    this.awareness.off("change", this.onChange);
    this.peers.clear();
    this.cached = [];
    this.stale = false;
    this.disconnect();
  }

  private handleChange({ added, updated, removed }: AwarenessChange) {
    let changed = false;
    // `updated` is included so a peer that publishes its `user` after first
    // appearing (e.g. a cursor before the user) is still picked up.
    for (const clientId of added) {
      changed = this.add(clientId) || changed;
    }
    for (const clientId of updated) {
      changed = this.add(clientId) || changed;
    }
    for (const clientId of removed) {
      changed = this.remove(clientId) || changed;
    }
    if (changed) {
      this.stale = true;
      this.notify();
    }
  }

  private add(clientId: number): boolean {
    if (clientId === this.awareness.clientID || this.peers.has(clientId)) {
      return false;
    }

    const user = this.awareness.getStates().get(clientId)?.user as
      | Peer
      | undefined;
    if (!user || typeof user.id !== "string") {
      return false;
    }

    this.peers.set(clientId, { ...user, imageId: user.imageId ?? null });
    return true;
  }

  private remove(clientId: number): boolean {
    return this.peers.delete(clientId);
  }
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
