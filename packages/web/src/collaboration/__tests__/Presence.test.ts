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

function sync(local: Awareness, remote: Awareness) {
  applyAwarenessUpdate(
    local,
    encodeAwarenessUpdate(remote, [remote.clientID]),
    "remote",
  );
}

function peer(id: string, name: string, extra: Partial<Peer> = {}): Peer {
  return { id, name, color: "#ffffff", imageId: null, ...extra };
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
    sync(local, client({ id: "u2", name: "Bob" }));
    sync(local, client({ id: "u3", name: "Ann" }));

    const presence = new Presence(local);

    expect(presence.value).toEqual([peer("u3", "Ann"), peer("u2", "Bob")]);
  });

  test("normalizes a missing imageId to null", () => {
    const local = client();
    const bob = client();
    bob.setLocalStateField("user", { id: "u2", name: "Bob", color: "#fff" });
    sync(local, bob);

    const presence = new Presence(local);

    expect(presence.value).toEqual([peer("u2", "Bob", { color: "#fff" })]);
  });

  test("adds a peer on join and notifies once", () => {
    const local = client();
    const presence = new Presence(local);
    const subscriber = vi.fn();
    presence.subscribe(subscriber);

    sync(local, client({ id: "u2", name: "Bob" }));

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(presence.value).toEqual([peer("u2", "Bob")]);
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
    expect(presence.value).toEqual([peer("u2", "Bob")]);
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
});
