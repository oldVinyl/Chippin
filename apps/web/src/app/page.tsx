'use client';
import { ui } from '../copy/interface';
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
            {ui.goodThingsHappen}
            <br />
            {ui.whenWe}
            <span className="scribble">{ui.chipIn}</span>
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
            {ui.smallChips}
            <br />
            {ui.bigLove}
          </span>
          <Image
            src={assets.hero}
            width={560}
            height={500}
            priority
            alt={ui.aHappyChocolatechipCookieGathersLittleHeartsIn}
          />
          <div className="art-caption">
            <span className="avatar-stack">
              <i>{ui.a}</i>
              <i>{ui.k}</i>
              <i>{ui.e}</i>
            </span>
            <span>{ui.aLittleFromAllOfUs2}</span>
            <Heart size={22} weight="fill" />
          </div>
        </div>
      </section>
      <section className="join-band">
        <div className="wrap join-inner">
          <div>
            <p className="eyebrow">{ui.youreInGoodCompany}</p>
            <h2>
              {ui.alreadyHaveA}
              {terms.potLower}
              {ui.code}
            </h2>
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
              {terms.pot}
              {ui.code2}
            </label>
            <input
              id="pot-code"
              placeholder={ui.enterYourPotCode}
              value={code}
              maxLength={20}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="button" type="submit">
              {ui.findMy}
              {terms.potLower}
              <ArrowRight size={23} />
            </button>
          </form>
        </div>
      </section>
      <section className="wrap how" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">{ui.lessFussMoreTogether}</p>
          <h2>
            {ui.one}
            {terms.potLower}
            {ui.threeLittleSteps}
          </h2>
          <p>{ui.fromWeShouldDoSomethingToMakingIt}</p>
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
          <p className="eyebrow">{ui.forRealLifeAndRealPeople}</p>
          <h2>
            {ui.someThingsTake}
            <br />
            {ui.aWholeVillage}
          </h2>
          <p>
            {ui.aWeddingASchoolRoofAFriendWho}
            {terms.potLower}
            {ui.forIt}
          </p>
          <Link href="/p/AKWAABA" className="text-link">
            {ui.takeALookInside}
            <ArrowUpRight size={22} />
          </Link>
        </div>
        <Link href="/p/AKWAABA" className="featured-pot">
          <div className="featured-cover">
            <Image
              src={assets.covers[4]}
              alt={ui.aCalmIllustrationOfASchoolAndLeafy}
              fill
              sizes="(max-width: 700px) 100vw, 500px"
            />
            <span className="cover-label">{ui.communityInAction}</span>
          </div>
          <div className="featured-content">
            <span className="verified">
              <ShieldCheck size={19} weight="fill" />
              {ui.verifiedOrganizer}
            </span>
            <h3>{ui.aFreshStartForAkwaabaSchool}</h3>
            <p>{ui.newDesksMoreRoomToDream}</p>
            <div className="amount-line">
              <strong>{ui.gh2450}</strong>
              <span>{ui.ofGh5000}</span>
            </div>
            <div className="progress">
              <span style={{ width: '49%' }} />
            </div>
            <div className="pot-foot">
              <span>
                <UsersThree size={21} />
                {ui.label24KindPeople}
              </span>
              <span>
                {ui.view}
                {terms.potLower}
                <ArrowUpRight size={20} />
              </span>
            </div>
          </div>
        </Link>
      </section>
      <section className="trust-section">
        <div className="wrap">
          <div className="section-heading">
            <p className="eyebrow">{ui.kindnessWithClarity}</p>
            <h2>{ui.aWarmHeartAClearRecord}</h2>
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
            {ui.hackathonPrototypeMockPaymentsMoveNoMoneyLive}
          </p>
        </div>
      </section>
      <section className="faq wrap">
        <div>
          <p className="eyebrow">{ui.aFewThingsYouMightWonder}</p>
          <h2>
            {ui.letsClear}
            <br />
            {ui.thingsUp}
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
        <p className="eyebrow">{ui.yourPeopleYourPurpose}</p>
        <h2>
          {ui.letsPutALittleGood}
          <br />
          {ui.intoTheWorld}
        </h2>
        <Link href="/dashboard/new" className="button">
          {ui.startYour}
          {terms.potLower}
          <ArrowUpRight size={24} />
        </Link>
        <p>{ui.itOnlyTakesAFewMinutes}</p>
      </section>
    </>
  );
}
