export default class FontFace {
  family: string;
  source: string;
  descriptors: FontFaceDescriptors;

  constructor(family: string, source: string, descriptors: FontFaceDescriptors = {}) {
    this.family = family;
    this.source = source;
    this.descriptors = descriptors;
  }

  async load(): Promise<this> {
    return this;
  }
}
