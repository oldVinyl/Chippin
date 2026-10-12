'use client';
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
      <Link href="/" aria-label="Chippin home" className="brand">
        <Image src={assets.mark} width={43} height={43} alt="" />
        <span>
          chippin<span className="brand-dot">.</span>
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
      <nav aria-label="Main navigation" className={open ? 'nav open' : 'nav'}>
        <Link href="/#how-it-works" onClick={() => setOpen(false)}>
          How it works
        </Link>
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          My {terms.potsLower}
        </Link>
        <Link
          href="/dashboard/new"
          className="button small"
          onClick={() => setOpen(false)}
        >
          Start a {terms.potLower}
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
          chippin.
        </Link>
        <span>A little kindness goes a long way.</span>
        <nav aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-request">Your data</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>Made for the moments we share.</span>
        <a href={credit.url} target="_blank" rel="noopener noreferrer">
          Built by <strong>{credit.organization}</strong>, by{' '}
          <strong>{credit.creator}</strong>
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
      <p>Getting things ready…</p>
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
