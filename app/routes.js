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

decrementCounter = function(name, option){
  if (!counters[name]){
    return
  }
  if (!counters[name][option]){
    return
  }
  if (!counters[name][option] == 1){
    return
  }
  counters[name][option]--
}

router.get('/components/:name', function (request, response) {
  var options
  var name = request.params.name
  var macroName = componentNameToMacroName(name)

  console.log("get: '/components/" + name)

  try {
    options = require('../node_modules/govuk-frontend/govuk/components/' + name + '/macro-options.json')
  } catch (error) {
    response.status(404)
    response.send(error)
    return
  }

  response.locals.name = name
  response.locals.macroName = macroName
  response.locals.options = options
  response.locals.getCounter = getCounter
  response.render('editor')
})

router.post('/components/:name', function (request, response) {
  var options
  var name = request.params.name

  console.log("post: '/components/" + name)

  try {
    options = require('../node_modules/govuk-frontend/govuk/components/' + name + '/macro-options.json')
  } catch (error) {
    response.status(404)
    response.send(error)
    return
  }

  if (request.body['add-another']){
    let option = request.body['add-another']
    incrementCounter(name, option)
  }

  if (request.body['remove']){
    let input = request.body['remove'].split(",")
    let option = input[0]
    let index = input[1]

    let componentData = request.session.data[name]
    
    try {
      componentData[option].splice(index,1)
    } catch (error){
      // do nothing, may have been a blank row
    }
    decrementCounter(name, option)

  }

  response.redirect('/components/' + name)

})

module.exports = router
