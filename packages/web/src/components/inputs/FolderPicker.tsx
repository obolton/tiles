import { reactive } from "@/utils/reactivity";
import { getWorkspaceFolders, type Folder } from "@/utils/folders";
import { handleError } from "@/utils/errors";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import Each from "@/jsx/each";
import FolderIcon from "@/icons/folder.svg?jsx";
import type { Reactive } from "@/utils/reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { JSX } from "@/jsx/jsx";

interface FolderPickerProps extends Omit<
  JSX.Attributes<"list-select">,
  "value" | "on:change"
> {
  value?: Reactive<string | null>;
  onChange: (folderId: string | null) => void;
}

export default function FolderPicker({
  value,
  onChange,
  ...props
}: FolderPickerProps) {
  const folders = reactive<Folder[]>([]);

  getWorkspaceFolders()
    .then((result) => {
      folders.value = result.folders;
    })
    .catch(handleError);

  function setFolder(event: Event) {
    const selectedValue = (event.target as ListSelect).value;
    onChange(selectedValue === "" ? null : selectedValue);
  }

  return (
    <list-select
      {...props}
      aria-orientation="vertical"
      orientation="vertical"
      align="center"
      showvalue
      label="Folder"
      value={value?.derive((v) => v ?? "")}
      on:change={setFolder}
    >
      <FolderIcon aria-hidden="true" slot="default-icon" />

      <ListGroup>
        <ListOption value="" label="None">
          None
        </ListOption>
      </ListGroup>

      <ListGroup>
        <Each items={folders}>
          {(folder) => <ListOption value={folder.id}>{folder.name}</ListOption>}
        </Each>
      </ListGroup>
    </list-select>
  );
}
