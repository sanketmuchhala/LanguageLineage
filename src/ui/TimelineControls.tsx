import { useEffect, useRef, useCallback } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import './TimelineControls.css';

const MIN_YEAR = 1940;
const MAX_YEAR = 2023;
const PLAYBACK_INTERVAL_MS = 150;

const DECADES = [
  { label: '1950s', year: 1959 },
  { label: '1960s', year: 1969 },
  { label: '1970s', year: 1979 },
  { label: '1980s', year: 1989 },
  { label: '1990s', year: 1999 },
  { label: '2000s', year: 2009 },
  { label: '2010s', year: 2019 },
  { label: '2020s', year: 2023 },
];

export function TimelineControls() {
  const filters = useGraphStore((s) => s.filters);
  const timelineYear = useGraphStore((s) => s.timelineYear);
  const isTimelinePlaying = useGraphStore((s) => s.isTimelinePlaying);
  const setTimelineYear = useGraphStore((s) => s.setTimelineYear);
  const setIsTimelinePlaying = useGraphStore((s) => s.setIsTimelinePlaying);

  const intervalRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTimelinePlaying(false);
  }, [setIsTimelinePlaying]);

  const startPlayback = useCallback(() => {
    stopPlayback();
    setIsTimelinePlaying(true);
    intervalRef.current = window.setInterval(() => {
      const current = useGraphStore.getState().timelineYear;
      if (current >= MAX_YEAR) {
        stopPlayback();
        return;
      }
      setTimelineYear(current + 1);
    }, PLAYBACK_INTERVAL_MS);
  }, [setTimelineYear, setIsTimelinePlaying, stopPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (filters.layoutMode !== 'timeline') {
    return null;
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value, 10);
    setTimelineYear(year);
  };

  const handleReset = () => {
    stopPlayback();
    setTimelineYear(MIN_YEAR);
  };

  const handlePlayPause = () => {
    if (isTimelinePlaying) {
      stopPlayback();
    } else {
      if (timelineYear >= MAX_YEAR) {
        setTimelineYear(MIN_YEAR);
      }
      startPlayback();
    }
  };

  return (
    <div className="timeline-controls">
      <div className="timeline-year-row">
        <span className="timeline-year-display">{timelineYear}</span>
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          step={1}
          value={timelineYear}
          onChange={handleSliderChange}
          className="timeline-slider"
          aria-label="Timeline year slider"
        />
      </div>

      <div className="timeline-playback-row">
        <button
          className="timeline-btn"
          onClick={handlePlayPause}
          aria-label={isTimelinePlaying ? 'Pause' : 'Play'}
        >
          {isTimelinePlaying ? 'Pause' : 'Play'}
        </button>
        <button
          className="timeline-btn"
          onClick={handleReset}
          aria-label="Reset timeline to 1940"
        >
          Reset
        </button>
      </div>

      <div className="timeline-decade-row">
        {DECADES.map((d) => (
          <button
            key={d.label}
            className={`timeline-decade-btn ${timelineYear === d.year ? 'active' : ''}`}
            onClick={() => {
              stopPlayback();
              setTimelineYear(d.year);
            }}
            aria-label={`Jump to ${d.label}`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
