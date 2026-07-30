export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDanger ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100'}`}>
          <h3 className={`font-bold text-lg ${isDanger ? 'text-rose-900' : 'text-gray-900'}`}>{title}</h3>
          <button onClick={onClose} className={`hover:opacity-75 transition-opacity ${isDanger ? 'text-rose-400' : 'text-gray-400'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all ${
                isDanger 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                  : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
