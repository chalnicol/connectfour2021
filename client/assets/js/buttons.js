class MyButton extends Phaser.GameObjects.Container {

    constructor(scene, x, y, w, h, id, bg = '', img = '', imgFrame = 0, txt = '', fs = 0 ) {

        super( scene, x, y, [] );
        
        // ...
        this.id = id;

        this.bg = bg;

        this.setSize(w, h).setInteractive ();

        if ( bg == '' ) {
            let myRct = scene.add.rectangle ( 0, 0, w, h, 0xffffff, 1 ).setStrokeStyle ( 1, 0x0a0a0a );
            this.add ( myRct );
        }else {
            let myBg = scene.add.image ( 0, 0, bg );
            this.add ( myBg );
        }
        
        if ( img != '') {
            let myImg = scene.add.image ( 0, 0, img, imgFrame );
            this.add ( myImg );
        }

        if ( txt != '' ) {

            let myTxt = scene.add.text ( 0, 0, txt,  { color:'#999', fontFamily:'Oswald', fontSize: fs != 0 ? fs : h*0.4 }  ).setOrigin (0.5);
            
            this.add (myTxt);
        }

        this.on ('pointerover', function () {
            
            if ( bg == '') {
                this.first.setFillStyle ( 0xd3d3d3, 1 );
            }else {
                this.first.setFrame ( 1 );
            }
            
        });
        this.on ('pointerout', function () {

            if ( bg == '') {
                this.first.setFillStyle ( 0xffffff, 1 );
            }else {
                this.first.setFrame ( 0 );
            }

        });
        this.on ('pointerup', function () {

            if ( bg == '') {
                this.first.setFillStyle ( 0xffffff, 1 );
            }else {
                this.first.setFrame ( 0 );
            }
            
        });
        this.on ('pointerdown', function () {

            this.clicked ();

        });
        
        scene.add.existing(this);

    }

    setBtnEnabled ( enabled = false ) {

        if ( !enabled ) {   

            this.removeInteractive ();

            this.alpha = 0.8;

            if ( this.bg == '') {
                this.first.setFillStyle ( 0xd3d3d3, 1 );
            }else {
                this.first.setFrame ( 0 );
            }

        }else {

            this.setInteractive ();

            this.alpha = 1;

            if ( this.bg == '') {
                this.first.setFillStyle ( 0xffffff, 1 );
            }else {
                this.first.setFrame ( 0 );
            }
        }
        
    }

    clicked () {

        if ( this.bg == '') {
            this.first.setFillStyle ( 0xff9999, 1 );
        }else {
            this.first.setFrame ( 2 );
        }

    }
    
}
