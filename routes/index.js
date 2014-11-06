var express = require('express'),
  config = require('../common/config'),
  nano = require('nano')(config.couchdb.host + ':' + config.couchdb.port),
  db = nano.use('nodebcn'),
  async = require('async'),
  moment = require('moment'),
  router = express.Router();
var util = require('util');

/* GET home page. */
router.get('/', function (req, res) {
  var
    today = new Date(),
    next_event = {},
    talks = [];

  db.view('events', 'index', {
    startkey: [today.getYear(), today.getMonth(), today.getDate()]
  }, function (error, result) {
    next_event = result.rows[0].value;

    db.view('talks', 'index', {
      key: result.rows[0].id
    }, function (error, result) {
      async.each(result.rows, function (talk, fn) {
        talks.push(talk.value);
        fn();
      }, function () {
        if (talks.length === 0) {
          talks = [{}, {}];
        } else if (talks.length < 2) {
          talks.push({});
        }
        res.locals = {
          title: 'Node.js Barcelona User Group',
          event: next_event,
          date: prettifyDate(next_event.date),
          talks: talks
        };
        res.render('index');
      });
    });
  });
});

function prettifyDate(dbdate) {
  var date;

  if (!dbdate) {
    return false;
  }


  moment.locale('en', {
      calendar : {
          lastDay : '[Yesterday at] HH:mm[h]',
          sameDay : '[Today at] HH:mm[h]',
          nextDay : '[Tomorrow at] HH:mm[h]',
          lastWeek : '[last] dddd [at] HH:mm[h]',
          nextWeek : 'dddd [at] HH:mm[h]',
          sameElse : 'D. MMMM YYYY [at] HH:mm[h]'
      }
  });

  date = moment({
    year: dbdate[0],
    month: dbdate[1],
    day: dbdate[2],
    hour: dbdate[3] || 19, // there no will be meetings at 0h
    minute: dbdate[4] || 0,
  });

  return date.calendar();
}

module.exports = router;
