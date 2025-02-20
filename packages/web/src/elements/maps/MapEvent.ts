export default class MapEvent extends Event {
  markerId?: string;

  constructor(type: "deletemarker", { markerId }: { markerId?: string }) {
    super(type, { bubbles: true, cancelable: false });
    this.markerId = markerId;
  }
}
