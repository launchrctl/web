import type { DataProvider } from '@refinedev/core'
import type { AxiosInstance } from 'axios'
import queryString from 'query-string'

import { axiosInstance, generateFilter, generateSort } from './utils'

type MethodTypes = 'get' | 'delete' | 'head' | 'options'
type MethodTypesWithBody = 'post' | 'put' | 'patch'

export const dataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance
): Omit<
  Required<DataProvider>,
  'createMany' | 'updateMany' | 'deleteMany'
> => ({
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const url = `${apiUrl}/${resource}`

    const { current = 1, pageSize = 10, mode = 'server' } = pagination ?? {}

    const { headers: headersFromMeta, method } = meta ?? {}
    const requestMethod = (method as MethodTypes) ?? 'get'

    const queryFilters = generateFilter(filters)

    const query: {
      _start?: number
      _end?: number
      _sort?: string
      _order?: string
    } = {}

    if (mode === 'server') {
      query._start = (current - 1) * pageSize
      query._end = current * pageSize
    }

    const generatedSort = generateSort(sorters)

    if (generatedSort) {
      const { _sort, _order } = generatedSort
      query._sort = _sort.join(',')
      query._order = _order.join(',')
    }

    const combinedQuery = { ...query, ...queryFilters }
    const urlWithQuery =
      Object.keys(combinedQuery).length > 0
        ? `${url}?${queryString.stringify(combinedQuery)}`
        : url

    const { data, headers } = await httpClient[requestMethod](urlWithQuery, {
      headers: headersFromMeta,
    })

    const total = Number(headers['x-total-count'])

    return {
      data,
      total: total ?? data.length,
    }
  },

  getMany: async ({ resource, ids, meta }) => {
    const { headers, method } = meta ?? {}
    const requestMethod = (method as MethodTypes) ?? 'get'

    const { data } = await httpClient[requestMethod](
      `${apiUrl}/${resource}?${queryString.stringify({ id: ids })}`,
      { headers }
    )

    return {
      data,
    }
  },

  create: async ({ resource, variables, meta }) => {
    const url = `${apiUrl}/${resource}`

    const { headers, method } = meta ?? {}
    const requestMethod = (method as MethodTypesWithBody) ?? 'post'

    const { data } = await httpClient[requestMethod](url, variables, {
      headers,
    })

    return {
      data,
    }
  },

  update: async ({ resource, id, variables, meta }) => {
    const url = `${apiUrl}/${resource}/${id}`

    const { headers, method } = meta ?? {}
    const requestMethod = (method as MethodTypesWithBody) ?? 'patch'

    const { data } = await httpClient[requestMethod](url, variables, {
      headers,
    })

    return {
      data,
    }
  },

  getOne: async ({ resource, id, meta }) => {
    const url = `${apiUrl}/${resource}/${id}`

    const { headers, method } = meta ?? {}
    const requestMethod = (method as MethodTypes) ?? 'get'

    const { data } = await httpClient[requestMethod](url, { headers })

    return {
      data,
    }
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const url = `${apiUrl}/${resource}/${id}`

    const { headers, method } = meta ?? {}
    const requestMethod = (method as MethodTypesWithBody) ?? 'delete'

    const { data } = await httpClient[requestMethod](url, {
      data: variables,
      headers,
    })

    return {
      data,
    }
  },

  getApiUrl: () => apiUrl,

  custom: async ({
    url,
    method,
    filters,
    sorters,
    payload,
    query,
    headers,
  }) => {
    let requestUrl = `${url}?`

    if (sorters) {
      const generatedSort = generateSort(sorters)

      if (generatedSort) {
        const { _sort, _order } = generatedSort
        const sortQuery = {
          _sort: _sort.join(','),
          _order: _order.join(','),
        }
        requestUrl = `${requestUrl}&${queryString.stringify(sortQuery)}`
      }
    }

    if (filters) {
      const filterQuery = generateFilter(filters)
      requestUrl = `${requestUrl}&${queryString.stringify(filterQuery)}`
    }

    if (query) {
      requestUrl = `${requestUrl}&${queryString.stringify(query)}`
    }

    let axiosResponse

    switch (method) {
      case 'put':
      case 'post':
      case 'patch': {
        axiosResponse = await httpClient[method](url, payload, {
          headers,
        })
        break
      }
      case 'delete': {
        axiosResponse = await httpClient.delete(url, {
          data: payload,
          headers,
        })
        break
      }
      default: {
        axiosResponse = await httpClient.get(requestUrl, {
          headers,
        })
        break
      }
    }

    const { data } = axiosResponse

    return { data }
  },
})
