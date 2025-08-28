import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { phaserConfig } from '../phaserConfig';

import BootScene from './scenes/BootScene';
import CheckInScene from './scenes/CheckInScene';
import HubScene from './scenes/HubScene';
import ShooterScene, { ShooterPublicAPI } from './scenes/ShooterScene';

import Leaderboard from '../components/Leaderboard';
import type { ScoreEntry } from '../state/types';

type Props = {
  musicVolume: number;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  onCheckIn: () => Promise<boolean>;
  onSaveScore: (score: number) => Promise<void>;
  fetchLeaderboard: () => Promise<ScoreEntry[]>;
};

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, style, children, ...rest }) => (
  <button
    {...rest}
    className={['carnival-btn', className].filter(Boolean).join(' ')}
    // cast simple para que TS no proteste
    style={style as React.CSSProperties}
  >
    {children}
  </button>
);

export default function PhaserGame({
  musicVolume, paused, setPaused, onCheckIn, onSaveScore, fetchLeaderboard
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const [gameAPI, setGameAPI] = useState<ShooterPublicAPI | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [levelName, setLevelName] = useState<'Fácil' | 'Medio' | 'Difícil'>('Fácil');

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Montar Phaser una sola vez
  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;

    const boot = new BootScene();

    const checkIn = new CheckInScene(async () => {
      try { return await onCheckIn(); } catch { return false; }
    });

    const hub = new HubScene(() => boot.game?.scene.start('Shooter'));

    const shooter = new ShooterScene({
      onGameOver: (score) => {
        setFinalScore(score);     // mostramos overlay
      }
    });

    // exponer API pública del shooter a React
    shooter.exposePublicAPI = (api) => setGameAPI(api);
    shooter.onLevelNameChanged = (label: 'Fácil' | 'Medio' | 'Difícil') => setLevelName(label);

    const cfg: Phaser.Types.Core.GameConfig = {
      ...phaserConfig,
      parent: hostRef.current,
      scene: [boot, checkIn, hub, shooter],
    };

    gameRef.current = new Phaser.Game(cfg);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [onCheckIn, setPaused, setFinalScore]);

  // volumen música
  useEffect(() => { gameAPI?.setMusicVolume(musicVolume); }, [musicVolume, gameAPI]);

  // pausa / reanudar
  useEffect(() => {
    if (!gameAPI) return;
    if (paused) gameAPI.pause(); else gameAPI.resume();
  }, [paused, gameAPI]);

  // leaderboard (sólo cuando se abre)
  useEffect(() => {
    if (!showLeaderboard) return;
    fetchLeaderboard().then(setLeaderboard).catch(() => {});
  }, [showLeaderboard, fetchLeaderboard]);

  // acciones overlay
  const retry = (e?: React.MouseEvent) => {
  e?.stopPropagation();
  // Reiniciamos primero, cerramos overlay después.
  gameAPI?.restart();
  setFinalScore(null);
    };

  const nextLevel = (e?: React.MouseEvent) => {
  e?.stopPropagation();
  gameAPI?.nextLevel();
  setFinalScore(null);
};

  const saveOnChain = async (e?: React.MouseEvent) => {
  e?.stopPropagation();
  if (finalScore == null) return;
  setSaving(true);
  try {
    await onSaveScore(finalScore);  // SOLO aquí se firma tx
  } catch (err) {
    console.error('Error guardando score on-chain:', err);
  }
  setSaving(false);
};


  return (
  <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
    <div
      id="phaser-root"
      ref={hostRef}
      style={{
        aspectRatio: '1403 / 1024',
        width: '100%',
        background: 'transparent'
      }}
    />

    {/* Overlay fin de ronda */}
    {finalScore !== null && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          pointerEvents: 'auto'
        }}
      >
        {/* Capa oscura detrás */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            pointerEvents: 'auto'
          }}
        />

        {/* Contenedor central arcade */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            height: '100%',
            fontFamily: "'Press Start 2P', cursive"
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg,#222,#151515)',
              border: '4px solid #ffcc00',
              borderRadius: 18,
              padding: 22,
              color: '#fff',
              textAlign: 'center',
              minWidth: 320,
              boxShadow: '0 0 20px #ffcc00'
            }}
          >
            {/* Título */}
            <div
              style={{
                fontSize: 26,
                marginBottom: 8,
                textShadow: '2px 2px #000'
              }}
            >
              🏁 ¡Ronda terminada!
            </div>

            {/* Info */}
            <div
              style={{
                fontSize: 18,
                opacity: 0.9,
                marginBottom: 14
              }}
            >
              Puntos: <b>{finalScore}</b> • Nivel: <b>{levelName}</b>
            </div>

            {/* Botones principales */}
            <div style={{ marginBottom: 8 }}>
              <Btn onClick={retry}>Reintentar</Btn>
              <Btn onClick={nextLevel} style={{ marginLeft: 10 }}>
                Siguiente nivel
              </Btn>
            </div>

            {/* Acciones secundarias */}
            <div style={{ marginTop: 6 }}>
              <button
                type="button"
                className="carnival-btn-secondary"
                disabled={saving}
                onClick={saveOnChain}
                style={{ marginRight: 8 }}
              >
                {saving ? 'Guardando…' : 'Guardar score on-chain'}
              </button>

              <button
                type="button"
                className="carnival-btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLeaderboard(true);
                }}
              >
                Ver Leaderboard
              </button>
              <Btn
                onClick={() => {
                    setFinalScore(null);
                    setPaused(false);
                    gameAPI?.goToHub();
                }}
                style={{ marginLeft: 10 }}
                >
                Volver al Hub
                </Btn>

            </div>
          </div>
        </div>
      </div>
    )}

    {/* Leaderboard modal */}
    {showLeaderboard && (
      <Leaderboard
        leaderboard={leaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    )}
  </div>
);
}
