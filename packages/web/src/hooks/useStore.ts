import { useCallback, useSyncExternalStore } from "react";
import type { BaseStore, SubscribeCallback } from "@/utils/stores";

export default function useStore<Value>(store: BaseStore<Value>) {
  const subscribe = useCallback(
    (callback: SubscribeCallback<Value>) => store.subscribe(callback),
    [store],
  );
  const getSnapshot = useCallback(() => store.value, [store]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
