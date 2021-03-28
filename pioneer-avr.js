/*
    Helper module for controlling Pioneer AVR
*/

const request = require('request');
const TelnetAvr = require('./telnet-avr');

 
// Reference fot input id -> Characteristic.InputSourceType
const inputToType = {
        '01': 0, // CD -> Characteristic.InputSourceType.OTHER
        '02': 2, // TUNER -> Characteristic.InputSourceType.TUNER
        '04': 0, // DVD -> Characteristic.InputSourceType.OTHER
        '05': 3, // TV -> Characteristic.InputSourceType.HDMI
        '06': 3, // CBL/SAT -> Characteristic.InputSourceType.HDMI
        '10': 4, // VIDEO -> Characteristic.InputSourceType.COMPOSITE_VIDEO
        '15': 3, // DVR/BDR -> Characteristic.InputSourceType.HDMI
        '17': 9, // USB/iPod -> Characteristic.InputSourceType.USB
        '25': 3, // BD -> Characteristic.InputSourceType.HDMI
        '33': 0, // ADAPTER -> Characteristic.InputSourceType.OTHER
        '38': 2, // NETRADIO -> Characteristic.InputSourceType.TUNER
        '44': 0, // MEDIA SERVER -> Characteristic.InputSourceType.OTHER
        '45': 0, // FAVORITE -> Characteristic.InputSourceType.OTHER
        '46': 8, // AIRPLAY -> Characteristic.InputSourceType.AIRPLAY
        '49': 0 // GAME -> Characteristic.InputSourceType.OTHER
};

const inputDict = {
        '01': {'type': 0, 'name': 'CD'},           // -> Characteristic.InputSourceType.OTHER
        '02': {'type': 2, 'name': 'TUNER'},        // -> Characteristic.InputSourceType.TUNER
        '04': {'type': 0, 'name': 'DVD'},          // -> Characteristic.InputSourceType.OTHER
        '05': {'type': 3, 'name': 'TV'},           // -> Characteristic.InputSourceType.HDMI
        '06': {'type': 3, 'name': 'CBL/SAT'},      // -> Characteristic.InputSourceType.HDMI
        '10': {'type': 4, 'name': 'VIDEO'},        // -> Characteristic.InputSourceType.COMPOSITE_VIDEO
        '15': {'type': 3, 'name': 'DVR/BDR'},      // -> Characteristic.InputSourceType.HDMI
        '17': {'type': 9, 'name': 'USB/iPod'},     // -> Characteristic.InputSourceType.USB
        '25': {'type': 3, 'name': 'BD'},           // -> Characteristic.InputSourceType.HDMI
        '33': {'type': 0, 'name': 'ADAPTER'},      // -> Characteristic.InputSourceType.OTHER
        '38': {'type': 2, 'name': 'NETRADIO'},     // -> Characteristic.InputSourceType.TUNER
        '44': {'type': 0, 'name': 'MEDIA SERVER'}, // -> Characteristic.InputSourceType.OTHER
        '45': {'type': 0, 'name': 'FAVORITE'},     // -> Characteristic.InputSourceType.OTHER
        '46': {'type': 8, 'name': 'AIRPLAY'},     // -> Characteristic.InputSourceType.AIRPLAY
        '49': {'type': 0, 'name': 'GAME'},         // -> Characteristic.InputSourceType.OTHER
};

function PioneerAvr(log, host, port) {
    const me = this;
    this.log = log;
    this.host = host;
    this.port = port;

    // Current AV status
    this.state = {
        volume: null,
        on: null,
        muted: null,
        input: null
    };

    // Inputs' list
    this.inputs = [];

    // Web interface ?
    this.web = false;
    this.webStatusUrl = 'http://' + this.host + '/StatusHandler.asp';
    this.webEventHandlerBaseUrl = 'http://' + this.host + '/EventHandler.asp?WebToHostItem=';
    request
        .get(this.webStatusUrl)
        .on('response', function(response) {
            if (response.statusCode == '200') {
                me.log.info('Web Interface enabled');
                this.web = true;
            }
        });

    // Communication Initialization
    this.s = new TelnetAvr(this.host, this.port);

    // Dealing with input's initialization
    this.initCount = 0;
    this.isReady = false;
}
module.exports = PioneerAvr;

