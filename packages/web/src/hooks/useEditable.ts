import { useEffect, useState } from "react";
import { EDIT_START_EVENT, EDIT_END_EVENT } from "../constants/edit";

export default function useEditable() {
  const [isEditable, setEditable] = useState(false);

  useEffect(() => {
    const handleEditStart = () => setEditable(true);
    const handleEditEnd = () => setEditable(false);

    document.addEventListener(EDIT_START_EVENT, handleEditStart);
    document.addEventListener(EDIT_END_EVENT, handleEditEnd);

    if (document.body.dataset.editing === "true") {
      setEditable(true);
    }

    return () => {
      document.removeEventListener(EDIT_START_EVENT, handleEditStart);
      document.removeEventListener(EDIT_END_EVENT, handleEditEnd);
    };
  }, []);

  return isEditable;
}
