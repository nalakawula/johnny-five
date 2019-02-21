require("./common/bootstrap");

exports["Board Connection"] = {
  setUp: function(done) {
    this.sandbox = sinon.sandbox.create();
    this.connect = this.sandbox.spy(Board.Serial, "connect");
    this.detect = this.sandbox.spy(Board.Serial, "detect");
    this.MockFirmata = this.sandbox.stub(Firmata, "Board");
    done();
  },

  tearDown: function(done) {
    Board.purge();
    Serial.purge();
    this.sandbox.restore();
    Board.Serial.attempts.length = 0;
    done();
  },

  lateConnection: function(test) {
    test.expect(6);

    Board.Serial.used.length = 0;

    var calls = 0;
    var attempts = Board.Serial.attempts;

    this.list = this.sandbox.stub(SerialPort, "list", function(callback) {
      calls++;
      process.nextTick(function() {
        callback(null, calls === 2 ? [{
          comName: "/dev/usb"
        }] : []);
      });
    });

    var board = new Board({
      debug: false,
      repl: false
    });

    board.on("connect", function() {
      // Serialport.list called twice
      test.equal(this.list.callCount, 2);
      // Two calls to detect
      test.equal(this.detect.callCount, 2);
      // One attempt unsuccessful
      test.equal(attempts, 1);
      // One attempt successful
      test.equal(this.connect.callCount, 1);

      // MockFirmata instantiated
      test.equal(this.MockFirmata.callCount, 1);
      test.equal(this.MockFirmata.lastCall.args[0], "/dev/usb");
      test.done();
    }.bind(this));
  },

  maxOutAttempts: function(test) {
    test.expect(2);

    var calls = 0;
    Board.Serial.used.length = 0;
    Board.Serial.attempts[0] = 11;

    this.list = this.sandbox.stub(SerialPort, "list", function(callback) {
      calls++;
      process.nextTick(function() {
        callback(null, calls === 2 ? [{
          comName: "/dev/usb"
        }] : []);
      });
    });

    this.fail = this.sandbox.stub(Board.prototype, "fail", function(klass, message) {
      test.equal(klass, "Board");
      test.equal(message, "No connected device found");
      test.done();
    });

    new Board({
      debug: false,
      repl: false
    });
  },

  inUse: function(test) {
    test.expect(3);
    var calls = 0;
    Board.Serial.used.push("/dev/ttyUSB0");

    this.list = this.sandbox.stub(SerialPort, "list", function(callback) {
      calls++;
      process.nextTick(function() {
        callback(null, calls === 2 ? [
          {comName: "/dev/ttyUSB0"},
          {comName: "/dev/ttyUSB1"},
          {comName: "/dev/ttyUSB2"},
        ] : []);
      });
    });

    this.info = this.sandbox.spy(Board.prototype, "info");

    var board = new Board({
      debug: false,
      repl: false
    });

    board.on("connect", function() {
      test.equal(this.info.getCall(1).args[1].includes("ttyUSB0"), false);
      test.equal(this.info.getCall(1).args[1].includes("ttyUSB1"), true);
      test.equal(this.info.getCall(1).args[1].includes("ttyUSB2"), true);
      test.done();
    }.bind(this));
  },
};
