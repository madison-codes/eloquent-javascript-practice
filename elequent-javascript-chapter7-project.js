// Virtual echosystem

// square = space
// term = time

// plan = an array of strings that lays out the world's grid using one character per square
// SET UP VECTOR WITH COORDINATE PAIRS


function Vector(x, y) {
  this.x = x;
  this.y = y;
}

// ??What does other referring to?
// ??Am I creating a new vector?
// ?? have we defined plus or is that a predefined method?

Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

// DEFINE GRID OBJECT

function Grid (width, height) {
  this.space = new Array(width * height)
  this.width = width
  this.height = height
}

// WRAPPING WORLD ELEMENT - GRID
Grid.prototype.isInside = function (vector) {
  return vector.x >= 0 && vector.x < this.width &&
  vector.y >= 0 && vector.y < this.height;
};

Grid.prototype.get = function(vector) {
  return this.space[vector.x + this.width * vector.y];
};

Grid.prototype.set = function(vector, value) {
  this.space[vector.x + this.width * vector.y] = value;
};

// each critter object has an act method that returns an action
// action is an object with a type property which names a type of action
// when act method is called it is given a view object

// SETTING UP DIRECTION NAMES

var directions = {
  'n': new Vector(0, -1),
  'ne': new Vector(1, -1),
  'e': new Vector(1, 0),
  'se': new Vector(1, 1),
  's': new Vector(0, 1),
  'sw': new Vector(-1, 1),
  'w': new Vector(-1, 0),
  'nn': new Vector(-1, -1),
};

// view object has a method,  look, that takes direction and returns a character
// methods - find (returns a direction in which character can be found)& findAll (returns array returning all directions of character(that character can move in))- both take map character as argument

// CREATE STUPID CRITTER

// why is array only sometimes capitalized?
function randomElement (array) {
  return array[Math.floor(Math.random() * array.length)];
}

// what does .split do?
var directionNames = 'n ne e se s sw w nw'.split('');

function BouncingCritter() {
  this.direction = randomElement(directionNames);
};

// what does '.act' do? action?
// why does it describe 's'??

BouncingCritter.prototype.act = function(view) {
  if (view.look(this.direction) ! = '')
    this.direction = view.find('') || 's';
  return {type: 'move', direction: this.direction};
};

// CONSTRUCT WORLD

// constructor takes plan (array of strings (representing the grid) and a legend)

// create element of right type & add originChar property to mae it easy to find which character it was created from
function elementFromChar(legend, ch) {
  if (ch == '')
    return null;
  var element = new legend[ch]();
  element.originChar = ch;
  return element;
}

function World(map, legend) {
  var grid = new Grid(map[0].length, map.length);
  this.grid = grid;
  this.legend = legend;

  map.forEach(function(line, y) {
    for (var x = 0; x < line.length; x++)
      grid.set(new Vector(x, y),
            elementFromChar(legend, line[x]));
  });
}

// CREATE WALL

function Wall() {}

// CREATE NEW WORLD

var world = new World(plan, {'#': Wall, 'o': BouncingCritter});

// MAKE THE GRID 'THIS' GLOBAL

// var test = {
//   prop: 10,
//   addPropTo: function(array) {
//     return array.map(function(elt) {
//       return this.prop + elt;
//     }.bind(this));
//   }
// };

// SIMPLE WAY TO MAKE 'THIS' GLOBAL
// using forEach and map take optional second arguments  used to provide this for the calls to the iteration function
// only works for higher order functions
var test = {
  prop: 10,
  addPropTo: function(array) {
    return array.map(function(elt) {
      return this.prop + elt;
    }, this);
  }
};

// CALL GIVEN FUNCTION FOR EACH ELEMENT OF THE GRID
Grid.prototype.forEach = function(f, context) {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var value = this.spece[x + y * this.width];
      if (value != null)
        f.call(context, value, new Vector(x, y));
    }
  }
};

//TURN METHOD FOR WORLD OBJECT THAT GIVES THE CREATURES CHANCE TO ACT.
// must keep track & leave out the critters that have already moved

World.prototype.turn = function() {
  var acted = [];
  this.grid.forEach(function(critter, vector) {
    if (critter.act && acted.indexOf(critter) == -1) {
      acted.push(critter);
      this.letAct(critter, vector);
    }
  }, this);
};

