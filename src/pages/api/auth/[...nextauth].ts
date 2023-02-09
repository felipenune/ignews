import NextAuth, { User } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { query } from 'faunadb'
import { fauna } from '../../../services/fauna'

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const { email } = user as User

      try {
        await fauna.query(
          query.If(
            query.Not(
              query.Exists(
                query.Match(
                  query.Index('user_by_email'),
                  query.Casefold(email ?? '')
                )
              )
            ),
            query.Create(
              query.Collection('users'),
              { data: { email }}
            ),
            query.Get(
              query.Match(
                query.Index('user_by_email'),
                query.Casefold(email ?? '')
              )
            )
          )
        )

        return true
      } catch {
        return false
      }
    }
  }
})