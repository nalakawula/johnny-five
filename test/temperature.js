var MockFirmata = require("./util/mock-firmata"),
  five = require("../lib/johnny-five.js"),
  sinon = require("sinon"),
  Board = five.Board,
  Temperature = five.Temperature;

function setUpShape(suite) {
  // Base Shape for all Temperature tests
  suite.proto = [];

  suite.instance = [{
    name: "celsius"
  }, {
    name: "fahrenheit"
  }, {
    name: "kelvin"
  }, {
    name: "C"
  }, {
    name: "F"
  }, {
    name: "K"
  }];

}

function shapeTests(test) {
  test.expect(this.proto.length + this.instance.length);

  this.proto.forEach(function testProtoMethods(method) {
    test.equal(typeof this.temperature[method.name], "function", method.name);
  }, this);

  this.instance.forEach(function testInstanceProperties(property) {
    test.notEqual(typeof this.temperature[property.name], "undefined", property.name);
  }, this);

  test.done();
}

function newBoard() {
  var io = new MockFirmata();
  var board = new Board({
    io: io,
    debug: false,
    repl: false
  });

  io.emit("connect");
  io.emit("ready");

  return board;
}

function restore(target) {
  for (var prop in target) {

    if (Array.isArray(target[prop])) {
      continue;
    }

    if (target[prop] != null && typeof target[prop].restore === "function") {
      target[prop].restore();
    }

    if (typeof target[prop] === "object") {
      restore(target[prop]);
    }
  }
}


function createAnalog(toCelsius) {
  return new Temperature({
    pins: ["A0"],
    toCelsius: toCelsius,
    freq: 100,
    board: this.board
  });
}

exports["Temperature -- ANALOG (Base)"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.clock = sinon.useFakeTimers();
    this.analogRead = sinon.spy(MockFirmata.prototype, "analogRead");

    setUpShape(this);
    this.proto.push({ name: "toCelsius" });

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  shape: function(test) {
    this.temperature = createAnalog.call(this);
    var raw = this.analogRead.args[0][1];
    raw(50);
    shapeTests.call(this, test);
  },

  rawData: function(test) {
    var temperature = createAnalog.call(this);
    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(13);
    temperature.on("data", spy);

    raw(50);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    var data = spy.args[0][1];

    var expected = {
      celsius: 50,
      C: 50,
      fahrenheit: 122,
      F: 122,
      kelvin: 323,
      K: 323,
    };

    Object.keys(expected).forEach(function(prop) {
      test.equal(Math.round(data[prop]), expected[prop], "data event." + prop);
      test.equal(Math.round(temperature[prop]), expected[prop], "temperature." + prop);
    });

    test.done();
  },

  customData: function(test) {
    var toCelsius = function() { return 22; };
    var temperature = createAnalog.call(this, toCelsius);
    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(7);
    temperature.on("data", spy);

    raw(50);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    var data = spy.args[0][1];
    test.equals(Math.round(data.celsius), 22, "celsius");
    test.equals(Math.round(data.C), 22, "C");
    test.equals(Math.round(data.fahrenheit), 72, "fahrenheit");
    test.equals(Math.round(data.F), 72, "F");
    test.equals(Math.round(data.kelvin), 295, "kelvin");
    test.equals(Math.round(data.K), 295, "K");

    test.done();
  }
};

exports["Temperature -- LM335"] = {

  setUp: function(done) {
    this.board = newBoard();
    this.clock = sinon.useFakeTimers();
    this.analogRead = sinon.spy(MockFirmata.prototype, "analogRead");
    this.temperature = new Temperature({
      controller: "LM335",
      pins: ["A0"],
      freq: 100,
      board: this.board
    });

    setUpShape(this);

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  shape: shapeTests,

  data: function(test) {

    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(4);
    this.temperature.on("data", spy);

    raw(100);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].celsius), -224);
    test.equals(Math.round(spy.args[0][1].fahrenheit), -372);
    test.equals(Math.round(spy.args[0][1].kelvin), 49);

    test.done();
  },

  change: function(test) {
    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(1);
    this.temperature.on("change", spy);

    raw(100);
    this.clock.tick(100);

    raw(100);
    this.clock.tick(100);

    raw(200);
    this.clock.tick(100);

    raw(100);
    this.clock.tick(100);

    raw(200);
    this.clock.tick(100);

    raw(200);
    this.clock.tick(100);

    test.equal(spy.callCount, 4);
    test.done();
  }
};