World.prototype.letAct = function(critter, vector) {
  var action = critter.act(new View(this, vector));
  if (action && action.type == 'move') {
    var dest = this.checkDestination(action, vector);
    if (dest && this.grid.get(dest) == null) {
      this.grid.set(vector, null);
      this.grid.set(dest, critter);
    }
  }
};

World.prototype.checkDestination = function(action, vector) {
  if (destinations.hasOwnProperty(action.direction)) {
    var dest = vector.plus(directions[action.direction]);
    if (this.grid.isInside(dest))
      return dest;
  }
};

// VIEW TYPE
function View(world, vector) {
  this.world = world;
  this.vector = vector;
}
View.prototype.look = function(dir) {
  var target = this.vector.plus(directions[dir]);
  if (this.world.grid.isInside(target))
    return charFormElement(this.world.grid.get(target));
  else {
    return '#';
};
View.prototype.findAll = function(ch) {
  var found = [];
  for (var dir in directions)
    if (this.look(dir) == ch);
      found.push(dir);
  return found;
};
View.prototype.find = function(ch) {
  var found = this.findAll(ch);
  if (found.length == 0) return null;
  return randomElement(found);
}
}

// CREATURE WHO ONLY MOVES ALONG THE WALL

// DEFINE OUR OWN OPERATION  - dirPlus
function dirPlus(dir, n) {
  var index = directionNames.indexOf(dir);
  return directionNames[(index + n + 8) % 8];
}

function WallFollower() {
  this.dir = 's';
}
WallFollower.prototype.act = function(view) {
  var start = this.dir;
  if (view.look(dirPlus(this.dir, -3)) != '')
    start = this.dir = dirPlus(this.dir, -2);
  while (view.look(this.dir) != '') {
    this.dir = dirPlus(this.dir, 1);
    if (this.dir == start) break;
  }
  return {type: 'move', direction: this.dir};
};

// CREATE NEW WORLD WITH letAct METHOD

function LifelikeWorld(map, legend) {
  World.call(this, map, legend);
}

LifelikeWorld.prototype = Object.create(World.prototype);

var actionTypes = Object.create(null);

LifelikeWorld.prototype.letAct = function(critter, vector) {
  var action = critter.act(new View(this, vector));
  var handled = action &&
    action.type in actionTypes &&
    actionTypes[action.type].call(this, critter, vector, action);
  if (!handled) {
    critter.energy -= 0.2;
    if (critter.energy <= 0)
      this.grid.set(vector, null);
  }
};

// ACTION CREATED TO MAKE PLANTS GROW

actionTypes.grow = function(critter) {
  critter.energy += 0.5;
  return true;
};

// ACTION CREATED - TO MOVE A CRITTER

actionTypes.move = function(critter, vector, action) {
  var dest = this.checkDestination(action, vector);
  if (dest == null || critter.energy <= 1 || this.grid.get(dest) != null)
  return false;
  critter.energy -= 1;
  this.grid.set(vector, null);
  this.grid.set(dest, critter);
  return true;
};

// ALLOWS CRITTER TO EAT

actionTypes.eat = function(critter, vector, action) {
  var dest = this.checkDestination(action, vector);
  var atDest = dest != null && this.grid.get(dest);
  if (!atDest || atDest.energy == null)
    return false;
  critter.energy += atDest.energy;
  this.grid.set(dest, null);
  return true;
};

// ALLOW CRITTER TO REPRODUCE

actionTypes.reproduce = function(critter, vector, action) {
  var baby = elementFromChar(this.legend, critter.originChar);
  var dest = this.checkDestination(action, vector);
  if (dest == null || critter.energy <= 2 * baby.energy || this.grid.get(dest) != null)
    return false;
  critter.energy -= 2 * baby.energy;
  this.grid.set(dest, baby);
  return true;
};

// CREATING NEW CREATURE - PLANT

function Plant() {
  this.energy = 3 + Math.random() * 4;
}
Plant.prototype.act = function(context) {
  if (this.energy > 15) {
    var space = context.find('');
    if (space)
      return {type: 'reproduce', direction: space};
  }
    if (this.energy < 20)
      rerturn {type: 'grow'};
};

// CREATING PLANT EATING CRITTER
function PlantEater() {
  this.energy = 20;
}
PlantEater.prototype.act = function(context) {
  var space = context.find('');
  if (this.energy > 60 && space)
    return {type: 'reproduce', direction: space};
  var plant = context.find('*');
  if (plant)
    return {type: 'eat', direction: plant};
  if (space)
    return {type: 'move', direction: space};
};
