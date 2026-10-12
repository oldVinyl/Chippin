import { ui } from '../../copy/interface';
import { copy } from '../../copy/en';
export default function Terms() {
  return (
    <article className="page narrow policy">
      <p className="eyebrow">{ui.clearExpectations}</p>
      <h1>{ui.termsOfUse}</h1>
      <p>{copy.terms}</p>
    </article>
  );
}
