/**

At Init time
    create all shaders and programs and look up locations
    create buffers and upload vertex data
    create textures and upload texture data
At Render Time
    clear and set the viewport and other global state (enable depth testing, turn on culling, etc..)
    For each thing you want to draw
        call gl.useProgram for the program needed to draw.
        setup attributes for the thing you want to draw
            for each attribute call gl.bindBuffer, gl.vertexAttribPointer, gl.enableVertexAttribArray
        setup uniforms for the thing you want to draw
            call gl.uniformXXX for each uniform
            call gl.activeTexture and gl.bindTexture to assign textures to texture units.
        call gl.drawArrays or gl.drawElements


Common Optimizations
    1)  Often you don't need to set every uniform. For example if you are drawing 10 shapes
        with the same shader and that shader takes a viewMatrix or cameraMatrix it's likely
        that viewMatrix uniform or cameraMatrix uniform is the same for every shape so just
        set it once.
    2)  You can often move the calls to gl.enableVertexAttribArray to initialization time.


 */

/**
 * on drawArrays draw type:
 * STREAM_DRAW means you are going to create it once, set it once, and use it once.
 * DYNAMIC_DRAW means you are going to create it once, change it a lot, and use it a lot.
 * STATIC_DRAW means you are going to create it once, set it once, and use it a lot.
 */

/**
 * Vektor graphics
 */
