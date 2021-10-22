/**
 * Line
 */
(function(exports) {
    'use strict';
    var Line = exports.Line = function(p1, p2, parent) {
        this.p1 = p1;
        this.p2 = p2;
        this.parent = parent || null;
        // The wanted edge length
        this.len = new vektor.Vec2(p2.position.x - p1.position.x, p2.position.y - p1.position.y).len();
    }
    Line.prototype.update = function() {
        var current = new vektor.Vec2(this.p2.position.x - this.p1.position.x, this.p2.position.y - this.p1.position.y);
        var len = current.len();
        var diff = len - this.len;
        // normalize using calculated length
        current.div(len);

        // push vertecies half the difference each
        this.p1.position.x += current.x*diff*0.5;
        this.p1.position.y += current.y*diff*0.5;
        this.p2.position.x -= current.x*diff*0.5;
        this.p2.position.y -= current.y*diff*0.5;


        // var dx = this.p1.x - this.p0.x;
        // var dy = this.p1.y - this.p0.y;

        // // using square root approximation

        // var delta = this.dist / ((dx * dx + dy * dy) + this.dist) - 0.5;

        // dx *= delta;
        // dy *= delta;

        // this.p1.x += dx;
        // this.p1.y += dy;
        // this.p0.x -= dx;
        // this.p0.y -= dy;

    }
    Line.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.p1.position.x, this.p1.position.y);
        ctx.lineTo(this.p2.position.x, this.p2.position.y);
        ctx.closePath();
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
    }
}(vektor));