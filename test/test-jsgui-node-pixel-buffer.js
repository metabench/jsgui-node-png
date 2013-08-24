// Connect to the binding object in this module...



if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['../../core/jsgui-lang-essentials', 'fs', '../../image/jsgui-node-png',
    '../../image/build/Release/binding.node'], 
    function(jsgui, fs, jsgui_png, buffer_cpp) {
        var stringify = jsgui.stringify, call_multi = jsgui.call_multi;
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
        
        // want to execute the same test on a bunch of items.
        
        var load_png_to_rgba_buffer_save_as_png = function(source_path, dest_path, callback) {
            
            jsgui_png.load_pixel_buffer_from_disk(source_path, function(err, pix_buf) {
                if (err) {
                    throw err;
                } else {
                    console.log('loaded rgba pixel buffer');
                    console.log('buffer resolution: ' + stringify(pix_buf.size));
                    
                    jsgui_png.save_rgba_pixel_buffer_to_disk(pix_buf, dest_path, function(err, res) {
                        //console.log('save callback');
                        if (err) {
                            throw err;
                        }
                        
                        callback(null, true);
                    });
                }
            
            });
            
        }
        
        var test_load_dice_png_to_rgba_buffer_save_as_png = function() {
            
            //var source_path = './source/pngsuite/f00n2c08.png';
            //var dest_path = './res/f00n2c08.png';
            
            //load_png_to_rgba_buffer_save_as_png(source_path, dest_path);
            
            var fns = [];
            
            
            fns.push([load_png_to_rgba_buffer_save_as_png, ['./source/dice.png', './res/dice.png']]);
            
            console.log('pre call multi');
            
            call_multi(fns, function(err, res_multi) {
                
            });
        }
        //test_load_dice_png_to_rgba_buffer_save_as_png();

        // want to iterate through, setting the value of each pixel.
        //  will do some kind of bleach effect.

        // Could maybe try with bigger images?
        //  Smaller
        // Want to get a nice little library made involving C and C++.
        //  Could give that system a convolution for it to do.
        //   This could be very FAST.

        var test_bleach_function = function() {
            jsgui_png.load_pixel_buffer_from_disk('./source/dice.png', function(err, pix_buf) {
                if (err) {
                    throw err;
                } else {
                    console.log('loaded rgba pixel buffer');
                    console.log('buffer resolution: ' + stringify(pix_buf.size));
                    
                    // Don't iterate the pixels with this??

                    // Or do?

                    // But have some bleaching written in JS to start with at least.

                    // Want to try the bleaching algorithm in C++ / C as well.
                    //  In C, having a function call per pixel may be OK...
                    //   but having loops is likely to be faster.
                    //   Function call per pixel may be how OpenCL works.

                    var w = pix_buf.size[0], h = pix_buf.size[1], l = w * h;
                    var buffer = pix_buf.buffer, r, g, b, a, i;
                    for (var c = 0; c < l; c++) {
                        // read the four values.
                        i = c * 4;
                        r = buffer.readUInt8(i);
                        g = buffer.readUInt8(i + 1);
                        b = buffer.readUInt8(i + 2);
                        a = buffer.readUInt8(i + 3);

                        // then change the values...
                        r = 255 - Math.round((255 - r) / 2);
                        g = 255 - Math.round((255 - g) / 2);
                        b = 255 - Math.round((255 - b) / 2);
                        //a = a;

                        buffer.writeUInt8(r, i);
                        buffer.writeUInt8(g, i + 1);
                        buffer.writeUInt8(b, i + 2);

                    }


                    jsgui_png.save_rgba_pixel_buffer_to_disk(pix_buf, './res/bleached-dice.png', function(err, res) {
                        console.log('cb save');
                        if (err) {
                            throw err;
                        }
                        
                        //callback(null, true);
                    });

                    // want to deal with the buffer itself.

                    /*
                    jsgui_png.save_rgba_pixel_buffer_to_disk(pix_buf, dest_path, function(err, res) {
                        //console.log('save callback');
                        if (err) {
                            throw err;
                        }
                        
                        callback(null, true);
                    });
                    */


                }
            
            });
        }
        //test_bleach_function();

        var test_bleach_c_function = function() {
            jsgui_png.load_pixel_buffer_from_disk('./source/dice.png', function(err, pix_buf) {
                if (err) {
                    throw err;
                } else {
                    console.log('loaded rgba pixel buffer');
                    console.log('buffer resolution: ' + stringify(pix_buf.size));
                    
                    // Don't iterate the pixels with this??
                    // Or do?

                    // But have some bleaching written in JS to start with at least.

                    // Want to try the bleaching algorithm in C++ / C as well.
                    //  In C, having a function call per pixel may be OK...
                    //   but having loops is likely to be faster.
                    //   Function call per pixel may be how OpenCL works.
                    var w = pix_buf.size[0], h = pix_buf.size[1], l = w * h;
                    var buffer = pix_buf.buffer, r, g, b, a, i;

                    buffer_cpp.rgba_buffer_self_simple_fade(buffer, w, h);


                    jsgui_png.save_rgba_pixel_buffer_to_disk(pix_buf, './res/bleached-dice.png', function(err, res) {
                        console.log('cb save');
                        if (err) {
                            throw err;
                        }
                        
                        //callback(null, true);
                    });
                }
            
            });
        }
        //test_bleach_c_function();

        var test_buffer_copy_c = function() {
            jsgui_png.load_pixel_buffer_from_disk('./source/dice.png', function(err, pix_buf) {
                if (err) {
                    throw err;
                } else {
                    console.log('loaded rgba pixel buffer');
                    console.log('buffer resolution: ' + stringify(pix_buf.size));
                    
                    // Don't iterate the pixels with this??
                    // Or do?

                    // But have some bleaching written in JS to start with at least.

                    // Want to try the bleaching algorithm in C++ / C as well.
                    //  In C, having a function call per pixel may be OK...
                    //   but having loops is likely to be faster.
                    //   Function call per pixel may be how OpenCL works.
                   // var w = pix_buf.size[0], h = pix_buf.size[1], l = w * h;
                    var buffer = pix_buf.buffer, r, g, b, a, i;
                    //console.log('buffer.length ' + buffer.length);
                    var buffer2 = buffer_cpp.buffer_copy(buffer);
                    //console.log('buffer2.length ' + buffer2.length);
                    pix_buf.buffer = buffer2;
                    
                    jsgui_png.save_rgba_pixel_buffer_to_disk(pix_buf, './res/copied-dice.png', function(err, res) {
                        console.log('cb save');
                        if (err) {
                            throw err;
                        }
                        
                        //callback(null, true);
                    });
                    
                }
            
            });
        }
        test_buffer_copy_c();

        // want to test convolutions.
        //  This is something for rgba buffers that could be implemented as a buffer-process module, both
        //  in JavaScript and also in C.

        // Could try a hard-coded convolution?
        //  Also want to do image compression / encoding.
        //   Changing from png to rgba?

        // Could also do convolution in JavaScript, but call C functions for matrix maths.
        //  Not sure about the various matrices in JavaScript though - they may be 1d.
        //   We could put data into 1d buffers, and have a width variable.
        //    (idea) put them into buffers, then we work out what the possible dimensions are through
        //     factorization. Then we have an int that says which in the sequence of possible
        //     widths it is.

        // Buffers with width properties
        // =============================

        // Had height there but I don't think we need it much of the time.

        







        
    }
);
