import faunadb from 'faunadb'
import getId from './utils/getId'
require('dotenv').config()

const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.FAUNA_KEY
})

exports.handler = (event, context, callback) => {
  const id = getId(event.path)
  return client.query(q.Delete(q.Ref(`classes/tv-shows/${id}`)))
  .then((response) => {
    return {
      statusCode: 200,
      body: JSON.stringify(response)
    }
  }).catch((error) => {
    return {
      statusCode: 400,
      body: JSON.stringify(error)
    }
  })
}