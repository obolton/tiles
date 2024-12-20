import Editor from "./editor";

const pageId = import.meta.env.SSR ? "" : (document.body.dataset.pageId ?? "");

const editor = new Editor(pageId);

export default editor;
