const express = require('express');
const path = require('path');
// var favicon = require('serve-favicon');
const logger = require('morgan');
// const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');


// [SH] Bring in the data model
//require('./server/api/modules/db');

//const { sendJsonResponse } = require('./server/api/_shared');

const app = express();




/// Settings
// Make JSON responses beautiful
app.set('json replacer', function(key, value){
    if (key === 'discount')
        return undefined;
    else
        return value;
});
app.set('json spaces', 4);

// disables the application root source
if ( 'production' === app.get('env') ) {
    app.disable('x-powered-by');
}


// Set a View Engine
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

// app.use(favicon(path.join(__dirname, 'dist', 'favicon.ico')));
app.use( logger('dev') );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ 'extended': 'false' }) );

// Create link to Angular build directory
app.use( express.static( path.join( __dirname, './' ) ) );

// Required if we serve our API at a
// different origin than the Angular app



//---------- PUBLIC ROUTES --------------
// Catch all other routes and return the index file
/*
app.get( '/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});
*/

// -------- ERROR HANDLERS ---------------
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// [SH] Catch unauthorised errors
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401);
        res.json({"message" : err.name + ": " + err.message});
    }
});

// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

console.log( 'This looks like a ' + app.get('env') + ' environment to me...');
console.log( '__dirname of this project is: ' + __dirname );
console.log( 'X-Powered-By is ' + app.enabled('x-powered-by') );

module.exports = app;
