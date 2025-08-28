import Phaser from 'phaser'

// imágenes
import hubImg from '../../assets/hub.png'
import checkinImg from '../../assets/check-in.png'
import bgImg from '../../assets/background.png'
import good1Img from '../../assets/good1.png'
import good2Img from '../../assets/good2.png'
import good3Img from '../../assets/good3.png'
import good4Img from '../../assets/good4.png'
import good5Img from '../../assets/good5.png'
import bad1Img from '../../assets/bad1.png'
import bad2Img from '../../assets/bad2.png'
import bad3Img from '../../assets/bad3.png'
import bad4Img from '../../assets/bad4.png'
import bad5Img from '../../assets/bad5.png'
import crosshairImg from '../../assets/crosshair.png'

// sonidos
import musicMp3 from '../../assets/circus.mp3'
import shootMp3 from '../../assets/shoot.mp3'

export default class BootScene extends Phaser.Scene {
  constructor () { super('Boot') }

  preload () {
    this.load.image('hub-sign', hubImg)
    this.load.image('checkin-btn', checkinImg)
    this.load.image('bg', bgImg)
    this.load.image('good1', good1Img)
    this.load.image('good2', good2Img)
    this.load.image('good3', good3Img)
    this.load.image('good4', good4Img)
    this.load.image('good5', good5Img)
    this.load.image('bad1', bad1Img)
    this.load.image('bad2', bad2Img)
    this.load.image('bad3', bad3Img)
    this.load.image('bad4', bad4Img)
    this.load.image('bad5', bad5Img)
    this.load.image('crosshair', crosshairImg)

    this.load.audio('music', musicMp3)
    this.load.audio('shoot', shootMp3)
  }

  create () {
    this.scene.start('CheckIn')
  }
}
