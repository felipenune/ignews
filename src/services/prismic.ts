import * as prismic from '@prismicio/client'

export function getPrismicClient() {
  const repoName = 'ignews-Next-app'
  const endpoint = prismic.getRepositoryEndpoint(repoName)
  const accessToken = process.env.PRISMIC_ACCESS_TOEKN as string
  const client = prismic.createClient('https://ignews-felipe-ignite.cdn.prismic.io/api/v2', { accessToken })

  return client
}