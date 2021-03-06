

class Intro extends Phaser.Scene {

    constructor ()
    {
        super('Intro');
    }

    create () 
    {

        this.invites = [];

        this.pairingScreenShown = false;

        this.isPairing = false;

        this.isPrompted = false;

        //add bg
        this.add.image ( 960, 540, 'bg'); 

        //add title..2
        this.add.image ( 960, 540, 'title'); 

        //add player indicator.. 
        let profile = this.add.container ( 210, 85 ).setSize (360, 100).setInteractive();

        let img = this.add.image ( 0, 0, 'profile');

        let username = this.add.text (-80, -35, '-', { color:'#000', fontFamily:'Oswald', fontSize : 28 });

        let txte = this.add.text (-80, 10, 'Pairing ID : -', { color:'#666', fontFamily:'Oswald', fontSize : 20 });

        profile.add ([img, username, txte]);

        profile.on('pointerdown', () => {
            this.showChangeUsernameScreen ();
        });


        this.profileCont = profile;

        //
        this.playerOnlineTxt = this.add.text ( 40 , 160, 'Players Online: -', { color:'#ff9900', fontFamily:'Oswald', fontSize : 26 });

        //add title..2
        this.add.image ( 960, 540, 'title'); 

        //..
        this.createMenu ();

        this.initSocketIO ();

        this.initSoundFx ();

    }

    playSound  ( snd, vol=0.5 ) {

        this.soundFx.play ( snd, { volume : vol });

    }

    initSoundFx () 
    {
        //sfx
        this.soundFx = this.sound.addAudioSprite('sfx');

        //bg music..
        this.bgmusic = this.sound.add('introbg').setVolume(0.1).setLoop(true);

        this.bgmusic.play();

        

    }

    initSocketIO () {

        //get initial data..
        socket.emit('getInitData');

        socket.on('playersOnline', (data) => {
            this.playerOnlineTxt.text = 'Players Online : ' + data.playersCount;
        });

        socket.on('initDataSent', (data) => {

            this.profileCont.getAt(1).text = data.username;

            this.profileCont.getAt(2).text = 'Pairing ID : ' + data.pairingId;

            this.playerOnlineTxt.text = 'Players Online : ' + data.playersCount;

        });

        socket.on('initGame', (data) => {
            this.startGameScene (data);
        });

        socket.on('pairingError', (data) => {
            
            if ( this.isPrompted) this.removePrompt ();

            this.showPrompt ( data.errorMsg, 0, 34, 0, 0, 'prompt_sm' );

            this.time.delayedCall ( 1500, this.removePrompt, [], this );

        });

        socket.on('pairInvite', (data) => {
            
            if ( this.pairingScreenShown ) this.removePairScreen();

            //this.invites.push ( data );

            //this.showInvites ();

            const gameStr = data.gameType == 0 ? 'Classic' : 'Blitz';

            this.showInviteScreen ( `You have been invited by '${data.username}' to play '${gameStr}' game.`, data.inviteId );

        });

    }

    createMenu ()
    {
        //add menu
        const menuArr = [ 'Play Vs Computer', 'Play Vs Online', 'Challenge A Friend'];

        for ( var i in menuArr ) {

            // const miniCont = this.add.container ( 960, 1132 ).setSize( 540, 102 ).setInteractive().setData ('id',  'but' + i );

            const miniCont = this.add.container ( 960, 1132 ).setSize( 560, 110 ).setInteractive().setData ('id',  'but' + i );

            let rct = this.add.image ( 0, 0, 'menubtn' );

            let txt = this.add.text ( 0, 0, menuArr[i], { color:'#333', fontFamily:'Oswald', fontSize : 48 }).setOrigin (0.5).setStroke ( '#fff', 3 );

            miniCont.add ( [rct, txt] );

            miniCont.on ('pointerover', function () {
           
               //this.first.setFrame (1);
                this.first.setTint ( 0xffffcc);
            });
            miniCont.on ('pointerout', function () {
                //..
                // this.first.setFrame (0);
                this.first.clearTint();
            });
            miniCont.on ('pointerup', function () {
                //..
                this.first.clearTint();

                switch ( this.getData('id') ) {
                    case 'but0':
                        socket.emit ('enterGame', {'game' : 0, 'gameType' : 0 });
                        this.scene.showPrompt('Please Wait..', 0, 40, 0, 0, 'prompt_sm' );
                        break;
                    case 'but1':
                        socket.emit ('enterGame', {'game' : 1, 'gameType' : 0 });
                        this.scene.showPairingWaitScreen();
                        break;
                    case 'but2':
                        this.scene.showPairingScreen();
                        break;
                    default:
                        break;
                }

            });
            miniCont.on ('pointerdown', function () {
              
                this.first.setTint ( 0xffff99);
                
                this.scene.playSound ('clicka');

            });
            
            this.add.tween ({
                targets : miniCont,
                y : 600 + (i * 120),
                duration : 500,
                easeParams: [1.1, 0.8],
                ease : 'Elastic',
                delay : (i * 200) + 300
            });

        }

    }

    showChangeUsernameScreen () 
    {
        //todo...
    }

