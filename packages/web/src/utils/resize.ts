export class ResizeEvent extends Event {
  constructor(
    type: "resize:resize" | "resize:end",
    readonly size: {
      width: number;
      height: number;
    } | null,
  ) {
    super(type, { bubbles: true, cancelable: false });
  }
}
