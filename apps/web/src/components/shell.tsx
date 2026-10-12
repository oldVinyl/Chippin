'use client';
import { ui } from '../copy/interface';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Cookie, List, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { credit, terms } from '../copy/terms';
import { assets } from '../assets/manifest';
export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <Link href="/" aria-label={ui.chippinHome} className="brand">
        <Image src={assets.mark} width={43} height={43} alt="" />
        <span>
          {ui.chippin}
          <span className="brand-dot">.</span>
        </span>
      </Link>
      <button
        className="menu-button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={26} /> : <List size={26} />}
      </button>
      <nav aria-label={ui.mainNavigation} className={open ? 'nav open' : 'nav'}>
        <Link href="/#how-it-works" onClick={() => setOpen(false)}>
          {ui.howItWorks}
        </Link>
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          {ui.my}
          {terms.potsLower}
        </Link>
        <Link
          href="/dashboard/new"
          className="button small"
          onClick={() => setOpen(false)}
        >
          {ui.startA}
          {terms.potLower}
          <ArrowUpRight size={19} weight="bold" />
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="brand" href="/">
          <Cookie size={32} weight="duotone" />
          {ui.chippin2}
        </Link>
        <span>{ui.aLittleKindnessGoesALongWay}</span>
        <nav aria-label={ui.footer}>
          <Link href="/about">{ui.about}</Link>
          <Link href="/privacy">{ui.privacy}</Link>
          <Link href="/terms">{ui.terms2}</Link>
          <Link href="/data-request">{ui.yourData}</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>{ui.madeForTheMomentsWeShare}</span>
        <a href={credit.url} target="_blank" rel="noopener noreferrer">
          {ui.builtBy}
          <strong>{credit.organization}</strong>
          {ui.by2} <strong>{credit.creator}</strong>
          <ArrowUpRight size={16} />
        </a>
      </div>
    </footer>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="loading-cookie" />
      <p>{ui.gettingThingsReady}</p>
    </div>
  );
}
export function ErrorNote({ message }: { message: string }) {
  return message ? (
    <p className="error-note" role="alert">
      {message}
    </p>
  ) : null;
}
