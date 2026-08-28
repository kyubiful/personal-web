import rss from '@astrojs/rss'
import { getPostsByLang } from '@/utils/posts'

export async function GET(context) {
  const posts = await getPostsByLang('en')

  return rss({
    title: 'Sergio Zabala Muñoz - Blog',
    description:
      'Articles about artificial intelligence, AI agents, software architecture and developer tools.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      pubDate: post.frontmatter.pubDate,
      link: post.url
    }))
  })
}
