import rss from '@astrojs/rss'
import { getPostsByLang } from '@/utils/posts'

export async function GET(context) {
  const posts = await getPostsByLang('es')

  return rss({
    title: 'Sergio Zabala Muñoz - Blog',
    description:
      'Artículos sobre inteligencia artificial, agentes de IA, arquitectura de software y herramientas de desarrollo.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      pubDate: post.frontmatter.pubDate,
      link: post.url
    }))
  })
}
