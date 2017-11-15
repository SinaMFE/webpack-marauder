if (typeof Promise === 'undefined') {
  window.Promise = require('promise-polyfill')
}

// Object.assign() is commonly used with React.
// It will use the native implementation if it's present and isn't buggy.
Object.assign = require('object-assign')
