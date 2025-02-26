import { useEffect, useState } from "react";
import type { ModalOptions } from "@/utils/modals";

export default function useModal<T>() {
  const [value, setValue] = useState<{
    modal: string;
    options?: ModalOptions<T>;
  } | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    addEventListener(
      "showmodal",
      ({ modal, options }) => {
        if (modal) {
          setValue({ modal, options });
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
