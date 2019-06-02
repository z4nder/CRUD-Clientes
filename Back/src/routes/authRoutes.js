const joi = require('joi');
const boom = require('boom');
const jwt = require('jsonwebtoken');

const PasswordHelper = require('../helpers/passwordHelper');
const UserCrud = require('../db/mongodb/CRUD/userCrud');

const failAction = (request, headers, erro) => {
    throw erro;
};
const USER = {
    username: 'xuxadasilva',
    password: 'gustavo@123',
}

const headers = joi.object({
    authorization: joi.string().required(),
}).unknown();

module.exports = {

    login() {
        return {
            path: '/login',
            method: 'POST',
            config: {
                // Não precisa de token pois ele gera o token
                auth: false,
                tags: ['api'],
                description: 'Obter Token',
                notes: 'Faz login com user e senha do banco',
                validate: {
                    failAction,
                    payload: {
                        username: joi.string().required(),
                        password: joi.string().required(),
                        email: joi.string().required(),
                    }
                }
            },
            handler: async (request) => {
                const {
                    username,
                    password,
                } = request.payload;

                const [user] = await UserCrud.read({
                    username: username
                })


                if (!user) {
                    return boom.unauthorized('O Usuario informado não existe');
                }

                const match = await PasswordHelper.comparePassword(password, user.password)
                console.log('User ', match)
                if (!match) {
                    return boom.unauthorized('O Usuario ou a Senha invalido');
                }

                const token = jwt.sign({
                    username: user.username,
                    id: user._id
                }, process.env.JWT_SECRET)
                return {
                    token
                }

            }

        }
    },

    cadastrar() {
        return {
            path: '/cadastrar',
            method: 'POST',
            config: {
                // Não precisa de token pois ele cadastra
                auth: false,
                tags: ['api'],
                description: 'Cadastro no banco',
                notes: 'Faz o cadastro com os dados informados',
                validate: {
                    failAction,
                    payload: {
                        username: joi.string().required().min(3).max(100),
                        password: joi.string().required().min(3).max(100),
                        email: joi.string().required().min(3).max(100),
                    }
                }
            },
            handler: async (request) => {
                try {
                    const {
                        username,
                        password,
                        email
                    } = request.payload;
                    const result = await UserCrud.create({
                        username,
                        password,
                        email,
                    });
                  
                    return {
                        message: 'Usuario cadastrado com sucesso!',
                        _id: result._id
                    };
                } catch (error) {
                  
                    return boom.internal();
                }

            }
        }
    }
}