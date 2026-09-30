import Star from '@/components/mainboard/Star';
import { CARD, LINK, ORIGIN, PROVENANCE, PUBLIC, SECTION } from '@/lib/mainboard/copy';
import { linkHref, linkText, two } from '@/lib/mainboard/format';
import type { PublicRecord as Data } from '@/lib/mainboard/types';

/**
 * What a tap on someone's * opens (/w/{token}) — a person first, then what
 * they chose to let you know. Rendered on the server, no film, no terminal,
 * no script needed: the name and SAVE CONTACT are on the first paint.
 *
 *   MEET  the name, the intro, and the ways to reach them the holder made
 *         public: SAVE CONTACT (a vCard of exactly that), MESSAGE, EMAIL,
 *         their links.
 *   KNOW  the statement and the sections, in the holder's order.
 *
 * Framed like everything WILDCARD*: ink round a paper plate. At the foot,
 * the issue, who drew it, and the *.
 */
export default function PublicRecord({ data, token, k }: { data: Data | null; token: string; k: string | null }) {
  if (!data || data.state !== 'active') {
    const lines = data?.state === 'inactive' ? PUBLIC.inactive : PUBLIC.missing;
    return (
      <div className="wp">
        <main className="wp-plate wp-plate-empty">
          <h1 className="wp-name">
            {lines[0]}
            <br />
            {lines[1]}
          </h1>
          <footer className="wp-foot">
            <span className="wp-star">
              <Star />
            </span>
            <span>WILDCARD*</span>
          </footer>
        </main>
      </div>
    );
  }

  const key = k ? `?k=${encodeURIComponent(k)}` : '';
  const phone = data.links.find((l) => l.kind === 'phone');
  const email = data.links.find((l) => l.kind === 'email');
  const others = data.links.filter((l) => l !== phone && l !== email);
  const issued = data.card;
  const historic = !data.current && data.version;
  const then =
    issued?.version_at_issue && data.history.length && data.current && issued.version_at_issue !== data.version ? issued.version_at_issue : null;
  const withVer = (v: number | null) => {
    const q = new URLSearchParams();
    if (k) q.set('k', k);
    if (v) q.set('v', String(v));
    const s = q.toString();
    return `/w/${token}${s ? `?${s}` : ''}`;
  };

  return (
    <div className="wp">
      <main className="wp-plate">
        <header className="wp-top">
          <span>{data.record_number ?? 'W*'}</span>
          <span>{issued ? CARD.issue(issued.issue) : data.origin === 'found' ? ORIGIN.found : ''}</span>
        </header>

        <section className="wp-meet" aria-label={data.name}>
          <h1 className="wp-name">{data.name}</h1>
          {data.intro ? <p className="wp-intro">{data.intro}</p> : null}
          <nav className="wp-actions" aria-label="Contact">
            <a className="wp-action wp-action-lead" href={`/w/${token}/vcard${key}`}>
              {PUBLIC.save}
            </a>
            {phone ? (
              <a className="wp-action" href={`sms:${phone.value.replace(/[^\d+]/g, '')}`}>
                {PUBLIC.message}
              </a>
            ) : null}
            {email ? (
              <a className="wp-action" href={`mailto:${email.value.trim()}`}>
                {PUBLIC.email}
              </a>
            ) : null}
            {others.map((l, i) => {
              const href = linkHref(l.kind, l.value);
              const text = l.label || LINK[l.kind];
              return href ? (
                <a key={i} className="wp-action" href={href} target="_blank" rel="noopener noreferrer" title={linkText(l.kind, l.value)}>
                  {text}
                </a>
              ) : (
                <span key={i} className="wp-action wp-action-plain">
                  {l.value}
                </span>
              );
            })}
          </nav>
        </section>

        {data.statement || data.sections.length ? (
          <section className="wp-know" aria-label={PUBLIC.know}>
            <p className="wp-label">
              {PUBLIC.know}
              {historic ? ` · ${PUBLIC.asOf(data.version!)}` : ''}
            </p>
            {data.statement ? <blockquote className="wp-statement">{data.statement}</blockquote> : null}
            {data.sections.map((s, i) => (
              <div key={i} className="wp-entry">
                <p className="wp-label">{s.kind === 'custom' ? s.label : SECTION[s.kind]}</p>
                <p className="wp-body">{s.body}</p>
              </div>
            ))}
          </section>
        ) : null}

        {then || historic ? (
          <p className="wp-then">
            {then ? (
              <a className="wp-action" href={withVer(then)}>
                {PUBLIC.then} — {two(then)}
              </a>
            ) : (
              <a className="wp-action" href={withVer(null)}>
                {PUBLIC.now}
              </a>
            )}
          </p>
        ) : null}

        <footer className="wp-foot">
          <span className="wp-star">
            <Star />
          </span>
          <span>WILDCARD*</span>
          {issued ? <span>{PROVENANCE[issued.provenance]}</span> : null}
          <span className="wp-q">{PUBLIC.question}</span>
        </footer>
      </main>
    </div>
  );
}
