#!/usr/bin/env node
/*
 * powermeter-zipabox-updater
 *  
 */
const fetch = require("node-fetch");
const log = require("winston");
const pkg = require("./package.json");
const CronEmitter = require("cron-emitter");


log.remove(log.transports.Console);
log.add(log.transports.Console, {
    level:       (process.env.POWERMETER_ZIPATO_DEBUG === 1) ? "debug" : "info",
    prettyPrint: true,
    colorize:    false,
    silent:      false,
    timestamp:   true
});
log.info("Starting PowerMeter Zipabox Dispatcher v" + pkg.version);
log.info("  Log level debug");

const cron = new CronEmitter();
cron.add('*/30 * * * * *', 'every_thirty_seconds');
cron.add('30 0 * * * *', 'every_hour');

cron.on('every_hour', (name) => {
    log.debug("Got event: every_hour");

    fetch("https://api.malt.no/power/kwh/hour/1?apikey=9995565173874666965f83319c0f9497")
        .then(res => {
            log.debug("HTTP Status: ", res.status);
            return res.json();
        })
        .then(data => {
            log.info("Got valid response from power meter api: kwh = ", data.total);
            return fetch(
                `https://my.zipato.com/zipato-web/remoting/attribute/set?serial=0124671A0E01C58A&apiKey=42562d52-4d46-4a43-9010-40a576dfc4e2&ep=fa91af9f-548b-41cc-8249-bf9654391ea0&value3=${data.total}`
            );
        })
        .then(res => {
            log.info("Got res from zipato: ", res.status);
        })
        .catch( err => {
            log.error("Got an exception:", err.message);
        });
});

cron.on('every_thirty_seconds', (name) => {
    log.debug("Got event: every_thirty_seconds");

    fetch("https://api.malt.no/power/watts/30?apikey=9995565173874666965f83319c0f9497")
        .then( res => {
            log.debug("HTTP Status: ", res.status);
            if (res.status !== 200) {
                throw new ReferenceError("http status: " + res.status);
            }
            return res.json();
        })
        .then(data => {
            log.info("Got valid response from power meter api: watt = ", data.watt);
            return fetch(
                `https://my.zipato.com/zipato-web/remoting/attribute/set?serial=0124671A0E01C58A&apiKey=42562d52-4d46-4a43-9010-40a576dfc4e2&ep=fa91af9f-548b-41cc-8249-bf9654391ea0&value2=${data.watt}`
            );
        })
        .then(res => {
            log.info("Got res from zipato: ", res.status);
        })
        .catch( err => {
            log.error("Got an exception:", err.message);
        });
});