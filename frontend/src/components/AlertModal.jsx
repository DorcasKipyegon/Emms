export default function AlertModal({ isOpen, onClose, title, message, type = "success", buttonText = "OK" }) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
        <div className={`p-6 ${isSuccess ? 'bg-teal-50/50' : 'bg-rose-50/50'}`}>
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-teal-100 text-teal-500' : 'bg-rose-100 text-rose-500'}`}>
            {isSuccess ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <h3 className="font-bold text-xl text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-sm transition-all ${
              isSuccess 
                ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20' 
                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
