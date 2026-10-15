import ModalHeader from "../ModalHeader";
import UploadImage from "./UploadImage";
import GenerateImage from "./GenerateImage";
import type { ModalProps } from "@/utils/modals";

export type ImageModalResult = { image: File };

interface ImageModalProps extends ModalProps<ImageModalResult> {
  file?: File;
}

export default function ImageModal({ file, cancel, confirm }: ImageModalProps) {
  return (
    <>
      <ModalHeader>
        <h2>Image</h2>

        <tab-bar>
          <tab-item id="image-modal-upload-tab" for="image-modal-upload-tab-panel" selected>
            Upload
          </tab-item>

          <tab-item id="image-modal-generate-tab" for="image-modal-generate-tab-panel">
            Generate
          </tab-item>
        </tab-bar>
      </ModalHeader>

      <tab-panel id="image-modal-upload-tab-panel" open>
        <UploadImage file={file} confirm={confirm} cancel={cancel} />
      </tab-panel>

      <tab-panel id="image-modal-generate-tab-panel">
        <GenerateImage confirm={confirm} cancel={cancel} />
      </tab-panel>
    </>
  );
}