exports["Temperature -- LM35"] = {

  setUp: function(done) {
    this.board = newBoard();
    this.clock = sinon.useFakeTimers();
    this.analogRead = sinon.spy(MockFirmata.prototype, "analogRead");
    this.temperature = new Temperature({
      controller: "LM35",
      pins: ["A0"],
      freq: 100,
      board: this.board
    });

    setUpShape(this);

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  shape: shapeTests,

  data: function(test) {

    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(4);
    this.temperature.on("data", spy);

    raw(100);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].celsius), 49);
    test.equals(Math.round(spy.args[0][1].fahrenheit), 120);
    test.equals(Math.round(spy.args[0][1].kelvin), 322);

    test.done();
  },

  change: function(test) {
    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(1);
    this.temperature.on("change", spy);

    raw(100);
    this.clock.tick(100);

    raw(100);
    this.clock.tick(100);

    raw(200);
    this.clock.tick(100);

    raw(100);
    this.clock.tick(100);

    raw(200);
    this.clock.tick(100);

    raw(200);
    this.clock.tick(100);

    test.equal(spy.callCount, 4);
    test.done();
  }
};

exports["Temperature -- TMP36"] = {

  setUp: function(done) {
    this.board = newBoard();
    this.clock = sinon.useFakeTimers();
    this.analogRead = sinon.spy(MockFirmata.prototype, "analogRead");

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  data: function(test) {
    this.temperature = new Temperature({
      controller: "TMP36",
      pins: ["A0"],
      freq: 100,
      board: this.board
    });

    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(4);
    this.temperature.on("data", spy);

    raw(150);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].celsius), 23);
    test.equals(Math.round(spy.args[0][1].fahrenheit), 74);
    test.equals(Math.round(spy.args[0][1].kelvin), 296);

    test.done();
  },

  aref: function(test) {
    this.temperature = new Temperature({
      controller: "TMP36",
      pins: ["A0"],
      freq: 100,
      board: this.board,
      aref: 3.3
    });

    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(7);
    this.temperature.on("data", spy);

    raw(150);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].C), -2);
    test.equals(Math.round(spy.args[0][1].F), 29);
    test.equals(Math.round(spy.args[0][1].K), 271);

    // changing aref changes values
    this.temperature.aref = 1.8;
    test.equals(Math.round(this.temperature.C), -24);
    test.equals(Math.round(this.temperature.F), -11);
    test.equals(Math.round(this.temperature.K), 250);

    test.done();
  },

  arefFromIo: function(test) {
    this.board.io.aref = 3.3;
    this.temperature = new Temperature({
      controller: "TMP36",
      pins: ["A0"],
      freq: 100,
      board: this.board,
    });

    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(4);
    this.temperature.on("data", spy);

    raw(150);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].C), -2);
    test.equals(Math.round(spy.args[0][1].F), 29);
    test.equals(Math.round(spy.args[0][1].K), 271);

    test.done();
  }
};

function createDS18B20(pin, address) {
  return new Temperature({
    controller: "DS18B20",
    pin: pin,
    address: address,
    freq: 100,
    board: this.board
  });
}

