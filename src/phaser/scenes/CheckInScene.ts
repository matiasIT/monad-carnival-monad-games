import Phaser from 'phaser';

function fit(img: Phaser.GameObjects.Image, mw: number, mh: number) {
  const s = Math.min(mw / img.width, mh / img.height);
  img.setScale(s);
}

export default class CheckInScene extends Phaser.Scene {
  private onCheck!: () => Promise<void | boolean>;
  constructor(onCheck: () => Promise<void | boolean>) {
    super('CheckIn');
    this.onCheck = onCheck;
  }

  create() {
    const cam = this.cameras.main;
    const cx = cam.centerX;
    const cy = cam.centerY;

    const btn = this.add.image(cx, cy, 'checkin-btn')
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' });

    fit(btn, cam.width * 0.35, cam.height * 0.18);

    btn.on('pointerup', async () => {
      btn.disableInteractive();
      try {
        const ok = (await this.onCheck?.()) === true;
        if (ok) {
          this.scene.start('Hub');
        } else {
          btn.setInteractive({ cursor: 'pointer' });
        }
      } catch {
        btn.setInteractive({ cursor: 'pointer' });
      }
    });
  }
}
