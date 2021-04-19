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
     
        this.shotCounter = 0;
        
        this.gameOver = false;


        //add bg
        this.add.image ( 960, 540, 'bg'); 
        
        //add field bg..

        this.add.image (960, 540, 'centerpiece');

        let csize = 140;

        let cx = (1920 - ( csize * 7 ))/2 + csize/2, 

            cy = 260;

        for ( let i = 0; i < 42; i++ ) {

            let ix = Math.floor ( i/7 ), iy = i % 7;

            this.add.image ( cx + iy * csize, cy + ix*csize, 'cellbg' );

            //this.add.text ( cx + iy * csize, cy + ix*csize, i, { fontSize:20, fontFamily:'Arial', color:'#333'}).setOrigin(0.5);
        }

        for ( let i = 0; i < 7; i++ ) {

            let rct = this.add.rectangle ( cx + i* csize, cy + (csize*6)/2 - csize/2, csize, csize*6 ).setInteractive().setData('id', i).setName ('rct'+i);

            rct.on ('pointerout', function () {
                this.setFillStyle ( 0xffffff, 0 );
            });
            rct.on ('pointerup', function () {
                this.setFillStyle ( 0xffffff, 0 );
            });
            rct.on ('pointerover', function () {
                this.setFillStyle ( 0xffff00, 0.1 );
            });
            rct.on ('pointerdown', function () {

                if ( this.scene.turn == 'self' && !this.scene.players['self'].isAI ){
                    this.scene.makeTurn ( i, 'self' );
                }
                
            });
            
        }

      


        //..
        this.circCont = this.add.container (0, 0);

        //..
        for ( let i = 0; i < 42; i++ ) {

            let ix = Math.floor ( i/7 ), iy = i % 7;

            let miniCont = this.add.container ( cx + iy * csize, cy + ix*csize );

            //const rect = this.add.rectangle ( 0, 0, csize, csize, 0xffff00, 1 ).setStrokeStyle ( 1, 0x0a0a0a );

            //const crc = this.add.circle ( 0, 0, csize*0.45, 0xc3c3c3, 1 ).setStrokeStyle ( 1, 0x0a0a0a ); //63

            // const txt = this.add.text ( 0,0, i, {color:'#000', fontSize:30, fontFamily:'Arial'}).setOrigin (0.5);

            //const txtb = this.add.text ( 0, 30, ix +':' +iy, {color:'#000', fontSize: 20, fontFamily:'Arial'}).setOrigin (0.5);

            let img = this.add.image ( 0, 0, 'cell');

            miniCont.add ( img );

            this.gridArr.push ({
                x : miniCont.x,
                y : miniCont.y,
                resident : 0
            });

        }

        this.initSocketListeners();

        this.initPlayers();

        this.createPlayersIndicator ();

        this.createControls ();
    
        //start game..
        if ( this.players[ this.turn ].isAI ) this.makeAI();

    }

    initSocketListeners () {

        socket.on('opponentLeft', (data) => {
            console.log ( 'Opponent Left', data );
        });

    }

    initPlayers () {

        this.players = {};

        const names = ['Nong', 'Chalo', 'Nasty', 'Caloy'];

        let oppoUsername = '', 
            
            oppoAI = false, 
            
            oppoChip = 0;
        
        let turn = 'self';


        if (this.gameData.game == 0 ) {

            //is single player..
            oppoUsername = names [ Phaser.Math.Between (0, names.length - 1) ];

            oppoAI = true;

            oppoChip = this.gameData.players ['self'].chip == 0 ? 1 : 0;

            turn = Phaser.Math.Between(0, 1) == 0 ? 'self' : 'oppo';

        }  else {

            oppoUsername = this.gameData.players ['oppo'].username;

            oppoChip = this.gameData.players ['oppo'].chip;

            turn = this.gameData.turn;
            
        }   

        //..

        this.players ['self'] = { 
            'username' : this.gameData.players['self'].username, 
            'wins' : 0, 
            'isAI' : false, 
            'chip' : 0
        }

        this.players ['oppo'] = { 
            'username' : oppoUsername, 
            'wins' : 0, 
            'isAI' : oppoAI , 
            'chip' : oppoChip
        }

        this.turn = turn;
        
        
    
    }

    makeAI () {

        let tmp = [];

    
        for ( var i in this.gridArr ){
           if ( this.gridArr[i].resident == 0 ) tmp.push (i); 
        }

        let rnd = Phaser.Math.Between (0, tmp.length - 1 );

        this.time.delayedCall ( 500, function () {
            this.makeTurn ( tmp[rnd] % 7, this.turn );
        }, [], this);
    
        
    }

    createControls () 
    {

        const btnArr = [ 'Exit', 'Sound', 'Music', 'Emoji' ];

        for ( let i in btnArr ) {

            let btnCont = new MyButton ( this, -50 , (i * 110) + 218, 100, 100, i, 'contbtns', 'imgBtns', i  );

            btnCont.on('pointerdown', function () {
                
                this.clicked ();

                this.scene.showExitPrompt ();
                

            });
            
            this.add.tween ({
                targets : btnCont,
                x : 50,
                duration : 200,
                delay : i * 200,
                ease : 'Linear'
            });

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

            let name = this.add.text ( -150, -34, this.players[i].username, { fontSize: 30, fontFamily:'Oswald', color: '#838383' });

            let wins = this.add.text ( -150, 6, 'Wins : 0', { fontSize: 26, fontFamily:'Oswald', color: '#9f9f9f' });

            pInd.add ( [img, name, wins] );

            this.playerIndicatorsCont.add ( pInd );

            counter++;
        }

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

        let frm = ( this.players[ plyr ].chip == 0 ) ? 0 : 2;

        let crc = this.add.sprite ( x, 100, 'chips', frm ).setName ('crc' + id );

        this.add.tween ({
            targets : crc,
            y : y,
            duration : 400,
            ease : 'Bounce'
        });

        this.circCont.add ( crc );

    }

    makeTurn ( col, plyr ) {

        if ( !this.gameOver ) {

            const depth = this.getDepth ( col );

            if ( depth != null ) {

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
        
        if ( this.players[ this.turn ].isAI ) this.makeAI();

    }

    checkLines ( depth, clrId ) 
    {

        const r = Math.floor ( depth/7 ), c = depth % 7;

        //horizontal..
        for ( var i = 0; i < 4; i++ ) {

            let sPoint = (r * 7) + i;

            let arr = [];

            for ( var j = 0; j < 4; j++ ) {

                if ( this.gridArr [ sPoint + j ].resident == clrId ) arr.push ( sPoint + j );

            }

            if ( arr.length > 3 ) return arr;

        }

        //vertical..
        for ( var i = 0; i < 3; i++ ) {

            let sPoint = (i * 7) + c;

            let arrb = [];

            for ( var j = 0; j < 4; j++ ) {

                if ( this.gridArr [ sPoint + (j*7) ].resident == clrId ) arrb.push ( sPoint + (j*7) );

            }

            if ( arrb.length > 3 ) return arrb;

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

        const frm =  ( this.players [ this.turn ].chip == 0 ) ? 0 : 2;

        this.anims.create( {
            key: 'blink',
            frames: this.anims.generateFrameNumbers( 'chips' , { frames : [ frm , frm + 1 ] }),
            frameRate: 2,
            repeat: -1
        });

        for ( var i in arr ) {

            let crc = this.circCont.getByName ('crc' + arr[i] );

            crc.play ('blink');

        }

    }

    endGame () {

        this.gameOver = true;

        this.players [ this.turn ].wins += 1;

        this.playerIndicatorsCont.getByName ( this.turn ).last.text = 'Wins : ' +  this.players [ this.turn ].wins;

        this.time.delayedCall ( 500, this.showEndPrompt, [], this );

    }

    resetGame () {

        console.log ('reset game');

        this.anims.remove ('blink');

        if ( this.isPrompted ) this.removePrompt ();

        for ( var i in this.gridArr ) {
            this.gridArr [i].resident = 0;
        }

        this.circCont.each ( function (child) {
            child.destroy();
        });


        this.showPrompt ('Game is restarting..', 36, 10 );

        this.time.delayedCall (1000, function () {
           
            this.removePrompt ();
           
            this.gameOver = false;
        
            this.switchTurn ();
            
        }, [], this);


    }

    showPrompt ( myTxt, fs = 40, txtPos = 10 ) {

        if ( this.isPrompted ) this.removePrompt ();

        this.isPrompted = true;

        this.promptCont = this.add.container (0,0);

        let rct = this.add.rectangle ( 960, 540, 1920, 1080, 0x0a0a0a, 0.4 ).setInteractive ();

        rct.on('pointerdown', function () {
            // this.scene.removePrompt();
        });

        this.promptCont.add ( rct );


        let miniCont = this.add.container ( 960, 1350 );

        let img = this.add.image ( 0, 0, 'prompt');

        let txt = this.add.text (  0, txtPos, myTxt, { fontSize: fs, fontFamily:'Oswald', color: '#9f9f9f' }).setOrigin(0.5);

        miniCont.add ([img, txt]);

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

    addButtonsToPrompt ( cont, btnArr ) {

        const bw = 190, bh = 80, sp = 20;

        const bx = ((btnArr.length * (bw + sp)) - sp)/-2  + bw/2, 
        
              by = 90;

        for ( let i = 0; i < btnArr.length; i++ ) {
            
            let btn = new MyButton ( this, bx + i*(bw+sp), by, bw, bh, i, 'promptbtns', '', '',  btnArr [i].txt, 30 );

            btn.on('pointerdown', function () {

                this.clicked();

                btnArr [i].func();

            });

            cont.add ( btn );

        }

        
    }

    showEndPrompt () {

        const txt = this.turn == 'self' ? 'Congrats, You Win' : 'Sorry, You Lose';

        this.showPrompt ( txt, 40, -20 );

        var _this = this;

        const btnArr = [
            { 'txt' : 'Play Again', 'func' : function () {
                _this.showRematchPrompt ();
            }},
            { 'txt' : 'Exit', 'func' : function () {
                _this.leaveGame();
            }},
        ];

        this.addButtonsToPrompt ( this.promptCont.last, btnArr );

    }

    showRematchPrompt () {

        this.showPrompt ('Waiting for opponent..', 35 );

        //fake decisiion..
        const rnd = Phaser.Math.Between (0, 9);

        this.time.delayedCall ( 1000, function () {
            if ( rnd < 2 ) {
                this.showOpponentLeavesPrompt ();
            }else {
                this.resetGame();
            }
            
        }, [], this);

    }

    showExitPrompt () {

        this.showPrompt ( 'Are you sure you want to leave?', 30, -20 );

        const btnArr = [
            { 'txt' : 'Yes', 'func' : () => this.leaveGame () },
            { 'txt' : 'No', 'func' : () => this.removePrompt () }
        ];

        this.addButtonsToPrompt ( this.promptCont.last, btnArr );

    }

    showOpponentLeavesPrompt () {

        this.showPrompt ('Opponent Leaves. Leaving Game..', 32 );

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

        this.scene.start ('Intro');
    }
    
}
