const express = require('express')
const router = express.Router()

const componentNameToMacroName = componentName => {
  const macroName = componentName
    .toLowerCase()
    .split('-')
    // capitalize each 'word'
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  return `govuk${macroName}`
}

// Add your routes here - above the module.exports line

// we need counters

let counters = {}

getCounter = function(name, option){
  counter = counters?.[name]?.[option] || 1
  return counter
}

incrementCounter = function(name, option){
  if (!counters[name]){
    counters[name] = {}
  }
  if (!counters[name][option]){
    counters[name][option] = 1
  }
  counters[name][option]++
}

router.get('/components/:name', function (request, response) {
  var options
  var name = request.params.name
  var macroName = componentNameToMacroName(name)

  try {
    options = require('../node_modules/govuk-frontend/govuk/components/' + name + '/macro-options.json')
  } catch (error) {
    response.status(404)
    response.send(error)
    return
  }

  if (request.query['add-another']){
    let option = request.query['add-another']
    incrementCounter(name, option)
  }

  response.locals.name = name
  response.locals.macroName = macroName
  response.locals.options = options
  response.locals.getCounter = getCounter
  response.render('editor')
})

module.exports = router
