const { httpPostByAppWithOptions } = require('./testApi.js');
const app = require('../app.js');
const mongoose = require('mongoose');

afterAll(done => {
    mongoose.connection.close()
    done()
})

const loginRequest = (userData) => {
    return httpPostByAppWithOptions(app, {
        endpoint: '/login',
        data: userData,
    });
}

describe('/login POST', () => {
    describe('correct request', () => {
        let response;
        beforeAll(async () => {
            response = await loginRequest({
                username: 'admin',
                password: 'password'
            })
        })
        it('response type should contain json', () => {
            expect(/json/.test(response.headers['content-type']))
        })
        it('response body should contain tokenData', () => {
            expect(response.body.hasOwnProperty('refreshToken'));
            expect(response.body.hasOwnProperty('refreshTokenExpiresIn'));
            expect(response.body.hasOwnProperty('accessToken'));
            expect(response.body.hasOwnProperty('accessTokenExpiresIn'));
        })
        it('response status should be 200', () => {
            expect(response.status).toEqual(200);
        })

        it('should add refresh token cookie', () => {
            const cookies = response.headers['set-cookie'][0].split('; ');

            expect(cookies[0].includes('refreshToken'));
        })
    })

    describe('invalid request', () => {
        describe('request with empty username', () => {
            let response;
            const userData = {
                password: 'password'
            }

            beforeAll(async () => {
                response = await loginRequest(userData)
            })
            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']))
            })
            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })
            it('should contain message', () => {
                expect(response.body.hasOwnProperty('message'))
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('User does not exist.');
            })
        })

        describe('request with empty password', () => {
            let response;
            const userData = {
                username: 'username'
            }
            beforeAll(async () => {
                response = await loginRequest(userData)
            })
            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']))
            })
            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })
            it('should contain message', () => {
                expect(response.body.hasOwnProperty('message')).toEqual(true);
            })
            it('message should be correct"', () => {
                expect(response.body.message).toEqual('User does not exist.');
            })
        })

        describe("request with invalid username", () => {
            let response;
            const userData = {
                username: '',
                password: 'password'
            }

            beforeAll(async () => {
                response = await loginRequest(userData)
            })
            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']))
            })
            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })
            it('should contain message', () => {
                expect(response.body.hasOwnProperty('message')).toEqual(true);
            })
            it('message should be correct', () => {
                expect(response.body.message).toEqual('User does not exist.')
            })
        })

        describe('request with invalid password', () => {
            let response;
            const userData = {
                username: 'username',
                password: ''
            }

            beforeAll(async () => {
                response = await loginRequest(userData)
            })
            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']))
            })
            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })
            it('should contain message', () => {
                expect(response.body.hasOwnProperty('message')).toEqual(true);
            })
            it('message should be correct', () => {
                expect(response.body.message).toEqual('User does not exist.')
            })
        })
    })
})