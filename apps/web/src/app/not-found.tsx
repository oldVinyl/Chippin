import Link from 'next/link';
import Image from 'next/image';
import { assets } from '../assets/manifest';
export default function NotFound() {
  return (
    <section className="page narrow status-page">
      <Image src={assets.notFound} width={260} height={230} alt="" />
      <h1>A little lost?</h1>
      <p>
        That page isn’t here. Check your pot code, or start again from home.
      </p>
      <Link href="/" className="button">
        Back home
      </Link>
    </section>
  );
}
