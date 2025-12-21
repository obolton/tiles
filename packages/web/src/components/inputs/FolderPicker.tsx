import { reactive } from "@/utils/reactivity";
import { getWorkspaceFolders, type Folder } from "@/utils/folders";
import { handleError } from "@/utils/errors";
import MenuItem from "@/components/buttons/MenuItem";
import Each from "@/jsx/each";
import FolderIcon from "@/icons/folder.svg?jsx";
import type { Reactive } from "@/utils/reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { JSX } from "@/jsx/jsx";

interface FolderPickerProps extends Omit<
  JSX.Attributes<"list-select">,
  "value" | "on:change"
> {
  workspaceId: string;
  value?: Reactive<string | null>;
  onChange: (folderId: string | null) => void;
}

export default function FolderPicker({
  workspaceId,
  value,
  onChange,
  ...props
}: FolderPickerProps) {
  const folders = reactive<Folder[]>([]);

  getWorkspaceFolders(workspaceId)
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

      <ul className="menuitemgroup" role="group">
        <li role="presentation">
          <MenuItem classList={{ menuitem: true }} value="" data-label="None">
            None
          </MenuItem>
        </li>
      </ul>

      <ul className="menuitemgroup" role="group">
        <Each items={folders}>
          {(folder) => (
            <li role="presentation">
              <MenuItem classList={{ menuitem: true }} value={folder.id}>
                {folder.name}
              </MenuItem>
            </li>
          )}
        </Each>
      </ul>
    </list-select>
  );
}
