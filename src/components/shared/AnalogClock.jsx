import { useState, useEffect } from 'react';

export default function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourAngle = (hours * 30) + (minutes * 0.5);
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  const formatStylizedDate = (date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayOfWeek = dayNames[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = monthNames[date.getMonth()];
    
    const getOrdinalSuffix = (day) => {
      if (day >= 11 && day <= 13) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `ᆢ𑇢﹒${dayOfWeek} 〃 ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)} ﹒${month}ᆢ`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-slate-900/20 backdrop-blur-md border border-white/10 rounded-[var(--panel-radius)] p-4 shadow-xl">
      <div className="text-center mb-3">
        <div className="text-xs font-medium text-slate-300 mb-1 tracking-wide">
          {formatStylizedDate(time)}
        </div>
        <div className="text-sm font-mono text-slate-200">
          {formatTime(time)}
        </div>
      </div>
      
      <div className="relative w-24 h-24 mx-auto">
        {/* Clock Face */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/90 border-2 border-[var(--color-gold)]/30 shadow-inner">
          {/* Hour Markers */}
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-3 bg-[var(--color-gold)] rounded-full"
              style={{
                top: '4px',
                left: '50%',
                transformOrigin: '50% 44px',
                transform: `translateX(-50%) rotate(${i * 30}deg)`
              }}
            />
          ))}
          
          {/* Minute Markers */}
          {Array.from({ length: 60 }, (_, i) => {
            if (i % 5 !== 0) {
              return (
                <div
                  key={i}
                  className="absolute w-px h-1.5 bg-slate-400/60 rounded-full"
                  style={{
                    top: '6px',
                    left: '50%',
                    transformOrigin: '50% 42px',
                    transform: `translateX(-50%) rotate(${i * 6}deg)`
                  }}
                />
              );
            }
            return null;
          })}

          {/* Hour Hand */}
          <div
            className="absolute w-1 bg-[var(--color-gold)] rounded-full shadow-lg origin-bottom"
            style={{
              height: '28px',
              bottom: '50%',
              left: '50%',
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${hourAngle}deg)`
            }}
          />

          {/* Minute Hand */}
          <div
            className="absolute w-0.5 bg-slate-100 rounded-full shadow-lg origin-bottom"
            style={{
              height: '38px',
              bottom: '50%',
              left: '50%',
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${minuteAngle}deg)`
            }}
          />

          {/* Second Hand */}
          <div
            className="absolute w-px bg-[var(--color-burgundy)] rounded-full shadow-lg origin-bottom"
            style={{
              height: '40px',
              bottom: '50%',
              left: '50%',
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${secondAngle}deg)`,
              transition: seconds === 0 ? 'none' : 'transform 0.1s ease-out'
            }}
          />

          {/* Center Dot */}
          <div className="absolute w-2 h-2 bg-[var(--color-gold)] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg" />
        </div>
      </div>
    </div>
  );
}