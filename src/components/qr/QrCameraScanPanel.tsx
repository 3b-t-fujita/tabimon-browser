'use client';

import { useEffect, useRef, useState } from 'react';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScanQrImageUseCase } from '@/application/qr/scanQrImageUseCase';

interface QrCameraScanPanelProps {
  onTextDecoded: (text: string) => void;
  disabled: boolean;
}

export default function QrCameraScanPanel({ onTextDecoded, disabled }: QrCameraScanPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const decodedRef = useRef(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopCamera = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (disabled) stopCamera();
  }, [disabled]);

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || decodedRef.current) return;

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = new ScanQrImageUseCase().fromImageData(imageData);
        if (result.ok) {
          decodedRef.current = true;
          stopCamera();
          onTextDecoded(result.value.text);
          return;
        }
      }
    }

    frameRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    if (disabled) return;

    stopCamera();
    setErrorMessage(null);
    setMessage('カメラを ひらいています');
    decodedRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('このブラウザでは カメラが つかえません。');
      setMessage(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setMessage('コードを うつしてね');
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      stopCamera();
      setMessage(null);
      setErrorMessage('カメラを ひらけませんでした。きょかを みてね。');
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-[30px] border border-[#d6f0f3] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eef7f8] text-3xl">📷</div>
        <div className="min-w-0">
          <p className="text-lg font-black text-[#2c302b]">カメラで よむ</p>
          <p className="mt-1 text-sm text-[#595c57]">コードを うつしてね。</p>
        </div>
      </div>

      {isCameraActive && (
        <div className="relative overflow-hidden rounded-[24px] bg-[#1f3528]">
          <video
            ref={videoRef}
            className="aspect-[4/3] w-full object-cover"
            muted
            playsInline
          />
          <div className="pointer-events-none absolute inset-8 rounded-[20px] border-4 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.22)]" />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {message && <p className="text-center text-sm font-bold text-[#29664c]">{message}</p>}
      {errorMessage && <p className="rounded-[18px] bg-[#fff1ec] px-4 py-3 text-sm font-bold text-[#b02500]">{errorMessage}</p>}

      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton
          type="button"
          onClick={startCamera}
          disabled={disabled || isCameraActive}
          className="py-3 text-sm"
        >
          カメラで よむ
        </PrimaryButton>
        <button
          type="button"
          onClick={stopCamera}
          disabled={!isCameraActive}
          className="rounded-full bg-[#e6e9e1] px-4 py-3 text-sm font-black text-[#29664c] transition active:scale-95 disabled:opacity-45"
        >
          とじる
        </button>
      </div>
    </section>
  );
}
