/**
 * Should handle loading of shaders and holding programs
 */
(function(exports) {
    'use strict';
    var Shaders = exports.Shaders = function(gl) {
        var self = this;
        // refrence to relevant GL object
        this.gl = gl;
        // holds our complete programs
        this.programs = [];
    }

    Shaders.prototype.loadProgram = function(position, urls, callback) {
        var numUrls = urls.length;
        var complete = 0;
        var self = this;

        // Create the shader program
        this.programs[position] = this.gl.createProgram();

        function partialCallback(shader) {
            complete++;
            self.gl.attachShader(self.programs[position], shader);
            // everything is loaded
            if(complete >= numUrls) {
                self.gl.linkProgram(self.programs[position]);
                // If creating the shader program failed, alert
                if (!self.gl.getProgramParameter(self.programs[position], self.gl.LINK_STATUS)) {
                    throw("Unable to initialize the shader program: " + self.gl.getProgramInfoLog(shader));
                }
                callback();
            }
        }

        for (var i = 0; i < numUrls; i++) {
            this.loadShader(urls[i], partialCallback);
        }
    }


    Shaders.prototype.loadShader = function(url, callback) {
        var request = new XMLHttpRequest();
        var type = null;
        var gl = this.gl;

        // try to pick a shadertype from filename
        if(url.indexOf('.vert') !== -1) { // todo: more common shader filetypes
            type = this.gl.VERTEX_SHADER;
        } else if(url.indexOf('.frag') !== -1) {
            type = this.gl.FRAGMENT_SHADER;
        } else {
            throw("Could not determine shadertype for shader: "+urls[i]);
        }

        request.open('GET', url, true);
        // Hook the event that gets called as the request progresses
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    var source = request.responseText;
                    var shader = gl.createShader(type);

                    // Send the source to the shader object
                    gl.shaderSource(shader, source);

                    // Compile the shader program
                    gl.compileShader(shader);

                    // See if it compiled successfully
                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                        throw("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
                    }
                    callback(shader);
                } else {
                    // Failed
                    throw("Could not load shader "+urls[i]);
                }
            }
        };
        request.send(null);
    }

})(vektor);