export default class MapEvent extends Event {
  markerId?: string;

  constructor(type: "delete-marker", { markerId }: { markerId?: string }) {
    super(type, { bubbles: true, cancelable: false });
    this.markerId = markerId;
  }
}