    showPairingScreen ()
    {

        this.pairingScreenShown = true;

        this.pairingScreenCont = this.add.container (0,0);

        let rct = this.add.rectangle ( 0, 0, 1920, 1080, 0x0a0a0a, 0.5 ).setOrigin(0).setInteractive();

        this.pairingScreenCont.add ( rct );

        let miniCont = this.add.container ( 960, 1080  );

        let rcte = this.add.image ( 0, 0, 'pair_bg' );

        let txte = this.add.text ( 0, -218, '---', { color:'#6e6e6e', fontFamily:'Oswald', fontSize: 74 }).setOrigin(0.5);

        let xb = this.add.rectangle ( 221, -305, 80, 80 ).setInteractive ();

        xb.on ('pointerup', () => {
            
            this.playSound ('clicka');

            this.removePairScreen();
        });
        //221 -305

        miniCont.add ([rcte, txte, xb ]);

        //
        const ls = '1234567890';

        const bSize = 110, bSpace = (450 - ( 3 * bSize))/2 ;

        const sX = -(450/2)  + (bSize/2),
        
              sY = -100;

        let str = '';

        for ( var i = 0; i < 12; i++ ) {

            let ix = Math.floor ( i/3 ), iy = i % 3;

            let xp = sX + iy * ( bSize + bSpace ),

                yp = sY + ix *(bSize + 10);

            let btxt = '';

            if ( i < 10 ) {
                btxt  = ls.charAt ( i )
            }else if ( i == 10 ) {
                btxt = 'clr'
            }else {
                btxt = 'done'
            }

            let btn = new MyButton ( this, xp, yp, 150, 100, i, 'pair_btns', '', 0, btxt, 50 );

            
            btn.on('pointerdown', function () {

                this.btnState('pressed');

                this.scene.playSound ('beep', 0.2);
            });

            btn.on('pointerup', function () {

                this.btnState('idle');

                if ( this.id < 10 ) {

                    if ( str.length < 10) {

                        str += ls.charAt ( this.id );
                    }

                    txte.text = str;

                }else if ( this.id == 10 ) {

                    str = '';

                    txte.text = '---';

                }else {

                    if (str.length > 0 ) this.scene.pair ( str );

                }

            });

            miniCont.add ( btn );

        }

        this.add.tween ({
            targets : miniCont,
            y: 540,
            duration : 300,
            easeParams : [ 1, 0.6 ],
            ease : 'Elastic'
        });

        this.pairingScreenCont.add ( miniCont );

    }

    removePairScreen () {

        this.pairingScreenShown = false;

        this.pairingScreenCont.destroy();
    }

    showPrompt ( txt, txtPos = 0, txtSize = 40, boxW = 550, boxH = 300, imgbg='', buttons = [] ) {

        this.isPrompted = true;

        this.promptCont = this.add.container (0, 0);

        //bg
        let rct = this.add.rectangle ( 0, 0, 1920, 1080, 0x0a0a0a, 0.5 ).setOrigin(0).setInteractive();

        this.promptCont.add ( rct );

        //miniCont
        let miniCont = this.add.container ( 960, 1080 + (boxH/2)  );

        if ( imgbg != ''){

            let img = this.add.image ( 0, 0, imgbg );

            miniCont.add (img);

        } else {

            let rcte = this.add.rectangle ( 0, 0, boxW, boxH, 0xf3f3f3, 0.9 ).setStrokeStyle ( 2, 0x9e9e9e );

            miniCont.add (rcte);
        }
        

        let txte = this.add.text ( 0, txtPos, txt, { color:'#6e6e6e', fontFamily:'Oswald', fontSize: txtSize }).setOrigin(0.5);

        miniCont.add (txte);
        
        if ( buttons.length > 0 ) {

            const bw = 190, bh = 80, bsp = 10;

            const sx = (buttons.length * (bw + bsp) - bsp)/2 - (bw/2), 
            
                  sy = 80;

            for ( let i = 0; i < buttons.length; i++ ) {

                let btn = new MyButton ( this, -sx + (i * ( bw + bsp)), sy, bw, bh, i, 'promptbtns', '', 0, buttons[i].btnTxt, 40 );


                btn.on('pointerdown', function() {

                    this.btnState ('pressed');

                    this.scene.playSound ('clicka');

                });
                btn.on('pointerup', function() {

                    this.btnState('idle');

                    buttons [i].func();
                });

                miniCont.add (btn);

            }

        }


       

        this.add.tween ({
            targets : miniCont,
            y: 540,
            duration : 300,
            easeParams : [ 1, 0.6 ],
            ease : 'Elastic',
        });

        this.promptCont.add ( miniCont );


       
    }

    removePrompt () {
        
        this.isPrompted = false;

        this.promptCont.destroy ();
    }

    showInvites () {

        
    }

    showInviteScreen ( txt, id ) {

        const btnArrs = [
            { 
                btnTxt : 'Later', 
                func : () => {
                    this.removePrompt ();
                    socket.emit ('pairingResponse', { 'inviteId':id,  'response' : 0 });
                }
            },
            {
                btnTxt : 'Accept',
                func : () => {
                    this.removePrompt ();
                    socket.emit ('pairingResponse', { 'inviteId':id, 'response' : 1 });
                }
            }
        ];

        this.showPrompt ( txt, -30, 30, 0, 0, 'prompt_xl', btnArrs );

    }

    showPairingWaitScreen () 
    {

        this.isPairing = true;

        const btnArrs = [
            { btnTxt : 'Cancel', func : () => this.cancelPairing() }
        ];

        this.showPrompt ('Please Wait..', -30, 40, 0, 0, 'prompt' ,btnArrs );

        this.autoCancelTimer = this.time.delayedCall ( 10000, this.cancelPairing, [], this );

    }

    pair ( str ) {

        socket.emit ('pair', {'pairingId' : str, 'gameType' : 0 });

        this.pairingScreenCont.destroy();

        this.showPrompt ('Waiting for Response..', 0, 40, 0, 0, 'prompt_sm' );

    }

    cancelPairing () {

        this.removePrompt();

        this.isPairing = false;

        this.autoCancelTimer.remove();

        socket.emit ('cancelPairing');

    }

    startGameScene ( data ) {

        if ( this.isPairing )  this.autoCancelTimer.remove();

        socket.removeAllListeners();

        this.bgmusic.stop();

        this.scene.start ('SceneA', data );

    }




}