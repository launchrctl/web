import '@testing-library/jest-dom'
import { useList } from '@refinedev/core'
import { render } from '@testing-library/react'
import { FlowShow } from './Show'

// Mocking useList from @refinedev/core
jest.mock('@refinedev/core', () => ({
  useList: jest.fn(),
}))

jest.mock('lodash/debounce', () => ({
  default: jest.fn((fn) => {
    const debouncedFn = () => fn()
    debouncedFn.cancel = jest.fn()
    return debouncedFn
  }),
  __esModule: true,
}))

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe('FlowShow', () => {
  test('should render with mocked useList data', () => {
    // Define your mock data
    const mockData = {
      data: {
        data: [
          { id: 'test:deploy', title: 'Deploy' },
          { id: 'test.subtest:build', title: 'Build' },
        ],
      },
    }

    // Mock the return value of useList
    ;(useList as jest.Mock).mockReturnValue(mockData)

    // Render the component
    render(<FlowShow />)

    // Now you can write assertions based on your component's UI and the mock data
    // expect(screen.getByText('Action 1')).toBeInTheDocument();
    // expect(screen.getByText('Action 2')).toBeInTheDocument();
  })
})
