import { configureStore, createSlice } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', credentials: 'include' }),
  endpoints: b => ({
    list: b.query({ query: p => p }),
    send: b.mutation({ query: ({ url, method = 'POST', body }) => ({ url, method, body }) }),
  }),
})
export const { useListQuery, useSendMutation } = api
const auth = createSlice({ name: 'auth', initialState: { user: null }, reducers: { setUser: (s, a) => { s.user = a.payload } } })
export const { setUser } = auth.actions
export const store = configureStore({ reducer: { [api.reducerPath]: api.reducer, auth: auth.reducer }, middleware: g => g().concat(api.middleware) })
