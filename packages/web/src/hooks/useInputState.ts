import { useCallback, useState } from "react";

export default function useInputState(initialValue?: string) {
  const [value, setValue] = useState<string | undefined>(initialValue);
  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setValue(event.target.value),
    [],
  );
  return [value, onChange] as const;
}
