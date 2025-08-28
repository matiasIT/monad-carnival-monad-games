// App.tsx
import React, { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import Navbar from './components/Navbar'
import ConnectWallet from './components/ConnectWallet'
import PhaserGame from './phaser/PhaserGame'
import './App.css'
import { CONTRACT_ADDRESS, ABI } from './lib/contract'
import { monadTestnet } from './lib/chain'
import type { Address } from 'viem'
import type { ScoreEntry } from './state/types'
import { usePrivy } from '@privy-io/react-auth'

export default function App() {
  // Wagmi / wallet
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Privy / Monad Games ID
  const { authenticated, user } = usePrivy()

  // UI & game states
  const [musicVolume, setMusicVolume] = useState(0.3)
  const [paused, setPaused] = useState(false)
  const [readyForGame, setReadyForGame] = useState(false)

  // === acciones on-chain idénticas a tu Game.tsx ===
  const onCheckIn = async () => {
    if (!walletClient || !publicClient || !address) return false
    try {
      const hash = await walletClient.sendTransaction({
        account: address as Address,
        to: address as Address,
        value: 0n
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return true
    } catch {
      return false
    }
  }

  const onSaveScore = async (score: number) => {
    if (!walletClient || !publicClient) return
    const txHash = await walletClient.writeContract({
      abi: ABI,
      address: CONTRACT_ADDRESS as Address,
      functionName: 'saveScore',
      args: [BigInt(score)],
      chain: monadTestnet
    })
    await publicClient.waitForTransactionReceipt({ hash: txHash })
  }

  const fetchLeaderboard = async (): Promise<ScoreEntry[]> => {
    if (!publicClient) return []
    const raw = await publicClient.readContract({
      abi: ABI,
      address: CONTRACT_ADDRESS as Address,
      functionName: 'getTopScores',
      args: [100n]
    }) as readonly { player: Address; points: bigint; timestamp: bigint }[]
    
    const entries = raw.map(e => ({
      player: e.player as Address,
      points: Number(e.points),
      timestamp: Number(e.timestamp)
    }))
    
    const best = new Map<Address, ScoreEntry>()
    for (const it of entries) {
      const prev = best.get(it.player)
      if (!prev || it.points > prev.points) best.set(it.player, it)
    }

    return [...best.values()].sort((a,b) => b.points - a.points).slice(0,100)
  }

  // Detecta cuando el usuario Privy se autentica
  useEffect(() => {
    if (authenticated) {
      console.log('Usuario Privy autenticado:', user)
    }
  }, [authenticated, user])

  return (
    <div style={{ paddingTop: 56, minHeight: '100vh', background: '#f6f8fa' }}>
      <Navbar
        musicVolume={musicVolume}
        setMusicVolume={setMusicVolume}
        paused={paused}
        onPause={() => setPaused(true)}
        onResume={() => setPaused(false)}
      />

      <div style={{ padding: '16px' }}>
        {authenticated && user && (
          <div style={{ marginBottom: 16, fontSize: 14, color: '#555' }}>
            👤 Logged in as: {user.email?.address || user.id}
          </div>
        )}

        {!isConnected && !authenticated ? (
          <ConnectWallet onConnect={() => { /* RainbowKit abre modal */ }} />
        ) : !readyForGame ? (
          <ConnectWallet onConnect={() => setReadyForGame(true)} />
        ) : (
          <PhaserGame
            musicVolume={musicVolume}
            paused={paused}
            setPaused={setPaused}
            onCheckIn={onCheckIn}
            onSaveScore={onSaveScore}
            fetchLeaderboard={fetchLeaderboard}
          />
        )}
      </div>
    </div>
  )
}
