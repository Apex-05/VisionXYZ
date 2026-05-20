'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Copy, Check, Wifi, Smartphone } from 'lucide-react';

interface MobileConnectProps {
  onClose: () => void;
  onConnectIPStream: (url: string) => void;
}

// Detect local network IP via WebRTC ICE candidate trick
async function detectLocalIP(): Promise<string> {
  return new Promise((resolve) => {
    let resolved = false;
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('probe');
      pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => {});
      pc.onicecandidate = (e) => {
        if (resolved) return;
        const candidate = e.candidate?.candidate ?? '';
        const match = candidate.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
        if (match && !match[1].startsWith('127.') && !match[1].startsWith('169.')) {
          resolved = true;
          pc.close();
          resolve(match[1]);
        }
      };
      setTimeout(() => { if (!resolved) { resolved = true; resolve('localhost'); } }, 2500);
    } catch {
      resolve('localhost');
    }
  });
}

const IP_WEBCAM_TIPS = [
  { app: 'IP Webcam (Android)', url: 'http://PHONE_IP:8080/video' },
  { app: 'DroidCam (Android/iOS)', url: 'http://PHONE_IP:4747/video' },
  { app: 'EpocCam (iOS)', url: 'http://PHONE_IP:2431/video' },
  { app: 'Any MJPEG stream', url: 'http://IP:PORT/path' },
];

export function MobileConnect({ onClose, onConnectIPStream }: MobileConnectProps) {
  const [localIP, setLocalIP] = useState<string>('detecting…');
  const [localURL, setLocalURL] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [ipInput, setIPInput] = useState('');
  const [connectError, setConnectError] = useState('');
  const [tab, setTab] = useState<'phone' | 'ipcam'>('phone');

  useEffect(() => {
    detectLocalIP().then((ip) => {
      setLocalIP(ip);
      const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      setLocalURL(`${window.location.protocol}//${ip}:${port}`);
    });
  }, []);

  const copyURL = useCallback(async () => {
    if (!localURL) return;
    await navigator.clipboard.writeText(localURL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [localURL]);

  const handleConnectIP = useCallback(() => {
    const url = ipInput.trim();
    if (!url) { setConnectError('Enter a stream URL'); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setConnectError('URL must start with http://');
      return;
    }
    setConnectError('');
    onConnectIPStream(url);
    onClose();
  }, [ipInput, onConnectIPStream, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-surface-200 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-accent-cyan" />
            <span className="font-mono text-sm font-bold text-white">Connect Camera</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['phone', 'ipcam'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
                tab === t
                  ? 'text-accent-cyan border-b-2 border-accent-cyan bg-accent-cyan/5'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'phone' ? '📱 Phone Browser' : '🌐 IP Webcam / Stream'}
            </button>
          ))}
        </div>

        <div className="px-5 py-5">
          {tab === 'phone' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Open VisionXYZ on your phone browser on the same Wi-Fi network. Your phone camera will be used automatically.
              </p>

              {/* Local IP URL */}
              <div className="bg-surface-300 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wifi className="w-3.5 h-3.5 text-accent-cyan" />
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Local Network URL</span>
                </div>
                <div className="font-mono text-sm text-white break-all mb-3 bg-black/30 rounded-lg px-3 py-2 border border-gray-700">
                  {localURL || `http://${localIP}:3000`}
                </div>
                <button
                  onClick={copyURL}
                  className="flex items-center gap-1.5 text-xs font-mono text-accent-cyan hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
              </div>

              {/* QR code via external image API — works with credentialless COEP */}
              {localURL && localURL !== 'http://localhost:3000' && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-gray-500 font-mono">Or scan with your phone camera:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(localURL)}&bgcolor=1a1a1a&color=00d4ff&qzone=2`}
                    alt="QR code for local URL"
                    width={160}
                    height={160}
                    className="rounded-xl border border-gray-700"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
                <p className="text-xs text-yellow-400/80 font-mono leading-relaxed">
                  Make sure your phone and computer are on the same Wi-Fi network. Phone IP: {localIP}
                </p>
              </div>
            </div>
          )}

          {tab === 'ipcam' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Stream from an IP webcam app on your phone or any MJPEG/HTTP stream source.
              </p>

              {/* Known apps */}
              <div className="space-y-1.5">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Common apps:</p>
                {IP_WEBCAM_TIPS.map((tip) => (
                  <button
                    key={tip.app}
                    onClick={() => setIPInput(tip.url)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-surface-300 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="text-xs font-mono text-white">{tip.app}</div>
                    <div className="text-xs font-mono text-gray-500">{tip.url}</div>
                  </button>
                ))}
              </div>

              {/* URL input */}
              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1.5">Stream URL:</label>
                <input
                  type="url"
                  value={ipInput}
                  onChange={(e) => { setIPInput(e.target.value); setConnectError(''); }}
                  placeholder="http://192.168.1.x:8080/video"
                  className="w-full bg-surface-300 border border-gray-700 focus:border-accent-cyan/50 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 outline-none transition-colors"
                />
                {connectError && (
                  <p className="text-xs text-red-400 font-mono mt-1">{connectError}</p>
                )}
              </div>

              <button
                onClick={handleConnectIP}
                className="w-full py-2.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/40 hover:border-accent-cyan text-accent-cyan font-mono text-xs rounded-xl transition-all"
              >
                Connect Stream
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
