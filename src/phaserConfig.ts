import Phaser from 'phaser'

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  transparent: true,                 // sin fondo negro
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
}