PioneerAvr.prototype.loadInputs = function(callback) {
    // Queue and send all inputs discovery commands
    this.log.debug('Discovering inputs');
    for (var key in inputDict) {
        this.log.debug('Trying Input key: %s', key);
        this.addStaticInput(key, inputDict[key].name, inputDict[key].type, callback)
    }
};

// Power methods

PioneerAvr.prototype.__updatePower = function(callback) {
    this.sendCommand('?P', callback);
};

PioneerAvr.prototype.powerStatus = function(callback) {
    require('deasync').sleep(100);
    this.__updatePower(() => {
        callback(null, this.state.on);
    });
};

PioneerAvr.prototype.powerOn = function() {
    this.log.debug('Power on');

    if (this.web) {
        request.get(this.webEventHandlerBaseUrl + 'PO');
    } else {
        this.sendCommand('PO');
    }
};

PioneerAvr.prototype.powerOff = function() {
    this.log.debug('Power off');
    if (this.web) {
        request.get(this.webEventHandlerBaseUrl + 'PF');
    } else {
        this.sendCommand('PF');
    }
};

// Volume methods

PioneerAvr.prototype.__updateVolume = function(callback) {
    this.sendCommand('?V', callback);
};

PioneerAvr.prototype.volumeStatus = function(callback) {
    this.__updateVolume(() => {
        callback(null, this.state.volume);
    });
};

PioneerAvr.prototype.setVolume = function(targetVolume, callback) {
    var vsxVol = targetVolume * 185 / 100;
    vsxVol = Math.floor(vsxVol);
    var pad = "000";
    var vsxVolStr = pad.substring(0, pad.length - vsxVol.toString().length) + vsxVol.toString();
    this.sendCommand(`${vsxVolStr}VL\r\n`);
    callback();
};

PioneerAvr.prototype.volumeUp = function() {
    this.log.debug('Volume up');
    if (this.web) {
        request.get(this.webEventHandlerBaseUrl + 'VU');
    } else {
        this.sendCommand('VU');
    }
};

PioneerAvr.prototype.volumeDown = function() {
    this.log.debug('Volume down');
    if (this.web) {
        request.get(this.webEventHandlerBaseUrl + 'VD');
    } else {
        this.sendCommand('VD');
    }
};

// Mute methods

PioneerAvr.prototype.__updateMute = function(callback) {
    this.sendCommand('?M', callback);
};

PioneerAvr.prototype.muteStatus = function(callback) {
    this.__updateMute(() => {
        callback(null, this.state.muted);
    });
};

PioneerAvr.prototype.muteOn = function() {
    this.log.debug('Mute on');
    if (this.web) {
        request.get(this.webEventHandlerBaseUrl + 'MO');
    } else {
        this.sendCommand('MO');
    }
};

PioneerAvr.prototype.muteOff = function() {
    this.log.debug('Mute off');
    if (this.web) {
        request.get(this.webEventHandlerBaseUrl + 'MF');
    } else {
        this.sendCommand('MF');
    }
};

// Input management method

PioneerAvr.prototype.__updateInput = function(callback) {
    this.sendCommand('?F', callback);
};

PioneerAvr.prototype.inputStatus = function(callback) {
    this.__updateInput(() => {
        callback(null, this.state.input);
    });
};

PioneerAvr.prototype.setInput = function(id) {
    if (this.web) {
        request.get(this.webEventHandlerBaseUrl + `${id}FN`);
    } else {
        this.sendCommand(`${id}FN`);
    }
};

PioneerAvr.prototype.renameInput = function (id, newName) {
    let shrinkName = newName.substring(0,14);
    this.sendCommand(`${shrinkName}1RGB${id}`);
};

// Remote Key methods

