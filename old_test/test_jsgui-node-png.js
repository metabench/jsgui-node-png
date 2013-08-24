if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['jsgui-lang-essentials', 'fs', '../jsgui-node-png'], 
    function(jsgui, fs, jsgui_png) {
        var stringify = jsgui.stringify;
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
        //test_load_png_iterate();
        
        
        var test_load_png_to_rgba_buffer_save_as_png = function() {
            
            var source_path = './source/pngsuite/f00n2c08.png';
            var dest_path = './res/f00n2c08.png';
        
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, pix_buf) {
                if (err) {
                    throw err;
                } else {
                    console.log('loaded rgba pixel buffer');
                    console.log('buffer resolution: ' + stringify(pix_buf.size));
                    
                    jsgui_png.save_rgba_pixel_buffer_to_disk(pix_buf, dest_path, function() {
                        console.log('save callback');
                    });
                }
            
            });
            
            
            
        }
        test_load_png_to_rgba_buffer_save_as_png();
        
    }
);
