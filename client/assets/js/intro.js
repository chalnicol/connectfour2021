class Intro extends Phaser.Scene {

    constructor ()
    {
        super('Intro');
    }

    create () 
    {

        this.add.image ( 960, 540, 'title'); //title..

        //create profifle 
        const profileCont = this.add.container ( 210, 85 );


        let img = this.add.image ( 0, 0, 'profile');

        let username = this.add.text (-80, -35, 'Guest99999', { color:'#000', fontFamily:'Oswald', fontSize : 28 });

        let txte = this.add.text (-80, 10, 'TAP HERE TO CHANGE', { color:'#666', fontFamily:'Oswald', fontSize : 20 });


        profileCont.add ([img, username, txte]);

        //create menu

        const menuArr = [ 'Play vs Computer', 'Play vs Online', 'Play vs Friends'];

        for ( let i in menuArr ) {

            const miniCont = this.add.container ( 960, 624 + (i * 100) ).setSize( 500, 90).setInteractive().setData ('id', i );

            let rct = this.add.image ( 0, 0, 'bgmenu' ).setVisible (false);

            let crc = this.add.circle ( -210, 0, 10, 0x3e3e3e, 1 ).setVisible (false);

            let txt = this.add.text (-170, 0, menuArr[i], { color:'#000', fontFamily:'Oswald', fontSize : 48 }).setOrigin (0, 0.5);

            miniCont.add ( [rct, crc, txt] );

            miniCont.on ('pointerover', function () {
                //..
                this.getAt(0).setVisible ( true );
                this.getAt(1).setVisible ( true );
                
            });
            miniCont.on ('pointerout', function () {
                //..
                this.getAt(0).setVisible ( false );
                this.getAt(1).setVisible ( false );
            });
            miniCont.on ('pointerup', function () {
                //..
                this.getAt(0).setVisible ( false );
                this.getAt(1).setVisible ( false );
            });
            miniCont.on ('pointerdown', function () {
                //..
                this.scene.scene.start ('SceneA');
            });
            

        }


    }
}