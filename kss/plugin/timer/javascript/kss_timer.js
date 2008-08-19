/* KSS timer plugin - (c) Zest Software 2008

   This plugin for KSS provides stopwatch-like functionality for your
   web application. It allows registering HTML elements as start and
   end button, and allows registering actions when the timer is stopped
   or when the display needs to be updated

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License version 2 as published
   by the Free Software Foundation.
  
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
  
   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA
   02111-1307, USA.
*/

kukit.timer = new function kukit_plugin_timer() {
    // helper functions
    function register_event(el, name, handler) {
        if (el.addEventListener) {
            el.addEventListener(name, handler, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + name, handler);
        } else {
            throw new Error('event registration not supported!');
        };
    };

    // Timer 'class'
    var Timer = this.Timer = function Timer() {
        if (arguments.length) {
            this._init.apply(this, arguments);
        };
    };

    Timer._num_instances = 0; // for generating a unique function name

    Timer.prototype._init = function _init(displayformat_nohours,
                                           displayformat_hours,
                                           displayels,
                                           startbuttons, stopbuttons,
                                           resetbuttons,
                                           onstart, onstop, onreset, onupdate,
                                           resetonstop, startvalue) {
        this.displayformat_nohours = displayformat_nohours;
        this.displayformat_hours = displayformat_hours;
        this.displayels = displayels || [];
        this.startbuttons = startbuttons || [];
        this.stopbuttons = stopbuttons || [];
        this.resetbuttons = resetbuttons || [];
        this.onstart = onstart || function() {};
        this.onstop = onstop || function() {};
        this.onreset = onreset || function() {};
        this.onupdate = onupdate || function() {};
        this.resetonstop = resetonstop;
        this.startvalue = startvalue;
        this._starttime = null;
        this._lastvalue = null;
        this._interval = null;
        this._running = false;

        if (startvalue) {
            this.start();
            this._starttime -= (startvalue * 1000);
            this.update();
        };

        this.update_event_registrations();
    };

    Timer.prototype.add_display_el = function add_display_el(el) {
        this.displayels.push(el);
    };

    Timer.prototype.add_start_button = function add_start_button(b) {
        this.startbuttons.push(b);
        this.update_event_registrations();
    };

    Timer.prototype.add_stop_button = function add_stop_button(b) {
        this.stopbuttons.push(b);
        this.update_event_registrations();
    };

    Timer.prototype.add_reset_button = function add_reset_button(b) {
        this.resetbuttons.push(b);
        this.update_event_registrations();
    };

    Timer.prototype.update_event_registrations =
            function update_event_registrations() {
        var self = this;
        for (var i=0; i < this.startbuttons.length; i++) {
            var b = this.startbuttons[i];
            if (!b.__timer_events_registered) {
                register_event(b, 'click', function() {self.start();});
                b.__timer_events_registered = true;
            };
        };
        for (var i=0; i < this.stopbuttons.length; i++) {
            var b = this.stopbuttons[i];
            if (!b.__timer_events_registered) {
                register_event(b, 'click', function() {self.stop();});
                b.__timer_events_registered = true;
            };
        };
        for (var i=0; i < this.resetbuttons.length; i++) {
            var b = this.resetbuttons[i];
            if (!b.__timer_events_registered) {
                register_event(b, 'click', function() {self.reset();});
                b.__timer_events_registered = true;
            };
        };
    };

    Timer.prototype.start = function start(ignorehandler) {
        if (this._interval) {
            window.clearInterval(this._interval);
        };
        this._starttime = (new Date()).getTime();
        var self = this;
        fname = '__timer_update_function_' + (++Timer._num_instances);
        window[fname]  = function() {
            self.update();
        };
        this._interval = window.setInterval(fname + '()', 100);
        if (!ignorehandler) {
            this.onstart();
        };
        this._running = true;
    };

    Timer.prototype.stop = function stop(ignorehandler) {
        if (!this._interval) {
            return;
        };
        this._running = false;
        window.clearInterval(this._interval);
        this._interval = null;
        var secs = parseInt(((new Date()).getTime() - this._starttime) / 1000);
        if (this.resetonstop) {
            this._starttime = null;
            var formatters = ['%s', '%S', '%M', '%H', '%h', '%d',
                              '%0S', '%0M', '%0H'];
            var formatstr = this.displayformat_nohours;
            for (var i=0; i < formatters.length; i++) {
                var reg = new RegExp(formatters[i], 'g');
                var replace = '0';
                if (formatters[i].charAt(1) == '0') {
                    replace = '00';
                };
                formatstr = formatstr.replace(reg, replace);
            };
            for (var i=0; i < this.displayels.length; i++) {
                this.displayels[i].innerHTML = formatstr;
            };
        };
        if (!ignorehandler) {
            this.onstop({defaultParameters: {seconds: secs}});
        };
    };

    Timer.prototype.reset = function() {
        if (!this._interval) {
            return;
        };
        var secs = parseInt(((new Date()).getTime() - this._starttime) / 1000);
        this.stop(true);
        this._starttime = null;
        this.start(true);
        this.onreset({defaultParameters: {seconds: secs}});
    };

    Timer.prototype.update = function update() {
        var secs = parseInt(((new Date()).getTime() - this._starttime) / 1000);
        var currsecs = secs % 60;
        var minutes = parseInt(secs / 60) % 60;
        var allhours = parseInt(secs / 3600);
        var dayhours = allhours % 24;
        var timedata = {
            '%s': secs,
            '%S': currsecs,
            '%0S': currsecs < 10 ? '0' + currsecs : currsecs,
            '%M': minutes,
            '%0M': minutes < 10 ? '0' + minutes : minutes,
            '%h': allhours,
            '%H': dayhours,
            '%0H': dayhours < 10 ? '0' + dayhours : dayhours,
            '%d': parseInt(secs / (3600 * 24))
        };
        if (allhours > 0) {
            var formatstr = this.displayformat_hours;
        } else {
            var formatstr = this.displayformat_nohours;
        };
        for (var formatter in timedata) {
            var r = new RegExp(formatter, 'g');
            formatstr = formatstr.replace(r, timedata[formatter]);
        };
        if (formatstr == this._lastvalue) {
            return;
        };
        this._lastvalue = formatstr;
        for (var i=0; i < this.displayels.length; i++) {
            this.displayels[i].innerHTML = formatstr;
        };
        this.onupdate({defaultParameters: {'seconds': secs}});
    };

    Timer.prototype._settings_changed = function _settings_changed() {
        /* called when config changes

            this performs tasks such as starting the timer if 'startvalue' is
            set to something from the KSS sheet, but after the timer has been
            instantiated.
        */
        if (this.startvalue && !this._running) {
            this.start();
            this._starttime -= (this.startvalue * 1000);
            this.update();
        };
    };

    // KSS event binder
    var TimerEventBinder = function() {
        // Add your initialization stuff here
        this.exampleVar = {};
    };

    TimerEventBinder.prototype.__bind__ =
            function __bind__(opers_by_eventname) {
        var node;
        var config = {
            displayformat_nohours: undefined,
            displayformat_hours: undefined,
            startvalue: undefined,
            resetonstop: undefined,
            displayels: [],
            startbuttons: [],
            stopbuttons: [],
            resetbuttons: [],
            onstart: undefined,
            onstop: undefined,
            onreset: undefined,
            onupdate: undefined
        };
        if (opers_by_eventname.start) {
            var bindoper = opers_by_eventname.start;
;;;         bindoper.componentName = 'kss.plugin.timer start event binding';
            node = bindoper.node;
            if (!node) {
                throw new Error('node not found for timer-start event');
            };
            config.startbuttons.push(node);
            bindoper.evaluateParameters([], {
                displayformat_nohours: '%M:%0S',
                displayformat_hours: '%h:%0M:%0S'
            });
            config.displayformat_nohours =
                bindoper.parms.displayformat_nohours;
            config.displayformat_hours = bindoper.parms.displayformat_hours;
            if (bindoper.hasExecuteActions()) {
                config.onstart = bindoper.makeExecuteActionsHook();
            };
        } else if (opers_by_eventname.stop) {
            var bindoper = opers_by_eventname.stop;
            node = bindoper.node;
            if (!node) {
                throw new Error('node not found for timer-stop event');
            };
            config.stopbuttons.push(node);
            bindoper.evaluateParameters([], {
                reset: false,
            });
            bindoper.evalBool('reset');
            config.resetonstop = bindoper.parms.reset;
            if (bindoper.hasExecuteActions()) {
                config.onstop = bindoper.makeExecuteActionsHook();
            };
        } else if (opers_by_eventname.reset) {
            var bindoper = opers_by_eventname.reset;
            node = bindoper.node;
            if (!node) {
                throw new Error('node not found for timer-reset event');
            };
            config.resetbuttons.push(node);
            if (bindoper.hasExecuteActions()) {
                config.onreset = bindoper.makeExecuteActionsHook();
            };
        } else if (opers_by_eventname.update) {
            var bindoper = opers_by_eventname.update;
            node = bindoper.node;
            if (!node) {
                throw new Error('node not found for timer-update event');
            };
            config.displayels.push(node);
            var classes = node.className.split(' ');
            // XXX severely abusing kssAttr here, and also I guess there is
            // some API to read the kssAttr value, but it works like this, and
            // I guess also seems to make sense from a user's perspective
            for (var i=0; i < classes.length; i++) {
                if (classes[i].indexOf('kssattr-timerstart-') == 0) {
                    config.startvalue = parseInt(classes[i].substr(19));
                    break;
                };
            };
            if (bindoper.hasExecuteActions()) {
                config.onupdate = bindoper.makeExecuteActionsHook();
            };
        };
        if (this.timer) {
            if (config.displayformat_nohours) {
                this.timer.displayformat_nohours =
                    config.displayformat_nohours;
            };
            if (config.displayformat_hours) {
                this.timer.displayformat_hours =
                    config.displayformat_hours;
            };
            if (config.startvalue) {
                this.timer.startvalue = config.startvalue;
            };
            if (config.resetonstop !== undefined) {
                this.timer.resetonstop = config.resetonstop;
            };
            for (var i=0; i < config.displayels.length; i++) {
                this.timer.add_display_el(config.displayels[i]);
            };
            for (var i=0; i < config.startbuttons.length; i++) {
                this.timer.add_start_button(config.startbuttons[i]);
            };
            for (var i=0; i < config.stopbuttons.length; i++) {
                this.timer.add_stop_button(config.stopbuttons[i]);
            };
            for (var i=0; i < config.resetbuttons.length; i++) {
                this.timer.add_reset_button(config.resetbuttons[i]);
            };
            if (config.onstart) {
                this.timer.onstart = config.onstart;
            };
            if (config.onstop) {
                this.timer.onstop = config.onstop;
            };
            if (config.onreset) {
                this.timer.onreset = config.onreset;
            };
            if (config.onupdate) {
                this.timer.onupdate = config.onupdate;
            };
            this.timer._settings_changed();
        } else {
            var dfnh = config['displayformat_nohours'];
            var dfh = config['displayformat_hours'];
            var t = this.timer = new Timer(dfnh || '%0M:%0S',
                                           dfh || '%h:%0M:%0S',
                                           config.displayels,
                                           config.startbuttons,
                                           config.stopbuttons,
                                           config.resetbuttons,
                                           config.onstart,
                                           config.onstop,
                                           config.onreset,
                                           config.onupdate,
                                           config.resetonstop,
                                           config.startvalue);
        };
    };

    // KSS event binding
    kukit.eventsGlobalRegistry.registerForAllEvents(
        'timer', ['start', 'stop', 'update', 'reset'],
        TimerEventBinder, '__bind__', null, 'Node');
}();
