if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['jsgui-lang-essentials', 'fs', '../jsgui-node-png'], 
    function(jsgui, fs, jsgui_png) {
        
        //var source_file = './source/pliers2.png';
        var source_file = './source/f00n2c08.png';
        
        
        // f00n2c08
        // load up a PNG file.
        //  then iterate through its pixels.
        
        
        var test_load_png_iterate = function() {
            jsgui_png.load_from_disk(source_file, function(err, png) {
                if (err) {
                
                } else {
                    console.log('loaded png');
                    
                    // get the pixel at 0, 0.
                    
                    
                    
                    png.iterate_pixels(function(x, y, px) {
                        console.log('x ' + x + ', y ' + y + ', px ' + px);
                    });
                }
                
                
                
            })
        }
        test_load_png_iterate();
    }
);
