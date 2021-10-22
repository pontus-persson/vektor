/**
 * Polygon
 */
(function(exports) {
    'use strict';
    var Polygon = exports.Polygon = function(x, y, parent) {
        this.parent = parent || null;

        this.asd = 123;
        console.log('Polygon');
    }

    Polygon.prototype.draw = function(ctx) {
    }
}(vektor));