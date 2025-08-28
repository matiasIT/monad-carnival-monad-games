import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Navbar({
  musicVolume,
  setMusicVolume,
  paused,
  onPause,
  onResume
}: {
  musicVolume: number
  setMusicVolume: (v: number) => void
  paused: boolean
  onPause: () => void
  onResume: () => void
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 56,
      background: 'rgba(34,37,53,0.92)',
      backdropFilter: 'blur(6px)',
      zIndex: 1000,
      borderBottom: '2px solid #252939',
      padding: '0 16px'
    }}>
      {/* IZQ: control juego */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={paused ? onResume : onPause}
          style={{
            fontSize: 21,
            border: 'none',
            background: paused ? '#c0dbdb' : '#ebffe6',
            color: '#222',
            padding: '5px 12px',
            borderRadius: 7,
            cursor: 'pointer'
          }}
        >
          {paused ? '▶️ Reanudar' : '⏸️ Pausa'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 18, marginRight: 4 }}>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            style={{ width: 80, verticalAlign: 'middle' }}
          />
        </div>
      </div>

      {/* DER: wallet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ConnectButton showBalance={false} chainStatus="none" />
      </div>
    </div>
  )
}
