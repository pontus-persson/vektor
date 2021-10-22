/**
 * Entity
 */
(function(exports) {
    'use strict';
    var Entity = exports.Entity = function(x, y, w, h, settings) {
        this.settings = settings || {};

        this.w = w;
        this.h = h;
        this.center = new vektor.Vec2();
        this.angle = 0;

        // position on image of tile
        this.tilePosition = {
            // x: Math.round(Math.random()),
            x: 0,
            y: 0
        }

        // rgba
        this.color = [1.0, 1.0, 1.0, 1.0];

        this.body = new vektor.Rigidbody(this);
        if (Math.random() < 1) {
            this.body.generateRectangle(x, y, w, h);
        } else {
            this.body.generateCircle(x, y, (w+h)/2, 20);
        }
    };


    Entity.prototype.draw = function(ctx) {
        this.body.draw(ctx);
    };

}(vektor));