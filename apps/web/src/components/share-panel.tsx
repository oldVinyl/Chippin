'use client';
import { ui } from '../copy/interface';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Copy,
  ShareNetwork,
  DownloadSimple,
  Check,
} from '@phosphor-icons/react';
import { shareText } from '@chippin/shared';
export function SharePanel({ name, code }: { name: string; code: string }) {
  const [svg, setSvg] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const link =
    typeof location === 'undefined' ? '' : `${location.origin}/p/${code}`;
  useEffect(() => {
    void QRCode.toString(`${location.origin}/p/${code}`, {
      type: 'svg',
      color: { dark: '#442d1c', light: '#fffaf1' },
      margin: 2,
    }).then(setSvg);
  }, [code]);
  const text = shareText(name, link);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError(
        'Copy is unavailable in this browser. Use Share or copy the address bar.',
      );
    }
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer',
      );
  }
  return (
    <section className="share-panel" aria-label={ui.shareThisPot}>
      <h3>{ui.bringYourPeople}</h3>
      <div className="share-actions">
        <button className="button secondary" onClick={copy}>
          {copied ? <Check size={20} /> : <Copy size={20} />}{' '}
          {copied ? ui.copied : ui.copyLink}
        </button>
        <button className="button secondary" onClick={share}>
          <ShareNetwork size={20} />
          {ui.share}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {svg && (
        <>
          <div
            style={{ width: 135 }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <a
            className="download"
            download={`chippin-${code}.svg`}
            href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
          >
            <DownloadSimple size={17} style={{ display: 'inline' }} />
            {ui.downloadQrCode}
          </a>
        </>
      )}
      <p className="helper">
        {ui.potCode}
        <strong>{code}</strong>
      </p>
    </section>
  );
}
