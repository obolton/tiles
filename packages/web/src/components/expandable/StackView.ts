import PopOut from "./PopOut";
import { willAnimateLayout, animateChildren } from "@/utils/animation/layout";

export default class StackView extends PopOut {
  constructor() {
    super();

    this.addEventListener("beforetoggle", () => willAnimateLayout(this));
    this.addEventListener("toggle", () => animateChildren(this));
  }
}
