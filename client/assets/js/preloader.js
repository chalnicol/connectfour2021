class Preloader extends Phaser.Scene {

    constructor ()
    {
        super('Preloader');
    }
    preload ()
    {
        
        let _gW = this.game.config.width,
            _gH = this.game.config.height;

        this.add.text ( _gW/2, _gH/2, '', { fontSize: 36, fontFamily:'Oswald', color:'#fff'}).setOrigin(0.5);

        let txt = this.add.text (_gW/2, _gH*0.43, 'Loading : 0%', { color:'#333', fontFamily:'Oswald', fontSize:20 }).setOrigin(0.5);

        //..
        let brct = this.add.rectangle ( (_gW - 350 )/2, _gH/2, 350, 40 ).setStrokeStyle (3, 0x0a0a0a).setOrigin(0, 0.5);
        //..
        let rW = 340, rH = 30;

        let rct = this.add.rectangle ( (_gW - rW)/2, _gH/2, 5, rH, 0x6a6a6a, 1 ).setOrigin(0, 0.5);

        this.load.on ('complete', function () {
            this.scene.start('Intro');
        }, this);

        this.load.on ('progress', function (progress) {

            txt.setText ( 'Loading : ' + Math.ceil( progress * 100 ) + '%' );

            if ( (rW * progress) > 5) rct.setSize ( rW * progress, rH );

        });

        
        // this.load.audioSprite('sfx', 'client/assets/sfx/fx_mixdown.json', [
        //     'client/assets/sfx/sfx.ogg',
        //     'client/assets/sfx/sfx.mp3'
        // ]);
        
        // this.load.audio ('bgsound2', ['client/assets/sfx/bgsound.ogg', 'client/assets/sfx/bgsound.mp3'] );

        // this.load.audio ('bgsound', ['client/assets/sfx/bgsound2.ogg', 'client/assets/sfx/bgsound2.mp3'] );
        this.load.image('bg', 'client/assets/images/bg.jpg');

        this.load.image('title', 'client/assets/images/title.png');

        this.load.image('profile', 'client/assets/images/profile.png');

        this.load.image('centerpiece', 'client/assets/images/centerpiece.png');

        this.load.image('cell', 'client/assets/images/cells.png');

        this.load.image('cellbg', 'client/assets/images/cells_bg.png');

        this.load.image('plyrInd', 'client/assets/images/profile_main.png');

        this.load.image('prompt', 'client/assets/images/prompt.png');

        this.load.image('pair_bg', 'client/assets/images/pair_bg.png');

        this.load.spritesheet('pair_btns', 'client/assets/images/pair_btns.png', { frameWidth: 160, frameHeight: 110 });

        this.load.spritesheet('bgmenu', 'client/assets/images/bgmenu2.png', { frameWidth: 556, frameHeight: 108 });

        this.load.spritesheet('chips', 'client/assets/images/chips.png', { frameWidth: 140, frameHeight: 140 });

        this.load.spritesheet('imgBtns', 'client/assets/images/imgBtns.png', { frameWidth: 100, frameHeight: 100 });

        this.load.spritesheet('promptbtns', 'client/assets/images/promptbtns.png', { frameWidth: 200, frameHeight: 90 });

        this.load.spritesheet('contbtns', 'client/assets/images/contbtns.png', { frameWidth: 100, frameHeight: 100 });
        

    }
    
}
