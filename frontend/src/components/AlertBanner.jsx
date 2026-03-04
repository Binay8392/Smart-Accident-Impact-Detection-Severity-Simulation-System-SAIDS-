import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function AlertBanner({ result, onDismiss }) {
  if (!result || Number(result.severity) !== 3) {
    return null
  }

  return (
    <div className="mx-4 my-2 rounded-xl border border-red-500/45 bg-red-500/15 px-4 py-3 anim-slide-up lg:mx-6">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="text-red-300" />
        <p className="flex-1 text-sm font-bold text-red-200">Emergency Alert Triggered</p>
        <button onClick={onDismiss} className="text-red-200 transition-colors hover:text-white">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
