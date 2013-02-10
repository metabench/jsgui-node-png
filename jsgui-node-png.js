if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

// could also use image_buffer...
//  will get a new image_buffer from a PNG.

//  will also load an image_buffer from 

define(['jsgui-lang-essentials', 'fs', 'zlib', './CrcStream', 'jsgui-node-pixel-buffer'], 
    function(jsgui, fs, zlib, CrcStream, Pixel_Buffer) {
        
        
        var stringify = jsgui.stringify, each = jsgui.each, is_defined = jsgui.is_defined;
        
        /*

PNG starts with an 8 byte signature

137	    A byte with its most significant bit set (``8-bit character'')
80	    P
78  	N
71	    G
13	    Carriage-return (CR) character, a.k.a. CTRL-M or ^M
10	    Line-feed (LF) character, a.k.a. CTRL-J or ^J
26	    CTRL-Z or ^Z
10	    Line-feed (LF) character, a.k.a. CTRL-J or ^J

137, 80, 78, 71, 13, 10, 26, 10

Then it has chunks

PNG Chunks
----------        
IHDR
    Header, metadata
gAMA
    Gamma correcton
PLTE
    Palette
tRNS
    Transparency
IEND
    End               

PNG color options
-----------------

Bits per pixel
--------------
Color option	Channels	Bits per channel
                    1	2	4	8	16
Indexed	            1	1	2	4	8	
Grayscale	        1	1	2	4	8	16
Grayscale & alpha	2				16	32
Truecolor	        3				24	48
Truecolor & alpha	4				32	64


PNG color types
---------------
Color
type	Name	Binary	Masks
 	A	C	P
0	Grayscale   	                0	0	0	0	 
1	(Indexed grayscale)	            0	0	0	1	palette
2	Truecolor	                    0	0	1	0	color
3	Indexed	                        0	0	1	1	palette
4	Grayscale & alpha       	    0	1	0	0	alpha
5	(Indexed grayscale & alpha)	    0	1	0	1	palette
6	Truecolor & alpha	            0	1	1	0	color
7	(Indexed & alpha)	            0	1	1	1	color | palette


Type byte	Filter name	Predicted value
0	        None	    Zero (so that the raw byte value passes through unaltered)
1	        Sub	        Byte A (to the left)
2	        Up	        Byte B (above)
3	        Average	    Mean of bytes A and B, rounded down
4	        Paeth	    A, B, or C, whichever is closest to p = A + B − C

PNG compression method 0 
(the only compression method presently defined for PNG) specifies deflate/inflate compression with a 32K sliding window.
        */
        
        var paeth_predictor = function(left, above, above_left) {
            var p = left + above - above_left,
                p_left = Math.abs(p - left),
                p_above = Math.abs(p - above),
                p_above_left = Math.abs(p - above_left);
        
            if (p_left <= p_above && p_left <= p_above_left) {
                return left;
            }
            else if (p_above <= p_above_left) {
                return above;
            }
            return above_left;
        };
        
        // Buffers read asyncronously... or some other things do here.
        
        var PNG = jsgui.Class.extend({
            'init': function(spec) {
                // size
                
                //  ?? no file size right now. could have a loaded_file_size.
                // file_size
                
                // size
                
                this.map_unfiltered_scanline_buffers = {};
                
            },
            
            // Want to be able to get and set pixels.
            //  Also want to be able to use this for the spritesheet, so the pixels can get composed in a pixel buffer,
            //  and then saved as a PNG.
            
            
            
            
            
            // want to be able to change what filter is used on any row.
            //  when doing that, will make a map of unfiltered data (pixels data? buffer?)...
            
            // Maybe hold things internally in an RGBA buffer?
            //  Need to be able to get the unfiltered scanline values when encoding.
            
            // Therefore need to store unfiltered scanlines...
            
            // Changing the filtering used on a scanline...
            
            // Need to be able to get any pixel... would require decoding things.
            //  I think maintaining a map of unfiltered/defiltered scanlines makes the most sense.
            //   ??? maybe not for garbage collection. Will do it though.
            
            //   They can be obtained as needed.
            //   The function get_unfiltered_scanline_buffer will be used to get them.
            
            // get_px will get the pixel from the unfiltered scanline buffer.
            // set_px will ensure the unfiltered scanline buffer exists, and set it there.
            //  (subsequent scanlines need to be updated as appropriate)
            // Want to be able to change individual line filters.
            //  May have ability to set a few of them at once. Will then remake the filtered scanlines (as needed).
            //   Possibly before reading a pixel that will have been updated?
            //   Having the filtered scanlines update automatically???
            //    Would then be able to test how compressable the data is
            
            // when setting a scanline filter, will need to update the filtered rows below?
            //  
            
            
            // When changing the scanline filter used... need to label that the scanline needs updating.
            //  Could automatically reencode all scanlines upon save.
            
            // I think a map_scanlines_changed object will help.
            //  When a scanline has been changed it should be marked as such.
            
            
            // Reencoding the whole image before it gets saved...
            
            // Reencoding parts of the image after a change, would be more efficient regarding CPU.
            //  Could get fairly finely grained about that, not sure if it is worth it right now.
            
            
            // apply scanline filter to all rows...
            
            // set the scanline filter on a row, but first cache its unfiltered scanline buffer
            
            'set_scanline_filter_all_rows': function(scanline_filter_num) {
                var h = this.size[1];
                for (var y = 0; y < h; y++) {
                    this.set_scanline_filter(y, scanline_filter_num);
                }
            },
            
            // set_scanline_filter_byte
            
            'set_scanline_filter': function(scanline_num, scanline_filter_byte) {
                this.map_unfiltered_scanline_buffers[scanline_num] = this.get_unfiltered_scanline_buffer(scanline_num);
            
                this.set_scanline_filter_byte(scanline_num, scanline_filter_byte);
            },
            
            // More work on the save function needed... needs to reencode each scanline.
            
            'set_scanline_filter_byte_all_rows': function(scanline_filter_num) {
                var h = this.size[1];
                for (var y = 0; y < h; y++) {
                    this.set_scanline_filter_byte(y, scanline_filter_num);
                }
            },
            
            // set_scanline_filter_byte
            
            'set_scanline_filter_byte': function(scanline_num, scanline_filter_byte) {
                var h = this.size[1], scanline_length = this.scanline_length, scanlines_buffer = this.scanlines_buffer;
                var scanline_start = scanline_num * scanline_length;
                scanlines_buffer.writeUInt8(scanline_filter_byte, scanline_start);
            },
            
            // Will look into the heuristics for choosing a scanline filter.
            // Will be able to apply scanline filters outside of the save process.
            
            'get_scanline_filter_byte': function(scanline_num) {
                //console.log('get_scanline_filter_byte scanline_num ' + scanline_num);
                var h = this.size[1], scanline_length = this.scanline_length, scanlines_buffer = this.scanlines_buffer;
                var scanline_start = scanline_num * scanline_length;
                //console.log('scanline_num ' + scanline_num);
                //console.log('scanline_length ' + scanline_length);
                //console.log('scanline_start ' + scanline_start);
                var scanline_filter_byte = scanlines_buffer.readUInt8(scanline_start);
                return scanline_filter_byte;
            },
            
            // calc
            
            'get_filtered_scanline_buffer': function(scanline_num) {
                // may re-encode it... not sure.
                
                // It would not need reencoding at all times.
                
                // consult a map of which have changed?
                throw 'Not yet implemented... will return the existing scanline buffer if it has been unchanged.'
                
                
            },
            // ?
            'calc_filtered_scanline_buffer': function(scanline_num) {
                // may re-encode it... not sure.
                
                // It would not need reencoding at all times.
                
                // consult a map of which have changed?
                //throw 'Not yet implemented... will return the existing scanline buffer if it has been unchanged.'
                
                // do this over each row?
                
                // or reencode all rows?
                
                
            },
            
            // get_rgba_pixel_buffer...
            //  will iterate through the pixels, copying to that buffer.
            //  alternatively will copy from the unfiltered scanline buffer when in color mode 6.
            
            'get_rgba_pixel_buffer': function() {
                // could be optimized (maybe just for some cases).
            
                var res = new Pixel_Buffer({
                    'size': this.size
                });
                
                var color_type = this.color_type;
                
                if (color_type == 2) {
                    this.iterate_pixels(function(x, y, px) {
                        px[3] = 255;
                        res.set_pixel(x, y, px);
                    });
                } else if (color_type == 6) {
                    this.iterate_pixels(function(x, y, px) {
                        
                        res.set_pixel(x, y, px);
                    });
                } else {
                    this.iterate_pixels(function(x, y, px) {
                        if (px.length == 3) px[3] = 255;
                        res.set_pixel(x, y, px);
                    });
                }
                
                
                
                return res;
            },
            
            
            // will be used for random access to pixels.
            //  will rapidly change the unfiltered scanlines.
            //  then when saving or accessing the filtered scanlines, will calculate the filtered scanlines.
            'get_unfiltered_scanline_buffer': function(scanline_num) {
                // find out what filter is in operation there.
                //  will be consulting the filtered scanline buffer where needed.
                var y = scanline_num;
                // and will save it in a cache.
                if (this.map_unfiltered_scanline_buffers[scanline_num]) {
                    return this.map_unfiltered_scanline_buffers[scanline_num];
                } else {
                    // go through the line... may need to get the above unfiltered scanline buffer.
                    //  could be used in iterating the pixels... so maybe copy code over from there before deleting it from there.
                    // this can be optimized a fair bit.
                    
                    // go through the scanline itself... if it is filter 0, cache it, return it.
                    //  otherwise, there is more work to do.
                    var w = this.size[0], h = this.size[1], scanline_length = this.scanline_length, scanlines_buffer = this.scanlines_buffer;
                    var color_type = this.color_type, bit_depth = this.bit_depth;
                    var scanline_filter_byte = this.get_scanline_filter_byte(scanline_num);
                    var scanline_start = scanline_num * scanline_length;
                    var scanline_end = scanline_start + scanline_length;
                    var res_buffer = new Buffer(scanline_length);
                    
                    var r, g, b, a;
                    var defiltered_r, defiltered_g, defiltered_b, defiltered_a;
                    var last_defiltered_r = 0, last_defiltered_g = 0, last_defiltered_b = 0, last_defiltered_a = 0;
                    
                    if (scanline_filter_byte == 0) {
                        scanlines_buffer.copy(res_buffer, 0, scanline_start, scanline_end);
                    } else {
                        // decode the scanline.
                        // if it's scanline filters 2, 3 or 4, we need the unfiltered_scanline_buffer above (if there is one)
                        //  otherwise we could make a fake one.
                        // iterate over each of the items in the scanline.
                        
                        if (scanline_filter_byte == 1) {
                            // can do this within the scanline.
                            // go through the buffer... will depend on the color depth.
                            // filters with indexed color?
                            
                            // move through it based on the number of bytes per pixel...
                            //  not sure how it will work with indexed color.
                            
                            // rgba (6)
                            //  32 bpp
                            // rgb (2)
                            //  24 bpp
                            
                            if (color_type == 2) {
                                // go through the line, getting the pixel values. like below
                                
                                // for loop, track x value.
                                
                                // rgb 24
                                if (bit_depth == 8) {
                                    
                                    //console.log('DECODE ct 2 bd 8');
                                    
                                    // go through the values of the scanline, looking at the pixels.
                                    var res = new Buffer(scanline_length);
                                    res.writeUInt8(0, 0);
                                    //var last_defiltered_px = [0, 0, 0];
                                    
                                    //var num_bytes_per_pixel = 3;
                                    
                                    for (var x = 0; x < w; x++) {
                                        // extract rgb values...
                                        //  3 bytes
                                        r = scanlines_buffer.readUInt8(scanline_start + 1 + x * 3);
                                        g = scanlines_buffer.readUInt8(scanline_start + 2 + x * 3);
                                        b = scanlines_buffer.readUInt8(scanline_start + 3 + x * 3);
                                        
                                        //var px = [r, g, b];
                                        //console.log('px ' + stringify(px));
                                        
                                        // then do the unfiltering.
                                        //var unfiltered
                                        
                                        defiltered_r = r + last_defiltered_r;
                                        defiltered_g = g + last_defiltered_g;
                                        defiltered_b = b + last_defiltered_b;
                                        
                                        if (defiltered_r > 255) defiltered_r = defiltered_r - 256;
                                        if (defiltered_g > 255) defiltered_g = defiltered_g - 256;
                                        if (defiltered_b > 255) defiltered_b = defiltered_b - 256;
                                        
                                        //var defiltered_px = [defiltered_r, defiltered_g, defiltered_b];
                                        
                                        //console.log('defiltered_px ' + stringify(defiltered_px));
                                        
                                        res.writeUInt8(defiltered_r, x * 3 + 1);
                                        res.writeUInt8(defiltered_g, x * 3 + 2);
                                        res.writeUInt8(defiltered_b, x * 3 + 3);
                                        
                                        //last_defiltered_px = defiltered_px;
                                        
                                        last_defiltered_r = defiltered_r;
                                        last_defiltered_g = defiltered_g;
                                        last_defiltered_b = defiltered_b;
                                        //last_defiltered_a = defiltered_a;
                                    }
                                    return res;
                                    
                                } else {
                                    throw 'Unsupported bit_depth ' + bit_depth;
                                }
                                
                                
                                
                            } else if (color_type == 6) {
                                
                                // RGBA. Will use a multiplier by 4, process the alpha channel.
                                
                                // rgb 32
                                if (bit_depth == 8) {
                                    
                                    //console.log('DECODE ct 2 bd 8');
                                    
                                    // go through the values of the scanline, looking at the pixels.
                                    var res = new Buffer(scanline_length);
                                    res.writeUInt8(0, 0);
                                    //var last_defiltered_px = [0, 0, 0, 0];
                                    
                                    //var num_bytes_per_pixel = 3;
                                    
                                    for (var x = 0; x < w; x++) {
                                        // extract rgb values...
                                        //  3 bytes
                                        r = scanlines_buffer.readUInt8(scanline_start + 1 + x * 4);
                                        g = scanlines_buffer.readUInt8(scanline_start + 2 + x * 4);
                                        b = scanlines_buffer.readUInt8(scanline_start + 3 + x * 4);
                                        a = scanlines_buffer.readUInt8(scanline_start + 4 + x * 4);
                                        
                                        //var px = [r, g, b, a];
                                        //console.log('px ' + stringify(px));
                                        
                                        // then do the unfiltering.
                                        //var unfiltered
                                        
                                        defiltered_r = r + last_defiltered_r;
                                        defiltered_g = g + last_defiltered_g;
                                        defiltered_b = b + last_defiltered_b;
                                        defiltered_a = a + last_defiltered_a;
                                        
                                        if (defiltered_r > 255) defiltered_r = defiltered_r - 256;
                                        if (defiltered_g > 255) defiltered_g = defiltered_g - 256;
                                        if (defiltered_b > 255) defiltered_b = defiltered_b - 256;
                                        if (defiltered_a > 255) defiltered_a = defiltered_a - 256;
                                        
                                        //var defiltered_px = [defiltered_r, defiltered_g, defiltered_b, defiltered_a];
                                        
                                        //console.log('defiltered_px ' + stringify(defiltered_px));
                                        
                                        res.writeUInt8(defiltered_r, x * 4 + 1);
                                        res.writeUInt8(defiltered_g, x * 4 + 2);
                                        res.writeUInt8(defiltered_b, x * 4 + 3);
                                        res.writeUInt8(defiltered_a, x * 4 + 4);
                                        
                                        //last_defiltered_px = defiltered_px;
                                        last_defiltered_r = defiltered_r;
                                        last_defiltered_g = defiltered_g;
                                        last_defiltered_b = defiltered_b;
                                        last_defiltered_a = defiltered_a;
                                    }
                                    return res;
                                    
                                } else {
                                    throw 'Unsupported bit_depth ' + bit_depth;
                                }
                                
                                
                            } else {
                                throw 'unsupported color type for scanline filter 1';
                            }
                            
                        } else if (scanline_filter_byte == 2) {
                            // up filter
                            // read the rows while using a different scanline filter.
                            
                            // this time we can get the scanline filter above.
                            //  (except where scanline_num == 0, in that case it is the unfiltered values.);
                            
                            // need color_type 2 or 6
                            var that = this;
                            var process_bytes_above = function() {
                                if (y == 0) {
                                    var new_unfiltered_scanline_buffer = new Buffer(scanline_length);
                                    scanlines_buffer.copy(new_unfiltered_scanline_buffer, 0, scanline_start, scanline_end);
                                    scanlines_buffer.writeUInt8(0, 0);
                                    that.map_unfiltered_scanline_buffers[y] = new_unfiltered_scanline_buffer;
                                    return new_unfiltered_scanline_buffer;
                                    
                                    // copy from the filtered scanline... maybe have a function for that.
                                } else {
                                    var uf_sb_above = that.get_unfiltered_scanline_buffer(y - 1);
                                    
                                    // then go through the current scanline... and do the maths.
                                    
                                    var new_unfiltered_scanline_buffer = new Buffer(scanline_length);
                                    new_unfiltered_scanline_buffer.writeUInt8(0, 0);
                                    // byte by byte
                                    for (var c = 1; c < scanline_length; c++) {
                                        var byte_val = scanlines_buffer.readUInt8(scanline_start + c);
                                        //console.log('byte_val ' + byte_val);
                                        
                                        // and need to look at the byte val above
                                        
                                        var byte_val_above = uf_sb_above.readUInt8(c);
                                        //console.log('byte_val_above ' + byte_val_above);
                                        
                                        var new_byte_val = byte_val + byte_val_above;
                                        if (new_byte_val > 255) new_byte_val = new_byte_val - 256;
                                        new_unfiltered_scanline_buffer.writeUInt8(new_byte_val, c);
                                    }
                                    that.map_unfiltered_scanline_buffers[y] = new_unfiltered_scanline_buffer;
                                    return new_unfiltered_scanline_buffer;
                                }
                            }
                            
                            if (color_type == 2) {
                                if (bit_depth == 8) {
                                    //throw 'currently unsupported';
                                    process_bytes_above();
                                    // get the unfiltered scanline above.
                                    // if y == 0, return a copy of this scanline but with the filter changed to 0.
                                    
                                } else {
                                    throw 'unsupported bit depth with scanline filter 2';
                                }
                                
                            } else if (color_type == 6) {
                                if (bit_depth == 8) {
                                    // color type 6 = Truecolor & alpha rgba
                                    //  looks exactly the same as above... processes the byte above.
                                    
                                    process_bytes_above();
                                    
                                    //throw 'currently unsupported';
                                    
                                } else {
                                    throw 'unsupported bit depth with scanline filter';
                                }
                            } else {
                                throw ('unsupported color_type ' + color_type + ' with scanline_filter ' + scanline_filter_byte);
                            }
                            
                            //throw 'unsupported scanline filter ' + scanline_filter_byte;
                        } else if (scanline_filter_byte == 3) {
                            // average of left and up... support this scanline filter here.
                            
                            // For color type 2, and 6
                            //  bit depth 8 bits per sample for the moment, 24 and 32 bpp.
                            
                            if (color_type == 2) {
                                if (bit_depth == 8) {
                                    
                                    //console.log('DECODE ct 2 bd 8');
                                    
                                    // go through the values of the scanline, looking at the pixels.
                                    var res = new Buffer(scanline_length);
                                    res.writeUInt8(0, 0);
                                    var last_defiltered_px = [0, 0, 0];
                                    
                                    //var num_bytes_per_pixel = 3;
                                    
                                    // need to look at the scanline above.
                                    var uf_sb_above = this.get_unfiltered_scanline_buffer(y - 1);
                                    
                                    
                                    for (var x = 0; x < w; x++) {
                                        // extract rgb values...
                                        //  3 bytes
                                        r = scanlines_buffer.readUInt8(scanline_start + 1 + x * 3);
                                        g = scanlines_buffer.readUInt8(scanline_start + 2 + x * 3);
                                        b = scanlines_buffer.readUInt8(scanline_start + 3 + x * 3);
                                        //var a = scanlines_buffer.readUInt8(scanline_start + 4 + x * 4);
                                        
                                        //var px = [r, g, b, a];
                                        var px = [r, g, b];
                                        //console.log('px ' + stringify(px));
                                        
                                        // then do the unfiltering.
                                        //var unfiltered
                                        
                                        // pixel value above, pixel value to left. Take avg of them.
                                        
                                        var pixel_above = [0, 0, 0];
                                        var r_above = 0;
                                        var g_above = 0;
                                        var b_above = 0;
                                        if (scanline_num > 0) {
                                            // read pixel from unfiltered scanline above
                                            //pixel_above = uf_sb_above.readUInt8(c);
                                            
                                            r_above = uf_sb_above.readUInt8(x * 3 + 1);
                                            g_above = uf_sb_above.readUInt8(x * 3 + 2);
                                            b_above = uf_sb_above.readUInt8(x * 3 + 3);
                                        }
                                        
                                        defiltered_r = r + Math.floor((r_above + last_defiltered_px[0]) / 2);
                                        defiltered_g = g + Math.floor((g_above + last_defiltered_px[1]) / 2);
                                        defiltered_b = b + Math.floor((b_above + last_defiltered_px[2]) / 2);
                                        
                                        if (defiltered_r > 255) defiltered_r = defiltered_r - 256;
                                        if (defiltered_g > 255) defiltered_g = defiltered_g - 256;
                                        if (defiltered_b > 255) defiltered_b = defiltered_b - 256;
                                        //if (defiltered_a > 255) defiltered_a = defiltered_r - 256;
                                        
                                        var defiltered_px = [defiltered_r, defiltered_g, defiltered_b];
                                        
                                        //console.log('defiltered_px ' + stringify(defiltered_px));
                                        
                                        res.writeUInt8(defiltered_r, x * 3 + 1);
                                        res.writeUInt8(defiltered_g, x * 3 + 2);
                                        res.writeUInt8(defiltered_b, x * 3 + 3);
                                        r//es.writeUInt8(defiltered_a, x * 3 + 4);
                                        
                                        last_defiltered_px = defiltered_px;
                                    }
                                    return res;
                                    
                                } else {
                                    throw 'Unsupported bit_depth ' + bit_depth;
                                }
                            } else if (color_type == 6) {
                                if (bit_depth == 8) {
                                    
                                    var res = new Buffer(scanline_length);
                                    res.writeUInt8(0, 0);
                                    var last_defiltered_px = [0, 0, 0, 0];
                                    //var num_bytes_per_pixel = 3;
                                    
                                    // need to look at the scanline above.
                                    var uf_sb_above = this.get_unfiltered_scanline_buffer(y - 1);
                                    
                                    for (var x = 0; x < w; x++) {
                                        // extract rgb values...
                                        //  3 bytes
                                        r = scanlines_buffer.readUInt8(scanline_start + 1 + x * 4);
                                        g = scanlines_buffer.readUInt8(scanline_start + 2 + x * 4);
                                        b = scanlines_buffer.readUInt8(scanline_start + 3 + x * 4);
                                        a = scanlines_buffer.readUInt8(scanline_start + 4 + x * 4);
                                        
                                        var px = [r, g, b, a];
                                        //var px = [r, g, b];
                                        //console.log('px ' + stringify(px));
                                        
                                        // then do the unfiltering.
                                        //var unfiltered
                                        
                                        // pixel value above, pixel value to left. Take avg of them.
                                        
                                        var pixel_above = [0, 0, 0, 0];
                                        var r_above = 0;
                                        var g_above = 0;
                                        var b_above = 0;
                                        var a_above = 0;
                                        
                                        if (scanline_num > 0) {
                                            // read pixel from unfiltered scanline above
                                            //pixel_above = uf_sb_above.readUInt8(c);
                                            
                                            r_above = uf_sb_above.readUInt8(x * 4 + 1);
                                            g_above = uf_sb_above.readUInt8(x * 4 + 2);
                                            b_above = uf_sb_above.readUInt8(x * 4 + 3);
                                            a_above = uf_sb_above.readUInt8(x * 4 + 3);
                                        }
                                        
                                        defiltered_r = r + Math.floor((r_above + last_defiltered_px[0]) / 2);
                                        defiltered_g = g + Math.floor((g_above + last_defiltered_px[1]) / 2);
                                        defiltered_b = b + Math.floor((b_above + last_defiltered_px[2]) / 2);
                                        defiltered_a = a + Math.floor((a_above + last_defiltered_px[3]) / 2);
                                        
                                        if (defiltered_r > 255) defiltered_r = defiltered_r - 256;
                                        if (defiltered_g > 255) defiltered_g = defiltered_g - 256;
                                        if (defiltered_b > 255) defiltered_b = defiltered_b - 256;
                                        if (defiltered_a > 255) defiltered_a = defiltered_a - 256;
                                        //if (defiltered_a > 255) defiltered_a = defiltered_r - 256;
                                        
                                        var defiltered_px = [defiltered_r, defiltered_g, defiltered_b, defiltered_a];
                                        
                                        //console.log('defiltered_px ' + stringify(defiltered_px));
                                        
                                        res.writeUInt8(defiltered_r, x * 4 + 1);
                                        res.writeUInt8(defiltered_g, x * 4 + 2);
                                        res.writeUInt8(defiltered_b, x * 4 + 3);
                                        res.writeUInt8(defiltered_a, x * 4 + 4);
                                        r//es.writeUInt8(defiltered_a, x * 3 + 4);
                                        
                                        last_defiltered_px = defiltered_px;
                                    }
                                    return res;
                                    //throw 'currently unsupported';
                                    
                                } else {
                                    throw 'unsupported bit depth with scanline filter';
                                }
                            } else {
                                throw ('unsupported color_type ' + color_type + ' with scanline_filter ' + scanline_filter_byte);
                            }
                            
                            //throw 'unsupported scanline filter ' + scanline_filter_byte;
                        } else if (scanline_filter_byte == 4) {
                            // The Paeth predictor
                            // Looks left, above, and above and left.
                            // Like the average filter to start with
                            
                            // Need to be able to apply these in the forward direction for encoding too.
                            
                            if (color_type == 2) {
                                if (bit_depth == 8) {
                                
                                //console.log('DECODE ct 2 bd 8');
                                
                                // go through the values of the scanline, looking at the pixels.
                                    var res = new Buffer(scanline_length);
                                    res.writeUInt8(0, 0);
                                    var last_defiltered_px = [0, 0, 0];
                                    
                                    //var num_bytes_per_pixel = 3;
                                    
                                    // need to look at the scanline above.
                                    var uf_sb_above = this.get_unfiltered_scanline_buffer(y - 1);
                                    
                                    
                                    for (var x = 0; x < w; x++) {
                                        // extract rgb values...
                                        //  3 bytes
                                        r = scanlines_buffer.readUInt8(scanline_start + 1 + x * 3);
                                        g = scanlines_buffer.readUInt8(scanline_start + 2 + x * 3);
                                        b = scanlines_buffer.readUInt8(scanline_start + 3 + x * 3);
                                        //var a = scanlines_buffer.readUInt8(scanline_start + 4 + x * 4);
                                        
                                        //var px = [r, g, b, a];
                                        var px = [r, g, b];
                                        //console.log('px ' + stringify(px));
                                        
                                        // then do the unfiltering.
                                        //var unfiltered
                                        
                                        // pixel value above, pixel value to left. Take avg of them.
                                        
                                        //var pixel_above = [0, 0, 0];
                                        var r_above = 0;
                                        var g_above = 0;
                                        var b_above = 0;
                                        if (scanline_num > 0) {
                                            // read pixel from unfiltered scanline above
                                            //pixel_above = uf_sb_above.readUInt8(c);
                                            
                                            r_above = uf_sb_above.readUInt8(x * 3 + 1);
                                            g_above = uf_sb_above.readUInt8(x * 3 + 2);
                                            b_above = uf_sb_above.readUInt8(x * 3 + 3);
                                        }
                                        
                                        //var pixel_above_left = [0, 0, 0];
                                        var r_above_left = 0;
                                        var g_above_left = 0;
                                        var b_above_left = 0;
                                        
                                        if (scanline_num > 0 && x > 0) {
                                            r_above_left = uf_sb_above.readUInt8(x * 3 - 2);
                                            g_above_left = uf_sb_above.readUInt8(x * 3 - 1);
                                            b_above_left = uf_sb_above.readUInt8(x * 3);
                                        }
                                        
                                        var p_r = paeth_predictor(last_defiltered_px[0], r_above, r_above_left);
                                        var p_g = paeth_predictor(last_defiltered_px[1], g_above, g_above_left);
                                        var p_b = paeth_predictor(last_defiltered_px[2], b_above, b_above_left);
                                        
                                        defiltered_r = r + p_r;
                                        defiltered_g = g + p_g;
                                        defiltered_b = b + p_b;
                                        
                                        /*
                                        
                                        var defiltered_r = r + last_defiltered_px[0];
                                        var defiltered_g = g + last_defiltered_px[1];
                                        var defiltered_b = b + last_defiltered_px[2];
                                        var defiltered_a = a + last_defiltered_px[3];
                                        */
                                        if (defiltered_r > 255) defiltered_r = defiltered_r - 256;
                                        if (defiltered_g > 255) defiltered_g = defiltered_g - 256;
                                        if (defiltered_b > 255) defiltered_b = defiltered_b - 256;
                                        //if (defiltered_a > 255) defiltered_a = defiltered_r - 256;
                                        
                                        var defiltered_px = [defiltered_r, defiltered_g, defiltered_b];
                                        
                                        //console.log('defiltered_px ' + stringify(defiltered_px));
                                        
                                        res.writeUInt8(defiltered_r, x * 3 + 1);
                                        res.writeUInt8(defiltered_g, x * 3 + 2);
                                        res.writeUInt8(defiltered_b, x * 3 + 3);
                                        r//es.writeUInt8(defiltered_a, x * 3 + 4);
                                        
                                        last_defiltered_px = defiltered_px;
                                    }
                                    return res;
                                    
                                } else {
                                    throw 'Unsupported bit_depth ' + bit_depth;
                                }
                                    
                                
                            } else if (color_type == 6) {
                                if (bit_depth == 8) {
                                    // decode paeth rgba.
                                    
                                    var res = new Buffer(scanline_length);
                                    res.writeUInt8(0, 0);
                                    var last_defiltered_px = [0, 0, 0];
                                    
                                    //var num_bytes_per_pixel = 3;
                                    
                                    // need to look at the scanline above.
                                    var uf_sb_above = this.get_unfiltered_scanline_buffer(y - 1);
                                    
                                    for (var x = 0; x < w; x++) {
                                        // extract rgb values...
                                        //  3 bytes
                                        r = scanlines_buffer.readUInt8(scanline_start + 1 + x * 4);
                                        g = scanlines_buffer.readUInt8(scanline_start + 2 + x * 4);
                                        b = scanlines_buffer.readUInt8(scanline_start + 3 + x * 4);
                                        a = scanlines_buffer.readUInt8(scanline_start + 4 + x * 4);
                                        
                                        var px = [r, g, b, a];
                                        //var px = [r, g, b];
                                        //console.log('px ' + stringify(px));
                                        
                                        // then do the unfiltering.
                                        //var unfiltered
                                        
                                        // pixel value above, pixel value to left. Take avg of them.
                                        
                                        //var pixel_above = [0, 0, 0];
                                        var r_above = 0;
                                        var g_above = 0;
                                        var b_above = 0;
                                        var a_above = 0;
                                        if (scanline_num > 0) {
                                            // read pixel from unfiltered scanline above
                                            //pixel_above = uf_sb_above.readUInt8(c);
                                            
                                            r_above = uf_sb_above.readUInt8(x * 4 + 1);
                                            g_above = uf_sb_above.readUInt8(x * 4 + 2);
                                            b_above = uf_sb_above.readUInt8(x * 4 + 3);
                                            a_above = uf_sb_above.readUInt8(x * 4 + 4);
                                        }
                                        
                                        //var pixel_above_left = [0, 0, 0];
                                        var r_above_left = 0;
                                        var g_above_left = 0;
                                        var b_above_left = 0;
                                        var a_above_left = 0;
                                        
                                        if (scanline_num > 0 && x > 0) {
                                            r_above_left = uf_sb_above.readUInt8(x * 4 - 3);
                                            g_above_left = uf_sb_above.readUInt8(x * 4 - 2);
                                            b_above_left = uf_sb_above.readUInt8(x * 4 - 1);
                                            a_above_left = uf_sb_above.readUInt8(x * 4);
                                        }
                                        
                                        var p_r = paeth_predictor(last_defiltered_px[0], r_above, r_above_left);
                                        var p_g = paeth_predictor(last_defiltered_px[1], g_above, g_above_left);
                                        var p_b = paeth_predictor(last_defiltered_px[2], b_above, b_above_left);
                                        var p_a = paeth_predictor(last_defiltered_px[3], a_above, a_above_left);
                                        
                                        defiltered_r = r + p_r;
                                        defiltered_g = g + p_g;
                                        defiltered_b = b + p_b;
                                        defiltered_a = a + p_a;
                                        
                                        /*
                                        
                                        var defiltered_r = r + last_defiltered_px[0];
                                        var defiltered_g = g + last_defiltered_px[1];
                                        var defiltered_b = b + last_defiltered_px[2];
                                        var defiltered_a = a + last_defiltered_px[3];
                                        */
                                        if (defiltered_r > 255) defiltered_r = defiltered_r - 256;
                                        if (defiltered_g > 255) defiltered_g = defiltered_g - 256;
                                        if (defiltered_b > 255) defiltered_b = defiltered_b - 256;
                                        if (defiltered_a > 255) defiltered_a = defiltered_a - 256;
                                        
                                        var defiltered_px = [defiltered_r, defiltered_g, defiltered_b, defiltered_a];
                                        
                                        //console.log('defiltered_px ' + stringify(defiltered_px));
                                        
                                        res.writeUInt8(defiltered_r, x * 4 + 1);
                                        res.writeUInt8(defiltered_g, x * 4 + 2);
                                        res.writeUInt8(defiltered_b, x * 4 + 3);
                                        res.writeUInt8(defiltered_a, x * 4 + 4);
                                        
                                        last_defiltered_px = defiltered_px;
                                    }
                                    return res;
                                    //throw 'currently unsupported';
                                } else {
                                    throw 'unsupported bit depth with scanline filter';
                                }
                            } else {
                                throw ('unsupported color_type ' + color_type + ' with scanline_filter ' + scanline_filter_byte);
                            }
                            throw 'unsupported scanline filter ' + scanline_filter_byte;   
                        }
                    }
                    return res_buffer;   
                }    
            },
            
            'get_map_scanline_filters': function() {
                var h = this.size[1], scanline_length = this.scanline_length, scanlines_buffer = this.scanlines_buffer;
                var res = {};
                for (var c = 0; c < h; c++) {
                    var scanline_start = c * scanline_length;
                    var scanline_filter_byte = scanlines_buffer.readUInt8(scanline_start);
                    //res.push[scanline_filter_byte];
                    res[c] = scanline_filter_byte;
                }
                return res;
            },
            
            // iterate pixels
            //  could enable changes to pixels
            //  will be used to get pixels into another image.
            
            
            // 'change_bit_depth'?
            
            // 'change_encoding'?
            
            // 'set_encoding'
            
            'iterate_row': function(y, pixel_callback) {
                var uf_slb = this.get_unfiltered_scanline_buffer(y);
                // then depending on bit rate, color depth... but at least we have isolated the unfiltered scanline row with this.
                //  will use this to keep the low level structure and provide a high level interface.
                
                var scanline_length = this.scanline_length, bit_depth = this.bit_depth, color_type = this.color_type;
                var w = this.size[0];
                
                // Will need other iteration loops for different color depths.
                
                // different loops for different color modes / bit depths.
                var r, g, b, px;
                
                if (this.color_type == 2) {
                    // rgb
                    
                    if (bit_depth == 8) {
                        // 24 bpp
                        
                        
                        for (var x = 0; x < w; x++) {
                            r = uf_slb.readUInt8(x * 3 + 1);
                            g = uf_slb.readUInt8(x * 3 + 2);
                            b = uf_slb.readUInt8(x * 3 + 3);
                            px = [r, g, b];
                            pixel_callback(x, y, px);
                        }
                        // read the pixel values.
                    
                    
                    
                    } else {
                        throw 'Unsupported bit_depth ' + bit_depth;
                    }                 
                }
                
                // 3 is indexed color.
                //  will include low bit depths.
                
                if (this.color_type == 6) {
                    // rgb
                    
                    if (bit_depth == 8) {
                        // 24 bpp
                        
                        for (var x = 0; x < w; x++) {
                            r = uf_slb.readUInt8(x * 4 + 1);
                            g = uf_slb.readUInt8(x * 4 + 2);
                            b = uf_slb.readUInt8(x * 4 + 3);
                            a = uf_slb.readUInt8(x * 4 + 4);
                            px = [r, g, b, a];
                            pixel_callback(x, y, px);
                        }
                        // read the pixel values.
                    
                    } else {
                        throw 'Unsupported bit_depth ' + bit_depth;
                    }                 
                }
                
                // other color types, bit depths for iteration accross the row.
                //  will be iterating over an unfiltered row
                
            },
            
            // Need to refilter the rows.
            //  A pixel value may get chganged, or the filter used on a row could change.
            
            'filter_all_scanlines': function() {
                var h = this.size[1];
                for (var y = 0; y < h; y++) {
                    this.filter_scanline(y);
                }
                
            },
            
            // The scanline rows will have the filters built in.
            
            'filter_scanline': function(scanline_num) {
                var scanline_filter_byte = this.get_scanline_filter_byte(scanline_num);
                var scanlines_buffer = this.scanlines_buffer;
                
                var scanline_start = this.scanline_length * scanline_num;
                
                //console.log('filter_scanline ' + scanline_num + ' scanline_filter_byte: ' + scanline_filter_byte);
                
                var filtered_r, filtered_g, filtered_b, filtered_a;
                
                if (scanline_filter_byte == 1) {
                    // it's the 'left' filter.
                    if (this.color_type == 2) {
                        if (this.bit_depth == 8) {
                            var left_unfiltered_px = [0, 0, 0];
                            this.iterate_row(scanline_num, function(x, y, unfiltered_px) {
                                // write the pixel to the scanlines_buffer.
                                //console.log('iterating x, y, unfiltered_px ' + x + ', ' + y + ', ' + unfiltered_px)
                                // calculate the filtered_px or filtered px values.
                                
                                filtered_r = unfiltered_px[0] - left_unfiltered_px[0];
                                filtered_g = unfiltered_px[1] - left_unfiltered_px[1];
                                filtered_b = unfiltered_px[2] - left_unfiltered_px[2];
                                
                                if (filtered_r < 0) filtered_r = filtered_r + 256;
                                if (filtered_g < 0) filtered_g = filtered_g + 256;
                                if (filtered_b < 0) filtered_b = filtered_b + 256;
                                
                                scanlines_buffer.writeUInt8(filtered_r, scanline_start + 1 + x * 3)
                                scanlines_buffer.writeUInt8(filtered_g, scanline_start + 2 + x * 3)
                                scanlines_buffer.writeUInt8(filtered_b, scanline_start + 3 + x * 3)
                                
                                //scanlines_buffer.write
                                left_unfiltered_px = unfiltered_px;
                            });
                        } else {
                            throw 'Unsupported bit depth ' + this.bit_depth;
                        }
                    } else if (this.color_type == 6) {
                        //throw 'stopping';
                        if (this.bit_depth == 8) {
                            var left_unfiltered_px = [0, 0, 0, 0];
                            this.iterate_row(scanline_num, function(x, y, unfiltered_px) {
                                // write the pixel to the scanlines_buffer.
                                //console.log('iterating x, y, unfiltered_px ' + x + ', ' + y + ', ' + unfiltered_px)
                                // calculate the filtered_px or filtered px values.
                                
                                filtered_r = unfiltered_px[0] - left_unfiltered_px[0];
                                filtered_g = unfiltered_px[1] - left_unfiltered_px[1];
                                filtered_b = unfiltered_px[2] - left_unfiltered_px[2];
                                filtered_a = unfiltered_px[3] - left_unfiltered_px[3];
                                
                                if (filtered_r < 0) filtered_r = filtered_r + 256;
                                if (filtered_g < 0) filtered_g = filtered_g + 256;
                                if (filtered_b < 0) filtered_b = filtered_b + 256;
                                if (filtered_a < 0) filtered_a = filtered_a + 256;
                                
                                scanlines_buffer.writeUInt8(filtered_r, scanline_start + 1 + x * 4)
                                scanlines_buffer.writeUInt8(filtered_g, scanline_start + 2 + x * 4)
                                scanlines_buffer.writeUInt8(filtered_b, scanline_start + 3 + x * 4)
                                scanlines_buffer.writeUInt8(filtered_a, scanline_start + 4 + x * 4)
                                
                                //scanlines_buffer.write
                                left_unfiltered_px = unfiltered_px;
                            });
                        } else {
                            throw 'Unsupported bit depth ' + this.bit_depth;
                        }
                    } else {
                        throw 'unsupported color_type';
                    }
                }
                
                if (scanline_filter_byte == 2) {
                    // it's the 'left' filter.
                    if (this.color_type == 2) {
                        if (this.bit_depth == 8) {
                            var left_unfiltered_px = [0, 0, 0];
                            
                            // need the unfiltered scanline above.
                            //  or the unfiltered pixels above?
                            
                            var unfiltered_scanline_above_buffer;
                            
                            if (scanline_num > 0) {
                                unfiltered_scanline_above_buffer = this.get_unfiltered_scanline_buffer(scanline_num - 1);
                            }
                            
                            this.iterate_row(scanline_num, function(x, y, unfiltered_px) {
                                // write the pixel to the scanlines_buffer.
                                console.log('iterating x, y, unfiltered_px ' + x + ', ' + y + ', ' + unfiltered_px)
                                // calculate the filtered_px or filtered px values.
                                
                                var unfiltered_above_px = [0, 0, 0];
                                if (unfiltered_scanline_above_buffer) {
                                    //unfiltered_above_px = 
                                    var ufa_r = unfiltered_scanline_above_buffer.readUInt8(1 + x * 3);
                                    var ufa_g = unfiltered_scanline_above_buffer.readUInt8(2 + x * 3);
                                    var ufa_b = unfiltered_scanline_above_buffer.readUInt8(3 + x * 3);
                                    unfiltered_above_px = [ufa_r, ufa_g, ufa_b];
                                }
                                
                                filtered_r = unfiltered_px[0] - unfiltered_above_px[0];
                                filtered_g = unfiltered_px[1] - unfiltered_above_px[1];
                                filtered_b = unfiltered_px[2] - unfiltered_above_px[2];
                                
                                if (filtered_r < 0) filtered_r = filtered_r + 256;
                                if (filtered_g < 0) filtered_g = filtered_g + 256;
                                if (filtered_b < 0) filtered_b = filtered_b + 256;
                                
                                scanlines_buffer.writeUInt8(filtered_r, scanline_start + 1 + x * 3)
                                scanlines_buffer.writeUInt8(filtered_g, scanline_start + 2 + x * 3)
                                scanlines_buffer.writeUInt8(filtered_b, scanline_start + 3 + x * 3)
                                
                                //scanlines_buffer.write
                                left_unfiltered_px = unfiltered_px;
                            });
                        } else {
                            throw 'Unsupported bit depth ' + this.bit_depth;
                        }
                    }
                }
                
                if (scanline_filter_byte == 3) {
                    // it's the 'average' filter.
                    // Average(x) = Raw(x) - floor((Raw(x-bpp)+Prior(x))/2)
                    
                    if (this.color_type == 2) {
                        if (this.bit_depth == 8) {
                            var left_unfiltered_px = [0, 0, 0];
                            
                            // need the unfiltered scanline above.
                            //  or the unfiltered pixels above?
                            
                            var unfiltered_scanline_above_buffer;
                            
                            if (scanline_num > 0) {
                                unfiltered_scanline_above_buffer = this.get_unfiltered_scanline_buffer(scanline_num - 1);
                            }
                            
                            this.iterate_row(scanline_num, function(x, y, unfiltered_px) {
                                // write the pixel to the scanlines_buffer.
                                //console.log('iterating x, y, unfiltered_px ' + x + ', ' + y + ', ' + unfiltered_px)
                                // calculate the filtered_px or filtered px values.
                                
                                var unfiltered_above_px = [0, 0, 0];
                                if (unfiltered_scanline_above_buffer) {
                                    //unfiltered_above_px = 
                                    var ufa_r = unfiltered_scanline_above_buffer.readUInt8(1 + x * 3);
                                    var ufa_g = unfiltered_scanline_above_buffer.readUInt8(2 + x * 3);
                                    var ufa_b = unfiltered_scanline_above_buffer.readUInt8(3 + x * 3);
                                    unfiltered_above_px = [ufa_r, ufa_g, ufa_b];
                                }
                                
                                filtered_r = unfiltered_px[0] - Math.floor((left_unfiltered_px[0] + unfiltered_above_px[0]) / 2);
                                filtered_g = unfiltered_px[1] - Math.floor((left_unfiltered_px[1] + unfiltered_above_px[1]) / 2);
                                filtered_b = unfiltered_px[2] - Math.floor((left_unfiltered_px[2] + unfiltered_above_px[2]) / 2);
                                
                                if (filtered_r < 0) filtered_r = filtered_r + 256;
                                if (filtered_g < 0) filtered_g = filtered_g + 256;
                                if (filtered_b < 0) filtered_b = filtered_b + 256;
                                
                                scanlines_buffer.writeUInt8(filtered_r, scanline_start + 1 + x * 3)
                                scanlines_buffer.writeUInt8(filtered_g, scanline_start + 2 + x * 3)
                                scanlines_buffer.writeUInt8(filtered_b, scanline_start + 3 + x * 3)
                                
                                //scanlines_buffer.write
                                left_unfiltered_px = unfiltered_px;
                            });
                        } else {
                            throw 'Unsupported bit depth ' + this.bit_depth;
                        }
                    }
                }
                
                if (scanline_filter_byte == 4) {
                    // it's the 'paeth' filter.
                    // Average(x) = Raw(x) - floor((Raw(x-bpp)+Prior(x))/2)
                    
                    if (this.color_type == 2) {
                        if (this.bit_depth == 8) {
                            var left_unfiltered_px = [0, 0, 0];
                            
                            // need the unfiltered scanline above.
                            //  or the unfiltered pixels above?
                            
                            var unfiltered_scanline_above_buffer;
                            
                            if (scanline_num > 0) {
                                unfiltered_scanline_above_buffer = this.get_unfiltered_scanline_buffer(scanline_num - 1);
                            }
                            
                            
                            this.iterate_row(scanline_num, function(x, y, unfiltered_px) {
                                // write the pixel to the scanlines_buffer.
                                console.log('iterating x, y, unfiltered_px ' + x + ', ' + y + ', ' + unfiltered_px)
                                // calculate the filtered_px or filtered px values.
                                
                                var unfiltered_above_px = [0, 0, 0];
                                var unfiltered_above_left_px = [0, 0, 0];
                                if (unfiltered_scanline_above_buffer) {
                                    //unfiltered_above_px = 
                                    var ufa_r = unfiltered_scanline_above_buffer.readUInt8(1 + x * 3);
                                    var ufa_g = unfiltered_scanline_above_buffer.readUInt8(2 + x * 3);
                                    var ufa_b = unfiltered_scanline_above_buffer.readUInt8(3 + x * 3);
                                    unfiltered_above_px = [ufa_r, ufa_g, ufa_b];
                                    
                                    if (x > 0) {
                                        var ufal_r = unfiltered_scanline_above_buffer.readUInt8(-2 + x * 3);
                                        var ufal_g = unfiltered_scanline_above_buffer.readUInt8(-1 + x * 3);
                                        var ufal_b = unfiltered_scanline_above_buffer.readUInt8(x * 3);
                                        unfiltered_above_left_px = [ufal_r, ufal_g, ufal_b];
                                    }
                                    
                                }
                                
                                // then use Paeth.
                                // Paeth(x) = Raw(x) - PaethPredictor(Raw(x-bpp), Prior(x), Prior(x-bpp))
                                
                                var p_r = paeth_predictor(left_unfiltered_px[0], unfiltered_above_px[0], unfiltered_above_left_px[0]);
                                var p_g = paeth_predictor(left_unfiltered_px[1], unfiltered_above_px[1], unfiltered_above_left_px[1]);
                                var p_b = paeth_predictor(left_unfiltered_px[2], unfiltered_above_px[2], unfiltered_above_left_px[2]);
                                
                                filtered_r = unfiltered_px[0] - p_r;
                                filtered_g = unfiltered_px[1] - p_g;
                                filtered_b = unfiltered_px[2] - p_b;
                                
                                if (filtered_r < 0) filtered_r = filtered_r + 256;
                                if (filtered_g < 0) filtered_g = filtered_g + 256;
                                if (filtered_b < 0) filtered_b = filtered_b + 256;
                                
                                scanlines_buffer.writeUInt8(filtered_r, scanline_start + 1 + x * 3)
                                scanlines_buffer.writeUInt8(filtered_g, scanline_start + 2 + x * 3)
                                scanlines_buffer.writeUInt8(filtered_b, scanline_start + 3 + x * 3)
                                
                                //scanlines_buffer.write
                                left_unfiltered_px = unfiltered_px;
                            });
                        } else {
                            throw 'Unsupported bit depth ' + this.bit_depth;
                        }
                    }
                }
            },
            
            // want to be able to change it to a higher bit depth.
            //  could change to argb, then copy the scanlines directly... but would need to keep the same filtering?
            //  maybe best to go via the pixels.
            
            // // change to most appropriate filter for compression... would use a means of choosing it line-by-line even.
            //  could have option for highest compression using a GA and lots of time.
            //  as well as using the established filter method selection heuristic(s).
            
            'iterate_pixels': function(pixel_callback) {
                var width = this.size[0];
                var height = this.size[1];
                
                // iterate each row.
                
                for (var y = 0; y < height; y++) {
                    this.iterate_row(y, pixel_callback);
                }
                
            },
            
            // This will be refined.
            '_iterate_pixels': function(pixel_callback) {
                //console.log('* calling iterate_pixels');
                //console.log('');
            
                // will read through the scanlines_buffer.
                //  chunks have already been handled / copied into this scanlines buffer.
                
                // depends on the color mode - iterates through the png using the png's
                //  color settings, making the data easily usable, but still in terms of
                //  indexed color etc (though may return actual pixel values too).
                
                // pixel_callback(x, y, color)
                //  color can be an argb array, or rgb array
                //  or an integer
                
                var width = this.size[0];
                var height = this.size[1];
                
                var color_type = this.color_type;
                var bit_depth = this.bit_depth;
                
                //console.log('color_type ' + color_type);
                //console.log('bit_depth ' + bit_depth);
                
                // go through each of the scanlines...
                
                // then different logic for the image data in each of the scanline depending on the bit depth.
                
                var scanline_length = this.scanline_length;
                //console.log('scanline_length ' + scanline_length);
                
                var scanlines_buffer = this.scanlines_buffer;
                
                // go through each of the scanlines.
                
                var scanline_num = 0;
                
                // and know the x and y coords.
                var that = this;
                
                var above_defiltered_scanline;
                
                var arr_line_pixel_colors = [];
                // the previous defiltered byte value...
                
                // we can calculate the positions of the items in the previous scanline without too much difficulty.
                
                var read_scanline = function() {
                    arr_line_pixel_colors[scanline_num] = [];
                    var scanline_start = scanline_num * scanline_length;
                    var scanline_end = scanline_start + scanline_length;
                    
                    var scanline_data_start = scanline_start + 1;
                    
                    // iterate through each of the pixels there...
                    var scanline_filter_byte = scanlines_buffer.readUInt8(scanline_start);
                    //console.log('scanline_start ' + scanline_start);
                    //console.log('scanline_filter_byte ' + scanline_filter_byte);
                    
                    // no need to copy the scanline into a buffer.
                    //  go through it, getting the pixels.
                    
                    //console.log('*** color_type ' + color_type);
                    
                    // Want to be able to save with this filter... other filters too
                    //  Some filters could effect lines further down by changing a line, because the lines further down
                    //  refer to a line above.
                    
                    if (color_type == 2) {
                        // rgb, no alpha channel
                        if (bit_depth == 8) {
                            console.log('scanline_filter_byte ' + scanline_filter_byte);
                            
                            // need to be able to read the values for these rows which use a filter.
                            
                            if (scanline_filter_byte == 0) {
                                // each pixel is made up of 4 bytes from the scanline.
                                // will extract them.
                                var x = 0;
                                //console.log('scanline_data_start ' + scanline_data_start);
                                //console.log('scanline_length ' + scanline_length);
                                
                                //console.log('scanline_data_start ' + scanline_data_start);
                                
                                for (var c = scanline_data_start; c < scanline_end; c = c + 3) {
                                    // get the pixel values.
                                    
                                    // read uint.
                                    var r = scanlines_buffer.readUInt8(c);
                                    var g = scanlines_buffer.readUInt8(c + 1);
                                    var b = scanlines_buffer.readUInt8(c + 2);
                                    //var a = scanlines_buffer.readUInt8(c + 3);
                                    
                                    //console.log('read a ' + a);
                                    var col = [r, g, b];
                                    //var col = scanlines_buffer.readUInt8(c);
                                    
                                    console.log('col ' + stringify(col));
                                    
                                    pixel_callback(x, scanline_num, col);
                                    arr_line_pixel_colors[scanline_num].push(col);
                                    
                                    x++;
                                    
                                }
                            } else if (scanline_filter_byte == 1) {
                                //var raw_left_col, filtered_left_col;
                                //var defiltered_left_col;
                                
                                // will refer to the previous scanline.
                                
                                var x = 0;
                                for (var c = scanline_data_start; c < scanline_end; c = c + 3) {
                                    // 8 bit per channel
                                    
                                    // But doing this pixel by pixel... need to be careful about how this
                                    //  is done.
                                    
                                    // rgb - 24 bits per pixel. no alpha channel.
                                    
                                    // 
                                    
                                    var r = scanlines_buffer.readUInt8(c);
                                    var g = scanlines_buffer.readUInt8(c + 1);
                                    var b = scanlines_buffer.readUInt8(c + 2);
                                   
                                    //var raw_pixel_data = scanlines_buffer.readUInt8(c);
                                    
                                    // Note this computation is done for each byte, regardless of bit depth
                                    
                                    //  So it's based on the previous byte.
                                    
                                    var filtered_col = [r, g, b];
                                    console.log('filtered_col ' + stringify(filtered_col));
                                    
                                    //console.log('raw_pixel_data ' + raw_pixel_data);
                                    //console.log('pixel_data (indexed color) ' + pixel_data);
                                    
                                    // then get the color from the index...?
                                    // need to refer to the pixel to the left.
                                    
                                    // Gets applied on each channel.
                                    
                                    // it's if the byte number is greater than 0.
                                    
                                    var defiltered_col;
                                    if (x > 0) {
                                        // getting it from above... need to read the pixel above.
                                        
                                        //var above_r = scanlines_buffer.readUInt8(c - scanline_length);
                                        //var above_g = scanlines_buffer.readUInt8(c + 1 - scanline_length);
                                        //var above_b = scanlines_buffer.readUInt8(c + 2 - scanline_length);
                                        
                                        var prev_defiltered_pixel = arr_line_pixel_colors[scanline_num][x - 1];
                                        
                                        var defiltered_r = r + prev_defiltered_pixel[0];
                                        var defiltered_g = g + prev_defiltered_pixel[1];
                                        var defiltered_b = b + prev_defiltered_pixel[2];
                                        
                                        
                                        
                                        //defiltered_col = [filtered_col[0] + above_pixel[0], filtered_col[1] + above_pixel[1], filtered_col[2] + above_pixel[2]];
                                        defiltered_col = [defiltered_r, defiltered_g, defiltered_b];
                                        if (defiltered_col[0] > 255) defiltered_col[0] = defiltered_col[0] - 256;
                                        if (defiltered_col[1] > 255) defiltered_col[1] = defiltered_col[1] - 256;
                                        if (defiltered_col[2] > 255) defiltered_col[2] = defiltered_col[2] - 256;
                                        
                                        
                                        
                                        //filtered_pixel_data = raw_pixel_data + raw_left;
                                    } else {
                                        //filtered_pixel_data = raw_col;
                                        defiltered_col = filtered_col;
                                        //filtered_col = [raw_col[0], raw_col[1], raw_col[2]];
                                        
                                    }
                                    
                                    pixel_callback.call(that, x, scanline_num, defiltered_col);
                                    arr_line_pixel_colors[scanline_num].push(defiltered_col);
                                    //defiltered_left_col = defiltered_col;
                                    //raw_left_col = raw_col;
                                    
                                    
                                    x++;
                                } 
                            } else if (scanline_filter_byte == 2) {
                                // the 'up' filter.
                                
                                // will need to remember the defiltered values for the row above.
                                //  that happens as part of it now...
                                
                                var x = 0;
                                for (var c = scanline_data_start; c < scanline_end; c = c + 3) {
                                    
                                    var r = scanlines_buffer.readUInt8(c);
                                    var g = scanlines_buffer.readUInt8(c + 1);
                                    var b = scanlines_buffer.readUInt8(c + 2);
                                   
                                    //var raw_pixel_data = scanlines_buffer.readUInt8(c);
                                    
                                    // Note this computation is done for each byte, regardless of bit depth
                                    
                                    //  So it's based on the previous byte.
                                    
                                    var filtered_col = [r, g, b];
                                    //console.log('filtered_col ' + filtered_col);
                                    
                                    //console.log('raw_pixel_data ' + raw_pixel_data);
                                    //console.log('pixel_data (indexed color) ' + pixel_data);
                                    
                                    // then get the color from the index...?
                                    // need to refer to the pixel to the left.
                                    
                                    // Gets applied on each channel.
                                    
                                    // it's if the byte number is greater than 0.
                                    
                                    var defiltered_col;
                                    if (scanline_num > 0) {
                                        // need to look above
                                        
                                        // get the values above...
                                        
                                        var pixel_above = arr_line_pixel_colors[scanline_num - 1][x];
                                        //console.log('pixel_above ' + pixel_above);
                                        defiltered_col = [filtered_col[0] + pixel_above[0], filtered_col[1] + pixel_above[1], filtered_col[2] + pixel_above[2]];
                                        if (defiltered_col[0] > 255) defiltered_col[0] = defiltered_col[0] - 256;
                                        if (defiltered_col[1] > 255) defiltered_col[1] = defiltered_col[1] - 256;
                                        if (defiltered_col[2] > 255) defiltered_col[2] = defiltered_col[2] - 256;
                                        
                                        
                                        
                                        //filtered_pixel_data = raw_pixel_data + raw_left;
                                    } else {
                                        //filtered_pixel_data = raw_col;
                                        defiltered_col = filtered_col;
                                        //filtered_col = [raw_col[0], raw_col[1], raw_col[2]];
                                        
                                    }
                                    
                                    pixel_callback.call(that, x, scanline_num, defiltered_col);
                                    arr_line_pixel_colors[scanline_num].push(defiltered_col);
                                    //defiltered_left_col = defiltered_col;
                                    //raw_left_col = raw_col;
                                    
                                    
                                    x++;
                                } 
                                
                                
                                //above_defiltered_scanline = 
                            } else if (scanline_filter_byte == 3) {
                                // the 'up' filter.
                                
                                // Average(x) + floor((Raw(x-bpp)+Prior(x))/2)
                                
                                // get the above byte value, get the left byte value.
                                //  done by getting (unfiltered) pixel values.
                                
                                // if either no value above, or left, we use 0 as the values.
                                
                                
                                
                                var x = 0;
                                for (var c = scanline_data_start; c < scanline_end; c = c + 3) {
                                    
                                    var r = scanlines_buffer.readUInt8(c);
                                    var g = scanlines_buffer.readUInt8(c + 1);
                                    var b = scanlines_buffer.readUInt8(c + 2);
                                   
                                    var filtered_col = [r, g, b];
                                    //console.log('filtered_col ' + filtered_col);
                                    
                                    //var defiltered_col;
                                    
                                    var above_pixel = [0, 0, 0];
                                    //var left_pixel = [0, 0, 0];
                                    var left_pixel = [0, 0, 0];
                                    
                                    if (scanline_num > 0) {
                                        // need to look above
                                        
                                        //filtered_pixel_data = raw_pixel_data + raw_left;
                                        above_pixel = arr_line_pixel_colors[scanline_num - 1][x];
                                        
                                        
                                    }
                                    if (x > 0) {
                                        //left_pixel = arr_line_pixel_colors[scanline_num][x - 1]
                                        // but we refer to the left byte.
                                        
                                        // look previously on the scanline.
                                        //var prev_byte = 
                                        //left_byte =
                                        
                                        // but do the left byte for each of them...
                                        left_pixel = arr_line_pixel_colors[scanline_num][x - 1];
                                        
                                        
                                    }
                                    
                                    // then work out the various defiltered values.
                                    
                                    // make reference to the above and left pixels.
                                    
                                    // then need to do averaging.
                                    
                                    var avg_r = Math.floor((above_pixel[0] + left_pixel[0]) / 2)                     
                                    var avg_g = Math.floor((above_pixel[1] + left_pixel[1]) / 2)                     
                                    var avg_b = Math.floor((above_pixel[2] + left_pixel[2]) / 2)                     
                                    
                                    var defiltered_r = r + avg_r;
                                    var defiltered_g = g + avg_g;
                                    var defiltered_b = b + avg_b;
                                    
                                    if (defiltered_r > 255) defiltered_r = defiltered_r - 256;
                                    if (defiltered_g > 255) defiltered_g = defiltered_g - 256;
                                    if (defiltered_b > 255) defiltered_b = defiltered_b - 256;
                                    
                                    var defiltered_col = [defiltered_r, defiltered_g, defiltered_b];
                                    
                                    pixel_callback.call(that, x, scanline_num, defiltered_col);
                                    arr_line_pixel_colors[scanline_num].push(defiltered_col);
                                    //defiltered_left_col = defiltered_col;
                                    //raw_left_col = raw_col;
                                    
                                    x++;
                                }
                                
                                
                            } else if (scanline_filter_byte == 4) {
                                // Paeth predictor is type 4.
                                // paeth_predictor
                                
                                // need 3 pixel values - left, above, above left
                                
                                var x = 0;
                                for (var c = scanline_data_start; c < scanline_end; c = c + 3) {
                                    
                                    var r = scanlines_buffer.readUInt8(c);
                                    var g = scanlines_buffer.readUInt8(c + 1);
                                    var b = scanlines_buffer.readUInt8(c + 2);
                                   
                                    var filtered_col = [r, g, b];
                                    console.log('filtered_col ' + filtered_col);
                                    
                                    //var defiltered_col;
                                    
                                    var above_pixel = [0, 0, 0];
                                    //var left_pixel = [0, 0, 0];
                                    var left_pixel = [0, 0, 0];
                                    var above_left_pixel = [0, 0, 0];
                                    
                                    if (scanline_num > 0) {
                                        // need to look above
                                        
                                        //filtered_pixel_data = raw_pixel_data + raw_left;
                                        above_pixel = arr_line_pixel_colors[scanline_num - 1][x];
                                        
                                        
                                    }
                                    if (x > 0) {
                                        //left_pixel = arr_line_pixel_colors[scanline_num][x - 1]
                                        // but we refer to the left byte.
                                        
                                        // look previously on the scanline.
                                        //var prev_byte = 
                                        //left_byte =
                                        
                                        // but do the left byte for each of them...
                                        left_pixel = arr_line_pixel_colors[scanline_num][x - 1];
                                        
                                        
                                    }
                                    if (scanline_num > 0 && x > 0) {
                                        above_left_pixel = arr_line_pixel_colors[scanline_num - 1][x - 1];
                                    }
                                    
                                    // then work out the various defiltered values.
                                    
                                    // make reference to the above and left pixels.
                                    
                                    // then need to do averaging.
                                    
                                    //var avg_r = Math.floor((above_pixel[0] + left_pixel[0]) / 2)                     
                                    //var avg_g = Math.floor((above_pixel[1] + left_pixel[1]) / 2)                     
                                    //var avg_b = Math.floor((above_pixel[2] + left_pixel[2]) / 2)                     
                                    
                                    // reverse: Paeth(x) + PaethPredictor(Raw(x-bpp), Prior(x), Prior(x-bpp))
                                    
                                    var p_r = paeth_predictor(left_pixel[0], above_pixel[0], above_left_pixel[0]);
                                    var p_g = paeth_predictor(left_pixel[1], above_pixel[1], above_left_pixel[1]);
                                    var p_b = paeth_predictor(left_pixel[2], above_pixel[2], above_left_pixel[2]);
                                    
                                    
                                    var defiltered_r = r + p_r;
                                    var defiltered_g = g + p_g;
                                    var defiltered_b = b + p_b;
                                    
                                    if (defiltered_r > 255) defiltered_r = defiltered_r - 256;
                                    if (defiltered_g > 255) defiltered_g = defiltered_g - 256;
                                    if (defiltered_b > 255) defiltered_b = defiltered_b - 256;
                                    
                                    var defiltered_col = [defiltered_r, defiltered_g, defiltered_b];
                                    
                                    pixel_callback.call(that, x, scanline_num, defiltered_col);
                                    arr_line_pixel_colors[scanline_num].push(defiltered_col);
                                    defiltered_left_col = defiltered_col;
                                    //raw_left_col = raw_col;
                                    
                                    x++;
                                } 
                            } else {
                                // reading filter type 3...
                                
                                // no more normally defined filters.
                                throw 'Unsupported filter ' + scanline_filter_byte;
                            }
                        }
                    }
                    
                    // depending on the number of bpp...
                    if (color_type == 6) {
                        if (bit_depth == 8) {
                            
                            if (scanline_filter_byte == 0) {
                                // each pixel is made up of 4 bytes from the scanline.
                                // will extract them.
                                var x = 0;
                                //console.log('scanline_data_start ' + scanline_data_start);
                                //console.log('scanline_length ' + scanline_length);
                                
                                //console.log('scanline_data_start ' + scanline_data_start);
                                
                                for (var c = scanline_data_start; c < scanline_end; c = c + 4) {
                                    // get the pixel values.
                                    
                                    // read uint.
                                    var r = scanlines_buffer.readUInt8(c);
                                    var g = scanlines_buffer.readUInt8(c + 1);
                                    var b = scanlines_buffer.readUInt8(c + 2);
                                    var a = scanlines_buffer.readUInt8(c + 3);
                                    
                                    //console.log('read a ' + a);
                                    
                                    var col = [r, g, b, a];
                                    
                                    console.log('col ' + stringify(col));
                                    
                                    pixel_callback(x, scanline_num, col);
                                    x++;
                                    
                                }
                            } else {
                                throw 'Unsupported filter ' + scanline_filter_byte;
                            }
                        }
                        // other bit depths as well.
                    }
                    
                    
                    if (color_type == 3) {
                        // look at the bit depth.
                        //  if it's less than 8, we need to deconstruct the various pixels into their components, and save those indexed values.
                        
                        // divide each byte value up into subpixels with lower bit depth.
                        
                        //console.log('color type 3, bit_depth ' + bit_depth);
                        
                        if (bit_depth == 1) {
                            
                            if (scanline_filter_byte == 0) {
                                
                                var n = 0;
                                var x = 0;
                               
                                for (var c = scanline_data_start; c < scanline_end; c++) {
                                    
                                    var pixels_data = scanlines_buffer.readUInt8(c);
                                    //console.log('pixels_data ' + pixels_data);
                                    
                                    // don't read past the width.
                                    
                                    for (var c2 = 7; c2 >= 0; c2--) {
                                        //console.log('multi_px_value & (1 << c2) ' + multi_px_value & (1 << c2));
                                        var p = pixels_data & (1 << c2);
                                        var p2 = p > 0 ? 1 : 0;
                                        
                                        if (x < width) {
                                            pixel_callback.call(that, x, scanline_num, p2);
                                        }
                                        
                                        x++;
                                    }
                                    // x = n * 8 + c2
                                    n++;
                                }
                            } else {
                                // filter 1 Sub
                                
                                //  pxData[pxPos + i] = idx != 0xff ? rawData[rawPos + idx] + left : 0xff;
                                
                                // go through the line, but will be referring back to the previous pixel, or 0xff
                                
                                /*
                                
                                for (var c = scanline_data_start; c < scanline_end; c++) {
                                    
                                    var pixels_data = scanlines_buffer.readUInt8(c);
                                    //console.log('pixels_data ' + pixels_data);
                                    
                                    // don't read past the width.
                                    
                                    for (var c2 = 7; c2 >= 0; c2--) {
                                        //console.log('multi_px_value & (1 << c2) ' + multi_px_value & (1 << c2));
                                        var p = pixels_data & (1 << c2);
                                        var p2 = p > 0 ? 1 : 0;
                                        
                                        if (x < width) {
                                            pixel_callback.call(that, x, scanline_num, p2);
                                        }
                                        
                                        
                                        x++;
                                    }
                                    // x = n * 8 + c2
                                    n++;
                                }
                                */
                                
                                
                            
                                throw 'Unsupported filter ' + scanline_filter_byte;
                            }
                            //console.log('n ' + n);
                        }
                        
                        // bit depth 2 - 4 colors
                        // bit depth 4 - 16 colors
                        // bit depth 8 - 256 colors
                        
                        if (bit_depth == 8) {
                            if (scanline_filter_byte == 0) {
                                var x = 0;
                                //console.log('scanline_data_start ' + scanline_data_start);
                                
                                for (var c = scanline_data_start; c < scanline_end; c++) {
                                    // 8 bit per pixel
                                    var pixel_data = scanlines_buffer.readUInt8(c);
                                    //console.log('pixel_data (indexed color) ' + pixel_data);
                                    // then get the color from the index...?
                                    
                                    pixel_callback.call(that, x, scanline_num, pixel_data);
                                    
                                    x++;
                                }
                            } else if (scanline_filter_byte == 1) {
                                console.log('scanline filter 1');
                                throw 'stop';
                                
                                /*
                                var raw_left;
                                for (var c = scanline_data_start; c < scanline_end; c++) {
                                    // 8 bit per pixel
                                    var raw_pixel_data = scanlines_buffer.readUInt8(c);
                                    //console.log('pixel_data (indexed color) ' + pixel_data);
                                    
                                    // then get the color from the index...?
                                    // need to refer to the pixel to the left.
                                    var filtered_pixel_data;
                                    if (c > 0) {
                                        
                                        filtered_pixel_data = raw_pixel_data - raw_left;
                                    } else {
                                        filtered_pixel_data = raw_pixel_data;
                                    }
                                    
                                    pixel_callback.call(that, x, scanline_num, filtered_pixel_data);
                                    raw_left = raw_pixel_data;
                                    
                                    
                                    x++;
                                }
                                */
                                
                                
                            } else {
                                throw 'Unsupported filter ' + scanline_filter_byte;
                            }
                        }
                    }
                    
                    scanline_num++;
                    if (scanline_num < height) read_scanline();
                }
                read_scanline();
            },
            
            // convert to different format...
            
            'set_color_parameters': function(color_type, bit_depth) {
                // could take a string such as 'rgba 32'.
                //console.log('set_color_parameters color_type ' + color_type);
                //console.log('bit_depth ' + bit_depth);
                //console.log('');
                // 6	Truecolor & alpha
                //  32 bpp, bit depth is 8 bits per channel.
                
                // color_type 2 (rgb truecolor), bit depth 8
                // no alpha channel.
                
                // with some of them, depends on the current color parameters.
                //  Easier to increase it to higher detail per pixel.
                //   May need to compress when saving it to lower detail to keep image quality.
                
                if (color_type == 6) {
                    if (bit_depth == 8) {
                        // a lot bigger than 1 bpp indexed!
                        
                        var scanline_data_length = 4 * this.size[0];
                        //console.log('scanline_data_length ' + scanline_data_length);
                        
                        var new_scanline_length = scanline_data_length + 1;
                        var new_scanline_buffer_length = new_scanline_length * this.size[1];
                        
                        //console.log('new_scanline_buffer_length ' + new_scanline_buffer_length);
                        
                        var new_scanline_buffer = new Buffer(new_scanline_buffer_length);
                        
                        var new_scanline_buffer_write_pos = 0;
                        
                        var that = this;
                        //console.log('pre iterate_pixels');
                        this.iterate_pixels(function(x, y, color) {
                            // consult the palette...
                            
                            //console.log('found pixel -----------------');
                            
                            // for a new line need to make a new scanline.
                            if (x == 0) {
                                new_scanline_buffer.writeUInt8(0, y * new_scanline_length);
                                
                            }
                            // red, green, blue, alpha
                            
                            // this.color_type
                            var col;
                            //console.log('that.color_type ' + that.color_type);
                            if (that.color_type == 2 || that.color_type == 6) {
                                col = color;
                            }
                            if (that.color_type == 3) {
                                if (that.palette_with_alphas) {
                                    col = that.palette_with_alphas[color];
                                } else if (that.palette) {
                                    col = that.palette[color];
                                }
                            }
                            
                            //console.log('col ' + stringify(col));
                            if (col) {
                                var pixel_pos_in_new_scanline_buffer = (y * new_scanline_length) + 1 + (x * 4);
                                
                                new_scanline_buffer.writeUInt8(col[0], pixel_pos_in_new_scanline_buffer);
                                new_scanline_buffer.writeUInt8(col[1], pixel_pos_in_new_scanline_buffer + 1);
                                new_scanline_buffer.writeUInt8(col[2], pixel_pos_in_new_scanline_buffer + 2);
                                
                                if (col.length == 3) {
                                    new_scanline_buffer.writeUInt8(255, pixel_pos_in_new_scanline_buffer + 3);
                                } else if (col.length == 4) {
                                    new_scanline_buffer.writeUInt8(col[3], pixel_pos_in_new_scanline_buffer + 3);
                                }
                            }
                            
                        });
                    
                        that.bit_depth = bit_depth;
                        that.color_type = color_type;
                        that.scanlines_buffer = new_scanline_buffer;
                        that.palette = null;
                        that.palette_with_alphas = null;
                        that.scanline_length = new_scanline_length;
                        that.scanline_data_length = new_scanline_length - 1;
                        //var new_scanline_buffer = 
                        // iterate the pixels,
                    }
                }
                
            },
            
            'get_signature_buffer': function() {
                
                var png_signature_buffer = new Buffer(8);
                png_signature_buffer.writeUInt8(137, 0);
                png_signature_buffer.writeUInt8(80, 1);
                png_signature_buffer.writeUInt8(78, 2);
                png_signature_buffer.writeUInt8(71, 3);
                png_signature_buffer.writeUInt8(13, 4);
                png_signature_buffer.writeUInt8(10, 5);
                png_signature_buffer.writeUInt8(26, 6);
                png_signature_buffer.writeUInt8(10, 7);
                
                return png_signature_buffer;
            },
            
            'get_buffer_IHDR': function() {
                var that = this;
                var res = new Buffer(25);
                //res.writeUInt32BE(0,
                res.writeUInt32BE(13, 0);
                res.write('IHDR', 4);
                //res.writeUInt32BE(14, 4);
                res.writeUInt32BE(that.size[0], 8);
                res.writeUInt32BE(that.size[1], 12);
                res.writeUInt8(that.bit_depth, 16);
                res.writeUInt8(that.color_type, 17);
                res.writeUInt8(0, 18);
                res.writeUInt8(0, 19);
                res.writeUInt8(0, 20);
                
                // also need to write the crc??
                //  crc based on the data of the chunk.
                
                // from position 8 to the end, 19?
                
                //var buf_for_crc = new Buffer(14);
                //res.copy(buf_for_crc, 0, 7)
                
                //var ihdr_crc = buffer_crc32.unsigned(buf_for_crc);
                //console.log('ihdr_crc ' + ihdr_crc);
                //console.log('topeof ihdr_crc ' + typeof ihdr_crc);
                //res.writeUInt32BE(ihdr_crc, 20);
                
                res.writeInt32BE(CrcStream.crc32(res.slice(4, res.length - 4)), res.length - 4);

                //res.write(ihdr_crc, 20);
                
                return res;
            },
            
            'get_buffer_IDAT': function(callback) {
                this.filter_all_scanlines();
            
                var deflate = zlib.createDeflate({
                        chunkSize: 32 * 1024,
                        level: 9,
                        strategy: 3,
                        windowBits: 15,
                        memLevel: 9
                    });
                //deflate.on('error', this.emit.bind(this, 'error'));
                deflate.on('error', function() {
                    console.log('deflate error');
                });
            
                var buffers = [];
                var nread = 0;
                
                var that = this;
                
                deflate.on('data', function(chunk) {
                    //this.emit('data', this._packIDAT(data));
                    // got deflated data... buffer
                    
                    //console.log('got deflate data, length: ' + chunk.length);
                    buffers.push(chunk);
                    nread = nread + chunk.length;
                });
                
                deflate.on('end', function() {
                    //this.emit('data', this._packIEND());
                    //this.emit('end');
                    //console.log('deflate end');
                    
                    var buffer;
                    //var nread = 0;
                    switch (buffers.length) {
                        case 0: // no data.  return empty buffer
                            buffer = new Buffer(0);
                            break;
                        case 1: // only one chunk of data.  return it.
                            buffer = buffers[0];
                            break;
                        default: // concatenate the chunks of data into a single buffer.
                            buffer = new Buffer(nread);
                            var n = 0;
                            buffers.forEach(function(b) {
                                var l = b.length;
                                b.copy(buffer, n, 0, l);
                                n += l;
                            });
                            break;
                    }
                    
                    //var IHDR_buffer = that.get_buffer_IHDR();
                    // then use the buffer...
                    
                    var IDAT_buffer = new Buffer(buffer.length + 12);
                    //var crc32 = buffer_crc32.unsigned(buffer);
                    IDAT_buffer.writeUInt32BE(buffer.length, 0);
                    IDAT_buffer.write('IDAT', 4);
                    
                    buffer.copy(IDAT_buffer, 8);
                    //IDAT_buffer.writeUInt32BE(crc32, 8 + buffer.length);
                    IDAT_buffer.writeInt32BE(CrcStream.crc32(IDAT_buffer.slice(4, IDAT_buffer.length - 4)), IDAT_buffer.length - 4);
                    //IDAT_buffer.writeInt32BE(CrcStream.crc32(buffer), IDAT_buffer.length - 4);

                    
                    callback(IDAT_buffer);
                });
                
                deflate.end(this.scanlines_buffer);
            },
            
            'get_buffer_IEND': function() {
                var IEND_buffer = new Buffer(12);
                IEND_buffer.writeUInt32BE(0, 0);
                IEND_buffer.write('IEND', 4);
                
                IEND_buffer.writeInt32BE(CrcStream.crc32(IEND_buffer.slice(4, IEND_buffer.length - 4)), IEND_buffer.length - 4);

                return IEND_buffer;
            },
            
            // also may want to save to a buffer?
            //  saving to a stream should probably be fine.
            
            // may want to pipe to a stream?
            
            // get this as an RGB or RGBA buffer.
            
            
            //'save_to_stream': function(output_stream
            
            // a writable stream.
            'save_to_stream': function(stream) {
                // don't think callback is needed because we can detect when the stream ends.
                var that = this;
                var png_signature_buffer = this.get_signature_buffer();
                var IHDR_buffer = this.get_buffer_IHDR();
                console.log('pre get_buffer_IDAT');
                this.get_buffer_IDAT(function(IDAT_buffer) {
                    console.log('cb get_buffer_IDAT');
                    var IEND_buffer = that.get_buffer_IEND();
                    
                    stream.write(png_signature_buffer);
                    
                    stream.write(IHDR_buffer);
                    stream.write(IDAT_buffer);
                    
                    stream.write(IEND_buffer);
                    
                    // want to end the stream too.
                    
                    stream.end();
                    
                    
                    
                    //callback();
                });
                
            },
            
            'save_to_disk': function(dest_path, callback) {
                // saves the compressed scanlines, with all the metadata.
                // this does not change the filter used on scanlines, but we may want to reencode scanlines after having changed
                //  unencoded scanlines.
                
                // This may need to update the scanlines from the unfiltered data.
                
                // Can be broken into a few save functions.
                
                
                // create a write buffer
                //  the various parts will be saved
                var that = this;
                // save_to_stream
                
                var stream = fs.createWriteStream(dest_path, {flags: 'w'});
                
                stream.on('end', function() {
                    callback(null, that);
                });
                
                that.save_to_stream(stream);
                
            },
            
            
            // Want it so that it can load directly from a stream.
            
            
            // want to be able to read a whole stream.
            //  Don't think I'll buffer the whole thing.
            //  Copy from the stream into this object.
            // That code could be used as the basis for outputting to an RGBA or RGB stream too - but it may require
            //  decoding in some cases.
            
            // load_from_stream
            
            // and load_from_disk will wind up using that.
            
            // we can read the inital part, then see how big a buffer to make for the data.
            //  can calculate the scanlines buffer length while reading the idat chunk
            //  and then we don't need to buffer everything as it comes in.
            //  just recieve info from the stream, process each piece, then it's done.
            //   then change load_from_disk so that it uses the load_from_stream code.
            
            // Also want to be able to save to a stream, and have the save_to_disk function use that one.
            
            // this needs to use a callback because of deflate/inflate being async.
            
            'load_from_buffer': function(buffer, callback) {
                // get to read through the whole buffer.
                
                // will load it chunk by chunk.
                
                // buffer.length
                // use a finite state machine to read through the buffer.
                
                // read the first items quickly... set some data.
                //  can read a chunk though.
                
                // will improve to code to use chunk buffers.
                
                var that = this;
                
                var found_IHDR_chunk = function(chunk_buffer) {
                    var chunk_length = chunk_buffer.readUInt32BE(0);
                    //console.log('IHDR chunk_length ' + chunk_length);
                    
                    // extract various values from it.
                    // could set them in an FSM.
                    
                    var img_width = chunk_buffer.readUInt32BE(8);
                    var img_height = chunk_buffer.readUInt32BE(12);
                    
                    //console.log('img_width ' + img_width);
                    //console.log('img_height ' + img_height);
                    
                    bit_depth = chunk_buffer.readUInt8(16);
                    color_type = chunk_buffer.readUInt8(17);
                    var compression_method = chunk_buffer.readUInt8(18);
                    var filter_method = chunk_buffer.readUInt8(19);
                    var interlace_method = chunk_buffer.readUInt8(20);
                    
                    that.size = [img_width, img_height]
                    that.bit_depth = bit_depth;
                    that.color_type = color_type;
                    that.compression_method = compression_method;
                    
                    //console.log('bit_depth ' + bit_depth);
                    //console.log('color_type ' + color_type);
                    //console.log('that.size ' + stringify(that.size));
                    
                    // calculate the size of the image data buffer.
                    //  will hold the indexed pixel data if needed.
                    
                    // calculate the scanline length here.
                    
                    // depends on the bit depth... need to get the right scanline length.
                    
                    var scanline_image_data_length;
                    
                    // and depends on the color mode.
                    
                    if (bit_depth == 1) {
                        scanline_image_data_length = Math.ceil(that.size[0] / 8);
                    }
                    if (bit_depth == 2) {
                        scanline_image_data_length = Math.ceil(that.size[0] / 4);
                    }
                    if (bit_depth == 4) {
                        scanline_image_data_length = Math.ceil(that.size[0] / 2);
                    }
                    if (bit_depth == 8) {
                        if (color_type == 2) {
                            scanline_image_data_length = that.size[0] * 3;
                        } else if (color_type == 6) {
                            scanline_image_data_length = that.size[0] * 4;
                        }
                    }
                    
                    // bit depth 16...
                    //  was not expecting that. greyscale of some kind.
                    
                    
                    //console.log('scanline_image_data_length ' + scanline_image_data_length);
                    
                    // scanline_length depends on the number of bits per pixel.
                    
                    var scanline_length = scanline_image_data_length + 1;
                    
                    //console.log('scanline_length ' + scanline_length);
                    
                    that.scanline_image_data_length = scanline_image_data_length;
                    that.scanline_length = scanline_length;
                    
                    var scanlines_buffer_length = that.scanline_length * that.size[1];
                    that.scanlines_buffer_length = scanlines_buffer_length;
                    
                    var scanlines_buffer = new Buffer(scanlines_buffer_length);
                    that.scanlines_buffer = scanlines_buffer;
                    //console.log('that.scanlines_buffer ' + that.scanlines_buffer);
                    //throw 'stop';
                    that.scanlines_buffer_write_pos = 0;
                    
                }
                
                var found_gAMA_chunk = function(chunk_buffer) {
                    var chunk_length = chunk_buffer.readUInt32BE(0);
                    //console.log('gAMA chunk_length ' + chunk_length);
                    
                    var value = chunk_buffer.readUInt32BE(8);
                    
                    //console.log('value ' + value);
                }
                
                var found_PLTE_chunk = function(chunk_buffer) {
                    var chunk_length = chunk_buffer.readUInt32BE(0);
                    //console.log('PLTE chunk_length ' + chunk_length);
                    
                    // then we get the chunk data... all the colors
                    
                    var num_colors = chunk_length / 3;
                    //console.log('num_colors ' + num_colors);
                    
                    // then parse the individual colors.
                    
                    var c = 0;
                    var color_begin_pos = 8;
                    while (c < num_colors) {
                        // the color is stored as 4 1 byte values.
                        //  but the info about color locations could be parsed out?
                        //  in this situation, we want the colors from the pallet.
                        
                        var color = [chunk_buffer.readUInt8(color_begin_pos), chunk_buffer.readUInt8(color_begin_pos + 1), chunk_buffer.readUInt8(color_begin_pos + 2)];
                        colors.push(color);
                        
                        
                        color_begin_pos = color_begin_pos + 3;
                        
                        c++;
                    }
                    that.palette = colors;
                    
                    //console.log('colors ' + stringify(colors));
                    //console.log('colors.length ' + stringify(colors.length));
                    
                }
                
                var found_tRNS_chunk = function(chunk_buffer) {
                    var chunk_length = chunk_buffer.readUInt32BE(0);
                    //console.log('tRNS chunk_length ' + chunk_length);
                    
                    //var value = chunk_buffer.readUInt32BE(8);
                    
                    //console.log('value ' + value);
                    if (color_type == 3) {
                        // then we read in all the color values.
                        trans = [];
                        for (var c = 8; c < 8 + chunk_length; c++) {
                            var alpha = chunk_buffer.readUInt8(c);
                            //console.log('alpha ' + alpha);
                            trans.push(alpha);
                        }
                        
                        // then create the colors with alpha values.
                        
                        each(colors, function(i, v) {
                            if (is_defined(trans[i])) {
                                var color_with_alpha = [v[0], v[1], v[2], trans[i]];
                                colors_with_alpha.push(color_with_alpha);
                            } else {
                                var color_with_alpha = [v[0], v[1], v[2], 255];
                                colors_with_alpha.push(color_with_alpha);
                            };
                            
                            //var color_with_alpha = [v[0], v[1], v[2], ]
                        });
                        //console.log('colors_with_alpha ' + stringify(colors_with_alpha));
                        
                        that.palette_with_alphas = colors_with_alpha;
                        
                    }
                    
                }
                
                // May go back to the old way... remembering that it's processing asyncronously, and running the callback when its stopped.
                
                var num_processing = 0;
                
                var on_chunk_read_complete = function() {
                    //console.log('
                    //if (num_processing == 0) {
                        callback(null, that);
                    //}
                }
                
                // need to compose together all the IDAT chunks.
                
                var idat_content_buffers = [];
                var deflated_length = 0;
                
                var found_IDAT_chunk = function(chunk_buffer) {
                    //pending_chunk_reads++;
                
                    var chunk_length = chunk_buffer.readUInt32BE(0);
                    console.log('IDAT chunk_length ' + chunk_length);
                    
                    var idx_data_start = 8;
                    var idx_data_end = idx_data_start + chunk_length;
                    
                    //var inflate = zlib.createInflate();
                    
                    // inflate it to a stream or buffer?
                    
                    var buffer_deflated = new Buffer(chunk_length);
                    chunk_buffer.copy(buffer_deflated, 0, idx_data_start, idx_data_end);
                    
                    // inflate is async... need to be careful about this.
                    //  so this parsing happens after the IEND chunk has been read.
                    //  so, likely to have a callback that occurrs when every inflation has been done.
                    
                    // careful about race conditions with inflate too.
                    
                    // want it so that the inflated parts get put back in the proper order.
                    
                    /*
                    
                    num_processing++;
                    zlib.inflate(buffer_deflated, function(err, buffer_inflated) {
                        //console.log('err ' + err);
                        //console.log('res ' + res);
                        if (err) {
                            
                        } else {
                        
                            console.log('buffer_inflated.length ' + buffer_inflated.length);
                            buffer_inflated.copy(that.scanlines_buffer, that.scanlines_buffer_write_pos);     
                            that.scanlines_buffer_write_pos = that.scanlines_buffer_write_pos + buffer_inflated.length;
                                
                            
                            num_processing--;
                            //pending_chunk_reads--;
                            on_chunk_read_complete();                                            
                        }
                    })
                    
                    */
                    deflated_length += buffer_deflated.length;
                    idat_content_buffers.push(buffer_deflated);
                    // may be best having some other asyncronous processing.
                    //  need to be careful about inflating the chunks and processing them correctly.
                    
                }
                
                var found_IEND_chunk = function(chunk_buffer) {
                    
                    // then the image is finished.
                    var chunk_length = chunk_buffer.readUInt32BE(0);
                    //console.log('IEND chunk_length ' + chunk_length);
                    //var that = this;
                    // let's do the callback, returning the palette data.
                    
                    //callback(that);
                    
                    //on_chunk_read_complete();  
                    
                    // has finished. this needs to use a callback
                    
                    //callback(null, that);
                    
                    // then put together all the idat data, decompress it.
                    
                    var buffer_idat_defalted = Buffer.concat(idat_content_buffers, deflated_length);
                    
                    zlib.inflate(buffer_idat_defalted, function(err, buffer_inflated) {
                        //console.log('err ' + err);
                        //console.log('res ' + res);
                        if (err) {
                            
                        } else {
                            //console.log('buffer should have inflated');
                            //console.log('buffer_inflated.length ' + buffer_inflated.length);
                            //console.log('that.scanlines_buffer ' + that.scanlines_buffer);
                            buffer_inflated.copy(that.scanlines_buffer, that.scanlines_buffer_write_pos);     
                            that.scanlines_buffer_write_pos = that.scanlines_buffer_write_pos + buffer_inflated.length;
                                
                            
                            num_processing--;
                            //pending_chunk_reads--;
                            //on_chunk_read_complete();
                            
                            console.log('finished loading image');
                            
                            callback(null, that);                                       
                        }
                    })
                    
                    //on_chunk_read_complete();
                }
                
                var found_chunk = function(chunk_buffer) {
                    
                    // interpret the chunk, and raise an event for having found that kind of chunk.
                    
                    var chunk_length = chunk_buffer.readUInt32BE(0);
                    //console.log('chunk_length ' + chunk_length);
                    
                    var chunk_type = chunk_buffer.toString('ascii', 4, 8);
                    //console.log('* chunk_type ' + chunk_type + '  ');
                    
                    // beginning of the chunk data, end of chunk data
                    //  From the chunk buffer.
                    //  Not sure we really need a chunk buffer anyway, but maybe buffer is more suitable than string for various things.
                    
                    var idx_chunk_data_beginning = 8;
                    var idx_chunk_data_ending = idx_chunk_data_beginning + chunk_length - 8;
                    
                    var chunk_crc = chunk_buffer.readUInt32BE(idx_chunk_data_ending);
                    
                    if (chunk_type == 'IHDR') {
                        found_IHDR_chunk(chunk_buffer);
                    }
                    
                    if (chunk_type == 'gAMA') {
                        found_gAMA_chunk(chunk_buffer);
                    }
                    if (chunk_type == 'PLTE') {
                        found_PLTE_chunk(chunk_buffer);
                    }
                    if (chunk_type == 'tRNS') {
                        found_tRNS_chunk(chunk_buffer);
                    }
                    if (chunk_type == 'IDAT') {
                        found_IDAT_chunk(chunk_buffer);
                    }
                    if (chunk_type == 'IEND') {
                        found_IEND_chunk(chunk_buffer);
                    }
                    
                }
                
                // need to separate the chunks out of the buffers.
                var data_num = 0;
                var chunk_beginning_pos;
                var next_chunk_pos;
                
                if (data_num == 0) {
                    // we start by finding the PNG signature and the first chunk.
                    chunk_beginning_pos = 8;
                    var chunk_length = buffer.readUInt32BE(chunk_beginning_pos);
                    //console.log('chunk_length ' + chunk_length);
                    
                    // make a new chunk buffer and read that chunk into the buffer
                    //  check there is enough space left in the current buffer.
                    
                    var buf_chunk = new Buffer(chunk_length + 12);
                    var next_chunk_pos = chunk_beginning_pos + 12 + chunk_length;
                    
                    // check that it's within the bounds of the data... otherwise don't write it.
                    //  otherwise will write an incomplete buffer.
                    buffer.copy(buf_chunk, 0, chunk_beginning_pos, next_chunk_pos);
                    
                    found_chunk(buf_chunk);
                    // then read everything from the chunk into chunk data.
                }
                
                var ctu = true;
                while (ctu && next_chunk_pos < buffer.length) {
                    chunk_beginning_pos = next_chunk_pos;
                    console.log('chunk_beginning_pos ' + chunk_beginning_pos);
                    // copy that chunk into a buffer and give it to the chunk comprehension.
                    var chunk_length = buffer.readUInt32BE(chunk_beginning_pos);
                    //console.log('chunk_length ' + chunk_length);
                    
                    // chunk_end_position_in_read_buffer
                    
                    var chunk_end_position_in_read_buffer = chunk_beginning_pos + chunk_length + 12
                    
                    if (chunk_end_position_in_read_buffer > buffer.length) {
                        // need to copy this into the temporary buffer
                        //  buffer for incomplete chuncks that have been read.
                        incomplete_chunk_buffer = new Buffer(buffer.length - chunk_end_position_in_read_buffer);
                        buffer.copy(incomplete_chunk_buffer, 0, chunk_beginning_pos, buffer.length);
                        ctu = false;
                        
                    } else {
                        var buf_chunk = new Buffer(chunk_length + 12);
                        var next_chunk_pos = chunk_end_position_in_read_buffer;
                        //console.log('next_chunk_pos ' + next_chunk_pos);
                        
                        buffer.copy(buf_chunk, 0, chunk_beginning_pos, next_chunk_pos);
                        found_chunk(buf_chunk);
                    }
                }
                data_num++;
                
            },
            
            // another function could deal with recieving / streaming in the PNG.
            //  could stream out an RGB or ARGB buffer.
            
            // for the moment it's not a problem to load the whole PNG.
            
            'load_from_stream': function(input_stream, callback) {
                // we can have this process buffers of the chunks.
                //  one thing is, we don't keep a buffer of the whole thing.
                
                // don't know about how chunks will work so well in this stream.
                
                // maybe everything does need to be fed through as chunks.
                //  may need to build up buffers to handle incomplete chunks within the stream
                //  data event. we don't have the full size of the completed buffer, should not assume we
                //  have that at least.
                
                // could build a buffer of the previous buffers
                //  and concat them. then we read through completed chunks?
                
                // just responding to the data may not be so hard - but do need to make sure chunks are received together.
                
                // so can store away / put into buffers completed chunks as they come in.
                //  then those buffers would get removed, and a new set of buffers created while reading a chunk.
                
                // data can be broken up, however.
                
                // I think load the whole thing into a buffer, reading to the end would work.
                
                // Could do processing / docoding / copying of it as it comes in...
                //  but then again building up the complete image buffer will be easier to do.
                
                // could also use it to check if the results are the same when using a more complex method that reads as the stream progresses.
                var that = this;
                var buffers = [];
                var bytes_read = 0;
                input_stream.on('data', function(data_buffer) {
                    buffers.push(data_buffer);
                    bytes_read += data_buffer.length;
                });
                
                input_stream.on('end', function() {
                    var image_buffer = Buffer.concat(buffers, bytes_read);
                    that.load_from_buffer(image_buffer, function() {
                        callback(null, that);
                    });
                    
                });
                
                
            },
            
            
            // load_from_stream_evented
            //  would have events / functions that get called when it has recieved certain data.
            //   a more complex version of the function I think.
                        
            
            'load_from_disk': function(source_path, callback) {
                // don't need to get the size first... it counts the bytes received in the stream.
                //  then it loads from the buffer.
                var that = this;
                
                fs.open(source_path, 'r', function(err, fd) {
                    if (err) {
                        
                    } else {
                        var src = fs.createReadStream(source_path);
                        that.load_from_stream(src, callback);
                        
                    }
                });
                    
                
            },

            
            '_load_from_disk': function(source_path, callback) {
                // loads the whole PNG buffer
                //  then holds the PNG pixels.
                
                // will hold the pixels in a buffer... but it needs to be aware of how
                //  they are held - either indexed color, or the actual colors.
                
                // will hold the palette
                
                // Likely to have to read pixels to an internal data structure...
                //  or make available the data structure that they are stored with using an
                //  API.
                
                // store the whole contents of the PNG in _buffer.
                // load the whole thing into the buffer???
                
                var that = this;
                
                // size of the pixel buffer...
                //  will depend on the color mode.
                
                fs.stat(source_path, function(err, stats) {
					if (err) {
						
					} else {
						var size = stats.size;
						
						//console.log('size ' + size);
                        
                        fs.open(source_path, 'r', function(err, fd) {
                            if (err) {
                                
                            } else {
                                var src = fs.createReadStream(source_path);
                                
                                // but we may want to close the stream after getting the metadata.
                                //  that would make for a very fast metadata getter.
                                
                                // var open_chunks = 0;'
                                
                                // but a callback for when chunks have finished being processed?
                                
                                // don't want the callback until it's done.
                                // let's process the chunks in order.
                                
                                // And when we don't know the size?
                                //  We need to read to the end of the input buffer.
                                
                                
                                
                                
                                
                                
                                var png_buffer = new Buffer(size);
                                var png_pos = 0;
                                
                                // storing the previous data buffer as well...
                                var data_num = 0;
                                var chunk_positions_in_full_data = [];
                                
                                var color_type;
                                var bit_depth;
        
                                var colors = [];
                                var trans;
                                
                                var colors_with_alpha = [];
                                
                                var pending_chunk_reads = 0;
                                
                                var on_chunk_read_complete = function() {
                                    if (pending_chunk_reads == 0) {
                                        //console.log('chunk read complete');
                                        //console.log('pending_chunk_reads ' + pending_chunk_reads);
                                        callback(that);
                                    }
                                }
                                
                                // Async buffer processing?
                                
                                var found_IHDR_chunk = function(chunk_buffer) {
                                
                                
                                    var chunk_length = chunk_buffer.readUInt32BE(0);
                                    //console.log('IHDR chunk_length ' + chunk_length);
                                    
                                    // extract various values from it.
                                    // could set them in an FSM.
                                    
                                    var img_width = chunk_buffer.readUInt32BE(8);
                                    var img_height = chunk_buffer.readUInt32BE(12);
                                    
                                    //console.log('img_width ' + img_width);
                                    //console.log('img_height ' + img_height);
                                    
                                    bit_depth = chunk_buffer.readUInt8(16);
                                    color_type = chunk_buffer.readUInt8(17);
                                    var compression_method = chunk_buffer.readUInt8(18);
                                    var filter_method = chunk_buffer.readUInt8(19);
                                    var interlace_method = chunk_buffer.readUInt8(20);
                                    
                                    that.size = [img_width, img_height]
                                    that.bit_depth = bit_depth;
                                    that.color_type = color_type;
                                    that.compression_method = compression_method;
                                    
                                    
                                    // calculate the size of the image data buffer.
                                    //  will hold the indexed pixel data if needed.
                                    
                                    // calculate the scanline length here.
                                    
                                    // depends on the bit depth... need to get the right scanline length.
                                    
                                    var scanline_image_data_length;
                                    
                                    // and depends on the color mode.
                                    
                                    if (bit_depth == 1) {
                                        scanline_image_data_length = Math.ceil(that.size[0] / 8);
                                    }
                                    if (bit_depth == 2) {
                                        scanline_image_data_length = Math.ceil(that.size[0] / 4);
                                    }
                                    if (bit_depth == 4) {
                                        scanline_image_data_length = Math.ceil(that.size[0] / 2);
                                    }
                                    if (bit_depth == 8) {
                                        if (color_type == 2) {
                                            scanline_image_data_length = that.size[0] * 3;
                                        } else if (color_type == 6) {
                                            scanline_image_data_length = that.size[0] * 4;
                                        }
                                    }
                                    //console.log('scanline_image_data_length ' + scanline_image_data_length);
                                    
                                    // scanline_length depends on the number of bits per pixel.
                                    
                                    var scanline_length = scanline_image_data_length + 1;
                                    
                                    that.scanline_image_data_length = scanline_image_data_length;
                                    that.scanline_length = scanline_length;
                                    
                                    var scanlines_buffer_length = that.scanline_length * that.size[1];
                                    that.scanlines_buffer_length = scanlines_buffer_length;
                                    
                                    var scanlines_buffer = new Buffer(scanlines_buffer_length);
                                    that.scanlines_buffer = scanlines_buffer;
                                    
                                    that.scanlines_buffer_write_pos = 0;
                                    
                                    //console.log('scanlines_buffer_length ' + scanlines_buffer_length);
                                    
                                    // buf.copy(targetBuffer, [targetStart], [sourceStart], [sourceEnd])
                                    
                                    // create the buffer for the scanline data that is needed.
                                    
                                    //found_metadata(obj_metadata);
                                    //src.pause();
                                    //src.destroy();
                                }
                                
                                var found_gAMA_chunk = function(chunk_buffer) {
                                    var chunk_length = chunk_buffer.readUInt32BE(0);
                                    //console.log('gAMA chunk_length ' + chunk_length);
                                    
                                    var value = chunk_buffer.readUInt32BE(8);
                                    
                                    //console.log('value ' + value);
                                }
                                
                                var found_PLTE_chunk = function(chunk_buffer) {
                                    var chunk_length = chunk_buffer.readUInt32BE(0);
                                    //console.log('PLTE chunk_length ' + chunk_length);
                                    
                                    // then we get the chunk data... all the colors
                                    
                                    var num_colors = chunk_length / 3;
                                    //console.log('num_colors ' + num_colors);
                                    
                                    // then parse the individual colors.
                                    
                                    var c = 0;
                                    var color_begin_pos = 8;
                                    while (c < num_colors) {
                                        // the color is stored as 4 1 byte values.
                                        //  but the info about color locations could be parsed out?
                                        //  in this situation, we want the colors from the pallet.
                                        
                                        var color = [chunk_buffer.readUInt8(color_begin_pos), chunk_buffer.readUInt8(color_begin_pos + 1), chunk_buffer.readUInt8(color_begin_pos + 2)];
                                        colors.push(color);
                                        
                                        
                                        color_begin_pos = color_begin_pos + 3;
                                        
                                        c++;
                                    }
                                    that.palette = colors;
                                    
                                    //console.log('colors ' + stringify(colors));
                                    //console.log('colors.length ' + stringify(colors.length));
                                    
                                }
                                
                                var found_tRNS_chunk = function(chunk_buffer) {
                                    var chunk_length = chunk_buffer.readUInt32BE(0);
                                    //console.log('tRNS chunk_length ' + chunk_length);
                                    
                                    //var value = chunk_buffer.readUInt32BE(8);
                                    
                                    //console.log('value ' + value);
                                    if (color_type == 3) {
                                        // then we read in all the color values.
                                        trans = [];
                                        for (var c = 8; c < 8 + chunk_length; c++) {
                                            var alpha = chunk_buffer.readUInt8(c);
                                            //console.log('alpha ' + alpha);
                                            trans.push(alpha);
                                        }
                                        
                                        // then create the colors with alpha values.
                                        
                                        each(colors, function(i, v) {
                                            if (is_defined(trans[i])) {
                                                var color_with_alpha = [v[0], v[1], v[2], trans[i]];
                                                colors_with_alpha.push(color_with_alpha);
                                            } else {
                                                var color_with_alpha = [v[0], v[1], v[2], 255];
                                                colors_with_alpha.push(color_with_alpha);
                                            };
                                            
                                            //var color_with_alpha = [v[0], v[1], v[2], ]
                                        });
                                        //console.log('colors_with_alpha ' + stringify(colors_with_alpha));
                                        
                                        that.palette_with_alphas = colors_with_alpha;
                                        
                                    }
                                    
                                }
                                
                                var found_IDAT_chunk = function(chunk_buffer) {
                                    pending_chunk_reads++;
                                
                                    var chunk_length = chunk_buffer.readUInt32BE(0);
                                    //console.log('IDAT chunk_length ' + chunk_length);
                                    
                                    // Then has the data been compressed with deflate?
                                    
                                    // Let's have it decompress the data.
                                    
                                    // Need to have it decompress the right data from the buffer
                                    
                                    // need to get the filter methods for lines.
                                    
                                    var idx_data_start = 8;
                                    var idx_data_end = idx_data_start + chunk_length;
                                    
                                    //var inflate = zlib.createInflate();
                                    
                                    // inflate it to a stream or buffer?
                                    
                                    var buffer_deflated = new Buffer(chunk_length);
                                    chunk_buffer.copy(buffer_deflated, 0, idx_data_start, idx_data_end);
                                    
                                    // inflate is async... need to be careful about this.
                                    //  so this parsing happens after the IEND chunk has been read.
                                    //  so, likely to have a callback that occurrs when every inflation has been done.
                                    zlib.inflate(buffer_deflated, function(err, buffer_inflated) {
                                        //console.log('err ' + err);
                                        //console.log('res ' + res);
                                        if (err) {
                                            
                                        } else {
                                            //console.log('buffer_inflated.length ' + buffer_inflated.length);
                                            buffer_inflated.copy(that.scanlines_buffer, that.scanlines_buffer_write_pos);     
                                            that.scanlines_buffer_write_pos = that.scanlines_buffer_write_pos + buffer_inflated.length;
                                                
                                            
                                            pending_chunk_reads--;
                                            on_chunk_read_complete();                                            
                                        }
                                    })
                                }
                                
                                var found_IEND_chunk = function(chunk_buffer) {
                                    
                                    // then the image is finished.
                                    var chunk_length = chunk_buffer.readUInt32BE(0);
                                    //console.log('IEND chunk_length ' + chunk_length);
                                    
                                    // let's do the callback, returning the palette data.
                                    
                                    //callback(that);
                                    
                                    on_chunk_read_complete();  
                                    
                                }
                                
                                var found_chunk = function(chunk_buffer) {
                                    
                                    // interpret the chunk, and raise an event for having found that kind of chunk.
                                    
                                    var chunk_length = chunk_buffer.readUInt32BE(0);
                                    //console.log('chunk_length ' + chunk_length);
                                    
                                    var chunk_type = chunk_buffer.toString('ascii', 4, 8);
                                    //console.log('* chunk_type ' + chunk_type + '  ');
                                    
                                    // beginning of the chunk data, end of chunk data
                                    //  From the chunk buffer.
                                    //  Not sure we really need a chunk buffer anyway, but maybe buffer is more suitable than string for various things.
                                    
                                    var idx_chunk_data_beginning = 8;
                                    var idx_chunk_data_ending = idx_chunk_data_beginning + chunk_length - 8;
                                    
                                    var chunk_crc = chunk_buffer.readUInt32BE(idx_chunk_data_ending);
                                    
                                    if (chunk_type == 'IHDR') {
                                        found_IHDR_chunk(chunk_buffer);
                                    }
                                    
                                    if (chunk_type == 'gAMA') {
                                        found_gAMA_chunk(chunk_buffer);
                                    }
                                    if (chunk_type == 'PLTE') {
                                        found_PLTE_chunk(chunk_buffer);
                                    }
                                    if (chunk_type == 'tRNS') {
                                        found_tRNS_chunk(chunk_buffer);
                                    }
                                    if (chunk_type == 'IDAT') {
                                        found_IDAT_chunk(chunk_buffer);
                                    }
                                    if (chunk_type == 'IEND') {
                                        found_IEND_chunk(chunk_buffer);
                                    }
                                    
                                }
                                
                                var incomplete_chunk_buffer = false;
                                
                                src.on('data', function(data) {
                                
                                    // if we have an imcomplete chunk buffer, merge them.
                                    if (incomplete_chunk_buffer) {
                                        var new_data = new Buffer(incomplete_chunk_buffer.length + data.length);
                                        
                                        incomplete_chunk_buffer.copy(new_data, 0, 0, incomplete_chunk_buffer.length);
                                        data.copy(new_data, incomplete_chunk_buffer.length, 0, data.length);
                                        data = new_data;
                                        incomplete_chunk_buffer = false;
                                    }
                                    
                                    //console.log('data_num ' + data_num);
                                    //console.log('');
                                    //png_pos
                                    
                                    // move through the data... we'll keep in sync with the chunks.
                                    
                                    if (data_num == 0) {
                                        // we start by finding the PNG signature and the first chunk.
                                        chunk_beginning_pos = 8;
                                        var chunk_length = data.readUInt32BE(chunk_beginning_pos);
                                        //console.log('chunk_length ' + chunk_length);
                                        
                                        // make a new chunk buffer and read that chunk into the buffer
                                        //  check there is enough space left in the current buffer.
                                        
                                        var buf_chunk = new Buffer(chunk_length + 12);
                                        var next_chunk_pos = chunk_beginning_pos + 12 + chunk_length;
                                        
                                        // check that it's within the bounds of the data... otherwise don't write it.
                                        //  otherwise will write an incomplete buffer.
                                        data.copy(buf_chunk, 0, chunk_beginning_pos, next_chunk_pos);
                                        
                                        found_chunk(buf_chunk);
                                        // then read everything from the chunk into chunk data.
                                    }
                                    
                                    var ctu = true;
                                    while (ctu && next_chunk_pos < data.length) {
                                        chunk_beginning_pos = next_chunk_pos;
                                        //console.log('chunk_beginning_pos ' + chunk_beginning_pos);
                                        // copy that chunk into a buffer and give it to the chunk comprehension.
                                        var chunk_length = data.readUInt32BE(chunk_beginning_pos);
                                        //console.log('chunk_length ' + chunk_length);
                                        
                                        // chunk_end_position_in_read_buffer
                                        
                                        var chunk_end_position_in_read_buffer = chunk_beginning_pos + chunk_length + 12
                                        
                                        if (chunk_end_position_in_read_buffer > data.length) {
                                            // need to copy this into the temporary buffer
                                            //  buffer for incomplete chuncks that have been read.
                                            incomplete_chunk_buffer = new Buffer(data.length - chunk_end_position_in_read_buffer);
                                            data.copy(incomplete_chunk_buffer, 0, chunk_beginning_pos, data.length);
                                            ctu = false;
                                            
                                        } else {
                                            var buf_chunk = new Buffer(chunk_length + 12);
                                            var next_chunk_pos = chunk_end_position_in_read_buffer;
                                            //console.log('next_chunk_pos ' + next_chunk_pos);
                                            
                                            data.copy(buf_chunk, 0, chunk_beginning_pos, next_chunk_pos);
                                            found_chunk(buf_chunk);
                                        }
                                    }
                                    data_num++;
                                });
        
                                // the reading is finished...
                                src.on('close', function () {
                                    // It should have been processing the data recieved.
                                    
                                    //writeStream.end(); // ...close up the write, too!
                                    console.log("src finished.");
                                });
                                
                                
                                /*
                                
                                fs.read(fd, png_input_buffer, 0, 30, 0, function(err, num_bytes_read, buffer) {
                                    if (err) {
                                        
                                    } else {
                                        console.log('buffer === png_input_buffer ' + buffer === png_input_buffer);
                                        
                                        // the buffer of pixels that has been read in...
                                        
                                        // bytesread... a string I think.
                                        console.log('num_bytes_read ' + stringify(num_bytes_read));
                                        
                                        // and the data should be in the png input buffer.
                                        
                                        //  want to read a chunk from the buffer.
                                        
                                    }
                                    
                                })
                                */
                            }
                        })
                    }
                });
                
            }
            
        })
        
        // Interested in using this in streaming mode.
        //  Decoding a PNG input stream, outputting an RGBA output stream.
        
        // would be making a new version like load_from_disk...
        //  decode_stream.
        
        // can pipe to an output stream?
        //  write to an output stream?
        
        // will give that more thought.
        
        
        
        
        
        
        var load_from_disk = function(source_path, callback) {
            var res = new PNG({});
            res.load_from_disk(source_path, callback);
        }
        
        // load from disk
        
        // get png metadata from path...
        
        var load_metadata_from_disk = function(source_path, callback) {
            
            var found_metadata = function(obj_metadata) {
                // and can we close the read buffer?
                
                callback(null, obj_metadata);
            }
            
            fs.stat(source_path, function(err, stats) {
                if (err) {
                    
                } else {
                    var size = stats.size;
                    var png_input_buffer = new Buffer(size);
                    
                    fs.open(source_path, 'r', function(err, fd) {
                        if (err) {
                            
                        } else {
                            var src = fs.createReadStream(source_path);
                            var png_buffer = new Buffer(size);
                            var png_pos = 0;
                            
                            // storing the previous data buffer as well...
                            var data_num = 0;
                            var chunk_positions_in_full_data = [];
                            
                            var color_type;
                            var bit_depth;

                            var colors = [];
                            var trans;
                            
                            var colors_with_alpha = [];
                            
                            var found_IHDR_chunk = function(chunk_buffer) {
                                var chunk_length = chunk_buffer.readUInt32BE(0);
                                //console.log('IHDR chunk_length ' + chunk_length);
                                
                                // extract various values from it.
                                // could set them in an FSM.
                                
                                var img_width = chunk_buffer.readUInt32BE(8);
                                var img_height = chunk_buffer.readUInt32BE(12);
                                
                                //console.log('img_width ' + img_width);
                                //console.log('img_height ' + img_height);
                                
                                bit_depth = chunk_buffer.readUInt8(16);
                                color_type = chunk_buffer.readUInt8(17);
                                var compression_method = chunk_buffer.readUInt8(18);
                                var filter_method = chunk_buffer.readUInt8(19);
                                var interlace_method = chunk_buffer.readUInt8(20);
                                
                                //console.log('bit_depth ' + bit_depth);
                                //console.log('color_type ' + color_type);
                                //console.log('compression_method ' + compression_method);
                                //console.log('filter_method ' + filter_method);
                                //console.log('interlace_method ' + interlace_method);
                                //var chunk_crc = data.readUInt32BE(29);
                                //console.log('chunk_crc ' + chunk_crc);
                                
                                var obj_metadata = {
                                    'width': img_width,
                                    'height': img_height,
                                    'bit_depth': bit_depth,
                                    'color_type': color_type,
                                    'compression_method': compression_method
                                }
                                
                                found_metadata(obj_metadata);
                                src.pause();
                                src.destroy();
                            }
                            
                            var found_chunk = function(chunk_buffer) {
                                // the chunk data as a buffer too?
                                // the chunk will be read in that way I think.
                                //console.log('found_chunk chunk_buffer.length ' + chunk_buffer.length);
                                // then let's read this chunk.
                                //  will raise various different events for different chunks that get read.
                                
                                // interpret the chunk, and raise an event for having found that kind of chunk.
                                
                                var chunk_length = chunk_buffer.readUInt32BE(0);
                                //console.log('chunk_length ' + chunk_length);
                                
                                var chunk_type = chunk_buffer.toString('ascii', 4, 8);
                                //console.log('* chunk_type ' + chunk_type + '  ');
                                
                                // beginning of the chunk data, end of chunk data
                                //  From the chunk buffer.
                                //  Not sure we really need a chunk buffer anyway, but maybe buffer is more suitable than string for various things.
                                
                                var idx_chunk_data_beginning = 8;
                                var idx_chunk_data_ending = idx_chunk_data_beginning + chunk_length - 8;
                                
                                //console.log('idx_chunk_data_ending ' + idx_chunk_data_ending);
                                
                                var chunk_crc = chunk_buffer.readUInt32BE(idx_chunk_data_ending);
                                
                                // Want to raise events for particular types of chunks.
                                //  That could actually parse the image info.
                                //  We'll be able to get the transparency and the palette chunks, both are needed to find out what rgba colors are represented.
                                
                                if (chunk_type == 'IHDR') {
                                    found_IHDR_chunk(chunk_buffer);
                                }
                                
                            }
                            
                            var incomplete_chunk_buffer = false;
                            
                            src.on('data', function(data) {
                            
                                // if we have an imcomplete chunk buffer, merge them.
                                if (incomplete_chunk_buffer) {
                                    var new_data = new Buffer(incomplete_chunk_buffer.length + data.length);
                                    
                                    incomplete_chunk_buffer.copy(new_data, 0, 0, incomplete_chunk_buffer.length);
                                    data.copy(new_data, incomplete_chunk_buffer.length, 0, data.length);
                                    data = new_data;
                                    incomplete_chunk_buffer = false;
                                }
                                
                            
                                //console.log("Found some data! data.length " + data.length);
                                //  that is the amount in the buffer...
                                
                                // The amount given in the buffer here may not be the full chunk.
                                //  If it is not the full chunk, we need to copy what we do have into a temporary buffer, and
                                //   then use that as well as the next data for reading the PNG chunk.
                                
                                // move through the data... we'll keep in sync with the chunks.
                                
                                if (data_num == 0) {
                                    // we start by finding the PNG signature and the first chunk.
                                    chunk_beginning_pos = 8;
                                    var chunk_length = data.readUInt32BE(chunk_beginning_pos);
                                    //console.log('chunk_length ' + chunk_length);
                                    
                                    // make a new chunk buffer and read that chunk into the buffer
                                    //  check there is enough space left in the current buffer.
                                    
                                    var buf_chunk = new Buffer(chunk_length + 12);
                                    var next_chunk_pos = chunk_beginning_pos + 12 + chunk_length;
                                    
                                    // check that it's within the bounds of the data... otherwise don't write it.
                                    //  otherwise will write an incomplete buffer.
                                    data.copy(buf_chunk, 0, chunk_beginning_pos, next_chunk_pos);
                                    
                                    found_chunk(buf_chunk);
                                    // then read everything from the chunk into chunk data.
                                }
                                // then read through all the chunks.
                                
                                // read the next chunk.
                                var ctu = true;
                                while (ctu && next_chunk_pos < data.length) {
                                    chunk_beginning_pos = next_chunk_pos;
                                    //console.log('chunk_beginning_pos ' + chunk_beginning_pos);
                                    // copy that chunk into a buffer and give it to the chunk comprehension.
                                    var chunk_length = data.readUInt32BE(chunk_beginning_pos);
                                    //console.log('chunk_length ' + chunk_length);
                                    
                                    // chunk_end_position_in_read_buffer
                                    
                                    var chunk_end_position_in_read_buffer = chunk_beginning_pos + chunk_length + 12
                                    
                                    if (chunk_end_position_in_read_buffer > data.length) {
                                        // need to copy this into the temporary buffer
                                        //  buffer for incomplete chuncks that have been read.
                                        incomplete_chunk_buffer = new Buffer(data.length - chunk_end_position_in_read_buffer);
                                        data.copy(incomplete_chunk_buffer, 0, chunk_beginning_pos, data.length);
                                        ctu = false;
                                        
                                    } else {
                                        var buf_chunk = new Buffer(chunk_length + 12);
                                        var next_chunk_pos = chunk_end_position_in_read_buffer;
                                        //console.log('next_chunk_pos ' + next_chunk_pos);
                                        
                                        data.copy(buf_chunk, 0, chunk_beginning_pos, next_chunk_pos);
                                        found_chunk(buf_chunk);
                                    }
                                }
                                
                                data_num++;
                              //writeStream.write(textData);
                            });

                            // the reading is finished...
                            src.on('close', function () {
                                // It should have been processing the data recieved.
                                
                                //writeStream.end(); // ...close up the write, too!
                                console.log("src finished.");
                            });
                            
                        }
                    })
                }
            });
        }
        
        var load_rgba_pixel_buffer_from_disk = function(source_path, callback) {
            console.log('jsgui-node-png ' + load_rgba_pixel_buffer_from_disk);
            load_from_disk(source_path, function(err, res_png) {
                if (err) {
                    var stack = new Error().stack;
                    console.log(stack);
                    throw err;
                } else {
                    console.log('png load_rgba_pixel_buffer_from_disk');
                    var rgba32_buffer = res_png.get_rgba_pixel_buffer();
                    
                    console.log('got rgba32_buffer');
                    callback(null, rgba32_buffer);
                    
                }
            })
        };
        
        var save_rgba_pixel_buffer_to_disk = function(rbga_buffer, dest_path, callback) {
            // open the png from the rgba_pixel_buffer
            //  save the png.
            // could do this quickly by copying into the scanline buffer, with the scanline filter set to 0
            
            var color_type;
            var bytes_per_pixel;
            
            if (rbga_buffer.bits_per_pixel == 24) {
                color_type = 2;
                bytes_per_pixel = 3;
            }
            if (rbga_buffer.bits_per_pixel == 32) {
                color_type = 6;
                bytes_per_pixel = 4;
            }
            
            var png = new PNG({'size': rbga_buffer.size, 'color_type': color_type});
            // iterating pixels is easiest?
            
            // I think direct copying is best.
            console.log('rbga_buffer ' + rbga_buffer);
            var w = rbga_buffer.size[0];
            var h = rbga_buffer.size[1];
            // calculate the positions - the buffer to copy from, buffer to copy to.
            //  will be writing directly to the scanline buffer.
            var source_buffer = rbga_buffer.buffer;
            var dest_buffer = png.buffer;
            
            var source_buffer_line_length = w * bytes_per_pixel;
            
            // 1 extra byte for the scanline filter byte. stays at 0.
            var dest_buffer_line_length = w * bytes_per_pixel + 1;
            
            var source_buffer_line_start, source_buffer_line_end;
            var dest_buffer_line_start;
            
            for (var y = 0; y < h; y++) {
                //png.buffer;
                source_buffer_line_start = y * source_buffer_line_length;
                source_buffer_line_end = source_buffer_line_start + source_buffer_line_length;
                
                dest_buffer_line_start = y * dest_buffer_line_length;
                //buf.copy(targetBuffer, [targetStart], [sourceStart], [sourceEnd])
                source_buffer.copy(dest_buffer, dest_buffer_line_start, source_buffer_line_start, source_buffer_line_end);
            }
            
            // png.load_scanline_from_
            png.save_to_disk(dest_path, callback);
        }
        
        var png = {
            'load_metadata_from_disk': load_metadata_from_disk,
            'PNG': PNG,
            'load_from_disk': load_from_disk,
            'load_rgba_pixel_buffer_from_disk': load_rgba_pixel_buffer_from_disk,
            'save_rgba_pixel_buffer_to_disk': save_rgba_pixel_buffer_to_disk
        }
        return png;
    }
);

