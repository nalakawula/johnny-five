var five = require("../lib/johnny-five.js");
var board = new five.Board();

board.on("ready", function() {
  var light = new five.Light({
    controller: "BH1750",
  });

  light.on("data", function() {
    console.log("Lux: ", this.lux);
  });
});
