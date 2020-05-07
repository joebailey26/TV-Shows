import faunadb from 'faunadb'

/* configure faunaDB Client with our secret */
const q = faunadb.query
const client = new faunadb.Client({
  secret: "fnADrPreonACADjIEB2zhXSrrpPn21v42vikxIH2"
})

/* export our lambda function as named "handler" export */
exports.handler = (event, context, callback) => {
  /* parse the string body into a useable JS object */
  const data = JSON.parse(event.body)
  const item = {
    data: data
  }
  /* construct the fauna query */
  return client.query(q.Create(q.Ref("classes/tv-shows"), item))
  .then((response) => {
    /* Success! return the response with statusCode 200 */
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify("Added successfully")
    })
  }).catch((error) => {
    /* Error! return the error with statusCode 400 */
    return callback(null, {
      statusCode: 400,
      body: JSON.stringify(error)
    })
  })
}