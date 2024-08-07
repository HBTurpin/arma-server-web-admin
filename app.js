var express = require('express')
var bodyParser = require('body-parser')
var morgan = require('morgan')
var path = require('path')
var serveStatic = require('serve-static')
var webpack = require('webpack')
var webpackMiddleware = require('webpack-dev-middleware')

var config = require('./config')
var webpackConfig = require('./webpack.config')
var setupBasicAuth = require('./lib/setup-basic-auth')
var Manager = require('./lib/manager')
var Missions = require('./lib/missions')
var Mods = require('./lib/mods')
var Logs = require('./lib/logs')


var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

setupBasicAuth(config, app)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

morgan.token('user', function (req) { return req.auth ? req.auth.user : 'anon' })
app.use(morgan(config.logFormat || 'dev'))

app.use(serveStatic(path.join(__dirname, 'public')))

var logs = new Logs(config)

var manager = new Manager(config, logs)
manager.load()

var missions = new Missions(config)
var mods = new Mods(config)
mods.updateMods()


app.use('/api/logs', require('./routes/logs')(logs))
app.use('/api/missions', require('./routes/missions')(missions))
app.use('/api/mods', require('./routes/mods')(mods))
app.use('/api/servers', require('./routes/servers')(manager, mods))
app.use('/api/games', require('./routes/games')(config.games))

app.get('/logout', function (req, res) {
  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  res.status(401).send('<a href="/">Return</a>');
});

io.on('connection', function (socket) {
  socket.emit('missions', missions.missions)
  socket.emit('mods', mods.mods)
  socket.emit('servers', manager.getServers())
})

missions.on('missions', function (missions) {
  io.emit('missions', missions)
})

mods.on('mods', function (mods) {
  io.emit('mods', mods)
})

manager.on('servers', function () {
  io.emit('servers', manager.getServers())
})

if (require.main === module) {
  var webpackCompiler = webpack(webpackConfig)

  app.use(webpackMiddleware(webpackCompiler, {
    publicPath: webpackConfig.output.publicPath
  }))

  server.listen(config.port, config.host)
}

module.exports = app