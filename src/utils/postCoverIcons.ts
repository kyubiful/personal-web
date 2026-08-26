import Python from '@/components/icons/topics/Python.astro'
import JavaScript from '@/components/icons/topics/JavaScript.astro'
import TypeScript from '@/components/icons/topics/TypeScript.astro'
import NodeJs from '@/components/icons/topics/NodeJs.astro'
import Bun from '@/components/icons/topics/Bun.astro'
import Git from '@/components/icons/topics/Git.astro'
import NetworkNodes from '@/components/icons/topics/NetworkNodes.astro'
import Wrench from '@/components/icons/topics/Wrench.astro'
import Plug from '@/components/icons/topics/Plug.astro'
import OpenLock from '@/components/icons/topics/OpenLock.astro'
import CurlyBraces from '@/components/icons/topics/CurlyBraces.astro'
import LayeredStack from '@/components/icons/topics/LayeredStack.astro'
import ShieldCheck from '@/components/icons/topics/ShieldCheck.astro'
import TerminalPrompt from '@/components/icons/topics/TerminalPrompt.astro'
import GenericFile from '@/components/icons/topics/GenericFile.astro'

/** Tailwind classes shared by every "generic" (non-branded) topic icon. */
const ACCENT = 'text-accent-light dark:text-accent-dark'

export interface PostCoverIcon {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: any
  label: string
  /** Tailwind class(es) setting the icon color, e.g. 'text-[#3776AB]' or 'text-accent-light dark:text-accent-dark'. */
  colorClass: string
  /** When set, renders a solid chip behind the icon in this Tailwind bg class (needed for logos
   * whose path is a filled shape with the lettering cut out as holes, e.g. JavaScript/TypeScript). */
  chipClass?: string
}

/**
 * One entry per post tag (lowercased, letters/digits only - see `normalizeTag`).
 * To change how a topic looks: edit the icon file it points to (shape) or the
 * colorClass/chipClass here (color). To add a new topic, add an icon file under
 * `src/components/icons/topics/` and register it here.
 */
export const POST_COVER_ICONS: Record<string, PostCoverIcon> = {
  python: { Icon: Python, label: 'Python', colorClass: 'text-[#3776AB]' },
  javascript: {
    Icon: JavaScript,
    label: 'JavaScript',
    colorClass: 'text-[#F7DF1E]',
    chipClass: 'bg-black'
  },
  typescript: {
    Icon: TypeScript,
    label: 'TypeScript',
    colorClass: 'text-[#3178C6]',
    chipClass: 'bg-white'
  },
  nodejs: { Icon: NodeJs, label: 'Node.js', colorClass: 'text-[#339933]' },
  bun: { Icon: Bun, label: 'Bun', colorClass: 'text-black dark:text-[#FBF0DF]' },
  git: { Icon: Git, label: 'Git', colorClass: 'text-[#F05032]' },
  ai: { Icon: NetworkNodes, label: 'AI', colorClass: ACCENT },
  llm: { Icon: NetworkNodes, label: 'LLM', colorClass: ACCENT },
  mcp: { Icon: Plug, label: 'MCP', colorClass: ACCENT },
  opensource: { Icon: OpenLock, label: 'Open Source', colorClass: ACCENT },
  developertools: { Icon: Wrench, label: 'Developer Tools', colorClass: ACCENT },
  tooling: { Icon: Wrench, label: 'Tooling', colorClass: ACCENT },
  ecmascript: { Icon: CurlyBraces, label: 'ECMAScript', colorClass: ACCENT },
  softwarearchitecture: { Icon: LayeredStack, label: 'Software Architecture', colorClass: ACCENT },
  bestpractices: { Icon: ShieldCheck, label: 'Best Practices', colorClass: ACCENT },
  softwaredevelopment: { Icon: TerminalPrompt, label: 'Software Development', colorClass: ACCENT }
}

export const OTHERS_COVER_ICON: PostCoverIcon = {
  Icon: GenericFile,
  label: 'Others',
  colorClass: ACCENT
}

function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Picks the cover icon for a post from its tags, using the first tag as the primary one. */
export function getPostCoverIcon(tags: string[]): PostCoverIcon {
  const primary = tags[0]
  if (!primary) return OTHERS_COVER_ICON
  return POST_COVER_ICONS[normalizeTag(primary)] ?? OTHERS_COVER_ICON
}
