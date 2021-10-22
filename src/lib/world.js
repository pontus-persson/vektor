/**
 * World
 */
(function(exports) {
    'use strict';
    var World = exports.World = function(settings) {
        this.settings = settings.settings || {}; // todo: add defaults?

        this.size = {
          w: 100,
          h: 100,
        };

        // Collision grid
        this.grid = {
          startx: 0,
          starty: 0,
          stopx: 1,
          stopy: 1,
          gridw: 36,
          gridh: 36,
          items: {},
        };

        this.maps = [];
        this.map = {};
    };

    World.prototype.sortEntities = function(entities) {
      // todo: can make this more effective...
      for (var i = 0; i < entities.length; i++) {
          var entity = entities[i];
          var c = entity.center;
          var centergridx = Math.round(c.x / this.grid.gridw), startx = centergridx-1, stopx = centergridx+1;
          var centergridy = Math.round(c.y / this.grid.gridh), starty = centergridy-1, stopy = centergridy+1;
          // saving the gridbounds for some reason?
          this.grid.startx = Math.min(startx, this.grid.startx);
          this.grid.starty = Math.min(starty, this.grid.starty);
          this.grid.stopx  = Math.min(stopx, this.grid.stopx);
          this.grid.stopy  = Math.min(stopy, this.grid.stopy);
          for (var x = startx; x <= stopx; x++) {
              for (var y = starty; y <= stopy; y++) {
                  if(!this.grid.items[x]) { this.grid.items[x] = {}; }
                  if(!this.grid.items[x][y]) { this.grid.items[x][y] = []; }
                  if(!vektor.arrContains(this.grid.items[x][y], entity)) {
                      this.grid.items[x][y].push(entity);
                  }
              }
          }
      }
    };

    /**
     * Resolve collision between entities
     */
    World.prototype.resolveEntities = function() {
        for (var x in this.grid.items) {
            for (var y in this.grid.items[x]) {
                for (var i = 0; i < this.grid.items[x][y].length; i++) {
                    var entity = this.grid.items[x][y][i];
                    for (var j = i+1; j < this.grid.items[x][y].length; j++) {
                        var entity2 = this.grid.items[x][y][j];
                        if(entity.body.active || entity2.body.active) {
                          this.settings.collisionChecks++;
                          var result = entity.body.collide(entity2.body);
                        }
                    }
                }
                this.grid.items[x][y] = [];
            }
        }
    };

    World.prototype.draw = function(ctx) {
    };

    // load and init map from url
    World.prototype.loadMap = function(url) {
      var self = this;
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'json';
      request.onreadystatechange = function() {
          if (request.readyState == 4) {
              if (request.status == 200) {
                  var map = request.response;
                  self.maps.push(map);
                  var index = self.maps.length - 1;
                  // todo: some error handling on map etc
                  self.setMap(index);
              }
          }
      }
      request.send(null);
    };

    // Initiate all statuses and objects of a already loaded map
    World.prototype.setMap = function(index) {
        var map = this.maps[index];
        this.map = {
            w: map.width,
            h: map.height,
            tilew: map.tilewidth,
            tileh: map.tileheight,
        };
        console.log(map);
        this.map.objects = [];
        for (var l = 0; l < map.layers.length; l++) {
            var layer = map.layers[l];
            if (layer.type == 'objectgroup') {
                for (var o = 0; o < layer.objects.length; o++) {
                    var object = layer.objects[o];
                    this.map.objects.push(object);
                    console.log(object);
                }
            }
            this.setObjectGrid()
        }
        console.log(this.map);
    };


    World.prototype.setObjectGrid = function(index) {
        this.map.objectGrid = {};
        for (var i = 0; i < this.map.objects.length; i++) {
            var object = this.map.objects[i];
            for (var x = object.x; x < object.x + object.w; x++) {
                // var element = array[x];

            }

        }
    };


}(vektor));