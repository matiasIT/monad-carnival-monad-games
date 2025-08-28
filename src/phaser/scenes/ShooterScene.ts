import Phaser from 'phaser';

type TargetKind = 'good' | 'bad';
type TargetData = { kind: TargetKind; rowIdx: number; isShot?: boolean };
interface ImageWithId extends Phaser.GameObjects.Image { _tid: number }

const GAME_DURATION = 30;

const LEVELS = [
  { objLife: 2000, gap: 3500 },
  { objLife: 1500,  gap: 2700 },
  { objLife: 1000,  gap: 2000  },
] as const;

const ROWS = [
  { yP: 0.74, scale: 1.30, xs: [0.18, 0.34, 0.50, 0.66, 0.82] },
  { yP: 0.54, scale: 1.00, xs: [0.27, 0.39, 0.51, 0.63, 0.74] },
  { yP: 0.34, scale: 0.70, xs: [0.31, 0.41, 0.51, 0.60, 0.70] },
] as const;

export type ShooterPublicAPI = {
  pause: () => void; resume: () => void; setMusicVolume: (v: number) => void;
  restart: () => void; nextLevel: () => void; goToHub: () => void;
};

export default class ShooterScene extends Phaser.Scene {
  exposePublicAPI?: (api: ShooterPublicAPI) => void;
  onLevelNameChanged?: (name: 'Fácil'|'Medio'|'Difícil') => void;

  private music!: Phaser.Sound.BaseSound;
  private shoot!: Phaser.Sound.BaseSound;

  private timer = GAME_DURATION;
  private score = 0;
  private level = 0;

  private hudBG!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;

  private waveTimer?: Phaser.Time.TimerEvent;
  private tickTimer?: Phaser.Time.TimerEvent;

  private objs: ImageWithId[] = [];
  private meta = new Map<number, TargetData>();
  private masks: Phaser.Display.Masks.GeometryMask[] = [];

  private busySlots = new Set<string>();

  private onGameOver!: (score: number) => void;
  constructor (opts: { onGameOver: (score: number) => void }) {
    super('Shooter');
    this.onGameOver = opts.onGameOver;
  }

  create () {
  // --- Limpieza de inputs interactivos residuales ---
  this.input.removeAllListeners();

  this.children.list.forEach((child) => {
    if (
      'removeInteractive' in child &&
      typeof (child as Phaser.GameObjects.GameObject & { removeInteractive: () => void }).removeInteractive === 'function'
    ) {
      (child as Phaser.GameObjects.GameObject & { removeInteractive: () => void }).removeInteractive();
    }
  });

  const cam = this.cameras.main;

  // Fondo
  this.add.image(cam.centerX, cam.centerY, 'bg')
    .setOrigin(0.5)
    .setDisplaySize(cam.width, cam.height);

  // Sonidos
  this.music = this.sound.add('music', { loop: true, volume: 0.3 });
  this.shoot = this.sound.add('shoot', { loop: false, volume: 0.14 });
  this.music.play();

  // HUD
  this.hudBG = this.add.graphics().setDepth(11);
  this.hudText = this.add.text(0, 0, '', {
    fontFamily: 'Press Start 2P',
    fontSize: '22px',
    color: '#ffffff',
  }).setDepth(12).setOrigin(0, 0.5);
  this.layoutHud();

  // Cursor crosshair siempre
  const cross = `url(${this.textures.getBase64('crosshair')}) 32 32, crosshair`;
  this.input.setDefaultCursor(cross);
  this.input.setTopOnly(true);

  this.buildSlotMasks();

  // Evitar que cualquier Graphics sea interactivo
  this.children.list.forEach(c => {
    if (c instanceof Phaser.GameObjects.Graphics) {
      c.disableInteractive();
    }
  });

  this.startRound();

  this.exposePublicAPI?.({
    goToHub: () => {
  this.music.stop();
  this.sound.stopAll();
  this.scene.stop();
  this.scene.start('Hub');},
    pause: () => { this.scene.pause(); this.music.pause(); },
    resume: () => { this.scene.resume(); if (this.timer > 0) this.music.resume(); },
    setMusicVolume: (v) => (this.music as Phaser.Sound.HTML5AudioSound).setVolume(v),
    restart: () => this.restartGame(),
    nextLevel: () => this.nextLevel(),
  });

  this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearAll());
  this.events.once(Phaser.Scenes.Events.DESTROY, () => this.clearAll());

  // --- DEBUG ---
;}



