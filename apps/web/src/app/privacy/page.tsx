import { ui } from '../../copy/interface';
import Link from 'next/link';
import { copy } from '../../copy/en';
export default function Privacy() {
  return (
    <article className="page narrow policy">
      <p className="eyebrow">{ui.yourInformationWithCare}</p>
      <h1>{ui.privacyPolicy2}</h1>
      <p>{copy.privacy}</p>
      <Link className="button" href="/data-request">
        {ui.askAboutYourData}
      </Link>
    </article>
  );
}
