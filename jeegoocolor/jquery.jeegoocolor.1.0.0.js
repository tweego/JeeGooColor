/*!
 * Copyright (c) 2009 - 2013 Erik van den Berg (http://www.tweego.nl/jeegoocolor)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php) license.
 * Consider linking back to author's homepage: http://www.tweego.nl
 *
 * Version: 1.0.0
 * Dependencies: jQuery 1.4.2+, jeegoopopup.1.0.0+, cookie plugin.
 */
(function($){
    
    var _interval;
    var _hue = 0;
    var _selectorHue = _hue;
    
    // Drag & drop vars
    var _dragX;
    var _dragY;
    var _mouseX;
    var _mouseY;
    
    // Transform rgb object to hexadecimal color string, for example { R: 0, G: 0, B: 0 } => '000000'.
    var _rgbToHex = function(RGB){
        var rgb = [];
        for(var i in RGB)
        {
            var color = RGB[i].toString(16);
            if(color.length == 1) color = '0' + color;
            rgb.push(color);
        }
        return rgb.join('');
    };
    
    // Transform hexadecimal color string to rgb object.
    var _hexToRgb = function(hex){
        // 3 char string.
        if(hex.length == 3)
        {
            return {
                R: parseInt(hex[0] + hex[0], 16),
                G: parseInt(hex[1] + hex[1], 16),
                B: parseInt(hex[2] + hex[2], 16)
            };
        }
        else if(hex.length == 6)    // 6 char string.
        {
            return {
                R: parseInt(hex[0] + hex[1], 16),
                G: parseInt(hex[2] + hex[3], 16),
                B: parseInt(hex[4] + hex[5], 16)
            };
        }        
    };
     
    // Transform HSB object to RGB object.
    var _hsbToRgb = function(HSB){
    
        var hue = HSB.H;
        var saturation = HSB.S;
        var brightness = HSB.B;
        
        // Greyscale
        if(saturation == 0)
        {
            var red = Math.round(brightness * 255);
            return { R: red, G: red, B: red };
        }
        hue /= 60;
        if(hue == 6) hue = 0;
        var h = Math.floor(hue);
        var x = brightness * (1 - saturation);
        var y = brightness * (1 - saturation * (hue - h));
        var z = brightness * (1 - saturation * (1 - (hue - h)));
        
        var rgb;
        switch(h)
        {
            case 0:
            rgb = { R: brightness, G: z, B: x};
            break;
            case 1:
            rgb = { R: y, G: brightness, B: x};
            break;
            case 2:
            rgb = { R: x, G: brightness, B: z};
            break;
            case 3:
            rgb = { R: x, G: y, B: brightness};
            break;
            case 4:
            rgb = { R: z, G: x, B: brightness};
            break;
            default:
            rgb = { R: brightness, G: x, B: y};
            break;
        }
        return { R: Math.round(rgb.R * 255), G: Math.round(rgb.G * 255), B: Math.round(rgb.B * 255) };                        
    };
    
    // Transform RGB object to HSB object.
    var _rgbToHsb = function(RGB){
    
        var red, green, blue, hsb;
        red = RGB.R / 255;
        green = RGB.G / 255;
        blue = RGB.B / 255;
        hsb = {};

        var min = (red < green ? red : green);
        if(min > blue) min = blue;
        
        var max = (red > green ? red : green);
        if(max < blue) max = blue;
        
        var delta = max - min;
        
        // Black
        if(max == 0)
        {
            return {
                H: _hue,
                S: 0,
                B: 0
            };
        }
        else if(delta == 0) // Gray scale
        {
            return {
                H: _hue,
                S: 0,
                B: max
            };
        }
        else
        {
            hsb.S = delta / max;
            hsb.B = max;
        }
        
        // Determine hue.
        if(red == max)
        {
            hsb.H = 60 * ((green - blue) / delta);
        }
        else if(green == max)
        {
            hsb.H = 60 * (2 + (blue - red) / delta);
        }
        else
        {
            hsb.H = 60 * (4 + (red - green) / delta);
        }
        if(hsb.H < 0) hsb.H += 360;
        else if(hsb.H > 360) hsb.H %= 360;
               
        hsb.H = Math.round(hsb.H);

        return hsb;
    };
    
    var _selectHue = function(){
        // Get saturation and brightness from input fields, if not valid use the value 1.
        var saturation, brightness;
        
        if($('#jg_color_s').hasClass('jg_color_error'))
        {
            saturation = 1;
            $('#jg_color_s').removeClass('jg_color_error');
        }
        else
        {
            saturation = $('#jg_color_s').val() / 100;
        }
        
        if($('#jg_color_br').hasClass('jg_color_error'))
        {
            brightness = 1,
            $('#jg_color_br').removeClass('jg_color_error');
        }
        else
        {
            brightness = $('#jg_color_br').val() / 100;
        }
        
        _updateUI({
            H: _selectorHue,
            S: saturation,
            B: brightness
        });
    };
    
    // Update hue field.
    var _updateHue = function(){   
        var rgb = _hsbToRgb({ 
            H: _hue, 
            S: 1, 
            B: 1
        });
        $('#jg_color_hue').css('background', '#' + _rgbToHex(rgb));
    };
    
    // Update UI, color can be a hex string, hsb or rgb object.
    var _updateUI = function(color){
        var rgb, hsb, hex;
        // rgb object.
        if(color.R != undefined)
        {
            rgb = color;
            // Get hex string from rgb object.
            var hex = _rgbToHex(rgb);    
            // Get hsb object from rgb object.
            hsb = _rgbToHsb({ 
                R: color.R, 
                G: color.G, 
                B: color.B
            });
        }
        else if(color.H != undefined) // hsb object.
        {
            // Set hsb object.
            hsb = color;
            // Get rgb object from hsb object.
            rgb = _hsbToRgb({ 
                H: color.H, 
                S: color.S, 
                B: color.B
            });                 
            // Get hex string from rgb object.
            var hex = _rgbToHex(rgb);    
        }
        else // hex string. 
        {
            // Set hex string.
            hex = color;
            // Get rgb object from hex string.
            rgb = _hexToRgb(color);
            // Get hsb object from rgb object.
            hsb = _rgbToHsb({ 
                R: rgb.R, 
                G: rgb.G, 
                B: rgb.B
            });    
        }

        // Set slider position.
        $('#jg_color_pointer').css('left', hsb.H - 4 + 'px');
        // Set selector position.
        $('#jg_color_selector').css({
            left: Math.round(hsb.S * 255) - 9 + 'px',
            top: Math.round((1 - hsb.B) * 255) - 9 + 'px'
        }).show();
        // Update hue(the big) field if hue changed.
        if(hsb.H != _hue)
        {
            _hue = hsb.H;
            _updateHue();
        }
        _selectorHue = hsb.H;
        // Set preview-color field.
        $('#jg_color_preview').css('background', '#' + hex);
        // Fill text fields.
        $('#jg_color_r').val(rgb.R);
        $('#jg_color_g').val(rgb.G);
        $('#jg_color_b').val(rgb.B);
        $('#jg_color_h').val(hsb.H);
        $('#jg_color_s').val(Math.round(hsb.S * 100));
        $('#jg_color_br').val(Math.round(hsb.B * 100));
        $('#jg_color_hex').val(hex);
        // Clear error state from text fields.
        $('#jg_color_right input[type=text]').removeClass('jg_color_error');
    };
    
    var _getColor = function(color){
        if(color == undefined)color = $('#jg_color_preview').css('backgroundColor');
        if(parseInt(color, 16))return color;
        else if(/^#/.test(color))return color.replace(/^#/, '');
        else // rgb(0, 0, 0)
        {
            var colors = color.match(/\d+/g);
            if(colors && colors.length == 3)
            {
                return _rgbToHex(
                    { 
                        R: parseInt(colors[0]), 
                        G: parseInt(colors[1]), 
                        B: parseInt(colors[2]) 
                    }
                );
            }
            else return '000000';
        }
    };
    
    var _dragColor = function(e, offset){
        var saturation = (e.pageX - offset.left) / 255;
        if(saturation < 0)saturation = 0;
        else if(saturation > 1)saturation = 1;

        var brightness = 1 - (e.pageY - offset.top) / 255;
        if(brightness < 0)brightness = 0;
        else if(brightness > 1)brightness = 1;

        _updateUI({
            H: _hue,
            S: saturation,
            B: brightness
        });
    };
    
    var _dragHue = function(e, offset){
        var hue = parseInt(e.pageX - offset.left);
        if(hue < 0 || hue > 360) return;
        _selectorHue = hue;        
        _selectHue();
    };

    var _getRecentColors = function(options){
        if($.cookie)
        {
            var rcs = $.cookie(options.cookieName);
            return (rcs ? rcs.split('#') : []);
        }
        return [];
    };
    
    // Initialize the color-picker popup.
    $.jeegoocolor = function(options){

        var settings = $.extend({
            width: 419,
            height: 340,
            scrolling: 'no',
            history: 24,
            resizable: false,
            cookieName: 'jg_jeegoocolor',
            cancel: 'Cancel',
            ok: 'Ok'
        }, options || {});

        if(settings.onClose) 
            settings._orgOnClose = settings.onClose; // Save original close handler.

        settings.onClose = function(ok){ 
            _hue = 0; // Always reset hue on closing popup.
            if(settings._orgOnClose)
                settings._orgOnClose(ok);
        };      
        
        // try to retrieve recent used colors from cookie.
        var recentColors = '';
        var rcsArray = _getRecentColors(settings).reverse();
        for(var i = 0; i < rcsArray.length; i++)
        {
            if(i > settings.history) 
                break;
            recentColors += '<span style="background:#' + rcsArray[i] + '"></span>';
        }

        settings.url = undefined;
        settings.html = 
            '<div id="jg_color_huebar">' + 
                '<span id="jg_color_min"></span>' +
                '<span id="jg_color_selecthue">' +
                    '<span id="jg_color_pointer"></span>' +
                '</span>' +
                '<span id="jg_color_plus"></span>' +
            '</div>' + 
            '<div id="jg_color_left">' + 
                '<div id="jg_color_hue">' +
                    '<div id="jg_color_selector"></div>' +
                    '<div id="jg_color_black"></div>' +
                    '<div id="jg_color_white"></div>' +
                '</div>' +
                '<div id="jg_color_recent">' + 
                    recentColors + 
                '</div>' +
            '</div>' + 
            '<div id="jg_color_right">' + 
                '<div id="jg_color_preview" style="background:#000000"></div>' +
                '<div class="jg_color_row">' +
                    '<label for="jg_color_r">R:</label><input id="jg_color_r" type="text" value="0" class="jg_color_text" />' +
                    '<label for="jg_color_h">H:</label><input id="jg_color_h" type="text" value="0" class="jg_color_text" /> &#xb0;' +
                '</div>' +
                '<div class="jg_color_row">' +
                    '<label for="jg_color_g">G:</label><input id="jg_color_g" type="text" value="0" class="jg_color_text" />' +
                    '<label for="jg_color_s">S:</label><input id="jg_color_s" type="text" value="0" class="jg_color_text" /> %' +
                '</div>' +
                '<div class="jg_color_row">' + 
                    '<label for="jg_color_b">B:</label><input id="jg_color_b" type="text" value="0" class="jg_color_text" />' +
                    '<label for="jg_color_br">B:</label><input id="jg_color_br" type="text" value="0" class="jg_color_text" /> %' +
                '</div>' +
                '<div class="jg_color_row">' +
                    '<label for="jg_color_hex">#:</label><input id="jg_color_hex" type="text" value="000000" class="jg_color_text" />' +
                '</div>' +
                '<div class="jg_color_row jg_color_buttons">' +
                    '<input type="button" id="jg_color_cancel" value="' + settings.cancel + '" />' +
                    '<input type="button" id="jg_color_ok" value="' + settings.ok + '" />' +
                '</div>';
            '</div>' + 
            '<div class="clear:both"></div>';
        
        setTimeout(function(){
            $.jeegoopopup.open(settings);
        
            // Initialize with color if present.
            if(settings && settings.color)
            {
                _updateUI(_getColor(settings.color));
            }
        
            // Click and drag over color field.   
            $('#jg_color_hue').unbind().mousedown(function(e){
                var offset = $(this).offset();
                _dragColor(e, offset);
            
                $(document).bind('mousemove.jg_color_color', function(e){
                    _dragColor(e, offset);
                }).bind('mouseup.jg_color_color', function(e){
                    $(this).unbind('.jg_color_color');
                }); 
            });
        
            $('#jg_color_min').unbind().mousedown(function(e){
                $(this).addClass('jg_color_pressed');
                _interval = window.setInterval(function(){
                    _selectorHue--;
                    if(_selectorHue < 0) _selectorHue = 0;              
                    _selectHue();
                }, 40);       
            }).bind('mouseup mouseleave', function(e){
                $(this).removeClass('jg_color_pressed');
                window.clearInterval(_interval);
            });
        
            $('#jg_color_plus').unbind().mousedown(function(e){
                $(this).addClass('jg_color_pressed');
                _interval = window.setInterval(function(){
                    _selectorHue++;
                    if(_selectorHue > 360) _selectorHue = 360;
                    _selectHue();
                }, 40);
            }).bind('mouseup mouseleave', function(e){
                $(this).removeClass('jg_color_pressed');
                window.clearInterval(_interval);
            });
        
            // Click and drag over hue bar.
            $('#jg_color_selecthue').unbind().mousedown(function(e){
                var offset = $(this).offset();
                _dragHue(e, offset);
            
                $(document).bind('mousemove.jg_color_hue', function(e){
                    _dragHue(e, offset);
                }).bind('mouseup.jg_color_hue', function(e){
                    $(this).unbind('.jg_color_hue');
                }); 
            });
            
            // Manually edit color fields.
            $('div.jg_color_row input[type=text]').unbind().keyup(function(e){
        
                var id = $(this).attr('id');
            
                // RGB field, use rgb object to update UI.
                if(id == 'jg_color_r' || id == 'jg_color_g' || id == 'jg_color_b')
                {
                    // Validate RGB fields.
                    var error = false;
                
                    var red = parseInt($('#jg_color_r').val());
                    if(isNaN(red) || red < 0 || red > 255)
                    {
                        error = true;
                        $('#jg_color_r').addClass('jg_color_error');
                    }
                    else
                    {
                        $('#jg_color_r').removeClass('jg_color_error');
                    }

                    var green = parseInt($('#jg_color_g').val());
                    if(isNaN(green) || green < 0 || green > 255)
                    {
                        error = true;
                        $('#jg_color_g').addClass('jg_color_error');
                    }
                    else
                    {
                        $('#jg_color_g').removeClass('jg_color_error');
                    }

                    var blue = parseInt($('#jg_color_b').val());
                    if(isNaN(blue) || blue < 0 || blue > 255)
                    {
                        error = true;
                        $('#jg_color_b').addClass('jg_color_error');
                    }
                    else
                    {
                        $('#jg_color_b').removeClass('jg_color_error');
                    }
                
                    if(error)return false;
            
                    _updateUI({
                        R: red,
                        G: green,
                        B: blue
                    });        
                }
                else if(id == 'jg_color_hex') // Hex field
                {
                    // Validate hex field.
                    var value = $('#jg_color_hex').val();
                    var fieldLength = value.length;
                    var error = false;
                    
                    if(fieldLength == 3)
                    {
                        if(isNaN(parseInt(value[0], 16)) || isNaN(parseInt(value[1], 16)) || isNaN(parseInt(value[2], 16)))
                            error = true;
                    }
                    else if(fieldLength == 6)
                    {
                        if(isNaN(parseInt(value[0] + value[1], 16)) || isNaN(parseInt(value[2] + value[3], 16)) || isNaN(parseInt(value[4] + value[5], 16)))
                            error = true;
                    }
                    else
                    {
                        error = true;
                    }

                    if(error)
                    {
                        $('#jg_color_hex').addClass('jg_color_error');
                        return false;
                    }
                    else
                    {
                        // Validation succeeded, update UI.
                        _updateUI($(this).val());
                    }
                }
                else // HSB field
                {
                    // Validate HSB fields.
                    var error = false;
                
                    var hue = parseInt($('#jg_color_h').val());
                    if(isNaN(hue) || hue < 0 || hue > 360)
                    {
                        error = true;
                        $('#jg_color_h').addClass('jg_color_error');
                    }
                    else
                    {
                        $('#jg_color_h').removeClass('jg_color_error');
                    }

                    var saturation = parseInt($('#jg_color_s').val());
                    if(isNaN(saturation) || saturation < 0 || saturation > 100)
                    {
                        error = true;
                        $('#jg_color_s').addClass('jg_color_error');
                    }
                    else
                    {
                        $('#jg_color_s').removeClass('jg_color_error');
                    }

                    var brightness = parseInt($('#jg_color_br').val());
                    if(isNaN(brightness) || brightness < 0 || brightness > 100)
                    {
                        error = true;
                        $('#jg_color_br').addClass('jg_color_error');
                    }
                    else
                    {
                        $('#jg_color_br').removeClass('jg_color_error');
                    }
                
                    if(error)return false;
                
                    // Validation succeeded, update UI.
                    _updateUI({
                        H: hue,
                        S: saturation / 100,
                        B: brightness / 100
                    });
                }
            });
        
            // Pick color from history.
            $('#jg_color_recent span').unbind().click(function(){
                _updateUI(_getColor($(this).css('backgroundColor')));
            });

            // Cancel/close color picker.
            $('#jg_color_cancel').unbind().click(function(e){
                _hue = 0;
                $.jeegoopopup.close();
            });
            
            // Pick a color.
            $('#jg_color_ok').unbind().click(function(e){
                $.jeegoopopup.close(true);
                _hue = 0;
                if(settings && settings.onPick)
                {
                    var color = _getColor();
                    if($.cookie)
                    {
                        var recentColors = _getRecentColors(settings);
                  
                        recentColors.reverse();
                        var colorPresent = false;
                        for(var i = 0; i < recentColors.length; i++)
                        {
                            if(i < settings.history)
                            {
                                if(recentColors[i] == color)
                                {
                                    colorPresent = true;
                                    break;
                                }
                            }
                            else break;
                        }
                        recentColors.reverse();
                        
                        if(!colorPresent)recentColors.push(color);

                        $.cookie(settings.cookieName, recentColors.reverse().slice(0, settings.history).reverse().join('#'));
                    }

                    settings.onPick(color);
                }
            });
        }, 0);
    };  
})(jQuery);