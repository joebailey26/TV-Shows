import faunadb from 'faunadb'
require('dotenv').config()

const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.FAUNA_KEY
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
        return {
          statusCode: 200,
          body: JSON.stringify(ret)
        }
      })
    }).catch((error) => {
      return {
        statusCode: 400,
        body: JSON.stringify(error)
      }
    })
}