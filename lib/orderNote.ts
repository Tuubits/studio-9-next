// The buyer's note goes to PayPal as the order's purchase description, so it
// stays with the order. PayPal keeps the first 127 characters.
export const MAX_NOTE_LENGTH = 127;

// Collapses whitespace and control characters to single spaces and trims to
// the limit. Anything that isn't a string becomes an empty note.
export function cleanNote(note: unknown) {
  if (typeof note !== 'string') return '';
  return note.replace(/[\s\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, MAX_NOTE_LENGTH).trim();
}
