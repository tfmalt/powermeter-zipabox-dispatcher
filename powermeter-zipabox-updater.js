#!/usr/bin/env node
/*
 * powermeter-zipabox-updater
 *  
 */
const fetch       = require("node-fetch");
const log         = require("winston");
const pkg         = require("./package.json");
const CronEmitter = require("cron-emitter");

const opts = {
    malt: {
        apikey: process.env.POWERMETER_APIKEY,
    },
    zipabox: {
        apikey: process.env.ZIPATO_APIKEY,
        serial: process.env.ZIPABOX_SERIAL,
        device: process.env.ZIPABOX_DEVICE
    }
}

log.remove(log.transports.Console);
log.add(log.transports.Console, {
    level:       (process.env.POWERMETER_ZIPATO_DEBUG == 1) ? "debug" : "info",
    prettyPrint: true,
    colorize:    false,
    silent:      false,
    timestamp:   true
});

log.info("Starting PowerMeter Zipabox Dispatcher v" + pkg.version);
log.debug("Log level debug");
log.debug("These are the options:", opts);

const cron = new CronEmitter();
cron.add('*/30 * * * * *', 'every_thirty_seconds');
cron.add('25 0 * * * *', 'every_hour');
cron.add('20 */5 * * * *', 'every_five_minutes');

cron.on('every_five_minutes', (name) => {
    log.debug("got event: every_five_minutes");
    fetch(`https://api.malt.no/power/kwh/today?apikey=${opts.malt.apikey}`)
        .then(res => {
            log.debug("kwh today HTTP status")
            return res.json();
        })
        .then(data => {
            log.info("Got valid response from power meter api: today kwh =", data.kwh);
            return fetch(`https://my.zipato.com/zipato-web/remoting/attribute/set?serial=${opts.zipabox.serial}&apiKey=${opts.zipabox.apikey}&ep=${opts.zipabox.device}&value4=${data.kwh}`);
        })
        .then(res => {
            log.info("zipato said status for kwh today was ", res.status);
        })
        .catch(err => {
            log.error("exception:", err.message);
        })
});

cron.on('every_hour', (name) => {
    log.debug("Got event: every_hour");

    fetch(`https://api.malt.no/power/kwh/hour/1?apikey=${opts.malt.apikey}`)
        .then(res => {
            log.debug("kwh hour HTTP Status: ", res.status);
            return res.json();
        })
        .then(data => {
            log.info("Got valid response from power meter api: kwh =" , data.total);
            return fetch(
                `https://my.zipato.com/zipato-web/remoting/attribute/set?serial=${opts.zipabox.serial}&apiKey=${opts.zipabox.apikey}&ep=${opts.zipabox.device}&value3=${data.total}`
            );
        })
        .then(res => {
            log.info("Got response from zipato for kwh: ", res.status);
        })
        .catch( err => {
            log.error("Got an exception:", err.message);
        });
});

cron.on('every_thirty_seconds', (name) => {
    log.debug("Got event: every_thirty_seconds");

    fetch(`https://api.malt.no/power/watts/30?apikey=${opts.malt.apikey}`)
        .then( res => {
            log.debug("watts HTTP Status: ", res.status);
            if (res.status !== 200) {
                throw new ReferenceError("http status: " + res.status);
            }
            return res.json();
        })
        .then(data => {
            log.info("Got valid response from power meter api: watt = ", data.watt);
            return fetch(
                `https://my.zipato.com/zipato-web/remoting/attribute/set?serial=${opts.zipabox.serial}&apiKey=${opts.zipabox.apikey}&ep=${opts.zipabox.device}&value2=${data.watt}`
            );
        })
        .then(res => {
            log.info("Got response from zipato for watt: ", res.status);
        })
        .catch( err => {
            log.error("Got an exception:", err.message);
        });
});