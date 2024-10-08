var _ = require('underscore')
var Marionette = require('marionette')
var sweetAlert = require('sweet-alert')

var tpl = require('tpl/servers/list_item.html')

var template = _.template(tpl)

module.exports = Marionette.ItemView.extend({
  tagName: 'tr',
  template: template,

  events: {
    'click .clone': 'clone',
    'click .delete': 'delete',
    'click .start': 'start',
    'click .stop': 'stop'
  },

  modelEvents: {
    change: 'serverUpdated'
  },

  clone: function (e) {
    var title = this.model.get('title') + ' Clone'
    var uid = this.model.get('uid') + ' _clone'
    var clone = this.model.clone()
    clone.set({ id: null, title: title, uid: uid, auto_start: false })
    clone.save({}, {
      success: function () {},
      error: function (model, response) {
        sweetAlert({
          title: 'Error',
          text: response.responseText,
          type: 'error'
        })
      }
    })
    
  },

  delete: function (event) {
    var self = this
    sweetAlert({
      title: 'Are you sure?',
      text: 'Your server configuration will be deleted!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
      confirmButtonText: 'Yes, delete it!'
    },
    function () {
      self.model.delete(function (err) {
        if (err) {
          setTimeout(function(){ //Sweet alert is on an old version, might be worth upgrading so we can use promises.
            sweetAlert({
              title: 'Error',
              text: err.responseText,
              type: 'error'
            })
          }, 200);
          return
        }
        self.render()
      })
    })
  },

  start: function (event) {
    var self = this
    event.preventDefault()
    this.model.start(function (err) {
      if (err) {
        sweetAlert({
          title: 'Error',
          text: err.responseText,
          type: 'error'
        })
        return
      }
      self.render()
    })
  },

  stop: function (event) {
    var self = this
    event.preventDefault()
    sweetAlert({
      title: 'Are you sure?',
      text: 'The server will stopped.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonClass: 'btn-warning',
      confirmButtonText: 'Yes, stop it!'
    },
    function () {
      self.model.stop(function (err) {
        if (err) {
          setTimeout(function(){ //Sweet alert is on an old version, might be worth upgrading so we can use promises.
            sweetAlert({
              title: 'Error',
              text: err.responseText,
              type: 'error'
            })
          }, 200);
          return
        }

        self.render()
      })
    })
  },

  serverUpdated: function (event) {
    this.render()
  }
})
