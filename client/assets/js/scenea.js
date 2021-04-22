class SceneA extends Phaser.Scene {

    constructor ()
    {
        super('SceneA');
    }

    preload () 
    {

    }

    create ( data ) 
    {

        this.gameData = data;

        this.gridArr = [];
        
        this.emojisThread = [];

        this.shotCounter = 0;
        
        this.gameOver = false;

        this.gameInited = false;

        this.isEmoji = false;

        this.sentEmojisShown = false;

        this.musicOff = false;

        this.soundOff = false;

        this.shotHistory = [];


        //add bg
        this.add.image ( 960, 540, 'bg'); 
        
        //add field bg..
        this.add.image (960, 540, 'centerpiece');

        //init grid..
        let csize = 140;

        let cx = (1920 - ( csize * 7 ))/2 + csize/2, 

            cy = 260;

        for ( let i = 0; i < 42; i++ ) {

            let ix = Math.floor ( i/7 ), iy = i % 7;

            let xp = cx + iy * csize, yp = cy + ix*csize;

            this.add.image ( xp, yp, 'cellbg');

            //this.add.text ( xp, yp, i, { color:'#333', fontFamily:'Oswald', fontSize: 20 }).setOrigin(0.5);

            this.gridArr.push ({
                x : xp,
                y : yp,
                resident : 0
            });
        
        }


        //add columns..
        var columnsCont = this.add.container (0, 0);
        
        for ( let i = 0; i < 7; i++ ) {

            const xp = cx + i* csize, yp = cy + (csize*6)/2 - csize/2;

            let rct = this.add.rectangle ( xp, yp, csize, csize*6 ).setInteractive();

            rct.on ('pointerout', function () {
                this.setFillStyle ( 0xffffff, 0 );
            });

            rct.on ('pointerover', function () {

                if ( this.scene.turn == 'self' ){
                    this.setFillStyle ( 0xffff00, 0.1 );
                }

            });

            rct.on ('pointerdown', function () {

                if ( this.turn == 'self' && !this.players['self'].isAI ){

                    if ( this.gameData.game == 0 ) {

                        this.makeTurn ( i, 'self' );
                    }else {

                        socket.emit ('playerMove', { 'col' : i });
                    }
                }
                
            }, this );
            
            columnsCont.add ( rct );

        }

        //add container for chilps 
        const chipsCont = this.add.container (0, 0);

        var shape = this.make.graphics();

        shape.fillStyle(0xffff00, 0.5); //  Create a hash shape Graphics object

        shape.beginPath(); //  You have to begin a path for a Geometry mask to work

        shape.fillRect( 470, 0, 980, 170 );

        for ( var i = 0; i<42; i++) {
            shape.fillCircle ( this.gridArr[i].x, this.gridArr[i].y, 56 );
        }

        const mask = shape.createGeometryMask();

        columnsCont.setMask ( mask );

        chipsCont.setMask(mask);

        
        this.circCont = chipsCont;
        
        //..

        this.initSocketIO();

        this.initPlayers();

        this.createPlayersIndicator ();

        this.createControls ();

        this.createAnimations();

        this.initSoundFx ();

        this.startGame ();

    }

    createAnimations () 
    {
        //create anims..
        this.anims.create( {
            key: 'blink0',
            frames: this.anims.generateFrameNumbers( 'chips' , { frames : [ 0,1 ] }),
            frameRate: 2,
            repeat: -1
        });

        this.anims.create( {
            key: 'blink1',
            frames: this.anims.generateFrameNumbers( 'chips' , { frames : [ 2,3 ] }),
            frameRate: 2,
            repeat: -1
        });

    }

    playMusic ( off = false ){

        if ( off ) {
            this.bgmusic.pause();
        }else {
            this.bgmusic.resume();
        }

    }

    playSound  ( snd, vol=0.5 ) {

        if ( !this.soundOff) this.soundFx.play ( snd, { volume : vol });

    }

    initSoundFx () 
    {
        //sfx
        this.soundFx = this.sound.addAudioSprite('sfx');

        //bg music..
        this.bgmusic = this.sound.add('sceneabg').setVolume(0.1).setLoop(true);

        this.bgmusic.play();

    
    }

    initSocketIO () 
    {

        socket.on('showEmoji', ( data ) => { 
            
            this.time.delayedCall (500, () => {

                if ( this.sentEmojisShown ) this.removeSentEmojis();

                this.showSentEmojis ( data.plyr, data.emoji );

            }, [], this);

        });

        socket.on('restartGame', () => {
            this.resetGame ();
        });

        socket.on('opponentLeft', () => {
            
            this.gameOver = true;

            if ( this.isPrompted ) this.removePrompt();

            const btnArr = [ { 'txt' : 'Exit',  'func' : () => this.leaveGame() } ];

            this.showPrompt ('Opponent has left the game.', 40, -20, false, btnArr );

        });

        socket.on('playerMove', (data) => {
            
            //console.log ( data );

            this.makeTurn ( data.col, data.turn );

        });
    }

    initPlayers () {

        this.players = {};

        const names = ['Nong', 'Chalo', 'Nasty', 'Caloy'];

        let oppoUsername = '', 
            
            oppoAI = false, 
            
            oppoChip = 0,
            
            turn = '';

        if (this.gameData.game == 0 ) {

            //is single player..
            oppoUsername = names [ Phaser.Math.Between (0, names.length - 1) ] + ' (CPU)';

            oppoAI = true;

            oppoChip = this.gameData.players ['self'].chip == 0 ? 1 : 0;

            turn = Phaser.Math.Between(0, 1) == 0 ? 'self' : 'oppo';

        }  else {

            oppoUsername = this.gameData.players ['oppo'].username;

            oppoChip = this.gameData.players ['oppo'].chip;

            turn = this.gameData.turn;
            
        }   

        //..
        this.players ['self'] = new Player ('self', this.gameData.players['self'].username, this.gameData.players['self'].chip );

        this.players ['oppo'] = new Player ('oppo', oppoUsername, oppoChip, oppoAI );

        this.turn = turn;        
    
    }
    
    createControls () 
    {

        this.controlBtnsCont = this.add.container (0,0);
        
        const btnArr = [ 'exit', 'sound', 'music', 'emoji' ];

        for ( let i in btnArr ) {

            let btnCont = new MyButton ( this, -50 , (i * 110) + 218, 100, 100, btnArr[i], 'contbtns', 'imgBtns', i).setName (btnArr[i]);

            btnCont.on('pointerup', function () {
                
                this.btnState ('idle');

                switch (this.id) {
                    case 'exit':
                        this.scene.showExitPrompt ();
                        break;
                    case 'sound':
                        this.scene.soundOff = !this.scene.soundOff;

                        console.log ( this.imgFrame);

                        this.getAt(1).setFrame ( this.scene.soundOff ? Number(this.imgFrame)+3 : this.imgFrame );

                        break;
                    case 'music':

                        this.scene.musicOff = !this.scene.musicOff;

                        this.getAt(1).setFrame ( this.scene.musicOff ? Number(this.imgFrame)+3 : this.imgFrame );

                        this.scene.playMusic ( this.scene.musicOff );

                        break;
                    case 'emoji':

                        if ( !this.scene.isEmoji ) {
                            this.scene.showEmoji();
                        }else {
                            this.scene.removeEmoji();
                        }
                        
                        break;
                    default:
                }
               
            });
            btnCont.on('pointerdown', function () {
                
                this.btnState ('pressed');

                this.scene.playSound ('clicka');
              
            });
            
            this.add.tween ({
                targets : btnCont,
                x : 50,
                duration : 200,
                delay : i * 200,
                ease : 'Linear'
            });

            this.controlBtnsCont.add ( btnCont );

        }
    }

    createPlayersIndicator () 
    {

        this.playerIndicatorsCont = this.add.container (0,0);

        const w = 507, sp = 27;

        const sx = (1920 - ((w*2) + sp))/2 + w/2,
              sy = 80;

        var counter = 0;

        for ( var i in this.players ) {

            let pInd = this.add.container ( sx + (counter * ( w+sp)), sy ).setName (i);

            let img = this.add.image ( 0, 0, 'plyrInd');

            let crc = this.add.circle ( 200, 0, 15, 0x6e6e6e, 1 ).setStrokeStyle ( 1, 0x9e9e9e );

            let name = this.add.text ( -150, -34, this.players[i].username, { fontSize: 30, fontFamily:'Oswald', color: '#838383' });

            let wins = this.add.text ( -150, 6, 'Wins : 0', { fontSize: 26, fontFamily:'Oswald', color: '#9f9f9f' });

            pInd.add ( [ img, crc, name, wins] );

            this.playerIndicatorsCont.add ( pInd );

            counter++;
        }

    }

    showEmoji () 
    {
        this.isEmoji = true;

        this.emojiContainer = this.add.container ( 240, 620);

        let bgimg = this.add.image ( 0, 0, 'emojibg');

        this.emojiContainer.add ( bgimg );

        const sx = -35, sy = -238;

        for ( let i=0; i<12; i++) {

            let ix = Math.floor ( i/2 ), iy = i%2;

            let cont = this.add.container ( sx + iy * 100, sy + ix* 95 ).setSize (90, 90).setInteractive();


            let rct = this.add.rectangle ( 0, 0, 90, 90, 0xffffff, 1 ).setVisible (false);

            let img = this.add.image (  0, 0, 'emojis', i ).setScale ( 90/100 );

            cont.add ([rct, img]);

            cont.on('pointerover', function () {
                this.first.setVisible ( true );
            });
            cont.on('pointerout', function () {
                this.first.setVisible ( false );
            });
            cont.on('pointerdown', function () {

                this.scene.playSound ('clicka');

            });
            cont.on('pointerup', function () {
                
                this.first.setVisible ( false );

                this.scene.sendEmoji ( i );                
            
            });

            this.emojiContainer.add ( cont );

        }

    }

    sendEmoji ( emoji ) {

        this.removeEmoji();

        if ( this.gameData.game == 0) {

            this.time.delayedCall ( 500, () => {

                if ( this.sentEmojisShown ) this.removeSentEmojis();

                this.showSentEmojis ('self', emoji );

            }, [], this );


            this.time.delayedCall ( 2000, () => {

                if ( this.sentEmojisShown ) this.removeSentEmojis();

                this.showSentEmojis ('oppo', Math.floor ( Math.random() * 12 ));

            }, [], this);


        }else {

            socket.emit ('sendEmoji', { 'emoji' : emoji });
        }

        //...disable emoji btns for 2 secs..
        this.controlBtnsCont.getByName('emoji').removeInteractive();

        this.time.delayedCall ( 4000, () => {
            this.controlBtnsCont.getByName('emoji').setInteractive();
        }, [], this );

    }

    removeEmoji () {
        
        this.isEmoji = false;

        this.emojiContainer.destroy();
    }

    showSentEmojis ( plyr, emoji ) {
        
        this.playSound ('message');

        if ( this.emojisThread.length >= 6 ) this.emojisThread.shift();

        this.emojisThread.push ( { 'plyr' : plyr, 'emoji' : emoji });

        //..
        this.emojiThreadCont = this.add.container ( 1500, 0 );


        //const prevPost = this.add.container (0, 970 - (this.emojisThread.length * 85) );

        const total = this.emojisThread.length - 1;

        for ( let i in this.emojisThread ) {

            let yp = 1010 - ( (total - i) * 85);

            const miniCont = this.add.container ( 210, yp );
            
            let nme = this.players [ this.emojisThread [i].plyr ].username;

            let clr = this.emojisThread [i].plyr == 'self' ? '#33cc33' : '#ff6600';

            let rct = this.add.rectangle ( 0, 0, 400, 80, 0xcecece, 0.5 );
            
            let txt = this.add.text ( -180, 0, nme +':', { color: clr, fontFamily:'Oswald', fontSize : 26 }).setOrigin ( 0, 0.5 );

            let img = this.add.image ( 150, 0, 'emojis', this.emojisThread [i].emoji ).setScale ( 0.8 );

            miniCont.add ([rct, txt, img]);

            if ( i >= total ) {

                miniCont.first.setFillStyle (0xf3f3f3, 0.6);
                
                miniCont.setScale (0.5)
                
                this.add.tween ({
                    targets : miniCont,
                    scaleX : 1, scaleY : 1,
                    duration : 300,
                    easeParams : [ 1.2, 0.6 ],
                    ease : 'Elastic'
                });
            }

            this.emojiThreadCont.add ( miniCont);

        }

        this.sentEmojisShown = true;

        this.emojiTimer = this.time.delayedCall ( 3000, () => {

            this.removeSentEmojis();

        }, [], this );

    }

    removeSentEmojis () {

        this.emojiTimer.remove();
        
        this.sentEmojisShown = false;

        this.emojiThreadCont.destroy();

    }

    setTurnIndicator  ( turn ) 
    {

        let idle = turn == 'self' ? 'oppo' : 'self';

        this.playerIndicatorsCont.getByName ( turn ).getAt (1).setFillStyle ( 0xffff00, 1);

        this.playerIndicatorsCont.getByName ( idle ).getAt (1).setFillStyle ( 0xffffff, 1);

    }

    startGame ()
    {

        this.showPrompt ('Initializing..', 40, 0, true );

        this.time.delayedCall ( 1000, function () {

            this.gameInited = true;
            
            this.setTurnIndicator ( this.turn );

            this.removePrompt();
            
            if ( this.players[ this.turn ].isAI ) this.makeAI();

        }, [], this);
      
    }


    getRandomShot () {

        let tmp = [];
    
        for ( var i in this.gridArr ){
            if ( this.gridArr[i].resident == 0 ) tmp.push (i); 
        }

        let rnd = Phaser.Math.Between (0, tmp.length - 1 );

        return tmp[rnd] % 7;

    }

    makeAI () {

        let shot = this.getRandomShot ();

        this.time.delayedCall ( 500, function () {
            
            this.makeTurn (  shot, this.turn );

        }, [], this);
    
        
    }

    getDepth ( col ) 
    {
        
        for ( var i = 0; i < 6; i++ ) {

            const cc = (( 5-i ) * 7) + col;

            if ( this.gridArr [ cc ].resident == 0 ) return cc;

        }

        return null;

    }

    createCircle ( x, y, id, plyr ) {


        let frm = ( this.players [ plyr ].chip == 0 ) ? 0 : 2;

        let crc = this.add.sprite ( x, 150, 'chips', frm ).setName ('crc' + id );

        this.add.tween ({
            targets : crc,
            y : y,
            duration : 400,
            ease : 'Bounce'
        });

        this.circCont.add ( crc );

    }

    makeTurn ( col, plyr ) {

        if ( this.gameInited && !this.gameOver  ) {

            this.playSound ('clickb');

            const depth = this.getDepth ( col );

            if ( depth != null ) {

                this.shotHistory.push ( depth );

                this.createCircle ( this.gridArr[depth].x , this.gridArr[depth].y, depth, plyr );

                this.gridArr [depth].resident = ( plyr == 'self' ) ? 1 : 2;

                const lined = this.checkLines ( depth, plyr == 'self' ? 1 : 2 );

                if ( lined != null ) {
                
                    this.illuminate ( lined );

                    this.endGame ();

                }else {

                    this.switchTurn ();

                }

            }

        }

    }

    switchTurn () {

        this.turn = ( this.turn == 'self' ) ? 'oppo' : 'self';
        
        this.setTurnIndicator ( this.turn );

        if ( this.players[ this.turn ].isAI ) this.makeAI();
        
    }

    checkWinning ( depth, clrId ) 
    {

        const r = Math.floor ( depth/7 ), c = depth % 7;

        //horizontal..
        for ( let i = 0; i < 4; i++ ) {

            let sPoint = (r * 7) + i;

            let counter = 0, zeroPos = -1;
            
            for ( var j = 0; j < 4; j++ ) {

                const res = this.gridArr [ sPoint + j ].resident;

                if ( res == clrId ) counter++;

                if ( res == 0 ) zeroPos = sPoint + j
            }

            if ( counter >= 3 && zeroPos != -1 ) {
                
                //console.log ( zeroPos , zeroPos%7 );

                if ( this.getDepth ( zeroPos%7 ) == zeroPos ) return zeroPos%7;
            }
           
        }

        return null;

    }

    checkLines ( depth, clrId ) 
    {

        const r = Math.floor ( depth/7 ), c = depth % 7;

        //horizontal..
        for ( let i = 0; i < 4; i++ ) {

            let sPoint = (r * 7) + i;

            let arr = [];

            for ( let j = 0; j < 4; j++ ) {

                if ( this.gridArr [ sPoint + j ].resident == clrId ) arr.push ( sPoint + j );
            }    
            if ( arr.length > 3 ) return arr;

        }

        //vertical..
        for ( var i = 0; i < 3; i++ ) {

            let sPoint = (i * 7) + c;

            let arr = [];

            for ( var j = 0; j < 4; j++ ) {

                if ( this.gridArr [ sPoint + (j*7) ].resident == clrId ) arr.push ( sPoint + (j*7) );

            }

            if ( arr.length > 3 ) return arr;

        }
        

        //forward slash..
        let tr = r, tc = c;

        while ( tr < 5 && tc > 0 ) {
            tr += 1;
            tc -= 1;
        }
    
        do {

            if ( (tr - 3) >= 0 && ( tc + 3) <= 6 ) {

                let arr = [];
            
                for ( let i = 0; i < 4; i++ ) {

                    let ttr = tr - i, ttc = tc + i;

                    let pointa = (ttr * 7) + ttc;

                    if ( this.gridArr [ pointa ].resident == clrId ) arr.push ( pointa );
                }

                if ( arr.length > 3 ) return arr;

                tr -= 1;
                tc += 1;

            }       

        } while ( (tr - 3) >= 0 && ( tc + 3) <= 6 );


        //backward slash..
        let tbr = r, tbc = c;

        while ( tbr > 0 && tbc > 0 ) {
            tbr -= 1;
            tbc -= 1;
        }
        
        do {

            if ( (tbr + 3) <=5 && ( tbc + 3) <= 6 ) {

                let arr = [];
            
                for ( let i = 0; i < 4; i++ ) {

                    let ttr = tbr + i, ttc = tbc + i;

                    let pointa = (ttr * 7) + ttc;

                    if ( this.gridArr [ pointa ].resident == clrId ) arr.push ( pointa );
                }

                if ( arr.length > 3 ) return arr;

                tbr += 1;
                tbc += 1;

            }       

        } while ( (tbr + 3) <=5 && ( tbc + 3) <= 6 );


        return null;

    }

    illuminate ( arr ) {

        const winChip = this.players [ this.turn ].chip;

        //console.log ('chip', winChip );

        for ( var i in arr ) {

            let crc = this.circCont.getByName ( 'crc' + arr[i] );

            crc.play ('blink' + winChip);

        }


    }

    endGame () {

        
        this.gameOver = true;

        this.players [ this.turn ].wins += 1;

        this.playerIndicatorsCont.getByName ( this.turn ).last.text = 'Wins : ' +  this.players [ this.turn ].wins;

        this.time.delayedCall ( 500, () => {
            
            this.playSound ('xyloriff', 0.3);

            this.showEndPrompt ();

        }, [], this );

    }

    resetGame () {

        if ( this.isPrompted ) this.removePrompt ();

        this.showPrompt ('Game is restarting..', 36, 0, true );

        this.anims.remove ('blink');

        for ( var i in this.gridArr ) {
            this.gridArr [i].resident = 0;
        }

        this.circCont.each ( function (child) {
            child.destroy();
        });
        
        this.time.delayedCall (1000, function () {
           
            this.removePrompt ();
           
            this.gameOver = false;
            
            this.shotHistory = [];

            this.switchTurn ();
            
        }, [], this);

    }

    showPrompt ( myTxt, fs = 40, txtPos = 0, sm = false, btnArr = [] ) {

        if ( this.isPrompted ) this.removePrompt ();

        this.isPrompted = true;

        this.promptCont = this.add.container (0,0);

        let rct = this.add.rectangle ( 960, 540, 1920, 1080, 0x0a0a0a, 0.4 ).setInteractive ();

        rct.on('pointerdown', function () {
            // this.scene.removePrompt();
        });

        this.promptCont.add ( rct );

        let miniCont = this.add.container ( 960, 1350 );

        let img = this.add.image ( 0, 0, sm ? 'prompt_sm' : 'prompt' );

        let txt = this.add.text (  0, txtPos, myTxt, { fontSize: fs, fontFamily:'Oswald', color: '#6e6e6e' }).setOrigin(0.5);

        miniCont.add ([img, txt]);

        if ( btnArr.length > 0 ) {


            const bw = 190, bh = 80, sp = 20;

            const bx = ((btnArr.length * (bw + sp)) - sp)/-2  + bw/2, 
        
                  by = 90;

            for ( let i = 0; i < btnArr.length; i++ ) {
                
                let btn = new MyButton ( this, bx + i*(bw+sp), by, bw, bh, i, 'promptbtns', '', '',  btnArr [i].txt, 30 );

                btn.on('pointerup', function () {

                    this.btnState('idle');

                    btnArr [i].func();

                });
                btn.on('pointerdown', function () {
                    
                    this.btnState ('pressed');

                    this.scene.playSound ('clicka');

                });

                miniCont.add ( btn );

            }



        }

        this.promptCont.add( miniCont );


        this.add.tween ({
            targets : this.promptCont.last,
            y : 540,
            duration : 400,
            easeParams : [ 0.5, 1],
            ease : 'Elastic',
            delay : 100
        });


    }

    showEndPrompt () {

        const txt = this.turn == 'self' ? 'Congrats, You Win' : 'Sorry, You Lose';

        const btnArr = [
            { 
                'txt' : 'Play Again', 
                'func' : () => this.playerRematch ()
            },
            { 
                'txt' : 'Exit', 
                'func' : () => this.leaveGame()
            },

           
        ];

        this.showPrompt ( txt, 40, -20, false, btnArr );

    }

    playerRematch () {

        if ( this.gameData.game == 0 ) {
            
            this.resetGame ();

        }else {

            this.showPrompt ('Waiting for response..', 35, 0, true );

            socket.emit ('playAgain');
        }
        
    }

    showExitPrompt () {


        const btnArr = [
            { 'txt' : 'Yes', 'func' : () => this.leaveGame () },
            { 'txt' : 'No', 'func' : () => this.removePrompt () }
        ];

        this.showPrompt ( 'Are you sure you want to leave?', 30, -20, false, btnArr );

    }

    showOpponentLeavesPrompt () {

        this.showPrompt ('Opponent Leaves. Leaving Game..', 32, 0, true );

        this.time.delayedCall ( 1000, function () {
            this.leaveGame ();
        }, [], this);

    }

    removePrompt () 
    {
        this.isPrompted = false;

        this.promptCont.destroy();
    }

    leaveGame () {

        socket.emit ('leaveGame');

        socket.removeAllListeners();

        this.bgmusic.stop();

        this.scene.start ('Intro');
    }


    
}
