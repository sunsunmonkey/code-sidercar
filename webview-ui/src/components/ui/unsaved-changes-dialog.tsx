import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSave: () => void;
  isSaving: boolean;
  isTesting: boolean;
  hasErrors: boolean;
}

const UnsavedChangesDialog = ({
  open,
  onOpenChange,
  onDiscard,
  onSave,
  isSaving,
  isTesting,
  hasErrors,
}: UnsavedChangesDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
        <AlertDialogDescription>
          You have unsaved changes. Save before leaving?
        </AlertDialogDescription>
        <div className="mt-5 flex items-center justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button type="button" variant="ghost" disabled={isSaving}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="secondary"
              onClick={onDiscard}
              disabled={isSaving}
            >
              Don&apos;t Save
            </Button>
          </AlertDialogAction>
          <AlertDialogAction asChild>
            <Button
              type="button"
              onClick={onSave}
              loading={isSaving}
              disabled={hasErrors || isSaving || isTesting}
            >
              Save &amp; Leave
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialog>
);

export { UnsavedChangesDialog };
