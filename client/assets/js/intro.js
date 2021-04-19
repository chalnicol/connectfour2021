

class Intro extends Phaser.Scene {

    constructor ()
    {
        super('Intro');
    }


    create () 
    {

        this.isWaiting = false;

        this.isPrompted = false;

        //add bg
        this.add.image ( 960, 540, 'bg'); 

        //add title..2
        this.add.image ( 960, 540, 'title'); 

        //add player indicator.. 
        this.profileCont = this.add.container ( 210, 85 );

        let img = this.add.image ( 0, 0, 'profile');

        let username = this.add.text (-80, -35, '-', { color:'#000', fontFamily:'Oswald', fontSize : 28 });

        let txte = this.add.text (-80, 10, 'Pairing ID : -', { color:'#666', fontFamily:'Oswald', fontSize : 20 });

        this.profileCont.add ([img, username, txte]);

        //
        this.playerOnlineTxt = this.add.text ( 40 , 160, 'Players Online: -', { color:'#ff9900', fontFamily:'Oswald', fontSize : 26 });

        //add title..2
        this.add.image ( 960, 540, 'title'); 

        //..
        this.createMenu ();


        this.initSocketListeners ();

        //get initial data..
        socket.emit('getInitData');

    }

    initSocketListeners () {

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
            
            if ( this.pairWaitCont) this.pairWaitCont.destroy ();

            const prompt = this.showPromptScreen ( data.errorMsg, 0, 30 );

            this.time.delayedCall ( 2000, () => prompt.destroy(), [], this );

        });

        socket.on('pairInvite', (data) => {
            
            
            const gameStr = data.gameType == 0 ? 'Classic' : 'Blitz';

            this.showInviteScreen ( `You have been invited by '${data.username}' to play '${gameStr}' game.` );

        });

    }

    createMenu ()
    {
        //add menu
        const menuArr = [ 'Play Vs Computer', 'Play Vs Online', 'Challenge A Friend'];

        for ( var i in menuArr ) {

            const miniCont = this.add.container ( 960, 1132 ).setSize( 540, 102 ).setInteractive().setData ('id',  'but' + i );

            let rct = this.add.image ( 0, 0, 'bgmenu' );

            let txt = this.add.text ( -180, 0, menuArr[i], { color:'#000', fontFamily:'Oswald', fontSize : 50 }).setOrigin (0, 0.5);

            miniCont.add ( [rct, txt] );

            miniCont.on ('pointerover', function () {
           
               this.first.setFrame (1);

            });
            miniCont.on ('pointerout', function () {
                //..
                this.first.setFrame (0);
               
            });
            miniCont.on ('pointerup', function () {
                //..
                this.first.setFrame (0);
            });
            miniCont.on ('pointerdown', function () {
              
                // gametype -> 0 = classic : 1 = blitz
                switch ( this.getData('id') ) {
                    case 'but0':
                        socket.emit ('enterGame', {'game' : 0, 'gameType' : 0 });
                        this.scene.showWaitScreen();
                        break;
                    case 'but1':
                        socket.emit ('enterGame', {'game' : 1, 'gameType' : 0 });
                        this.scene.showWaitScreen();
                        break;
                    case 'but2':
                        this.scene.showPairingScreen();
                        break;
                    default:
                        break;
                }

            });
            
            this.add.tween ({
                targets : miniCont,
                y : 600 + (i * 120),
                duration : 300,
                ease : 'Power2',
                delay : i * 200
            });

        }

    }

    showInviteScreen ( txt ) {

        this.isPrompted = true;

        let mainCont = this.add.container (0, 0);

        //bg
        let rct = this.add.rectangle ( 0, 0, 1920, 1080, 0x0a0a0a, 0.5 ).setOrigin(0).setInteractive();

        mainCont.add ( rct );


        //miniCont
        let miniCont = this.add.container ( 960, 540  ); //1230

        let rcte = this.add.rectangle ( 0, 0, 800, 280, 0xf3f3f3, 0.9 ).setStrokeStyle ( 2, 0x9e9e9e );

        let txte = this.add.text ( 0, -50, txt, { color:'#000', fontFamily:'Oswald', fontSize: 30 }).setOrigin(0.5);

        miniCont.add ([rcte, txte]);

        const btnArrs = ['Later', 'Accept'];

        const sx = -100;

        for ( let i = 0; i < 2; i++ ) {

            let btn = new MyButton ( this, sx + (i * 200), 60, 190, 80, i, 'promptbtns', '', 0, btnArrs [i], 40 );

            btn.on('pointerdown', function() {

                this.clicked();

                socket.emit ( 'pairingResponse', { 'response' : this.id });

                mainCont.destroy ();

            });

            miniCont.add (btn);
        }

        mainCont.add ( miniCont );

    }

    showPairingScreen ()
    {
        this.pairingScreenCont = this.add.container (0,0);

        let rct = this.add.rectangle ( 0, 0, 1920, 1080, 0x0a0a0a, 0.5 ).setOrigin(0).setInteractive();

        this.pairingScreenCont.add ( rct );

        let miniCont = this.add.container ( 960, 1080  );

        let rcte = this.add.image ( 0, 0, 'pair_bg' );

        let txte = this.add.text ( 0, -218, '---', { color:'#6e6e6e', fontFamily:'Oswald', fontSize: 74 }).setOrigin(0.5);

        let xb = this.add.rectangle ( 221, -305, 80, 80 ).setInteractive ();

        xb.on ('pointerdown', () => {
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

                this.clicked();

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

    showPromptScreen ( txt, txtPos = 0, fs = 40 ) {

        let mainCont = this.add.container (0, 0);

        //bg
        let rct = this.add.rectangle ( 0, 0, 1920, 1080, 0x0a0a0a, 0.5 ).setOrigin(0).setInteractive();

        mainCont.add ( rct );


        //miniCont
        let miniCont = this.add.container ( 960, 1230  );

        let rcte = this.add.rectangle ( 0, 0, 550, 300, 0xf3f3f3, 0.9 ).setStrokeStyle ( 2, 0x9e9e9e );

        let txte = this.add.text ( 0, txtPos, txt, { color:'#000', fontFamily:'Oswald', fontSize: fs }).setOrigin(0.5);

        miniCont.add ([rcte, txte]);

        this.add.tween ({
            targets : miniCont,
            y: 540,
            duration : 300,
            easeParams : [ 1, 0.6 ],
            ease : 'Elastic',
            //delay : 100
        });

        mainCont.add ( miniCont );

        return mainCont;

    }

    showWaitScreen () 
    {
        this.isWaiting = true;

        let cont = this.showPromptScreen ('Please Wait..', -50 );

        let btn = new MyButton ( this, 0, 60, 190, 80, 'cancel', 'promptbtns', '', 0, 'Cancel', 40 );

        btn.on('pointerdown', function() {

            this.clicked();

            this.scene.cancelPairing();

        });

        cont.last.add (btn);

        this.waitScreenCont = cont;

        this.autoCancelTimer = this.time.delayedCall ( 10000, this.cancelPairing, [], this );

    }

    pair ( str ) {

        socket.emit ('pair', {'pairingId' : str, 'gameType' : 0 });

        this.pairingScreenCont.destroy ();

        this.pairWaitCont =  this.showPromptScreen ('Waiting For Response..' );

    }

    removePairScreen () {
        
        this.pairingScreenCont.destroy();

    }

    cancelPairing () {

        console.log ('pairing cancelled');

        this.isWaiting = false;

        this.autoCancelTimer.remove();

        this.waitScreenCont.destroy();

        socket.emit ('cancelPairing');

    }

    startGameScene ( data ) {

        if ( this.isWaiting )  this.autoCancelTimer.remove();

        socket.removeAllListeners();

        this.scene.start ('SceneA', data );

    }




}