exports["Temperature -- DS18B20"] = {

  setUp: function(done) {
    this.board = newBoard();

    this.pin = 2;
    this.clock = sinon.useFakeTimers();
    this.sendOneWireConfig = sinon.spy(MockFirmata.prototype, "sendOneWireConfig");
    this.sendOneWireSearch = sinon.spy(MockFirmata.prototype, "sendOneWireSearch");
    this.sendOneWireDelay = sinon.spy(MockFirmata.prototype, "sendOneWireDelay");
    this.sendOneWireReset = sinon.spy(MockFirmata.prototype, "sendOneWireReset");
    this.sendOneWireWrite = sinon.spy(MockFirmata.prototype, "sendOneWireWrite");
    this.sendOneWireWriteAndRead = sinon.spy(MockFirmata.prototype, "sendOneWireWriteAndRead");

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    Temperature.Drivers.clear();
    done();
  },

  initialize: function(test) {
    var device = [0x28, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFF];
    var search;

    test.expect(5);

    this.temperature = createDS18B20(this.pin);
    search = this.sendOneWireSearch.args[0][1];
    search(null, [device]);


    test.ok(this.sendOneWireConfig.calledOnce);
    test.equals(this.sendOneWireConfig.args[0][0], this.pin);

    test.ok(this.sendOneWireSearch.calledOnce);
    test.equals(this.sendOneWireSearch.args[0][0], this.pin);

    test.equals(this.temperature.address, 0x050403020100);

    test.done();
  },

  data: function(test) {
    var device = [0x28, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFF];
    var search, data;
    var spy = sinon.spy();

    test.expect(18);

    this.temperature = createDS18B20(this.pin);
    this.temperature.on("data", spy);
    search = this.sendOneWireSearch.args[0][1];
    search(null, [device]);

    data = this.sendOneWireWriteAndRead.args[0][4];
    data(null, [0x01, 0x02]);


    test.ok(this.sendOneWireReset.calledTwice);
    test.equals(this.sendOneWireReset.args[0], this.pin);

    test.ok(this.sendOneWireWrite.calledOnce);
    test.equals(this.sendOneWireWrite.args[0][0], this.pin);
    test.equals(this.sendOneWireWrite.args[0][1], device);
    test.equals(this.sendOneWireWrite.args[0][2], 0x44);

    test.ok(this.sendOneWireDelay.calledOnce);
    test.equals(this.sendOneWireDelay.args[0][0], this.pin);
    test.equals(this.sendOneWireDelay.args[0][1], 1);

    test.equals(this.sendOneWireReset.args[1], 2);

    test.ok(this.sendOneWireWriteAndRead.calledOnce);
    test.equals(this.sendOneWireWriteAndRead.args[0][0], this.pin);
    test.equals(this.sendOneWireWriteAndRead.args[0][1], device);
    test.equals(this.sendOneWireWriteAndRead.args[0][2], 0xBE);
    test.equals(this.sendOneWireWriteAndRead.args[0][3], 2);

    this.clock.tick(100);

    test.equals(Math.round(spy.args[0][1].celsius), 32);
    test.equals(Math.round(spy.args[0][1].fahrenheit), 90);
    test.equals(Math.round(spy.args[0][1].kelvin), 305);

    test.done();
  },

  address: function(test) {
    var device1 = [0x28, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFF];
    var device2 = [0x28, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0xFF];
    var search;

    test.expect(3);

    this.temperature = createDS18B20(this.pin, 0x554433221100);
    search = this.sendOneWireSearch.args[0][1];
    search(null, [device1, device2]);

    test.equals(this.sendOneWireWrite.args[0][1], device2);
    test.equals(this.sendOneWireWriteAndRead.args[0][1], device2);
    test.equals(this.temperature.address, 0x554433221100);

    test.done();
  },

  twoAddressedUnits: function(test) {
    var spyA = sinon.spy();
    var spyB = sinon.spy();
    var deviceA = [0x28, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFF];
    var deviceB = [0x28, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0xFF];
    var search, data;

    test.expect(2);

    this.temperatureA = createDS18B20(this.pin, 0x554433221100);
    this.temperatureA.on("data", spyA);
    this.temperatureB = createDS18B20(this.pin, 0x050403020100);
    this.temperatureB.on("data", spyB);

    search = this.sendOneWireSearch.args[0][1];
    search(null, [deviceA, deviceB]);

    data = this.sendOneWireWriteAndRead.args[0][4];
    data(null, [0x01, 0x02]);
    data = this.sendOneWireWriteAndRead.args[1][4];
    data(null, [0x03, 0x04]);

    this.clock.tick(100);

    test.equals(Math.round(spyA.args[0][1].celsius), 32);
    test.equals(Math.round(spyB.args[0][1].celsius), 64);

    test.done();
  },

  twoAddresslessUnitsThrowsError: function(test) {
    var failedToCreate = false;

    test.expect(1);

    this.temperature = createDS18B20(this.pin);

    try {
      createDS18B20(this.pin);
    } catch (err) {
      failedToCreate = true;
    }

    test.equals(failedToCreate, true);

    test.done();
  }
};

