jsgui-node-png
==============

Jsgui PNG Library for node.js. JavaScript implementation of some of the PNG spec. It has been optimized for performance, but it is also likely some ways could be found to speed it up further. This library also enables optimization of saved PNGs, where optimal scanline filters are chosen (this takes a few seconds on a moderately large image running on an Intel 2.2Ghz core). 

A valuable point of reference for PNGs is the specification at [http://www.libpng.org/pub/png/spec/iso/index-object.html](http://www.libpng.org/pub/png/spec/iso/index-object.html).


##Installation
	npm install jsgui-node-png

## High level API

###PNG Class
####Constructor: init(spec)
#####spec object
Value Name     | Description 
------------   | ------------- 
size           | [x, y] array specifying the dimensions of the image
color_type     | The color type that is specified in the IHDR (header) chunk of the PNG. This library currently supports 2 (Truecolor), 3 (Indexed-color) and 6 (Truecolor with alpha).
bit_depth      | The bit depth that is specified in the IHDR (header) chunk of the PNG. Supports 1, 2, 4, 8 for color_type 3 (Indexed-color) and 8 for color_type 2 (Truecolor) and 6 (Truecolor with alpha).

    var png = new jsgui_node_png.PNG({
        'size': [640, 480],
        'color_type': 6,
        'bit_depth': 8
    });

The constructor initializes the internally used scanlines_buffer, which is a Buffer that stored the image data that is filtered according to the first byte of each scanline.

###get_rgba_pixel_buffer()
Gets a jsgui-node-pixel-buffer object containing the image. That representation of the image is useful for doing image processing on an image where processing code for a raster image would be written to be independant of the image format.

###optimize_filter_all_scanlines([options], callback)
Optimizes the PNG by selecting the scanline filters for each scanline in the image with the aim of producing the best compression when the image is compressed using deflate, which is the standard compression for the PNG format.
#####options object
Value Name     | Data type    |  Description   |  Notes
------------   | ------------- 
optimize           | string | 'best' &#124; 'fast' | Currently 'best' is recommended

The callback is called with parameters, (err, res). The res (result) parameter is set to true on successful completion of the function.

###save_to_stream(writable_stream, [options], callback)
#####options object
Value Name     | Data type    |  Description   |  Notes
------------   | ------------- 
optimize           | string | 'best' &#124; 'fast' | Currently 'best' is recommended

###save_to_disk(file_path, [options], callback)
Saves the PNG to the file system.
#####options object
Value Name     | Data type    |  Description   |  Notes
------------   | ------------- 
optimize           | string | 'best' &#124; 'fast' | Currently 'best' is recommended


###load_from_buffer(buffer, callback)
Loads from a Buffer into this PNG instance.

###load_from_stream(readable_stream, callback)
Loads from a ReadableStream into this PNG instance.

###load_from_disk(source_path, callback)
Loads from disk into this PNG instance.

##Module functions
###load_from_disk(source_path, callback)
Loads a PNG instance from disk.

The callback is called with parameters (err, png)
###load_metadata_from_disk(source_path, callback)
Loads the metadata for a PNG from a file path

The callback is called with parameters (err, obj_metadata)
###load_rgba_pixel_buffer_from_disk(source_path, callback)
Loads a PNG file from the file system to a new rgba Pixel_Buffer

The callback is called with parameters (err, pixel_buffer)
###save_rgba_pixel_buffer_to_disk(dest_path, [options], callback)
Saves an rgba Pixel_Buffer to disk in the PNG format.
#####options object
Value Name     | Data type    |  Description   |  Notes
------------   | ------------- 
scanline_encoding           | number | The number representing the scanline filter that is to be used for all scanlines (rows) in the image. | This takes less time than using the 'optimize' option, and using a set scanline filter (such as 1, 2, 3 or 4) can provide a good level of compression.
optimize           | string | 'best' &#124; 'fast' | Currently 'best' is recommended. 

### Low level API
###PNG Class
###ensure_unfiltered_scanlines_buffer()
Once the image has been loaded, an buffer containing unfiltered scanlines (all with their scanline filters set to 0) is created using this function. It carries out unfiltering on the byte values in the scanlines_buffer, outputting to the unfiltered_scanlines_buffer.

##Notes
### optimize
The 'best' method of scanline filter optimization selects filters for each scanline based on the size of data compressed when using that filter, taking into account data that has preceeded it. This submethod of optimize runs asyncronously using zlib.