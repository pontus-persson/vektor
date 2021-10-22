/**
 * Point
 */
(function(exports) {
    'use strict';
    var Point = exports.Point = function(x, y, parent) {
        this.parent = parent || null;
        this.position = new vektor.Vec2(x, y);
        this.oldPosition = new vektor.Vec2(x, y);
        // this.velocity = new vektor.Vec2();
        this.velocity = new vektor.Vec2(10 * Math.random() - 5, 10 * Math.random() - 5);
    }

    Point.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
    }
}(vektor));