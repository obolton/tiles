import * as Y from "yjs";
import Dropdown, { type CreateDropdownInput } from "@/models/Dropdown";
import { BaseReactive } from "@/utils/reactivity";
import type Page from "@/models/Page";

export default class PageDropdowns extends BaseReactive<Dropdown[]> {
  private readonly map: Y.Map<Y.Map<unknown>>;
  private readonly instances = new Map<string, Dropdown>();
  private readonly onMapChange = this.reconcile.bind(this);

  constructor(page: Page) {
    super();
    this.map = page.doc.getMap<Y.Map<unknown>>("dropdowns");
    for (const data of this.map.values()) {
      this.add(data);
    }
    this.map.observe(this.onMapChange);
  }

  get value(): Dropdown[] {
    return this.instances.values().toArray();
  }

  get(id: string): Dropdown {
    const dropdown = this.instances.get(id);
    if (!dropdown) {
      throw new Error(`Dropdown cannot be found: ${id}`);
    }
    return dropdown;
  }

  create(input: CreateDropdownInput): Dropdown {
    const id = crypto.randomUUID();
    const map = Dropdown.createMap(input);
    map.set("id", id);
    this.map.set(id, map);
    return this.instances.get(id) ?? this.add(map);
  }

  remove(id: string) {
    this.map.delete(id);
  }

  private add(data: Y.Map<unknown>): Dropdown {
    const dropdown = new Dropdown(data);
    this.instances.set(dropdown.id, dropdown);
    return dropdown;
  }

  private reconcile(event: Y.YMapEvent<Y.Map<unknown>>) {
    for (const [id, change] of event.changes.keys) {
      if (change.action === "add") {
        const data = this.map.get(id);
        if (data && !this.instances.has(id)) {
          this.add(data);
        }
      } else if (change.action === "delete") {
        this.instances.get(id)?.dispose();
        this.instances.delete(id);
      }
    }
    this.notify();
  }

  dispose() {
    this.map.unobserve(this.onMapChange);
    for (const dropdown of this.instances.values()) {
      dropdown.dispose();
    }
    this.instances.clear();
    this.disconnect();
  }
}
