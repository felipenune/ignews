import { asText } from '@prismicio/helpers'
import { getPrismicClient } from '@/services/prismic'
import Head from 'next/head'
import { GetStaticProps } from 'next/types'
import styles from './styles.module.scss'

type Post = {
  uid: string,
  title: string,
  summary: string,
  updatedAt: string
}

interface PostsProps {
  posts: Post[]
}

export default function Posts({ posts }: PostsProps) {
  return(
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          { posts.map(post => (
            <a key={post.uid} href='#'>
              <time>{post.updatedAt}</time>
              <strong>{post.title}</strong>
              <p>{post.summary}</p>
            </a>
          ))}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient()

  const response = await prismic.getByType('post', { accessToken: process.env.PRISMIC_ACCESS_TOEKN})

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      title: asText(post.data.title),
      summary: post.data.content.find((content: { type: string }) => content.type === 'paragraph')?.text ?? '',
      updatedAt: new Date(post.last_publication_date).toLocaleDateString('pr-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }
  })

  return {
    props: {
      posts
    }
  }
}