export default eventHandler(async () => {
  await runTask('sync:shows')

  return 'success'
})
