import useSessionState from "./useSessionState";

export default function useEditable() {
  const editPathname = useSessionState("edit");
  return (
    typeof window !== "undefined" &&
    editPathname &&
    window.location.pathname === editPathname
  );
}
