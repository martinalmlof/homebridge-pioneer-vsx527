# homebridge-pioneer-avr [![npm version](https://badge.fury.io/js/homebridge-pioneer-avr.svg)](https://badge.fury.io/js/homebridge-pioneer-avr)

Based 99% on https://github.com/kazcangi/homebridge-pioneer-avr

homebridge-pioneer-vsx527 is a plugin made for [homebridge](https://github.com/nfarina/homebridge),
which declare your Pioneer AVR as a TV in homekit (iOS 12.2 needed).
It's a specialization of https://github.com/kazcangi/homebridge-pioneer-avr#readme for my VSX-527

## Features

Declare your AVR as a homekit TV :
* Turn AVR On/Off
* Auto discover inputs
* Select active input in home app
* Select inputs to shown in the input list
* Save visibility status for inputs
* Rename inputs in home apps
* Control volume through the command in control center
* Control AVR with Remote in Control Center on iOS

## Installation

1. Install the homebridge framework using `npm install -g homebridge`
2. Install **homebridge-pioneer-avr** using `npm install -g homebridge-pioneer-avr`
3. Update your configuration file. See `sample-config.json` in this repository for a sample. 

## Accessory configuration example

```json
"accessories": [
	{
        "accessory": "pioneerVsx527Accessory",
        "model": "VSX-527",
        "name": "My Pioneer AVR",
        "description": "AV Receiver",
        "host": "192.168.178.99",
        "port": 8102
	}
]
```

*Notice: If port 8102 does not work, try port 23.

## Links

https://github.com/rwifall/pioneer-receiver-notes

https://github.com/merdok/homebridge-webos-tv

https://github.com/TG908/homebridge-vsx

## Release Notes

### v0.8.1

* Modify telnet-avr to comply with RS232 specs

### v0.8.0

* Completely rewrite communication with AVR

### v0.7.0

* Use AVR's web interface if available

### v0.6

* First support for remote keys (through Control Center -> Remote on iOS)

### v0.5

* Save CurrentVisibilityState for inputs

### v0.4

* Allow to rename inputs in Home app

### v0.3

* Turn AVR On/Off
* Auto discover inputs
* Select active input in home app
* Select inputs to show in the input list
* Control volume through the command in control center with iPhone +/- buttons

