const { validSet, validUser, makeHttpRequest } = require('./testApi.js');
const app = require('../app');
const mongoose = require('mongoose');
const Set = require('../models/set');
const User = require('../models/user.js');

afterAll(done => {
    mongoose.connection.close()
    done();
})

describe('/sets GET', () => {
    describe('correct request', () => {
        let response;
        beforeAll(async () => {
            response = await setsRequest();
        })

        const setsRequest = () => {
            return makeHttpRequest(app, {
                method: 'GET',
                endpoint: '/sets',
                isIncludeToken: true
            })
        }

        it('response type should include aplication/json', () => {
            expect(/json/.test(response.headers['content-type']))
        })

        it('response status should be 200', () => {
            expect(response.status).toEqual(200)
        })
    })
    describe('wrong request', () => {
        describe('request with wrong token', () => {
            let response;

            beforeAll(async () => {
                const wrongToken = 'wrongToken';
                response = await setsRequestWithCustomToken(wrongToken);
            })

            const setsRequestWithCustomToken = async (customToken) => {
                return makeHttpRequest(app, {
                    method: 'GET',
                    endpoint: '/sets',
                    customToken: customToken,
                })
            }

            it('response status should be 401', () => {
                expect(response.status).toEqual(401)
            })

            it('response body should contain message', () => {
                expect(response.body.hasOwnProperty('message'))
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('Invalid authorization.');
            })
        })
    })
})

const findOrCreateSet = async () => {
    const userId = await findUser();
    const findedSet = await Set.findOne({ creator: userId });
    if (findedSet) {
        return findedSet;
    } else {
        const newSet = new Set({ ...validSet, creator: userId });
        const createdSet = await newSet.save();
        return createdSet;
    }
}

const findUser = async () => {
    const findedUser = await User.findOne(validUser);
    return findedUser._id;
}

describe('/sets/:setId GET', () => {
    const getSet = (setId) => {
        return makeHttpRequest(app, {
            method: 'GET',
            endpoint: `/sets/${setId}`,
            isIncludeToken: true
        });
    }

    describe('correct request', () => {
        let response;
        beforeAll(async () => {
            const set = await findOrCreateSet();
            const setId = set._id;
            response = await getSet(setId);
        })

        it('response status should be 200', () => {
            expect(response.status).toEqual(200)
        })

        it('response type should include aplication/json', () => {
            expect(/json/.test(response.headers['content-type']))
        })

        it('response body should be a set', () => {
            expect(response.body.hasOwnProperty('_id'))
            expect(response.body.hasOwnProperty('name'))
            expect(response.body.hasOwnProperty('cards'))
            expect(response.body.hasOwnProperty('stats'))
            expect(response.body.hasOwnProperty('creator'))
        })
    })

    describe('wrong request', () => {
        describe('request with wrong setId', () => {
            let response;
            beforeAll(async () => {
                const wrongSetId = 'wrongSetId';
                response = await getSet(wrongSetId);
            })
            it('response status should be 400', () => {
                expect(response.status).toEqual(400)
            })

            it('response type should include aplication/json', () => {
                expect(/json/.test(response.headers['content-type']))
            })

            it('response body should contain message', () => {
                expect(response.body.hasOwnProperty('message'))
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('Invalid request data.');
            })
        })
    })
})

describe('/sets/:setId PUT', () => {
    const putSetRequest = (setId, newSet) => {
        return makeHttpRequest(app, {
            method: 'PUT',
            endpoint: `/sets/${setId}`,
            isIncludeToken: true,
            data: newSet
        });
    }

    describe('correct request', () => {
        beforeAll(async () => {
            const set = await findOrCreateSet();
            const setId = set._id;
            const newSet = { ...validSet, name: 'edited!' };
            response = await putSetRequest(setId, newSet);
        })

        it('response status should be 200', () => {
            expect(response.status).toEqual(200);
        })

        it('response type should contain json', () => {
            expect(/json/.test(response.headers['content-type']));
        });

        it('response body should contain set', () => {
            expect(response.body.hasOwnProperty('_id'));
            expect(response.body.hasOwnProperty('name'));
            expect(response.body.name).toEqual('edited!');
            expect(response.body.hasOwnProperty('cards'));
            expect(response.body.hasOwnProperty('stats'));
            expect(response.body.hasOwnProperty('creator'));
        })
    })
    describe('wrong request', () => {
        describe('request with wrong :setId param', () => {
            beforeAll(async () => {
                const wrongSetId = 'wrongSetId';
                const newSet = { ...validSet, name: 'edited!' };
                response = await putSetRequest(wrongSetId, newSet);
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })

            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });

            it('response body should message', () => {
                expect(response.body.hasOwnProperty('message'));
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('Invalid request data.')
            })
        })
        describe('request with empty data', () => {
            beforeAll(async () => {
                const set = await findOrCreateSet();
                const setId = set._id;
                const newSet = undefined;
                response = await putSetRequest(setId, newSet);
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })

            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });

            it('response body should message', () => {
                expect(response.body.hasOwnProperty('message'));
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('Name is required.')
            })
        })
        describe('request with empty name', () => {
            beforeAll(async () => {
                const set = await findOrCreateSet();
                const setId = set._id;
                const newSet = { ...validSet, name: undefined };
                response = await putSetRequest(setId, newSet);
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })

            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });

            it('response body should message', () => {
                expect(response.body.hasOwnProperty('message'));
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('Name is required.')
            })
        })

        describe('request with empty cards', () => {
            beforeAll(async () => {
                const set = await findOrCreateSet();
                const setId = set._id;
                const newSet = { ...validSet, cards: undefined };
                response = await putSetRequest(setId, newSet);
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })

            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });

            it('response body should message', () => {
                expect(response.body.hasOwnProperty('message'));
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('Cards is required.')
            })
        })

        describe('request with empty stats', () => {
            beforeAll(async () => {
                const set = await findOrCreateSet();
                const setId = set._id;
                const newSet = { ...validSet, stats: undefined };
                response = await putSetRequest(setId, newSet);
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })

            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });

            it('response body should message', () => {
                expect(response.body.hasOwnProperty('message'));
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('Stats is required.')
            })
        })
    })
})

