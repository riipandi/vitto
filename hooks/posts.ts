import { withQuery } from 'ufo'
import { defineHooks } from '../plugin'

export default defineHooks('posts', async (params) => {
  // If id or slug is provided, fetch single post
  if (params?.id || params?.slug) {
    const postId = params.id || params.slug
    const url = `https://jsonplaceholder.typicode.com/posts/${postId}`

    const res = await fetch(url)
    if (!res.ok) {
      return null
    }

    return res.json()
  }

  // Otherwise, fetch list of posts
  const url = withQuery('https://jsonplaceholder.typicode.com/posts', {
    _page: params?._page ?? 1,
    _limit: params?._limit ?? 10,
  })

  const res = await fetch(url)
  const data = await res.json()

  return data
})
