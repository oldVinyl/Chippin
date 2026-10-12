import Link from 'next/link';
import { copy } from '../../copy/en';
export default function Privacy() {
  return (
    <article className="page narrow policy">
      <p className="eyebrow">YOUR INFORMATION, WITH CARE</p>
      <h1>Privacy Policy</h1>
      <p>{copy.privacy}</p>
      <Link className="button" href="/data-request">
        Ask about your data
      </Link>
    </article>
  );
}
