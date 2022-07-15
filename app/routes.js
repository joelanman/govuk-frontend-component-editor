const url = require('url')

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

const macroNameToComponentName = macroName => {
  return macroName.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
}

const componentNameToPlain = componentName => {
  const plain = componentName
    .toLowerCase()
    .split('-')
    .join(' ')

  return plain
}

// Add your routes here - above the module.exports line

incrementCounter = function(name, option, session){

  if (!session.counters){
    session.counters = {}
  }

  let counters = session.counters

  if (!counters[name]){
    counters[name] = {}
  }
  if (!counters[name][option]){
    counters[name][option] = 1
  }
  counters[name][option]++
}

decrementCounter = function(name, option, session){

  if (!session.counters){
    session.counters = {}
  }

  let counters = session.counters

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
  var componentName = request.params.name
  var macroName = componentNameToMacroName(componentName)
  var name = componentNameToPlain(componentName)
  var showAdvancedOptions = (request.query.advanced) ? true : false

  try {
    options = require('./data/' + componentName + '/macro-options.json')
  } catch (error) {
    response.status(404)
    response.send(error)
    return
  }

  // walk the options tree to load in sub-component options

  function getSubComponentOptions(options){
    for (let key in options){
      let option = options[key]
      if (option.isComponent){
        const componentName = macroNameToComponentName(option.name)
        const subComponentOptions = require('./data/' + componentName + '/macro-options.json')
        option.params = subComponentOptions
        console.log(subComponentOptions)
      }
      // if (option.name.includes(".")){
      //   const nameParts = option.name.split(".")
      //   if (!options[nameParts[0]]){
      //     options[nameParts[0]] = {
      //       type: "object",
      //       name: options[nameParts[0]],
      //       params: []
      //     }
      //   }
      //   option.name = nameParts[1]
      //   options[nameParts[0]].params.push(option)
      // }
    }
  }

  getSubComponentOptions(options)

  getCounter = function(name, option){
    counter = request.session?.counters?.[name]?.[option] || 1
    return counter
  }

  let newQuery = request.query

  if (showAdvancedOptions){

    delete newQuery.advanced

    response.locals.hideAdvancedOptionsURL = url.format({
      pathname: request.path,
      query: newQuery
    })

  } else {

    newQuery.advanced=true

    response.locals.showAdvancedOptionsURL = url.format({
      pathname: request.path,
      query: newQuery
    })

  }

  response.locals.componentName = componentName
  response.locals.macroName = macroName
  response.locals.name = name
  response.locals.options = options
  response.locals.getCounter = getCounter
  response.locals.showAdvancedOptions = showAdvancedOptions
  response.render('editor')
})

router.post('/components/:name', function (request, response) {
  var options
  var componentName = request.params.name

  try {
    options = require('./data/' + componentName + '/macro-options.json')
  } catch (error) {
    response.status(404)
    response.send(error)
    return
  }

  if (request.body['add-another']){
    let option = request.body['add-another']
    incrementCounter(componentName, option, request.session)
  }

  if (request.body['remove']){
    let input = request.body['remove'].split(",")
    let option = input[0]
    let index = input[1]

    let componentData = request.session.data[componentName]
    
    try {
      componentData[option].splice(index,1)
    } catch (error){
      // do nothing, may have been a blank row
    }
    decrementCounter(componentName, option, request.session)

  }

  response.redirect('/components/' + componentName)

})

module.exports = router
