import React, { useState } from 'react';

export default function QRModal({ isOpen, onClose, equipment }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !equipment) return null;

  const url = `${window.location.origin}/q/${equipment.public_id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">QR Code</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-full p-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-sm text-slate-500 mb-4">
            {equipment.name} ({equipment.serial_number})
          </p>
          
          {equipment.public_id ? (
            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
              <p>No QR Code generated</p>
            </div>
          )}
          
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={handleCopy} className="px-4 py-2 bg-teal-50 text-teal-600 font-bold text-sm rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-2">
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Copy Link
                </>
              )}
            </button>
            {equipment.public_id && (
              <a href={qrUrl} download={`${equipment.serial_number}_qr.png`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-900 transition-colors shadow-sm">
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
