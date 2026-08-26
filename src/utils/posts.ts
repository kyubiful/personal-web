import { getCollection, type CollectionEntry } from 'astro:content'

export interface PostListItem {
  slug: string
  frontmatter: CollectionEntry<'posts'>['data']
  url: string
}

export const POSTS_PER_PAGE = 5

export async function getPostsByLang(
  lang: 'es' | 'en'
): Promise<PostListItem[]> {
  const allPosts = await getCollection('posts')

  return allPosts
    .filter((post) => post.id.split('/')[0] === lang)
    .map((post) => {
      const slug = post.id.split('/')[1]
      const urlLang = post.id.split('/')[0] === 'en' ? '/en' : ''
      const url = `${urlLang}/blog/${slug}`

      return {
        slug,
        frontmatter: post.data,
        url
      }
    })
    .sort(
      (a, b) =>
        b.frontmatter.pubDate.valueOf() - a.frontmatter.pubDate.valueOf()
    )
}

export function getBlogPageUrl(lang: 'es' | 'en', page: number): string {
  const base = lang === 'en' ? '/en/blog' : '/blog'
  return page <= 1 ? base : `${base}/page/${page}`
}

export function getLastPage(totalPosts: number): number {
  return Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE))
}
