import { withQuery } from 'ufo'
import { defineHooks } from '../plugin'

export default async function () {
  return defineHooks([
    {
      name: 'posts',
      handler: async (params) => {
        const page = params?._page ?? 1
        const limit = params?._limit ?? 5
        const url = withQuery('https://jsonplaceholder.typicode.com/posts', {
          _page: page,
          _limit: limit,
        })
        const res = await fetch(url)
        return res.json()
      },
    },
    {
      name: 'post',
      handler: async (id) => {
        const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)
        return res.json()
      },
    },
    {
      name: 'profile',
      handler: async () => {
        const res = await fetch('https://jsonplaceholder.typicode.com/users/1')
        return res.json()
      },
    },
  ])
}
