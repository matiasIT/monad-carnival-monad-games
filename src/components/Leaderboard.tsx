import React from 'react'
import type { ScoreEntry } from '../state/types'
import { useAccount } from 'wagmi'

export default function Leaderboard({
  leaderboard,
  onClose
}: {
  leaderboard: ScoreEntry[]
  onClose: () => void
}) {
  const { address } = useAccount()

  const getMedal = (pos: number) => {
    if (pos === 0) return '🥇'
    if (pos === 1) return '🥈'
    if (pos === 2) return '🥉'
    return null
  }

  const getMedalBg = (pos: number) => {
    if (pos === 0) return 'rgba(255,223,0,0.15)' // dorado
    if (pos === 1) return 'rgba(192,192,192,0.18)' // plateado
    if (pos === 2) return 'rgba(205,127,50,0.18)' // bronce
    return 'transparent'
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.94)',
          borderRadius: 20,
          padding: 20,
          maxWidth: 420,
          width: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '4px solid #dbbbfa',
          boxShadow: '0 10px 38px #bdd8f386, 0 2px 8px #f6bbfc65',
          fontFamily: "'Luckiest Guy','Comic Sans MS',cursive,sans-serif"
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            fontSize: 34,
            color: '#6743b3',
            marginBottom: 14,
            textShadow: '0 3px 8px #dec8ff'
          }}
        >
          🏆 Leaderboard
        </h2>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: 6
          }}
        >
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#555' }}>Sin datos aún</p>
          ) : (
            leaderboard.map((entry, i) => {
              const isMe =
                address && entry.player.toLowerCase() === address.toLowerCase()
              const medal = getMedal(i)
              const medalBg = getMedalBg(i)

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: isMe
                      ? '#f3eaff'
                      : medal
                      ? medalBg
                      : 'transparent',
                    borderBottom: '1.6px solid #e0d3f5',
                    color: isMe ? '#4d2b8f' : '#222',
                    fontWeight: isMe || medal ? 'bold' : 'normal'
                  }}
                >
                  <span>
                    {medal && <span style={{ marginRight: 6 }}>{medal}</span>}
                    {i + 1}. {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                  </span>
                  <span style={{ color: medal ? '#6743b3' : '#555' }}>
                    {entry.points}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#6743b3',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
