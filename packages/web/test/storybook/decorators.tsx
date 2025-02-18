import type { Decorator } from "@storybook/react";
import Editor from "../../src/editor/Editor";
import { EditorContext } from "../../src/context/editor";

const PAGE = {
  id: "test",
  updatedAt: "2025-01-01T00:00:00.000Z",
  title: "Test",
  subtitle: "Subtitle",
  coverImageUrl: null,
  published: true,
  theme: "LIGHT" as const,
  hue: 0,
  font: "MODERN" as const,
  author: {
    id: "test",
    name: "Test user",
    username: "test",
    imageUrl: null,
  },
  tiles: [],
};

export const EditorDecorator: Decorator = (story) => {
  return (
    <EditorContext.Provider value={new Editor(PAGE)}>
      {story()}
    </EditorContext.Provider>
  );
};
