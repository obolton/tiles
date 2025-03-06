import { useCallback, useTransition } from "react";
import ModalHeader from "../ModalHeader";
import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import { classNames } from "@/utils/css";
import type { ModalProps } from "@/utils/modals";

export interface InviteModalResult {
  email: string;
}

type InviteModalProps = ModalProps<InviteModalResult>;

export default function InviteModal({ cancel, confirm }: InviteModalProps) {
  const [isPending, startTransition] = useTransition();

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isPending) {
        return;
      }

      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      startTransition(() => confirm({ email }));
    },
    [confirm, isPending],
  );

  return (
    <form onSubmit={submit}>
      <ModalHeader>
        <h2>Invite to page</h2>
      </ModalHeader>

      <ModalBody>
        <label>
          Email address
          <input
            type="email"
            name="email"
            placeholder="Email address"
            required
          />
        </label>
      </ModalBody>

      <ModalFooter>
        <button
          className={classNames("primary", isPending && "pending")}
          type="submit"
        >
          Save
        </button>
        <button className="secondary" type="button" onClick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
