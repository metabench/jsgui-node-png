if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['../../jsgui-lang-essentials', 'fs', '../../jsgui-node-png'], 
    function(jsgui, fs, jsgui_png) {
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
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, pix_buf) {
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
        
        
        
        
        var test_load_pngs_to_rgba_buffer_save_as_png = function() {
            
            //var source_path = './source/pngsuite/f00n2c08.png';
            //var dest_path = './res/f00n2c08.png';
            
            //load_png_to_rgba_buffer_save_as_png(source_path, dest_path);
            
            var fns = [];
            
            fns.push([load_png_to_rgba_buffer_save_as_png, ['./source/pngsuite/f00n2c08.png', './res/f00n2c08.png']]);
            fns.push([load_png_to_rgba_buffer_save_as_png, ['./source/pngsuite/f01n2c08.png', './res/f01n2c08.png']]);
            fns.push([load_png_to_rgba_buffer_save_as_png, ['./source/pngsuite/f02n2c08.png', './res/f02n2c08.png']]);
            fns.push([load_png_to_rgba_buffer_save_as_png, ['./source/pngsuite/f03n2c08.png', './res/f03n2c08.png']]);
            fns.push([load_png_to_rgba_buffer_save_as_png, ['./source/pngsuite/f04n2c08.png', './res/f04n2c08.png']]);
            
            // want to try loading it to an rgba buffer, saving it as a bitmap.
            
            
            
            fns.push([load_png_to_rgba_buffer_save_as_png, ['./source/pliers2.png', './res/pliers.png']]);
            fns.push([load_png_to_rgba_buffer_save_as_png, ['./source/dice.png', './res/dice.png']]);
            
            console.log('pre call multi');
            
            call_multi(fns, function(err, res_multi) {
                
            });
            
            
        }
        //test_load_pngs_to_rgba_buffer_save_as_png();
        
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
        
        var test_load_png_with_scanline_filter_2 = function() {
            // scanline filter 1 is the add filter.
        
            //var source_path = __dirpath + '/source/gradient24.png';
            var source_path = './source/pngsuite/f02n2c08.png';
            //f01n2c08.png
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                
                } else {
                    console.log('image loaded');
                    var size = png.size;
                    var color_type = png.color_type;
                    var bit_depth = png.bit_depth;
                    
                    console.log('size ' + stringify(size));
                    console.log('scanline_length ' + stringify(png.scanline_length));
                    console.log('color_type ' + stringify(color_type));
                    console.log('bit_depth ' + stringify(bit_depth));
                    
                    var do_iterate = function() {
                        png.iterate_pixels(function(x, y, color) {
                            // happens very quickly I think... not sure it will be the fastest way, however.
                            //console.log('iterated pixel');
                            console.log('x, y, color ' + x + ', ' + y + ', ' + color);
                            // then save the PNG
                            //png.save_to_disk(
                        });
                    }
                    //do_iterate();
                    
                    //var map_sf = png.get_map_scanline_filters();
                    //console.log('map_sf ' + stringify(map_sf));
                    
                    //var unfiltered_scanline_0 = png.get_unfiltered_scanline_buffer(0);
                    //console.log('unfiltered_scanline_0 ' + unfiltered_scanline_0);
                    //console.log('unfiltered_scanline_0 ' + stringify(unfiltered_scanline_0));
                    //console.log('unfiltered_scanline_0.length ' + stringify(unfiltered_scanline_0.length));
                    
                    png.iterate_row(0, function(x, y, color) {
                        console.log('x, y, color ' + x + ', ' + y + ', ' + color);
                    })
                }
            });
        }
        
        //test_load_png_with_scanline_filter_2();
        
        // want to try testing smaller images....
        
        var load_png_set_scanline_filters_save = function(source_path, dest_path, scanline_filter, callback) {
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                
                } else {
                    
                    //console.log('image loaded');
                    var size = png.size;
                    var color_type = png.color_type;
                    var bit_depth = png.bit_depth;
                
                    console.log('size ' + stringify(size));
                    console.log('scanline_length ' + stringify(png.scanline_length));
                    console.log('color_type ' + stringify(color_type));
                    console.log('bit_depth ' + stringify(bit_depth));
                    
                    // This should work!!!
                    png.set_scanline_filter_all_rows(scanline_filter);
                    
                    //png.filter_all_scanlines();
                    //do_iterate();
                
                    //var new_png_path = path.dirname(source_path) + '/' + '_scanline_filter_4_' + path.basename(source_path, '.png') + '.png';
                    //console.log('new_png_path ' + new_png_path);
                
                    png.save_to_disk(dest_path, function() {
                        //console.log('png saved');
                        callback(null, true);
                    });
                }
                
                
            });
        }
        
        var test_load_pngsuite_save_different_scanline_filters = function() {
            var fns = [];
            
            fns.push([load_png_set_scanline_filters_save, ['./source/pngsuite/f00n2c08.png', './res/f001_f00n2c08.png', 1]]);
            fns.push([load_png_set_scanline_filters_save, ['./source/pngsuite/f00n2c08.png', './res/f002_f00n2c08.png', 2]]);
            fns.push([load_png_set_scanline_filters_save, ['./source/pngsuite/f00n2c08.png', './res/f003_f00n2c08.png', 3]]);
            fns.push([load_png_set_scanline_filters_save, ['./source/pngsuite/f00n2c08.png', './res/f004_f00n2c08.png', 4]]);
            
            call_multi(fns, function(err, res_multi) {
                console.log('multi callback');
            })
            
        }
        //test_load_pngsuite_save_different_scanline_filters();
        
        var test_load_scanline_filter_0_sprite_save_scanline_filter_1 = function() {
            
            //var source_path = __dirpath + '/source/gradient24.png';
            var source_path = './source/sprite_slf0.png';
            var res_path = './res/sprite_slf1.png';
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                
                } else {
                    
                    //console.log('image loaded');
                    var size = png.size;
                    var color_type = png.color_type;
                    var bit_depth = png.bit_depth;
                
                    // This should work!!!
                    png.set_scanline_filter_all_rows(1);
                    
                    //png.filter_all_scanlines();
                    //do_iterate();
                
                    //var new_png_path = path.dirname(source_path) + '/' + '_scanline_filter_4_' + path.basename(source_path, '.png') + '.png';
                    //console.log('new_png_path ' + new_png_path);
                
                    png.save_to_disk(res_path, function() {
                        console.log('png saved');
                    });
                }
                
                
            });
        }
        //test_load_scanline_filter_0_sprite_save_scanline_filter_1();
        
        var test_load_scanline_filter_0_sprite_save_scanline_filter_2 = function() {
            
            //var source_path = __dirpath + '/source/gradient24.png';
            var source_path = './source/sprite_slf0.png';
            var res_path = './res/sprite_slf2.png';
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                
                } else {
                    
                    //console.log('image loaded');
                    var size = png.size;
                    var color_type = png.color_type;
                    var bit_depth = png.bit_depth;
                
                    console.log('size ' + stringify(size));
                    console.log('scanline_length ' + stringify(png.scanline_length));
                    console.log('color_type ' + stringify(color_type));
                    console.log('bit_depth ' + stringify(bit_depth));
                    
                    // This should work!!!
                    png.set_scanline_filter_all_rows(2);
                    
                    //png.filter_all_scanlines();
                    //do_iterate();
                
                    //var new_png_path = path.dirname(source_path) + '/' + '_scanline_filter_4_' + path.basename(source_path, '.png') + '.png';
                    //console.log('new_png_path ' + new_png_path);
                
                    png.save_to_disk(res_path, function() {
                        console.log('png saved');
                    });
                }
                
                
            });
        }
        
        //test_load_scanline_filter_0_sprite_save_scanline_filter_2();
        var test_load_scanline_filter_0_sprite_save_scanline_filter_3 = function() {
            
            //var source_path = __dirpath + '/source/gradient24.png';
            var source_path = './source/sprite_slf0.png';
            var res_path = './res/sprite_slf3.png';
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                
                } else {
                    
                    //console.log('image loaded');
                    var size = png.size;
                    var color_type = png.color_type;
                    var bit_depth = png.bit_depth;
                
                    // This should work!!!
                    png.set_scanline_filter_all_rows(3);
                    
                    //png.filter_all_scanlines();
                    //do_iterate();
                
                    //var new_png_path = path.dirname(source_path) + '/' + '_scanline_filter_4_' + path.basename(source_path, '.png') + '.png';
                    //console.log('new_png_path ' + new_png_path);
                
                    png.save_to_disk(res_path, function() {
                        console.log('png saved');
                    });
                }
                
                
            });
        }
        //test_load_scanline_filter_0_sprite_save_scanline_filter_3();
        
        var test_load_scanline_filter_0_sprite_save_scanline_filter_4 = function() {
            
            //var source_path = __dirpath + '/source/gradient24.png';
            var source_path = './source/sprite_slf0.png';
            var res_path = './res/sprite_slf4.png';
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                
                } else {
                    
                    //console.log('image loaded');
                    var size = png.size;
                    var color_type = png.color_type;
                    var bit_depth = png.bit_depth;
                
                    console.log('size ' + stringify(size));
                    console.log('scanline_length ' + stringify(png.scanline_length));
                    console.log('color_type ' + stringify(color_type));
                    console.log('bit_depth ' + stringify(bit_depth));
                    
                    // This should work!!!
                    png.set_scanline_filter_all_rows(4);
                    
                    //png.filter_all_scanlines();
                    //do_iterate();
                
                    //var new_png_path = path.dirname(source_path) + '/' + '_scanline_filter_4_' + path.basename(source_path, '.png') + '.png';
                    //console.log('new_png_path ' + new_png_path);
                
                    png.save_to_disk(res_path, function() {
                        console.log('png saved');
                    });
                }
                
                
            });
        }
        
        //test_load_scanline_filter_0_sprite_save_scanline_filter_4();
        var test_load_sprite_slf1_to_rgba_buffer_save_as_png = function() {
            // sprite_slf2
            var source_path = './source/sprite_slf1.png';
            var res_path = './res/sprite_from_rgba_from_slf1.png';
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    console.log('loaded');
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_sprite_slf1_to_rgba_buffer_save_as_png();
        
        var test_load_sprite_slf2_to_rgba_buffer_save_as_png = function() {
            // sprite_slf2
            var source_path = './source/sprite_slf2.png';
            var res_path = './res/sprite_from_rgba_from_slf2.png';
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    console.log('loaded');
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_sprite_slf2_to_rgba_buffer_save_as_png();
        
        
        var test_load_sprite_slf3_to_rgba_buffer_save_as_png = function() {
            // sprite_slf2
            var source_path = './source/sprite_slf3.png';
            var res_path = './res/sprite_from_rgba_from_slf3.png';
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    console.log('loaded');
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_sprite_slf3_to_rgba_buffer_save_as_png();
        
        var test_load_sprite_slf4_to_rgba_buffer_save_as_png = function() {
            // sprite_slf2
            var source_path = './source/sprite_slf4.png';
            var res_path = './res/sprite_from_rgba_from_slf4.png';
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    console.log('loaded');
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_sprite_slf4_to_rgba_buffer_save_as_png();
        
        var test_load_dice_to_rgba_buffer_save_as_png = function() {
            // sprite_slf2
            var source_path = './source/dice.png';
            var res_path = './res/dice_from_rgba.png';
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    console.log('loaded');
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_dice_to_rgba_buffer_save_as_png();
        
        var test_load_dice_to_rgba_buffer_save_as_png_slf1 = function() {
            // sprite_slf2
            var source_path = './source/dice.png';
            var res_path = './res/dice_slf1_from_rgba.png';
            console.log('pre load_rgba_pixel_buffer_from_disk');
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    //console.log('loaded');
                    //throw '!stop!';
                    // in the save options we want to be able to set the scanline filter.
                    //  Also, having it automatically optimizing that when saving would help.
                    //  But can set it for the whole image.
                    
                    // png.set_scanline_filter_all_rows(4);
                    
                    //jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, {'scanline_encoding': 2}, function(err, res_save) {
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, {'scanline_encoding': 1}, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_dice_to_rgba_buffer_save_as_png_slf1();
        
        var test_load_dice_to_rgba_buffer_save_as_png_slf2 = function() {
            // sprite_slf2
            var source_path = './source/dice.png';
            var res_path = './res/dice_slf2_from_rgba.png';
            console.log('pre load_rgba_pixel_buffer_from_disk');
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    //console.log('loaded');
                    //throw '!stop!';
                    // in the save options we want to be able to set the scanline filter.
                    //  Also, having it automatically optimizing that when saving would help.
                    //  But can set it for the whole image.
                    
                    // png.set_scanline_filter_all_rows(4);
                    
                    //jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, {'scanline_encoding': 2}, function(err, res_save) {
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, {'scanline_encoding': 2}, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_dice_to_rgba_buffer_save_as_png_slf2();
        
        var test_load_dice_to_rgba_buffer_save_as_png_slf3 = function() {
            // sprite_slf2
            var source_path = './source/dice.png';
            var res_path = './res/dice_slf3_from_rgba.png';
            console.log('pre load_rgba_pixel_buffer_from_disk');
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    //console.log('loaded');
                    //throw '!stop!';
                    // in the save options we want to be able to set the scanline filter.
                    //  Also, having it automatically optimizing that when saving would help.
                    //  But can set it for the whole image.
                    
                    // png.set_scanline_filter_all_rows(4);
                    
                    //jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, {'scanline_encoding': 2}, function(err, res_save) {
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, {'scanline_encoding': 3}, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_dice_to_rgba_buffer_save_as_png_slf3();
        
        
        var test_load_dice_to_rgba_buffer_save_as_png_slf4 = function() {
            // sprite_slf2
            var source_path = './source/dice.png';
            var res_path = './res/dice_slf4_from_rgba.png';
            console.log('pre load_rgba_pixel_buffer_from_disk');
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    //console.log('loaded');
                    //throw '!stop!';
                    // in the save options we want to be able to set the scanline filter.
                    //  Also, having it automatically optimizing that when saving would help.
                    //  But can set it for the whole image.
                    
                    // png.set_scanline_filter_all_rows(4);
                    
                    //jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, {'scanline_encoding': 2}, function(err, res_save) {
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, {'scanline_encoding': 4}, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_dice_to_rgba_buffer_save_as_png_slf4();
        
        var test_load_f01n2c08_to_rgba_buffer_save_as_png = function() {
            // sprite_slf2
            var source_path = './source/pngsuite/f01n2c08.png';
            var res_path = './res/f01n2c08_from_rgba.png';
            
            jsgui_png.load_rgba_pixel_buffer_from_disk(source_path, function(err, rgba_buffer) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    console.log('loaded');
                    jsgui_png.save_rgba_pixel_buffer_to_disk(rgba_buffer, res_path, function(err, res_save) {
                        if (err) {
                            throw err;
                        } else {
                            console.log('saved');
                        }
                    })
                }
            })
            
        }
        //test_load_f01n2c08_to_rgba_buffer_save_as_png();
        
        
        
        var test_load_sprite_slf0_predict_best_slfs = function() {
            var source_path = './source/sprite_slf0.png';
            //var res_path = './res/f01n2c08_from_rgba.png';
            
            // load a png.
            
            // want to analyse all scanlines to find the best filters.
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    
                    
                    console.log('loaded');
                    
                    png.ensure_unfiltered_scanlines_buffer();
                    console.log('pre analysis');
                    
                    /*
                    png.analyse_scanline_predict_best_filter(572, function(err, res_best_filter) {
                        console.log('res_best_filter ' + res_best_filter);
                    })
                    */
                    
                    // analyse_scanlines_predict_best_filters
                    png.analyse_scanlines_predict_best_filters(function(err, res_best_filters) {
                        console.log('res_best_filters ' + res_best_filters);
                    })
                }
            })
        }
        //test_load_sprite_slf0_predict_best_slfs();
        
        
        var test_load_sprite_slf0_save_opti_predict_best_slfs = function() {
            var source_path = './source/sprite_slf0.png';
            var res_path = './res/sprite_slfOpti.png';
            
            // load a png.
            // want to analyse all scanlines to find the best filters.
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    
                    
                    console.log('loaded');
                    
                    png.ensure_unfiltered_scanlines_buffer();
                    console.log('pre analysis');
                    
                    /*
                    png.analyse_scanline_predict_best_filter(572, function(err, res_best_filter) {
                        console.log('res_best_filter ' + res_best_filter);
                    })
                    */
                    
                    // analyse_scanlines_predict_best_filters
                    png.optimize_scanline_filters(function(err, res_best_filters) {
                        //console.log('res_best_filters ' + res_best_filters);
                        console.log('scanline filters have been optimized');
                        
                        png.filter_all_scanlines();
                        
                        png.save_to_disk(res_path, function(err, res_saved) {
                            console.log('saved png to ' + res_path);
                        })
                        
                    })
                }
            })
        }
        //test_load_sprite_slf0_save_opti_predict_best_slfs();
        
        
        var test_load_sprite_slf0_save_opti_predict_best_slfs = function() {
            var source_path = './source/sprite_slf0.png';
            var res_path = './res/sprite_slfOptiBest.png';
            
            // load a png.
            // want to analyse all scanlines to find the best filters.
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    
                    
                    console.log('loaded');
                    
                    png.ensure_unfiltered_scanlines_buffer();
                    console.log('pre analysis');
                    
                    /*
                    png.analyse_scanline_predict_best_filter(572, function(err, res_best_filter) {
                        console.log('res_best_filter ' + res_best_filter);
                    })
                    */
                    
                    // analyse_scanlines_predict_best_filters
                    
                    // and choose the save optimizations here.
                    
                    // lossy_best?
                    //  different optimization options.
                    
                    // will use optimize_filter_all_scanlines now that that function has been written.
                    
                    png.save_to_disk(res_path, {'optimize': 'best'}, function(err, res_saved) {
                        if (err) {
                            throw err
                        } else {
                            console.log('saved png to ' + res_path);
                        }
                        
                    })
                    
                }
            })
        }
        //test_load_sprite_slf0_save_opti_predict_best_slfs();
        
        
        
        
        var test_load_sprite_slf0_save_opti_predict_fast_slfs = function() {
            var source_path = './source/sprite_slf0.png';
            var res_path = './res/sprite_slfOptiFast.png';
            
            // load a png.
            // want to analyse all scanlines to find the best filters.
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    
                    
                    console.log('loaded');
                    
                    png.ensure_unfiltered_scanlines_buffer();
                    console.log('pre analysis');
                    
                    /*
                    png.analyse_scanline_predict_best_filter(572, function(err, res_best_filter) {
                        console.log('res_best_filter ' + res_best_filter);
                    })
                    */
                    
                    // analyse_scanlines_predict_best_filters
                    
                    // and choose the save optimizations here.
                    
                    // lossy_best?
                    //  different optimization options.
                    
                    // will use optimize_filter_all_scanlines now that that function has been written.
                    
                    png.save_to_disk(res_path, {'optimize': 'fast'}, function(err, res_saved) {
                        if (err) {
                            throw err
                        } else {
                            console.log('saved png to ' + res_path);
                        }
                        
                    })
                    
                }
            })
        }
        //test_load_sprite_slf0_save_opti_predict_fast_slfs();
        
        
        //  optimize_filter_all_scanlines is a new function that should be faster, and should be able to set all scanline filters to optimal ones,
        //  while creating the filtered scanline buffer in its entirity.
        // optimize_filter_all_scanlines
        
        var test_sprite_optimize_filter_all_scanlines = function() {
            var source_path = './source/sprite_slf0.png';
            var res_path = './res/sprite_slfOpti_filter_all_scanlines.png';
            
            // load a png.
            // want to analyse all scanlines to find the best filters.
            
            jsgui_png.load_from_disk(source_path, function(err, png) {
                if (err) {
                    throw err;
                } else {
                    // loading could be sped up a lot.
                    //  I think not having to create all those separate buffers would help a lot.
                    
                    
                    //console.log('loaded');
                    
                    png.ensure_unfiltered_scanlines_buffer();
                    //console.log('pre analysis');
                    
                    /*
                    png.analyse_scanline_predict_best_filter(572, function(err, res_best_filter) {
                        console.log('res_best_filter ' + res_best_filter);
                    })
                    */
                    
                    // analyse_scanlines_predict_best_filters
                    png.optimize_filter_all_scanlines(function(err, res_best_filters) {
                        //console.log('res_best_filters ' + res_best_filters);
                        console.log('scanline filters have been optimized and filtered');
                        
                        //png.filter_all_scanlines();
                        
                        png.save_to_disk(res_path, function(err, res_saved) {
                            console.log('saved png to ' + res_path);
                        })
                        
                    })
                }
            })
        }
        test_sprite_optimize_filter_all_scanlines();
        
        
    }
);
