import { useFormStatus } from "react-dom";

function QueryInput() {
  const { pending } = useFormStatus();
  return (
    <input
      className="scout-input"
      type="text"
      name="query"
      placeholder="What do you want to research?"
      disabled={pending}
      autoFocus
      required
    />
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="scout-button" type="submit" disabled={pending}>
      {pending ? "Researching…" : "Search"}
    </button>
  );
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  ref?: React.Ref<HTMLFormElement>;
}

export function SearchForm({ action, ref }: Props) {
  return (
    <form ref={ref} className="scout-form" action={action}>
      <QueryInput />
      <SubmitButton />
    </form>
  );
}
