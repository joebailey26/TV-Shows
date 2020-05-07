import faunadb from 'faunadb'
import getId from './utils/getId'

const q = faunadb.query
const client = new faunadb.Client({
  secret: "fnADrPreonACADjIEB2zhXSrrpPn21v42vikxIH2"
})

exports.handler = (event, context, callback) => {
  const id = getId(event.path)
  return client.query(q.Delete(q.Ref(`classes/tv-shows/${id}`)))
  .then((response) => {
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify(response)
    })
  }).catch((error) => {
    return callback(null, {
      statusCode: 400,
      body: JSON.stringify(error)
    })
  })
}