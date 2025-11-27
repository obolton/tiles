import client from "@/api/client";
import type { Invite } from "@/types/collaboration";
import type Editor from "@/editor/Editor";

export default class PageInvite {
  readonly editor: Editor;
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;

  constructor(editor: Editor, data: Invite) {
    this.editor = editor;
    this.id = data.id;
    this.email = data.email;
    this.createdAt = data.createdAt;
  }

  static async create(editor: Editor, email: string) {
    const result = await client.collaboration.inviteToPage.mutate({
      pageId: editor.pageId,
      email,
    });
    const invite = new PageInvite(editor, result);
    editor.addInvite(invite);
    return invite;
  }

  async delete() {
    await client.collaboration.deletePageInvite.mutate({
      pageId: this.editor.pageId,
      id: this.id,
    });
    this.editor.removeInvite(this);
  }
}
