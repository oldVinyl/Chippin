import { ui } from '../copy/interface';
import Link from 'next/link';
import Image from 'next/image';
import { assets } from '../assets/manifest';
export default function NotFound() {
  return (
    <section className="page narrow status-page">
      <Image src={assets.notFound} width={260} height={230} alt="" />
      <h1>{ui.aLittleLost}</h1>
      <p>{ui.thatPageIsntHereCheckYourPotCode}</p>
      <Link href="/" className="button">
        {ui.backHome}
      </Link>
    </section>
  );
}
