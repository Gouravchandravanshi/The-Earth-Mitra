import { configureStore, createSlice } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
const apiOrigin = typeof window === 'undefined' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.hostname}:5000`
export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || `${apiOrigin}/api`, credentials: 'include' }),
  endpoints: b => ({
    list: b.query({ query: p => p }),
    send: b.mutation({ query: ({ url, method = 'POST', body }) => ({ url, method, body }) }),
  }),
})
export const { useListQuery, useSendMutation } = api
const auth = createSlice({ name: 'auth', initialState: { user: null }, reducers: { setUser: (s, a) => { s.user = a.payload } } })
export const { setUser } = auth.actions
export const store = configureStore({ reducer: { [api.reducerPath]: api.reducer, auth: auth.reducer }, middleware: g => g().concat(api.middleware) })
