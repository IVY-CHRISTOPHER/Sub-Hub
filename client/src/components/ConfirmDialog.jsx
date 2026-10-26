// A reusable pop-up that asks "Are you sure?" before doing something risky (like deleting).
// It replaces the browser's plain built-in alert with a pop-up styled like the rest of the app.
import { useEffect, useRef } from 'react'

// Props: open = whether it's showing, title/message = the text, confirmLabel = text on the main button,
// onConfirm / onCancel = what to do when the user picks each choice.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const ref = useRef(null)

  // Open or close the pop-up whenever "open" changes. The browser's built-in <dialog> handles
  // dimming the page, keeping keyboard focus inside the pop-up, and the Escape key.
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="confirm"
      onCancel={(e) => {
        e.preventDefault()   // Let our own state close it, so the page and pop-up stay in sync
        onCancel()
      }}
      onClick={(e) => {
        // Clicking the dimmed area outside the box counts as Cancel.
        if (e.target === ref.current) onCancel()
      }}
    >
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="row">
        <button type="button" className="danger" onClick={onConfirm}>{confirmLabel}</button>
        <button type="button" onClick={onCancel} autoFocus>Cancel</button>
      </div>
    </dialog>
  )
}
