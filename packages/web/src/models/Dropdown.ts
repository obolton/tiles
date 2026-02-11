import client from "@/api/client";
import { reactive } from "@/utils/reactivity";
import type { Dropdown as DropdownData } from "@/types/dropdowns";
import type { AppRouterInputs } from "@/api/client";
import type { Reactive } from "@/utils/reactivity";
import type Page from "@/models/Page";

type OmitPageId<T extends { pageId: string }> = Omit<T, "pageId">;

export default class Dropdown {
  readonly page: Page;
  readonly id: string;
  readonly title: Reactive<string | null>;
  readonly options: Reactive<DropdownData["options"]>;

  constructor(page: Page, data: DropdownData) {
    this.page = page;
    this.id = data.id;
    this.title = reactive(data.title);
    this.options = reactive(data.options);
  }

  static async create(
    page: Page,
    data: OmitPageId<AppRouterInputs["dropdowns"]["create"]>,
  ) {
    const result = await client.dropdowns.create.mutate({
      pageId: page.id,
      ...data,
    });
    const dropdown = new Dropdown(page, result);
    page.dropdowns.value = page.dropdowns.value.concat(dropdown);
    return dropdown;
  }

  private update(
    data: Omit<AppRouterInputs["dropdowns"]["update"], "pageId" | "id">,
  ) {
    return client.dropdowns.update.mutate({
      pageId: this.page.id,
      id: this.id,
      ...data,
    });
  }

  async setOptions(options: DropdownData["options"]) {
    this.options.value = options;
    await this.update({ options });
  }

  async addOption(value: string) {
    const newOptions = this.options.value.concat({ value });
    return this.setOptions(newOptions);
  }

  async setTitle(title: string | null) {
    this.title.value = title;
    await this.update({ title });
  }

  async updateOption(index: number, value: string) {
    const newOptions = this.options.value.map((option, i) =>
      i === index ? { ...option, value } : option,
    );
    return this.setOptions(newOptions);
  }

  async removeOption(index: number) {
    const newOptions = this.options.value.toSpliced(index, 1);
    return this.setOptions(newOptions);
  }

  async reorderOptions(fromIndex: number, toIndex: number) {
    const option = this.options.value[fromIndex];
    if (!option) {
      throw new Error(`Invalid option index: ${fromIndex}`);
    }
    const newOptions = this.options.value
      .toSpliced(fromIndex, 1)
      .toSpliced(toIndex, 0, option);
    return this.setOptions(newOptions);
  }

  async delete() {
    await client.dropdowns.delete.mutate({
      pageId: this.page.id,
      id: this.id,
    });
    this.page.dropdowns.value = this.page.dropdowns.value.filter(
      (d) => d.id !== this.id,
    );
  }
}
