import client from "@/api/client";
import { getPageInviteUrl } from "@/utils/invites";
import type { Invite } from "@/types/collaboration";
import type Page from "@/models/Page";

export default class PageInvite {
  readonly page: Page;
  readonly id: string;
  readonly email: string | null;
  readonly key: string;
  readonly createdAt: string;

  constructor(page: Page, data: Invite) {
    this.page = page;
    this.id = data.id;
    this.email = data.email;
    this.key = data.key;
    this.createdAt = data.createdAt;
  }

  /** The link the invitee opens to accept the invite. */
  get url() {
    return getPageInviteUrl(this.key);
  }

  static async create(page: Page, email?: string) {
    const result = await client.collaboration.inviteToPage.mutate({
      pageId: page.id,
      email,
    });
    const invite = new PageInvite(page, result);
    page.invites.value = page.invites.value.concat(invite);
    return invite;
  }

  async delete() {
    await client.collaboration.deletePageInvite.mutate({
      pageId: this.page.id,
      id: this.id,
    });
    this.page.invites.value = this.page.invites.value.filter((i) => i.id !== this.id);
  }
}
