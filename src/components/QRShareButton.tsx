import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRShareButtonProps {
  url: string;
  title: string;
}

const QRShareButton: React.FC<QRShareButtonProps> = ({ url, title }) => {
  const [open, setOpen] = useState(false);

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement('a');
      a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline rounded-none text-sm flex items-center gap-2"
      >
        <QrCode className="w-4 h-4" /> QR Code
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              className="relative bg-card border-2 border-foreground p-6 max-w-xs w-full text-center z-10"
              style={{ boxShadow: '6px 6px 0 hsl(var(--foreground))' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-display text-xl tracking-wider mb-4">SCAN TO READ</h3>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={url}
                  size={200}
                  level="H"
                  fgColor="#1a1a1a"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-4 font-medium truncate">{title}</p>
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-sm border-2 border-foreground"
                style={{ boxShadow: '3px 3px 0 hsl(var(--foreground))' }}
              >
                <Download className="w-4 h-4" /> Download QR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QRShareButton;
