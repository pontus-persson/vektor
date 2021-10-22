function start() {
    // global settings
    var settings = {
        gravity: 0.0,
        airFriction: 0.98,
        groundFriction: 0.3,
        debug: false,
        collisionChecks: 0,
        gameStatus: 0,
        dt: 0,
        targetdt: 1000/60, // run logic 60 times a second
    };

    var graphics = new vektor.Graphics({
        element: 'display',
        fullscreen: true,

        zoom: -400,
        settings: settings,
    });

    var input = new vektor.Input({
        settings: settings,
    });

    var world = new vektor.World({
        settings: settings,
    });

    world.loadMap('assets/maps/untitled.json');

    var entities = [];

    // graphics.loadImage('texture', 'assets/images/tex.png');

    for (var i = 0; i < 1; i++) {
        var s = 30 + Math.random() * 20;
        var entity = new vektor.Entity(Math.random() * graphics.canvas.width, Math.random() * graphics.canvas.height, s, s, settings);
        entities.push(entity);
        graphics.drawEntities.push(entity);
    }

    setInterval(update, 16);

    var steps = 5;
    var fps = 0, now = null, ticks = 0, lastUpdate = window.performance.now(), lastFps = window.performance.now();
    var pressed = false;

    function update() {
        lastUpdate = now;
        now = window.performance.now(); // time update started
        settings.dt = (now - lastUpdate) * 0.001; // settings.dt is time passed since last update in seconds
        ticks++;
        if(now - lastFps > 1000) {
            fps = ticks;
            ticks = 0;
            lastFps = now;

            if(fps > 62 && steps < 5) {
                steps++;
            }
            if(fps < 60 && steps > 3) {
                steps--;
            }
            // console.log(settings.dt, steps);
            // console.log(settings.dt, settings.targetdt, steps);
        }

        // need to manually update controllers :(
        input.gamepadUpdate();
        var axis1 = input.gamepadGetAxis(1);
        var axis2 = input.gamepadGetAxis(2);

        // console.log("axes: %a, %a", input.gamepadGetAxis(1), input.gamepadGetAxis(2));
        // console.log("controller: ", input.controllers[0]);
        for (var b = 0; b < 16; b++) {
            var but = input.gamepadGetButton(b);
            if (but) {
                console.log('button '+b+' pressed! '+but);
            }
        }

        if(input.isButtonPressed('left')) {
            entities[0].body.vertices[0].position.x = input.mouse.x;
            entities[0].body.vertices[0].position.y = input.mouse.y;
        }

        if(input.isButtonPressed('right') && !pressed) {
            pressed = true;
            setTimeout(function() {
                pressed = false;
            }, 50);
            var s = 30 + Math.random() * 30;
            var entity = new vektor.Entity(input.mouse.x, input.mouse.y, s, s, settings);
            entities.push(entity);
            graphics.drawEntities.push(entity);
        }

        if(input.isKeyPressed('insert')) {
            settings.debug = true;
        } else if(input.isKeyPressed('delete')) {
            settings.debug = false;
        }

        if(input.isKeyPressed('1')) {
            settings.gameStatus = 0;
        } else if(input.isKeyPressed('2')) {
            settings.gameStatus = 1;
        }

        if(input.isKeyPressed('+')) {
            graphics.camera.zoom++;
        } else if(input.isKeyPressed('-')) {
            graphics.camera.zoom--;
        }

        if(input.isKeyPressed('w')) {
            graphics.camera.y--;
        } else if(input.isKeyPressed('s')) {
            graphics.camera.y++;
        }
        if(input.isKeyPressed('a')) {
            graphics.camera.x--;
        } else if(input.isKeyPressed('d')) {
            graphics.camera.x++;
        }

        // if(settings.gameStatus == 0) {
        // }
        graphics.clear2d();
        graphics.drawText(input.mouse.x+','+input.mouse.y, 5, 20);
        graphics.drawText('colcheck:'+settings.collisionChecks, 5, 40);
        // graphics.drawText(graphics.canvas2d.width+','+graphics.canvas2d.height, 5, graphics.canvas2d.height-5);
        graphics.drawText(' drawfps:'+graphics.fps, graphics.canvas2d.width-160, 20);
        graphics.drawText('logicfps:'+fps, graphics.canvas2d.width-160, 40);

        if(settings.gameStatus == 1) {
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                entity.draw(graphics.ctx);
            }
        }

        if (settings.debug) {
            // graphics.ctx.save();
            // graphics.ctx.translate(graphics.canvas2d.width/2, graphics.canvas2d.height/2);
            // entities[0].lines[entities[0].lines.length-1].draw(graphics.ctx);
            // graphics.ctx.restore();
            // for (var i = 0; i < entities.length; i++) {
            //     var entity = entities[i];
            //     entity.draw(graphics.ctx);
            // }
        }

        /**
         * This should be the order to do things:
         *  1. Apply forces to velocity, like gravity etc
         *  2.
         *  3.
         */

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            entity.body.accelerate(graphics.canvas);
        }

        // do this in steps to increase accuracy
        for(var s = 0; s < steps; s++) {
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                // constraints
                entity.body.updateLines()
                // recalc center and bounding box
                entity.body.calculateCenter();
            }
            // collision
            settings.collisionChecks = 0;
            var start = window.performance.now();
            world.sortEntities(entities);
            world.resolveEntities();
            var time = window.performance.now() - start;
            // vektor.logsec('entities:'+entities.length+' colchecks:'+settings.collisionChecks+' time: '+time+'ms');

            // settings.collisionChecks = 0;
            // var start = window.performance.now();
            // for (var i = 0; i < entities.length; i++) {
            //     var entity = entities[i];
            //     for (var j = i+1; j < entities.length; j++) {
            //         settings.collisionChecks++;
            //         var entity2 = entities[j];
            //         var result = entity.collide(entity2);
            //     }
            // }
            // var time = window.performance.now() - start;
            // vektor.logsec('entities:'+entities.length+' colchecks:'+settings.collisionChecks+' time: '+time+'ms');

        }

    }
}

