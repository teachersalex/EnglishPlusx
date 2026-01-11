// src/components/home/SeriesRow.jsx
// Row horizontal de cards estilo Netflix
// ============================================

import SeriesCard from './SeriesCard'

export default function SeriesRow({ 
  title, 
  series, 
  onSeriesClick, 
  diamondSeries, 
  completedSeriesIds 
}) {
  if (!series || series.length === 0) return null
  
  return (
    <div className="mb-8">
      <h2 className="text-[#1A1A1A] text-xl font-bold mb-4 flex items-center gap-2">
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
        {series.map(s => (
          <SeriesCard 
            key={s.id} 
            series={s} 
            onClick={() => onSeriesClick(s.id)} 
            hasDiamond={diamondSeries[s.id] || false}
            isCompleted={completedSeriesIds.some(id => parseInt(id, 10) === s.id)}
          />
        ))}
      </div>
    </div>
  )
}