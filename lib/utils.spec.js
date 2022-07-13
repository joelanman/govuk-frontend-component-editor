const autoStoreData = require('./utils').autoStoreData

describe('Auto Data Store', () => {
    it('should store a single value in session', () => {
        const session = {}
        
        callWithBodyAndSession({a:'b'}, session)
        
        expect(session.data).toStrictEqual({a: 'b'})
    })

    it('should store an object in session', () => {
        const session = {}
        const body = {
            a : {
                b: 'c'
            }
        }
        
        callWithBodyAndSession(body, session)
        
        expect(session.data).toStrictEqual({
            a : {
                b: 'c'
            }
        })
    })

    it('should store an array in session', () => {
        const session = {}
        const body = {
            a : ['b','c']
        }
        
        callWithBodyAndSession(body, session)
        
        expect(session.data).toStrictEqual({
            a : ['b','c']
        })
    })

    it('should not store empty strings', () => {
        const session = {}
        const body = {
            a: '',
            b: 'c',
            d: '',
            e: ''
        }
        
        callWithBodyAndSession(body, session)
        
        expect(session.data).toStrictEqual({b: 'c'})
    })

    it('should not store empty strings in an array', () => {
        const session = {}
        const body = {
            a: ['b','','c']
        }
        
        callWithBodyAndSession(body, session)
        
        expect(session.data).toStrictEqual({a: ['b','c']})
    })

    it('should not store empty strings in an object', () => {
        const session = {}
        const body = {
            a: {
                b: 'c',
                d: '',
                e: 'f'
            }
        }
        
        callWithBodyAndSession(body, session)
        
        expect(session.data).toStrictEqual({a: {
            b: 'c',
            e: 'f'
        }})
    })

    it('should retain previously stored session data', () => {
        const session = {
            data:{
                'a': 'b'
            }
        }
        const body = {'c': 'd'}
        
        callWithBodyAndSession(body, session)
        expect(session.data).toStrictEqual({'a':'b', 'c': 'd'})
    })

    it('should retain previously stored session data inside objects', () => {
        const session = {
            data:{
                a: {
                    b: {
                        c: {
                            d: 'e',
                            f: 'g',
                            h: 'i'
                        }
                    }
                }
            }
        }
        const body = {
            a: {
                b: {
                    c: {
                        h: 'anything but i'
                    }
                }
            }
        }
        
        callWithBodyAndSession(body, session)
        expect(session.data).toStrictEqual({a:{
            b: {
                c: {
                    d: 'e',
                    f: 'g',
                    h: 'anything but i'
                }
            }
        }})
    })

    it('should update an array in session', () => {
        const session = {
            data:{
                'a': ['b', 'c']
            }
        }
        const body = {
            'a': ['c', 'd']
        }
        
        callWithBodyAndSession(body, session)
        expect(session.data).toStrictEqual({
            'a': ['c', 'd']
        })
    })

    it('should update an object in session', () => {
        const session = {
            data:{
                'a': {
                    'b': 'c'
                }
            }
        }
        const body = {
            'a': {
                'b': 'd'
            }
        }
        
        callWithBodyAndSession(body, session)
        expect(session.data).toStrictEqual({
            'a': {
                'b': 'd'
            }
        })
    })

    it('should update an object in session', () => {
        const session = {
            data:{
                'a': {
                    'b': 'c'
                }
            }
        }
        const body = {
            'a': {
                'b': 'd'
            }
        }
        
        callWithBodyAndSession(body, session)
        expect(session.data).toStrictEqual({
            'a': {
                'b': 'd'
            }
        })
    })


    it('should remove stored variables if the request variable is empty', () => {
        const session = {
            data:{
                'a': 'b'
            }
        }
        
        callWithBodyAndSession({a:''}, session)
        expect(session.data).toStrictEqual({})
    })

    it('should remove nested stored variables if the request variable is empty', () => {
        const session = {
            data:{
                'a': {
                    b: {
                        c: {
                            d: 'e',
                            f: 'g'
                        }
                    }
                }
            }
        }
        
        callWithBodyAndSession({
            a: {
                b: {
                    c: {
                        d: ''
                    }
                }
            }
        }, session)
        expect(session.data).toStrictEqual({
            a: {
                b: {
                    c: {
                        f: 'g'
                    }
                }
            }
        })
    })

    it('should remove nested object if the request variable is empty', () => {
        const session = {
            data:{
                a: {
                    b: {
                        c: {
                            d: 'e',
                            f: 'g',
                            h: 'i'
                        }
                    }
                }
            }
        }
        
        callWithBodyAndSession({
            a: {
                b: ''
            }
        }, session)
        expect(session.data).toStrictEqual({})
    })

    it('should remove empty values from objects inside arrays', () => {
        const session = {data:{}}
        
        callWithBodyAndSession({
            a: [{
                d: 'e',
                f: '',
                h: 'i'
            }]
        }, session)
        expect(session.data).toStrictEqual({a: [
            {
                d: 'e',
                h: 'i'
            }
        ]})
    })

    it('should remove empty values from objects inside nested arrays', () => {
        const session = {data:{}}
        
        callWithBodyAndSession({
            a: [
                [
                    [
                        {
                            d: 'e',
                            f: '',
                            h: 'i'
                        }
                    ]
                ]
            ]
        }, session)
        expect(session.data).toStrictEqual({
            a: [
                [
                    [
                        {
                            d: 'e',
                            h: 'i'
                        }
                    ]
                ]
            ]
        })
    })

    it('should remove empty values from objects inside a mix of nested objects and arrays', () => {
        const session = {data:{}}
        
        callWithBodyAndSession({
            a: [
                {b: [
                    {
                        c: [
                            {
                                d: 'e',
                                f: ''
                            }
                        ]
                    }
                ]}
            ]
        }, session)
        expect(session.data).toStrictEqual({
            a: [
                {b: [
                    {
                        c: [
                            {
                                d: 'e'
                            }
                        ]
                    }
                ]}
            ]
        })
    })

    it('should remove empty values from objects inside arrays', () => {
        const session = {data:{
            a: [{
                d: 'e',
                f: 'g',
                h: 'i'
            }]
        }}
        
        callWithBodyAndSession({
            a: [{
                d: 'e',
                f: '',
                h: 'i'
            }]
        }, session)
        expect(session.data).toStrictEqual({a: [
            {
                d: 'e',
                h: 'i'
            }
        ]})
    })

    it('should remove empty values from objects inside nested arrays', () => {
        const session = {data:{
            a: [
                [
                    [
                        {
                            d: 'e',
                            f: 'g',
                            h: 'i'
                        }
                    ]
                ]
            ]
        }}
        
        callWithBodyAndSession({
            a: [
                [
                    [
                        {
                            d: 'e',
                            f: '',
                            h: 'i'
                        }
                    ]
                ]
            ]
        }, session)
        expect(session.data).toStrictEqual({
            a: [
                [
                    [
                        {
                            d: 'e',
                            h: 'i'
                        }
                    ]
                ]
            ]
        })
    })

    it('should remove empty values from objects inside a mix of nested objects and arrays', () => {
        const session = {data:{
            a: [
                {b: [
                    {
                        c: [
                            {
                                d: 'e',
                                f: ''
                            }
                        ]
                    }
                ]}
            ]
        }}
        
        callWithBodyAndSession({
            a: [
                {b: [
                    {
                        c: [
                            {
                                d: 'e',
                                f: ''
                            }
                        ]
                    }
                ]}
            ]
        }, session)
        expect(session.data).toStrictEqual({
            a: [
                {b: [
                    {
                        c: [
                            {
                                d: 'e'
                            }
                        ]
                    }
                ]}
            ]
        })
    })


    function callWithBodyAndSession(body, session) {
        const request = createRequest(body, session)
        const response = createResponse()
        const next = () => {}
        autoStoreData(request, response, next)
    }

    function createRequest(bodyData, existingSession) {
        return {
            body: bodyData || {},
            session: existingSession
        }
    }

    function createResponse() {
        return {
            locals: {}
        }
    }

})