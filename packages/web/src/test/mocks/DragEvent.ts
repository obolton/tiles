export default class DragEvent extends MouseEvent {
  readonly dataTransfer: DataTransfer | null;

  constructor(type: string, options?: DragEventInit) {
    super(type, options);
    this.dataTransfer = options?.dataTransfer ?? null;
  }
}
