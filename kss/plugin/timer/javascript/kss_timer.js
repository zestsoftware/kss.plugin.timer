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

    Timer.prototype._init = function _init(displayformat, displayels,
                                           startbuttons, stopbuttons,
                                           onstart, onstop, onupdate) {
        this.displayformat = displayformat;
        this.displayels = displayels || [];
        this.startbuttons = startbuttons || [];
        this.stopbuttons = stopbuttons || [];
        this.onstart = onstart || function() {};
        this.onstop = onstop || function() {};
        this.onupdate = onupdate || function() {};
        this.starttime = null;
        this.interval = null;

        this.update_event_registrations();
    };

    Timer.prototype.add_display_el = function add_display_el(el) {
        this.display_els.push(el);
    };

    Timer.prototype.add_start_button = function add_start_button(b) {
        this.startbuttons.push(b);
        this.update_event_registrations();
    };

    Timer.prototype.add_stop_button = function add_stop_button(b) {
        this.stopbuttons.push(b);
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
    };

    Timer.prototype.start = function start() {
        this.starttime = (new Date()).getTime();
        var self = this;
        window.__timer_update_function = function() {
            self.update();
        };
        this.interval = window.setInterval('__timer_update_function()', 100);
        this.onstart();
    };

    Timer.prototype.stop = function stop() {
        if (!this.interval) {
            return;
        };
        window.clearInterval(this.interval);
        this.interval = null;
        this.onstop();
    };

    Timer.prototype.update = function update() {
        var secs = (new Date()).getTime() - this.starttime;
        var timedata = {
            '%s': secs,
            '%S': secs % 60,
            '%M': parseInt(secs / 60) % 60,
            '%h': parseInt(secs / 3600),
            '%H': parseInt(secs / 3600) % 24,
            '%d': parseInt(secs / (3600 * 24))
        };
        var formatstr = this.displayformat;
        for (var formatter in timedata) {
            var r = new RegExp(formatter, 'g');
            formatstr = formatstr.replace(r, timedata[formatter]);
        };
        this.displayel.innerHTML = formatstr;
        this.onupdate({defaultParameters: {'seconds': secs}});
    };

    // KSS event binder
    var TimerEventBinder = function() {
        // Add your initialization stuff here
        this.exampleVar = {};
    };

    TimerEventBinder.prototype.__bind__ =
            function __bind__(opers_by_eventname) {
;;;     oper.componentName = '[kss.plugin.timer] event binding';
        var node;
        var config = {
            displayels: [],
            startbuttons: [],
            stopbuttons: [],
            displayformat: '%s',
            onstart: function() {},
            onstop: function() {},
            onupdate: function() {}
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
                displayformat: '%s',
            });
            config.displayformat = bindoper.parms.displayformat;
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
            if (bindoper.hasExecuteActions()) {
                config.onstop = bindoper.makeExecuteActionsHook();
            };
        } else if (opers_by_eventname.update) {
            var bindoper = opers_by_eventname.update;
            node = bindoper.node;
            if (!node) {
                throw new Error('node not found for timer-update event');
            };
            config.displayels.push(node);
            if (bindoper.hasExecuteActions()) {
                config.onupdate = bindoper.makeExecuteActionsHook();
            };
        };
        if (this.timer) {
            if (config.displayformat) {
                this.timer.displayformat = config.displayformat;
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
            if (config.onstart) {
                this.timer.onstart = config.onstart;
            };
            if (config.onstop) {
                this.timer.onstop = config.onstop;
            };
            if (config.onupdate) {
                this.timer.onupdate = config.onupdate;
            };
        } else {
            var t = this.timer = new Timer(config.displayformat,
                                           config.displayels,
                                           config.startbuttons,
                                           config.stopbuttons,
                                           config.onstart,
                                           config.onstop,
                                           config.onupdate);
        };
    };

    // KSS event binding
    kukit.eventsGlobalRegistry.registerForAllEvents(
        'timer', ['start', 'stop', 'update'],
        TimerEventBinder, '__bind__', null, 'Node');
}();
