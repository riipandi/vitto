import { withQuery } from 'ufo'
import { defineHooks } from '../plugin'

export default defineHooks('posts', async (params) => {
  const url = withQuery('https://jsonplaceholder.typicode.com/posts', {
    _page: params?._page ?? 1,
    _limit: params?._limit ?? 10, // Get all posts for build
  })

  const res = await fetch(url)
  const data = await res.json()

  return data
})
