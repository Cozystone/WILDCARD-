import { redirect } from 'next/navigation';

/** /issue — where BEGIN SELF-ISSUANCE used to go; the paths to a card are
 *  /create now. */
export default function IssuePage() {
  redirect('/create');
}
