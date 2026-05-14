export const SUBMIT_SHORTCUT_LABEL = '⌘ Enter';

type CommandEnterLikeEvent = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  isComposing?: boolean;
  repeat?: boolean;
};

type FormSubmitLikeEvent = CommandEnterLikeEvent & {
  preventDefault: () => void;
  currentTarget: {
    requestSubmit: () => void;
  };
};

export function isCommandEnterEvent(event: CommandEnterLikeEvent): boolean {
  return (
    event.key === 'Enter' &&
    (event.metaKey === true || event.ctrlKey === true) &&
    event.altKey !== true &&
    event.shiftKey !== true &&
    event.isComposing !== true &&
    event.repeat !== true
  );
}

export function handleCommandEnterFormSubmit(event: FormSubmitLikeEvent): void {
  if (!isCommandEnterEvent(event)) return;

  event.preventDefault();
  event.currentTarget.requestSubmit();
}
