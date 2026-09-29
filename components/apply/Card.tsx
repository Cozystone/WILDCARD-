import { FORM } from '@/lib/apply/copy';

/**
 * The blank card: the size of a card, in the dark, with the mark top left
 * and UNISSUED bottom right, turning a few degrees in the air. It is not
 * the person's card and does not pretend to be: the design is the
 * studio's, later. At the end it goes into the slot — a line of light —
 * and is gone.
 *
 * CSS only (globals.css, `.tty-card`): the site has no 3D library and one
 * card is not a reason to add one.
 */
export default function Card({ state = 'idle', number }: { state?: 'idle' | 'issuing' | 'issued'; number?: string | null }) {
  return (
    <div className="tty-card-stage" data-state={state} aria-hidden="true">
      <div className="tty-card">
        <div className="tty-card-face">
          <span className="tty-card-mark">{FORM.card.mark}</span>
          <span className="tty-card-chip" />
          <span className="tty-card-state">{state === 'issued' && number ? number : FORM.card.state}</span>
        </div>
      </div>
      <div className="tty-slot" />
    </div>
  );
}
