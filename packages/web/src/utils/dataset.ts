import { reactive, type Reactive } from "carillon";

export type RecordValues = Record<string, unknown>;

export default class Dataset<Property> {
  readonly length: Reactive<number>;

  private readonly properties: Map<string, Property>;
  private readonly records: Map<string, Record<string, unknown>>;

  constructor(
    properties: Iterable<[string, Property]>,
    records: Iterable<[string, Record<string, unknown>]>,
  ) {
    this.properties = new Map(properties);
    this.records = new Map(records);
    this.length = reactive(this.records.size);
  }

  // Records

  get(id: string, propertyId: string) {
    return this.records.get(id)?.[propertyId];
  }

  insert(id: string, values: RecordValues) {
    this.records.set(id, values);
    this.length.value = this.records.size;
  }

  remove(id: string) {
    this.records.delete(id);
    this.length.value = this.records.size;
  }

  // Properties

  addProperty(id: string, value: Property) {
    this.properties.set(id, value);
  }

  getProperty(id: string) {
    return this.properties.get(id);
  }

  updateProperty(id: string, value: Partial<Property>) {
    const property = this.getProperty(id);
    if (!property) {
      throw new Error(`Invalid property ID: ${id}`);
    }
    Object.assign(property, value);
  }

  removeProperty(id: string) {
    this.properties.delete(id);
  }
}
