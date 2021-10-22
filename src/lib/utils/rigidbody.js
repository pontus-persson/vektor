/*
    RBD objects can be active or passive.
        Active objects are affected by forces and collisions.
        Passive objects can be collided with by active objects, but don’t move, and are not affected by forces.
*/

/**
 * Rigidbody
 */
(function(exports) {
    'use strict';
    var Rigidbody = exports.Rigidbody = function(parent) {
        this.parent = parent || null;
        this.mass = 0;
        this.active = true;
        this.solid = false; // determine how interaction works on collision
    };

    // draw the things / debug
    Rigidbody.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillStyle = 'rgba('+(this.parent.color[0])+', '+(this.parent.color[1])+', '+(this.parent.color[2])+', '+this.parent.color[3]+')';
        ctx.moveTo(this.vertices[0].position.x, this.vertices[0].position.y);
        for (var i = 1; i < this.vertices.length; i++) {
            var point = this.vertices[i];
            ctx.lineTo(point.position.x, point.position.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
    };


    // Accellerate all points
    Rigidbody.prototype.accelerate = function(canvas) {
        var totalvel = 0;
        for (var i = 0; i < this.vertices.length; i++) {
            var p = this.vertices[i],
                vx = (p.position.x - p.oldPosition.x) * this.parent.settings.airFriction,
                vy = (p.position.y - p.oldPosition.y) * this.parent.settings.airFriction;

            // Activate if we have some relevant velocity
            if(!this.active) {
                if(Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
                    // console.log('tofast: ' + vx + ' ' + vy);
                    this.active = true;
                } else {
                    // console.log('continue: ' + vx + ' ' + vy);
                    continue;
                }
            }

            p.oldPosition.x = p.position.x;
            p.oldPosition.y = p.position.y;

            p.position.x += vx;
            p.position.y += vy + this.parent.settings.gravity;

            totalvel += Math.abs(vx);
            totalvel += Math.abs(vy);

            p.velocity.x = 0;
            p.velocity.y = 0;

            // todo: limit to worldbounds?
            if(p.position.x < 0) p.position.x = Math.random();
            if(p.position.y < 0) p.position.y = Math.random();
            if(p.position.x > canvas.width) p.position.x = canvas.width;
            if(p.position.y > canvas.height) {
                // console.log('bottom ', (p.position.y - canvas.height),  (p.position.x - p.oldPosition.x));
                p.position.x -= (p.position.x - p.oldPosition.x)  * this.parent.settings.groundFriction;
                p.position.y = canvas.height;
            }
        }

        // vektor.logsec(totalvel);
        if(this.active && totalvel < 0.1) {
            // console.log('toslow: ' + totalvel);
            for (var i = 0; i < this.vertices.length; i++) {
                var p = this.vertices[i];
                p.velocity.x = 0;
                p.velocity.y = 0;
            }
            this.active = false;
        }
    };


    Rigidbody.prototype.calculateCenter = function() {
        var minX = 99999.0, minY = 99999.0, maxX = -99999.0, maxY = -99999.0;
        for (var i = 0; i < this.vertices.length; i++) {
            var p = this.vertices[i].position;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
        }
       // todo: save bounding box for something cool? check before polygon intersection??
        this.parent.center.set(
            (maxX + minX) * 0.5,
            (maxY + minY) * 0.5
        );

        this.parent.color = [1.0, 1.0, 1.0, 1.0];
        if (!this.active) {
            this.parent.color = [0.5, 0.5, 0.5, 0.5];
        }

        // angle between first vertices
        this.parent.angle = 0.785398 + Math.atan2(
             -(this.vertices[0].position.y - this.vertices[2].position.y),
             (this.vertices[0].position.x - this.vertices[2].position.x)
        );
    };

    Rigidbody.prototype.updateLines = function() {
        // if(!this.active) return;
        for (var i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            line.update();
        }
    };

    Rigidbody.prototype.collide = function(that) {
        // only atleast one active entity to collide
        if(!this.active && !that.active) return false;

        // Initialize the length of the collision vector to a relatively large value
        var mindist = 99999, collisionInfo = {};
        for (var i = 0; i < this.lineCount + that.lineCount; i++) {
            var line = (i < this.lineCount) ? this.lines[i] : that.lines[i - this.lineCount];
            var axis = new vektor.Vec2(line.p1.position.y - line.p2.position.y, line.p2.position.x - line.p1.position.x);
            axis.normalize();
            var minmaxA = this.projectToAxis(axis);
            var minmaxB = that.projectToAxis(axis);
            var distance = (minmaxA.min < minmaxB.min) ? minmaxB.min - minmaxA.max : minmaxA.min - minmaxB.max;
            //If the intervals don't overlap, return, since there is no collision
            if(distance > 0) {
                return false;
            } else if(Math.abs(distance) < mindist) {
                mindist = Math.abs(distance);
                collisionInfo.axis = axis;
                collisionInfo.line = line;
            }
        }
        collisionInfo.depth = Math.min(mindist, 7); // todo, limiting this seems to fix some strange behaviour, but is it good
        collisionInfo.vec = new vektor.Vec2();

        // if (Math.abs(collisionInfo.depth) < 0.1) {
        //     return false;
        // }

        // console.log(collisionInfo.depth);
        // collisionInfo.line.draw(vektor.graphics.ctx, 'rgba(255, 0, 255, 1)');
        // console.log(collisionInfo.line);

        var b1, b2;
        if (collisionInfo.line.parent === that) {
            b1 = this;
            b2 = that;
        } else {
            b1 = that;
            b2 = this;
        }

        var c = new vektor.Vec2();
        var sign = c.setSub(b1.parent.center, b2.parent.center).dot(collisionInfo.axis);

        if (sign < 0) collisionInfo.axis.invert();

        var smallestDist = 99999, v, dist;
        for (var i = 0; i < b1.vertices.length; i++) {
            // Measure the distance of the vertex from the line using the line equation
            v = b1.vertices[i];
            collisionInfo.vec.setSub(v.position, b2.parent.center);
            dist = collisionInfo.axis.dot(collisionInfo.vec);

            // Set the smallest distance and the collision vertex
            if (dist < smallestDist) {
                smallestDist = dist;
                collisionInfo.vertex = v;
            }
        }

        this.active = true;
        that.active = true;

        b1.parent.color = [1.0, 0.0, 0.0, 1.0];
        b2.parent.color = [0.0, 1.0, 0.0, 1.0];

        this.doCollision(collisionInfo);

        return true;
    };

    Rigidbody.prototype.doCollision = function(collisionInfo) {
        var collisionvec = new vektor.Vec2(collisionInfo.axis.x * collisionInfo.depth,
                                           collisionInfo.axis.y * collisionInfo.depth);
        var v1 = collisionInfo.line.p1.position,
            v2 = collisionInfo.line.p2.position,
            l1 = collisionInfo.line.p1.oldPosition,
            l2 = collisionInfo.line.p2.oldPosition,
            vp = collisionInfo.vertex.position,
            vo = collisionInfo.vertex.oldPosition;
        // mass coefficient
        var m1 = collisionInfo.vertex.parent.mass,
            m2 = collisionInfo.line.parent.mass,
            tm = (m1 + m2);
            m1 /= tm;
            m2 /= tm;

        // vektor.logsec(m1, m2);

        var t;
        if(Math.abs(v1.x - v2.x) > Math.abs(v1.y - v2.y)) {
            t = (collisionInfo.vertex.position.x - collisionvec.x - v1.x) / (v2.x - v1.x);
        } else {
            t = (collisionInfo.vertex.position.y - collisionvec.y - v1.y) / (v2.y - v1.y);
        }
        var lambda = 1.0 / (t*t + (1 - t)*(1 - t));

        v1.x -= collisionvec.x*(1 - t)*0.5*lambda*m1;
        v1.y -= collisionvec.y*(1 - t)*0.5*lambda*m1;
        v2.x -= collisionvec.x*     t *0.5*lambda*m1;
        v2.y -= collisionvec.y*     t *0.5*lambda*m1;

        vp.x += collisionvec.x*0.5*m2;
        vp.y += collisionvec.y*0.5*m2;


        // if (this.settings.settings.debug) {
        //     var l = collisionvec.len();
        //     collisionvec.addVec(collisionInfo.vertex.position).draw(this.graphics.ctx, l);
        // }

        //
        // collision friction
        //

        // compute relative velocity
        var relVel = new vektor.Vec2(
            vp.x - vo.x - (v1.x + v2.x - l1.x - l2.x) * 0.5,
            vp.y - vo.y - (v1.y + v2.y - l1.y - l2.y) * 0.5
        );

        // axis perpendicular
        var tangent = new vektor.Vec2();
        tangent.perp(collisionInfo.axis)

        // project the relative velocity onto tangent
        var relTv = relVel.dot(tangent);
        var rt = new vektor.Vec2(
            tangent.x * relTv,
            tangent.y * relTv
        );

        // apply tangent friction
        vo.x += rt.x*0.95*m2;
        vo.y += rt.y*0.95*m2;

        l1.x -= rt.x*(1-t)*0.95*lambda*m1;
        l1.y -= rt.y*(1-t)*0.95*lambda*m1;
        l2.x -= rt.x*   t *0.95*lambda*m1;
        l2.y -= rt.y*   t *0.95*lambda*m1;
    };

    // project to 1d
    Rigidbody.prototype.projectToAxis = function(axis) {
        var dp = axis.dot(this.vertices[0].position);
        var ret = {
            min: dp,
            max: dp,
        };
        for (var i = 1; i < this.vertices.length; i++) {
            dp = axis.x * this.vertices[i].position.x + axis.y * this.vertices[i].position.y;
            ret.min = Math.min(dp, ret.min);
            ret.max = Math.max(dp, ret.max);
        }
        return ret;
    };

    // generate rectangle verts
    Rigidbody.prototype.generateRectangle = function(x, y, w, h) {
        this.vertices = [
            new vektor.Point(x,   y  , this),
            new vektor.Point(x,   y+h, this),
            new vektor.Point(x+w, y+h, this),
            new vektor.Point(x+w, y  , this),
        ];
        this.lines = [
            new vektor.Line(this.vertices[0],this.vertices[1], this),
            new vektor.Line(this.vertices[1],this.vertices[2], this),
            new vektor.Line(this.vertices[2],this.vertices[3], this),
            new vektor.Line(this.vertices[3],this.vertices[0], this),

            new vektor.Line(this.vertices[0],this.vertices[2], this),
            new vektor.Line(this.vertices[1],this.vertices[3], this),
        ];
        this.lineCount = 4; // Lines to calculate collision for
        this.mass = (w*h);
    };

    // generate circle verts
    Rigidbody.prototype.generateCircle = function(x, y, r, steps) {
        this.vertices = [];
        this.lines = [];
        var i = 0;
        for (var a = 0; a < 360; a += 360 / steps) {
            var heading = a * (Math.PI / 180);
            this.vertices.push(new vektor.Point(x+Math.cos(heading)*r, y+Math.sin(heading)*r, this));
            if (i > 0) {
                this.lines.push(new vektor.Line(this.vertices[i-1], this.vertices[i], this));
            }
            i++;
        }
        this.lines.push(new vektor.Line(this.vertices[i-1], this.vertices[0], this));
        this.lineCount = i; // Lines to calculate collision for
        for (var j = 0; j < i; j++) {
            var c = (j + (i/2)) % i;
            this.lines.push(new vektor.Line(this.vertices[j], this.vertices[c], this));
        }
        this.mass = Math.PI * (r * r);
    };

}(vektor));