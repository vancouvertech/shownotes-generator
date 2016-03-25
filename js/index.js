var moment = require('moment');
var request = require('browser-request');

// the array of groups we are checking for events on
var groups = require('./groups');

function loadEvents() {
  return groups.map(function(name) {
    // return fetch(name, {
    //   mode: 'no-cors' // must have
    // });
    return new Promise(function(resolve, reject) {
      request(name, function(er, response, body) {
        if(er){
          reject(er);
        }
        resolve(body);
      });
    });
  });
}

function jsonOnArray(arrs) {
  return arrs.map(function(arr) {
    return JSON.parse(arr);
  });
}

function combineResults(arrs) {
  return Promise.all(arrs)
  .then(function(res) {
    var out = Array.prototype.concat.apply(this, res);
    // window gets put in out[0], chop it
    return out.splice(1);
  });
}

// remove duplicates
function deDupe(arrs) {
  return arrs.filter(function(item, pos) {
    return arrs.indexOf(item) == pos;
  });
}

// cut the events down to ones only 7 days from now
function limitToWeek(arr) {
  var nextWeek = parseInt(moment().add(7, 'days').format('x'), 10);
  return arr.filter(function(event) {
    return event.time < nextWeek;
  });
}

function sortByTime(arr) {
  return arr.sort(function (a, b) {
    return a.time - b.time;
  });
}

function addFormattedTime(arr) {
  return arr.map(function(ev) {
    ev.date = moment(ev.time).format('dddd MMMM Do hh:mm A');
    return ev;
  });
}

function addAdditional(arrs) {
  return arrs.map(function(elem) {
    if (!elem.venue) {
      elem.venue = {};
      elem.venue.name = '';
    }
    return elem;
  });
}

Vue.component('drew-style', {
  template: '#drew-style'
});

Vue.component('james-style', {
  template: '#james-style'
});

var app = new Vue({
  el: "body",
  data: {
    now: moment().format('MMMM Do'),
    nextWeek: moment().add(7, 'days').format('MMMM Do'),
    events: [],
    errorMessage: '',
    currentTemplate: 'drew-style'
  },
  ready: function() {
    Promise.all(loadEvents())
    .then(jsonOnArray)
    .then(combineResults)
    .then(deDupe)
    .then(limitToWeek)
    .then(sortByTime)
    .then(addFormattedTime)
    .then(addAdditional)
    .then(this.loadEvents)
    // .catch(this.showError);
  },
  methods: {
    loadEvents: function(data) {
      this.events = data;
      document.body.classList.add('loaded');
    },
    showError: function(err) {
      this.errorMessage = err.message;
    }
  }
});
