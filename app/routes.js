const url = require('url')

const express = require('express')
const router = express.Router()

const GEMINI_KEY = process.env.GDS_GEMINI_KEY

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
  if (counters[name][option] == 1){
    return
  }
  counters[name][option]--
}


// load in sub-component options
// turn dot notation into objects

function processOptions(options){
  for (let key in options){
    let option = options[key]
    if (option.isComponent){
      const componentName = macroNameToComponentName(option.name)
      const subComponentOptions = require('./data/' + componentName + '/macro-options.json')
      option.params = subComponentOptions
    }

    if (option.type == "array"){
      for (let index = 0; index < option.params.length; index++){
        const param = option.params[index]

        // fix conditional bug
        // https://github.com/alphagov/govuk-frontend/issues/1903

        if (param.name == 'conditional'){
          // delete this param
          option.params.splice(index,1)
          index--
          continue
        }

        if (param.name.includes(".")){
          const nameParts = param.name.split(".")
          // look for a param with object name
          let foundIndex = -1
          for (let index2 = 0; index2 < option.params.length; index2++){
            const param2 = option.params[index2]
            if (param2.name == nameParts[0]){
              foundIndex = index2
              break
            }
          }
          // create it if it doesnt exist
          if (foundIndex == -1){
            let objectParam = {
              name: nameParts[0],
              type: "object",
              params: [{
                name: nameParts[1],
                type: param.type,
                required: param.required,
                description: param.description,
                advanced: param.advanced
              }]
            }
            option.params.push(objectParam)
          } else {
            let params = option.params[foundIndex].params
            params.push({
              name: nameParts[1],
              type: param.type,
              required: param.required,
              description: param.description,
              advanced: param.advanced
            })
          }
          // delete this param
          option.params.splice(index,1)
          index--
        }
      }
    }
  }
  return options
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

  options = processOptions(options)

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

router.get('/components/ai/:name', function (request, response) {
  
  var componentName = request.params.name
  var macroName = componentNameToMacroName(componentName)
  var name = componentNameToPlain(componentName)

  response.locals.componentName = componentName
  response.locals.macroName = macroName
  response.locals.name = name

  response.render('ai-editor')

})

router.post('/components/ai/:name', async function (request, response) {
  
  const componentName = request.params.name

  let componentOptions

  try {
    componentOptions = require('./data/' + componentName + '/macro-options.json')
  } catch (error) {
    response.status(404)
    response.send(error)
    return
  }

  componentOptions = processOptions(componentOptions)

  const prompt = request.body.prompt

  const message = `
  Generate configuration for a GOV.UK Design System component.
  
  Component name: ${componentName}
  Nunjucks reference: ${JSON.stringify(componentOptions)}
  
  User's request: "${prompt}"
  
  Generate a JSON object with the configuration for this component based on the user's request.
  Default isPageHeading to true unless specified, and apply the correct class as follows:
  If isPageHeading is true set the main legend classes to 'govuk-fieldset__legend--l' for legend or 'govuk-label--l' for label
  Prefer the text parameter over html
  `

  console.log(message)

  // const aiURL = 'http://localhost:11434/api/generate'
  const aiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`
  
  // aiData = {
  //   model: "mistral-small:24b",
  //   // model: "deepseek-r1:14b",
  //   // model: "gemma3:12b",
  //   // model: "deepseek-coder-v2:lite",
  //   prompt: message,
  //   stream: false,
  //   format: 'json',
  //   options: {
  //     "num_ctx": 4096
  //   }
  // }

  aiData = {
    "contents": [{
      "parts":[{
        "text": message
      }]
    }],
    "generationConfig": { "response_mime_type": "application/json" }
  }

  let aiResponse
  let aiResponseJSON

  try {
    aiResponse = await fetch(aiURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(aiData)
    })

    // Check if the response was successful
    if (!aiResponse.ok) {
      throw new Error(`HTTP error, status: ${aiResponse.status}`)
    }

    // Process the successful response
    aiResponseJSON = await aiResponse.json()

    // Process the data only if we successfully got a response
    const content = aiResponseJSON.candidates?.[0]?.content?.parts?.[0]?.text
    console.log('Content:', content)

    if (!content) {
      throw new Error('Invalid response format: content not found in response')
    }

    const parsed = JSON.parse(content)
    request.session.data[componentName] = parsed
    response.redirect('/components/ai/' + componentName)

  } catch (error) {
    // Handle any errors that occurred
    console.error('Error:', error.message)
    // Redirect to an error page or render an error message
    response.status(500).send(`Error processing AI response: ${error.message}`)
    // Or alternatively:
    // response.redirect('/error-page?message=' + encodeURIComponent(error.message))
  }

})


module.exports = router
