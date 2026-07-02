import { afterEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import Presence, { type Peer } from "../Presence";

type UserInput = Partial<Peer> & { id: string; name: string };

function setUser(instance: Awareness, user: UserInput) {
  instance.setLocalStateField("user", {
    color: "#ffffff",
    imageId: null,
    ...user,
  });
}

function setSelection(instance: Awareness, tileIds: string[]) {
  instance.setLocalStateField("selection", tileIds);
}

function sync(local: Awareness, remote: Awareness) {
  applyAwarenessUpdate(local, encodeAwarenessUpdate(remote, [remote.clientID]), "remote");
}

function peer(client: Awareness, id: string, name: string, extra: Partial<Peer> = {}): Peer {
  return {
    clientId: client.clientID,
    id,
    name,
    color: "#ffffff",
    imageId: null,
    ...extra,
  };
}

describe("Presence", () => {
  const clients: Awareness[] = [];

  afterEach(() => {
    for (const client of clients) {
      client.destroy();
    }
    clients.length = 0;
  });

  function client(user?: UserInput): Awareness {
    const instance = new Awareness(new Y.Doc());
    clients.push(instance);
    if (user) {
      setUser(instance, user);
    }
    return instance;
  }

  test("lists remote peers sorted by name, excluding our own client", () => {
    const local = client({ id: "u1", name: "Me" });
    const bob = client({ id: "u2", name: "Bob" });
    const ann = client({ id: "u3", name: "Ann" });
    sync(local, bob);
    sync(local, ann);

    const presence = new Presence(local);

    expect(presence.value).toEqual([peer(ann, "u3", "Ann"), peer(bob, "u2", "Bob")]);
  });

  test("normalizes a missing imageId to null", () => {
    const local = client();
    const bob = client();
    bob.setLocalStateField("user", { id: "u2", name: "Bob", color: "#fff" });
    sync(local, bob);

    const presence = new Presence(local);

    expect(presence.value).toEqual([peer(bob, "u2", "Bob", { color: "#fff" })]);
  });

  test("adds a peer on join and notifies once", () => {
    const local = client();
    const presence = new Presence(local);
    const subscriber = vi.fn();
    presence.subscribe(subscriber);

    const bob = client({ id: "u2", name: "Bob" });
    sync(local, bob);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(presence.value).toEqual([peer(bob, "u2", "Bob")]);
  });

  test("removes a peer on leave and notifies", () => {
    const local = client();
    const bob = client({ id: "u2", name: "Bob" });
    sync(local, bob);
    const presence = new Presence(local);
    const subscriber = vi.fn();
    presence.subscribe(subscriber);

    removeAwarenessStates(local, [bob.clientID], "remote");

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(presence.value).toEqual([]);
  });

  test("ignores cursor-only updates to an existing peer", () => {
    const local = client();
    const bob = client({ id: "u2", name: "Bob" });
    sync(local, bob);
    const presence = new Presence(local);
    const before = presence.value;
    const subscriber = vi.fn();
    presence.subscribe(subscriber);

    bob.setLocalStateField("cursor", { anchor: 1, head: 2 });
    sync(local, bob);

    expect(subscriber).not.toHaveBeenCalled();
    expect(presence.value).toBe(before); // not even recomputed
  });

  test("picks up a peer that publishes its user after first appearing", () => {
    const local = client();
    const presence = new Presence(local);
    const subscriber = vi.fn();
    presence.subscribe(subscriber);

    const bob = client();
    bob.setLocalStateField("cursor", { anchor: 0, head: 0 }); // connected, no user
    sync(local, bob);
    expect(subscriber).not.toHaveBeenCalled();
    expect(presence.value).toEqual([]);

    setUser(bob, { id: "u2", name: "Bob" });
    sync(local, bob);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(presence.value).toEqual([peer(bob, "u2", "Bob")]);
  });

  test("stops notifying after dispose", () => {
    const local = client();
    sync(local, client({ id: "u2", name: "Bob" }));
    const presence = new Presence(local);
    const subscriber = vi.fn();
    presence.subscribe(subscriber);

    presence.dispose();
    sync(local, client({ id: "u3", name: "Ann" }));

    expect(subscriber).not.toHaveBeenCalled();
    expect(presence.value).toEqual([]);
  });

  describe("forTile", () => {
    test("reports a peer that selects the tile and notifies once", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      const presence = new Presence(local);

      const tile = presence.peersForTile("t1");
      const subscriber = vi.fn();
      tile.subscribe(subscriber);

      setSelection(bob, ["t1"]);
      sync(local, bob);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(tile.value).toEqual([peer(bob, "u2", "Bob")]);
    });

    test("returns current occupants when called after the selection", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      setSelection(bob, ["t1"]);
      const presence = new Presence(local);
      sync(local, bob);

      expect(presence.peersForTile("t1").value).toEqual([peer(bob, "u2", "Bob")]);
    });

    test("moves a peer between tiles, notifying both", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      setSelection(bob, ["a"]);
      const presence = new Presence(local);
      sync(local, bob);

      const a = presence.peersForTile("a");
      const b = presence.peersForTile("b");
      const aSub = vi.fn();
      const bSub = vi.fn();
      a.subscribe(aSub);
      b.subscribe(bSub);

      setSelection(bob, ["b"]);
      sync(local, bob);

      expect(aSub).toHaveBeenCalledTimes(1);
      expect(bSub).toHaveBeenCalledTimes(1);
      expect(a.value).toEqual([]);
      expect(b.value).toEqual([peer(bob, "u2", "Bob")]);
    });

    test("orders peers most-recently-selected first", () => {
      const local = client();
      const ann = client({ id: "u1", name: "Ann" });
      const bob = client({ id: "u2", name: "Bob" });
      const presence = new Presence(local);

      setSelection(ann, ["t"]);
      sync(local, ann);
      setSelection(bob, ["t"]);
      sync(local, bob);

      expect(presence.peersForTile("t").value).toEqual([
        peer(bob, "u2", "Bob"),
        peer(ann, "u1", "Ann"),
      ]);
    });

    test("clears a peer's tiles when it disconnects", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      setSelection(bob, ["t"]);
      const presence = new Presence(local);
      sync(local, bob);

      const tile = presence.peersForTile("t");
      const subscriber = vi.fn();
      tile.subscribe(subscriber);

      removeAwarenessStates(local, [bob.clientID], "remote");

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(tile.value).toEqual([]);
    });

    test("indexes a selection published before the user", () => {
      const local = client();
      const presence = new Presence(local);
      const tile = presence.peersForTile("t");
      const subscriber = vi.fn();
      tile.subscribe(subscriber);

      const bob = client();
      setSelection(bob, ["t"]); // selection, no user yet
      sync(local, bob);
      expect(subscriber).not.toHaveBeenCalled();
      expect(tile.value).toEqual([]);

      setUser(bob, { id: "u2", name: "Bob" });
      sync(local, bob);
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(tile.value).toEqual([peer(bob, "u2", "Bob")]);
    });

    test("ignores updates that don't change a tile's occupants", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      setSelection(bob, ["t"]);
      const presence = new Presence(local);
      sync(local, bob);

      const tile = presence.peersForTile("t");
      const subscriber = vi.fn();
      tile.subscribe(subscriber);

      bob.setLocalStateField("cursor", { anchor: 1, head: 2 });
      sync(local, bob);

      expect(subscriber).not.toHaveBeenCalled();
      expect(tile.value).toEqual([peer(bob, "u2", "Bob")]);
    });

    test("excludes the local client", () => {
      const local = client({ id: "me", name: "Me" });
      setSelection(local, ["t"]);
      const presence = new Presence(local);

      expect(presence.peersForTile("t").value).toEqual([]);
    });

    test("stops updating tiles after dispose", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      const presence = new Presence(local);
      const tile = presence.peersForTile("t");
      const subscriber = vi.fn();
      tile.subscribe(subscriber);

      presence.dispose();
      setSelection(bob, ["t"]);
      sync(local, bob);

      expect(subscriber).not.toHaveBeenCalled();
      expect(tile.value).toEqual([]);
    });
  });

  describe("getActiveTile", () => {
    test("returns a tile the client has selected", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      setSelection(bob, ["a", "b"]);
      const presence = new Presence(local);
      sync(local, bob);

      expect(presence.getActiveTile(bob.clientID)).toBe("a");
    });

    test("follows a selection change", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      setSelection(bob, ["a"]);
      const presence = new Presence(local);
      sync(local, bob);
      expect(presence.getActiveTile(bob.clientID)).toBe("a");

      setSelection(bob, ["c"]);
      sync(local, bob);
      expect(presence.getActiveTile(bob.clientID)).toBe("c");
    });

    test("returns null when the client has no selection", () => {
      const local = client();
      const bob = client({ id: "u2", name: "Bob" });
      const presence = new Presence(local);
      sync(local, bob);

      expect(presence.getActiveTile(bob.clientID)).toBeNull();
    });

    test("returns null for an unknown client", () => {
      const local = client();
      const presence = new Presence(local);

      expect(presence.getActiveTile(12345)).toBeNull();
    });
  });
});
