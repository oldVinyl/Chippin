'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ShieldCheck,
  UsersThree,
  Eye,
  Heart,
  Plus,
  Minus,
} from '@phosphor-icons/react';
import { copy } from '../copy/en';
import { terms } from '../copy/terms';
import { assets } from '../assets/manifest';
export default function Home() {
  const [code, setCode] = useState('');
  const router = useRouter();
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-star">✳</span>
            {copy.hero.eyebrow}
          </p>
          <h1>
            Good things happen
            <br />
            when we <span className="scribble">chip in.</span>
          </h1>
          <p className="hero-description">{copy.hero.body}</p>
          <div className="hero-actions">
            <Link className="button" href="/dashboard/new">
              {copy.hero.cta}
              <ArrowUpRight weight="bold" size={24} />
            </Link>
            <Link className="text-link" href="/p/AKWAABA">
              {copy.hero.secondary}
              <ArrowRight size={22} />
            </Link>
          </div>
          <div className="hero-trust">
            {copy.trust.map((t) => (
              <span key={t}>
                <Check size={18} weight="bold" />
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="hero-art">
          <span className="art-note">
            Small chips.
            <br />
            Big love.
          </span>
          <Image
            src={assets.hero}
            width={610}
            height={530}
            priority
            alt="A happy chocolate-chip cookie gathers little hearts in a shared pot."
          />
          <div className="art-caption">
            <span className="avatar-stack">
              <i>A</i>
              <i>K</i>
              <i>E</i>
            </span>
            <span>A little from all of us.</span>
            <Heart size={22} weight="fill" />
          </div>
        </div>
      </section>
      <section className="join-band">
        <div className="wrap join-inner">
          <div>
            <p className="eyebrow">YOU’RE IN GOOD COMPANY</p>
            <h2>Already have a {terms.potLower} code?</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim())
                router.push(
                  `/p/${encodeURIComponent(code.trim().toUpperCase())}`,
                );
            }}
          >
            <label className="sr-only" htmlFor="pot-code">
              {terms.pot} code
            </label>
            <input
              id="pot-code"
              placeholder="Enter your pot code"
              value={code}
              maxLength={20}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="button" type="submit">
              Find my {terms.potLower}
              <ArrowRight size={23} />
            </button>
          </form>
        </div>
      </section>
      <section className="wrap how" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">LESS FUSS. MORE TOGETHER.</p>
          <h2>One {terms.potLower}. Three little steps.</h2>
          <p>From “we should do something” to making it happen.</p>
        </div>
        <div className="steps">
          {copy.steps.map((step, i) => (
            <article key={step.title}>
              <div className="step-illustration">
                <Image
                  src={[assets.create, assets.share, assets.chipin][i]}
                  alt=""
                  width={180}
                  height={170}
                />
                <span className="step-number">0{i + 1}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="together wrap">
        <div className="together-intro">
          <p className="eyebrow">FOR REAL LIFE, AND REAL PEOPLE</p>
          <h2>
            Some things take
            <br />a whole village.
          </h2>
          <p>
            A wedding. A school roof. A friend who needs a hand. Whatever brings
            you together, there’s a {terms.potLower} for it.
          </p>
          <Link href="/p/AKWAABA" className="text-link">
            Take a look inside
            <ArrowUpRight size={22} />
          </Link>
        </div>
        <Link href="/p/AKWAABA" className="featured-pot">
          <div className="featured-cover">
            <Image
              src={assets.covers[4]}
              alt="A calm illustration of a school and leafy courtyard"
              fill
              sizes="(max-width: 700px) 100vw, 500px"
            />
            <span className="cover-label">COMMUNITY IN ACTION</span>
          </div>
          <div className="featured-content">
            <span className="verified">
              <ShieldCheck size={19} weight="fill" />
              Verified organizer
            </span>
            <h3>A fresh start for Akwaaba School</h3>
            <p>New desks. More room to dream.</p>
            <div className="amount-line">
              <strong>GH₵ 2,450</strong>
              <span>of GH₵ 5,000</span>
            </div>
            <div className="progress">
              <span style={{ width: '49%' }} />
            </div>
            <div className="pot-foot">
              <span>
                <UsersThree size={21} />
                24 kind people
              </span>
              <span>
                View {terms.potLower}
                <ArrowUpRight size={20} />
              </span>
            </div>
          </div>
        </Link>
      </section>
      <section className="trust-section">
        <div className="wrap">
          <div className="section-heading">
            <p className="eyebrow">KINDNESS, WITH CLARITY</p>
            <h2>A warm heart. A clear record.</h2>
          </div>
          <div className="trust-grid">
            {[
              {
                icon: ShieldCheck,
                title: 'Know who’s behind it.',
                text: 'Verified organizers carry a badge. Always check the name before giving.',
              },
              {
                icon: Eye,
                title: 'See it add up.',
                text: 'Live totals and a donor book keep everyone in the loop.',
              },
              {
                icon: Heart,
                title: 'Know where it goes.',
                text: 'Payout timing is clear before you pay. Refund progress stays visible.',
              },
            ].map((item) => (
              <article key={item.title}>
                <item.icon size={40} weight="duotone" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <p className="demo-line">
            Hackathon prototype · Mock payments move no money · Live service
            would work with MTN or a licensed payment provider.
          </p>
        </div>
      </section>
      <section className="faq wrap">
        <div>
          <p className="eyebrow">A FEW THINGS YOU MIGHT WONDER</p>
          <h2>
            Let’s clear
            <br />
            things up.
          </h2>
          <Image src={assets.mark} width={100} height={100} alt="" />
        </div>
        <div>
          {copy.faq.map((f) => (
            <details key={f.question}>
              <summary>
                {f.question}
                <Plus className="plus" size={22} />
                <Minus className="minus" size={22} />
              </summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="last-call wrap">
        <p className="eyebrow">YOUR PEOPLE. YOUR PURPOSE.</p>
        <h2>
          Let’s put a little good
          <br />
          into the world.
        </h2>
        <Link href="/dashboard/new" className="button">
          Start your {terms.potLower}
          <ArrowUpRight size={24} />
        </Link>
        <p>It only takes a few minutes.</p>
      </section>
    </>
  );
}