describe('/sets/:setId DELETE', () => {
    const deleteSet = (setId) => {
        return makeHttpRequest(app, {
            method: 'DELETE',
            endpoint: `/sets/${setId}`,
            isIncludeToken: true
        });
    }

    describe('correct request', () => {
        let response;
        beforeAll(async () => {
            const createdSet = await createSet();
            const createdSetId = createdSet._id;
            response = await deleteSet(createdSetId);
        })

        const createSet = async () => {
            const newSet = new Set(validSet);
            const addedSet = await newSet.save();
            return addedSet;
        }

        it('response body should be empty object', () => {
            expect(response.body).toEqual({});
        })

        it('response status should be 200', () => {
            expect(response.status).toEqual(200)
        })

        it('response type should contain json', () => {
            expect(/json/.test(response.headers['content-type']))
        });
    })

    describe('wrong request', () => {
        describe('request with wrong :setId param', () => {
            let response;
            beforeAll(async () => {
                const wrongSetId = '3213213wrongparam123123';
                response = await deleteSet(wrongSetId);
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })

            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });

            it('response body should contain message', () => {
                expect(response.body.hasOwnProperty('message'))
            })

            it('message should be correct', () => {
                expect(response.body.message).toEqual('Invalid request data.');
            })
        })
    })
})



describe('/sets/:setId POST', () => {
    const createSetRequest = (set) => {
        return makeHttpRequest(app, {
            method: 'POST',
            endpoint: '/sets',
            isIncludeToken: true,
            data: set
        })
    }

    describe('correct request', () => {
        let response;
        beforeAll(async () => {
            response = await createSetRequest(validSet);
        })

        it('response status should be 201', () => {
            expect(response.status).toEqual(201);
        })

        it('response type should contain json', () => {
            expect(/json/.test(response.headers['content-type']));
        });

        it('response body should set', () => {
            expect(response.body.hasOwnProperty('_id'))
            expect(response.body.hasOwnProperty('name'))
            expect(response.body.hasOwnProperty('cards'))
            expect(response.body.hasOwnProperty('stats'))
            expect(response.body.hasOwnProperty('creator'))
        })
    })

    describe('wrong request', () => {
        describe('request with empty name', () => {
            let response;
            beforeAll(async () => {
                response = await createSetRequest({...validSet, name: undefined});
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })
    
            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });
    
            it('response body should contain message', () => {
                expect(response.body.hasOwnProperty('message'))
            })

            it('message should be correct', () => {
                const message = response.body.message
                expect(message).toEqual('Name is required.')
            })
        })
        describe('request with empty cards', () => {
            let response;
            beforeAll(async () => {
                response = await createSetRequest({...validSet, cards: undefined});
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })
    
            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });
    
            it('response body should contain message', () => {
                expect(response.body.hasOwnProperty('message'))
            })

            it('message should be correct', () => {
                const message = response.body.message
                expect(message).toEqual('Cards is required.')
            })
        })
        describe('request with empty stats', () => {
            let response;
            beforeAll(async () => {
                response = await createSetRequest({...validSet, stats: undefined});
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })
    
            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });
    
            it('response body should contain message', () => {
                expect(response.body.hasOwnProperty('message'))
            })

            it('message should be correct', () => {
                const message = response.body.message
                expect(message).toEqual('Stats is required.')
            })
        })

        describe ('request with too short name', () => {
            let response;
            beforeAll(async () => {
                response = await createSetRequest({...validSet, name: 'nl'});
            })

            it('response status should be 400', () => {
                expect(response.status).toEqual(400);
            })
    
            it('response type should contain json', () => {
                expect(/json/.test(response.headers['content-type']));
            });
    
            it('response body should contain message', () => {
                expect(response.body.hasOwnProperty('message'))
            })

            it('message should be correct', () => {
                const message = response.body.message
                expect(message).toEqual('Name is too short.')
            })
        })
    })
})