import { useEffect, useState } from "react";
import type { ModalOptions } from "@/utils/modals";

export default function useModal<T>() {
  const [value, setValue] = useState<{
    modal: string;
    options?: ModalOptions<T>;
    callback?: (result?: T) => void;
  } | null>(null);

  useEffect(() => {
    const abort = new AbortController();
      ({ modal, options, callback }) => {
    addEventListener(
      "showmodal",
        if (modal) {
          setValue({ modal, options, callback });
        }
      },
      { signal: abort.signal },
    );
    addEventListener("hidemodal", () => setValue(null), {
      signal: abort.signal,
    });
    return () => abort.abort();
  }, []);

  return value;
}
