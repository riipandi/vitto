import { defineHooks } from '../plugin'

export default defineHooks('post', async (params) => {
  // Get post ID from params (could be from URL like /post?id=1 or /post/1)
  const postId = params?.id || params?.slug || '1'

  const url = `https://jsonplaceholder.typicode.com/posts/${postId}`
  const res = await fetch(url)

  // Handle 404 if post not found
  if (!res.ok) {
    return null
  }

  const data = await res.json()

  return data
})