exports["Temperature -- MPU6050"] = {

  setUp: function(done) {
    this.board = newBoard();
    this.clock = sinon.useFakeTimers();
    this.i2cConfig = sinon.spy(MockFirmata.prototype, "i2cConfig");
    this.i2cWrite = sinon.spy(MockFirmata.prototype, "i2cWrite");
    this.i2cRead = sinon.spy(MockFirmata.prototype, "i2cRead");
    this.temperature = new Temperature({
      controller: "MPU6050",
      freq: 100,
      board: this.board
    });

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  fwdOptionsToi2cConfig: function(test) {
    test.expect(3);

    this.i2cConfig.reset();

    new Temperature({
      controller: "MPU6050",
      address: 0xff,
      bus: "i2c-1",
      board: this.board
    });

    var forwarded = this.i2cConfig.lastCall.args[0];

    test.equal(this.i2cConfig.callCount, 1);
    test.equal(forwarded.address, 0xff);
    test.equal(forwarded.bus, "i2c-1");

    test.done();
  },
  data: function(test) {
    var read, spy = sinon.spy();

    test.expect(12);
    this.temperature.on("data", spy);

    read = this.i2cRead.args[0][3];
    read([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // accelerometer
      0x11, 0x22,                         // temperature
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00  // gyro
    ]);


    test.ok(this.i2cConfig.calledOnce);

    test.ok(this.i2cWrite.calledOnce);
    test.equals(this.i2cWrite.args[0][0], 0x68);
    test.deepEqual(this.i2cWrite.args[0][1], [0x6B, 0x00]);

    test.ok(this.i2cRead.calledOnce);
    test.equals(this.i2cRead.args[0][0], 0x68);
    test.deepEqual(this.i2cRead.args[0][1], 0x3B);
    test.equals(this.i2cRead.args[0][2], 14);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].celsius), 49);
    test.equals(Math.round(spy.args[0][1].fahrenheit), 121);
    test.equals(Math.round(spy.args[0][1].kelvin), 323);

    test.done();
  }
};


exports["Temperature -- GROVE"] = {

  setUp: function(done) {
    this.board = newBoard();
    this.clock = sinon.useFakeTimers();
    this.analogRead = sinon.spy(MockFirmata.prototype, "analogRead");
    this.temperature = new Temperature({
      controller: "GROVE",
      pin: "A0",
      freq: 100,
      board: this.board
    });

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  data: function(test) {

    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(4);
    this.temperature.on("data", spy);

    raw(659);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].celsius), 39);
    test.equals(Math.round(spy.args[0][1].fahrenheit), 102);
    test.equals(Math.round(spy.args[0][1].kelvin), 312);

    test.done();
  }
};

exports["Temperature -- TINKERKIT"] = {

  setUp: function(done) {
    this.board = newBoard();
    this.clock = sinon.useFakeTimers();
    this.analogRead = sinon.spy(MockFirmata.prototype, "analogRead");
    this.temperature = new Temperature({
      controller: "TINKERKIT",
      pin: "A0",
      freq: 100,
      board: this.board
    });

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  data: function(test) {

    var raw = this.analogRead.args[0][1],
      spy = sinon.spy();

    test.expect(4);
    this.temperature.on("data", spy);

    raw(810);

    this.clock.tick(100);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].celsius), 39);
    test.equals(Math.round(spy.args[0][1].fahrenheit), 102);
    test.equals(Math.round(spy.args[0][1].kelvin), 312);

    test.done();
  }
};

