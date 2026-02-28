export default function LoadingScreen({ progress = 0 }) {
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (circumference * progress) / 100;

  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96" cy="96" r="80"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-200"
          />
          <circle
            cx="96" cy="96" r="80"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-blue-500 transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-blue-600">
            {Math.round(progress)}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Loading
          </span>
        </div>
      </div>
      <p className="text-slate-500 text-sm">Preparing your quiz...</p>
    </div>
  );
}
