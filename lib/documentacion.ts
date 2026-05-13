// lib/docs.ts

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

export async function getDocContent(filePath: string) {
  const fullPath = path.join(process.cwd(), 'documentacion', filePath)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  const { content } = matter(fileContents)

  const processed = await remark().use(html).process(content)

  return processed.toString()
}