PioneerAvr.prototype.remoteKey = function (rk) {
    // Implemented key from CURSOR OPERATION
    switch (rk) {
        case 'UP':
            this.sendCommand('CUP');
            break;
        case 'DOWN':
            this.sendCommand('CDN');
            break;
        case 'LEFT':
            this.sendCommand('CLE');
            break;
        case 'RIGHT':
            this.sendCommand('CRI');
            break;
        case 'ENTER':
            this.sendCommand('CEN');
            break;
        case 'RETURN':
            this.sendCommand('CRT');
            break;
        case 'HOME_MENU':
            this.sendCommand('HM');
            break;
        default:
            this.log.info('Unhandled remote key : %s', rk);
    }
};

// Send command and process return

PioneerAvr.prototype.sendCommand = async function (command, callback) {
    // Main method to send a command to AVR
    try {
        this.log.debug('Send command : %s', command);
        var isQuery = false;
        if (callback) {
            isQuery = true;
        }
        data = await this.s.sendMessage(command, isQuery);
        this.log.debug('Receive data : %s', data);
    } catch (e) {
        this.log.error(e)
    }

    // Data returned for power status
    if (data.startsWith('PWR')) {
        this.log.debug('Receive Power status : %s', data);
        this.state.on = parseInt(data[3], 10) === 0;
        callback();
    }

    // Data returned for mute status
    if (data.startsWith('MUT')) {
        this.log.debug('Receive Mute status : %s', data);
        this.state.muted = parseInt(data[3], 10) === 0;
        callback();
    }

    // Data returned for volume status
    if (data.startsWith('VOL')) {
        var vol = data.substring(3);
        var volPctF = Math.floor(parseInt(vol) * 100 / 185);
        this.state.volume = Math.floor(volPctF);
        this.log.debug("Volume is %s (%s%)", vol, this.state.volume);
        callback();
    }

    // Data returned for input status
    if (data.startsWith('FN')) {
        this.log.debug('Receive Input status : %s', data);
        let inputId = data.substr(2);
        let inputIndex = null;
        for (var x in this.inputs) {
            if (this.inputs[x].id == inputId) {
                inputIndex = x;
            }
        }
        this.state.input = inputIndex;
        callback();
    }

    // // Data returned for input queries
    if (data.startsWith('RGB')) {
        let tmpInput = {
            id: data.substr(3, 2),
            name: data.substr(6).trim(),
            type: inputToType[data.substr(3, 2)]
        };
        this.inputs.push(tmpInput);
        if (!this.isReady) {
            this.initCount = this.initCount + 1;
            this.log.debug('Input [%s] discovered (id: %s, type: %s). InitCount=%s/%s',
                tmpInput.name,
                tmpInput.id,
                tmpInput.type,
                this.initCount,
                Object.keys(inputToType).length
            );
            if (this.initCount == Object.keys(inputToType).length) this.isReady = true;
        }
        callback(this.inputs.length - 1);
    }
        // E06 is returned when input not exists
        // if (data.startsWith('E06')) {
    this.log.debug('Receive error');
    if (!this.isReady) {
        this.initCount = this.initCount + 1;
        this.log.debug('Input does not exists. InitCount=%s/%s',
            this.initCount,
            Object.keys(inputToType).length
        );
        if (this.initCount == Object.keys(inputToType).length) this.isReady = true;
    }
        // }

};

PioneerAvr.prototype.addStaticInput = async function (id, name, type, callback) {
    let tmpInput = {
        id: id,
        name: name,
        type: type,
    };
    this.inputs.push(tmpInput);
    if (!this.isReady) {
        this.initCount = this.initCount + 1;
        this.log.debug('Input [%s] discovered (id: %s, type: %s). InitCount=%s/%s',
            tmpInput.name,
            tmpInput.id,
            tmpInput.type,
            this.initCount,
            Object.keys(inputToType).length
        );
        if (this.initCount == Object.keys(inputToType).length) this.isReady = true;
    }
    callback(this.inputs.length - 1);

};
