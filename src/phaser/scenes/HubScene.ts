import Phaser from 'phaser'

export default class HubScene extends Phaser.Scene {
  private onStart!: () => void

  constructor(onStart: () => void) {
    super('Hub')
    this.onStart = onStart
  }

  create() {
    const cam = this.cameras.main
    const cx = cam.centerX
    const cy = cam.centerY

    const sign = this.add.image(cx, cy, 'hub-sign').setOrigin(0.5)
    const s = Math.min(
      cam.width * 0.92 / sign.width,
      cam.height * 0.85 / sign.height
    )
    sign.setScale(s)

    // zona clickeable (aprox. zona central del cartel)
    const zone = this.add.zone(
      cx,
      cy + sign.displayHeight * 0.1,
      sign.displayWidth * 0.5,
      sign.displayHeight * 0.22
    )
      .setInteractive({ cursor: 'pointer' })

    zone.once('pointerup', () => {
      // Limpia el área clickeable antes de cambiar de escena
      zone.disableInteractive()
      zone.destroy()

      // También podemos parar la escena para asegurarnos
      this.scene.stop()

      // Ejecutar callback para iniciar el juego
      this.onStart?.()
    })
  }
}
