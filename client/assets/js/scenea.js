class SceneA extends Phaser.Scene {

    constructor ()
    {
        super('SceneA');
    }
    preload () 
    {

    }

    create () 
    {

        this.plyr = 'self';

        this.gridArr = [];

        this.add.image (960, 540, 'centerpiece');

        let csize = 140;

        let cx = (1920 - ( csize * 7 ))/2 + csize/2, 

            cy = 260;

        for ( let i = 0; i < 42; i++ ) {

            let ix = Math.floor ( i/7 ), iy = i % 7;

            this.add.image ( cx + iy * csize, cy + ix*csize, 'cellbg' );

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
                this.scene.makeTurn ( this.getData ('id'), this.scene.plyr );
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

        this.createPlayersIndicator ();

        this.createControls ();

    }

    createControls () 
    {

        const btnArr = [ 'Exit', 'Sound', 'Music' ];

        for ( var i in btnArr ) {

            let btnCont = new MyButton ( this, -50 , (i * 110) + 218, 100, 100, i, 'contbtns', 'imgBtns', i  );

            btnCont.on('pointerdown', function () {
                this.clicked ();
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

        const w = 507, sp = 27;

        const sx = (1920 - ((w*2) + sp))/2 + w/2,
              sy = 80;

        for ( var i = 0; i < 2; i++ ) {

            let pInd = this.add.container ( sx + (i * ( w+sp)), sy );

            let img = this.add.image ( 0, 0, 'plyrInd');

            let name = this.add.text ( -150, -34, 'Chalnicol', { fontSize: 30, fontFamily:'Oswald', color: '#838383' });

            let wins = this.add.text ( -150, 6, 'Wins : 0', { fontSize: 26, fontFamily:'Oswald', color: '#9f9f9f' });

            pInd.add ( [img, name, wins] );
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

        let frm = ( plyr == 'self' ) ? 0 : 2;

        let crc = this.add.image ( x, 100, 'chips', frm ).setData ('frm', frm ).setName ('crc' + id );

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

                this.plyr = ( plyr == 'self' ) ? 'oppo' : 'self';

                const lined = this.checkLines ( depth, plyr == 'self' ? 1 : 2 );

                if ( lined != null ) {
                
                    this.illuminate ( lined );

                    this.playerWins ();
                } 


            }

        }

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

        let blinkOn = false;

        this.time.addEvent ({

            delay : 300,
            callback : () => {
                
                blinkOn = !blinkOn;

                for ( let i in arr ) {

                    let crc = this.circCont.getByName ('crc' + arr[i]);

                    let frame = ( blinkOn ) ?  crc.getData ('frm') + 1 : crc.getData ('frm');

                    crc.setFrame ( frame );
                }
            },
            callbackScope: this,
            loop : true
        });

    }

    playerWins () {

        this.gameOver = true;

        this.time.delayedCall ( 500, this.showPrompt, [], this );

    }

    showPrompt () {

        this.promptCont = this.add.container (0,0);

        let rct = this.add.rectangle ( 960, 540, 1920, 1080, 0xffffff, 0.3 ).setInteractive ();

        rct.on('pointerdown', function () {
            // this.scene.removePrompt();
        });

        this.promptCont.add( rct );

        let miniCont = this.add.container ( 960, 1350 );

        let img = this.add.image ( 0, 0, 'prompt');

        let txt = this.add.text (  0, -20, 'Congrats, You Win!', { fontSize: 40, fontFamily:'Oswald', color: '#9f9f9f' }).setOrigin(0.5);

        miniCont.add ([ img, txt ]);


        const bw = 180, bh = 60, sp = 20;

        const bx = -(( bw/2 ) + (sp/2)), by = 90;

        const txtArr = ['Rematch', 'Exit'];

        for ( var i = 0; i < 2; i++ ) {
            
            let btn = new MyButton ( this, bx + i*(bw+sp), by, bw, bh, i, 'promptbtns', '', '', txtArr [i], 30 );

            btn.on('pointerdown', function () {
                this.clicked();

                switch ( this.id ) {
                    case 0:
                        //this.scene.testCode();
                        break;
                    case 1:
                        this.scene.removePrompt ();
                        break;
                    default:
                }
            });


            miniCont.add ( btn );

        }


        this.add.tween ({
            targets : miniCont,
            y : 540,
            duration : 400,
            easeParams : [ 0.5, 1],
            ease : 'Elastic'
        });

        this.promptCont.add (miniCont);

    }

    removePrompt () 
    {
        this.promptCont.destroy();
    }
    
}
