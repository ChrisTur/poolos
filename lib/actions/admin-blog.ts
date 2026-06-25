"use server"

import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base
  let i = 1
  while (true) {
    const existing = await db.blogPost.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) break
    slug = `${base}-${i++}`
  }
  return slug
}

function blogData(formData: FormData) {
  return {
    title:       ((formData.get("title")      as string) ?? "").trim(),
    excerpt:     ((formData.get("excerpt")    as string) ?? "").trim() || null,
    content:     ((formData.get("content")    as string) ?? "").trim(),
    coverImage:  ((formData.get("coverImage") as string) ?? "").trim() || null,
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
  }
}

export async function createBlogPost(formData: FormData) {
  await requireSuperAdmin()

  const data = blogData(formData)
  const rawSlug = ((formData.get("slug") as string) ?? "").trim()
  const slug = await uniqueSlug(rawSlug || slugify(data.title))

  await db.blogPost.create({
    data: {
      ...data,
      slug,
      publishedAt: data.isPublished ? new Date() : null,
    },
  })

  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  redirect("/admin/blog")
}

export async function updateBlogPost(id: string, formData: FormData) {
  await requireSuperAdmin()

  const data = blogData(formData)
  const rawSlug = ((formData.get("slug") as string) ?? "").trim()
  const slug = await uniqueSlug(rawSlug || slugify(data.title), id)

  const existing = await db.blogPost.findUnique({ where: { id }, select: { isPublished: true, publishedAt: true } })

  await db.blogPost.update({
    where: { id },
    data: {
      ...data,
      slug,
      publishedAt:
        data.isPublished && !existing?.isPublished
          ? new Date()
          : !data.isPublished
          ? null
          : existing?.publishedAt,
    },
  })

  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)
  redirect("/admin/blog")
}

export async function deleteBlogPost(formData: FormData) {
  await requireSuperAdmin()
  const id = formData.get("id") as string
  await db.blogPost.delete({ where: { id } })
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
}

export async function togglePublished(formData: FormData) {
  await requireSuperAdmin()
  const id = formData.get("id") as string
  const post = await db.blogPost.findUnique({ where: { id }, select: { isPublished: true } })
  if (!post) return

  const nowPublished = !post.isPublished
  await db.blogPost.update({
    where: { id },
    data: {
      isPublished: nowPublished,
      publishedAt: nowPublished ? new Date() : null,
    },
  })
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
}