// --- Limpieza de hitbox invisible cada frame ---
update () {
  // Recorre todos los hijos de la escena
  this.children.list.forEach(child => {
    if (
      child instanceof Phaser.GameObjects.Image && // es imagen
      child.input &&                               // tiene input activo
      !child.visible                               // pero está invisible
    ) {
      child.disableInteractive(); // le quitamos la interactividad
    }
  });
}


  private buildSlotMasks () {
    const cam = this.cameras.main;

    this.masks.forEach(m => m.destroy());
    this.masks = [];

    ROWS.forEach(row => {
  const y = cam.height * row.yP;
  const size = this.baseTargetSize() * row.scale;
  const gapH = size * 1.05; // altura un poco mayor que el sprite

  const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, y - gapH / 2, cam.width, gapH);
    g.setVisible(false);

    // fuerza a quitar cualquier input por si acaso
    (g as Phaser.GameObjects.Graphics).disableInteractive();

    const mask = g.createGeometryMask();
    this.masks.push(mask);

    });
  }

  private baseTargetSize (): number {
    return Math.max(56, Math.round(this.cameras.main.width / 14));
  }

  private levelLabel () {
    const names: Array<'Fácil'|'Medio'|'Difícil'> = ['Fácil','Medio','Difícil'];
    this.onLevelNameChanged?.(names[this.level]);
  }

  private startRound () {
    this.clearAll();
    this.busySlots.clear();
    this.score = 0;
    this.timer = GAME_DURATION;
    this.levelLabel();
    this.updateHud();

    const { gap, objLife } = LEVELS[this.level];

    this.waveTimer = this.time.addEvent({
      delay: gap,
      loop: true,
      callback: () => this.spawnWave(objLife),
    });

    this.tickTimer = this.time.addEvent({
      delay: 1000,
      repeat: GAME_DURATION,
      callback: () => {
        this.timer -= 1;
        this.updateHud();
        if (this.timer <= 0) {
          this.waveTimer?.remove();
          this.tickTimer?.remove();
          this.waitForLastTargetsThenEnd();
        }
      },
    });
  }

  private spawnWave (lifeMs: number) {
    const cam = this.cameras.main;
    const sizeBase = this.baseTargetSize();

    ROWS.forEach((row, rowIdx) => {
      const picks = Phaser.Utils.Array.Shuffle([...row.xs])
        .slice(0, Phaser.Math.Between(1, row.xs.length));

      const y = cam.height * row.yP;
      const openDepth = Math.round(sizeBase * 0.62 * row.scale);

      picks.forEach((xP, i) => {
        const slotKey = `${rowIdx}:${Math.round(xP * 1000)}`;
        if (this.busySlots.has(slotKey)) return;
        this.busySlots.add(slotKey);

        const x = cam.width * xP;
        const isGood = Math.random() < 0.35;
        const key = isGood ? (Math.random() < 0.5 ? 'good1' : 'good2')
                           : (Math.random() < 0.5 ? 'bad1'  : 'bad2');

        this.time.delayedCall(i * 110, () => {
          const img = this.add.image(x, y + openDepth, key)
            .setOrigin(0.5) as ImageWithId;
          img._tid = Phaser.Math.RND.integer();

          const size = sizeBase * row.scale;
          img.setDisplaySize(size, size);
          img.setDepth(5);
          img.setMask(this.masks[rowIdx]);
          img.setInteractive();

          const data: TargetData = { kind: isGood ? 'good' : 'bad', rowIdx };
          this.meta.set(img._tid, data);
          this.objs.push(img);

          img.once('pointerdown', () => this.hitTarget(img, data));

          this.tweens.add({
            targets: img, y, duration: 200, ease: 'Sine.easeOut',
            onComplete: () => {
              const hold = Math.max(240, lifeMs - (200 + 200));
              this.time.delayedCall(hold, () => {
                this.tweens.add({
                  targets: img, y: y + openDepth, duration: 200, ease: 'Sine.easeIn',
                  onComplete: () => this.kill(img),
                });
              });
            }
          });

          this.time.delayedCall(lifeMs, () => this.busySlots.delete(slotKey));
        });
      });
    });
  }

  private hitTarget (hit: ImageWithId, data: TargetData) {
    if (!hit.active || data.isShot) return;
    data.isShot = true;

    this.shoot.play();
    this.tweens.killTweensOf(hit);

    const cam = this.cameras.main;
    const row = ROWS[data.rowIdx];
    const openDepth = Math.round(this.baseTargetSize() * 0.62 * row.scale);
    const targetY = cam.height * row.yP + openDepth;

    this.tweens.add({
      targets: hit,
      scaleX: 0.9, scaleY: 0.9, alpha: 0.8, y: targetY,
      duration: 140, ease: 'Sine.easeIn',
      onComplete: () => this.kill(hit),
    });

    this.score += data.kind === 'bad' ? 1 : -2;
    this.updateHud();
  }

  private kill (obj: ImageWithId) {
    if (!obj || !obj.active) return;
    this.tweens.killTweensOf(obj);
    obj.disableInteractive();
    this.meta.delete(obj._tid);
    this.objs = this.objs.filter(o => o !== obj);
    obj.destroy();
  }

  private updateHud () {
    const names = ['Fácil','Medio','Difícil'] as const;
    const text = `⏱ ${this.timer}s   |   🎯 ${this.score}   |   ${names[this.level]}`;
    this.hudText.setText(text);
    this.layoutHud();
  }

  private layoutHud () {
    const cam = this.cameras.main;
    const pad = 10;
    const innerPadX = 14;
    const innerPadY = 10;

    const w = Math.ceil(this.hudText.width + innerPadX * 2);
    const h = Math.max(44, Math.ceil(this.hudText.height + innerPadY * 2));
    const x = cam.width - w - pad;
    const y = pad;
    const r = 18;

    this.hudText.setPosition(x + innerPadX, y + h / 2);

    this.hudBG.clear();
    this.hudBG.fillStyle(0x1b1b1b, 0.86);
    this.hudBG.fillRoundedRect(x, y, w, h, r);
  }

  private waitForLastTargetsThenEnd() {
    if (this.objs.length === 0) {
      this.endRound();
    } else {
      this.time.delayedCall(200, () => this.waitForLastTargetsThenEnd());
    }
  }

  private endRound () {
    this.clearAll();
    this.music.stop();
    this.onGameOver?.(this.score);
  }

  private clearAll () {
    this.objs.forEach(o => { this.tweens.killTweensOf(o); o.removeAllListeners(); o.destroy(); });
    this.objs = [];
    this.meta.clear();
    this.busySlots.clear();
  }

  private restartGame () {
    this.music.stop();
    this.sound.stopAll();
    this.scene.restart();
  }

  private nextLevel () {
    this.level = (this.level + 1) % LEVELS.length;
    this.levelLabel();
    this.restartGame();
  }
}