exports["Temperature -- MPL115A2"] = {

  setUp: function(done) {
    this.board = newBoard();

    this.i2cConfig = sinon.spy(MockFirmata.prototype, "i2cConfig");
    this.i2cWrite = sinon.spy(MockFirmata.prototype, "i2cWrite");
    this.i2cRead = sinon.spy(MockFirmata.prototype, "i2cRead");
    this.i2cReadOnce = sinon.spy(MockFirmata.prototype, "i2cReadOnce");

    this.temperature = new Temperature({
      controller: "MPL115A2",
      board: this.board,
      freq: 10
    });

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  fwdOptionsToi2cConfig: function(test) {
    test.expect(3);

    this.i2cConfig.reset();

    new Temperature({
      controller: "MPL115A2",
      address: 0xff,
      bus: "i2c-1",
      board: this.board
    });

    var forwarded = this.i2cConfig.lastCall.args[0];

    test.equal(this.i2cConfig.callCount, 1);
    test.equal(forwarded.address, 0xff);
    test.equal(forwarded.bus, "i2c-1");

    test.done();
  },

  data: function(test) {
    test.expect(8);

    // var spy = sinon.spy();
    // this.temperature.on("data", spy);

    var readOnce = this.i2cReadOnce.args[0][3];
    readOnce([
      67, 111,  // A0
      176, 56,  // B1
      179, 101, // B2
      56, 116   // C12
    ]);

    setImmediate(function() {
      test.ok(this.i2cConfig.calledOnce);
      test.ok(this.i2cWrite.calledOnce);

      test.equals(this.i2cWrite.args[0][0], 0x60);
      test.deepEqual(this.i2cWrite.args[0][1], [0x12, 0x00]);

      test.ok(this.i2cRead.calledOnce);
      test.equals(this.i2cRead.args[0][0], 0x60);
      test.deepEqual(this.i2cRead.args[0][1], 0x00);
      test.equals(this.i2cRead.args[0][2], 4);

      // In order to handle the Promise used for initialization,
      // there can be no fake timers in this test, which means we
      // can't use the clock.tick to move the interval forward
      // in time.
      //
      //
      // read = this.i2cRead.args[0][3];

      // read([
      //   0, 0, // barometer
      //   129, 64, // temperature
      // ]);

      // this.clock.tick(100);
      // test.ok(spy.called);
      // test.equals(Math.round(spy.args[0][0].temperature), 70);

      test.done();
    }.bind(this));
  }
};

exports["Temperature -- SI7020"] = {

  setUp: function(done) {
    this.board = newBoard();
    this.clock = sinon.useFakeTimers();
    this.i2cConfig = sinon.spy(MockFirmata.prototype, "i2cConfig");
    this.i2cRead = sinon.spy(MockFirmata.prototype, "i2cRead");

    this.temperature = new Temperature({
      controller: "SI7020",
      board: this.board,
      freq: 10
    });

    done();
  },

  tearDown: function(done) {
    Board.purge();
    restore(this);
    done();
  },

  fwdOptionsToi2cConfig: function(test) {
    test.expect(3);

    this.i2cConfig.reset();

    new Temperature({
      controller: "SI7020",
      address: 0xff,
      bus: "i2c-1",
      board: this.board
    });

    var forwarded = this.i2cConfig.lastCall.args[0];

    test.equal(this.i2cConfig.callCount, 1);
    test.equal(forwarded.address, 0xff);
    test.equal(forwarded.bus, "i2c-1");

    test.done();
  },

  enforceExplicitReadDelay: function(test) {
    test.expect(1);

    this.i2cConfig.reset();

    new Temperature({
      controller: "SI7020",
      address: 0xff,
      bus: "i2c-1",
      board: this.board
    });

    var forwarded = this.i2cConfig.lastCall.args[0];

    test.equal(forwarded.delay, 50000);
    test.done();
  },

  data: function(test) {
    test.expect(8);

    test.equal(this.i2cRead.callCount, 1);
    // address
    test.equal(this.i2cRead.lastCall.args[0], 0x40);
    // register
    test.equal(this.i2cRead.lastCall.args[1], 0xE3);
    // byte count
    test.equal(this.i2cRead.lastCall.args[2], 2);

    var spy = sinon.spy();
    var read = this.i2cRead.lastCall.args[3];

    this.temperature.on("data", spy);

    read([103, 4, 63]);

    this.clock.tick(10);

    test.ok(spy.calledOnce);
    test.equals(Math.round(spy.args[0][1].celsius), 24);
    test.equals(Math.round(spy.args[0][1].fahrenheit), 75);
    test.equals(Math.round(spy.args[0][1].kelvin), 297);

    test.done();
  }
};
