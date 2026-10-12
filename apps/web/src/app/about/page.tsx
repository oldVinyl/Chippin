import { ui } from '../../copy/interface';
import Link from 'next/link';
export default function About() {
  return (
    <article className="page narrow policy">
      <p className="eyebrow">{ui.aLittleFromEachOfUs}</p>
      <h1>{ui.madeForTheMomentsWeShare}</h1>
      <p>{ui.aNumberInAWhatsappGroupCanBring}</p>
      <p>{ui.chippinGivesThatKindnessAHomeOnePot}</p>
      <p>{ui.builtForTheMtnMomoFintechLabEveryday}</p>
      <Link className="button" href="/p/AKWAABA">
        {ui.seeAPotInAction}
      </Link>
    </article>
  );
}
