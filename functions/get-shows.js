import faunadb from 'faunadb'

const q = faunadb.query
const client = new faunadb.Client({
  secret: "fnADrPreonACADjIEB2zhXSrrpPn21v42vikxIH2"
})

exports.handler = (event, context, callback) => {
  return client.query(q.Paginate(q.Match(q.Ref('indexes/tv-shows'))))
    .then((response) => {
      const showRefs = response.data
      // create new query
      const getAllShowsDataQuery = showRefs.map((ref) => {
        return q.Get(ref)
      })
      // then query the refs
      return client.query(getAllShowsDataQuery).then((ret) => {
        return callback(null, {
          statusCode: 200,
          body: JSON.stringify(ret)
        })
      })
    }).catch((error) => {
      return callback(null, {
        statusCode: 400,
        body: JSON.stringify(error)
      })
    })
}