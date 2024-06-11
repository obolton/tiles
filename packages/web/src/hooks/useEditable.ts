import useSessionState from "./useSessionState";

export default function useEditable() {
  return useSessionState("edit") === "true";
}