(function(exports) {
    'use strict';
    var Graphics = exports.Graphics = function(options) {
        this.options = {
            element:    options.element    || null,
            fullscreen: options.fullscreen || false,
            width:      options.width      || 640,
            height:     options.height     || 480,
            zoom:       options.zoom       || -6,
        };
        this.settings = options.settings || {};
        this.camera = {
            x: 0,
            y: 0,
            z: this.options.zoom,
        };
        // "ENUM" for shaderprograms
        this.SHADERPROGRAM = {
            SIMPLE: 1,  // simple 2d with clipspace
            MATRIX: 2,  // 2d shader with matrix transform
            TEXTURE: 3, // textured stuff
        };
        this.canvas = document.createElement('canvas');
        this.canvas2d = document.createElement('canvas');
        this.canvas.style.position = this.canvas2d.style.position = 'absolute';
        this.canvas.addEventListener('contextmenu', vektor.preventdefault); this.canvas2d.addEventListener('contextmenu', vektor.preventdefault);
        this.gl = this.initWebGL(this.canvas);
        this.ctx = this.canvas2d.getContext("2d");
        if(!this.options.fullscreen) {
            this.canvas.width = this.canvas2d.width = this.options.width;
            this.canvas.height = this.canvas2d.height = this.options.height;
        }
        this.resize();
        if (options.element) {
            this.element = document.getElementById(options.element);
        }
        this.element.appendChild(this.canvas);
        this.element.appendChild(this.canvas2d);

        this.drawEntities = [];
        this.perspectiveMatrix = null;
        this.shaders = new vektor.Shaders(this.gl);
        this.fps = 0;
        this.ticks = 0;
        this.lastUpdate = new Date();

        this.initShaders();

        this.textureInfos = [
            this.loadAndCreateTexture('assets/images/tex.png'),
            this.loadAndCreateTexture('assets/images/test_texture.png'),
            this.loadAndCreateTexture('assets/images/brick_tile.png'),
        ];
        console.log(this.textureInfos);

        // Set clear color
        this.gl.clearColor(0.1, 0.2, 0.5, 0.0);
        // Enable depth testing
        // this.gl.enable(this.gl.DEPTH_TEST);
        // Near things obscure far things
        this.gl.depthFunc(this.gl.LEQUAL);
        // Clear the color as well as the depth buffer.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        // this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        window.addEventListener('resize', this.resize.bind(this));
    }

    /**
     * Draw the things!
     */
    Graphics.prototype.drawScene = function() {
        // keep drawing
        requestAnimationFrame(this.drawScene.bind(this));

        var now = new Date();
        this.ticks++;
        if(now.getTime() - this.lastUpdate.getTime() > 1000) {
            this.fps = this.ticks;
            this.ticks = 0;
            this.lastUpdate = now;
        }

        // Clear the canvas before we start drawing on it.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


        // this.gl.useProgram(this.shaders.programs[this.SHADERPROGRAM.TEXTURE]);

        // send canvas size to shader
        // this.gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);

        // same for all calls
        this.gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
        this.gl.uniform4fv(this.uColor, [1,1,1,1]);

        for (var i = 0; i < this.drawEntities.length; i++) {
            var entity = this.drawEntities[i];

            // todo save this on entity or something? or save the textureinfo ID, should also load right program i guess
            var texinfo = this.textureInfos[0];

            this.gl.bindTexture(this.gl.TEXTURE_2D, texinfo.texture);

            // Tell WebGL to use our shader program pair
            this.gl.useProgram(this.shaders.programs[this.SHADERPROGRAM.TEXTURE]);

            // Setup the attributes to pull data from our buffers
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
            // this.gl.enableVertexAttribArray(this.aVertexPosition);
            this.gl.vertexAttribPointer(this.aVertexPosition, 2, this.gl.FLOAT, false, 0, 0);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
            // this.gl.enableVertexAttribArray(this.aTexcoord);
            this.gl.vertexAttribPointer(this.aTexcoord, 2, this.gl.FLOAT, false, 0, 0);

            // Tell the shader to get the texture from texture unit 0
            this.gl.uniform1i(this.uTexture, 0);

            // set uniforms
            if (this.settings.debug) {
                this.gl.uniform4fv(this.uColor, entity.color);
            }
            // this.gl.uniform2f(this.uTranslation, entity.vertices[0].position.x, entity.vertices[0].position.y);
            this.gl.uniform2f(this.uTranslation, entity.center.x, entity.center.y);
            this.gl.uniform2f(this.uScale, entity.w / 2, entity.h / 2);
            this.gl.uniform2f(this.uRotation, Math.sin(entity.angle), Math.cos(entity.angle));
            this.gl.uniform2f(this.uTexpos, entity.tilePosition.x*32, 0);
            this.gl.uniform2f(this.uTexsize, 32, 32);
            this.gl.uniform2f(this.uImagesize, texinfo.width, texinfo.height);

            // draw the quad (2 triangles, 6 vertices)
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }



    }

    Graphics.prototype.initWebGL = function(canvas) {
        var gl = null;
        gl = canvas.getContext('webgl', { alpha: false }) || canvas.getContext('experimental-webgl', { alpha: false });
        if (!gl) {
            throw('Unable to initialize WebGL. Your browser may not support it.');
        }
        return gl;
    }

    Graphics.prototype.initShaders = function() {
        var self = this;
        // self.shaders.loadProgram(self.SHADERPROGRAM.SIMPLE, ['../src/shaders/simple.vert', '../src/shaders/simple.frag'], function() {
        //     var program = self.shaders.programs[self.SHADERPROGRAM.SIMPLE];

        //     self.gl.useProgram(program);
        //     self.aVertexPosition = self.gl.getAttribLocation(program, "aVertexPosition");
        //     self.gl.enableVertexAttribArray(self.aVertexPosition);
        //     // self.vertexColorAttribute = self.gl.getAttribLocation(program, "aVertexColor");
        //     // self.gl.enableVertexAttribArray(self.vertexColorAttribute);

        //     self.uResolution = self.gl.getUniformLocation(program, "uResolution");
        //     self.uColor = self.gl.getUniformLocation(program, "uColor");
        //     self.uTranslation = self.gl.getUniformLocation(program, "uTranslation");
        //     self.uScale = self.gl.getUniformLocation(program, "uScale");
        //     self.uRotation = self.gl.getUniformLocation(program, "uRotation");

        //     // self.initBuffers();

        //     // start drawing
        //     // requestAnimationFrame(self.drawScene.bind(self));
        // });

        self.shaders.loadProgram(self.SHADERPROGRAM.TEXTURE, ['../src/shaders/texture.vert', '../src/shaders/texture.frag'], function() {
            var program = self.shaders.programs[self.SHADERPROGRAM.TEXTURE];

            self.gl.useProgram(program);
            self.aVertexPosition = self.gl.getAttribLocation(program, "aVertexPosition");
            self.gl.enableVertexAttribArray(self.aVertexPosition);


            self.aTexcoord = self.gl.getAttribLocation(program, 'aTexcoord');
            self.gl.enableVertexAttribArray(self.aTexcoord);
            self.gl.vertexAttribPointer(self.aTexcoord, 2, self.gl.FLOAT, false, 0, 0);

            // self.vertexColorAttribute = self.gl.getAttribLocation(program, "aVertexColor");
            // self.gl.enableVertexAttribArray(self.vertexColorAttribute);

            self.uResolution = self.gl.getUniformLocation(program, "uResolution");
            self.uColor = self.gl.getUniformLocation(program, "uColor");
            self.uTranslation = self.gl.getUniformLocation(program, "uTranslation");
            self.uScale = self.gl.getUniformLocation(program, "uScale");
            self.uRotation = self.gl.getUniformLocation(program, "uRotation");
            self.uTexpos = self.gl.getUniformLocation(program, "uTexpos");
            self.uTexsize = self.gl.getUniformLocation(program, "uTexsize");
            self.uImagesize = self.gl.getUniformLocation(program, "uImagesize");

            self.initBuffers();

            // start drawing
            setTimeout(function() {
                requestAnimationFrame(self.drawScene.bind(self));
            }, 100);
        });

    }

    Graphics.prototype.initBuffers = function () {
        this.verticesBuffer = this.gl.createBuffer();
        // Bind the position buffer.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
        var positions = [
           -1, -1,
            1, -1,
           -1,  1,
           -1,  1,
            1, -1,
            1,  1,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        this.texcoordBuffer = this.gl.createBuffer();
        // bind buffer for texture coords
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        var texcoords = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ]
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texcoords), this.gl.STATIC_DRAW);
    }

    /**
     * Called on resize event
     */
    Graphics.prototype.resize = function() {
        if(this.options.fullscreen) {
            this.canvas.width = this.canvas2d.width = window.innerWidth;
            this.canvas.height = this.canvas2d.height = window.innerHeight;
        }
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }


    // creates a texture info { width: w, height: h, texture: tex }
    // The texture will start with 1x1 pixels and be updated
    // when the image has loaded
    Graphics.prototype.loadAndCreateTexture = function(url) {
        var gl = this.gl,
            tex = gl.createTexture();

        var textureInfo = {
            // we don't know the size until it loads
            width: 1,
            height: 1,
            texture: tex,
        };
        var img = new Image();
        img.src = url;
        img.addEventListener('load', function() {
            console.log("Texture loaded: ", img);
            textureInfo.width = img.width;
            textureInfo.height = img.height;

            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            // unbind
            gl.bindTexture(gl.TEXTURE_2D, null);
        });

        return textureInfo;
    }


    /*************************************************************************
     * normal 2d canvas functions
     */
    Graphics.prototype.clear2d = function() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    Graphics.prototype.drawText = function(string, x, y) {
        this.ctx.font = '22px monospace';
        this.ctx.fillStyle = 'rgba(255,255,255,1)';
        this.ctx.fillText(string, x, y);
    }

}(vektor));