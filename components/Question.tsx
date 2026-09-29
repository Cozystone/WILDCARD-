import { MANIFESTO } from '@/lib/manifesto';

type Word = { readonly text: string; readonly d: string };
type Line = { readonly text: string; readonly words: readonly Word[] };

/**
 * WHO DECIDES / WHAT YOU ARE? as outlines in the wordmark's face
 * (lib/manifesto.ts), two lines on one edge, one path per word.
 *
 * DECIDES is its own group. With a pointer resting on it the word leaves and
 * a rule the weight of the typeface's underscore is left on its baseline:
 * WHO ____ WHAT YOU ARE? No answer is ever offered.
 *
 * Each line carries data-line so whoever shows the question can bring the
 * lines up one at a time.
 */
export default function Question() {
  const lines: readonly Line[] = MANIFESTO.lines;
  const { blank } = MANIFESTO;

  return (
    <h2 id="question-title" className="question">
      <svg viewBox={MANIFESTO.viewBox} role="img" aria-label="Who decides what you are?" fill="currentColor">
        {lines.map((line, i) => (
          <g key={line.text} data-line={i + 1}>
            {line.words.map((word) =>
              i === blank.line && word.text === blank.word ? (
                <g key={word.text} className="blank-word">
                  <rect
                    className="blank-hit"
                    x={blank.hit.x}
                    y={blank.hit.y}
                    width={blank.hit.width}
                    height={blank.hit.height}
                    fill="transparent"
                  />
                  <path className="blank-letters" d={word.d} />
                  <rect className="blank-rule" x={blank.x} y={blank.y} width={blank.width} height={blank.height} />
                </g>
              ) : (
                <path key={word.text} d={word.d} />
              ),
            )}
          </g>
        ))}
      </svg>
    </h2>
  );
}
