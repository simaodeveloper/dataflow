const _extractKeys = object => Object.keys(object)
const _isValidAction = function (namespace, action) {
  return (
    namespace === this.namespace && _extractKeys(this._actions).includes(action)
  )
}

export default class DataFlow {
  constructor ({
    namespace = '',
    state = {},
    getters = {},
    mutations = {},
    actions = {}
  }) {
    this.namespace = namespace
    this._state = state
    this._getters = getters
    this._mutations = mutations
    this._actions = actions

    this.events = {}

    this.initialize()
  }

  getContext () {
    return {
      getters: this.getters,
      state: this._state,
      commit: this.commit.bind(this),
      actions: this.dispatch.bind(this)
    }
  }

  commit (mutation, payload) {
    this._mutations[mutation](this._state, payload)
    this.setGetters()
    this.emit('updated')
  }

  dispatch (event, payload) {
    const [namespace, action] = event.split('/')

    if (_isValidAction.call(this, namespace, action)) {
      this._actions[action](this.getContext(), payload)
    }
  }

  setGetters () {
    const _getters = {}
    const _invalidGetters = []

    for (const prop in this._getters) {
      try {
        _getters[prop] = this._getters[prop](this._state)
      } catch (err) {
        _invalidGetters.push([prop, this._getters[prop]])
      }
    }

    _invalidGetters.forEach(getter => {
      const [prop, getterFunction] = getter
      _getters[prop] = getterFunction(this.state, _getters)
    })

    this.getters = _getters
  }

  on (event, fn) {
    if (!this.events[event]) this.events[event] = []
    this.events[event].push(fn)
  }

  emit (event) {
    if (event in this.events) {
      this.events[event].forEach(fn => fn())
    }
  }

  initialize () {
    this.setGetters()
  }
}
