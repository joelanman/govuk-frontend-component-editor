const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line

router.get('/components/:name', function(request, response){

    var options
    var name = request.params.name

    try{
        options = require('../node_modules/govuk-frontend/govuk/components/' + name + '/macro-options.json')
    } catch (error){
        response.status(404)
        response.send(error)
        return
    }
    response.locals.name = name
    response.locals.options = options
    response.render('editor')

})

module.exports = router
